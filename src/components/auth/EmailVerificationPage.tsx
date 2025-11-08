import React, { useState, useEffect } from 'react';
import { Mail, RefreshCw, CheckCircle, AlertCircle, ArrowLeft, Globe } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Footer } from '../layout/Footer';
import { supabase } from '../../config/supabaseClient';

interface EmailVerificationPageProps {
  email: string;
  fullName: string;
  onVerificationSuccess: () => void;
  onBackToRegister: () => void;
  onVerifyCode: (email: string, code: string) => Promise<{ success: boolean; error?: string }>;
  isLoading: boolean;
}

export const EmailVerificationPage: React.FC<EmailVerificationPageProps> = ({
  email,
  onBackToRegister,
  isLoading
}) => {
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60); // 60 ثانية للإعادة إرسال
  const [canResend, setCanResend] = useState(false);
  const { language, setLanguage } = useLanguage();

  // عد تنازلي لإعادة الإرسال
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  // إعادة إرسال رابط التفعيل (Supabase)
  const handleResendLink = async () => {
    if (!canResend) return;

    setIsResending(true);
    setError(null);
    setSuccess(false);

    try {
      // استخدام Supabase لإعادة إرسال رابط التفعيل
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        setError(error.message || 'فشل في إعادة إرسال رابط التفعيل');
      } else {
        setSuccess(true);
        setTimeLeft(60); // إعادة تعيين العداد
        setCanResend(false); // تعطيل الزر
        
        // إخفاء رسالة النجاح بعد 3 ثوانٍ
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      }
    } catch (error) {

      setError('حدث خطأ أثناء إعادة إرسال رابط التفعيل');
    } finally {
      setIsResending(false);
    }
  };

  // تم إزالة عرض صفحة النجاح الكاملة - الآن نعرض رسالة نجاح صغيرة فقط
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex flex-col">
      {/* زر تغيير اللغة */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10">
        <button
          onClick={() => {
            const nextLang = language === 'ar' ? 'en' : language === 'en' ? 'fr' : 'ar';
            setLanguage(nextLang);
          }}
          className="flex items-center gap-1 sm:gap-2 bg-white/10 backdrop-blur-lg border border-white/20 text-white hover:bg-white/20 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg transition-all duration-200"
        >
          <Globe className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="text-xs sm:text-sm font-medium">
            {language === 'ar' ? 'العربية' : language === 'en' ? 'English' : 'Français'}
          </span>
        </button>
      </div>

      {/* خلفية متحركة */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 sm:-top-40 sm:-right-40 w-40 h-40 sm:w-80 sm:h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 sm:-bottom-40 sm:-left-40 w-40 h-40 sm:w-80 sm:h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-20 left-20 sm:top-40 sm:left-40 w-40 h-40 sm:w-80 sm:h-80 bg-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      </div>

      {/* المحتوى الرئيسي */}
      <div className="flex-1 flex items-center justify-center p-2 sm:p-4 relative z-10">
        <div className="w-full max-w-md">
          {/* الشعار والعنوان */}
          <div className="text-center mb-4 sm:mb-6">
            <div className="flex justify-center mb-2 sm:mb-3">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Mail className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">
              تفعيل البريد الإلكتروني
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 mb-2">
              تم إرسال رمز التفعيل إلى:
            </p>
            <p className="text-sm sm:text-base text-blue-400 font-medium break-all">
              {email}
            </p>
          </div>

          {/* نموذج التفعيل */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-4 sm:p-6 shadow-2xl">
            {error && (
              <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-red-300 text-xs sm:text-sm">{error}</p>
              </div>
            )}
            
            {success && (
              <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center gap-2 animate-pulse">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                <p className="text-green-300 text-xs sm:text-sm">✅ تم إرسال رابط التفعيل بنجاح! تحقق من بريدك الإلكتروني.</p>
              </div>
            )}

            <div className="space-y-4 sm:space-y-6">
              {/* رسالة توضيحية */}
              <div className="text-center">
                <p className="text-white text-sm sm:text-base mb-2">
                  لتفعيل حسابك، يرجى النقر على رابط التفعيل المرسل إلى بريدك الإلكتروني.
                </p>
                <p className="text-slate-400 text-xs sm:text-sm">
                  إذا لم تستلم الرابط، يمكنك إعادة إرساله من الزر أدناه.
                </p>
              </div>

              {/* زر إعادة إرسال رابط التفعيل */}
              <button
                onClick={handleResendLink}
                disabled={!canResend || isResending || isLoading}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-3 px-4 sm:py-3.5 sm:px-5 rounded-xl transition-all duration-200 shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <RefreshCw className={`w-5 h-5 ${isResending ? 'animate-spin' : ''}`} />
                {canResend ? (
                  isResending ? 'جاري الإرسال...' : 'إرسال رابط تفعيل جديد'
                ) : (
                  `إعادة الإرسال خلال ${timeLeft}s`
                )}
              </button>
              
              {!canResend && (
                <p className="text-xs text-slate-400 text-center">
                  يمكنك إعادة الإرسال بعد {timeLeft} ثانية
                </p>
              )}

              {/* زر تسجيل الخروج */}
              <button
                onClick={onBackToRegister}
                disabled={isResending || isLoading}
                className="w-full bg-transparent border border-white/30 hover:bg-white/10 disabled:opacity-50 text-white font-medium py-2 px-4 sm:py-2.5 sm:px-5 rounded-xl transition-all duration-200 text-sm flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                تسجيل الخروج
              </button>
            </div>
          </div>

          {/* معلومات إضافية */}
          <div className="mt-3 sm:mt-4 text-center">
            <div className="bg-blue-500/20 rounded-lg p-2 sm:p-3">
              <p className="text-blue-200 text-xs sm:text-sm">
                💡 تحقق من مجلد البريد المزعج إذا لم تجد الرسالة
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};
