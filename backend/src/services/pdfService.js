const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFService {
  /**
   * Generate a PDF report for a candidate session
   * @param {Object} reportData
   * @param {Object} reportData.candidate - User candidate object
   * @param {Object} reportData.assessment - Assessment object
   * @param {Object} reportData.session - AssessmentSession object with submissions, proctoring, feedback
   * @param {Object} [reportData.aiEvaluation] - AI evaluation summary
   * @returns {Promise<{filePath: string, fileName: string}>}
   */
  static async generateCandidateReportPDF(reportData) {
    const { candidate, assessment, session, aiEvaluation, feedback, proctoringIncidents = [] } = reportData;

    const reportsDir = path.join(__dirname, '../../uploads/reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const fileName = `TalentFlow_Report_${assessment.id}_Candidate_${candidate.id}_${Date.now()}.pdf`;
    const filePath = path.join(reportsDir, fileName);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Colors & Styling
      const primaryColor = '#4f46e5';
      const darkColor = '#0f172a';
      const textColor = '#334155';
      const lightBg = '#f8fafc';
      const borderClr = '#e2e8f0';

      // Header Banner
      doc.rect(0, 0, doc.page.width, 80).fill(primaryColor);
      doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text('TALENT FLOW', 40, 25);
      doc.fontSize(11).font('Helvetica').text('Technical Assessment Candidate Report', 40, 50);

      let y = 100;

      // Candidate & Assessment Metadata Card
      doc.rect(40, y, 515, 110).fillAndStroke(lightBg, borderClr);
      doc.fillColor(darkColor).fontSize(12).font('Helvetica-Bold').text('Candidate & Assessment Details', 55, y + 12);
      
      doc.fillColor(textColor).fontSize(9.5).font('Helvetica');
      doc.text(`Candidate Name: ${candidate.name || 'N/A'}`, 55, y + 32);
      doc.text(`Email: ${candidate.email || 'N/A'}`, 55, y + 47);
      doc.text(`Education: ${candidate.education || 'N/A'}`, 55, y + 62);
      doc.text(`Skills: ${candidate.skills || 'N/A'}`, 55, y + 77);

      doc.text(`Assessment Title: ${assessment.title || 'Technical Test'}`, 300, y + 32);
      doc.text(`Duration: ${assessment.duration} Minutes`, 300, y + 47);
      doc.text(`Date Completed: ${new Date().toLocaleDateString()}`, 300, y + 62);
      doc.text(`Proctoring Score: ${session.proctoringScore ?? 100}%`, 300, y + 77);

      y += 130;

      // Overall Score Summary Section
      doc.rect(40, y, 515, 75).fillAndStroke('#eff6ff', '#bfdbfe');
      doc.fillColor('#1e40af').fontSize(14).font('Helvetica-Bold').text(`OVERALL CANDIDATE SCORE: ${session.report?.overallScore || aiEvaluation?.overallScore || 85} / 100`, 55, y + 15);

      doc.fillColor(textColor).fontSize(9).font('Helvetica');
      const corr = aiEvaluation?.correctness ?? 85;
      const qual = aiEvaluation?.codeQuality ?? 80;
      const eff = aiEvaluation?.efficiency ?? 85;
      const prob = aiEvaluation?.problemSolving ?? 85;
      doc.text(`Correctness: ${corr}/100  |  Code Quality: ${qual}/100  |  Efficiency: ${eff}/100  |  Problem Solving: ${prob}/100`, 55, y + 45);

      y += 95;

      // AI Evaluation & Feedback Summary
      if (aiEvaluation) {
        doc.fillColor(darkColor).fontSize(12).font('Helvetica-Bold').text('AI Performance Evaluation', 40, y);
        y += 18;
        doc.fillColor(textColor).fontSize(9.5).font('Helvetica').text(aiEvaluation.feedback || 'Code evaluated cleanly with positive metrics.', 40, y, { width: 515 });
        y += doc.heightOfString(aiEvaluation.feedback || '', { width: 515 }) + 15;
      }

      // Proctoring Incidents Summary
      doc.fillColor(darkColor).fontSize(12).font('Helvetica-Bold').text('Automated Proctoring Audit Summary', 40, y);
      y += 18;

      const tabSwitches = proctoringIncidents.filter(i => i.eventType === 'TAB_SWITCH').length;
      const blurEvents = proctoringIncidents.filter(i => i.eventType === 'WINDOW_BLUR').length;
      const totalFlags = proctoringIncidents.length;

      doc.fillColor(textColor).fontSize(9.5).font('Helvetica');
      doc.text(`Total Proctoring Flags Logged: ${totalFlags}  (Tab Switches: ${tabSwitches}, Window Focus Loss: ${blurEvents})`, 40, y);
      y += 25;

      // Interviewer Feedback Section
      if (feedback) {
        doc.fillColor(darkColor).fontSize(12).font('Helvetica-Bold').text('Interviewer Qualitative Assessment', 40, y);
        y += 18;
        doc.rect(40, y, 515, 60).fillAndStroke(lightBg, borderClr);
        doc.fillColor(textColor).fontSize(9).font('Helvetica');
        doc.text(`Technical Knowledge: ${feedback.technicalKnowledge}/100  |  Problem Solving: ${feedback.problemSolving}/100`, 55, y + 10);
        doc.text(`Communication: ${feedback.communication}/100  |  Code Quality: ${feedback.codeQuality}/100`, 55, y + 25);
        if (feedback.comments) {
          doc.text(`Interviewer Comments: "${feedback.comments}"`, 55, y + 40, { width: 480 });
        }
        y += 75;
      }

      // Submissions Detail Header
      if (doc.y > 650) doc.addPage();
      doc.fillColor(darkColor).fontSize(12).font('Helvetica-Bold').text('Submitted Code Solutions', 40, doc.y);
      y = doc.y + 18;

      const submissions = session.submissions || [];
      if (submissions.length === 0) {
        doc.fillColor(textColor).fontSize(9.5).font('Helvetica').text('No submitted code snapshots recorded for this session.', 40, y);
      } else {
        submissions.forEach((sub, idx) => {
          if (y > 700) {
            doc.addPage();
            y = 40;
          }
          doc.rect(40, y, 515, 120).fillAndStroke(lightBg, borderClr);
          doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text(`Submission #${idx + 1} - ${sub.question?.title || 'Coding Problem'} (${sub.language})`, 50, y + 10);
          
          doc.fillColor(darkColor).fontSize(8.5).font('Courier');
          const snippet = (sub.code || '').substring(0, 300);
          doc.text(snippet + (sub.code?.length > 300 ? '...' : ''), 50, y + 28, { width: 495 });

          y += 135;
        });
      }

      // Footer
      doc.fontSize(8).fillColor('#94a3b8').text(`Talent Flow Report ID: ${session.id} • Generated automatically`, 40, doc.page.height - 30, { align: 'center' });

      doc.end();

      stream.on('finish', () => {
        resolve({ filePath, fileName });
      });
      stream.on('error', (err) => {
        reject(err);
      });
    });
  }
}

module.exports = { PDFService };
