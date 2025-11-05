-- إنشاء جدول الإشعارات للمستخدمين
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- نوع الإشعار
  type VARCHAR(50) NOT NULL CHECK (type IN ('commission_paid', 'referral_completed', 'payment_approved', 'general')),
  
  -- محتوى الإشعار
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  
  -- حالة القراءة
  is_read BOOLEAN DEFAULT false,
  
  -- بيانات إضافية (JSON)
  metadata JSONB DEFAULT '{}',
  
  -- التواريخ
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Index للبحث السريع
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Trigger لتحديث read_at عند تغيير is_read
CREATE OR REPLACE FUNCTION update_notification_read_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_read = true AND OLD.is_read = false THEN
    NEW.read_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_notification_read_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_read_at();

-- تعطيل RLS (نظامنا لا يستخدم Supabase Auth)
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- إضافة تعليقات
COMMENT ON TABLE notifications IS 'إشعارات المستخدمين (دفع عمولات، إحالات مكتملة، إلخ)';
COMMENT ON COLUMN notifications.type IS 'نوع الإشعار: commission_paid, referral_completed, payment_approved, general';
COMMENT ON COLUMN notifications.is_read IS 'هل تم قراءة الإشعار';
COMMENT ON COLUMN notifications.metadata IS 'بيانات إضافية بصيغة JSON (مثل: مبلغ العمولة، طريقة الدفع، إلخ)';
