@echo off
echo ========================================
echo حذف البيئة الافتراضية نهائياً
echo ========================================

echo.
echo ⚠️ تحذير: هذا سيحذف البيئة الافتراضية نهائياً!
echo سيتم حذف مجلد .venv وجميع المكتبات المثبتة فيه
echo.
set /p confirm="هل أنت متأكد؟ (y/N): "

if /i "%confirm%" NEQ "y" (
    echo تم إلغاء العملية
    pause
    exit /b
)

echo.
echo 1. إلغاء تفعيل البيئة الحالية...
if defined VIRTUAL_ENV (
    call deactivate 2>nul
)

echo.
echo 2. حذف مجلد .venv...
if exist ".venv" (
    echo جاري حذف .venv...
    rmdir /s /q ".venv"
    if exist ".venv" (
        echo ❌ فشل حذف .venv - قد يكون قيد الاستخدام
        echo جرب إغلاق VS Code وتشغيل السكريبت مرة أخرى
    ) else (
        echo ✅ تم حذف .venv بنجاح
    )
) else (
    echo .venv غير موجود
)

echo.
echo 3. حذف متغيرات البيئة...
set VIRTUAL_ENV=
set VIRTUAL_ENV_PROMPT=

echo.
echo ✅ تم حذف البيئة الافتراضية نهائياً!
echo.
echo 📋 الآن يمكنك:
echo - استخدام Python العام للنظام
echo - إنشاء بيئة افتراضية جديدة إذا أردت
echo - تثبيت المكتبات عالمياً
echo.
pause
