/**
 * 🔄 سكريبت استرجاع الملفات من النسخة الاحتياطية
 * 
 * الاستخدام:
 * node restore-from-backup.js
 */

const fs = require('fs');
const path = require('path');

const BACKUP_DIR = 'backup-console-logs';

function restoreFromBackup() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔄 استرجاع الملفات من النسخة الاحتياطية');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (!fs.existsSync(BACKUP_DIR)) {
    console.log('❌ لا يوجد مجلد نسخ احتياطية!');
    console.log('💡 تأكد من تشغيل clean-console-logs.js أولاً\n');
    return;
  }

  let restoredCount = 0;
  let errorCount = 0;

  function restoreDirectory(backupPath, targetPath) {
    const items = fs.readdirSync(backupPath);

    items.forEach(item => {
      const backupItemPath = path.join(backupPath, item);
      const targetItemPath = path.join(targetPath, item);
      const stat = fs.statSync(backupItemPath);

      if (stat.isDirectory()) {
        if (!fs.existsSync(targetItemPath)) {
          fs.mkdirSync(targetItemPath, { recursive: true });
        }
        restoreDirectory(backupItemPath, targetItemPath);
      } else {
        try {
          fs.copyFileSync(backupItemPath, targetItemPath);
          restoredCount++;
          console.log(`✅ ${path.relative(process.cwd(), targetItemPath)}`);
        } catch (error) {
          errorCount++;
          console.log(`❌ فشل: ${path.relative(process.cwd(), targetItemPath)}`);
        }
      }
    });
  }

  restoreDirectory(BACKUP_DIR, process.cwd());

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 النتيجة');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ ملفات تم استرجاعها: ${restoredCount}`);
  console.log(`❌ أخطاء: ${errorCount}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (restoredCount > 0) {
    console.log('✅ تم استرجاع الملفات بنجاح!');
    console.log('💡 يمكنك الآن حذف مجلد backup-console-logs\n');
  }
}

restoreFromBackup();
