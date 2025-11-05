-- إضافة حقل referral_code للمستخدمين مع قيد unique
-- يسمح لكل مستخدم باختيار رمز إحالة مخصص وفريد

-- إضافة عمود referral_code إذا لم يكن موجوداً
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(50) UNIQUE;

-- إنشاء index لتسريع البحث
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);

-- إضافة constraint للتأكد من أن الرمز يحتوي على أحرف وأرقام فقط (وشرطة وشرطة سفلية)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'referral_code_format'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT referral_code_format 
      CHECK (referral_code ~ '^[A-Za-z0-9_-]+$');
  END IF;
END $$;

-- إضافة comment للتوضيح
COMMENT ON COLUMN users.referral_code IS 'رمز الإحالة المخصص الذي يختاره المستخدم - يجب أن يكون فريداً';
