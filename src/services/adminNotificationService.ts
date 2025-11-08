/**
 * 🔔 خدمة التنبيهات للأدمن
 * إرسال وإدارة التنبيهات للمستخدمين
 */

import { supabase } from './supabase';

export interface Notification {
  id: string;
  sender_id: string | null;
  sender_type: 'admin' | 'system';
  recipient_id: string | null;
  recipient_type: 'user' | 'all_users';
  title: string;
  title_ar?: string;
  title_fr?: string;
  message: string;
  message_ar?: string;
  message_fr?: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'announcement';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  is_read: boolean;
  read_at: string | null;
  image_url?: string;
  action_type?: string;
  action_url?: string;
  action_data?: any;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateNotificationData {
  recipient_id?: string; // إذا كان null، سيتم إرسال لجميع المستخدمين
  recipient_type?: 'user' | 'all_users';
  title: string;
  title_ar?: string;
  title_fr?: string;
  message: string;
  message_ar?: string;
  message_fr?: string;
  type?: 'info' | 'warning' | 'error' | 'success' | 'announcement';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  image_url?: string;
  action_type?: string;
  action_url?: string;
  action_data?: any;
  expires_at?: string; // ISO date string
}

class AdminNotificationService {
  /**
   * إرسال تنبيه لمستخدم واحد
   */
  async sendToUser(userId: string, data: CreateNotificationData): Promise<{ success: boolean; notification?: Notification; error?: string }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) {
        return { success: false, error: 'غير مصرح' };
      }

      const notificationData = {
        sender_id: user.user.id,
        sender_type: 'admin' as const,
        recipient_id: userId,
        recipient_type: 'user' as const,
        title: data.title,
        title_ar: data.title_ar,
        title_fr: data.title_fr,
        message: data.message,
        message_ar: data.message_ar,
        message_fr: data.message_fr,
        type: data.type || 'info',
        priority: data.priority || 'normal',
        image_url: data.image_url,
        action_type: data.action_type,
        action_url: data.action_url,
        action_data: data.action_data || {},
        expires_at: data.expires_at,
      };

      const { data: notification, error } = await supabase
        .from('notifications')
        .insert(notificationData)
        .select()
        .single();

      if (error) {

        return { success: false, error: error.message };
      }

      return { success: true, notification };
    } catch (error: any) {

      return { success: false, error: error.message };
    }
  }

  /**
   * إرسال تنبيه لجميع المستخدمين
   */
  async sendToAllUsers(data: CreateNotificationData): Promise<{ success: boolean; count?: number; error?: string }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) {
        return { success: false, error: 'غير مصرح' };
      }

      // الحصول على جميع المستخدمين النشطين
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id')
        .eq('is_active', true);

      if (usersError || !users) {

        return { success: false, error: usersError?.message || 'فشل جلب المستخدمين' };
      }

      // إنشاء تنبيه لكل مستخدم
      const notifications = users.map(u => ({
        sender_id: user.user!.id,
        sender_type: 'admin' as const,
        recipient_id: u.id,
        recipient_type: 'all_users' as const,
        title: data.title,
        title_ar: data.title_ar,
        title_fr: data.title_fr,
        message: data.message,
        message_ar: data.message_ar,
        message_fr: data.message_fr,
        type: data.type || 'announcement',
        priority: data.priority || 'normal',
        image_url: data.image_url,
        action_type: data.action_type,
        action_url: data.action_url,
        action_data: data.action_data || {},
        expires_at: data.expires_at,
      }));

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) {

        return { success: false, error: error.message };
      }

      return { success: true, count: notifications.length };
    } catch (error: any) {

      return { success: false, error: error.message };
    }
  }

  /**
   * الحصول على جميع التنبيهات (للأدمن)
   */
  async getAllNotifications(filters?: {
    type?: string;
    priority?: string;
    is_read?: boolean;
    limit?: number;
  }): Promise<{ success: boolean; notifications?: Notification[]; error?: string }> {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.type) {
        query = query.eq('type', filters.type);
      }

      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }

      if (filters?.is_read !== undefined) {
        query = query.eq('is_read', filters.is_read);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {

        return { success: false, error: error.message };
      }

      return { success: true, notifications: data || [] };
    } catch (error: any) {

      return { success: false, error: error.message };
    }
  }

  /**
   * حذف تنبيه
   */
  async deleteNotification(notificationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {

        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {

      return { success: false, error: error.message };
    }
  }

  /**
   * حذف التنبيهات المنتهية
   */
  async deleteExpiredNotifications(): Promise<{ success: boolean; count?: number; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select();

      if (error) {

        return { success: false, error: error.message };
      }

      return { success: true, count: data?.length || 0 };
    } catch (error: any) {

      return { success: false, error: error.message };
    }
  }

  /**
   * إرسال تنبيه ترحيبي تلقائي عند الاشتراك أو التجديد
   */
  async sendWelcomeNotification(userId: string, isRenewal: boolean = false): Promise<{ success: boolean; error?: string }> {
    try {

      // ✅ منع إرسال الإشعارات الترحيبية للأدمن
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (userData?.role === 'admin') {

        return { success: true };
      }
      
      // ✅ التحقق من عدم وجود إشعار ترحيبي سابق لنفس النوع (اشتراك جديد أو تجديد)
      const { data: existingNotification } = await supabase
        .from('notifications')
        .select('id, created_at')
        .eq('recipient_id', userId)
        .eq('type', 'success')
        .or(isRenewal 
          ? 'title_ar.eq.تم تجديد اشتراكك بنجاح!'
          : 'title_ar.eq.مرحباً بك في BooTrading المميز!')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (existingNotification) {

        return { success: true };
      }
      
      const notificationData = {
        sender_id: null, // تنبيه من النظام
        sender_type: 'system' as const,
        recipient_id: userId, // ✅ استخدام users.id مباشرة
        recipient_type: 'user' as const,
        title: isRenewal ? 'Subscription Successfully Renewed!' : 'Welcome to BooTrading Premium!',
        title_ar: isRenewal ? 'تم تجديد اشتراكك بنجاح!' : 'مرحباً بك في BooTrading المميز!',
        title_fr: isRenewal ? 'Abonnement renouvelé avec succès!' : 'Bienvenue dans BooTrading Premium!',
        message: isRenewal 
          ? 'Your subscription has been successfully renewed. Continue enjoying advanced trading signals, real-time analysis, and exclusive features. Thank you for your continued trust!'
          : 'Congratulations! Your premium account is now active. Access advanced trading signals, AI-powered recommendations, and real-time market analysis. Start your profitable trading journey now!',
        message_ar: isRenewal
          ? 'تم تجديد اشتراكك بنجاح! استمر في الاستفادة من إشارات التداول المتقدمة، التحليل الفوري، والمميزات الحصرية. شكراً لثقتك المستمرة بنا!'
          : 'تهانينا! حسابك المميز الآن نشط. احصل على إشارات تداول متقدمة، توصيات مدعومة بالذكاء الاصطناعي، وتحليل فوري للأسواق. ابدأ رحلتك الربحية الآن!',
        message_fr: isRenewal
          ? 'Votre abonnement a été renouvelé avec succès! Continuez à profiter des signaux de trading avancés, de l\'analyse en temps réel et des fonctionnalités exclusives. Merci pour votre confiance continue!'
          : 'Félicitations! Votre compte premium est maintenant actif. Accédez aux signaux de trading avancés, aux recommandations alimentées par l\'IA et à l\'analyse de marché en temps réel. Commencez votre parcours de trading rentable maintenant!',
        type: 'success' as const,
        priority: 'high' as const,
        action_type: 'navigate',
        action_url: '/dashboard',
        action_data: { source: 'welcome_notification' },
      };

      const { error } = await supabase
        .from('notifications')
        .insert(notificationData)
        .select()
        .single();

      if (error) {

        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {

      return { success: false, error: error.message };
    }
  }

  /**
   * إرسال إشعار تذكير بنظام الإحالة (دوري)
   */
  async sendReferralReminder(userId: string, forceResend: boolean = false): Promise<{ success: boolean; error?: string }> {
    try {

      // ✅ منع إرسال إشعارات الإحالة للأدمن
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (userData?.role === 'admin') {

        return { success: true };
      }
      
      // التحقق من آخر إشعار إحالة (إلا إذا كان forceResend)
      if (!forceResend) {
        const { data: lastReferralNotif } = await supabase
          .from('notifications')
          .select('created_at')
          .eq('recipient_id', userId)
          .eq('type', 'referral_reminder')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // إذا كان هناك إشعار خلال آخر 7 أيام، لا نرسل
        if (lastReferralNotif) {
          const daysSinceLastNotif = Math.floor(
            (Date.now() - new Date(lastReferralNotif.created_at).getTime()) / (1000 * 60 * 60 * 24)
          );
          
          if (daysSinceLastNotif < 7) {

            return { success: false, error: 'تم إرسال التذكير مؤخراً' };
          }
        }
      } else {

      }

      const notificationData = {
        sender_id: null,
        sender_type: 'system',
        recipient_id: userId,
        recipient_type: 'user',
        title: '💰 Don\'t miss out on $5000 monthly!',
        title_ar: '💰 لا تفوت فرصة ربح $5000 شهرياً!',
        title_fr: '💰 Ne manquez pas $5000 par mois!',
        message: '🌟 Reminder: You can earn amazing commissions by inviting friends! Share your referral link and start earning today. Your potential monthly income: $5000+',
        message_ar: '🌟 تذكير: يمكنك ربح عمولات مذهلة بدعوة أصدقائك! شارك رابط الإحالة الخاص بك وابدأ الربح اليوم. دخلك الشهري المحتمل: $5000+',
        message_fr: '🌟 Rappel: Vous pouvez gagner des commissions incroyables en invitant des amis! Partagez votre lien de parrainage et commencez à gagner aujourd\'hui. Votre revenu mensuel potentiel: $5000+',
        type: 'referral_reminder',
        priority: 'normal',
        is_read: false,
        action_type: 'navigate',
        action_url: '/referral',
        action_data: { source: 'reminder', potential_earnings: 5000 },
      };

      const { error } = await supabase
        .from('notifications')
        .insert(notificationData)
        .select();

      if (error) {

        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {

      return { success: false, error: error.message };
    }
  }

  /**
   * إحصائيات التنبيهات
   */
  async getNotificationStats(): Promise<{
    success: boolean;
    stats?: {
      total: number;
      unread: number;
      byType: Record<string, number>;
      byPriority: Record<string, number>;
    };
    error?: string;
  }> {
    try {
      const { data: all, error: allError } = await supabase
        .from('notifications')
        .select('type, priority, is_read');

      if (allError || !all) {
        return { success: false, error: allError?.message };
      }

      const stats = {
        total: all.length,
        unread: all.filter(n => !n.is_read).length,
        byType: {} as Record<string, number>,
        byPriority: {} as Record<string, number>,
      };

      all.forEach(n => {
        stats.byType[n.type] = (stats.byType[n.type] || 0) + 1;
        stats.byPriority[n.priority] = (stats.byPriority[n.priority] || 0) + 1;
      });

      return { success: true, stats };
    } catch (error: any) {

      return { success: false, error: error.message };
    }
  }
}

export const adminNotificationService = new AdminNotificationService();
