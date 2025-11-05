-- إصلاح سياسات RLS لجدول payment_methods لتعمل مع نظام المصادقة البسيط

-- حذف السياسات القديمة
DROP POLICY IF EXISTS "Users can view their own payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can insert their own payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can update their own payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can delete their own payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Admin can view all payment methods" ON payment_methods;

-- تعطيل RLS مؤقتاً لأن نظامنا يستخدم مصادقة بسيطة
-- سنعتمد على التحقق من user_id في الكود بدلاً من RLS
ALTER TABLE payment_methods DISABLE ROW LEVEL SECURITY;

-- ملاحظة: يمكن تفعيل RLS لاحقاً عند الانتقال لـ Supabase Auth
COMMENT ON TABLE payment_methods IS 'طرق الدفع المفضلة للمستخدمين لاستلام العمولات - RLS معطل للعمل مع المصادقة البسيطة';
