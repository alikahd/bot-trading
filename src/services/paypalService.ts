// خدمة PayPal - بسيطة وفعالة
const PAYPAL_CLIENT_ID = 'AW-Cj16q_BRyJhBJWvtAYC_kNCtlDMQHEoiBvTO4Qi6q6jnfuFtOP3FJALXuoeisQhDc8pajVCr2crqG';

// ⚡ Flag لمنع التحميل المتزامن
let loadingPromise: Promise<void> | null = null;

export const loadPayPalScript = (locale: string = 'en_US'): Promise<void> => {
  // إذا كان هناك تحميل جاري، انتظره
  if (loadingPromise) {

    return loadingPromise;
  }
  
  loadingPromise = new Promise((resolve, reject) => {

    // التحقق من وجود PayPal SDK بنفس اللغة
    const existingScript = document.querySelector('script[src*="paypal.com/sdk/js"]');

    // التحقق من وجود PayPal SDK كامل وجاهز
    if (window.paypal && 
        typeof window.paypal.Buttons === 'function' && 
        existingScript?.getAttribute('src')?.includes(`locale=${locale}`)) {

      loadingPromise = null; // ⚡ إعادة تعيين flag
      resolve();
      return;
    }

    // إذا كان موجود لكن غير كامل أو بلغة مختلفة، إزالته
    if (existingScript || window.paypal) {

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

      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&intent=capture&enable-funding=card&disable-funding=credit,paylater&locale=${locale}`;
      script.async = true;
      script.setAttribute('data-namespace', 'paypal'); // ⚡ منع التحميل المكرر
      script.setAttribute('data-sdk-integration-source', 'button-factory'); // ⚡ تحديد المصدر
      
      script.onload = () => {

        // ⚡ انتظار إضافي للتأكد من تحميل كل شيء
        setTimeout(() => {

          // ⚡ التحقق النهائي من Buttons
          if (window.paypal && typeof window.paypal.Buttons === 'function') {

            loadingPromise = null;
            resolve();
          } else {

            // انتظار إضافي
            setTimeout(() => {

              loadingPromise = null;
              resolve();
            }, 500);
          }
        }, 1000); // زيادة من 500 إلى 1000ms
      };
      
      script.onerror = (_error) => {

        loadingPromise = null; // ⚡ إعادة تعيين flag
        reject(new Error('Failed to load PayPal SDK'));
      };

      document.head.appendChild(script);
    }
  });
  
  return loadingPromise;
};
