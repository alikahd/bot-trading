// سكريبت للحصول على PayPal Access Token
// استخدم: node get-paypal-token.js

const PAYPAL_CLIENT_ID = 'AVLSUO68J_SeaT1xCKcqdG0gaJio2gY47g1Bz3XNzgg89osP8fF2gwsIFmsTDe7oDJyLgru2jILQQOAT';
const PAYPAL_CLIENT_SECRET = 'EIuuJS4nYn77jv_X7r3wXKUeEPR4Y1xuYu3kFFA-qvEiWd1ByO8Id6RdvB3Td8WdSTSp-zkRsZyLDBvV'; // ضع الـ Secret هنا

// اختر البيئة: 'sandbox' أو 'production'
const ENVIRONMENT = 'production'; // غيّر إلى 'sandbox' للتجريب

const PAYPAL_API_BASE = ENVIRONMENT === 'sandbox' 
  ? 'https://api-m.sandbox.paypal.com'
  : 'https://api-m.paypal.com';

async function getAccessToken() {
  try {
    console.log(`🔄 جاري الحصول على Access Token من ${ENVIRONMENT}...`);
    
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
    
    const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`فشل الحصول على Token: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    console.log('\n✅ تم الحصول على Access Token بنجاح!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Access Token:');
    console.log(data.access_token);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n⏰ صالح لمدة: ${data.expires_in} ثانية (${Math.floor(data.expires_in / 3600)} ساعات)`);
    console.log(`🌍 البيئة: ${ENVIRONMENT.toUpperCase()}`);
    console.log(`📅 تاريخ الانتهاء: ${new Date(Date.now() + data.expires_in * 1000).toLocaleString('ar-EG')}`);
    
    console.log('\n📝 استخدم هذا Token في ملف mcp_config.json:');
    console.log(`"PAYPAL_ACCESS_TOKEN": "${data.access_token}"`);
    console.log(`"PAYPAL_ENVIRONMENT": "${ENVIRONMENT.toUpperCase()}"`);
    
    return data.access_token;
  } catch (error) {
    console.error('\n❌ خطأ:', error.message);
    
    if (PAYPAL_CLIENT_SECRET === 'YOUR_CLIENT_SECRET_HERE') {
      console.log('\n⚠️ يرجى تحديث PAYPAL_CLIENT_SECRET في السكريبت!');
      console.log('احصل عليه من: https://developer.paypal.com/dashboard/');
    }
    
    process.exit(1);
  }
}

// تشغيل السكريبت
getAccessToken();
