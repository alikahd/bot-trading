-- ============================================
-- 🧪 اختبار شامل لجميع وظائف نظام الإحالة
-- ============================================

-- ============================================
-- 📋 الجزء 1: التحقق من البنية الأساسية
-- ============================================

-- 1.1 التحقق من وجود جميع الجداول
SELECT 
  'الجداول الموجودة' as test_name,
  table_name,
  CASE 
    WHEN table_name IN ('users', 'coupons', 'referrals', 'pending_commissions', 'commission_payments', 'referral_settings') 
    THEN '✅ موجود'
    ELSE '❌ مفقود'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('users', 'coupons', 'referrals', 'pending_commissions', 'commission_payments', 'referral_settings')
ORDER BY table_name;

-- 1.2 التحقق من عمود referral_code في جدول users
SELECT 
  '1.2 - عمود referral_code' as test_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'referral_code'
    ) THEN '✅ موجود'
    ELSE '❌ مفقود'
  END as status;

-- 1.3 التحقق من أعمدة discount_rate و commission_rate في جدول coupons
SELECT 
  '1.3 - أعمدة النسب في coupons' as test_name,
  column_name,
  data_type,
  CASE 
    WHEN column_name IN ('discount_rate', 'commission_rate') THEN '✅ موجود'
    ELSE '❌ مفقود'
  END as status
FROM information_schema.columns
WHERE table_name = 'coupons'
AND column_name IN ('discount_rate', 'commission_rate');

-- 1.4 التحقق من جدول referral_settings
SELECT 
  '1.4 - جدول referral_settings' as test_name,
  column_name,
  data_type,
  column_default,
  '✅ موجود' as status
FROM information_schema.columns
WHERE table_name = 'referral_settings'
ORDER BY ordinal_position;

-- ============================================
-- 📋 الجزء 2: التحقق من Constraints
-- ============================================

-- 2.1 Constraints على referral_settings
SELECT 
  '2.1 - Constraints على referral_settings' as test_name,
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition,
  '✅ موجود' as status
FROM pg_constraint
WHERE conrelid = 'referral_settings'::regclass
AND contype = 'c'
ORDER BY conname;

-- 2.2 Constraint على users.referral_code
SELECT 
  '2.2 - Constraint على referral_code' as test_name,
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition,
  CASE 
    WHEN conname = 'referral_code_format' THEN '✅ موجود'
    ELSE '⚠️ غير متوقع'
  END as status
FROM pg_constraint
WHERE conrelid = 'users'::regclass
AND conname LIKE '%referral_code%';

-- ============================================
-- 📋 الجزء 3: التحقق من Indexes
-- ============================================

-- 3.1 Index على users.referral_code
SELECT 
  '3.1 - Index على referral_code' as test_name,
  indexname,
  indexdef,
  CASE 
    WHEN indexname = 'idx_users_referral_code' THEN '✅ موجود'
    ELSE '⚠️ غير متوقع'
  END as status
FROM pg_indexes
WHERE tablename = 'users'
AND indexname LIKE '%referral_code%';

-- 3.2 Index على referral_settings.is_active
SELECT 
  '3.2 - Index على is_active' as test_name,
  indexname,
  indexdef,
  CASE 
    WHEN indexname = 'idx_referral_settings_active' THEN '✅ موجود'
    ELSE '⚠️ غير متوقع'
  END as status
FROM pg_indexes
WHERE tablename = 'referral_settings'
AND indexname LIKE '%active%';

-- ============================================
-- 📋 الجزء 4: التحقق من RLS Policies
-- ============================================

-- 4.1 RLS على referral_settings
SELECT 
  '4.1 - RLS Policies على referral_settings' as test_name,
  policyname,
  cmd,
  roles,
  CASE 
    WHEN policyname LIKE '%referral_settings%' THEN '✅ موجود'
    ELSE '⚠️ غير متوقع'
  END as status
FROM pg_policies
WHERE tablename = 'referral_settings'
ORDER BY policyname;

-- ============================================
-- 📋 الجزء 5: التحقق من البيانات الافتراضية
-- ============================================

-- 5.1 الإعدادات الافتراضية في referral_settings
SELECT 
  '5.1 - الإعدادات الافتراضية' as test_name,
  discount_rate,
  commission_rate,
  payment_cycle_days,
  minimum_payout,
  is_active,
  CASE 
    WHEN discount_rate = 10.00 
    AND commission_rate = 10.00 
    AND payment_cycle_days = 15 
    AND minimum_payout = 10.00 
    AND is_active = true 
    THEN '✅ صحيح'
    ELSE '⚠️ قيم غير متوقعة'
  END as status
FROM referral_settings
LIMIT 1;

-- ============================================
-- 📋 الجزء 6: اختبار الوظائف - إنشاء بيانات تجريبية
-- ============================================

-- 6.1 إنشاء مستخدم تجريبي (إذا لم يكن موجوداً)
DO $$
DECLARE
  test_user_id UUID;
BEGIN
  -- البحث عن مستخدم تجريبي
  SELECT id INTO test_user_id 
  FROM users 
  WHERE email = 'test_referrer@example.com'
  LIMIT 1;
  
  -- إذا لم يكن موجوداً، إنشاء واحد
  IF test_user_id IS NULL THEN
    INSERT INTO users (email, username, role, status, subscription_status)
    VALUES (
      'test_referrer@example.com',
      'Test Referrer',
      'trader',
      'active',
      'active'
    )
    RETURNING id INTO test_user_id;
    
    RAISE NOTICE '✅ تم إنشاء مستخدم تجريبي: %', test_user_id;
  ELSE
    RAISE NOTICE 'ℹ️ المستخدم التجريبي موجود بالفعل: %', test_user_id;
  END IF;
END $$;

-- 6.2 تحديث رمز الإحالة للمستخدم التجريبي
UPDATE users 
SET referral_code = 'TESTREF2024'
WHERE email = 'test_referrer@example.com';

SELECT 
  '6.2 - تحديث رمز الإحالة' as test_name,
  email,
  referral_code,
  CASE 
    WHEN referral_code = 'TESTREF2024' THEN '✅ تم التحديث'
    ELSE '❌ فشل التحديث'
  END as status
FROM users
WHERE email = 'test_referrer@example.com';

-- 6.3 إنشاء كوبون إحالة تجريبي
INSERT INTO coupons (
  code,
  discount_type,
  discount_value,
  discount_rate,
  commission_rate,
  is_active,
  is_referral_coupon,
  referrer_id
)
SELECT 
  'TESTREF2024',
  'percentage',
  10.00,
  10.00,
  10.00,
  true,
  true,
  id
FROM users
WHERE email = 'test_referrer@example.com'
ON CONFLICT (code) DO UPDATE
SET 
  discount_rate = 10.00,
  commission_rate = 10.00,
  is_active = true;

SELECT 
  '6.3 - إنشاء كوبون إحالة' as test_name,
  code,
  discount_rate,
  commission_rate,
  is_referral_coupon,
  CASE 
    WHEN code = 'TESTREF2024' AND is_referral_coupon = true THEN '✅ تم الإنشاء'
    ELSE '❌ فشل الإنشاء'
  END as status
FROM coupons
WHERE code = 'TESTREF2024';

-- ============================================
-- 📋 الجزء 7: اختبار البحث والتطبيق
-- ============================================

-- 7.1 البحث عن كوبون بالرمز
SELECT 
  '7.1 - البحث عن كوبون' as test_name,
  code,
  discount_rate,
  commission_rate,
  is_active,
  CASE 
    WHEN is_active = true THEN '✅ نشط وجاهز'
    ELSE '❌ غير نشط'
  END as status
FROM coupons
WHERE code = 'TESTREF2024'
AND is_active = true;

-- 7.2 حساب الخصم (مثال: باقة $100)
SELECT 
  '7.2 - حساب الخصم' as test_name,
  code,
  100.00 as original_price,
  discount_rate,
  (100.00 * discount_rate / 100) as discount_amount,
  (100.00 - (100.00 * discount_rate / 100)) as final_price,
  CASE 
    WHEN (100.00 * discount_rate / 100) = 10.00 THEN '✅ الحساب صحيح'
    ELSE '❌ خطأ في الحساب'
  END as status
FROM coupons
WHERE code = 'TESTREF2024';

-- 7.3 حساب العمولة
SELECT 
  '7.3 - حساب العمولة' as test_name,
  code,
  (100.00 - (100.00 * discount_rate / 100)) as amount_paid,
  commission_rate,
  ((100.00 - (100.00 * discount_rate / 100)) * commission_rate / 100) as commission_amount,
  CASE 
    WHEN ((100.00 - (100.00 * discount_rate / 100)) * commission_rate / 100) = 9.00 THEN '✅ الحساب صحيح'
    ELSE '❌ خطأ في الحساب'
  END as status
FROM coupons
WHERE code = 'TESTREF2024';

-- ============================================
-- 📋 الجزء 8: اختبار تحديث الإعدادات
-- ============================================

-- 8.1 تحديث الإعدادات (محاكاة عمل الأدمن)
UPDATE referral_settings
SET 
  discount_rate = 15.00,
  commission_rate = 12.00,
  payment_cycle_days = 30,
  minimum_payout = 20.00,
  updated_at = NOW()
WHERE id = (SELECT id FROM referral_settings LIMIT 1);

SELECT 
  '8.1 - تحديث الإعدادات' as test_name,
  discount_rate,
  commission_rate,
  payment_cycle_days,
  minimum_payout,
  CASE 
    WHEN discount_rate = 15.00 
    AND commission_rate = 12.00 
    AND payment_cycle_days = 30 
    AND minimum_payout = 20.00 
    THEN '✅ تم التحديث'
    ELSE '❌ فشل التحديث'
  END as status
FROM referral_settings
LIMIT 1;

-- 8.2 إعادة الإعدادات للقيم الافتراضية
UPDATE referral_settings
SET 
  discount_rate = 10.00,
  commission_rate = 10.00,
  payment_cycle_days = 15,
  minimum_payout = 10.00,
  updated_at = NOW()
WHERE id = (SELECT id FROM referral_settings LIMIT 1);

SELECT 
  '8.2 - إعادة القيم الافتراضية' as test_name,
  discount_rate,
  commission_rate,
  payment_cycle_days,
  minimum_payout,
  CASE 
    WHEN discount_rate = 10.00 
    AND commission_rate = 10.00 
    AND payment_cycle_days = 15 
    AND minimum_payout = 10.00 
    THEN '✅ تمت الإعادة'
    ELSE '❌ فشلت الإعادة'
  END as status
FROM referral_settings
LIMIT 1;

-- ============================================
-- 📋 الجزء 9: إحصائيات عامة
-- ============================================

-- 9.1 عدد الكوبونات حسب النوع
SELECT 
  '9.1 - إحصائيات الكوبونات' as test_name,
  is_referral_coupon,
  COUNT(*) as count,
  '✅ معلومات' as status
FROM coupons
GROUP BY is_referral_coupon;

-- 9.2 عدد المستخدمين الذين لديهم رمز إحالة
SELECT 
  '9.2 - المستخدمون برموز إحالة' as test_name,
  COUNT(*) as users_with_referral_code,
  '✅ معلومات' as status
FROM users
WHERE referral_code IS NOT NULL;

-- 9.3 عدد الإحالات حسب الحالة
SELECT 
  '9.3 - إحصائيات الإحالات' as test_name,
  status,
  COUNT(*) as count,
  '✅ معلومات' as status
FROM referrals
GROUP BY status;

-- 9.4 إجمالي العمولات المستحقة
SELECT 
  '9.4 - العمولات المستحقة' as test_name,
  status,
  COUNT(*) as count,
  SUM(commission_amount) as total_amount,
  '✅ معلومات' as status
FROM pending_commissions
GROUP BY status;

-- ============================================
-- 📋 الجزء 10: ملخص النتائج
-- ============================================

SELECT 
  '========================================' as separator,
  '📊 ملخص الاختبار' as title,
  '========================================' as separator2;

SELECT 
  'إجمالي الجداول المطلوبة' as metric,
  '6' as expected,
  (SELECT COUNT(*) FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('users', 'coupons', 'referrals', 'pending_commissions', 'commission_payments', 'referral_settings')
  )::TEXT as actual,
  CASE 
    WHEN (SELECT COUNT(*) FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name IN ('users', 'coupons', 'referrals', 'pending_commissions', 'commission_payments', 'referral_settings')
         ) = 6 
    THEN '✅ نجح'
    ELSE '❌ فشل'
  END as status;

SELECT 
  'جدول referral_settings' as metric,
  'موجود' as expected,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'referral_settings')
    THEN 'موجود'
    ELSE 'مفقود'
  END as actual,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'referral_settings')
    THEN '✅ نجح'
    ELSE '❌ فشل'
  END as status;

SELECT 
  'عمود referral_code' as metric,
  'موجود' as expected,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'referral_code')
    THEN 'موجود'
    ELSE 'مفقود'
  END as actual,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'referral_code')
    THEN '✅ نجح'
    ELSE '❌ فشل'
  END as status;

SELECT 
  'RLS Policies' as metric,
  '2+' as expected,
  (SELECT COUNT(*)::TEXT FROM pg_policies WHERE tablename = 'referral_settings') as actual,
  CASE 
    WHEN (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'referral_settings') >= 2
    THEN '✅ نجح'
    ELSE '❌ فشل'
  END as status;

SELECT 
  'الإعدادات الافتراضية' as metric,
  'موجودة' as expected,
  CASE 
    WHEN EXISTS (SELECT 1 FROM referral_settings)
    THEN 'موجودة'
    ELSE 'مفقودة'
  END as actual,
  CASE 
    WHEN EXISTS (SELECT 1 FROM referral_settings)
    THEN '✅ نجح'
    ELSE '❌ فشل'
  END as status;

-- ============================================
-- 🎉 النتيجة النهائية
-- ============================================

SELECT 
  '========================================' as separator,
  '🎉 انتهى الاختبار' as title,
  '========================================' as separator2;

SELECT 
  'إذا كانت جميع الاختبارات ✅ نجح' as result,
  'فإن قاعدة البيانات جاهزة تماماً!' as message,
  '🚀 يمكنك الآن استخدام النظام' as next_step;
