import React, { useState } from 'react';
import { Settings, Eye, EyeOff, Lock, User, Save, X } from 'lucide-react';
import simpleAuthService from '../../services/simpleAuthService';
import { useLanguage } from '../../contexts/LanguageContext';

// CSS للـ placeholders
const placeholderStyle = `
  .small-placeholder::placeholder {
    font-size: 11px;
  }
  @media (min-width: 640px) {
    .small-placeholder::placeholder {
      font-size: 12px;
    }
  }
`;

interface SettingsPageProps {
  isVisible: boolean;
  onClose: () => void;
  user?: any;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  isVisible,
  onClose,
  user
}) => {
  const { t, language } = useLanguage();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage({ type: 'error', text: 'جميع الحقول مطلوبة' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: t('settings.passwordMismatch') });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: t('settings.passwordTooShort') });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const success = await simpleAuthService.changePassword(
        user?.username,
        currentPassword,
        newPassword
      );

      if (success) {
        setMessage({ type: 'success', text: t('settings.passwordChangeSuccess') });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        
        // إغلاق النافذة بعد 2 ثانية
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setMessage({ type: 'error', text: t('settings.incorrectPassword') });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('settings.passwordChangeError') });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <>
      <style>{placeholderStyle}</style>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 animate-in fade-in duration-300" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 sm:p-7 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-700/50 animate-in zoom-in-95 duration-300">
        {/* الهيدر الحديث */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700/50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 rounded-lg blur-md opacity-50"></div>
              <Settings className="relative w-8 h-8 text-white bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-1.5 shadow-lg" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{t('settings.title')}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-all duration-300 hover:rotate-90 hover:scale-110"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* معلومات المستخدم الحديثة */}
        <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-xl p-4 mb-6 border border-blue-500/20 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 rounded-full blur-md opacity-50"></div>
              <User className="relative w-12 h-12 text-white bg-gradient-to-br from-blue-500 to-blue-600 rounded-full p-2.5 shadow-xl" />
            </div>
            <div>
              <h3 className="text-white font-bold text-base sm:text-lg">{user?.username}</h3>
              <p className="text-blue-300 text-sm font-medium">
                {user?.role === 'admin' ? t('settings.admin') : t('settings.trader')}
              </p>
            </div>
          </div>
        </div>

        {/* نموذج تغيير كلمة المرور */}
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="bg-gray-800/50 rounded-xl p-4 sm:p-5 border border-gray-700/50 shadow-lg">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2 text-base sm:text-lg">
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-500 rounded-lg blur-sm opacity-50"></div>
                <Lock className="relative w-5 h-5 text-white bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg p-1 shadow-lg" />
              </div>
              {t('settings.changePassword')}
            </h3>

            {/* كلمة المرور الحالية */}
            <div className="mb-3 sm:mb-4">
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                {t('settings.currentPassword')}
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={`small-placeholder w-full bg-gray-700 text-white px-3 py-2.5 rounded-lg text-[10px] sm:text-xs border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 ${language === 'ar' ? 'pr-10' : 'pl-10'}`}
                  placeholder={t('settings.enterCurrentPassword')}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className={`absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-400 transition-colors duration-300 ${language === 'ar' ? 'left-3' : 'right-3'}`}
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* كلمة المرور الجديدة */}
            <div className="mb-3 sm:mb-4">
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                {t('settings.newPassword')}
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`small-placeholder w-full bg-gray-700 text-white px-3 py-2.5 rounded-lg text-[10px] sm:text-xs border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 ${language === 'ar' ? 'pr-10' : 'pl-10'}`}
                  placeholder={t('settings.enterNewPassword')}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className={`absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-400 transition-colors duration-300 ${language === 'ar' ? 'left-3' : 'right-3'}`}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* تأكيد كلمة المرور الجديدة */}
            <div className="mb-4">
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                {t('settings.confirmPassword')}
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`small-placeholder w-full bg-gray-700 text-white px-3 py-2.5 rounded-lg text-[10px] sm:text-xs border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 ${language === 'ar' ? 'pr-10' : 'pl-10'}`}
                  placeholder={t('settings.reEnterPassword')}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={`absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-400 transition-colors duration-300 ${language === 'ar' ? 'left-3' : 'right-3'}`}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* رسالة النتيجة الحديثة */}
            {message && (
              <div className={`p-3 rounded-xl mb-4 text-sm font-medium shadow-lg animate-in slide-in-from-top-2 duration-300 ${
                message.type === 'success' 
                  ? 'bg-gradient-to-r from-green-600/20 to-emerald-600/20 text-green-300 border border-green-500/50 shadow-green-500/20' 
                  : 'bg-gradient-to-r from-red-600/20 to-red-700/20 text-red-300 border border-red-500/50 shadow-red-500/20'
              }`}>
                {message.text}
              </div>
            )}

            {/* زر الحفظ الحديث */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-blue-600/50 disabled:to-blue-700/50 text-white py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105 disabled:hover:scale-100"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t('settings.saving')}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {t('settings.saveNewPassword')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
};
