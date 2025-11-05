// خدمة PayPal - بسيطة وفعالة
const PAYPAL_CLIENT_ID = 'AW-Cj16q_BRyJhBJWvtAYC_kNCtlDMQHEoiBvTO4Qi6q6jnfuFtOP3FJALXuoeisQhDc8pajVCr2crqG';

// ⚡ Flag لمنع التحميل المتزامن
let loadingPromise: Promise<void> | null = null;

export const loadPayPalScript = (locale: string = 'en_US'): Promise<void> => {
  // إذا كان هناك تحميل جاري، انتظره
  if (loadingPromise) {
    console.log('⏳ PayPal loading in progress, waiting...');
    return loadingPromise;
  }
  
  loadingPromise = new Promise((resolve, reject) => {
    console.log('🔄 loadPayPalScript called with locale:', locale);
    
    // التحقق من وجود PayPal SDK بنفس اللغة
    const existingScript = document.querySelector('script[src*="paypal.com/sdk/js"]');
    console.log('📍 Existing script:', !!existingScript);
    console.log('📍 window.paypal:', !!window.paypal);
    
    // التحقق من وجود PayPal SDK كامل وجاهز
    if (window.paypal && 
        typeof window.paypal.Buttons === 'function' && 
        existingScript?.getAttribute('src')?.includes(`locale=${locale}`)) {
      console.log('✅ PayPal already loaded with correct locale and Buttons available');
      console.log('📊 window.paypal.Buttons:', typeof window.paypal.Buttons);
      loadingPromise = null; // ⚡ إعادة تعيين flag
      resolve();
      return;
    }

    // إذا كان موجود لكن غير كامل أو بلغة مختلفة، إزالته
    if (existingScript || window.paypal) {
      console.log('🔄 Removing old/incomplete PayPal script...');
      if (existingScript) {
        existingScript.remove();
      }
      // إزالة window.paypal لإعادة التحميل
      delete (window as any).paypal;
      
      // ⚡ انتظار قليلاً بعد الحذف
      setTimeout(() => {
        loadNewScript();
      }, 100);
    } else {
      loadNewScript();
    }
    
    function loadNewScript() {
      console.log('📥 Loading new PayPal script...');
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&intent=capture&enable-funding=card&disable-funding=credit,paylater&locale=${locale}`;
      script.async = true;
      script.setAttribute('data-namespace', 'paypal'); // ⚡ منع التحميل المكرر
      script.setAttribute('data-sdk-integration-source', 'button-factory'); // ⚡ تحديد المصدر
      
      script.onload = () => {
        console.log('✅ PayPal SDK script loaded');
        console.log('📊 window.paypal available:', !!window.paypal);
        console.log('📊 window.paypal.Buttons:', window.paypal ? typeof window.paypal.Buttons : 'N/A');
        
        // ⚡ انتظار إضافي للتأكد من تحميل كل شيء
        setTimeout(() => {
          console.log('✅ PayPal SDK ready after delay');
          console.log('📊 Final check - window.paypal.Buttons:', window.paypal ? typeof window.paypal.Buttons : 'N/A');
          
          // ⚡ التحقق النهائي من Buttons
          if (window.paypal && typeof window.paypal.Buttons === 'function') {
            console.log('✅ PayPal.Buttons confirmed available!');
            loadingPromise = null;
            resolve();
          } else {
            console.warn('⚠️ PayPal.Buttons still not available, waiting more...');
            // انتظار إضافي
            setTimeout(() => {
              console.log('🔍 Final final check:', window.paypal ? typeof window.paypal.Buttons : 'N/A');
              loadingPromise = null;
              resolve();
            }, 500);
          }
        }, 1000); // زيادة من 500 إلى 1000ms
      };
      
      script.onerror = (error) => {
        console.error('❌ Failed to load PayPal SDK:', error);
        loadingPromise = null; // ⚡ إعادة تعيين flag
        reject(new Error('Failed to load PayPal SDK'));
      };
      
      console.log('📤 Appending script to head...');
      document.head.appendChild(script);
    }
  });
  
  return loadingPromise;
};
