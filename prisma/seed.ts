import { PrismaClient, UserRole, OrgRole, ShopPlatform } from '@prisma/client';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await argon2.hash('admin123!');
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@trustlens.com' },
    update: {},
    create: {
      email: 'admin@trustlens.com',
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
      firstName: 'Admin',
      lastName: 'User',
      isActive: true,
    },
  });

  // Create reviewer user
  const reviewerPassword = await argon2.hash('reviewer123!');
  const reviewerUser = await prisma.user.upsert({
    where: { email: 'reviewer@trustlens.com' },
    update: {},
    create: {
      email: 'reviewer@trustlens.com',
      passwordHash: reviewerPassword,
      role: UserRole.REVIEWER,
      firstName: 'Review',
      lastName: 'Specialist',
      isActive: true,
    },
  });

  // Create test merchant user
  const merchantPassword = await argon2.hash('merchant123!');
  const merchantUser = await prisma.user.upsert({
    where: { email: 'merchant@example.com' },
    update: {},
    create: {
      email: 'merchant@example.com',
      passwordHash: merchantPassword,
      role: UserRole.MERCHANT,
      firstName: 'Test',
      lastName: 'Merchant',
      isActive: true,
    },
  });

  // Create test organizations
  const testOrg = await prisma.organisation.upsert({
    where: { id: 'test-org-123' },
    update: {},
    create: {
      id: 'test-org-123',
      name: 'Test Fashion Store',
      planId: 'starter',
      isActive: true,
      settings: {
        notifications: {
          email: true,
          webhook: true,
        },
        analysis: {
          autoReview: false,
          deepfakeThreshold: 0.7,
        },
      },
    },
  });

  const enterpriseOrg = await prisma.organisation.upsert({
    where: { id: 'enterprise-org-456' },
    update: {},
    create: {
      id: 'enterprise-org-456',
      name: 'Enterprise Electronics Co',
      planId: 'enterprise',
      stripeCustomerId: 'cus_test_enterprise',
      isActive: true,
      settings: {
        notifications: {
          email: true,
          webhook: true,
          slack: true,
        },
        analysis: {
          autoReview: true,
          deepfakeThreshold: 0.5,
          enableTruepic: true,
        },
      },
    },
  });

  // Link users to organizations
  await prisma.organisationUser.upsert({
    where: {
      organisationId_userId: {
        organisationId: testOrg.id,
        userId: merchantUser.id,
      },
    },
    update: {},
    create: {
      organisationId: testOrg.id,
      userId: merchantUser.id,
      role: OrgRole.OWNER,
    },
  });

  await prisma.organisationUser.upsert({
    where: {
      organisationId_userId: {
        organisationId: enterpriseOrg.id,
        userId: adminUser.id,
      },
    },
    update: {},
    create: {
      organisationId: enterpriseOrg.id,
      userId: adminUser.id,
      role: OrgRole.ADMIN,
    },
  });

  // Create test merchants
  const shopifyMerchant = await prisma.merchant.upsert({
    where: { id: 'shopify-merchant-123' },
    update: {},
    create: {
      id: 'shopify-merchant-123',
      organisationId: testOrg.id,
      shopPlatform: ShopPlatform.SHOPIFY,
      shopId: 'test-shop-123',
      shopUrl: 'test-fashion-store.myshopify.com',
      webhookSecret: 'test-webhook-secret-123',
      isActive: true,
      settings: {
        autoScan: true,
        badgeEnabled: true,
        badgePosition: 'bottom-right',
      },
    },
  });

  const apiMerchant = await prisma.merchant.upsert({
    where: { id: 'api-merchant-456' },
    update: {},
    create: {
      id: 'api-merchant-456',
      organisationId: enterpriseOrg.id,
      shopPlatform: ShopPlatform.API,
      shopId: 'enterprise-api-client',
      isActive: true,
      settings: {
        autoScan: false,
        batchProcessing: true,
        priority: 'high',
      },
    },
  });

  // Create API keys
  const testApiKey = randomBytes(32).toString('hex');
  const testApiKeyHash = require('crypto').createHash('sha256').update(testApiKey).digest('hex');
  
  await prisma.apiKey.upsert({
    where: { id: 'test-api-key-123' },
    update: {},
    create: {
      id: 'test-api-key-123',
      organisationId: testOrg.id,
      name: 'Development API Key',
      keyHash: testApiKeyHash,
      scopes: ['uploads:create', 'analysis:read', 'webhooks:receive'],
      rateLimitPerMin: 100,
      isActive: true,
    },
  });

  const enterpriseApiKey = randomBytes(32).toString('hex');
  const enterpriseApiKeyHash = require('crypto').createHash('sha256').update(enterpriseApiKey).digest('hex');
  
  await prisma.apiKey.upsert({
    where: { id: 'enterprise-api-key-456' },
    update: {},
    create: {
      id: 'enterprise-api-key-456',
      organisationId: enterpriseOrg.id,
      name: 'Production API Key',
      keyHash: enterpriseApiKeyHash,
      scopes: ['*'],
      rateLimitPerMin: 1000,
      isActive: true,
    },
  });

  // Create billing usage records
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
  const startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const endDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
  
  await prisma.billingUsage.upsert({
    where: {
      organisationId_month: {
        organisationId: testOrg.id,
        month: currentMonth,
      },
    },
    update: {},
    create: {
      organisationId: testOrg.id,
      checksCount: 150,
      costCents: 750, // $7.50 for overages
      month: currentMonth,
      period: `${startDate.toISOString().slice(0, 10)} to ${endDate.toISOString().slice(0, 10)}`,
    },
  });

  await prisma.billingUsage.upsert({
    where: {
      organisationId_month: {
        organisationId: enterpriseOrg.id,
        month: currentMonth,
      },
    },
    update: {},
    create: {
      organisationId: enterpriseOrg.id,
      checksCount: 25000,
      costCents: 0, // Enterprise plan, no overages
      month: currentMonth,
      period: `${startDate.toISOString().slice(0, 10)} to ${endDate.toISOString().slice(0, 10)}`,
    },
  });

  // Create audit log entries
  await prisma.auditLog.create({
    data: {
      actorId: adminUser.id,
      actionType: 'USER_LOGIN',
      resourceType: 'USER',
      resourceId: adminUser.id,
      payload: {
        timestamp: new Date().toISOString(),
        success: true,
        ip: '127.0.0.1',
      },
      ipAddress: '127.0.0.1',
      userAgent: 'TrustLens/1.0 (Development)',
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: merchantUser.id,
      actionType: 'API_KEY_CREATED',
      resourceType: 'API_KEY',
      resourceId: 'test-api-key-123',
      payload: {
        timestamp: new Date().toISOString(),
        keyName: 'Development API Key',
        scopes: ['uploads:create', 'analysis:read', 'webhooks:receive'],
      },
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log('\n📝 Test Credentials:');
  console.log(`Admin: admin@trustlens.com / admin123!`);
  console.log(`Reviewer: reviewer@trustlens.com / reviewer123!`);
  console.log(`Merchant: merchant@example.com / merchant123!`);
  console.log('\n🔑 Test API Keys:');
  console.log(`Test Org API Key: ${testApiKey}`);
  console.log(`Enterprise API Key: ${enterpriseApiKey}`);
  console.log('\n🏪 Test Merchants:');
  console.log(`Shopify Merchant ID: ${shopifyMerchant.id}`);
  console.log(`API Merchant ID: ${apiMerchant.id}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
