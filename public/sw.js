/**
 * 🔔 Service Worker للتنبيهات و Badge API
 * Version: 2.1.4
 */

const CACHE_NAME = 'bootrading-v2.1.4';
const APP_VERSION = '2.1.4';

// تثبيت Service Worker
self.addEventListener('install', (event) => {
  console.log(`✅ Service Worker installed - Version ${APP_VERSION}`);
  self.skipWaiting();
});

// تفعيل Service Worker
self.addEventListener('activate', (event) => {
  console.log(`✅ Service Worker activated - Version ${APP_VERSION}`);
  
  // حذف الـ cache القديم
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => {
            console.log(`🗑️ حذف cache قديم: ${cacheName}`);
            return caches.delete(cacheName);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// استقبال الرسائل من التطبيق
self.addEventListener('message', (event) => {
  console.log('📨 Service Worker: استلام رسالة', event.data);
  
  if (event.data && event.data.type === 'UPDATE_BADGE') {
    const count = event.data.count || 0;
    console.log('🔔 Service Worker: طلب تحديث Badge إلى', count);
    
    // تحديث Badge
    if ('setAppBadge' in self.navigator) {
      if (count > 0) {
        self.navigator.setAppBadge(count)
          .then(() => {
            console.log('✅ Service Worker: تم تحديث Badge بنجاح إلى', count);
          })
          .catch(err => {
            console.error('❌ Service Worker: فشل تحديث Badge:', err);
          });
      } else {
        self.navigator.clearAppBadge()
          .then(() => {
            console.log('✅ Service Worker: تم مسح Badge بنجاح');
          })
          .catch(err => {
            console.error('❌ Service Worker: فشل مسح Badge:', err);
          });
      }
    } else {
      console.warn('⚠️ Service Worker: Badge API غير مدعوم');
    }
  }
});

// ✅ تم إزالة fetch handler الفارغ لتجنب تحذير no-op
// إذا احتجنا للتخزين المؤقت لاحقاً، سنضيفه هنا
