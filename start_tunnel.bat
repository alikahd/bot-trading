@echo off
echo ========================================
echo   Cloudflare Tunnel Starter
echo ========================================
echo.

REM التحقق من cloudflared
cloudflared --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] cloudflared غير مثبت!
    echo.
    echo يرجى تثبيته باستخدام:
    echo   choco install cloudflared
    echo.
    echo أو تحميله من:
    echo   https://github.com/cloudflare/cloudflared/releases
    echo.
    pause
    exit /b 1
)

echo [INFO] بدء Cloudflare Tunnel...
echo.
echo ========================================
echo   سيظهر URL مثل:
echo   https://random-name.trycloudflare.com
echo ========================================
echo.
echo [مهم] انسخ هذا الـ URL وضعه في:
echo        src/config/serverConfig.ts
echo.
echo ========================================
echo.

REM بدء tunnel
cloudflared tunnel --url http://localhost:5000

pause
