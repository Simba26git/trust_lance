@echo off
setlocal enabledelayedexpansion

echo 🚀 Building TrustLens for Production...

:: Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 18+
    exit /b 1
)

echo ✅ Node.js version: 
node --version

:: Create production directory
echo 📁 Creating production build directory...
if exist dist rmdir /s /q dist
mkdir dist

:: Build Frontend
echo 🏗️  Building Frontend...
cd frontend
echo Installing frontend dependencies...
call npm ci --only=production
if errorlevel 1 (
    echo ❌ Frontend dependencies installation failed
    exit /b 1
)

echo Building React application...
call npm run build
if errorlevel 1 (
    echo ❌ Frontend build failed
    exit /b 1
)

echo ✅ Frontend build successful
xcopy /s /e /i dist ..\dist

cd ..

:: Prepare API for production
echo 🔧 Preparing API for production...
cd api
echo Installing API dependencies...
call npm ci --only=production
if errorlevel 1 (
    echo ❌ API setup failed
    exit /b 1
)

echo ✅ API dependencies installed
mkdir ..\dist\api
xcopy /s /e /i * ..\dist\api\
copy package*.json ..\dist\api\

cd ..

:: Create production environment file
echo ⚙️  Creating production configuration...
copy .env.production dist\.env

:: Create production package.json
echo Creating production package.json...
(
echo {
echo   "name": "trustlens-production",
echo   "version": "1.0.0",
echo   "description": "TrustLens Production Build",
echo   "main": "api/server.js",
echo   "scripts": {
echo     "start": "cd api && node server.js",
echo     "install-api": "cd api && npm install --only=production"
echo   },
echo   "engines": {
echo     "node": ">=18.0.0",
echo     "npm": ">=8.0.0"
echo   }
echo }
) > dist\package.json

:: Create startup script
echo Creating startup script...
(
echo @echo off
echo echo 🚀 Starting TrustLens Production Server...
echo.
echo if not exist "api\node_modules" ^(
echo     echo 📦 Installing API dependencies...
echo     cd api
echo     call npm install --only=production
echo     cd ..
echo ^)
echo.
echo set NODE_ENV=production
echo.
echo echo 🔥 Starting API server...
echo cd api
echo node server.js
) > dist\start.bat

:: Create production README
echo Creating deployment README...
(
echo # 🚀 TrustLens Production Deployment
echo.
echo ## Quick Start
echo.
echo 1. **Install dependencies:**
echo    ```bash
echo    npm run install-api
echo    ```
echo.
echo 2. **Configure environment:**
echo    - Update `.env` with your production settings
echo    - Set database URLs, API keys, etc.
echo.
echo 3. **Start the server:**
echo    ```bash
echo    npm start
echo    # OR on Windows
echo    start.bat
echo    ```
echo.
echo ## Production Configuration
echo.
echo Update `.env` file with:
echo - Database credentials
echo - API keys  
echo - Domain settings
echo - Email configuration
echo.
echo ## Frontend Deployment
echo.
echo The built frontend files are ready for CDN deployment:
echo - **Vercel**: `vercel deploy`
echo - **Netlify**: Drag ^& drop to dashboard
echo - **AWS S3**: Upload to S3 bucket
echo.
echo ## API Deployment
echo.
echo Deploy the API to:
echo - **Railway**: `railway deploy`
echo - **Render**: Connect GitHub repo
echo - **Heroku**: `git push heroku main`
echo.
echo ## Support
echo.
echo Visit: https://trustlens.com/contact
) > dist\README.md

:: Build summary
echo.
echo 🎉 TrustLens Production Build Complete!
echo.
echo 📊 Build Summary:
echo    📁 Location: %cd%\dist\
echo    🌐 Frontend: Static files ready for CDN
echo    🔧 API: Node.js server ready for deployment  
echo    📝 Docs: Complete deployment instructions included
echo.
echo 🚀 Next Steps:
echo    1. Update dist\.env with production settings
echo    2. Deploy frontend to Vercel/Netlify
echo    3. Deploy API to Railway/Render
echo    4. Configure domain and SSL
echo.
echo ✨ TrustLens is ready for launch! ✨

pause
