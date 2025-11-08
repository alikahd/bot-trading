import { supabase } from '../config/supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * 🔄 خدمة المزامنة الفورية باستخدام Supabase Realtime
 * 
 * هذه الخدمة توفر:
 * - ⚡ مزامنة فورية (أقل من ثانية)
 * - 🎯 تحديثات لحظية عند تغيير البيانات
 * - 💾 استهلاك أقل للموارد
 */

type SubscriptionChangeCallback = (payload: any) => void;
type UserChangeCallback = (payload: any) => void;

class RealtimeSyncService {
  private userChannel: RealtimeChannel | null = null;
  private subscriptionChannel: RealtimeChannel | null = null;
  private userCallbacks: UserChangeCallback[] = [];
  private subscriptionCallbacks: SubscriptionChangeCallback[] = [];

  /**
   * 🎧 الاستماع لتغييرات جدول users
   */
  subscribeToUserChanges(userId: string, callback: UserChangeCallback) {

    // إضافة callback للقائمة
    this.userCallbacks.push(callback);

    // إذا كان هناك قناة نشطة، لا نحتاج لإنشاء واحدة جديدة
    if (this.userChannel) {

      return () => this.unsubscribeFromUserChanges(callback);
    }

    // إنشاء قناة جديدة
    this.userChannel = supabase
      .channel(`user-changes-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // جميع الأحداث (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'users',
          filter: `id=eq.${userId}`
        },
        (payload) => {

          // استدعاء جميع callbacks المسجلة
          this.userCallbacks.forEach(cb => {
            try {
              cb(payload);
            } catch (error) {

            }
          });
        }
      )
      .subscribe((status) => {

        if (status === 'SUBSCRIBED') {

        } else if (status === 'CHANNEL_ERROR') {

          // لا نوقف التطبيق - فقط نسجل الخطأ
        } else if (status === 'TIMED_OUT') {

        } else if (status === 'CLOSED') {

        }
      });

    // إرجاع دالة لإلغاء الاشتراك
    return () => this.unsubscribeFromUserChanges(callback);
  }

  /**
   * 🎧 الاستماع لتغييرات جدول subscriptions
   */
  subscribeToSubscriptionChanges(userId: string, callback: SubscriptionChangeCallback) {

    // إضافة callback للقائمة
    this.subscriptionCallbacks.push(callback);

    // إذا كان هناك قناة نشطة، لا نحتاج لإنشاء واحدة جديدة
    if (this.subscriptionChannel) {

      return () => this.unsubscribeFromSubscriptionChanges(callback);
    }

    // إنشاء قناة جديدة
    this.subscriptionChannel = supabase
      .channel(`subscription-changes-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // جميع الأحداث
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {

          // استدعاء جميع callbacks المسجلة
          this.subscriptionCallbacks.forEach(cb => {
            try {
              cb(payload);
            } catch (error) {

            }
          });
        }
      )
      .subscribe((status) => {

        if (status === 'SUBSCRIBED') {

        } else if (status === 'CHANNEL_ERROR') {

        } else if (status === 'TIMED_OUT') {

        }
      });

    // إرجاع دالة لإلغاء الاشتراك
    return () => this.unsubscribeFromSubscriptionChanges(callback);
  }

  /**
   * 🔇 إلغاء الاستماع لتغييرات المستخدم
   */
  private unsubscribeFromUserChanges(callback: UserChangeCallback) {
    // إزالة callback من القائمة
    this.userCallbacks = this.userCallbacks.filter(cb => cb !== callback);

    // إذا لم يعد هناك callbacks، نلغي القناة
    if (this.userCallbacks.length === 0 && this.userChannel) {

      supabase.removeChannel(this.userChannel);
      this.userChannel = null;
    }
  }

  /**
   * 🔇 إلغاء الاستماع لتغييرات الاشتراك
   */
  private unsubscribeFromSubscriptionChanges(callback: SubscriptionChangeCallback) {
    // إزالة callback من القائمة
    this.subscriptionCallbacks = this.subscriptionCallbacks.filter(cb => cb !== callback);

    // إذا لم يعد هناك callbacks، نلغي القناة
    if (this.subscriptionCallbacks.length === 0 && this.subscriptionChannel) {

      supabase.removeChannel(this.subscriptionChannel);
      this.subscriptionChannel = null;
    }
  }

  /**
   * 🔇 إلغاء جميع الاشتراكات
   */
  unsubscribeAll() {

    if (this.userChannel) {
      supabase.removeChannel(this.userChannel);
      this.userChannel = null;
    }
    
    if (this.subscriptionChannel) {
      supabase.removeChannel(this.subscriptionChannel);
      this.subscriptionChannel = null;
    }
    
    this.userCallbacks = [];
    this.subscriptionCallbacks = [];
  }

  /**
   * 📊 الحصول على حالة الاتصال
   */
  getConnectionStatus() {
    return {
      userChannel: this.userChannel?.state || 'disconnected',
      subscriptionChannel: this.subscriptionChannel?.state || 'disconnected',
      userCallbacksCount: this.userCallbacks.length,
      subscriptionCallbacksCount: this.subscriptionCallbacks.length
    };
  }
}

// تصدير instance واحد
export const realtimeSyncService = new RealtimeSyncService();
