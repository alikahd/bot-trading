import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Clock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface PaymentPendingPageProps {
  selectedPlan: any;
  userInfo?: any;
  onBackToLogin?: () => void;
  onBackToHome?: () => void;
  onCheckStatus?: () => void;
}

export const PaymentPendingPage: React.FC<PaymentPendingPageProps> = ({
  selectedPlan,
  userInfo,
  onBackToLogin,
  onBackToHome,
  onCheckStatus
}) => {
  const { language, setLanguage, dir } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-4" dir={dir}>
      <div className="absolute top-4 right-4">
        <button
          onClick={() => {
            const nextLang = language === 'ar' ? 'en' : language === 'en' ? 'fr' : 'ar';
            setLanguage(nextLang);
          }}
          className="flex items-center gap-2 bg-white/10 text-white px-3 py-2 rounded-lg"
        >
          <span className="text-sm font-medium">
            {language === 'ar' ? 'العربية' : language === 'en' ? 'English' : 'Français'}
          </span>
        </button>
      </div>

      <div className="max-w-2xl mx-auto pt-20">
        <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
          <div className="text-center space-y-6 p-8">
            {/* أيقونة الحالة */}
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <Clock className="w-10 h-10 text-yellow-400" />
              </div>
            </div>

            {/* العنوان الرئيسي */}
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">
                دفعتك تحت المراجعة
              </h1>
              <p className="text-gray-400">
                تم استلام تأكيد الدفع بنجاح وهو الآن قيد المراجعة
              </p>
            </div>

            {/* تفاصيل الطلب */}
            <div className="bg-gray-900/50 rounded-lg p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">المستخدم:</span>
                <span className="text-white font-medium">
                  {userInfo?.fullName || 'غير محدد'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">الباقة المختارة:</span>
                <span className="text-white font-medium">
                  {language === 'ar' ? selectedPlan?.name_ar : selectedPlan?.name}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">المبلغ:</span>
                <span className="text-green-400 font-bold">${selectedPlan?.price}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">طريقة الدفع:</span>
                <span className="text-white">العملة الرقمية (USDT)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">الحالة:</span>
                <span className="flex items-center gap-2 text-yellow-400">
                  <Clock className="w-4 h-4" />
                  تحت المراجعة
                </span>
              </div>
            </div>

            {/* خطوات المراجعة */}
            <div className="bg-blue-900/20 rounded-lg p-6 border border-blue-500/20">
              <h3 className="text-blue-300 font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                ماذا يحدث الآن؟
              </h3>
              <div className="space-y-3 text-sm text-gray-300">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span>تم استلام صورة تأكيد الدفع</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-yellow-400 rounded-full animate-pulse flex-shrink-0"></div>
                  <span>جاري مراجعة المعاملة من قبل فريقنا</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-gray-500 rounded-full flex-shrink-0"></div>
                  <span>تفعيل الاشتراك عند التأكيد</span>
                </div>
              </div>
            </div>

            {/* معلومات إضافية */}
            <div className="bg-gray-900/30 rounded-lg p-4">
              <div className="text-sm text-gray-400 space-y-2">
                <p className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <strong>وقت المراجعة:</strong> عادة خلال 2-24 ساعة
                </p>
                <p>
                  <strong>ملاحظة:</strong> ستتلقى إشعاراً فور اكتمال المراجعة
                </p>
              </div>
            </div>

            {/* أزرار الإجراءات */}
            <div className="flex gap-4 pt-4">
              <Button
                onClick={onCheckStatus}
                className="flex-1 bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                تحقق من الحالة
              </Button>
              <Button
                onClick={onBackToLogin || onBackToHome}
                variant="ghost"
                className="flex-1 border-gray-600 hover:bg-gray-700"
              >
                العودة للرئيسية
              </Button>
            </div>

            {/* معلومات الدعم */}
            <div className="pt-6 border-t border-gray-700">
              <p className="text-xs text-gray-500">
                في حالة وجود أي استفسار، يرجى التواصل مع فريق الدعم
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
