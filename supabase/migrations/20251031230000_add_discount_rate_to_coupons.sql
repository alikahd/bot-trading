-- إضافة عمود discount_rate في جدول coupons
ALTER TABLE coupons 
ADD COLUMN IF NOT EXISTS discount_rate DECIMAL(5,2) DEFAULT 10.00;

-- تحديث الكوبونات الموجودة لتأخذ نسبة الخصم من discount_value إذا كانت percentage
UPDATE coupons 
SET discount_rate = discount_value 
WHERE discount_type = 'percentage' AND discount_rate IS NULL;

-- إضافة تعليق على العمود
COMMENT ON COLUMN coupons.discount_rate IS 'نسبة الخصم التي يحصل عليها المستخدم الجديد عند استخدام كوبون الإحالة (افتراضي: 10%)';
