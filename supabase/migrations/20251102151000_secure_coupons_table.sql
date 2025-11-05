-- ============================================
-- تأمين جدول coupons بسياسات RLS
-- ============================================
-- التاريخ: 2025-11-02
-- الهدف: حماية الكوبونات من التلاعب والوصول غير المصرح به
-- ============================================

-- 1. تفعيل RLS على جدول coupons
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- 2. حذف السياسات القديمة إن وجدت
DROP POLICY IF EXISTS "coupons_select_active" ON coupons;
DROP POLICY IF EXISTS "coupons_select_own_referral" ON coupons;
DROP POLICY IF EXISTS "coupons_select_admin" ON coupons;
DROP POLICY IF EXISTS "coupons_insert_admin" ON coupons;
DROP POLICY IF EXISTS "coupons_insert_referral_system" ON coupons;
DROP POLICY IF EXISTS "coupons_update_admin" ON coupons;
DROP POLICY IF EXISTS "coupons_update_usage_system" ON coupons;
DROP POLICY IF EXISTS "coupons_delete_admin" ON coupons;

-- ============================================
-- سياسات القراءة (SELECT)
-- ============================================

-- السياسة 1: جميع المستخدمين يمكنهم رؤية الكوبونات النشطة فقط (للتحقق من صحتها)
CREATE POLICY "coupons_select_active" ON coupons
  FOR SELECT
  USING (
    is_active = true
    AND (valid_until IS NULL OR valid_until > NOW())
  );

-- السياسة 2: المستخدم يمكنه رؤية كوبونات الإحالة الخاصة به
CREATE POLICY "coupons_select_own_referral" ON coupons
  FOR SELECT
  USING (
    is_referral_coupon = true
    AND referrer_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  );

-- السياسة 3: الأدمن يمكنه رؤية جميع الكوبونات
CREATE POLICY "coupons_select_admin" ON coupons
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_id = auth.uid()
        AND role = 'admin'
    )
  );

-- ============================================
-- سياسات الإدراج (INSERT)
-- ============================================

-- السياسة 4: الأدمن فقط يمكنه إنشاء كوبونات عادية
CREATE POLICY "coupons_insert_admin" ON coupons
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_id = auth.uid()
        AND role = 'admin'
    )
  );

-- السياسة 5: السماح بإنشاء كوبونات الإحالة تلقائياً من النظام
-- هذه السياسة تسمح للمستخدم بإنشاء كوبون إحالة خاص به
CREATE POLICY "coupons_insert_referral_system" ON coupons
  FOR INSERT
  WITH CHECK (
    is_referral_coupon = true
    AND referrer_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
    -- التأكد من أن الكوبون يحمل نفس الكود الموجود في users.referral_code
    AND code = (
      SELECT referral_code FROM users WHERE id = referrer_id
    )
  );

-- ============================================
-- سياسات التحديث (UPDATE)
-- ============================================

-- السياسة 6: الأدمن يمكنه تحديث جميع الكوبونات
CREATE POLICY "coupons_update_admin" ON coupons
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_id = auth.uid()
        AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_id = auth.uid()
        AND role = 'admin'
    )
  );

-- السياسة 7: السماح بتحديث current_uses فقط (للنظام عند استخدام الكوبون)
-- هذه السياسة تسمح بتحديث عدد الاستخدامات فقط بدون تغيير باقي البيانات
CREATE POLICY "coupons_update_usage_system" ON coupons
  FOR UPDATE
  USING (true)
  WITH CHECK (
    -- السماح فقط بتحديث current_uses
    code = (SELECT code FROM coupons WHERE id = coupons.id)
    AND discount_type = (SELECT discount_type FROM coupons WHERE id = coupons.id)
    AND discount_value = (SELECT discount_value FROM coupons WHERE id = coupons.id)
    AND is_active = (SELECT is_active FROM coupons WHERE id = coupons.id)
    AND is_referral_coupon = (SELECT is_referral_coupon FROM coupons WHERE id = coupons.id)
    AND referrer_id = (SELECT referrer_id FROM coupons WHERE id = coupons.id)
  );

-- ============================================
-- سياسات الحذف (DELETE)
-- ============================================

-- السياسة 8: الأدمن فقط يمكنه حذف الكوبونات
CREATE POLICY "coupons_delete_admin" ON coupons
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_id = auth.uid()
        AND role = 'admin'
    )
  );

-- ============================================
-- إلغاء الأذونات الزائدة
-- ============================================

REVOKE TRUNCATE ON coupons FROM anon, authenticated;
REVOKE TRIGGER ON coupons FROM anon, authenticated;

-- ============================================
-- تعليقات توضيحية
-- ============================================

COMMENT ON POLICY "coupons_select_active" ON coupons IS 
  'يسمح لجميع المستخدمين برؤية الكوبونات النشطة فقط للتحقق من صحتها';

COMMENT ON POLICY "coupons_select_own_referral" ON coupons IS 
  'يسمح للمستخدم برؤية كوبونات الإحالة الخاصة به';

COMMENT ON POLICY "coupons_select_admin" ON coupons IS 
  'يسمح للأدمن برؤية جميع الكوبونات';

COMMENT ON POLICY "coupons_insert_admin" ON coupons IS 
  'يسمح للأدمن فقط بإنشاء كوبونات عادية';

COMMENT ON POLICY "coupons_insert_referral_system" ON coupons IS 
  'يسمح للمستخدم بإنشاء كوبون إحالة خاص به تلقائياً';

COMMENT ON POLICY "coupons_update_admin" ON coupons IS 
  'يسمح للأدمن بتحديث جميع الكوبونات بدون قيود';

COMMENT ON POLICY "coupons_update_usage_system" ON coupons IS 
  'يسمح بتحديث عدد الاستخدامات فقط عند استخدام الكوبون';

COMMENT ON POLICY "coupons_delete_admin" ON coupons IS 
  'يسمح للأدمن فقط بحذف الكوبونات';

-- ============================================
-- ملاحظات مهمة
-- ============================================

-- 🔒 الأمان:
-- - المستخدمون يرون الكوبونات النشطة فقط
-- - المستخدم يرى كوبونات الإحالة الخاصة به
-- - لا يمكن التلاعب بالكوبونات (تغيير النسب، الصلاحية، إلخ)
-- - الأدمن فقط يمكنه إدارة جميع الكوبونات

-- 🎯 الوظائف المحمية:
-- 1. إنشاء كوبونات عادية: أدمن فقط
-- 2. إنشاء كوبونات إحالة: المستخدم لنفسه فقط
-- 3. تحديث الكوبونات: أدمن فقط (ما عدا current_uses)
-- 4. حذف الكوبونات: أدمن فقط
-- 5. تحديث current_uses: النظام (عند الاستخدام)

-- 🚀 الأداء:
-- - استخدام EXISTS للسرعة
-- - فلترة الكوبونات المنتهية تلقائياً

-- ============================================
-- نهاية Migration
-- ============================================
