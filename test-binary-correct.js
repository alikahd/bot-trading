// اختبار Binary.com API بالطريقة الصحيحة
async function testBinaryAPI() {
  const symbols = ['frxEURUSD', 'R_10', 'WLDAUD'];

  for (const symbol of symbols) {
    try {
      // الطريقة الصحيحة: استخدام active_symbols أولاً
      const response = await fetch(
        'https://api.binary.com/api/v3/active_symbols?active_symbols=brief&product_type=basic'
      );
      
      const data = await response.json();
      console.log(`\n${symbol}:`);
      console.log('Active symbols:', data.active_symbols?.length || 0);
      
      // ثم جلب السعر
      const tickResponse = await fetch(
        `https://api.binary.com/api/v3/ticks?ticks=${symbol}&subscribe=0`
      );
      
      const tickData = await tickResponse.json();
      console.log('Tick data:', tickData);
      
    } catch (error) {
      console.log(`  ❌ خطأ: ${error.message}`);
    }
  }
}

testBinaryAPI();
