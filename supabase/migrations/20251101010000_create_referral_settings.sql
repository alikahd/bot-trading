-- إنشاء جدول إعدادات نظام الإحالة
CREATE TABLE IF NOT EXISTS referral_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  discount_rate DECIMAL(5,2) NOT NULL DEFAULT 10.00,      -- نسبة الخصم للمستخدم الجديد (%)
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 10.00,    -- نسبة العمولة لصاحب الإحالة (%)
  payment_cycle_days INTEGER NOT NULL DEFAULT 15,         -- دورة الدفع (كل كم يوم)
  minimum_payout DECIMAL(10,2) NOT NULL DEFAULT 10.00,    -- الحد الأدنى للسحب ($)
  is_active BOOLEAN NOT NULL DEFAULT true,                -- تفعيل نظام الإحالة
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إضافة constraints للتحقق من القيم
ALTER TABLE referral_settings 
  ADD CONSTRAINT discount_rate_range CHECK (discount_rate >= 0 AND discount_rate <= 50);

ALTER TABLE referral_settings 
  ADD CONSTRAINT commission_rate_range CHECK (commission_rate >= 0 AND commission_rate <= 50);

ALTER TABLE referral_settings 
  ADD CONSTRAINT payment_cycle_days_valid CHECK (payment_cycle_days IN (7, 15, 30));

ALTER TABLE referral_settings 
  ADD CONSTRAINT minimum_payout_positive CHECK (minimum_payout >= 0);

-- إدراج الإعدادات الافتراضية
INSERT INTO referral_settings (discount_rate, commission_rate, payment_cycle_days, minimum_payout, is_active)
VALUES (10.00, 10.00, 15, 10.00, true)
ON CONFLICT DO NOTHING;

-- إنشاء index
CREATE INDEX IF NOT EXISTS idx_referral_settings_active ON referral_settings(is_active);

-- RLS Policies
ALTER TABLE referral_settings ENABLE ROW LEVEL SECURITY;

-- السماح للجميع بالقراءة (لعرض النسب الحالية)
CREATE POLICY "Allow read referral settings for all authenticated users"
  ON referral_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- السماح للأدمن فقط بالتعديل
CREATE POLICY "Allow admin to update referral settings"
  ON referral_settings
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'email' = 'hichamkhad00@gmail.com'
  )
  WITH CHECK (
    auth.jwt() ->> 'email' = 'hichamkhad00@gmail.com'
  );

-- إضافة comments للتوضيح
COMMENT ON TABLE referral_settings IS 'إعدادات نظام الإحالة - يتحكم الأدمن في النسب والدورات';
COMMENT ON COLUMN referral_settings.discount_rate IS 'نسبة الخصم للمستخدم الجديد عند استخدام رابط/كوبون إحالة';
COMMENT ON COLUMN referral_settings.commission_rate IS 'نسبة العمولة لصاحب الإحالة من قيمة الباقة بعد الخصم';
COMMENT ON COLUMN referral_settings.payment_cycle_days IS 'دورة الدفع - كل كم يوم يتم دفع العمولات (7, 15, أو 30)';
COMMENT ON COLUMN referral_settings.minimum_payout IS 'الحد الأدنى من العمولات المطلوب لطلب الدفع';
COMMENT ON COLUMN referral_settings.is_active IS 'تفعيل/تعطيل نظام الإحالة بالكامل';
