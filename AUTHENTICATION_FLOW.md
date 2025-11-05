# 🔐 تدفق المصادقة والاشتراك - التوثيق الكامل

## 📋 جدول المحتويات
1. [حالات المستخدم](#حالات-المستخدم)
2. [منطق redirectTo](#منطق-redirectto)
3. [قاعدة البيانات](#قاعدة-البيانات)
4. [التدفق الكامل](#التدفق-الكامل)

---

## 🎯 حالات المستخدم

### 1️⃣ **Admin (المدير)**
```
role = 'admin'
```
- **الأولوية:** قصوى - دخول مباشر دائماً
- **redirectTo:** `null`
- **التوجيه:** لوحة التحكم مباشرة
- **لا يحتاج:** تفعيل بريد، اشتراك، أي شيء

### 2️⃣ **مستخدم جديد (بريد غير مفعّل)**
```
email_verified = false
status = 'pending_email_verification'
```
- **redirectTo:** `'email_verification'`
- **التوجيه:** صفحة تفعيل البريد
- **الخطوة التالية:** تفعيل البريد → صفحة الاشتراك

### 3️⃣ **مستخدم مفعّل (بدون اشتراك)**
```
email_verified = true
status = 'pending_subscription'
subscription_status = 'inactive'
```
- **redirectTo:** `'subscription'`
- **التوجيه:** صفحة الباقات
- **الخطوة التالية:** اختيار باقة والدفع

### 4️⃣ **مستخدم مشترك ونشط**
```
email_verified = true
status = 'active'
subscription_status = 'active'
```
- **redirectTo:** `null`
- **التوجيه:** لوحة التحكم مباشرة
- **الوصول:** كامل للتطبيق

### 5️⃣ **دفع في انتظار المراجعة**
```
status = 'payment_pending_review'
```
- **redirectTo:** `'payment_pending'`
- **التوجيه:** صفحة انتظار مراجعة الأدمن
- **الخطوة التالية:** انتظار موافقة الأدمن

### 6️⃣ **حساب محظور**
```
status = 'suspended' | 'cancelled'
```
- **redirectTo:** `'blocked'`
- **التوجيه:** رسالة حظر + تسجيل خروج
- **الوصول:** ممنوع

---

## 🔄 منطق redirectTo في `simpleAuthService.ts`

```typescript
// ✅ الترتيب الصحيح (حسب الأولوية):

1. Admin → redirectTo = null (دخول مباشر)
   
2. البريد غير مفعل → redirectTo = 'email_verification'
   
3. حساب محظور → redirectTo = 'blocked'
   
4. دفع قيد المراجعة → redirectTo = 'payment_pending'
   
5. مستخدم نشط مع اشتراك → redirectTo = null (دخول مباشر)
   
6. أي حالة أخرى → redirectTo = 'subscription'
```

---

## 💾 قاعدة البيانات

### جدول `users`

#### الحقول المهمة:
```sql
- id: uuid (primary key)
- auth_id: uuid (من Supabase Auth)
- email: varchar (unique)
- username: varchar (unique)
- role: varchar ('admin' | 'trader') [default: 'trader']
- status: varchar [default: 'pending_email_verification']
  الحالات: 
  - 'pending_email_verification'
  - 'pending_subscription'
  - 'email_verified'
  - 'pending_payment'
  - 'payment_pending_review'
  - 'active'
  - 'suspended'
  - 'cancelled'
  
- subscription_status: varchar [default: 'inactive']
  الحالات:
  - 'inactive'
  - 'active'
  - 'expired'
  - 'suspended'
  
- email_verified: boolean [default: false]
- is_active: boolean [default: true]
```

#### القواعد الذهبية:
1. **Admin:** `role = 'admin'` → دخول مباشر دائماً
2. **مستخدم مشترك:** `status = 'active' AND subscription_status = 'active'`
3. **مستخدم جديد:** `email_verified = false`
4. **مستخدم مفعّل بدون اشتراك:** `email_verified = true AND status = 'pending_subscription'`

---

## 🚀 التدفق الكامل

### 📝 **تسجيل جديد (Email/Password)**

```
1. المستخدم يملأ النموذج
   ↓
2. registerUser() في simpleAuthService
   ↓
3. إنشاء حساب في Supabase Auth
   ↓
4. إنشاء سجل في جدول users:
   - email_verified = false
   - status = 'pending_email_verification'
   - subscription_status = 'inactive'
   ↓
5. تسجيل خروج فوري
   ↓
6. عرض EmailVerificationPage
   ↓
7. إرسال رابط التفعيل تلقائياً
```

### 📧 **تفعيل البريد**

```
1. المستخدم يضغط رابط التفعيل
   ↓
2. Supabase يوجه إلى `/` مع hash token
   ↓
3. App.tsx يكتشف callback
   ↓
4. تحديث قاعدة البيانات:
   - email_verified = true
   - status = 'pending_subscription'
   ↓
5. إعادة تحميل الصفحة
   ↓
6. simpleAuthService يحدد redirectTo = 'subscription'
   ↓
7. توجيه لصفحة الباقات
```

### 🔑 **تسجيل دخول (Email/Password)**

```
1. المستخدم يدخل البيانات
   ↓
2. login() في simpleAuthService
   ↓
3. Supabase Auth يتحقق
   ↓
4. تحميل بيانات من جدول users
   ↓
5. تحديد redirectTo حسب الحالة:
   
   ✅ Admin → redirectTo = null
   ✅ مشترك → redirectTo = null
   ❌ بريد غير مفعل → redirectTo = 'email_verification'
   ❌ بدون اشتراك → redirectTo = 'subscription'
   ↓
6. App.tsx يعالج redirectTo:
   
   - null → لوحة التحكم
   - 'subscription' → صفحة الباقات
   - 'email_verification' → صفحة التفعيل
```

### 🔵 **تسجيل/دخول Google OAuth**

```
1. المستخدم يضغط زر Google
   ↓
2. Supabase OAuth يفتح نافذة Google
   ↓
3. المستخدم يختار حسابه
   ↓
4. Supabase يُنشئ/يُحدّث الحساب:
   - email_verified = true (تلقائياً من Google)
   ↓
5. إذا كان مستخدم جديد:
   - status = 'pending_subscription'
   - subscription_status = 'inactive'
   ↓
6. توجيه لـ `/` مع hash token
   ↓
7. simpleAuthService يحدد redirectTo:
   - مستخدم جديد → 'subscription'
   - مستخدم مشترك → null
   ↓
8. توجيه حسب الحالة
```

---

## ⚙️ الكود الرئيسي

### `simpleAuthService.ts` (السطور 263-313)

```typescript
// التحقق من دور المستخدم
const isAdmin = data.role === 'admin';

// ✅ Admin له أولوية قصوى - دخول مباشر دائماً
if (isAdmin) {
  console.log('👑 Admin - دخول مباشر للوحة التحكم');
  redirectTo = null;
  localStorage.removeItem('show_subscription_page');
  localStorage.removeItem('subscription_step');
  localStorage.removeItem('selected_plan');
}
// للمستخدمين العاديين، نتحقق من الحالات
else {
  if (!data.email_verified) {
    redirectTo = 'email_verification';
  }
  else if (data.status === 'suspended' || data.status === 'cancelled') {
    redirectTo = 'blocked';
  }
  else if (data.status === 'payment_pending_review') {
    redirectTo = 'payment_pending';
  }
  else if (data.status === 'active' && data.subscription_status === 'active') {
    redirectTo = null; // دخول مباشر
    localStorage.removeItem('show_subscription_page');
    localStorage.removeItem('subscription_step');
    localStorage.removeItem('selected_plan');
  }
  else {
    redirectTo = 'subscription';
  }
}
```

### `App.tsx` (السطور 264-284)

```typescript
// ✅ Admin له أولوية قصوى - دخول مباشر دائماً
if (isAdmin) {
  console.log('👑 Admin - دخول مباشر للوحة التحكم');
  setShowSubscriptionPage(false);
  localStorage.removeItem(STORAGE_KEYS.SHOW_SUBSCRIPTION_PAGE);
  setActiveTab('recommendations');
  window.history.replaceState({ authenticated: true }, '', '/dashboard');
  setIsCheckingSubscription(false);
  return;
}

// ✅ مستخدم مشترك ونشط - دخول مباشر للوحة التحكم
if (hasActiveSubscription) {
  console.log('✅ المستخدم مشترك - دخول مباشر للوحة التحكم');
  setShowSubscriptionPage(false);
  localStorage.removeItem(STORAGE_KEYS.SHOW_SUBSCRIPTION_PAGE);
  setActiveTab('recommendations');
  window.history.replaceState({ authenticated: true }, '', '/dashboard');
  setIsCheckingSubscription(false);
  return;
}
```

---

## 🐛 المشاكل السابقة وحلولها

### ❌ **المشكلة 1:** Admin يُوجّه لصفحة الباقات
**السبب:** كان الشرط `(isAdmin || hasActiveSubscription)` يفشل لأن Admin لديه `subscription_status = 'expired'`

**الحل:** فصل منطق Admin تماماً وإعطائه أولوية قصوى

### ❌ **المشكلة 2:** ظهور صفحة الباقات لثوانٍ قبل الدخول
**السبب:** كان يوجد `setTimeout(800ms)` يؤخر المعالجة

**الحل:** إزالة setTimeout ومعالجة فورية للمستخدمين المشتركين

### ❌ **المشكلة 3:** تضارب بين `users.subscription_status` و `subscriptions.status`
**السبب:** Admin لديه `subscription_status = 'expired'` في جدول users

**الحل:** تحديث `subscription_status` للAdmin إلى `'active'`

---

## ✅ الخلاصة

### القواعد الذهبية:
1. **Admin أولاً** - دائماً دخول مباشر
2. **تفعيل البريد ثانياً** - لا دخول بدون تفعيل
3. **الاشتراك ثالثاً** - لا دخول بدون اشتراك ساري
4. **معالجة فورية** - لا تأخير، لا setTimeout
5. **مسح localStorage** - عند الدخول الناجح

### نقاط التحقق:
- ✅ `role = 'admin'` → دخول مباشر
- ✅ `email_verified = false` → صفحة التفعيل
- ✅ `status = 'active' AND subscription_status = 'active'` → دخول مباشر
- ✅ أي حالة أخرى → صفحة الاشتراك

---

**آخر تحديث:** 3 نوفمبر 2025
**الحالة:** ✅ جاهز للإنتاج
