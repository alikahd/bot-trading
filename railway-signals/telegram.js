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
    
    const message = `🔴 <b>السوق مغلق حالياً</b> 🔴

⚠️ <b>سوق الفوركس مغلق خلال عطلة نهاية الأسبوع</b>
📊 التوصيات متوقفة مؤقتاً

⏰ <b>ساعات العمل:</b>
• <b>الأحد 22:00 GMT</b> → <b>الجمعة 22:00 GMT</b>
• السوق مغلق: <b>السبت والأحد (حتى 22:00 GMT)</b>

🔄 <b>سيتم استئناف التوصيات تلقائياً عند افتتاح السوق</b>

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
    return result.ok;
  } catch (error) {
    return false;
  }
}

// إرسال رسالة إلى Telegram
export async function sendTelegramMessage(recommendation) {
  console.log('📤 [TELEGRAM] بدء إرسال توصية:', {
    symbol: recommendation.symbol,
    direction: recommendation.direction,
    confidence: recommendation.confidence,
    timeframe: recommendation.timeframe,
    timestamp: new Date().toISOString()
  });
  
  try {
    const now = new Date();
    
    // إعطاء المتداول دقيقة كاملة للدخول
    const entryTime = new Date(now.getTime() + 60 * 1000); // +1 دقيقة
    const expiryTime = new Date(entryTime.getTime() + parseInt(recommendation.timeframe) * 60 * 1000);
    
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
    
    const message = `${directionEmoji} <b>${recommendation.symbol}</b> ${arrowEmoji} <b>${directionText}</b>

💰 <b>Price:</b> <code>${recommendation.price.toFixed(5)}</code>
⏱️ <b>Timeframe:</b> ${recommendation.timeframe}

${confidenceEmoji} <b>Confidence:</b> ${recommendation.confidence}% | <b>Success Rate:</b> ${recommendation.expected_success_rate}%
${riskEmoji} <b>Risk Level:</b> ${riskLevel}

📊 <b>Market Analysis:</b>
• <b>Trend:</b> ${recommendation.market_analysis.trend.toUpperCase()}
• <b>Strength:</b> ${recommendation.market_analysis.strength} points
• <b>RSI:</b> ${recommendation.rsi} (${recommendation.market_analysis.rsi_level})
• <b>Volatility:</b> ${recommendation.market_analysis.volatility.toUpperCase()}

🔍 <b>Reasons:</b>
${recommendation.reasons.slice(0, 3).map(reason => `• ${reason}`).join('\n')}

🕐 <b>Entry Time:</b> ${formatTime(entryTime)}
🕑 <b>Expiry Time:</b> ${formatTime(expiryTime)}

🤖 <b>Generated:</b> ${formatDate(now)} ${formatTime(now)}`;

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
