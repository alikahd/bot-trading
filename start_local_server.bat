@echo off
echo ========================================
echo   IQ Option Bot - Local Server
echo ========================================
echo.

REM التحقق من Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python غير مثبت!
    echo يرجى تثبيت Python من: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo [1/3] بدء السيرفر المحلي...
echo.

REM تشغيل السيرفر
start "IQ Option Server" cmd /k "python iqoption_unofficial_server.py"

echo [2/3] انتظار بدء السيرفر...
timeout /t 5 /nobreak >nul

echo.
echo [3/3] السيرفر يعمل الآن على: http://localhost:5000
echo.
echo ========================================
echo   الخطوة التالية:
echo ========================================
echo.
echo 1. افتح terminal جديد
echo 2. شغل الأمر: cloudflared tunnel --url http://localhost:5000
echo 3. انسخ الـ URL الذي سيظهر
echo 4. ضعه في src/config/serverConfig.ts
echo.
echo اضغط أي زر للخروج...
pause >nul
