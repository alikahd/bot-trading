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
    const { data, error } = await supabase
      .from('telegram_bot_status')
      .select('is_enabled')
      .single();

    if (error) {
      // إذا لم يكن هناك سجل، افترض أن البوت مفعّل (القيمة الافتراضية)
      if (error.code === 'PGRST116') {
        console.log('⚠️ لا يوجد سجل لحالة البوت - سيتم اعتبار البوت مفعّل افتراضياً');
        return true;
      }
      console.error('❌ خطأ في جلب حالة البوت:', error);
      return true; // في حالة الخطأ، نفترض أن البوت مفعّل
    }

    return data?.is_enabled ?? true;
  } catch (error) {
    console.error('❌ خطأ في الاتصال بـ Supabase:', error);
    return true; // في حالة الخطأ، نفترض أن البوت مفعّل
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
