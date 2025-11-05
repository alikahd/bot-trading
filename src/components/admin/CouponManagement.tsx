import React, { useState, useEffect } from 'react';
import { Ticket, Plus, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../config/supabaseClient';
import { useLanguage } from '../../contexts/LanguageContext';
import { Card } from '../ui/Card';

interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_uses: number | null;
  current_uses: number;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
  commission_rate?: number;
  is_referral_coupon?: boolean;
  referrer_id?: string;
  use_dynamic_rates?: boolean;
  discount_rate?: number;
  // بيانات المستخدم
  user_email?: string;
  user_username?: string;
}

export const CouponManagement: React.FC = () => {
  const { t } = useLanguage();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: '',
    max_uses: '',
    valid_until: '',
    discount_rate: '10',
    commission_rate: '10',
    use_dynamic_rates: false
  });

  useEffect(() => {
    loadCoupons();

    // ✅ إعداد Realtime للكوبونات
    console.log('🔴 إعداد Realtime لإدارة الكوبونات...');
    const couponsChannel = supabase
      .channel('coupons-management-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'coupons' },
        (payload) => {
          console.log('🔄 تغيير في الكوبونات:', payload);
          loadCoupons(); // إعادة تحميل البيانات
        }
      )
      .subscribe();

    // تنظيف عند إلغاء التحميل
    return () => {
      console.log('🧹 تنظيف Realtime للكوبونات...');
      supabase.removeChannel(couponsChannel);
    };
  }, []);

  const loadCoupons = async () => {
    try {
      console.log('🟡 [loadCoupons] بدء تحميل الكوبونات مع بيانات المستخدمين...');
      setLoading(true);
      
      // جلب الكوبونات
      const { data: couponsData, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [loadCoupons] خطأ في التحميل:', error);
        throw error;
      }
      
      // جلب بيانات المستخدمين لكوبونات الإحالة
      const couponsWithUsers = await Promise.all(
        (couponsData || []).map(async (coupon) => {
          if (coupon.is_referral_coupon && coupon.referrer_id) {
            // جلب بيانات المستخدم
            const { data: userData } = await supabase
              .from('users')
              .select('email, username')
              .eq('id', coupon.referrer_id)
              .single();
            
            return {
              ...coupon,
              user_email: userData?.email,
              user_username: userData?.username
            };
          }
          return coupon;
        })
      );
      
      console.log('✅ [loadCoupons] تم تحميل', couponsWithUsers.length, 'كوبون مع بيانات المستخدمين');
      setCoupons(couponsWithUsers);
    } catch (error) {
      console.error('❌ [loadCoupons] خطأ في تحميل الكوبونات:', error);
    } finally {
      setLoading(false);
      console.log('✅ [loadCoupons] انتهى التحميل');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('🟢 [handleSubmit] بدء حفظ الكوبون');
    console.log('🟢 [handleSubmit] بيانات النموذج:', formData);

    try {
      const couponData = {
        code: formData.code.toUpperCase(),
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
        valid_until: formData.valid_until || null,
        // تحديث كلا الحقلين بنفس القيمة
        discount_rate: parseFloat(formData.discount_value) || parseFloat(formData.discount_rate) || 10,
        commission_rate: parseFloat(formData.commission_rate) || 10,
        use_dynamic_rates: formData.use_dynamic_rates,
        is_active: true
      };

      console.log('🟢 [handleSubmit] البيانات التي سيتم حفظها:', couponData);
      console.log('🔍 [handleSubmit] تفاصيل النسب:', {
        discount_value: couponData.discount_value,
        discount_rate: couponData.discount_rate,
        commission_rate: couponData.commission_rate
      });

      if (editingCoupon) {
        console.log('🟢 [handleSubmit] تحديث كوبون موجود:', editingCoupon.id);
        
        // التحقق من session
        const { data: { session } } = await supabase.auth.getSession();
        console.log('🔐 [handleSubmit] Session:', session ? 'موجود' : 'غير موجود');
        console.log('🔐 [handleSubmit] User ID:', session?.user?.id);
        console.log('🔐 [handleSubmit] User Email:', session?.user?.email);
        
        // تحديث كوبون موجود
        const { data: updateResult, error } = await supabase
          .from('coupons')
          .update(couponData)
          .eq('id', editingCoupon.id)
          .select();

        if (error) {
          console.error('❌ [handleSubmit] خطأ في التحديث:', error);
          throw error;
        }
        
        console.log('✅ [handleSubmit] تم التحديث بنجاح');
        
        // التحقق الفوري من قاعدة البيانات
        console.log('🔍 [handleSubmit] التحقق الفوري من قاعدة البيانات...');
        const { data: verifyData, error: verifyError } = await supabase
          .from('coupons')
          .select('discount_value, discount_rate, commission_rate')
          .eq('id', editingCoupon.id)
          .single();
          
        if (verifyError) {
          console.error('❌ [handleSubmit] خطأ في التحقق:', verifyError);
        } else {
          console.log('🔍 [handleSubmit] البيانات الفعلية في قاعدة البيانات:', verifyData);
        }
        console.log('🔍 [handleSubmit] نتيجة التحديث:', updateResult);
        
        if (updateResult && updateResult.length > 0) {
          console.log('✅ [handleSubmit] البيانات المحدثة في قاعدة البيانات:', {
            discount_value: updateResult[0].discount_value,
            discount_rate: updateResult[0].discount_rate,
            commission_rate: updateResult[0].commission_rate
          });
        } else {
          console.warn('⚠️ [handleSubmit] لم يتم تحديث أي صف!');
        }
      } else {
        console.log('🟢 [handleSubmit] إنشاء كوبون جديد');
        // إنشاء كوبون جديد
        const { error } = await supabase
          .from('coupons')
          .insert([couponData]);

        if (error) {
          console.error('❌ [handleSubmit] خطأ في الإنشاء:', error);
          throw error;
        }
        console.log('✅ [handleSubmit] تم الإنشاء بنجاح');
      }

      // إعادة تحميل الكوبونات والانتظار حتى يكتمل التحميل
      console.log('🟢 [handleSubmit] إعادة تحميل الكوبونات...');
      await loadCoupons();
      console.log('✅ [handleSubmit] تم إعادة تحميل الكوبونات');
      
      // إضافة تأخير صغير للتأكد من تحديث الـ state
      console.log('🟢 [handleSubmit] انتظار 100ms...');
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // إغلاق النموذج وإعادة تعيينه
      console.log('🟢 [handleSubmit] إغلاق النافذة');
      setShowModal(false);
      setEditingCoupon(null);
      setFormData({
        code: '',
        discount_type: 'percentage',
        discount_value: '',
        max_uses: '',
        valid_until: '',
        discount_rate: '10',
        commission_rate: '10',
        use_dynamic_rates: false
      });
      console.log('✅ [handleSubmit] تم إغلاق النافذة بنجاح');
    } catch (error: any) {
      console.error('❌ [handleSubmit] خطأ في حفظ الكوبون:', error);
      alert(error.message || 'حدث خطأ أثناء حفظ الكوبون');
    }
  };

  const handleEdit = async (coupon: Coupon) => {
    console.log('🔵 [handleEdit] بدء التعديل للكوبون:', coupon.code);
    console.log('🔵 [handleEdit] البيانات من state:', {
      discount_rate: coupon.discount_rate,
      discount_value: coupon.discount_value,
      commission_rate: coupon.commission_rate,
      use_dynamic_rates: coupon.use_dynamic_rates
    });

    // جلب البيانات الحديثة من قاعدة البيانات مباشرة
    try {
      console.log('🔵 [handleEdit] جلب البيانات الحديثة من Supabase...');
      const { data: freshCoupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('id', coupon.id)
        .single();

      if (error) {
        console.error('❌ [handleEdit] خطأ في جلب البيانات:', error);
        throw error;
      }

      console.log('✅ [handleEdit] تم جلب البيانات الحديثة:', {
        discount_rate: freshCoupon?.discount_rate,
        discount_value: freshCoupon?.discount_value,
        commission_rate: freshCoupon?.commission_rate,
        use_dynamic_rates: freshCoupon?.use_dynamic_rates
      });

      const couponToEdit = freshCoupon || coupon;
      
      const formDataToSet = {
        code: couponToEdit.code,
        discount_type: couponToEdit.discount_type,
        discount_value: couponToEdit.discount_value.toString(),
        max_uses: couponToEdit.max_uses?.toString() || '',
        valid_until: couponToEdit.valid_until ? couponToEdit.valid_until.split('T')[0] : '',
        // استخدام discount_rate إذا كان موجوداً، وإلا استخدام discount_value
        discount_rate: (couponToEdit.discount_rate || couponToEdit.discount_value)?.toString() || '10',
        commission_rate: couponToEdit.commission_rate?.toString() || '10',
        use_dynamic_rates: couponToEdit.use_dynamic_rates ?? false
      };

      console.log('✅ [handleEdit] البيانات التي سيتم عرضها في النموذج:', formDataToSet);
      
      setEditingCoupon(couponToEdit);
      setFormData(formDataToSet);
      setShowModal(true);
      
      console.log('✅ [handleEdit] تم فتح النافذة بنجاح');
    } catch (error) {
      console.error('❌ [handleEdit] خطأ في معالجة التعديل:', error);
      // في حالة الخطأ، استخدم البيانات الموجودة
      console.log('⚠️ [handleEdit] استخدام البيانات من state كـ fallback');
      
      const fallbackFormData = {
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value.toString(),
        max_uses: coupon.max_uses?.toString() || '',
        valid_until: coupon.valid_until ? coupon.valid_until.split('T')[0] : '',
        discount_rate: (coupon.discount_rate || coupon.discount_value)?.toString() || '10',
        commission_rate: coupon.commission_rate?.toString() || '10',
        use_dynamic_rates: coupon.use_dynamic_rates ?? false
      };
      
      console.log('⚠️ [handleEdit] بيانات fallback:', fallbackFormData);
      
      setEditingCoupon(coupon);
      setFormData(fallbackFormData);
      setShowModal(true);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('coupon.confirmDelete') || 'هل أنت متأكد من حذف هذا الكوبون؟')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadCoupons();
    } catch (error) {
      console.error('Error deleting coupon:', error);
      alert('حدث خطأ أثناء حذف الكوبون');
    }
  };

  const toggleActive = async (coupon: Coupon) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active: !coupon.is_active })
        .eq('id', coupon.id);

      if (error) throw error;
      await loadCoupons();
    } catch (error) {
      console.error('Error toggling coupon status:', error);
    }
  };

  const isExpired = (validUntil: string | null) => {
    if (!validUntil) return false;
    return new Date(validUntil) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Ticket className="w-8 h-8 text-blue-500" />
          <div>
            <h2 className="text-2xl font-bold text-white">{t('coupon.management')}</h2>
            <p className="text-gray-400">{t('coupon.subtitle')}</p>
          </div>
        </div>
        <button
          onClick={() => {
            setEditingCoupon(null);
            setFormData({
              code: '',
              discount_type: 'percentage',
              discount_value: '',
              max_uses: '',
              valid_until: '',
              discount_rate: '10',
              commission_rate: '10',
              use_dynamic_rates: false
            });
            setShowModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          {t('coupon.addNew')}
        </button>
      </div>

      {/* إحصائيات الكوبونات */}
      <div className="grid grid-cols-4 gap-1 sm:gap-2 lg:gap-4 mb-3 sm:mb-4 lg:mb-6">
        <Card padding="sm" className="text-center py-1 sm:py-2">
          <div className="text-sm sm:text-base lg:text-2xl font-bold text-white">{coupons.length}</div>
          <div className="text-[8px] sm:text-[10px] lg:text-sm text-gray-400">إجمالي</div>
        </Card>
        <Card padding="sm" className="text-center py-1 sm:py-2">
          <div className="text-sm sm:text-base lg:text-2xl font-bold text-green-400">
            {coupons.filter(c => c.is_active && !isExpired(c.valid_until)).length}
          </div>
          <div className="text-[8px] sm:text-[10px] lg:text-sm text-gray-400">نشطة</div>
        </Card>
        <Card padding="sm" className="text-center py-1 sm:py-2">
          <div className="text-sm sm:text-base lg:text-2xl font-bold text-red-400">
            {coupons.filter(c => isExpired(c.valid_until)).length}
          </div>
          <div className="text-[8px] sm:text-[10px] lg:text-sm text-gray-400">منتهية</div>
        </Card>
        <Card padding="sm" className="text-center py-1 sm:py-2">
          <div className="text-sm sm:text-base lg:text-2xl font-bold text-blue-400">
            {coupons.reduce((sum, c) => sum + c.current_uses, 0)}
          </div>
          <div className="text-[8px] sm:text-[10px] lg:text-sm text-gray-400">استخدامات</div>
        </Card>
      </div>

      {/* قائمة الكوبونات */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        {/* رسالة توضيحية إذا كان هناك أكثر من 10 كوبونات */}
        {coupons.length > 10 && (
          <div className="bg-blue-500/10 border-b border-blue-500/20 px-4 py-2 text-center">
            <p className="text-blue-400 text-sm">
              📜 يوجد {coupons.length} كوبون - استخدم شريط التمرير لعرض الجميع
            </p>
          </div>
        )}
        {/* حاوية مع شريط تمرير - ارتفاع أقصى 600px */}
        <div className="overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar">
          <table className="w-full">
            <thead className="bg-gray-700 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  {t('coupon.code')}
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  المستخدم
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  {t('coupon.discount')}
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  نسبة العمولة
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  {t('coupon.uses')}
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  {t('coupon.validUntil')}
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  {t('coupon.status')}
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  {t('coupon.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-gray-700/50">
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <span className="font-mono font-bold text-blue-400">{coupon.code}</span>
                      {coupon.is_referral_coupon && (
                        <span className="text-xs text-purple-400">
                          🔗 كوبون إحالة
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {coupon.is_referral_coupon && coupon.user_email ? (
                      <div className="flex flex-col gap-1">
                        <span className="text-white font-medium">{coupon.user_username || 'غير متوفر'}</span>
                        <span className="text-xs text-gray-400">{coupon.user_email}</span>
                      </div>
                    ) : (
                      <span className="text-gray-500 text-sm">-</span>
                    )}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <span className="text-white">
                        {coupon.discount_type === 'percentage' 
                          ? `${coupon.discount_rate || coupon.discount_value}%` 
                          : `$${coupon.discount_value}`}
                      </span>
                      {coupon.use_dynamic_rates && (
                        <span className="text-xs text-blue-400">
                          ⚡ ديناميكي
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {coupon.is_referral_coupon && coupon.commission_rate ? (
                      <span className="text-green-400 font-medium">
                        {coupon.commission_rate}%
                      </span>
                    ) : (
                      <span className="text-gray-500 text-sm">-</span>
                    )}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-white">
                    {coupon.current_uses} / {coupon.max_uses || '∞'}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-white">
                    {coupon.valid_until 
                      ? new Date(coupon.valid_until).toLocaleDateString('ar-SA')
                      : t('coupon.noExpiry')}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {isExpired(coupon.valid_until) ? (
                      <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">
                        {t('coupon.expired')}
                      </span>
                    ) : coupon.is_active ? (
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                        {t('coupon.active')}
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs">
                        {t('coupon.inactive')}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleActive(coupon)}
                        className={`p-2 rounded-lg transition-colors ${
                          coupon.is_active 
                            ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                            : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                        }`}
                        title={coupon.is_active ? t('coupon.deactivate') : t('coupon.activate')}
                      >
                        {coupon.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => {
                          console.log('🔷 [Button Click] تم الضغط على زر التعديل للكوبون:', coupon.code);
                          console.log('🔷 [Button Click] بيانات الكوبون من الجدول:', {
                            id: coupon.id,
                            code: coupon.code,
                            discount_rate: coupon.discount_rate,
                            discount_value: coupon.discount_value,
                            commission_rate: coupon.commission_rate,
                            use_dynamic_rates: coupon.use_dynamic_rates
                          });
                          handleEdit(coupon);
                        }}
                        className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                        title={t('coupon.edit')}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(coupon.id)}
                        className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                        title={t('coupon.delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {coupons.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Ticket className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{t('coupon.noCoupons')}</p>
          </div>
        )}
      </div>

      {/* نموذج إضافة/تعديل كوبون */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-gray-800 rounded-xl p-3 sm:p-4 max-w-md w-full max-h-[85vh] overflow-y-auto">
            <h3 className="text-base sm:text-lg font-bold text-white mb-2 sm:mb-3">
              {editingCoupon ? t('coupon.editCoupon') : t('coupon.addCoupon')}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-2.5">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">
                  {t('coupon.code')}
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white"
                  placeholder="SUMMER2024"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">
                  {t('coupon.discountType')}
                </label>
                <select
                  value={formData.discount_type}
                  onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as 'percentage' | 'fixed' })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white"
                >
                  <option value="percentage">{t('coupon.percentage')}</option>
                  <option value="fixed">{t('coupon.fixedAmount')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">
                  {t('coupon.discountValue')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white"
                  placeholder={formData.discount_type === 'percentage' ? '10' : '5.00'}
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">
                  {t('coupon.maxUses')} ({t('coupon.optional')})
                </label>
                <input
                  type="number"
                  value={formData.max_uses}
                  onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white"
                  placeholder={t('coupon.unlimited')}
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">
                  {t('coupon.validUntil')} ({t('coupon.optional')})
                </label>
                <input
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">
                  نسبة الخصم (%) {t('coupon.optional')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.discount_rate}
                  onChange={(e) => setFormData({ ...formData, discount_rate: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white"
                  placeholder="10"
                />
                <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">
                  للمستخدم الجديد (افتراضي: 10%)
                </p>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">
                  نسبة العمولة (%) {t('coupon.optional')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.commission_rate}
                  onChange={(e) => setFormData({ ...formData, commission_rate: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white"
                  placeholder="10"
                />
                <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">
                  لصاحب الكوبون (افتراضي: 10%)
                </p>
              </div>

              {/* خيار النسب الديناميكية */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.use_dynamic_rates}
                    onChange={(e) => setFormData({ ...formData, use_dynamic_rates: e.target.checked })}
                    className="mt-1 w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <span className="text-xs sm:text-sm font-medium text-white">
                      استخدام النسب من إعدادات الإحالة
                    </span>
                    <p className="text-[10px] sm:text-xs text-gray-400 mt-1">
                      عند التفعيل، سيتم تجاهل النسب أعلاه واستخدام النسب الحالية من إعدادات نظام الإحالة. 
                      هذا يعني أن النسب ستتحدث تلقائياً عند تغيير الإعدادات.
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1.5 sm:py-2 rounded-lg transition-colors text-sm"
                >
                  {editingCoupon ? t('coupon.update') : t('coupon.add')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingCoupon(null);
                  }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-1.5 sm:py-2 rounded-lg transition-colors text-sm"
                >
                  {t('coupon.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
