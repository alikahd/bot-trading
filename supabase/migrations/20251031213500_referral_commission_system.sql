-- =====================================================
-- نظام عمولات الإحالة المحسّن
-- Enhanced Referral Commission System
-- =====================================================

-- إضافة أعمدة جديدة لجدول الكوبونات
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS referrer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5, 2) DEFAULT 10.00;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS is_referral_coupon BOOLEAN DEFAULT false;

-- إضافة أعمدة جديدة لجدول الإحالات
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS discount_rate DECIMAL(5, 2) DEFAULT 10.00;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5, 2) DEFAULT 10.00;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS payment_id UUID;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS subscription_amount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0;

-- جدول العمولات المستحقة (Pending Commissions)
CREATE TABLE IF NOT EXISTS pending_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_id UUID NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
  commission_amount DECIMAL(10, 2) NOT NULL,
  subscription_amount DECIMAL(10, 2) NOT NULL,
  commission_rate DECIMAL(5, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  payment_method VARCHAR(50),
  payment_details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- جدول سجل المدفوعات للعمولات (Commission Payments History)
CREATE TABLE IF NOT EXISTS commission_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_amount DECIMAL(10, 2) NOT NULL,
  commission_ids UUID[] NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  payment_details TEXT,
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('completed', 'failed', 'refunded')),
  paid_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- إنشاء الفهارس
CREATE INDEX IF NOT EXISTS idx_pending_commissions_referrer ON pending_commissions(referrer_id);
CREATE INDEX IF NOT EXISTS idx_pending_commissions_status ON pending_commissions(status);
CREATE INDEX IF NOT EXISTS idx_commission_payments_referrer ON commission_payments(referrer_id);
CREATE INDEX IF NOT EXISTS idx_coupons_referrer ON coupons(referrer_id);
CREATE INDEX IF NOT EXISTS idx_coupons_is_referral ON coupons(is_referral_coupon);

-- دالة لحساب الخصم والعمولة
CREATE OR REPLACE FUNCTION calculate_referral_discount_and_commission(
  p_subscription_amount DECIMAL(10, 2),
  p_discount_rate DECIMAL(5, 2),
  p_commission_rate DECIMAL(5, 2)
)
RETURNS TABLE(
  discount_amount DECIMAL(10, 2),
  commission_amount DECIMAL(10, 2),
  final_amount DECIMAL(10, 2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROUND((p_subscription_amount * p_discount_rate / 100)::NUMERIC, 2) AS discount_amount,
    ROUND((p_subscription_amount * p_commission_rate / 100)::NUMERIC, 2) AS commission_amount,
    ROUND((p_subscription_amount - (p_subscription_amount * p_discount_rate / 100))::NUMERIC, 2) AS final_amount;
END;
$$ LANGUAGE plpgsql;

-- دالة لإنشاء عمولة مستحقة عند إتمام الدفع
CREATE OR REPLACE FUNCTION create_pending_commission()
RETURNS TRIGGER AS $$
DECLARE
  v_commission_amount DECIMAL(10, 2);
BEGIN
  -- التحقق من أن الإحالة مكتملة ولديها مبلغ اشتراك
  IF NEW.status = 'completed' AND NEW.subscription_amount > 0 THEN
    -- حساب العمولة
    v_commission_amount := ROUND((NEW.subscription_amount * NEW.commission_rate / 100)::NUMERIC, 2);
    
    -- إنشاء عمولة مستحقة
    INSERT INTO pending_commissions (
      referrer_id,
      referral_id,
      commission_amount,
      subscription_amount,
      commission_rate,
      status
    ) VALUES (
      NEW.referrer_id,
      NEW.id,
      v_commission_amount,
      NEW.subscription_amount,
      NEW.commission_rate,
      'pending'
    );
    
    -- تحديث مبلغ المكافأة في جدول الإحالات
    NEW.reward_amount := v_commission_amount;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger لإنشاء العمولة تلقائياً
DROP TRIGGER IF EXISTS trigger_create_commission ON referrals;
CREATE TRIGGER trigger_create_commission
  BEFORE UPDATE ON referrals
  FOR EACH ROW
  WHEN (OLD.status != 'completed' AND NEW.status = 'completed')
  EXECUTE FUNCTION create_pending_commission();

-- دالة لإنشاء كوبون إحالة للمستخدم
CREATE OR REPLACE FUNCTION create_referral_coupon(
  p_user_id UUID,
  p_commission_rate DECIMAL(5, 2) DEFAULT 10.00
)
RETURNS VARCHAR(50) AS $$
DECLARE
  v_code VARCHAR(50);
  v_user_code VARCHAR(20);
BEGIN
  -- الحصول على كود الإحالة الخاص بالمستخدم
  SELECT referral_code INTO v_user_code
  FROM users
  WHERE id = p_user_id;
  
  IF v_user_code IS NULL THEN
    RAISE EXCEPTION 'User does not have a referral code';
  END IF;
  
  -- إنشاء كود الكوبون (نفس كود الإحالة)
  v_code := v_user_code;
  
  -- التحقق من عدم وجود الكوبون
  IF NOT EXISTS (SELECT 1 FROM coupons WHERE code = v_code) THEN
    -- إنشاء الكوبون
    INSERT INTO coupons (
      code,
      discount_type,
      discount_value,
      referrer_id,
      commission_rate,
      is_referral_coupon,
      is_active,
      created_by
    ) VALUES (
      v_code,
      'percentage',
      10.00,
      p_user_id,
      p_commission_rate,
      true,
      true,
      p_user_id
    );
  END IF;
  
  RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- إنشاء كوبونات إحالة للمستخدمين الحاليين
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT id, referral_code 
    FROM users 
    WHERE referral_code IS NOT NULL 
    AND role = 'trader'
  LOOP
    BEGIN
      PERFORM create_referral_coupon(user_record.id, 10.00);
    EXCEPTION WHEN OTHERS THEN
      CONTINUE;
    END;
  END LOOP;
END $$;

-- تفعيل Row Level Security للجداول الجديدة
ALTER TABLE pending_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_payments ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للعمولات المستحقة
CREATE POLICY "Users can view their own pending commissions"
  ON pending_commissions FOR SELECT
  USING (auth.uid() = referrer_id);

CREATE POLICY "Admins can view all pending commissions"
  ON pending_commissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update pending commissions"
  ON pending_commissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- سياسات الأمان لسجل المدفوعات
CREATE POLICY "Users can view their own commission payments"
  ON commission_payments FOR SELECT
  USING (auth.uid() = referrer_id);

CREATE POLICY "Admins can view all commission payments"
  ON commission_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can create commission payments"
  ON commission_payments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- تحديث سياسة الكوبونات لتشمل كوبونات الإحالة
DROP POLICY IF EXISTS "Users can view their referral coupons" ON coupons;
CREATE POLICY "Users can view their referral coupons"
  ON coupons FOR SELECT
  USING (
    is_active = true 
    OR auth.uid() = referrer_id
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- إضافة تعليقات على الجداول الجديدة
COMMENT ON TABLE pending_commissions IS 'جدول العمولات المستحقة - يحتوي على العمولات التي لم يتم دفعها بعد';
COMMENT ON TABLE commission_payments IS 'جدول سجل مدفوعات العمولات - يحتوي على تاريخ دفع العمولات';

COMMENT ON COLUMN coupons.referrer_id IS 'معرف المستخدم صاحب كوبون الإحالة';
COMMENT ON COLUMN coupons.commission_rate IS 'نسبة العمولة التي يحصل عليها صاحب الكوبون';
COMMENT ON COLUMN coupons.is_referral_coupon IS 'هل هذا كوبون إحالة (true) أم كوبون عادي (false)';
COMMENT ON COLUMN referrals.discount_rate IS 'نسبة الخصم للمستخدم الجديد';
COMMENT ON COLUMN referrals.commission_rate IS 'نسبة العمولة لصاحب الإحالة';
COMMENT ON COLUMN pending_commissions.status IS 'حالة العمولة: pending (قيد الانتظار), paid (مدفوعة), cancelled (ملغاة)';
