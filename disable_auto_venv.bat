@echo off
echo ========================================
echo إيقاف التفعيل التلقائي للبيئة الافتراضية
echo ========================================

echo.
echo 1. إنشاء مجلد .vscode إذا لم يكن موجوداً...
if not exist ".vscode" mkdir .vscode

echo.
echo 2. إنشاء ملف إعدادات VS Code...
echo {> .vscode\settings.json
echo     "python.terminal.activateEnvironment": false,>> .vscode\settings.json
echo     "python.defaultInterpreterPath": "python",>> .vscode\settings.json
echo     "python.terminal.activateEnvInCurrentTerminal": false>> .vscode\settings.json
echo }>> .vscode\settings.json

echo.
echo 3. إلغاء تفعيل البيئة الحالية إذا كانت مفعلة...
if defined VIRTUAL_ENV (
    echo تم العثور على بيئة افتراضية مفعلة: %VIRTUAL_ENV%
    call deactivate 2>nul
    echo تم إلغاء التفعيل
) else (
    echo لا توجد بيئة افتراضية مفعلة حالياً
)

echo.
echo 4. حذف متغيرات البيئة المتعلقة بـ Virtual Environment...
set VIRTUAL_ENV=
set VIRTUAL_ENV_PROMPT=

echo.
echo ✅ تم إيقاف التفعيل التلقائي للبيئة الافتراضية!
echo.
echo 📋 ما تم فعله:
echo - تم إنشاء .vscode\settings.json مع إعدادات إيقاف التفعيل التلقائي
echo - تم إلغاء تفعيل البيئة الحالية
echo - تم حذف متغيرات البيئة
echo.
echo ⚠️ ملاحظة: قد تحتاج لإعادة تشغيل VS Code لتطبيق التغييرات
echo.
pause
