import { supabase } from '../config/supabaseClient';
import { adminNotificationService } from './adminNotificationService';

/**
 * خدمة الإشعارات الدورية
 * ترسل تذكيرات أسبوعية للمستخدمين النشطين
 */
class PeriodicNotificationService {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  /**
   * بدء خدمة الإشعارات الدورية
   * يتم فحص المستخدمين كل أسبوع (7 أيام)
   */
  start() {
    if (this.isRunning) {

      return;
    }

    this.isRunning = true;

    // تشغيل فوري
    this.checkAndSendReminders();

    // تشغيل كل أسبوع (7 أيام)
    this.intervalId = setInterval(() => {
      this.checkAndSendReminders();
    }, 7 * 24 * 60 * 60 * 1000); // 7 أيام
  }

  /**
   * إيقاف خدمة الإشعارات الدورية
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;

    }
  }

  /**
   * فحص وإرسال التذكيرات للمستخدمين النشطين
   */
  private async checkAndSendReminders() {
    try {

      // جلب المستخدمين النشطين مع اشتراكات نشطة
      const { data: activeUsers, error } = await supabase
        .from('users')
        .select('id, email, full_name, subscription_status')
        .eq('subscription_status', 'active')
        .eq('is_active', true);

      if (error || !activeUsers || activeUsers.length === 0) {

        return;
      }

      // إرسال تذكير لكل مستخدم (مع التحقق من آخر تذكير)
      let sentCount = 0;
      let skippedCount = 0;

      for (const user of activeUsers) {
        const result = await adminNotificationService.sendReferralReminder(user.id);
        
        if (result.success) {
          sentCount++;

        } else {
          skippedCount++;
        }

        // انتظار قصير بين كل إرسال لتجنب الضغط على الخادم
        await new Promise(resolve => setTimeout(resolve, 100));
      }

    } catch (error) {

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
