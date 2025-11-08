#!/usr/bin/env node
/**
 * سكريبت لإصلاح المتغيرات غير المستخدمة
 */

const fs = require('fs');
const path = require('path');

// قائمة الملفات والتعديلات
const fixes = [
  // payload غير مستخدم
  { file: 'src/components/admin/AdminNotificationPanel.tsx', line: 151, old: '(payload)', new: '(_payload)' },
  { file: 'src/components/admin/AdminNotificationPanel.tsx', line: 163, old: '(payload)', new: '(_payload)' },
  { file: 'src/components/admin/AdminPanel.tsx', line: 113, old: '(payload)', new: '(_payload)' },
  { file: 'src/components/admin/AdminPanel.tsx', line: 126, old: '(payload)', new: '(_payload)' },
  { file: 'src/components/admin/AdminPanel.tsx', line: 139, old: '(payload)', new: '(_payload)' },
  { file: 'src/components/admin/AdminPanel.tsx', line: 152, old: '(payload)', new: '(_payload)' },
  { file: 'src/components/admin/CommissionManagement.tsx', line: 51, old: '(payload)', new: '(_payload)' },
  { file: 'src/components/admin/CouponManagement.tsx', line: 53, old: '(payload)', new: '(_payload)' },
  { file: 'src/components/admin/PaymentManagement.tsx', line: 48, old: '(payload)', new: '(_payload)' },
  { file: 'src/components/admin/SubscriptionManagement.tsx', line: 133, old: '(payload)', new: '(_payload)' },
  { file: 'src/components/referral/ReferralPanel.tsx', line: 93, old: '(payload)', new: '(_payload)' },
  { file: 'src/components/referral/ReferralPanel.tsx', line: 112, old: '(payload)', new: '(_payload)' },
  { file: 'src/components/subscription/SubscriptionAndPaymentsPage.tsx', line: 273, old: '(payload)', new: '(_payload)' },
  { file: 'src/components/subscription/SubscriptionAndPaymentsPage.tsx', line: 285, old: '(payload)', new: '(_payload)' },
  { file: 'src/components/subscription/SubscriptionPage.tsx', line: 165, old: '(payload)', new: '(_payload)' },
  
  // متغيرات أخرى
  { file: 'src/components/admin/CouponManagement.tsx', line: 133, old: 'data: session', new: 'data: _session' },
  { file: 'src/components/admin/CouponManagement.tsx', line: 149, old: 'data: verifyData', new: 'data: _verifyData' },
  { file: 'src/components/admin/SubscriptionManagement.tsx', line: 261, old: 'data: subscription', new: 'data: _subscription' },
  { file: 'src/components/notifications/UserNotifications.tsx', line: 157, old: '(err)', new: '(_err)' },
  { file: 'src/components/payments/PaymentPage.tsx', line: 282, old: ', error', new: '' },
  { file: 'src/components/admin/ReferralSettings.tsx', line: 18, old: 'const { t }', new: 'const { t: _t }' },
  { file: 'src/components/referral/PaymentMethodSettings.tsx', line: 31, old: 'const { t }', new: 'const { t: _t }' },
  { file: 'src/components/referral/ReferralPanel.tsx', line: 131, old: 'const startTime', new: 'const _startTime' },
  { file: 'src/components/referral/ReferralPanel.tsx', line: 200, old: 'const endTime', new: 'const _endTime' },
  { file: 'src/components/referral/ReferralPanel.tsx', line: 443, old: ', checkError', new: '' },
  { file: 'src/components/referral/ReferralPanel.tsx', line: 466, old: 'data: newCoupon', new: 'data: _newCoupon' },
  { file: 'src/components/subscription/SubscriptionPage.tsx', line: 136, old: 'data: plan', new: 'data: _plan' },
  { file: 'src/components/subscription/SubscriptionPage.tsx', line: 171, old: '(status)', new: '(_status)' },
  { file: 'src/components/subscription/SubscriptionStatusWidget.tsx', line: 33, old: 'const isRTL', new: 'const _isRTL' },
  { file: 'src/services/notificationSound.ts', line: 115, old: '(err)', new: '(_err)' },
];

console.log('🔧 بدء إصلاح المتغيرات غير المستخدمة...\n');

let fixedCount = 0;
let errorCount = 0;

fixes.forEach(fix => {
  const filePath = path.join(__dirname, fix.file);
  
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  الملف غير موجود: ${fix.file}`);
      errorCount++;
      return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    if (fix.line > lines.length) {
      console.log(`⚠️  رقم السطر ${fix.line} غير موجود في: ${fix.file}`);
      errorCount++;
      return;
    }
    
    const lineIndex = fix.line - 1;
    const originalLine = lines[lineIndex];
    
    if (originalLine.includes(fix.old)) {
      lines[lineIndex] = originalLine.replace(fix.old, fix.new);
      content = lines.join('\n');
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ تم إصلاح: ${fix.file}:${fix.line}`);
      fixedCount++;
    } else {
      console.log(`⚠️  النص المطلوب غير موجود في السطر ${fix.line}: ${fix.file}`);
      errorCount++;
    }
  } catch (error) {
    console.log(`❌ خطأ في معالجة: ${fix.file} - ${error.message}`);
    errorCount++;
  }
});

console.log(`\n📊 النتيجة:`);
console.log(`✅ تم الإصلاح: ${fixedCount}`);
console.log(`❌ أخطاء: ${errorCount}`);
console.log(`📁 المجموع: ${fixes.length}`);
