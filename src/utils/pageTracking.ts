/**
 * تتبع الصفحات في Facebook Pixel و TikTok Pixel و Google Analytics
 */

// تتبع صفحة معينة
export const trackPageView = (pagePath?: string, pageName?: string) => {
  const path = pagePath || window.location.pathname;
  const name = pageName || getPageName(path);

  // Facebook Pixel
  if (typeof (window as any).fbq !== 'undefined') {
    (window as any).fbq('track', 'PageView');
    (window as any).fbq('trackCustom', 'ViewContent', {
      content_name: name,
      content_category: 'page',
      page_path: path,
    });
  }

  // TikTok Pixel
  if (typeof (window as any).ttq !== 'undefined') {
    (window as any).ttq.page();
    (window as any).ttq.track('ViewContent', {
      content_name: name,
      content_category: 'page',
      page_path: path,
    });
  }

  // Google Analytics
  if (typeof (window as any).gtag !== 'undefined') {
    (window as any).gtag('event', 'page_view', {
      page_path: path,
      page_title: document.title,
      page_location: window.location.href,
    });
  }
};

// الحصول على اسم الصفحة من المسار
export const getPageName = (path: string): string => {
  const pageNames: Record<string, string> = {
    '/': 'Homepage',
    '/home': 'Home',
    '/payment': 'Payment',
    '/about': 'About Us',
    '/contact': 'Contact',
    '/subscription': 'Subscription',
    '/terms': 'Terms & Conditions',
    '/privacy': 'Privacy Policy',
    '/signals': 'Trading Signals',
    '/dashboard': 'Dashboard',
    '/settings': 'Settings',
    '/login': 'Login',
    '/register': 'Register',
    '/forgot-password': 'Forgot Password',
  };

  return pageNames[path] || formatPathToName(path);
};

// تحويل المسار إلى اسم قابل للقراءة
const formatPathToName = (path: string): string => {
  return path
    .replace('/', '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

// تتبع حدث مخصص في Facebook Pixel
export const trackFacebookEvent = (
  eventName: string,
  params?: Record<string, any>
) => {
  if (typeof (window as any).fbq !== 'undefined') {
    (window as any).fbq('track', eventName, params);
  }
};

// تتبع حدث مخصص في TikTok Pixel
export const trackTikTokEvent = (
  eventName: string,
  params?: Record<string, any>
) => {
  if (typeof (window as any).ttq !== 'undefined') {
    (window as any).ttq.track(eventName, params);
  }
};

// تتبع حدث في جميع المنصات
export const trackEvent = (
  eventName: string,
  params?: Record<string, any>
) => {
  trackFacebookEvent(eventName, params);
  trackTikTokEvent(eventName, params);

  // Google Analytics
  if (typeof (window as any).gtag !== 'undefined') {
    (window as any).gtag('event', eventName, params);
  }
};

// أحداث محددة مسبقاً

// تتبع التسجيل
export const trackRegistration = (method: string = 'email') => {
  trackFacebookEvent('CompleteRegistration', { method });
  trackTikTokEvent('CompleteRegistration', { method });
  
  if (typeof (window as any).gtag !== 'undefined') {
    (window as any).gtag('event', 'sign_up', { method });
  }
};

// تتبع تسجيل الدخول
export const trackLogin = (method: string = 'email') => {
  trackFacebookEvent('Login', { method });
  trackTikTokEvent('Login', { method });
  
  if (typeof (window as any).gtag !== 'undefined') {
    (window as any).gtag('event', 'login', { method });
  }
};

// تتبع الاشتراك
export const trackSubscription = (
  planName: string,
  value: number,
  currency: string = 'USD'
) => {
  const params = {
    content_name: planName,
    value,
    currency,
  };

  trackFacebookEvent('Subscribe', params);
  trackTikTokEvent('Subscribe', params);
  
  if (typeof (window as any).gtag !== 'undefined') {
    (window as any).gtag('event', 'purchase', {
      transaction_id: `sub_${Date.now()}`,
      value,
      currency,
      items: [{ item_name: planName, price: value, quantity: 1 }],
    });
  }
};

// تتبع مشاهدة إشارة تداول
export const trackSignalView = (signalType: string, pair: string) => {
  const params = {
    content_name: `${signalType} Signal`,
    content_category: 'trading_signal',
    currency_pair: pair,
  };

  trackFacebookEvent('ViewContent', params);
  trackTikTokEvent('ViewContent', params);
  
  if (typeof (window as any).gtag !== 'undefined') {
    (window as any).gtag('event', 'view_item', params);
  }
};

// تتبع نقرة على زر
export const trackButtonClick = (
  buttonName: string,
  location?: string
) => {
  const params = {
    button_name: buttonName,
    location: location || window.location.pathname,
  };

  trackEvent('ClickButton', params);
};

// تتبع إرسال نموذج
export const trackFormSubmit = (
  formName: string,
  success: boolean = true
) => {
  const params = {
    form_name: formName,
    success,
  };

  trackEvent('FormSubmit', params);
};

// تتبع بدء تجربة مجانية
export const trackStartTrial = (planName?: string) => {
  const params = planName ? { plan_name: planName } : {};
  
  trackFacebookEvent('StartTrial', params);
  trackTikTokEvent('StartTrial', params);
  
  if (typeof (window as any).gtag !== 'undefined') {
    (window as any).gtag('event', 'begin_checkout', params);
  }
};

// تتبع إضافة إلى قائمة الرغبات
export const trackAddToWishlist = (itemName: string) => {
  const params = {
    content_name: itemName,
  };

  trackFacebookEvent('AddToWishlist', params);
  trackTikTokEvent('AddToWishlist', params);
  
  if (typeof (window as any).gtag !== 'undefined') {
    (window as any).gtag('event', 'add_to_wishlist', params);
  }
};

// تتبع البحث
export const trackSearch = (searchTerm: string) => {
  const params = {
    search_string: searchTerm,
  };

  trackFacebookEvent('Search', params);
  trackTikTokEvent('Search', params);
  
  if (typeof (window as any).gtag !== 'undefined') {
    (window as any).gtag('event', 'search', { search_term: searchTerm });
  }
};
