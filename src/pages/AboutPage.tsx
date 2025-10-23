import React from 'react';
import { ArrowLeft, Users, Target, Award, TrendingUp, Shield, Zap, Globe, Heart, Star } from 'lucide-react';
import { cn, designSystem } from '../styles/designSystem';
import { Card } from '../components/ui/Card';
import { Footer } from '../components/layout/Footer';
import { Header } from '../components/layout/Header';
import { useLanguage } from '../contexts/LanguageContext';

interface AboutPageProps {
  onBack?: () => void;
  onNavigateToLogin?: () => void;
  onNavigateToRegister?: () => void;
  // إضافة معاملات حالة المستخدم
  isAuthenticated?: boolean;
  user?: any;
  onLogout?: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ 
  onBack, 
  onNavigateToLogin, 
  onNavigateToRegister,
  isAuthenticated = false,
  user = null,
  onLogout
}) => {
  const { language, setLanguage, t, dir } = useLanguage();
  
  const features = [
    {
      icon: TrendingUp,
      title: t('about.features.analysis.title'),
      description: t('about.features.analysis.desc'),
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10'
    },
    {
      icon: Shield,
      title: t('about.features.security.title'),
      description: t('about.features.security.desc'),
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10'
    },
    {
      icon: Zap,
      title: t('about.features.speed.title'),
      description: t('about.features.speed.desc'),
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10'
    },
    {
      icon: Globe,
      title: t('about.features.coverage.title'),
      description: t('about.features.coverage.desc'),
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10'
    }
  ];

  const stats = [
    {
      icon: Users,
      number: '50,000+',
      label: t('about.stats.activeTraders'),
      color: 'text-blue-400'
    },
    {
      icon: TrendingUp,
      number: '85%',
      label: t('about.stats.successRate'),
      color: 'text-emerald-400'
    },
    {
      icon: Award,
      number: '24/7',
      label: t('about.stats.support'),
      color: 'text-amber-400'
    },
    {
      icon: Star,
      number: '4.9/5',
      label: t('about.stats.userRating'),
      color: 'text-purple-400'
    }
  ];


  const values = [
    {
      icon: Heart,
      title: t('about.values.transparency.title'),
      description: t('about.values.transparency.desc')
    },
    {
      icon: Shield,
      title: t('about.values.reliability.title'),
      description: t('about.values.reliability.desc')
    },
    {
      icon: Target,
      title: t('about.values.excellence.title'),
      description: t('about.values.excellence.desc')
    }
  ];

  return (
    <div className={cn(
      designSystem.colors.background.primary,
      "min-h-screen relative overflow-hidden"
    )} dir={dir}>
      
      {/* خلفية متحركة */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10">
        {/* Header area */}
        {isAuthenticated ? (
          <Header 
            isConnected={false}
            onToggleBot={() => {}}
            onOpenDataSource={() => {}}
            onOpenRealDataPanel={() => {}}
            user={user}
            onLogout={onLogout}
          />
        ) : (
          <header className="relative z-50 bg-black/15 backdrop-blur-lg border-b border-white/10">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="md:hidden relative w-40 h-40 sm:w-44 sm:h-44 pointer-events-auto cursor-pointer" onClick={onBack}>
                <img src="/images/logo.png" alt="Bot Trading" loading="eager" decoding="sync" className="w-full h-full object-contain drop-shadow-2xl" />
              </div>
              <div className="hidden md:block relative w-52 h-52 lg:w-64 lg:h-64 xl:w-72 xl:h-72 pointer-events-auto cursor-pointer" onClick={onBack}>
                <img src="/images/logo.png" alt="Bot Trading" loading="eager" decoding="sync" className="w-full h-full object-contain drop-shadow-2xl hover:scale-110 transition-transform duration-300" />
              </div>
            </div>
            <div className="px-3 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-6 md:py-5">
              <div className="max-w-7xl mx-auto">
                <div className="flex md:hidden items-center justify-between gap-2">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-lg blur-sm opacity-40 group-hover:opacity-70 animate-pulse transition-opacity duration-300"></div>
                    <button 
                      onClick={() => {
                        console.log('AboutPage: Mobile Login button clicked');
                        onNavigateToLogin && onNavigateToLogin();
                      }}
                      className="relative overflow-hidden px-2.5 text-xs font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-500 hover:via-purple-500 hover:to-indigo-500 text-white rounded-md shadow-xl hover:shadow-2xl hover:shadow-blue-500/50 border border-blue-400/30 hover:border-blue-300/60 backdrop-blur-lg transition-all duration-500 transform hover:scale-105 active:scale-95 flex items-center justify-center" style={{height: '20px', lineHeight: '1', minHeight: '20px'}}>
                      <span className="relative z-10 flex items-center gap-1.5">
                        {language === 'ar' ? 'دخول' : 'Login'}
                      </span>
                    </button>
                  </div>
                  <select value={language} onChange={(e) => setLanguage(e.target.value as 'ar' | 'en' | 'fr')} className="bg-transparent hover:bg-white/5 backdrop-blur-sm border border-white/20 hover:border-white/40 rounded-md px-2 py-0.5 text-white text-[10px] font-medium focus:outline-none focus:ring-1 focus:ring-white/30 transition-all duration-300 cursor-pointer text-center">
                    <option value="ar" style={{background: 'transparent', color: 'white', padding: '6px', fontSize: '10px'}}>AR</option>
                    <option value="en" style={{background: 'transparent', color: 'white', padding: '6px', fontSize: '10px'}}>EN</option>
                    <option value="fr" style={{background: 'transparent', color: 'white', padding: '6px', fontSize: '10px'}}>FR</option>
                  </select>
                </div>
                <div className="hidden md:flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => {
                        console.log('AboutPage: Desktop Login button clicked');
                        onNavigateToLogin && onNavigateToLogin();
                      }}
                      className="relative group px-5 py-2.5 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 hover:border-white/50 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg">
                      <span className="relative z-10">{language === 'ar' ? 'تسجيل الدخول' : language === 'en' ? 'Login' : 'Connexion'}</span>
                    </button>
                    <div className="relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-lg blur opacity-40 group-hover:opacity-70 transition duration-300 animate-pulse"></div>
                      <button 
                        onClick={() => {
                          console.log('AboutPage: Desktop Register button clicked');
                          onNavigateToRegister && onNavigateToRegister();
                        }}
                        className="relative px-6 py-2.5 text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 border border-blue-400/50">
                        {language === 'ar' ? 'إنشاء حساب' : language === 'en' ? 'Sign Up' : "S'inscrire"}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <select value={language} onChange={(e) => setLanguage(e.target.value as 'ar' | 'en' | 'fr')} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 backdrop-blur-sm border border-blue-400/40 hover:border-blue-300/60 rounded-lg px-4 py-2 text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-300 cursor-pointer min-w-[110px] text-center shadow-lg hover:shadow-xl">
                      <option value="ar" style={{background: '#1e3a8a', color: 'white', padding: '12px', fontWeight: '600'}}>العربية</option>
                      <option value="en" style={{background: '#1e3a8a', color: 'white', padding: '12px', fontWeight: '600'}}>English</option>
                      <option value="fr" style={{background: '#1e3a8a', color: 'white', padding: '12px', fontWeight: '600'}}>Français</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </header>
        )}

        <div className={cn(designSystem.layout.container, "py-3 sm:py-6")}>
          
          {/* Header */}
          <div className="mb-3 sm:mb-5">
            {/* شريط التنقل العلوي */}
            <div className="flex items-center justify-start mb-3 sm:mb-4" dir="ltr">
              <button
                onClick={onBack}
                className="text-slate-400 hover:text-white transition-colors duration-200 p-2"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
            </div>

            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-600 flex items-center justify-center">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <h1 className={cn(
                  "text-xl sm:text-2xl lg:text-3xl font-bold",
                  designSystem.colors.text.gradient
                )}>
                  {t('about.title')}
                </h1>
              </div>
              
              <p className={cn(
                "text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto",
                designSystem.colors.text.secondary
              )}>
                {t('about.description')}
              </p>
            </div>
          </div>

          {/* رؤيتنا ورسالتنا */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <Card variant="glass" padding="md" className="h-full">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                  <h2 className={cn(
                    "text-base sm:text-lg font-semibold",
                    designSystem.colors.text.primary
                  )}>
                    {t('about.vision.title')}
                  </h2>
                </div>
                <p className={cn(
                  "text-xs sm:text-sm leading-relaxed",
                  designSystem.colors.text.secondary
                )}>
                  {t('about.vision.content')}
                </p>
              </div>
            </Card>

            <Card variant="glass" padding="md" className="h-full">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                  <h2 className={cn(
                    "text-base sm:text-lg font-semibold",
                    designSystem.colors.text.primary
                  )}>
                    {t('about.mission.title')}
                  </h2>
                </div>
                <p className={cn(
                  "text-xs sm:text-sm leading-relaxed",
                  designSystem.colors.text.secondary
                )}>
                  {t('about.mission.content')}
                </p>
              </div>
            </Card>
          </div>

          {/* الميزات الرئيسية */}
          <div className="mb-6 sm:mb-8">
            <div className="text-center mb-4 sm:mb-6">
              <h2 className={cn(
                "text-lg sm:text-xl font-bold",
                designSystem.colors.text.primary,
                "mb-2"
              )}>
                {t('about.whyDifferent')}
              </h2>
              <p className={cn(
                "text-xs sm:text-sm",
                designSystem.colors.text.secondary
              )}>
                {t('about.whyDifferentDesc')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card key={index} variant="glass" padding="sm" className="text-center h-full">
                    <div className="space-y-2 sm:space-y-3">
                      <div className={cn(
                        "w-10 h-10 sm:w-12 sm:h-12 rounded-xl mx-auto flex items-center justify-center",
                        feature.bgColor
                      )}>
                        <Icon className={cn("w-5 h-5 sm:w-6 sm:h-6", feature.color)} />
                      </div>
                      <h3 className={cn(
                        "text-sm sm:text-base font-semibold",
                        designSystem.colors.text.primary
                      )}>
                        {feature.title}
                      </h3>
                      <p className={cn(
                        "text-xs sm:text-sm leading-relaxed",
                        designSystem.colors.text.secondary
                      )}>
                        {feature.description}
                      </p>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* الإحصائيات */}
          <Card variant="elevated" padding="md" className="mb-6 sm:mb-8">
            <div className="text-center mb-4 sm:mb-6">
              <h2 className={cn(
                "text-lg sm:text-xl font-bold",
                designSystem.colors.text.primary,
                "mb-2"
              )}>
                {t('about.achievements')}
              </h2>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Icon className={cn("w-5 h-5 sm:w-6 sm:h-6", stat.color)} />
                    </div>
                    <div className={cn(
                      "text-lg sm:text-xl lg:text-2xl",
                      stat.color,
                      "font-bold mb-1"
                    )}>
                      {stat.number}
                    </div>
                    <div className={cn(
                      "text-xs sm:text-sm",
                      designSystem.colors.text.secondary
                    )}>
                      {stat.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>


          {/* القيم */}
          <Card variant="glass" padding="md">
            <div className="text-center mb-4 sm:mb-6">
              <h2 className={cn(
                "text-lg sm:text-xl font-bold",
                designSystem.colors.text.primary,
                "mb-2"
              )}>
                {t('about.coreValues')}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {values.map((value, index) => {
                const Icon = value.icon;
                return (
                  <div key={index} className="text-center space-y-2 sm:space-y-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-800/50 mx-auto flex items-center justify-center">
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />
                    </div>
                    <h3 className={cn(
                      "text-sm sm:text-base font-semibold",
                      designSystem.colors.text.primary
                    )}>
                      {value.title}
                    </h3>
                    <p className={cn(
                      "text-xs sm:text-sm leading-relaxed",
                      designSystem.colors.text.secondary
                    )}>
                      {value.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
      
      {/* الفوتر */}
      <Footer />
    </div>
  );
};
