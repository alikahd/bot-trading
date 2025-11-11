// تكوين التطبيق
export const APP_CONFIG = {
  // URL الأساسي للتطبيق
  BASE_URL: import.meta.env.VITE_APP_URL || 
            (import.meta.env.MODE === 'production' 
              ? 'https://bootrading.com' 
              : 'http://localhost:5173'),
  
  // URL الـ API
  API_URL: import.meta.env.VITE_API_URL || 
           (import.meta.env.MODE === 'production' 
             ? 'https://bootrading.com/api' 
             : 'http://localhost:5173/api'),
  
  // البيئة
  IS_PRODUCTION: import.meta.env.MODE === 'production',
  IS_DEVELOPMENT: import.meta.env.MODE === 'development',
};

// دالة مساعدة للحصول على URL كامل
export const getFullUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${APP_CONFIG.BASE_URL}${cleanPath}`;
};

// دالة مساعدة للحصول على API URL كامل
export const getApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${APP_CONFIG.API_URL}${cleanEndpoint}`;
};
