import React, { useRef } from 'react';
import { Mail, Send } from 'lucide-react';
import { cn, designSystem } from '../../styles/designSystem';
import { useLanguage } from '../../contexts/LanguageContext';
import { InstallButton } from '../common/InstallButton';

// أيقونة ديسكورد المخصصة
const DiscordIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    className={className}
    fill="currentColor"
  >
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.210 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

interface FooterProps {
  onNavigate?: (page: 'terms' | 'contact' | 'about') => void;
}

// دالة عامة للتنقل يمكن استخدامها من أي مكان
const globalNavigate = (page: 'terms' | 'contact' | 'about') => {
  // إنشاء حدث مخصص لإشعار التطبيق الرئيسي
  const event = new CustomEvent('footerNavigate', { 
    detail: { page } 
  });
  window.dispatchEvent(event);
};

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();
  const isProcessingRef = useRef(false);
  
  // دالة للتنقل الفوري - تستبدل الصفحة بالكامل
  const handleNavigate = (page: 'terms' | 'contact' | 'about') => {

    // منع التنفيذ المتعدد
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    
    // الانتقال لأعلى الصفحة فوراً بدون تمرير
    window.scrollTo(0, 0);
    
    setTimeout(() => {
      isProcessingRef.current = false;
    }, 1000);
    
    if (onNavigate) {

      onNavigate(page);
    } else {

      // استخدام النظام العام للتنقل
      globalNavigate(page);
    }
  };

  const socialLinks = [
    {
      name: t('footer.telegram'),
      icon: Send,
      url: 'https://t.me/yourusername',
      color: 'text-blue-400 hover:text-blue-300'
    },
    {
      name: t('footer.discord'),
      icon: DiscordIcon,
      url: 'https://discord.gg/yourserver',
      color: 'text-indigo-400 hover:text-indigo-300'
    },
    {
      name: t('footer.email'),
      icon: Mail,
      url: 'mailto:info@tradingbot.com',
      color: 'text-purple-400 hover:text-purple-300'
    }
  ];

  const footerLinks = [
    {
      title: t('footer.terms'),
      action: () => handleNavigate('terms')
    },
    {
      title: t('footer.contact'),
      action: () => handleNavigate('contact')
    },
    {
      title: t('footer.about'),
      action: () => handleNavigate('about')
    }
  ];

  return (
    <footer className={cn(
      designSystem.colors.background.card,
      'relative overflow-hidden'
    )} dir="rtl">
      {/* تأثير الانتقال العلوي المحسن */}
      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-transparent via-slate-800/30 to-slate-900/60" />
      
      {/* خط متدرج أنيق */}
      <div className="absolute top-0 left-0 right-0 h-1 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-transparent via-blue-500/60 via-purple-500/60 via-cyan-500/60 to-transparent animate-pulse opacity-90" />
      </div>

      {/* نقاط متحركة محسنة */}
      <div className="absolute top-4 left-0 right-0 flex justify-center space-x-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 opacity-70 animate-bounce shadow-lg`}
            style={{
              animationDelay: `${i * 0.2}s`,
              animationDuration: `${2 + i * 0.3}s`
            }}
          />
        ))}
      </div>

      {/* خطوط ديكورية محسنة */}
      <div className="absolute top-2 left-0 right-0 flex justify-between px-8">
        <div className="w-10 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent animate-pulse" />
        <div className="w-14 h-px bg-gradient-to-r from-transparent via-purple-400/40 to-transparent animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="w-8 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* الخلفية الرئيسية المحسنة */}
      <div className="relative border-t border-slate-700/60 backdrop-blur-md bg-gradient-to-r from-slate-900/98 via-slate-800/98 to-slate-900/98 shadow-2xl">
        <div className="container mx-auto px-4 py-8 mt-8 pb-20 sm:pb-24 md:pb-28 lg:pb-8">
        <div className="flex flex-col lg:flex-row items-center gap-4 mb-4">
          
          {/* الروابط */}
          <div className="flex flex-nowrap justify-center items-center gap-2 sm:gap-3 md:gap-4 lg:flex-1 relative z-20">
            {footerLinks.map((link, index) => (
              <button
                key={index}
                onClick={link.action}
                className={cn(
                  'btn-sm text-sm xs:text-base sm:text-base md:text-lg lg:text-base font-semibold transition-all duration-500 transform hover:scale-105 active:scale-95',
                  'relative group px-4 xs:px-5 sm:px-6 md:px-5 lg:px-4 py-3 xs:py-3.5 sm:py-4 md:py-3 lg:py-2.5 rounded-lg sm:rounded-xl',
                  'cursor-pointer touch-manipulation select-none text-center whitespace-nowrap',
                  designSystem.colors.text.secondary,
                  'bg-slate-800/40 hover:bg-gradient-to-r hover:from-blue-500/30 hover:to-purple-500/30',
                  'active:bg-gradient-to-r active:from-blue-600/40 active:to-purple-600/40',
                  'border border-slate-700/50 hover:border-blue-400/50',
                  'shadow-md sm:shadow-lg shadow-slate-900/50 hover:shadow-blue-500/30 hover:shadow-xl',
                  'backdrop-blur-md'
                )}
                style={{ 
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation'
                }}
              >
                {/* خلفية متحركة */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg sm:rounded-xl" />
                <span className="relative z-10 pointer-events-none">{link.title}</span>
              </button>
            ))}
          </div>

          {/* اللوغو في المنتصف */}
          <div className="flex items-center justify-center lg:flex-none order-first lg:order-none mb-6 lg:mb-4 -mt-6">
            {/* تصميم للهواتف - مع حاوية مضيئة */}
            <div className="md:hidden relative group">
              {/* خلفية متحركة مع Glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-cyan-500/30 rounded-2xl blur-2xl opacity-60 group-hover:opacity-100 transition-all duration-700 animate-pulse" />
              
              {/* حاوية اللوغو مع حدود مضيئة */}
              <div className="relative h-12 w-auto flex-shrink-0 p-1 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 shadow-2xl">
                <img 
                  src="/images/logo.png" 
                  alt={t('footer.logoAlt')} 
                  loading="eager"
                  decoding="sync"
                  className="h-full w-auto object-contain drop-shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
                  style={{ minWidth: '40px', minHeight: '40px' }}
                />
              </div>
            </div>

            {/* تصميم للكمبيوتر - مع حاوية مضيئة متقدمة */}
            <div className="hidden md:block relative group">
              {/* خلفية متحركة مع Glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-cyan-500/30 rounded-2xl blur-2xl opacity-60 group-hover:opacity-100 transition-all duration-700 animate-pulse" />
              
              {/* حاوية اللوغو مع حدود مضيئة */}
              <div className="relative h-12 sm:h-14 lg:h-16 w-auto flex-shrink-0 p-1 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 shadow-2xl">
                <img 
                  src="/images/logo.png" 
                  alt={t('footer.logoAlt')} 
                  loading="eager"
                  decoding="sync"
                  className="h-full w-auto object-contain drop-shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
                  style={{ minWidth: '48px', minHeight: '48px' }}
                />
              </div>
            </div>
          </div>

          {/* فراغ للفصل */}
          <div className="flex-1 lg:hidden"></div>

          {/* أيقونات التواصل وزر التثبيت */}
          <div className="flex items-center gap-2 lg:flex-1 lg:justify-end">
            {/* زر تثبيت التطبيق - يظهر فقط على الهواتف */}
            <InstallButton className="mr-2 lg:hidden" />
            
            {socialLinks.map((social, index) => {
              const Icon = social.icon;
              return (
                <a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'p-3 rounded-2xl transition-all duration-500 transform hover:scale-125 hover:-translate-y-1',
                    'border border-slate-600/40 backdrop-blur-md',
                    'hover:border-blue-400/50 hover:shadow-2xl hover:shadow-blue-500/30',
                    'bg-gradient-to-br from-slate-800/60 to-slate-900/60',
                    'hover:from-slate-700/80 hover:to-slate-800/80',
                    social.color,
                    'group relative overflow-hidden shadow-lg'
                  )}
                  title={social.name}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Icon className="w-5 h-5 relative z-10 drop-shadow-sm" />
                </a>
              );
            })}
          </div>
        </div>

        {/* حقوق الملكية */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/20 via-purple-500/20 to-transparent h-px" />
          <div className={cn(
            'text-xs sm:text-sm text-center pt-4 font-semibold tracking-wider',
            'bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent',
            'drop-shadow-sm px-2 leading-relaxed'
          )}>
            © {currentYear} {t('footer.copyright')}
          </div>
        </div>
        </div>
      </div>
    </footer>
  );
};
