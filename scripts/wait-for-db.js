// Wait for database to be ready before running migrations
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function waitForDatabase(maxRetries = 30, delay = 2000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await prisma.$connect();
      console.log('✅ Database connection successful');
      await prisma.$disconnect();
      return true;
    } catch (error) {
      console.log(`⏳ Waiting for database... (attempt ${i + 1}/${maxRetries})`);
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  console.error('❌ Failed to connect to database after', maxRetries, 'attempts');
  process.exit(1);
}

waitForDatabase()
  .then(() => {
    console.log('Database is ready');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error waiting for database:', error);
    process.exit(1);
  });

