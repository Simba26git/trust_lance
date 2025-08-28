#!/bin/bash

# TrustLens Database Migration and Seeding Script
# Handles database setup, migrations, and test data seeding

set -e

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | xargs)
fi

# Configuration
DB_URL="${DATABASE_URL:-postgresql://trustlens:password@localhost:5432/trustlens_dev}"
SEED_ENVIRONMENT="${NODE_ENV:-development}"

echo "🗄️  TrustLens Database Setup"
echo "Environment: $SEED_ENVIRONMENT"
echo "Database URL: $(echo $DB_URL | sed 's/:[^:@]*@/:***@/')"
echo ""

# Function to check if database is accessible
check_database() {
    echo "🔍 Checking database connection..."
    
    if npx prisma db ping > /dev/null 2>&1; then
        echo "✅ Database connection successful"
        return 0
    else
        echo "❌ Database connection failed"
        echo "Please ensure PostgreSQL is running and DATABASE_URL is correct"
        return 1
    fi
}

# Function to run database migrations
run_migrations() {
    echo "🚀 Running database migrations..."
    
    npx prisma migrate deploy
    
    if [ $? -eq 0 ]; then
        echo "✅ Migrations completed successfully"
    else
        echo "❌ Migration failed"
        exit 1
    fi
}

# Function to generate Prisma client
generate_client() {
    echo "🔧 Generating Prisma client..."
    
    npx prisma generate
    
    if [ $? -eq 0 ]; then
        echo "✅ Prisma client generated successfully"
    else
        echo "❌ Client generation failed"
        exit 1
    fi
}

# Function to seed test data
seed_database() {
    echo "🌱 Seeding database with test data..."
    
    # Create seed data using Node.js script
    node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function seed() {
    try {
        console.log('Creating test organizations...');
        
        // Create test organizations
        const testOrg = await prisma.organisation.create({
            data: {
                id: uuidv4(),
                name: 'Test E-commerce Store',
                email: 'admin@teststore.com',
                subscription_tier: 'PRO',
                credits_remaining: 1000,
                webhook_url: 'https://teststore.com/webhooks/trustlens',
                webhook_secret: 'test_webhook_secret_key',
                created_at: new Date(),
                updated_at: new Date()
            }
        });

        const demoOrg = await prisma.organisation.create({
            data: {
                id: uuidv4(),
                name: 'Demo Fashion Boutique',
                email: 'contact@demofashion.com',
                subscription_tier: 'ENTERPRISE',
                credits_remaining: 5000,
                webhook_url: 'https://demofashion.com/api/trustlens',
                webhook_secret: 'demo_webhook_secret_key',
                created_at: new Date(),
                updated_at: new Date()
            }
        });

        console.log('Creating test users...');
        
        // Create test users
        const hashedPassword = await bcrypt.hash('password123', 10);
        
        const adminUser = await prisma.user.create({
            data: {
                id: uuidv4(),
                email: 'admin@teststore.com',
                password_hash: hashedPassword,
                role: 'ADMIN',
                organisation_id: testOrg.id,
                is_verified: true,
                created_at: new Date(),
                updated_at: new Date()
            }
        });

        const merchantUser = await prisma.user.create({
            data: {
                id: uuidv4(),
                email: 'merchant@teststore.com',
                password_hash: hashedPassword,
                role: 'MERCHANT',
                organisation_id: testOrg.id,
                is_verified: true,
                created_at: new Date(),
                updated_at: new Date()
            }
        });

        const demoUser = await prisma.user.create({
            data: {
                id: uuidv4(),
                email: 'demo@demofashion.com',
                password_hash: hashedPassword,
                role: 'ADMIN',
                organisation_id: demoOrg.id,
                is_verified: true,
                created_at: new Date(),
                updated_at: new Date()
            }
        });

        console.log('Creating API keys...');
        
        // Create API keys
        await prisma.api_key.create({
            data: {
                id: uuidv4(),
                key_hash: await bcrypt.hash('test_api_key_12345', 10),
                key_prefix: 'tl_test',
                name: 'Test API Key',
                organisation_id: testOrg.id,
                created_by: adminUser.id,
                permissions: ['upload', 'analysis', 'webhook'],
                created_at: new Date(),
                updated_at: new Date()
            }
        });

        await prisma.api_key.create({
            data: {
                id: uuidv4(),
                key_hash: await bcrypt.hash('demo_api_key_67890', 10),
                key_prefix: 'tl_demo',
                name: 'Demo API Key',
                organisation_id: demoOrg.id,
                created_by: demoUser.id,
                permissions: ['upload', 'analysis', 'webhook', 'admin'],
                created_at: new Date(),
                updated_at: new Date()
            }
        });

        console.log('Creating sample uploads and analysis results...');
        
        // Create sample uploads with analysis results
        const sampleUploads = [
            {
                filename: 'luxury_handbag.jpg',
                verdict: 'GENUINE',
                score: 95,
                risk_level: 'LOW'
            },
            {
                filename: 'designer_watch.jpg',
                verdict: 'SUSPICIOUS',
                score: 35,
                risk_level: 'HIGH'
            },
            {
                filename: 'sneakers_collection.jpg',
                verdict: 'FAKE',
                score: 15,
                risk_level: 'CRITICAL'
            },
            {
                filename: 'jewelry_set.jpg',
                verdict: 'GENUINE',
                score: 88,
                risk_level: 'LOW'
            },
            {
                filename: 'electronics_device.jpg',
                verdict: 'SUSPICIOUS',
                score: 42,
                risk_level: 'MEDIUM'
            }
        ];

        for (const sample of sampleUploads) {
            const upload = await prisma.upload.create({
                data: {
                    id: uuidv4(),
                    filename: sample.filename,
                    original_filename: sample.filename,
                    file_size: Math.floor(Math.random() * 5000000) + 500000, // Random size 0.5-5.5MB
                    mime_type: 'image/jpeg',
                    s3_key: \`uploads/\${testOrg.id}/\${sample.filename}\`,
                    s3_bucket: 'trustlens-uploads',
                    organisation_id: testOrg.id,
                    uploaded_by: merchantUser.id,
                    status: 'COMPLETED',
                    created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in last week
                    updated_at: new Date()
                }
            });

            // Create corresponding analysis result
            await prisma.analysis_result.create({
                data: {
                    id: uuidv4(),
                    upload_id: upload.id,
                    verdict: sample.verdict,
                    aggregated_score: sample.score,
                    risk_level: sample.risk_level,
                    processing_time: Math.floor(Math.random() * 30) + 5, // Random 5-35 seconds
                    c2pa_verification: {
                        verified: sample.verdict === 'GENUINE',
                        manifest_present: true,
                        signature_valid: sample.verdict === 'GENUINE',
                        issuer: sample.verdict === 'GENUINE' ? 'Canon EOS R5' : null
                    },
                    deepfake_detection: {
                        score: Math.random() * 100,
                        confidence: Math.random() * 100,
                        detected_faces: Math.floor(Math.random() * 3),
                        technology_used: 'FaceSwap Detection v2.1'
                    },
                    reverse_image_search: {
                        matches_found: Math.floor(Math.random() * 20),
                        suspicious_sources: Math.floor(Math.random() * 5),
                        earliest_occurrence: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
                        sources: [
                            { url: 'https://example.com/image1.jpg', similarity: 95.5 },
                            { url: 'https://suspicious-site.com/fake.jpg', similarity: 78.2 }
                        ]
                    },
                    metadata_analysis: {
                        camera_info: 'Canon EOS R5',
                        software_used: 'Adobe Photoshop 2023',
                        gps_location: sample.verdict === 'GENUINE' ? 'New York, NY' : null,
                        timestamp_consistency: sample.verdict === 'GENUINE',
                        editing_detected: sample.verdict !== 'GENUINE'
                    },
                    created_at: new Date(),
                    updated_at: new Date()
                }
            });
        }

        console.log('Creating billing usage records...');
        
        // Create billing usage records
        const today = new Date();
        const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

        await prisma.billing_usage.create({
            data: {
                id: uuidv4(),
                organisation_id: testOrg.id,
                period_start: currentMonth,
                period_end: new Date(today.getFullYear(), today.getMonth() + 1, 0),
                upload_count: 45,
                analysis_count: 42,
                webhook_count: 38,
                storage_gb: 2.5,
                total_cost: 89.50,
                created_at: new Date(),
                updated_at: new Date()
            }
        });

        await prisma.billing_usage.create({
            data: {
                id: uuidv4(),
                organisation_id: demoOrg.id,
                period_start: lastMonth,
                period_end: new Date(today.getFullYear(), today.getMonth(), 0),
                upload_count: 128,
                analysis_count: 125,
                webhook_count: 120,
                storage_gb: 8.2,
                total_cost: 245.75,
                created_at: new Date(),
                updated_at: new Date()
            }
        });

        console.log('Creating webhook logs...');
        
        // Create sample webhook logs
        await prisma.webhook_log.create({
            data: {
                id: uuidv4(),
                organisation_id: testOrg.id,
                event_type: 'analysis.completed',
                payload: {
                    upload_id: 'sample-upload-id',
                    verdict: 'GENUINE',
                    score: 95,
                    timestamp: new Date().toISOString()
                },
                status_code: 200,
                response_time: 250,
                success: true,
                created_at: new Date(),
                updated_at: new Date()
            }
        });

        console.log('✅ Database seeded successfully!');
        console.log('');
        console.log('Test credentials:');
        console.log('Admin: admin@teststore.com / password123');
        console.log('Merchant: merchant@teststore.com / password123');
        console.log('Demo: demo@demofashion.com / password123');
        console.log('');
        console.log('API Keys:');
        console.log('Test: test_api_key_12345');
        console.log('Demo: demo_api_key_67890');
        
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    } finally {
        await prisma.\$disconnect();
    }
}

seed();
"
    
    if [ $? -eq 0 ]; then
        echo "✅ Database seeded successfully"
    else
        echo "❌ Seeding failed"
        exit 1
    fi
}

# Function to create test database
create_test_db() {
    echo "🧪 Setting up test database..."
    
    # Switch to test database URL
    export DATABASE_URL="${DATABASE_URL}_test"
    
    echo "Test DB URL: $(echo $DATABASE_URL | sed 's/:[^:@]*@/:***@/')"
    
    # Run migrations for test database
    npx prisma migrate deploy
    
    if [ $? -eq 0 ]; then
        echo "✅ Test database setup completed"
    else
        echo "❌ Test database setup failed"
        exit 1
    fi
}

# Function to reset database (DROP ALL TABLES)
reset_database() {
    echo "⚠️  WARNING: This will DROP ALL TABLES and DATA!"
    read -p "Are you sure you want to reset the database? (yes/no): " confirm
    
    if [ "$confirm" = "yes" ]; then
        echo "🔄 Resetting database..."
        npx prisma migrate reset --force
        echo "✅ Database reset completed"
    else
        echo "❌ Database reset cancelled"
        exit 1
    fi
}

# Function to backup database
backup_database() {
    echo "💾 Creating database backup..."
    
    # Extract database connection details
    DB_HOST=$(echo $DB_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo $DB_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    DB_NAME=$(echo $DB_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
    DB_USER=$(echo $DB_URL | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
    
    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
    
    pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME > $BACKUP_FILE
    
    if [ $? -eq 0 ]; then
        echo "✅ Database backup saved to: $BACKUP_FILE"
    else
        echo "❌ Database backup failed"
        exit 1
    fi
}

# Function to show database status
show_status() {
    echo "📊 Database Status:"
    echo ""
    
    if check_database; then
        # Count records in each table
        node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function showCounts() {
    try {
        const organisations = await prisma.organisation.count();
        const users = await prisma.user.count();
        const uploads = await prisma.upload.count();
        const analyses = await prisma.analysis_result.count();
        const apiKeys = await prisma.api_key.count();
        const webhookLogs = await prisma.webhook_log.count();
        
        console.log(\`  Organizations: \${organisations}\`);
        console.log(\`  Users: \${users}\`);
        console.log(\`  Uploads: \${uploads}\`);
        console.log(\`  Analysis Results: \${analyses}\`);
        console.log(\`  API Keys: \${apiKeys}\`);
        console.log(\`  Webhook Logs: \${webhookLogs}\`);
    } catch (error) {
        console.log('  Error retrieving counts:', error.message);
    } finally {
        await prisma.\$disconnect();
    }
}

showCounts();
"
    fi
}

# Main script logic
case "${1:-help}" in
    "setup")
        check_database
        run_migrations
        generate_client
        if [ "$SEED_ENVIRONMENT" != "production" ]; then
            seed_database
        fi
        ;;
    "migrate")
        check_database
        run_migrations
        generate_client
        ;;
    "seed")
        check_database
        seed_database
        ;;
    "reset")
        reset_database
        ;;
    "backup")
        backup_database
        ;;
    "status")
        show_status
        ;;
    "test-setup")
        create_test_db
        ;;
    "help"|*)
        echo "🗄️  TrustLens Database Management"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  setup      - Run migrations, generate client, and seed data"
        echo "  migrate    - Run database migrations only"
        echo "  seed       - Seed database with test data"
        echo "  reset      - Reset database (DROP ALL TABLES)"
        echo "  backup     - Create database backup"
        echo "  status     - Show database status and record counts"
        echo "  test-setup - Setup test database"
        echo "  help       - Show this help message"
        echo ""
        echo "Environment Variables:"
        echo "  DATABASE_URL - PostgreSQL connection string"
        echo "  NODE_ENV     - Environment (development/production)"
        echo ""
        echo "Examples:"
        echo "  $0 setup              # Full setup with seeding"
        echo "  $0 migrate            # Run migrations only"
        echo "  NODE_ENV=production $0 migrate  # Production migration"
        ;;
esac

echo ""
echo "🏁 Database operation completed!"
