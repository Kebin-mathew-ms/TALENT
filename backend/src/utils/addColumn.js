const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE Assessment ADD COLUMN allowCodeCopy TINYINT(1) NOT NULL DEFAULT 1`);
    console.log('Successfully added allowCodeCopy column to Assessment table in MySQL!');
  } catch (err) {
    console.log('ALTER TABLE Result:', err.message);
  }
}

main().finally(() => prisma.$disconnect());
