# 🌐 دليل إعداد Proxy لتجاوز حظر Railway/Render

## 🎯 المشكلة:
عندما تنشر مشروعك على **Railway** أو **Render**، يتم استخدام عنوان IP تابع لهم.
**IQ Option** يضع قيود أو يحظر طلبات من هذه الخدمات، فيتم قطع الاتصال بعد عدد محدود من الطلبات.

## ✅ الحل: استخدام Proxy Server

### **كيف يعمل:**
```
Your App (Railway/Render) → Proxy Server → IQ Option
```
بدلاً من:
```
Your App (Railway/Render) → IQ Option ❌ (محظور)
```

---

## 🔧 إعداد Proxy في المشروع:

### **1. تفعيل Proxy:**
```bash
# في Railway/Render، أضف متغير البيئة:
USE_PROXY=true
```

### **2. إضافة Proxy Servers:**
عدّل الملف `iqoption_unofficial_server.py`:

```python
PROXY_LIST = [
    # مثال proxy مجاني
    {'http': 'http://proxy1.example.com:8080', 'https': 'https://proxy1.example.com:8080'},
    {'http': 'http://proxy2.example.com:3128', 'https': 'https://proxy2.example.com:3128'},
    
    # مثال proxy مع authentication
    {'http': 'http://username:password@proxy3.com:8080', 'https': 'https://username:password@proxy3.com:8080'},
]
```

---

## 🆓 مصادر Proxy مجانية:

### **1. Free Proxy List:**
- **الموقع**: https://free-proxy-list.net/
- **المميزات**: مجاني، يتم تحديثه باستمرار
- **العيوب**: قد يكون بطيء أو غير مستقر

### **2. ProxyList Plus:**
- **الموقع**: https://list.proxylistplus.com/
- **المميزات**: قوائم محدثة يومياً

### **3. Spys.one:**
- **الموقع**: http://spys.one/en/free-proxy-list/
- **المميزات**: proxy عالي الجودة

---

## 💰 خدمات Proxy مدفوعة (موصى بها):

### **1. Bright Data (Luminati):**
- **السعر**: $500+/شهر
- **المميزات**: عالي الجودة، IP residential
- **الموقع**: https://brightdata.com/

### **2. Smartproxy:**
- **السعر**: $75+/شهر  
- **المميزات**: سريع ومستقر
- **الموقع**: https://smartproxy.com/

### **3. ProxyMesh:**
- **السعر**: $10+/شهر
- **المميزات**: رخيص ومناسب للمشاريع الصغيرة
- **الموقع**: https://proxymesh.com/

### **4. Oxylabs:**
- **السعر**: $300+/شهر
- **المميزات**: proxy عالي الجودة للشركات
- **الموقع**: https://oxylabs.io/

---

## 🛠️ إعداد Proxy مجاني (خطوة بخطوة):

### **الخطوة 1: الحصول على Proxy مجاني**
1. اذهب إلى https://free-proxy-list.net/
2. ابحث عن proxy يدعم **HTTPS** و **Google**
3. انسخ **IP Address** و **Port**

### **الخطوة 2: اختبار Proxy**
```bash
# اختبار proxy باستخدام curl
curl -x http://PROXY_IP:PORT https://httpbin.org/ip
```

### **الخطوة 3: إضافة Proxy للمشروع**
```python
PROXY_LIST = [
    {'http': 'http://185.199.229.156:7492', 'https': 'https://185.199.229.156:7492'},
    {'http': 'http://185.199.228.220:7300', 'https': 'https://185.199.228.220:7300'},
    {'http': 'http://185.199.231.45:8382', 'https': 'https://185.199.231.45:8382'},
]
```

---

## 🚀 النشر على Railway مع Proxy:

### **1. إعداد متغيرات البيئة:**
```bash
USE_PROXY=true
```

### **2. رفع الكود المحدث:**
```bash
git add .
git commit -m "Add proxy support for IQ Option"
git push
```

### **3. مراقبة اللوجز:**
```
✅ Proxy يعمل - IP: 185.199.229.156
🔄 استخدام Proxy: {'http': 'http://185.199.229.156:7492'}
🌐 الاتصال عبر Proxy لتجاوز حظر Railway/Render
✅ تم الاتصال بـ IQ Option بنجاح!
🎯 نجح تجاوز حظر Railway/Render باستخدام Proxy
```

---

## 🚀 النشر على Render مع Proxy:

### **1. إعداد Environment Variables:**
في لوحة تحكم Render:
```
USE_PROXY = true
```

### **2. Deploy:**
سيتم إعادة النشر تلقائياً مع الإعدادات الجديدة.

---

## 🔍 استكشاف الأخطاء:

### **مشكلة: Proxy لا يعمل**
```
⚠️ Proxy لا يعمل: HTTPSConnectionPool(host='proxy1.com', port=8080)
```
**الحل:**
- جرب proxy آخر من القائمة
- تأكد من أن Proxy يدعم HTTPS
- اختبر Proxy محلياً أولاً

### **مشكلة: Proxy بطيء**
```
⚠️ فشل تطبيق Proxy: timeout
```
**الحل:**
- استخدم proxy مدفوع للسرعة
- زيادة timeout في الكود
- استخدم proxy أقرب جغرافياً

### **مشكلة: IQ Option يحظر Proxy**
```
🔄 قد يكون Proxy محظور أيضاً - جرب proxy آخر
```
**الحل:**
- استخدم residential proxy بدلاً من datacenter proxy
- غيّر Proxy بانتظام (rotation)
- استخدم proxy مدفوع عالي الجودة

---

## 📊 مراقبة الأداء:

### **مع Proxy:**
```
INFO:__main__:🌐 الاتصال عبر Proxy لتجاوز حظر Railway/Render
INFO:__main__:✅ تم الاتصال بـ IQ Option بنجاح!
INFO:__main__:🎯 نجح تجاوز حظر Railway/Render باستخدام Proxy
INFO:__main__:✅ تم تحديث 42 سعر من IQ Option
```

### **بدون Proxy (محظور):**
```
ERROR:iqoptionapi.ws.client:[Errno 11001] getaddrinfo failed
WARNING:__main__:🚫 يبدو أن Railway/Render يحظر الاتصال بـ IQ Option
INFO:__main__:💡 نصيحة: فعّل USE_PROXY=true وأضف proxy servers
INFO:__main__:📊 التبديل للوضع التجريبي
```

---

## 🎯 أفضل الممارسات:

### **1. استخدم عدة Proxy:**
```python
PROXY_LIST = [
    {'http': 'http://proxy1.com:8080', 'https': 'https://proxy1.com:8080'},
    {'http': 'http://proxy2.com:8080', 'https': 'https://proxy2.com:8080'},
    {'http': 'http://proxy3.com:8080', 'https': 'https://proxy3.com:8080'},
]
```

### **2. Proxy Rotation:**
الكود يدور تلقائياً بين Proxy servers للتنويع.

### **3. Fallback للوضع التجريبي:**
إذا فشلت جميع Proxy servers، يتبدل تلقائياً للوضع التجريبي.

### **4. مراقبة مستمرة:**
راقب اللوجز للتأكد من عمل Proxy بشكل صحيح.

---

## 💡 نصائح متقدمة:

### **1. استخدام Proxy Pool:**
```python
# يمكن إضافة المزيد من proxy servers
PROXY_LIST = [
    # US proxies
    {'http': 'http://us-proxy1.com:8080', 'https': 'https://us-proxy1.com:8080'},
    # EU proxies  
    {'http': 'http://eu-proxy1.com:8080', 'https': 'https://eu-proxy1.com:8080'},
    # Asia proxies
    {'http': 'http://asia-proxy1.com:8080', 'https': 'https://asia-proxy1.com:8080'},
]
```

### **2. Proxy مع Authentication:**
```python
PROXY_LIST = [
    {'http': 'http://username:password@proxy.com:8080', 'https': 'https://username:password@proxy.com:8080'},
]
```

### **3. تحديث Proxy تلقائياً:**
يمكن إضافة كود لجلب proxy جديدة من APIs مجانية.

---

## 🎉 النتيجة النهائية:

مع إعداد Proxy بشكل صحيح:
- ✅ **يعمل على Railway/Render** بدون حظر
- ✅ **أسعار حقيقية** من IQ Option  
- ✅ **تحديث فوري** كل 200ms
- ✅ **استقرار عالي** مع fallback تلقائي
- ✅ **سهولة الصيانة** مع rotation تلقائي

**الآن يمكنك نشر البوت على أي منصة سحابية بدون قلق من الحظر!** 🚀
