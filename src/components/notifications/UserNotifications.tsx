/**
 * 🔔 مكون عرض التنبيهات للمستخدم
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Bell, X, Check, AlertCircle, Info, AlertTriangle, CheckCircle, Megaphone, Trash2, CheckSquare, Square } from 'lucide-react';
import { userNotificationService } from '../../services/userNotificationService';
import { Notification } from '../../services/adminNotificationService';
import { useLanguage } from '../../contexts/LanguageContext';
import { useBadgeNotification } from '../../hooks/useBadgeNotification';
import { Users as UsersIcon, DollarSign, TrendingUp, Calendar } from 'lucide-react';

export interface AdminNotificationsSummary {
  newUsers: number;
  pendingPayments: number;
  pendingCommissions: number;
  expiringSoon: number;
}

interface UserNotificationsProps {
  adminNotificationsCount?: number; // عدد الإشعارات للأدمن
  adminNotificationsSummary?: AdminNotificationsSummary; // تفاصيل الإشعارات للأدمن
  isAdmin?: boolean; // هل المستخدم أدمن
}

export const UserNotifications: React.FC<UserNotificationsProps> = ({ 
  adminNotificationsCount,
  adminNotificationsSummary,
  isAdmin = false
}) => {
  const { language, dir } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [imageModal, setImageModal] = useState<{ show: boolean; url: string | null }>({ show: false, url: null });
  
  // 🔔 تحديث Badge على أيقونة التطبيق
  useBadgeNotification(unreadCount);

  // تتبع حجم الشاشة
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // جلب التنبيهات (بدون loading state)
  const loadNotifications = async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true);
        // timeout للأمان - إيقاف loading بعد 5 ثوانٍ كحد أقصى
        setTimeout(() => {
          setLoading(false);

        }, 5000);
      }

      const result = await userNotificationService.getUserNotifications({ limit: 20 });

      if (result.success && result.notifications) {
        const filteredNotifications = result.notifications.filter(n => n);

        setNotifications(filteredNotifications);
      } else {

        setNotifications([]); // تعيين مصفوفة فارغة
      }
    } catch (error) {

      setNotifications([]); // تعيين مصفوفة فارغة
    } finally {
      // تأكد من إيقاف loading في جميع الحالات
      if (showLoading) {
        setLoading(false);

      }
    }
  };

  // جلب عدد غير المقروءة
  const loadUnreadCount = async () => {
    const result = await userNotificationService.getUnreadCount();
    if (result.success && result.count !== undefined) {
      setUnreadCount(result.count);
    }
  };

  // تحميل عند البداية (مع loading)
  useEffect(() => {

    loadNotifications(true);
    loadUnreadCount();
  }, []);

  // تحديث خفيف عند فتح النافذة (بدون دوري - نعتمد على Realtime)
  useEffect(() => {
    if (!showPanel) return;

    // تحديد جميع الإشعارات كمقروءة تلقائياً عند فتح النافذة
    const markAsReadOnOpen = async () => {
      if (unreadCount > 0) {
        const result = await userNotificationService.markAllAsRead();
        if (result.success) {

          // تحديث الحالة المحلية
          setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
          setUnreadCount(0);
        }
      }
    };
    
    markAsReadOnOpen();
  }, [showPanel, unreadCount]);

  // الاشتراك في التنبيهات الفورية (مرة واحدة فقط)
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    
    userNotificationService.subscribeToNotifications((notification) => {

      // تحديث القائمة فوراً
      setNotifications(prev => {
        // إذا كان موجوداً، حدثه (UPDATE)
        const existingIndex = prev.findIndex(n => n.id === notification.id);
        if (existingIndex !== -1) {
          const updated = [...prev];
          updated[existingIndex] = notification;

          return updated;
        }
        // إذا كان جديداً، أضفه (INSERT)

        return [notification, ...prev];
      });
      
      // تحديث العداد فوراً (فقط للإشعارات الجديدة غير المقروءة)
      setUnreadCount(prev => {
        // إذا كان الإشعار جديد وغير مقروء
        if (!notification.is_read) {
          const newCount = prev + 1;
          
          // تحديث Badge فوراً (مزامنة)
          if ('setAppBadge' in navigator) {
            (navigator as any).setAppBadge(newCount).then(() => {

            }).catch((_err: any) => {

            });
          }
          
          return newCount;
        }
        return prev; // لا تغيير إذا كان مقروءاً
      });
      
      // تشغيل صوت تنبيه
      playNotificationSound();
    }).then(unsub => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []); // مرة واحدة فقط عند التحميل

  // تشغيل صوت التنبيه
  const playNotificationSound = () => {
    try {
      const audio = new Audio();
      audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUKnl8LVkHAU2kdXzzn0vBSJ1xe/glEILElyx6OyrWBUIQ5zd8sFuJAUuhM/z24s4BxlqvvHlnU4LDlCp5fC1ZBwFNpHV88+ALwUhcsXv4ZVDCxFbr+frrVkVB0Kb3fLCcCUFLoTP89uLOAcZar7x5Z1OCw5QqeXwtWQcBTaR1fPPgC8FIXLF7+GVQwsRW6/n661ZFQdCm93ywm8lBS6Ez/PbizgHGWq+8eWdTgsOUKnl8LVkHAU2kdXzz4AvBSFyxe/hlUMLEVuv5+utWRUHQpvd8sJvJQUuhM/z24s4BxlqvvHlnU4LDlCp5fC1ZBwFNpHV88+ALwUhcsXv4ZVDCxFbr+frrVkVB0Kb3fLCbyUFLoTP89uLOAcZar7x5Z1OCw5QqeXwtWQcBTaR1fPPgC8FIXLF7+GVQwsRW6/n661ZFQdCm93ywm8lBS6Ez/PbizgHGWq+8eWdTgsOUKnl8LVkHAU2kdXzz4AvBSFyxe/hlUMLEVuv5+utWRUHQpvd8sJvJQUuhM/z24s4BxlqvvHlnU4LDlCp5fC1ZBwFNpHV88+ALwUhcsXv4ZVDCxFbr+frrVkVB0Kb3fLCbyUFLoTP89uLOAcZar7x5Z1OCw5QqeXwtWQcBTaR1fPPgC8FIXLFw==';
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch (error) {
      // تجاهل الأخطاء
    }
  };

  // تحديد كمقروء
  const markAsRead = async (notificationId: string) => {
    await userNotificationService.markAsRead(notificationId);
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
    setUnreadCount(prev => {
      const newCount = Math.max(0, prev - 1);
      
      // تحديث Badge فوراً (مزامنة)
      if ('setAppBadge' in navigator) {
        if (newCount > 0) {
          (navigator as any).setAppBadge(newCount).then(() => {

          });
        } else {
          (navigator as any).clearAppBadge().then(() => {

          });
        }
      }
      
      return newCount;
    });
  };

  // تحديد الكل كمقروء
  const markAllAsRead = async () => {
    const result = await userNotificationService.markAllAsRead();
    if (result.success) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      
      // مسح Badge فوراً (مزامنة)
      if ('clearAppBadge' in navigator) {
        (navigator as any).clearAppBadge().then(() => {

        });
      }
    }
  };

  // تبديل التحديد
  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // تحديد الكل / إلغاء تحديد الكل
  const toggleSelectAll = () => {
    if (selectedIds.length === notifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(notifications.map(n => n.id));
    }
  };

  // حذف المحددة
  const deleteSelected = async () => {
    if (selectedIds.length === 0) return;
    
    if (!confirm(language === 'ar' ? `هل تريد حذف ${selectedIds.length} تنبيه؟` : `Delete ${selectedIds.length} notifications?`)) {
      return;
    }

    // حذف من القائمة المحلية فوراً
    setNotifications(prev => prev.filter(n => !selectedIds.includes(n.id)));
    setSelectedIds([]);
    setIsSelectionMode(false);
    
    // TODO: إضافة API لحذف التنبيهات من الخادم
    // await userNotificationService.deleteNotifications(selectedIds);
  };

  // الحصول على أيقونة حسب النوع
  const getIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'announcement':
        return <Megaphone className="w-5 h-5 text-purple-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  // الحصول على لون الحدود حسب الأولوية
  const getBorderColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-4 border-red-500';
      case 'high':
        return 'border-l-4 border-orange-500';
      case 'normal':
        return 'border-l-4 border-blue-500';
      default:
        return 'border-l-4 border-gray-500';
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

  return (
    <div className="relative" dir={dir}>
      {/* زر التنبيهات */}
      <div className="relative">
        <button
          onClick={() => {
            setShowPanel(!showPanel);
          }}
          className="relative p-2 h-10 w-10 md:p-1 sm:md:p-2 md:min-w-[32px] sm:md:min-w-[36px] md:h-8 sm:md:h-9 rounded-xl md:rounded-lg bg-gradient-to-br from-slate-800/80 to-slate-900/80 md:bg-gradient-to-r md:from-slate-800/80 md:to-slate-700/80 hover:bg-slate-800/60 md:hover:from-slate-700/90 md:hover:to-slate-600/90 transition-all duration-300 flex items-center justify-center backdrop-blur-sm border border-slate-700/50 md:border-slate-600/50 hover:border-slate-600/70 md:hover:border-slate-500/70 shadow-lg hover:shadow-xl hover:shadow-slate-500/20 md:hover:shadow-xl hover:scale-105 md:hover:scale-100 text-blue-400 md:text-white"
          title={language === 'ar' ? 'التنبيهات' : language === 'fr' ? 'Notifications' : 'Notifications'}
        >
          <Bell className="w-6 h-6 md:w-4 md:h-4 transition-all duration-300" />
          {(isAdmin && adminNotificationsCount !== undefined ? adminNotificationsCount : unreadCount) > 0 && (
            <span className="absolute -top-1 -right-1 md:top-0 md:right-0 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold shadow-lg animate-pulse">
              {(isAdmin && adminNotificationsCount !== undefined ? adminNotificationsCount : unreadCount) > 9 ? '9+' : (isAdmin && adminNotificationsCount !== undefined ? adminNotificationsCount : unreadCount)}
            </span>
          )}
        </button>
      </div>

      {/* لوحة التنبيهات - للكمبيوتر فقط */}
      {showPanel && !isMobile && (
        <>
          {/* خلفية شفافة للإغلاق */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setShowPanel(false)}
          />
          
          {/* النافذة */}
          <div className="absolute top-full left-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-50 max-h-[600px] overflow-hidden flex flex-col animate-in slide-in-from-top-2 duration-200">
          {/* الهيدر */}
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-bold text-white">
                {language === 'ar' ? 'التنبيهات' : language === 'fr' ? 'Notifications' : 'Notifications'}
              </h3>
              {(isAdmin && adminNotificationsCount !== undefined ? adminNotificationsCount : unreadCount) > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {isAdmin && adminNotificationsCount !== undefined ? adminNotificationsCount : unreadCount}
                </span>
              )}
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title={language === 'ar' ? 'مزامنة تلقائية' : 'Auto-sync'}></span>
            </div>
            <div className="flex items-center gap-2">
              {!isSelectionMode && unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-400 hover:text-blue-300"
                  title={language === 'ar' ? 'تحديد الكل كمقروء' : 'Mark all as read'}
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={() => {
                    setIsSelectionMode(!isSelectionMode);
                    setSelectedIds([]);
                  }}
                  className={`text-xs ${isSelectionMode ? 'text-red-400 hover:text-red-300' : 'text-blue-400 hover:text-blue-300'}`}
                  title={language === 'ar' ? (isSelectionMode ? 'إلغاء' : 'تحديد') : (isSelectionMode ? 'Cancel' : 'Select')}
                >
                  {isSelectionMode ? <X className="w-4 h-4" /> : <CheckSquare className="w-4 h-4" />}
                </button>
              )}
              {isSelectionMode && selectedIds.length > 0 && (
                <button
                  onClick={deleteSelected}
                  className="text-xs text-red-400 hover:text-red-300"
                  title={language === 'ar' ? 'حذف المحددة' : 'Delete selected'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              {!isSelectionMode && (
                <button
                  onClick={() => setShowPanel(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* ملخص إشعارات الأدمن - يظهر فقط للأدمن */}
          {isAdmin && adminNotificationsSummary && adminNotificationsCount! > 0 && (
            <div className="px-4 py-3 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-b border-gray-700">
              <div className="grid grid-cols-2 gap-2">
                {adminNotificationsSummary.newUsers > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <UsersIcon className="w-4 h-4 text-blue-400" />
                    <span className="text-gray-300">{language === 'ar' ? 'مستخدمين جدد' : 'New Users'}:</span>
                    <span className="font-bold text-white">{adminNotificationsSummary.newUsers}</span>
                  </div>
                )}
                {adminNotificationsSummary.pendingPayments > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300">{language === 'ar' ? 'مدفوعات معلقة' : 'Pending Payments'}:</span>
                    <span className="font-bold text-white">{adminNotificationsSummary.pendingPayments}</span>
                  </div>
                )}
                {adminNotificationsSummary.pendingCommissions > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <TrendingUp className="w-4 h-4 text-yellow-400" />
                    <span className="text-gray-300">{language === 'ar' ? 'عمولات معلقة' : 'Pending Commissions'}:</span>
                    <span className="font-bold text-white">{adminNotificationsSummary.pendingCommissions}</span>
                  </div>
                )}
                {adminNotificationsSummary.expiringSoon > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <Calendar className="w-4 h-4 text-orange-400" />
                    <span className="text-gray-300">{language === 'ar' ? 'اشتراكات تنتهي' : 'Expiring Soon'}:</span>
                    <span className="font-bold text-white">{adminNotificationsSummary.expiringSoon}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* شريط التحديد */}
          {isSelectionMode && (
            <div className="px-4 py-2 bg-gray-750 border-b border-gray-700 flex items-center justify-between">
              <button
                onClick={toggleSelectAll}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                {selectedIds.length === notifications.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                <span>{language === 'ar' ? 'تحديد الكل' : 'Select All'}</span>
              </button>
              <span className="text-xs text-gray-400">
                {selectedIds.length} {language === 'ar' ? 'محدد' : 'selected'}
              </span>
            </div>
          )}

          {/* قائمة التنبيهات */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
            {loading ? (
              <div className="p-8 text-center text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-2"></div>
                {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>{language === 'ar' ? 'لا توجد تنبيهات' : language === 'fr' ? 'Aucune notification' : 'No notifications'}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-700">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-750 transition-colors ${
                      !notification.is_read ? 'bg-gray-750/50' : ''
                    } ${getBorderColor(notification.priority)} ${
                      selectedIds.includes(notification.id) ? 'bg-blue-900/20' : ''
                    } ${!isSelectionMode ? 'cursor-pointer' : ''}`}
                    onClick={() => {
                      if (!isSelectionMode && !notification.is_read) {
                        markAsRead(notification.id);
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {isSelectionMode && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelection(notification.id);
                          }}
                          className="flex-shrink-0 mt-1"
                        >
                          {selectedIds.includes(notification.id) ? (
                            <CheckSquare className="w-5 h-5 text-blue-400" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-500" />
                          )}
                        </button>
                      )}
                      <div className="flex-shrink-0 mt-1">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0 flex gap-3 items-start">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 
                              className={`font-semibold ${!notification.is_read ? 'text-white' : 'text-gray-300'}`}
                            >
                              {getText(notification, 'title')}
                            </h4>
                            {!notification.is_read && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></span>
                            )}
                          </div>
                          <p className="text-sm text-gray-400 mb-2">
                            {getText(notification, 'message')}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(notification.created_at).toLocaleString('en-US', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false
                            })}
                          </p>
                        </div>
                        {notification.image_url && (
                          <img 
                            src={notification.image_url} 
                            alt="notification" 
                            className="w-32 h-32 object-contain rounded cursor-pointer hover:opacity-90 transition-opacity flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowPanel(false);
                              setTimeout(() => setImageModal({ show: true, url: notification.image_url || null }), 100);
                            }}
                            onError={(e) => { 

                              (e.target as HTMLImageElement).style.display = 'none'; 
                            }}
                          />
                        )}
                        {!isSelectionMode && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (confirm(language === 'ar' ? 'هل تريد حذف هذا التنبيه؟' : 'Delete this notification?')) {
                                await userNotificationService.deleteNotification(notification.id);
                                loadNotifications();
                                loadUnreadCount();
                              }
                            }}
                            className="flex-shrink-0 p-1.5 hover:bg-red-500/20 rounded transition-colors"
                            title={language === 'ar' ? 'حذف' : 'Delete'}
                          >
                            <Trash2 className="w-4 h-4 text-red-400 hover:text-red-300" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        </>
      )}

    {/* نافذة التنبيهات المنسدلة للهواتف فقط - باستخدام Portal */}
    {showPanel && isMobile && createPortal(
      <div 
        className="fixed inset-0 flex items-start justify-end p-4"
        style={{ 
          zIndex: 999999,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          paddingTop: '80px'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowPanel(false);
          }
        }}
      >
        <div 
          style={{ 
            width: '100%',
            maxWidth: '400px',
            maxHeight: '80vh',
            overflow: 'auto',
            animation: 'slideInFromRight 0.3s ease-out'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 overflow-hidden flex flex-col max-h-[80vh]">
            {/* الهيدر */}
            <div className="p-3 border-b border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-400" />
                <h3 className="text-base font-bold text-white">
                  {language === 'ar' ? 'التنبيهات' : language === 'fr' ? 'Notifications' : 'Notifications'}
                </h3>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" title={language === 'ar' ? 'مزامنة تلقائية' : 'Auto-sync'}></span>
              </div>
              <div className="flex items-center gap-1.5">
                {!isSelectionMode && unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-blue-400 hover:text-blue-300"
                    title={language === 'ar' ? 'تحديد الكل كمقروء' : 'Mark all as read'}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={() => {
                      setIsSelectionMode(!isSelectionMode);
                      setSelectedIds([]);
                    }}
                    className={`text-xs ${isSelectionMode ? 'text-red-400 hover:text-red-300' : 'text-blue-400 hover:text-blue-300'}`}
                    title={language === 'ar' ? (isSelectionMode ? 'إلغاء' : 'تحديد') : (isSelectionMode ? 'Cancel' : 'Select')}
                  >
                    {isSelectionMode ? <X className="w-3.5 h-3.5" /> : <CheckSquare className="w-3.5 h-3.5" />}
                  </button>
                )}
                {isSelectionMode && selectedIds.length > 0 && (
                  <button
                    onClick={deleteSelected}
                    className="text-xs text-red-400 hover:text-red-300"
                    title={language === 'ar' ? 'حذف المحددة' : 'Delete selected'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                {!isSelectionMode && (
                  <button
                    onClick={() => setShowPanel(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* شريط التحديد */}
            {isSelectionMode && (
              <div className="px-3 py-2 bg-gray-750 border-b border-gray-700 flex items-center justify-between">
                <button
                  onClick={toggleSelectAll}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  {selectedIds.length === notifications.length ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                  <span>{language === 'ar' ? 'تحديد الكل' : 'Select All'}</span>
                </button>
                <span className="text-xs text-gray-400">
                  {selectedIds.length} {language === 'ar' ? 'محدد' : 'selected'}
                </span>
              </div>
            )}

            {/* قائمة التنبيهات */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
              {loading ? (
                <div className="p-6 text-center text-gray-400 text-sm">
                  {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-400">
                  <Bell className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{language === 'ar' ? 'لا توجد تنبيهات' : language === 'fr' ? 'Aucune notification' : 'No notifications'}</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-700">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 hover:bg-gray-750 transition-colors ${
                        !notification.is_read ? 'bg-gray-750/50' : ''
                      } ${getBorderColor(notification.priority)} ${
                        selectedIds.includes(notification.id) ? 'bg-blue-900/20' : ''
                      } ${!isSelectionMode ? 'cursor-pointer' : ''}`}
                      onClick={() => {
                        if (!isSelectionMode && !notification.is_read) {
                          markAsRead(notification.id);
                        }
                      }}
                    >
                      <div className="flex items-start gap-2.5">
                        {isSelectionMode && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelection(notification.id);
                            }}
                            className="flex-shrink-0 mt-0.5"
                          >
                            {selectedIds.includes(notification.id) ? (
                              <CheckSquare className="w-4 h-4 text-blue-400" />
                            ) : (
                              <Square className="w-4 h-4 text-gray-500" />
                            )}
                          </button>
                        )}
                        <div className="flex-shrink-0 mt-0.5">
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0 flex gap-2.5 items-start">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 
                                className={`text-sm font-semibold ${!notification.is_read ? 'text-white' : 'text-gray-300'}`}
                              >
                                {getText(notification, 'title')}
                              </h4>
                              {!notification.is_read && (
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0 mt-1.5"></span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 mb-1.5">
                              {getText(notification, 'message')}
                            </p>
                            <p className="text-[10px] text-gray-500">
                              {new Date(notification.created_at).toLocaleString('en-US', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                              })}
                            </p>
                          </div>
                          {notification.image_url && (
                            <img 
                              src={notification.image_url} 
                              alt="notification" 
                              className="w-24 h-24 object-contain rounded cursor-pointer hover:opacity-90 transition-opacity flex-shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowPanel(false);
                                setTimeout(() => setImageModal({ show: true, url: notification.image_url || null }), 100);
                              }}
                              onError={(e) => { 

                                (e.target as HTMLImageElement).style.display = 'none'; 
                              }}
                            />
                          )}
                          {!isSelectionMode && (
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (confirm(language === 'ar' ? 'هل تريد حذف هذا التنبيه؟' : 'Delete this notification?')) {
                                  await userNotificationService.deleteNotification(notification.id);
                                  loadNotifications();
                                  loadUnreadCount();
                                }
                              }}
                              className="flex-shrink-0 p-1 hover:bg-red-500/20 rounded transition-colors"
                              title={language === 'ar' ? 'حذف' : 'Delete'}
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-400 hover:text-red-300" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

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

              setImageModal({ show: false, url: null });
              alert(language === 'ar' ? 'فشل تحميل الصورة' : 'Failed to load image');
            }}
          />
        </div>,
        document.body
      )}
    </div>
  );
};
