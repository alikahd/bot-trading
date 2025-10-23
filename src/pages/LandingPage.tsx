import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Zap, 
  Shield, 
  TrendingUp, 
  Star, 
  ArrowRight, 
  CheckCircle,
  Sparkles
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { cn } from '../styles/designSystem';
import { useLanguage } from '../contexts/LanguageContext';
import { Footer } from '../components/layout/Footer';

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
  const { language, setLanguage } = useLanguage();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

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

  const plans = [
    {
      id: '98c199b7-1a73-4ab6-8b32-160beff3c167',
      name: language === 'ar' ? 'الباقة الشهرية' : 'Monthly Plan',
      price: '$29.99',
      period: language === 'ar' ? '/شهر' : '/month',
      duration: language === 'ar' ? 'شهر واحد' : '1 Month',
      features: language === 'ar' 
        ? ['إشارات فورية', 'التحليل الفني', 'إدارة المخاطر', 'دعم 24/7']
        : ['Real-time signals', 'Technical analysis', 'Risk management', '24/7 support'],
      popular: false,
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      id: '8783fe43-e784-401a-9644-33bd8b81d18c',
      name: language === 'ar' ? 'الباقة السنوية' : 'Annual Plan',
      price: '$287.99',
      originalPrice: '$359.88',
      period: language === 'ar' ? '/سنة' : '/year',
      duration: language === 'ar' ? '12 شهر' : '12 Months',
      discount: '20%',
      features: language === 'ar'
        ? ['كل ميزات الشهرية', 'دعم أولوية', 'استراتيجيات متقدمة', 'وصول API']
        : ['All Monthly features', 'Priority support', 'Advanced strategies', 'API access'],
      popular: true,
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      id: 'e8c4d506-9dbd-4412-8c7c-504e989653c3',
      name: language === 'ar' ? 'باقة 3 سنوات' : '3-Year Plan',
      price: '$647.99',
      originalPrice: '$1079.64',
      period: language === 'ar' ? '/3 سنوات' : '/3 years',
      duration: language === 'ar' ? '36 شهر' : '36 Months',
      discount: '40%',
      features: language === 'ar'
        ? ['كل ميزات السنوية', 'مستشار شخصي', 'مجتمع VIP', 'تكوينات مخصصة']
        : ['All Annual features', 'Personal advisor', 'VIP community', 'Custom configurations'],
      popular: false,
      gradient: 'from-orange-500 to-red-500'
    }
  ];

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
      <header className="relative z-50 bg-black/15 backdrop-blur-lg border-b border-white/10">
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
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'ar' | 'en' | 'fr')}
                className="bg-transparent hover:bg-white/5 backdrop-blur-sm border border-white/20 hover:border-white/40 rounded-md px-2 py-0.5 text-white text-[10px] font-medium focus:outline-none focus:ring-1 focus:ring-white/30 transition-all duration-300 cursor-pointer text-center"
              >
                <option value="ar" style={{background: 'transparent', color: 'white', padding: '6px', fontSize: '10px'}}>AR</option>
                <option value="en" style={{background: 'transparent', color: 'white', padding: '6px', fontSize: '10px'}}>EN</option>
                <option value="fr" style={{background: 'transparent', color: 'white', padding: '6px', fontSize: '10px'}}>FR</option>
              </select>
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
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as 'ar' | 'en' | 'fr')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 backdrop-blur-sm border border-blue-400/40 hover:border-blue-300/60 rounded-lg px-4 py-2 text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-300 cursor-pointer min-w-[110px] text-center shadow-lg hover:shadow-xl"
                >
                  <option value="ar" style={{background: '#1e3a8a', color: 'white', padding: '12px', fontWeight: '600'}}>العربية</option>
                  <option value="en" style={{background: '#1e3a8a', color: 'white', padding: '12px', fontWeight: '600'}}>English</option>
                  <option value="fr" style={{background: '#1e3a8a', color: 'white', padding: '12px', fontWeight: '600'}}>Français</option>
                </select>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {plans.map((plan, index) => (
              <Card
                key={index}
                className={cn(
                  "relative p-2.5 sm:p-3 md:p-4 lg:p-5 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm border transition-all duration-500 hover:transform hover:scale-105",
                  plan.popular 
                    ? "border-purple-500/50 ring-2 ring-purple-500/20 shadow-2xl shadow-purple-500/20" 
                    : "border-white/10 hover:border-white/20"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold">
                      {language === 'ar' ? 'الأكثر شعبية' : 'Most Popular'}
                    </div>
                  </div>
                )}

                <div className="text-center mb-3 sm:mb-4 md:mb-5">
                  <h3 className="text-xl sm:text-2xl md:text-xl lg:text-2xl font-bold mb-2 sm:mb-2.5 md:mb-3 text-white">
                    {plan.name}
                  </h3>
                  <div className="mb-1.5 sm:mb-2">
                    <div className="text-sm sm:text-base md:text-sm text-gray-400 mb-0.5">
                      {plan.duration}
                    </div>
                    {plan.discount && (
                      <div className="flex items-center justify-center gap-1.5 mb-1.5">
                        <span className="text-base sm:text-lg md:text-base text-gray-400 line-through">
                          {plan.originalPrice}
                        </span>
                        <span className="bg-red-500 text-white px-1.5 py-0.5 rounded-full text-sm md:text-xs font-bold">
                          -{plan.discount}
                        </span>
                      </div>
                    )}
                    <div className="mb-2.5 sm:mb-3 md:mb-4">
                      <span className={cn(
                        "text-3xl sm:text-4xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r bg-clip-text text-transparent",
                        `bg-gradient-to-r ${plan.gradient}`
                      )}>
                        {plan.price}
                      </span>
                      <span className="text-gray-400 text-base sm:text-lg md:text-base lg:text-lg">
                        {plan.period}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5 sm:space-y-3 mb-4 sm:mb-5">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0" />
                      <span className="text-gray-300 text-base sm:text-lg md:text-base">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={onNavigateToLogin}
                  className={cn(
                    "w-full py-3 sm:py-4 md:py-3 font-bold rounded-xl transition-all duration-300 hover:transform hover:scale-105 text-base sm:text-lg md:text-base",
                    plan.popular
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
                      : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                  )}
                >
                  {language === 'ar' ? 'اختر هذه الخطة' : 'Choose Plan'}
                </Button>
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
