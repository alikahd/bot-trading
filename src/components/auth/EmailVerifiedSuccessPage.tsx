import React, { useEffect, useState } from 'react';
import { CheckCircle, Mail, LogIn, ArrowRight } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useLanguage } from '../../contexts/LanguageContext';

interface EmailVerifiedSuccessPageProps {
  onGoToLogin: () => void;
}

export const EmailVerifiedSuccessPage: React.FC<EmailVerifiedSuccessPageProps> = ({ onGoToLogin }) => {
  const { t } = useLanguage();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    // عد تنازلي للتوجيه التلقائي
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onGoToLogin();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onGoToLogin]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-slate-900/40 backdrop-blur-xl border-slate-800/50 p-8">
        {/* أيقونة النجاح */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse"></div>
            <div className="relative bg-green-500/10 p-4 rounded-full">
              <CheckCircle className="w-16 h-16 text-green-400" />
            </div>
          </div>
        </div>

        {/* العنوان */}
        <h1 className="text-2xl font-bold text-white text-center mb-3">
          {t('emailVerified.title')}
        </h1>

        {/* الرسالة */}
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-gray-300">
              <p className="font-medium text-green-400 mb-1">
                {t('emailVerified.success')}
              </p>
              <p className="text-gray-400">
                {t('emailVerified.message')}
              </p>
            </div>
          </div>
        </div>

        {/* زر تسجيل الدخول */}
        <Button
          onClick={onGoToLogin}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 mb-4"
        >
          <LogIn className="w-5 h-5" />
          {t('emailVerified.loginButton')}
          <ArrowRight className="w-5 h-5" />
        </Button>

        {/* العد التنازلي */}
        <div className="text-center">
          <p className="text-sm text-gray-400">
            {t('emailVerified.autoRedirect')} <span className="text-blue-400 font-bold">{countdown}</span> {t('emailVerified.seconds')}
          </p>
        </div>

        {/* معلومات إضافية */}
        <div className="mt-6 pt-6 border-t border-slate-700/50">
          <div className="flex items-start gap-2 text-xs text-gray-500">
            <div className="w-1 h-1 bg-gray-500 rounded-full mt-1.5"></div>
            <p>{t('emailVerified.info')}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
