/**
 * 🧪 اختبار سكريبت التنظيف
 * 
 * هذا الملف للاختبار فقط - يمكن حذفه بعد التأكد من عمل السكريبت
 */

const fs = require('fs');
const path = require('path');

// إنشاء ملف اختبار مؤقت
const testContent = `
// ملف اختبار
console.log('test 1');
console.warn('test 2');
console.error('test 3');

function test() {
  console.log('inside function');
  return true;
}

// console متعدد الأسطر
console.log(
  'multi line',
  'test',
  { data: 'value' }
);

// هذا يجب أن يبقى
const log = 'not console';
function logData() {
  return 'data';
}
`;

const testFile = 'test-file-temp.js';

console.log('🧪 اختبار سكريبت التنظيف\n');

// 1. إنشاء ملف اختبار
console.log('1️⃣ إنشاء ملف اختبار...');
fs.writeFileSync(testFile, testContent);
console.log('✅ تم إنشاء:', testFile);

// 2. عد console قبل التنظيف
const beforeCount = (testContent.match(/console\./g) || []).length;
console.log(`📊 عدد console قبل التنظيف: ${beforeCount}`);

console.log('\n3️⃣ الآن شغل السكريبت:');
console.log('   node clean-console-logs.js');

console.log('\n4️⃣ بعد التشغيل، افتح الملف وتحقق:');
console.log(`   - يجب حذف جميع console (${beforeCount} console)`);
console.log('   - يجب بقاء: const log و function logData');
console.log(`   - يجب وجود نسخة احتياطية في: backup-console-logs/${testFile}`);

console.log('\n5️⃣ للتنظيف بعد الاختبار:');
console.log(`   - احذف: ${testFile}`);
console.log('   - احذف: backup-console-logs');
console.log('   - احذف: test-clean-script.js (هذا الملف)');

console.log('\n✅ ملف الاختبار جاهز!\n');
