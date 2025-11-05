/**
 * 🔔 Hook لإدارة Badge API - عرض عدد التنبيهات على أيقونة التطبيق
 */

import { useEffect, useRef } from 'react';

export const useBadgeNotification = (unreadCount: number) => {
  const serviceWorkerRef = useRef<ServiceWorker | null>(null);

  useEffect(() => {
    // تسجيل Service Worker (Badge API لا يحتاج إذن الإشعارات)
    const setupServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/'
          });
          
          console.log('✅ Service Worker registered:', registration);
          
          // الحصول على Service Worker النشط
          serviceWorkerRef.current = registration.active || registration.installing || registration.waiting;
          
          // الاستماع لتحديثات Service Worker
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'activated') {
                  serviceWorkerRef.current = newWorker;
                }
              });
            }
          });
        } catch (error) {
          console.error('❌ فشل تسجيل Service Worker:', error);
        }
      }
    };

    setupServiceWorker();
  }, []);

  useEffect(() => {
    // تحديث Badge عند تغيير عدد التنبيهات
    const updateBadge = async () => {
      console.log('🔔 محاولة تحديث Badge - العدد:', unreadCount);
      
      try {
        // طريقة 1: استخدام Badge API مباشرة
        if ('setAppBadge' in navigator) {
          if (unreadCount > 0) {
            await (navigator as any).setAppBadge(unreadCount);
            console.log('✅ Badge API: تم تحديث Badge إلى', unreadCount);
          } else {
            await (navigator as any).clearAppBadge();
            console.log('✅ Badge API: تم مسح Badge');
          }
        } else {
          console.warn('⚠️ Badge API غير مدعوم على هذا المتصفح');
        }
        
        // طريقة 2: إرسال رسالة للـ Service Worker
        if (serviceWorkerRef.current && serviceWorkerRef.current.state === 'activated') {
          serviceWorkerRef.current.postMessage({
            type: 'UPDATE_BADGE',
            count: unreadCount
          });
          console.log('✅ Service Worker: تم إرسال رسالة تحديث Badge');
        } else if (!serviceWorkerRef.current) {
          console.warn('⚠️ Service Worker غير متاح');
        } else {
          console.warn('⚠️ Service Worker في حالة:', serviceWorkerRef.current.state);
        }
        
        // طريقة 3: استخدام Service Worker Registration مباشرة
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          if (registration.active) {
            registration.active.postMessage({
              type: 'UPDATE_BADGE',
              count: unreadCount
            });
            console.log('✅ Service Worker Registration: تم إرسال رسالة تحديث Badge');
          }
        }
      } catch (error) {
        console.error('❌ فشل تحديث Badge:', error);
      }
    };

    updateBadge();
  }, [unreadCount]);

  // تنظيف Badge عند إلغاء التثبيت
  useEffect(() => {
    return () => {
      if ('clearAppBadge' in navigator) {
        (navigator as any).clearAppBadge().catch(() => {});
      }
    };
  }, []);
};
