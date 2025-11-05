-- =====================================================
-- إصلاح سياسة SELECT للكوبونات للأدمن
-- Fix Admin SELECT Policy for Coupons
-- =====================================================

-- إضافة سياسة للأدمن لرؤية جميع الكوبونات (نشطة وغير نشطة)
CREATE POLICY "Admins can view all coupons"
  ON coupons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- تحديث سياسة UPDATE لتضمين WITH CHECK
DROP POLICY IF EXISTS "Only admins can update coupons" ON coupons;
CREATE POLICY "Only admins can update coupons"
  ON coupons FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

COMMENT ON POLICY "Admins can view all coupons" ON coupons IS 'يسمح للأدمن برؤية جميع الكوبونات بما في ذلك غير النشطة';
