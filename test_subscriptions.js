// اختبار سريع لجلب الاشتراكات
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://djlirquyvpccuvjdaueb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqbGlycXV5dnBjY3V2amRhdWViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NTAyNjEsImV4cCI6MjA3NDEyNjI2MX0.JzPMuPoObMzkEQQcv4yTTG1IitsBlrkd2qqvm1g_oXA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSubscriptions() {
  console.log('🔍 اختبار جلب الاشتراكات...');
  
  try {
    // اختبار 1: جلب الاشتراكات فقط
    console.log('\n📋 اختبار 1: جلب الاشتراكات الأساسية');
    const { data: subs, error: subsError } = await supabase
      .from('subscriptions')
      .select('*');
    
    console.log('عدد الاشتراكات:', subs?.length || 0);
    console.log('الاشتراكات:', subs);
    console.log('أخطاء:', subsError);
    
    // اختبار 2: جلب مع الربط
    console.log('\n🔗 اختبار 2: جلب مع ربط الجداول');
    const { data: fullData, error: fullError } = await supabase
      .from('subscriptions')
      .select(`
        *,
        subscription_plans (
          id,
          name,
          name_ar,
          duration_months,
          price
        ),
        users (
          id,
          username,
          email
        )
      `);
    
    console.log('عدد الاشتراكات مع الربط:', fullData?.length || 0);
    console.log('البيانات الكاملة:', fullData);
    console.log('أخطاء الربط:', fullError);
    
    // اختبار 3: فحص المستخدم الحالي
    console.log('\n👤 اختبار 3: فحص المستخدم الحالي');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('المستخدم:', user);
    console.log('أخطاء المستخدم:', userError);
    
  } catch (error) {
    console.error('💥 خطأ في الاختبار:', error);
  }
}

// تشغيل الاختبار
testSubscriptions();
