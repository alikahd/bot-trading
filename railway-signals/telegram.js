import fetch from 'node-fetch';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8530062657:AAFda5kxR9VLgdTEyMum3ilTwRLaD93vN-8';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '-1003153068884';

// إرسال رسالة إلى Telegram
export async function sendTelegramMessage(recommendation) {
  try {
    const isCall = recommendation.direction === 'CALL';
    const directionEmoji = isCall ? '🟢' : '🔴';
    const arrowEmoji = isCall ? '⬆️' : '⬇️';
    const directionText = isCall ? 'BUY | شراء 🟢' : 'SELL | بيع 🔴';
    
    // تحديد الثقة والمخاطر بناءً على النظام الجديد
    const confidenceEmoji = recommendation.confidence >= 80 ? '🟢' : 
                           recommendation.confidence >= 70 ? '🟡' : '🟠';
    const riskLevel = recommendation.confidence >= 80 ? 'منخفض' : 
                     recommendation.confidence >= 70 ? 'متوسط' : 'عالي';
    const riskEmoji = recommendation.confidence >= 80 ? '🟢' : 
                     recommendation.confidence >= 70 ? '🟡' : '🔴';
    
    const now = new Date();
    // حساب وقت الانتهاء بناءً على الإطار الزمني
    const timeframeMinutes = parseInt(recommendation.timeframe);
    const expiryTime = new Date(now.getTime() + timeframeMinutes * 60000);
    
    const formatTime = (date) => date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    const formatDate = (date) => date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    const message = `${directionEmoji} <b>${recommendation.symbol}</b> ${arrowEmoji} <b>${directionText}</b>

💰 <b>Price:</b> <code>${recommendation.price.toFixed(5)}</code>
⏱️ <b>Time:</b> ${recommendation.timeframe}

${confidenceEmoji} <b>Confidence:</b> ${recommendation.confidence}% | <b>Success:</b> ${Math.min(recommendation.confidence + 5, 95)}%
${riskEmoji} <b>Risk:</b> ${riskLevel}

🕐 <b>Entry:</b> ${formatTime(now)}
🕑 <b>Expiry:</b> ${formatTime(expiryTime)}

🤖 ${formatDate(now)} ${formatTime(now)}`;

    
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'HTML'
        })
      }
    );
    
    const result = await response.json();
    
    if (result.ok) {
      console.log('✅ تم إرسال التوصية إلى Telegram');
      return true;
    } else {
      console.error('❌ فشل إرسال التوصية:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ خطأ في إرسال رسالة Telegram:', error);
    return false;
  }
}
