import React from 'react';
import { ArrowLeft, Shield, AlertTriangle, FileText, Scale, Calendar } from 'lucide-react';
import { cn, designSystem } from '../styles/designSystem';
import { Card } from '../components/ui/Card';
import { Footer } from '../components/layout/Footer';
import { Header } from '../components/layout/Header';
import { useLanguage } from '../contexts/LanguageContext';

interface TermsPageProps {
  onBack?: () => void;
  onNavigateToLogin?: () => void;
  onNavigateToRegister?: () => void;
  // إضافة معاملات حالة المستخدم
  isAuthenticated?: boolean;
  user?: any;
  onLogout?: () => void;
}

export const TermsPage: React.FC<TermsPageProps> = ({ 
  onBack, 
  onNavigateToLogin, 
  onNavigateToRegister,
  isAuthenticated = false,
  user = null,
  onLogout
}) => {
  const { language, setLanguage, t, dir } = useLanguage();
  
  // تاريخ آخر تحديث باللاتيني
  const lastUpdated = "January 15, 2025";
  
  // المحتوى المترجم والمضغوط
  const sections = [
    {
      id: 'acceptance',
      title: t('terms.acceptance.title'),
      icon: FileText,
      content: t('terms.acceptance.content')
    },
    {
      id: 'services',
      title: t('terms.services.title'),
      icon: Shield,
      content: t('terms.services.content')
    },
    {
      id: 'risks',
      title: t('terms.risks.title'),
      icon: AlertTriangle,
      content: t('terms.risks.content')
    },
    {
      id: 'responsibilities',
      title: t('terms.responsibilities.title'),
      icon: Scale,
      content: t('terms.responsibilities.content')
    }
  ];

  return (
    <div className={cn(
      designSystem.colors.background.primary,
      "min-h-screen relative overflow-hidden"
    )} dir={dir}>
      
      {/* خلفية متحركة */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
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
                        console.log('TermsPage Mobile Login clicked');
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
                        console.log('TermsPage Desktop Login clicked');
                        onNavigateToLogin && onNavigateToLogin();
                      }}
                      className="relative group px-5 py-2.5 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 hover:border-white/50 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg">
                      <span className="relative z-10">{language === 'ar' ? 'تسجيل الدخول' : language === 'en' ? 'Login' : 'Connexion'}</span>
                    </button>
                    <div className="relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-lg blur opacity-40 group-hover:opacity-70 transition duration-300 animate-pulse"></div>
                      <button 
                        onClick={() => {
                          console.log('TermsPage Register clicked');
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
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <h1 className={cn(
                  "text-xl sm:text-2xl lg:text-3xl font-bold",
                  designSystem.colors.text.gradient
                )}>
                  {t('terms.title')}
                </h1>
              </div>
              
              {/* تاريخ آخر تحديث */}
              <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-400">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>{t('terms.lastUpdated')} {lastUpdated}</span>
              </div>
            </div>
          </div>

          {/* المحتوى المضغوط */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <Card key={section.id} variant="glass" padding="sm" className="h-full">
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                        <Icon className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                      </div>
                      <h3 className={cn(
                        "text-sm sm:text-base font-semibold",
                        designSystem.colors.text.primary
                      )}>
                        {section.title}
                      </h3>
                    </div>
                    
                    <p className={cn(
                      "text-xs sm:text-sm leading-relaxed",
                      designSystem.colors.text.secondary
                    )}>
                      {section.content}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>

        </div>
      </div>
      
      {/* الفوتر */}
      <Footer />
    </div>
  );
};
