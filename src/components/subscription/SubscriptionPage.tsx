import React from 'react';
import { Check, Star, TrendingUp, Globe } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Footer } from '../layout/Footer';
import { clearAllCaches } from '../../utils/cacheUtils';

interface SubscriptionPlan {
  id: string;
  name: string;
  name_ar: string;
  duration_months: number;
  price: number;
  features: string[];
  features_ar: string[];
  is_popular?: boolean;
  discount?: number;
}

interface SubscriptionPageProps {
  onSelectPlan: (plan: SubscriptionPlan) => void;
  onBackToLogin: () => void;
}

export const SubscriptionPage: React.FC<SubscriptionPageProps> = ({ 
  onSelectPlan, 
  onBackToLogin 
}) => {
  const { language, setLanguage, t, dir } = useLanguage();

  const plans: SubscriptionPlan[] = [
    {
      id: '98c199b7-1a73-4ab6-8b32-160beff3c167',
      name: 'Monthly Plan',
      name_ar: 'الباقة الشهرية',
      duration_months: 1,
      price: 29.99,
      features: ['Real-time signals', 'Technical analysis', 'Risk management', '24/7 support'],
      features_ar: ['إشارات فورية', 'التحليل الفني', 'إدارة المخاطر', 'دعم 24/7']
    },
    {
      id: '8783fe43-e784-401a-9644-33bd8b81d18c',
      name: 'Annual Plan',
      name_ar: 'الباقة السنوية',
      duration_months: 12,
      price: 287.99,
      is_popular: true,
      discount: 20,
      features: ['All Monthly features', 'Priority support', 'Advanced strategies', 'API access'],
      features_ar: ['كل ميزات الشهرية', 'دعم أولوية', 'استراتيجيات متقدمة', 'وصول API']
    },
    {
      id: 'e8c4d506-9dbd-4412-8c7c-504e989653c3',
      name: '3-Year Plan',
      name_ar: 'باقة 3 سنوات',
      duration_months: 36,
      price: 647.99,
      discount: 40,
      features: ['All Annual features', 'Personal advisor', 'VIP community', 'Custom configurations'],
      features_ar: ['كل ميزات السنوية', 'مستشار شخصي', 'مجتمع VIP', 'تكوينات مخصصة']
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex flex-col" dir={dir}>
      {/* أزرار التحكم */}
      <div className="absolute top-3 right-3 z-10">
        <button
          onClick={() => {
            const nextLang = language === 'ar' ? 'en' : language === 'en' ? 'fr' : 'ar';
            setLanguage(nextLang);
          }}
          className="btn-sm flex items-center gap-1.5 bg-white/10 backdrop-blur-lg border border-white/20 text-white hover:bg-white/20 px-2.5 py-1.5 rounded-lg transition-all duration-200"
        >
          <Globe className="w-3.5 h-3.5" />
          <span className="text-xs sm:text-sm font-medium">
            {language === 'ar' ? 'العربية' : language === 'en' ? 'English' : 'Français'}
          </span>
        </button>
      </div>

      <div className="absolute top-3 left-3 z-10">
        <button 
          onClick={onBackToLogin} 
          className="btn-sm bg-red-600 hover:bg-red-700 text-white border border-red-500 hover:border-red-400 px-2.5 py-1.5 text-xs sm:px-3 sm:py-2 sm:text-sm rounded-lg transition-all duration-200 flex items-center gap-1.5 shadow-lg font-medium"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          <span>تسجيل الخروج</span>
        </button>
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
        <div className="grid md:grid-cols-3 gap-3 sm:gap-4 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative overflow-hidden transition-all duration-300 hover:scale-105 ${
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

              <div className="p-2.5 sm:p-3">
                <div className="text-center mb-2.5 sm:mb-4 mt-6 sm:mt-8">
                  <h3 className="text-sm sm:text-lg font-bold text-white mb-1">
                    {language === 'ar' ? plan.name_ar : plan.name}
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
                  {(language === 'ar' ? plan.features_ar : plan.features).map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300 text-xs sm:text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

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
