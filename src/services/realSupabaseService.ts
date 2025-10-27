// خدمة الاتصال المباشر بقاعدة البيانات Supabase
import { supabase } from '../config/supabaseClient';

interface RealSupabaseResponse {
  data?: any;
  error?: any;
}

// استخدام Supabase مباشرة - بسيط وفعال
export const executeRealQuery = async (query: string): Promise<RealSupabaseResponse> => {
  console.log('🔍 تنفيذ استعلام مباشر على Supabase:', query);
  
  // استخدام الاستعلام المباشر مباشرة بدلاً من محاولة RPC غير موجود
  return await executeDirectQuery(query);
};

// استعلام مباشر بدون RPC
const executeDirectQuery = async (query: string): Promise<RealSupabaseResponse> => {
  try {
    // تحليل نوع الاستعلام وتنفيذه مباشرة
    if (query.includes('FROM users')) {
      console.log('👤 جلب بيانات المستخدم...');
      return await getUsersData(query);
    } else if (query.includes('FROM subscriptions')) {
      console.log('📦 جلب بيانات الاشتراك...');
      return await getSubscriptionsData(query);
    } else if (query.includes('FROM payments')) {
      console.log('💳 جلب بيانات المدفوعات...');
      return await getPaymentsData(query);
    }
    
    // إذا لم نتمكن من تحليل الاستعلام، نرجع خطأ
    console.warn('⚠️ نوع استعلام غير مدعوم:', query);
    return {
      data: null,
      error: 'نوع استعلام غير مدعوم'
    };
    
  } catch (error) {
    console.error('❌ خطأ في الاستعلام المباشر:', error);
    return {
      data: null,
      error: `خطأ في الاستعلام: ${error}`
    };
  }
};

// جلب بيانات المستخدمين
const getUsersData = async (query: string): Promise<RealSupabaseResponse> => {
  try {
    // استخراج user_id من الاستعلام
    const userIdMatch = query.match(/WHERE id = '([^']+)'/);
    const userId = userIdMatch ? userIdMatch[1] : null;
    
    if (!userId) {
      return { data: null, error: 'لم يتم العثور على معرف المستخدم' };
    }
    
    const { data, error } = await supabase
      .from('users')
      .select('id, username, email, role, subscription_status, subscription_end_date, created_at')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('❌ خطأ في جلب بيانات المستخدم:', error);
      return { data: null, error: error.message };
    }
    
    console.log('✅ تم جلب بيانات المستخدم بنجاح');
    return { data: [data], error: null };
    
  } catch (error) {
    return { data: null, error: `خطأ في جلب المستخدمين: ${error}` };
  }
};

// جلب بيانات الاشتراكات
const getSubscriptionsData = async (query: string): Promise<RealSupabaseResponse> => {
  try {
    // استخراج user_id من الاستعلام
    const userIdMatch = query.match(/WHERE s\.user_id = '([^']+)'/);
    const userId = userIdMatch ? userIdMatch[1] : null;
    
    if (!userId) {
      return { data: null, error: 'لم يتم العثور على معرف المستخدم' };
    }
    
    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        id,
        user_id,
        plan_id,
        status,
        start_date,
        end_date,
        payment_method,
        payment_reference,
        amount_paid,
        currency,
        auto_renew,
        created_at,
        updated_at,
        subscription_plans!inner(
          name,
          name_ar,
          name_fr,
          features,
          features_ar,
          features_fr,
          price
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('❌ خطأ في جلب بيانات الاشتراك:', error);
      return { data: null, error: error.message };
    }
    
    console.log('✅ تم جلب بيانات الاشتراك بنجاح');
    
    console.log('📊 بيانات الاشتراك الخام:', data);
    
    // تحويل البيانات لتتوافق مع الصيغة المطلوبة
    const formattedData = data.map(sub => {
      const planData = Array.isArray(sub.subscription_plans) ? sub.subscription_plans[0] : sub.subscription_plans;
      const formatted = {
        ...sub,
        plan_name: planData?.name,
        plan_name_ar: planData?.name_ar,
        plan_name_fr: planData?.name_fr,
        features: planData?.features,
        features_ar: planData?.features_ar,
        features_fr: planData?.features_fr,
        plan_price: planData?.price
      };
      
      console.log('📊 بيانات الاشتراك المنسقة:', {
        id: formatted.id,
        start_date: formatted.start_date,
        end_date: formatted.end_date,
        created_at: formatted.created_at,
        plan_name_ar: formatted.plan_name_ar,
        plan_price: formatted.plan_price
      });
      
      return formatted;
    });
    
    return { data: formattedData, error: null };
    
  } catch (error) {
    return { data: null, error: `خطأ في جلب الاشتراكات: ${error}` };
  }
};

// جلب بيانات المدفوعات
const getPaymentsData = async (query: string): Promise<RealSupabaseResponse> => {
  try {
    // استخراج user_id من الاستعلام
    const userIdMatch = query.match(/WHERE user_id = '([^']+)'/);
    const userId = userIdMatch ? userIdMatch[1] : null;
    
    if (!userId) {
      return { data: null, error: 'لم يتم العثور على معرف المستخدم' };
    }
    
    const { data, error } = await supabase
      .from('payments')
      .select('id, user_id, amount, currency, payment_method, status, payment_reference, created_at, proof_image')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20); // نجلب أكثر ثم نفلتر المكررات
    
    if (error) {
      console.error('❌ خطأ في جلب بيانات المدفوعات:', error);
      return { data: null, error: error.message };
    }
    
    console.log('✅ تم جلب بيانات المدفوعات بنجاح');
    
    // فلترة المدفوعات المكررة
    const uniquePayments = data?.filter((payment: any, index: number, self: any[]) => {
      const firstIndex = self.findIndex((p: any) => {
        // مقارنة بناءً على ID أولاً
        if (p.id === payment.id) return true;
        
        // مقارنة بناءً على المعايير الأخرى للمدفوعات المتشابهة
        return (
          p.amount === payment.amount &&
          p.currency === payment.currency &&
          p.payment_method === payment.payment_method &&
          p.created_at === payment.created_at &&
          p.user_id === payment.user_id
        );
      });
      
      return index === firstIndex;
    }).slice(0, 10); // نأخذ أول 10 مدفوعات فقط
    
    return { data: uniquePayments, error: null };
    
  } catch (error) {
    return { data: null, error: `خطأ في جلب المدفوعات: ${error}` };
  }
};


// دالة لحساب الوقت المتبقي
export const calculateRealTimeRemaining = (endDate: string) => {
  if (!endDate) {
    console.error('تاريخ الانتهاء غير موجود');
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }
  
  try {
    // تنظيف التاريخ - دعم صيغ مختلفة
    let cleanEndDate = endDate.trim();
    
    // إذا كان التاريخ يحتوي على +00:00، نحوله إلى Z
    if (cleanEndDate.includes('+00:00')) {
      cleanEndDate = cleanEndDate.replace('+00:00', 'Z');
    }
    // إذا كان يحتوي على +00 فقط، نحوله إلى Z
    else if (cleanEndDate.includes('+00')) {
      cleanEndDate = cleanEndDate.replace('+00', 'Z');
    }
    // إذا لم يحتوي على منطقة زمنية، نضيف Z
    else if (!cleanEndDate.includes('Z') && !cleanEndDate.includes('+') && !cleanEndDate.includes('-', 10)) {
      cleanEndDate += 'Z';
    }
    
    const now = new Date();
    const end = new Date(cleanEndDate);
    
    // تسجيل مؤقت للتشخيص
    if (isNaN(end.getTime())) {
      console.log('📅 تحليل التاريخ:', {
        original: endDate,
        cleaned: cleanEndDate,
        now: now.toISOString(),
        end: end.toISOString(),
        isValid: false
      });
    }
    
    // التحقق من صحة التاريخ
    if (isNaN(end.getTime())) {
      console.error('تاريخ انتهاء غير صحيح:', endDate);
      return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    }
    
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return { days, hours, minutes, seconds, expired: false };
  } catch (error) {
    console.error('خطأ في حساب الوقت المتبقي:', error, 'التاريخ:', endDate);
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }
};

// دالة لتنسيق التاريخ باللاتينية
export const formatRealLatinDate = (dateString: string, locale: string = 'en-US') => {
  if (!dateString) {
    return { full: 'غير محدد', short: 'غير محدد', time: 'غير محدد' };
  }
  
  try {
    // تنظيف التاريخ وتحويله - دعم صيغ مختلفة
    let cleanDate = dateString.trim();
    
    // إذا كان التاريخ يحتوي على +00:00، نحوله إلى Z
    if (cleanDate.includes('+00:00')) {
      cleanDate = cleanDate.replace('+00:00', 'Z');
    }
    // إذا كان يحتوي على +00 فقط، نحوله إلى Z
    else if (cleanDate.includes('+00')) {
      cleanDate = cleanDate.replace('+00', 'Z');
    }
    // إذا لم يحتوي على منطقة زمنية، نضيف Z
    else if (!cleanDate.includes('Z') && !cleanDate.includes('+') && !cleanDate.includes('-', 10)) {
      cleanDate += 'Z';
    }
    
    const date = new Date(cleanDate);
    
    // التحقق من صحة التاريخ
    if (isNaN(date.getTime())) {
      console.error('تاريخ غير صحيح:', dateString);
      return { full: 'تاريخ غير صحيح', short: 'تاريخ غير صحيح', time: 'تاريخ غير صحيح' };
    }
    
    // تنسيق التاريخ بصيغ مختلفة
    const formatted = {
      full: date.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      short: date.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
    
    return formatted;
    
  } catch (error) {
    console.error('❌ خطأ في تنسيق التاريخ:', error, 'التاريخ الأصلي:', dateString);
    return { full: 'خطأ في التاريخ', short: 'خطأ في التاريخ', time: 'خطأ في التاريخ' };
  }
};
