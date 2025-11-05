import { getBinaryPrice, getHistoricalData } from './binary-websocket.js';
import { analyzeSignal } from './indicators.js';
import { sendTelegramMessage } from './telegram.js';

// جميع أزواج Binary.com - عادي + OTC
const SYMBOLS = [
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

// معالجة التوصيات
async function processSignals() {
  console.log('🚀 بدء تحليل الأزواج...');
  const recommendations = [];
  
  for (const symbol of SYMBOLS) {
    try {
      console.log(`📊 تحليل ${symbol}...`);
      
      // جلب البيانات التاريخية الحقيقية
      const prices = await getHistoricalData(symbol, 100);
      
      if (prices && prices.length >= 100) {
        // تحليل وإنشاء توصية
        const signal = analyzeSignal(prices, symbol);
        
        if (signal) {
          console.log(`✅ توصية: ${signal.symbol} ${signal.direction} (${signal.confidence}%)`);
          recommendations.push(signal);
        }
      }
      
      // تأخير صغير بين الطلبات
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`❌ خطأ في ${symbol}:`, error.message);
    }
  }
  
  // إرسال أفضل توصية
  if (recommendations.length > 0) {
    const bestSignal = recommendations.sort((a, b) => b.confidence - a.confidence)[0];
    console.log(`📤 إرسال أفضل توصية: ${bestSignal.symbol} ${bestSignal.direction}`);
    await sendTelegramMessage(bestSignal);
  } else {
    console.log('⚠️ لا توجد توصيات قوية في هذه الدورة');
  }
  
  console.log(`✅ اكتمل التحليل - ${recommendations.length} توصية`);
}

// تشغيل كل دقيقتين
async function startCronJob() {
  console.log('⏰ بدء Cron Job - كل دقيقتين');
  
  // تشغيل فوري
  await processSignals();
  
  // ثم كل دقيقتين
  setInterval(async () => {
    console.log('\n⏰ دورة جديدة...');
    await processSignals();
  }, 2 * 60 * 1000); // دقيقتين
}

// بدء التشغيل
console.log('🎯 Binary.com Trading Signals - Railway');
console.log('📡 اتصال حقيقي بـ Binary.com WebSocket');
console.log('🔄 تحديث كل دقيقتين');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

startCronJob().catch(error => {
  console.error('❌ خطأ فادح:', error);
  process.exit(1);
});
