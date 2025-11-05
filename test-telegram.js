// اختبار إرسال رسالة إلى Telegram
const TELEGRAM_BOT_TOKEN = '8530062657:AAFda5kxR9VLgdTEyMum3ilTwRLaD93vN-8';
const TELEGRAM_CHAT_ID = '-1003153068884';

async function testTelegram() {
  try {
    const message = '🧪 اختبار البوت\n\nإذا وصلتك هذه الرسالة، البوت يعمل!';
    
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'HTML',
        }),
      }
    );

    const result = await response.json();
    
    if (result.ok) {
      console.log('✅ نجح! الرسالة وصلت إلى Telegram');
    } else {
      console.error('❌ فشل:', result);
    }
  } catch (error) {
    console.error('❌ خطأ:', error);
  }
}

testTelegram();
