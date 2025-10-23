-- دالة لجلب جميع الاشتراكات للمديرين (تتجاوز RLS)
CREATE OR REPLACE FUNCTION get_all_subscriptions_admin()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  plan_id UUID,
  status VARCHAR,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  payment_method VARCHAR,
  payment_reference VARCHAR,
  amount_paid NUMERIC,
  currency VARCHAR,
  auto_renew BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  username VARCHAR,
  email VARCHAR,
  full_name VARCHAR,
  plan_name VARCHAR,
  plan_name_ar VARCHAR,
  duration_months INTEGER,
  price NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.user_id,
    s.plan_id,
    s.status,
    s.start_date,
    s.end_date,
    s.payment_method,
    s.payment_reference,
    s.amount_paid,
    s.currency,
    s.auto_renew,
    s.created_at,
    s.updated_at,
    u.username,
    u.email,
    u.full_name,
    sp.name as plan_name,
    sp.name_ar as plan_name_ar,
    sp.duration_months,
    sp.price
  FROM subscriptions s
  LEFT JOIN users u ON s.user_id = u.id
  LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
  ORDER BY s.created_at DESC;
END;
$$;

-- منح صلاحيات التنفيذ للجميع
GRANT EXECUTE ON FUNCTION get_all_subscriptions_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_subscriptions_admin() TO anon;
