const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed for Talent Flow...');

  // Clean existing data in reverse order of dependencies
  await prisma.report.deleteMany({});
  await prisma.feedback.deleteMany({});
  await prisma.proctoringIncident.deleteMany({});
  await prisma.aIEvaluation.deleteMany({});
  await prisma.codeExecution.deleteMany({});
  await prisma.submission.deleteMany({});
  await prisma.assessmentSession.deleteMany({});
  await prisma.assessmentQuestion.deleteMany({});
  await prisma.assessmentCandidate.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.assessment.deleteMany({});
  await prisma.user.deleteMany({});

  // Hash default password
  const interviewerPassword = await bcrypt.hash('Admin@123', 10);
  const candidatePassword = await bcrypt.hash('Candidate@123', 10);

  // 1. Create Interviewer
  const interviewer = await prisma.user.create({
    data: {
      name: 'Admin Interviewer',
      email: 'admin@gmail.com',
      passwordHash: interviewerPassword,
      role: 'INTERVIEWER',
      phone: '+1 555-0199',
      education: 'M.S. Computer Science, Stanford University',
      skills: 'System Design, JavaScript, React, Node.js, Architecture',
    },
  });
  console.log(`✅ Interviewer created: ${interviewer.name} (${interviewer.email})`);

  // 2. Create Candidates
  const candidate1 = await prisma.user.create({
    data: {
      name: 'Alex Rivera',
      email: 'alex@candidate.com',
      passwordHash: candidatePassword,
      role: 'CANDIDATE',
      phone: '+1 555-0142',
      education: 'B.S. Software Engineering, MIT',
      skills: 'JavaScript, Python, React, Data Structures',
    },
  });

  const candidate2 = await prisma.user.create({
    data: {
      name: 'Sarah Connor',
      email: 'sarah@candidate.com',
      passwordHash: candidatePassword,
      role: 'CANDIDATE',
      phone: '+1 555-0178',
      education: 'B.S. Computer Engineering, UC Berkeley',
      skills: 'Python, Algorithms, PostgreSQL, Express',
    },
  });

  const candidate3 = await prisma.user.create({
    data: {
      name: 'Devin Vance',
      email: 'devin@candidate.com',
      passwordHash: candidatePassword,
      role: 'CANDIDATE',
      phone: '+1 555-0112',
      education: 'B.S. Information Technology, NYU',
      skills: 'JavaScript, Vue.js, Node.js, C++',
    },
  });

  console.log(`✅ 3 Sample Candidates created: ${candidate1.email}, ${candidate2.email}, ${candidate3.email}`);

  // 3. Create Questions
  const q1 = await prisma.question.create({
    data: {
      title: 'Two Sum Problem',
      description: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.',
      category: 'ALGORITHMS',
      difficulty: 'EASY',
      language: 'javascript',
      expectedOutput: '[0, 1]',
      timeLimit: 30,
      createdBy: interviewer.id,
    },
  });

  const q2 = await prisma.question.create({
    data: {
      title: 'Reverse Linked List',
      description: 'Given the head of a singly linked list, reverse the list, and return the reversed list.\n\nExample:\nInput: head = [1,2,3,4,5]\nOutput: [5,4,3,2,1]',
      category: 'DATA_STRUCTURES',
      difficulty: 'MEDIUM',
      language: 'javascript',
      expectedOutput: '[5, 4, 3, 2, 1]',
      timeLimit: 45,
      createdBy: interviewer.id,
    },
  });

  const q3 = await prisma.question.create({
    data: {
      title: 'SQL Highest Salary Per Department',
      description: 'Write a SQL query to find employees who have the highest salary in each of the departments.\n\nTable: Employee (id, name, salary, departmentId)',
      category: 'DATABASE',
      difficulty: 'MEDIUM',
      language: 'javascript',
      expectedOutput: 'Department | Employee | Salary',
      timeLimit: 30,
      createdBy: interviewer.id,
    },
  });

  console.log(`✅ 3 Sample Questions created.`);

  // 4. Create Multi-Candidate Assessment
  const assessment = await prisma.assessment.create({
    data: {
      title: 'JavaScript Technical Assessment',
      description: 'Comprehensive multi-candidate technical evaluation testing core algorithms, data structures, and problem-solving skills.',
      duration: 60,
      startTime: new Date(Date.now() + 3600 * 1000 * 24), // Tomorrow
      endTime: new Date(Date.now() + 3600 * 1000 * 26),
      status: 'SCHEDULED',
      createdBy: interviewer.id,
    },
  });

  console.log(`✅ Assessment created: "${assessment.title}" (ID: ${assessment.id})`);

  // 5. Link Questions to Assessment
  await prisma.assessmentQuestion.createMany({
    data: [
      { assessmentId: assessment.id, questionId: q1.id, displayOrder: 1 },
      { assessmentId: assessment.id, questionId: q2.id, displayOrder: 2 },
      { assessmentId: assessment.id, questionId: q3.id, displayOrder: 3 },
    ],
  });

  // 6. Link Candidates to Assessment (Multi-Candidate Relationship)
  await prisma.assessmentCandidate.createMany({
    data: [
      { assessmentId: assessment.id, candidateId: candidate1.id, status: 'INVITED' },
      { assessmentId: assessment.id, candidateId: candidate2.id, status: 'NOT_STARTED' },
      { assessmentId: assessment.id, candidateId: candidate3.id, status: 'IN_PROGRESS' },
    ],
  });

  // 7. Create Independent Candidate Assessment Sessions
  await prisma.assessmentSession.create({
    data: {
      assessmentId: assessment.id,
      candidateId: candidate1.id,
      status: 'WAITING',
      currentCode: '// Candidate Alex Rivera session code workspace\nfunction twoSum(nums, target) {\n  // Write solution here\n}',
      language: 'javascript',
    },
  });

  await prisma.assessmentSession.create({
    data: {
      assessmentId: assessment.id,
      candidateId: candidate2.id,
      status: 'WAITING',
      currentCode: '// Candidate Sarah Connor session code workspace\nfunction twoSum(nums, target) {\n  // Write solution here\n}',
      language: 'javascript',
    },
  });

  await prisma.assessmentSession.create({
    data: {
      assessmentId: assessment.id,
      candidateId: candidate3.id,
      startedAt: new Date(),
      status: 'ACTIVE',
      currentCode: '// Candidate Devin Vance session code workspace\nfunction twoSum(nums, target) {\n  const map = new Map();\n  for(let i=0; i<nums.length; i++) {\n    // In Progress\n  }\n}',
      language: 'javascript',
    },
  });

  console.log('✅ Independent Candidate Sessions initialized.');
  console.log('✨ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
