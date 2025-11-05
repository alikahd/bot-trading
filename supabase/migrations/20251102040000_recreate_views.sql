-- =====================================================
-- 🔄 إعادة إنشاء الـ Views بدون RLS
-- لعرض بيانات المدفوعات والاشتراكات في لوحة الإدارة
-- =====================================================

-- =====================================================
-- 1. admin_payments_view - عرض المدفوعات للأدمن
-- =====================================================
CREATE OR REPLACE VIEW admin_payments_view AS
SELECT 
  p.id,
  p.user_id,
  p.amount,
  p.currency,
  p.payment_method,
  p.status,
  p.transaction_id,
  p.payment_proof_url,  -- 🖼️ رابط صورة إثبات الدفع
  p.subscription_plan_id,
  p.created_at,
  p.updated_at,
  p.approved_at,
  p.approved_by,
  p.rejection_reason,
  -- معلومات المستخدم
  u.username,
  u.email,
  u.full_name,
  u.country,
  -- معلومات الباقة
  sp.name as plan_name,
  sp.name_ar as plan_name_ar,
  sp.duration_months,
  -- معلومات الأدمن الذي وافق
  admin.username as approved_by_username,
  admin.email as approved_by_email
FROM payments p
LEFT JOIN users u ON p.user_id = u.id
LEFT JOIN subscription_plans sp ON p.subscription_plan_id = sp.id
LEFT JOIN users admin ON p.approved_by = admin.id
ORDER BY p.created_at DESC;

COMMENT ON VIEW admin_payments_view IS 'عرض شامل للمدفوعات مع معلومات المستخدم والباقة - للأدمن';

-- =====================================================
-- 2. payments_with_details - تفاصيل المدفوعات
-- =====================================================
CREATE OR REPLACE VIEW payments_with_details AS
SELECT 
  p.id,
  p.user_id,
  p.amount,
  p.currency,
  p.payment_method,
  p.status,
  p.transaction_id,
  p.payment_proof_url,  -- 🖼️ رابط صورة إثبات الدفع
  p.subscription_plan_id,
  p.created_at,
  p.updated_at,
  p.approved_at,
  p.approved_by,
  p.rejection_reason,
  -- معلومات المستخدم
  u.id as user_db_id,
  u.username,
  u.email,
  u.full_name,
  u.country,
  u.role,
  u.status as user_status,
  -- معلومات الباقة
  sp.name as plan_name,
  sp.name_ar as plan_name_ar,
  sp.name_fr as plan_name_fr,
  sp.duration_months,
  sp.price as plan_price,
  sp.features,
  sp.features_ar,
  sp.features_fr,
  -- حسابات
  CASE 
    WHEN p.status = 'completed' THEN true
    WHEN p.status = 'approved' THEN true
    ELSE false
  END as is_paid,
  CASE 
    WHEN p.status = 'pending' THEN true
    WHEN p.status = 'review' THEN true
    ELSE false
  END as needs_review,
  -- وقت الانتظار
  CASE 
    WHEN p.status IN ('pending', 'review') THEN 
      EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600  -- ساعات
    ELSE NULL
  END as waiting_hours
FROM payments p
LEFT JOIN users u ON p.user_id = u.id
LEFT JOIN subscription_plans sp ON p.subscription_plan_id = sp.id
ORDER BY 
  CASE p.status
    WHEN 'review' THEN 1      -- الأولوية للمراجعة
    WHEN 'pending' THEN 2     -- ثم المعلقة
    WHEN 'completed' THEN 3   -- ثم المكتملة
    WHEN 'approved' THEN 4    -- ثم الموافق عليها
    ELSE 5
  END,
  p.created_at DESC;

COMMENT ON VIEW payments_with_details IS 'عرض تفصيلي للمدفوعات مع حسابات وترتيب حسب الأولوية';

-- =====================================================
-- 3. subscription_details - تفاصيل الاشتراكات
-- =====================================================
CREATE OR REPLACE VIEW subscription_details AS
SELECT 
  u.id as user_id,
  u.username,
  u.email,
  u.full_name,
  u.country,
  u.role,
  u.status as user_status,
  u.subscription_status,
  u.subscription_end_date,
  u.trial_end_date,
  u.is_trial,
  u.created_at as user_created_at,
  u.last_login,
  -- معلومات آخر دفعة
  p.id as last_payment_id,
  p.amount as last_payment_amount,
  p.currency as last_payment_currency,
  p.payment_method as last_payment_method,
  p.status as last_payment_status,
  p.payment_proof_url as last_payment_proof,  -- 🖼️ آخر صورة إثبات
  p.created_at as last_payment_date,
  p.approved_at as last_payment_approved_at,
  -- معلومات الباقة
  sp.name as plan_name,
  sp.name_ar as plan_name_ar,
  sp.duration_months,
  sp.price as plan_price,
  -- حسابات
  CASE 
    WHEN u.subscription_status = 'active' THEN true
    ELSE false
  END as is_active_subscriber,
  CASE 
    WHEN u.subscription_end_date IS NOT NULL THEN
      EXTRACT(DAY FROM (u.subscription_end_date::timestamp - NOW()))
    ELSE NULL
  END as days_remaining,
  CASE 
    WHEN u.is_trial = true AND u.trial_end_date IS NOT NULL THEN
      EXTRACT(DAY FROM (u.trial_end_date::timestamp - NOW()))
    ELSE NULL
  END as trial_days_remaining
FROM users u
LEFT JOIN LATERAL (
  SELECT * FROM payments 
  WHERE user_id = u.id 
  ORDER BY created_at DESC 
  LIMIT 1
) p ON true
LEFT JOIN subscription_plans sp ON p.subscription_plan_id = sp.id
ORDER BY 
  CASE u.subscription_status
    WHEN 'active' THEN 1
    WHEN 'expired' THEN 2
    WHEN 'cancelled' THEN 3
    ELSE 4
  END,
  u.created_at DESC;

COMMENT ON VIEW subscription_details IS 'عرض شامل لتفاصيل اشتراكات المستخدمين مع آخر دفعة';

-- =====================================================
-- 4. منح صلاحيات القراءة للجميع (لا RLS)
-- =====================================================
GRANT SELECT ON admin_payments_view TO anon, authenticated;
GRANT SELECT ON payments_with_details TO anon, authenticated;
GRANT SELECT ON subscription_details TO anon, authenticated;

-- ✅ تم إعادة إنشاء الـ Views بنجاح!
-- ✅ الآن يمكن للأدمن رؤية صور إثبات الدفع (payment_proof_url)
