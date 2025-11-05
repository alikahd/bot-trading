-- ============================================
-- إصلاح مشكلة Infinite Recursion في جدول users
-- ============================================

-- الخطوة 1: حذف جميع السياسات القديمة
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Admin full access" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable update for users based on id" ON users;

-- الخطوة 2: تعطيل RLS مؤقتاً
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- الخطوة 3: إنشاء سياسات آمنة بدون recursion

-- السماح لجميع المستخدمين المصادق عليهم بقراءة بياناتهم الخاصة
-- استخدام auth.uid() بدلاً من الرجوع لجدول users
CREATE POLICY "users_select_own" ON users
  FOR SELECT
  USING (
    -- السماح بقراءة البيانات الخاصة فقط
    id::text = current_setting('app.current_user_id', true)
    OR
    -- السماح للأدمن بقراءة كل شيء (بدون الرجوع لجدول users)
    current_setting('app.current_user_role', true) = 'admin'
  );

-- السماح للمستخدمين بتحديث بياناتهم الخاصة فقط
CREATE POLICY "users_update_own" ON users
  FOR UPDATE
  USING (
    id::text = current_setting('app.current_user_id', true)
    OR
    current_setting('app.current_user_role', true) = 'admin'
  );

-- السماح بإنشاء مستخدمين جدد (للتسجيل)
CREATE POLICY "users_insert_new" ON users
  FOR INSERT
  WITH CHECK (true); -- السماح للجميع بالتسجيل

-- الخطوة 4: تفعيل RLS مرة أخرى
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ملاحظات مهمة:
-- ============================================
-- 1. استخدمنا current_setting بدلاً من الرجوع لجدول users
-- 2. يجب تعيين app.current_user_id و app.current_user_role في كل طلب
-- 3. هذا يتطلب تحديث الكود في realSupabaseService.ts

COMMENT ON POLICY "users_select_own" ON users IS 
  'السماح للمستخدمين بقراءة بياناتهم الخاصة فقط - بدون recursion';

COMMENT ON POLICY "users_update_own" ON users IS 
  'السماح للمستخدمين بتحديث بياناتهم الخاصة فقط - بدون recursion';

COMMENT ON POLICY "users_insert_new" ON users IS 
  'السماح بإنشاء مستخدمين جدد للتسجيل';
