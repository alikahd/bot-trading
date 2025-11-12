@echo off
echo ========================================
echo   Netlify Deployment Script
echo ========================================
echo.

echo [1/3] Building project...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)
echo Build completed successfully!
echo.

echo [2/3] Checking Netlify CLI...
where netlify >nul 2>nul
if %errorlevel% neq 0 (
    echo Netlify CLI not found. Installing...
    call npm install -g netlify-cli
)
echo.

echo [3/3] Deploying to Netlify...
echo.
echo Choose deployment type:
echo 1. Draft deploy (preview)
echo 2. Production deploy
echo.
set /p choice="Enter your choice (1 or 2): "

if "%choice%"=="1" (
    echo Deploying draft...
    call netlify deploy
) else if "%choice%"=="2" (
    echo Deploying to production...
    call netlify deploy --prod
) else (
    echo Invalid choice!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Deployment completed!
echo ========================================
pause
