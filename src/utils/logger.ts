/**
 * نظام Logging آمن
 * يعرض الرسائل فقط في بيئة التطوير
 * يمنع تسريب المعلومات الحساسة في الإنتاج
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },

  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  error: (...args: any[]) => {
    if (isDevelopment) {
      console.error(...args);
    }
  },

  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },

  // للأخطاء الحرجة فقط - تظهر في الإنتاج أيضاً
  critical: (...args: any[]) => {
    console.error('[CRITICAL]', ...args);
  }
};

// تعطيل console في الإنتاج
if (!isDevelopment) {
  console.log = () => {};
  console.info = () => {};
  console.debug = () => {};
  console.warn = () => {};
  // نبقي console.error للأخطاء الحرجة فقط
}

export default logger;
