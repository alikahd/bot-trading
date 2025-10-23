import React, { useState } from 'react';
import { Bot, Lock, User, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Footer } from '../layout/Footer';

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
  const { t } = useLanguage();

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
                <User className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-400 text-gray-600" />
                <input
                  type="text"
                  value={credentials.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className="w-full bg-white/10 border border-white/20 dark:bg-white/10 dark:border-white/20 bg-black/10 border-black/20 text-white dark:text-white text-slate-900 rounded-xl px-10 py-2 sm:px-12 sm:py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-400 placeholder-gray-600 transition-all"
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
                <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-400 text-gray-600" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={credentials.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full bg-white/10 border border-white/20 dark:bg-white/10 dark:border-white/20 bg-black/10 border-black/20 text-white dark:text-white text-slate-900 rounded-xl px-10 py-2.5 sm:px-12 sm:py-3 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-400 placeholder-gray-600 transition-all"
                  placeholder={t('login.password')}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white dark:text-gray-400 dark:hover:text-white text-gray-600 hover:text-slate-900 transition-colors p-1"
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
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  {t('login.loading')}
                </>
              ) : (
                <>
                  <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
                  {t('login.button')}
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