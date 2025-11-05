-- ====================================
-- تفعيل Realtime لجدول subscription_plans
-- ====================================

-- 1. التحقق من وجود publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    -- إنشاء publication إذا لم يكن موجوداً
    CREATE PUBLICATION supabase_realtime;
    RAISE NOTICE '✅ تم إنشاء publication: supabase_realtime';
  ELSE
    RAISE NOTICE '✅ publication موجود مسبقاً: supabase_realtime';
  END IF;
END $$;

-- 2. إضافة جدول subscription_plans إلى publication
DO $$
BEGIN
  -- محاولة إضافة الجدول
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE subscription_plans;
    RAISE NOTICE '✅ تم إضافة جدول subscription_plans إلى Realtime';
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE '✅ جدول subscription_plans موجود مسبقاً في Realtime';
    WHEN OTHERS THEN
      RAISE EXCEPTION 'خطأ في إضافة الجدول: %', SQLERRM;
  END;
END $$;

-- 3. التحقق من النتيجة
SELECT 
  schemaname,
  tablename,
  'subscription_plans' as table_name,
  CASE 
    WHEN tablename = 'subscription_plans' THEN '✅ مفعّل'
    ELSE '❌ غير مفعّل'
  END as realtime_status
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND schemaname = 'public'
  AND tablename = 'subscription_plans';

-- 4. عرض جميع الجداول المفعلة في Realtime
SELECT 
  schemaname,
  tablename,
  '✅ مفعّل' as status
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND schemaname = 'public'
ORDER BY tablename;

-- ====================================
-- ملاحظات:
-- ====================================
-- 
-- 1. هذا الـ script يقوم بـ:
--    - إنشاء publication إذا لم يكن موجوداً
--    - إضافة جدول subscription_plans
--    - التحقق من النتيجة
--
-- 2. بعد تشغيل هذا الـ script:
--    - الصفحة ستتلقى تحديثات فورية
--    - عند تعديل/إضافة/حذف باقة
--    - بدون إعادة تحميل الصفحة
--
-- 3. للتحقق من التفعيل:
--    - افتح Console في المتصفح
--    - يجب أن ترى: "📡 حالة Realtime subscription: SUBSCRIBED"
--
-- 4. لإزالة الجدول من Realtime (إذا لزم الأمر):
--    ALTER PUBLICATION supabase_realtime DROP TABLE subscription_plans;
--
-- ====================================
