import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { cn } from '../../styles/designSystem';
import { useLanguage, Language } from '../../contexts/LanguageContext';

interface LanguageSelectorProps {
  variant?: 'default' | 'mobile' | 'landing';
  className?: string;
  onLanguageChange?: () => void;
}

const languageOptions = [
  { 
    code: 'ar' as Language, 
    name: 'العربية', 
    flag: '🇸🇦',
    shortName: 'AR'
  },
  { 
    code: 'en' as Language, 
    name: 'English', 
    flag: '🇺🇸',
    shortName: 'EN'
  },
  { 
    code: 'fr' as Language, 
    name: 'Français', 
    flag: '🇫🇷',
    shortName: 'FR'
  }
];

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  variant = 'default',
  className,
  onLanguageChange
}) => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = languageOptions.find(lang => lang.code === language);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (langCode: Language) => {
    setLanguage(langCode);
    setIsOpen(false);
    if (onLanguageChange) {
      onLanguageChange();
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'mobile':
        return {
          // حجم مضغوط للهاتف لعرض الرمز المختصر والسهم
          button: "hover:bg-slate-800/60 px-2 py-1 sm:px-3 sm:py-2 min-w-[45px] sm:min-w-[50px] h-8 sm:h-9 flex items-center gap-1 justify-center bg-gradient-to-r from-slate-800/80 to-slate-700/80 hover:from-slate-700/90 hover:to-slate-600/90 backdrop-blur-sm border border-slate-600/50 hover:border-slate-500/70 rounded-lg text-white text-xs font-medium transition-all duration-300 shadow-lg hover:shadow-xl",
          // قائمة للهاتف تظهر من اليسار لتجنب الاختفاء
          dropdown: "absolute top-full left-0 mt-1 w-36 bg-gradient-to-br from-slate-900/98 to-slate-800/98 backdrop-blur-xl border border-slate-600/50 rounded-lg shadow-2xl z-50",
          option: "flex items-center gap-2 px-3 py-2 text-xs text-white hover:bg-slate-700/60 transition-all duration-200 rounded-md mx-1 my-0.5"
        };
      case 'landing':
        return {
          // حجم مناسب لصفحة الهبوط - أصغر على الهواتف
          button: "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 backdrop-blur-sm border border-blue-400/40 hover:border-blue-300/60 rounded-lg px-2 py-1.5 sm:px-4 sm:py-2 text-white text-xs sm:text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 min-w-[60px] sm:min-w-[110px] flex items-center gap-1 sm:gap-2 justify-center",
          // قائمة متوسطة لصفحة الهبوط
          dropdown: "absolute top-full right-0 mt-2 w-32 sm:w-40 bg-gradient-to-br from-slate-900/98 to-blue-900/98 backdrop-blur-xl border border-blue-400/30 rounded-xl shadow-2xl z-50",
          option: "flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-white hover:bg-blue-600/30 transition-all duration-200 rounded-lg mx-1 sm:mx-2 my-1"
        };
      default:
        return {
          // نفس حجم الزر الحالي للكمبيوتر
          button: "hover:bg-slate-800/60 p-1 sm:p-2 min-w-[32px] sm:min-w-[36px] h-8 sm:h-9 flex items-center justify-center bg-gradient-to-r from-slate-800/80 to-slate-700/80 hover:from-slate-700/90 hover:to-slate-600/90 backdrop-blur-sm border border-slate-600/50 hover:border-slate-500/70 rounded-lg text-white text-xs font-medium transition-all duration-300 shadow-lg hover:shadow-xl",
          // قائمة متوسطة للكمبيوتر تظهر للداخل قليلاً
          dropdown: "absolute top-full right-2 mt-2 w-36 bg-gradient-to-br from-slate-900/98 to-slate-800/98 backdrop-blur-xl border border-slate-600/50 rounded-xl shadow-2xl z-50",
          option: "flex items-center gap-2 px-3 py-2 text-xs text-white hover:bg-slate-700/60 transition-all duration-200 rounded-lg mx-2 my-1"
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {/* زر القائمة */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          styles.button,
          "focus:outline-none focus:ring-2 focus:ring-blue-400/50 group"
        )}
      >
        {variant === 'mobile' ? (
          // للهواتف: رمز اللغة المختصر مع السهم
          <>
            <span className="uppercase font-bold text-xs">{currentLanguage?.shortName}</span>
            <ChevronDown 
              className={cn(
                "w-3 h-3 transition-transform duration-300",
                isOpen && "rotate-180"
              )} 
            />
          </>
        ) : variant === 'default' ? (
          // للكمبيوتر: اختصار اللغة فقط
          <span className="uppercase font-bold">
            {currentLanguage?.shortName}
          </span>
        ) : (
          // لصفحة الهبوط: أيقونة مع النص - مضغوط للهواتف
          <>
            <Globe className="w-3 h-3 sm:w-4 sm:h-4 group-hover:rotate-12 transition-transform duration-300" />
            <span className="hidden sm:inline">{currentLanguage?.name}</span>
            <span className="sm:hidden uppercase font-bold text-xs">{currentLanguage?.shortName}</span>
            <ChevronDown 
              className={cn(
                "w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-300",
                isOpen && "rotate-180"
              )} 
            />
          </>
        )}
      </button>

      {/* القائمة المنسدلة */}
      {isOpen && (
        <div className={styles.dropdown}>
          <div className="py-2">
            {languageOptions.map((option) => (
              <button
                key={option.code}
                onClick={() => handleLanguageChange(option.code)}
                className={cn(
                  styles.option,
                  "w-full text-left relative group/item",
                  language === option.code && "bg-blue-600/40"
                )}
              >
                {variant === 'mobile' ? (
                  // للهواتف: العلم مع اسم اللغة الكامل
                  <>
                    <span className="text-sm">{option.flag}</span>
                    <span className="font-medium text-xs">{option.name}</span>
                    {language === option.code && (
                      <Check className="w-3 h-3 text-blue-400 ml-auto" />
                    )}
                  </>
                ) : variant === 'default' ? (
                  // للكمبيوتر: العلم مع الاسم
                  <>
                    <span className="text-sm">{option.flag}</span>
                    <span className="font-medium text-xs">{option.name}</span>
                    {language === option.code && (
                      <Check className="w-3 h-3 text-blue-400 ml-auto" />
                    )}
                  </>
                ) : (
                  // لصفحة الهبوط: العلم مع الاسم الكامل
                  <>
                    <span className="text-lg">{option.flag}</span>
                    <span className="font-medium">{option.name}</span>
                    {language === option.code && (
                      <Check className="w-4 h-4 text-blue-400 ml-auto" />
                    )}
                  </>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
