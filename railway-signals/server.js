import { getBinaryPrice, getHistoricalData } from './binary-websocket.js';
import { analyzeSignal } from './indicators.js';
import { sendTelegramMessage, sendMarketClosedMessage, isMarketOpen } from './telegram.js';
import { isBotEnabled, updateBotStats } from './supabase-client.js';
import http from 'http';

// أزواج العملات الحقيقية فقط - رموز صحيحة من Binary.com
const SYMBOLS = [
  // ═══════════════════════════════════════════════════
  // الأزواج الرئيسية (Major Pairs) ✅
  // ═══════════════════════════════════════════════════
  'frxEURUSD',     // EUR/USD - الأكثر تداولاً
  'frxGBPUSD',     // GBP/USD - مستقر وسائل
  'frxUSDJPY',     // USD/JPY - مستقر جداً
  'frxAUDUSD',     // AUD/USD - جيد للتحليل
  'frxUSDCAD',     // USD/CAD - مستقر
  'frxUSDCHF',     // USD/CHF - مستقر
  'frxNZDUSD',     // NZD/USD - متوسط التقلب
  
  // ═══════════════════════════════════════════════════
  // الأزواج المتقاطعة EUR (EUR Cross Pairs) ✅
  // ═══════════════════════════════════════════════════
  'frxEURGBP',     // EUR/GBP - مستقر
  'frxEURJPY',     // EUR/JPY - ممتاز للتحليل
  'frxEURCHF',     // EUR/CHF - مستقر
  'frxEURAUD',     // EUR/AUD - جيد
  'frxEURCAD',     // EUR/CAD - مستقر
  'frxEURNZD',     // EUR/NZD - متوسط
  
  // ═══════════════════════════════════════════════════
  // الأزواج المتقاطعة GBP (GBP Cross Pairs) ✅
  // ═══════════════════════════════════════════════════
  'frxGBPJPY',     // GBP/JPY - متقلب ومربح
  'frxGBPCHF',     // GBP/CHF - جيد
  'frxGBPAUD',     // GBP/AUD - متوسط
  'frxGBPCAD',     // GBP/CAD - جيد
  'frxGBPNZD',     // GBP/NZD - متوسط
  
  // ═══════════════════════════════════════════════════
  // الأزواج المتقاطعة الأخرى (Other Cross Pairs) ✅
  // ═══════════════════════════════════════════════════
  'frxAUDJPY',     // AUD/JPY - جيد للتحليل
  'frxAUDCAD',     // AUD/CAD - مستقر
  'frxAUDCHF',     // AUD/CHF - جيد
  'frxAUDNZD',     // AUD/NZD - متوسط
  'frxCADJPY',     // CAD/JPY - جيد
  'frxCADCHF',     // CAD/CHF - مستقر
  'frxCHFJPY',     // CHF/JPY - جيد للتحليل
  'frxNZDCAD',     // NZD/CAD - متوسط
  'frxNZDCHF',     // NZD/CHF - متوسط
  'frxNZDJPY'      // NZD/JPY - جيد
  
  // ✅ فقط رموز frx الصحيحة من Binary.com
  // ❌ مستبعد: رموز OTC_ (غير صالحة)
  // ❌ مستبعد: السلع والعملات الرقمية
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
  let rejectionStats = {
    lowConfidence: 0,
    fewReasons: 0,
    weakTrend: 0,
    noDirection: 0
  };
  
  for (const symbol of SYMBOLS) {
    try {
      // جلب البيانات التاريخية الحقيقية
      const prices = await getHistoricalData(symbol, 100);
      
      if (prices && prices.length >= 100) {
        analyzed++;
        
        // تحليل وإنشاء توصية مع تتبع الرفض
        console.log(`\n🔍 [ANALYZING] ${symbol}...`);
        const signal = analyzeSignal(prices, symbol);
        
        // تشخيص مفصل مباشر في السيرفر
        console.log(`📊 [SERVER DEBUG] ${symbol} signal result:`, {
          hasSignal: !!signal,
          direction: signal?.direction || 'undefined',
          confidence: signal?.confidence || 'undefined',
          reasons: signal?.reasons?.length || 0,
          signalType: typeof signal
        });
        
        if (signal && signal.direction && signal.confidence) {
          console.log(`✅ [ACCEPTED] ${symbol}: ${signal.direction} ${signal.confidence}%`);
          recommendations.push(signal);
        } else {
          console.log(`❌ [REJECTED] ${symbol}: فشل في تلبية المعايير (signal=${signal ? 'invalid' : 'null'})`);
          if (signal && !signal.direction) console.log(`   ❌ Missing direction`);
          if (signal && !signal.confidence) console.log(`   ❌ Missing confidence`);
        }
      }
      
      // تأخير صغير بين الطلبات
      await new Promise(resolve => setTimeout(resolve, 200)); // زيادة التأخير
    } catch (error) {
      errors++;
      // طباعة الأخطاء للتشخيص
      console.log(`⚠️ [SERVER] خطأ في ${symbol}:`, error.message.substring(0, 50));
      
      // تجاهل الأخطاء المعروفة فقط
      if (!error.message.includes('invalid') && !error.message.includes('Timeout')) {
        console.error(`❌ [SERVER] خطأ غير متوقع في ${symbol}:`, error.message);
      }
    }
  }

  // تنظيف التوصيات من القيم undefined
  const validRecommendations = recommendations.filter(rec => 
    rec && rec.symbol && rec.direction && rec.confidence && rec.reasons
  );

  // عرض أفضل 5 توصيات للتشخيص
  if (validRecommendations.length > 0) {
    console.log(`📈 [SERVER] تم العثور على ${validRecommendations.length} توصية:`);
    validRecommendations.slice(0, 5).forEach((rec, i) => {
      console.log(`   ${i+1}. ${rec.symbol} ${rec.direction} - ${rec.confidence}% (${rec.risk_level})`);
    });
  }
  
  // إرسال أفضل توصية - مع ضمان إرسال توصية كل دقيقتين
  if (validRecommendations.length > 0) {
    // ترتيب حسب الثقة ثم حسب عدد الأسباب
    const bestSignal = validRecommendations.sort((a, b) => {
      if (b.confidence !== a.confidence) return b.confidence - a.confidence;
      return b.reasons.length - a.reasons.length;
    })[0];
    
    console.log(` [SERVER] أفضل توصية: ${bestSignal.symbol} ${bestSignal.direction} (${bestSignal.confidence}%)`);
    
    // التحقق من تفعيل البوت
    const botEnabled = await isBotEnabled();
    if (botEnabled) {
      console.log(' [SERVER] البوت مفعل - إرسال التوصية');
      
      // تحديث إحصائيات قبل الإرسال
      await updateBotStats({
        symbol: bestSignal.symbol,
        direction: bestSignal.direction,
        confidence: bestSignal.confidence
      });
      
      const sent = await sendTelegramMessage(bestSignal);
      
      if (sent) {
        console.log(' [SERVER] تم إرسال التوصية بنجاح');
      } else {
        console.error(' [SERVER] فشل إرسال التوصية');
      }
    }
  } else {
    console.log('⚠️ [SERVER] لا توجد توصيات تلبي المعايير الصارمة');
    console.log('📊 [SERVER] سيتم انتظار الدورة التالية للحصول على فرص أفضل');
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('\n📊 [SERVER] ملخص الدورة:');
  console.log(`   ⏱️ المدة: ${duration}s`);
  console.log(`   ✅ تم التحليل: ${analyzed}`);
  console.log(`   ❌ أخطاء: ${errors}`);
  console.log(`   📈 توصيات صالحة: ${validRecommendations.length}/${analyzed}`);
  
  // إحصائيات تفصيلية لأسباب الرفض
  console.log('\n🔍 [SERVER] تحليل مفصل للأسباب:');
  console.log('   📋 راجع الـ console أعلاه لرؤية تفاصيل كل رمز');
  console.log('   🎯 ابحث عن "❌ مرفوض:" لمعرفة أسباب الرفض');
  console.log('   ✅ ابحث عن "✅ يجب أن يمر!" للتوصيات التي تستوفي المعايير');
  
  if (validRecommendations.length === 0) {
    console.log('\n⚠️ [SERVER] لا توجد توصيات - الأسباب المحتملة:');
    console.log('   1. جميع الرموز لديها ثقة < 55%');
    console.log('   2. جميع الرموز لديها أسباب < 2');
    console.log('   3. جميع الرموز لديها قوة اتجاه < 0.12');
    console.log('   4. السوق في حالة تذبذب (لا اتجاه واضح)');
    console.log('\n💡 [SUGGESTION] لرؤية المزيد من التوصيات، يمكن:');
    console.log('   - تقليل معيار الثقة من 55% إلى 50%');
    console.log('   - تقليل معيار قوة الاتجاه من 0.12 إلى 0.10');
    console.log('   - قبول توصية واحدة بدلاً من 2 أسباب');
  }
  
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
