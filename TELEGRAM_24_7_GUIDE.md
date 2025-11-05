# 🌐 دليل إرسال التوصيات 24/7 بدون فتح التطبيق

## 🎯 المشكلة:
التطبيق الحالي يرسل التوصيات فقط عندما يكون **مفتوحاً في المتصفح**. إذا أغلقت التطبيق، تتوقف التوصيات.

## ✅ الحل: Netlify Scheduled Functions

استخدام **Netlify Functions** التي تعمل تلقائياً على السحابة 24/7 بدون حاجة لفتح التطبيق.

---

## 📋 ما تم إنشاؤه:

### 1. **Netlify Function** 
`netlify/functions/send-telegram-signals.ts`

**الوظيفة:**
- تعمل تلقائياً كل **دقيقة واحدة**
- تجلب التوصيات من Binary API
- ترتبها حسب الثقة
- ترسل أفضل توصية إلى Telegram

### 2. **تكوين Netlify**
`netlify.toml`

**الإعدادات:**
```toml
[functions."send-telegram-signals"]
  schedule = "* * * * *"  # كل دقيقة
```

---

## 🚀 خطوات التفعيل:

### **الخطوة 1: تثبيت Dependencies**

```bash
npm install @netlify/functions
```

### **الخطوة 2: إضافة المتغيرات البيئية في Netlify**

1. اذهب إلى **Netlify Dashboard**
2. اختر موقعك
3. اذهب إلى **Site settings** → **Environment variables**
4. أضف المتغيرات التالية:

```
VITE_TELEGRAM_BOT_TOKEN=8530062657:AAFda5kxR9VLgdTEyMum3ilTwRLaD93vN-8
VITE_TELEGRAM_CHAT_ID=-1003153068884
VITE_BINARY_API_URL=http://your-binary-api-url.com
```

### **الخطوة 3: Deploy إلى Netlify**

```bash
# إذا لم تكن قد ربطت الموقع بعد
netlify init

# رفع التحديثات
git add .
git commit -m "Add Netlify scheduled function for Telegram signals"
git push

# أو Deploy مباشرة
netlify deploy --prod
```

### **الخطوة 4: تفعيل Scheduled Functions**

في Netlify Dashboard:
1. اذهب إلى **Functions** tab
2. ابحث عن `send-telegram-signals`
3. تأكد من أن **Schedule** مفعل

---

## ⚙️ كيف يعمل النظام:

```
كل دقيقة:
1. Netlify Function تستيقظ تلقائياً
2. تتصل بـ Binary API
3. تجلب جميع التوصيات
4. ترتبها حسب الثقة (الأفضل أولاً)
5. ترسل أفضل توصية إلى Telegram
6. تنام حتى الدقيقة التالية
```

---

## 📊 الفرق بين النظامين:

### **النظام القديم (Frontend):**
```
❌ يحتاج فتح التطبيق
❌ يتوقف عند إغلاق المتصفح
❌ يستهلك موارد الجهاز
✅ إرسال كل 5 ثواني
```

### **النظام الجديد (Netlify):**
```
✅ يعمل 24/7 تلقائياً
✅ لا يحتاج فتح التطبيق
✅ لا يستهلك موارد جهازك
⚠️ إرسال كل دقيقة (قيد Netlify)
```

---

## 🔧 تخصيص التوقيت:

### **تغيير الجدولة:**

في `netlify.toml`:

```toml
# كل دقيقة (الحالي)
schedule = "* * * * *"

# كل 5 دقائق
schedule = "*/5 * * * *"

# كل 10 دقائق
schedule = "*/10 * * * *"

# كل ساعة
schedule = "0 * * * *"
```

**ملاحظة:** Netlify لا يدعم جدولة أقل من دقيقة واحدة.

---

## 🎯 للحصول على إرسال كل 5 ثواني:

### **الحل 1: استخدام Cron-job.org (مجاني)**

1. اذهب إلى https://cron-job.org
2. أنشئ حساب مجاني
3. أضف Cron Job جديد:
   - **URL**: `https://your-site.netlify.app/.netlify/functions/send-telegram-signals`
   - **Schedule**: كل 5 ثواني
   - **Method**: GET

### **الحل 2: استخدام Railway/Render (VPS)**

Deploy خادم Node.js بسيط:

```javascript
// server.js
setInterval(async () => {
  await fetch('https://your-site.netlify.app/.netlify/functions/send-telegram-signals');
}, 5000); // 5 ثواني
```

### **الحل 3: استخدام GitHub Actions**

```yaml
# .github/workflows/telegram-signals.yml
name: Send Telegram Signals
on:
  schedule:
    - cron: '*/1 * * * *'  # كل دقيقة (أقصى ما يدعمه GitHub)
jobs:
  send:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Function
        run: |
          curl https://your-site.netlify.app/.netlify/functions/send-telegram-signals
```

---

## 📝 اختبار الـ Function:

### **1. اختبار محلي:**

```bash
# تثبيت Netlify CLI
npm install -g netlify-cli

# تشغيل Functions محلياً
netlify dev

# اختبار Function
curl http://localhost:8888/.netlify/functions/send-telegram-signals
```

### **2. اختبار على Netlify:**

```bash
# بعد Deploy
curl https://your-site.netlify.app/.netlify/functions/send-telegram-signals
```

### **3. مراقبة Logs:**

في Netlify Dashboard:
1. اذهب إلى **Functions** tab
2. اضغط على `send-telegram-signals`
3. شاهد **Function logs**

---

## 🔍 استكشاف الأخطاء:

### **المشكلة: Function لا تعمل**

**الحل:**
1. تحقق من **Environment Variables** في Netlify
2. تأكد من صحة `TELEGRAM_BOT_TOKEN` و `TELEGRAM_CHAT_ID`
3. راجع **Function logs** في Netlify Dashboard

### **المشكلة: لا تصل الرسائل**

**الحل:**
1. اختبر Bot Token يدوياً:
```bash
curl "https://api.telegram.org/bot<YOUR_TOKEN>/getMe"
```

2. تحقق من Chat ID:
```bash
curl "https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates"
```

### **المشكلة: Binary API لا يستجيب**

**الحل:**
1. تأكد من أن `VITE_BINARY_API_URL` صحيح
2. تحقق من أن Binary API يعمل:
```bash
curl http://your-binary-api-url.com/api/signals
```

---

## 💰 التكلفة:

### **Netlify Free Tier:**
- ✅ 125,000 Function invocations/month
- ✅ كافية لـ: 125,000 ÷ 60 ÷ 24 = **86 يوم** من الإرسال كل دقيقة
- ✅ **مجاني تماماً!**

### **إذا احتجت أكثر:**
- Netlify Pro: $19/شهر (1,000,000 invocations)
- أو استخدم Railway/Render (مجاني أيضاً)

---

## 📊 المقارنة النهائية:

| الميزة | Frontend (قديم) | Netlify Function (جديد) |
|--------|----------------|------------------------|
| يعمل 24/7 | ❌ | ✅ |
| بدون فتح التطبيق | ❌ | ✅ |
| التكرار | كل 5 ثواني | كل دقيقة* |
| التكلفة | مجاني | مجاني |
| استهلاك الموارد | عالي | صفر |
| الموثوقية | منخفضة | عالية |

*يمكن تحسينه إلى 5 ثواني باستخدام Cron-job.org

---

## ✅ الخلاصة:

### **للاستخدام الفوري:**
1. ✅ Deploy إلى Netlify
2. ✅ أضف Environment Variables
3. ✅ انتظر دقيقة واحدة
4. ✅ ستبدأ التوصيات بالوصول تلقائياً!

### **للحصول على إرسال كل 5 ثواني:**
- استخدم Cron-job.org (الأسهل)
- أو Deploy خادم Node.js على Railway/Render

---

**🎉 الآن التوصيات ستصل 24/7 بدون حاجة لفتح التطبيق!**
