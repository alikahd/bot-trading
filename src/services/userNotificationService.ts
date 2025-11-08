/**
 * 🔔 خدمة التنبيهات للمستخدمين
 * عرض وإدارة التنبيهات الواردة
 */

import { supabase } from './supabase';
import { Notification } from './adminNotificationService';

class UserNotificationService {
  /**
   * الحصول على تنبيهات المستخدم
   */
  async getUserNotifications(filters?: {
    is_read?: boolean;
    type?: string;
    limit?: number;
  }): Promise<{ success: boolean; notifications?: Notification[]; error?: string }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) {

        return { success: false, error: 'غير مصرح' };
      }

      // ✅ جلب users.id من جدول users بناءً على auth_id
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.user.id)
        .single();

      if (userError || !userData) {

        return { success: false, error: 'المستخدم غير موجود' };
      }

      // جلب التنبيهات الشخصية

      const { data: personalNotifications, error: error1 } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', userData.id) // ✅ استخدام users.id
        .order('created_at', { ascending: false });

      if (error1) {

      }

      // جلب التنبيهات العامة

      const { data: generalNotifications, error: error2 } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_type', 'all_users')
        .order('created_at', { ascending: false });

      if (error2) {

      }

      // دمج التنبيهات
      let allNotifications = [
        ...(personalNotifications || []),
        ...(generalNotifications || [])
      ];

      // إزالة المكررات
      const uniqueNotifications = Array.from(
        new Map(allNotifications.map(n => [n.id, n])).values()
      );

      // ترتيب حسب التاريخ
      uniqueNotifications.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      // تطبيق الفلاتر
      let filteredNotifications = uniqueNotifications;

      if (filters?.is_read !== undefined) {
        filteredNotifications = filteredNotifications.filter(n => n.is_read === filters.is_read);
      }

      if (filters?.type) {
        filteredNotifications = filteredNotifications.filter(n => n.type === filters.type);
      }

      if (filters?.limit) {
        filteredNotifications = filteredNotifications.slice(0, filters.limit);
      }

      return { success: true, notifications: filteredNotifications };
    } catch (error: any) {

      return { success: false, error: error.message };
    }
  }

  /**
   * عدد التنبيهات غير المقروءة
   */
  async getUnreadCount(): Promise<{ success: boolean; count?: number; error?: string }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) {
        return { success: false, error: 'غير مصرح' };
      }

      // ✅ جلب users.id
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.user.id)
        .single();

      if (!userData) {
        return { success: false, error: 'المستخدم غير موجود' };
      }

      // عد التنبيهات الشخصية غير المقروءة
      const { count: personalCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', userData.id) // ✅ استخدام users.id
        .eq('is_read', false);

      // عد التنبيهات العامة غير المقروءة
      const { count: generalCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_type', 'all_users')
        .eq('is_read', false);

      const totalCount = (personalCount || 0) + (generalCount || 0);

      return { success: true, count: totalCount };
    } catch (error: any) {

      return { success: false, error: error.message };
    }
  }

  /**
   * تحديد تنبيه كمقروء
   */
  async markAsRead(notificationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
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
   * تحديد جميع التنبيهات كمقروءة
   */
  async markAllAsRead(): Promise<{ success: boolean; count?: number; error?: string }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) {
        return { success: false, error: 'غير مصرح' };
      }

      const { data, error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .or(`recipient_id.eq.${user.user.id},recipient_type.eq.all_users`)
        .eq('is_read', false)
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
   * حذف تنبيه واحد
   */
  async deleteNotification(notificationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) {
        return { success: false, error: 'غير مصرح' };
      }

      // حذف التنبيه (فقط إذا كان المستخدم هو المالك)
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('recipient_id', user.user.id);

      if (error) {

        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {

      return { success: false, error: error.message };
    }
  }

  /**
   * حذف عدة تنبيهات
   */
  async deleteNotifications(notificationIds: string[]): Promise<{ success: boolean; count?: number; error?: string }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) {
        return { success: false, error: 'غير مصرح' };
      }

      // حذف التنبيهات (فقط التي يملكها المستخدم)
      const { data, error } = await supabase
        .from('notifications')
        .delete()
        .in('id', notificationIds)
        .eq('recipient_id', user.user.id)
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
   * الاشتراك في التنبيهات الفورية (Real-time)
   */
  async subscribeToNotifications(callback: (notification: Notification) => void): Promise<() => void> {
    try {
      const { data } = await supabase.auth.getUser();
      
      if (!data.user) {

        return () => {};
      }

      // ✅ جلب users.id
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', data.user.id)
        .single();

      if (!userData) {

        return () => {};
      }

      const channel = supabase
        .channel('user-notifications')
        // الاستماع للإشعارات الشخصية الجديدة
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `recipient_id=eq.${userData.id}`, // ✅ استخدام users.id
          },
          (payload) => {

            callback(payload.new as Notification);
          }
        )
        // الاستماع للإشعارات العامة الجديدة
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `recipient_type=eq.all_users`,
          },
          (payload) => {

            callback(payload.new as Notification);
          }
        )
        // الاستماع للتحديثات (مثل تحديد كمقروء)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `recipient_id=eq.${data.user.id}`,
          },
          (payload) => {

            callback(payload.new as Notification);
          }
        )
        // الاستماع للحذف
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'notifications',
            filter: `recipient_id=eq.${data.user.id}`,
          },
          (_payload) => {

            // يمكن إضافة callback للحذف إذا لزم الأمر
          }
        )
        .subscribe((_status) => {

        });

      // إرجاع دالة لإلغاء الاشتراك
      return () => {
        channel.unsubscribe();

      };
    } catch (error) {

      return () => {};
    }
  }
}

export const userNotificationService = new UserNotificationService();
