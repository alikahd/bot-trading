-- إضافة policy للسماح بقراءة حالة البوت للجميع (للسيرفر)
-- لكن التعديل يبقى للأدمن فقط

-- حذف policy القديمة للقراءة
DROP POLICY IF EXISTS "Admin can read bot status" ON telegram_bot_status;

-- إنشاء policy جديدة تسمح بالقراءة للجميع
CREATE POLICY "Anyone can read bot status"
  ON telegram_bot_status
  FOR SELECT
  USING (true); -- السماح للجميع بالقراءة

-- التعديل يبقى للأدمن فقط (لا تغيير)
-- CREATE POLICY "Admin can update bot status" موجودة بالفعل

-- إنشاء دالة آمنة للتحقق من حالة البوت (احتياطي)
CREATE OR REPLACE FUNCTION get_telegram_bot_status()
RETURNS TABLE (
  is_enabled BOOLEAN,
  last_signal_sent TIMESTAMP WITH TIME ZONE,
  total_signals_sent INTEGER
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.is_enabled,
    t.last_signal_sent,
    t.total_signals_sent
  FROM telegram_bot_status t
  WHERE t.id = 1;
END;
$$;

-- منح صلاحيات التنفيذ للجميع
GRANT EXECUTE ON FUNCTION get_telegram_bot_status() TO anon, authenticated;

COMMENT ON FUNCTION get_telegram_bot_status() IS 'دالة آمنة للحصول على حالة بوت Telegram - يمكن استدعاؤها من السيرفر';
