import React, { useState, useEffect } from 'react';
import { 
  Check, 
  X, 
  Eye, 
  CreditCard, 
  Wallet,
  Search,
  RefreshCw
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { paymentService, Payment } from '../../services/paymentService';
import { subscriptionService } from '../../services/subscriptionService';
import { clearAllCaches } from '../../utils/cacheUtils';
import { supabase } from '../../config/supabaseClient';

interface PaymentManagementProps {
  currentUser: any;
}

export const PaymentManagement: React.FC<PaymentManagementProps> = ({ currentUser }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showProofModal, setShowProofModal] = useState(false);

  // تحميل البيانات الحقيقية من قاعدة البيانات
  useEffect(() => {
    loadPayments();
    
    // إعداد Realtime subscription للتحديث الفوري
    const setupRealtime = async () => {
      const subscription = supabase
        .channel('admin-payments')
        .on(
          'postgres_changes',
          {
            event: '*', // جميع الأحداث (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: 'payments'
          },
          (_payload) => {

            // مسح الـ cache لضمان جلب البيانات الجديدة
            paymentService.clearCache();

            loadPayments(); // إعادة تحميل البيانات
          }
        )
        .subscribe();
      
      return subscription;
    };
    
    let realtimeSubscription: any = null;
    setupRealtime().then(sub => {
      realtimeSubscription = sub;
    });
    
    // ✅ إلغاء التحديث المتكرر - Realtime يكفي!
    // تحديث احتياطي فقط كل دقيقة واحدة (بدلاً من 10 ثوانٍ)
    const interval = setInterval(() => {

      paymentService.clearCache();
      loadPayments();
    }, 60000); // دقيقة واحدة فقط
    
    return () => {
      clearInterval(interval);
      if (realtimeSubscription) {
        realtimeSubscription.unsubscribe();
      }
    };
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError(null);

      const paymentsData = await paymentService.getAllPayments(true);

      setPayments(paymentsData);
      
      // إذا كانت البيانات فارغة ولكن لا يوجد خطأ، نعتبرها حالة طبيعية
      if (paymentsData.length === 0) {
        setError(null);
      }
    } catch (err) {

      setError('حدث خطأ في تحميل المدفوعات. يرجى المحاولة مرة أخرى.');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string | undefined) => {
    const statusMap = {
      pending: { color: 'warning', text: 'قيد الانتظار' },
      reviewing: { color: 'info', text: 'قيد المراجعة' },
      crypto_pending: { color: 'warning', text: 'في انتظار المراجعة' },
      crypto_approved: { color: 'success', text: 'تمت الموافقة' },
      crypto_rejected: { color: 'error', text: 'مرفوض' },
      completed: { color: 'success', text: 'مكتمل' },
      failed: { color: 'error', text: 'فاشل' },
      processing: { color: 'info', text: 'قيد المعالجة' },
      cancelled: { color: 'error', text: 'ملغي' }
    };
    
    // التأكد من أن status ليس undefined أو null
    const safeStatus = status || 'pending';
    const config = statusMap[safeStatus as keyof typeof statusMap] || statusMap.pending;
    
    return (
      <Badge variant={config.color as any}>
        {config.text}
      </Badge>
    );
  };

  const getMethodIcon = (method: string) => {
    const icons = {
      paypal: <CreditCard className="w-4 h-4 text-blue-500" />,
      card: <CreditCard className="w-4 h-4 text-purple-500" />,
      crypto: <Wallet className="w-4 h-4 text-green-500" />
    };
    return icons[method as keyof typeof icons] || icons.paypal;
  };

  const handleApprovePayment = async (paymentId: string) => {
    try {

      // العثور على الدفع للحصول على معلومات المستخدم
      const payment = payments.find(p => p.id === paymentId);
      
      // استخدام confirmPayment لتحديث كل شيء تلقائياً
      const result = await subscriptionService.confirmPayment(
        paymentId, 
        currentUser?.id || 'system', // استخدام ID المستخدم الحالي
        true, // approved = true
        'تمت الموافقة على الدفع من قبل الإدارة'
      );
      
      if (result.success) {
        // مسح الـ cache
        await clearAllCaches();
        paymentService.clearCache();
        
        // تحديث الحالة المحلية
        setPayments(prev => prev.map(p => 
          p.id === paymentId 
            ? { ...p, status: 'completed', admin_review_status: 'approved', updated_at: new Date().toISOString() }
            : p
        ));
        
        // إشعار نجاح للمدير
        alert(`✅ تم قبول الدفع بنجاح!\n👤 المستخدم: ${payment?.user_name}\n💰 المبلغ: $${payment?.amount}\n🎯 تم تفعيل الاشتراك تلقائياً`);

      } else {
        throw new Error(result.error);
      }
    } catch (error) {

      alert('فشل في قبول الدفع. يرجى المحاولة مرة أخرى.');
    }
  };

  const handleRejectPayment = async (paymentId: string) => {
    try {

      // العثور على الدفع للحصول على معلومات المستخدم
      const payment = payments.find(p => p.id === paymentId);
      
      // طلب سبب الرفض
      const reason = prompt('يرجى إدخال سبب رفض الدفع:');
      if (!reason) {
        alert('يجب إدخال سبب الرفض');
        return;
      }
      
      // استخدام confirmPayment لتحديث كل شيء تلقائياً
      const result = await subscriptionService.confirmPayment(
        paymentId,
        currentUser?.id || 'system', // استخدام ID المستخدم الحالي
        false, // approved = false
        reason
      );
      
      if (result.success) {
        // مسح الـ cache
        await clearAllCaches();
        paymentService.clearCache();
        
        // تحديث الحالة المحلية
        setPayments(prev => prev.map(p => 
          p.id === paymentId 
            ? { ...p, status: 'failed', admin_review_status: 'rejected', updated_at: new Date().toISOString() }
            : p
        ));
        
        // إشعار للمدير
        alert(`❌ تم رفض الدفع!\n👤 المستخدم: ${payment?.user_name}\n💰 المبلغ: $${payment?.amount}\n📧 سيتم إشعار المستخدم بالرفض`);

      } else {
        throw new Error(result.error);
      }
    } catch (error) {

      alert('فشل في رفض الدفع. يرجى المحاولة مرة أخرى.');
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.user_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesMethod = methodFilter === 'all' || payment.payment_method === methodFilter;
    
    return matchesSearch && matchesStatus && matchesMethod;
  });

  // حساب الإحصائيات الدقيقة
  const completedPayments = payments.filter(p => p.status === 'completed' || p.status === 'crypto_approved');
  const totalRevenue = completedPayments.reduce((sum, p) => sum + p.amount, 0);
  const formattedRevenue = Math.round(totalRevenue * 100) / 100; // رقمين بعد الفاصلة
  
  const stats = {
    total: payments.length,
    pending: payments.filter(p => p.status === 'pending' || p.status === 'crypto_pending').length,
    reviewing: payments.filter(p => p.status === 'reviewing' || p.status === 'crypto_pending').length,
    completed: completedPayments.length,
    totalRevenue: formattedRevenue
  };

  return (
    <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
      {/* إحصائيات المدفوعات */}
      <div className="grid grid-cols-4 gap-1 sm:gap-2 lg:gap-4 mb-3 sm:mb-4 lg:mb-6">
        <Card padding="sm" className="text-center py-1 sm:py-2">
          <div className="text-sm sm:text-base lg:text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-[8px] sm:text-[10px] lg:text-sm text-gray-400">إجمالي</div>
        </Card>
        <Card padding="sm" className="text-center py-1 sm:py-2">
          <div className="text-sm sm:text-base lg:text-2xl font-bold text-yellow-400">{stats.reviewing}</div>
          <div className="text-[8px] sm:text-[10px] lg:text-sm text-gray-400">مراجعة</div>
        </Card>
        <Card padding="sm" className="text-center py-1 sm:py-2">
          <div className="text-sm sm:text-base lg:text-2xl font-bold text-green-400">{stats.completed}</div>
          <div className="text-[8px] sm:text-[10px] lg:text-sm text-gray-400">مكتملة</div>
        </Card>
        <Card padding="sm" className="text-center py-1 sm:py-2">
          <div className="text-sm sm:text-base lg:text-2xl font-bold text-green-400">${stats.totalRevenue.toFixed(2)}</div>
          <div className="text-[8px] sm:text-[10px] lg:text-sm text-gray-400">إيرادات</div>
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
          
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 bg-slate-800 text-white text-xs sm:text-sm px-2 sm:px-3 py-2 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
            >
              <option value="all">جميع الحالات</option>
              <option value="pending">انتظار</option>
              <option value="reviewing">مراجعة</option>
              <option value="completed">مكتملة</option>
              <option value="failed">فاشلة</option>
            </select>
            
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="flex-1 bg-slate-800 text-white text-xs sm:text-sm px-2 sm:px-3 py-2 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
            >
              <option value="all">جميع الطرق</option>
              <option value="paypal">PayPal</option>
              <option value="card">بطاقة</option>
              <option value="crypto">عملة رقمية</option>
            </select>
          </div>
        </div>
      </Card>

      {/* ملاحظة توضيحية */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-xs sm:text-sm">
        <div className="flex items-start gap-2">
          <div className="text-blue-400 mt-0.5">ℹ️</div>
          <div className="text-slate-300">
            <strong className="text-blue-400">ملاحظة:</strong> أزرار الموافقة/الرفض تظهر فقط للمدفوعات بالعملات الرقمية. 
            المدفوعات الأخرى (PayPal، البطاقات) تتم الموافقة عليها تلقائياً.
          </div>
        </div>
      </div>

      {/* قائمة المدفوعات */}
      <Card padding="sm">
        <div className="space-y-2">
          {filteredPayments.map((payment) => (
            <div key={payment.id} className="bg-slate-800 p-3 rounded-lg">
              {/* الصف الأول: معلومات المستخدم والحالة */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getMethodIcon(payment.payment_method)}
                  <div className="min-w-0 flex-1">
                    <div className="text-xs sm:text-sm font-medium text-white truncate">{payment.user_name}</div>
                    <div className="text-xs text-slate-400 truncate">{payment.user_email}</div>
                  </div>
                </div>
                
                <div className="flex-shrink-0">
                  {getStatusBadge(payment.status)}
                </div>
              </div>
              
              {/* الصف الثاني: المبلغ والباقة */}
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs sm:text-sm font-bold text-green-400">${payment.amount}</div>
                <div className="text-xs text-slate-400 text-right truncate max-w-[150px]">
                  {payment.plan_name_ar || payment.plan_name}
                </div>
              </div>
              
              {/* الصف الثالث: الأزرار */}
              <div className="flex gap-1 justify-end">
                {/* زر عرض الصورة - يظهر للعملات الرقمية */}
                {(payment.payment_method === 'crypto' || payment.payment_method === 'bitcoin' || payment.payment_method === 'usdt') && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="px-2 py-1"
                    onClick={async () => {

                      // جلب الصورة من قاعدة البيانات
                      const proofData = await paymentService.getPaymentProofImage(payment.id);

                      // تحديث بيانات الدفع بالصورة
                      const paymentWithProof = {
                        ...payment,
                        crypto_proof_image: proofData?.crypto_proof_image,
                        proof_image: proofData?.proof_image
                      };

                      setSelectedPayment(paymentWithProof);
                      setShowProofModal(true);
                    }}
                  >
                    <Eye className="w-3 h-3" />
                    <span className="text-xs ml-1 hidden sm:inline">عرض</span>
                  </Button>
                )}
                
                {/* أزرار الموافقة والرفض - تظهر فقط للعملات الرقمية قيد المراجعة */}
                {(payment.payment_method === 'crypto' || payment.payment_method === 'bitcoin' || payment.payment_method === 'usdt') && 
                 (payment.status === 'reviewing' || payment.status === 'crypto_pending' || payment.status === 'pending') && (
                  <>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 px-2 py-1"
                      onClick={() => handleApprovePayment(payment.id)}
                    >
                      <Check className="w-3 h-3" />
                      <span className="text-xs ml-1 hidden sm:inline">موافقة</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:bg-red-500/10 px-2 py-1"
                      onClick={() => handleRejectPayment(payment.id)}
                    >
                      <X className="w-3 h-3" />
                      <span className="text-xs ml-1 hidden sm:inline">رفض</span>
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 text-blue-400 mx-auto mb-2 animate-spin" />
              <p className="text-slate-400">جاري تحميل المدفوعات...</p>
            </div>
          )}
          
          {!loading && error && (
            <div className="text-center py-8">
              <X className="w-12 h-12 text-red-400 mx-auto mb-2" />
              <p className="text-red-400 mb-2">{error}</p>
              <p className="text-slate-500 text-sm mb-3">قد تكون قاعدة البيانات بطيئة حالياً</p>
              <Button
                onClick={() => {
                  paymentService.clearCache();
                  loadPayments();
                }}
                variant="ghost"
                size="sm"
                className="mt-3"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                إعادة المحاولة
              </Button>
            </div>
          )}
          
          {!loading && !error && filteredPayments.length === 0 && payments.length === 0 && (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 mb-2">لا توجد مدفوعات في النظام</p>
              <p className="text-slate-500 text-sm">ستظهر المدفوعات هنا عندما ينشئ المستخدمون طلبات دفع جديدة</p>
              <Button
                onClick={loadPayments}
                variant="ghost"
                size="sm"
                className="mt-3"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                تحديث
              </Button>
            </div>
          )}
          
          {!loading && filteredPayments.length === 0 && payments.length > 0 && (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400">لا توجد مدفوعات مطابقة للبحث</p>
              <p className="text-slate-500 text-sm">جرب تغيير معايير البحث أو التصفية</p>
            </div>
          )}
        </div>
      </Card>

      {/* نافذة عرض صورة التأكيد */}
      {showProofModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-lg max-w-lg w-full max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-900 p-3 border-b border-slate-700 flex items-center justify-between z-10">
              <h3 className="text-base font-bold text-white">صورة تأكيد الدفع</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {

                  setShowProofModal(false);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="p-3">
              <div className="mb-3 space-y-1">
                <p className="text-slate-400 text-xs">المستخدم: <span className="text-white">{selectedPayment.user_name}</span></p>
                <p className="text-slate-400 text-xs">المبلغ: <span className="text-green-400">${selectedPayment.amount}</span></p>
                <p className="text-slate-400 text-xs">الباقة: <span className="text-white">{selectedPayment.plan_name_ar || selectedPayment.plan_name}</span></p>
                <p className="text-slate-400 text-xs">طريقة الدفع: <span className="text-blue-400">{selectedPayment.payment_method}</span></p>
              </div>
              
              {/* عرض الصورة للعملات الرقمية */}
              {(selectedPayment.payment_method === 'crypto' || selectedPayment.payment_method === 'bitcoin' || selectedPayment.payment_method === 'usdt') && (selectedPayment.crypto_proof_image || selectedPayment.proof_image) && (
                <div className="text-center">
                  <div className="bg-slate-800/50 p-3 rounded-lg">
                    <div className="relative">
                      <img 
                        src={selectedPayment.crypto_proof_image || selectedPayment.proof_image} 
                        alt="صورة تأكيد الدفع"
                        className="w-full h-auto max-h-[50vh] object-contain mx-auto rounded-lg border-2 border-slate-700 shadow-xl cursor-zoom-in"
                        onClick={() => {
                          // فتح الصورة في نافذة جديدة للعرض بالحجم الكامل
                          const win = window.open();
                          if (win) {
                            win.document.write(`
                              <html>
                                <head>
                                  <title>صورة إثبات الدفع - عرض كامل</title>
                                  <style>
                                    body { 
                                      margin: 0; 
                                      background: #0f172a; 
                                      display: flex; 
                                      justify-content: center; 
                                      align-items: center; 
                                      min-height: 100vh;
                                      padding: 20px;
                                    }
                                    img { 
                                      max-width: 100%; 
                                      max-height: 100vh; 
                                      object-fit: contain;
                                      border-radius: 8px;
                                      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
                                    }
                                  </style>
                                </head>
                                <body>
                                  <img src="${selectedPayment.crypto_proof_image || selectedPayment.proof_image}" alt="صورة إثبات الدفع" />
                                </body>
                              </html>
                            `);
                          }
                        }}
                        onLoad={() => {

                        }}
                        onError={(e) => {

                          e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%231e293b"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="20" fill="%2394a3b8"%3Eفشل تحميل الصورة%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    </div>
                    <p className="text-slate-400 text-xs mt-2">
                      📸 صورة إثبات الدفع
                    </p>
                    <p className="text-slate-500 text-xs mt-1">
                      💡 اضغط على الصورة لعرضها بالحجم الكامل
                    </p>
                  </div>
                </div>
              )}
              
              {/* رسالة إذا لم تكن هناك صورة */}
              {(selectedPayment.payment_method === 'crypto' || selectedPayment.payment_method === 'bitcoin' || selectedPayment.payment_method === 'usdt') && !selectedPayment.crypto_proof_image && !selectedPayment.proof_image && (
                <div className="text-center p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <div className="text-yellow-400 mb-2">⚠️ لا توجد صورة إثبات</div>
                  <p className="text-gray-300 text-sm">
                    لم يقم المستخدم برفع صورة إثبات الدفع بعد.
                  </p>
                </div>
              )}
              
              {/* رسالة للطرق الأخرى */}
              {(selectedPayment.payment_method === 'paypal' || selectedPayment.payment_method === 'card') && (
                <div className="text-center p-6 bg-gray-800 rounded-lg">
                  <div className="text-blue-400 mb-2">
                    {selectedPayment.payment_method === 'paypal' ? '💳 دفع PayPal' : '🏦 دفع بطاقة بنكية'}
                  </div>
                  <p className="text-gray-300 text-sm">
                    هذا النوع من المدفوعات لا يتطلب رفع صور تأكيد. 
                    التحقق يتم تلقائياً من خلال النظام.
                  </p>
                </div>
              )}
              
              <div className="flex gap-3 mt-4">
                <Button
                  onClick={() => {
                    handleApprovePayment(selectedPayment.id);
                    setShowProofModal(false);
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4 mr-2" />
                  موافقة على الدفع
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    handleRejectPayment(selectedPayment.id);
                    setShowProofModal(false);
                  }}
                  className="flex-1 text-red-400 hover:bg-red-500/10"
                >
                  <X className="w-4 h-4 mr-2" />
                  رفض الدفع
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
