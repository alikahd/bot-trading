// دالة مساعدة للتنقل مع تحديث URL
export const navigateWithURL = (path: string) => {
  // تحديث URL في المتصفح
  window.history.pushState({}, '', path);
  
  // إرسال حدث للـ Router
  window.dispatchEvent(new CustomEvent('app-navigate', { 
    detail: { path } 
  }));
};

// دالة للحصول على المسار الحالي
export const getCurrentPath = (): string => {
  return (window as any).currentPath || window.location.pathname;
};

// دالة لتحويل حالة التطبيق إلى مسار URL
export const getPathFromState = (state: {
  view?: string;
  authView?: string;
  paymentStep?: string;
  currentPage?: string;
}): string => {
  const { view, authView, paymentStep, currentPage } = state;
  
  // صفحات خاصة
  if (currentPage && currentPage !== 'main') {
    return `/${currentPage}`;
  }
  
  // صفحات المصادقة
  if (authView === 'login') return '/login';
  if (authView === 'register') return '/register';
  if (authView === 'verify') return '/verify-email';
  if (authView === 'reset') return '/reset-password';
  
  // صفحات الدفع
  if (paymentStep === 'payment') return '/payment';
  if (paymentStep === 'success') return '/payment/success';
  if (paymentStep === 'pending') return '/payment/pending';
  if (paymentStep === 'review') return '/payment/review';
  
  // صفحات أخرى
  if (view === 'subscription') return '/subscription';
  if (view === 'admin') return '/admin';
  if (view === 'subscriptionAndPayments') return '/subscription/manage';
  
  return '/';
};

// دالة لتحويل مسار URL إلى حالة التطبيق
export const getStateFromPath = (path: string): {
  view?: string;
  authView?: string;
  paymentStep?: string;
  currentPage?: string;
} => {
  // إزالة slash الأول
  const cleanPath = path.replace(/^\//, '');
  
  // صفحات خاصة
  if (cleanPath === 'terms') return { currentPage: 'terms' };
  if (cleanPath === 'contact') return { currentPage: 'contact' };
  if (cleanPath === 'about') return { currentPage: 'about' };
  
  // صفحات المصادقة
  if (cleanPath === 'login') return { authView: 'login' };
  if (cleanPath === 'register') return { authView: 'register' };
  if (cleanPath === 'verify-email') return { authView: 'verify' };
  if (cleanPath === 'reset-password') return { authView: 'reset' };
  
  // صفحات الدفع
  if (cleanPath === 'payment') return { paymentStep: 'payment' };
  if (cleanPath === 'payment/success') return { paymentStep: 'success' };
  if (cleanPath === 'payment/pending') return { paymentStep: 'pending' };
  if (cleanPath === 'payment/review') return { paymentStep: 'review' };
  
  // صفحات أخرى
  if (cleanPath === 'subscription') return { view: 'subscription' };
  if (cleanPath === 'admin') return { view: 'admin' };
  if (cleanPath === 'subscription/manage') return { view: 'subscriptionAndPayments' };
  
  return {};
};
