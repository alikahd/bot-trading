import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Zap, 
  Shield, 
  TrendingUp, 
  Star, 
  ArrowRight, 
  Sparkles,
  Check
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { LanguageSelector } from '../components/ui/LanguageSelector';
import { cn } from '../styles/designSystem';
import { useLanguage } from '../contexts/LanguageContext';
import { Footer } from '../components/layout/Footer';
import { supabase } from '../config/supabaseClient';

interface LandingPageProps {
  onNavigateToLogin: () => void;
  onNavigateToRegister: () => void;
  onNavigate: (page: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigateToLogin,
  onNavigateToRegister,
  onNavigate
}) => {
  const { language } = useLanguage();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [plans, setPlans] = useState<any[]>([]);

  // منع الرجوع للخلف باستخدام زر المتصفح/الهاتف
  useEffect(() => {
    // إضافة حالة جديدة للتاريخ عند تحميل الصفحة
    window.history.pushState({ page: 'landing', preventBack: true }, '', window.location.pathname);

    const handlePopState = (event: PopStateEvent) => {
      // إذا حاول المستخدم الرجوع، نمنعه ونعيده للأمام
      if (event.state?.preventBack) {
        window.history.pushState({ page: 'landing', preventBack: true }, '', window.location.pathname);
        console.log('🚫 تم منع الرجوع للخلف من الصفحة الرئيسية');
      }
    };

    // الاستماع لحدث الرجوع
    window.addEventListener('popstate', handlePopState);

    // التنظيف عند إلغاء تحميل المكون
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // تبديل الشهادات تلقائياً
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial(prev => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: Bot,
      title: language === 'ar' ? 'ذكاء اصطناعي متقدم' : 'Advanced AI',
      description: language === 'ar' 
        ? 'خوارزميات ذكية تحلل السوق وتتخذ قرارات تداول مربحة'
        : 'Smart algorithms that analyze markets and make profitable trading decisions'
    },
    {
      icon: Zap,
      title: language === 'ar' ? 'سرعة البرق' : 'Lightning Fast',
      description: language === 'ar'
        ? 'تنفيذ الصفقات في أجزاء من الثانية لاستغلال أفضل الفرص'
        : 'Execute trades in milliseconds to capture the best opportunities'
    },
    {
      icon: Shield,
      title: language === 'ar' ? 'أمان مطلق' : 'Maximum Security',
      description: language === 'ar'
        ? 'حماية متقدمة لأموالك وبياناتك مع تشفير عسكري'
        : 'Advanced protection for your funds and data with military-grade encryption'
    },
    {
      icon: TrendingUp,
      title: language === 'ar' ? 'نتائج مثبتة' : 'Proven Results',
      description: language === 'ar'
        ? 'معدل نجاح يصل إلى 94% مع آلاف المتداولين الناجحين'
        : 'Up to 94% success rate with thousands of successful traders'
    }
  ];

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
          // استخدام البيانات الافتراضية في حالة الخطأ
          setPlans([
            {
              id: '98c199b7-1a73-4ab6-8b32-160beff3c167',
              name: 'Monthly Plan',
              name_ar: 'الباقة الشهرية',
              price: 29.99,
              original_price: 35.28,
              discount: 15,
              duration_months: 1,
              features: ['Real-time signals', 'Technical analysis', 'Risk management', '24/7 support'],
              features_ar: ['إشارات فورية', 'التحليل الفني', 'إدارة المخاطر', 'دعم 24/7'],
              popular: false,
              gradient: 'from-blue-500 to-cyan-500'
            },
            {
              id: '8783fe43-e784-401a-9644-33bd8b81d18c',
              name: 'Annual Plan',
              name_ar: 'الباقة السنوية',
              price: 287.99,
              original_price: 359.99,
              discount: 20,
              duration_months: 12,
              features: ['All Monthly features', 'Priority support', 'Advanced strategies', 'API access'],
              features_ar: ['كل ميزات الشهرية', 'دعم أولوية', 'استراتيجيات متقدمة', 'وصول API'],
              popular: true,
              gradient: 'from-purple-500 to-pink-500'
            },
            {
              id: 'e8c4d506-9dbd-4412-8c7c-504e989653c3',
              name: '3-Year Plan',
              name_ar: 'باقة 3 سنوات',
              price: 647.99,
              original_price: 1079.82,
              discount: 40,
              duration_months: 36,
              features: ['All Annual features', 'Personal advisor', 'VIP community', 'Custom configurations'],
              features_ar: ['كل ميزات السنوية', 'مستشار شخصي', 'مجتمع VIP', 'تكوينات مخصصة'],
              popular: false,
              gradient: 'from-orange-500 to-red-500'
            }
          ]);
        } else {
          // تحويل البيانات من قاعدة البيانات مع إضافة الخصومات والتمييز
          const formattedPlans = data.map(plan => {
            // تحديد الخصم والسعر الأصلي حسب الباقة
            let discount = 0;
            let original_price = parseFloat(plan.price);
            
            if (plan.id === '98c199b7-1a73-4ab6-8b32-160beff3c167') { // الباقة الشهرية
              discount = 15;
              original_price = 35.28;
            } else if (plan.id === '8783fe43-e784-401a-9644-33bd8b81d18c') { // الباقة السنوية
              discount = 20;
              original_price = 359.99;
            } else if (plan.id === 'e8c4d506-9dbd-4412-8c7c-504e989653c3') { // باقة 3 سنوات
              discount = 40;
              original_price = 1079.82;
            }
            
            return {
              ...plan,
              original_price: original_price,
              discount: discount,
              popular: plan.id === '8783fe43-e784-401a-9644-33bd8b81d18c', // الباقة السنوية
              gradient: plan.id === '98c199b7-1a73-4ab6-8b32-160beff3c167' ? 'from-blue-500 to-cyan-500' :
                       plan.id === '8783fe43-e784-401a-9644-33bd8b81d18c' ? 'from-purple-500 to-pink-500' :
                       'from-orange-500 to-red-500'
            };
          });
          
          setPlans(formattedPlans);
        }
      } catch (error) {
        console.error('خطأ في الاتصال بقاعدة البيانات:', error);
        setPlans([]);
      }
    };

    fetchPlans();
  }, [language]);

  const testimonials = [
    {
      name: language === 'ar' ? 'أحمد محمد' : 'Ahmed Mohammed',
      role: language === 'ar' ? 'متداول محترف' : 'Professional Trader',
      content: language === 'ar' 
        ? 'حقق البوت أرباحاً تفوق توقعاتي. نتائج مذهلة!'
        : 'The bot achieved profits beyond my expectations. Amazing results!',
      rating: 5
    },
    {
      name: language === 'ar' ? 'سارة أحمد' : 'Sarah Ahmed',
      role: language === 'ar' ? 'مستثمرة' : 'Investor',
      content: language === 'ar'
        ? 'سهولة الاستخدام والنتائج المضمونة جعلتني أثق بالمنصة'
        : 'Ease of use and guaranteed results made me trust the platform',
      rating: 5
    },
    {
      name: language === 'ar' ? 'محمد علي' : 'Mohammed Ali',
      role: language === 'ar' ? 'رجل أعمال' : 'Businessman',
      content: language === 'ar'
        ? 'أفضل استثمار قمت به. البوت يعمل بكفاءة عالية'
        : 'Best investment I ever made. The bot works with high efficiency',
      rating: 5
    }
  ];

  const stats = [
    {
      number: '10K+',
      label: language === 'ar' ? 'متداول نشط' : 'Active Traders'
    },
    {
      number: '94%',
      label: language === 'ar' ? 'معدل النجاح' : 'Success Rate'
    },
    {
      number: '$50M+',
      label: language === 'ar' ? 'إجمالي الأرباح' : 'Total Profits'
    },
    {
      number: '24/7',
      label: language === 'ar' ? 'دعم فني' : 'Support'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white overflow-hidden">
      {/* خلفية متحركة ثلاثية الأبعاد */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-bounce"></div>
          <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
          <div className="absolute bottom-40 right-10 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl animate-bounce animation-delay-4000"></div>
        </div>
      </div>

      {/* Header */}
      <header className="relative z-50 bg-black/15 backdrop-blur-lg border-b border-white/10" dir="rtl">
        {/* طبقة اللوغو المطلقة - لا تؤثر على ارتفاع الهيدر (جميع الشاشات) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          {/* اللوغو للهواتف */}
          <div className="md:hidden relative w-40 h-40 sm:w-44 sm:h-44 pointer-events-auto">
            <img
              src="/images/logo.png"
              alt="Bot Trading"
              loading="eager"
              decoding="sync"
              className="w-full h-full object-contain drop-shadow-2xl"
            />
          </div>
          {/* اللوغو للديسكتوب */}
          <div className="hidden md:block relative w-52 h-52 lg:w-64 lg:h-64 xl:w-72 xl:h-72 pointer-events-auto">
            <img
              src="/images/logo.png"
              alt="Bot Trading"
              loading="eager"
              decoding="sync"
              className="w-full h-full object-contain drop-shadow-2xl hover:scale-110 transition-transform duration-300"
            />
          </div>
        </div>
        
        <div className="px-3 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-6 md:py-5">
          <div className="max-w-7xl mx-auto">
            {/* Mobile Header Layout - اللوغو في طبقة مطلقة فوق */}
            <div className="flex md:hidden items-center justify-between gap-2">
              {/* Mobile Login Button */}
              <div className="relative group">
                {/* Glow Effect الخارجي */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 rounded-lg blur opacity-40 group-hover:opacity-70 group-active:opacity-80 transition-all duration-300"></div>
                
                <button 
                  onClick={onNavigateToLogin}
                  className="btn-sm relative overflow-hidden px-2.5 py-1.5 text-xs font-bold bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-lg shadow-xl hover:shadow-blue-500/50 border border-blue-400/40 hover:border-blue-400/70 backdrop-blur-xl transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-1.5"
                >
                  {/* Shimmer Effect */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-cyan-500/30 to-blue-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* محتوى الزر */}
                  <span className="relative z-10 flex items-center gap-1.5">
                    {/* أيقونة متحركة */}
                    <svg className="w-3.5 h-3.5 group-hover:rotate-12 transition-all duration-300" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3-3l3-3m0 0l-3-3m3 3H9" />
                    </svg>
                    <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent font-extrabold">
                      {language === 'ar' ? 'دخول' : 'Login'}
                    </span>
                  </span>
                  
                  {/* نقاط مضيئة */}
                  <div className="absolute top-0.5 right-0.5 w-0.5 h-0.5 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute bottom-0.5 left-0.5 w-0.5 h-0.5 bg-cyan-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              </div>

              {/* Mobile Language Toggle */}
              <LanguageSelector variant="mobile" />
            </div>

            {/* Desktop Header Layout - اللوغو في طبقة مطلقة فوق */}
            <div className="hidden md:flex items-center justify-between">
              {/* Navigation Buttons - Left (Desktop) */}
              <div className="flex items-center gap-3">
                {/* زر تسجيل الدخول */}
                <button 
                  onClick={onNavigateToLogin}
                  className="relative group px-5 py-2.5 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 hover:border-white/50 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg"
                >
                  <span className="relative z-10">{language === 'ar' ? 'تسجيل الدخول' : language === 'en' ? 'Login' : 'Connexion'}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
                </button>
                
                {/* زر إنشاء حساب */}
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-lg blur opacity-40 group-hover:opacity-70 transition duration-300 animate-pulse"></div>
                  <button 
                    onClick={onNavigateToRegister}
                    className="relative px-6 py-2.5 text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 border border-blue-400/50"
                  >
                    {language === 'ar' ? 'إنشاء حساب' : language === 'en' ? 'Sign Up' : 'S\'inscrire'}
                  </button>
                </div>
              </div>

              {/* Language Toggle - Right */}
              <div className="flex items-center">
                <LanguageSelector variant="landing" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 px-4 py-4 sm:py-6 md:py-8">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-4 sm:mb-6">
            <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-white/10 rounded-full px-3 py-1 mb-3 sm:mb-4">
              <Sparkles className="w-3 h-3 text-yellow-400" />
              <span className="text-[11px] sm:text-xs font-medium">
                {language === 'ar' ? 'الجيل الجديد من التداول الآلي' : 'Next Generation Automated Trading'}
              </span>
            </div>
            
            <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 leading-tight text-center">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                {language === 'ar' ? 'تداول ذكي' : language === 'en' ? 'Smart Trading' : 'Trading Intelligent'}
              </span>
              {' '}
              <span className="text-white">
                {language === 'ar' ? 'أرباح مضمونة' : language === 'en' ? 'Guaranteed Profits' : 'Profits Garantis'}
              </span>
            </h1>
            
            <p className="text-sm sm:text-base md:text-lg text-gray-300 mb-5 sm:mb-6 max-w-2xl mx-auto leading-relaxed px-2">
              {language === 'ar' 
                ? 'اكتشف قوة الذكاء الاصطناعي في التداول. بوت متطور يحقق أرباحاً استثنائية بأمان تام'
                : 'Discover the power of AI in trading. Advanced bot that achieves exceptional profits with complete security'
              }
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex justify-center items-center mb-6 sm:mb-8 md:mb-10">
            <Button
              onClick={onNavigateToRegister}
              className="group relative px-6 py-3 sm:px-8 sm:py-4 md:px-10 md:py-4 lg:px-12 lg:py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-xl transform hover:scale-105 transition-all duration-300 text-lg sm:text-xl md:text-lg"
            >
              <span className="flex items-center gap-2">
                {language === 'ar' ? 'ابدأ التداول الآن' : 'Start Trading Now'}
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6 mb-5 sm:mb-6 md:mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-0.5 sm:mb-1.5">
                  {stat.number}
                </div>
                <div className="text-gray-400 text-[11px] sm:text-xs md:text-sm">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 px-4 py-5 sm:py-6 md:py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-5 sm:mb-6 md:mb-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-3.5 sm:mb-5">
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {language === 'ar' ? 'لماذا نحن الأفضل؟' : 'Why Choose Us?'}
              </span>
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-300 max-w-2xl mx-auto px-2">
              {language === 'ar'
                ? 'تقنيات متطورة وخبرة عالمية لضمان أفضل النتائج في التداول'
                : 'Advanced technologies and global expertise to ensure the best trading results'
              }
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5 md:gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group p-3 sm:p-4 md:p-5 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-500 hover:transform hover:scale-105"
              >
                <div className="mb-3.5 sm:mb-5">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-2.5 sm:mb-3.5 group-hover:rotate-12 transition-transform duration-500">
                    <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold mb-1.5 sm:mb-2.5 text-white">
                    {feature.title}
                  </h3>
                  <p className="text-gray-300 leading-relaxed text-xs sm:text-sm">
                    {feature.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="relative z-10 px-4 py-5 sm:py-6 md:py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-5 sm:mb-6 md:mb-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-3.5 sm:mb-5">
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {language === 'ar' ? 'خطط الاشتراك' : 'Subscription Plans'}
              </span>
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-300 max-w-2xl mx-auto px-2">
              {language === 'ar'
                ? 'اختر الخطة المناسبة لك وابدأ رحلتك نحو الأرباح المضمونة'
                : 'Choose the plan that suits you and start your journey towards guaranteed profits'
              }
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-3 sm:gap-4 max-w-6xl mx-auto items-stretch">
            {plans.map((plan, index) => (
              <Card
                key={index}
                className={`relative overflow-hidden transition-all duration-300 hover:scale-105 h-full flex flex-col ${
                  plan.popular ? 'ring-2 ring-yellow-400 shadow-2xl shadow-yellow-400/20' : 'hover:shadow-2xl'
                }`}
                padding="none"
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-4 py-1 text-sm font-bold rounded-bl-lg">
                    <Star className="w-4 h-4 inline mr-1" />
                    {language === 'ar' ? 'الأكثر شعبية' : 'Most Popular'}
                  </div>
                )}

                {plan.discount && (
                  <div className="absolute top-3 left-3 bg-red-500 text-white px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-bold">
                    {language === 'ar' ? 'وفر' : 'Save'} {plan.discount}%
                  </div>
                )}

                <div className="p-2.5 sm:p-3 flex flex-col h-full">
                  {/* المحتوى العلوي */}
                  <div className="flex-1">
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
                        {plan.duration_months === 1 
                          ? (language === 'ar' ? '/ شهر' : '/ month')
                          : plan.duration_months === 12 
                          ? (language === 'ar' ? '/ سنة' : '/ year')
                          : plan.duration_months === 36 
                          ? (language === 'ar' ? `/ ${plan.duration_months/12} سنوات` : `/ ${plan.duration_months/12} years`)
                          : `/ ${plan.duration_months} ${language === 'ar' ? 'شهر' : 'months'}`}
                      </div>
                    </div>

                    <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                      {(language === 'ar' ? plan.features_ar : plan.features)?.map((feature: string, featureIndex: number) => (
                        <div key={featureIndex} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-300 text-xs sm:text-sm">{feature}</span>
                        </div>
                      )) || []}
                    </div>
                  </div>

                  {/* الزر في الأسفل */}
                  <div className="mt-auto">
                    <Button
                      onClick={onNavigateToLogin}
                      className={`w-full py-2 sm:py-3 text-xs sm:text-base font-semibold transition-all duration-200 ${
                        plan.popular
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700'
                          : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                      }`}
                    >
                      {language === 'ar' ? 'اختر هذه الخطة' : 'Choose This Plan'}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative z-10 px-3 py-4 sm:py-5 md:py-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-4 sm:mb-5 md:mb-6">
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-2.5 sm:mb-3.5">
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {language === 'ar' ? 'ماذا يقول عملاؤنا؟' : 'What Our Clients Say?'}
              </span>
            </h2>
          </div>

          <div className="max-w-3xl mx-auto">
            <Card className="p-4 sm:p-5 md:p-6 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm border border-white/10 text-center">
              <div className="mb-3 sm:mb-4">
                <div className="flex justify-center gap-0.5 sm:gap-1 mb-2.5 sm:mb-3">
                  {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <blockquote className="text-sm sm:text-base md:text-lg text-gray-200 mb-3 sm:mb-4 leading-relaxed px-2">
                  "{testimonials[currentTestimonial].content}"
                </blockquote>
                <div>
                  <div className="font-bold text-white text-sm sm:text-base">
                    {testimonials[currentTestimonial].name}
                  </div>
                  <div className="text-gray-400 text-xs sm:text-sm">
                    {testimonials[currentTestimonial].role}
                  </div>
                </div>
              </div>
            </Card>

            {/* Testimonial indicators */}
            <div className="flex justify-center gap-0.5 mt-1 sm:mt-2">
              {testimonials.map((_, index) => (
                <div
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={cn(
                    "w-[4px] h-[4px] sm:w-[5px] sm:h-[5px] rounded-full transition-all duration-300 cursor-pointer",
                    index === currentTestimonial
                      ? "bg-blue-500 scale-125"
                      : "bg-white/60 hover:bg-white/80"
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-4 py-5 sm:py-6 md:py-8">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="p-5 sm:p-6 md:p-8 bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-sm border border-white/20">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-3.5 sm:mb-5">
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {language === 'ar' ? 'ابدأ رحلتك اليوم' : 'Start Your Journey Today'}
              </span>
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-300 mb-5 sm:mb-6 leading-relaxed">
              {language === 'ar'
                ? 'انضم إلى آلاف المتداولين الناجحين واكتشف قوة التداول الآلي'
                : 'Join thousands of successful traders and discover the power of automated trading'
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3.5 justify-center">
              <Button
                onClick={onNavigateToRegister}
                className="group px-5 py-2.5 sm:px-6 sm:py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-lg sm:rounded-xl shadow-xl transform hover:scale-105 transition-all duration-300 text-sm"
              >
                <span className="flex items-center gap-2">
                  {language === 'ar' ? 'أنشئ حسابك الأن' : 'Create Free Account'}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default LandingPage;
