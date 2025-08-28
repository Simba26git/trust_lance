import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load test environment variables
config({ path: '.env.test' });

// Global test setup
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  
  // Initialize test database
  const prisma = new PrismaClient();
  
  try {
    // Run migrations
    const { execSync } = require('child_process');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    
    // Seed test data
    execSync('npx prisma db seed', { stdio: 'inherit' });
    
    console.log('Test database initialized');
  } catch (error) {
    console.error('Failed to initialize test database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
});

// Global test teardown
afterAll(async () => {
  // Cleanup is handled in globalTeardown.ts
});

// Jest timeout
jest.setTimeout(30000);
