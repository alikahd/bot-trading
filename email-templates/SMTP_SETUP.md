# 📧 إعداد SMTP المخصص - Custom SMTP Setup

## 🎯 الهدف:
تغيير اسم المرسل من "Supabase" إلى "Bot Trading Platform"

---

## 📋 الخطوات:

### **1. اختر خدمة SMTP:**

#### **أ) SendGrid (موصى به):**
- ✅ مجاني: 100 بريد/يوم
- ✅ سهل الإعداد
- ✅ احترافي

**التسجيل:**
1. اذهب إلى: https://sendgrid.com/
2. سجل حساب مجاني
3. تحقق من بريدك الإلكتروني
4. أنشئ API Key من: Settings → API Keys
5. احفظ الـ API Key (لن تراه مرة أخرى!)

**الإعدادات:**
```
Host: smtp.sendgrid.net
Port: 587
Username: apikey
Password: YOUR_SENDGRID_API_KEY
Sender Email: noreply@bottrading.com
Sender Name: Bot Trading Platform
```

---

#### **ب) Gmail (للاختبار فقط):**

**الإعداد:**
1. اذهب إلى: https://myaccount.google.com/security
2. فعّل "2-Step Verification"
3. اذهب إلى: "App passwords"
4. أنشئ App Password جديد
5. احفظ الكود (16 حرف)

**الإعدادات:**
```
Host: smtp.gmail.com
Port: 587
Username: your-email@gmail.com
Password: YOUR_APP_PASSWORD (16 حرف)
Sender Email: your-email@gmail.com
Sender Name: Bot Trading Platform
```

⚠️ **تحذير:** Gmail يحد من 500 بريد/يوم

---

#### **ج) Mailgun:**

**التسجيل:**
1. اذهب إلى: https://www.mailgun.com/
2. سجل حساب مجاني
3. أضف نطاقك (Domain)
4. احصل على SMTP credentials

**الإعدادات:**
```
Host: smtp.mailgun.org
Port: 587
Username: postmaster@your-domain.com
Password: YOUR_MAILGUN_PASSWORD
Sender Email: noreply@bottrading.com
Sender Name: Bot Trading Platform
```

---

#### **د) Amazon SES (للإنتاج الكبير):**

**المميزات:**
- ✅ رخيص جداً: $0.10 لكل 1000 بريد
- ✅ موثوق للغاية
- ✅ مناسب للإنتاج

**الإعداد:**
1. اذهب إلى: AWS Console → SES
2. تحقق من بريدك أو نطاقك
3. أنشئ SMTP Credentials
4. اطلب الخروج من Sandbox Mode

**الإعدادات:**
```
Host: email-smtp.us-east-1.amazonaws.com
Port: 587
Username: YOUR_SES_USERNAME
Password: YOUR_SES_PASSWORD
Sender Email: noreply@bottrading.com
Sender Name: Bot Trading Platform
```

---

## 🔧 **2. تطبيق الإعدادات في Supabase:**

### **من Dashboard:**

1. **اذهب إلى:**
   ```
   https://supabase.com/dashboard/project/djlirquyvpccuvjdaueb/settings/auth
   ```

2. **ابحث عن "SMTP Settings"**

3. **فعّل "Enable Custom SMTP"**

4. **أدخل المعلومات:**
   - **Host:** (من الخدمة التي اخترتها)
   - **Port Number:** `587` (أو `465` للـ SSL)
   - **Username:** (من الخدمة)
   - **Password:** (API Key أو Password)
   - **Sender email:** `noreply@bottrading.com`
   - **Sender name:** `Bot Trading Platform`

5. **اضغط "Save"**

6. **اختبر الإعدادات:**
   - اضغط "Send test email"
   - أدخل بريدك
   - تحقق من الرسالة

---

### **باستخدام Supabase CLI:**

```bash
# تسجيل الدخول
supabase login

# ربط المشروع
supabase link --project-ref djlirquyvpccuvjdaueb

# تحديث إعدادات SMTP
supabase secrets set SMTP_HOST=smtp.sendgrid.net
supabase secrets set SMTP_PORT=587
supabase secrets set SMTP_USER=apikey
supabase secrets set SMTP_PASS=YOUR_API_KEY
supabase secrets set SMTP_SENDER_EMAIL=noreply@bottrading.com
supabase secrets set SMTP_SENDER_NAME="Bot Trading Platform"
```

---

## ✅ **3. التحقق:**

### **اختبار البريد:**

1. **من Dashboard:**
   - اذهب إلى: Authentication → Email Templates
   - اختر أي قالب
   - اضغط "Send test email"
   - تحقق من:
     - ✅ اسم المرسل: "Bot Trading Platform"
     - ✅ البريد: noreply@bottrading.com
     - ✅ التصميم صحيح

2. **تسجيل مستخدم جديد:**
   ```javascript
   const { data, error } = await supabase.auth.signUp({
     email: 'test@example.com',
     password: 'password123'
   });
   ```
   - تحقق من البريد الوارد
   - تأكد من اسم المرسل

---

## 🎨 **4. تخصيص إضافي:**

### **إضافة صورة المرسل:**

بعض خدمات البريد تدعم Gravatar:
1. اذهب إلى: https://gravatar.com/
2. سجل بنفس البريد: `noreply@bottrading.com`
3. ارفع صورة الشعار
4. سيظهر تلقائياً في بعض عملاء البريد

---

### **إضافة Domain Authentication:**

لتحسين معدل التسليم:

1. **SPF Record:**
   ```
   v=spf1 include:sendgrid.net ~all
   ```

2. **DKIM Record:**
   - احصل عليه من خدمة SMTP
   - أضفه في DNS الخاص بنطاقك

3. **DMARC Record:**
   ```
   v=DMARC1; p=none; rua=mailto:dmarc@bottrading.com
   ```

---

## 📊 **5. المراقبة:**

### **SendGrid Dashboard:**
- عدد الرسائل المرسلة
- معدل الفتح
- معدل النقر
- الرسائل المرتدة

### **Supabase Logs:**
```bash
# عرض logs البريد
supabase logs --project-ref djlirquyvpccuvjdaueb --type auth
```

---

## 🔒 **6. الأمان:**

### **أفضل الممارسات:**

1. ✅ استخدم App Passwords (لا تستخدم كلمة المرور الأساسية)
2. ✅ احفظ المفاتيح في Environment Variables
3. ✅ لا تشارك API Keys في الكود
4. ✅ فعّل 2FA على حساب SMTP
5. ✅ راقب الاستخدام بانتظام

---

## 💰 **7. التكاليف:**

| الخدمة | المجاني | السعر |
|--------|---------|-------|
| **SendGrid** | 100/يوم | $15/شهر (40k) |
| **Mailgun** | 5000/شهر | $35/شهر (50k) |
| **Amazon SES** | 62000/شهر* | $0.10/1000 |
| **Gmail** | 500/يوم | مجاني |

*مع AWS Free Tier

---

## 🆘 **8. استكشاف الأخطاء:**

### **المشكلة: البريد لا يصل**
- ✅ تحقق من Spam folder
- ✅ تحقق من SMTP credentials
- ✅ تحقق من Supabase logs
- ✅ تحقق من حد الإرسال اليومي

### **المشكلة: اسم المرسل لا يتغير**
- ✅ تأكد من حفظ الإعدادات
- ✅ انتظر 5 دقائق للتحديث
- ✅ امسح cache المتصفح
- ✅ جرب بريد آخر

### **المشكلة: Authentication failed**
- ✅ تحقق من Username/Password
- ✅ استخدم App Password (Gmail)
- ✅ تحقق من Port number
- ✅ جرب Port 465 بدلاً من 587

---

## 📞 **الدعم:**

- **Supabase Docs:** https://supabase.com/docs/guides/auth/auth-smtp
- **SendGrid Docs:** https://docs.sendgrid.com/
- **Mailgun Docs:** https://documentation.mailgun.com/

---

**تم إنشاؤه:** 4 نوفمبر 2025، 1:44 صباحاً
**المشروع:** Bot Trading Platform
**Supabase Project ID:** djlirquyvpccuvjdaueb
