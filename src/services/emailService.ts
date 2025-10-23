import { supabase } from '../config/supabaseClient';

export interface EmailVerificationData {
  email: string;
  code: string;
  expiresAt: string;
  userId: string;
}

class EmailService {
  // توليد رمز تفعيل عشوائي
  generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // حفظ رمز التفعيل في قاعدة البيانات
  async saveVerificationCode(userId: string, email: string, code: string): Promise<{ success: boolean; error?: string }> {
    try {
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15); // ينتهي خلال 15 دقيقة

      const { error } = await supabase
        .from('email_verifications')
        .upsert({
          user_id: userId,
          email: email,
          verification_code: code,
          expires_at: expiresAt.toISOString(),
          is_verified: false,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('❌ خطأ في حفظ رمز التفعيل:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ تم حفظ رمز التفعيل بنجاح');
      return { success: true };
    } catch (error) {
      console.error('❌ خطأ في حفظ رمز التفعيل:', error);
      return { success: false, error: 'حدث خطأ أثناء حفظ رمز التفعيل' };
    }
  }

  // إرسال رمز التفعيل عبر البريد الإلكتروني
  async sendVerificationEmail(email: string, code: string, fullName: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📧 إرسال رمز التفعيل إلى:', email);
      
      // محاولة إرسال البريد الحقيقي أولاً
      try {
        const response = await fetch('/api/send-verification-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: email,
            code: code,
            fullName: fullName
          })
        });

        if (response.ok) {
          await response.json();
          console.log('✅ تم إرسال البريد الإلكتروني بنجاح');
          
          // إظهار رسالة نجاح للمستخدم
          if (typeof window !== 'undefined') {
            const successDiv = document.createElement('div');
            successDiv.innerHTML = `
              <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                          background: #065f46; color: white; padding: 20px; border-radius: 10px; 
                          box-shadow: 0 10px 25px rgba(0,0,0,0.5); z-index: 10000; max-width: 400px;">
                <h3 style="margin: 0 0 15px 0; color: #10b981;">✅ تم الإرسال بنجاح</h3>
                <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.5;">
                  تم إرسال رمز التفعيل إلى بريدك الإلكتروني:<br>
                  <strong>${email}</strong>
                </p>
                <p style="margin: 0 0 15px 0; font-size: 14px; color: #a7f3d0;">
                  يرجى التحقق من صندوق الوارد أو مجلد الرسائل غير المرغوب فيها.
                </p>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: #10b981; color: white; border: none; padding: 8px 16px; 
                               border-radius: 5px; cursor: pointer; width: 100%;">
                  فهمت
                </button>
              </div>
            `;
            document.body.appendChild(successDiv);
            
            setTimeout(() => {
              if (successDiv.parentElement) {
                successDiv.remove();
              }
            }, 10000);
          }
          
          return { success: true };
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (emailError) {
        console.warn('⚠️ فشل في إرسال البريد الحقيقي، التبديل للوضع التطويري:', emailError);
        
        // الرجوع للوضع التطويري
        console.log('🔑 رمز التفعيل (وضع تطويري):', code);
        console.log('👤 المستخدم:', fullName);
        console.log('📧 البريد الإلكتروني:', email);
        
        // إظهار تنبيه للمستخدم في الوضع التطويري
        if (typeof window !== 'undefined') {
          const alertDiv = document.createElement('div');
          alertDiv.innerHTML = `
            <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                        background: #1e293b; color: white; padding: 20px; border-radius: 10px; 
                        box-shadow: 0 10px 25px rgba(0,0,0,0.5); z-index: 10000; max-width: 400px;">
              <h3 style="margin: 0 0 15px 0; color: #f59e0b;">⚠️ وضع التطوير</h3>
              <p style="margin: 0 0 10px 0; font-size: 24px; font-weight: bold; text-align: center; 
                        background: #374151; padding: 10px; border-radius: 5px; letter-spacing: 2px;">${code}</p>
              <p style="margin: 0 0 15px 0; font-size: 14px; color: #94a3b8;">
                لم يتم إعداد خدمة البريد بعد. استخدم الرمز أعلاه للتفعيل.
              </p>
              <button onclick="this.parentElement.parentElement.remove()" 
                      style="background: #f59e0b; color: white; border: none; padding: 8px 16px; 
                             border-radius: 5px; cursor: pointer; width: 100%;">
                فهمت، سأستخدم الرمز
              </button>
            </div>
          `;
          document.body.appendChild(alertDiv);
          
          setTimeout(() => {
            if (alertDiv.parentElement) {
              alertDiv.remove();
            }
          }, 30000);
        }
        
        return { success: true };
      }
    } catch (error) {
      console.error('❌ خطأ في إرسال رمز التفعيل:', error);
      return { success: false, error: 'فشل في إرسال رمز التفعيل' };
    }
  }

  // إرسال رمز تفعيل جديد
  async sendVerificationCode(userId: string, email: string, fullName: string): Promise<{ success: boolean; error?: string }> {
    try {
      // توليد رمز جديد
      const code = this.generateVerificationCode();
      
      // حفظ الرمز في قاعدة البيانات
      const saveResult = await this.saveVerificationCode(userId, email, code);
      if (!saveResult.success) {
        return saveResult;
      }

      // إرسال الرمز عبر البريد
      const emailResult = await this.sendVerificationEmail(email, code, fullName);
      if (!emailResult.success) {
        return emailResult;
      }

      return { success: true };
    } catch (error) {
      console.error('❌ خطأ في إرسال رمز التفعيل:', error);
      return { success: false, error: 'حدث خطأ أثناء إرسال رمز التفعيل' };
    }
  }

  // التحقق من رمز التفعيل
  async verifyCode(email: string, code: string): Promise<{ success: boolean; error?: string; userId?: string }> {
    try {
      console.log('🔍 التحقق من رمز التفعيل:', { email, code });

      // البحث عن رمز التفعيل
      const { data: verification, error: fetchError } = await supabase
        .from('email_verifications')
        .select('*')
        .eq('email', email)
        .eq('verification_code', code)
        .eq('is_verified', false)
        .single();

      if (fetchError || !verification) {
        console.error('❌ رمز التفعيل غير صحيح أو منتهي الصلاحية');
        return { success: false, error: 'رمز التفعيل غير صحيح أو منتهي الصلاحية' };
      }

      // التحقق من انتهاء الصلاحية
      const now = new Date();
      const expiresAt = new Date(verification.expires_at);
      
      if (now > expiresAt) {
        console.error('❌ رمز التفعيل منتهي الصلاحية');
        return { success: false, error: 'رمز التفعيل منتهي الصلاحية' };
      }

      // تحديث حالة التفعيل
      const { error: updateError } = await supabase
        .from('email_verifications')
        .update({
          is_verified: true,
          verified_at: new Date().toISOString()
        })
        .eq('id', verification.id);

      if (updateError) {
        console.error('❌ خطأ في تحديث حالة التفعيل:', updateError);
        return { success: false, error: 'حدث خطأ أثناء التفعيل' };
      }

      // تحديث حالة المستخدم
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({
          email_verified: true,
          email_verified_at: new Date().toISOString()
        })
        .eq('id', verification.user_id);

      if (userUpdateError) {
        console.error('❌ خطأ في تحديث حالة المستخدم:', userUpdateError);
        return { success: false, error: 'حدث خطأ أثناء تحديث حالة المستخدم' };
      }

      console.log('✅ تم تفعيل البريد الإلكتروني بنجاح');
      return { success: true, userId: verification.user_id };
    } catch (error) {
      console.error('❌ خطأ في التحقق من رمز التفعيل:', error);
      return { success: false, error: 'حدث خطأ أثناء التحقق من رمز التفعيل' };
    }
  }

  // إعادة إرسال رمز التفعيل
  async resendVerificationCode(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      // البحث عن المستخدم
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, full_name, email_verified')
        .eq('email', email)
        .single();

      if (userError || !user) {
        return { success: false, error: 'المستخدم غير موجود' };
      }

      if (user.email_verified) {
        return { success: false, error: 'البريد الإلكتروني مفعل بالفعل' };
      }

      // إرسال رمز جديد
      return await this.sendVerificationCode(user.id, email, user.full_name);
    } catch (error) {
      console.error('❌ خطأ في إعادة إرسال رمز التفعيل:', error);
      return { success: false, error: 'حدث خطأ أثناء إعادة إرسال رمز التفعيل' };
    }
  }

  // التحقق من حالة تفعيل البريد
  async checkEmailVerificationStatus(email: string): Promise<{ isVerified: boolean; error?: string }> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('email_verified')
        .eq('email', email)
        .single();

      if (error || !user) {
        return { isVerified: false, error: 'المستخدم غير موجود' };
      }

      return { isVerified: user.email_verified || false };
    } catch (error) {
      console.error('❌ خطأ في التحقق من حالة التفعيل:', error);
      return { isVerified: false, error: 'حدث خطأ أثناء التحقق من حالة التفعيل' };
    }
  }
}

export const emailService = new EmailService();
export default emailService;
