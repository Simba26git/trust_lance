# TrustLens - Complete Deployment Guide

## Overview
TrustLens is a comprehensive content verification platform with React frontend, Express.js API, and e-commerce platform integrations.

## Architecture
```
trust_lance/
├── frontend/           # React + TypeScript frontend
├── api/               # Express.js API server
├── plugins/
│   ├── shopify/       # Shopify app integration
│   └── bigcommerce/   # BigCommerce app integration
└── deploy/            # Deployment configurations
```

## Prerequisites

### Required Software
- Node.js 18+ (https://nodejs.org/)
- npm or yarn package manager
- Git (https://git-scm.com/)

### Required Accounts
- Shopify Partner Account (https://partners.shopify.com/)
- BigCommerce Developer Account (https://developer.bigcommerce.com/)
- Domain/hosting provider for deployment

## Environment Variables

### Core API (.env in /api directory)
```bash
# Server Configuration
PORT=3001
NODE_ENV=production
API_BASE_URL=https://your-domain.com/api

# API Security
API_KEY=tl_live_key_your_secure_key_here
JWT_SECRET=your_jwt_secret_here
WEBHOOK_SECRET=your_webhook_secret_here

# File Upload Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_TYPES=image/jpeg,image/png,image/webp

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Database (Optional - currently using in-memory storage)
# DATABASE_URL=postgresql://user:password@localhost:5432/trustlens
```

### Frontend (.env in /frontend directory)
```bash
VITE_API_BASE_URL=https://your-domain.com/api
VITE_APP_NAME=TrustLens
VITE_APP_VERSION=1.0.0
```

### Shopify Plugin (.env in /plugins/shopify directory)
```bash
# Shopify App Configuration
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_api_secret
SHOPIFY_SCOPES=read_products,write_products,read_orders
SHOPIFY_APP_URL=https://your-domain.com/shopify

# TrustLens Integration
TRUSTLENS_API_URL=https://your-domain.com/api
TRUSTLENS_API_KEY=tl_live_key_your_secure_key_here

# Server Configuration
PORT=3002
SESSION_SECRET=your_session_secret_here
```

### BigCommerce Plugin (.env in /plugins/bigcommerce directory)
```bash
# BigCommerce App Configuration
BC_CLIENT_ID=your_bigcommerce_client_id
BC_CLIENT_SECRET=your_bigcommerce_client_secret
BC_APP_URL=https://your-domain.com/bigcommerce

# TrustLens Integration
TRUSTLENS_API_URL=https://your-domain.com/api
TRUSTLENS_API_KEY=tl_live_key_your_secure_key_here

# Server Configuration
PORT=3003
```

## Local Development Setup

### 1. Clone and Install Dependencies
```bash
git clone <your-repo-url>
cd trust_lance

# Install API dependencies
cd api
npm install
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..

# Install Shopify plugin dependencies
cd plugins/shopify
npm install
cd ../..

# Install BigCommerce plugin dependencies
cd plugins/bigcommerce
npm install
cd ../..
```

### 2. Create Environment Files
Create `.env` files in each directory using the templates above.

### 3. Start Development Servers
```bash
# Terminal 1: Start API server
cd api
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev

# Terminal 3: Start Shopify plugin (optional)
cd plugins/shopify
npm run dev

# Terminal 4: Start BigCommerce plugin (optional)
cd plugins/bigcommerce
npm run dev
```

### 4. Access Applications
- Frontend: http://localhost:5173
- API: http://localhost:3001
- Shopify Plugin: http://localhost:3002
- BigCommerce Plugin: http://localhost:3003

## Production Deployment

### Option 1: Traditional VPS/Server

#### 1. Server Setup
```bash
# Ubuntu/Debian server setup
sudo apt update
sudo apt install nginx nodejs npm git certbot python3-certbot-nginx

# Install PM2 for process management
sudo npm install -g pm2
```

#### 2. Clone and Setup
```bash
git clone <your-repo-url> /var/www/trustlens
cd /var/www/trustlens

# Install dependencies for all services
cd api && npm install && cd ..
cd frontend && npm install && npm run build && cd ..
cd plugins/shopify && npm install && cd ../..
cd plugins/bigcommerce && npm install && cd ../..
```

#### 3. PM2 Configuration
Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [
    {
      name: 'trustlens-api',
      script: './api/server.js',
      cwd: '/var/www/trustlens',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    },
    {
      name: 'trustlens-shopify',
      script: './plugins/shopify/server.js',
      cwd: '/var/www/trustlens',
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      }
    },
    {
      name: 'trustlens-bigcommerce',
      script: './plugins/bigcommerce/server.js',
      cwd: '/var/www/trustlens',
      env: {
        NODE_ENV: 'production',
        PORT: 3003
      }
    }
  ]
};
```

#### 4. Nginx Configuration
Create `/etc/nginx/sites-available/trustlens`:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend (static files)
    location / {
        root /var/www/trustlens/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Shopify plugin proxy
    location /shopify/ {
        proxy_pass http://localhost:3002/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # BigCommerce plugin proxy
    location /bigcommerce/ {
        proxy_pass http://localhost:3003/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### 5. SSL Setup
```bash
# Enable site and get SSL certificate
sudo ln -s /etc/nginx/sites-available/trustlens /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d your-domain.com
```

#### 6. Start Services
```bash
cd /var/www/trustlens
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Option 2: Docker Deployment

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - api

  api:
    build:
      context: ./api
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
    volumes:
      - ./uploads:/app/uploads

  shopify-plugin:
    build:
      context: ./plugins/shopify
      dockerfile: Dockerfile
    ports:
      - "3002:3002"
    environment:
      - NODE_ENV=production
      - PORT=3002
    depends_on:
      - api

  bigcommerce-plugin:
    build:
      context: ./plugins/bigcommerce
      dockerfile: Dockerfile
    ports:
      - "3003:3003"
    environment:
      - NODE_ENV=production
      - PORT=3003
    depends_on:
      - api
```

### Option 3: Cloud Platform Deployment

#### Vercel (Frontend only)
```bash
cd frontend
npx vercel --prod
```

#### Railway (Full stack)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy each service
railway login
railway new trustlens-api
railway new trustlens-frontend
railway new trustlens-shopify
railway new trustlens-bigcommerce
```

#### Heroku (Each service separately)
```bash
# API
cd api
heroku create trustlens-api
git subtree push --prefix=api heroku master

# Shopify Plugin
cd plugins/shopify
heroku create trustlens-shopify
git subtree push --prefix=plugins/shopify heroku master

# BigCommerce Plugin
cd plugins/bigcommerce
heroku create trustlens-bigcommerce
git subtree push --prefix=plugins/bigcommerce heroku master
```

## E-commerce Platform Setup

### Shopify App Registration

1. **Create Shopify Partner Account**
   - Visit https://partners.shopify.com/
   - Create account and verify email

2. **Create New App**
   - Go to Apps > Create app > Public app
   - App name: "TrustLens Content Verification"
   - App URL: `https://your-domain.com/shopify`
   - Allowed redirection URL(s): `https://your-domain.com/shopify/auth/callback`

3. **Configure App Settings**
   - App setup: `https://your-domain.com/shopify/auth/callback`
   - GDPR webhooks: Configure as needed
   - Scopes: `read_products`, `write_products`, `read_orders`

4. **Get Credentials**
   - Copy API key and API secret key to Shopify plugin `.env`

### BigCommerce App Registration

1. **Create BigCommerce Developer Account**
   - Visit https://developer.bigcommerce.com/
   - Create account and apply for app approval

2. **Create New App**
   - Go to My Apps > Create an App
   - App name: "TrustLens Content Verification"
   - Auth callback URL: `https://your-domain.com/bigcommerce/auth/callback`
   - Load callback URL: `https://your-domain.com/bigcommerce/dashboard`
   - Uninstall callback URL: `https://your-domain.com/bigcommerce/uninstall`

3. **Configure Scopes**
   - Products: Read/Write
   - Store Information: Read
   - Webhooks: Read/Write (for auto-verification)

4. **Get Credentials**
   - Copy client ID and client secret to BigCommerce plugin `.env`

## Testing

### API Testing
```bash
# Test API health
curl https://your-domain.com/api/health

# Test verification endpoint
curl -X POST https://your-domain.com/api/v1/verify \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/image.jpg","type":"image"}'
```

### Plugin Testing
1. Install apps in test stores
2. Verify webhook delivery
3. Test verification workflows
4. Check trust badge display

## Monitoring and Logs

### PM2 Monitoring
```bash
pm2 status
pm2 logs trustlens-api
pm2 restart all
```

### Log Locations
- API logs: `/var/www/trustlens/api/logs/`
- Nginx logs: `/var/log/nginx/`
- PM2 logs: `~/.pm2/logs/`

## Troubleshooting

### Common Issues

1. **API Key Authentication Fails**
   - Check API key format in requests
   - Verify environment variables are loaded

2. **Webhook Delivery Fails**
   - Check firewall settings
   - Verify webhook URLs are accessible
   - Check webhook secret configuration

3. **Plugin Installation Fails**
   - Verify app URLs are correct
   - Check OAuth callback configuration
   - Ensure SSL certificates are valid

4. **File Upload Issues**
   - Check upload directory permissions
   - Verify file size limits
   - Check disk space

### Support

For deployment issues or questions:
- Check logs for specific error messages
- Verify all environment variables are set
- Test API endpoints individually
- Contact platform support for app approval issues

## Security Checklist

- [ ] All API keys are secure and rotated regularly
- [ ] HTTPS is enabled for all services
- [ ] Webhook secrets are configured
- [ ] Rate limiting is enabled
- [ ] File upload restrictions are in place
- [ ] Database access is secured (if using external DB)
- [ ] Error messages don't expose sensitive information
- [ ] CORS is properly configured
- [ ] Input validation is implemented
