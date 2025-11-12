import { getBinaryPrice, getHistoricalData } from './binary-websocket.js';
import { analyzeSignal } from './indicators.js';
import { sendTelegramMessage, sendMarketClosedMessage, isMarketOpen } from './telegram.js';
import { isBotEnabled, updateBotStats } from './supabase-client.js';
import http from 'http';

// العملات الرئيسية + المشفرة + السلع فقط (باستثناء المؤشرات والناشئة والتركيبية)
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
  // الأزواج المتقاطعة EUR (EUR Cross Pairs) - عادي + OTC
  // ═══════════════════════════════════════════════════
  'frxEURGBP', 'OTC_EURGBP',  // EUR/GBP
  'frxEURJPY', 'OTC_EURJPY',  // EUR/JPY
  'frxEURCHF', 'OTC_EURCHF',  // EUR/CHF
  'frxEURAUD', 'OTC_EURAUD',  // EUR/AUD
  'frxEURCAD', 'OTC_EURCAD',  // EUR/CAD
  'frxEURNZD', 'OTC_EURNZD',  // EUR/NZD
  
  // ═══════════════════════════════════════════════════
  // الأزواج المتقاطعة GBP (GBP Cross Pairs) - عادي + OTC
  // ═══════════════════════════════════════════════════
  'frxGBPJPY', 'OTC_GBPJPY',  // GBP/JPY
  'frxGBPCHF', 'OTC_GBPCHF',  // GBP/CHF
  'frxGBPAUD', 'OTC_GBPAUD',  // GBP/AUD
  'frxGBPCAD', 'OTC_GBPCAD',  // GBP/CAD
  'frxGBPNZD', 'OTC_GBPNZD',  // GBP/NZD
  
  // ═══════════════════════════════════════════════════
  // الأزواج المتقاطعة AUD (AUD Cross Pairs) - عادي + OTC
  // ═══════════════════════════════════════════════════
  'frxAUDJPY', 'OTC_AUDJPY',  // AUD/JPY
  'frxAUDCAD', 'OTC_AUDCAD',  // AUD/CAD
  'frxAUDCHF', 'OTC_AUDCHF',  // AUD/CHF
  'frxAUDNZD', 'OTC_AUDNZD',  // AUD/NZD
  
  // ═══════════════════════════════════════════════════
  // الأزواج المتقاطعة الأخرى (Other Cross Pairs) - عادي + OTC
  // ═══════════════════════════════════════════════════
  'frxCADJPY', 'OTC_CADJPY',  // CAD/JPY
  'frxCADCHF', 'OTC_CADCHF',  // CAD/CHF
  'frxCHFJPY', 'OTC_CHFJPY',  // CHF/JPY
  'frxNZDCAD', 'OTC_NZDCAD',  // NZD/CAD
  'frxNZDCHF', 'OTC_NZDCHF',  // NZD/CHF
  'frxNZDJPY', 'OTC_NZDJPY',  // NZD/JPY
  
  // ═══════════════════════════════════════════════════
  // السلع (Commodities) - عادي + OTC ✅
  // ═══════════════════════════════════════════════════
  'frxXAUUSD', 'OTC_XAUUSD',  // Gold
  'frxXAGUSD', 'OTC_XAGUSD',  // Silver
  'frxXPDUSD', 'OTC_XPDUSD',  // Palladium
  'frxXPTUSD', 'OTC_XPTUSD',  // Platinum
  'frxBROUSD', 'OTC_BROUSD',  // Brent Oil
  'frxWTIOUSD', 'OTC_WTIOUSD', // WTI Oil
  
  // ═══════════════════════════════════════════════════
  // العملات الرقمية (Cryptocurrencies) - 24/7 ✅
  // ═══════════════════════════════════════════════════
  'cryBTCUSD',  // Bitcoin
  'cryETHUSD',  // Ethereum
  'cryLTCUSD',  // Litecoin
  'cryXRPUSD',  // Ripple
  'cryBCHUSD',  // Bitcoin Cash
  'cryEOSUSD',  // EOS
  'cryBNBUSD',  // Binance Coin
  'cryXLMUSD',  // Stellar
  'cryADAUSD',  // Cardano
  'cryTRXUSD',  // Tron
  'cryDOTUSD',  // Polkadot
  'cryLINKUSD', // Chainlink
  'cryUNIUSD',  // Uniswap
  'crySOLUSD',  // Solana
  'cryAVAXUSD', // Avalanche
  'cryMATICUSD' // Polygon
  
  // ❌ مستثنى: المؤشرات (Indices)
  // ❌ مستثنى: العملات الناشئة (Exotic Pairs)
  // ❌ مستثنى: المؤشرات التركيبية (Synthetic Indices)
];

// معالجة التوصيات - استراتيجية صارمة
async function processSignals() {
  const startTime = Date.now();
  const now = new Date();
  console.log('\n🚀 ═══════════════════════════════════════════════════════════════');
  console.log(`🤖 [SERVER] بدء دورة تحليل جديدة`);
  console.log(`📅 التاريخ: ${now.toLocaleDateString('en-US')}`);
  console.log(`⏰ الوقت: ${now.toLocaleTimeString('en-US', { hour12: false })}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  // التحقق من حالة السوق أولاً
  console.log('🔍 [SERVER] التحقق من حالة السوق...');
  if (!isMarketOpen()) {
    console.log('🔴 [SERVER] السوق مغلق حالياً');

    // إرسال رسالة السوق مغلق (مرة واحدة فقط في اليوم)
    const lastSentKey = `market_closed_${now.toISOString().split('T')[0]}`;
    
    if (!global[lastSentKey]) {
      console.log('📤 [SERVER] إرسال رسالة السوق مغلق...');
      await sendMarketClosedMessage();
      global[lastSentKey] = true;
      console.log('✅ [SERVER] تم إرسال رسالة السوق مغلق');
    } else {
      console.log('⏭️ [SERVER] تم إرسال رسالة السوق مغلق مسبقاً اليوم');
    }
    return;
  }

  console.log('✅ [SERVER] السوق مفتوح - بدء التحليل');
  console.log(`📊 [SERVER] عدد الرموز للتحليل: ${SYMBOLS.length}`);

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
    console.log('🔍 [SERVER] التحقق من حالة البوت...');
    const botEnabled = await isBotEnabled();
    console.log('🤖 [SERVER] حالة البوت:', { enabled: botEnabled });
    
    if (!botEnabled) {
      console.log('⏸️ [SERVER] البوت متوقف - لن يتم إرسال التوصية');
    } else {
      console.log('✅ [SERVER] البوت نشط - جاري إرسال التوصية:', {
        symbol: bestSignal.symbol,
        direction: bestSignal.direction,
        confidence: bestSignal.confidence
      });
      
      const sent = await sendTelegramMessage(bestSignal);
      
      if (sent) {
        console.log('✅ [SERVER] تم إرسال التوصية بنجاح');
        // تحديث إحصائيات البوت
        await updateBotStats();
        console.log('📊 [SERVER] تم تحديث إحصائيات البوت');
      } else {
        console.error('❌ [SERVER] فشل إرسال التوصية');
      }
    }
  } else {
    console.log('⚠️ [SERVER] لا توجد توصيات للإرسال');
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('\n📊 [SERVER] ملخص الدورة:');
  console.log(`   ⏱️ المدة: ${duration}s`);
  console.log(`   ✅ تم التحليل: ${analyzed}`);
  console.log(`   ❌ أخطاء: ${errors}`);
  console.log(`   📈 توصيات: ${recommendations.length}`);
  console.log('═══════════════════════════════════════════════════════════════\n');
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
