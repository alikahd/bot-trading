import React, { useState, useEffect, useRef } from 'react';
import { Clock, CheckCircle, XCircle, RefreshCw, AlertCircle, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Footer } from '../layout/Footer';
import { clearAllCaches } from '../../utils/cacheUtils';
import { paymentService } from '../../services/paymentService';
import { supabase } from '../../config/supabaseClient';

interface PaymentReviewPageProps {
  userInfo: any;
  selectedPlan: any;
  paymentData: any;
  onBackToLogin: () => void;
  onCheckStatus: () => Promise<{ status: string; message?: string }>;
}

export const PaymentReviewPage: React.FC<PaymentReviewPageProps> = ({
  userInfo,
  selectedPlan,
  paymentData,
  onBackToLogin,
  onCheckStatus
}) => {
  const { t } = useLanguage();
  const [reviewStatus, setReviewStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const [lastPaymentId, setLastPaymentId] = useState<string | null>(null);
  const checkIntervalRef = useRef<any>(null);
  const resolvedRef = useRef<boolean>(false);
  const lastPaymentIdRef = useRef<string | null>(null);
  const resolvedPaymentIdRef = useRef<string | null>(null);
  const activeChannelRef = useRef<any>(null);
  const retryCountRef = useRef<number>(0);
  const retryTimerRef = useRef<any>(null);
  const isUnmountedRef = useRef<boolean>(false);

  // مزامنة ref مع state لضمان قراءة أحدث قيمة داخل callbacks
  useEffect(() => {
    lastPaymentIdRef.current = lastPaymentId;
  }, [lastPaymentId]);

  // التحقق من حالة المراجعة كل 3 ثوانٍ + Realtime
  useEffect(() => {

    isUnmountedRef.current = false;

    const nextPaymentId = paymentData?.id || lastPaymentIdRef.current || null;

    // إعادة التعيين دوماً عند الدخول للصفحة لضمان بدء التحقق
    setReviewStatus('pending');
    setStatusMessage('');
    setLastPaymentId(nextPaymentId);
    resolvedRef.current = false;
    resolvedPaymentIdRef.current = null;
    // سيتم إيقاف التحقق تلقائياً عندما تتغير reviewStatus إلى approved/rejected

    // التحقق الأولي (مرئي)
    handleCheckStatus(false);
    
    // إعداد Realtime subscription للتحديث الفوري مع إدارة قناة واحدة و Backoff
    const setupRealtimeSubscription = async () => {
      try {
        // تنظيف قناة سابقة إن وُجدت قبل إنشاء قناة جديدة
        if (activeChannelRef.current) {
          try {
            activeChannelRef.current.unsubscribe();
          } catch {}
          try {
            supabase.removeChannel(activeChannelRef.current);
          } catch {}
          activeChannelRef.current = null;
        }

        let channel = supabase.channel(`payment-updates-${userInfo.id}`, {
          config: { broadcast: { self: true } }
        });

        channel = channel.on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'payments', filter: `user_id=eq.${userInfo.id}` },
          (payload) => {

            const newData: any = (payload as any).new || {};
            const eventType: string = (payload as any).eventType || '';

            // اشتقاق الحالة مباشرة بدون انتظار طلبات إضافية
            let derivedStatus: 'pending' | 'approved' | 'rejected' = 'pending';
            if (newData.admin_review_status === 'approved' || newData.status === 'completed') {
              derivedStatus = 'approved';
            } else if (newData.admin_review_status === 'rejected' || newData.status === 'failed') {
              derivedStatus = 'rejected';
            }

            // إذا كانت محاولة دفع جديدة (INSERT) لنفس المستخدم، نجعلها المحاولة الحالية
            if (eventType === 'INSERT' && (derivedStatus === 'pending' || newData.status === 'reviewing' || newData.admin_review_status === 'pending')) {

              setLastPaymentId(newData.id);
              lastPaymentIdRef.current = newData.id;
              resolvedRef.current = false;
              setStatusMessage('');
              setReviewStatus('pending');
              setLastChecked(new Date());
              return;
            }

            // تحديثات - في حالة الموافقة، نعتبرها نهائية لأي دفعة
            if (derivedStatus === 'approved') {
              setStatusMessage(newData.admin_review_notes || '');
              setReviewStatus('approved');
              setLastChecked(new Date());
              setIsChecking(false);
              resolvedRef.current = true;
              resolvedPaymentIdRef.current = newData.id || lastPaymentIdRef.current || null;
              if (checkIntervalRef.current) {
                clearInterval(checkIntervalRef.current);
                checkIntervalRef.current = null;
              }
              paymentService.clearCache();
              setTimeout(async () => {
                await clearAllCaches();
                localStorage.removeItem('auth_state_cache');
                localStorage.removeItem('show_subscription_page');
                localStorage.removeItem('subscription_step');
                window.location.href = window.location.origin;
              }, 300);
              return;
            }

            // في حالة الرفض، نرفض فقط إذا كانت هذه هي المحاولة الحالية
            if (derivedStatus === 'rejected') {
              const currentId = lastPaymentIdRef.current;
              if (!currentId || newData.id === currentId) {
                setStatusMessage(newData.admin_review_notes || '');
                setReviewStatus('rejected');
                setLastChecked(new Date());
                setIsChecking(false);
                resolvedRef.current = true;
                resolvedPaymentIdRef.current = newData.id || currentId || null;
                if (checkIntervalRef.current) {
                  clearInterval(checkIntervalRef.current);
                  checkIntervalRef.current = null;
                }
                paymentService.clearCache();
                setTimeout(async () => {
                  await clearAllCaches();
                }, 0);
                alert('❌ تم رفض دفعتك\n\nالسبب: ' + (newData.admin_review_notes || 'غير محدد') + '\n\nيرجى التواصل مع الدعم أو إعادة المحاولة.');
              } else {

              }
              return;
            }

            // حالة Pending/Reviewing - تحديث بسيط إذا كانت الدفعة الحالية
            if (newData.id === lastPaymentIdRef.current) {
              setStatusMessage(newData.admin_review_notes || '');
              setReviewStatus('pending');
              setLastChecked(new Date());
            }
          }
        );
        channel = channel.on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'users',
              filter: `id=eq.${userInfo.id}`
            },
            (payload) => {

              const newUser: any = (payload as any).new || {};
              // إذا أصبح المستخدم نشطاً، نعتبرها موافقة
              if (newUser.is_active === true || newUser.subscription_status === 'active' || newUser.status === 'active') {
                setStatusMessage('');
                setReviewStatus('approved');
                setLastChecked(new Date());
                setIsChecking(false);
                resolvedRef.current = true;
                if (checkIntervalRef.current) {
                  clearInterval(checkIntervalRef.current);
                  checkIntervalRef.current = null;
                }
                // مسح الكاش قبل إعادة التوجيه
                paymentService.clearCache();
                setTimeout(async () => {
                  await clearAllCaches();
                  localStorage.removeItem('auth_state_cache');
                  localStorage.removeItem('show_subscription_page');
                  localStorage.removeItem('subscription_step');
                  window.location.href = window.location.origin;
                }, 300);
              }
            }
          )
          .subscribe((status) => {

            const scheduleResubscribe = () => {
              if (resolvedRef.current || isUnmountedRef.current) return;
              if (retryTimerRef.current) return;
              const MAX_RETRIES = 6;
              if (retryCountRef.current >= MAX_RETRIES) {

                return;
              }
              const base = 1500;
              const delay = Math.min(base * Math.pow(2, retryCountRef.current), 15000) + Math.floor(Math.random() * 400);
              retryCountRef.current += 1;

              retryTimerRef.current = setTimeout(async () => {
                retryTimerRef.current = null;
                if (activeChannelRef.current) {
                  try { activeChannelRef.current.unsubscribe(); } catch {}
                  try { supabase.removeChannel(activeChannelRef.current); } catch {}
                  activeChannelRef.current = null;
                }
                await setupRealtimeSubscription();
              }, delay);
            };

            if (status === 'SUBSCRIBED') {

              // إعادة تعيين عدّاد المحاولات عند النجاح
              retryCountRef.current = 0;
              if (retryTimerRef.current) {
                clearTimeout(retryTimerRef.current);
                retryTimerRef.current = null;
              }
            } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED' || status === 'TIMED_OUT') {

              scheduleResubscribe();
            }
          });
        
        activeChannelRef.current = channel;
        return channel;
      } catch (error) {

        return null;
      }
    };
    
    // إعداد Realtime (قناة واحدة)
    setupRealtimeSubscription();
    
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
      // تنظيف محاولات إعادة الاشتراك
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      // إلغاء الاشتراك في Realtime وإزالة القناة
      (async () => {
        try {
          if (activeChannelRef.current) {

            try { activeChannelRef.current.unsubscribe(); } catch {}
            try { supabase.removeChannel(activeChannelRef.current); } catch {}
            activeChannelRef.current = null;
          }
        } catch {}
      })();
      resolvedRef.current = false;
      isUnmountedRef.current = true;
    };
  }, [userInfo.id, paymentData?.id, paymentData?.createdAt]);

  // تشغيل/إيقاف التحقق الدوري اعتماداً على حالة reviewStatus
  useEffect(() => {
    // إذا ليست pending، أوقف المؤقت إن وجد
    if (reviewStatus !== 'pending') {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
      return;
    }

    // إذا لم يكن هناك مؤقت، أنشئ واحداً
    if (!checkIntervalRef.current) {
      checkIntervalRef.current = setInterval(async () => {
        if (!resolvedRef.current) {
          await handleCheckStatus(false);
        }
      }, 3000);
    }

    // تنظيف عند تغير الحالة
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };
  }, [reviewStatus]);

  // التحقق من حالة المراجعة
  const handleCheckStatus = async (silent: boolean = false) => {
    if (reviewStatus !== 'pending') { setIsChecking(false); return; }
    if (!silent) setIsChecking(true);
    try {

      const result = await onCheckStatus();

      const newStatus = result.status as 'pending' | 'approved' | 'rejected';
      
      // التحقق من معرّف الدفع (إذا كان متوفراً)
      // نستخدم paymentData.id أو createdAt كمعرّف فريد للدفع
      const currentPaymentId = (result as any).paymentId || paymentData?.id || paymentData?.createdAt;
      const isNewPayment = currentPaymentId && currentPaymentId !== lastPaymentId;

      if (isNewPayment) {

        setLastPaymentId(currentPaymentId);
      }
      
      // لا تغير الحالة إذا تم الحسم سابقاً
      if (!resolvedRef.current) { setReviewStatus(newStatus); }
      
      if (result.message) {
        setStatusMessage(result.message);
      }
      setLastChecked(new Date());
      
      // إيقاف حالة التحقق قبل عرض أي رسائل
      if (!silent) setIsChecking(false);
      
      // إذا تمت الموافقة
      if (newStatus === 'approved') {

        // إيقاف التحقق الدوري

        resolvedRef.current = true;
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
          checkIntervalRef.current = null;
        }
        
        // إشعار فوري للمستخدم
        alert('🎉 تمت الموافقة على دفعتك!\n\nسيتم توجيهك الآن للدخول إلى التطبيق.');
        
        // مسح الـ cache وإعادة التحميل فوراً
        paymentService.clearCache();
        setTimeout(async () => {

          await clearAllCaches();
          localStorage.removeItem('auth_state_cache');
          localStorage.removeItem('show_subscription_page');
          localStorage.removeItem('subscription_step');
          window.location.href = window.location.origin;
        }, 500);
      }
      
      // إذا تم الرفض
      if (newStatus === 'rejected') {

        // إيقاف التحقق الدوري

        resolvedRef.current = true;
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
          checkIntervalRef.current = null;
        }
        // مسح الكاش لضمان تحديث أي واجهة تعتمد على الحالة
        paymentService.clearCache();
        await clearAllCaches();
        alert('❌ تم رفض دفعتك\n\nالسبب: ' + (result.message || 'غير محدد') + '\n\nيرجى التواصل مع الدعم أو إعادة المحاولة.');
      }
    } catch (error) {

      setIsChecking(false);
    }
  };

  // تنسيق الوقت بالأرقام اللاتينية
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  // تنسيق التاريخ بالأرقام اللاتينية
  const formatDate = (date: Date | string | number) => {
    if (!date) return 'N/A';
    
    let d: Date;
    if (date instanceof Date) {
      d = date;
    } else if (typeof date === 'string') {
      d = new Date(date);
    } else if (typeof date === 'number') {
      d = new Date(date);
    } else {
      return 'N/A';
    }
    
    // التحقق من صحة التاريخ
    if (isNaN(d.getTime())) {
      return 'N/A';
    }
    
    return d.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex flex-col">
      {/* تم إزالة زر تغيير اللغة - الصفحة تتبع اللغة المختارة من البداية */}

      {/* خلفية متحركة */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      </div>

      {/* المحتوى الرئيسي */}
      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-2xl">
          {/* العنوان */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              {reviewStatus === 'pending' && (
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-full flex items-center justify-center">
                  <Clock className="w-8 h-8 text-white" />
                </div>
              )}
              {reviewStatus === 'approved' && (
                <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-green-700 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
              )}
              {reviewStatus === 'rejected' && (
                <div className="w-16 h-16 bg-gradient-to-r from-red-600 to-red-700 rounded-full flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-white" />
                </div>
              )}
            </div>
            
            <h1 className="text-3xl font-bold text-white mb-2">
              {reviewStatus === 'pending' && t('paymentReview.title')}
              {reviewStatus === 'approved' && t('paymentReview.acceptedTitle')}
              {reviewStatus === 'rejected' && t('paymentReview.rejectedTitle')}
            </h1>
            
            <p className="text-gray-300">
              {reviewStatus === 'pending' && t('paymentReview.reviewingMessage')}
              {reviewStatus === 'approved' && t('paymentReview.approvedTitle')}
              {reviewStatus === 'rejected' && t('paymentReview.rejectedTitle')}
            </p>
          </div>

          {/* معلومات الدفع */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 mb-6">
            <h3 className="text-xl font-bold text-white mb-4">{t('paymentReview.paymentDetails')}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <span className="text-gray-400 text-sm">{t('paymentStatus.user')}:</span>
                  <div className="text-white font-medium">{userInfo.fullName}</div>
                </div>
                
                <div>
                  <span className="text-gray-400 text-sm">{t('paymentStatus.email')}:</span>
                  <div className="text-white font-medium text-sm">{userInfo.email}</div>
                </div>
                
                <div>
                  <span className="text-gray-400 text-sm">{t('paymentStatus.plan')}:</span>
                  <div className="text-white font-medium">{selectedPlan.name}</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <span className="text-gray-400 text-sm">{t('paymentStatus.amount')}:</span>
                  <div className="text-green-400 font-bold text-lg">${selectedPlan.price}</div>
                </div>
                
                <div>
                  <span className="text-gray-400 text-sm">{t('paymentStatus.paymentMethod')}:</span>
                  <div className="text-white font-medium">{t('paymentStatus.cryptocurrency')}</div>
                </div>
                
                <div>
                  <span className="text-gray-400 text-sm">{t('paymentStatus.submissionDate')}:</span>
                  <div className="text-white font-medium text-sm">
                    {formatDate(paymentData.createdAt || Date.now())}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* حالة المراجعة */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">{t('paymentStatus.reviewStatus')}</h3>
              <button
                onClick={() => handleCheckStatus(false)}
                disabled={isChecking}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-all duration-200"
              >
                <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
                {isChecking ? t('paymentReview.checking') : t('paymentReview.updateStatus')}
              </button>
            </div>

            {reviewStatus === 'pending' && (
              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-5 h-5 text-yellow-400" />
                  <span className="text-yellow-400 font-medium">{t('paymentStatus.pendingReview')}</span>
                </div>
                <p className="text-gray-300 text-sm mb-3">
                  {t('paymentReview.pendingMessage')}
                </p>
                <div className="text-xs text-gray-400">
                  {t('paymentReview.lastUpdate')}: {formatTime(lastChecked)}
                </div>
              </div>
            )}

            {reviewStatus === 'approved' && (
              <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-green-400 font-medium text-lg">🎉 {t('paymentStatus.accepted')}</span>
                </div>
                <p className="text-gray-300 text-sm mb-3">
                  {t('paymentReview.approvedMessage')}
                </p>
                {statusMessage && (
                  <div className="bg-green-600/20 rounded p-3 text-green-300 text-sm mb-3">
                    <strong>{t('paymentReview.adminNote')}:</strong> {statusMessage}
                  </div>
                )}
                <div className="bg-green-700/30 rounded p-3 text-green-200 text-sm">
                  <strong>✅ {t('paymentReview.canLoginNow')}</strong>
                </div>
              </div>
            )}

            {reviewStatus === 'rejected' && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <XCircle className="w-5 h-5 text-red-400" />
                  <span className="text-red-400 font-medium">{t('paymentStatus.rejected')}</span>
                </div>
                <p className="text-gray-300 text-sm mb-3">
                  {t('paymentReview.rejectedMessage')}
                </p>
                {statusMessage && (
                  <div className="bg-red-600/20 rounded p-2 text-red-300 text-sm">
                    <strong>{t('paymentReview.rejectionReason')}:</strong> {statusMessage}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* معلومات إضافية */}
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-blue-400 mb-2">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">{t('paymentStatus.importantInfo')}</span>
            </div>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>• {t('paymentReview.info1')}</li>
              <li>• {t('paymentReview.info2')}</li>
              <li>• {t('paymentReview.info3')}</li>
              <li>• {t('paymentReview.info4')}</li>
            </ul>
          </div>

          {/* أزرار الإجراءات */}
          <div className="flex flex-col sm:flex-row gap-4">
            {reviewStatus === 'approved' && (
              <button
                onClick={onBackToLogin}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                {t('paymentReview.loginNow')}
              </button>
            )}
            
            {reviewStatus === 'rejected' && (
              <>
                <button
                  onClick={onBackToLogin}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  {t('paymentReview.backToLogin')}
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  {t('paymentReview.tryAgain')}
                </button>
              </>
            )}
            
            {reviewStatus === 'pending' && (
              <button
                onClick={onBackToLogin}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                {t('paymentReview.backToLogin')}
              </button>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};
