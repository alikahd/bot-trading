import React, { useState } from 'react';
import { ArrowLeft, Mail, Phone, Send, MessageCircle } from 'lucide-react';
import { cn, designSystem } from '../styles/designSystem';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LanguageSelector } from '../components/ui/LanguageSelector';
import { Footer } from '../components/layout/Footer';
import { Header } from '../components/layout/Header';
import { useLanguage } from '../contexts/LanguageContext';

interface ContactPageProps {
  onBack?: () => void;
  onNavigateToLogin?: () => void;
  onNavigateToRegister?: () => void;
  // إضافة معاملات حالة المستخدم
  isAuthenticated?: boolean;
  user?: any;
  onLogout?: () => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ 
  onBack, 
  onNavigateToLogin, 
  onNavigateToRegister,
  isAuthenticated = false,
  user = null,
  onLogout
}) => {
  const { language, t, dir } = useLanguage();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // محاكاة إرسال النموذج
    setTimeout(() => {
      setIsSubmitting(false);
      alert(t('contact.messageSent'));
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 2000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // دالة فتح الدردشة مع الدعم
  const openLiveChat = () => {
    // التحقق من وجود Tawk.to
    if (typeof window !== 'undefined' && (window as any).Tawk_API) {
      (window as any).Tawk_API.toggle();
    } else {
      // إذا لم يكن Tawk متاحاً، اعرض رسالة
      alert(t('contact.chatUnavailable'));
    }
  };

  // بيانات طرق التواصل
  const contactMethods = [
    {
      icon: MessageCircle,
      title: t('contact.liveChatTitle'),
      description: t('contact.liveChatDesc'),
      action: openLiveChat,
      buttonText: t('contact.liveChatButton'),
      color: 'text-emerald-400'
    },
    {
      icon: Mail,
      title: t('contact.emailTitle'),
      description: t('contact.emailDesc'),
      href: 'mailto:support@tradingbot.com',
      buttonText: t('contact.emailButton'),
      color: 'text-blue-400'
    }
  ];



  return (
    <div className={cn(
      designSystem.colors.background.primary,
      "min-h-screen relative overflow-hidden"
    )} dir={dir}>
      
      {/* خلفية متحركة */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
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
                        console.log('ContactPage Mobile Login clicked');
                        onNavigateToLogin && onNavigateToLogin();
                      }}
                      className="relative overflow-hidden px-2.5 text-xs font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-500 hover:via-purple-500 hover:to-indigo-500 text-white rounded-md shadow-xl hover:shadow-2xl hover:shadow-blue-500/50 border border-blue-400/30 hover:border-blue-300/60 backdrop-blur-lg transition-all duration-500 transform hover:scale-105 active:scale-95 flex items-center justify-center" style={{height: '20px', lineHeight: '1', minHeight: '20px'}}>
                      <span className="relative z-10 flex items-center gap-1.5">
                        {language === 'ar' ? 'دخول' : 'Login'}
                      </span>
                    </button>
                  </div>
                  <LanguageSelector variant="mobile" />
                </div>
                <div className="hidden md:flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => {
                        console.log('ContactPage Desktop Login clicked');
                        onNavigateToLogin && onNavigateToLogin();
                      }}
                      className="relative group px-5 py-2.5 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 hover:border-white/50 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg">
                      <span className="relative z-10">{language === 'ar' ? 'تسجيل الدخول' : language === 'en' ? 'Login' : 'Connexion'}</span>
                    </button>
                    <div className="relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-lg blur opacity-40 group-hover:opacity-70 transition duration-300 animate-pulse"></div>
                      <button 
                        onClick={() => {
                          console.log('ContactPage Register clicked');
                          onNavigateToRegister && onNavigateToRegister();
                        }}
                        className="relative px-6 py-2.5 text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 border border-blue-400/50">
                        {language === 'ar' ? 'إنشاء حساب' : language === 'en' ? 'Sign Up' : "S'inscrire"}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <LanguageSelector variant="landing" />
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
            <div className="flex items-center mb-3 sm:mb-4" style={{direction: 'ltr'}}>
              <button
                onClick={onBack}
                className="text-slate-400 hover:text-white transition-colors duration-200 p-2"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
            </div>

            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-r from-emerald-500 to-blue-600 flex items-center justify-center">
                  <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <h1 className={cn(
                  "text-xl sm:text-2xl lg:text-3xl font-bold",
                  designSystem.colors.text.gradient
                )}>
                  {t('contact.title')}
                </h1>
              </div>
              
              <p className={cn(
                "text-xs sm:text-sm leading-relaxed max-w-xl mx-auto",
                designSystem.colors.text.secondary
              )}>
                {t('contact.description')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            
            {/* نموذج التواصل */}
            <Card variant="glass" padding="md">
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-800/50">
                  <Send className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                  <h2 className={cn(
                    "text-base sm:text-lg font-semibold",
                    designSystem.colors.text.primary
                  )}>
                    {t('contact.formTitle')}
                  </h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={cn(
                        "text-xs sm:text-sm",
                        designSystem.colors.text.secondary,
                        "block mb-1"
                      )}>
                        {t('contact.nameLabel')} *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className={cn(
                          "w-full px-3 py-2 rounded-lg border border-slate-700/50",
                          "bg-slate-800/50 backdrop-blur-sm text-sm",
                          designSystem.colors.text.primary,
                          "focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/20",
                          "transition-all duration-200"
                        )}
                        placeholder={t('contact.nameLabel')}
                      />
                    </div>
                    
                    <div>
                      <label className={cn(
                        "text-xs sm:text-sm",
                        designSystem.colors.text.secondary,
                        "block mb-1"
                      )}>
                        {t('contact.emailLabel')} *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className={cn(
                          "w-full px-3 py-2 rounded-lg border border-slate-700/50",
                          "bg-slate-800/50 backdrop-blur-sm text-sm",
                          designSystem.colors.text.primary,
                          "focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/20",
                          "transition-all duration-200"
                        )}
                        placeholder={t('contact.emailLabel')}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={cn(
                      "text-xs sm:text-sm",
                      designSystem.colors.text.secondary,
                      "block mb-1"
                    )}>
                      {t('contact.subjectLabel')} *
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      className={cn(
                        "w-full px-3 py-2 rounded-lg border border-slate-700/50",
                        "bg-slate-800/50 backdrop-blur-sm text-sm",
                        designSystem.colors.text.primary,
                        "focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/20",
                        "transition-all duration-200"
                      )}
                      placeholder={t('contact.subjectLabel')}
                    />
                  </div>

                  <div>
                    <label className={cn(
                      "text-xs sm:text-sm",
                      designSystem.colors.text.secondary,
                      "block mb-1"
                    )}>
                      {t('contact.messageLabel')} *
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={3}
                      className={cn(
                        "w-full px-3 py-2 rounded-lg border border-slate-700/50",
                        "bg-slate-800/50 backdrop-blur-sm resize-none text-sm",
                        designSystem.colors.text.primary,
                        "focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/20",
                        "transition-all duration-200"
                      )}
                      placeholder={t('contact.messageLabel')}
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSubmitting}
                    className="w-full py-2 text-sm"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {t('contact.sending')}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Send className="w-3 h-3" />
                        {t('contact.sendButton')}
                      </div>
                    )}
                  </Button>
                </form>
              </div>
            </Card>

            {/* طرق التواصل */}
            <Card variant="glass" padding="sm">
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800/50">
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <h2 className={cn(
                    "text-sm sm:text-base font-semibold",
                    designSystem.colors.text.primary
                  )}>
                    {t('contact.contactMethods')}
                  </h2>
                </div>

                <div className="space-y-2">
                    {contactMethods.map((method, index) => {
                      const Icon = method.icon;
                      // إذا كان لديه action (مثل الدردشة)، استخدم button
                      if (method.action) {
                        return (
                          <button
                            key={index}
                            onClick={method.action}
                            className={cn(
                              "w-full p-2 sm:p-3 rounded-lg border border-slate-700/50 bg-slate-800/50",
                              "hover:bg-slate-700/50 transition-all duration-200",
                              "flex items-center gap-2 sm:gap-3 text-left group"
                            )}
                          >
                            <div className={cn(
                              "w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center",
                              "bg-emerald-500/10 border border-emerald-500/20"
                            )}>
                              <Icon className={cn("w-4 h-4 sm:w-5 sm:h-5", method.color)} />
                            </div>
                            
                            <div className="flex-1">
                              <h3 className={cn(
                                "text-xs sm:text-sm font-medium",
                                designSystem.colors.text.primary,
                                "group-hover:text-white transition-colors"
                              )}>
                                {method.title}
                              </h3>
                              <p className={cn(
                                "text-xs",
                                designSystem.colors.text.secondary,
                                "mt-0.5"
                              )}>
                                {method.description}
                              </p>
                            </div>
                            
                            <div className={cn(
                              "px-2 py-1 rounded text-xs font-medium",
                              "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            )}>
                              {method.buttonText}
                            </div>
                          </button>
                        );
                      }
                      
                      // إذا كان لديه href (مثل الإيميل)، استخدم link
                      return (
                        <a
                          key={index}
                          href={method.href}
                          className={cn(
                            "w-full p-2 sm:p-3 rounded-lg border border-slate-700/50 bg-slate-800/50",
                            "hover:bg-slate-700/50 transition-all duration-200",
                            "flex items-center gap-2 sm:gap-3 text-left group block"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center",
                            "bg-blue-500/10 border border-blue-500/20"
                          )}>
                            <Icon className={cn("w-4 h-4 sm:w-5 sm:h-5", method.color)} />
                          </div>
                          
                          <div className="flex-1">
                            <h3 className={cn(
                              "text-xs sm:text-sm font-medium",
                              designSystem.colors.text.primary,
                              "group-hover:text-white transition-colors"
                            )}>
                              {method.title}
                            </h3>
                            <p className={cn(
                              "text-xs",
                              designSystem.colors.text.secondary,
                              "mt-0.5"
                            )}>
                              {method.description}
                            </p>
                          </div>
                          
                          <div className={cn(
                            "px-2 py-1 rounded text-xs font-medium",
                            "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          )}>
                            {method.buttonText}
                          </div>
                        </a>
                      );
                    })}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
      
      {/* الفوتر */}
      <Footer />
    </div>
  );
};
