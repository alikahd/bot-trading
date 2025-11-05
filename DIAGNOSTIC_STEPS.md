# 🔍 خطوات تشخيص وحل مشكلة الكوبون

## المشكلة الحالية:
```
📊 نتيجة البحث: { coupons: [], couponError: null }
```
**السبب:** الكوبون غير موجود في قاعدة البيانات

---

## ✅ الحل الكامل خطوة بخطوة:

### الخطوة 1️⃣: تطبيق Migration في Supabase

1. **افتح Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/nxkzagjcjwfqbhxcgmwk
   ```

2. **اذهب إلى SQL Editor:**
   - من القائمة الجانبية → **SQL Editor**
   - اضغط **New Query**

3. **انسخ والصق هذا الكود:**
   ```sql
   -- إضافة حقل referral_code للمستخدمين
   ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(50) UNIQUE;

   -- إنشاء index لتسريع البحث
   CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);

   -- إضافة constraint للتأكد من الصيغة الصحيحة
   DO $$ 
   BEGIN
     IF NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'referral_code_format'
     ) THEN
       ALTER TABLE users ADD CONSTRAINT referral_code_format 
         CHECK (referral_code ~ '^[A-Za-z0-9_-]+$');
     END IF;
   END $$;

   -- إضافة comment
   COMMENT ON COLUMN users.referral_code IS 'رمز الإحالة المخصص الذي يختاره المستخدم - يجب أن يكون فريداً';
   ```

4. **نفذ الكود:**
   - اضغط **Run** أو `Ctrl + Enter`
   - يجب أن ترى: `Success. No rows returned`

---

### الخطوة 2️⃣: التحقق من نجاح Migration

نفذ هذا الكود في SQL Editor:
```sql
-- التحقق من وجود حقل referral_code
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'referral_code';
```

**النتيجة المتوقعة:**
```
column_name      | data_type        | character_maximum_length
referral_code    | character varying| 50
```

---

### الخطوة 3️⃣: إنشاء رمز إحالة

1. **افتح التطبيق**
2. **افتح نافذة الإحالة** (زر Users في الهيدر)
3. **اضغط زر التعديل** ✏️
4. **أدخل رمز** مثل: `TEST123`
5. **اضغط حفظ**

**افتح Console (F12) وراقب الرسائل:**
```
✅ تم تحديث رمز الإحالة بنجاح: TEST123
🔍 التحقق من وجود الكوبون: { trimmedCode: "TEST123", existingCoupon: null, checkError: null }
📝 إنشاء كوبون جديد بالرمز: TEST123
✅ تم إنشاء الكوبون بنجاح: { code: "TEST123", ... }
```

---

### الخطوة 4️⃣: التحقق من إنشاء الكوبون

نفذ هذا في SQL Editor:
```sql
-- عرض جميع الكوبونات
SELECT id, code, discount_type, discount_value, discount_rate, is_active, is_referral_coupon
FROM coupons
ORDER BY created_at DESC
LIMIT 10;
```

**يجب أن ترى:**
```
code      | discount_type | discount_value | discount_rate | is_active | is_referral_coupon
TEST123   | percentage    | 10             | 10            | true      | true
```

---

### الخطوة 5️⃣: اختبار الكوبون

1. **اذهب لصفحة الدفع**
2. **أدخل `TEST123` في خانة الكوبون**
3. **اضغط "تطبيق"**

**في Console يجب أن ترى:**
```
🔍 البحث عن الكوبون: TEST123
📊 نتيجة البحث: { coupons: [{ code: "TEST123", ... }], couponError: null }
✅ تم العثور على الكوبون: { code: "TEST123", ... }
✅ تم تطبيق الكوبون: { discount: 5, ... }
```

---

## 🚨 إذا لم يعمل:

### السيناريو 1: الكوبون لم يتم إنشاؤه

**في Console ترى:**
```
❌ خطأ في إنشاء الكوبون: [تفاصيل الخطأ]
```

**الحل:** أنشئ الكوبون يدوياً:
```sql
INSERT INTO coupons (
  code, 
  discount_type, 
  discount_value, 
  discount_rate,
  is_active, 
  is_referral_coupon, 
  commission_rate,
  referrer_id
)
VALUES (
  'TEST123',           -- الرمز
  'percentage',        -- نوع الخصم
  10,                  -- قيمة الخصم (للتوافق مع الكوبونات القديمة)
  10,                  -- نسبة الخصم (للكوبونات الجديدة)
  true,                -- نشط
  true,                -- كوبون إحالة
  10,                  -- نسبة العمولة
  'YOUR_USER_ID'       -- معرف المستخدم (استبدله بمعرفك)
);
```

### السيناريو 2: حقل referral_code غير موجود

**الخطأ عند الحفظ:**
```
column "referral_code" of relation "users" does not exist
```

**الحل:** ارجع للخطوة 1 وطبق Migration

---

## 📞 إذا استمرت المشكلة:

أرسل لي:
1. **Screenshot من Console** عند حفظ رمز الإحالة
2. **Screenshot من Console** عند تطبيق الكوبون
3. **نتيجة هذا الكود من SQL Editor:**
   ```sql
   SELECT * FROM coupons WHERE is_referral_coupon = true;
   ```

---

## ✨ ملاحظات مهمة:

- ✅ الرمز يتحول تلقائياً للأحرف الكبيرة
- ✅ يمكن استخدام الأحرف والأرقام والشرطة (-) والشرطة السفلية (_)
- ✅ الرمز يجب أن يكون 3 أحرف على الأقل
- ✅ الرمز يجب أن يكون فريد (لا تكرار)
