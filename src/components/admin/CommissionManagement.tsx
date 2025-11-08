import React, { useState, useEffect } from 'react';
import { DollarSign, CheckCircle, XCircle, Clock, Search, CreditCard, Building2, Send, Bitcoin, Eye, Copy } from 'lucide-react';
import { supabase } from '../../config/supabaseClient';
import { Card } from '../ui/Card';

interface PaymentMethod {
  id: string;
  payment_type: 'paypal' | 'bank_transfer' | 'western_union' | 'cryptocurrency' | 'other';
  payment_details: any;
  is_primary: boolean;
}

interface PendingCommission {
  id: string;
  referrer_id: string;
  referral_id: string;
  commission_amount: number;
  subscription_amount: number;
  commission_rate: number;
  status: 'pending' | 'paid' | 'cancelled';
  created_at: string;
  paid_at: string | null;
  referrer_email?: string;
  referrer_name?: string;
  payment_method?: PaymentMethod;
}

export const CommissionManagement: React.FC = () => {
  const [commissions, setCommissions] = useState<PendingCommission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [selectedCommissions, setSelectedCommissions] = useState<Set<string>>(new Set());
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [paymentDetails, setPaymentDetails] = useState({
    method: 'bank_transfer',
    notes: ''
  });

  useEffect(() => {
    loadCommissions();

    // ✅ إعداد Realtime للعمولات

    const commissionsChannel = supabase
      .channel('commissions-management-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'referrals' },
        (_payload) => {

          loadCommissions(); // إعادة تحميل البيانات
        }
      )
      .subscribe();

    // تنظيف عند إلغاء التحميل
    return () => {

      supabase.removeChannel(commissionsChannel);
    };
  }, []);

  const loadCommissions = async () => {
    try {
      setLoading(true);
      
      // جلب العمولات مع معلومات المستخدم وطريقة الدفع
      const { data, error } = await supabase
        .from('pending_commissions')
        .select(`
          *,
          referrer:users!pending_commissions_referrer_id_fkey(email, full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // جلب طرق الدفع لكل مستخدم
      const userIds = [...new Set(data?.map(c => c.referrer_id) || [])];
      const { data: paymentMethods } = await supabase
        .from('payment_methods')
        .select('*')
        .in('user_id', userIds)
        .eq('is_primary', true);

      if (error) throw error;

      const commissionsWithUser = data?.map(c => {
        const paymentMethod = paymentMethods?.find(pm => pm.user_id === c.referrer_id);
        return {
          ...c,
          referrer_email: c.referrer?.email,
          referrer_name: c.referrer?.full_name,
          payment_method: paymentMethod
        };
      }) || [];

      setCommissions(commissionsWithUser);
    } catch (error) {

    } finally {
      setLoading(false);
    }
  };

  const filteredCommissions = commissions.filter(c => {
    const matchesSearch = !searchTerm || 
      c.referrer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.referrer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: commissions.length,
    pending: commissions.filter(c => c.status === 'pending').length,
    paid: commissions.filter(c => c.status === 'paid').length,
    totalPending: commissions
      .filter(c => c.status === 'pending')
      .reduce((sum, c) => sum + c.commission_amount, 0),
    totalPaid: commissions
      .filter(c => c.status === 'paid')
      .reduce((sum, c) => sum + c.commission_amount, 0)
  };

  const handleSelectCommission = (id: string) => {
    const newSelected = new Set(selectedCommissions);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCommissions(newSelected);
  };

  const getPaymentMethodIcon = (type: string) => {
    switch (type) {
      case 'paypal': return <CreditCard className="w-4 h-4" />;
      case 'bank_transfer': return <Building2 className="w-4 h-4" />;
      case 'western_union': return <Send className="w-4 h-4" />;
      case 'cryptocurrency': return <Bitcoin className="w-4 h-4" />;
      default: return <CreditCard className="w-4 h-4" />;
    }
  };

  const getPaymentMethodName = (type: string) => {
    const names: Record<string, string> = {
      paypal: 'PayPal',
      bank_transfer: 'تحويل بنكي',
      western_union: 'Western Union',
      cryptocurrency: 'عملة رقمية',
      other: 'أخرى'
    };
    return names[type] || type;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('تم النسخ!');
  };

  const renderPaymentMethodDetails = (method: PaymentMethod | undefined) => {
    if (!method) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-xs text-red-400">لم يتم تحديد طريقة دفع</span>
          <span className="text-xs text-yellow-400">(يجب على المستخدم إضافة طريقة)</span>
        </div>
      );
    }

    const details = method.payment_details;
    
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 flex-1">
          {getPaymentMethodIcon(method.payment_type)}
          <div>
            <p className="text-sm text-white font-medium">{getPaymentMethodName(method.payment_type)}</p>
            <p className="text-xs text-gray-400">
              {method.payment_type === 'paypal' && details.email}
              {method.payment_type === 'bank_transfer' && details.bank_name}
              {method.payment_type === 'western_union' && details.full_name}
              {method.payment_type === 'cryptocurrency' && details.crypto_type}
              {method.payment_type === 'other' && 'تفاصيل أخرى'}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setSelectedPaymentMethod(method);
            setShowDetailsModal(true);
          }}
          className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded transition-all"
          title="عرض التفاصيل الكاملة"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>
    );
  };

  const handleSelectAll = () => {
    if (selectedCommissions.size === filteredCommissions.filter(c => c.status === 'pending').length) {
      setSelectedCommissions(new Set());
    } else {
      const allPending = new Set(
        filteredCommissions
          .filter(c => c.status === 'pending')
          .map(c => c.id)
      );
      setSelectedCommissions(allPending);
    }
  };

  const handlePayCommissions = async () => {
    if (selectedCommissions.size === 0) {
      alert('الرجاء اختيار عمولات للدفع');
      return;
    }

    try {
      const selectedIds = Array.from(selectedCommissions);
      const selectedItems = commissions.filter(c => selectedIds.includes(c.id));
      const totalAmount = selectedItems.reduce((sum, c) => sum + c.commission_amount, 0);

      // تحديث حالة العمولات إلى paid
      const { error: updateError } = await supabase
        .from('pending_commissions')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString()
        })
        .in('id', selectedIds);

      if (updateError) throw updateError;

      // إنشاء سجل دفع لكل مستخدم
      const userCommissions = selectedItems.reduce((acc, c) => {
        if (!acc[c.referrer_id]) {
          acc[c.referrer_id] = [];
        }
        acc[c.referrer_id].push(c);
        return acc;
      }, {} as Record<string, PendingCommission[]>);

      for (const [referrerId, userComms] of Object.entries(userCommissions)) {
        const userTotal = userComms.reduce((sum, c) => sum + c.commission_amount, 0);
        const commissionIds = userComms.map(c => c.id);

        // إنشاء سجل الدفع
        const { error: paymentError } = await supabase
          .from('commission_payments')
          .insert({
            referrer_id: referrerId,
            total_amount: userTotal,
            commission_ids: commissionIds,
            payment_method: paymentDetails.method,
            payment_details: paymentDetails.notes,
            status: 'completed',
            paid_by: null // نظامنا لا يستخدم auth.uid
          });

        if (paymentError) {

        }

        // إرسال إشعار للمستخدم
        try {
          await supabase
            .from('notifications')
            .insert({
              recipient_id: referrerId,
              recipient_type: 'user',
              type: 'commission_paid',
              title: 'تم دفع العمولة',
              title_ar: 'تم دفع العمولة',
              message: `تم إرسال عمولتك بقيمة $${userTotal.toFixed(2)} عبر ${getPaymentMethodName(paymentDetails.method)}`,
              message_ar: `تم إرسال عمولتك بقيمة $${userTotal.toFixed(2)} عبر ${getPaymentMethodName(paymentDetails.method)}`,
              priority: 'high',
              is_read: false,
              action_data: {
                amount: userTotal,
                payment_method: paymentDetails.method,
                commission_count: userComms.length
              }
            });

        } catch (notifError) {

        }
      }

      alert(`تم دفع ${selectedCommissions.size} عمولة بنجاح بمبلغ إجمالي $${totalAmount.toFixed(2)}\nتم إرسال إشعارات للمستخدمين`);
      
      setSelectedCommissions(new Set());
      setShowPaymentModal(false);
      setPaymentDetails({ method: 'bank_transfer', notes: '' });
      await loadCommissions();
    } catch (error) {

      alert('حدث خطأ أثناء دفع العمولات');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
      {/* إحصائيات العمولات */}
      <div className="grid grid-cols-4 gap-1 sm:gap-2 lg:gap-4 mb-3 sm:mb-4 lg:mb-6">
        <Card padding="sm" className="text-center py-1 sm:py-2">
          <div className="text-sm sm:text-base lg:text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-[8px] sm:text-[10px] lg:text-sm text-gray-400">إجمالي</div>
        </Card>
        <Card padding="sm" className="text-center py-1 sm:py-2">
          <div className="text-sm sm:text-base lg:text-2xl font-bold text-yellow-400">{stats.pending}</div>
          <div className="text-[8px] sm:text-[10px] lg:text-sm text-gray-400">قيد الانتظار</div>
        </Card>
        <Card padding="sm" className="text-center py-1 sm:py-2">
          <div className="text-sm sm:text-base lg:text-2xl font-bold text-green-400">${stats.totalPending.toFixed(2)}</div>
          <div className="text-[8px] sm:text-[10px] lg:text-sm text-gray-400">مستحقة</div>
        </Card>
        <Card padding="sm" className="text-center py-1 sm:py-2">
          <div className="text-sm sm:text-base lg:text-2xl font-bold text-blue-400">${stats.totalPaid.toFixed(2)}</div>
          <div className="text-[8px] sm:text-[10px] lg:text-sm text-gray-400">مدفوعة</div>
        </Card>
      </div>

      {/* أدوات البحث والتصفية */}
      <Card padding="sm">
        <div className="flex flex-col gap-2 sm:gap-3">
          <div className="relative">
            <Search className="w-3 h-3 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="البحث بالاسم أو البريد..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800 text-white text-xs sm:text-sm px-8 py-2 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
            />
          </div>
          
          <div className="flex gap-2 items-center justify-between">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 bg-slate-800 text-white text-xs sm:text-sm px-2 sm:px-3 py-2 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
            >
              <option value="all">جميع الحالات</option>
              <option value="pending">قيد الانتظار</option>
              <option value="paid">مدفوعة</option>
              <option value="cancelled">ملغاة</option>
            </select>

            {selectedCommissions.size > 0 && (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-xs sm:text-sm transition-colors flex items-center gap-2"
              >
                <DollarSign className="w-4 h-4" />
                دفع ({selectedCommissions.size})
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* قائمة العمولات */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-right">
                  <input
                    type="checkbox"
                    checked={selectedCommissions.size === filteredCommissions.filter(c => c.status === 'pending').length && filteredCommissions.filter(c => c.status === 'pending').length > 0}
                    onChange={handleSelectAll}
                    className="rounded"
                  />
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase">المستخدم</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase">طريقة الدفع</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase">المبلغ</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase">النسبة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase">التاريخ</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredCommissions.map((commission) => (
                <tr key={commission.id} className="hover:bg-gray-700/50">
                  <td className="px-4 py-4">
                    {commission.status === 'pending' && (
                      <input
                        type="checkbox"
                        checked={selectedCommissions.has(commission.id)}
                        onChange={() => handleSelectCommission(commission.id)}
                        className="rounded"
                      />
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-white font-medium text-sm">{commission.referrer_name || 'غير محدد'}</p>
                      <p className="text-gray-400 text-xs">{commission.referrer_email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {renderPaymentMethodDetails(commission.payment_method)}
                  </td>
                  <td className="px-6 py-4 text-white font-bold">
                    ${commission.commission_amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    {commission.commission_rate}%
                  </td>
                  <td className="px-6 py-4 text-gray-300 text-sm">
                    {new Date(commission.created_at).toLocaleDateString('ar-SA')}
                  </td>
                  <td className="px-6 py-4">
                    {commission.status === 'pending' && (
                      <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs flex items-center gap-1 w-fit">
                        <Clock className="w-3 h-3" />
                        قيد الانتظار
                      </span>
                    )}
                    {commission.status === 'paid' && (
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs flex items-center gap-1 w-fit">
                        <CheckCircle className="w-3 h-3" />
                        مدفوعة
                      </span>
                    )}
                    {commission.status === 'cancelled' && (
                      <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs flex items-center gap-1 w-fit">
                        <XCircle className="w-3 h-3" />
                        ملغاة
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCommissions.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>لا توجد عمولات</p>
          </div>
        )}
      </div>

      {/* نافذة تأكيد الدفع */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-base sm:text-xl font-bold text-white mb-3 sm:mb-4">تأكيد دفع العمولات</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-gray-300 text-sm mb-2">
                  عدد العمولات: <span className="font-bold text-white">{selectedCommissions.size}</span>
                </p>
                <p className="text-gray-300 text-sm mb-2">
                  المبلغ الإجمالي: <span className="font-bold text-green-400">
                    ${commissions
                      .filter(c => selectedCommissions.has(c.id))
                      .reduce((sum, c) => sum + c.commission_amount, 0)
                      .toFixed(2)}
                  </span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  طريقة الدفع
                </label>
                <select
                  value={paymentDetails.method}
                  onChange={(e) => setPaymentDetails({ ...paymentDetails, method: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                >
                  <option value="bank_transfer">تحويل بنكي</option>
                  <option value="paypal">PayPal</option>
                  <option value="crypto">عملة رقمية</option>
                  <option value="cash">نقداً</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  ملاحظات (اختياري)
                </label>
                <textarea
                  value={paymentDetails.notes}
                  onChange={(e) => setPaymentDetails({ ...paymentDetails, notes: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  rows={3}
                  placeholder="أضف أي ملاحظات..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handlePayCommissions}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition-colors"
                >
                  تأكيد الدفع
                </button>
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentDetails({ method: 'bank_transfer', notes: '' });
                  }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* نافذة عرض تفاصيل طريقة الدفع */}
      {showDetailsModal && selectedPaymentMethod && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">تفاصيل طريقة الدفع الكاملة</h3>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedPaymentMethod(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* نوع طريقة الدفع */}
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  {getPaymentMethodIcon(selectedPaymentMethod.payment_type)}
                  <h4 className="text-lg font-semibold text-white">
                    {getPaymentMethodName(selectedPaymentMethod.payment_type)}
                  </h4>
                </div>
                {selectedPaymentMethod.is_primary && (
                  <span className="inline-block px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                    الطريقة الافتراضية
                  </span>
                )}
              </div>

              {/* تفاصيل حسب نوع الدفع */}
              <div className="bg-gray-700 rounded-lg p-4 space-y-3">
                <h5 className="font-semibold text-white mb-3">معلومات الدفع:</h5>
                
                {selectedPaymentMethod.payment_type === 'paypal' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">البريد الإلكتروني:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-mono">{selectedPaymentMethod.payment_details.email}</span>
                        <button
                          onClick={() => copyToClipboard(selectedPaymentMethod.payment_details.email)}
                          className="p-1 text-blue-400 hover:text-blue-300"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {selectedPaymentMethod.payment_type === 'bank_transfer' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">اسم البنك:</span>
                      <span className="text-white">{selectedPaymentMethod.payment_details.bank_name}</span>
                    </div>
                    {selectedPaymentMethod.payment_details.account_holder && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">صاحب الحساب:</span>
                        <span className="text-white">{selectedPaymentMethod.payment_details.account_holder}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">رقم الحساب:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-mono">{selectedPaymentMethod.payment_details.account_number}</span>
                        <button
                          onClick={() => copyToClipboard(selectedPaymentMethod.payment_details.account_number)}
                          className="p-1 text-blue-400 hover:text-blue-300"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {selectedPaymentMethod.payment_details.iban && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">IBAN:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-mono text-sm">{selectedPaymentMethod.payment_details.iban}</span>
                          <button
                            onClick={() => copyToClipboard(selectedPaymentMethod.payment_details.iban)}
                            className="p-1 text-blue-400 hover:text-blue-300"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                    {selectedPaymentMethod.payment_details.swift_code && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">SWIFT Code:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-mono">{selectedPaymentMethod.payment_details.swift_code}</span>
                          <button
                            onClick={() => copyToClipboard(selectedPaymentMethod.payment_details.swift_code)}
                            className="p-1 text-blue-400 hover:text-blue-300"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {selectedPaymentMethod.payment_type === 'western_union' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">الاسم الكامل:</span>
                      <span className="text-white">{selectedPaymentMethod.payment_details.full_name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">الدولة:</span>
                      <span className="text-white">{selectedPaymentMethod.payment_details.country}</span>
                    </div>
                    {selectedPaymentMethod.payment_details.city && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">المدينة:</span>
                        <span className="text-white">{selectedPaymentMethod.payment_details.city}</span>
                      </div>
                    )}
                    {selectedPaymentMethod.payment_details.phone && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">الهاتف:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-mono">{selectedPaymentMethod.payment_details.phone}</span>
                          <button
                            onClick={() => copyToClipboard(selectedPaymentMethod.payment_details.phone)}
                            className="p-1 text-blue-400 hover:text-blue-300"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {selectedPaymentMethod.payment_type === 'cryptocurrency' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">نوع العملة:</span>
                      <span className="text-white uppercase">{selectedPaymentMethod.payment_details.crypto_type}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm block mb-2">عنوان المحفظة:</span>
                      <div className="flex items-center gap-2 bg-gray-800 p-2 rounded">
                        <span className="text-white font-mono text-xs break-all flex-1">
                          {selectedPaymentMethod.payment_details.wallet_address}
                        </span>
                        <button
                          onClick={() => copyToClipboard(selectedPaymentMethod.payment_details.wallet_address)}
                          className="p-1 text-blue-400 hover:text-blue-300 flex-shrink-0"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {selectedPaymentMethod.payment_type === 'other' && (
                  <div>
                    <span className="text-gray-400 text-sm block mb-2">التفاصيل:</span>
                    <p className="text-white bg-gray-800 p-3 rounded">
                      {selectedPaymentMethod.payment_details.other_details || selectedPaymentMethod.payment_details.details}
                    </p>
                  </div>
                )}
              </div>

              {/* ملاحظة */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <p className="text-xs text-blue-200">
                  💡 <strong>ملاحظة:</strong> استخدم زر النسخ لنسخ المعلومات بسهولة عند إرسال العمولة.
                </p>
              </div>

              {/* زر الإغلاق */}
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedPaymentMethod(null);
                }}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
