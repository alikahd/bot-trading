// اختبار Binary.com API
async function testBinaryAPI() {
  const symbols = [
    'frxEURUSD',
    'EURUSD_otc',
    'R_10',
    'WLDAUD'
  ];

  for (const symbol of symbols) {
    try {
      const response = await fetch(
        `https://api.binary.com/api/v3/ticks_history?ticks_history=${symbol}&count=10&end=latest&style=candles&granularity=60`
      );
      
      const contentType = response.headers.get('content-type');
      console.log(`\n${symbol}:`);
      console.log(`  Status: ${response.status}`);
      console.log(`  Content-Type: ${contentType}`);
      
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (data.candles) {
          console.log(`  ✅ نجح - ${data.candles.length} شموع`);
        } else if (data.error) {
          console.log(`  ❌ خطأ: ${data.error.message}`);
        } else {
          console.log(`  ⚠️ لا توجد شموع`);
        }
      } else {
        console.log(`  ❌ ليس JSON`);
      }
    } catch (error) {
      console.log(`  ❌ خطأ: ${error.message}`);
    }
  }
}

testBinaryAPI();
