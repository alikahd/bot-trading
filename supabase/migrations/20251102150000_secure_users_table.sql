-- ============================================
-- تأمين جدول users بسياسات RLS
-- ============================================
-- التاريخ: 2025-11-02
-- الهدف: حماية بيانات المستخدمين من الوصول غير المصرح به
-- ============================================

-- 1. تفعيل RLS على جدول users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 2. حذف السياسات القديمة إن وجدت
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_select_admin" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_update_admin" ON users;
DROP POLICY IF EXISTS "users_delete_admin" ON users;
DROP POLICY IF EXISTS "users_insert_system" ON users;

-- ============================================
-- سياسات القراءة (SELECT)
-- ============================================

-- السياسة 1: المستخدم يمكنه قراءة بياناته الخاصة فقط
CREATE POLICY "users_select_own" ON users
  FOR SELECT
  USING (auth_id = auth.uid());

-- السياسة 2: الأدمن يمكنه قراءة جميع المستخدمين
CREATE POLICY "users_select_admin" ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users AS admin_user
      WHERE admin_user.auth_id = auth.uid()
        AND admin_user.role = 'admin'
    )
  );

-- ============================================
-- سياسات التحديث (UPDATE)
-- ============================================

-- السياسة 3: المستخدم يمكنه تحديث بياناته الخاصة (ما عدا الحقول الحساسة)
CREATE POLICY "users_update_own" ON users
  FOR UPDATE
  USING (auth_id = auth.uid())
  WITH CHECK (
    auth_id = auth.uid()
    -- التأكد من عدم تغيير الحقول الحساسة
    AND role = (SELECT role FROM users WHERE auth_id = auth.uid())
    AND is_active = (SELECT is_active FROM users WHERE auth_id = auth.uid())
    AND subscription_status = (SELECT subscription_status FROM users WHERE auth_id = auth.uid())
  );

-- السياسة 4: الأدمن يمكنه تحديث جميع المستخدمين
CREATE POLICY "users_update_admin" ON users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users AS admin_user
      WHERE admin_user.auth_id = auth.uid()
        AND admin_user.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users AS admin_user
      WHERE admin_user.auth_id = auth.uid()
        AND admin_user.role = 'admin'
    )
  );

-- ============================================
-- سياسات الحذف (DELETE)
-- ============================================

-- السياسة 5: الأدمن فقط يمكنه حذف المستخدمين (ما عدا نفسه)
CREATE POLICY "users_delete_admin" ON users
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users AS admin_user
      WHERE admin_user.auth_id = auth.uid()
        AND admin_user.role = 'admin'
    )
    -- منع الأدمن من حذف نفسه
    AND auth_id != auth.uid()
  );

-- ============================================
-- سياسات الإدراج (INSERT)
-- ============================================

-- السياسة 6: السماح بإنشاء مستخدمين جدد من النظام (للتسجيل)
-- هذه السياسة تسمح بإنشاء المستخدم عند التسجيل
CREATE POLICY "users_insert_system" ON users
  FOR INSERT
  WITH CHECK (
    -- السماح بالإدراج إذا كان auth_id يطابق المستخدم الحالي
    auth_id = auth.uid()
    -- أو إذا كان المستخدم الحالي أدمن
    OR EXISTS (
      SELECT 1 FROM users AS admin_user
      WHERE admin_user.auth_id = auth.uid()
        AND admin_user.role = 'admin'
    )
  );

-- ============================================
-- إلغاء الأذونات الزائدة
-- ============================================

-- إلغاء أذونات TRUNCATE و TRIGGER من المستخدمين العاديين
REVOKE TRUNCATE ON users FROM anon, authenticated;
REVOKE TRIGGER ON users FROM anon, authenticated;

-- ============================================
-- تعليقات توضيحية
-- ============================================

COMMENT ON POLICY "users_select_own" ON users IS 
  'يسمح للمستخدم بقراءة بياناته الخاصة فقط';

COMMENT ON POLICY "users_select_admin" ON users IS 
  'يسمح للأدمن بقراءة جميع المستخدمين';

COMMENT ON POLICY "users_update_own" ON users IS 
  'يسمح للمستخدم بتحديث بياناته (ما عدا role, is_active, subscription_status)';

COMMENT ON POLICY "users_update_admin" ON users IS 
  'يسمح للأدمن بتحديث جميع المستخدمين بدون قيود';

COMMENT ON POLICY "users_delete_admin" ON users IS 
  'يسمح للأدمن بحذف المستخدمين (ما عدا نفسه)';

COMMENT ON POLICY "users_insert_system" ON users IS 
  'يسمح بإنشاء مستخدمين جدد عند التسجيل أو من قبل الأدمن';

-- ============================================
-- اختبار السياسات
-- ============================================

-- للتأكد من أن السياسات تعمل بشكل صحيح:
-- 1. المستخدم العادي يجب أن يرى بياناته فقط
-- 2. الأدمن يجب أن يرى جميع المستخدمين
-- 3. المستخدم لا يمكنه تغيير role أو is_active
-- 4. الأدمن لا يمكنه حذف نفسه

-- ============================================
-- ملاحظات مهمة
-- ============================================

-- 🔒 الأمان:
-- - جميع البيانات الحساسة محمية
-- - المستخدم لا يمكنه رؤية بيانات المستخدمين الآخرين
-- - المستخدم لا يمكنه تعديل الحقول الحساسة (role, is_active, subscription_status)
-- - الأدمن فقط يمكنه إدارة جميع المستخدمين

-- 🚀 الأداء:
-- - السياسات محسّنة للأداء
-- - استخدام EXISTS بدلاً من JOIN للسرعة

-- 🔧 الصيانة:
-- - السياسات موثقة بشكل جيد
-- - يمكن تعديلها بسهولة حسب الحاجة

-- ============================================
-- نهاية Migration
-- ============================================
