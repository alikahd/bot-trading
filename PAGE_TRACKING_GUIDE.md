# 📊 **دليل تتبع الصفحات - Facebook & TikTok Pixels**

## ✅ **تم التطبيق:**

تم إضافة **تتبع تلقائي للصفحات** في Facebook Pixel و TikTok Pixel و Google Analytics!

---

## 🎯 **ما يتم تتبعه الآن:**

### **تلقائياً عند تغيير الصفحة:**

✅ **Facebook Pixel:**
- `PageView` - زيارة الصفحة
- `ViewContent` - مشاهدة محتوى الصفحة (مع اسم الصفحة)

✅ **TikTok Pixel:**
- `page()` - زيارة الصفحة
- `ViewContent` - مشاهدة محتوى الصفحة (مع اسم الصفحة)

✅ **Google Analytics:**
- `page_view` - زيارة الصفحة (مع المسار والعنوان)

---

## 📄 **الصفحات المتتبعة:**

| المسار | اسم الصفحة |
|--------|------------|
| `/` | Homepage |
| `/home` | Home |
| `/about` | About Us |
| `/contact` | Contact |
| `/pricing` | Pricing |
| `/terms` | Terms & Conditions |
| `/privacy` | Privacy Policy |
| `/signals` | Trading Signals |
| `/dashboard` | Dashboard |
| `/profile` | User Profile |
| `/settings` | Settings |

**أي صفحة أخرى** يتم تتبعها تلقائياً!

---

## 🔄 **كيف يعمل التتبع التلقائي:**

### **1. عند تحميل الصفحة الأولى:**
```javascript
// يتم تتبع الصفحة تلقائياً
✅ Facebook: PageView + ViewContent
✅ TikTok: page() + ViewContent
✅ Google Analytics: page_view
```

### **2. عند التنقل بين الصفحات (React Router):**
```javascript
// يراقب تغيير URL ويتتبع تلقائياً
المستخدم ينقر: Home → About
✅ يتم تتبع صفحة About تلقائياً
```

### **3. عند الرجوع/التقدم في المتصفح:**
```javascript
// يتتبع عند استخدام أزرار المتصفح
المستخدم ينقر: Back/Forward
✅ يتم تتبع الصفحة الجديدة
```

---

## 🛠️ **استخدام التتبع اليدوي (اختياري):**

### **في React Components:**

```typescript
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '@/utils/pageTracking';

function App() {
  const location = useLocation();

  useEffect(() => {
    // تتبع يدوي عند تغيير الصفحة
    trackPageView(location.pathname);
  }, [location]);

  return (
    // ... your app
  );
}
```

---

## 📊 **أمثلة التتبع المخصص:**

### **1. تتبع نقرة على زر:**

```typescript
import { trackButtonClick } from '@/utils/pageTracking';

<button onClick={() => {
  trackButtonClick('Start Free Trial', 'homepage');
  // ... باقي الكود
}}>
  Start Free Trial
</button>
```

### **2. تتبع التسجيل:**

```typescript
import { trackRegistration } from '@/utils/pageTracking';

const handleRegister = async (email: string) => {
  try {
    await registerUser(email);
    
    // تتبع التسجيل الناجح
    trackRegistration('email');
  } catch (error) {
    console.error('Registration failed');
  }
};
```

### **3. تتبع الاشتراك:**

```typescript
import { trackSubscription } from '@/utils/pageTracking';

const handleSubscribe = async (plan: string, price: number) => {
  try {
    await subscribeToPlan(plan);
    
    // تتبع الاشتراك
    trackSubscription(plan, price, 'USD');
  } catch (error) {
    console.error('Subscription failed');
  }
};
```

### **4. تتبع مشاهدة إشارة:**

```typescript
import { trackSignalView } from '@/utils/pageTracking';

const handleViewSignal = (signal: Signal) => {
  // تتبع مشاهدة الإشارة
  trackSignalView(signal.type, signal.pair);
  
  // فتح تفاصيل الإشارة
  openSignalDetails(signal);
};
```

### **5. تتبع البحث:**

```typescript
import { trackSearch } from '@/utils/pageTracking';

const handleSearch = (searchTerm: string) => {
  // تتبع البحث
  trackSearch(searchTerm);
  
  // تنفيذ البحث
  performSearch(searchTerm);
};
```

### **6. تتبع بدء تجربة مجانية:**

```typescript
import { trackStartTrial } from '@/utils/pageTracking';

const handleStartTrial = (plan: string) => {
  // تتبع بدء التجربة
  trackStartTrial(plan);
  
  // بدء التجربة
  startFreeTrial(plan);
};
```

---

## 📈 **مشاهدة البيانات:**

### **Facebook Events Manager:**

1. **افتح:** https://business.facebook.com/events_manager
2. **اختر:** Pixels > Your Pixel
3. **اذهب إلى:** Test Events أو Overview
4. **شاهد:**
   - `PageView` - عدد مشاهدات الصفحات
   - `ViewContent` - أي صفحات تم مشاهدتها
   - أحداث مخصصة أخرى

### **TikTok Events:**

1. **افتح:** https://ads.tiktok.com/
2. **اذهب إلى:** Assets > Events > Your Pixel
3. **شاهد:**
   - `page` - زيارات الصفحات
   - `ViewContent` - محتوى الصفحات
   - أحداث مخصصة

### **Google Analytics:**

1. **افتح:** https://analytics.google.com/
2. **اذهب إلى:** Reports > Engagement > Pages and screens
3. **شاهد:**
   - أكثر الصفحات زيارة
   - مدة البقاء في كل صفحة
   - معدل الارتداد

---

## 🎯 **الأحداث المتاحة:**

### **أحداث Facebook Pixel:**

```typescript
// أحداث قياسية
trackFacebookEvent('PageView');
trackFacebookEvent('ViewContent', { content_name: 'About Page' });
trackFacebookEvent('CompleteRegistration', { method: 'email' });
trackFacebookEvent('Subscribe', { value: 29.99, currency: 'USD' });
trackFacebookEvent('StartTrial', { plan_name: 'Pro' });
trackFacebookEvent('AddToWishlist', { content_name: 'Pro Plan' });
trackFacebookEvent('Search', { search_string: 'BTC signals' });
trackFacebookEvent('Contact', { method: 'form' });
```

### **أحداث TikTok Pixel:**

```typescript
// أحداث قياسية
trackTikTokEvent('ViewContent', { content_name: 'Signals Page' });
trackTikTokEvent('CompleteRegistration', { method: 'email' });
trackTikTokEvent('Subscribe', { value: 29.99, currency: 'USD' });
trackTikTokEvent('StartTrial', { plan_name: 'Pro' });
trackTikTokEvent('AddToWishlist', { content_name: 'Pro Plan' });
trackTikTokEvent('Search', { search_string: 'forex signals' });
trackTikTokEvent('Contact', { method: 'whatsapp' });
```

---

## 🔍 **اختبار التتبع:**

### **1. في Console المتصفح:**

```javascript
// افتح Console (F12)
// انتقل بين الصفحات وشاهد:
📊 Page tracked: Home (/home)
📘 Facebook Event: PageView
🎵 TikTok Event: ViewContent
📊 GA Event: page_view
```

### **2. في Facebook Pixel Helper:**

1. **حمّل Extension:** Facebook Pixel Helper
2. **افتح موقعك**
3. **انتقل بين الصفحات**
4. **شاهد:** عدد الأحداث يزيد مع كل صفحة

### **3. في TikTok Pixel Helper:**

1. **حمّل Extension:** TikTok Pixel Helper
2. **افتح موقعك**
3. **انتقل بين الصفحات**
4. **شاهد:** الأحداث تُرسل بنجاح

---

## 📊 **البيانات المُرسلة:**

### **مثال: زيارة صفحة About:**

```javascript
// Facebook Pixel
{
  event: 'PageView',
  timestamp: 1699999999
}
{
  event: 'ViewContent',
  content_name: 'About Us',
  content_category: 'page',
  page_path: '/about'
}

// TikTok Pixel
{
  event: 'page',
  timestamp: 1699999999
}
{
  event: 'ViewContent',
  content_name: 'About Us',
  content_category: 'page',
  page_path: '/about'
}

// Google Analytics
{
  event: 'page_view',
  page_path: '/about',
  page_title: 'About Us - BooTrading',
  page_location: 'https://www.bootrading.com/about'
}
```

---

## 🎨 **إضافة صفحات جديدة:**

### **في `index.html` (السطر 259-272):**

```javascript
const pageNames = {
  '/': 'Homepage',
  '/home': 'Home',
  '/about': 'About',
  '/contact': 'Contact',
  '/pricing': 'Pricing',
  '/terms': 'Terms',
  '/privacy': 'Privacy',
  '/signals': 'Signals',
  '/dashboard': 'Dashboard',
  '/profile': 'Profile',
  '/settings': 'Settings',
  
  // أضف صفحاتك الجديدة هنا:
  '/your-page': 'Your Page Name',
  '/another-page': 'Another Page',
};
```

### **في `pageTracking.ts` (السطر 42-58):**

```typescript
const pageNames: Record<string, string> = {
  // ... الصفحات الموجودة
  
  // أضف صفحاتك الجديدة:
  '/your-page': 'Your Page Name',
  '/another-page': 'Another Page',
};
```

---

## ✅ **الخلاصة:**

### **ما تم تطبيقه:**

✅ **تتبع تلقائي** لجميع الصفحات  
✅ **Facebook Pixel** - PageView + ViewContent  
✅ **TikTok Pixel** - page + ViewContent  
✅ **Google Analytics** - page_view  
✅ **دوال جاهزة** للأحداث المخصصة  
✅ **يعمل مع React Router** تلقائياً  

### **الفوائد:**

📊 **تتبع شامل** لحركة الزوار  
🎯 **Retargeting** دقيق للزوار  
📈 **تحليل السلوك** لتحسين الموقع  
💰 **قياس التحويلات** بدقة  
🔄 **تحسين الإعلانات** تلقائياً  

---

## 📁 **الملفات المحدثة:**

✅ `index.html` - تتبع تلقائي للصفحات  
✅ `src/utils/pageTracking.ts` - دوال التتبع  
✅ `PAGE_TRACKING_GUIDE.md` - هذا الدليل  

---

**🎯 الآن جميع صفحاتك يتم تتبعها تلقائياً في Facebook و TikTok و Google Analytics!** 📊🚀

**Deploy الآن وشاهد البيانات في Events Manager!**
