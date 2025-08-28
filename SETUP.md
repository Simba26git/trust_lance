# TrustLens - Complete Setup Guide

## 📋 Overview

TrustLens is a comprehensive AI-powered authenticity verification SaaS platform that provides end-to-end content verification for e-commerce and digital media. This repository contains the complete production-ready codebase with all features implemented.

## 🏗️ Architecture

### Backend Services
- **Express.js API Server** - RESTful API with comprehensive authentication
- **PostgreSQL Database** - Prisma ORM with complete schema
- **Redis Queue System** - BullMQ for background processing
- **AWS S3 Storage** - Encrypted file storage with MinIO support
- **Analysis Pipeline** - Multi-factor authenticity verification

### Core Analysis Features
- **C2PA Verification** - Digital signature validation
- **Deepfake Detection** - AI-powered manipulation detection via Sensity AI & TruePic
- **Reverse Image Search** - Content originality checking via TinEye & Google Vision
- **Metadata Analysis** - Technical forensics and EXIF analysis
- **Scoring Algorithm** - Weighted authenticity scoring
- **PDF Reports** - Professional analysis reports

### Infrastructure
- **Docker Containerization** - Production-ready containers
- **Kubernetes Deployment** - Scalable cloud deployment
- **Monitoring & Logging** - Comprehensive observability
- **Queue Management** - Scalable background processing
- **Security** - Rate limiting, authentication, encryption

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Docker & Docker Compose
- AWS CLI (for S3) or MinIO

### 1. Install Dependencies

```bash
# Install all Node.js packages
npm install

# Install development dependencies
npm install --save-dev @types/node @types/express @types/multer @types/uuid @types/bcryptjs @types/jsonwebtoken @types/jest
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

**Required Environment Variables:**
```env
# Database
DATABASE_URL=postgresql://trustlens:password@localhost:5432/trustlens_dev

# Redis
REDIS_URL=redis://localhost:6379

# AWS S3 (or use MinIO for development)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
S3_BUCKET_NAME=trustlens-uploads
AWS_REGION=us-east-1

# For local development with MinIO
S3_ENDPOINT=http://localhost:9000

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# External API Keys (optional for development)
SENSITY_API_KEY=your_sensity_api_key
TRUEPIC_API_KEY=your_truepic_api_key
TINEYE_API_KEY=your_tineye_api_key
GOOGLE_VISION_API_KEY=your_google_vision_api_key
```

### 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Seed with test data
chmod +x scripts/db_setup.sh
./scripts/db_setup.sh setup
```

### 4. Development with Docker

```bash
# Start all services (PostgreSQL, Redis, MinIO)
docker-compose up -d

# Start the development server
npm run dev

# Start the worker process
npm run worker
```

### 5. Production Deployment

```bash
# Build for production
npm run build

# Deploy to Kubernetes
./scripts/deploy.sh production
```

## 📁 Project Structure

```
trustlens/
├── src/
│   ├── config/
│   │   └── environment.ts          # Environment configuration
│   ├── middleware/
│   │   ├── auth.ts                 # JWT authentication
│   │   ├── rate-limit.ts           # Rate limiting
│   │   └── validation.ts           # Request validation
│   ├── routes/
│   │   ├── uploads.ts              # File upload endpoints
│   │   ├── analysis.ts             # Analysis results endpoints
│   │   ├── auth.ts                 # Authentication endpoints
│   │   ├── merchants.ts            # Merchant management
│   │   ├── admin.ts                # Admin functions
│   │   └── webhooks.ts             # Webhook handling
│   ├── services/
│   │   ├── s3.ts                   # S3 file storage
│   │   ├── queue.ts                # Queue management
│   │   ├── auth.ts                 # Authentication service
│   │   ├── metadata.ts             # Metadata extraction
│   │   ├── deepfake.ts             # Deepfake detection
│   │   ├── reverse-search.ts       # Reverse image search
│   │   ├── scoring.ts              # Authenticity scoring
│   │   └── pdf-report.ts           # PDF report generation
│   ├── utils/
│   │   └── logger.ts               # Logging utilities
│   ├── server.ts                   # Main server application
│   └── worker.ts                   # Background worker
├── prisma/
│   └── schema.prisma               # Database schema
├── docker/
│   ├── Dockerfile.backend          # Backend container
│   ├── Dockerfile.worker           # Worker container
│   └── Dockerfile.frontend         # Frontend container
├── k8s/                            # Kubernetes manifests
├── scripts/
│   ├── db_setup.sh                 # Database management
│   ├── deploy.sh                   # Deployment automation
│   └── perf_test.sh                # Performance testing
├── tests/                          # Test suites
├── docs/                           # Documentation
├── docker-compose.yml              # Development stack
├── package.json                    # Dependencies
└── README.md                       # This file
```

## 🔧 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - User logout

### File Upload & Analysis
- `POST /api/v1/uploads` - Upload file for analysis
- `GET /api/v1/uploads/:id` - Get upload status
- `GET /api/v1/uploads` - List uploads with pagination
- `DELETE /api/v1/uploads/:id` - Delete upload
- `POST /api/v1/uploads/:id/reanalyze` - Rerun analysis

### Analysis Results
- `GET /api/v1/analysis/:id` - Get analysis results
- `GET /api/v1/analysis/:id/report` - Download PDF report
- `GET /api/v1/analysis/:id/download` - Download original file
- `POST /api/v1/analysis/:id/verdict` - Update verdict (admin)
- `GET /api/v1/analysis/stats` - Get statistics

### Organization Management
- `GET /api/v1/merchants/profile` - Get organization profile
- `PUT /api/v1/merchants/profile` - Update organization
- `GET /api/v1/merchants/usage` - Get usage statistics
- `POST /api/v1/merchants/api-keys` - Create API key
- `GET /api/v1/merchants/api-keys` - List API keys

### Admin Functions
- `GET /api/v1/admin/organizations` - List all organizations
- `GET /api/v1/admin/analytics` - Platform analytics
- `POST /api/v1/admin/organizations/:id/credits` - Add credits
- `GET /api/v1/admin/system/status` - System health

### Webhooks
- `POST /api/v1/webhooks/analysis-complete` - Analysis completion
- `POST /api/v1/webhooks/test` - Test webhook
- `GET /api/v1/webhooks/logs` - Webhook delivery logs

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run end-to-end tests
npm run test:e2e

# Run performance tests
./scripts/perf_test.sh

# Generate test coverage
npm run test:coverage
```

## 📊 Monitoring & Health Checks

```bash
# Check application health
curl http://localhost:3000/health

# View metrics
curl http://localhost:3000/metrics

# Check queue status
curl http://localhost:3000/api/v1/admin/system/status
```

## 🔒 Security Features

- **JWT Authentication** - Secure token-based auth
- **Rate Limiting** - Request throttling per IP/user
- **Input Validation** - Comprehensive request validation
- **File Type Validation** - Whitelist-based file filtering
- **CORS Protection** - Cross-origin request security
- **Helmet Security** - Security headers
- **SQL Injection Protection** - Prisma ORM parameterized queries
- **XSS Prevention** - Input sanitization

## 📈 Performance Optimization

- **Queue-based Processing** - Asynchronous analysis pipeline
- **Redis Caching** - Fast data retrieval
- **Database Indexing** - Optimized query performance
- **Connection Pooling** - Efficient database connections
- **File Streaming** - Memory-efficient file handling
- **Compression** - Response compression
- **CDN Support** - Static asset optimization

## 🚀 Deployment Options

### Docker Deployment
```bash
# Build images
docker-compose build

# Deploy stack
docker-compose up -d
```

### Kubernetes Deployment
```bash
# Deploy to staging
./scripts/deploy.sh staging

# Deploy to production
./scripts/deploy.sh production
```

### Manual Deployment
```bash
# Build application
npm run build

# Start production server
npm start

# Start worker process
npm run worker
```

## 🔧 Configuration

### Feature Flags
```env
ENABLE_C2PA_VERIFICATION=true
ENABLE_DEEPFAKE_DETECTION=true
ENABLE_REVERSE_SEARCH=true
ENABLE_METADATA_ANALYSIS=true
ENABLE_PDF_REPORTS=true
ENABLE_WEBHOOKS=true
```

### Rate Limiting
```env
RATE_LIMIT_WINDOW_MS=900000    # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100    # 100 requests per window
```

### File Upload Limits
```env
MAX_FILE_SIZE=52428800         # 50MB
ALLOWED_MIME_TYPES=image/jpeg,image/png,video/mp4
```

## 📞 Support & Documentation

### API Documentation
- Swagger UI: `http://localhost:3000/api/docs`
- OpenAPI Spec: `http://localhost:3000/api/docs/json`

### Database Schema
- Prisma Studio: `npx prisma studio`
- Schema Documentation: `docs/database-schema.md`

### Queue Monitoring
- Bull Dashboard: `http://localhost:3000/admin/queues`

## 🐛 Troubleshooting

### Common Issues

**TypeScript Compilation Errors:**
```bash
# Install missing type definitions
npm install --save-dev @types/node @types/express
```

**Database Connection Issues:**
```bash
# Check PostgreSQL is running
./scripts/db_setup.sh status

# Reset database
./scripts/db_setup.sh reset
```

**Redis Connection Issues:**
```bash
# Check Redis status
redis-cli ping

# Clear Redis cache
redis-cli flushall
```

**S3 Upload Issues:**
```bash
# Test S3 connectivity
aws s3 ls s3://your-bucket-name

# For MinIO development
docker logs trustlens_minio_1
```

### Performance Issues
```bash
# Run performance diagnostics
./scripts/perf_test.sh

# Check queue status
curl http://localhost:3000/api/v1/admin/system/status

# Monitor logs
docker-compose logs -f backend
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔮 Roadmap

- [ ] Mobile app development
- [ ] Blockchain verification integration
- [ ] Advanced AI model training
- [ ] Real-time processing
- [ ] Multi-language support
- [ ] Advanced analytics dashboard

---

**TrustLens** - Ensuring content authenticity in the digital age.

For support, contact: support@trustlens.com
Documentation: https://docs.trustlens.com
