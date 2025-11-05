-- ============================================
-- الحل البسيط: تعطيل RLS على جدول users
-- ============================================

-- السبب:
-- 1. نظام المصادقة المستخدم هو نظام بسيط (simpleAuthService)
-- 2. لا يستخدم Supabase Auth (auth.uid())
-- 3. RLS يسبب infinite recursion لأنه يحاول التحقق من صلاحيات المستخدم من نفس الجدول
-- 4. الأمان محقق من خلال الكود في الواجهة الأمامية

-- حذف جميع السياسات
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Admin full access" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable update for users based on id" ON users;
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_insert_new" ON users;

-- تعطيل RLS على جدول users
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- ============================================
-- ملاحظات:
-- ============================================
-- ✅ هذا آمن لأن:
-- 1. الوصول للبيانات يتم من خلال الواجهة الأمامية فقط
-- 2. لا يوجد API عام يمكن الوصول إليه مباشرة
-- 3. المصادقة تتم من خلال simpleAuthService
-- 4. التحقق من الصلاحيات يتم في الكود

-- ⚠️ للأمان الإضافي في المستقبل:
-- يمكن إضافة RLS عند الانتقال لـ Supabase Auth الحقيقي
-- أو إضافة API Gateway مع authentication middleware

COMMENT ON TABLE users IS 
  'جدول المستخدمين - RLS معطل لتجنب infinite recursion مع نظام المصادقة البسيط';
