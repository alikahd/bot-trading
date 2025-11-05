import React, { useState, useEffect } from 'react';
import { Share2, Copy, Users, Gift, CheckCircle, Clock, Award, X, Mail, MessageCircle, Send, Facebook, Twitter, DollarSign, Edit2, Save, Info, ChevronDown, ChevronUp, Settings, Calendar, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../config/supabaseClient';
import { useLanguage } from '../../contexts/LanguageContext';
import PaymentMethodSettings from './PaymentMethodSettings';

interface Referral {
  id: string;
  referred_email: string;
  status: 'pending' | 'completed' | 'rewarded';
  reward_amount: number;
  created_at: string;
  completed_at: string | null;
}

interface ReferralPanelProps {
  userId: string;
}

export const ReferralPanel: React.FC<ReferralPanelProps> = ({ userId }) => {
  const { t, language } = useLanguage();
  const [referralCode, setReferralCode] = useState<string>('');
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [newReferralCode, setNewReferralCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [codeSaving, setCodeSaving] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    totalRewards: 0,
    pendingCommissions: 0
  });
  const [systemSettings, setSystemSettings] = useState({
    discountRate: 10,
    commissionRate: 10,
    isActive: true
  });
  const [showPaymentSettings, setShowPaymentSettings] = useState(false);
  const [showMonthlyStatement, setShowMonthlyStatement] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [monthlyCommissions, setMonthlyCommissions] = useState<any[]>([]);
  const [loadingStatement, setLoadingStatement] = useState(false);
  const [availableMonths, setAvailableMonths] = useState<{month: string, count: number, total: number}[]>([]);

  useEffect(() => {
    loadReferralData();
  }, [userId]);

  // مزامنة فورية مع قاعدة البيانات باستخدام Supabase Realtime
  useEffect(() => {
    // الاشتراك في تغييرات جدول referral_settings
    const settingsChannel = supabase
      .channel('referral_settings_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // جميع الأحداث (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'referral_settings'
        },
        (payload: any) => {
          console.log('🔄 تم تحديث إعدادات الإحالة:', payload);
          // تحديث الإعدادات فوراً
          if (payload.new) {
            setSystemSettings({
              discountRate: (payload.new as any).discount_rate || 10,
              commissionRate: (payload.new as any).commission_rate || 10,
              isActive: (payload.new as any).is_active !== false
            });
          }
        }
      )
      .subscribe();

    // الاشتراك في تغييرات جدول referrals
    const referralsChannel = supabase
      .channel('referrals_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'referrals',
          filter: `referrer_id=eq.${userId}`
        },
        (payload) => {
          console.log('🔄 تم تحديث الإحالات:', payload);
          // إعادة تحميل البيانات عند أي تغيير
          loadReferralData();
        }
      )
      .subscribe();

    // الاشتراك في تغييرات جدول pending_commissions
    const commissionsChannel = supabase
      .channel('commissions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pending_commissions',
          filter: `referrer_id=eq.${userId}`
        },
        (payload) => {
          console.log('🔄 تم تحديث العمولات:', payload);
          // إعادة تحميل البيانات عند أي تغيير
          loadReferralData();
        }
      )
      .subscribe();

    // تنظيف الاشتراكات عند إلغاء تحميل المكون
    return () => {
      settingsChannel.unsubscribe();
      referralsChannel.unsubscribe();
      commissionsChannel.unsubscribe();
    };
  }, [userId]);

  const loadReferralData = async () => {
    try {
      setLoading(true);
      const startTime = performance.now();

      // ⚡ تنفيذ جميع الاستعلامات بشكل متوازي (Parallel) بدلاً من متتالي
      const [
        userResult,
        referralsResult,
        commissionsResult,
        settingsResult
      ] = await Promise.all([
        // 1. جلب كود الإحالة
        supabase
          .from('users')
          .select('referral_code')
          .eq('id', userId)
          .single(),
        
        // 2. جلب الإحالات
        supabase
          .from('referrals')
          .select('*')
          .eq('referrer_id', userId)
          .order('created_at', { ascending: false }),
        
        // 3. جلب العمولات المستحقة
        supabase
          .from('pending_commissions')
          .select('commission_amount, status')
          .eq('referrer_id', userId)
          .eq('status', 'pending'),
        
        // 4. جلب إعدادات النظام
        supabase
          .from('referral_settings')
          .select('discount_rate, commission_rate, is_active')
          .single()
      ]);

      // معالجة النتائج
      if (userResult.error) throw userResult.error;
      setReferralCode(userResult.data.referral_code || '');

      if (referralsResult.error) throw referralsResult.error;
      const referralsData = referralsResult.data || [];
      setReferrals(referralsData);

      // حساب العمولات المستحقة
      const pendingCommissions = commissionsResult.data?.reduce(
        (sum, c) => sum + (c.commission_amount || 0), 
        0
      ) || 0;

      // تحديث إعدادات النظام
      if (settingsResult.data) {
        setSystemSettings({
          discountRate: settingsResult.data.discount_rate || 10,
          commissionRate: settingsResult.data.commission_rate || 10,
          isActive: settingsResult.data.is_active !== false
        });
      }

      // حساب الإحصائيات
      const total = referralsData.length;
      const completed = referralsData.filter(r => r.status === 'completed' || r.status === 'rewarded').length;
      const pending = referralsData.filter(r => r.status === 'pending').length;
      const totalRewards = referralsData.reduce((sum, r) => sum + (r.reward_amount || 0), 0);

      setStats({ total, completed, pending, totalRewards, pendingCommissions });

      // قياس الأداء
      const endTime = performance.now();
      console.log(`⚡ تم تحميل بيانات الإحالة في ${(endTime - startTime).toFixed(0)}ms`);
    } catch (error) {
      console.error('❌ خطأ في تحميل بيانات الإحالة:', error);
    } finally {
      setLoading(false);
    }
  };

  const getReferralLink = () => {
    return `${window.location.origin}/register?ref=${referralCode}`;
  };

  // دالة لتنسيق التاريخ بالترجمة مع الأرقام اللاتينية
  const formatDate = (date: Date, format: 'long' | 'short' = 'long') => {
    const locale = language === 'ar' ? 'ar-SA' : language === 'fr' ? 'fr-FR' : 'en-US';
    const options: Intl.DateTimeFormatOptions = format === 'long' 
      ? { year: 'numeric', month: 'long', day: 'numeric' }
      : { year: 'numeric', month: 'short' };
    
    // تنسيق التاريخ باللغة المطلوبة
    let formatted = date.toLocaleDateString(locale, options);
    
    // تحويل الأرقام العربية إلى لاتينية إذا كانت اللغة عربية
    if (language === 'ar') {
      formatted = formatted.replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
    }
    
    return formatted;
  };

  // جلب الأشهر المتاحة التي فيها عمولات مدفوعة
  const loadAvailableMonths = async () => {
    try {
      const { data: paidCommissions, error } = await supabase
        .from('pending_commissions')
        .select('paid_at, commission_amount')
        .eq('referrer_id', userId)
        .eq('status', 'paid')
        .not('paid_at', 'is', null)
        .order('paid_at', { ascending: false });
      
      if (error) throw error;
      
      // تجميع العمولات حسب الشهر
      const monthsMap = new Map<string, {count: number, total: number}>();
      
      paidCommissions?.forEach(commission => {
        const date = new Date(commission.paid_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthsMap.has(monthKey)) {
          monthsMap.set(monthKey, { count: 0, total: 0 });
        }
        
        const monthData = monthsMap.get(monthKey)!;
        monthData.count++;
        monthData.total += commission.commission_amount;
      });
      
      // تحويل إلى مصفوفة
      const months = Array.from(monthsMap.entries()).map(([month, data]) => ({
        month,
        count: data.count,
        total: data.total
      }));
      
      setAvailableMonths(months);
      console.log('✅ تم جلب الأشهر المتاحة:', months.length);
      
    } catch (error) {
      console.error('❌ خطأ في جلب الأشهر المتاحة:', error);
    }
  };

  // جلب الكشف الشهري للعمولات
  const loadMonthlyStatement = async (date: Date) => {
    try {
      setLoadingStatement(true);
      
      // تحديد بداية ونهاية الشهر
      const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
      
      console.log('📅 جلب كشف شهري:', { 
        month: date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long' }),
        startDate, 
        endDate 
      });
      
      // جلب العمولات المدفوعة في هذا الشهر
      const { data: paidCommissions, error: paidError } = await supabase
        .from('pending_commissions')
        .select(`
          *,
          referral:referrals(referred_email, subscription_amount)
        `)
        .eq('referrer_id', userId)
        .eq('status', 'paid')
        .gte('paid_at', startDate.toISOString())
        .lte('paid_at', endDate.toISOString())
        .order('paid_at', { ascending: false });
      
      if (paidError) throw paidError;
      
      setMonthlyCommissions(paidCommissions || []);
      console.log('✅ تم جلب الكشف الشهري:', paidCommissions?.length || 0, 'عمولة');
      
    } catch (error) {
      console.error('❌ خطأ في جلب الكشف الشهري:', error);
    } finally {
      setLoadingStatement(false);
    }
  };

  // التنقل بين الأشهر
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedMonth);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setSelectedMonth(newDate);
    loadMonthlyStatement(newDate);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getReferralLink());
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const shareReferralLink = async () => {
    const link = getReferralLink();
    const text = t('referral.shareText') || `انضم إلى منصة التداول باستخدام رابط الإحالة الخاص بي!`;
    const fullMessage = `${text}\n\n${link}`;

    // استخدام Web Share API للهواتف
    if (navigator.share) {
      try {
        await navigator.share({
          title: t('referral.shareTitle') || 'رابط الإحالة',
          text: fullMessage
        });
      } catch (error) {
        // إذا ألغى المستخدم، لا نفعل شيء
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
          // في حالة الخطأ، نعرض القائمة المخصصة
          setShowShareMenu(true);
        }
      }
    } else {
      // للأجهزة التي لا تدعم Web Share API، نعرض القائمة المخصصة
      setShowShareMenu(true);
    }
  };

  const handleShare = (platform: string) => {
    const link = getReferralLink();
    const text = t('referral.shareText') || `انضم إلى منصة التداول باستخدام رابط الإحالة الخاص بي!`;
    const fullMessage = `${text}\n\n${link}`;
    const encodedText = encodeURIComponent(fullMessage);
    const encodedLink = encodeURIComponent(link);

    const shareUrls: { [key: string]: string } = {
      whatsapp: `https://wa.me/?text=${encodedText}`,
      telegram: `https://t.me/share/url?url=${encodedLink}&text=${encodeURIComponent(text)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedLink}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}`,
      email: `mailto:?subject=${encodeURIComponent(t('referral.shareTitle') || 'رابط الإحالة')}&body=${encodedText}`
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
      setShowShareMenu(false);
    }
  };

  const checkCodeAvailability = async (code: string): Promise<boolean> => {
    if (!code || code.length < 3) {
      setCodeError('يجب أن يكون الرمز 3 أحرف على الأقل');
      return false;
    }

    // التحقق من الصيغة (أحرف وأرقام وشرطة وشرطة سفلية فقط)
    if (!/^[A-Za-z0-9_-]+$/.test(code)) {
      setCodeError('يمكن استخدام الأحرف والأرقام والشرطة (-) والشرطة السفلية (_) فقط');
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('referral_code', code)
        .neq('id', userId);

      if (error) throw error;

      if (data && data.length > 0) {
        setCodeError('هذا الرمز مستخدم بالفعل، اختر رمزاً آخر');
        return false;
      }

      setCodeError('');
      return true;
    } catch (error) {
      console.error('Error checking code availability:', error);
      setCodeError('حدث خطأ أثناء التحقق من الرمز');
      return false;
    }
  };

  const handleSaveReferralCode = async () => {
    if (!newReferralCode.trim()) {
      setCodeError('الرجاء إدخال رمز الإحالة');
      return;
    }

    setCodeSaving(true);
    setCodeError('');

    const isAvailable = await checkCodeAvailability(newReferralCode.trim());
    
    if (!isAvailable) {
      setCodeSaving(false);
      return;
    }

    try {
      const trimmedCode = newReferralCode.trim().toUpperCase();

      // 1. تحديث رمز الإحالة في جدول المستخدمين
      const { error: userError } = await supabase
        .from('users')
        .update({ referral_code: trimmedCode })
        .eq('id', userId);

      if (userError) {
        console.error('Error updating user referral code:', userError);
        throw new Error('فشل تحديث رمز الإحالة');
      }

      // 2. التحقق من وجود كوبون بنفس الرمز
      const { data: existingCoupon, error: checkError } = await supabase
        .from('coupons')
        .select('id')
        .eq('code', trimmedCode)
        .maybeSingle();
      
      console.log('🔍 التحقق من وجود الكوبون:', { trimmedCode, existingCoupon, checkError });

      // 3. جلب الإعدادات الحالية من referral_settings
      const { data: settings } = await supabase
        .from('referral_settings')
        .select('discount_rate, commission_rate, is_active')
        .single();

      const discountRate = settings?.discount_rate || 10;
      const commissionRate = settings?.commission_rate || 10;
      const systemActive = settings?.is_active !== false;

      console.log('⚙️ إعدادات النظام:', { discountRate, commissionRate, systemActive });

      if (!systemActive) {
        throw new Error('نظام الإحالة معطل حالياً');
      }

      // 4. إنشاء كوبون جديد فقط إذا لم يكن موجوداً
      if (!existingCoupon) {
        console.log('📝 إنشاء كوبون جديد بالرمز:', trimmedCode);
        
        const { data: newCoupon, error: couponError } = await supabase
          .from('coupons')
          .insert({
            code: trimmedCode,
            discount_type: 'percentage',
            discount_value: discountRate,
            discount_rate: discountRate,
            is_active: true,
            is_referral_coupon: true,
            referrer_id: userId,
            commission_rate: commissionRate,
            use_dynamic_rates: true  // كوبونات الإحالة تستخدم النسب الديناميكية دائماً
          })
          .select()
          .single();

        if (couponError) {
          console.error('❌ خطأ في إنشاء الكوبون:', couponError);
          // لا نفشل العملية بالكامل إذا فشل إنشاء الكوبون
          console.warn('⚠️ تم تحديث رمز الإحالة ولكن فشل إنشاء الكوبون');
        } else {
          console.log('✅ تم إنشاء الكوبون بنجاح:', newCoupon);
        }
      } else {
        console.log('ℹ️ الكوبون موجود بالفعل:', existingCoupon);
      }

      setReferralCode(trimmedCode);
      setIsEditingCode(false);
      setNewReferralCode('');
      
      console.log('✅ تم تحديث رمز الإحالة بنجاح:', trimmedCode);
    } catch (error) {
      console.error('Error saving referral code:', error);
      setCodeError(error instanceof Error ? error.message : 'حدث خطأ أثناء حفظ الرمز');
    } finally {
      setCodeSaving(false);
    }
  };

  const handleEditCode = () => {
    setNewReferralCode(referralCode);
    setIsEditingCode(true);
    setCodeError('');
  };

  const handleCancelEdit = () => {
    setIsEditingCode(false);
    setNewReferralCode('');
    setCodeError('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'rewarded':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
            <CheckCircle className="w-3 h-3" />
            {t('referral.completed')}
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">
            <Clock className="w-3 h-3" />
            {t('referral.pending')}
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-3">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200"></div>
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent absolute top-0 left-0"></div>
        </div>
        <p className="text-sm text-gray-400 animate-pulse">جاري تحميل بيانات الإحالة...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-16 sm:pb-4 px-2 sm:px-3 w-full mx-auto">
      {/* إعلان جذاب للأرباح المحتملة */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-xl p-0.5 shadow-lg animate-gradient">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-[10px] p-3 sm:p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-gray-300 leading-tight">راتبك الشهري قد يصل إلى</p>
                <p className="text-lg sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 leading-tight">
                  +$5,000
                </p>
              </div>
            </div>
            <div className="flex-shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full">
              <p className="text-xs sm:text-sm font-bold text-white whitespace-nowrap">🚀 ابدأ الآن</p>
            </div>
          </div>
        </div>
      </div>

      {/* رأس الصفحة */}
      <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl p-4 sm:p-5 text-white shadow-md border border-slate-600/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-white/20 p-2 sm:p-2.5 rounded-lg">
            <Gift className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg sm:text-2xl font-bold">{t('referral.title')}</h2>
            <p className="text-sm sm:text-base text-slate-300">{t('referral.subtitle')}</p>
          </div>
        </div>

        {/* قسم التوجيهات المختصر */}
        <div className="mt-3 bg-slate-700/40 backdrop-blur-sm border border-slate-600/30 rounded-lg overflow-hidden">
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="w-full flex items-center justify-between p-2 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-white" />
              <span className="text-xs sm:text-sm font-medium text-white">كيف يعمل نظام الإحالة؟</span>
            </div>
            {showInstructions ? (
              <ChevronUp className="w-4 h-4 text-white" />
            ) : (
              <ChevronDown className="w-4 h-4 text-white" />
            )}
          </button>
          
          {showInstructions && (
            <div className="px-3 pb-3 space-y-2 text-xs sm:text-sm">
              <div className="flex items-start gap-2 bg-slate-700/30 p-2 rounded-lg">
                <span className="text-lg">💰</span>
                <p className="text-white flex-1">
                  <span className="font-bold text-green-300">عمولة عن كل إحالة:</span> احصل على {systemSettings.commissionRate}% عمولة من كل اشتراك يتم عبر رابطك أو كوبونك
                </p>
              </div>
              
              <div className="flex items-start gap-2 bg-slate-700/30 p-2 rounded-lg">
                <span className="text-lg">📅</span>
                <p className="text-white flex-1">
                  <span className="font-bold text-blue-300">الدفع الشهري:</span> يتم جمع العمولات ودفعها في <span className="font-bold">1 من كل شهر</span>
                </p>
              </div>
              
              <div className="flex items-start gap-2 bg-slate-700/30 p-2 rounded-lg">
                <span className="text-lg">💳</span>
                <p className="text-white flex-1">
                  <span className="font-bold text-purple-300">طرق الدفع:</span> PayPal، تحويل بنكي، أو Western Union
                </p>
              </div>
              
              <div className="flex items-start gap-2 bg-slate-700/30 p-2 rounded-lg">
                <span className="text-lg">🎁</span>
                <p className="text-white flex-1">
                  <span className="font-bold text-yellow-300">خصم للمستخدم الجديد:</span> يحصل على {systemSettings.discountRate}% خصم عند استخدام رابطك أو كوبونك
                </p>
              </div>
              
              <div className="flex items-start gap-2 bg-slate-700/30 p-2 rounded-lg">
                <span className="text-lg">📈</span>
                <p className="text-white flex-1">
                  <span className="font-bold text-orange-300">كلما زادت الإحالات:</span> كلما زادت عمولاتك الشهرية!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* رابط الإحالة */}
        <div className="bg-slate-700/40 backdrop-blur-sm rounded-lg p-3 mt-4 border border-slate-600/30">
          <label className="text-sm font-medium text-white mb-1.5 block">{t('referral.yourLink')}</label>
          <div className="flex items-center gap-2 bg-slate-800/50 rounded p-1.5 border border-slate-600/30">
            <input
              type="text"
              value={getReferralLink()}
              readOnly
              className="flex-1 bg-transparent text-white text-sm outline-none min-w-0 py-1 px-2"
            />
            <button
              onClick={copyToClipboard}
              className={`group relative p-2 rounded-lg transition-all duration-300 flex-shrink-0 ${
                copiedLink 
                  ? 'bg-emerald-500/15 text-emerald-300 shadow-md shadow-emerald-500/10' 
                  : 'bg-gradient-to-br from-slate-600/30 to-slate-700/30 hover:from-slate-500/40 hover:to-slate-600/40 text-slate-200 hover:text-white hover:shadow-md hover:shadow-slate-500/10'
              } hover:scale-105 active:scale-95`}
              title={copiedLink ? 'تم النسخ!' : 'نسخ'}
            >
              {copiedLink ? (
                <CheckCircle className="w-4 h-4 animate-pulse" />
              ) : (
                <Copy className="w-4 h-4 group-hover:rotate-6 transition-transform duration-300" />
              )}
            </button>
          </div>
          {/* زر المشاركة */}
          <div className="mt-2">
            <button
              onClick={shareReferralLink}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-600/40 hover:bg-slate-500/50 text-slate-200 hover:text-white rounded transition-all duration-200 hover:scale-[1.02] text-sm font-medium"
            >
              <Share2 className="w-4 h-4" />
              <span>مشاركة</span>
            </button>
          </div>
        </div>

        {/* كود الإحالة */}
        <div className="mt-3">
          <p className="text-sm font-medium text-white text-center mb-1.5">{t('referral.yourCode')}</p>
          
          {!isEditingCode ? (
            // عرض الكود الحالي
            <div className="text-center">
              <div className="bg-slate-700/40 backdrop-blur-sm rounded p-2.5 border border-slate-600/30">
                <div className="flex items-center justify-center gap-2">
                  <div className="flex-1 text-center">
                    <p className="text-base sm:text-lg font-bold tracking-wider text-white">
                      {referralCode || 'لم يتم تعيين رمز'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {referralCode && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(referralCode);
                          setCopiedCode(true);
                          setTimeout(() => setCopiedCode(false), 2000);
                        }}
                        className={`group relative p-2 rounded-lg transition-all duration-300 ${
                          copiedCode 
                            ? 'bg-emerald-500/15 text-emerald-300 shadow-md shadow-emerald-500/10' 
                            : 'bg-gradient-to-br from-slate-600/30 to-slate-700/30 hover:from-slate-500/40 hover:to-slate-600/40 text-slate-200 hover:text-white hover:shadow-md hover:shadow-slate-500/10'
                        } hover:scale-105 active:scale-95`}
                        title="نسخ"
                      >
                        {copiedCode ? (
                          <CheckCircle className="w-4 h-4 animate-pulse" />
                        ) : (
                          <Copy className="w-4 h-4 group-hover:rotate-6 transition-transform duration-300" />
                        )}
                      </button>
                    )}
                    <button
                      onClick={handleEditCode}
                      className="group relative p-2 bg-gradient-to-br from-slate-600/30 to-slate-700/30 hover:from-slate-500/40 hover:to-slate-600/40 text-slate-200 hover:text-white rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-md hover:shadow-slate-500/10 active:scale-95"
                      title={referralCode ? "تعديل" : "إنشاء"}
                    >
                      <Edit2 className="w-3.5 h-3.5 group-hover:rotate-6 transition-transform duration-300" />
                    </button>
                  </div>
                </div>
              </div>
              {referralCode && (
                <div className="mt-1 space-y-0.5">
                  <p className="text-xs text-white/90">
                    {t('referral.couponUsage')}
                  </p>
                  <div className="flex items-center justify-center gap-1 text-xs">
                    <div className="bg-slate-700/40 px-1.5 py-0.5 rounded text-xs border border-slate-600/20">
                      <span className="text-white/70">خصم: </span>
                      <span className="font-bold text-white">{systemSettings.discountRate}%</span>
                    </div>
                    <div className="bg-slate-700/40 px-1.5 py-0.5 rounded text-xs border border-slate-600/20">
                      <span className="text-white/70">عمولتك: </span>
                      <span className="font-bold text-white">{systemSettings.commissionRate}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // نموذج تعديل الكود
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-3">
                    {referralCode ? 'تعديل رمز الإحالة' : 'إنشاء رمز إحالة جديد'}
                  </label>
                  <input
                    type="text"
                    value={newReferralCode}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '');
                      setNewReferralCode(value);
                      setCodeError('');
                    }}
                    placeholder="مثال: MYCODE123"
                    className="w-full bg-white/20 border border-white/30 rounded-xl px-4 py-3 text-white text-center text-lg font-bold tracking-wider placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/50"
                    maxLength={20}
                  />
                  <p className="text-xs text-white/80 mt-2 text-center">
                    يمكن استخدام الأحرف والأرقام والشرطة (-) والشرطة السفلية (_)
                  </p>
                </div>

                {codeError && (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3">
                    <p className="text-sm text-red-200 text-center">{codeError}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleSaveReferralCode}
                    disabled={codeSaving || !newReferralCode.trim()}
                    className="flex-1 bg-white text-indigo-600 px-4 py-3 rounded-xl hover:bg-white/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {codeSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                        <span>جاري الحفظ...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        <span>حفظ</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={codeSaving}
                    className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl transition-colors disabled:opacity-50 font-medium text-white"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* العمولات المستحقة */}
      {stats.pendingCommissions > 0 && (
        <div className="bg-gradient-to-br from-emerald-700/80 to-teal-700/80 rounded-xl p-3 sm:p-4 text-white shadow-md border border-emerald-600/30">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-emerald-600/30 p-1.5 rounded-lg">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-base sm:text-lg font-bold">عمولاتك المستحقة</h3>
              <p className="text-xs sm:text-sm text-emerald-100">سيتم دفعها في 1 من كل شهر</p>
            </div>
          </div>
          <div className="text-center mt-3 bg-emerald-800/30 rounded-lg p-3 border border-emerald-600/20">
            <p className="text-2xl sm:text-3xl font-bold">${stats.pendingCommissions.toFixed(2)}</p>
            <p className="text-xs sm:text-sm text-emerald-100 mt-1">في انتظار الدفع</p>
          </div>
        </div>
      )}

      {/* الإحصائيات */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-3 shadow-md">
          <div className="flex items-center gap-1.5 text-gray-400 mb-1.5">
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="text-xs font-medium">{t('referral.totalReferrals')}</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-white">{stats.total}</p>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-3 shadow-md">
          <div className="flex items-center gap-1.5 text-green-400 mb-1.5">
            <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="text-xs font-medium">{t('referral.completed')}</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-white">{stats.completed}</p>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-3 shadow-md">
          <div className="flex items-center gap-1.5 text-yellow-400 mb-1.5">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="text-xs font-medium">{t('referral.pending')}</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-white">{stats.pending}</p>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-3 shadow-md">
          <div className="flex items-center gap-1.5 text-purple-400 mb-1.5">
            <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="text-xs font-medium">{t('referral.totalRewards')}</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-white">${stats.totalRewards.toFixed(2)}</p>
        </div>
      </div>

      {/* قائمة الإحالات */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-3 sm:p-4 shadow-lg">
        <h3 className="text-base sm:text-lg font-bold text-white mb-3">{t('referral.referralsList')}</h3>

        {referrals.length === 0 ? (
          <div className="text-center py-6 sm:py-8 text-gray-400">
            <div className="bg-gray-700/50 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 opacity-50" />
            </div>
            <p className="text-sm font-medium">{t('referral.noReferrals')}</p>
            <p className="text-xs mt-1.5 text-gray-500">{t('referral.shareToStart')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {referrals.map((referral) => (
              <div
                key={referral.id}
                className="bg-gray-700/30 hover:bg-gray-700/50 rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base text-white font-medium truncate">
                    {referral.referred_email || t('referral.pendingUser')}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">
                    {new Date(referral.created_at).toLocaleDateString('ar-SA')}
                  </p>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  {referral.reward_amount > 0 && (
                    <span className="text-sm sm:text-base text-green-400 font-bold">
                      +${referral.reward_amount}
                    </span>
                  )}
                  {getStatusBadge(referral.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* معلومات إضافية */}
      <div className="bg-slate-700/40 backdrop-blur-sm border border-slate-600/30 rounded-lg p-3 sm:p-4">
        <h4 className="text-sm sm:text-base text-slate-200 font-bold mb-2 flex items-center gap-1.5">
          <Info className="w-4 h-4" />
          {t('referral.howItWorks')}
        </h4>
        <ul className="space-y-2 text-gray-300 text-xs sm:text-sm">
          <li className="flex items-start gap-1.5">
            <span className="text-slate-300 font-bold mt-0.5">1.</span>
            <span>{t('referral.step1')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-slate-300 font-bold mt-0.5">2.</span>
            <span>{t('referral.step2')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-slate-300 font-bold mt-0.5">3.</span>
            <span>{t('referral.step3')}</span>
          </li>
        </ul>
      </div>

      {/* إعدادات طرق الدفع */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-3 sm:p-4 shadow-lg border border-gray-700">
        <button
          onClick={() => setShowPaymentSettings(!showPaymentSettings)}
          className="w-full flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="bg-blue-600/20 p-1.5 rounded-lg">
              <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
            </div>
            <div className="text-right">
              <h3 className="text-base sm:text-lg font-bold text-white">إعدادات استلام العمولات</h3>
              <p className="text-xs sm:text-sm text-gray-400">حدد طريقة استلام عمولاتك</p>
            </div>
          </div>
          {showPaymentSettings ? (
            <ChevronUp className="w-5 h-5 text-white" />
          ) : (
            <ChevronDown className="w-5 h-5 text-white" />
          )}
        </button>

        {showPaymentSettings && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <PaymentMethodSettings userId={userId} />
          </div>
        )}
      </div>

      {/* زر الكشف الشهري */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-gray-700">
        <button
          onClick={() => {
            setShowMonthlyStatement(!showMonthlyStatement);
            if (!showMonthlyStatement) {
              loadAvailableMonths();
              loadMonthlyStatement(selectedMonth);
            }
          }}
          className="w-full flex items-center justify-between hover:bg-gray-700/50 rounded-lg p-2 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-right">
              <h3 className="text-sm sm:text-base font-bold text-white">الكشف الشهري</h3>
              <p className="text-xs sm:text-sm text-gray-400">عرض العمولات المدفوعة حسب الشهر</p>
            </div>
          </div>
          {showMonthlyStatement ? (
            <ChevronUp className="w-5 h-5 text-white" />
          ) : (
            <ChevronDown className="w-5 h-5 text-white" />
          )}
        </button>

        {showMonthlyStatement && (
          <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-700 space-y-2 sm:space-y-3">
            {/* التنقل بين الأشهر - كتقويم */}
            <div className="bg-gray-700/50 rounded-lg p-1.5 sm:p-3">
              <div className="flex items-center justify-between mb-1.5 sm:mb-3">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-1 sm:p-2 hover:bg-gray-600 rounded-lg transition-colors active:scale-95"
                  title="الشهر السابق"
                >
                  <ChevronRight className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
                </button>
                
                <div className="flex items-center gap-1 sm:gap-2">
                  <Calendar className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-purple-400" />
                  <h4 className="text-xs sm:text-base font-bold text-white whitespace-nowrap">
                    {formatDate(selectedMonth, 'long').replace(/\d+,?\s*/, '')}
                  </h4>
                </div>
                
                <button
                  onClick={() => navigateMonth('next')}
                  disabled={selectedMonth >= new Date()}
                  className="p-1 sm:p-2 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                  title="الشهر التالي"
                >
                  <ChevronLeft className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
                </button>
              </div>

              {/* عرض الأشهر المتاحة */}
              {availableMonths.length > 0 && (
                <div className="flex flex-wrap gap-1 sm:gap-2 pt-1.5 sm:pt-3 border-t border-gray-600">
                  <span className="text-[9px] sm:text-xs text-gray-400 w-full mb-0 sm:mb-1">الأشهر المتاحة:</span>
                  {availableMonths.map((monthData) => {
                    const [year, month] = monthData.month.split('-');
                    const monthDate = new Date(parseInt(year), parseInt(month) - 1);
                    const isSelected = monthDate.getMonth() === selectedMonth.getMonth() && 
                                      monthDate.getFullYear() === selectedMonth.getFullYear();
                    
                    return (
                      <button
                        key={monthData.month}
                        onClick={() => {
                          setSelectedMonth(monthDate);
                          loadMonthlyStatement(monthDate);
                        }}
                        className={`px-1.5 sm:px-3 py-0.5 sm:py-1.5 rounded text-[9px] sm:text-xs font-medium transition-all active:scale-95 ${
                          isSelected
                            ? 'bg-purple-500 text-white shadow-lg'
                            : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                        }`}
                      >
                        {formatDate(monthDate, 'short')}
                        <span className="ml-0.5 sm:ml-1 text-[8px] sm:text-[10px]">({monthData.count})</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* قائمة العمولات */}
            {loadingStatement ? (
              <div className="flex items-center justify-center py-6 sm:py-8">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-purple-500"></div>
              </div>
            ) : monthlyCommissions.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between text-[10px] sm:text-sm text-gray-400 pb-1.5 sm:pb-2 border-b border-gray-700 px-1">
                  <span>التاريخ</span>
                  <span>المبلغ</span>
                </div>
                {monthlyCommissions.map((commission) => (
                  <div key={commission.id} className="flex items-center justify-between bg-gray-700/50 rounded-lg p-2 sm:p-3 hover:bg-gray-700/70 transition-colors">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-xs sm:text-sm text-white font-medium truncate">
                        {commission.referral?.referred_email || 'غير محدد'}
                      </p>
                      <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">
                        {formatDate(new Date(commission.paid_at), 'long')}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs sm:text-sm font-bold text-green-400">
                        +${commission.commission_amount.toFixed(2)}
                      </p>
                      <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">
                        {commission.commission_rate}%
                      </p>
                    </div>
                  </div>
                ))}
                
                {/* المجموع */}
                <div className="flex items-center justify-between bg-purple-500/10 border border-purple-500/30 rounded-lg p-2.5 sm:p-3 mt-3 sm:mt-4">
                  <span className="text-xs sm:text-sm font-semibold text-white">المجموع:</span>
                  <span className="text-base sm:text-lg font-bold text-purple-400">
                    ${monthlyCommissions.reduce((sum, c) => sum + c.commission_amount, 0).toFixed(2)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8">
                <FileText className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 text-gray-600" />
                <p className="text-xs sm:text-sm text-gray-400">لا توجد عمولات مدفوعة في هذا الشهر</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* قائمة المشاركة */}
      {showShareMenu && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md p-0 sm:p-4" onClick={() => setShowShareMenu(false)}>
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl border-t-2 sm:border-2 border-gray-700" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg sm:text-xl font-bold text-white">مشاركة رابط الإحالة</h3>
              <button onClick={() => setShowShareMenu(false)} className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-700 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleShare('whatsapp')}
                className="flex flex-col items-center gap-2 p-4 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-xl transition-all hover:scale-105"
              >
                <MessageCircle className="w-7 h-7" />
                <span className="text-sm font-medium">WhatsApp</span>
              </button>

              <button
                onClick={() => handleShare('telegram')}
                className="flex flex-col items-center gap-2 p-4 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-xl transition-all hover:scale-105"
              >
                <Send className="w-7 h-7" />
                <span className="text-sm font-medium">Telegram</span>
              </button>

              <button
                onClick={() => handleShare('facebook')}
                className="flex flex-col items-center gap-2 p-4 bg-blue-600/20 hover:bg-blue-600/30 text-blue-500 rounded-xl transition-all hover:scale-105"
              >
                <Facebook className="w-7 h-7" />
                <span className="text-sm font-medium">Facebook</span>
              </button>

              <button
                onClick={() => handleShare('twitter')}
                className="flex flex-col items-center gap-2 p-4 bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 rounded-xl transition-all hover:scale-105"
              >
                <Twitter className="w-7 h-7" />
                <span className="text-sm font-medium">Twitter</span>
              </button>

              <button
                onClick={() => handleShare('email')}
                className="flex flex-col items-center gap-2 p-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition-all hover:scale-105 col-span-2"
              >
                <Mail className="w-7 h-7" />
                <span className="text-sm font-medium">البريد الإلكتروني</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
