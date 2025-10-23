import { supabase } from '../config/supabaseClient';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  features: string[];
  is_active: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'pending' | 'active' | 'expired' | 'cancelled' | 'suspended';
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  subscription_id?: string;
  amount: number;
  currency: string;
  payment_method: string;
  status: string;
  transaction_id?: string;
  crypto_proof_image?: string;
  crypto_wallet_address?: string;
  admin_review_status: string;
  admin_review_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

class SubscriptionService {
  // جلب جميع باقات الاشتراك المتاحة
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('خطأ في جلب باقات الاشتراك:', error);
      return [];
    }
  }

  // إنشاء اشتراك جديد مع دفع
  async createSubscription(
    userInfo: any, 
    planInfo: any, 
    paymentMethod: string = 'paypal', 
    paymentStatus: string = 'completed', 
    paymentData?: any
  ): Promise<{ success: boolean; subscription?: any; payment?: any; paymentData?: any; error?: string }> {
    try {
      console.log('🔄 subscriptionService.createSubscription بدأ...', {
        userId: userInfo.id,
        planId: planInfo.id,
        paymentMethod,
        paymentStatus
      });

      // إنشاء الاشتراك
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + (planInfo.duration === 'شهري' ? 1 : 12));

      const subscriptionStatus = paymentStatus === 'completed' ? 'active' : 'pending';
      console.log('📝 إنشاء اشتراك بحالة:', subscriptionStatus);
      console.log('📤 بيانات الاشتراك المرسلة:', {
        user_id: userInfo.id,
        plan_id: planInfo.id,
        status: subscriptionStatus,
        start_date: new Date().toISOString(),
        end_date: endDate.toISOString()
      });

      // استخدام INSERT مباشر مع timeout protection
      const startDate = new Date().toISOString();
      const endDateStr = endDate.toISOString();
      
      console.log('🚀 استخدام INSERT مباشر...');
      
      // إنشاء promise مع timeout
      const insertWithTimeout = async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log('⏰ Timeout بعد 15 ثانية - إلغاء الطلب');
          controller.abort();
        }, 15000); // 15 ثانية
        
        try {
          const result = await supabase
            .from('subscriptions')
            .insert({
              user_id: userInfo.id,
              plan_id: planInfo.id,
              status: subscriptionStatus,
              start_date: startDate,
              end_date: endDateStr
            })
            .select()
            .abortSignal(controller.signal);
          
          clearTimeout(timeoutId);
          return result;
        } catch (error: any) {
          clearTimeout(timeoutId);
          if (error.name === 'AbortError') {
            throw new Error('Request timeout - الطلب استغرق وقتاً طويلاً');
          }
          throw error;
        }
      };
      
      let subscriptionResult;
      try {
        subscriptionResult = await insertWithTimeout();
        console.log('📥 رد Supabase:', { 
          hasData: !!subscriptionResult.data, 
          dataLength: subscriptionResult.data?.length || 0,
          hasError: !!subscriptionResult.error 
        });
      } catch (error: any) {
        console.error('❌ Exception في insertWithTimeout:', error.message);
        throw error;
      }
      
      const { data: subscriptions, error: subscriptionError } = subscriptionResult;
      const subscription = subscriptions?.[0];

      if (subscriptionError) {
        console.error('❌ خطأ في إنشاء الاشتراك:', subscriptionError);
        console.error('❌ تفاصيل الخطأ:', JSON.stringify(subscriptionError, null, 2));
        throw subscriptionError;
      }
      
      if (!subscription) {
        console.error('❌ لم يتم إرجاع بيانات الاشتراك');
        throw new Error('فشل في إنشاء الاشتراك - لا توجد بيانات');
      }
      
      console.log('✅ تم إنشاء الاشتراك:', subscription.id);
      console.log('📊 بيانات الاشتراك:', subscription);
      // Subscription created

      // إنشاء سجل الدفع
      const paymentRecord = {
        user_id: userInfo.id,
        subscription_id: subscription.id,
        amount: planInfo.price,
        currency: 'USD',
        payment_method: paymentMethod,
        status: paymentStatus,
        transaction_id: paymentData?.transactionId || `${paymentMethod.toUpperCase()}-${Date.now()}`,
        crypto_proof_image: paymentData?.proofImage || null,
        crypto_wallet_address: paymentData?.walletAddress || null,
        admin_review_status: paymentMethod.includes('crypto') || paymentMethod === 'bitcoin' ? 'pending' : 'approved'
      };

      console.log('💾 حفظ سجل الدفع:', {
        ...paymentRecord,
        crypto_proof_image: paymentRecord.crypto_proof_image ? `${paymentRecord.crypto_proof_image.substring(0, 50)}...` : null
      });

      // استخدام INSERT مباشر مع timeout protection
      console.log('🚀 استخدام INSERT مباشر للدفع...');
      
      const insertPaymentWithTimeout = async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log('⏰ Timeout للدفع بعد 15 ثانية - إلغاء الطلب');
          controller.abort();
        }, 15000); // 15 ثانية
        
        try {
          const result = await supabase
            .from('payments')
            .insert(paymentRecord)
            .select()
            .abortSignal(controller.signal);
          
          clearTimeout(timeoutId);
          return result;
        } catch (error: any) {
          clearTimeout(timeoutId);
          if (error.name === 'AbortError') {
            throw new Error('Payment timeout - حفظ الدفع استغرق وقتاً طويلاً');
          }
          throw error;
        }
      };
      
      let paymentResult;
      try {
        paymentResult = await insertPaymentWithTimeout();
        console.log('📥 رد Supabase للدفع:', { 
          hasData: !!paymentResult.data, 
          dataLength: paymentResult.data?.length || 0,
          hasError: !!paymentResult.error 
        });
      } catch (error: any) {
        console.error('❌ Exception في insertPaymentWithTimeout:', error.message);
        throw error;
      }
      
      const { data: payments, error: paymentError } = paymentResult;
      const payment = payments?.[0];

      if (paymentError) {
        console.error('❌ خطأ في حفظ الدفع:', paymentError);
        console.error('❌ تفاصيل الخطأ:', JSON.stringify(paymentError, null, 2));
        throw paymentError;
      }
      
      if (!payment) {
        console.error('❌ لم يتم إرجاع بيانات الدفع');
        throw new Error('فشل في حفظ الدفع - لا توجد بيانات');
      }
      
      console.log('✅ تم حفظ الدفع:', payment.id);
      console.log('📊 بيانات الدفع:', payment);
      // Payment record created

      // تحديث حالة المستخدم
      let userStatus = 'pending_payment';
      if (paymentMethod === 'paypal' || paymentMethod === 'credit_card') {
        if (paymentStatus === 'completed') {
          userStatus = 'active';
        }
      } else if (paymentMethod === 'bitcoin' || paymentMethod.includes('crypto')) {
        userStatus = 'payment_pending_review';
      }

      const { error: userUpdateError } = await supabase
        .from('users')
        .update({
          status: userStatus,
          subscription_status: paymentStatus === 'completed' ? 'active' : 'inactive',
          is_active: paymentStatus === 'completed' && (paymentMethod === 'paypal' || paymentMethod === 'credit_card')
        })
        .eq('id', userInfo.id);

      if (userUpdateError) {
        console.warn('⚠️ تحذير: فشل في تحديث حالة المستخدم:', userUpdateError);
        console.warn('⚠️ تفاصيل الخطأ:', JSON.stringify(userUpdateError, null, 2));
      } else {
        console.log('✅ تم تحديث حالة المستخدم بنجاح');
      }

      console.log('✅ subscriptionService.createSubscription نجح!', {
        subscriptionId: subscription.id,
        paymentId: payment.id,
        userStatus
      });

      return {
        success: true,
        subscription,
        payment,
        paymentData: payment
      };
    } catch (error) {
      console.error('❌ خطأ في إنشاء الاشتراك:', error);
      console.error('❌ نوع الخطأ:', typeof error);
      console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'N/A');
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error) || 'حدث خطأ غير متوقع'
      };
    }
  }

  // تأكيد الدفع (للمديرين)
  async confirmPayment(paymentId: string, adminId: string, approved: boolean, notes?: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 confirmPayment بدأ:', { paymentId, adminId, approved, notes });

      // تحديث حالة الدفع
      const updateData: any = {
        admin_review_status: approved ? 'approved' : 'rejected',
        admin_review_notes: notes,
        reviewed_at: new Date().toISOString(),
        status: approved ? 'completed' : 'failed'
      };
      
      // إضافة reviewed_by فقط إذا كان UUID صحيح
      if (adminId && adminId !== 'system' && adminId.length === 36) {
        updateData.reviewed_by = adminId;
      }
      
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .update(updateData)
        .eq('id', paymentId)
        .select('user_id,subscription_id')
        .single();

      if (paymentError) {
        console.error('❌ خطأ في تحديث الدفع:', paymentError);
        throw paymentError;
      }
      
      console.log('✅ تم تحديث الدفع:', payment);

      if (approved) {
        console.log('✅ موافقة - تفعيل الاشتراك والمستخدم');
        
        // تفعيل الاشتراك
        const { error: subscriptionError } = await supabase
          .from('subscriptions')
          .update({
            status: 'active'
          })
          .eq('id', payment.subscription_id);

        if (subscriptionError) {
          console.error('❌ خطأ في تفعيل الاشتراك:', subscriptionError);
          throw subscriptionError;
        }
        console.log('✅ تم تفعيل الاشتراك');

        // تفعيل المستخدم
        console.log('🔄 تحديث المستخدم:', payment.user_id);
        const { data: updatedUser, error: userError } = await supabase
          .from('users')
          .update({
            status: 'active',
            subscription_status: 'active',
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', payment.user_id)
          .select()
          .single();

        if (userError) {
          console.error('❌ خطأ في تفعيل المستخدم:', userError);
          throw userError;
        }
        console.log('✅ تم تفعيل المستخدم:', {
          id: updatedUser?.id,
          status: updatedUser?.status,
          subscription_status: updatedUser?.subscription_status,
          is_active: updatedUser?.is_active
        });

      } else {
        console.log('❌ رفض - إلغاء الاشتراك');
        
        // رفض الدفع - إلغاء الاشتراك
        const { error: subscriptionError } = await supabase
          .from('subscriptions')
          .update({
            status: 'cancelled'
          })
          .eq('id', payment.subscription_id);

        if (subscriptionError) {
          console.error('❌ خطأ في إلغاء الاشتراك:', subscriptionError);
          throw subscriptionError;
        }
        console.log('✅ تم إلغاء الاشتراك');

        // تحديث حالة المستخدم
        const { error: userError } = await supabase
          .from('users')
          .update({
            status: 'pending_payment',
            subscription_status: 'inactive',
            is_active: false
          })
          .eq('id', payment.user_id);

        if (userError) {
          console.error('❌ خطأ في تحديث المستخدم:', userError);
          throw userError;
        }
        console.log('✅ تم تحديث المستخدم');
      }

      console.log('✅ confirmPayment نجح!');
      return { success: true };
    } catch (error) {
      console.error('❌ خطأ في تأكيد الدفع:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'حدث خطأ في تأكيد الدفع'
      };
    }
  }

  // جلب المدفوعات المعلقة للمراجعة
  async getPendingPayments(): Promise<Payment[]> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          users!inner(id, username, email, full_name),
          subscriptions!inner(id, plan_id, subscription_plans!inner(name, price))
        `)
        .eq('admin_review_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('خطأ في جلب المدفوعات المعلقة:', error);
      return [];
    }
  }

  // جلب اشتراكات المستخدم
  async getUserSubscriptions(userId: string): Promise<Subscription[]> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          subscription_plans!inner(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('خطأ في جلب اشتراكات المستخدم:', error);
      return [];
    }
  }

  // التحقق من صحة الاشتراك
  async validateUserSubscription(userId: string): Promise<{ isValid: boolean; subscription?: Subscription }> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .gte('end_date', new Date().toISOString())
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return {
        isValid: !!data,
        subscription: data || undefined
      };
    } catch (error) {
      console.error('خطأ في التحقق من صحة الاشتراك:', error);
      return { isValid: false };
    }
  }

  // جلب جميع الاشتراكات (للمديرين)
  async getAllSubscriptions(): Promise<any[]> {
    try {
      console.log('🔍 جلب جميع الاشتراكات...');
      
      // استعلام مباشر مع join للحصول على بيانات المستخدمين والباقات
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          users:user_id (
            id,
            username,
            email,
            full_name
          ),
          subscription_plans:plan_id (
            name,
            name_ar,
            duration_months,
            price
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ subscriptionService: خطأ في الاستعلام:', error);
        console.error('تفاصيل الخطأ:', error.message);
        // إرجاع مصفوفة فارغة بدلاً من رمي خطأ
        return [];
      }
      
      console.log('✅ تم جلب الاشتراكات:', data?.length || 0);
      console.log('📊 البيانات:', data);
      
      // تنسيق البيانات
      const formattedData = data?.map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        user_email: item.users?.email || 'غير محدد',
        user_name: item.users?.full_name || item.users?.username || 'غير محدد',
        user_role: 'user',
        plan_name_ar: item.subscription_plans?.name_ar || 'غير محدد',
        plan_name: item.subscription_plans?.name || 'غير محدد',
        status: item.status,
        start_date: item.start_date,
        end_date: item.end_date,
        amount_paid: item.subscription_plans?.price || 0,
        currency: 'USD',
        days_remaining: this.calculateDaysRemaining(item.end_date),
        payment_method: item.payment_method || 'غير محدد',
        created_at: item.created_at,
        users: item.users,
        subscription_plans: item.subscription_plans
      })) || [];
      
      console.log('✅ البيانات المنسقة:', formattedData.length);
      return formattedData;
    } catch (error) {
      console.error('❌ subscriptionService: خطأ في جلب جميع الاشتراكات:', error);
      // إرجاع مصفوفة فارغة بدلاً من رمي خطأ لتجنب توقف التطبيق
      return [];
    }
  }
  
  // حساب الأيام المتبقية
  private calculateDaysRemaining(endDate: string): number {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  // تحديث الاشتراك
  async updateSubscription(subscriptionId: string, updates: any): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);

      if (error) throw error;

      // Subscription updated
      return { success: true };
    } catch (error) {
      console.error('❌ خطأ في تحديث الاشتراك:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'حدث خطأ في تحديث الاشتراك'
      };
    }
  }

  // إلغاء الاشتراك
  async cancelSubscription(subscriptionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);

      if (error) throw error;

      // Subscription cancelled
      return { success: true };
    } catch (error) {
      console.error('❌ خطأ في إلغاء الاشتراك:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'حدث خطأ في إلغاء الاشتراك'
      };
    }
  }
}

export const subscriptionService = new SubscriptionService();
export default subscriptionService;
