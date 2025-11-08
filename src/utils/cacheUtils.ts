/**
 * مسح جميع أنواع الـ Cache
 */
export const clearAllCaches = async (): Promise<void> => {
  try {

    // 1. مسح localStorage
    const keysToRemove = [
      'auth_state_cache',
      'subscription_step',
      'selected_plan',
      'user_info',
      'show_subscription_page',
      'active_tab',
      'show_data_source_panel',
      'show_real_data_panel'
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);

    });
    
    // 2. مسح sessionStorage
    sessionStorage.clear();

    // 3. مسح Service Worker Cache
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));

    }

  } catch (error) {

  }
};

/**
 * إعادة تحميل الصفحة مع مسح الـ Cache
 */
export const reloadWithCacheClear = async (): Promise<void> => {
  await clearAllCaches();
  
  // إعادة تحميل قوية مع timestamp لتجنب الـ cache
  const url = new URL(window.location.href);
  url.searchParams.set('_t', Date.now().toString());
  window.location.href = url.toString();
};

/**
 * التحقق من صلاحية الـ Cache (أقدم من 5 دقائق = غير صالح)
 */
export const isCacheValid = (timestamp: number, maxAgeMinutes: number = 5): boolean => {
  const now = Date.now();
  const age = now - timestamp;
  const maxAge = maxAgeMinutes * 60 * 1000; // تحويل إلى milliseconds
  return age < maxAge;
};
