-- إنشاء جدول المستخدمين الكامل
-- تاريخ الإنشاء: 2025-09-28

-- إنشاء جدول users إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    auth_id UUID UNIQUE,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    country VARCHAR(100),
    role VARCHAR(20) DEFAULT 'trader' CHECK (role IN ('admin', 'trader')),
    is_active BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'pending_email_verification',
    subscription_status VARCHAR(50) DEFAULT 'inactive',
    subscription_end_date TIMESTAMP WITH TIME ZONE,
    trading_settings JSONB DEFAULT '{"riskLevel": "medium", "autoExecute": false, "minConfidence": 80, "maxDailyTrades": 20, "preferredTimeframes": ["1m", "2m", "3m", "5m"]}',
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- إنشاء trigger لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- إضافة قيود الأمان
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- سياسة للسماح للمستخدمين برؤية بياناتهم فقط
DROP POLICY IF EXISTS "Users can view own data" ON users;
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth_id = auth.uid());

-- سياسة للسماح للمستخدمين بتحديث بياناتهم فقط
DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth_id = auth.uid());

-- سياسة للسماح للمديرين برؤية جميع البيانات
DROP POLICY IF EXISTS "Admins can view all data" ON users;
CREATE POLICY "Admins can view all data" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE auth_id = auth.uid() AND role = 'admin'
        )
    );

-- سياسة للسماح للمديرين بتحديث جميع البيانات
DROP POLICY IF EXISTS "Admins can update all data" ON users;
CREATE POLICY "Admins can update all data" ON users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE auth_id = auth.uid() AND role = 'admin'
        )
    );

-- سياسة للسماح بإنشاء مستخدمين جدد
DROP POLICY IF EXISTS "Allow user registration" ON users;
CREATE POLICY "Allow user registration" ON users
    FOR INSERT WITH CHECK (true);

-- إدراج مستخدم أدمن افتراضي إذا لم يكن موجوداً
INSERT INTO users (username, email, full_name, role, is_active, email_verified, status, subscription_status)
VALUES ('admin', 'admin@tradingbot.com', 'المدير العام', 'admin', true, true, 'active', 'active')
ON CONFLICT (username) DO NOTHING;

-- عرض إحصائيات الجدول
SELECT 
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE role = 'admin') as admin_users,
    COUNT(*) FILTER (WHERE role = 'trader') as trader_users,
    COUNT(*) FILTER (WHERE is_active = true) as active_users,
    COUNT(*) FILTER (WHERE email_verified = true) as verified_users
FROM users;
