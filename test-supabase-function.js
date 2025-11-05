// اختبار Supabase Edge Function
async function testFunction() {
  try {
    const response = await fetch(
      'https://djlirquyvpccuvjdaueb.supabase.co/functions/v1/send-telegram-signals',
      {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqbGlycXV5dnBjY3V2amRhdWViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NTAyNjEsImV4cCI6MjA3NDEyNjI2MX0.JzPMuPoObMzkEQQcv4yTTG1IitsBlrkd2qqvm1g_oXA',
          'Content-Type': 'application/json'
        }
      }
    );
    
    const data = await response.json();
    console.log('✅ النتيجة:', data);
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

testFunction();
