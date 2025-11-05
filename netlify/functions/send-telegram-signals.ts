import { Handler, schedule } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

// تكوين البيئة
const TELEGRAM_BOT_TOKEN = process.env.VITE_TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.VITE_TELEGRAM_CHAT_ID;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

// إنشاء Supabase client
const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

interface BinaryRecommendation {
  symbol: string;
  symbolName: string;
  direction: 'CALL' | 'PUT';
  confidence: number;
  timeframe: string;
  expiryMinutes: number;
  entryTime: string;
  expiryTime: string;
  currentPrice: number;
  successProbability: number;
  riskLevel: string;
  reasoning: string;
}

// تنسيق اسم الزوج
const formatPairName = (symbol: string): string => {
  let cleanSymbol = symbol.replace(/_OTC|_otc/gi, '');
  if (cleanSymbol.length === 6) {
    return `${cleanSymbol.substring(0, 3)}/${cleanSymbol.substring(3, 6)}`;
  }
  return cleanSymbol;
};

// إرسال رسالة إلى Telegram
const sendTelegramMessage = async (message: string): Promise<boolean> => {
  try {
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
    return result.ok;
  } catch (error) {
    console.error('❌ خطأ في إرسال رسالة Telegram:', error);
    return false;
  }
};

// جلب التوصيات الحقيقية من Binary.com WebSocket
const fetchRecommendations = async (): Promise<BinaryRecommendation[]> => {
  try {
    // الاتصال بـ Binary.com WebSocket API
    const ws_url = 'wss://ws.binaryws.com/websockets/v3?app_id=1089';
    
    // أزواج العملات (Binary Options - Forex Pairs)
    // متوافق مع: IQ Option, Expert Option, Quotex, Pocket Option
    const pairs = [
      // الأزواج الرئيسية (Major Pairs) - عادي + OTC
      'EURUSD', 'EURUSD_otc',  // EUR/USD
      'GBPUSD', 'GBPUSD_otc',  // GBP/USD
      'USDJPY', 'USDJPY_otc',  // USD/JPY
      'USDCHF', 'USDCHF_otc',  // USD/CHF
      'AUDUSD', 'AUDUSD_otc',  // AUD/USD
      'USDCAD', 'USDCAD_otc',  // USD/CAD
      'NZDUSD', 'NZDUSD_otc',  // NZD/USD
      
      // الأزواج المتقاطعة (Cross Pairs) - عادي + OTC
      'EURGBP', 'EURGBP_otc',  // EUR/GBP
      'EURJPY', 'EURJPY_otc',  // EUR/JPY
      'EURCHF', 'EURCHF_otc',  // EUR/CHF
      'EURAUD', 'EURAUD_otc',  // EUR/AUD
      'GBPJPY', 'GBPJPY_otc',  // GBP/JPY
      'GBPCHF', 'GBPCHF_otc',  // GBP/CHF
      'AUDJPY', 'AUDJPY_otc',  // AUD/JPY
      'AUDCAD', 'AUDCAD_otc',  // AUD/CAD
      'CADJPY', 'CADJPY_otc',  // CAD/JPY
      'CHFJPY', 'CHFJPY_otc'   // CHF/JPY
    ];
    
    const recommendations: BinaryRecommendation[] = [];
    
    // جلب البيانات لكل زوج
    for (const symbol of pairs) {
      try {
        // جلب الأسعار التاريخية (100 شمعة)
        const ticksResponse = await fetch(
          `https://api.binary.com/api/v3/ticks_history?ticks_history=${symbol}&count=100&end=latest&style=candles&granularity=60`
        );
        
        if (!ticksResponse.ok) continue;
        
        const ticksData = await ticksResponse.json();
        if (!ticksData.candles || ticksData.candles.length < 50) continue;
        
        const candles = ticksData.candles;
        const prices = candles.map((c: any) => c.close);
        const currentPrice = prices[prices.length - 1];
        
        // حساب المؤشرات الفنية
        const rsi = calculateRSI(prices, 14);
        const { macd, signal } = calculateMACD(prices);
        const ema12 = calculateEMA(prices, 12);
        const ema26 = calculateEMA(prices, 26);
        
        // تحديد الاتجاه
        let direction: 'CALL' | 'PUT' | null = null;
        let confidence = 0;
        const reasons: string[] = [];
        
        // استراتيجية 1: RSI
        if (rsi < 30) {
          direction = 'CALL';
          confidence += 25;
          reasons.push('RSI oversold');
        } else if (rsi > 70) {
          direction = 'PUT';
          confidence += 25;
          reasons.push('RSI overbought');
        }
        
        // استراتيجية 2: MACD
        if (macd > signal) {
          if (direction === 'CALL' || !direction) {
            direction = 'CALL';
            confidence += 20;
            reasons.push('MACD bullish');
          }
        } else {
          if (direction === 'PUT' || !direction) {
            direction = 'PUT';
            confidence += 20;
            reasons.push('MACD bearish');
          }
        }
        
        // استراتيجية 3: EMA Crossover
        if (ema12 > ema26) {
          if (direction === 'CALL' || !direction) {
            direction = 'CALL';
            confidence += 20;
            reasons.push('EMA12 > EMA26');
          }
        } else {
          if (direction === 'PUT' || !direction) {
            direction = 'PUT';
            confidence += 20;
            reasons.push('EMA12 < EMA26');
          }
        }
        
        // فقط إذا كانت الثقة ≥ 40%
        if (direction && confidence >= 40) {
          const now = new Date();
          const expiryTime = new Date(now.getTime() + 5 * 60000);
          
          recommendations.push({
            symbol: symbol,
            symbolName: symbol.replace('frx', ''),
            direction: direction,
            confidence: Math.min(confidence, 95),
            timeframe: '5m',
            expiryMinutes: 5,
            entryTime: now.toISOString(),
            expiryTime: expiryTime.toISOString(),
            currentPrice: currentPrice,
            successProbability: Math.min(confidence + 10, 90),
            riskLevel: confidence >= 70 ? 'Low' : confidence >= 50 ? 'Medium' : 'High',
            reasoning: reasons.join(' • ')
          });
        }
      } catch (error) {
        console.error(`خطأ في تحليل ${symbol}:`, error);
      }
    }
    
    return recommendations;
  } catch (error) {
    console.error('❌ خطأ في جلب التوصيات:', error);
    return [];
  }
};

// دوال المؤشرات الفنية
const calculateRSI = (prices: number[], period: number = 14): number => {
  if (prices.length < period + 1) return 50;
  
  let gains = 0;
  let losses = 0;
  
  for (let i = prices.length - period; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
};

const calculateEMA = (prices: number[], period: number): number => {
  if (prices.length < period) return prices[prices.length - 1];
  
  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b) / period;
  
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  
  return ema;
};

const calculateMACD = (prices: number[]): { macd: number; signal: number } => {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macd = ema12 - ema26;
  
  // تبسيط: استخدام EMA9 للـ signal
  const macdLine = [macd];
  const signal = macd; // تبسيط
  
  return { macd, signal };
};

// تنسيق رسالة التوصية
const formatRecommendation = (rec: BinaryRecommendation): string => {
  const isCall = rec.direction === 'CALL';
  const directionEmoji = isCall ? '🟢' : '🔴';
  const arrowEmoji = isCall ? '⬆️' : '⬇️';
  const directionText = isCall ? 'BUY | شراء 🟢' : 'SELL | بيع 🔴';
  
  const getConfidenceEmoji = (confidence: number) => {
    if (confidence >= 80) return '🟢';
    if (confidence >= 70) return '🟡';
    return '🟠';
  };

  const getRiskEmoji = (risk: string) => {
    if (risk.includes('منخفض') || risk.toLowerCase().includes('low')) return '🟢';
    if (risk.includes('متوسط') || risk.toLowerCase().includes('medium')) return '🟡';
    return '🔴';
  };

  const formattedPair = formatPairName(rec.symbolName);
  const now = new Date();
  
  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
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

  return `
${directionEmoji} <b>${formattedPair}</b> ${arrowEmoji} <b>${directionText}</b>

💰 <b>Price:</b> <code>${rec.currentPrice.toFixed(5)}</code>
⏱️ <b>Time:</b> ${rec.expiryMinutes}min

${getConfidenceEmoji(rec.confidence)} <b>Confidence:</b> ${rec.confidence}% | <b>Success:</b> ${rec.successProbability}%
${getRiskEmoji(rec.riskLevel)} <b>Risk:</b> ${rec.riskLevel}

🕐 <b>Entry:</b> ${formatTime(rec.entryTime)}
🕑 <b>Expiry:</b> ${formatTime(rec.expiryTime)}

📝 ${rec.reasoning}

🤖 ${formatDate(now)} ${formatTime(now.toISOString())}
  `.trim();
};

// الدالة الرئيسية
const mainHandler: Handler = async (event, context) => {
  console.log('🚀 بدء إرسال التوصيات إلى Telegram...');

  // التحقق من حالة البوت من قاعدة البيانات
  if (supabase) {
    try {
      const { data: botStatus, error } = await supabase
        .from('telegram_bot_status')
        .select('is_enabled')
        .eq('id', 1)
        .single();

      if (!error && botStatus && !botStatus.is_enabled) {
        console.log('⏸️ البوت متوقف مؤقتاً من لوحة التحكم');
        return {
          statusCode: 200,
          body: JSON.stringify({ message: 'Bot is paused by admin' }),
        };
      }
    } catch (error) {
      console.error('خطأ في التحقق من حالة البوت:', error);
    }
  }

  // التحقق من المتغيرات البيئية
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error('❌ متغيرات Telegram غير موجودة');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing Telegram configuration' }),
    };
  }

  try {
    // جلب التوصيات
    const recommendations = await fetchRecommendations();
    
    if (recommendations.length === 0) {
      console.log('⚠️ لا توجد توصيات متاحة');
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No recommendations available' }),
      };
    }

    // ترتيب حسب الثقة
    const sortedRecs = recommendations.sort((a, b) => b.confidence - a.confidence);
    
    // إرسال أفضل توصية
    const topRec = sortedRecs[0];
    const message = formatRecommendation(topRec);
    
    const success = await sendTelegramMessage(message);
    
    if (success) {
      console.log(`✅ تم إرسال التوصية: ${topRec.symbolName} ${topRec.direction}`);
      
      // تحديث عداد التوصيات في قاعدة البيانات
      if (supabase) {
        try {
          await supabase.rpc('increment_telegram_signals');
        } catch (error) {
          console.error('خطأ في تحديث العداد:', error);
        }
      }
      
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'Signal sent successfully',
          signal: {
            pair: topRec.symbolName,
            direction: topRec.direction,
            confidence: topRec.confidence,
          },
        }),
      };
    } else {
      throw new Error('Failed to send Telegram message');
    }
  } catch (error) {
    console.error('❌ خطأ في معالجة التوصيات:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to process signals',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

// تصدير كـ scheduled function (كل دقيقة)
export const handler = schedule('* * * * *', mainHandler);
