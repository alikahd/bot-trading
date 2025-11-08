import { useState, useEffect } from 'react';
import { executeRealQuery, calculateRealTimeRemaining } from '../services/realSupabaseService';
import { realtimeSyncService } from '../services/realtimeSync';

export interface SubscriptionStatus {
  isActive: boolean;
  daysRemaining: number;
  hoursRemaining: number;
  minutesRemaining: number;
  subscription: any | null;
  isExpired: boolean;
  isExpiringSoon: boolean; // أقل من 7 أيام
  timeUntilExpiry: string; // نص وصفي للوقت المتبقي
}

export const useSubscriptionStatus = (userId?: string) => {
  const [status, setStatus] = useState<SubscriptionStatus>({
    isActive: false,
    daysRemaining: 0,
    hoursRemaining: 0,
    minutesRemaining: 0,
    subscription: null,
    isExpired: true,
    isExpiringSoon: false,
    timeUntilExpiry: 'منتهي'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const checkSubscriptionStatus = async (isBackground = false) => {
    if (!userId) {

      // إعادة تعيين الحالة للمستخدم غير مسجل الدخول
      setStatus({
        isActive: false,
        daysRemaining: 0,
        hoursRemaining: 0,
        minutesRemaining: 0,
        subscription: null,
        isExpired: true,
        isExpiringSoon: false,
        timeUntilExpiry: 'غير مسجل'
      });
      setLoading(false);
      setError(null);
      return;
    }

    try {
      // فقط نعرض شاشة التحميل في المرة الأولى
      if (!isBackground && isInitialLoad) {
        setLoading(true);
      }
      setError(null);

      // ✅ استعلام واحد مدمج مع التحقق الفوري من تاريخ الانتهاء
      const combinedQuery = `
        SELECT 
          u.id,
          u.username,
          u.email,
          u.role,
          u.status,
          u.subscription_status,
          u.subscription_end_date,
          u.created_at,
          s.id as subscription_id,
          s.status as subscription_table_status,
          s.start_date,
          s.end_date,
          s.plan_id,
          sp.name as plan_name,
          sp.name_ar as plan_name_ar,
          sp.features_ar as features,
          sp.plan_price as plan_price,
          -- ✅ التحقق الفوري من صلاحية الاشتراك
          CASE 
            WHEN s.end_date IS NOT NULL AND s.end_date < NOW() THEN false
            ELSE true
          END as is_subscription_valid
        FROM users u
        LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
        LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
        WHERE u.id = '${userId}'
        ORDER BY s.created_at DESC
        LIMIT 1
      `;
      
      const result = await executeRealQuery(combinedQuery);
      
      if (result.error) {
        throw new Error(`خطأ في جلب البيانات: ${result.error}`);
      }
      
      if (!result.data || result.data.length === 0) {
        throw new Error('المستخدم غير موجود في قاعدة البيانات');
      }

      const data = result.data[0];

      // إذا كان المستخدم مدير، فهو معفي من فحص الاشتراك
      if (data.role === 'admin') {
        setStatus({
          isActive: true,
          daysRemaining: 999,
          hoursRemaining: 0,
          minutesRemaining: 0,
          subscription: { status: 'admin', plan_name: 'Admin Access' },
          isExpired: false,
          isExpiringSoon: false,
          timeUntilExpiry: 'وصول دائم'
        });
        return;
      }

      // ✅ التحقق الفوري من صلاحية الاشتراك من قاعدة البيانات
      if (!data.subscription_id || !data.end_date || data.is_subscription_valid === false) {

        setStatus({
          isActive: false,
          daysRemaining: 0,
          hoursRemaining: 0,
          minutesRemaining: 0,
          subscription: null,
          isExpired: true,
          isExpiringSoon: false,
          timeUntilExpiry: 'لا يوجد اشتراك'
        });
        return;
      }

      // ✅ التحقق المزدوج من تاريخ الانتهاء (من قاعدة البيانات ومن JavaScript)
      const endDate = new Date(data.end_date);
      const now = new Date();
      
      if (endDate < now) {

        setStatus({
          isActive: false,
          daysRemaining: 0,
          hoursRemaining: 0,
          minutesRemaining: 0,
          subscription: null,
          isExpired: true,
          isExpiringSoon: false,
          timeUntilExpiry: 'منتهي'
        });
        return;
      }
      
      // بناء كائن الاشتراك من البيانات المدمجة
      const activeSubscription = {
        id: data.subscription_id,
        status: data.subscription_table_status,
        start_date: data.start_date,
        end_date: data.end_date,
        plan_id: data.plan_id,
        plan_name: data.plan_name,
        plan_name_ar: data.plan_name_ar,
        features: data.features,
        plan_price: data.plan_price
      };
      
      // حساب الوقت المتبقي باستخدام الدالة الحقيقية
      const timeData = calculateRealTimeRemaining(activeSubscription.end_date);

      setStatus({
        isActive: !timeData.expired,
        daysRemaining: timeData.days,
        hoursRemaining: timeData.hours,
        minutesRemaining: timeData.minutes,
        subscription: {
          ...activeSubscription,
          plan_name: activeSubscription.plan_name_ar || activeSubscription.plan_name
        },
        isExpired: timeData.expired,
        isExpiringSoon: timeData.days <= 7 && timeData.days >= 0 && !timeData.expired, // يظهر التنبيه عند 7 أيام أو أقل فقط
        timeUntilExpiry: timeData.expired ? 'منتهي' : `${timeData.days} يوم و ${timeData.hours} ساعة`
      });

    } catch (err) {

      setError('فشل في التحقق من حالة الاشتراك');
      
      // عند فشل جلب البيانات، نعتبر المستخدم غير نشط للأمان

      setStatus({
        isActive: false, // ❌ غير نشط للأمان
        daysRemaining: 0,
        hoursRemaining: 0,
        minutesRemaining: 0,
        subscription: null,
        isExpired: true,
        isExpiringSoon: false,
        timeUntilExpiry: 'خطأ في التحميل'
      });
      
      // ✅ لا نعيد المحاولة إذا كان المستخدم غير موجود (تسجيل خروج)
      // فقط نعيد المحاولة إذا كان خطأ شبكة أو خطأ مؤقت
      if (userId && err instanceof Error && !err.message.includes('غير موجود')) {
        setTimeout(() => {

          checkSubscriptionStatus(true);
        }, 30000);
      }
    } finally {
      setLoading(false);
      // بعد التحميل الأول، جميع التحديثات تكون في الخلفية
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
    }
  };

  useEffect(() => {
    checkSubscriptionStatus(false); // التحميل الأولي
    
    if (!userId) return;
    
    // ⚡ استخدام Realtime للتحديث الفوري (بدون تأخير)

    const unsubscribeUser = realtimeSyncService.subscribeToUserChanges(
      userId,
      async (_payload) => {

        await checkSubscriptionStatus(true);
      }
    );
    
    const unsubscribeSub = realtimeSyncService.subscribeToSubscriptionChanges(
      userId,
      async (_payload) => {

        await checkSubscriptionStatus(true);
      }
    );
    
    return () => {
      unsubscribeUser();
      unsubscribeSub();
    };
  }, [userId]);

  return {
    status,
    loading,
    error,
    refresh: () => checkSubscriptionStatus(true) // التحديث اليدوي في الخلفية
  };
};
