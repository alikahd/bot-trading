# دليل التشغيل السريع - أزرار PayPal

## الخطوات السريعة للتشغيل

### 1. إعداد ملف البيئة
```bash
# انسخ ملف .env.example إلى .env
copy .env.example .env
```

ثم افتح ملف `.env` وأضف بيانات PayPal الخاصة بك:
```env
PAYPAL_CLIENT_ID=your_actual_client_id
PAYPAL_CLIENT_SECRET=your_actual_client_secret
```

### 2. تشغيل السيرفر
افتح نافذة Terminal جديدة وشغل:
```bash
npm run server
```

يجب أن ترى:
```
🚀 PayPal server running on http://localhost:8787
```

### 3. تشغيل التطبيق
في نافذة Terminal أخرى، شغل:
```bash
npm run dev
```

### 4. اختبار الأزرار
1. افتح التطبيق في المتصفح
2. سجل دخول أو أنشئ حساب
3. اذهب إلى صفحة الاشتراكات
4. اختر باقة
5. في صفحة الدفع، ستجد:
   - **زر PayPal الذهبي** 💙 - للدفع بحساب PayPal
   - **زر البطاقة الأسود** 💳 - للدفع بالبطاقة البنكية

## كيفية الحصول على بيانات PayPal

### للاختبار (Sandbox):
1. اذهب إلى: https://developer.paypal.com/
2. سجل دخول أو أنشئ حساب مطور
3. اذهب إلى "Dashboard" > "Apps & Credentials"
4. اختر "Sandbox"
5. انقر على "Create App"
6. انسخ:
   - Client ID
   - Secret

### للإنتاج (Production):
1. نفس الخطوات السابقة
2. لكن اختر "Live" بدلاً من "Sandbox"
3. تأكد من تفعيل حسابك التجاري

## تغيير البيئة

### للاختبار (Sandbox):
في ملف `server/index.js`، غير السطر 12:
```javascript
const PAYPAL_API_BASE = 'https://api-m.sandbox.paypal.com';
```

### للإنتاج (Production):
```javascript
const PAYPAL_API_BASE = 'https://api-m.paypal.com';
```

## بطاقات اختبار

### Visa:
```
رقم: 4111 1111 1111 1111
تاريخ: 12/2025
CVV: 123
```

### Mastercard:
```
رقم: 5555 5555 5555 4444
تاريخ: 12/2025
CVV: 123
```

## استكشاف الأخطاء

### الزر لا يظهر:
- تحقق من Console في المتصفح
- تأكد من تشغيل السيرفر
- تحقق من صحة Client ID

### خطأ في الدفع:
- تحقق من صحة بيانات PayPal في `.env`
- تأكد من اختيار البيئة الصحيحة (Sandbox/Live)
- تحقق من الاتصال بالإنترنت

### زر البطاقة لا يعمل:
- هذا طبيعي في بعض الحالات
- استخدم زر PayPal واختر "الدفع بالبطاقة"
- تأكد من تفعيل الدفع بالبطاقة في حساب PayPal

## الأوامر المفيدة

```bash
# تشغيل التطبيق
npm run dev

# تشغيل السيرفر
npm run server

# بناء التطبيق للإنتاج
npm run build

# إعداد ملف .env
npm run setup
```

## الدعم

إذا واجهت أي مشاكل:
1. راجع ملف `PAYPAL_BUTTONS_GUIDE.md` للتفاصيل الكاملة
2. تحقق من Console للأخطاء
3. تأكد من صحة جميع الإعدادات
