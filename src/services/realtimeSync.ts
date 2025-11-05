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
    console.log('🎧 بدء الاستماع لتغييرات المستخدم:', userId);
    
    // إضافة callback للقائمة
    this.userCallbacks.push(callback);

    // إذا كان هناك قناة نشطة، لا نحتاج لإنشاء واحدة جديدة
    if (this.userChannel) {
      console.log('✅ القناة موجودة بالفعل');
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
          console.log('⚡ تحديث فوري - تغيير في بيانات المستخدم:', payload);
          
          // استدعاء جميع callbacks المسجلة
          this.userCallbacks.forEach(cb => {
            try {
              cb(payload);
            } catch (error) {
              console.error('❌ خطأ في callback:', error);
            }
          });
        }
      )
      .subscribe((status) => {
        console.log('📡 حالة الاتصال بـ Realtime:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ تم الاشتراك بنجاح في تحديثات المستخدم');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ خطأ في الاتصال بـ Realtime - تجاهل الخطأ والمتابعة');
          // لا نوقف التطبيق - فقط نسجل الخطأ
        } else if (status === 'TIMED_OUT') {
          console.warn('⏱️ انتهت مهلة الاتصال بـ Realtime - سيعمل التطبيق بدون تحديثات فورية');
        } else if (status === 'CLOSED') {
          console.warn('🔌 تم إغلاق اتصال Realtime');
        }
      });

    // إرجاع دالة لإلغاء الاشتراك
    return () => this.unsubscribeFromUserChanges(callback);
  }

  /**
   * 🎧 الاستماع لتغييرات جدول subscriptions
   */
  subscribeToSubscriptionChanges(userId: string, callback: SubscriptionChangeCallback) {
    console.log('🎧 بدء الاستماع لتغييرات الاشتراك:', userId);
    
    // إضافة callback للقائمة
    this.subscriptionCallbacks.push(callback);

    // إذا كان هناك قناة نشطة، لا نحتاج لإنشاء واحدة جديدة
    if (this.subscriptionChannel) {
      console.log('✅ القناة موجودة بالفعل');
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
          console.log('⚡ تحديث فوري - تغيير في الاشتراك:', payload);
          
          // استدعاء جميع callbacks المسجلة
          this.subscriptionCallbacks.forEach(cb => {
            try {
              cb(payload);
            } catch (error) {
              console.error('❌ خطأ في callback:', error);
            }
          });
        }
      )
      .subscribe((status) => {
        console.log('📡 حالة الاتصال بـ Realtime (الاشتراك):', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ تم الاشتراك بنجاح في تحديثات الاشتراك');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ خطأ في الاتصال بـ Realtime (الاشتراك) - تجاهل الخطأ والمتابعة');
        } else if (status === 'TIMED_OUT') {
          console.warn('⏱️ انتهت مهلة الاتصال بـ Realtime (الاشتراك)');
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
      console.log('🔇 إلغاء الاشتراك في تحديثات المستخدم');
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
      console.log('🔇 إلغاء الاشتراك في تحديثات الاشتراك');
      supabase.removeChannel(this.subscriptionChannel);
      this.subscriptionChannel = null;
    }
  }

  /**
   * 🔇 إلغاء جميع الاشتراكات
   */
  unsubscribeAll() {
    console.log('🔇 إلغاء جميع الاشتراكات في Realtime');
    
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
