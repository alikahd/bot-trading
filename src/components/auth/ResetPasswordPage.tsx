import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useLanguage } from '../../contexts/LanguageContext';
import { supabase } from '../../config/supabaseClient';

interface ResetPasswordPageProps {
  onSuccess: () => void;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ onSuccess }) => {
  const { t, dir } = useLanguage();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [hasValidSession, setHasValidSession] = useState(false);

  useEffect(() => {
    // الاستماع لتغييرات المصادقة
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        if (session) {
          setHasValidSession(true);
        }
      } else if (event === 'SIGNED_IN' && session) {
        // قد يكون recovery session
        setHasValidSession(true);
      }
    });
    
    // التحقق من session موجودة
    const checkSession = async () => {
      // انتظار لإعطاء Supabase وقتاً لمعالجة الرابط
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setHasValidSession(true);
      } else {
        setError(t('resetPassword.invalidLinkRequest'));
      }
    };
    
    checkSession();
    
    // تنظيف
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError(t('resetPassword.passwordMismatch'));
      return;
    }

    if (newPassword.length < 6) {
      setError(t('resetPassword.passwordTooShort'));
      return;
    }

    if (!hasValidSession) {
      setError(t('resetPassword.invalidLink'));
      return;
    }

    setIsLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (updateError) {
        setError(t('resetPassword.updateError') + ': ' + updateError.message);
        setIsLoading(false);
        return;
      }
      
      // تنظيف العلامة
      sessionStorage.removeItem('in_password_reset_flow');
      
      await supabase.auth.signOut();
      
      setSuccess(true);
      setIsLoading(false);
      
      setTimeout(() => {
        onSuccess();
      }, 2000);
      
    } catch (err: any) {
      setError(err?.message || t('resetPassword.unexpectedError'));
      setIsLoading(false);
    }
  };

  if (!hasValidSession && error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4" dir={dir}>
        <Card className="w-full max-w-md p-8 text-center">
          <div className="text-red-400 mb-4">
            <p>{error}</p>
          </div>
          <Button
            onClick={onSuccess}
            variant="secondary"
            className="w-full"
          >
            {t('resetPassword.backToLogin')}
          </Button>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4" dir={dir}>
        <Card className="w-full max-w-md p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-4">
            {t('resetPassword.success')}
          </h2>
          
          <p className="text-gray-300 mb-6">
            {t('resetPassword.successMessage')}
          </p>
          
          <Button
            onClick={onSuccess}
            variant="primary"
            className="w-full"
          >
            {t('resetPassword.goToLogin')}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4" dir={dir}>
      <Card className="w-full max-w-md p-8">
        <h2 className="text-2xl font-bold text-white mb-6">
          {t('resetPassword.title')}
        </h2>

        <p className="text-gray-300 mb-6">
          {t('resetPassword.description')}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('resetPassword.newPassword')}
            </label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 pr-24 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('resetPassword.newPasswordPlaceholder')}
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('resetPassword.confirmPassword')}
            </label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 pr-24 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('resetPassword.confirmPasswordPlaceholder')}
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? t('resetPassword.updating') : t('resetPassword.updatePassword')}
          </Button>
        </form>
      </Card>
    </div>
  );
};
