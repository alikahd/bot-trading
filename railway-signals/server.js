import { getBinaryPrice, getHistoricalData } from './binary-websocket.js';
import { analyzeSignal } from './indicators.js';
import { sendTelegramMessage } from './telegram.js';
import { isBotEnabled, updateBotStats } from './supabase-client.js';
import http from 'http';

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

          recommendations.push(signal);
        }
      }
      
      // تأخير صغير بين الطلبات
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      errors++;
      // تجاهل الأخطاء الصامتة (رموز غير صالحة)
      if (!error.message.includes('invalid')) {

      }
    }
  }

  // إرسال أفضل توصية (دائماً إذا وجدت)
  // عرض أفضل 5 توصيات للتشخيص
  if (recommendations.length > 0) {

    recommendations.slice(0, 5).forEach((rec, i) => {

    });
  }
  
  if (recommendations.length > 0) {
    // ترتيب حسب الثقة
    const sortedSignals = recommendations.sort((a, b) => b.confidence - a.confidence);
    const bestSignal = sortedSignals[0];

    // ✅ التحقق من حالة البوت قبل الإرسال
    const botEnabled = await isBotEnabled();
    
    if (!botEnabled) {

    } else {

      const sent = await sendTelegramMessage(bestSignal);
      
      if (sent) {

        // تحديث إحصائيات البوت
        await updateBotStats();
      } else {

      }
    }
  } else {

  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

}

// تشغيل كل دقيقتين بالضبط (21:02:00, 21:04:00, إلخ)
async function startCronJob() {

  // حساب الوقت حتى الدقيقة الزوجية القادمة
  const now = new Date();
  const currentMinute = now.getMinutes();
  const currentSecond = now.getSeconds();
  
  // حساب الدقائق المتبقية حتى الدقيقة الزوجية القادمة
  const minutesUntilNext = currentMinute % 2 === 0 ? 0 : 1;
  const secondsUntilNext = minutesUntilNext * 60 - currentSecond;

  // انتظر حتى الدقيقة الزوجية القادمة
  setTimeout(async () => {
    // تشغيل فوري عند الدقيقة الزوجية
    await processSignals();
    
    // ثم كل دقيقتين بالضبط
    setInterval(async () => {
      await processSignals();
    }, 2 * 60 * 1000); // دقيقتين
  }, secondsUntilNext * 1000);
}

// Keep-Alive لمنع Sleep Mode في Render
setInterval(() => {

}, 10 * 60 * 1000); // كل 10 دقائق

// إنشاء HTTP Server لـ Render (يتطلب Port)
const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'healthy', 
      service: 'Binary.com Trading Signals',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }));
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('🤖 Binary.com Trading Bot is running!\n✅ Sending signals every 2 minutes');
  }
});

server.listen(PORT, () => {

});

// بدء Cron Job
startCronJob().catch(error => {

  process.exit(1);
});
