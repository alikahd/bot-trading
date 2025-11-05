-- =====================================================
-- نظام الإحالة والكوبونات المتكامل
-- Referrals and Coupons System
-- =====================================================

-- جدول الإحالات (Referrals)
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referral_code VARCHAR(20) UNIQUE NOT NULL,
  referred_email VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rewarded')),
  reward_amount DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT unique_referrer_code UNIQUE (referrer_id, referral_code)
);

-- جدول الكوبونات (Coupons)
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10, 2) NOT NULL,
  max_uses INTEGER DEFAULT NULL,
  current_uses INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول استخدام الكوبونات (Coupon Usage)
CREATE TABLE IF NOT EXISTS coupon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  discount_applied DECIMAL(10, 2) NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_coupon UNIQUE (coupon_id, user_id)
);

-- إنشاء الفهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user ON coupon_usage(user_id);

-- إضافة عمود referral_code في جدول users إذا لم يكن موجوداً
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'referral_code'
  ) THEN
    ALTER TABLE users ADD COLUMN referral_code VARCHAR(20) UNIQUE;
  END IF;
END $$;

-- دالة لتوليد كود إحالة فريد
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS VARCHAR(20) AS $$
DECLARE
  new_code VARCHAR(20);
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- توليد كود عشوائي من 8 أحرف
    new_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
    
    -- التحقق من عدم وجود الكود
    SELECT EXISTS(SELECT 1 FROM referrals WHERE referral_code = new_code) INTO code_exists;
    
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- دالة لإنشاء كود إحالة تلقائياً عند إنشاء مستخدم جديد
CREATE OR REPLACE FUNCTION create_user_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger لإنشاء كود الإحالة تلقائياً
DROP TRIGGER IF EXISTS trigger_create_referral_code ON users;
CREATE TRIGGER trigger_create_referral_code
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_referral_code();

-- تحديث المستخدمين الحاليين بأكواد إحالة
UPDATE users 
SET referral_code = generate_referral_code() 
WHERE referral_code IS NULL;

-- تفعيل Row Level Security (RLS)
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للإحالات (Referrals)
-- المستخدم يمكنه رؤية إحالاته فقط
CREATE POLICY "Users can view their own referrals"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_id);

-- المستخدم يمكنه إنشاء إحالات جديدة
CREATE POLICY "Users can create referrals"
  ON referrals FOR INSERT
  WITH CHECK (auth.uid() = referrer_id);

-- المدير يمكنه رؤية كل الإحالات
CREATE POLICY "Admins can view all referrals"
  ON referrals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- المدير يمكنه تحديث حالة الإحالات
CREATE POLICY "Admins can update referrals"
  ON referrals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- سياسات الأمان للكوبونات (Coupons)
-- الجميع يمكنهم رؤية الكوبونات النشطة
CREATE POLICY "Anyone can view active coupons"
  ON coupons FOR SELECT
  USING (is_active = true);

-- المدير فقط يمكنه إنشاء الكوبونات
CREATE POLICY "Only admins can create coupons"
  ON coupons FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- المدير فقط يمكنه تحديث الكوبونات
CREATE POLICY "Only admins can update coupons"
  ON coupons FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- المدير فقط يمكنه حذف الكوبونات
CREATE POLICY "Only admins can delete coupons"
  ON coupons FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- سياسات الأمان لاستخدام الكوبونات (Coupon Usage)
-- المستخدم يمكنه رؤية استخداماته للكوبونات
CREATE POLICY "Users can view their coupon usage"
  ON coupon_usage FOR SELECT
  USING (auth.uid() = user_id);

-- المستخدم يمكنه إنشاء سجل استخدام كوبون
CREATE POLICY "Users can create coupon usage"
  ON coupon_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- المدير يمكنه رؤية كل استخدامات الكوبونات
CREATE POLICY "Admins can view all coupon usage"
  ON coupon_usage FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- إضافة تعليقات على الجداول
COMMENT ON TABLE referrals IS 'جدول الإحالات - يحتوي على معلومات الإحالة بين المستخدمين';
COMMENT ON TABLE coupons IS 'جدول الكوبونات - يحتوي على كوبونات الخصم';
COMMENT ON TABLE coupon_usage IS 'جدول استخدام الكوبونات - يتتبع من استخدم أي كوبون';

COMMENT ON COLUMN referrals.status IS 'حالة الإحالة: pending (قيد الانتظار), completed (مكتملة), rewarded (تم المكافأة)';
COMMENT ON COLUMN coupons.discount_type IS 'نوع الخصم: percentage (نسبة مئوية), fixed (مبلغ ثابت)';
COMMENT ON COLUMN coupons.max_uses IS 'الحد الأقصى لعدد الاستخدامات (NULL = غير محدود)';
