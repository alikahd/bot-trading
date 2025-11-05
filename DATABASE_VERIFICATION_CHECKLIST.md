# ✅ قائمة التحقق من قاعدة البيانات - نظام الإحالة والكوبونات

## 📋 الجداول المطلوبة:

### 1️⃣ جدول `users` - تحديثات
**Migration:** `20251101000000_add_custom_referral_code.sql`

**الأعمدة المطلوبة:**
- ✅ `referral_code` VARCHAR(50) UNIQUE
- ✅ Index: `idx_users_referral_code`
- ✅ Constraint: `referral_code_format` (يقبل فقط A-Z, a-z, 0-9, _, -)

**التحقق:**
```sql
-- 1. التحقق من وجود العمود
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'referral_code';

-- النتيجة المتوقعة:
-- referral_code | character varying | 50

-- 2. التحقق من Index
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'users' AND indexname = 'idx_users_referral_code';

-- 3. التحقق من Constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'referral_code_format';
```

---

### 2️⃣ جدول `coupons` - تحديثات
**Migrations:** 
- `20251031171555_referrals_and_coupons_system.sql`
- `20251031230000_add_discount_rate_to_coupons.sql`

**الأعمدة المطلوبة:**
- ✅ `id` UUID PRIMARY KEY
- ✅ `code` VARCHAR(50) UNIQUE
- ✅ `discount_type` VARCHAR(20) (percentage/fixed)
- ✅ `discount_value` DECIMAL(10,2)
- ✅ `discount_rate` DECIMAL(5,2) DEFAULT 10.00
- ✅ `commission_rate` DECIMAL(5,2) DEFAULT 10.00
- ✅ `is_active` BOOLEAN DEFAULT true
- ✅ `is_referral_coupon` BOOLEAN DEFAULT false
- ✅ `referrer_id` UUID (FK → users.id)
- ✅ `max_uses` INTEGER
- ✅ `current_uses` INTEGER DEFAULT 0
- ✅ `valid_from` TIMESTAMP
- ✅ `valid_until` TIMESTAMP
- ✅ `created_at` TIMESTAMP
- ✅ `updated_at` TIMESTAMP

**التحقق:**
```sql
-- 1. التحقق من البنية
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'coupons'
ORDER BY ordinal_position;

-- 2. التحقق من وجود discount_rate و commission_rate
SELECT column_name, data_type, numeric_precision, numeric_scale
FROM information_schema.columns 
WHERE table_name = 'coupons' 
AND column_name IN ('discount_rate', 'commission_rate');

-- النتيجة المتوقعة:
-- discount_rate | numeric | 5 | 2
-- commission_rate | numeric | 5 | 2

-- 3. عرض كوبونات الإحالة
SELECT code, discount_rate, commission_rate, is_referral_coupon, referrer_id
FROM coupons 
WHERE is_referral_coupon = true
LIMIT 5;
```

---

### 3️⃣ جدول `referrals`
**Migration:** `20251031171555_referrals_and_coupons_system.sql`

**الأعمدة المطلوبة:**
- ✅ `id` UUID PRIMARY KEY
- ✅ `referrer_id` UUID (FK → users.id)
- ✅ `referred_user_id` UUID (FK → users.id)
- ✅ `coupon_id` UUID (FK → coupons.id)
- ✅ `subscription_id` UUID
- ✅ `status` VARCHAR(20) (pending/completed/rewarded)
- ✅ `discount_amount` DECIMAL(10,2)
- ✅ `commission_amount` DECIMAL(10,2)
- ✅ `created_at` TIMESTAMP
- ✅ `completed_at` TIMESTAMP

**التحقق:**
```sql
-- 1. التحقق من البنية
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'referrals'
ORDER BY ordinal_position;

-- 2. عرض الإحالات الحديثة
SELECT 
  r.id,
  r.status,
  r.discount_amount,
  r.commission_amount,
  u1.email as referrer_email,
  u2.email as referred_email,
  c.code as coupon_code,
  r.created_at
FROM referrals r
LEFT JOIN users u1 ON r.referrer_id = u1.id
LEFT JOIN users u2 ON r.referred_user_id = u2.id
LEFT JOIN coupons c ON r.coupon_id = c.id
ORDER BY r.created_at DESC
LIMIT 5;
```

---

### 4️⃣ جدول `pending_commissions`
**Migration:** `20251031213500_referral_commission_system.sql`

**الأعمدة المطلوبة:**
- ✅ `id` UUID PRIMARY KEY
- ✅ `referrer_id` UUID (FK → users.id)
- ✅ `referral_id` UUID (FK → referrals.id)
- ✅ `commission_amount` DECIMAL(10,2)
- ✅ `status` VARCHAR(20) (pending/paid/cancelled)
- ✅ `created_at` TIMESTAMP
- ✅ `paid_at` TIMESTAMP

**التحقق:**
```sql
-- 1. التحقق من البنية
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'pending_commissions'
ORDER BY ordinal_position;

-- 2. عرض العمولات المستحقة
SELECT 
  pc.id,
  u.email as referrer_email,
  pc.commission_amount,
  pc.status,
  pc.created_at
FROM pending_commissions pc
JOIN users u ON pc.referrer_id = u.id
WHERE pc.status = 'pending'
ORDER BY pc.created_at DESC;

-- 3. إحصائيات العمولات
SELECT 
  status,
  COUNT(*) as count,
  SUM(commission_amount) as total_amount
FROM pending_commissions
GROUP BY status;
```

---

### 5️⃣ جدول `commission_payments`
**Migration:** `20251031213500_referral_commission_system.sql`

**الأعمدة المطلوبة:**
- ✅ `id` UUID PRIMARY KEY
- ✅ `referrer_id` UUID (FK → users.id)
- ✅ `total_amount` DECIMAL(10,2)
- ✅ `payment_method` VARCHAR(50)
- ✅ `payment_details` TEXT
- ✅ `notes` TEXT
- ✅ `paid_by` UUID (FK → users.id)
- ✅ `created_at` TIMESTAMP

**التحقق:**
```sql
-- 1. التحقق من البنية
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'commission_payments'
ORDER BY ordinal_position;

-- 2. عرض المدفوعات الأخيرة
SELECT 
  cp.id,
  u1.email as referrer_email,
  cp.total_amount,
  cp.payment_method,
  u2.email as paid_by_email,
  cp.created_at
FROM commission_payments cp
JOIN users u1 ON cp.referrer_id = u1.id
LEFT JOIN users u2 ON cp.paid_by = u2.id
ORDER BY cp.created_at DESC
LIMIT 5;
```

---

### 6️⃣ جدول `referral_settings` ⭐ الجديد
**Migration:** `20251101010000_create_referral_settings.sql`

**الأعمدة المطلوبة:**
- ✅ `id` UUID PRIMARY KEY
- ✅ `discount_rate` DECIMAL(5,2) DEFAULT 10.00
- ✅ `commission_rate` DECIMAL(5,2) DEFAULT 10.00
- ✅ `payment_cycle_days` INTEGER DEFAULT 15
- ✅ `minimum_payout` DECIMAL(10,2) DEFAULT 10.00
- ✅ `is_active` BOOLEAN DEFAULT true
- ✅ `created_at` TIMESTAMP
- ✅ `updated_at` TIMESTAMP

**Constraints:**
- ✅ `discount_rate_range`: CHECK (discount_rate >= 0 AND discount_rate <= 50)
- ✅ `commission_rate_range`: CHECK (commission_rate >= 0 AND commission_rate <= 50)
- ✅ `payment_cycle_days_valid`: CHECK (payment_cycle_days IN (7, 15, 30))
- ✅ `minimum_payout_positive`: CHECK (minimum_payout > 0)

**التحقق:**
```sql
-- 1. التحقق من وجود الجدول
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'referral_settings';

-- 2. التحقق من البنية
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'referral_settings'
ORDER BY ordinal_position;

-- 3. التحقق من Constraints
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'referral_settings'::regclass
AND contype = 'c';

-- النتيجة المتوقعة:
-- discount_rate_range | CHECK ((discount_rate >= 0) AND (discount_rate <= 50))
-- commission_rate_range | CHECK ((commission_rate >= 0) AND (commission_rate <= 50))
-- payment_cycle_days_valid | CHECK (payment_cycle_days IN (7, 15, 30))
-- minimum_payout_positive | CHECK (minimum_payout > 0)

-- 4. عرض الإعدادات الحالية
SELECT * FROM referral_settings;

-- النتيجة المتوقعة (القيم الافتراضية):
-- discount_rate: 10.00
-- commission_rate: 10.00
-- payment_cycle_days: 15
-- minimum_payout: 10.00
-- is_active: true
```

---

## 🔐 Row Level Security (RLS) Policies:

### جدول `referral_settings`:
```sql
-- 1. التحقق من تفعيل RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'referral_settings';
-- النتيجة المتوقعة: rowsecurity = true

-- 2. عرض جميع Policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'referral_settings';

-- Policies المتوقعة:
-- 1. referral_settings_select_policy (SELECT) - الجميع يمكنهم القراءة
-- 2. referral_settings_insert_policy (INSERT) - الأدمن فقط
-- 3. referral_settings_update_policy (UPDATE) - الأدمن فقط
```

---

## 📊 اختبارات الوظائف:

### ✅ اختبار 1: إنشاء رمز إحالة
```sql
-- 1. تحديث رمز إحالة لمستخدم
UPDATE users 
SET referral_code = 'TEST123' 
WHERE email = 'test@example.com';

-- 2. التحقق من الحفظ
SELECT id, email, referral_code 
FROM users 
WHERE referral_code = 'TEST123';

-- 3. التحقق من إنشاء الكوبون التلقائي
SELECT code, discount_rate, commission_rate, is_referral_coupon, referrer_id
FROM coupons 
WHERE code = 'TEST123';
```

### ✅ اختبار 2: تطبيق كوبون إحالة
```sql
-- 1. البحث عن كوبون
SELECT * FROM coupons WHERE code = 'TEST123' AND is_active = true;

-- 2. إنشاء إحالة جديدة
INSERT INTO referrals (
  referrer_id,
  referred_user_id,
  coupon_id,
  status,
  discount_amount,
  commission_amount
) VALUES (
  'referrer-uuid',
  'new-user-uuid',
  'coupon-uuid',
  'pending',
  15.00,
  12.00
);

-- 3. إنشاء عمولة مستحقة
INSERT INTO pending_commissions (
  referrer_id,
  referral_id,
  commission_amount,
  status
) VALUES (
  'referrer-uuid',
  'referral-uuid',
  12.00,
  'pending'
);
```

### ✅ اختبار 3: تحديث الإعدادات (كأدمن)
```sql
-- 1. تحديث النسب
UPDATE referral_settings 
SET 
  discount_rate = 15.00,
  commission_rate = 12.00,
  payment_cycle_days = 30,
  updated_at = NOW()
WHERE id = (SELECT id FROM referral_settings LIMIT 1);

-- 2. التحقق من التحديث
SELECT * FROM referral_settings;
```

### ✅ اختبار 4: دفع العمولات
```sql
-- 1. عرض العمولات المستحقة
SELECT 
  pc.id,
  u.email,
  pc.commission_amount,
  pc.created_at
FROM pending_commissions pc
JOIN users u ON pc.referrer_id = u.id
WHERE pc.status = 'pending'
AND pc.commission_amount >= (SELECT minimum_payout FROM referral_settings LIMIT 1);

-- 2. تسجيل الدفع
INSERT INTO commission_payments (
  referrer_id,
  total_amount,
  payment_method,
  notes,
  paid_by
) VALUES (
  'referrer-uuid',
  50.00,
  'bank_transfer',
  'Payment for October 2024',
  'admin-uuid'
);

-- 3. تحديث حالة العمولات
UPDATE pending_commissions 
SET 
  status = 'paid',
  paid_at = NOW()
WHERE referrer_id = 'referrer-uuid' 
AND status = 'pending';
```

---

## 🎯 قائمة التحقق النهائية:

### الجداول:
- [ ] `users` - يحتوي على `referral_code`
- [ ] `coupons` - يحتوي على `discount_rate` و `commission_rate`
- [ ] `referrals` - موجود وجاهز
- [ ] `pending_commissions` - موجود وجاهز
- [ ] `commission_payments` - موجود وجاهز
- [ ] `referral_settings` - موجود مع Constraints

### Migrations:
- [ ] `20251031171555_referrals_and_coupons_system.sql` - مطبق
- [ ] `20251031213500_referral_commission_system.sql` - مطبق
- [ ] `20251031230000_add_discount_rate_to_coupons.sql` - مطبق
- [ ] `20251101000000_add_custom_referral_code.sql` - مطبق
- [ ] `20251101010000_create_referral_settings.sql` - مطبق ⭐

### RLS Policies:
- [ ] `referral_settings` - RLS مفعل
- [ ] Policies للقراءة (الجميع)
- [ ] Policies للكتابة (الأدمن فقط)

### الوظائف:
- [ ] إنشاء رمز إحالة
- [ ] إنشاء كوبون تلقائي
- [ ] تطبيق كوبون من رابط
- [ ] حساب العمولات
- [ ] دفع العمولات
- [ ] تحديث الإعدادات

---

## 🚀 خطوات التطبيق:

### 1. تطبيق جميع Migrations:
```bash
# في Supabase Dashboard → SQL Editor
# نسخ ولصق محتوى كل ملف بالترتيب:

1. 20251031171555_referrals_and_coupons_system.sql
2. 20251031213500_referral_commission_system.sql
3. 20251031230000_add_discount_rate_to_coupons.sql
4. 20251101000000_add_custom_referral_code.sql
5. 20251101010000_create_referral_settings.sql ⭐
```

### 2. التحقق من النجاح:
```sql
-- تشغيل هذا الاستعلام للتحقق من جميع الجداول:
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_name IN (
  'users',
  'coupons',
  'referrals',
  'pending_commissions',
  'commission_payments',
  'referral_settings'
)
ORDER BY table_name;

-- النتيجة المتوقعة:
-- users | 15+ columns
-- coupons | 14 columns
-- referrals | 10 columns
-- pending_commissions | 7 columns
-- commission_payments | 8 columns
-- referral_settings | 8 columns ⭐
```

### 3. إدخال البيانات الافتراضية:
```sql
-- إذا لم يكن هناك سجل في referral_settings، أدخل واحد:
INSERT INTO referral_settings (
  discount_rate,
  commission_rate,
  payment_cycle_days,
  minimum_payout,
  is_active
) VALUES (
  10.00,
  10.00,
  15,
  10.00,
  true
)
ON CONFLICT DO NOTHING;
```

---

## ✅ النتيجة المتوقعة:

عند تطبيق جميع Migrations بنجاح، يجب أن:
1. ✅ جميع الجداول موجودة
2. ✅ جميع الأعمدة موجودة بالأنواع الصحيحة
3. ✅ جميع Constraints مطبقة
4. ✅ RLS Policies مفعلة
5. ✅ القيم الافتراضية موجودة في `referral_settings`
6. ✅ النظام جاهز للاستخدام الفوري

---

**📝 ملاحظة:** استخدم هذا الملف كدليل للتحقق من قاعدة البيانات خطوة بخطوة.
