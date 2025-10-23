import React from 'react';
import { Mail, CheckCircle, ArrowRight } from 'lucide-react';

interface RegistrationSuccessPageProps {
  email: string;
  onBackToLogin: () => void;
}

export const RegistrationSuccessPage: React.FC<RegistrationSuccessPageProps> = ({
  email,
  onBackToLogin
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 max-w-md w-full">
        {/* أيقونة النجاح */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full"></div>
            <div className="relative bg-green-500/10 p-4 rounded-full border border-green-500/30">
              <CheckCircle className="w-16 h-16 text-green-400" />
            </div>
          </div>
        </div>

        {/* العنوان */}
        <h2 className="text-3xl font-bold text-white text-center mb-4">
          تم إنشاء حسابك بنجاح! 🎉
        </h2>

        {/* الرسالة الرئيسية */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <Mail className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                يجب تفعيل البريد الإلكتروني أولاً
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                لقد أرسلنا رسالة تأكيد إلى بريدك الإلكتروني:
              </p>
              <p className="text-blue-400 font-medium mt-2 break-all">
                {email}
              </p>
            </div>
          </div>
        </div>

        {/* الخطوات */}
        <div className="bg-slate-700/30 rounded-xl p-6 mb-6">
          <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-blue-400" />
            الخطوات التالية:
          </h4>
          <ol className="space-y-3 text-slate-300 text-sm">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-semibold text-xs">
                1
              </span>
              <span>افتح بريدك الإلكتروني</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-semibold text-xs">
                2
              </span>
              <span>ابحث عن رسالة التأكيد من Bot Trading</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-semibold text-xs">
                3
              </span>
              <span>انقر على رابط التفعيل</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 font-semibold text-xs">
                ✓
              </span>
              <span className="text-green-400 font-medium">
                سيتم توجيهك تلقائياً لصفحة الاشتراك
              </span>
            </li>
          </ol>
        </div>

        {/* ملاحظة */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
          <p className="text-yellow-200 text-sm text-center">
            💡 لم تستلم الرسالة؟ تحقق من مجلد الرسائل غير المرغوب فيها (Spam)
          </p>
        </div>

        {/* زر العودة */}
        <button
          onClick={onBackToLogin}
          className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-medium transition-colors"
        >
          العودة لتسجيل الدخول
        </button>
      </div>
    </div>
  );
};
