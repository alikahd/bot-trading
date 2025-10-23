-- إنشاء جدول تفعيل البريد الإلكتروني
CREATE TABLE IF NOT EXISTS email_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    verification_code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON email_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email);
CREATE INDEX IF NOT EXISTS idx_email_verifications_code ON email_verifications(verification_code);
CREATE INDEX IF NOT EXISTS idx_email_verifications_expires_at ON email_verifications(expires_at);

-- إضافة عمود تفعيل البريد لجدول المستخدمين إذا لم يكن موجوداً
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE;

-- إنشاء فهرس لعمود تفعيل البريد
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);

-- دالة لتنظيف رموز التفعيل المنتهية الصلاحية
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS void AS $$
BEGIN
    DELETE FROM email_verifications 
    WHERE expires_at < NOW() AND is_verified = FALSE;
END;
$$ LANGUAGE plpgsql;

-- إنشاء مهمة مجدولة لتنظيف الرموز المنتهية الصلاحية (تشغل كل ساعة)
-- ملاحظة: هذا يتطلب امتداد pg_cron في Supabase
-- SELECT cron.schedule('cleanup-expired-codes', '0 * * * *', 'SELECT cleanup_expired_verification_codes();');

-- دالة لإنشاء رمز تفعيل جديد
CREATE OR REPLACE FUNCTION create_verification_code(
    p_user_id UUID,
    p_email VARCHAR(255),
    p_code VARCHAR(6),
    p_expires_minutes INTEGER DEFAULT 15
)
RETURNS UUID AS $$
DECLARE
    verification_id UUID;
BEGIN
    -- حذف أي رموز سابقة غير مستخدمة للمستخدم
    DELETE FROM email_verifications 
    WHERE user_id = p_user_id AND is_verified = FALSE;
    
    -- إنشاء رمز جديد
    INSERT INTO email_verifications (
        user_id,
        email,
        verification_code,
        expires_at
    ) VALUES (
        p_user_id,
        p_email,
        p_code,
        NOW() + INTERVAL '1 minute' * p_expires_minutes
    ) RETURNING id INTO verification_id;
    
    RETURN verification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة للتحقق من رمز التفعيل
CREATE OR REPLACE FUNCTION verify_email_code(
    p_email VARCHAR(255),
    p_code VARCHAR(6)
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    user_id UUID
) AS $$
DECLARE
    verification_record RECORD;
    user_record RECORD;
BEGIN
    -- البحث عن رمز التفعيل
    SELECT * INTO verification_record
    FROM email_verifications
    WHERE email = p_email 
    AND verification_code = p_code 
    AND is_verified = FALSE
    AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- التحقق من وجود الرمز
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'رمز التفعيل غير صحيح أو منتهي الصلاحية'::TEXT, NULL::UUID;
        RETURN;
    END IF;
    
    -- تحديث حالة التفعيل
    UPDATE email_verifications 
    SET is_verified = TRUE, verified_at = NOW()
    WHERE id = verification_record.id;
    
    -- تحديث حالة المستخدم
    UPDATE users 
    SET email_verified = TRUE, email_verified_at = NOW()
    WHERE id = verification_record.user_id;
    
    RETURN QUERY SELECT TRUE, 'تم تفعيل البريد الإلكتروني بنجاح'::TEXT, verification_record.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة للتحقق من حالة تفعيل البريد
CREATE OR REPLACE FUNCTION check_email_verification_status(p_email VARCHAR(255))
RETURNS TABLE(
    is_verified BOOLEAN,
    user_id UUID
) AS $$
BEGIN
    RETURN QUERY 
    SELECT u.email_verified, u.id
    FROM users u
    WHERE u.email = p_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إعدادات الأمان (RLS)
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;

-- سياسة للمستخدمين لرؤية رموز التفعيل الخاصة بهم فقط
CREATE POLICY "Users can view their own verification codes" ON email_verifications
    FOR SELECT USING (
        auth.uid()::text = user_id::text OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_id = auth.uid() 
            AND users.id = email_verifications.user_id
        )
    );

-- سياسة للمديرين لرؤية جميع رموز التفعيل
CREATE POLICY "Admins can view all verification codes" ON email_verifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- منح الصلاحيات للخدمة
GRANT SELECT, INSERT, UPDATE, DELETE ON email_verifications TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION create_verification_code TO authenticated;
GRANT EXECUTE ON FUNCTION verify_email_code TO authenticated;
GRANT EXECUTE ON FUNCTION check_email_verification_status TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_verification_codes TO authenticated;
