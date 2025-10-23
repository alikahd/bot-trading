import React from 'react';
import { CheckCircle, Mail, Globe, MessageCircle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface PaymentSuccessPageProps {
  userInfo: any;
  selectedPlan: any;
  onBackToLogin: () => void;
}

export const PaymentSuccessPage: React.FC<PaymentSuccessPageProps> = ({
  userInfo,
  selectedPlan,
  onBackToLogin
}) => {
  const { language, setLanguage, t, dir } = useLanguage();

  // دالة فتح الدردشة المباشرة مع الدعم
  const openLiveChat = () => {
    // التحقق من وجود Tawk.to
    if (typeof window !== 'undefined' && (window as any).Tawk_API) {
      // تعيين معلومات المستخدم قبل فتح الدردشة
      try {
        (window as any).Tawk_API.setAttributes({
          'name': userInfo.fullName || 'عميل جديد',
          'email': userInfo.email || '',
          'plan': language === 'ar' ? selectedPlan.name_ar : selectedPlan.name,
          'status': 'Payment Completed',
          'language': language
        });
      } catch (error) {
        console.log('Could not set Tawk attributes:', error);
      }
      
      // ضبط حجم النافذة قبل الفتح
      try {
        // إضافة CSS مخصص لضبط حجم النافذة
        const style = document.createElement('style');
        style.textContent = `
          /* ضبط حجم نافذة Tawk */
          #tawkchat-container {
            width: 400px !important;
            height: 600px !important;
            max-width: 400px !important;
            max-height: 600px !important;
            position: fixed !important;
            bottom: 20px !important;
            right: 20px !important;
            z-index: 1000 !important;
          }
          
          /* منع ملء الشاشة على الهواتف */
          @media (max-width: 768px) {
            #tawkchat-container {
              width: 350px !important;
              height: 500px !important;
              max-width: 90vw !important;
              max-height: 80vh !important;
              bottom: 10px !important;
              right: 10px !important;
            }
          }
          
          /* ضبط النافذة المنبثقة */
          .tawk-chat-panel {
            width: 400px !important;
            height: 600px !important;
            position: fixed !important;
            bottom: 20px !important;
            right: 20px !important;
          }
          
          /* منع ملء الشاشة */
          .tawk-fullscreen {
            width: 400px !important;
            height: 600px !important;
            position: fixed !important;
            top: auto !important;
            left: auto !important;
            bottom: 20px !important;
            right: 20px !important;
          }
        `;
        
        // إضافة الـ CSS للصفحة
        if (!document.querySelector('#tawk-custom-styles')) {
          style.id = 'tawk-custom-styles';
          document.head.appendChild(style);
        }
        
        // ضبط خصائص Tawk إذا كانت متاحة
        if ((window as any).Tawk_API.setWindowSize) {
          (window as any).Tawk_API.setWindowSize({
            width: 400,
            height: 600,
            position: 'bottom-right'
          });
        }
        
        // منع وضع ملء الشاشة
        if ((window as any).Tawk_API.setDisplayMode) {
          (window as any).Tawk_API.setDisplayMode('popup');
        }
        
      } catch (error) {
        console.log('Could not set window size:', error);
      }
      
      // فتح نافذة الدردشة
      (window as any).Tawk_API.toggle();
    } else {
      // إذا لم يكن Tawk متاحاً، اعرض رسالة وانتقل للبريد الإلكتروني
      const message = language === 'ar' 
        ? 'خدمة الدردشة المباشرة غير متاحة حالياً. سيتم توجيهك للتواصل عبر البريد الإلكتروني.'
        : language === 'fr'
        ? 'Le service de chat en direct n\'est actuellement pas disponible. Vous serez redirigé vers l\'email.'
        : 'Live chat service is currently unavailable. You will be redirected to email.';
      
      alert(message);
      
      // إعداد رسالة البريد الإلكتروني مع معلومات الطلب
      const subject = language === 'ar' 
        ? 'طلب مساعدة - تم إكمال الدفع بنجاح'
        : language === 'fr'
        ? 'Demande d\'aide - Paiement réussi'
        : 'Support Request - Payment Completed';
        
      const body = language === 'ar'
        ? `مرحباً،

لقد أكملت عملية الدفع للتو وأحتاج إلى مساعدة.

تفاصيل الطلب:
- الاسم: ${userInfo.fullName || 'غير محدد'}
- البريد الإلكتروني: ${userInfo.email || 'غير محدد'}
- الباقة: ${selectedPlan.name_ar || selectedPlan.name}
- المبلغ: $${selectedPlan.price}
- المدة: ${selectedPlan.duration_months} شهر

شكراً لكم.`
        : language === 'fr'
        ? `Bonjour,

Je viens de terminer mon paiement et j'ai besoin d'aide.

Détails de la commande:
- Nom: ${userInfo.fullName || 'Non spécifié'}
- Email: ${userInfo.email || 'Non spécifié'}
- Plan: ${selectedPlan.name || selectedPlan.name_ar}
- Montant: $${selectedPlan.price}
- Durée: ${selectedPlan.duration_months} mois

Merci.`
        : `Hello,

I just completed my payment and need assistance.

Order Details:
- Name: ${userInfo.fullName || 'Not specified'}
- Email: ${userInfo.email || 'Not specified'}
- Plan: ${selectedPlan.name || selectedPlan.name_ar}
- Amount: $${selectedPlan.price}
- Duration: ${selectedPlan.duration_months} months

Thank you.`;

      window.location.href = `mailto:support@tradingbot.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-2 sm:p-4" dir={dir}>
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4">
        <button
          onClick={() => {
            const nextLang = language === 'ar' ? 'en' : language === 'en' ? 'fr' : 'ar';
            setLanguage(nextLang);
          }}
          className="flex items-center gap-1.5 bg-white/10 text-white px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm"
        >
          <Globe className="w-3 h-3 sm:w-4 sm:h-4" />
          {language === 'ar' ? 'العربية' : language === 'en' ? 'English' : 'Français'}
        </button>
      </div>

      <Card className="w-full max-w-sm sm:max-w-md text-center" padding="sm">
        <div className="mb-4 sm:mb-6">
          <CheckCircle className="w-16 h-16 sm:w-20 sm:h-20 text-green-500 mx-auto mb-3 sm:mb-4" />
          <h2 className="text-lg sm:text-2xl font-bold text-white mb-1 sm:mb-2">{t('paymentSuccess.title')}</h2>
          <p className="text-gray-400 text-sm sm:text-base">{t('paymentSuccess.subtitle')}</p>
        </div>

        <div className="bg-gray-800 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6 text-right">
          <h3 className="text-white font-medium mb-3">{t('payment.orderSummary')}:</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">{t('payment.plan')}:</span>
              <span className="text-white">{language === 'ar' ? selectedPlan.name_ar : selectedPlan.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">{t('payment.total')}:</span>
              <span className="text-green-400">${selectedPlan.price}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">{t('payment.duration')}:</span>
              <span className="text-white">
                {selectedPlan.duration_months === 1 ? `1 ${t('subscription.month')}` : 
                 selectedPlan.duration_months === 12 ? `1 ${t('subscription.year')}` : 
                 selectedPlan.duration_months === 36 ? `3 ${t('subscription.years')}` :
                 `${selectedPlan.duration_months} ${t('subscription.month')}`}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-blue-900/20 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6">
          <div className="flex items-center gap-2 mb-2 sm:mb-3">
            <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
            <span className="text-blue-300 font-medium text-sm sm:text-base">{t('paymentSuccess.nextSteps')}</span>
          </div>
          <p className="text-blue-200 text-xs sm:text-sm mb-2 sm:mb-3">
            {t('paymentSuccess.step2')}
          </p>
          <div className="text-left bg-gray-800 p-2 sm:p-3 rounded text-xs sm:text-sm">
            <div className="flex items-center gap-2 mb-1">
              <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
              <span className="text-white">{userInfo.email}</span>
            </div>
          </div>
        </div>

        <div className="bg-yellow-900/20 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6">
          <h4 className="text-yellow-300 font-medium mb-2 text-sm sm:text-base">{t('paymentSuccess.nextSteps')}:</h4>
          <ul className="text-yellow-200 text-xs sm:text-sm space-y-1 text-right">
            <li>• {t('paymentSuccess.step1')}</li>
            <li>• {t('paymentSuccess.step2')}</li>
            <li>• {t('paymentSuccess.step3')}</li>
          </ul>
        </div>

        <div className="space-y-2 sm:space-y-3">
          <Button 
            onClick={onBackToLogin}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 py-2 sm:py-3 text-sm sm:text-base"
          >
            {t('paymentSuccess.loginNow')}
          </Button>
          
          <div className="text-center">
            <p className="text-gray-400 text-xs sm:text-sm">
              {t('paymentSuccess.needHelp')} 
              <button 
                onClick={openLiveChat}
                className="text-blue-400 hover:underline mr-1 hover:text-blue-300 transition-colors cursor-pointer bg-transparent border-none p-0 font-inherit text-inherit inline-flex items-center gap-1"
              >
                <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                {t('paymentSuccess.contactUs')}
              </button>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
