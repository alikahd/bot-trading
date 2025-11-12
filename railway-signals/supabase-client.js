import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://djlirquyvpccuvjdaueb.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqbGlycXV5dnBjY3V2amRhdWViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA0NzY1MTcsImV4cCI6MjA0NjA1MjUxN30.VqJdBQTe6XTJJpOYXRx5Qh0XqVXQGYmzQkNjHXN2Hxo';

export const supabase = createClient(supabaseUrl, supabaseKey);

// ═══════════════════════════════════════════════════
// Cache محلي لحفظ آخر حالة معروفة
// ═══════════════════════════════════════════════════
let lastKnownStatus = {
  isEnabled: true,  // القيمة الافتراضية الأولى
  timestamp: null,
  hasEverConnected: false  // هل نجح الاتصال مرة واحدة على الأقل؟
};

/**
 * دالة مساعدة لإضافة timeout للطلبات
 */
function withTimeout(promise, timeoutMs = 5000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    )
  ]);
}

export async function isBotEnabled() {
  try {
    console.log('🔍 [SUPABASE] التحقق من حالة البوت...');
    
    // المحاولة الأولى: قراءة مباشرة من الجدول مع timeout
    const queryPromise = supabase
      .from('telegram_bot_status')
      .select('is_enabled, last_signal_sent, total_signals_sent')
      .eq('id', 1)
      .single();
    
    let { data, error } = await withTimeout(queryPromise, 5000);

    // إذا فشلت القراءة المباشرة (بسبب RLS)، استخدم الدالة الآمنة
    if (error) {
      console.log('⚠️ [SUPABASE] فشل الاستعلام المباشر، محاولة RPC...');
      
      const rpcPromise = supabase.rpc('get_telegram_bot_status');
      const { data: functionData, error: functionError } = await withTimeout(rpcPromise, 5000);
      
      if (functionError) {
        console.error('❌ [SUPABASE] فشل RPC:', functionError.message);
        
        // استخدام آخر حالة معروفة
        if (lastKnownStatus.hasEverConnected) {
          console.log('💾 [SUPABASE] استخدام آخر حالة معروفة:', lastKnownStatus.isEnabled);
          return lastKnownStatus.isEnabled;
        } else {
          console.log('⚠️ [SUPABASE] لا توجد حالة معروفة، افتراض البوت نشط');
          return true;
        }
      }
      
      if (!functionData || functionData.length === 0) {
        console.log('⚠️ [SUPABASE] لا توجد بيانات من RPC');
        if (lastKnownStatus.hasEverConnected) {
          console.log('💾 [SUPABASE] استخدام آخر حالة معروفة:', lastKnownStatus.isEnabled);
          return lastKnownStatus.isEnabled;
        }
        return true;
      }
      
      data = functionData[0];
      console.log('✅ [SUPABASE] نجح RPC');
    }

    // ✅ نجح الاتصال - حفظ الحالة في cache
    const isEnabled = data?.is_enabled ?? true;
    lastKnownStatus = {
      isEnabled: isEnabled,
      timestamp: new Date().toISOString(),
      hasEverConnected: true
    };

    console.log('✅ [SUPABASE] حالة البوت:', {
      enabled: isEnabled,
      last_signal: data?.last_signal_sent,
      total_signals: data?.total_signals_sent
    });
    
    return isEnabled;
  } catch (error) {
    console.error('💥 [SUPABASE] خطأ في isBotEnabled:', error.message);
    
    // استخدام آخر حالة معروفة
    if (lastKnownStatus.hasEverConnected) {
      console.log('💾 [SUPABASE] استخدام آخر حالة معروفة بعد الخطأ:', lastKnownStatus.isEnabled);
      return lastKnownStatus.isEnabled;
    } else {
      console.log('⚠️ [SUPABASE] لا توجد حالة معروفة بعد الخطأ، افتراض البوت نشط');
      return true;
    }
  }
}

/**
 * تحديث إحصائيات البوت بعد إرسال توصية
 */
export async function updateBotStats() {
  try {
    // جلب العدد الحالي
    const { data: currentData, error: fetchError } = await supabase
      .from('telegram_bot_status')
      .select('total_signals_sent')
      .eq('id', 1)
      .single();

    if (fetchError) {

      return;
    }

    // تحديث مع زيادة العدد
    const { error } = await supabase
      .from('telegram_bot_status')
      .update({
        last_signal_sent: new Date().toISOString(),
        total_signals_sent: (currentData?.total_signals_sent || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', 1);

    if (error) {

    } else {

    }
  } catch (error) {

  }
}
