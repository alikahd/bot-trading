-- إضافة حقل use_dynamic_rates لجدول coupons
-- هذا الحقل يحدد ما إذا كان الكوبون يستخدم النسب من referral_settings أم النسب المحفوظة

-- إضافة العمود
ALTER TABLE coupons 
ADD COLUMN IF NOT EXISTS use_dynamic_rates BOOLEAN DEFAULT true;

-- تحديث الكوبونات الموجودة
-- كوبونات الإحالة → use_dynamic_rates = true
UPDATE coupons 
SET use_dynamic_rates = true 
WHERE is_referral_coupon = true;

-- الكوبونات اليدوية → use_dynamic_rates = false (يمكن تغييرها لاحقاً)
UPDATE coupons 
SET use_dynamic_rates = false 
WHERE is_referral_coupon = false OR is_referral_coupon IS NULL;

-- إضافة تعليق توضيحي
COMMENT ON COLUMN coupons.use_dynamic_rates IS 'إذا كان true، يتم جلب النسب من referral_settings. إذا كان false، يتم استخدام النسب المحفوظة في الكوبون';

-- إنشاء index لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_coupons_use_dynamic_rates ON coupons(use_dynamic_rates);
