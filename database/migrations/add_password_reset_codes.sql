-- Migration: Add password_reset_codes table
-- إنشاء جدول رموز استعادة كلمة المرور

-- إنشاء الجدول
CREATE TABLE IF NOT EXISTS password_reset_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  reset_code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_reset_code CHECK (LENGTH(reset_code) = 6)
);

-- إنشاء فهارس للأداء
CREATE INDEX idx_password_reset_codes_user_id ON password_reset_codes(user_id);
CREATE INDEX idx_password_reset_codes_email ON password_reset_codes(email);
CREATE INDEX idx_password_reset_codes_code ON password_reset_codes(reset_code);
CREATE INDEX idx_password_reset_codes_expires_at ON password_reset_codes(expires_at);

-- Row Level Security
ALTER TABLE password_reset_codes ENABLE ROW LEVEL SECURITY;

-- السماح للجميع بإنشاء رموز استعادة (بدون مصادقة)
CREATE POLICY "Allow public insert for password reset" ON password_reset_codes
  FOR INSERT
  WITH CHECK (true);

-- السماح للمستخدمين بقراءة رموزهم الخاصة فقط
CREATE POLICY "Users can read their own reset codes" ON password_reset_codes
  FOR SELECT
  USING (email = current_setting('request.jwt.claims', true)::json->>'email');

-- ============================================
-- دالة إنشاء رمز استعادة جديد
-- ============================================
CREATE OR REPLACE FUNCTION create_password_reset_code(
  p_email VARCHAR
)
RETURNS TABLE (
  reset_code VARCHAR,
  expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_reset_code VARCHAR(6);
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- البحث عن المستخدم بالبريد الإلكتروني
  SELECT id INTO v_user_id
  FROM users
  WHERE email = p_email AND is_active = true
  LIMIT 1;

  -- إذا لم يتم العثور على المستخدم
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found or inactive';
  END IF;

  -- إلغاء تفعيل جميع الرموز السابقة لهذا المستخدم
  UPDATE password_reset_codes
  SET used = true
  WHERE user_id = v_user_id AND used = false;

  -- إنشاء رمز جديد (6 أرقام)
  v_reset_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  
  -- تاريخ انتهاء الصلاحية (15 دقيقة)
  v_expires_at := NOW() + INTERVAL '15 minutes';

  -- إدراج الرمز الجديد
  INSERT INTO password_reset_codes (user_id, email, reset_code, expires_at)
  VALUES (v_user_id, p_email, v_reset_code, v_expires_at);

  -- إرجاع الرمز وتاريخ الانتهاء
  RETURN QUERY SELECT v_reset_code, v_expires_at;
END;
$$;

-- ============================================
-- دالة التحقق من رمز الاستعادة
-- ============================================
CREATE OR REPLACE FUNCTION verify_reset_code(
  p_email VARCHAR,
  p_code VARCHAR
)
RETURNS TABLE (
  valid BOOLEAN,
  user_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_code_record RECORD;
BEGIN
  -- البحث عن الرمز
  SELECT * INTO v_code_record
  FROM password_reset_codes
  WHERE email = p_email 
    AND reset_code = p_code 
    AND used = false 
    AND expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT 1;

  -- إذا لم يتم العثور على الرمز أو انتهت صلاحيته
  IF v_code_record IS NULL THEN
    RETURN QUERY SELECT false, NULL::UUID;
    RETURN;
  END IF;

  -- الرمز صالح
  RETURN QUERY SELECT true, v_code_record.user_id;
END;
$$;

-- ============================================
-- دالة إعادة تعيين كلمة المرور
-- ============================================
CREATE OR REPLACE FUNCTION reset_password_with_code(
  p_email VARCHAR,
  p_code VARCHAR,
  p_new_password VARCHAR
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_valid BOOLEAN;
BEGIN
  -- التحقق من الرمز
  SELECT verify_reset_code.valid, verify_reset_code.user_id
  INTO v_valid, v_user_id
  FROM verify_reset_code(p_email, p_code);

  -- إذا كان الرمز غير صالح
  IF NOT v_valid THEN
    RETURN QUERY SELECT false, 'Invalid or expired reset code'::TEXT;
    RETURN;
  END IF;

  -- تحديث كلمة المرور
  UPDATE users
  SET password = p_new_password,
      updated_at = NOW()
  WHERE id = v_user_id;

  -- تعليم الرمز كمستخدم
  UPDATE password_reset_codes
  SET used = true
  WHERE email = p_email AND reset_code = p_code;

  -- النجاح
  RETURN QUERY SELECT true, 'Password reset successfully'::TEXT;
END;
$$;

-- ============================================
-- دالة تنظيف الرموز المنتهية (يمكن تشغيلها دورياً)
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_expired_reset_codes()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- حذف الرموز المنتهية أو المستخدمة الأقدم من 24 ساعة
  DELETE FROM password_reset_codes
  WHERE (expires_at < NOW() OR used = true)
    AND created_at < NOW() - INTERVAL '24 hours';
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN v_deleted_count;
END;
$$;

-- إضافة تعليقات توضيحية
COMMENT ON TABLE password_reset_codes IS 'جدول رموز استعادة كلمة المرور';
COMMENT ON FUNCTION create_password_reset_code IS 'إنشاء رمز استعادة جديد للمستخدم';
COMMENT ON FUNCTION verify_reset_code IS 'التحقق من صحة رمز الاستعادة';
COMMENT ON FUNCTION reset_password_with_code IS 'إعادة تعيين كلمة المرور باستخدام الرمز';
COMMENT ON FUNCTION cleanup_expired_reset_codes IS 'تنظيف الرموز المنتهية الصلاحية';
