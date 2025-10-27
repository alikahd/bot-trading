import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

interface LoginButtonProps {
  onClick: () => void;
  variant?: 'mobile' | 'desktop';
  className?: string;
}

export const LoginButton: React.FC<LoginButtonProps> = ({ 
  onClick, 
  variant = 'desktop',
  className = '' 
}) => {
  const { language } = useLanguage();

  if (variant === 'mobile') {
    return (
      <div className="relative group">
        {/* Glow Effect الخارجي */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 rounded-lg blur opacity-40 group-hover:opacity-70 group-active:opacity-80 transition-all duration-300"></div>
        
        <button 
          onClick={onClick}
          className={`btn-sm relative overflow-hidden px-2.5 py-1.5 text-xs font-bold bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-lg shadow-xl hover:shadow-blue-500/50 border border-blue-400/40 hover:border-blue-400/70 backdrop-blur-xl transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-1.5 ${className}`}
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
    );
  }

  // Desktop variant
  return (
    <button 
      onClick={onClick}
      className={`relative group px-5 py-2.5 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 hover:border-white/50 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg ${className}`}
    >
      <span className="relative z-10">{language === 'ar' ? 'تسجيل الدخول' : language === 'en' ? 'Login' : 'Connexion'}</span>
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
    </button>
  );
};
