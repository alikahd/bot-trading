-- إصلاح جدول المستخدمين وإضافة العمود المفقود
-- تاريخ الإنشاء: 2025-09-28

-- إضافة العمود المفقود 'country' إلى جدول users
ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR(100);

-- التأكد من وجود جميع الأعمدة المطلوبة
DO $$
BEGIN
    -- إضافة عمود country إذا لم يكن موجوداً
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'country') THEN
        ALTER TABLE users ADD COLUMN country VARCHAR(100);
        RAISE NOTICE 'تم إضافة عمود country';
    END IF;

    -- إضافة عمود full_name إذا لم يكن موجوداً
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'full_name') THEN
        ALTER TABLE users ADD COLUMN full_name VARCHAR(255);
        RAISE NOTICE 'تم إضافة عمود full_name';
    END IF;

    -- إضافة عمود email_verified إذا لم يكن موجوداً
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'email_verified') THEN
        ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'تم إضافة عمود email_verified';
    END IF;

    -- إضافة عمود status إذا لم يكن موجوداً
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'status') THEN
        ALTER TABLE users ADD COLUMN status VARCHAR(50) DEFAULT 'pending_email_verification';
        RAISE NOTICE 'تم إضافة عمود status';
    END IF;

    -- إضافة عمود subscription_status إذا لم يكن موجوداً
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'subscription_status') THEN
        ALTER TABLE users ADD COLUMN subscription_status VARCHAR(50) DEFAULT 'inactive';
        RAISE NOTICE 'تم إضافة عمود subscription_status';
    END IF;

    -- إضافة عمود trading_settings إذا لم يكن موجوداً
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'trading_settings') THEN
        ALTER TABLE users ADD COLUMN trading_settings JSONB DEFAULT '{"riskLevel": "medium", "autoExecute": false, "minConfidence": 80, "maxDailyTrades": 20, "preferredTimeframes": ["1m", "2m", "3m", "5m"]}';
        RAISE NOTICE 'تم إضافة عمود trading_settings';
    END IF;

END $$;

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_users_country ON users(country);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);

-- تحديث البيانات الموجودة لتعيين قيم افتراضية
UPDATE users 
SET country = 'غير محدد' 
WHERE country IS NULL;

UPDATE users 
SET full_name = username 
WHERE full_name IS NULL;

UPDATE users 
SET email_verified = FALSE 
WHERE email_verified IS NULL;

UPDATE users 
SET status = 'pending_email_verification' 
WHERE status IS NULL;

UPDATE users 
SET subscription_status = 'inactive' 
WHERE subscription_status IS NULL;

UPDATE users 
SET trading_settings = '{"riskLevel": "medium", "autoExecute": false, "minConfidence": 80, "maxDailyTrades": 20, "preferredTimeframes": ["1m", "2m", "3m", "5m"]}'::jsonb
WHERE trading_settings IS NULL;

-- عرض بنية الجدول المحدثة
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
