import React, { useState, useEffect } from 'react';
import { Bot, Lock, User, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Footer } from '../layout/Footer';
import { BotLoadingAnimation } from '../common/BotLoadingAnimation';
import { supabase } from '../../config/supabaseClient';

interface LoginPageProps {
  onLogin: (credentials: { username: string; password: string }) => Promise<boolean>;
  onNavigateToSubscription?: () => void;
  onNavigateToRegister?: () => void;
  onNavigateToPasswordReset?: () => void;
  onBack?: () => void;
  isLoading: boolean;
  error: string | null;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onNavigateToRegister, onNavigateToPasswordReset, onBack, isLoading, error }) => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [googleLoading, setGoogleLoading] = useState(false);
  const { t, dir } = useLanguage();

  // منع الرجوع للخلف باستخدام زر المتصفح/الهاتف
  useEffect(() => {
    // إضافة حالة جديدة للتاريخ عند تحميل الصفحة
    window.history.pushState({ page: 'login', preventBack: true }, '', window.location.pathname);

    const handlePopState = (event: PopStateEvent) => {
      // إذا حاول المستخدم الرجوع، نمنعه ونعيده للأمام
      if (event.state?.preventBack) {
        window.history.pushState({ page: 'login', preventBack: true }, '', window.location.pathname);

      }
    };

    // الاستماع لحدث الرجوع
    window.addEventListener('popstate', handlePopState);

    // التنظيف عند إلغاء تحميل المكون
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // التحقق من الحقول
    const errors: Record<string, string> = {};
    
    if (!credentials.username) {
      errors.username = t('login.error.usernameRequired');
    }
    
    if (!credentials.password) {
      errors.password = t('login.error.passwordRequired');
    }
    
    setValidationErrors(errors);
    
    if (Object.keys(errors).length === 0) {
      await onLogin(credentials);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
    
    // مسح خطأ التحقق عند الكتابة
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // معالجة تسجيل الدخول بواسطة Google
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {

        alert(t('login.error.googleFailed'));
      }
      // سيتم التوجيه تلقائياً بواسطة Supabase
    } catch (error) {

      alert(t('login.error.googleFailed'));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 dark:from-gray-900 dark:via-blue-900 dark:to-gray-900 from-slate-50 via-blue-50 to-slate-100 flex flex-col">
      {/* زر العودة */}
      {onBack && (
        <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-10">
          <button
            onClick={onBack}
            className="text-white hover:text-blue-300 transition-colors duration-200 p-2"
            aria-label="العودة"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* خلفية متحركة */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 sm:-top-40 sm:-right-40 w-40 h-40 sm:w-80 sm:h-80 bg-blue-500 dark:bg-blue-500 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 sm:-bottom-40 sm:-left-40 w-40 h-40 sm:w-80 sm:h-80 bg-green-500 dark:bg-green-500 bg-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-20 left-20 sm:top-40 sm:left-40 w-40 h-40 sm:w-80 sm:h-80 bg-purple-500 dark:bg-purple-500 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      </div>

      {/* المحتوى الرئيسي */}
      <div className="flex-1 flex items-center justify-center p-2 sm:p-3">
        <div className="relative w-full max-w-sm sm:max-w-md mx-2 sm:mx-0">
        {/* شعار البوت */}
        <div className="text-center mb-4 sm:mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-18 sm:h-18 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full shadow-2xl mb-2 sm:mb-3">
            <Bot className="w-7 h-7 sm:w-9 sm:h-9 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white dark:text-white text-slate-900 mb-1">{t('login.title')}</h1>
          <p className="text-xs sm:text-sm text-blue-200 dark:text-blue-200 text-blue-600">{t('login.subtitle')}</p>
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <span className="text-xs text-green-400 font-medium">📈 {t('login.winRate')}</span>
          </div>
        </div>

        {/* نموذج تسجيل الدخول */}
        <div className="bg-white/10 backdrop-blur-lg dark:bg-white/10 bg-black/10 rounded-2xl shadow-2xl border border-white/20 dark:border-white/20 border-black/20 p-3 sm:p-5">
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-white dark:text-white text-slate-900 mb-1 sm:mb-1.5">
                {t('login.username')}
              </label>
              <div className="relative">
                <User 
                  className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-400 text-gray-600" 
                  style={{ [dir === 'rtl' ? 'right' : 'left']: '12px' }}
                />
                <input
                  type="text"
                  value={credentials.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className="w-full bg-white/10 border border-white/20 dark:bg-white/10 dark:border-white/20 bg-black/10 border-black/20 text-white dark:text-white text-slate-900 rounded-lg sm:rounded-xl px-10 py-1.5 sm:px-12 sm:py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-xs sm:placeholder:text-sm placeholder-gray-400 dark:placeholder-gray-400 placeholder-gray-600 transition-all"
                  placeholder={t('login.username')}
                  disabled={isLoading}
                />
              </div>
              {validationErrors.username && (
                <p className="text-red-400 text-xs mt-1">{validationErrors.username}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-white dark:text-white text-slate-900 mb-1.5 sm:mb-2">
                {t('login.password')}
              </label>
              <div className="relative">
                <Lock 
                  className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-400 text-gray-600" 
                  style={{ [dir === 'rtl' ? 'right' : 'left']: '12px' }}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={credentials.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full bg-white/10 border border-white/20 dark:bg-white/10 dark:border-white/20 bg-black/10 border-black/20 text-white dark:text-white text-slate-900 rounded-lg sm:rounded-xl px-10 py-1.5 sm:px-12 sm:py-3 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-xs sm:placeholder:text-sm placeholder-gray-400 dark:placeholder-gray-400 placeholder-gray-600 transition-all"
                  placeholder={t('login.password')}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white dark:text-gray-400 dark:hover:text-white text-gray-600 hover:text-slate-900 transition-colors p-1"
                  style={{ [dir === 'rtl' ? 'left' : 'right']: '12px' }}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              </div>
              {validationErrors.password && (
                <p className="text-red-400 text-xs mt-1">{validationErrors.password}</p>
              )}
            </div>

            {/* زر نسيت كلمة المرور */}
            {onNavigateToPasswordReset && (
              <div className="text-start">
                <button
                  type="button"
                  onClick={onNavigateToPasswordReset}
                  className="text-xs sm:text-sm text-blue-300 hover:text-blue-100 transition-colors underline"
                >
                  {t('login.forgotPassword')}
                </button>
              </div>
            )}

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !credentials.username || !credentials.password}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-2 px-4 sm:py-2.5 sm:px-5 rounded-xl transition-all duration-200 shadow-lg disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              {isLoading ? (
                <>
                  <BotLoadingAnimation size="sm" />
                  {t('login.loading')}
                </>
              ) : (
                <>
                  <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
                  {t('login.button')}
                </>
              )}
            </button>

            {/* فاصل "أو" */}
            <div className="relative my-3 sm:my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-xs sm:text-sm">
                <span className="px-2 bg-transparent text-gray-400">{t('login.or')}</span>
              </div>
            </div>

            {/* زر Google */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading || googleLoading}
              className="w-full bg-white hover:bg-gray-100 disabled:bg-gray-300 disabled:cursor-not-allowed text-gray-800 font-semibold py-2 px-4 sm:py-2.5 sm:px-5 rounded-xl transition-all duration-200 shadow-lg flex items-center justify-center gap-2 text-sm border border-gray-300"
            >
              {googleLoading ? (
                <>
                  <BotLoadingAnimation size="sm" />
                  <span>{t('login.googleLoading')}</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>{t('login.googleButton')}</span>
                </>
              )}
            </button>

            {/* أزرار التسجيل والاشتراك */}
            <div className="mt-3 sm:mt-4 space-y-3">
              {/* زر إنشاء حساب جديد */}
              {onNavigateToRegister && (
                <div>
                  <div className="text-center text-xs sm:text-sm text-gray-300 mb-2 sm:mb-3">
                    {t('login.newUser')}
                  </div>
                  <button
                    type="button"
                    onClick={onNavigateToRegister}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-2 px-4 sm:py-2.5 sm:px-5 rounded-xl transition-all duration-200 shadow-lg flex items-center justify-center gap-2 text-sm"
                  >
                    <User className="w-4 h-4 sm:w-5 sm:h-5" />
                    {t('login.createAccount')}
                  </button>
                </div>
              )}

            </div>
          </form>

          {/* معلومات إضافية */}
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/20">
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-green-500/20 rounded-lg p-1.5 sm:p-2">
                <div className="text-green-400 font-bold text-sm sm:text-base">95%+</div>
                <div className="text-[10px] sm:text-xs text-green-200">{t('login.successRate')}</div>
              </div>
              <div className="bg-blue-500/20 rounded-lg p-1.5 sm:p-2">
                <div className="text-blue-400 font-bold text-sm sm:text-base">24/7</div>
                <div className="text-[10px] sm:text-xs text-blue-200">{t('login.marketMonitoring')}</div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
      
      {/* الفوتر */}
      <Footer />
    </div>
  );
};