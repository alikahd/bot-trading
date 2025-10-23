-- ============================================
-- إعداد قاعدة البيانات الكاملة لنظام التسجيل والاشتراك والدفع
-- ============================================

-- 1. إنشاء الجداول الأساسية (إذا لم تكن موجودة)
-- ============================================

-- جدول المستخدمين
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    country TEXT,
    role TEXT NOT NULL DEFAULT 'trader' CHECK (role IN ('admin', 'trader')),
    is_active BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'pending_email_verification' CHECK (status IN (
        'pending_email_verification',
        'pending_subscription',
        'pending_payment',
        'payment_pending_review',
        'active',
        'suspended',
        'cancelled'
    )),
    subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'expired', 'cancelled')),
    subscription_end_date TIMESTAMP WITH TIME ZONE,
    trial_end_date TIMESTAMP WITH TIME ZONE,
    is_trial BOOLEAN DEFAULT FALSE,
    trading_settings JSONB DEFAULT '{}',
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول باقات الاشتراك
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    description TEXT,
    description_ar TEXT,
    price NUMERIC(10, 2) NOT NULL,
    duration TEXT NOT NULL,
    duration_months INTEGER NOT NULL,
    features JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول الاشتراكات
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
    status TEXT DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'cancelled', 'expired')),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    auto_renew BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول المدفوعات
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    payment_method TEXT NOT NULL CHECK (payment_method IN ('paypal', 'credit_card', 'bitcoin', 'ethereum', 'usdt', 'crypto')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'reviewing', 'refunded')),
    transaction_id TEXT,
    crypto_proof_image TEXT,
    crypto_wallet_address TEXT,
    admin_review_status TEXT DEFAULT 'pending' CHECK (admin_review_status IN ('pending', 'approved', 'rejected')),
    admin_review_notes TEXT,
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. إنشاء الفهارس لتحسين الأداء
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON subscriptions(end_date);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_admin_review_status ON payments(admin_review_status);

-- 3. إنشاء دوال قاعدة البيانات
-- ============================================

-- دالة تحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- تطبيق الدالة على الجداول
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON subscription_plans;
CREATE TRIGGER update_subscription_plans_updated_at
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- دالة للحصول على جميع الاشتراكات (للأدمن)
CREATE OR REPLACE FUNCTION get_all_subscriptions_admin()
RETURNS TABLE (
    id UUID,
    user_id UUID,
    plan_id UUID,
    status TEXT,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    username TEXT,
    email TEXT,
    full_name TEXT,
    plan_name TEXT,
    plan_name_ar TEXT,
    duration_months INTEGER,
    price NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.user_id,
        s.plan_id,
        s.status,
        s.start_date,
        s.end_date,
        s.created_at,
        s.updated_at,
        u.username,
        u.email,
        u.full_name,
        sp.name AS plan_name,
        sp.name_ar AS plan_name_ar,
        sp.duration_months,
        sp.price
    FROM subscriptions s
    INNER JOIN users u ON s.user_id = u.id
    INNER JOIN subscription_plans sp ON s.plan_id = sp.id
    ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة للحصول على جميع المدفوعات مع التفاصيل
CREATE OR REPLACE FUNCTION get_all_payments_with_details()
RETURNS TABLE (
    id UUID,
    user_id UUID,
    subscription_id UUID,
    amount NUMERIC,
    currency TEXT,
    payment_method TEXT,
    status TEXT,
    payment_reference TEXT,
    proof_image TEXT,
    admin_review_status TEXT,
    admin_review_notes TEXT,
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    user_name TEXT,
    user_email TEXT,
    plan_name TEXT,
    plan_name_ar TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.user_id,
        p.subscription_id,
        p.amount,
        p.currency,
        p.payment_method,
        p.status,
        p.transaction_id AS payment_reference,
        p.crypto_proof_image AS proof_image,
        p.admin_review_status,
        p.admin_review_notes,
        p.reviewed_by,
        p.reviewed_at,
        p.created_at,
        p.updated_at,
        u.username AS user_name,
        u.email AS user_email,
        COALESCE(sp.name, 'غير محدد') AS plan_name,
        COALESCE(sp.name_ar, 'غير محدد') AS plan_name_ar
    FROM payments p
    INNER JOIN users u ON p.user_id = u.id
    LEFT JOIN subscriptions s ON p.subscription_id = s.id
    LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة تحديث حالة الدفع مع تفعيل الاشتراك
CREATE OR REPLACE FUNCTION update_payment_status_with_subscription(
    payment_id UUID,
    new_status TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    v_subscription_id UUID;
BEGIN
    -- الحصول على معلومات الدفع
    SELECT user_id, subscription_id INTO v_user_id, v_subscription_id
    FROM payments
    WHERE id = payment_id;

    -- تحديث حالة الدفع
    UPDATE payments
    SET status = new_status,
        admin_review_status = CASE 
            WHEN new_status = 'completed' THEN 'approved'
            WHEN new_status = 'failed' THEN 'rejected'
            ELSE admin_review_status
        END,
        updated_at = NOW()
    WHERE id = payment_id;

    -- إذا كانت الحالة مكتملة، تفعيل الاشتراك والمستخدم
    IF new_status = 'completed' THEN
        -- تفعيل الاشتراك
        UPDATE subscriptions
        SET status = 'active',
            updated_at = NOW()
        WHERE id = v_subscription_id;

        -- تفعيل المستخدم
        UPDATE users
        SET is_active = TRUE,
            status = 'active',
            subscription_status = 'active',
            updated_at = NOW()
        WHERE id = v_user_id;
    
    -- إذا كانت الحالة فاشلة، إلغاء الاشتراك
    ELSIF new_status = 'failed' THEN
        UPDATE subscriptions
        SET status = 'cancelled',
            updated_at = NOW()
        WHERE id = v_subscription_id;

        UPDATE users
        SET is_active = FALSE,
            status = 'pending_payment',
            subscription_status = 'inactive',
            updated_at = NOW()
        WHERE id = v_user_id;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة إحصائيات المدفوعات
CREATE OR REPLACE FUNCTION get_payment_statistics()
RETURNS TABLE (
    total BIGINT,
    pending BIGINT,
    reviewing BIGINT,
    completed BIGINT,
    failed BIGINT,
    total_revenue NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT AS total,
        COUNT(*) FILTER (WHERE status = 'pending')::BIGINT AS pending,
        COUNT(*) FILTER (WHERE status = 'reviewing')::BIGINT AS reviewing,
        COUNT(*) FILTER (WHERE status = 'completed')::BIGINT AS completed,
        COUNT(*) FILTER (WHERE status = 'failed')::BIGINT AS failed,
        COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0) AS total_revenue
    FROM payments;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. إعداد Row Level Security (RLS)
-- ============================================

-- تفعيل RLS على الجداول
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- سياسات users
DROP POLICY IF EXISTS "Users can view own data" ON users;
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid() = auth_id);

DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid() = auth_id);

DROP POLICY IF EXISTS "Admins can view all users" ON users;
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE auth_id = auth.uid() AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can update all users" ON users;
CREATE POLICY "Admins can update all users" ON users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE auth_id = auth.uid() AND role = 'admin'
        )
    );

-- سياسات subscription_plans
DROP POLICY IF EXISTS "Anyone can view active plans" ON subscription_plans;
CREATE POLICY "Anyone can view active plans" ON subscription_plans
    FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admins can manage plans" ON subscription_plans;
CREATE POLICY "Admins can manage plans" ON subscription_plans
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE auth_id = auth.uid() AND role = 'admin'
        )
    );

-- سياسات subscriptions
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
CREATE POLICY "Users can view own subscriptions" ON subscriptions
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM users WHERE auth_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can view all subscriptions" ON subscriptions;
CREATE POLICY "Admins can view all subscriptions" ON subscriptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE auth_id = auth.uid() AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can manage subscriptions" ON subscriptions;
CREATE POLICY "Admins can manage subscriptions" ON subscriptions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE auth_id = auth.uid() AND role = 'admin'
        )
    );

-- سياسات payments
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
CREATE POLICY "Users can view own payments" ON payments
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM users WHERE auth_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create own payments" ON payments;
CREATE POLICY "Users can create own payments" ON payments
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM users WHERE auth_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update own payments" ON payments;
CREATE POLICY "Users can update own payments" ON payments
    FOR UPDATE USING (
        user_id IN (
            SELECT id FROM users WHERE auth_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can view all payments" ON payments;
CREATE POLICY "Admins can view all payments" ON payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE auth_id = auth.uid() AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can manage payments" ON payments;
CREATE POLICY "Admins can manage payments" ON payments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE auth_id = auth.uid() AND role = 'admin'
        )
    );

-- 5. إدراج بيانات تجريبية للباقات
-- ============================================

INSERT INTO subscription_plans (name, name_ar, description, description_ar, price, duration, duration_months, features, is_active)
VALUES 
    (
        'Basic Monthly',
        'الباقة الأساسية الشهرية',
        'Perfect for beginners',
        'مثالية للمبتدئين',
        29.99,
        'شهري',
        1,
        '["تداول تلقائي", "إشارات أساسية", "دعم فني"]'::jsonb,
        TRUE
    ),
    (
        'Pro Monthly',
        'الباقة الاحترافية الشهرية',
        'For serious traders',
        'للمتداولين المحترفين',
        49.99,
        'شهري',
        1,
        '["تداول تلقائي متقدم", "إشارات متقدمة", "تحليلات AI", "دعم فني أولوية"]'::jsonb,
        TRUE
    ),
    (
        'Premium Annual',
        'الباقة المميزة السنوية',
        'Best value for committed traders',
        'أفضل قيمة للمتداولين الملتزمين',
        499.99,
        'سنوي',
        12,
        '["كل مميزات Pro", "استراتيجيات مخصصة", "تدريب شخصي", "دعم VIP 24/7"]'::jsonb,
        TRUE
    )
ON CONFLICT DO NOTHING;

-- 6. إنشاء Storage Bucket لصور إثبات الدفع
-- ============================================
-- ملاحظة: يجب تنفيذ هذا من لوحة تحكم Supabase أو عبر API
-- Bucket name: payment-proofs
-- Public: false
-- Allowed MIME types: image/jpeg, image/png, image/jpg, image/webp

-- ============================================
-- انتهى إعداد قاعدة البيانات
-- ============================================
