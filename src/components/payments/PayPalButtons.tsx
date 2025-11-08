import React, { useEffect, useRef, useState } from 'react';
import { loadPayPalScript } from '../../services/paypalService';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { geolocationService } from '../../services/geolocationService';

interface PayPalButtonsProps {
  amount: number;
  planName: string;
  onSuccess: (details: any) => void;
  onError: (error: any) => void;
  userInfo?: {
    country?: string;
    phone?: string;
    email?: string;
    fullName?: string;
  };
}

export const PayPalButtons: React.FC<PayPalButtonsProps> = ({
  amount,
  planName,
  onSuccess,
  onError,
  userInfo
}) => {
  const { language } = useLanguage();
  const paypalRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initializedRef = useRef(false);
  const [detectedCountryCode, setDetectedCountryCode] = useState<string | null>(null);

  // دالة الترجمة
  const t = (ar: string, en: string, fr: string) => {
    if (language === 'ar') return ar;
    if (language === 'fr') return fr;
    return en;
  };

  // جلب الموقع الجغرافي عند تحميل المكون
  useEffect(() => {
    const detectLocation = async () => {
      try {

        const location = await geolocationService.getUserLocation();
        
        if (location && location.countryCode) {

          setDetectedCountryCode(location.countryCode);
        } else {

        }
      } catch (error) {

      }
    };

    detectLocation();
  }, []); // تشغيل مرة واحدة فقط

  // دالة تحويل اسم الدولة إلى كود ISO
  const getCountryCode = (countryName?: string): string => {
    // 1. إذا تم الكشف عن الموقع الجغرافي، استخدمه (الأولوية القصوى)
    if (detectedCountryCode) {

      return detectedCountryCode;
    }

    // 2. إذا تم تمرير اسم الدولة من قاعدة البيانات
    if (!countryName) {

      return 'US'; // افتراضي
    }

    const countryMap: Record<string, string> = {
      'المغرب': 'MA', 'مصر': 'EG', 'السعودية': 'SA', 'الإمارات': 'AE',
      'الكويت': 'KW', 'قطر': 'QA', 'البحرين': 'BH', 'عمان': 'OM',
      'الأردن': 'JO', 'لبنان': 'LB', 'فلسطين': 'PS', 'سوريا': 'SY',
      'العراق': 'IQ', 'اليمن': 'YE', 'ليبيا': 'LY', 'تونس': 'TN',
      'الجزائر': 'DZ', 'السودان': 'SD', 'الصومال': 'SO', 'جيبوتي': 'DJ',
      'موريتانيا': 'MR', 'جزر القمر': 'KM',
      // دول أوروبية
      'فرنسا': 'FR', 'ألمانيا': 'DE', 'إيطاليا': 'IT', 'إسبانيا': 'ES',
      'بريطانيا': 'GB', 'المملكة المتحدة': 'GB', 'بلجيكا': 'BE', 'هولندا': 'NL',
      'سويسرا': 'CH', 'النمسا': 'AT', 'السويد': 'SE', 'النرويج': 'NO',
      // دول آسيوية
      'الصين': 'CN', 'اليابان': 'JP', 'كوريا الجنوبية': 'KR', 'الهند': 'IN',
      'باكستان': 'PK', 'بنغلاديش': 'BD', 'إندونيسيا': 'ID', 'ماليزيا': 'MY',
      'تايلاند': 'TH', 'فيتنام': 'VN', 'الفلبين': 'PH', 'سنغافورة': 'SG',
      'تركيا': 'TR', 'إيران': 'IR',
      // دول أمريكية
      'الولايات المتحدة': 'US', 'أمريكا': 'US', 'كندا': 'CA', 'المكسيك': 'MX',
      'البرازيل': 'BR', 'الأرجنتين': 'AR', 'تشيلي': 'CL', 'كولومبيا': 'CO',
      // دول إفريقية
      'جنوب أفريقيا': 'ZA', 'نيجيريا': 'NG', 'كينيا': 'KE', 'إثيوبيا': 'ET',
      'غانا': 'GH', 'تنزانيا': 'TZ', 'أوغندا': 'UG',
      // دول أوقيانوسيا
      'أستراليا': 'AU', 'نيوزيلندا': 'NZ'
    };
    
    const countryCode = countryMap[countryName];
    if (!countryCode) {

      return 'US';
    }

    return countryCode;
  };

  useEffect(() => {
    let mounted = true;

    const initPayPal = async () => {
      // التحقق من وجود الأزرار في الـ DOM
      const hasButtons = paypalRef.current?.children.length || cardRef.current?.children.length;
      
      // منع إعادة التهيئة إذا تمت بالفعل والأزرار موجودة
      if (initializedRef.current && hasButtons) {

        setLoading(false);
        return;
      }
      
      // إذا كانت مهيأة لكن الأزرار غير موجودة، إعادة التهيئة
      if (initializedRef.current && !hasButtons) {

        initializedRef.current = false;
      }

      try {
        if (!mounted) return;
        
        setLoading(true);
        setError(null);

        // تحديد اللغة لـ PayPal حسب لغة الموقع
        let paypalLocale = 'en_US';
        if (language === 'ar') {
          paypalLocale = 'ar_EG'; // العربية
        } else if (language === 'fr') {
          paypalLocale = 'fr_FR'; // الفرنسية
        } else {
          paypalLocale = 'en_US'; // الإنجليزية (افتراضي)
        }

        // تحميل PayPal SDK
        await loadPayPalScript(paypalLocale);
        
        if (!window.paypal) {

          throw new Error('PayPal SDK not loaded');
        }
        
        // ⚡ انتظار إضافي للتأكد من تحميل window.paypal.Buttons
        let buttonsReady = false;
        for (let i = 0; i < 20; i++) {
          if (window.paypal && typeof window.paypal.Buttons === 'function') {
            buttonsReady = true;

            break;
          }
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        if (!buttonsReady) {

          throw new Error('PayPal.Buttons not available');
        }
        
        if (!mounted) {

          return;
        }

        // انتظار حتى تكون الـ refs جاهزة (مع retry)
        let retries = 0;
        const maxRetries = 10;
        while ((!paypalRef.current || !cardRef.current) && retries < maxRetries && mounted) {

          await new Promise(resolve => setTimeout(resolve, 200));
          retries++;
        }

        if (!mounted) {

          return;
        }

        // تنظيف الأزرار القديمة
        if (paypalRef.current) {
          paypalRef.current.innerHTML = '';
        }
        if (cardRef.current) {
          cardRef.current.innerHTML = '';
        }

        // إنشاء زر PayPal

        if (!paypalRef.current || !cardRef.current) {

          if (mounted) {
            setError('Payment buttons failed to load. Please refresh the page.');
            setLoading(false);
          }
          return;
        }

        // window.paypal.Buttons تم التحقق منه مسبقاً
        window.paypal.Buttons({
            fundingSource: window.paypal.FUNDING.PAYPAL,
            style: {
              layout: 'vertical',
              color: 'gold',
              shape: 'rect',
              label: 'paypal',
              height: 50
            },
            createOrder: (_data: any, actions: any) => {
              const countryCode = getCountryCode(userInfo?.country);

              const orderData: any = {
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
              };

              // إضافة معلومات المستخدم إذا كانت متوفرة
              if (userInfo) {
                orderData.payer = {
                  email_address: userInfo.email,
                  name: userInfo.fullName ? {
                    given_name: userInfo.fullName.split(' ')[0],
                    surname: userInfo.fullName.split(' ').slice(1).join(' ') || userInfo.fullName.split(' ')[0]
                  } : undefined,
                  address: {
                    country_code: countryCode
                  },
                  phone: userInfo.phone ? {
                    phone_type: 'MOBILE',
                    phone_number: {
                      national_number: userInfo.phone
                    }
                  } : undefined
                };
              }

              return actions.order.create(orderData);
            },
            onApprove: async (_data: any, actions: any) => {
              const details = await actions.order.capture();
              onSuccess(details);
            },
            onError: (err: any) => {

              onError(err);
            }
          }).render(paypalRef.current);

        // إنشاء زر البطاقة

        if (cardRef.current && window.paypal.FUNDING.CARD) {
          window.paypal.Buttons({
            fundingSource: window.paypal.FUNDING.CARD,
            style: {
              layout: 'vertical',
              color: 'black',
              shape: 'rect',
              label: 'pay',
              height: 50
            },
            createOrder: (_data: any, actions: any) => {
              const countryCode = getCountryCode(userInfo?.country);

              const orderData: any = {
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
              };

              // إضافة معلومات المستخدم إذا كانت متوفرة
              if (userInfo) {
                orderData.payer = {
                  email_address: userInfo.email,
                  name: userInfo.fullName ? {
                    given_name: userInfo.fullName.split(' ')[0],
                    surname: userInfo.fullName.split(' ').slice(1).join(' ') || userInfo.fullName.split(' ')[0]
                  } : undefined,
                  address: {
                    country_code: countryCode
                  },
                  phone: userInfo.phone ? {
                    phone_type: 'MOBILE',
                    phone_number: {
                      national_number: userInfo.phone
                    }
                  } : undefined
                };
              }

              return actions.order.create(orderData);
            },
            onApprove: async (_data: any, actions: any) => {
              const details = await actions.order.capture();
              onSuccess(details);
            },
            onError: (err: any) => {

              onError(err);
            }
          }).render(cardRef.current);

        } else {

        }

        // تعيين initialized flag
        initializedRef.current = true;
        
        if (mounted) {
          setLoading(false);
        }
      } catch (err: any) {

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

      // تنظيف الأزرار القديمة
      if (paypalRef.current) {
        paypalRef.current.innerHTML = '';
      }
      if (cardRef.current) {
        cardRef.current.innerHTML = '';
      }
      
      // ⚠️ لا نعيد تعيين initializedRef هنا لأن PayPal SDK لا يزال محملاً
      // سيتم إعادة استخدامه عند العودة للصفحة
    };
  }, [language, amount]);

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
          {t('💙 الدفع بحساب PayPal', '💙 Pay with PayPal', '💙 Payer avec PayPal')}
        </p>
        <div ref={paypalRef}></div>
      </div>

      {/* زر البطاقة */}
      <div>
        <p className="text-white text-sm font-medium mb-2">
          {t('💳 الدفع بالبطاقة البنكية', '💳 Pay with Debit or Credit Card', '💳 Payer par carte bancaire')}
        </p>
        <div ref={cardRef}></div>
        <p className="text-gray-400 text-xs mt-2 text-center">
          {t('سيتم معالجة الدفع بشكل آمن عبر PayPal', 'Payment will be processed securely via PayPal', 'Le paiement sera traité en toute sécurité via PayPal')}
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
