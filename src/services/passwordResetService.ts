import { supabase } from '../config/supabaseClient';
import { APP_CONFIG } from '../config/appConfig';

/**
 * خدمة استعادة كلمة المرور - باستخدام نظام Supabase المدمج
 * Password Reset Service - Using Supabase built-in system
 */

export interface PasswordResetResult {
  success: boolean;
  message: string;
  message_ar?: string;
  message_fr?: string;
}

// رسائل الخطأ متعددة اللغات
const ERROR_MESSAGES = {
  USER_NOT_FOUND: {
    en: 'Email address is not registered in the system',
    ar: 'البريد الإلكتروني غير مسجل في النظام',
    fr: 'L\'adresse e-mail n\'est pas enregistrée dans le système'
  },
  RATE_LIMIT: {
    en: 'Rate limit exceeded. Please try again after 15 minutes.',
    ar: 'تم تجاوز حد الإرسال. يرجى المحاولة بعد 15 دقيقة.',
    fr: 'Limite de taux dépassée. Veuillez réessayer après 15 minutes.'
  },
  EMAIL_NOT_CONFIRMED: {
    en: 'Email must be verified first',
    ar: 'يجب تفعيل البريد الإلكتروني أولاً',
    fr: 'L\'e-mail doit d\'abord être vérifié'
  },
  SUCCESS: {
    en: 'Password reset link has been sent to your email. Please check your inbox.',
    ar: 'تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني. يرجى التحقق من صندوق الوارد.',
    fr: 'Le lien de réinitialisation du mot de passe a été envoyé à votre e-mail. Veuillez vérifier votre boîte de réception.'
  },
  PASSWORD_TOO_SHORT: {
    en: 'Password must be at least 6 characters',
    ar: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
    fr: 'Le mot de passe doit contenir au moins 6 caractères'
  },
  UPDATE_ERROR: {
    en: 'An error occurred while updating the password',
    ar: 'حدث خطأ أثناء تحديث كلمة المرور',
    fr: 'Une erreur s\'est produite lors de la mise à jour du mot de passe'
  },
  UPDATE_SUCCESS: {
    en: 'Password updated successfully',
    ar: 'تم تحديث كلمة المرور بنجاح',
    fr: 'Mot de passe mis à jour avec succès'
  },
  UNEXPECTED_ERROR: {
    en: 'An unexpected error occurred',
    ar: 'حدث خطأ غير متوقع',
    fr: 'Une erreur inattendue s\'est produite'
  }
};

// دالة مساعدة لإنشاء رسالة متعددة اللغات
const createMultiLangMessage = (messageKey: keyof typeof ERROR_MESSAGES): PasswordResetResult => {
  const messages = ERROR_MESSAGES[messageKey];
  return {
    success: messageKey.includes('SUCCESS'),
    message: messages.ar, // الافتراضي العربية
    message_ar: messages.ar,
    message_fr: messages.fr
  };
};

class PasswordResetService {
  /**
   * إرسال رابط استعادة كلمة المرور إلى البريد الإلكتروني
   * Send password reset link to email
   */
  async sendResetLink(email: string): Promise<PasswordResetResult> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.toLowerCase().trim(),
        {
          redirectTo: `${APP_CONFIG.BASE_URL}/reset-password`
        }
      );

      if (error) {
        console.error('Password reset error:', error);
        
        // التعامل مع الأخطاء المختلفة
        if (error.message.includes('User not found')) {
          return createMultiLangMessage('USER_NOT_FOUND');
        }
        
        if (error.message.includes('rate limit')) {
          return createMultiLangMessage('RATE_LIMIT');
        }

        if (error.message.includes('Email not confirmed')) {
          return createMultiLangMessage('EMAIL_NOT_CONFIRMED');
        }
        
        return {
          success: false,
          message: `حدث خطأ: ${error.message}`,
          message_ar: `حدث خطأ: ${error.message}`,
          message_fr: `Erreur: ${error.message}`
        };
      }

      return createMultiLangMessage('SUCCESS');

    } catch (error) {
      console.error('Unexpected error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        message: `حدث خطأ غير متوقع: ${errorMsg}`,
        message_ar: `حدث خطأ غير متوقع: ${errorMsg}`,
        message_fr: `Erreur inattendue: ${errorMsg}`
      };
    }
  }

  /**
   * تحديث كلمة المرور بعد النقر على الرابط
   * Update password after clicking reset link
   */
  async updatePassword(newPassword: string): Promise<PasswordResetResult> {
    try {
      // التحقق من طول كلمة المرور
      if (newPassword.length < 6) {
        return createMultiLangMessage('PASSWORD_TOO_SHORT');
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return createMultiLangMessage('UPDATE_ERROR');
      }

      return createMultiLangMessage('UPDATE_SUCCESS');

    } catch (error) {
      return createMultiLangMessage('UNEXPECTED_ERROR');
    }
  }
}

export const passwordResetService = new PasswordResetService();
