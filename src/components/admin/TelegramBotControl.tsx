import React, { useState, useEffect } from 'react';
import { Play, Pause, RefreshCw, Activity, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../config/supabaseClient';

interface BotStatus {
  is_enabled: boolean;
  last_signal_sent: string | null;
  total_signals_sent: number;
  updated_at: string;
}

export const TelegramBotControl: React.FC = () => {
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // جلب حالة البوت
  const fetchBotStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('telegram_bot_status')
        .select('*')
        .single();

      if (error) {
        // إذا لم يكن هناك سجل، أنشئ واحد
        if (error.code === 'PGRST116') {
          const { data: newData, error: insertError } = await supabase
            .from('telegram_bot_status')
            .insert([{ is_enabled: true, total_signals_sent: 0 }])
            .select()
            .single();

          if (insertError) throw insertError;
          setBotStatus(newData);
        } else {
          throw error;
        }
      } else {
        setBotStatus(data);
      }
    } catch (error) {
      console.error('خطأ في جلب حالة البوت:', error);
      setMessage({ type: 'error', text: 'فشل جلب حالة البوت' });
    }
  };

  // تبديل حالة البوت
  const toggleBot = async () => {
    if (!botStatus) return;

    setIsLoading(true);
    setMessage(null);

    try {
      const newStatus = !botStatus.is_enabled;

      const { error } = await supabase
        .from('telegram_bot_status')
        .update({ 
          is_enabled: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', 1);

      if (error) throw error;

      setBotStatus({ ...botStatus, is_enabled: newStatus });
      setMessage({
        type: 'success',
        text: newStatus ? '✅ تم تشغيل البوت بنجاح' : '⏸️ تم إيقاف البوت مؤقتاً'
      });
    } catch (error) {
      console.error('خطأ في تحديث حالة البوت:', error);
      setMessage({ type: 'error', text: 'فشل تحديث حالة البوت' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBotStatus();
    
    // تحديث تلقائي كل 30 ثانية
    const interval = setInterval(fetchBotStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!botStatus) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" />
          <span className="mr-3 text-gray-700 dark:text-gray-300">جاري التحميل...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* العنوان */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400 ml-3" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">التحكم في بوت Telegram</h2>
        </div>
        <button
          onClick={fetchBotStatus}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="تحديث"
        >
          <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* رسالة التنبيه */}
      {message && (
        <div
          className={`mb-4 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* حالة البوت */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* الحالة */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">الحالة</span>
            {botStatus.is_enabled ? (
              <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500 dark:text-red-400" />
            )}
          </div>
          <p className={`text-lg font-bold mt-2 ${
            botStatus.is_enabled ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}>
            {botStatus.is_enabled ? 'قيد التشغيل' : 'متوقف'}
          </p>
        </div>

        {/* عدد التوصيات */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
          <span className="text-gray-600 dark:text-gray-400">إجمالي التوصيات</span>
          <p className="text-lg font-bold mt-2 text-blue-600 dark:text-blue-400">
            {botStatus.total_signals_sent.toLocaleString()}
          </p>
        </div>

        {/* آخر توصية */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
          <span className="text-gray-600 dark:text-gray-400">آخر توصية</span>
          <p className="text-sm font-medium mt-2 text-gray-700 dark:text-gray-300">
            {botStatus.last_signal_sent
              ? new Date(botStatus.last_signal_sent).toLocaleString('ar-SA')
              : 'لا توجد'}
          </p>
        </div>
      </div>

      {/* زر التحكم */}
      <div className="flex justify-center">
        <button
          onClick={toggleBot}
          disabled={isLoading}
          className={`flex items-center px-8 py-4 rounded-lg font-bold text-white transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
            botStatus.is_enabled
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-green-500 hover:bg-green-600'
          }`}
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-5 h-5 ml-2 animate-spin" />
              جاري التحديث...
            </>
          ) : botStatus.is_enabled ? (
            <>
              <Pause className="w-5 h-5 ml-2" />
              إيقاف البوت مؤقتاً
            </>
          ) : (
            <>
              <Play className="w-5 h-5 ml-2" />
              تشغيل البوت
            </>
          )}
        </button>
      </div>

      {/* ملاحظة */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>ملاحظة:</strong> عند إيقاف البوت، سيتوقف إرسال التوصيات تلقائياً إلى مجموعة Telegram.
          يمكنك تشغيله مرة أخرى في أي وقت.
        </p>
      </div>
    </div>
  );
};
