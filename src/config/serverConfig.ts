/**
 * إعدادات السيرفر المركزية
 * تغيير رابط واحد يؤثر على كل المشروع
 */

// رابط سيرفر IQ Option
export const IQ_OPTION_SERVER_URL = 
  process.env.NODE_ENV === 'production' 
    ? 'https://bot-trading-production-6630.up.railway.app'  // رابط Railway
    : 'http://localhost:5000';  // للتطوير المحلي

// API endpoints
export const API_ENDPOINTS = {
  status: `${IQ_OPTION_SERVER_URL}/api/status`,
  quotes: `${IQ_OPTION_SERVER_URL}/api/quotes`,
  quote: (symbol: string) => `${IQ_OPTION_SERVER_URL}/api/quotes/${symbol}`,
};

// دالة مساعدة للتحقق من توفر السيرفر
export const checkServerHealth = async (): Promise<boolean> => {
  try {
    // استخدام AbortController للـ timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(API_ENDPOINTS.status, { 
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error('❌ السيرفر غير متاح:', error);
    return false;
  }
};

export default {
  IQ_OPTION_SERVER_URL,
  API_ENDPOINTS,
  checkServerHealth
};
