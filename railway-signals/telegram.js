import fetch from 'node-fetch';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8530062657:AAFda5kxR9VLgdTEyMum3ilTwRLaD93vN-8';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '-1003153068884';

// التحقق من حالة السوق
export function isMarketOpen() {
  const now = new Date();
  const day = now.getUTCDay(); // 0 = الأحد, 6 = السبت
  const hour = now.getUTCHours();
  
  // سوق الفوركس مغلق في عطلة نهاية الأسبوع
  // يفتح: الأحد 22:00 GMT/UTC
  // يغلق: الجمعة 22:00 GMT/UTC
  if (day === 6) return false; // السبت - مغلق طوال اليوم
  if (day === 0 && hour < 22) return false; // الأحد قبل 22:00 UTC - مغلق
  if (day === 5 && hour >= 22) return false; // الجمعة بعد 22:00 UTC - مغلق
  
  return true; // السوق مفتوح
}

// إرسال رسالة السوق مغلق
export async function sendMarketClosedMessage() {
  try {
    const now = new Date();
    const formatTime = (date) => date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    const formatDate = (date) => date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    const message = `🔴 <b>MARKET CLOSED</b> 🔴
━━━━━━━━━━━━━━━━━━

⚠️ <b>Forex market is currently closed</b>
📊 Signal generation is temporarily paused

━━━━━━━━━━━━━━━━━━
⏰ <b>TRADING HOURS</b>
━━━━━━━━━━━━━━━━━━
🟢 <b>Open:</b> Sunday 22:00 GMT
🔴 <b>Close:</b> Friday 22:00 GMT
❌ <b>Closed:</b> Saturday & Sunday (until 22:00 GMT)

━━━━━━━━━━━━━━━━━━
🔄 <b>Signals will resume automatically when market opens</b>

🤖 <b>Status checked at:</b> <code>${formatDate(now)} ${formatTime(now)}</code>`;

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
    return result.ok;
  } catch (error) {
    return false;
  }
}

// إرسال رسالة إلى Telegram
export async function sendTelegramMessage(recommendation, retries = 3) {
  console.log('📤 [TELEGRAM] بدء إرسال توصية:', {
    symbol: recommendation.symbol,
    direction: recommendation.direction,
    confidence: recommendation.confidence,
    timeframe: recommendation.timeframe,
    timestamp: new Date().toISOString()
  });
  
  try {
    const now = new Date();
    
    // حساب أوقات الشراء بدقة - إعطاء المتداول وقت كافي
    const entryTime = new Date(now.getTime() + 90 * 1000); // +90 ثانية (دقيقة ونصف) للدخول
    const timeframeMinutes = parseInt(recommendation.timeframe);
    const expiryTime = new Date(entryTime.getTime() + timeframeMinutes * 60 * 1000);
    
    // حساب الوقت المتبقي للدخول وعرضه بشكل واضح
    const timeToEntry = Math.round((entryTime.getTime() - now.getTime()) / 1000);
    let entryCountdown = '';
    if (timeToEntry > 0) {
      const minutes = Math.floor(timeToEntry / 60);
      const seconds = timeToEntry % 60;
      if (minutes > 0) {
        entryCountdown = ` (${minutes}m ${seconds}s to enter)`;
      } else {
        entryCountdown = ` (${seconds}s to enter)`;
      }
    }
    
    const isCall = recommendation.direction === 'CALL';
    const directionEmoji = isCall ? '🟢' : '🔴';
    const arrowEmoji = isCall ? '⬆️' : '⬇️';
    const directionText = isCall ? 'BUY | شراء 🟢' : 'SELL | بيع 🔴';
    
    const getConfidenceEmoji = (confidence) => {
      if (confidence >= 80) return '🟢';
      if (confidence >= 70) return '🟡';
      return '🟠';
    };
    
    const getRiskEmoji = (confidence) => {
      if (confidence >= 80) return '🟢';
      if (confidence >= 65) return '🟡';
      return '🔴';
    };
    
    const riskLevel = recommendation.confidence >= 80 ? 'منخفض' : 
                      recommendation.confidence >= 65 ? 'متوسط' : 'عالي';
    
    const confidenceEmoji = getConfidenceEmoji(recommendation.confidence);
    const riskEmoji = getRiskEmoji(recommendation.confidence);
    
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
    
    const message = `🚀 <b>BINARY OPTIONS SIGNAL</b> 🚀
━━━━━━━━━━━━━━━━━━

💱 <b>PAIR:</b> <code>${recommendation.symbol}</code>
${arrowEmoji} <b>DIRECTION:</b> <b>${directionText}</b>
💰 <b>ENTRY PRICE:</b> <code>${recommendation.price.toFixed(5)}</code>
${confidenceEmoji} <b>Confidence:</b> <b>${recommendation.confidence}%</b>

━━━━━━━━━━━━━━━━━━
⏰ <b>TRADING SCHEDULE</b>
━━━━━━━━━━━━━━━━━━
🕐 <b>Entry Time:</b> <code>${formatTime(entryTime)}</code>${entryCountdown}
🕑 <b>Expiry Time:</b> <code>${formatTime(expiryTime)}</code>
⏱️ <b>Duration:</b> <b>${timeframeMinutes} minutes</b>

━━━━━━━━━━━━━━━━━━
🤖 <b>Generated:</b> <code>${formatTime(now)}</code>

<i>💡 Enter within ${Math.floor(timeToEntry/60)}m ${timeToEntry%60}s</i>`;

    console.log('🌐 [TELEGRAM] إرسال طلب HTTP:', {
      url: `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN.substring(0, 10)}...`,
      chat_id: TELEGRAM_CHAT_ID,
      message_length: message.length
    });
    
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
    
    console.log('📡 [TELEGRAM] استجابة HTTP:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });
    
    const result = await response.json();
    console.log('📋 [TELEGRAM] نتيجة JSON:', result);
    
    if (result.ok) {
      console.log('✅ [TELEGRAM] تم إرسال التوصية بنجاح:', {
        message_id: result.result?.message_id,
        chat_id: result.result?.chat?.id
      });
      return true;
    } else {
      console.error('❌ [TELEGRAM] فشل إرسال التوصية:', {
        error_code: result.error_code,
        description: result.description
      });
      return false;
    }
  } catch (error) {
    console.error('💥 [TELEGRAM] خطأ في إرسال التوصية:', {
      error: error.message,
      stack: error.stack,
      name: error.name
    });
    return false;
  }
}
