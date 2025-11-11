import React, { useRef } from 'react';
import { Mail, Send } from 'lucide-react';
import { cn, designSystem } from '../../styles/designSystem';
import { useLanguage } from '../../contexts/LanguageContext';
import { InstallButton } from '../common/InstallButton';

// أيقونة Facebook
const FacebookIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    className={className}
    fill="currentColor"
  >
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

// أيقونة Instagram
const InstagramIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    className={className}
    fill="currentColor"
  >
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

// أيقونة TikTok
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    className={className}
    fill="currentColor"
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
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
      name: 'Facebook',
      icon: FacebookIcon,
      url: 'https://www.facebook.com/Bootradin/',
      color: 'text-blue-500 hover:text-blue-400'
    },
    {
      name: 'Instagram',
      icon: InstagramIcon,
      url: 'https://www.instagram.com/boottrading/',
      color: 'text-pink-500 hover:text-pink-400'
    },
    {
      name: 'TikTok',
      icon: TikTokIcon,
      url: 'https://www.tiktok.com/@booTradiing',
      color: 'text-white hover:text-gray-200'
    },
    {
      name: t('footer.telegram'),
      icon: Send,
      url: 'https://t.me/+SFFdtRiK3eQwYjU0',
      color: 'text-blue-400 hover:text-blue-300'
    },
    {
      name: t('footer.email'),
      icon: Mail,
      url: 'mailto:support@BooTrading.com',
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

          {/* زر التثبيت وأيقونات التواصل */}
          <div className="flex flex-col items-center gap-3 lg:flex-1 lg:justify-end lg:flex-row lg:gap-2">
            {/* أيقونات التواصل */}
            <div className="flex items-center gap-2">
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
            
            {/* زر التثبيت - يظهر أسفل الأيقونات في الهواتف */}
            <div className="lg:hidden">
              <InstallButton />
            </div>
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
