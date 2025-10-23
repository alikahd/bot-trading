import { createClient } from '@supabase/supabase-js';

// إعدادات Supabase
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://djlirquyvpccuvjdaueb.supabase.co';
const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqbGlycXV5dnBjY3V2amRhdWViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NTAyNjEsImV4cCI6MjA3NDEyNjI2MX0.JzPMuPoObMzkEQQcv4yTTG1IitsBlrkd2qqvm1g_oXA';

// اكتشاف الجهاز المحمول
const isMobile = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// إنشاء مثيل واحد مشترك من Supabase
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // إعدادات خاصة للهاتف المحمول
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
    // تحسين للهاتف المحمول
    flowType: 'pkce',
    // إعدادات timeout مختلفة للهاتف
    ...(isMobile() && {
      storageKey: 'sb-mobile-auth-token',
      debug: true
    })
  },
  // إعدادات إضافية للاستقرار
  global: {
    headers: {
      'X-Client-Info': isMobile() ? 'supabase-js-mobile' : 'supabase-js-web',
      'X-Device-Type': isMobile() ? 'mobile' : 'desktop'
    }
  },
  db: {
    schema: 'public'
  },
  // إعدادات الشبكة للهاتف
  ...(isMobile() && {
    realtime: {
      params: {
        eventsPerSecond: 2 // تقليل الأحداث للهاتف
      }
    }
  })
});

export { supabaseUrl, supabaseKey };
export default supabase;
