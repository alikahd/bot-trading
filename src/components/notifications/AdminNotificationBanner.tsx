/**
 * 🔔 بانر عرض التنبيهات الإدارية
 * يظهر آخر تنبيه إداري في أعلى الصفحة
 */

import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Info, AlertTriangle, CheckCircle, Megaphone, ChevronDown, ChevronUp } from 'lucide-react';
import { createPortal } from 'react-dom';
import { userNotificationService } from '../../services/userNotificationService';
import { Notification } from '../../services/adminNotificationService';
import { useLanguage } from '../../contexts/LanguageContext';

// دالة مساعدة لدمج الكلاسات
const cn = (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' ');

export const AdminNotificationBanner: React.FC = () => {
  const { language } = useLanguage();
  const [latestNotification, setLatestNotification] = useState<Notification | null>(null);
  const [dismissed, setDismissed] = useState<string | null>(null);
  const [imageModal, setImageModal] = useState<{ show: boolean; url: string | null }>({ show: false, url: null });
  const [showImage, setShowImage] = useState(false);

  // جلب آخر تنبيه غير مقروء
  const loadLatestNotification = async () => {
    const result = await userNotificationService.getUserNotifications({ 
      is_read: false,
      limit: 1 
    });
    
    if (result.success && result.notifications && result.notifications.length > 0) {
      const notification = result.notifications[0];
      // عرض فقط إذا لم يتم إخفاؤه
      if (notification.id !== dismissed) {
        setLatestNotification(notification);
      }
    } else {
      setLatestNotification(null);
    }
  };

  useEffect(() => {
    loadLatestNotification();

    // الاشتراك في التنبيهات الجديدة
    let unsubscribe: (() => void) | null = null;
    
    userNotificationService.subscribeToNotifications((notification) => {
      console.log('🔔 تنبيه جديد في البانر - عرض فوري!', notification);
      // عرض التنبيه فوراً
      setLatestNotification(notification);
      setDismissed(null); // إعادة تعيين الإخفاء للتنبيه الجديد
    }).then(unsub => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [dismissed]);

  // إخفاء التنبيه
  const handleDismiss = async () => {
    if (latestNotification) {
      setDismissed(latestNotification.id);
      setLatestNotification(null);
      // تحديد كمقروء
      await userNotificationService.markAsRead(latestNotification.id);
    }
  };

  // الحصول على الأيقونة حسب النوع
  const getIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />;
      case 'announcement':
        return <Megaphone className="w-4 h-4 sm:w-5 sm:h-5" />;
      case 'referral_welcome':
      case 'referral_reminder':
        return <Megaphone className="w-4 h-4 sm:w-5 sm:h-5" />;
      case 'payment':
      case 'subscription':
        return <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />;
      default:
        return <Info className="w-4 h-4 sm:w-5 sm:h-5" />;
    }
  };

  // الحصول على الألوان حسب النوع
  const getColors = (type: string) => {
    switch (type) {
      case 'error':
        return {
          bgColor: 'bg-red-500/10 border-red-500/30',
          textColor: 'text-red-400'
        };
      case 'warning':
        return {
          bgColor: 'bg-yellow-500/10 border-yellow-500/30',
          textColor: 'text-yellow-400'
        };
      case 'success':
        return {
          bgColor: 'bg-green-500/10 border-green-500/30',
          textColor: 'text-green-400'
        };
      case 'announcement':
        return {
          bgColor: 'bg-purple-500/10 border-purple-500/30',
          textColor: 'text-purple-400'
        };
      case 'referral_welcome':
      case 'referral_reminder':
        return {
          bgColor: 'bg-indigo-500/10 border-indigo-500/30',
          textColor: 'text-indigo-400'
        };
      case 'payment':
      case 'subscription':
        return {
          bgColor: 'bg-green-500/10 border-green-500/30',
          textColor: 'text-green-400'
        };
      default:
        return {
          bgColor: 'bg-blue-500/10 border-blue-500/30',
          textColor: 'text-blue-400'
        };
    }
  };

  // الحصول على النص حسب اللغة
  const getText = (notification: Notification, field: 'title' | 'message') => {
    if (language === 'ar') {
      return notification[`${field}_ar`] || notification[field];
    } else if (language === 'fr') {
      return notification[`${field}_fr`] || notification[field];
    }
    return notification[field];
  };

  if (!latestNotification) return null;

  const colors = getColors(latestNotification.type);

  return latestNotification ? (
    <>
      <div className={cn(
        "mb-2 sm:mb-3 rounded-lg border overflow-hidden animate-in slide-in-from-top-2 duration-300",
        colors.bgColor
      )}>
        {/* البانر الرئيسي */}
        <div className="px-2 sm:px-4 py-1.5 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-3">
          {/* الأيقونة والرسالة */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className={cn("flex-shrink-0", colors.textColor)}>
              {getIcon(latestNotification.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className={cn("text-xs sm:text-sm font-medium mb-1", colors.textColor)}>
                {getText(latestNotification, 'title')}
              </p>
              {/* نص متحرك للرسالة - حلقة من اليمين لليسار */}
              <div className="overflow-hidden relative text-right">
                <span className="text-[10px] sm:text-xs text-gray-400 whitespace-nowrap animate-marquee-infinite inline-block">
                  {getText(latestNotification, 'message')}
                </span>
              </div>
            </div>
          </div>
          
          {/* الأزرار */}
          <div className="flex items-center gap-1 sm:gap-2">
            {latestNotification.image_url && (
              <button
                onClick={() => setShowImage(!showImage)}
                className="flex-shrink-0 p-1 hover:bg-gray-700/50 rounded transition-colors"
                title={language === 'ar' ? (showImage ? 'إخفاء الصورة' : 'عرض الصورة') : (showImage ? 'Hide Image' : 'Show Image')}
              >
                {showImage ? (
                  <ChevronUp className="w-4 h-4 text-gray-400 hover:text-white" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400 hover:text-white" />
                )}
              </button>
            )}
            
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-1 hover:bg-gray-700/50 rounded transition-colors"
              title={language === 'ar' ? 'إخفاء' : 'Dismiss'}
            >
              <X className="w-4 h-4 text-gray-400 hover:text-white" />
            </button>
          </div>
        </div>
        
        {/* الصورة المنسدلة */}
        {showImage && latestNotification.image_url && (
          <div className="px-2 sm:px-4 pb-2 sm:pb-3 pt-0 animate-in slide-in-from-top-1 duration-200">
            <img 
              src={latestNotification.image_url} 
              alt="notification" 
              className="w-full max-h-48 sm:max-h-64 object-contain rounded cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setImageModal({ show: true, url: latestNotification.image_url || null })}
              onError={(e) => { 
                console.error('❌ فشل تحميل الصورة في البانر:', latestNotification.image_url);
                (e.target as HTMLImageElement).style.display = 'none'; 
              }}
            />
          </div>
        )}
      </div>

      {/* Modal عرض الصورة */}
      {imageModal.show && imageModal.url && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setImageModal({ show: false, url: null })}
        >
          <img 
            src={imageModal.url} 
            alt="notification" 
            className="max-w-full max-h-full object-contain cursor-pointer"
            onClick={() => setImageModal({ show: false, url: null })}
            onError={() => { 
              console.error('❌ فشل تحميل الصورة:', imageModal.url);
              setImageModal({ show: false, url: null });
              alert(language === 'ar' ? 'فشل تحميل الصورة' : 'Failed to load image');
            }}
          />
        </div>,
        document.body
      )}
    </>
  ) : null;
};
