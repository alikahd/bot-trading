import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://djlirquyvpccuvjdaueb.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqbGlycXV5dnBjY3V2amRhdWViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA0NzY1MTcsImV4cCI6MjA0NjA1MjUxN30.VqJdBQTe6XTJJpOYXRx5Qh0XqVXQGYmzQkNjHXN2Hxo';

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * التحقق من حالة بوت Telegram
 * @returns {Promise<boolean>} true إذا كان البوت مفعّل، false إذا كان متوقف
 */
export async function isBotEnabled() {
  try {
    console.log('🔍 جاري التحقق من حالة البوت في Supabase...');
    
    // المحاولة الأولى: قراءة مباشرة من الجدول
    let { data, error } = await supabase
      .from('telegram_bot_status')
      .select('is_enabled')
      .single();

    // إذا فشلت القراءة المباشرة (بسبب RLS)، استخدم الدالة الآمنة
    if (error) {
      console.log('⚠️ فشل القراءة المباشرة، محاولة استخدام الدالة الآمنة...');
      
      const { data: functionData, error: functionError } = await supabase
        .rpc('get_telegram_bot_status');
      
      if (functionError) {
        console.error('❌ خطأ في استدعاء الدالة:', functionError);
        console.log('⚠️ سيتم اعتبار البوت متوقف للأمان');
        return false;
      }
      
      if (!functionData || functionData.length === 0) {
        console.log('⚠️ لا توجد بيانات - سيتم اعتبار البوت متوقف للأمان');
        return false;
      }
      
      data = functionData[0];
    }

    const isEnabled = data?.is_enabled ?? false;
    console.log(`📊 حالة البوت من قاعدة البيانات: ${isEnabled ? '✅ مفعّل' : '⏸️ متوقف'}`);
    console.log(`   آخر توصية: ${data?.last_signal_sent || 'لا توجد'}`);
    console.log(`   إجمالي التوصيات: ${data?.total_signals_sent || 0}`);
    return isEnabled;
  } catch (error) {
    console.error('❌ خطأ في الاتصال بـ Supabase:', error);
    console.log('⚠️ فشل الاتصال - سيتم اعتبار البوت متوقف للأمان');
    return false;
  }
}

/**
 * تحديث إحصائيات البوت بعد إرسال توصية
 */
export async function updateBotStats() {
  try {
    const { error } = await supabase
      .from('telegram_bot_status')
      .update({
        last_signal_sent: new Date().toISOString(),
        total_signals_sent: supabase.raw('total_signals_sent + 1'),
        updated_at: new Date().toISOString()
      })
      .eq('id', 1);

    if (error) {
      console.error('❌ خطأ في تحديث إحصائيات البوت:', error);
    }
  } catch (error) {
    console.error('❌ خطأ في تحديث إحصائيات البوت:', error);
  }
}
