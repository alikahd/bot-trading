-- ============================================
-- 🔧 إصلاح قاعدة البيانات - نسخ ولصق مباشرة
-- ============================================

-- 1. حذف جميع السياسات
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "admins_select_all" ON users;
DROP POLICY IF EXISTS "admins_update_all" ON users;
DROP POLICY IF EXISTS "admins_delete_users" ON users;
DROP POLICY IF EXISTS "referrals_select_as_referrer" ON referrals;
DROP POLICY IF EXISTS "referrals_select_as_referred" ON referrals;
DROP POLICY IF EXISTS "referrals_admins_select_all" ON referrals;
DROP POLICY IF EXISTS "referrals_service_insert" ON referrals;
DROP POLICY IF EXISTS "referrals_service_update" ON referrals;
DROP POLICY IF EXISTS "commissions_select_own" ON pending_commissions;
DROP POLICY IF EXISTS "commissions_admins_select_all" ON pending_commissions;
DROP POLICY IF EXISTS "commissions_admins_update" ON pending_commissions;
DROP POLICY IF EXISTS "commissions_service_insert" ON pending_commissions;
DROP POLICY IF EXISTS "payments_select_own" ON commission_payments;
DROP POLICY IF EXISTS "payments_admins_select_all" ON commission_payments;
DROP POLICY IF EXISTS "payments_admins_insert" ON commission_payments;
DROP POLICY IF EXISTS "coupons_select_active" ON coupons;
DROP POLICY IF EXISTS "coupons_select_own_referral" ON coupons;
DROP POLICY IF EXISTS "coupons_admins_select_all" ON coupons;
DROP POLICY IF EXISTS "coupons_admins_insert" ON coupons;
DROP POLICY IF EXISTS "coupons_admins_update" ON coupons;
DROP POLICY IF EXISTS "coupons_admins_delete" ON coupons;
DROP POLICY IF EXISTS "payment_methods_select_own" ON payment_methods;
DROP POLICY IF EXISTS "payment_methods_insert_own" ON payment_methods;
DROP POLICY IF EXISTS "payment_methods_update_own" ON payment_methods;
DROP POLICY IF EXISTS "payment_methods_delete_own" ON payment_methods;
DROP POLICY IF EXISTS "payment_methods_admins_select" ON payment_methods;
DROP POLICY IF EXISTS "referral_settings_select_all" ON referral_settings;
DROP POLICY IF EXISTS "referral_settings_admins_update" ON referral_settings;
DROP POLICY IF EXISTS "coupon_usage_select_own" ON coupon_usage;
DROP POLICY IF EXISTS "coupon_usage_admins_select" ON coupon_usage;
DROP POLICY IF EXISTS "coupon_usage_service_insert" ON coupon_usage;
DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
DROP POLICY IF EXISTS "notifications_admins_select" ON notifications;
DROP POLICY IF EXISTS "notifications_service_insert" ON notifications;

-- 2. تعطيل RLS على جميع الجداول
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE referrals DISABLE ROW LEVEL SECURITY;
ALTER TABLE pending_commissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE commission_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE coupons DISABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage DISABLE ROW LEVEL SECURITY;
ALTER TABLE referral_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- 3. حذف الدوال والـ Triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 4. حذف الـ Views (العروض)
DROP VIEW IF EXISTS admin_payments_view;
DROP VIEW IF EXISTS payments_with_details;
DROP VIEW IF EXISTS subscription_details;

-- ✅ تم! المشروع عاد للعمل
