-- جدول التحكم في بوت Telegram
CREATE TABLE IF NOT EXISTS telegram_bot_status (
  id INTEGER PRIMARY KEY DEFAULT 1,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  last_signal_sent TIMESTAMP WITH TIME ZONE,
  total_signals_sent INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- إدراج السجل الافتراضي
INSERT INTO telegram_bot_status (id, is_enabled, total_signals_sent)
VALUES (1, true, 0)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies
ALTER TABLE telegram_bot_status ENABLE ROW LEVEL SECURITY;

-- الأدمن فقط يمكنه القراءة والتعديل
CREATE POLICY "Admin can read bot status"
  ON telegram_bot_status
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admin can update bot status"
  ON telegram_bot_status
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Trigger لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_telegram_bot_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER telegram_bot_status_updated_at
  BEFORE UPDATE ON telegram_bot_status
  FOR EACH ROW
  EXECUTE FUNCTION update_telegram_bot_status_updated_at();

-- دالة لزيادة عداد التوصيات
CREATE OR REPLACE FUNCTION increment_telegram_signals()
RETURNS void AS $$
BEGIN
  UPDATE telegram_bot_status
  SET 
    total_signals_sent = total_signals_sent + 1,
    last_signal_sent = NOW(),
    updated_at = NOW()
  WHERE id = 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
