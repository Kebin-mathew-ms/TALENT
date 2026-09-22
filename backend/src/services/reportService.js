const prisma = require('../config/db');
const { PDFService } = require('./pdfService');
const archiverModule = require('archiver');
const fs = require('fs');
const path = require('path');

const createZipArchiveStream = (options = { zlib: { level: 9 } }) => {
  if (typeof archiverModule === 'function') {
    return archiverModule('zip', options);
  }
  if (archiverModule.ZipArchive) {
    return new archiverModule.ZipArchive(options);
  }
  if (archiverModule.default && typeof archiverModule.default === 'function') {
    return archiverModule.default('zip', options);
  }
  throw new Error('Unsupported archiver module format');
};

class ReportService {
  /**
   * Generate or regenerate candidate assessment report
   */
  static async generateReport(sessionId) {
    const sId = parseInt(sessionId, 10);

    const session = await prisma.assessmentSession.findUnique({
      where: { id: sId },
      include: {
        assessment: { include: { creator: true } },
        candidate: true,
        submissions: {
          include: {
            question: true,
            aiEvaluation: true,
            codeExecution: true
          },
          orderBy: { createdAt: 'desc' }
        },
        proctoringIncidents: true,
        feedback: true
      }
    });

    if (!session) {
      throw new Error(`Assessment session ${sessionId} not found`);
    }

    // Atomic race-condition safe report creation/update
    let reportRecord = await prisma.report.findUnique({ where: { sessionId: sId } });
    if (!reportRecord) {
      try {
        reportRecord = await prisma.report.create({
          data: {
            sessionId: sId,
            assessmentId: session.assessmentId,
            candidateId: session.candidateId,
            status: 'GENERATING'
          }
        });
      } catch (e) {
        reportRecord = await prisma.report.findUnique({ where: { sessionId: sId } });
      }
    } else {
      await prisma.report.update({
        where: { sessionId: sId },
        data: { status: 'GENERATING' }
      }).catch(() => {});
    }

    try {
      // Calculate scores
      const latestSubmission = session.submissions[0];
      const aiEval = latestSubmission?.aiEvaluation;
      const feedback = session.feedback;

      let overallScore = 80; // Default baseline
      if (aiEval && feedback) {
        overallScore = Math.round((aiEval.overallScore * 0.6) + (feedback.overallPerformance * 0.4));
      } else if (aiEval) {
        overallScore = Math.round(aiEval.overallScore);
      } else if (feedback) {
        overallScore = Math.round(feedback.overallPerformance);
      }

      // Generate Server-Side PDF
      const pdfResult = await PDFService.generateCandidateReportPDF({
        candidate: session.candidate,
        assessment: session.assessment,
        session,
        aiEvaluation: aiEval,
        feedback,
        proctoringIncidents: session.proctoringIncidents
      });

      const summaryText = `Candidate ${session.candidate?.name} scored ${overallScore}/100 in ${session.assessment?.title}. ` +
        `Completed ${session.submissions.length} submission(s) with ${session.proctoringIncidents.length} proctoring flag(s).`;

      const updatedReport = await prisma.report.update({
        where: { sessionId: sId },
        data: {
          assessmentId: session.assessmentId,
          candidateId: session.candidateId,
          overallScore,
          summary: summaryText,
          status: 'COMPLETED',
          filePath: pdfResult.filePath,
          fileName: pdfResult.fileName,
          generatedAt: new Date()
        }
      });

      // Emit socket event to assessment room
      const io = global.io;
      if (io && session.assessmentId) {
        io.to(`assessment_${session.assessmentId}`).emit('report:ready', {
          reportId: updatedReport.id,
          sessionId: sId,
          candidateId: session.candidateId,
          overallScore
        });
      }

      return updatedReport;
    } catch (error) {
      console.error(`Report generation failed for session ${sessionId}:`, error);

      await prisma.report.update({
        where: { sessionId: sId },
        data: { status: 'FAILED' }
      }).catch(() => {});

      throw error;
    }
  }

  /**
   * Get paginated reports with search, filters, and role-based access control
   */
  static async getReports({ page = 1, limit = 10, search = '', status = '', assessmentId = null, candidateId = null, userId, userRole }) {
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const whereClause = {};

    // Role-based Access Control Guard
    if (userRole === 'CANDIDATE') {
      whereClause.candidateId = userId;
    } else if (candidateId) {
      whereClause.candidateId = parseInt(candidateId, 10);
    }

    if (assessmentId) {
      whereClause.OR = [
        { assessmentId: parseInt(assessmentId, 10) },
        { session: { assessmentId: parseInt(assessmentId, 10) } }
      ];
    }

    if (status) {
      whereClause.status = status;
    }

    // Interviewer Ownership Filter
    if (userRole === 'INTERVIEWER') {
      whereClause.session = {
        assessment: { createdBy: userId }
      };
    }

    // Search filter across Candidate Name / Email / Assessment Title
    if (search) {
      const searchConditions = [
        { session: { candidate: { name: { contains: search } } } },
        { session: { candidate: { email: { contains: search } } } },
        { session: { assessment: { title: { contains: search } } } }
      ];
      if (whereClause.OR) {
        whereClause.AND = [
          { OR: whereClause.OR },
          { OR: searchConditions }
        ];
        delete whereClause.OR;
      } else {
        whereClause.OR = searchConditions;
      }
    }

    // Auto-sync / generate reports for candidate sessions that have submissions or completed status but no report yet
    try {
      const sessionsNeedingReports = await prisma.assessmentSession.findMany({
        where: {
          report: null,
          OR: [
            { status: { in: ['SUBMITTED', 'COMPLETED'] } },
            { submissions: { some: {} } }
          ],
          ...(userRole === 'INTERVIEWER' && { assessment: { createdBy: userId } }),
          ...(userRole === 'CANDIDATE' && { candidateId: userId })
        },
        select: { id: true }
      });

      for (const s of sessionsNeedingReports) {
        try {
          await ReportService.generateReport(s.id);
        } catch (e) {
          console.warn(`Auto-generating report for session ${s.id} failed:`, e.message);
        }
      }
    } catch (e) {
      console.warn('Auto-report sync check failed:', e.message);
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where: whereClause,
        include: {
          session: {
            include: {
              candidate: { select: { id: true, name: true, email: true } },
              assessment: { select: { id: true, title: true } },
              feedback: true
            }
          }
        },
        orderBy: { generatedAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.report.count({ where: whereClause })
    ]);

    return {
      data: reports,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1
      }
    };
  }

  /**
   * Get single report by ID with ownership verification
   */
  static async getReportById(reportId, userId, userRole) {
    const rId = parseInt(reportId, 10);

    const report = await prisma.report.findUnique({
      where: { id: rId },
      include: {
        session: {
          include: {
            candidate: { select: { id: true, name: true, email: true, education: true, skills: true, phone: true } },
            assessment: { include: { questions: { include: { question: true } } } },
            submissions: {
              include: {
                question: true,
                aiEvaluation: true,
                codeExecution: true
              },
              orderBy: { createdAt: 'desc' }
            },
            proctoringIncidents: true,
            feedback: true
          }
        }
      }
    });

    if (!report) {
      throw new Error('Report not found');
    }

    // Access control check
    const reportCandidateId = report.candidateId || report.session?.candidateId;
    if (userRole === 'CANDIDATE' && reportCandidateId !== userId) {
      throw new Error('Unauthorized: You can only view your own report');
    }

    if (userRole === 'INTERVIEWER' && report.session?.assessment?.createdBy !== userId) {
      throw new Error('Unauthorized: You do not own this assessment report');
    }

    return report;
  }

  /**
   * Bulk download assessment candidate reports as a ZIP archive
   */
  static async createBulkReportsZip(assessmentId, res) {
    const assId = parseInt(assessmentId, 10);

    const reports = await prisma.report.findMany({
      where: {
        OR: [
          { assessmentId: assId },
          { session: { assessmentId: assId } }
        ],
        status: 'COMPLETED'
      },
      include: {
        session: { include: { candidate: true } }
      }
    });

    if (reports.length === 0) {
      throw new Error('No completed reports found for this assessment');
    }

    const archive = createZipArchiveStream({ zlib: { level: 9 } });
    res.attachment(`Assessment_${assId}_Reports.zip`);
    archive.pipe(res);

    for (const r of reports) {
      if (r.filePath && fs.existsSync(r.filePath)) {
        const candidateName = (r.session?.candidate?.name || 'Candidate').replace(/[^a-zA-Z0-9]/g, '_');
        archive.file(r.filePath, { name: `${candidateName}_Report_${r.id}.pdf` });
      }
    }

    await archive.finalize();
  }
}

module.exports = { ReportService };
