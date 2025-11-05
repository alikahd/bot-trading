# 📦 دليل النشر على GitHub و Railway

## 🎯 الخطوة 1: إنشاء مستودع GitHub

### 1. اذهب إلى GitHub:
```
https://github.com/new
```

### 2. أنشئ مستودع جديد:
- **Repository name**: `binary-trading-signals`
- **Description**: `Binary.com Trading Bot with Real-time Signals`
- **Public** أو **Private** (اختر ما تريد)
- ❌ **لا تضف** README, .gitignore, أو license (موجودة بالفعل)
- اضغط **"Create repository"**

### 3. انسخ رابط المستودع:
```
https://github.com/YOUR_USERNAME/binary-trading-signals.git
```

---

## 🎯 الخطوة 2: رفع الكود إلى GitHub

### افتح PowerShell في مجلد المشروع:

```powershell
# الانتقال لمجلد المشروع
cd "c:\Users\Hicha\Downloads\bot trading\New folder 17\bot.ali\railway-signals"

# تهيئة Git (إذا لم يكن مهيأ)
git init

# إضافة جميع الملفات
git add .

# إنشاء أول commit
git commit -m "Initial commit: Binary.com Trading Signals Bot"

# ربط المستودع البعيد (استبدل YOUR_USERNAME باسم المستخدم)
git remote add origin https://github.com/YOUR_USERNAME/binary-trading-signals.git

# رفع الكود
git push -u origin main
```

### إذا ظهر خطأ "main doesn't exist":
```powershell
git branch -M main
git push -u origin main
```

---

## 🎯 الخطوة 3: Deploy على Railway

### 1. اذهب إلى Railway:
```
https://railway.app/
```

### 2. سجل الدخول:
- اضغط **"Login"**
- اختر **"Login with GitHub"**
- وافق على الأذونات

### 3. إنشاء مشروع جديد:
- اضغط **"New Project"**
- اختر **"Deploy from GitHub repo"**
- اختر مستودع `binary-trading-signals`

### 4. إضافة Environment Variables:
- اضغط على المشروع
- اذهب إلى **"Variables"**
- أضف المتغيرات التالية:

```
TELEGRAM_BOT_TOKEN=8530062657:AAFda5kxR9VLgdTEyMum3ilTwRLaD93vN-8
TELEGRAM_CHAT_ID=-1003153068884
```

### 5. Deploy:
- Railway سيبدأ البناء تلقائياً
- انتظر حتى ترى ✅ **"Success"**

---

## 🎯 الخطوة 4: التحقق من التشغيل

### 1. عرض Logs:
- في Railway Dashboard
- اضغط على المشروع
- اذهب إلى **"Deployments"**
- اضغط **"View Logs"**

### 2. يجب أن ترى:
```
🎯 Binary.com Trading Signals - Railway
📡 اتصال حقيقي بـ Binary.com WebSocket
🔄 تحديث كل دقيقتين
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏰ بدء Cron Job - كل دقيقتين
🚀 بدء تحليل الأزواج...
📊 تحليل frxEURUSD...
✅ توصية: EURUSD CALL (75%)
📤 إرسال أفضل توصية: EURUSD CALL
✅ تم إرسال التوصية إلى Telegram
```

### 3. تحقق من Telegram:
- افتح قناة Telegram
- يجب أن تصل توصية خلال دقيقتين

---

## 🔄 تحديث الكود لاحقاً

### عند إجراء تعديلات:

```powershell
# في مجلد المشروع
cd "c:\Users\Hicha\Downloads\bot trading\New folder 17\bot.ali\railway-signals"

# إضافة التغييرات
git add .

# إنشاء commit
git commit -m "وصف التحديث"

# رفع التحديث
git push
```

**Railway سيقوم بـ Deploy تلقائياً!** 🚀

---

## ⚠️ استكشاف الأخطاء

### خطأ: "Git is not recognized"
```powershell
# تثبيت Git
winget install Git.Git
```

### خطأ: "Permission denied"
```powershell
# استخدم HTTPS بدلاً من SSH
git remote set-url origin https://github.com/YOUR_USERNAME/binary-trading-signals.git
```

### خطأ: "Authentication failed"
```powershell
# استخدم Personal Access Token
# اذهب إلى: https://github.com/settings/tokens
# أنشئ token جديد واستخدمه كـ password
```

---

## ✅ تم!

الآن لديك:
- ✅ كود محفوظ على GitHub
- ✅ بوت يعمل 24/7 على Railway
- ✅ تحديثات تلقائية عند Push
- ✅ توصيات حقيقية كل دقيقتين

**استمتع بالتوصيات! 🎯**
