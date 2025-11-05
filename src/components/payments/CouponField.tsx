import { useState, useImperativeHandle, forwardRef, useEffect } from 'react';
import { Ticket, Check, X, Loader } from 'lucide-react';
import { supabase } from '../../config/supabaseClient';
import { useLanguage } from '../../contexts/LanguageContext';

interface CouponFieldProps {
  originalPrice: number;
  onCouponApplied: (discount: number, couponId: string) => void;
  userId: string;
  autoApplyCoupon?: string;
}

export const CouponField = forwardRef<any, CouponFieldProps>(({
  originalPrice,
  onCouponApplied,
  userId,
  autoApplyCoupon
}, ref) => {
  const { t } = useLanguage();
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [error, setError] = useState('');

  // مزامنة فورية مع تغييرات referral_settings
  useEffect(() => {
    // الاشتراك في تغييرات إعدادات الإحالة
    const settingsChannel = supabase
      .channel('coupon_settings_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'referral_settings'
        },
        async (payload: any) => {
          console.log('🔄 تم تحديث إعدادات الإحالة في صفحة الدفع:', payload);
          
          // إذا كان هناك كوبون مطبق ويستخدم النسب الديناميكية، تحديث النسب
          if (appliedCoupon && appliedCoupon.use_dynamic_rates && payload.new) {
            const newSettings = payload.new as any;
            const updatedCoupon = {
              ...appliedCoupon,
              discount_rate: newSettings.discount_rate,
              commission_rate: newSettings.commission_rate
            };
            
            setAppliedCoupon(updatedCoupon);
            
            // إعادة حساب الخصم بالنسبة الجديدة
            let newDiscount = 0;
            if (updatedCoupon.discount_type === 'percentage') {
              const discountPercentage = updatedCoupon.discount_rate || updatedCoupon.discount_value;
              newDiscount = (originalPrice * discountPercentage) / 100;
            } else {
              newDiscount = updatedCoupon.discount_value;
            }
            newDiscount = Math.min(newDiscount, originalPrice);
            
            // تحديث الخصم
            onCouponApplied(newDiscount, updatedCoupon.id);
            
            console.log('✅ تم تحديث الكوبون المطبق بالنسب الجديدة:', {
              oldRate: appliedCoupon.discount_rate,
              newRate: newSettings.discount_rate,
              newDiscount
            });
          }
        }
      )
      .subscribe();

    return () => {
      settingsChannel.unsubscribe();
    };
  }, [appliedCoupon, originalPrice, onCouponApplied]);

  const validateAndApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setError(t('coupon.enterCode') || 'الرجاء إدخال كود الكوبون');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const searchCode = couponCode.toUpperCase().trim();
      console.log('🔍 البحث عن الكوبون:', searchCode);

      // البحث عن الكوبون (قد يكون كوبون عادي أو رمز إحالة)
      const { data: coupons, error: couponError } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', searchCode);

      console.log('📊 نتيجة البحث:', { coupons, couponError });

      if (couponError) {
        console.error('❌ خطأ في جلب الكوبون:', couponError);
        setError(t('coupon.error') || 'حدث خطأ أثناء التحقق من الكوبون');
        setLoading(false);
        return;
      }

      if (!coupons || coupons.length === 0) {
        console.warn('⚠️ لم يتم العثور على الكوبون:', searchCode);
        setError(t('coupon.invalid') || 'كود الكوبون غير صحيح');
        setLoading(false);
        return;
      }

      // استخدام أول كوبون متطابق
      let coupon = coupons[0];
      console.log('✅ تم العثور على الكوبون:', coupon);

      // إذا كان الكوبون يستخدم النسب الديناميكية، جلب النسبة الحالية من referral_settings
      if (coupon.use_dynamic_rates) {
        console.log('🔄 كوبون ديناميكي - جلب النسبة الحالية من الإعدادات...');
        const { data: settings, error: settingsError } = await supabase
          .from('referral_settings')
          .select('discount_rate, commission_rate')
          .single();

        if (!settingsError && settings) {
          console.log('✅ تم جلب الإعدادات الحالية:', settings);
          // تحديث نسبة الخصم بالنسبة الحالية من الإعدادات
          coupon = {
            ...coupon,
            discount_rate: settings.discount_rate,
            commission_rate: settings.commission_rate
          };
          console.log('🔄 تم تحديث الكوبون بالنسب الحالية:', coupon);
        } else {
          console.warn('⚠️ لم يتم العثور على الإعدادات، استخدام النسب المحفوظة');
        }
      }

      // التحقق من أن الكوبون نشط
      if (!coupon.is_active) {
        setError(t('coupon.inactive') || 'هذا الكوبون غير نشط');
        setLoading(false);
        return;
      }

      // التحقق من تاريخ الانتهاء
      if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
        setError(t('coupon.expired') || 'هذا الكوبون منتهي الصلاحية');
        setLoading(false);
        return;
      }

      // التحقق من عدد الاستخدامات
      if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
        setError(t('coupon.maxUsesReached') || 'تم الوصول للحد الأقصى لاستخدام هذا الكوبون');
        setLoading(false);
        return;
      }

      // التحقق من أن المستخدم لم يستخدم هذا الكوبون من قبل
      const { data: usage } = await supabase
        .from('coupon_usage')
        .select('*')
        .eq('coupon_id', coupon.id)
        .eq('user_id', userId)
        .single();

      if (usage) {
        setError(t('coupon.alreadyUsed') || 'لقد استخدمت هذا الكوبون من قبل');
        setLoading(false);
        return;
      }

      // حساب الخصم
      let discount = 0;
      if (coupon.discount_type === 'percentage') {
        // استخدام discount_rate إذا كان موجوداً (للكوبونات الجديدة)، وإلا استخدام discount_value
        const discountPercentage = coupon.discount_rate || coupon.discount_value;
        discount = (originalPrice * discountPercentage) / 100;
      } else {
        discount = coupon.discount_value;
      }

      // التأكد من أن الخصم لا يتجاوز السعر الأصلي
      discount = Math.min(discount, originalPrice);

      console.log('✅ تم تطبيق الكوبون:', {
        code: coupon.code,
        type: coupon.discount_type,
        rate: coupon.discount_rate || coupon.discount_value,
        discount: discount,
        originalPrice: originalPrice,
        finalPrice: originalPrice - discount
      });

      // تطبيق الكوبون
      setAppliedCoupon(coupon);
      onCouponApplied(discount, coupon.id);

    } catch (error) {
      console.error('Error validating coupon:', error);
      setError(t('coupon.error') || 'حدث خطأ أثناء التحقق من الكوبون');
    } finally {
      setLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setError('');
    onCouponApplied(0, '');
  };

  // تطبيق الكوبون تلقائياً عند التحميل
  useEffect(() => {
    if (autoApplyCoupon && !appliedCoupon && !loading) {
      console.log('🎁 تطبيق كوبون تلقائي من رابط الإحالة:', autoApplyCoupon);
      setCouponCode(autoApplyCoupon);
      // تطبيق الكوبون بعد تأخير قصير
      const timer = setTimeout(() => {
        validateAndApplyCoupon();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [autoApplyCoupon, appliedCoupon, loading]);

  // إتاحة دالة التطبيق التلقائي للمكون الأب
  useImperativeHandle(ref, () => ({
    applyCouponAutomatically: (code: string) => {
      console.log('🎯 تطبيق كوبون من المكون الأب:', code);
      setCouponCode(code);
      setTimeout(() => {
        validateAndApplyCoupon();
      }, 500);
    }
  }));

  if (appliedCoupon) {
    return (
      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-green-400 font-bold">{t('coupon.applied')}</p>
              <p className="text-sm text-gray-300">
                {t('coupon.code')}: <span className="font-mono font-bold">{appliedCoupon.code}</span>
              </p>
              <p className="text-sm text-gray-300">
                {t('coupon.discount')}: {appliedCoupon.discount_type === 'percentage' 
                  ? `${appliedCoupon.discount_rate || appliedCoupon.discount_value}%` 
                  : `$${appliedCoupon.discount_value}`}
              </p>
            </div>
          </div>
          <button
            onClick={removeCoupon}
            className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs sm:text-sm font-medium text-gray-300">
        {t('coupon.haveCode')}
      </label>
      <div className="flex gap-1.5 sm:gap-2">
        <div className="flex-1 relative">
          <Ticket className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
          <input
            type="text"
            value={couponCode}
            onChange={(e) => {
              setCouponCode(e.target.value.toUpperCase());
              setError('');
            }}
            placeholder={t('coupon.enterCode') || 'كود الكوبون'}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 pr-8 sm:pr-9 text-xs sm:text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            disabled={loading}
          />
        </div>
        <button
          onClick={validateAndApplyCoupon}
          disabled={loading || !couponCode.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm whitespace-nowrap"
        >
          {loading ? (
            <>
              <Loader className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
              <span className="hidden sm:inline">{t('coupon.checking')}</span>
            </>
          ) : (
            t('coupon.apply')
          )}
        </button>
      </div>
      {error && (
        <p className="text-red-400 text-xs sm:text-sm flex items-center gap-1">
          <X className="w-3 h-3 sm:w-4 sm:h-4" />
          {error}
        </p>
      )}
    </div>
  );
});

CouponField.displayName = 'CouponField';
