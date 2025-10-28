# 🌐 إعداد Cloudflare Tunnel للاستضافة المحلية

## 📌 نظرة عامة
يتيح لك Cloudflare Tunnel تشغيل السيرفر على جهازك المحلي مع إمكانية الوصول إليه من أي مكان في العالم - **مجاناً!**

---

## 🚀 الخطوة 1: تثبيت Cloudflare Tunnel

### على Windows:

#### الطريقة 1: باستخدام Chocolatey (الأسهل)
```powershell
# تثبيت Chocolatey إذا لم يكن مثبتاً
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# تثبيت cloudflared
choco install cloudflared
```

#### الطريقة 2: تحميل مباشر
1. اذهب إلى: https://github.com/cloudflare/cloudflared/releases
2. حمّل `cloudflared-windows-amd64.exe`
3. أعد تسميته إلى `cloudflared.exe`
4. ضعه في مجلد المشروع

---

## 🔧 الخطوة 2: تشغيل السيرفر المحلي

```bash
# في Terminal 1 - تشغيل السيرفر
python iqoption_unofficial_server.py
```

يجب أن ترى:
```
✅ تم الاتصال بـ IQ Option بنجاح!
🌐 الخادم يعمل على http://0.0.0.0:5000
```

---

## 🌍 الخطوة 3: إنشاء Tunnel

```bash
# في Terminal 2 - إنشاء tunnel
cloudflared tunnel --url http://localhost:5000
```

ستحصل على URL مثل:
```
https://random-name-abc123.trycloudflare.com
```

**⚠️ مهم:** احفظ هذا الـ URL - ستحتاجه في الخطوة التالية!

---

## ⚙️ الخطوة 4: تحديث إعدادات الواجهة

افتح ملف: `src/config/serverConfig.ts`

```typescript
// استبدل localhost بـ URL من Cloudflare
export const SERVER_CONFIG = {
  // قبل:
  // BASE_URL: 'http://localhost:5000',
  
  // بعد:
  BASE_URL: 'https://your-tunnel-url.trycloudflare.com',  // ← ضع URL هنا
};

export const API_ENDPOINTS = {
  base: SERVER_CONFIG.BASE_URL,
  quotes: `${SERVER_CONFIG.BASE_URL}/api/quotes`,
  status: `${SERVER_CONFIG.BASE_URL}/api/status`,
  // ... باقي الـ endpoints
};
```

---

## 🚀 الخطوة 5: نشر الواجهة على Netlify

```bash
# Commit التغييرات
git add src/config/serverConfig.ts
git commit -m "Update server URL to Cloudflare Tunnel"
git push

# Netlify سيقوم بالنشر تلقائياً
```

---

## ✅ التحقق من العمل

1. افتح موقعك على Netlify
2. تحقق من حالة الاتصال بـ IQ Option
3. يجب أن ترى جميع الأزواج (42-46 زوج) ✅

---

## 🔄 للاستخدام اليومي

### تشغيل السيرفر:
```bash
# Terminal 1
python iqoption_unofficial_server.py

# Terminal 2
cloudflared tunnel --url http://localhost:5000
```

### إيقاف السيرفر:
- اضغط `Ctrl+C` في كلا الـ terminals

---

## 💡 نصائح مهمة

### 1. **URL متغير:**
- كل مرة تشغل `cloudflared` ستحصل على URL جديد
- يجب تحديث `serverConfig.ts` في كل مرة

### 2. **URL ثابت (اختياري):**
لـ URL ثابت، استخدم Named Tunnel:
```bash
# تسجيل الدخول
cloudflared tunnel login

# إنشاء tunnel دائم
cloudflared tunnel create my-iq-bot

# تشغيله
cloudflared tunnel run my-iq-bot
```

### 3. **تشغيل تلقائي:**
يمكن جعل السيرفر يعمل تلقائياً عند بدء Windows:
- أضف script إلى Task Scheduler
- أو استخدم NSSM (Non-Sucking Service Manager)

---

## 🆘 حل المشاكل

### المشكلة: "cloudflared: command not found"
**الحل:** أعد تشغيل Terminal بعد التثبيت

### المشكلة: "Connection refused"
**الحل:** تأكد من أن السيرفر يعمل على port 5000

### المشكلة: "Too many redirects"
**الحل:** تأكد من استخدام `http://localhost:5000` وليس `https://`

---

## 📊 المقارنة

| الميزة | Railway/Render | Cloudflare Tunnel |
|--------|---------------|-------------------|
| **التكلفة** | مجاني محدود | مجاني 100% |
| **عدد الأزواج** | 3 فقط ❌ | 42-46 ✅ |
| **السرعة** | بطيء | سريع جداً |
| **الاستقرار** | متوسط | ممتاز |
| **المتطلبات** | لا شيء | جهاز مشغّل |

---

## 🎯 الخطوة التالية

بعد الإعداد، راجع ملف `PRODUCTION_DEPLOYMENT.md` لخيارات النشر المتقدمة.
