// تشغيل البوت محلياً كل دقيقتين
const { createClient } = require('@supabase/supabase-js');

const TELEGRAM_BOT_TOKEN = '8530062657:AAFda5kxR9VLgdTEyMum3ilTwRLaD93vN-8';
const TELEGRAM_CHAT_ID = '-1003153068884';
const SUPABASE_URL = 'https://djlirquyvpccuvjdaueb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // أضف المفتاح

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function sendSignal() {
  console.log('🚀 بدء إرسال التوصيات...');
  
  // هنا نسخ كود fetchRecommendations من send-telegram-signals.ts
  // ثم إرسال التوصية
  
  console.log('✅ تم!');
}

// تشغيل كل دقيقتين
setInterval(sendSignal, 2 * 60 * 1000);
sendSignal(); // تشغيل فوري

console.log('⏰ البوت يعمل محلياً كل دقيقتين...');
