// اختبار Netlify Function
async function testNetlifyFunction() {
  try {
    console.log('🧪 اختبار Netlify Function...');
    
    const response = await fetch('https://bootradings.netlify.app/.netlify/functions/send-telegram-signals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('📊 Status:', response.status);
    const text = await response.text();
    console.log('📄 Response:', text);
    
    try {
      const data = JSON.parse(text);
      console.log('✅ النتيجة:', data);
    } catch (e) {
      console.log('⚠️ ليس JSON:', text.substring(0, 200));
    }
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

testNetlifyFunction();
