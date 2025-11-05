import React, { useState, useEffect, useCallback } from 'react';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Eye,
  User,
  Package,
  Receipt,
  Calendar,
  CreditCard,
  Timer,
  MessageCircle,
  RotateCcw,
  Star,
  Mail
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Payment } from '../../services/paymentService';
import { executeRealQuery, formatRealLatinDate, calculateRealTimeRemaining } from '../../services/realSupabaseService';
import { supabase } from '../../config/supabaseClient';
import { useLanguage } from '../../contexts/LanguageContext';

interface SubscriptionAndPaymentsPageProps {
  status: any;
  userInfo: any;
  userId?: string;
  onBack: () => void;
  onRenew: () => void;
}

export const SubscriptionAndPaymentsPage: React.FC<SubscriptionAndPaymentsPageProps> = ({
  status: _status,
  userInfo: _userInfo,
  userId,
  onBack: _onBack,
  onRenew: _onRenew
}) => {
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';
  const [payments, setPayments] = useState<Payment[]>([]);
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);
  const [realUserData, setRealUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'subscription' | 'payments'>('subscription');
  const [timeRemaining, setTimeRemaining] = useState<any>(null);

  // تحميل البيانات الحقيقية من قاعدة البيانات
  const loadRealData = useCallback(async () => {
    if (!userId) {
      console.warn('⚠️ userId غير متوفر في SubscriptionAndPaymentsPage');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      // تنظيف البيانات السابقة
      setPayments([]);
      setSubscriptionDetails(null);
      setRealUserData(null);
      
      // جلب بيانات المستخدم الحقيقية
      const userQuery = `
        SELECT id, username, email, role, subscription_status, subscription_end_date, created_at
        FROM users 
        WHERE id = '${userId}'
      `;
      const userResult = await executeRealQuery(userQuery);
      if (userResult.error) {
        console.error('خطأ في جلب بيانات المستخدم:', userResult.error);
      } else if (userResult.data && userResult.data.length > 0) {
        setRealUserData(userResult.data[0]);
      }
      
      // جلب تفاصيل الاشتراك مع معلومات الخطة باستخدام الاستعلام المباشر
      let subscriptionResult;
      try {
        // محاولة الاستعلام المباشر أولاً
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from('subscriptions')
          .select(`
            *,
            subscription_plans!inner(
              name,
              name_ar,
              name_fr,
              features,
              features_ar,
              features_fr,
              price
            )
          `)
          .eq('user_id', userId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1);

        if (subscriptionError) {
          // العودة للاستعلام التقليدي
          const subscriptionQuery = `
            SELECT 
              s.*,
              sp.name as plan_name_en,
              sp.name_ar as plan_name_ar,
              sp.name_fr as plan_name_fr,
              sp.features as features_en,
              sp.features_ar as features_ar,
              sp.features_fr as features_fr,
              sp.price as plan_price
            FROM subscriptions s
            LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
            WHERE s.user_id = '${userId}' AND s.status = 'active'
            ORDER BY s.created_at DESC LIMIT 1
          `;
          subscriptionResult = await executeRealQuery(subscriptionQuery);
        } else {
          // تحويل البيانات للصيغة المطلوبة
          const formattedData = subscriptionData?.map(sub => {
            const planData = Array.isArray(sub.subscription_plans) ? sub.subscription_plans[0] : sub.subscription_plans;
            return {
              ...sub,
              plan_name_en: planData?.name,
              plan_name_ar: planData?.name_ar,
              plan_name_fr: planData?.name_fr,
              features_en: planData?.features,
              features_ar: planData?.features_ar,
              features_fr: planData?.features_fr,
              plan_price: planData?.price
            };
          });
          
          subscriptionResult = { data: formattedData, error: null };
        }
      } catch (error) {
        subscriptionResult = { data: null, error: String(error) };
      }
      if (subscriptionResult.error) {
        // خطأ في جلب بيانات الاشتراك
      } else if (subscriptionResult.data && subscriptionResult.data.length > 0) {
        const subscription = subscriptionResult.data[0];
        
        // معالجة الميزات من JSONB إلى Array
        const parseFeatures = (features: any) => {
          if (!features) return [];
          if (Array.isArray(features)) return features;
          if (typeof features === 'object') return Object.values(features);
          if (typeof features === 'string') {
            try {
              const parsed = JSON.parse(features);
              return Array.isArray(parsed) ? parsed : [];
            } catch {
              return [];
            }
          }
          return [];
        };
        
        // الحصول على المميزات الافتراضية بناءً على plan_id
        const getDefaultFeatures = (planId: string, lang: string): string[] => {
          const defaultFeatures: Record<string, Record<string, string[]>> = {
            '98c199b7-1a73-4ab6-8b32-160beff3c167': { // Monthly Plan
              ar: ['إشارات فورية', 'تحليلات متقدمة', 'دعم على مدار الساعة', 'أدوات إدارة المخاطر'],
              en: ['Real-time signals', 'Advanced analytics', '24/7 support', 'Risk management tools'],
              fr: ['Signaux en temps réel', 'Analyse technique', 'Gestion des risques', 'Support 24/7']
            },
            '8783fe43-e784-401a-9644-33bd8b81d18c': { // Annual Plan
              ar: ['إشارات فورية', 'تحليلات متقدمة', 'دعم على مدار الساعة', 'أدوات إدارة المخاطر', 'دعم أولوية', 'استراتيجيات متقدمة'],
              en: ['Real-time signals', 'Advanced analytics', '24/7 support', 'Risk management tools', 'Priority support', 'Advanced strategies'],
              fr: ['Toutes les fonctionnalités mensuelles', 'Support prioritaire', 'Stratégies avancées', 'Accès API']
            },
            'e8c4d506-9dbd-4412-8c7c-504e989653c3': { // 3-Year Plan
              ar: ['إشارات فورية', 'تحليلات متقدمة', 'دعم على مدار الساعة', 'أدوات إدارة المخاطر', 'دعم أولوية', 'استراتيجيات متقدمة', 'مستشار تداول شخصي', 'مؤشرات مخصصة'],
              en: ['Real-time signals', 'Advanced analytics', '24/7 support', 'Risk management tools', 'Priority support', 'Advanced strategies', 'Personal trading advisor', 'Custom indicators'],
              fr: ['Toutes les fonctionnalités annuelles', 'Conseiller personnel', 'Communauté VIP', 'Configurations personnalisées']
            }
          };
          
          return defaultFeatures[planId]?.[lang] || [];
        };
        
        const featuresEn = parseFeatures(subscription.features_en);
        const featuresAr = parseFeatures(subscription.features_ar);
        const featuresFr = parseFeatures(subscription.features_fr);
        
        
        setSubscriptionDetails({
          ...subscription,
          plan_name_en: subscription.plan_name_en || 'Monthly Plan',
          plan_name_ar: subscription.plan_name_ar || 'الباقة الشهرية',
          plan_name_fr: subscription.plan_name_fr || 'Plan Mensuel',
          features_en: featuresEn.length > 0 ? featuresEn : getDefaultFeatures(subscription.plan_id, 'en'),
          features_ar: featuresAr.length > 0 ? featuresAr : getDefaultFeatures(subscription.plan_id, 'ar'),
          features_fr: featuresFr.length > 0 ? featuresFr : getDefaultFeatures(subscription.plan_id, 'fr'),
          price: subscription.amount_paid || subscription.plan_price
        });
        
        // حساب الوقت المتبقي
        const remaining = calculateRealTimeRemaining(subscription.end_date);
        setTimeRemaining(remaining);
      }

      // جلب المدفوعات الحقيقية (بدون تكرار)
      const paymentsQuery = `
        SELECT DISTINCT ON (id)
          id,
          user_id,
          amount,
          currency,
          payment_method,
          status,
          payment_reference,
          created_at,
          proof_image
        FROM payments 
        WHERE user_id = '${userId}'
        ORDER BY id DESC, created_at DESC
        LIMIT 10
      `;
      const paymentsResult = await executeRealQuery(paymentsQuery);
      if (paymentsResult.error) {
        // خطأ في جلب بيانات المدفوعات
      } else if (paymentsResult.data) {
        
        // فحص وإزالة المدفوعات المكررة بناءً على معايير متعددة
        const uniquePayments = paymentsResult.data.filter((payment: any, index: number, self: any[]) => {
          // البحث عن أول مدفوعة بنفس المعايير
          const firstIndex = self.findIndex((p: any) => {
            // مقارنة بناءً على ID أولاً
            if (p.id === payment.id) return true;
            
            // إذا لم يكن هناك ID مطابق، نقارن بناءً على المعايير الأخرى
            return (
              p.amount === payment.amount &&
              p.currency === payment.currency &&
              p.payment_method === payment.payment_method &&
              p.created_at === payment.created_at &&
              p.user_id === payment.user_id
            );
          });
          
          return index === firstIndex;
        });
        
        if (uniquePayments.length !== paymentsResult.data.length) {
          // تم إزالة مدفوعات مكررة
        }
        
        setPayments(uniquePayments);
      }
      
    } catch (error) {
      // خطأ في تحميل البيانات
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadRealData();

    // ✅ إعداد Realtime للاشتراكات والمدفوعات
    console.log('🔴 إعداد Realtime لصفحة الاشتراك والمدفوعات...');

    // مزامنة الاشتراكات
    const subscriptionsChannel = supabase
      .channel(`user-subscription-${userId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'subscriptions', filter: `user_id=eq.${userId}` },
        (payload) => {
          console.log('🔄 تغيير في الاشتراك:', payload);
          loadRealData();
        }
      )
      .subscribe();

    // مزامنة المدفوعات
    const paymentsChannel = supabase
      .channel(`user-payments-${userId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'payments', filter: `user_id=eq.${userId}` },
        (payload) => {
          console.log('🔄 تغيير في المدفوعات:', payload);
          loadRealData();
        }
      )
      .subscribe();

    // تنظيف عند إلغاء التحميل
    return () => {
      console.log('🧹 تنظيف Realtime للاشتراك والمدفوعات...');
      supabase.removeChannel(subscriptionsChannel);
      supabase.removeChannel(paymentsChannel);
    };
  }, [loadRealData, userId]);

  // تحديث العد التنازلي كل ثانية
  useEffect(() => {
    if (!subscriptionDetails?.end_date) return;
    
    const interval = setInterval(() => {
      const remaining = calculateRealTimeRemaining(subscriptionDetails.end_date);
      setTimeRemaining(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [subscriptionDetails]);

  // الحصول على لون الحالة
  const getStatusColor = (paymentStatus: string): 'success' | 'warning' | 'error' => {
    switch (paymentStatus) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'reviewing': return 'warning';
      case 'failed': return 'error';
      default: return 'warning';
    }
  };

  // الحصول على نص الحالة
  const getStatusText = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'completed': return t('subscriptionPage.status.completed');
      case 'pending': return t('subscriptionPage.status.pending');
      case 'reviewing': return t('subscriptionPage.status.reviewing');
      case 'failed': return t('subscriptionPage.status.failed');
      case 'refunded': return t('subscriptionPage.status.refunded');
      case 'cancelled': return t('subscriptionPage.status.cancelled');
      default: return paymentStatus;
    }
  };

  // الحصول على أيقونة الحالة
  const getStatusIcon = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'completed': return <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />;
      case 'pending': return <Clock className="w-3 h-3 sm:w-4 sm:h-4" />;
      case 'reviewing': return <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />;
      case 'failed': return <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />;
      default: return <Clock className="w-3 h-3 sm:w-4 sm:h-4" />;
    }
  };

  // تصحيح عرض طريقة الدفع
  const getCorrectPaymentMethod = (paymentMethod: string) => {
    if (!paymentMethod) return t('subscriptionPage.notSpecified');
    
    // تصحيح العملات الرقمية
    switch (paymentMethod.toLowerCase()) {
      case 'bitcoin':
      case 'btc':
      case 'crypto':
      case 'cryptocurrency':
        return 'USDT'; // العملة المتوفرة فعلياً
      case 'usdt':
        return 'USDT';
      case 'paypal':
        return 'PayPal';
      case 'bank':
      case 'bank_transfer':
        return t('subscriptionPage.bankTransfer');
      default:
        return paymentMethod;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-2 sm:p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-sm sm:text-base">{t('subscriptionPage.loading')}</p>
        </div>
      </div>
    );
  }

  // التحقق من وجود userId
  if (!userId) {
    return (
      <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-2 sm:p-4" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="max-w-6xl mx-auto">
          <Card className="bg-slate-900/40 backdrop-blur-xl border-slate-800/50 p-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">
                {language === 'ar' ? 'خطأ في تحميل البيانات' : 
                 language === 'fr' ? 'Erreur de chargement des données' : 
                 'Data Loading Error'}
              </h3>
              <p className="text-gray-400 text-sm">
                {language === 'ar' ? 'لا يمكن تحميل بيانات الاشتراك. يرجى تسجيل الخروج والدخول مرة أخرى.' : 
                 language === 'fr' ? 'Impossible de charger les données d\'abonnement. Veuillez vous déconnecter et vous reconnecter.' : 
                 'Unable to load subscription data. Please logout and login again.'}
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-2 sm:p-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto">
        {/* الهيدر المضغوط */}
        <div className="flex items-center justify-between gap-2 sm:gap-4 mb-3 sm:mb-6">
          <h1 className="text-base sm:text-lg md:text-xl font-bold text-white">
            {t('subscriptionPage.title')}
          </h1>
        </div>

        {/* التبويبات المضغوطة */}
        <div className="flex mb-3 sm:mb-4 bg-slate-800/30 rounded-lg p-0.5 sm:p-1">
          <button
            onClick={() => setActiveTab('subscription')}
            className={`flex-1 px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-sm font-medium rounded-md transition-colors ${
              activeTab === 'subscription'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Package className="w-2.5 h-2.5 sm:w-4 sm:h-4 inline mr-0.5 sm:mr-2" />
            {t('subscriptionPage.subscriptionTab')}
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`flex-1 px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-sm font-medium rounded-md transition-colors ${
              activeTab === 'payments'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Receipt className="w-2.5 h-2.5 sm:w-4 sm:h-4 inline mr-0.5 sm:mr-2" />
            {t('subscriptionPage.paymentsTab')} ({payments.length})
          </button>
        </div>

        {/* محتوى التبويبات */}
        {activeTab === 'subscription' && (
          <div className="space-y-3 sm:space-y-4">
            {/* حالة الاشتراك مع العد التنازلي */}
            {!subscriptionDetails ? (
              <Card className="bg-slate-900/40 backdrop-blur-xl border-slate-800/50 p-6">
                <div className="text-center">
                  <Package className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-white mb-2">
                    {language === 'ar' ? 'لا توجد بيانات اشتراك' : 
                     language === 'fr' ? 'Aucune donnée d\'abonnement' : 
                     'No Subscription Data'}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {language === 'ar' ? 'لم يتم العثور على بيانات اشتراك نشط لهذا المستخدم.' : 
                     language === 'fr' ? 'Aucune donnée d\'abonnement actif trouvée pour cet utilisateur.' : 
                     'No active subscription data found for this user.'}
                  </p>
                </div>
              </Card>
            ) : (
              <Card className="bg-slate-900/40 backdrop-blur-xl border-slate-800/50 p-3 sm:p-4">
              <div className="flex items-start gap-2 sm:gap-3 mb-4">
                <div className="flex-shrink-0 text-green-400">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-white mb-2">
                    {t('subscriptionPage.subscriptionStatus')}
                  </h3>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="success" className="text-xs">
                      {subscriptionDetails?.status === 'active' ? t('subscriptionPage.active') : t('subscriptionPage.inactive')}
                    </Badge>
                    {(subscriptionDetails?.plan_name_ar || subscriptionDetails?.plan_name_en || subscriptionDetails?.plan_name_fr) && (
                      <Badge variant="warning" className="text-xs">
                        {language === 'ar' ? subscriptionDetails.plan_name_ar : 
                         language === 'fr' ? subscriptionDetails.plan_name_fr : 
                         subscriptionDetails.plan_name_en}
                      </Badge>
                    )}
                  </div>
                  
                  {/* العد التنازلي */}
                  {timeRemaining && !timeRemaining.expired && (
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-1 sm:gap-2 text-gray-300">
                        <Timer className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="text-xs sm:text-sm font-medium">
                          {t('subscriptionPage.timeRemaining')}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-1 sm:gap-2 p-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg border border-blue-500/30">
                        <div className="text-center">
                          <div className="text-lg sm:text-2xl font-bold text-white animate-pulse">
                            {timeRemaining.days}
                          </div>
                          <div className="text-[10px] sm:text-xs text-blue-300">{t('subscriptionPage.days')}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg sm:text-2xl font-bold text-white animate-pulse">
                            {timeRemaining.hours}
                          </div>
                          <div className="text-[10px] sm:text-xs text-blue-300">{t('subscriptionPage.hours')}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg sm:text-2xl font-bold text-white animate-pulse">
                            {timeRemaining.minutes}
                          </div>
                          <div className="text-[10px] sm:text-xs text-blue-300">{t('subscriptionPage.minutes')}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg sm:text-2xl font-bold text-white animate-pulse">
                            {timeRemaining.seconds}
                          </div>
                          <div className="text-[10px] sm:text-xs text-blue-300">{t('subscriptionPage.seconds')}</div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* تواريخ الاشتراك باللاتينية */}
                  <div className="space-y-1 sm:space-y-2">
                    {subscriptionDetails?.start_date && (
                      <div className="flex items-center gap-1 sm:gap-2">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                        <span className="text-xs sm:text-sm text-gray-300">
                          {t('subscriptionPage.startDate')}: {formatRealLatinDate(subscriptionDetails.start_date).short}
                        </span>
                      </div>
                    )}
                    {subscriptionDetails?.end_date && (
                      <div className="flex items-center gap-1 sm:gap-2">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                        <span className="text-xs sm:text-sm text-gray-300">
                          {t('subscriptionPage.endDate')}: {formatRealLatinDate(subscriptionDetails.end_date).short}
                        </span>
                      </div>
                    )}
                    {subscriptionDetails?.price && (
                      <div className="flex items-center gap-1 sm:gap-2">
                        <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                        <span className="text-xs sm:text-sm text-gray-300">
                          {t('subscriptionPage.price')}: ${subscriptionDetails.price} {subscriptionDetails.currency}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* أزرار الإجراءات */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 border-t border-slate-700/50">
                <Button
                  onClick={() => {
                    // فتح الدردشة المباشرة
                    if (typeof (window as any).Tawk_API !== 'undefined' && (window as any).Tawk_API.maximize) {
                      (window as any).Tawk_API.maximize();
                    }
                  }}
                  variant="ghost"
                  className="flex-1 text-xs sm:text-sm bg-green-600/20 border-green-500/30 text-green-400 hover:bg-green-600/30"
                >
                  <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  {t('subscriptionPage.contactSupport')}
                </Button>
                <Button
                  onClick={() => {
                    // تنفيذ منطق التجديد
                    if (typeof _onRenew === 'function') {
                      _onRenew();
                    }
                  }}
                  variant="ghost"
                  className="flex-1 text-xs sm:text-sm bg-blue-600/20 border-blue-500/30 text-blue-400 hover:bg-blue-600/30"
                >
                  <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  {t('subscriptionPage.renewSubscription')}
                </Button>
              </div>
            </Card>
            )}

            {/* معلومات الباقة */}
            {subscriptionDetails && (
              <Card className="bg-slate-900/40 backdrop-blur-xl border-slate-800/50 p-3 sm:p-4">
                <h3 className="text-sm sm:text-base font-bold text-white mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  {t('subscriptionPage.planFeatures')} - {language === 'ar' ? subscriptionDetails.plan_name_ar : 
                    language === 'fr' ? subscriptionDetails.plan_name_fr : 
                    subscriptionDetails.plan_name_en}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(() => {
                    const features = language === 'ar' ? subscriptionDetails?.features_ar : 
                                   language === 'fr' ? subscriptionDetails?.features_fr : 
                                   subscriptionDetails?.features_en;
                    
                    
                    if (!features || features.length === 0) {
                      return (
                        <div className="col-span-full text-center text-gray-400 text-sm">
                          {language === 'ar' ? 'لا توجد مميزات محددة' : 'No features specified'}
                        </div>
                      );
                    }
                    
                    return features.map((feature: string, index: number) => (
                      <div key={index} className="flex items-center gap-2 text-xs sm:text-sm text-gray-300">
                        <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                        {feature}
                      </div>
                    ));
                  })()}
                </div>
              </Card>
            )}

            {/* معلومات المستخدم الحقيقية */}
            <Card className="bg-slate-900/40 backdrop-blur-xl border-slate-800/50 p-3 sm:p-4">
              <h3 className="text-sm sm:text-base font-bold text-white mb-2 sm:mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-400" />
                {t('subscriptionPage.userInfo')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {realUserData?.username && (
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                    <span className="text-xs sm:text-sm text-white font-medium">
                      {realUserData.username}
                    </span>
                  </div>
                )}
                {realUserData?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                    <span className="text-xs sm:text-sm text-gray-300">
                      {realUserData.email}
                    </span>
                  </div>
                )}
                {realUserData?.role && (
                  <div className="flex items-center gap-2">
                    <Package className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
                    <span className="text-xs sm:text-sm text-gray-300">
                      {realUserData.role === 'admin' ? t('subscriptionPage.admin') : t('subscriptionPage.trader')}
                    </span>
                  </div>
                )}
                {realUserData?.created_at && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-orange-400" />
                    <span className="text-xs sm:text-sm text-gray-300">
                      {t('subscriptionPage.memberSince')}: {formatRealLatinDate(realUserData.created_at).short}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* تبويب المدفوعات */}
        {activeTab === 'payments' && (
          <Card className="bg-slate-900/40 backdrop-blur-xl border-slate-800/50 p-3 sm:p-4">
            <h3 className="text-sm sm:text-base font-bold text-white mb-3 sm:mb-4">
              {t('subscriptionPage.paymentHistory')}
            </h3>
            
            {payments.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <Receipt className="w-8 h-8 sm:w-12 sm:h-12 text-gray-500 mx-auto mb-2 sm:mb-3" />
                <p className="text-gray-400 text-sm sm:text-base">{t('subscriptionPage.noPayments')}</p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-2 sm:p-3 bg-slate-800/30 rounded-lg"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <div className={`text-${getStatusColor(payment.status) === 'success' ? 'green' : getStatusColor(payment.status) === 'error' ? 'red' : 'yellow'}-400`}>
                        {getStatusIcon(payment.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs sm:text-sm font-medium text-white">
                            ${payment.amount}
                          </span>
                          <Badge variant={getStatusColor(payment.status)} className="text-[10px] sm:text-xs">
                            {getStatusText(payment.status)}
                          </Badge>
                        </div>
                        <div className="text-[10px] sm:text-xs text-gray-400">
                          {formatRealLatinDate(payment.created_at).short} - {getCorrectPaymentMethod((payment as any).payment_method)}
                        </div>
                        {(payment as any).payment_reference && (
                          <div className="text-[10px] sm:text-xs text-gray-500">
                            {t('subscriptionPage.reference')}: {(payment as any).payment_reference}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {(payment as any).proof_image && (
                      <Button
                        onClick={() => setSelectedImage((payment as any).proof_image || null)}
                        variant="ghost"
                        className="p-1 sm:p-2 text-gray-400 hover:text-white"
                      >
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* مودال عرض الصورة */}
        {selectedImage && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="relative max-w-3xl w-full">
              <Button
                onClick={() => setSelectedImage(null)}
                variant="ghost"
                className="absolute -top-10 right-0 text-white hover:text-gray-300"
              >
                ✕
              </Button>
              <img
                src={selectedImage}
                alt={t('subscriptionPage.paymentProof')}
                className="w-full h-auto rounded-lg"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
