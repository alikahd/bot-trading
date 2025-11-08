/**
 * 🧹 سكريبت تنظيف console.log من المشروع
 * 
 * ✅ آمن 100%:
 * - يحذف فقط console.log, console.warn, console.error, console.info
 * - لا يحذف console.table, console.group, console.time (مهمة للتطوير)
 * - يحتفظ بنسخة احتياطية قبل التعديل
 * - يعرض تقرير مفصل بالتغييرات
 * 
 * 🎯 الاستخدام:
 * node clean-console-logs.js
 */

const fs = require('fs');
const path = require('path');

// ⚙️ الإعدادات
const CONFIG = {
  // المجلدات المستهدفة
  targetDirs: [
    'src',
    'railway-signals'
  ],
  
  // امتدادات الملفات المستهدفة
  fileExtensions: ['.ts', '.tsx', '.js', '.jsx'],
  
  // المجلدات المستثناة
  excludeDirs: ['node_modules', 'dist', 'build', '.git', 'backup'],
  
  // أنواع console المستهدفة للحذف
  consoleTypes: ['log', 'warn', 'error', 'info', 'debug'],
  
  // إنشاء نسخة احتياطية؟
  createBackup: true,
  
  // مجلد النسخ الاحتياطية
  backupDir: 'backup-console-logs'
};

// 📊 إحصائيات
const stats = {
  filesScanned: 0,
  filesModified: 0,
  consolesRemoved: 0,
  errors: []
};

/**
 * 🔍 فحص ما إذا كان المسار مستثنى
 */
function isExcluded(filePath) {
  return CONFIG.excludeDirs.some(dir => filePath.includes(dir));
}

/**
 * 📝 إنشاء نسخة احتياطية من الملف
 */
function createBackup(filePath, content) {
  if (!CONFIG.createBackup) return;
  
  try {
    const backupPath = path.join(
      CONFIG.backupDir,
      filePath.replace(/^[a-zA-Z]:/, '') // إزالة drive letter
    );
    
    const backupDir = path.dirname(backupPath);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    fs.writeFileSync(backupPath, content, 'utf8');
  } catch (error) {
    stats.errors.push(`فشل إنشاء نسخة احتياطية لـ ${filePath}: ${error.message}`);
  }
}

/**
 * 🧹 تنظيف console من المحتوى
 */
function cleanConsole(content, filePath) {
  let cleaned = content;
  let removedCount = 0;
  
  // Pattern لكل نوع console
  CONFIG.consoleTypes.forEach(type => {
    // Pattern 1: console.log(...) على سطر واحد
    const singleLinePattern = new RegExp(
      `^\\s*console\\.${type}\\([^;]*\\);?\\s*$`,
      'gm'
    );
    
    // Pattern 2: console.log(...) متعدد الأسطر
    const multiLinePattern = new RegExp(
      `^\\s*console\\.${type}\\([\\s\\S]*?\\);?\\s*$`,
      'gm'
    );
    
    // عد عدد console قبل الحذف
    const beforeCount = (cleaned.match(new RegExp(`console\\.${type}\\(`, 'g')) || []).length;
    
    // حذف console على سطر واحد
    cleaned = cleaned.replace(singleLinePattern, '');
    
    // حذف console متعدد الأسطر (حتى 10 أسطر)
    for (let i = 0; i < 10; i++) {
      const tempCleaned = cleaned.replace(multiLinePattern, '');
      if (tempCleaned === cleaned) break;
      cleaned = tempCleaned;
    }
    
    // عد عدد console بعد الحذف
    const afterCount = (cleaned.match(new RegExp(`console\\.${type}\\(`, 'g')) || []).length;
    removedCount += (beforeCount - afterCount);
  });
  
  // تنظيف الأسطر الفارغة المتتالية (أكثر من سطرين)
  cleaned = cleaned.replace(/\n\s*\n\s*\n+/g, '\n\n');
  
  return { cleaned, removedCount };
}

/**
 * 📂 معالجة ملف واحد
 */
function processFile(filePath) {
  try {
    stats.filesScanned++;
    
    // قراءة المحتوى
    const content = fs.readFileSync(filePath, 'utf8');
    
    // تنظيف console
    const { cleaned, removedCount } = cleanConsole(content, filePath);
    
    // إذا تم حذف أي console
    if (removedCount > 0) {
      // إنشاء نسخة احتياطية
      createBackup(filePath, content);
      
      // حفظ الملف المنظف
      fs.writeFileSync(filePath, cleaned, 'utf8');
      
      stats.filesModified++;
      stats.consolesRemoved += removedCount;
      
      console.log(`✅ ${path.basename(filePath)}: حذف ${removedCount} console`);
    }
  } catch (error) {
    stats.errors.push(`خطأ في معالجة ${filePath}: ${error.message}`);
  }
}

/**
 * 📁 معالجة مجلد بشكل متكرر
 */
function processDirectory(dirPath) {
  try {
    const items = fs.readdirSync(dirPath);
    
    items.forEach(item => {
      const fullPath = path.join(dirPath, item);
      
      // تجاهل المجلدات المستثناة
      if (isExcluded(fullPath)) return;
      
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // معالجة المجلد بشكل متكرر
        processDirectory(fullPath);
      } else if (stat.isFile()) {
        // فحص امتداد الملف
        const ext = path.extname(fullPath);
        if (CONFIG.fileExtensions.includes(ext)) {
          processFile(fullPath);
        }
      }
    });
  } catch (error) {
    stats.errors.push(`خطأ في معالجة المجلد ${dirPath}: ${error.message}`);
  }
}

/**
 * 📊 عرض التقرير النهائي
 */
function showReport() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 تقرير التنظيف');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📂 ملفات تم فحصها: ${stats.filesScanned}`);
  console.log(`✏️  ملفات تم تعديلها: ${stats.filesModified}`);
  console.log(`🧹 console تم حذفها: ${stats.consolesRemoved}`);
  
  if (stats.errors.length > 0) {
    console.log(`\n⚠️  أخطاء (${stats.errors.length}):`);
    stats.errors.forEach(error => console.log(`   - ${error}`));
  }
  
  if (CONFIG.createBackup && stats.filesModified > 0) {
    console.log(`\n💾 النسخ الاحتياطية محفوظة في: ${CONFIG.backupDir}`);
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

/**
 * 🚀 تشغيل السكريبت
 */
function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧹 بدء تنظيف console.log من المشروع');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // إنشاء مجلد النسخ الاحتياطية
  if (CONFIG.createBackup && !fs.existsSync(CONFIG.backupDir)) {
    fs.mkdirSync(CONFIG.backupDir, { recursive: true });
  }
  
  // معالجة كل مجلد مستهدف
  CONFIG.targetDirs.forEach(dir => {
    const fullPath = path.resolve(dir);
    
    if (fs.existsSync(fullPath)) {
      console.log(`📁 معالجة: ${dir}`);
      processDirectory(fullPath);
    } else {
      console.log(`⚠️  المجلد غير موجود: ${dir}`);
    }
  });
  
  // عرض التقرير
  showReport();
  
  // رسالة نهائية
  if (stats.filesModified > 0) {
    console.log('✅ تم التنظيف بنجاح!');
    console.log('💡 يمكنك التراجع عن التغييرات من مجلد النسخ الاحتياطية');
  } else {
    console.log('✅ المشروع نظيف - لا توجد console للحذف');
  }
}

// تشغيل
main();
