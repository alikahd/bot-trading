@echo off
title IQ Option Trading Bot - Real Data
color 0A

echo ========================================
echo   📊 IQ Option Trading Bot
echo   Real Data - No Simulation
echo ========================================
echo.
echo ✅ Data Source: IQ Option API (Real)
echo ❌ Simulation: DISABLED
echo.
echo System will start:
echo 1. IQ Option API Server (Port 5001)
echo 2. Trading Bot Interface (Port 5173)
echo.
echo ⚠️ Requirements:
echo - pip install iqoptionapi (already done)
echo - IQ Option credentials configured
echo - Internet connection
echo.
pause

echo.
echo [1/2] Starting IQ Option API Server...
start "IQ Option Real Data API" cmd /k "python iqoption_unofficial_server.py"
timeout /t 5

echo [2/2] Starting Trading Bot Interface...
start "Trading Bot" cmd /k "npm run dev"
timeout /t 3

echo.
echo ========================================
echo ✅ System Started Successfully!
echo ========================================
echo.
echo 🌐 Trading Interface: http://localhost:5173
echo 📊 IQ Option API: http://localhost:5001
echo.
echo Check for these messages:
echo   ✅ "تم الاتصال بـ IQ Option بنجاح"
echo   ✅ "تم تحديث X سعر من IQ Option"
echo.
echo If you see them, you're using REAL IQ Option data!
echo.
pause
start http://localhost:5173
