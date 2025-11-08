import React, { useState, useEffect } from 'react';
import { Settings, Save, Percent, DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { supabase } from '../../config/supabaseClient';
import { useLanguage } from '../../contexts/LanguageContext';
import { Card } from '../ui/Card';

interface ReferralSettingsData {
  id?: string;
  discount_rate: number;           // نسبة الخصم للمستخدم الجديد
  commission_rate: number;         // نسبة العمولة لصاحب الإحالة
  payment_cycle_days: number;      // دورة الدفع (كل كم يوم)
  minimum_payout: number;          // الحد الأدنى للسحب
  is_active: boolean;              // تفعيل نظام الإحالة
  updated_at?: string;
}

export const ReferralSettings: React.FC = () => {
  const { t: _t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<ReferralSettingsData>({
    discount_rate: 10,
    commission_rate: 10,
    payment_cycle_days: 15,
    minimum_payout: 10,
    is_active: true
  });
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // جلب الإعدادات من جدول referral_settings
      const { data, error } = await supabase
        .from('referral_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned (أول مرة)
        throw error;
      }

      if (data) {
        setSettings(data);
      }
    } catch (error) {

    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSuccessMessage('');

      const settingsData = {
        discount_rate: settings.discount_rate,
        commission_rate: settings.commission_rate,
        payment_cycle_days: settings.payment_cycle_days,
        minimum_payout: settings.minimum_payout,
        is_active: settings.is_active,
        updated_at: new Date().toISOString()
      };

      // التحقق من وجود إعدادات
      const { data: existing } = await supabase
        .from('referral_settings')
        .select('id')
        .single();

      if (existing) {
        // تحديث الإعدادات الموجودة
        const { error } = await supabase
          .from('referral_settings')
          .update(settingsData)
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // إنشاء إعدادات جديدة
        const { error } = await supabase
          .from('referral_settings')
          .insert([settingsData]);

        if (error) throw error;
      }

      setSuccessMessage('تم حفظ الإعدادات بنجاح!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      await loadSettings();
    } catch (error) {

      alert('حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof ReferralSettingsData, value: number | boolean) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-base sm:text-2xl font-bold text-white">إعدادات نظام الإحالة</h2>
            <p className="text-gray-400 text-[10px] sm:text-sm">تحكم في نسب الخصم والعمولات</p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-500/20 border border-green-500 text-green-400 px-3 py-2 sm:px-4 sm:py-3 rounded-lg text-xs sm:text-sm">
          {successMessage}
        </div>
      )}

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        <Card padding="sm" className="text-center">
          <Percent className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400 mx-auto mb-1 sm:mb-2" />
          <div className="text-lg sm:text-3xl font-bold text-white">{settings.discount_rate}%</div>
          <div className="text-[10px] sm:text-sm text-gray-400">خصم المستخدم الجديد</div>
        </Card>
        
        <Card padding="sm" className="text-center">
          <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-green-400 mx-auto mb-1 sm:mb-2" />
          <div className="text-lg sm:text-3xl font-bold text-white">{settings.commission_rate}%</div>
          <div className="text-[10px] sm:text-sm text-gray-400">عمولة صاحب الإحالة</div>
        </Card>
        
        <Card padding="sm" className="text-center">
          <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400 mx-auto mb-1 sm:mb-2" />
          <div className="text-lg sm:text-3xl font-bold text-white">{settings.payment_cycle_days}</div>
          <div className="text-[10px] sm:text-sm text-gray-400">أيام دورة الدفع</div>
        </Card>
        
        <Card padding="sm" className="text-center">
          <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400 mx-auto mb-1 sm:mb-2" />
          <div className="text-lg sm:text-3xl font-bold text-white">${settings.minimum_payout}</div>
          <div className="text-[10px] sm:text-sm text-gray-400">الحد الأدنى للسحب</div>
        </Card>
      </div>

      {/* نموذج الإعدادات */}
      <Card>
        <div className="space-y-6">
          {/* تفعيل النظام */}
          <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
            <div>
              <h3 className="text-lg font-semibold text-white">تفعيل نظام الإحالة</h3>
              <p className="text-sm text-gray-400">السماح للمستخدمين بإنشاء روابط إحالة</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.is_active}
                onChange={(e) => handleChange('is_active', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* نسبة الخصم */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-white font-medium">
              <Percent className="w-5 h-5 text-blue-400" />
              نسبة الخصم للمستخدم الجديد (%)
            </label>
            <p className="text-sm text-gray-400 mb-2">
              كم سيحصل المستخدم الجديد من خصم عند استخدام رابط أو كوبون إحالة
            </p>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="50"
                step="1"
                value={settings.discount_rate}
                onChange={(e) => handleChange('discount_rate', parseFloat(e.target.value))}
                className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <input
                type="number"
                min="0"
                max="50"
                step="0.5"
                value={settings.discount_rate}
                onChange={(e) => handleChange('discount_rate', parseFloat(e.target.value))}
                className="w-24 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-white font-bold">%</span>
            </div>
            <div className="text-sm text-gray-400">
              مثال: باقة $50 - خصم {settings.discount_rate}% = <span className="text-green-400 font-bold">${(50 - (50 * settings.discount_rate / 100)).toFixed(2)}</span>
            </div>
          </div>

          {/* نسبة العمولة */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-white font-medium">
              <TrendingUp className="w-5 h-5 text-green-400" />
              نسبة العمولة لصاحب الإحالة (%)
            </label>
            <p className="text-sm text-gray-400 mb-2">
              كم سيربح صاحب الإحالة من قيمة الباقة بعد الخصم
            </p>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="50"
                step="1"
                value={settings.commission_rate}
                onChange={(e) => handleChange('commission_rate', parseFloat(e.target.value))}
                className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
              />
              <input
                type="number"
                min="0"
                max="50"
                step="0.5"
                value={settings.commission_rate}
                onChange={(e) => handleChange('commission_rate', parseFloat(e.target.value))}
                className="w-24 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <span className="text-white font-bold">%</span>
            </div>
            <div className="text-sm text-gray-400">
              مثال: باقة $50 - خصم {settings.discount_rate}% = ${(50 - (50 * settings.discount_rate / 100)).toFixed(2)} × {settings.commission_rate}% = <span className="text-green-400 font-bold">${((50 - (50 * settings.discount_rate / 100)) * settings.commission_rate / 100).toFixed(2)}</span> عمولة
            </div>
          </div>

          {/* دورة الدفع */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-white font-medium">
              <Calendar className="w-5 h-5 text-purple-400" />
              دورة الدفع (بالأيام)
            </label>
            <p className="text-sm text-gray-400 mb-2">
              كل كم يوم سيتم دفع العمولات للمستخدمين
            </p>
            <div className="flex items-center gap-4">
              <select
                value={settings.payment_cycle_days}
                onChange={(e) => handleChange('payment_cycle_days', parseInt(e.target.value))}
                className="flex-1 px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs sm:text-sm"
              >
                <option value="7">كل 7 أيام (أسبوعياً)</option>
                <option value="15">كل 15 يوم (نصف شهري)</option>
                <option value="30">كل 30 يوم (شهرياً)</option>
              </select>
            </div>
          </div>

          {/* الحد الأدنى للسحب */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-white font-medium">
              <DollarSign className="w-5 h-5 text-yellow-400" />
              الحد الأدنى للسحب ($)
            </label>
            <p className="text-sm text-gray-400 mb-2">
              الحد الأدنى من العمولات المطلوب لطلب الدفع
            </p>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min="0"
                step="5"
                value={settings.minimum_payout}
                onChange={(e) => handleChange('minimum_payout', parseFloat(e.target.value))}
                className="flex-1 px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 text-xs sm:text-sm"
              />
              <span className="text-white font-bold">$</span>
            </div>
          </div>

          {/* زر الحفظ */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  حفظ الإعدادات
                </>
              )}
            </button>
          </div>
        </div>
      </Card>

      {/* ملاحظات مهمة */}
      <Card className="bg-blue-500/10 border border-blue-500/30">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Settings className="w-5 h-5 text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-400 mb-2">ملاحظات مهمة:</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>التغييرات في النسب ستطبق على <strong>جميع الإحالات الجديدة</strong> فقط</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>الإحالات القديمة ستحتفظ بالنسب التي كانت سارية وقت إنشائها</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>يمكنك تعديل النسب في أي وقت حسب استراتيجيتك التسويقية</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>دورة الدفع تحدد متى سيتم مراجعة ودفع العمولات المستحقة</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};
