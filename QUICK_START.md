# 🚀 دليل البدء السريع - Cloudflare Tunnel

## ⚡ 3 خطوات فقط!

### 📥 الخطوة 1: تثبيت Cloudflare Tunnel

**افتح PowerShell كمسؤول** وشغل:

```powershell
choco install cloudflared
```

إذا لم يكن Chocolatey مثبت:
```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

---

### 🖥️ الخطوة 2: تشغيل السيرفر

#### الطريقة السهلة:
```bash
# اضغط دبل كليك على:
start_local_server.bat
```

#### أو يدوياً:
```bash
python iqoption_unofficial_server.py
```

انتظر حتى ترى:
```
✅ تم الاتصال بـ IQ Option بنجاح!
🌐 الخادم يعمل على http://0.0.0.0:5000
```

---

### 🌍 الخطوة 3: إنشاء Tunnel

**افتح terminal جديد** وشغل:

#### الطريقة السهلة:
```bash
# اضغط دبل كليك على:
start_tunnel.bat
```

#### أو يدوياً:
```bash
cloudflared tunnel --url http://localhost:5000
```

ستحصل على URL مثل:
```
https://random-abc-123.trycloudflare.com
```

**✅ احفظ هذا الـ URL!**

---

### ⚙️ الخطوة 4: تحديث الإعدادات

1. افتح: `src/config/serverConfig.ts`

2. استبدل Railway URL بـ Cloudflare URL:

```typescript
export const IQ_OPTION_SERVER_URL = 
  process.env.NODE_ENV === 'production' 
    ? 'https://your-tunnel-url.trycloudflare.com'  // ← ضع URL هنا
    : 'http://localhost:5000';
```

3. احفظ الملف

---

### 🚀 الخطوة 5: نشر على Netlify

```bash
git add .
git commit -m "Switch to Cloudflare Tunnel"
git push
```

Netlify سينشر تلقائياً! ✅

---

## ✅ التحقق

1. افتح موقعك على Netlify
2. تحقق من IQOptionStatus
3. يجب أن ترى **42-46 زوج عملة** ✅

---

## 🔄 للاستخدام اليومي

### تشغيل:
1. `start_local_server.bat`
2. `start_tunnel.bat`
3. انسخ URL الجديد
4. حدّث `serverConfig.ts` إذا تغير

### إيقاف:
- اضغط `Ctrl+C` في كلا الـ terminals

---

## 💡 نصيحة مهمة

**URL يتغير كل مرة!**

لـ URL ثابت:
```bash
cloudflared tunnel login
cloudflared tunnel create my-bot
cloudflared tunnel route dns my-bot bot.yourdomain.com
cloudflared tunnel run my-bot
```

---

## 🆘 مشاكل شائعة

### "cloudflared: command not found"
→ أعد تشغيل Terminal

### "Connection refused"
→ تأكد من تشغيل السيرفر أولاً

### "لا توجد أسعار"
→ تأكد من URL صحيح في serverConfig.ts

---

## 📞 الدعم

راجع `CLOUDFLARE_TUNNEL_SETUP.md` للتفاصيل الكاملة
