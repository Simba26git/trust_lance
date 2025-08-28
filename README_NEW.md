# TrustLens - AI-Powered Content Verification Platform

<div align="center">
  <img src="https://raw.githubusercontent.com/Simba26git/trust_lance/main/assets/logo.png" alt="TrustLens Logo" width="120" height="120">
  
  **Personal Project: AI-Powered Content Verification**
  
  *A learning project exploring AI-powered tools to verify content authenticity. Detect deepfakes, validate provenance, and ensure media integrity.*

  [![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
  [![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/Simba26git/trust_lance)
  [![Personal Project](https://img.shields.io/badge/project-personal-orange.svg)](https://github.com/Simba26git/trust_lance)

  [Get Started](#quick-start) • [Documentation](./docs) • [Live Demo](http://localhost:5173)
</div>

---

## 🚀 What is TrustLens?

TrustLens is a **personal learning project** exploring AI-powered authenticity & product-content verification for e-commerce platforms. It demonstrates how to build a system that scans product listings, user content, and uploads to produce verifiable authenticity scores and provenance reports.

### 🎯 **Features Implemented**

- **🔍 Image & Video Authenticity Scan** - Multi-check pipeline with metadata (EXIF/C2PA), perceptual hashing (pHash), deepfake detection
- **🔄 Product-Image Matching** - Reverse-image search and catalog-match scoring to detect mismatched/stolen images
- **✅ Basic Identity Checks** - Email/phone verification and web footprint scoring concepts
- **📊 Authenticity Score + PDF Report** - Clear scoring with evidence bundle
- **🛒 Shopify App Prototype** - Demonstration of automatic scanning with UI indicators
- **🌐 Browser Extension Demo** - Trust badge proof-of-concept for buyers
- **⚖️ Human Review Queue** - Admin dashboard for flagged items with audit logs

---

## 🏆 Why This Project?

### 📈 **Learning Goals**

- **AI Integration**: Understanding how to integrate multiple AI services (deepfake detection, content analysis)
- **E-commerce APIs**: Working with Shopify/WooCommerce webhooks and app development
- **Microservices**: Building scalable backend services with queues and workers
- **Modern Frontend**: React + TypeScript with professional UI components
- **DevOps**: Docker, Kubernetes, CI/CD pipelines

### 🎯 **Technical Exploration**

This project explores:
- ✅ Multi-modal content verification techniques
- ✅ C2PA provenance standards implementation
- ✅ Product consistency matching algorithms
- ✅ Browser extension development
- ✅ Real-time webhook processing

---

## 🛠 Tech Stack

### **Backend**
- **Node.js + TypeScript** with Express
- **PostgreSQL** with Prisma ORM
- **Redis** for caching and queue management
- **AWS S3** for file storage
- **BullMQ** for asynchronous processing

### **Frontend**
- **React + TypeScript** for dashboards
- **Tailwind CSS + shadcn/ui** for components
- **Vite** for build optimization
- **Zustand** for state management

### **Third-Party Integrations (Demo)**
- **Sensity/Reality Defender** - Deepfake detection APIs
- **Truepic** - Verified capture & C2PA support
- **TinEye/Google** - Reverse image search
- **OpenAI** - Content analysis and narrative generation
- **Stripe** - Billing system demonstration

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
git clone https://github.com/Simba26git/trust_lance.git
cd trust_lance

# Install dependencies for all services
npm run setup

# Copy environment templates
cp .env.example .env
cp frontend/.env.example frontend/.env
cp api/.env.example api/.env
```

### 2. Configure Environment
Update `.env` files with your API keys (for demo purposes):
```bash
# Core API Keys (get from respective providers for testing)
OPENAI_API_KEY=your-openai-key
SENSITY_API_KEY=your-sensity-key
TRUEPIC_API_KEY=your-truepic-key

# Database & Redis (local development)
DATABASE_URL=postgresql://user:pass@localhost:5432/trustlens
REDIS_URL=redis://localhost:6379

# Stripe for billing demo
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

## 📱 Screenshots

### Dashboard Overview
*Analytics dashboard showing verification stats and activity*

![TrustLens Dashboard](./docs/images/dashboard-overview.png)

### Account Registration
*User registration flow*

![Registration Flow](./docs/images/account-registration.png)

### Settings Panel
*Application settings and preferences*

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

## 🛒 Shopify Integration Demo

### Features Demonstrated
- ✅ **Automatic Scanning** - Product image verification simulation
- ✅ **Product Metafields** - Verification status storage concept
- ✅ **Trust Badges** - Embeddable widget prototypes
- ✅ **Merchant Dashboard** - Results review interface
- ✅ **Webhook Integration** - Real-time status updates

---

## 🌐 Browser Extension

### Chrome Extension Demo
- **Trust Badge Overlay** - Shows verification status concept
- **Quick Verification** - Right-click verification prototype
- **Report Integration** - Links to detailed reports

### Development Installation
```bash
# Load unpacked for development
1. Open Chrome Extensions (chrome://extensions/)
2. Enable Developer Mode
3. Load unpacked: ./browser-extension/dist/
```

---

## 🔧 API Reference

### Authentication
```bash
# API Key Authentication
curl -H "Authorization: Bearer demo-api-key" \
     http://localhost:3001/v1/uploads
```

### Upload & Verify
```bash
POST /v1/uploads
Content-Type: multipart/form-data

# Response
{
  "upload_id": "uuid-123",
  "status": "pending", 
  "analysis_url": "http://localhost:3001/v1/analysis/uuid-123"
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
  "report_pdf_url": "http://localhost:3001/reports/uuid-123.pdf"
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

### Sample Test Data
```
test_images/
├── genuine/          # 20 authentic product photos
├── stock_stolen/     # 10 images from other sites  
├── ai_generated/     # 10 synthetic images
├── tampered/         # 5 photoshopped images
└── no_exif/         # 5 metadata-stripped images
```

---

## 🚀 Deployment

### Docker Compose (Local)
```bash
docker-compose up -d
```

### Kubernetes (Learning)
```bash
# Apply manifests
kubectl apply -f k8s/

# Or use Helm
helm install trustlens ./helm-chart
```

### AWS Infrastructure (Demo)
```bash
# Deploy with Terraform
cd terraform/
terraform init
terraform plan
terraform apply
```

---

## 📈 Monitoring & Observability

### Metrics Tracked
- **Requests/sec**: API endpoint throughput
- **Processing Latency**: Verification pipeline performance  
- **Error Rates**: Third-party API failures
- **Queue Length**: Background job backlog

### Development Alerts
- 🚨 Error rate > 5% for 10 minutes
- 🚨 Queue backlog > 1000 jobs
- 🚨 API failures > 5%

---

## 🔒 Security Features

### Implementation
- 🔐 **TLS Everywhere** - All endpoints enforce HTTPS
- 🔑 **API Key Management** - Rotatable keys with scopes
- 🛡️ **Input Validation** - Strict file type and size restrictions
- 💾 **Encrypted Storage** - S3 and database encryption
- 📝 **Audit Logs** - Action tracking

### Privacy Considerations
- 📊 **Data Retention** - Configurable retention periods
- 🕵️ **PII Protection** - No sensitive data in logs
- 🔒 **Password Security** - Proper hashing implementations

---

## 📚 Project Structure

```
trust_lance/
├── frontend/           # React dashboard
├── api/               # Node.js backend
├── browser-extension/ # Chrome extension
├── plugins/           # Shopify/WooCommerce apps
├── k8s/              # Kubernetes manifests
├── terraform/        # Infrastructure as code
├── test_images/      # Sample verification data
├── docs/             # Documentation
└── scripts/          # Utility scripts
```

---

## 🤝 Learning & Contributing

This is a personal learning project, but feedback and suggestions are welcome!

### Development Setup
```bash
git clone https://github.com/Simba26git/trust_lance.git
cd trust_lance
npm run setup
npm run dev
```

### Areas Explored
- 🐛 **AI Integration** - Working with multiple AI APIs
- ✨ **E-commerce Platforms** - Shopify/WooCommerce development  
- 📚 **Content Verification** - C2PA, metadata, deepfake detection
- 🧪 **Modern Web Development** - React, TypeScript, Node.js
- 🌍 **DevOps** - Docker, Kubernetes, CI/CD

---

## 📄 License

This project is released under the [MIT License](LICENSE).

```
MIT License

Copyright (c) 2025 Simba26git

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
```

---

## 🎯 Learning Roadmap

### ✅ Completed
- MVP Implementation (Image verification, basic UI)
- Shopify app prototype
- Browser extension demo
- Backend API with authentication

### 🔄 Currently Learning
- Advanced AI model integration
- Real-time webhook processing
- Performance optimization
- Security best practices

### 🎯 Future Exploration
- Video verification techniques
- Mobile app development
- Advanced analytics
- Marketplace integrations

---

## 🏆 Acknowledgments

Learning resources and inspiration from:
- **C2PA Consortium** for content authentication standards
- **Shopify Developers** for app development guides
- **Open Source Community** for foundational tools
- **AI/ML Community** for detection techniques

---

<div align="center">

**This is a personal learning project**

[🚀 **Try it locally**](#quick-start) • [📚 **Read the docs**](./docs) • [🤝 **Suggest improvements**](https://github.com/Simba26git/trust_lance/issues)

---

⭐ **Star this repo** if you find the implementation interesting!

*Built as a learning exercise by [Simba26git](https://github.com/Simba26git)*

</div>
