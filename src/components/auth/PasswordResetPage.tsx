import React, { useState, useEffect } from 'react';
import { Mail, Lock, ArrowLeft, Key, Globe, CheckCircle, XCircle } from 'lucide-react';
import { passwordResetService } from '../../services/passwordResetService';
import { useLanguage } from '../../contexts/LanguageContext';
import { BotLoadingAnimation } from '../common/BotLoadingAnimation';

interface PasswordResetPageProps {
  onBack: () => void;
}

type ResetStep = 'email' | 'code' | 'password' | 'success';

export const PasswordResetPage: React.FC<PasswordResetPageProps> = ({ onBack }) => {
  const { t, language, setLanguage } = useLanguage();
  const [step, setStep] = useState<ResetStep>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetCode, setResetCode] = useState<string>(''); // للعرض في بيئة التطوير

  // منع الرجوع للخلف باستخدام زر المتصفح/الهاتف
  useEffect(() => {
    // إضافة حالة جديدة للتاريخ عند تحميل الصفحة
    window.history.pushState({ page: 'password-reset', preventBack: true }, '', window.location.pathname);

    const handlePopState = (event: PopStateEvent) => {
      // إذا حاول المستخدم الرجوع، نمنعه ونعيده للأمام
      if (event.state?.preventBack) {
        window.history.pushState({ page: 'password-reset', preventBack: true }, '', window.location.pathname);

      }
    };

    // الاستماع لحدث الرجوع
    window.addEventListener('popstate', handlePopState);

    // التنظيف عند إلغاء تحميل المكون
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await passwordResetService.createResetCode(email);
      
      if (result.success) {
        // حفظ الرمز للعرض في بيئة التطوير
        if (result.code) {
          setResetCode(result.code);
        }
        setStep('code');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await passwordResetService.verifyResetCode(email, code);
      
      if (result.success) {
        setStep('password');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // التحقق من تطابق كلمة المرور
    if (newPassword !== confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      return;
    }

    if (newPassword.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setLoading(true);

    try {
      const result = await passwordResetService.resetPassword(email, code, newPassword);
      
      if (result.success) {
        setStep('success');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex flex-col">
      {/* زر تغيير اللغة */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10">
        <button
          onClick={() => {
            const nextLang = language === 'ar' ? 'en' : language === 'en' ? 'fr' : 'ar';
            setLanguage(nextLang);
          }}
          className="flex items-center gap-1.5 bg-white/10 backdrop-blur-lg border border-white/20 text-white hover:bg-white/20 px-2 py-0.5 rounded-md transition-all duration-200 text-xs h-[22px] leading-none"
        >
          <Globe className="w-3.5 h-3.5" />
          <span className="font-medium">
            {language === 'ar' ? 'العربية' : language === 'en' ? 'English' : 'Français'}
          </span>
        </button>
      </div>

      {/* خلفية متحركة */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 sm:-top-40 sm:-right-40 w-40 h-40 sm:w-80 sm:h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 sm:-bottom-40 sm:-left-40 w-40 h-40 sm:w-80 sm:h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      </div>

      {/* المحتوى الرئيسي */}
      <div className="relative flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* العنوان */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-18 sm:h-18 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-2xl mb-3">
              <Key className="w-7 h-7 sm:w-9 sm:h-9 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">
              {t('passwordReset.title')}
            </h1>
            <p className="text-xs sm:text-sm text-blue-200">
              {step === 'email' && t('passwordReset.emailStep')}
              {step === 'code' && t('passwordReset.codeStep')}
              {step === 'password' && t('passwordReset.passwordStep')}
              {step === 'success' && t('passwordReset.successStep')}
            </p>
          </div>

          {/* النموذج */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-4 sm:p-6">
            {/* عرض الخطأ */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-400" />
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}

            {/* رمز التطوير */}
            {resetCode && step === 'code' && (
              <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg">
                <p className="text-xs text-green-200 mb-1">
                  🔐 رمز الاستعادة (للتطوير فقط):
                </p>
                <p className="text-lg font-bold text-green-400 text-center tracking-widest">
                  {resetCode}
                </p>
              </div>
            )}

            {/* خطوة إدخال البريد الإلكتروني */}
            {step === 'email' && (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    {t('passwordReset.emailLabel')}
                  </label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-12 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 transition-all"
                      placeholder={t('passwordReset.emailPlaceholder')}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <BotLoadingAnimation size="sm" />
                      {t('passwordReset.sending')}
                    </>
                  ) : (
                    <>
                      <Mail className="w-5 h-5" />
                      {t('passwordReset.sendCode')}
                    </>
                  )}
                </button>
              </form>
            )}

            {/* خطوة إدخال الرمز */}
            {step === 'code' && (
              <form onSubmit={handleCodeSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    {t('passwordReset.codeLabel')}
                  </label>
                  <div className="relative">
                    <Key className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-12 py-3 text-center text-2xl tracking-widest font-bold focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 transition-all"
                      placeholder="000000"
                      maxLength={6}
                      required
                      disabled={loading}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    {t('passwordReset.codeHint')}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <BotLoadingAnimation size="sm" />
                      {t('passwordReset.verifying')}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      {t('passwordReset.verify')}
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setCode('');
                    setError(null);
                  }}
                  className="w-full text-sm text-gray-300 hover:text-white transition-colors"
                >
                  {t('passwordReset.resendCode')}
                </button>
              </form>
            )}

            {/* خطوة إدخال كلمة المرور الجديدة */}
            {step === 'password' && (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    {t('passwordReset.newPasswordLabel')}
                  </label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-12 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 transition-all"
                      placeholder={t('passwordReset.newPasswordPlaceholder')}
                      required
                      disabled={loading}
                      minLength={6}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    {t('passwordReset.confirmPasswordLabel')}
                  </label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-12 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 transition-all"
                      placeholder={t('passwordReset.confirmPasswordPlaceholder')}
                      required
                      disabled={loading}
                      minLength={6}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-gray-300 hover:text-white transition-colors"
                >
                  {showPassword ? t('passwordReset.hidePassword') : t('passwordReset.showPassword')}
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <BotLoadingAnimation size="sm" />
                      {t('passwordReset.resetting')}
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      {t('passwordReset.resetPassword')}
                    </>
                  )}
                </button>
              </form>
            )}

            {/* خطوة النجاح */}
            {step === 'success' && (
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 border-2 border-green-500 rounded-full">
                  <CheckCircle className="w-10 h-10 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  {t('passwordReset.successTitle')}
                </h3>
                <p className="text-sm text-gray-300">
                  {t('passwordReset.successMessage')}
                </p>
                <button
                  onClick={onBack}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  {t('passwordReset.backToLogin')}
                </button>
              </div>
            )}

            {/* زر العودة (ليس في خطوة النجاح) */}
            {step !== 'success' && (
              <button
                onClick={onBack}
                className="mt-4 w-full text-sm text-gray-300 hover:text-white transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('passwordReset.backToLogin')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
