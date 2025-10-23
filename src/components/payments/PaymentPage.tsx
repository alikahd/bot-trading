import React, { useState } from 'react';
import { Wallet, Copy, Check, Upload, RefreshCw, X, Shield, Coins } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import PayPalButtons from './PayPalButtons';

interface PaymentPageProps {
  selectedPlan: any;
  userInfo: any;
  onPaymentComplete: (paymentMethod?: string, status?: string, paymentData?: any) => void;
  onBack: () => void;
  onEditPlan?: () => void;
}

export const PaymentPage: React.FC<PaymentPageProps> = ({
  selectedPlan,
  userInfo,
  onPaymentComplete,
  onBack,
  onEditPlan
}) => {
  const { language, t, dir } = useLanguage();
  const [paymentMethod, setPaymentMethod] = useState<'paypal' | 'crypto'>('paypal');
  const [copied, setCopied] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [cryptoProof, setCryptoProof] = useState<File | null>(null);
  const [cryptoStatus, setCryptoStatus] = useState<'pending' | 'uploaded' | 'verifying'>('pending');
  const [cryptoPaymentData, setCryptoPaymentData] = useState<any>(null);

  const usdtAddress = "TLXYH8acXRzNDPgVKrfQUGSyubL5fUkCaM";

  // التحقق من وجود البيانات المطلوبة
  if (!userInfo || !selectedPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4" dir={dir}>
        <div className="text-center">
          <p className="text-white text-xl mb-4">{t('payment.loadingData') || 'جاري تحميل البيانات...'}</p>
          <button
            onClick={onBack}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
          >
            {t('payment.backButton')}
          </button>
        </div>
      </div>
    );
  }

  // معالجة رفع صورة إثبات الدفع بالعملة الرقمية
  const handleCryptoProofUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // التحقق من نوع الملف
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        alert('يرجى رفع صورة بصيغة JPG أو PNG أو GIF');
        return;
      }
      
      // التحقق من حجم الملف (5MB كحد أقصى)
      if (file.size > 5 * 1024 * 1024) {
        alert('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
        return;
      }
      
      setCryptoProof(file);
      console.log('📸 تم اختيار صورة:', file.name, file.size);
      
      // رفع الصورة وحفظ بيانات الدفع
      setProcessing(true);
      
      try {
        console.log('🔄 بدء تحويل الصورة إلى Base64...');
        
        // تحويل الصورة إلى Base64 باستخدام Promise
        const base64Image = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          
          reader.onload = () => {
            console.log('✅ تم تحويل الصورة إلى Base64');
            resolve(reader.result as string);
          };
          
          reader.onerror = (error) => {
            console.error('❌ خطأ في قراءة الملف:', error);
            reject(error);
          };
          
          reader.readAsDataURL(file);
        });
        
        // إنشاء سجل دفع بالعملة الرقمية
        const paymentData = {
          method: 'bitcoin',
          amount: selectedPlan.price,
          currency: 'USD',
          walletAddress: usdtAddress,
          proofImage: base64Image,
          status: 'crypto_pending',
          userInfo: userInfo,
          planInfo: selectedPlan
        };
        
        console.log('📤 تم تجهيز بيانات الدفع:', {
          method: 'bitcoin',
          status: 'crypto_pending',
          amount: selectedPlan.price
        });
        
        // حفظ بيانات الدفع مؤقتاً بدلاً من الإرسال مباشرة
        setCryptoPaymentData(paymentData);
        setCryptoStatus('uploaded');
        setProcessing(false);
        
        console.log('✅ تم رفع الصورة بنجاح - في انتظار تأكيد المستخدم');
        
      } catch (error) {
        console.error('❌ خطأ في رفع الصورة:', error);
        alert('حدث خطأ في رفع الصورة. يرجى المحاولة مرة أخرى.');
        setCryptoStatus('pending');
        setCryptoProof(null);
        setProcessing(false);
      }
    }
  };

  // تأكيد وإرسال الدفع بالعملات الرقمية
  const handleConfirmCryptoPayment = async () => {
    if (!cryptoPaymentData) return;
    
    setProcessing(true);
    setCryptoStatus('verifying');
    
    try {
      console.log('📤 إرسال الدفع للمعالجة...');
      
      // إرسال البيانات للمعالجة
      await onPaymentComplete('bitcoin', 'crypto_pending', cryptoPaymentData);
      
      console.log('✅ تم إرسال الدفع بنجاح');
      
      // إعطاء وقت للـ state للتحديث
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('❌ خطأ في إرسال الدفع:', error);
      alert('حدث خطأ في إرسال الدفع. يرجى المحاولة مرة أخرى.');
      setCryptoStatus('uploaded');
      setProcessing(false);
    }
  };


  // نسخ عنوان المحفظة
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex flex-col relative overflow-hidden" dir={dir}>

      {/* خلفية متحركة */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      </div>

      {/* المحتوى الرئيسي */}
      <div className="flex-1 flex items-center justify-center p-3 sm:p-4 md:p-6 relative z-10">
        <div className="w-full max-w-4xl">
          {/* العنوان */}
          <div className="text-center mb-4 sm:mb-6 md:mb-8">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2">{t('payment.title')}</h1>
            <p className="text-sm sm:text-base text-gray-300">{t('payment.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* معلومات الباقة */}
            <div className="lg:col-span-1">
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">{t('payment.orderSummary')}</h3>
                
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm sm:text-base text-gray-300">{t('payment.plan')}:</span>
                    <span className="text-sm sm:text-base text-white font-medium">{selectedPlan.name}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm sm:text-base text-gray-300">{t('payment.duration')}:</span>
                    <span className="text-sm sm:text-base text-white font-medium">
                      {selectedPlan.duration_months === 1 
                        ? (language === 'ar' ? '1 شهر' : language === 'en' ? '1 Month' : '1 Mois')
                        : selectedPlan.duration_months === 12 
                        ? (language === 'ar' ? '1 سنة' : language === 'en' ? '1 Year' : '1 An')
                        : selectedPlan.duration_months === 36 
                        ? (language === 'ar' ? '3 سنوات' : language === 'en' ? '3 Years' : '3 Ans')
                        : `${selectedPlan.duration_months} ${language === 'ar' ? 'شهر' : language === 'en' ? 'Months' : 'Mois'}`}
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <span className="text-sm sm:text-base text-gray-300">{t('subscription.username')}:</span>
                    <span className="text-sm sm:text-base text-white font-medium break-words">{userInfo.fullName}</span>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <span className="text-sm sm:text-base text-gray-300">{t('subscription.email')}:</span>
                    <span className="text-xs sm:text-sm text-white font-medium break-all">{userInfo.email}</span>
                  </div>
                  
                  <hr className="border-white/20" />
                  
                  <div className="flex justify-between items-center text-base sm:text-lg">
                    <span className="text-white font-bold">{t('payment.total')}:</span>
                    <span className="text-green-400 font-bold">${selectedPlan.price}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* طرق الدفع */}
            <div className="lg:col-span-2">
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">{t('payment.paymentMethod')}</h3>

                {/* أزرار PayPal والبطاقة */}
                <PayPalButtons
                  amount={selectedPlan.price}
                  planName={selectedPlan.name}
                  onSuccess={(details) => {
                    console.log('✅ Payment successful:', details);
                    onPaymentComplete('paypal', 'completed', {
                      method: 'paypal',
                      amount: selectedPlan.price,
                      currency: 'USD',
                      status: 'completed',
                      transactionId: details.id,
                      payerEmail: details.payer?.email_address,
                      userInfo: userInfo,
                      planInfo: selectedPlan,
                      paymentDetails: details
                    });
                  }}
                  onError={(error) => {
                    console.error('❌ Payment failed:', error);
                    alert('حدث خطأ في الدفع. يرجى المحاولة مرة أخرى.');
                  }}
                />

                {/* خيار العملات الرقمية */}
                <div className="border-t border-white/20 pt-6 mt-6">
                 
                  
                  <button
                    onClick={() => setPaymentMethod(paymentMethod === 'crypto' ? 'paypal' : 'crypto')}
                    className={`w-full py-2.5 sm:py-3 px-3 sm:px-4 text-sm sm:text-base rounded-lg transition-all duration-200 flex items-center justify-center gap-2 sm:gap-2.5 font-semibold whitespace-nowrap ${
                      paymentMethod === 'crypto'
                        ? 'bg-orange-600 hover:bg-orange-700 text-white'
                        : 'bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white shadow-lg hover:shadow-xl'
                    }`}
                  >
                    <Coins className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                    <span>
                      {paymentMethod === 'crypto' ? t('payment.hideCrypto') : t('payment.payWithCrypto')}
                    </span>
                  </button>
                </div>

                {paymentMethod === 'crypto' && (
                  <div className="space-y-4 sm:space-y-5 mt-6 pt-6 border-t border-white/20">
                    {/* توجيهات الدفع */}
                    <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-3 sm:p-4">
                      <div className="flex items-center gap-2 text-orange-400 mb-2">
                        <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="text-sm sm:text-base font-medium">{t('payment.cryptoTitle')}</span>
                      </div>
                      <p className="text-gray-300 text-xs sm:text-sm">
                        {t('payment.cryptoInstructions')}
                      </p>
                    </div>

                    {/* خطوات الدفع */}
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 sm:p-4">
                      <h4 className="text-blue-400 font-medium text-sm sm:text-base mb-3 flex items-center gap-2">
                        <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                        {t('payment.paymentSteps')}
                      </h4>
                      <ol className="space-y-2 text-gray-300 text-xs sm:text-sm">
                        <li className="flex gap-2">
                          <span className="text-blue-400 font-bold min-w-[20px]">1.</span>
                          <span>{t('payment.step1')}</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="text-blue-400 font-bold min-w-[20px]">2.</span>
                          <span>{t('payment.step2')}</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="text-blue-400 font-bold min-w-[20px]">3.</span>
                          <span>{t('payment.step3')} <strong className="text-orange-400">TRC20</strong></span>
                        </li>
                        <li className="flex gap-2">
                          <span className="text-blue-400 font-bold min-w-[20px]">4.</span>
                          <span>{t('payment.step4')}</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="text-blue-400 font-bold min-w-[20px]">5.</span>
                          <span>{t('payment.step5')}</span>
                        </li>
                      </ol>
                    </div>

                    {/* تحذير مهم */}
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <X className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="text-xs sm:text-sm">
                          <p className="text-red-400 font-medium mb-1">{t('payment.importantWarning')}</p>
                          <ul className="text-gray-300 space-y-1">
                            <li>• {t('payment.warning1')} <strong className="text-orange-400">TRC20</strong> {language === 'ar' ? 'فقط' : language === 'en' ? 'only' : 'uniquement'}</li>
                            <li>• {t('payment.warning2')}</li>
                            <li>• {t('payment.warning3')}</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* عنوان المحفظة */}
                    <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">{t('payment.walletAddress')}</span>
                        <button
                          onClick={() => copyToClipboard(usdtAddress)}
                          className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          <span className="text-sm">{copied ? t('payment.copied') : t('payment.copy')}</span>
                        </button>
                      </div>
                      <div className="bg-black/30 rounded p-2 sm:p-3 font-mono text-xs sm:text-base text-gray-300 whitespace-nowrap -mx-2 px-4 sm:mx-0 sm:px-3">
                        {usdtAddress}
                      </div>
                    </div>

                    {/* المبلغ المطلوب */}
                    <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 text-center">
                      <div className="text-green-400 font-bold text-2xl">${selectedPlan.price} USDT</div>
                      <div className="text-gray-300 text-sm mt-1">{t('payment.amountRequired')}</div>
                    </div>

                    {/* رفع صورة الإثبات */}
                    <div className="space-y-3">
                      <h4 className="text-white text-sm sm:text-base font-medium">{t('payment.uploadProof')}</h4>
                      
                      <label className="block cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCryptoProofUpload}
                          className="hidden"
                        />
                        <div className={`border-2 border-dashed rounded-lg p-3 sm:p-4 text-center transition-all ${
                          cryptoProof 
                            ? 'border-green-500 bg-green-500/20' 
                            : 'border-white/30 bg-white/5 hover:bg-white/10'
                        }`}>
                          {cryptoProof ? (
                            <div className="space-y-1.5">
                              <Check className="w-6 h-6 sm:w-7 sm:h-7 text-green-400 mx-auto" />
                              <div className="text-green-400 text-sm sm:text-base font-medium">{t('payment.imageUploaded')}</div>
                              <div className="text-gray-300 text-xs sm:text-sm truncate">{cryptoProof.name}</div>
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              <Upload className="w-6 h-6 sm:w-7 sm:h-7 text-gray-400 mx-auto" />
                              <div className="text-white text-sm sm:text-base font-medium">{t('payment.uploadImage')}</div>
                              <div className="text-gray-400 text-xs sm:text-sm">JPG, PNG ({t('payment.maxSize')} 5MB)</div>
                            </div>
                          )}
                        </div>
                      </label>

                      {cryptoStatus === 'uploaded' && (
                        <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                          <div className="flex items-center gap-2 text-green-400 mb-2">
                            <Check className="w-5 h-5" />
                            <span className="text-base font-medium">{t('payment.uploadSuccess')}</span>
                          </div>
                          <p className="text-gray-300 text-sm mb-3">
                            {t('payment.uploadSuccessDesc')}
                          </p>
                          <div className="flex gap-3">
                            <button
                              onClick={handleConfirmCryptoPayment}
                              disabled={processing}
                              className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                            >
                              {processing ? (
                                <>
                                  <RefreshCw className="w-5 h-5 animate-spin" />
                                  {t('payment.submitting')}
                                </>
                              ) : (
                                <>
                                  <Check className="w-5 h-5" />
                                  {t('payment.submitProof')}
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setCryptoProof(null);
                                setCryptoStatus('pending');
                                setCryptoPaymentData(null);
                              }}
                              disabled={processing}
                              className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200"
                            >
                              {t('payment.changeImage')}
                            </button>
                          </div>
                        </div>
                      )}

                      {cryptoStatus === 'verifying' && (
                        <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-blue-400 mb-1.5">
                            <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                            <span className="text-sm sm:text-base font-medium">{t('payment.processingPayment')}</span>
                          </div>
                          <p className="text-gray-300 text-xs sm:text-sm">
                            {t('payment.processingDesc')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* أزرار التنقل */}
                <div className="flex gap-2 sm:gap-3 mt-8">
                  <button
                    onClick={onBack}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 sm:py-2.5 px-2 sm:px-3 text-[11px] sm:text-sm rounded-lg transition-all duration-200 whitespace-nowrap"
                  >
                    {t('payment.backButton')}
                  </button>
                  
                  {onEditPlan && (
                    <button
                      onClick={onEditPlan}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 sm:py-2.5 px-2 sm:px-3 text-[11px] sm:text-sm rounded-lg transition-all duration-200 whitespace-nowrap"
                    >
                      {t('payment.changePlan')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
