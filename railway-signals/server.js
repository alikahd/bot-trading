import { getBinaryPrice, getHistoricalData } from './binary-websocket.js';
import { analyzeSignal } from './indicators.js';
import { sendTelegramMessage } from './telegram.js';

// أزواج Binary.com - عادي + OTC المتاحة
const SYMBOLS = [
  // ═══════════════════════════════════════════════════
  // الأزواج الرئيسية (Major Pairs) - عادي + OTC ✅
  // ═══════════════════════════════════════════════════
  'frxEURUSD', 'OTC_EURUSD',     // EUR/USD
  'frxGBPUSD', 'OTC_GBPUSD',     // GBP/USD
  'frxUSDJPY', 'OTC_USDJPY',     // USD/JPY
  'frxAUDUSD', 'OTC_AUDUSD',     // AUD/USD
  'frxUSDCAD', 'OTC_USDCAD',     // USD/CAD
  'frxUSDCHF', 'OTC_USDCHF',     // USD/CHF
  'frxNZDUSD', 'OTC_NZDUSD',     // NZD/USD
  
  // ═══════════════════════════════════════════════════
  // الأزواج المتقاطعة EUR (EUR Cross Pairs) - عادي فقط
  // ═══════════════════════════════════════════════════
  'frxEURGBP',  // EUR/GBP
  'frxEURJPY',  // EUR/JPY
  'frxEURCHF',  // EUR/CHF
  'frxEURAUD',  // EUR/AUD
  'frxEURCAD',  // EUR/CAD
  'frxEURNZD',  // EUR/NZD
  
  // ═══════════════════════════════════════════════════
  // الأزواج المتقاطعة GBP (GBP Cross Pairs) - عادي فقط
  // ═══════════════════════════════════════════════════
  'frxGBPJPY',  // GBP/JPY
  'frxGBPCHF',  // GBP/CHF
  'frxGBPAUD',  // GBP/AUD
  'frxGBPCAD',  // GBP/CAD
  'frxGBPNZD',  // GBP/NZD
  
  // ═══════════════════════════════════════════════════
  // الأزواج المتقاطعة AUD (AUD Cross Pairs) - عادي فقط
  // ═══════════════════════════════════════════════════
  'frxAUDJPY',  // AUD/JPY
  'frxAUDCAD',  // AUD/CAD
  'frxAUDCHF',  // AUD/CHF
  'frxAUDNZD',  // AUD/NZD
  
  // ═══════════════════════════════════════════════════
  // الأزواج المتقاطعة الأخرى (Other Cross Pairs) - عادي فقط
  // ═══════════════════════════════════════════════════
  'frxCADJPY',  // CAD/JPY
  'frxCADCHF',  // CAD/CHF
  'frxCHFJPY',  // CHF/JPY
  'frxNZDCAD',  // NZD/CAD
  'frxNZDCHF',  // NZD/CHF
  'frxNZDJPY'   // NZD/JPY
];

// معالجة التوصيات - استراتيجية صارمة
async function processSignals() {
  const startTime = Date.now();
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 دورة تحليل جديدة - ' + new Date().toLocaleTimeString('en-US'));
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const recommendations = [];
  let analyzed = 0;
  let errors = 0;
  
  for (const symbol of SYMBOLS) {
    try {
      // جلب البيانات التاريخية الحقيقية
      const prices = await getHistoricalData(symbol, 100);
      
      if (prices && prices.length >= 100) {
        analyzed++;
        
        // تحليل وإنشاء توصية
        const signal = analyzeSignal(prices, symbol);
        
        if (signal) {
          console.log(`✅ ${signal.symbol} ${signal.direction} ${signal.timeframe} (${signal.confidence}%)`);
          recommendations.push(signal);
        }
      }
      
      // تأخير صغير بين الطلبات
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      errors++;
      // تجاهل الأخطاء الصامتة (رموز غير صالحة)
      if (!error.message.includes('invalid')) {
        console.error(`❌ ${symbol}: ${error.message}`);
      }
    }
  }
  
  console.log(`\n📊 إحصائيات التحليل:`);
  console.log(`   • تم تحليل: ${analyzed} زوج`);
  console.log(`   • توصيات قوية: ${recommendations.length}`);
  console.log(`   • أخطاء: ${errors}`);
  
  // إرسال أفضل توصية (دائماً إذا وجدت)
  if (recommendations.length > 0) {
    // ترتيب حسب الثقة
    const sortedSignals = recommendations.sort((a, b) => b.confidence - a.confidence);
    const bestSignal = sortedSignals[0];
    
    console.log(`\n📤 إرسال أفضل توصية:`);
    console.log(`   • ${bestSignal.symbol} ${bestSignal.direction}`);
    console.log(`   • إطار زمني: ${bestSignal.timeframe}`);
    console.log(`   • ثقة: ${bestSignal.confidence}%`);
    
    const sent = await sendTelegramMessage(bestSignal);
    
    if (sent) {
      console.log(`✅ تم الإرسال بنجاح إلى Telegram`);
    } else {
      console.log(`❌ فشل الإرسال - سيتم المحاولة في الدورة القادمة`);
    }
  } else {
    console.log(`\n⚠️ لا توجد توصيات قوية في هذه الدورة`);
    console.log(`   السبب: جميع الإشارات أقل من 60% ثقة`);
    console.log(`   سيتم التحليل مجدداً بعد دقيقتين`);
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n⏱️ مدة التحليل: ${duration} ثانية`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
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

// Keep-Alive لمنع Sleep Mode في Render
setInterval(() => {
  console.log('💓 Keep-Alive ping - ' + new Date().toLocaleTimeString());
}, 10 * 60 * 1000); // كل 10 دقائق

// بدء التشغيل
console.log('🎯 Binary.com Trading Signals - Railway');
console.log('📡 اتصال حقيقي بـ Binary.com WebSocket');
console.log('🔄 تحديث كل دقيقتين');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

startCronJob().catch(error => {
  console.error('❌ خطأ فادح:', error);
  process.exit(1);
});
