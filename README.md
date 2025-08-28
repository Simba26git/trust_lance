# TrustLens - AI-Powered Content Verification Platform

<div align="center">
  <img src="https://raw.githubusercontent.com/trustlens/trustlens/main/assets/logo.png" alt="TrustLens Logo" width="120" height="120">
  
  **The Foundation for your Content Verification**
  
  *Beautifully designed AI-powered tools to verify content authenticity. Detect deepfakes, validate provenance, and ensure media integrity with enterprise-grade security.*

  [![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
  [![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/trustlens/trustlens)
  [![Build Status](https://img.shields.io/github/actions/workflow/status/trustlens/trustlens/ci.yml)](https://github.com/trustlens/trustlens/actions)
  [![Security Rating](https://img.shields.io/badge/security-A+-brightgreen.svg)](https://github.com/trustlens/trustlens/security)

  [Get Started](#quick-start) • [Documentation](./docs) • [API Reference](./docs/api.md) • [Live Demo](https://demo.trustlens.com)
</div>

---

## 🚀 What is TrustLens?

TrustLens is an **AI-powered authenticity & product-content verification platform** for e-commerce, marketplaces, advertisers, and brands. It scans product listings, UGC (user content/influencer posts), ad creatives, and seller uploads to produce a verifiable authenticity score + provenance report.

### 🎯 **Core Features**

- **🔍 Image & Video Authenticity Scan** - Multi-check pipeline with metadata (EXIF/C2PA), perceptual hashing (pHash), deepfake detection, and tamper detection
- **🔄 Product-Image Matching** - Reverse-image search and catalog-match scoring to detect mismatched/stolen images
- **✅ Seller Quick-KYC** - Basic identity checks with email/phone verification and web footprint scoring
- **📊 Authenticity Score + PDF Report** - Clear scoring with evidence bundle for audits
- **🛒 Shopify App & Webhooks** - Automatic scanning of product images with UI indicators (green/yellow/red)
- **🌐 Browser Extension & Trust Badge** - Buyer-facing verification for increased merchant conversions
- **⚖️ Human Review Queue** - Admin dashboard for flagged items with audit logs and appeals

---

## 🏆 Why TrustLens Now?

### 📈 **Market Evidence**

- **Regulatory Pressure**: FTC and global regulators are cracking down on fake reviews and synthetic endorsements
- **Growing Market**: Deepfake/fake-image detection market showing large CAGR with rising enterprise budgets
- **Industry Support**: Major players (OpenAI, Google, Adobe) pushing C2PA/Content Credentials into mainstream
- **Massive Distribution**: Shopify/WooCommerce ecosystems provide viral adoption potential

### 🎯 **Unique Positioning**

Unlike single-problem solutions, TrustLens bundles:
- ✅ Multi-modal authenticity checks
- ✅ Provenance verification (C2PA + fallback detection)
- ✅ Product-claim consistency matching
- ✅ Seller identity verification
- ✅ Buyer-facing trust badges with conversion lift

---

## 🛠 Tech Stack

### **Backend**
- **Node.js + TypeScript** with Express/Fastify
- **PostgreSQL** with Prisma ORM
- **Redis** for caching and queue management
- **AWS S3** for file storage
- **BullMQ** for asynchronous processing

### **Frontend**
- **React + TypeScript** for dashboards
- **Tailwind CSS + shadcn/ui** for components
- **Vite** for build optimization
- **Zustand** for state management

### **Third-Party Integrations**
- **Sensity/Reality Defender** - Deepfake detection APIs
- **Truepic** - Verified capture & C2PA support
- **TinEye/Google** - Reverse image search
- **OpenAI** - Content analysis and narrative generation
- **Stripe** - Billing and subscription management
- **Twilio** - Identity verification

### **Infrastructure**
- **Docker + Kubernetes** for containerization
- **GitHub Actions** for CI/CD
- **Prometheus + Grafana** for monitoring
- **Sentry** for error tracking

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Docker & Docker Compose
- Git

### 1. Clone & Setup
```bash
git clone https://github.com/trustlens/trustlens.git
cd trustlens

# Install dependencies for all services
npm run setup

# Copy environment templates
cp .env.example .env
cp frontend/.env.example frontend/.env
cp api/.env.example api/.env
```

### 2. Configure Environment
Update `.env` files with your API keys:
```bash
# Core API Keys (get from respective providers)
OPENAI_API_KEY=your-openai-key
SENSITY_API_KEY=your-sensity-key
TRUEPIC_API_KEY=your-truepic-key

# Database & Redis
DATABASE_URL=postgresql://user:pass@localhost:5432/trustlens
REDIS_URL=redis://localhost:6379

# Stripe for billing
STRIPE_SECRET_KEY=sk_test_your-stripe-key
```

### 3. Start Development Environment
```bash
# Start all services with Docker Compose
docker-compose up -d

# Run database migrations
npm run db:migrate

# Seed test data
npm run db:seed

# Start development servers
npm run dev
```

### 4. Access the Application
- **Frontend Dashboard**: http://localhost:5173
- **API Documentation**: http://localhost:3001/docs
- **Admin Panel**: http://localhost:5173/admin

### 5. Test with Sample Data
```bash
# Upload test images for verification
curl -X POST http://localhost:3001/api/v1/uploads \
  -H "Authorization: Bearer your-api-key" \
  -F "file=@./test_images/genuine/product1.jpg"
```

---

## � Screenshots

### Dashboard Overview
*Professional analytics dashboard showing verification stats, trends, and recent activity*

![TrustLens Dashboard](./docs/images/dashboard-overview.png)

### Account Registration
*Clean, professional registration flow with company information*

![Registration Flow](./docs/images/account-registration.png)

### Settings & Preferences
*Comprehensive settings panel for notifications and account management*

![Settings Panel](./docs/images/settings-preferences.png)

---

## 🏗 Architecture

### Processing Pipeline
```
Upload → Validation → Queue → Metadata → pHash → Reverse Search 
→ Heuristics → Escalation → Deepfake → Identity → Scoring → Report
```

### Scoring Formula
```typescript
aggregated_score = round(100 * (
  0.25 * provenance_score +      // C2PA/metadata verification
  0.20 * visual_similarity +     // pHash + reverse image matching  
  0.20 * deepfake_neg_score +    // AI-generated content detection
  0.15 * seller_identity +       // KYC verification score
  0.10 * heuristics_score +      // Technical analysis
  0.10 * manual_override         // Human reviewer input
))
```

### Verdict Mapping
- **≥85 (Safe)**: ✅ "Verified Authentic" - Green badge
- **60-84 (Caution)**: ⚠️ "Caution - Unverified" - Yellow badge  
- **<60 (Suspect)**: ❌ "Suspect - Review Required" - Red badge

---

## 📊 Business Model & Pricing

### **Plans**
- **Free**: 10 checks/month, basic badge
- **Starter**: $49/month, 500 checks, Shopify app
- **Pro**: $299/month, 5,000 checks, priority queue, buyer badge
- **Enterprise**: $2,500-$30,000/month, custom integrations, SLA

### **Revenue Projections (6 months)**
- **Path A (Enterprise-first)**: 4 marketplaces × $20k = $80k + SMB = $100k/month
- **Path B (SMB-first)**: 1,010 merchants × $99 = $100k/month

---

## 🛒 Shopify Integration

### Installation
1. Visit [TrustLens on Shopify App Store](https://apps.shopify.com/trustlens)
2. Click "Add app" and authorize permissions
3. Configure verification settings in your admin panel
4. Add trust badge to product templates

### Features
- ✅ **Automatic Scanning** - New product images verified on upload
- ✅ **Product Metafields** - Verification status stored in Shopify
- ✅ **Trust Badges** - Embeddable widgets for storefronts
- ✅ **Merchant Dashboard** - Review results, request appeals
- ✅ **Webhook Integration** - Real-time status updates

---

## 🌐 Browser Extension

### Chrome Extension Features
- **Trust Badge Overlay** - Shows verification status on product pages
- **Quick Verification** - Right-click any image to verify
- **Merchant Insights** - View seller authenticity scores
- **Report Integration** - Link to detailed PDF reports

### Installation
```bash
# Install from Chrome Web Store
https://chrome.google.com/webstore/detail/trustlens/[extension-id]

# Or load unpacked for development
1. Open Chrome Extensions (chrome://extensions/)
2. Enable Developer Mode
3. Load unpacked: ./browser-extension/dist/
```
    <a href="#deployment">🚀 Deploy</a>
  </p>

  <img src="https://img.shields.io/badge/Node.js-18+-green" alt="Node.js">
  <img src="https://img.shields.io/badge/React-18+-blue" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5+-blue" alt="TypeScript">
  <img src="https://img.shields.io/badge/License-MIT-yellow" alt="License">
</div>

## 🌟 Features

### 🔍 **Content Verification Engine**
- **AI-Powered Analysis**: Advanced deepfake detection and authenticity verification
- **Multi-Format Support**: Images, videos, and documents
- **Real-time Processing**: Fast verification with detailed trust scores
- **Provenance Tracking**: C2PA metadata verification and chain of custody

### 🛒 **E-commerce Integrations**
- **Shopify App**: Seamless integration with automatic product verification
- **BigCommerce Plugin**: Native app with admin dashboard and analytics
- **Trust Badges**: Automatic badge injection for verified content
- **Webhook Support**: Real-time notifications and automation

### 📊 **Analytics & Reporting**
- **Comprehensive Dashboard**: Real-time verification statistics
- **Trust Score Analytics**: Detailed scoring and trend analysis
- **Bulk Operations**: Mass verification and badge management
- **Export Capabilities**: CSV/PDF reports for compliance

### 🔒 **Enterprise Security**
- **API Key Authentication**: Secure bearer token-based access
---

## 🔧 API Reference

### Authentication
```bash
# API Key Authentication
curl -H "Authorization: Bearer tl_live_your-api-key" \
     https://api.trustlens.com/v1/uploads
```

### Upload & Verify
```bash
POST /v1/uploads
Content-Type: multipart/form-data

# Response
{
  "upload_id": "uuid-123",
  "status": "pending", 
  "analysis_url": "https://api.trustlens.com/v1/analysis/uuid-123"
}
```

### Get Results
```bash
GET /v1/analysis/{upload_id}

# Response
{
  "upload_id": "uuid-123",
  "aggregated_score": 87,
  "verdict": "safe",
  "evidence": [...],
  "report_pdf_url": "https://s3.trustlens.com/reports/uuid-123.pdf"
}
```

### Webhooks
```bash
POST your-webhook-url
{
  "type": "analysis.complete",
  "data": {
    "upload_id": "uuid-123", 
    "aggregated_score": 87,
    "verdict": "safe"
  },
  "signature": "HMAC_SHA256..."
}
```

[📖 **Full API Documentation**](./docs/api.md)

---

## 🧪 Testing

### Run Test Suite
```bash
# Unit tests
npm run test:unit

# Integration tests (with mocked APIs)
npm run test:integration  

# End-to-end tests
npm run test:e2e

# Performance benchmarks
npm run test:perf
```

### Test Coverage
- ✅ **Unit Tests**: Scoring algorithms, pHash functions, DB models
- ✅ **Integration Tests**: Third-party API mocks, webhook delivery
- ✅ **E2E Tests**: Upload flow, Shopify app integration, admin review
- ✅ **Performance**: 100 checks/min, <5s latency (cheap path)

### Sample Test Data
```
test_images/
├── genuine/          # 20 authentic product photos with EXIF
├── stock_stolen/     # 10 images copied from other sites  
├── ai_generated/     # 10 clearly synthetic images
├── tampered/         # 5 photoshopped images
└── no_exif/         # 5 metadata-stripped images
```

---

## 🚀 Deployment

### Docker Compose (Local)
```bash
docker-compose up -d
```

### Kubernetes (Production)
```bash
# Apply manifests
kubectl apply -f k8s/

# Or use Helm
helm install trustlens ./helm-chart
```

### AWS Infrastructure
```bash
# Deploy with Terraform
cd terraform/
terraform init
terraform plan
terraform apply
```

### Environment Setup
- **Staging**: `npm run deploy:staging`
- **Production**: `npm run deploy:prod` (requires approval)

---

## 📈 Monitoring & Observability

### Metrics Dashboard
- **Requests/sec**: API endpoint throughput
- **Processing Latency**: Verification pipeline performance  
- **Error Rates**: Third-party API failures
- **Queue Length**: Background job backlog
- **Cost per Check**: Economic efficiency tracking

### Alerting
- 🚨 Error rate > 5% for 10 minutes
- 🚨 Queue backlog > 1000 jobs
- 🚨 Third-party API failures > 5%
- 🚨 Billing anomalies (unexpected usage spikes)

### Runbooks
- [Third-party API Down](./docs/runbooks/api-down.md)
- [Database Outage](./docs/runbooks/db-outage.md)
- [High Queue Backlog](./docs/runbooks/queue-backlog.md)

---

## 🔒 Security & Privacy

### Security Features
- 🔐 **TLS Everywhere** - All endpoints enforce HTTPS
- 🔑 **API Key Rotation** - Merchant keys are rotatable with scopes
- 🛡️ **Input Validation** - Strict MIME type and size restrictions
- 💾 **Encrypted Storage** - S3 encryption + database field encryption
- 📝 **Audit Logs** - All actions logged with actor tracking

### Privacy Compliance
- 🇪🇺 **GDPR Ready** - Right to deletion with audit trails
- 📊 **Data Retention** - Configurable retention (30/90/365 days)
- 🕵️ **PII Protection** - No sensitive data in logs
- 🔒 **Password Security** - Argon2 hashing with salts

### Data Processing
- 📍 **Region Compliance** - Data residency controls
- 🔄 **Data Minimization** - Only process necessary data
- 📋 **Processing Records** - GDPR Article 30 compliance
- 🚫 **No Vendor Lock-in** - Export your data anytime

---

## 📚 Documentation

### Developer Resources
- [📖 API Documentation](./docs/api.md)
- [🏗️ Architecture Guide](./docs/architecture.md)
- [🔌 Integration Examples](./docs/integrations/)
- [🧪 Testing Guide](./docs/testing.md)
- [🚀 Deployment Guide](./docs/deployment.md)

### Business Resources  
- [💰 Pricing Calculator](https://trustlens.com/pricing)
- [📊 ROI Analysis](./docs/roi-analysis.md)
- [⚖️ Compliance Guide](./docs/compliance.md)
- [📈 Case Studies](./docs/case-studies/)

### Shopify Merchants
- [⚡ Quick Start Guide](./docs/shopify-quickstart.md)
- [🎨 Badge Customization](./docs/badge-customization.md)
- [📞 Support & Troubleshooting](./docs/support.md)

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
```bash
git clone https://github.com/trustlens/trustlens.git
cd trustlens
npm run setup
npm run dev
```

### Contribution Areas
- 🐛 **Bug Fixes** - Help us squash bugs
- ✨ **New Features** - Propose and implement enhancements  
- 📚 **Documentation** - Improve guides and examples
- 🧪 **Testing** - Add test coverage
- 🌍 **Localization** - Add language support

---

## 📄 License

TrustLens is released under the [MIT License](LICENSE).

```
MIT License

Copyright (c) 2025 TrustLens

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software...
```

---

## 📞 Support & Contact

### Community Support
- 💬 [Discord Community](https://discord.gg/trustlens)
- 📋 [GitHub Discussions](https://github.com/trustlens/trustlens/discussions)
- 📚 [Documentation](https://docs.trustlens.com)

### Enterprise Support
- 📧 **Email**: enterprise@trustlens.com
- 📞 **Phone**: +1 (555) 123-4567
- 💼 **Sales**: sales@trustlens.com
- 🚨 **Security**: security@trustlens.com

### Business Hours
- **Support**: 24/7 for Enterprise customers
- **Sales**: Monday-Friday, 9 AM - 6 PM PST
- **Emergency**: Critical issues handled within 2 hours

---

## 🏆 Acknowledgments

Special thanks to:
- **C2PA Consortium** for content authentication standards
- **Truepic** for verified capture technology
- **Sensity AI** for deepfake detection capabilities
- **Shopify Partners** for app ecosystem support
- **Open Source Community** for foundational tools

---

## 🎯 Roadmap

### Q1 2025
- ✅ MVP Launch (Image verification, Shopify app)
- ✅ Browser extension beta
- 🔄 Enterprise API pilot program

### Q2 2025
- 📹 Video verification support
- 🌐 WooCommerce integration
- 📊 Advanced analytics dashboard
- 🔗 Marketplace API partnerships

### Q3 2025  
- 🤖 AI-powered content analysis
- 📱 Mobile app for merchants
- 🌍 International expansion
- 🏢 Enterprise white-label solutions

### Q4 2025
- 🔮 Predictive fraud detection
- 🎨 Creative content verification
- 🏪 Multi-platform marketplace integration
- 📈 IPO preparation

---

<div align="center">

**Ready to get started?**

[🚀 **Get Started**](https://trustlens.com/get-started) • [📞 **Contact Sales**](https://trustlens.com/contact) • [📚 **View Docs**](https://docs.trustlens.com)

---

⭐ **Star us on GitHub** if TrustLens helps secure your content!

*Made with ❤️ by the TrustLens team*

</div>
    ┌─────────▼────────┐ ┌─────▼─────┐ ┌────────▼────────┐
    │   Upload API     │ │  Analysis │ │   Admin Panel   │
    │   Webhooks       │ │  Pipeline │ │  Review Queue   │
    └─────────┬────────┘ └─────┬─────┘ └────────┬────────┘
              │                │                │
              └────────────────┼────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │    Processing       │
                    │    Queue (Redis)    │
                    └──────────┬──────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
┌───────▼──────┐ ┌─────────────▼─────────┐ ┌─────────▼──────┐
│   Metadata   │ │    Deepfake APIs      │ │  Reverse Image │
│  C2PA/EXIF   │ │ (Sensity/Reality Def) │ │  (TinEye/GCS)  │
└──────────────┘ └───────────────────────┘ └────────────────┘
```

## 📊 Revenue Model & Pricing

**Target: $100K MRR in 6 months**

### Pricing Tiers
- **Free**: 10 checks/month, basic badge
- **Starter**: $49/mo - 500 checks, Shopify app, basic reporting
- **Pro**: $299/mo - 5,000 checks, priority queue, buyer badge, analytics
- **Enterprise**: $2,500-$30,000/mo - full API, SLA, white-label, bulk pricing

### Revenue Path
- **Path A (Enterprise-first)**: 4 marketplaces × $20K/mo + 400 SMB × $50/mo = $100K/mo
- **Path B (SMB-first)**: 1,010 merchants × $99/mo = $100K/mo

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 14+
- Redis 6+

### Local Development Setup

```bash
# Clone repository
git clone https://github.com/your-org/trustlens-mvp.git
cd trustlens-mvp

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
# Edit .env with your API keys (see Environment Variables section)

# Start local services
docker-compose up -d

# Run database migrations
npm run db:migrate

# Seed test data
npm run db:seed

# Start development server
npm run dev

# In another terminal, start worker processes
npm run worker:dev
```

### Access Points
- **API Documentation**: http://localhost:3000/api/docs
- **Admin Dashboard**: http://localhost:3000/admin
- **Merchant Dashboard**: http://localhost:3000/merchant
- **Test Upload**: http://localhost:3000/test

### Running Tests

```bash
# Unit tests
npm test

# Integration tests (requires Docker services)
npm run test:integration

# End-to-end tests
npm run test:e2e

# Performance tests
npm run test:perf

# Test coverage
npm run test:coverage
```

## 🔧 Environment Variables

Create `.env` file with these variables:

```bash
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/trustlens"
REDIS_URL="redis://localhost:6379"

# API Keys (get from providers)
SENSITY_API_KEY="your_sensity_key_here"
TRUEPIC_API_KEY="your_truepic_key_here"
TINEYE_API_KEY="your_tineye_key_here"
GOOGLE_CUSTOM_SEARCH_KEY="your_google_key_here"
OPENAI_API_KEY="your_openai_key_here"

# AWS (for S3 storage)
AWS_ACCESS_KEY_ID="your_aws_access_key"
AWS_SECRET_ACCESS_KEY="your_aws_secret_key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="trustlens-uploads"

# Stripe (billing)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# App Configuration
NODE_ENV="development"
PORT=3000
JWT_SECRET="your_jwt_secret_256_bits"
API_RATE_LIMIT_PER_MINUTE=100

# Shopify App
SHOPIFY_API_KEY="your_shopify_api_key"
SHOPIFY_API_SECRET="your_shopify_api_secret"
SHOPIFY_WEBHOOK_SECRET="your_shopify_webhook_secret"

# Monitoring
SENTRY_DSN="your_sentry_dsn"
```

## 📱 API Usage Examples

### Upload and Analyze Image

```bash
curl -X POST http://localhost:3000/api/v1/uploads \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -F "file=@product-image.jpg" \
  -F "merchant_id=org-123"
```

Response:
```json
{
  "upload_id": "uuid-123",
  "status": "pending",
  "analysis_url": "https://api.trustlens.example/v1/analysis/uuid-123"
}
```

### Get Analysis Results

```bash
curl -X GET http://localhost:3000/api/v1/analysis/uuid-123 \
  -H "Authorization: Bearer YOUR_API_KEY"
```

Response:
```json
{
  "upload_id": "uuid-123",
  "merchant_id": "org-456",
  "aggregated_score": 85,
  "verdict": "safe",
  "evidence": [
    {"source": "c2pa", "result": "verified", "issuer": "truepic.com"},
    {"source": "phash", "result": {"matches": []}},
    {"source": "deepfake", "result": {"probability": 0.05}}
  ],
  "report_pdf_url": "https://s3.trustlens.example/reports/uuid-123.pdf",
  "analysis_version": "v1.0.0",
  "completed_at": "2025-08-12T12:23:00Z"
}
```

## 🛡️ Security & Privacy

### Data Protection
- TLS 1.3 for all communications
- AES-256 encryption for stored files
- PII encryption in database
- 90-day default data retention
- GDPR compliance with right to deletion

### Authentication
- API key authentication for merchants
- OAuth 2.0 + JWT for enterprise clients
- Role-based access control (RBAC)
- Rate limiting: 100 requests/minute default

### Compliance
- SOC 2 Type II ready architecture
- GDPR compliance built-in
- Audit logs for all actions
- Data residency controls

## 📈 Monitoring & Observability

### Metrics Tracked
- `requests_total` - Total API requests
- `processing_latency_seconds` - Analysis pipeline latency
- `thirdparty_api_errors_total` - External API failures
- `queue_length` - Processing queue backlog
- `checks_per_minute` - Throughput rate
- `avg_cost_per_check` - Cost optimization

### Alerting
- Error rate > 5% for 10 minutes
- Queue backlog > 1000 items
- Third-party API failure rate > 10%
- Unusual billing spikes

### Health Checks
- `/health` - Basic health endpoint
- `/health/deep` - Database and Redis connectivity
- `/health/dependencies` - Third-party API status

## 🚢 Deployment

### Staging Deployment

```bash
# Build and push images
npm run build:docker
npm run push:staging

# Deploy to staging cluster
kubectl apply -f k8s/staging/

# Run database migrations
kubectl exec -it deployment/trustlens-backend -- npm run db:migrate

# Verify deployment
curl https://staging-api.trustlens.com/health
```

### Production Deployment

```bash
# Deploy infrastructure (first time only)
cd terraform/
terraform init
terraform apply

# Deploy application
npm run deploy:prod

# Verify production deployment
curl https://api.trustlens.com/health
```

## 🧪 Test Dataset

The repository includes `test_images/` with labeled samples:

- `genuine/` - 20 authentic product photos with EXIF
- `stock_stolen/` - 10 images copied from other sites
- `ai_generated/` - 10 clearly synthetic images
- `tampered/` - 5 photoshopped images
- `no_exif/` - 5 metadata-stripped images

Run test suite against dataset:
```bash
npm run test:dataset
```

## 📋 Acceptance Criteria Checklist

- [ ] Upload image via API → analysis completes with score and evidence
- [ ] Shopify app receives webhook → creates analysis → updates product metafield
- [ ] Buyer badge displays correct color and links to report
- [ ] Suspect results appear in review queue → reviewer can override verdict
- [ ] Billing increments per check with overage calculation
- [ ] Pipeline continues when deepfake vendor is down (graceful degradation)
- [ ] System processes 100 checks/minute (performance test)
- [ ] All third-party APIs have fallback/retry logic
- [ ] GDPR deletion request removes all related data
- [ ] Audit logs capture all human actions

## 🗓️ 90-Day Roadmap

### Week 0-2: Foundation (Discovery & Infrastructure)
- [x] Finalize API specifications
- [x] Set up repository and Docker environment
- [x] Database schema and migrations
- [x] Basic authentication system

### Week 3-4: Core Backend (Processing Pipeline)
- [x] Upload API and file storage
- [x] Redis queue and worker processes
- [x] Metadata extraction (EXIF, C2PA)
- [x] pHash and similarity matching
- [x] Scoring algorithm implementation

### Week 5-6: Third-Party Integrations
- [x] Sensity/Reality Defender deepfake detection
- [x] TinEye/Google reverse image search
- [x] TruePic verified capture integration
- [x] Error handling and fallback logic

### Week 7-8: Shopify Integration
- [x] Shopify app authentication
- [x] Product webhook handling
- [x] Metafield updates and badge rendering
- [x] Merchant dashboard for review

### Week 9-10: Admin & Billing
- [x] Human review queue interface
- [x] Stripe billing integration
- [x] Usage tracking and overages
- [x] Audit logging system

### Week 11-12: Testing & Polish
- [x] Comprehensive test suite
- [x] Performance optimization
- [x] Documentation and deployment guides
- [x] Staging environment setup

## 🎯 Marketing Copy (Shopify App Store)

### App Title
**TrustLens: Product Authenticity Verification**

### Tagline
*Build customer trust with AI-powered product authenticity verification*

### Description
Protect your brand and boost conversions with TrustLens - the only app that automatically verifies your product images and builds customer trust with authenticity badges.

**Key Benefits:**
✅ **Stop Counterfeits**: Detect stolen or manipulated product images
✅ **Build Trust**: Show customers your products are verified authentic
✅ **Increase Sales**: Verified products convert 23% better
✅ **Stay Compliant**: Meet marketplace authenticity requirements

**How It Works:**
1. **Automatic Scanning**: Every product image gets verified using AI
2. **Authenticity Score**: Get detailed reports on image provenance
3. **Trust Badges**: Display verification badges to customers
4. **Review Dashboard**: Manage flagged items with human oversight

**Perfect For:**
- Fashion and luxury brands
- Electronics and tech products
- Art and collectibles
- Any store wanting to build customer trust

**Pricing:**
- Free: 10 verifications/month
- Starter: $49/month for 500 verifications
- Pro: $299/month for 5,000 verifications

Start your free trial today!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: https://docs.trustlens.com
- **Support Email**: support@trustlens.com
- **Slack Community**: https://trustlens.slack.com
- **GitHub Issues**: https://github.com/your-org/trustlens-mvp/issues

---

Built with ❤️ by the TrustLens Team
