# تدفق التسجيل والاشتراك والدفع - التوثيق الكامل

## 📋 نظرة عامة

هذا المستند يوثق التدفق الكامل لنظام التسجيل والاشتراك والدفع في التطبيق.

---

## 🔄 التدفق الكامل للمستخدم

### 1️⃣ الصفحة الأولى (Landing Page)
- **الملف**: `src/pages/LandingPage.tsx`
- **الوصف**: أول صفحة تظهر عند فتح التطبيق
- **الإجراءات المتاحة**:
  - تسجيل حساب جديد
  - تسجيل الدخول (للمستخدمين المسجلين)

---

### 2️⃣ صفحة التسجيل (Register Page)
- **الملف**: `src/components/auth/RegisterPage.tsx`
- **البيانات المطلوبة**:
  - البريد الإلكتروني
  - اسم المستخدم
  - الاسم الكامل
  - الدولة
  - كلمة المرور
- **العملية**:
  1. إنشاء حساب في `auth.users` (Supabase Auth)
  2. إنشاء سجل في جدول `users` بالحالة `pending_email_verification`
  3. إرسال رمز تفعيل للبريد الإلكتروني
  4. التوجه لصفحة تفعيل البريد

---

### 3️⃣ صفحة تفعيل البريد الإلكتروني
- **الملف**: `src/components/auth/EmailVerificationPage.tsx`
- **العملية**:
  1. إدخال رمز التفعيل المرسل للبريد
  2. التحقق من الرمز
  3. تحديث حالة المستخدم إلى `pending_subscription`
  4. تحديث `email_verified = true`
  5. التوجه التلقائي لصفحة الاشتراك

---

### 4️⃣ صفحة اختيار الباقة (Subscription Page)
- **الملف**: `src/components/subscription/SubscriptionPage.tsx`
- **الباقات المتاحة**:
  - الباقة الأساسية الشهرية ($29.99)
  - الباقة الاحترافية الشهرية ($49.99)
  - الباقة المميزة السنوية ($499.99)
- **العملية**:
  1. عرض جميع الباقات من جدول `subscription_plans`
  2. اختيار الباقة المناسبة
  3. التوجه مباشرة لصفحة الدفع

---

### 5️⃣ صفحة الدفع (Payment Page)
- **الملف**: `src/components/payments/PaymentPage.tsx`
- **طرق الدفع المتاحة**:

#### أ) PayPal
- **الحالة**: دفع فوري
- **العملية**:
  1. الضغط على زر "الدفع بـ PayPal"
  2. محاكاة دفع ناجح
  3. إنشاء سجل في جدول `payments` بحالة `completed`
  4. إنشاء سجل في جدول `subscriptions` بحالة `active`
  5. تحديث المستخدم:
     - `status = 'active'`
     - `subscription_status = 'active'`
     - `is_active = true`
  6. التوجه لصفحة النجاح
  7. **يمكن تسجيل الدخول فوراً**

#### ب) البطاقة البنكية (Credit Card)
- **الحالة**: دفع فوري
- **العملية**:
  1. إدخال بيانات البطاقة
  2. محاكاة دفع ناجح
  3. نفس خطوات PayPal
  4. **يمكن تسجيل الدخول فوراً**

#### ج) العملات الرقمية (Crypto - Bitcoin/USDT)
- **الحالة**: يتطلب مراجعة الأدمن
- **العملية**:
  1. عرض عنوان المحفظة: `TQn9Y2khEsLJW1ChVWFMSMeRDow5oNDMnt`
  2. المستخدم يرسل المبلغ للعنوان
  3. رفع صورة لقطة الشاشة (إثبات الدفع)
  4. إنشاء سجل في جدول `payments`:
     - `status = 'reviewing'`
     - `admin_review_status = 'pending'`
     - `crypto_proof_image = [رابط الصورة]`
  5. إنشاء سجل في جدول `subscriptions` بحالة `inactive`
  6. تحديث المستخدم:
     - `status = 'payment_pending_review'`
     - `subscription_status = 'inactive'`
     - `is_active = false`
  7. التوجه لصفحة مراجعة الدفع
  8. **لا يمكن تسجيل الدخول حتى موافقة الأدمن**

---

### 6️⃣ صفحة مراجعة الدفع (Payment Review Page)
- **الملف**: `src/components/payments/PaymentReviewPage.tsx`
- **للعملات الرقمية فقط**
- **المميزات**:
  - عرض حالة المراجعة (pending/approved/rejected)
  - تحديث تلقائي كل 30 ثانية
  - زر للتحقق اليدوي من الحالة

#### حالة الموافقة (Approved):
- تظهر رسالة "تمت الموافقة على الدفع"
- زر "تسجيل الدخول الآن"
- **يمكن تسجيل الدخول**

#### حالة الرفض (Rejected):
- تظهر رسالة "تم رفض الدفع"
- سبب الرفض (إن وجد)
- زر "إعادة المحاولة"
- **لا يمكن تسجيل الدخول**

---

### 7️⃣ لوحة الإدارة - مراجعة الدفعات
- **الملف**: `src/components/admin/PaymentManagement.tsx`
- **الصلاحيات**: للأدمن فقط
- **المميزات**:
  - عرض جميع المدفوعات
  - تصفية حسب الحالة/الطريقة
  - البحث بالاسم/البريد
  - عرض صورة إثبات الدفع

#### عملية الموافقة:
1. الأدمن يضغط "موافقة"
2. تحديث جدول `payments`:
   - `status = 'completed'`
   - `admin_review_status = 'approved'`
   - `reviewed_by = [معرف الأدمن]`
   - `reviewed_at = [الوقت الحالي]`
3. تحديث جدول `subscriptions`:
   - `status = 'active'`
4. تحديث جدول `users`:
   - `status = 'active'`
   - `subscription_status = 'active'`
   - `is_active = true`
5. **المستخدم يمكنه الآن تسجيل الدخول**

#### عملية الرفض:
1. الأدمن يضغط "رفض"
2. تحديث جدول `payments`:
   - `status = 'failed'`
   - `admin_review_status = 'rejected'`
   - `reviewed_by = [معرف الأدمن]`
   - `reviewed_at = [الوقت الحالي]`
3. تحديث جدول `subscriptions`:
   - `status = 'cancelled'`
4. تحديث جدول `users`:
   - `status = 'pending_payment'`
   - `subscription_status = 'inactive'`
   - `is_active = false`
5. **المستخدم لا يمكنه تسجيل الدخول**

---

## 🔒 نظام الحماية على تسجيل الدخول

### الملف: `src/services/simpleAuthService.ts`

### شروط تسجيل الدخول:
1. ✅ **البريد الإلكتروني مفعل** (`email_verified = true`)
2. ✅ **الحساب نشط** (`is_active = true`)
3. ✅ **الاشتراك نشط** (`subscription_status = 'active'`)
4. ✅ **الحالة نشطة** (`status = 'active'`)

### الاستثناءات:
- **الأدمن** (`email = 'hichamkhad00@gmail.com'`): يمكنه الدخول دائماً بدون شروط

### رسائل الخطأ:
- "يجب تفعيل البريد الإلكتروني أولاً"
- "يجب إكمال الاشتراك والدفع قبل تسجيل الدخول"
- "دفعتك قيد المراجعة من قبل الإدارة"
- "حسابك غير نشط. يرجى التواصل مع الدعم"

---

## 🗄️ قاعدة البيانات

### جدول `users`
```sql
- id (UUID)
- auth_id (UUID) → auth.users
- username (TEXT)
- email (TEXT)
- full_name (TEXT)
- country (TEXT)
- role ('admin' | 'trader')
- is_active (BOOLEAN) → يحدد إمكانية الدخول
- email_verified (BOOLEAN) → يجب أن يكون true
- status (TEXT) → الحالة الحالية للمستخدم
  * 'pending_email_verification'
  * 'pending_subscription'
  * 'pending_payment'
  * 'payment_pending_review'
  * 'active'
  * 'suspended'
  * 'cancelled'
- subscription_status ('active' | 'inactive' | 'expired' | 'cancelled')
- subscription_end_date (TIMESTAMP)
```

### جدول `subscription_plans`
```sql
- id (UUID)
- name (TEXT)
- name_ar (TEXT)
- description (TEXT)
- description_ar (TEXT)
- price (NUMERIC)
- duration (TEXT)
- duration_months (INTEGER)
- features (JSONB)
- is_active (BOOLEAN)
```

### جدول `subscriptions`
```sql
- id (UUID)
- user_id (UUID) → users
- plan_id (UUID) → subscription_plans
- status ('active' | 'inactive' | 'cancelled' | 'expired')
- start_date (TIMESTAMP)
- end_date (TIMESTAMP)
- auto_renew (BOOLEAN)
```

### جدول `payments`
```sql
- id (UUID)
- user_id (UUID) → users
- subscription_id (UUID) → subscriptions
- amount (NUMERIC)
- currency (TEXT)
- payment_method ('paypal' | 'credit_card' | 'bitcoin' | 'crypto')
- status ('pending' | 'completed' | 'failed' | 'reviewing')
- transaction_id (TEXT)
- crypto_proof_image (TEXT) → رابط الصورة
- crypto_wallet_address (TEXT)
- admin_review_status ('pending' | 'approved' | 'rejected')
- admin_review_notes (TEXT)
- reviewed_by (UUID) → users
- reviewed_at (TIMESTAMP)
```

---

## 📊 مخطط التدفق

```
1. فتح التطبيق
   ↓
2. الصفحة الرئيسية (Landing Page)
   ↓
3. التسجيل (Register)
   ↓
4. تفعيل البريد الإلكتروني
   ↓
5. اختيار الباقة (Subscription)
   ↓
6. صفحة الدفع (Payment)
   ↓
   ├─→ PayPal/Card → النجاح → تسجيل الدخول ✅
   │
   └─→ Crypto → رفع الصورة → صفحة المراجعة
       ↓
       ├─→ موافقة الأدمن → تسجيل الدخول ✅
       │
       └─→ رفض الأدمن → لا يمكن الدخول ❌
```

---

## ⚠️ نقاط مهمة

### 1. الأمان
- ✅ التحقق من جميع الشروط قبل السماح بتسجيل الدخول
- ✅ Row Level Security (RLS) مفعل على جميع الجداول
- ✅ التحقق من صلاحيات الأدمن قبل مراجعة الدفعات

### 2. تجنب التعارضات
- ✅ استخدام دوال قاعدة البيانات (`update_payment_status_with_subscription`)
- ✅ تحديث جميع الجداول المرتبطة في معاملة واحدة
- ✅ التحقق من الحالة قبل كل عملية

### 3. تجربة المستخدم
- ✅ رسائل واضحة في كل خطوة
- ✅ تحديث تلقائي لحالة المراجعة
- ✅ إمكانية التحقق اليدوي من الحالة

### 4. لوحة الإدارة
- ✅ عرض جميع المدفوعات مع التفاصيل
- ✅ تصفية وبحث متقدم
- ✅ عرض صورة إثبات الدفع
- ✅ موافقة/رفض بضغطة واحدة

---

## 🔧 الملفات الرئيسية

### صفحات المستخدم:
- `src/pages/LandingPage.tsx` - الصفحة الرئيسية
- `src/components/auth/RegisterPage.tsx` - التسجيل
- `src/components/auth/EmailVerificationPage.tsx` - تفعيل البريد
- `src/components/subscription/SubscriptionPage.tsx` - اختيار الباقة
- `src/components/payments/PaymentPage.tsx` - الدفع
- `src/components/payments/PaymentReviewPage.tsx` - مراجعة الدفع
- `src/components/payments/PaymentSuccessPage.tsx` - نجاح الدفع

### لوحة الإدارة:
- `src/components/admin/AdminPanel.tsx` - اللوحة الرئيسية
- `src/components/admin/PaymentManagement.tsx` - إدارة المدفوعات
- `src/components/admin/SubscriptionManagement.tsx` - إدارة الاشتراكات

### الخدمات:
- `src/services/simpleAuthService.ts` - المصادقة
- `src/services/subscriptionService.ts` - الاشتراكات
- `src/services/paymentService.ts` - المدفوعات
- `src/services/emailService.ts` - البريد الإلكتروني

### قاعدة البيانات:
- `database_setup.sql` - إعداد قاعدة البيانات الكاملة

---

## 📝 ملاحظات للمطور

1. **عنوان المحفظة**: `TQn9Y2khEsLJW1ChVWFMSMeRDow5oNDMnt` (USDT TRC20)
2. **البريد الأدمن**: `hichamkhad00@gmail.com`
3. **Storage Bucket**: `payment-proofs` (لصور إثبات الدفع)
4. **التحديث التلقائي**: كل 30 ثانية في صفحة المراجعة
5. **حجم الصورة**: حد أقصى 5MB
6. **صيغ الصور المقبولة**: JPG, PNG, GIF

---

## ✅ قائمة التحقق

- [x] قاعدة البيانات معدة بالكامل
- [x] جميع الجداول موجودة
- [x] RLS مفعل ومضبوط
- [x] صفحات التسجيل والاشتراك جاهزة
- [x] صفحة الدفع تدعم جميع الطرق
- [x] صفحة مراجعة الدفع جاهزة
- [x] لوحة الإدارة جاهزة
- [x] نظام الحماية على تسجيل الدخول مطبق
- [x] التحقق من الاشتراك قبل الدخول
- [x] دوال قاعدة البيانات جاهزة
- [x] Storage Bucket للصور معد

---

## 🚀 الخطوات التالية

1. اختبار التدفق الكامل من البداية للنهاية
2. التأكد من عمل جميع طرق الدفع
3. اختبار موافقة/رفض الأدمن
4. التحقق من رسائل الخطأ
5. اختبار على أجهزة مختلفة

---

**تاريخ التوثيق**: 13 أكتوبر 2025
**الإصدار**: 1.0
**الحالة**: جاهز للاختبار ✅
