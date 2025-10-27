import { useState, useEffect } from 'react';
import { executeRealQuery, calculateRealTimeRemaining } from '../services/realSupabaseService';

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


  const checkSubscriptionStatus = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // جلب بيانات المستخدم من قاعدة البيانات
      const userQuery = `
        SELECT id, username, email, role, subscription_status, subscription_end_date, created_at
        FROM users 
        WHERE id = '${userId}'
      `;
      const userResult = await executeRealQuery(userQuery);
      
      if (userResult.error) {
        throw new Error(`خطأ في جلب بيانات المستخدم: ${userResult.error}`);
      }
      
      if (!userResult.data || userResult.data.length === 0) {
        throw new Error('المستخدم غير موجود في قاعدة البيانات');
      }

      const userData = userResult.data[0];

      // إذا كان المستخدم مدير، فهو معفي من فحص الاشتراك
      if (userData.role === 'admin') {
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

      // جلب تفاصيل الاشتراك النشط
      const subscriptionQuery = `
        SELECT 
          s.*,
          sp.name as plan_name,
          sp.name_ar as plan_name_ar,
          sp.features_ar as features,
          sp.price as plan_price
        FROM subscriptions s
        LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
        WHERE s.user_id = '${userId}' AND s.status = 'active'
        ORDER BY s.created_at DESC LIMIT 1
      `;
      const subscriptionResult = await executeRealQuery(subscriptionQuery);
      
      if (subscriptionResult.error) {
        throw new Error(`خطأ في جلب بيانات الاشتراك: ${subscriptionResult.error}`);
      }
      
      if (!subscriptionResult.data || subscriptionResult.data.length === 0) {
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

      const activeSubscription = subscriptionResult.data[0];
      
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
      console.error('Error checking subscription status:', err);
      setError('فشل في التحقق من حالة الاشتراك');
      
      // عند فشل جلب البيانات، نعتبر المستخدم نشط مؤقتاً
      // مع إعادة المحاولة التلقائية
      console.log('⚠️ فشل جلب البيانات، سيتم إعادة المحاولة خلال 10 ثوان');
      
      setStatus({
        isActive: true, // ✅ نشط مؤقتاً 
        daysRemaining: 365, // سنة كاملة لتجنب التنبيهات
        hoursRemaining: 0,
        minutesRemaining: 0,
        subscription: { status: 'active', plan_name: 'جاري التحميل...' },
        isExpired: false,
        isExpiringSoon: false,
        timeUntilExpiry: 'جاري تحميل البيانات...'
      });
      
      // إعادة المحاولة بعد 10 ثوان
      setTimeout(() => {
        console.log('🔄 إعادة محاولة جلب البيانات...');
        checkSubscriptionStatus();
      }, 10000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSubscriptionStatus();
    
    // تحديث كل 5 دقائق لتجنب الضغط على قاعدة البيانات
    const interval = setInterval(checkSubscriptionStatus, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [userId]);

  return {
    status,
    loading,
    error,
    refresh: checkSubscriptionStatus
  };
};
