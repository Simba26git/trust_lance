#!/bin/bash

# 🚀 TrustLens Production Build Script

echo "🚀 Building TrustLens for Production..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+${NC}"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version 18+ required. Current version: $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js version: $(node -v)${NC}"

# Create production directory
echo -e "${BLUE}📁 Creating production build directory...${NC}"
mkdir -p dist/
rm -rf dist/*

# Build Frontend
echo -e "${BLUE}🏗️  Building Frontend...${NC}"
cd frontend
echo -e "${YELLOW}Installing frontend dependencies...${NC}"
npm ci --only=production
echo -e "${YELLOW}Building React application...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend build successful${NC}"
    cp -r dist/* ../dist/
else
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi

cd ..

# Prepare API for production
echo -e "${BLUE}🔧 Preparing API for production...${NC}"
cd api
echo -e "${YELLOW}Installing API dependencies...${NC}"
npm ci --only=production

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ API dependencies installed${NC}"
    mkdir -p ../dist/api
    cp -r * ../dist/api/
    cp package*.json ../dist/api/
else
    echo -e "${RED}❌ API setup failed${NC}"
    exit 1
fi

cd ..

# Create production environment file
echo -e "${BLUE}⚙️  Creating production configuration...${NC}"
cp .env.production dist/.env

# Create production package.json
cat > dist/package.json << EOF
{
  "name": "trustlens-production",
  "version": "1.0.0",
  "description": "TrustLens Production Build",
  "main": "api/server.js",
  "scripts": {
    "start": "cd api && node server.js",
    "install-api": "cd api && npm install --only=production"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=8.0.0"
  }
}
EOF

# Create startup script
cat > dist/start.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting TrustLens Production Server..."

# Install API dependencies if node_modules doesn't exist
if [ ! -d "api/node_modules" ]; then
    echo "📦 Installing API dependencies..."
    cd api && npm install --only=production && cd ..
fi

# Set production environment
export NODE_ENV=production

# Start the API server
echo "🔥 Starting API server..."
cd api && node server.js
EOF

chmod +x dist/start.sh

# Create README for production deployment
cat > dist/README.md << 'EOF'
# 🚀 TrustLens Production Deployment

## Quick Start

1. **Install dependencies:**
   ```bash
   npm run install-api
   ```

2. **Configure environment:**
   - Update `.env` with your production settings
   - Set database URLs, API keys, etc.

3. **Start the server:**
   ```bash
   npm start
   # OR
   ./start.sh
   ```

## Deployment Options

### Option 1: Traditional Server
- Upload files to your server
- Run `./start.sh`
- Configure reverse proxy (nginx)

### Option 2: Docker
- Build: `docker build -t trustlens .`
- Run: `docker run -p 3001:3001 trustlens`

### Option 3: Cloud Platforms
- **Railway**: `railway deploy`
- **Render**: Connect GitHub repo
- **Heroku**: `git push heroku main`

## Configuration

Update `.env` file with:
- Database credentials
- API keys
- Domain settings
- Email configuration

## Frontend Deployment

The built frontend is in the root directory. Deploy to:
- **Vercel**: `vercel deploy`
- **Netlify**: Drag & drop to dashboard
- **AWS S3**: Upload to S3 bucket

## Support

Visit: https://trustlens.com/contact
EOF

# Create production Dockerfile
cat > dist/Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Copy production build
COPY . .

# Install API dependencies
RUN cd api && npm install --only=production

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start the application
CMD ["npm", "start"]
EOF

# Create docker-compose for easy deployment
cat > dist/docker-compose.yml << 'EOF'
version: '3.8'

services:
  trustlens-api:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
    volumes:
      - ./uploads:/app/api/uploads
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl
    depends_on:
      - trustlens-api
    restart: unless-stopped
EOF

# Build summary
echo ""
echo -e "${GREEN}🎉 TrustLens Production Build Complete!${NC}"
echo ""
echo -e "${BLUE}📊 Build Summary:${NC}"
echo -e "   📁 Location: $(pwd)/dist/"
echo -e "   🌐 Frontend: Static files ready for CDN"
echo -e "   🔧 API: Node.js server ready for deployment"
echo -e "   📝 Docs: Complete deployment instructions included"
echo ""
echo -e "${YELLOW}🚀 Next Steps:${NC}"
echo -e "   1. Update dist/.env with production settings"
echo -e "   2. Deploy frontend to Vercel/Netlify"
echo -e "   3. Deploy API to Railway/Render"
echo -e "   4. Configure domain and SSL"
echo ""
echo -e "${GREEN}✨ TrustLens is ready for launch! ✨${NC}"
