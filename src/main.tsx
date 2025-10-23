import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppWithRouter } from './AppWithRouter.tsx';
import './index.css';
import './styles/paypal-custom.css';

// تحميل React فوراً
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppWithRouter />
  </StrictMode>
);

// إخفاء جميع console.log في الإنتاج
if (import.meta.env.PROD) {
  console.log = () => {};
  console.warn = () => {};
  console.info = () => {};
}

// تسجيل Service Worker للـ PWA - بشكل غير متزامن
if ('serviceWorker' in navigator) {
  // تأجيل التسجيل لعدم تأخير التحميل
  setTimeout(() => {
    navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    }).then(registration => {
      // Service Worker registered successfully
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New update available
            }
          });
        }
      });
    }).catch(() => {
      // Service Worker registration failed
    });
  }, 2000); // تأجيل لمدة 2 ثانية
}

// نظام PWA محسن مع دعم شامل
let deferredPrompt: any = null;
let isInstallable = false;
let installabilityCheckInterval: any = null;

// فحص دوري لإمكانية التثبيت
const checkPWAInstallability = () => {
  const hasServiceWorker = 'serviceWorker' in navigator;
  const hasManifest = document.querySelector('link[rel="manifest"]');
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isInWebAppiOS = (window.navigator as any).standalone === true;
  const isInstalled = isStandalone || isInWebAppiOS;
  
  // إذا لم يكن مثبتاً ولديه المتطلبات الأساسية
  if (!isInstalled && hasServiceWorker && hasManifest) {
    // فحص إضافي للمتصفحات التي تدعم PWA
    const userAgent = navigator.userAgent.toLowerCase();
    const supportsPWA = userAgent.includes('chrome') || 
                       userAgent.includes('firefox') || 
                       userAgent.includes('safari') || 
                       userAgent.includes('edge');
    
    if (supportsPWA && !isInstallable) {
      isInstallable = true;
      // إشعار المكونات حتى لو لم يكن beforeinstallprompt متاح
      window.dispatchEvent(new CustomEvent('pwa-installable', { detail: { installable: true } }));
    }
  }
  
  return {
    hasServiceWorker,
    hasManifest,
    isInstalled,
    isInstallable: isInstallable || (!isInstalled && hasServiceWorker && hasManifest),
    hasDeferredPrompt: !!deferredPrompt
  };
};

// إضافة مستمع لحدث beforeinstallprompt
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  isInstallable = true;
  window.dispatchEvent(new CustomEvent('pwa-installable', { detail: { installable: true, prompt: e } }));
  
  // إيقاف الفحص الدوري لأن الحدث متاح الآن
  if (installabilityCheckInterval) {
    clearInterval(installabilityCheckInterval);
    installabilityCheckInterval = null;
  }
});

// بدء الفحص الدوري بعد تحميل الصفحة - مؤجل
setTimeout(() => {
  checkPWAInstallability();
  
  // فحص دوري كل 5 ثوانِ لمدة 30 ثانية
  let checkCount = 0;
  installabilityCheckInterval = setInterval(() => {
    checkCount++;
    checkPWAInstallability();
    
    if (checkCount >= 6 || deferredPrompt) {
      clearInterval(installabilityCheckInterval);
      installabilityCheckInterval = null;
    }
  }, 5000);
}, 3000); // تأجيل لمدة 3 ثوان

// مستمع لحدث التثبيت الناجح
window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  isInstallable = false;
  
  // إشعار المكونات بنجاح التثبيت
  window.dispatchEvent(new CustomEvent('pwa-installed'));
});

// دالة تثبيت التطبيق المحسنة
window.installApp = async () => {
  // Install app function
  
  // فحص حالة التثبيت أولاً
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isInWebAppiOS = (window.navigator as any).standalone === true;
  
  if (isStandalone || isInWebAppiOS) {
    // App already installed
    alert('التطبيق مثبت بالفعل!');
    return;
  }
  
  // إذا كان deferredPrompt متاح، استخدمه
  if (deferredPrompt) {
    try {
      // Show install prompt
      // إظهار نافذة التثبيت
      await deferredPrompt.prompt();
      
      // انتظار اختيار المستخدم
      const { outcome } = await deferredPrompt.userChoice;
      
      // معالجة اختيار المستخدم
      if (outcome === 'accepted') {
        // User accepted - app will be installed
        window.dispatchEvent(new CustomEvent('pwa-installed'));
      }
      
      // مسح المتغير
      deferredPrompt = null;
      isInstallable = false;
      return;
    } catch (error) {
      // Installation error
      // المتابعة للإرشادات اليدوية
    }
  }
  
  // إذا لم يكن deferredPrompt متاح أو فشل، عرض إرشادات يدوية
  // Manual installation
  
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent);
  
  // للهواتف: محاولة التثبيت التلقائي أولاً
  if (isMobile) {
    // Mobile device
    
    try {
      // للأندرويد مع Chrome: محاولة إظهار نافذة التثبيت التلقائية
      if (userAgent.includes('android') && userAgent.includes('chrome')) {
        // Android Chrome
        
        // محاولة إنشاء حدث beforeinstallprompt مصطنع
        const installEvent = new Event('beforeinstallprompt');
        window.dispatchEvent(installEvent);
        
        // إشعار مبسط للمستخدم
        const shouldInstall = confirm('هل تريد تثبيت التطبيق على هاتفك؟\n\nسيتم إضافته إلى الشاشة الرئيسية للوصول السريع.');
        
        if (shouldInstall) {
          // محاولة فتح نافذة التثبيت
          if (navigator.share) {
            // استخدام Web Share API إذا كان متاحاً
            try {
              await navigator.share({
                title: 'تطبيق التداول الذكي',
                text: 'تطبيق تداول العملات المشفرة والفوركس',
                url: window.location.href
              });
            } catch (shareError) {
              // Share cancelled
            }
          } else {
            // إرشادات مبسطة
            alert('لإكمال التثبيت:\n1. انقر على الثلاث نقاط (⋮) في المتصفح\n2. اختر "إضافة إلى الشاشة الرئيسية"');
          }
        }
        return;
      }
      
      // لـ iOS: إرشادات مبسطة وتلقائية
      if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
        // iOS device
        
        const shouldInstall = confirm('هل تريد تثبيت التطبيق على جهازك؟\n\nسيتم إضافته إلى الشاشة الرئيسية للوصول السريع.');
        
        if (shouldInstall) {
          alert('لإكمال التثبيت:\n\n1. انقر على زر المشاركة (⬆️) في أسفل الشاشة\n2. اختر "إضافة إلى الشاشة الرئيسية"\n3. انقر "إضافة"');
        }
        return;
      }
      
      // للهواتف الأخرى: إرشادات عامة
      const shouldInstall = confirm('هل تريد تثبيت التطبيق على هاتفك؟');
      if (shouldInstall) {
        alert('لتثبيت التطبيق:\nابحث في قائمة المتصفح عن "إضافة إلى الشاشة الرئيسية" أو "Add to Home Screen"');
      }
      return;
      
    } catch (error) {
      // Mobile install error
      // المتابعة للإرشادات العادية
    }
  }
  
  let instructions = '';
  let title = 'تثبيت التطبيق';
  
  if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
    title = `تثبيت التطبيق في Chrome${isMobile ? ' (الهاتف)' : ' (الكمبيوتر)'}`;
    instructions = isMobile ? 
      `لتثبيت التطبيق في Chrome على الهاتف:

1. انقر على الثلاث نقاط (⋮) في أعلى يمين المتصفح
2. ابحث عن "إضافة إلى الشاشة الرئيسية" أو "Add to Home Screen"
3. انقر عليه واتبع التعليمات

سيظهر التطبيق على الشاشة الرئيسية لهاتفك` :
      `لتثبيت التطبيق في Chrome على الكمبيوتر:

الطريقة الأولى (الأسهل):
1. ابحث عن أيقونة التثبيت (⬇️) في شريط العنوان (يمين الـ URL)
2. انقر عليها واختر "تثبيت"

الطريقة الثانية:
1. انقر على الثلاث نقاط (⋮) في أعلى يمين المتصفح
2. ابحث عن "تثبيت التطبيق" أو "Install App"
3. انقر عليه واتبع التعليمات

بعد التثبيت:
- سيظهر التطبيق في قائمة ابدأ
- يمكن تشغيله كتطبيق منفصل عن المتصفح`;
  } else if (userAgent.includes('firefox')) {
    title = `تثبيت التطبيق في Firefox${isMobile ? ' (الهاتف)' : ' (الكمبيوتر)'}`;
    instructions = isMobile ?
      `لتثبيت التطبيق في Firefox على الهاتف:

1. انقر على الثلاث خطوط (☰) في أسفل الشاشة
2. ابحث عن "إضافة إلى الشاشة الرئيسية" أو "Add to Home Screen"
3. انقر عليه واتبع التعليمات

سيظهر التطبيق على الشاشة الرئيسية لهاتفك` :
      `لتثبيت التطبيق في Firefox على الكمبيوتر:

⚠️ ملاحظة: Firefox على الكمبيوتر لا يدعم تثبيت PWA بشكل كامل حالياً.

البدائل المتاحة:
1. إضافة إشارة مرجعية:
   - اضغط Ctrl+D لحفظ الصفحة في المفضلة
   - اختر "شريط الإشارات المرجعية" للوصول السريع

2. إنشاء اختصار على سطح المكتب:
   - انقر بزر الماوس الأيمن على الصفحة
   - اختر "إنشاء اختصار" أو "Create Shortcut"

3. استخدم Chrome أو Edge للحصول على تجربة PWA كاملة`;
  } else if (userAgent.includes('safari')) {
    title = 'إضافة التطبيق في Safari';
    instructions = `لإضافة التطبيق في Safari:

1. انقر على زر المشاركة (⬆️) في أسفل الشاشة
2. اختر "إضافة إلى الشاشة الرئيسية"
3. اكتب اسم التطبيق واضغط "إضافة"

سيظهر التطبيق على الشاشة الرئيسية لهاتفك`;
  } else if (userAgent.includes('edg')) {
    title = 'تثبيت التطبيق في Microsoft Edge';
    instructions = `لتثبيت التطبيق في Edge على الكمبيوتر:

الطريقة الأولى (الأسهل):
1. ابحث عن أيقونة التثبيت (⬇️) في شريط العنوان
2. انقر عليها واختر "تثبيت"

الطريقة الثانية:
1. انقر على الثلاث نقاط (...) في أعلى يمين المتصفح
2. اختر "التطبيقات" أو "Apps"
3. انقر على "تثبيت هذا الموقع كتطبيق"
4. اتبع التعليمات لإكمال التثبيت

بعد التثبيت:
- سيظهر التطبيق في قائمة ابدأ
- يمكن تشغيله كتطبيق منفصل عن المتصفح`;
  } else {
    title = 'تثبيت التطبيق';
    instructions = `لتثبيت التطبيق:

ابحث في قائمة المتصفح عن أحد هذه الخيارات:
• "تثبيت التطبيق" أو "Install App"
• "إضافة إلى الشاشة الرئيسية"
• "Add to Home Screen"
• أيقونة التثبيت في شريط العنوان

إذا لم تجد هذه الخيارات، فقد لا يدعم متصفحك تثبيت التطبيقات.`;
  }
  
  // عرض النافذة المنبثقة مع الإرشادات
  if (confirm(`${title}\n\n${instructions}\n\nهل تريد المتابعة؟`)) {
    // User confirmed
  } else {
    // User cancelled
  }
};

// دالة للتحقق من حالة التثبيت
window.checkInstallStatus = () => {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isInWebAppiOS = (window.navigator as any).standalone === true;
  const isInstalled = isStandalone || isInWebAppiOS;
  
  // Check install status
  
  return {
    isInstalled,
    isInstallable,
    hasPrompt: !!deferredPrompt
  };
};

// التحقق من حالة التثبيت
window.addEventListener('appinstalled', () => {
  // App installed
  // يمكن إضافة إحصائيات أو إشعارات هنا
});
