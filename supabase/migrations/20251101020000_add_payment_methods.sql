-- إضافة جدول طرق الدفع للمستخدمين
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- نوع طريقة الدفع
  payment_type VARCHAR(50) NOT NULL CHECK (payment_type IN ('paypal', 'bank_transfer', 'western_union', 'cryptocurrency', 'other')),
  
  -- تفاصيل الدفع (JSON لمرونة أكبر)
  payment_details JSONB NOT NULL DEFAULT '{}',
  
  -- هل هي الطريقة المفضلة
  is_primary BOOLEAN DEFAULT true,
  
  -- حالة التحقق (للأمان)
  is_verified BOOLEAN DEFAULT false,
  
  -- التواريخ
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- كل مستخدم يمكن أن يكون له طريقة واحدة فقط من كل نوع
  UNIQUE(user_id, payment_type)
);

-- Index للبحث السريع
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_primary ON payment_methods(user_id, is_primary) WHERE is_primary = true;

-- Trigger لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_payment_methods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_methods_updated_at();

-- Trigger للتأكد من وجود طريقة واحدة فقط كـ primary
CREATE OR REPLACE FUNCTION ensure_single_primary_payment_method()
RETURNS TRIGGER AS $$
BEGIN
  -- إذا كانت الطريقة الجديدة primary، إلغاء primary من الطرق الأخرى
  IF NEW.is_primary = true THEN
    UPDATE payment_methods 
    SET is_primary = false 
    WHERE user_id = NEW.user_id 
      AND id != NEW.id 
      AND is_primary = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_primary_payment_method
  BEFORE INSERT OR UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_primary_payment_method();

-- RLS Policies
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- المستخدمون يرون طرق الدفع الخاصة بهم فقط
CREATE POLICY "Users can view their own payment methods"
  ON payment_methods
  FOR SELECT
  USING (auth.uid() = user_id);

-- المستخدمون يمكنهم إضافة طرق دفع خاصة بهم
CREATE POLICY "Users can insert their own payment methods"
  ON payment_methods
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- المستخدمون يمكنهم تحديث طرق الدفع الخاصة بهم
CREATE POLICY "Users can update their own payment methods"
  ON payment_methods
  FOR UPDATE
  USING (auth.uid() = user_id);

-- المستخدمون يمكنهم حذف طرق الدفع الخاصة بهم
CREATE POLICY "Users can delete their own payment methods"
  ON payment_methods
  FOR DELETE
  USING (auth.uid() = user_id);

-- الأدمن يمكنه رؤية جميع طرق الدفع (للعمولات)
CREATE POLICY "Admin can view all payment methods"
  ON payment_methods
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
        AND (users.role = 'admin' OR users.email = 'hichamkhad00@gmail.com')
    )
  );

-- إضافة ملاحظات للجدول
COMMENT ON TABLE payment_methods IS 'طرق الدفع المفضلة للمستخدمين لاستلام العمولات';
COMMENT ON COLUMN payment_methods.payment_type IS 'نوع طريقة الدفع: paypal, bank_transfer, western_union, cryptocurrency, other';
COMMENT ON COLUMN payment_methods.payment_details IS 'تفاصيل الدفع بصيغة JSON (مثال: {"email": "user@paypal.com"} أو {"bank_name": "...", "account_number": "...", "iban": "..."})';
COMMENT ON COLUMN payment_methods.is_primary IS 'هل هي طريقة الدفع المفضلة (الافتراضية)';
COMMENT ON COLUMN payment_methods.is_verified IS 'هل تم التحقق من صحة طريقة الدفع';
