import { supabase } from '../config/supabaseClient';

/**
 * خدمة استعادة كلمة المرور - باستخدام نظام Supabase المدمج
 * Password Reset Service - Using Supabase built-in system
 */

export interface PasswordResetResult {
  success: boolean;
  message: string;
}

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
          redirectTo: `${window.location.origin}/reset-password`
        }
      );

      if (error) {
        // التعامل مع الأخطاء المختلفة
        if (error.message.includes('User not found')) {
          return {
            success: false,
            message: 'البريد الإلكتروني غير مسجل في النظام'
          };
        }
        
        return {
          success: false,
          message: 'حدث خطأ أثناء إرسال رابط الاستعادة'
        };
      }

      return {
        success: true,
        message: 'تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني. يرجى التحقق من صندوق الوارد.'
      };

    } catch (error) {
      return {
        success: false,
        message: 'حدث خطأ غير متوقع'
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
        return {
          success: false,
          message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
        };
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return {
          success: false,
          message: 'حدث خطأ أثناء تحديث كلمة المرور'
        };
      }

      return {
        success: true,
        message: 'تم تحديث كلمة المرور بنجاح'
      };

    } catch (error) {
      return {
        success: false,
        message: 'حدث خطأ غير متوقع'
      };
    }
  }
}

export const passwordResetService = new PasswordResetService();
