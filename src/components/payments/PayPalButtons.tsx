import React, { useEffect, useRef, useState } from 'react';
import { loadPayPalScript } from '../../services/paypalService';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface PayPalButtonsProps {
  amount: number;
  planName: string;
  onSuccess: (details: any) => void;
  onError: (error: any) => void;
}

export const PayPalButtons: React.FC<PayPalButtonsProps> = ({
  amount,
  planName,
  onSuccess,
  onError
}) => {
  const { language } = useLanguage();
  const paypalRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initializedRef = useRef(false);

  // دالة الترجمة
  const t = (ar: string, en: string, fr: string) => {
    if (language === 'ar') return ar;
    if (language === 'fr') return fr;
    return en;
  };

  useEffect(() => {
    let mounted = true;

    const initPayPal = async () => {
      // منع إعادة التهيئة إذا تمت بالفعل
      if (initializedRef.current) {
        console.log('⏭️ Already initialized, skipping...');
        setLoading(false);
        return;
      }

      try {
        if (!mounted) return;
        
        setLoading(true);
        setError(null);
        
        console.log('🔄 Starting PayPal initialization...');
        
        // تحديد اللغة لـ PayPal حسب لغة الموقع
        let paypalLocale = 'en_US';
        if (language === 'ar') {
          paypalLocale = 'ar_EG'; // العربية
        } else if (language === 'fr') {
          paypalLocale = 'fr_FR'; // الفرنسية
        } else {
          paypalLocale = 'en_US'; // الإنجليزية (افتراضي)
        }
        console.log('🌐 Locale:', paypalLocale, '(language:', language + ')');
        
        // تحميل PayPal SDK
        await loadPayPalScript(paypalLocale);
        
        if (!window.paypal) {
          console.error('❌ PayPal SDK not available');
          throw new Error('PayPal SDK not loaded');
        }
        
        if (!mounted) {
          console.log('⚠️ Component unmounted, stopping...');
          return;
        }
        
        console.log('✅ PayPal SDK ready');

        // انتظار حتى يكون الـ ref جاهز (مع retry)
        let retries = 0;
        const maxRetries = 10;
        while (!paypalRef.current && retries < maxRetries && mounted) {
          console.log(`⏳ Waiting for PayPal ref... (${retries + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 200));
          retries++;
        }

        if (!mounted) {
          console.log('⚠️ Component unmounted during wait');
          return;
        }

        // تنظيف الزر القديم
        if (paypalRef.current) {
          paypalRef.current.innerHTML = '';
        }

        // إنشاء زر PayPal
        console.log('🎨 Creating PayPal button...');
        console.log('📍 PayPal ref:', !!paypalRef.current);
        
        if (!paypalRef.current) {
          console.error('❌ PayPal ref still not ready after waiting');
          if (mounted) {
            setError('Payment button failed to load. Please refresh the page.');
            setLoading(false);
          }
          return;
        }
        
        console.log('✅ PayPal ref is ready, creating button...');
        window.paypal.Buttons({
            style: {
              layout: 'vertical',
              color: 'gold',
              shape: 'rect',
              label: 'paypal',
              height: 50
            },
            createOrder: (_data: any, actions: any) => {
              return actions.order.create({
                purchase_units: [{
                  amount: {
                    value: amount.toFixed(2),
                    currency_code: 'USD'
                  },
                  description: planName
                }],
                application_context: {
                  shipping_preference: 'NO_SHIPPING',
                  user_action: 'PAY_NOW'
                }
              });
            },
            onApprove: async (_data: any, actions: any) => {
              const details = await actions.order.capture();
              onSuccess(details);
            },
            onError: (err: any) => {
              console.error('❌ PayPal error:', err);
              onError(err);
            }
          }).render(paypalRef.current);
        console.log('✅ PayPal button rendered successfully');
        
        // تعيين initialized flag
        initializedRef.current = true;
        
        if (mounted) {
          setLoading(false);
        }
      } catch (err: any) {
        console.error('❌ Error initializing PayPal:', err);
        if (mounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    initPayPal();

    // تنظيف عند إلغاء التحميل أو تغيير اللغة
    return () => {
      mounted = false;
      initializedRef.current = false;
      console.log('🧹 Cleanup: reset initialized flag (language changed or unmount)');
      
      // تنظيف الزر القديم
      if (paypalRef.current) {
        paypalRef.current.innerHTML = '';
      }
    };
  }, [language]);

  console.log('🎬 Render state:', { loading, error, hasPaypalRef: !!paypalRef.current });

  if (error) {
    return (
      <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
        <p className="text-red-400 text-sm">
          {t('حدث خطأ في تحميل PayPal', 'Error loading PayPal', 'Erreur lors du chargement de PayPal')}
        </p>
        <p className="text-gray-400 text-xs mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-4">
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-2" />
            <p className="text-gray-300 text-sm">
              {t('جاري تحميل خيارات الدفع...', 'Loading payment options...', 'Chargement des options de paiement...')}
            </p>
          </div>
        </div>
      )}

      {/* زر PayPal */}
      <div>
        <p className="text-white text-sm font-medium mb-2">
          {t('💙 الدفع عبر PayPal', '💙 Pay with PayPal', '💙 Payer avec PayPal')}
        </p>
        <div ref={paypalRef}></div>
        <p className="text-gray-400 text-xs mt-2 text-center">
          {t('يدعم PayPal والبطاقات البنكية', 'Supports PayPal & Credit Cards', 'Prend en charge PayPal et les cartes bancaires')}
        </p>
      </div>

      {/* رسالة الأمان */}
      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
        <p className="text-gray-300 text-xs text-center">
          {t('🔒 دفع آمن ومشفر بنسبة 100%', '🔒 100% Secure & Encrypted Payment', '🔒 Paiement 100% sécurisé et crypté')}
        </p>
      </div>
    </div>
  );
};

export default PayPalButtons;
