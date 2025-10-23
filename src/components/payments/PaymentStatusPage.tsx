import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  X, 
  Eye, 
  CreditCard, 
  Wallet,
  RefreshCw,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { paymentService, Payment } from '../../services/paymentService';
import { useLanguage } from '../../contexts/LanguageContext';

interface PaymentStatusPageProps {
  userId: string;
  onBack: () => void;
}

export const PaymentStatusPage: React.FC<PaymentStatusPageProps> = ({ userId, onBack }) => {
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showProofModal, setShowProofModal] = useState(false);

  // تحميل مدفوعات المستخدم
  useEffect(() => {
    loadUserPayments();
    
    // تحديث تلقائي كل 3 ثوانِ للتحقق من التحديثات
    const interval = setInterval(() => {
      console.log('🔄 تحديث تلقائي لحالة المدفوعات...');
      loadUserPayments();
    }, 3000);
    
    return () => clearInterval(interval);
  }, [userId]);

  const loadUserPayments = async () => {
    try {
      setLoading(true);
      console.log('🔍 جلب مدفوعات المستخدم:', userId);
      console.log('⏰ الوقت الحالي:', new Date().toLocaleTimeString());
      
      // جلب جميع المدفوعات وتصفيتها للمستخدم الحالي
      const allPayments = await paymentService.getAllPayments();
      const userPayments = allPayments.filter(payment => payment.user_id === userId);
      
      console.log('✅ تم جلب مدفوعات المستخدم:', userPayments.length);
      console.log('📊 تفاصيل المدفوعات:', userPayments.map(p => ({
        id: p.id.substring(0, 8),
        status: p.status,
        amount: p.amount,
        updated_at: p.updated_at
      })));
      
      // التحقق من تحديث الحالة وإشعار المستخدم
      const previousPayments = payments;
      userPayments.forEach(newPayment => {
        const oldPayment = previousPayments.find(p => p.id === newPayment.id);
        if (oldPayment && oldPayment.status !== newPayment.status) {
          console.log(`🔔 تحديث حالة الدفع: ${oldPayment.status} → ${newPayment.status}`);
          if (newPayment.status === 'completed') {
            alert(`🎉 تم قبول دفعتك!
            
💰 المبلغ: $${newPayment.amount}
✅ تم تفعيل اشتراكك بنجاح
🚀 يمكنك الآن الاستفادة من جميع الميزات`);
          }
        }
      });
      
      setPayments(userPayments);
    } catch (error) {
      console.error('❌ خطأ في جلب المدفوعات:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUserPayments();
    setRefreshing(false);
  };

  const getStatusBadge = (status: string | undefined) => {
    const statusMap = {
      pending: { 
        variant: 'warning' as const, 
        text: 'قيد الانتظار', 
        icon: <Clock className="w-3 h-3" />,
        bgColor: 'bg-yellow-500/10',
        textColor: 'text-yellow-400'
      },
      reviewing: { 
        variant: 'info' as const, 
        text: 'قيد المراجعة', 
        icon: <Eye className="w-3 h-3" />,
        bgColor: 'bg-blue-500/10',
        textColor: 'text-blue-400'
      },
      completed: { 
        variant: 'success' as const, 
        text: 'مكتمل', 
        icon: <CheckCircle className="w-3 h-3" />,
        bgColor: 'bg-green-500/10',
        textColor: 'text-green-400'
      },
      failed: { 
        variant: 'error' as const, 
        text: 'فاشل', 
        icon: <XCircle className="w-3 h-3" />,
        bgColor: 'bg-red-500/10',
        textColor: 'text-red-400'
      }
    };
    
    // التأكد من أن status ليس undefined أو null
    const safeStatus = status || 'pending';
    const config = statusMap[safeStatus as keyof typeof statusMap] || statusMap.pending;
    
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bgColor}`}>
        {config.icon}
        <span className={`text-sm font-medium ${config.textColor}`}>
          {config.text}
        </span>
      </div>
    );
  };

  const getMethodIcon = (method: string) => {
    const icons = {
      paypal: <CreditCard className="w-5 h-5 text-blue-500" />,
      card: <CreditCard className="w-5 h-5 text-purple-500" />,
      crypto: <Wallet className="w-5 h-5 text-green-500" />
    };
    return icons[method as keyof typeof icons];
  };

  const getMethodName = (method: string) => {
    const names = {
      paypal: 'PayPal',
      card: 'بطاقة ائتمان',
      crypto: 'عملة رقمية'
    };
    return names[method as keyof typeof names] || method;
  };

  const getStatusMessage = (payment: Payment) => {
    switch (payment.status) {
      case 'pending':
        return 'دفعتك قيد المعالجة. سيتم تحديث الحالة قريباً.';
      case 'reviewing':
        return 'تم استلام صورة تأكيد الدفع وهي قيد المراجعة من قبل فريقنا.';
      case 'completed':
        return 'تم تأكيد دفعتك بنجاح! تم تفعيل اشتراكك.';
      case 'failed':
        return 'فشل في معالجة الدفع. يرجى المحاولة مرة أخرى أو الاتصال بالدعم.';
      default:
        return 'حالة غير معروفة';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin" />
              <span>{t('paymentStatus.refreshing')}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* الهيدر */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('subscriptionPage.back')}
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">{t('paymentStatus.title')}</h1>
              <p className="text-slate-400">{t('paymentStatus.subtitle')}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-xs text-slate-500">
              {t('paymentStatus.lastUpdate')}: {new Date().toLocaleTimeString(language === 'ar' ? 'ar-SA' : language === 'fr' ? 'fr-FR' : 'en-US')}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700/50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? t('paymentStatus.refreshing') : t('paymentStatus.refreshNow')}
            </Button>
          </div>
        </div>

        {/* إشعار للمدفوعات قيد المراجعة */}
        {payments.some(p => p.status === 'reviewing') && (
          <Card padding="md" className="border-blue-500/20 bg-blue-500/5">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <div>
                <h3 className="text-blue-400 font-semibold">{t('paymentStatus.reviewingTitle')}</h3>
                <p className="text-slate-400 text-sm">
                  {t('paymentStatus.reviewingMessage')}
                </p>
              </div>
              <div className="ml-auto">
                <Button
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <RefreshCw className={`w-3 h-3 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                  {t('paymentStatus.checkNow')}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* قائمة المدفوعات */}
        {payments.length === 0 ? (
          <Card padding="lg">
            <div className="text-center py-12">
              <CreditCard className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">{t('paymentStatus.noPayments')}</h3>
              <p className="text-slate-400">{t('paymentStatus.noPaymentsMessage')}</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <Card key={payment.id} padding="md">
                <div className="space-y-4">
                  {/* معلومات الدفع الأساسية */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      {getMethodIcon(payment.payment_method)}
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {payment.plan_name_ar || payment.plan_name || t('paymentStatus.unspecifiedPlan')}
                        </h3>
                        <p className="text-slate-400 text-sm">
                          {getMethodName(payment.payment_method)} • ${payment.amount}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(payment.status)}
                  </div>

                  {/* رسالة الحالة */}
                  <div className={`p-4 rounded-lg border-r-4 ${
                    payment.status === 'completed' ? 'bg-green-500/10 border-green-500' :
                    payment.status === 'failed' ? 'bg-red-500/10 border-red-500' :
                    payment.status === 'reviewing' ? 'bg-blue-500/10 border-blue-500' :
                    'bg-yellow-500/10 border-yellow-500'
                  }`}>
                    <div className="flex items-start gap-3">
                      {payment.status === 'completed' ? <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" /> :
                       payment.status === 'failed' ? <XCircle className="w-5 h-5 text-red-400 mt-0.5" /> :
                       <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />}
                      <div>
                        <p className="text-white text-sm font-medium mb-1">
                          {getStatusMessage(payment)}
                        </p>
                        <p className="text-slate-400 text-xs">
                          تاريخ الإنشاء: {formatDate(payment.created_at)}
                        </p>
                        {payment.updated_at !== payment.created_at && (
                          <p className="text-slate-400 text-xs">
                            آخر تحديث: {formatDate(payment.updated_at)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* أزرار الإجراءات */}
                  <div className="flex gap-3">
                    {payment.proof_image && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedPayment(payment);
                          setShowProofModal(true);
                        }}
                        className="text-blue-400 hover:bg-blue-500/10"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        عرض صورة التأكيد
                      </Button>
                    )}
                    
                    {payment.payment_reference && (
                      <div className="text-xs text-slate-400">
                        رقم المرجع: {payment.payment_reference}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* نافذة عرض صورة التأكيد */}
        {showProofModal && selectedPayment && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">{t('paymentStatus.proofImage')}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowProofModal(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="p-4">
                <div className="mb-4">
                  <p className="text-slate-400 text-sm">{t('paymentStatus.amount')}: <span className="text-green-400">${selectedPayment.amount}</span></p>
                  <p className="text-slate-400 text-sm">{t('paymentStatus.plan')}: <span className="text-white">{selectedPayment.plan_name_ar || selectedPayment.plan_name}</span></p>
                </div>
                
                {selectedPayment.proof_image && (
                  <div className="text-center">
                    <img 
                      src={selectedPayment.proof_image} 
                      alt={t('paymentStatus.proofImage')}
                      className="max-w-full max-h-96 mx-auto rounded-lg border border-slate-700"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
