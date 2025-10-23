# 📋 توثيق نظام التسجيل والاشتراك والدفع

## 🎯 الخطة الكاملة للتدفق

### 1️⃣ **الصفحة الأولى (Landing Page)**
- أول صفحة تظهر عند فتح التطبيق
- تحتوي على معلومات عن المنصة
- زر "تسجيل حساب جديد" → يوجه للتسجيل
- زر "تسجيل الدخول" → يوجه لتسجيل الدخول

### 2️⃣ **صفحة التسجيل (Register Page)**
- المستخدم يدخل:
  - البريد الإلكتروني
  - اسم المستخدم
  - الاسم الكامل
  - البلد
  - كلمة المرور
- بعد التسجيل الناجح → يتم إنشاء حساب في قاعدة البيانات
- الحالة الأولية: `status: 'pending_email_verification'`, `is_active: false`

### 3️⃣ **صفحة تفعيل البريد الإلكتروني**
- يتم إرسال رمز تفعيل للبريد الإلكتروني
- المستخدم يدخل الرمز
- بعد التفعيل الناجح → `email_verified: true`, `status: 'pending_subscription'`

### 4️⃣ **صفحة الاشتراك (Subscription Page)**
- عرض الباقات المتاحة
- المستخدم يختار باقة
- بعد الاختيار → التوجه مباشرة لصفحة الدفع

### 5️⃣ **صفحة الدفع (Payment Page)**
- خيارات الدفع:
  1. **PayPal** → دفع فوري
  2. **بطاقة بنكية** → دفع فوري
  3. **عملات رقمية (Bitcoin/Crypto)** → يتطلب مراجعة

#### 🔹 **سيناريو 1: الدفع بـ PayPal أو البطاقة البنكية**
- الدفع يتم بنجاح → `payment.status: 'completed'`
- يتم تفعيل الاشتراك تلقائياً → `subscription.status: 'active'`
- يتم تفعيل حساب المستخدم → `user.is_active: true`, `user.status: 'active'`
- التوجه لصفحة النجاح → **يمكن تسجيل الدخول مباشرة**

#### 🔹 **سيناريو 2: الدفع بالعملات الرقمية**
- المستخدم يختار العملة الرقمية
- يتم عرض عنوان المحفظة والمبلغ المطلوب
- المستخدم يرفع صورة إثبات الدفع (لقطة شاشة)
- بعد رفع الصورة:
  - `payment.status: 'reviewing'`
  - `payment.admin_review_status: 'pending'`
  - `payment.crypto_proof_image: 'رابط الصورة'`
  - `user.status: 'payment_pending_review'`
  - `subscription.status: 'inactive'`
- التوجه لصفحة مراجعة الدفع

### 6️⃣ **صفحة مراجعة الدفع (Payment Review Page)**
- تظهر للمستخدم الذي دفع بالعملات الرقمية
- رسالة: "تم استلام طلبك، جاري المراجعة من قبل الإدارة"
- يتم التحقق من حالة المراجعة تلقائياً كل 30 ثانية

### 7️⃣ **لوحة الأدمن (Admin Panel)**
- الأدمن يرى جميع المدفوعات المعلقة
- لكل دفع:
  - معلومات المستخدم
  - الباقة المختارة
  - صورة إثبات الدفع
  - خيارات: **موافقة** أو **رفض**

#### 🔹 **عند الموافقة:**
- `payment.admin_review_status: 'approved'`
- `payment.status: 'completed'`
- `subscription.status: 'active'`
- `user.is_active: true`
- `user.status: 'active'`
- `user.subscription_status: 'active'`
- المستخدم يرى في صفحة المراجعة: "تمت الموافقة على الدفع ✅"
- **يمكنه تسجيل الدخول الآن**

#### 🔹 **عند الرفض:**
- `payment.admin_review_status: 'rejected'`
- `payment.status: 'failed'`
- `subscription.status: 'cancelled'`
- `user.is_active: false`
- `user.status: 'pending_payment'`
- `user.subscription_status: 'inactive'`
- المستخدم يرى في صفحة المراجعة: "تم رفض الدفع ❌"
- **لا يمكنه تسجيل الدخول**

### 8️⃣ **تسجيل الدخول (Login)**
- التحقق من:
  1. ✅ البريد الإلكتروني مفعل (`email_verified: true`)
  2. ✅ الاشتراك نشط (`subscription_status: 'active'`)
  3. ✅ الحساب مفعل (`is_active: true`)
  4. ✅ الحالة نشطة (`status: 'active'`)

- إذا لم يتم استيفاء الشروط → **رفض تسجيل الدخول**
- رسالة خطأ: "يجب إكمال الاشتراك والدفع أولاً"

---

## 🗄️ **قاعدة البيانات**

### جدول `users`
```sql
- id (UUID)
- auth_id (UUID) - معرف المصادقة من Supabase Auth
- username (TEXT)
- email (TEXT)
- full_name (TEXT)
- country (TEXT)
- role (TEXT) - 'admin' أو 'trader'
- is_active (BOOLEAN) - هل الحساب مفعل؟
- email_verified (BOOLEAN) - هل البريد مفعل؟
- status (TEXT) - حالة الحساب
  * 'pending_email_verification' - بانتظار تفعيل البريد
  * 'pending_subscription' - بانتظار الاشتراك
  * 'pending_payment' - بانتظار الدفع
  * 'payment_pending_review' - الدفع قيد المراجعة
  * 'active' - نشط
- subscription_status (TEXT) - 'active', 'inactive', 'expired'
- subscription_end_date (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### جدول `subscription_plans`
```sql
- id (UUID)
- name (TEXT)
- name_ar (TEXT)
- description (TEXT)
- price (NUMERIC)
- duration (TEXT) - 'شهري', 'سنوي'
- duration_months (INTEGER)
- features (JSONB)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
```

### جدول `subscriptions`
```sql
- id (UUID)
- user_id (UUID) - FK → users.id
- plan_id (UUID) - FK → subscription_plans.id
- status (TEXT) - 'active', 'inactive', 'cancelled', 'expired'
- start_date (TIMESTAMP)
- end_date (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### جدول `payments`
```sql
- id (UUID)
- user_id (UUID) - FK → users.id
- subscription_id (UUID) - FK → subscriptions.id
- amount (NUMERIC)
- currency (TEXT) - 'USD'
- payment_method (TEXT) - 'paypal', 'credit_card', 'bitcoin', 'crypto'
- status (TEXT) - 'pending', 'completed', 'failed', 'reviewing'
- transaction_id (TEXT)
- crypto_proof_image (TEXT) - رابط صورة إثبات الدفع
- crypto_wallet_address (TEXT) - عنوان المحفظة المستخدم
- admin_review_status (TEXT) - 'pending', 'approved', 'rejected'
- admin_review_notes (TEXT)
- reviewed_by (UUID) - FK → users.id (الأدمن)
- reviewed_at (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

---

## 🔒 **قواعد الأمان (RLS - Row Level Security)**

### جدول `users`
- المستخدم يمكنه قراءة بياناته فقط
- الأدمن يمكنه قراءة وتعديل جميع المستخدمين

### جدول `subscriptions`
- المستخدم يمكنه قراءة اشتراكاته فقط
- الأدمن يمكنه قراءة وتعديل جميع الاشتراكات

### جدول `payments`
- المستخدم يمكنه قراءة مدفوعاته فقط
- الأدمن يمكنه قراءة وتعديل جميع المدفوعات

---

## ✅ **نقاط التحقق والأمان**

1. ✅ **لا يمكن تسجيل الدخول بدون:**
   - تفعيل البريد الإلكتروني
   - اشتراك نشط
   - دفع مكتمل ومعتمد

2. ✅ **التحقق من صحة الاشتراك:**
   - عند كل تسجيل دخول
   - عند كل طلب للواجهة الخلفية
   - التحقق من تاريخ انتهاء الاشتراك

3. ✅ **حماية الصور:**
   - تخزين صور إثبات الدفع في Supabase Storage
   - bucket: `payment-proofs`
   - الوصول محمي - فقط الأدمن والمستخدم صاحب الصورة

4. ✅ **تسجيل العمليات:**
   - جميع العمليات مسجلة في قاعدة البيانات
   - تتبع من قام بالمراجعة ومتى
   - حفظ ملاحظات الأدمن

---

## 🔄 **التدفق الكامل - مخطط**

```
المستخدم الجديد
    ↓
Landing Page
    ↓
Register Page → إنشاء حساب
    ↓
Email Verification → تفعيل البريد
    ↓
Subscription Page → اختيار باقة
    ↓
Payment Page → اختيار طريقة الدفع
    ↓
    ├─→ PayPal/Card → Payment Success → Login ✅
    │
    └─→ Crypto → رفع صورة → Payment Review Page
                    ↓
                Admin Panel (مراجعة)
                    ↓
                    ├─→ موافقة → Payment Review Page (معتمد) → Login ✅
                    │
                    └─→ رفض → Payment Review Page (مرفوض) → Login ❌
```

---

## 📝 **ملاحظات مهمة**

1. **عدم التعقيد:** النظام مصمم ليكون بسيطاً وواضحاً
2. **الأمان العالي:** جميع العمليات محمية بـ RLS
3. **التحقق الدقيق:** فحص شامل قبل السماح بتسجيل الدخول
4. **تجنب التعارضات:** استخدام transactions في قاعدة البيانات
5. **تتبع كامل:** جميع العمليات مسجلة ومؤرخة

---

## 🎯 **الملفات المتأثرة**

### Services
- ✅ `simpleAuthService.ts` - المصادقة والتحقق
- ✅ `subscriptionService.ts` - إدارة الاشتراكات
- ✅ `paymentService.ts` - إدارة المدفوعات

### Components
- ✅ `LoginPage.tsx` - تسجيل الدخول مع التحقق
- ✅ `RegisterPage.tsx` - التسجيل
- ✅ `EmailVerificationPage.tsx` - تفعيل البريد
- ✅ `SubscriptionPage.tsx` - اختيار الباقة
- ✅ `PaymentPage.tsx` - الدفع
- ✅ `PaymentReviewPage.tsx` - مراجعة الدفع
- ✅ `AdminPanel.tsx` - لوحة الأدمن

### Database
- ✅ جداول قاعدة البيانات
- ✅ RLS Policies
- ✅ Database Functions
- ✅ Storage Buckets

---

**تاريخ التوثيق:** 12 أكتوبر 2025
**الإصدار:** 1.0
**الحالة:** جاهز للتطبيق
