import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, Play, Clock, CheckCircle, AlertCircle, RefreshCw, FileText, Power } from 'lucide-react';
import { supabase } from '../../config/supabaseClient';
import { Card } from '../ui/Card';

interface PayoutSummary {
  total_users: number;
  total_amount: number;
  eligible_users: number;
  eligible_amount: number;
  minimum_payout: number;
}

interface PayoutHistory {
  month: string;
  total_paid: number;
  total_users: number;
  total_commissions: number;
  payment_breakdown: any[];
}

export const AutoPayoutSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [summary, setSummary] = useState<PayoutSummary | null>(null);
  const [history, setHistory] = useState<PayoutHistory[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [autoPayoutEnabled, setAutoPayoutEnabled] = useState(true);
  const [toggleLoading, setToggleLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadPendingSummary(),
        loadPayoutHistory(),
        loadAutoPayoutStatus()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAutoPayoutStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('referral_settings')
        .select('is_active')
        .single();

      if (error) throw error;
      
      if (data) {
        setAutoPayoutEnabled(data.is_active);
      }
    } catch (error) {
      console.error('Error loading auto-payout status:', error);
    }
  };

  const handleToggleAutoPayout = async () => {
    // تأكيد عند إيقاف النظام
    if (autoPayoutEnabled) {
      if (!confirm('⚠️ هل أنت متأكد من إيقاف الدفع التلقائي؟\n\nلن يتم دفع العمولات تلقائياً في اليوم الأول من الشهر، وستحتاج للدفع يدوياً.')) {
        return;
      }
    }

    try {
      setToggleLoading(true);
      setMessage(null);

      const newStatus = !autoPayoutEnabled;

      const { error } = await supabase
        .from('referral_settings')
        .update({ is_active: newStatus })
        .eq('id', (await supabase.from('referral_settings').select('id').single()).data?.id);

      if (error) throw error;

      setAutoPayoutEnabled(newStatus);
      setMessage({
        type: 'success',
        text: newStatus 
          ? '✅ تم تفعيل الدفع التلقائي بنجاح' 
          : '⏸️ تم إيقاف الدفع التلقائي مؤقتاً'
      });

      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Error toggling auto-payout:', error);
      setMessage({
        type: 'error',
        text: `❌ حدث خطأ: ${error.message}`
      });
    } finally {
      setToggleLoading(false);
    }
  };

  const loadPendingSummary = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_pending_commissions_summary');

      if (error) throw error;
      
      if (data && data.length > 0) {
        setSummary(data[0]);
      }
    } catch (error) {
      console.error('Error loading summary:', error);
    }
  };

  const loadPayoutHistory = async () => {
    try {
      // جلب آخر 6 أشهر
      const months: PayoutHistory[] = [];
      const currentDate = new Date();
      
      for (let i = 0; i < 6; i++) {
        const targetMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        
        const { data, error } = await supabase
          .rpc('get_monthly_payout_report', { 
            target_month: targetMonth.toISOString().split('T')[0] 
          });

        if (error) throw error;
        
        if (data && data.length > 0 && data[0].total_paid > 0) {
          months.push(data[0]);
        }
      }
      
      setHistory(months);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const handleManualPayout = async () => {
    if (!confirm('هل أنت متأكد من تشغيل الدفع اليدوي؟ سيتم دفع جميع العمولات المستحقة.')) {
      return;
    }

    try {
      setProcessing(true);
      setMessage(null);

      const { data, error } = await supabase
        .rpc('process_monthly_commissions');

      if (error) throw error;

      // تحليل النتائج
      const results = data || [];
      const successful = results.filter((r: any) => r.success && r.user_id);
      const totalAmount = successful.reduce((sum: number, r: any) => sum + (r.total_amount || 0), 0);

      setMessage({
        type: 'success',
        text: `✅ تم دفع $${totalAmount.toFixed(2)} لـ ${successful.length} مستخدمين بنجاح!`
      });

      // إعادة تحميل البيانات
      await loadData();
    } catch (error: any) {
      console.error('Error processing payout:', error);
      setMessage({
        type: 'error',
        text: `❌ حدث خطأ: ${error.message}`
      });
    } finally {
      setProcessing(false);
    }
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-2 sm:p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h2 className="text-base sm:text-2xl font-bold text-white">الدفع التلقائي الشهري</h2>
            <p className="text-gray-400 text-[10px] sm:text-sm">إدارة ومراقبة الدفع الشهري للعمولات</p>
          </div>
        </div>
        
        {/* زر توقيف/تفعيل */}
        <button
          onClick={handleToggleAutoPayout}
          disabled={toggleLoading}
          className={`flex items-center gap-1 sm:gap-2 px-2 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm ${
            autoPayoutEnabled
              ? 'bg-yellow-500/20 border border-yellow-500 text-yellow-400 hover:bg-yellow-500/30'
              : 'bg-green-500/20 border border-green-500 text-green-400 hover:bg-green-500/30'
          }`}
        >
          {toggleLoading ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-current"></div>
              <span className="hidden sm:inline">جاري التحديث...</span>
            </>
          ) : (
            <>
              <Power className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{autoPayoutEnabled ? 'إيقاف الدفع التلقائي' : 'تفعيل الدفع التلقائي'}</span>
              <span className="sm:hidden">{autoPayoutEnabled ? 'إيقاف' : 'تفعيل'}</span>
            </>
          )}
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 sm:p-4 rounded-lg border text-xs sm:text-sm ${
          message.type === 'success' 
            ? 'bg-green-500/20 border-green-500 text-green-400' 
            : 'bg-red-500/20 border-red-500 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      {/* ملخص العمولات المعلقة */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">العمولات المعلقة</h3>
          <button
            onClick={loadPendingSummary}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title="تحديث"
          >
            <RefreshCw className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {summary ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
            <div className="bg-gray-700/50 rounded-lg p-2 sm:p-4">
              <div className="flex items-center gap-1 sm:gap-2 text-gray-400 mb-1 sm:mb-2">
                <DollarSign className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-[10px] sm:text-sm">إجمالي المبلغ</span>
              </div>
              <p className="text-sm sm:text-2xl font-bold text-white">${summary.total_amount?.toFixed(2) || '0.00'}</p>
              <p className="text-[9px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">{summary.total_users || 0} مستخدم</p>
            </div>

            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2 sm:p-4">
              <div className="flex items-center gap-1 sm:gap-2 text-green-400 mb-1 sm:mb-2">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-[10px] sm:text-sm">مؤهل للدفع</span>
              </div>
              <p className="text-sm sm:text-2xl font-bold text-white">${summary.eligible_amount?.toFixed(2) || '0.00'}</p>
              <p className="text-[9px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">{summary.eligible_users || 0} مستخدم</p>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2 sm:p-4">
              <div className="flex items-center gap-1 sm:gap-2 text-yellow-400 mb-1 sm:mb-2">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-[10px] sm:text-sm">أقل من الحد الأدنى</span>
              </div>
              <p className="text-sm sm:text-2xl font-bold text-white">
                ${((summary.total_amount || 0) - (summary.eligible_amount || 0)).toFixed(2)}
              </p>
              <p className="text-[9px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">
                {(summary.total_users || 0) - (summary.eligible_users || 0)} مستخدم
              </p>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-2 sm:p-4">
              <div className="flex items-center gap-1 sm:gap-2 text-blue-400 mb-1 sm:mb-2">
                <DollarSign className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-[10px] sm:text-sm">الحد الأدنى</span>
              </div>
              <p className="text-sm sm:text-2xl font-bold text-white">${summary.minimum_payout?.toFixed(2) || '10.00'}</p>
              <p className="text-[9px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">للسحب</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>لا توجد بيانات متاحة</p>
          </div>
        )}

        {/* زر الدفع اليدوي */}
        {summary && summary.eligible_users > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-700">
            <button
              onClick={handleManualPayout}
              disabled={processing}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>جاري المعالجة...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  <span>تشغيل الدفع اليدوي الآن</span>
                </>
              )}
            </button>
            <p className="text-xs text-gray-400 text-center mt-2">
              سيتم دفع ${summary.eligible_amount?.toFixed(2)} لـ {summary.eligible_users} مستخدمين
            </p>
          </div>
        )}
      </Card>

      {/* معلومات الدفع التلقائي */}
      <Card className={`border ${
        autoPayoutEnabled 
          ? 'bg-blue-500/10 border-blue-500/30' 
          : 'bg-gray-500/10 border-gray-500/30'
      }`}>
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${
            autoPayoutEnabled ? 'bg-blue-500/20' : 'bg-gray-500/20'
          }`}>
            <Calendar className={`w-5 h-5 ${
              autoPayoutEnabled ? 'text-blue-400' : 'text-gray-400'
            }`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className={`text-lg font-semibold ${
                autoPayoutEnabled ? 'text-blue-400' : 'text-gray-400'
              }`}>
                الدفع التلقائي الشهري
              </h3>
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                autoPayoutEnabled
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  autoPayoutEnabled ? 'bg-green-400' : 'bg-red-400'
                } ${autoPayoutEnabled ? 'animate-pulse' : ''}`}></div>
                {autoPayoutEnabled ? 'مُفعّل' : 'مُوقف'}
              </div>
            </div>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <span className={`mt-1 ${autoPayoutEnabled ? 'text-blue-400' : 'text-gray-500'}`}>•</span>
                <span>يعمل النظام تلقائياً في <strong>اليوم الأول من كل شهر</strong> في الساعة 00:00 UTC</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>يتم دفع العمولات للمستخدمين الذين تجاوزوا الحد الأدنى (${summary?.minimum_payout?.toFixed(2) || '10.00'})</span>
              </li>
              <li className="flex items-start gap-2">
                <span className={`mt-1 ${autoPayoutEnabled ? 'text-blue-400' : 'text-gray-500'}`}>•</span>
                <span>يتم إرسال إشعارات تلقائية للمستخدمين والمديرين</span>
              </li>
              <li className="flex items-start gap-2">
                <span className={`mt-1 ${autoPayoutEnabled ? 'text-blue-400' : 'text-gray-500'}`}>•</span>
                <span>يمكنك تشغيل الدفع يدوياً في أي وقت باستخدام الزر أعلاه</span>
              </li>
              {!autoPayoutEnabled && (
                <li className="flex items-start gap-2 mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <span className="text-yellow-400 mt-1">⚠️</span>
                  <span className="text-yellow-400 text-xs">
                    <strong>تنبيه:</strong> الدفع التلقائي موقف حالياً. لن يتم دفع العمولات تلقائياً في اليوم الأول من الشهر. يجب عليك الدفع يدوياً أو إعادة تفعيل النظام.
                  </span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </Card>

      {/* سجل الدفعات */}
      <Card>
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          سجل الدفعات الشهرية
        </h3>

        {history.length > 0 ? (
          <div className="space-y-3">
            {history.map((record) => (
              <div key={record.month} className="bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-white font-semibold">{formatMonth(record.month)}</h4>
                    <p className="text-sm text-gray-400">
                      {record.total_users} مستخدمين • {record.total_commissions} عمولة
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-base sm:text-2xl font-bold text-green-400">
                      ${record.total_paid?.toFixed(2)}
                    </p>
                  </div>
                </div>

                {record.payment_breakdown && record.payment_breakdown.length > 0 && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm text-blue-400 hover:text-blue-300">
                      عرض التفاصيل ({record.payment_breakdown.length} مستخدمين)
                    </summary>
                    <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                      {record.payment_breakdown.map((payment: any, index: number) => (
                        <div key={index} className="flex items-center justify-between bg-gray-800/50 rounded p-2 text-sm">
                          <div>
                            <p className="text-white font-medium">{payment.username}</p>
                            <p className="text-xs text-gray-400">{payment.email}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-green-400 font-bold">${payment.amount?.toFixed(2)}</p>
                            <p className="text-xs text-gray-400">{payment.payment_method || 'غير محدد'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>لا يوجد سجل دفعات بعد</p>
          </div>
        )}
      </Card>
    </div>
  );
};
