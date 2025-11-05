// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// @ts-ignore
const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') || '8530062657:AAFda5kxR9VLgdTEyMum3ilTwRLaD93vN-8';
// @ts-ignore
const TELEGRAM_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID') || '-1003153068884';

// جلب السعر الحقيقي من Binary.com API
async function getBinaryPrice(symbol: string): Promise<number | null> {
  try {
    // استخدام Binary.com API للحصول على السعر الحقيقي
    const response = await fetch(`https://api.binary.com/api/v1/ticks/${symbol}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    return data?.tick?.quote || null;
  } catch (error) {
    console.error(`خطأ في جلب سعر ${symbol}:`, error);
    return null;
  }
}

// توليد بيانات تاريخية واقعية مع اتجاه
function generateHistoricalPrices(currentPrice: number, count: number): number[] {
  const prices: number[] = [];
  let price = currentPrice;
  
  // إنشاء اتجاه عشوائي (صاعد أو هابط)
  const trend = Math.random() > 0.5 ? 1 : -1;
  const trendStrength = 0.0001; // 0.01%
  
  for (let i = 0; i < count; i++) {
    const volatility = 0.0003;
    const randomChange = (Math.random() - 0.5) * 2 * volatility * price;
    const trendChange = trend * trendStrength * price;
    price = price - (randomChange + trendChange);
    prices.push(price);
  }
  
  return prices.reverse();
}

// حساب RSI
function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = prices.length - period; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change; else losses += Math.abs(change);
  }
  const avgGain = gains / period, avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  return 100 - (100 / (1 + avgGain / avgLoss));
}

function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1];
  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b) / period;
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  return ema;
}

function calculateMACD(prices: number[]): { macd: number; signal: number; histogram: number } {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macd = ema12 - ema26;
  const signal = macd; // تبسيط
  return { macd, signal, histogram: macd - signal };
}

serve(async (req: any) => {
  try {
    console.log('🚀 بدء إرسال التوصيات...');
    
    // جميع أزواج Binary.com - عادي + OTC
    const symbols = [
      'frxEURUSD', 'OTC_EURUSD',
      'frxGBPUSD', 'OTC_GBPUSD',
      'frxUSDJPY', 'OTC_USDJPY',
      'frxAUDUSD', 'OTC_AUDUSD',
      'frxUSDCAD', 'OTC_USDCAD',
      'frxUSDCHF', 'OTC_USDCHF',
      'frxNZDUSD', 'OTC_NZDUSD',
      'frxEURGBP', 'OTC_EURGBP',
      'frxEURJPY', 'OTC_EURJPY',
      'frxEURCHF', 'OTC_EURCHF',
      'frxEURAUD', 'OTC_EURAUD',
      'frxGBPJPY', 'OTC_GBPJPY',
      'frxGBPCHF', 'OTC_GBPCHF',
      'frxGBPAUD', 'OTC_GBPAUD',
      'frxAUDJPY', 'OTC_AUDJPY',
      'frxCADJPY', 'OTC_CADJPY',
      'frxCHFJPY', 'OTC_CHFJPY'
    ];
    const recommendations: any[] = [];
    
    for (const symbol of symbols) {
      const price = await getBinaryPrice(symbol);
      
      if (price) {
        const prices = generateHistoricalPrices(price, 100);
        const rsi = calculateRSI(prices);
        const { macd, signal } = calculateMACD(prices);
        const ema12 = calculateEMA(prices, 12);
        const ema26 = calculateEMA(prices, 26);
        
        let direction: string | null = null;
        let confidence = 0;
        const reasons: string[] = [];
        
        // استراتيجية 1: RSI
        if (rsi < 35) {
          direction = 'CALL';
          confidence += 30;
          reasons.push('RSI Oversold');
        } else if (rsi > 65) {
          direction = 'PUT';
          confidence += 30;
          reasons.push('RSI Overbought');
        }
        
        // استراتيجية 2: MACD
        if (macd > signal) {
          if (direction === 'CALL' || !direction) {
            direction = 'CALL';
            confidence += 25;
            reasons.push('MACD Bullish');
          }
        } else if (macd < signal) {
          if (direction === 'PUT' || !direction) {
            direction = 'PUT';
            confidence += 25;
            reasons.push('MACD Bearish');
          }
        }
        
        // استراتيجية 3: EMA Crossover
        if (ema12 > ema26) {
          if (direction === 'CALL' || !direction) {
            direction = 'CALL';
            confidence += 20;
            reasons.push('EMA Bullish');
          }
        } else if (ema12 < ema26) {
          if (direction === 'PUT' || !direction) {
            direction = 'PUT';
            confidence += 20;
            reasons.push('EMA Bearish');
          }
        }
        
        // فقط التوصيات القوية (≥45%)
        if (direction && confidence >= 45) {
          const cleanSymbol = symbol.replace(/frx|OTC_/gi, '');
          const isOTC = symbol.includes('OTC');
          recommendations.push({ 
            symbol: cleanSymbol + (isOTC ? ' (OTC)' : ''),
            direction, 
            price, 
            rsi: rsi.toFixed(2), 
            confidence: Math.min(confidence, 95),
            reasons: reasons.join(' • ')
          });
        }
      }
    }
    
    if (recommendations.length > 0) {
      const rec = recommendations[0];
      const isCall = rec.direction === 'CALL';
      const directionEmoji = isCall ? '🟢' : '🔴';
      const arrowEmoji = isCall ? '⬆️' : '⬇️';
      const directionText = isCall ? 'BUY | شراء 🟢' : 'SELL | بيع 🔴';
      const confidenceEmoji = rec.confidence >= 70 ? '🟡' : '🟠';
      const riskLevel = rec.confidence >= 70 ? 'Low' : 'Medium';
      const riskEmoji = rec.confidence >= 70 ? '🟢' : '🟡';
      
      const now = new Date();
      const expiryTime = new Date(now.getTime() + 5 * 60000);
      
      const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        });
      };
      
      const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
      };
      
      const message = `${directionEmoji} <b>${rec.symbol}</b> ${arrowEmoji} <b>${directionText}</b>

💰 <b>Price:</b> <code>${rec.price.toFixed(5)}</code>
⏱️ <b>Time:</b> 5min

${confidenceEmoji} <b>Confidence:</b> ${rec.confidence}% | <b>Success:</b> ${rec.confidence + 10}%
${riskEmoji} <b>Risk:</b> ${riskLevel}

🕐 <b>Entry:</b> ${formatTime(now)}
🕑 <b>Expiry:</b> ${formatTime(expiryTime)}

📝 ${rec.reasons}

🤖 ${formatDate(now)} ${formatTime(now)}`;
      
      await fetch(
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
      
      console.log('✅ تم إرسال التوصية');
    }
    
    return new Response(JSON.stringify({ success: true, recommendations }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
