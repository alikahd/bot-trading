// خدمة PayPal - بسيطة وفعالة
const PAYPAL_CLIENT_ID = 'AU1sWKh9MM-0g0L6RFy8fV1ly_6eNfLCm5az1Ua6s4k_7qb8YIhCy58gWJdhvROmPmmDWbBdozHjeVXV';

export const loadPayPalScript = (locale: string = 'en_US'): Promise<void> => {
  return new Promise((resolve, reject) => {
    // التحقق من وجود script قديم وإزالته
    const existingScript = document.querySelector('script[src*="paypal.com/sdk/js"]');
    if (existingScript) {
      console.log('🔄 Removing old PayPal script...');
      existingScript.remove();
      // إزالة window.paypal لإعادة التحميل
      delete (window as any).paypal;
    }

    // إذا كان موجود مسبقاً بنفس اللغة
    if (window.paypal && existingScript?.getAttribute('src')?.includes(`locale=${locale}`)) {
      console.log('✅ PayPal already loaded with correct locale');
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&intent=capture&enable-funding=card&disable-funding=credit,paylater&locale=${locale}`;
    script.async = true;
    
    script.onload = () => {
      console.log('✅ PayPal SDK loaded successfully');
      resolve();
    };
    
    script.onerror = () => {
      console.error('❌ Failed to load PayPal SDK');
      reject(new Error('Failed to load PayPal SDK'));
    };
    
    document.head.appendChild(script);
  });
};
