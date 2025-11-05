import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';
import { useLanguage } from '../../contexts/LanguageContext';
import { 
  CreditCard, 
  Building2, 
  Send, 
  Bitcoin, 
  Plus, 
  Edit2, 
  Trash2, 
  Check,
  X,
  AlertCircle
} from 'lucide-react';

interface PaymentMethod {
  id: string;
  payment_type: 'paypal' | 'bank_transfer' | 'western_union' | 'cryptocurrency' | 'other';
  payment_details: any;
  is_primary: boolean;
  is_verified: boolean;
  created_at: string;
}

interface PaymentMethodSettingsProps {
  userId: string;
}

const PaymentMethodSettings: React.FC<PaymentMethodSettingsProps> = ({ userId }) => {
  const { t } = useLanguage();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // نموذج البيانات
  const [formData, setFormData] = useState({
    payment_type: 'paypal' as PaymentMethod['payment_type'],
    // PayPal
    paypal_email: '',
    // تحويل بنكي
    bank_name: '',
    account_holder: '',
    account_number: '',
    iban: '',
    swift_code: '',
    // Western Union
    full_name: '',
    country: '',
    city: '',
    phone: '',
    // عملات رقمية
    crypto_type: 'bitcoin',
    wallet_address: '',
    // أخرى
    other_details: ''
  });

  useEffect(() => {
    loadPaymentMethods();
  }, [userId]);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', userId)
        .order('is_primary', { ascending: false });

      if (error) {
        console.error('خطأ في تحميل طرق الدفع:', error);
        // إذا كان الجدول غير موجود، نعرض رسالة واضحة
        if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
          setError('جدول طرق الدفع غير موجود. يرجى تطبيق Migration أولاً.');
        } else {
          setError('فشل تحميل طرق الدفع: ' + error.message);
        }
        setPaymentMethods([]);
      } else {
        setPaymentMethods(data || []);
      }
    } catch (error: any) {
      console.error('خطأ في تحميل طرق الدفع:', error);
      setError('حدث خطأ غير متوقع: ' + (error?.message || 'خطأ غير معروف'));
      setPaymentMethods([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // بناء payment_details حسب النوع
      let payment_details: any = {};
      
      switch (formData.payment_type) {
        case 'paypal':
          if (!formData.paypal_email) {
            setError('الرجاء إدخال بريد PayPal');
            return;
          }
          payment_details = { email: formData.paypal_email };
          break;
          
        case 'bank_transfer':
          if (!formData.bank_name || !formData.account_number) {
            setError('الرجاء إدخال اسم البنك ورقم الحساب');
            return;
          }
          payment_details = {
            bank_name: formData.bank_name,
            account_holder: formData.account_holder,
            account_number: formData.account_number,
            iban: formData.iban,
            swift_code: formData.swift_code
          };
          break;
          
        case 'western_union':
          if (!formData.full_name || !formData.country) {
            setError('الرجاء إدخال الاسم الكامل والدولة');
            return;
          }
          payment_details = {
            full_name: formData.full_name,
            country: formData.country,
            city: formData.city,
            phone: formData.phone
          };
          break;
          
        case 'cryptocurrency':
          if (!formData.wallet_address) {
            setError('الرجاء إدخال عنوان المحفظة');
            return;
          }
          payment_details = {
            crypto_type: formData.crypto_type,
            wallet_address: formData.wallet_address
          };
          break;
          
        case 'other':
          if (!formData.other_details) {
            setError('الرجاء إدخال تفاصيل طريقة الدفع');
            return;
          }
          payment_details = { details: formData.other_details };
          break;
      }

      if (editingMethod) {
        // تحديث
        const { error } = await supabase
          .from('payment_methods')
          .update({
            payment_details,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingMethod.id);

        if (error) throw error;
      } else {
        // إضافة جديد
        const { error } = await supabase
          .from('payment_methods')
          .insert({
            user_id: userId,
            payment_type: formData.payment_type,
            payment_details,
            is_primary: paymentMethods.length === 0 // أول طريقة تكون primary
          });

        if (error) throw error;
      }

      await loadPaymentMethods();
      handleCancel();
    } catch (error: any) {
      console.error('خطأ في حفظ طريقة الدفع:', error);
      setError(error.message || 'فشل حفظ طريقة الدفع');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method);
    setShowAddForm(true);
    
    // ملء النموذج بالبيانات الحالية
    const details = method.payment_details;
    setFormData({
      payment_type: method.payment_type,
      paypal_email: details.email || '',
      bank_name: details.bank_name || '',
      account_holder: details.account_holder || '',
      account_number: details.account_number || '',
      iban: details.iban || '',
      swift_code: details.swift_code || '',
      full_name: details.full_name || '',
      country: details.country || '',
      city: details.city || '',
      phone: details.phone || '',
      crypto_type: details.crypto_type || 'bitcoin',
      wallet_address: details.wallet_address || '',
      other_details: details.details || ''
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف طريقة الدفع هذه؟')) return;

    try {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadPaymentMethods();
    } catch (error) {
      console.error('خطأ في حذف طريقة الدفع:', error);
      setError('فشل حذف طريقة الدفع');
    }
  };

  const handleSetPrimary = async (id: string) => {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .update({ is_primary: true })
        .eq('id', id);

      if (error) throw error;
      await loadPaymentMethods();
    } catch (error) {
      console.error('خطأ في تعيين طريقة الدفع الافتراضية:', error);
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingMethod(null);
    setError(null);
    setFormData({
      payment_type: 'paypal',
      paypal_email: '',
      bank_name: '',
      account_holder: '',
      account_number: '',
      iban: '',
      swift_code: '',
      full_name: '',
      country: '',
      city: '',
      phone: '',
      crypto_type: 'bitcoin',
      wallet_address: '',
      other_details: ''
    });
  };

  const getPaymentTypeIcon = (type: string) => {
    switch (type) {
      case 'paypal': return <CreditCard className="w-5 h-5" />;
      case 'bank_transfer': return <Building2 className="w-5 h-5" />;
      case 'western_union': return <Send className="w-5 h-5" />;
      case 'cryptocurrency': return <Bitcoin className="w-5 h-5" />;
      default: return <CreditCard className="w-5 h-5" />;
    }
  };

  const getPaymentTypeName = (type: string) => {
    const names: Record<string, string> = {
      paypal: 'PayPal',
      bank_transfer: 'تحويل بنكي',
      western_union: 'Western Union',
      cryptocurrency: 'عملة رقمية',
      other: 'أخرى'
    };
    return names[type] || type;
  };

  const renderPaymentDetails = (method: PaymentMethod) => {
    const details = method.payment_details;
    
    switch (method.payment_type) {
      case 'paypal':
        return <p className="text-sm text-gray-300">{details.email}</p>;
        
      case 'bank_transfer':
        return (
          <div className="text-sm text-gray-300 space-y-1">
            <p><span className="text-gray-400">البنك:</span> {details.bank_name}</p>
            <p><span className="text-gray-400">رقم الحساب:</span> {details.account_number}</p>
            {details.iban && <p><span className="text-gray-400">IBAN:</span> {details.iban}</p>}
          </div>
        );
        
      case 'western_union':
        return (
          <div className="text-sm text-gray-300 space-y-1">
            <p><span className="text-gray-400">الاسم:</span> {details.full_name}</p>
            <p><span className="text-gray-400">الدولة:</span> {details.country}</p>
            {details.phone && <p><span className="text-gray-400">الهاتف:</span> {details.phone}</p>}
          </div>
        );
        
      case 'cryptocurrency':
        return (
          <div className="text-sm text-gray-300 space-y-1">
            <p><span className="text-gray-400">النوع:</span> {details.crypto_type}</p>
            <p className="text-gray-400 break-all">المحفظة: {details.wallet_address}</p>
          </div>
        );
        
      default:
        return <p className="text-sm text-gray-300">{details.details}</p>;
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
    <div className="space-y-4">
      {/* رأس القسم */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-white">طرق استلام العمولات</h3>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all hover:shadow-lg text-xs font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة</span>
          </button>
        )}
      </div>

      {/* رسالة خطأ */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-200">{error}</p>
        </div>
      )}

      {/* نموذج الإضافة/التعديل */}
      {showAddForm && (
        <div className="bg-gray-800 rounded-xl p-4 space-y-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-white">
              {editingMethod ? 'تعديل طريقة الدفع' : 'إضافة طريقة دفع جديدة'}
            </h4>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg p-1 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* اختيار نوع الدفع */}
          {!editingMethod && (
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2">
                نوع طريقة الدفع
              </label>
              <select
                value={formData.payment_type}
                onChange={(e) => setFormData({ ...formData, payment_type: e.target.value as any })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="paypal">PayPal</option>
                <option value="bank_transfer">تحويل بنكي</option>
                <option value="western_union">Western Union</option>
                <option value="cryptocurrency">عملة رقمية</option>
                <option value="other">أخرى</option>
              </select>
            </div>
          )}

          {/* حقول PayPal */}
          {formData.payment_type === 'paypal' && (
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2">
                بريد PayPal الإلكتروني
              </label>
              <input
                type="email"
                value={formData.paypal_email}
                onChange={(e) => setFormData({ ...formData, paypal_email: e.target.value })}
                placeholder="example@paypal.com"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-xs text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* حقول التحويل البنكي */}
          {formData.payment_type === 'bank_transfer' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-2">اسم البنك *</label>
                <input
                  type="text"
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-2">اسم صاحب الحساب</label>
                <input
                  type="text"
                  value={formData.account_holder}
                  onChange={(e) => setFormData({ ...formData, account_holder: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-2">رقم الحساب *</label>
                <input
                  type="text"
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-2">IBAN</label>
                <input
                  type="text"
                  value={formData.iban}
                  onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-2">SWIFT Code</label>
                <input
                  type="text"
                  value={formData.swift_code}
                  onChange={(e) => setFormData({ ...formData, swift_code: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* حقول Western Union */}
          {formData.payment_type === 'western_union' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-2">الاسم الكامل *</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-2">الدولة *</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-2">المدينة</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-2">رقم الهاتف</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* حقول العملات الرقمية */}
          {formData.payment_type === 'cryptocurrency' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-2">نوع العملة</label>
                <select
                  value={formData.crypto_type}
                  onChange={(e) => setFormData({ ...formData, crypto_type: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="bitcoin">Bitcoin (BTC)</option>
                  <option value="ethereum">Ethereum (ETH)</option>
                  <option value="usdt">Tether (USDT)</option>
                  <option value="usdc">USD Coin (USDC)</option>
                  <option value="other">أخرى</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-2">عنوان المحفظة *</label>
                <input
                  type="text"
                  value={formData.wallet_address}
                  onChange={(e) => setFormData({ ...formData, wallet_address: e.target.value })}
                  placeholder="0x..."
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* حقول أخرى */}
          {formData.payment_type === 'other' && (
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2">تفاصيل طريقة الدفع *</label>
              <textarea
                value={formData.other_details}
                onChange={(e) => setFormData({ ...formData, other_details: e.target.value })}
                rows={4}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="اكتب تفاصيل طريقة الدفع المفضلة لديك..."
              />
            </div>
          )}

          {/* أزرار الحفظ والإلغاء */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium shadow-lg hover:shadow-xl"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>حفظ...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>حفظ</span>
                </>
              )}
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all disabled:opacity-50 text-sm font-medium shadow-md hover:shadow-lg"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* قائمة طرق الدفع */}
      {paymentMethods.length === 0 && !showAddForm ? (
        <div className="text-center py-8 bg-gray-800 rounded-xl border border-gray-700">
          <CreditCard className="w-12 h-12 mx-auto text-gray-600 mb-3" />
          <p className="text-sm text-gray-400 mb-4">لم تقم بإضافة أي طريقة دفع بعد</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all text-sm font-medium shadow-lg hover:shadow-xl"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة طريقة دفع</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className={`bg-gray-800 rounded-lg p-4 border ${
                method.is_primary ? 'border-blue-500' : 'border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="bg-gray-700 p-1.5 sm:p-2 rounded-lg text-gray-300 flex-shrink-0">
                    {getPaymentTypeIcon(method.payment_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-1.5 mb-1">
                      <h4 className="font-semibold text-sm text-white">
                        {getPaymentTypeName(method.payment_type)}
                      </h4>
                      {method.is_primary && (
                        <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] sm:text-xs rounded-full whitespace-nowrap">
                          الافتراضية
                        </span>
                      )}
                      {method.is_verified && (
                        <span className="px-1.5 py-0.5 bg-green-500/20 text-green-300 text-[10px] sm:text-xs rounded-full flex items-center gap-0.5 whitespace-nowrap">
                          <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          موثقة
                        </span>
                      )}
                    </div>
                    {renderPaymentDetails(method)}
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {!method.is_primary && (
                    <button
                      onClick={() => handleSetPrimary(method.id)}
                      className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                      title="تعيين كافتراضية"
                    >
                      <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(method)}
                    className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                    title="تعديل"
                  >
                    <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(method.id)}
                    className="p-1.5 sm:p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    title="حذف"
                  >
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ملاحظة */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
        <p className="text-xs text-blue-200">
          💡 <strong>ملاحظة:</strong> سيتم استخدام طريقة الدفع الافتراضية لتحويل عمولاتك. 
          تأكد من صحة المعلومات لتجنب أي تأخير في الدفع.
        </p>
      </div>
    </div>
  );
};

export default PaymentMethodSettings;
