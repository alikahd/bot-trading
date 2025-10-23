# 🚀 تعليمات الإعداد والتنفيذ - خطوة بخطوة

## 📋 **المتطلبات الأساسية**

قبل البدء، تأكد من توفر:
- ✅ حساب Supabase نشط
- ✅ مشروع Supabase موجود
- ✅ الوصول إلى لوحة تحكم Supabase

---

## 🔧 **الخطوة 1: إعداد قاعدة البيانات**

### 1.1 تنفيذ SQL Script

1. افتح لوحة تحكم Supabase
2. اذهب إلى **SQL Editor**
3. انقر على **New Query**
4. افتح ملف `database_setup.sql`
5. انسخ المحتوى بالكامل
6. الصقه في SQL Editor
7. انقر على **Run** أو اضغط `Ctrl + Enter`

### 1.2 التحقق من نجاح التنفيذ

تحقق من إنشاء الجداول:
```sql
-- في SQL Editor، نفذ هذا الاستعلام:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

يجب أن ترى:
- ✅ `users`
- ✅ `subscription_plans`
- ✅ `subscriptions`
- ✅ `payments`

### 1.3 التحقق من الدوال

```sql
-- تحقق من الدوال المنشأة:
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;
```

يجب أن ترى:
- ✅ `get_all_subscriptions_admin`
- ✅ `get_all_payments_with_details`
- ✅ `update_payment_status_with_subscription`
- ✅ `get_payment_statistics`
- ✅ `update_updated_at_column`

---

## 📦 **الخطوة 2: إعداد Storage**

### 2.1 إنشاء Bucket للصور

1. في لوحة تحكم Supabase، اذهب إلى **Storage**
2. انقر على **Create Bucket**
3. املأ البيانات:
   - **Name:** `payment-proofs`
   - **Public:** ❌ (اتركها غير محددة)
   - **File size limit:** 5 MB
   - **Allowed MIME types:** 
     - `image/jpeg`
     - `image/jpg`
     - `image/png`
     - `image/webp`
4. انقر على **Create Bucket**

### 2.2 إعداد Storage Policies

في **Storage** → **Policies** → `payment-proofs`:

#### Policy 1: السماح للمستخدمين برفع صورهم
```sql
CREATE POLICY "Users can upload own payment proofs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'payment-proofs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

#### Policy 2: السماح للمستخدمين بعرض صورهم
```sql
CREATE POLICY "Users can view own payment proofs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'payment-proofs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

#### Policy 3: السماح للأدمن بعرض جميع الصور
```sql
CREATE POLICY "Admins can view all payment proofs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'payment-proofs' 
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE auth_id = auth.uid() AND role = 'admin'
  )
);
```

---

## 🔐 **الخطوة 3: التحقق من RLS Policies**

### 3.1 التحقق من تفعيل RLS

```sql
-- تحقق من تفعيل RLS على الجداول:
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'subscription_plans', 'subscriptions', 'payments');
```

يجب أن تكون `rowsecurity = true` لجميع الجداول.

### 3.2 عرض Policies المطبقة

```sql
-- عرض جميع الـ policies:
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## 👤 **الخطوة 4: إنشاء حساب الأدمن**

### 4.1 التسجيل كأدمن

1. افتح التطبيق
2. سجل حساب جديد باستخدام:
   - **البريد الإلكتروني:** `hichamkhad00@gmail.com`
   - **اسم المستخدم:** `admin`
   - **الاسم الكامل:** `Admin`
   - **كلمة المرور:** (اختر كلمة مرور قوية)

### 4.2 تحديث دور الأدمن يدوياً

بعد التسجيل، نفذ هذا في SQL Editor:

```sql
-- تحديث دور المستخدم إلى admin
UPDATE users 
SET role = 'admin',
    is_active = true,
    email_verified = true,
    status = 'active',
    subscription_status = 'active'
WHERE email = 'hichamkhad00@gmail.com';
```

---

## 🧪 **الخطوة 5: اختبار النظام**

### 5.1 اختبار تسجيل مستخدم جديد

1. **التسجيل:**
   - افتح صفحة التسجيل
   - أدخل بيانات مستخدم جديد
   - تحقق من إنشاء السجل في جدول `users`
   - الحالة يجب أن تكون: `pending_email_verification`

2. **تفعيل البريد:**
   - أدخل رمز التفعيل
   - تحقق من تحديث `email_verified = true`
   - الحالة يجب أن تتغير إلى: `pending_subscription`

3. **اختيار باقة:**
   - اختر باقة اشتراك
   - تحقق من حفظ البيانات

### 5.2 اختبار الدفع بـ PayPal

1. **اختر طريقة الدفع:** PayPal
2. **أكمل الدفع** (استخدم sandbox للاختبار)
3. **تحقق من:**
   - ✅ إنشاء سجل في `payments` بحالة `completed`
   - ✅ إنشاء سجل في `subscriptions` بحالة `active`
   - ✅ تحديث `users`:
     - `is_active = true`
     - `status = 'active'`
     - `subscription_status = 'active'`
4. **جرب تسجيل الدخول** → يجب أن ينجح ✅

### 5.3 اختبار الدفع بالعملات الرقمية

1. **اختر طريقة الدفع:** Bitcoin/Crypto
2. **ارفع صورة إثبات الدفع**
3. **تحقق من:**
   - ✅ إنشاء سجل في `payments`:
     - `status = 'reviewing'`
     - `admin_review_status = 'pending'`
     - `crypto_proof_image` يحتوي على رابط الصورة
   - ✅ تحديث `users`:
     - `status = 'payment_pending_review'`
     - `is_active = false`
4. **جرب تسجيل الدخول** → يجب أن يُرفض ❌
   - رسالة: "دفعتك قيد المراجعة من قبل الإدارة"

### 5.4 اختبار مراجعة الأدمن

1. **سجل دخول كأدمن**
2. **افتح لوحة الإدارة**
3. **اذهب إلى قسم المدفوعات**
4. **يجب أن ترى الدفع المعلق**
5. **اضغط على "موافقة"**
6. **تحقق من:**
   - ✅ تحديث `payments`:
     - `status = 'completed'`
     - `admin_review_status = 'approved'`
   - ✅ تحديث `subscriptions`:
     - `status = 'active'`
   - ✅ تحديث `users`:
     - `is_active = true`
     - `status = 'active'`
     - `subscription_status = 'active'`
7. **المستخدم الآن يمكنه تسجيل الدخول** ✅

### 5.5 اختبار رفض الدفع

1. **كرر خطوات الدفع بالعملات الرقمية**
2. **في لوحة الأدمن، اضغط على "رفض"**
3. **تحقق من:**
   - ✅ تحديث `payments`:
     - `status = 'failed'`
     - `admin_review_status = 'rejected'`
   - ✅ تحديث `subscriptions`:
     - `status = 'cancelled'`
   - ✅ تحديث `users`:
     - `is_active = false`
     - `status = 'pending_payment'`
4. **المستخدم لا يمكنه تسجيل الدخول** ❌

---

## 🔍 **الخطوة 6: التحقق من الأمان**

### 6.1 اختبار RLS

```sql
-- جرب الوصول كمستخدم عادي:
SET ROLE authenticated;
SET request.jwt.claim.sub = '<user_auth_id>';

-- يجب أن ترى بيانات المستخدم فقط:
SELECT * FROM users;
SELECT * FROM subscriptions;
SELECT * FROM payments;

-- العودة للدور الافتراضي:
RESET ROLE;
```

### 6.2 اختبار منع الوصول

1. **حاول تسجيل دخول بدون اشتراك** → يجب أن يُرفض
2. **حاول تسجيل دخول ببريد غير مفعل** → يجب أن يُرفض
3. **حاول الوصول لبيانات مستخدم آخر** → يجب أن يُرفض

---

## 📊 **الخطوة 7: مراقبة النظام**

### 7.1 استعلامات مفيدة

```sql
-- عدد المستخدمين حسب الحالة:
SELECT status, COUNT(*) 
FROM users 
GROUP BY status;

-- المدفوعات المعلقة:
SELECT COUNT(*) 
FROM payments 
WHERE admin_review_status = 'pending';

-- الاشتراكات النشطة:
SELECT COUNT(*) 
FROM subscriptions 
WHERE status = 'active' 
AND end_date > NOW();

-- إجمالي الإيرادات:
SELECT SUM(amount) 
FROM payments 
WHERE status = 'completed';
```

### 7.2 تنبيهات مهمة

راقب:
- ⚠️ المدفوعات المعلقة لأكثر من 24 ساعة
- ⚠️ الاشتراكات القريبة من الانتهاء
- ⚠️ محاولات تسجيل دخول فاشلة متكررة

---

## 🐛 **استكشاف الأخطاء**

### مشكلة: لا يمكن تسجيل الدخول

**الحل:**
```sql
-- تحقق من حالة المستخدم:
SELECT 
    username, 
    email, 
    is_active, 
    email_verified, 
    status, 
    subscription_status
FROM users 
WHERE email = 'user@example.com';
```

### مشكلة: الصور لا تُرفع

**الحل:**
1. تحقق من إنشاء bucket `payment-proofs`
2. تحقق من Storage Policies
3. تحقق من حجم الملف (أقل من 5MB)
4. تحقق من نوع الملف (صورة)

### مشكلة: الأدمن لا يرى المدفوعات

**الحل:**
```sql
-- تحقق من دور الأدمن:
SELECT role FROM users WHERE email = 'hichamkhad00@gmail.com';

-- يجب أن يكون: role = 'admin'
```

---

## ✅ **قائمة التحقق النهائية**

قبل الإطلاق، تأكد من:

### قاعدة البيانات:
- [ ] تنفيذ `database_setup.sql` بنجاح
- [ ] جميع الجداول موجودة
- [ ] جميع الدوال موجودة
- [ ] RLS مفعل على جميع الجداول
- [ ] Policies مطبقة بشكل صحيح

### Storage:
- [ ] Bucket `payment-proofs` موجود
- [ ] Storage Policies مطبقة
- [ ] يمكن رفع الصور بنجاح

### الأدمن:
- [ ] حساب الأدمن موجود
- [ ] دور الأدمن صحيح (`role = 'admin'`)
- [ ] يمكن الوصول للوحة الإدارة

### الاختبارات:
- [ ] تسجيل مستخدم جديد يعمل
- [ ] تفعيل البريد يعمل
- [ ] اختيار باقة يعمل
- [ ] الدفع بـ PayPal يعمل
- [ ] الدفع بالعملات الرقمية يعمل
- [ ] رفع صور إثبات الدفع يعمل
- [ ] مراجعة الأدمن تعمل
- [ ] تسجيل الدخول مع التحقق يعمل
- [ ] منع الوصول بدون اشتراك يعمل

---

## 📞 **الدعم والمساعدة**

إذا واجهت أي مشكلة:

1. **راجع الوثائق:**
   - `SUBSCRIPTION_FLOW_DOCUMENTATION.md`
   - `IMPLEMENTATION_SUMMARY.md`

2. **تحقق من Logs:**
   - Console logs في المتصفح
   - Supabase logs في Dashboard

3. **تحقق من قاعدة البيانات:**
   - استخدم SQL Editor للتحقق من البيانات
   - راجع الاستعلامات المفيدة أعلاه

---

**تم إعداد التعليمات بنجاح! 🎉**

**ملاحظة مهمة:** احفظ هذه المعلومات في مكان آمن، ستحتاجها للرجوع إليها لاحقاً.
