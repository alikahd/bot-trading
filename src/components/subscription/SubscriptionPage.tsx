import React, { useState, useEffect } from 'react';
import { Check, Star, TrendingUp } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { LanguageSelector } from '../ui/LanguageSelector';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Footer } from '../layout/Footer';
import { clearAllCaches } from '../../utils/cacheUtils';
import { supabase } from '../../config/supabaseClient';

interface SubscriptionPlan {
  id: string;
  name: string;
  name_ar: string;
  name_fr?: string;
  duration_months: number;
  price: number;
  original_price?: number;
  features: string[];
  features_ar: string[];
  features_fr?: string[];
  is_popular?: boolean;
  discount?: number;
}

interface SubscriptionPageProps {
  onSelectPlan: (plan: SubscriptionPlan) => void;
  onBackToLogin: () => void;
  onBackToDashboard?: () => void;
  hasActiveSubscription?: boolean;
}

export const SubscriptionPage: React.FC<SubscriptionPageProps> = ({ 
  onSelectPlan, 
  onBackToLogin,
  onBackToDashboard,
  hasActiveSubscription = false
}) => {
  const { language, t, dir } = useLanguage();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  // جلب الباقات من قاعدة البيانات
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data, error } = await supabase
          .from('subscription_plans')
          .select('*')
          .order('price', { ascending: true });

        if (error) {
          console.error('خطأ في جلب الباقات:', error);
          // استخدام البيانات الافتراضية مع الخصومات في حالة الخطأ
          setPlans([
            {
              id: '98c199b7-1a73-4ab6-8b32-160beff3c167',
              name: 'Monthly Plan',
              name_ar: 'الباقة الشهرية',
              duration_months: 1,
              price: 29.99,
              original_price: 35.28,
              discount: 15,
              is_popular: false,
              features: ['Real-time signals', 'Advanced analytics', '24/7 support', 'Risk management tools'],
              features_ar: ['إشارات فورية', 'تحليلات متقدمة', 'دعم على مدار الساعة', 'أدوات إدارة المخاطر']
            },
            {
              id: '8783fe43-e784-401a-9644-33bd8b81d18c',
              name: 'Annual Plan',
              name_ar: 'الباقة السنوية',
              duration_months: 12,
              price: 287.99,
              original_price: 359.99,
              discount: 20,
              is_popular: true,
              features: ['Real-time signals', 'Advanced analytics', '24/7 support', 'Risk management tools', 'Priority support', 'Advanced strategies'],
              features_ar: ['إشارات فورية', 'تحليلات متقدمة', 'دعم على مدار الساعة', 'أدوات إدارة المخاطر', 'دعم أولوية', 'استراتيجيات متقدمة']
            },
            {
              id: 'e8c4d506-9dbd-4412-8c7c-504e989653c3',
              name: '3-Year Plan',
              name_ar: 'باقة 3 سنوات',
              duration_months: 36,
              price: 647.99,
              original_price: 1079.82,
              discount: 40,
              is_popular: false,
              features: ['Real-time signals', 'Advanced analytics', '24/7 support', 'Risk management tools', 'Priority support', 'Advanced strategies', 'Personal trading advisor', 'Custom indicators'],
              features_ar: ['إشارات فورية', 'تحليلات متقدمة', 'دعم على مدار الساعة', 'أدوات إدارة المخاطر', 'دعم أولوية', 'استراتيجيات متقدمة', 'مستشار تداول شخصي', 'مؤشرات مخصصة']
            }
          ]);
        } else if (data) {
          // تحويل البيانات من قاعدة البيانات
          const formattedPlans = data.map(plan => ({
            id: plan.id,
            name: plan.name,
            name_ar: plan.name_ar,
            name_fr: plan.name_fr,
            duration_months: plan.duration_months,
            price: parseFloat(plan.price),
            features: plan.features || [],
            features_ar: plan.features_ar || [],
            features_fr: plan.features_fr || [],
            is_popular: plan.id === '8783fe43-e784-401a-9644-33bd8b81d18c', // الباقة السنوية
            discount: plan.id === '8783fe43-e784-401a-9644-33bd8b81d18c' ? 20 : 
                     plan.id === 'e8c4d506-9dbd-4412-8c7c-504e989653c3' ? 40 : undefined
          }));
          
          console.log('📦 الباقات المُجلبة من قاعدة البيانات:', formattedPlans);
          
          // تسجيل المميزات لكل باقة للتأكد من الاختلاف
          formattedPlans.forEach(plan => {
            console.log(`📋 مميزات ${plan.name_ar}:`, {
              ar: plan.features_ar,
              en: plan.features,
              fr: plan.features_fr
            });
          });
          
          setPlans(formattedPlans);
        }
      } catch (error) {
        console.error('خطأ في جلب الباقات:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">جاري تحميل الباقات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex flex-col" dir={dir}>
      {/* أزرار التحكم */}
      <div className="absolute top-3 right-3 z-10">
        <LanguageSelector variant="landing" />
      </div>

      <div className="absolute top-3 left-3 z-10">
        {hasActiveSubscription && onBackToDashboard ? (
          // زر الرجوع للوحة التحكم للمستخدمين المشتركين والدافعين فقط
          <button 
            onClick={onBackToDashboard} 
            className="btn-sm bg-blue-600 hover:bg-blue-700 text-white border border-blue-500 hover:border-blue-400 px-2.5 py-1.5 text-xs sm:px-3 sm:py-2 sm:text-sm rounded-lg transition-all duration-200 flex items-center gap-1.5 shadow-lg font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 19-7-7 7-7"></path>
              <path d="M19 12H5"></path>
            </svg>
            <span>{t('common.backToDashboard')}</span>
          </button>
        ) : (
          // زر تسجيل الخروج للمستخدمين غير المشتركين أو غير الدافعين
          <button 
            onClick={onBackToLogin} 
            className="btn-sm bg-red-600 hover:bg-red-700 text-white border border-red-500 hover:border-red-400 px-2.5 py-1.5 text-xs sm:px-3 sm:py-2 sm:text-sm rounded-lg transition-all duration-200 flex items-center gap-1.5 shadow-lg font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span>{t('common.logout')}</span>
          </button>
        )}
      </div>

      {/* المحتوى الرئيسي */}
      <div className="flex-1 mt-8 sm:mt-10">
        <div className="relative container mx-auto px-4 py-3 sm:py-4">
        {/* العنوان */}
        <div className="text-center mb-4 sm:mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full shadow-2xl mb-2 sm:mb-3">
            <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-white mb-1.5 sm:mb-3">
            {t('subscription.planTitle')}
          </h1>
          <p className="text-sm text-blue-200 max-w-2xl mx-auto">
            {t('subscription.subtitle')}
          </p>
        </div>

        {/* الباقات */}
        <div className="grid md:grid-cols-3 gap-3 sm:gap-4 max-w-6xl mx-auto items-stretch">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative overflow-hidden transition-all duration-300 hover:scale-105 h-full flex flex-col ${
                plan.is_popular ? 'ring-2 ring-yellow-400 shadow-2xl shadow-yellow-400/20' : 'hover:shadow-2xl'
              }`}
              padding="none"
            >
              {plan.is_popular && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-4 py-1 text-sm font-bold rounded-bl-lg">
                  <Star className="w-4 h-4 inline mr-1" />
                  {t('subscription.mostPopular')}
                </div>
              )}

              {plan.discount && (
                <div className="absolute top-3 left-3 bg-red-500 text-white px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-bold">
                  {t('subscription.save')} {plan.discount}%
                </div>
              )}

              <div className="p-2.5 sm:p-3 flex flex-col h-full">
                {/* المحتوى العلوي */}
                <div className="flex-1">
                  <div className="text-center mb-2.5 sm:mb-4 mt-6 sm:mt-8">
                    <h3 className="text-sm sm:text-lg font-bold text-white mb-1">
                      {language === 'ar' ? plan.name_ar : 
                       language === 'fr' ? (plan.name_fr || plan.name) : 
                       plan.name}
                    </h3>
                  </div>

                  <div className="text-center mb-3 sm:mb-5">
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1.5">
                      ${plan.price}
                    </div>
                    <div className="text-gray-300 text-sm sm:text-base font-medium">
                      {plan.duration_months === 1 ? `/ ${t('subscription.month')}` : 
                       plan.duration_months === 12 ? `/ ${t('subscription.year')}` : 
                       plan.duration_months === 36 ? `/ ${plan.duration_months/12} ${t('subscription.years')}` :
                       `/ ${plan.duration_months} ${t('subscription.month')}`}
                    </div>
                  </div>

                  <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                    {(language === 'ar' ? plan.features_ar : 
                      language === 'fr' ? (plan.features_fr || plan.features) : 
                      plan.features).map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-300 text-xs sm:text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* الزر في الأسفل */}
                <div className="mt-auto">
                  <Button
                    onClick={async () => {
                      console.log('Plan selected:', plan);
                      // مسح الـ Cache عند اختيار الباقة
                      await clearAllCaches();
                      onSelectPlan(plan);
                    }}
                    className={`w-full py-2 sm:py-3 text-xs sm:text-base font-semibold transition-all duration-200 ${
                      plan.is_popular
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700'
                        : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                    }`}
                  >
                    {t('subscription.selectPlan')}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
        </div>
      </div>
      
      {/* الفوتر */}
      <Footer />
    </div>
  );
};
