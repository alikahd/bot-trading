import { supabase } from '../config/supabaseClient';

/**
 * خدمة استعادة كلمة المرور
 * Password Reset Service
 */

export interface PasswordResetResult {
  success: boolean;
  message: string;
  code?: string;
  expiresAt?: string;
}

class PasswordResetService {
  /**
   * إنشاء رمز استعادة وإرساله للبريد الإلكتروني
   * Create reset code and send to email
   */
  async createResetCode(email: string): Promise<PasswordResetResult> {
    try {
      console.log('📧 طلب إنشاء رمز استعادة للبريد:', email);

      // استدعاء دالة قاعدة البيانات لإنشاء الرمز
      const { data, error } = await supabase
        .rpc('create_password_reset_code', {
          p_email: email.toLowerCase().trim()
        });

      if (error) {
        console.error('❌ خطأ في إنشاء رمز الاستعادة:', error);
        
        // إذا كان الخطأ بسبب عدم وجود المستخدم
        if (error.message.includes('User not found')) {
          return {
            success: false,
            message: 'البريد الإلكتروني غير مسجل في النظام'
          };
        }
        
        return {
          success: false,
          message: 'حدث خطأ أثناء إنشاء رمز الاستعادة'
        };
      }

      if (!data || data.length === 0) {
        return {
          success: false,
          message: 'فشل إنشاء رمز الاستعادة'
        };
      }

      const resetData = data[0];
      console.log('✅ تم إنشاء رمز الاستعادة بنجاح');
      console.log('🔢 الرمز:', resetData.reset_code);
      console.log('⏰ ينتهي في:', resetData.expires_at);

      // في بيئة الإنتاج، يجب إرسال الرمز عبر البريد الإلكتروني
      // في بيئة التطوير، نعرض الرمز في console
      if (process.env.NODE_ENV === 'development') {
        console.log('🔐 رمز الاستعادة (للتطوير فقط):', resetData.reset_code);
      }

      // TODO: دمج مع خدمة إرسال البريد الإلكتروني
      // await this.sendResetEmail(email, resetData.reset_code);

      return {
        success: true,
        message: 'تم إرسال رمز الاستعادة إلى بريدك الإلكتروني',
        code: process.env.NODE_ENV === 'development' ? resetData.reset_code : undefined,
        expiresAt: resetData.expires_at
      };

    } catch (error) {
      console.error('❌ خطأ في createResetCode:', error);
      return {
        success: false,
        message: 'حدث خطأ غير متوقع'
      };
    }
  }

  /**
   * التحقق من صحة رمز الاستعادة
   * Verify reset code
   */
  async verifyResetCode(email: string, code: string): Promise<PasswordResetResult> {
    try {
      console.log('🔍 التحقق من رمز الاستعادة للبريد:', email);

      const { data, error } = await supabase
        .rpc('verify_reset_code', {
          p_email: email.toLowerCase().trim(),
          p_code: code.trim()
        });

      if (error) {
        console.error('❌ خطأ في التحقق من الرمز:', error);
        return {
          success: false,
          message: 'حدث خطأ أثناء التحقق من الرمز'
        };
      }

      if (!data || data.length === 0) {
        return {
          success: false,
          message: 'الرمز غير صحيح أو منتهي الصلاحية'
        };
      }

      const verifyData = data[0];
      
      if (!verifyData.valid) {
        console.log('❌ الرمز غير صالح');
        return {
          success: false,
          message: 'الرمز غير صحيح أو منتهي الصلاحية'
        };
      }

      console.log('✅ الرمز صالح');
      return {
        success: true,
        message: 'الرمز صحيح'
      };

    } catch (error) {
      console.error('❌ خطأ في verifyResetCode:', error);
      return {
        success: false,
        message: 'حدث خطأ غير متوقع'
      };
    }
  }

  /**
   * إعادة تعيين كلمة المرور
   * Reset password with code
   */
  async resetPassword(
    email: string,
    code: string,
    newPassword: string
  ): Promise<PasswordResetResult> {
    try {
      console.log('🔐 إعادة تعيين كلمة المرور للبريد:', email);

      // التحقق من طول كلمة المرور
      if (newPassword.length < 6) {
        return {
          success: false,
          message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
        };
      }

      const { data, error } = await supabase
        .rpc('reset_password_with_code', {
          p_email: email.toLowerCase().trim(),
          p_code: code.trim(),
          p_new_password: newPassword
        });

      if (error) {
        console.error('❌ خطأ في إعادة تعيين كلمة المرور:', error);
        return {
          success: false,
          message: 'حدث خطأ أثناء إعادة تعيين كلمة المرور'
        };
      }

      if (!data || data.length === 0) {
        return {
          success: false,
          message: 'فشل في إعادة تعيين كلمة المرور'
        };
      }

      const resetData = data[0];

      if (!resetData.success) {
        console.log('❌ فشل إعادة التعيين:', resetData.message);
        return {
          success: false,
          message: resetData.message || 'الرمز غير صحيح أو منتهي الصلاحية'
        };
      }

      console.log('✅ تم إعادة تعيين كلمة المرور بنجاح');
      return {
        success: true,
        message: 'تم إعادة تعيين كلمة المرور بنجاح'
      };

    } catch (error) {
      console.error('❌ خطأ في resetPassword:', error);
      return {
        success: false,
        message: 'حدث خطأ غير متوقع'
      };
    }
  }

  /**
   * إرسال البريد الإلكتروني مع رمز الاستعادة
   * TODO: دمج مع خدمة إرسال البريد الإلكتروني
   */
  private async sendResetEmail(email: string, code: string): Promise<void> {
    // TODO: دمج مع خدمة البريد الإلكتروني (SendGrid, AWS SES, إلخ)
    console.log(`📧 إرسال رمز الاستعادة ${code} إلى ${email}`);
    
    // مثال على محتوى البريد:
    const emailContent = `
      مرحباً،
      
      لقد طلبت إعادة تعيين كلمة المرور لحسابك في بوت التداول.
      
      رمز الاستعادة الخاص بك هو: ${code}
      
      الرمز صالح لمدة 15 دقيقة فقط.
      
      إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد.
      
      تحياتنا،
      فريق بوت التداول
    `;

    console.log('محتوى البريد:', emailContent);
  }

  /**
   * تنظيف الرموز المنتهية
   * Cleanup expired codes
   */
  async cleanupExpiredCodes(): Promise<number> {
    try {
      const { data, error } = await supabase
        .rpc('cleanup_expired_reset_codes');

      if (error) {
        console.error('❌ خطأ في تنظيف الرموز المنتهية:', error);
        return 0;
      }

      console.log(`🧹 تم حذف ${data} رمز منتهي الصلاحية`);
      return data || 0;

    } catch (error) {
      console.error('❌ خطأ في cleanupExpiredCodes:', error);
      return 0;
    }
  }
}

export const passwordResetService = new PasswordResetService();
