import { supabase } from '../config/supabaseClient';
import { adminNotificationService } from './adminNotificationService';

/**
 * خدمة الإشعارات الدورية
 * ترسل تذكيرات دورية للمستخدمين النشطين
 */
class PeriodicNotificationService {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  /**
   * بدء خدمة الإشعارات الدورية
   * يتم فحص المستخدمين كل 6 ساعات
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️ خدمة الإشعارات الدورية تعمل بالفعل');
      return;
    }

    console.log('🚀 بدء خدمة الإشعارات الدورية');
    this.isRunning = true;

    // تشغيل فوري
    this.checkAndSendReminders();

    // تشغيل كل 6 ساعات
    this.intervalId = setInterval(() => {
      this.checkAndSendReminders();
    }, 6 * 60 * 60 * 1000); // 6 ساعات
  }

  /**
   * إيقاف خدمة الإشعارات الدورية
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      console.log('⏹️ تم إيقاف خدمة الإشعارات الدورية');
    }
  }

  /**
   * فحص وإرسال التذكيرات للمستخدمين النشطين
   */
  private async checkAndSendReminders() {
    try {
      console.log('🔍 فحص المستخدمين النشطين لإرسال التذكيرات...');

      // جلب المستخدمين النشطين مع اشتراكات نشطة
      const { data: activeUsers, error } = await supabase
        .from('users')
        .select('id, email, full_name, subscription_status')
        .eq('subscription_status', 'active')
        .eq('is_active', true);

      if (error || !activeUsers || activeUsers.length === 0) {
        console.log('ℹ️ لا يوجد مستخدمين نشطين');
        return;
      }

      console.log(`✅ تم العثور على ${activeUsers.length} مستخدم نشط`);

      // إرسال تذكير لكل مستخدم (مع التحقق من آخر تذكير)
      let sentCount = 0;
      let skippedCount = 0;

      for (const user of activeUsers) {
        const result = await adminNotificationService.sendReferralReminder(user.id);
        
        if (result.success) {
          sentCount++;
          console.log(`✅ تم إرسال تذكير لـ ${user.full_name} (${user.email})`);
        } else {
          skippedCount++;
        }

        // انتظار قصير بين كل إرسال لتجنب الضغط على الخادم
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`📊 نتيجة الإرسال: ${sentCount} تم إرسالها، ${skippedCount} تم تخطيها`);
    } catch (error) {
      console.error('❌ خطأ في فحص وإرسال التذكيرات:', error);
    }
  }

  /**
   * إرسال تذكير يدوي لمستخدم معين
   */
  async sendManualReminder(userId: string): Promise<{ success: boolean; error?: string }> {
    return await adminNotificationService.sendReferralReminder(userId);
  }
}

export const periodicNotificationService = new PeriodicNotificationService();
