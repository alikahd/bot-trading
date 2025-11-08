import { supabase } from '../config/supabaseClient';

export interface Payment {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  plan_name_ar?: string;
  plan_name?: string;
  amount: number;
  currency: string;
  payment_method: 'paypal' | 'card' | 'crypto' | 'bitcoin' | 'usdt';
  status: 'pending' | 'completed' | 'failed' | 'reviewing' | 'crypto_pending' | 'crypto_approved' | 'crypto_rejected' | 'processing' | 'cancelled';
  payment_reference?: string;
  proof_image?: string;
  crypto_proof_image?: string;
  admin_review_status?: string;
  subscription_id?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentStats {
  total: number;
  pending: number;
  reviewing: number;
  completed: number;
  failed: number;
  totalRevenue: number;
}

class PaymentService {
  private paymentsCache: Payment[] | null = null;
  private cacheTimestamp: number = 0;
  private cacheDuration: number = 5000; // 5 ثوانٍ (Realtime يحدث فوراً)

  // مسح الـ cache
  clearCache() {
    this.paymentsCache = null;
    this.cacheTimestamp = 0;
  }

  // جلب جميع المدفوعات مع معلومات المستخدمين والباقات
  async getAllPayments(noCache: boolean = false): Promise<Payment[]> {
    // استخدام الـ cache إذا كان حديثاً
    const now = Date.now();
    if (!noCache && this.paymentsCache && (now - this.cacheTimestamp) < this.cacheDuration) {

      return this.paymentsCache;
    }
    
    try {

      // محاولة 1: استعلام بسيط
      let payments = null;
      let error = null;
      
      try {
        // ✅ استعلام بسيط ومباشر - بدون retry معقد

        const { data: paymentsData, error: paymentsError } = await supabase
          .from('payments')
          .select('id,user_id,subscription_id,amount,currency,payment_method,status,payment_reference,admin_review_status,crypto_wallet_address,admin_review_notes,reviewed_by,reviewed_at,created_at,updated_at')
          .order('created_at', { ascending: false })
          .limit(50); // حد معقول

        if (paymentsError) {
          throw paymentsError;
        }

        // جلب معلومات المستخدمين بشكل منفصل (اختياري)
        let usersMap = new Map<string, any>();
        try {
          const userIds = [...new Set(paymentsData.map((p: any) => p.user_id).filter(Boolean))];
          if (userIds.length > 0) {
            const { data: usersData, error: usersErr } = await supabase
              .from('users')
              .select('id, username, email, full_name')
              .in('id', userIds);
            if (!usersErr && usersData) {
              usersMap = new Map(usersData.map((u: any) => [u.id, u]));
            }
          }
        } catch (ue) {

        }

        // دمج البيانات
        payments = (paymentsData || []).map((p: any) => {
          const user = usersMap.get(p.user_id);
          return {
            ...p,
            user_username: user?.username,
            user_email: user?.email,
            user_full_name: user?.full_name
          };
        });

        error = null;

        if (payments && payments.length > 0) {

        }
      } catch (e: any) {

        error = e;
        payments = null;
      }

      if (error) {

        // إرجاع cache إذا موجود
        if (this.paymentsCache && this.paymentsCache.length > 0) {

          return this.paymentsCache;
        }
        
        // إرجاع مصفوفة فارغة بدلاً من رسالة الصيانة

        return [];
      }

      if (!payments || payments.length === 0) {

        return [];
      }

      // تنسيق البيانات (بدون الصور - سيتم جلبها عند الحاجة)
      const formattedPayments = payments.map((p: any) => ({
        id: p.id,
        user_id: p.user_id,
        user_name: p.user_full_name || p.user_username || 'مستخدم',
        user_email: p.user_email || '-',
        subscription_id: p.subscription_id,
        plan_id: null,
        plan_name: '-',
        plan_name_ar: '-',
        amount: Number(p.amount) || 0,
        currency: p.currency || 'USD',
        payment_method: p.payment_method,
        status: p.status || 'pending',
        transaction_id: p.transaction_id,
        payment_reference: p.payment_reference,
        admin_review_status: p.admin_review_status || 'pending',
        admin_review_notes: p.admin_review_notes,
        crypto_wallet_address: p.crypto_wallet_address,
        reviewed_by: p.reviewed_by,
        reviewed_at: p.reviewed_at,
        created_at: p.created_at,
        updated_at: p.updated_at
      }));

      // تحديث الـ cache
      this.paymentsCache = formattedPayments;
      this.cacheTimestamp = Date.now();

      return formattedPayments;
    } catch (error) {

      // إرجاع مصفوفة فارغة بدلاً من رمي خطأ
      return [];
    }
  }

  // تحديث حالة الدفع مع تفعيل الاشتراك تلقائياً
  async updatePaymentStatus(paymentId: string, status: 'pending' | 'completed' | 'failed' | 'reviewing'): Promise<void> {
    try {

      const { error } = await supabase
        .rpc('update_payment_status_with_subscription', {
          payment_id: paymentId,
          new_status: status
        });

      if (error) {

        throw error;
      }

      // إشعار إضافي للمدير وتفعيل المستخدم
      if (status === 'completed') {

        await this.activateUserAccount(paymentId);
      } else if (status === 'failed') {

      }
    } catch (error) {

      throw error;
    }
  }

  // تفعيل حساب المستخدم عند قبول الدفع
  private async activateUserAccount(paymentId: string): Promise<void> {
    try {

      // جلب معرف المستخدم من الدفع
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select('user_id')
        .eq('id', paymentId)
        .single();

      if (paymentError || !payment) {

        return;
      }

      // تفعيل حساب المستخدم
      const { error: updateError } = await supabase
        .from('users')
        .update({
          is_active: true,
          status: 'active',
          subscription_status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.user_id);

      if (updateError) {

        return;
      }

    } catch (error) {

    }
  }

  // إنشاء دفع جديد
  async createPayment(paymentData: Partial<Payment>): Promise<Payment> {
    try {

      const { data: paymentId, error } = await supabase
        .rpc('create_payment', {
          p_user_id: paymentData.user_id,
          p_subscription_id: paymentData.subscription_id,
          p_amount: paymentData.amount,
          p_currency: paymentData.currency || 'USD',
          p_payment_method: paymentData.payment_method || 'card',
          p_payment_reference: paymentData.payment_reference
        });

      if (error) {

        throw error;
      }

      // جلب الدفع المنشأ
      const { data: createdPayment, error: fetchError } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (fetchError) {

        throw fetchError;
      }

      return createdPayment;
    } catch (error) {

      throw error;
    }
  }

  // رفع صورة تأكيد الدفع
  async uploadPaymentProof(paymentId: string, file: File): Promise<string> {
    try {

      // رفع الصورة إلى Supabase Storage
      const fileName = `payment-proofs/${paymentId}-${Date.now()}.${file.name.split('.').pop()}`;

      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, file);

      if (uploadError) {

        throw uploadError;
      }

      // الحصول على رابط الصورة
      const { data: urlData } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      // تحديث الدفع بمعلومات الصورة

      const { error: updateError } = await supabase
        .from('payments')
        .update({ receipt_url: publicUrl })
        .eq('id', paymentId)
        .select();

      if (updateError) {

        throw updateError;
      }

      return publicUrl;
    } catch (error) {

      throw error;
    }
  }

  // حساب إحصائيات المدفوعات
  async getPaymentStats(): Promise<PaymentStats> {
    try {

      const { data, error } = await supabase
        .rpc('get_payment_statistics');

      if (error) {

        throw error;
      }

      return data;
    } catch (error) {

      throw error;
    }
  }

  // جلب صورة إثبات الدفع لدفعة معينة
  async getPaymentProofImage(paymentId: string): Promise<{ crypto_proof_image?: string; proof_image?: string } | null> {
    try {

      const { data, error } = await supabase
        .from('payments')
        .select('crypto_proof_image,proof_image')
        .eq('id', paymentId)
        .single();
      
      if (error) {

        return null;
      }

      return data;
    } catch (error) {

      return null;
    }
  }

  // البحث في المدفوعات
  async searchPayments(searchTerm: string, statusFilter?: string, methodFilter?: string): Promise<Payment[]> {
    try {
      const allPayments = await this.getAllPayments();
      
      return allPayments.filter(payment => {
        const matchesSearch = !searchTerm || 
          payment.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.payment_reference?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = !statusFilter || statusFilter === 'all' || payment.status === statusFilter;
        const matchesMethod = !methodFilter || methodFilter === 'all' || payment.payment_method === methodFilter;
        
        return matchesSearch && matchesStatus && matchesMethod;
      });
    } catch (error) {

      throw error;
    }
  }

  // التحقق من حالة دفع مستخدم معين
  async checkUserPaymentStatus(userId: string, paymentId?: string): Promise<{ status: string; message?: string; paymentId?: string }> {
    try {

      // 1) إذا توفّر paymentId استخدمه مباشرة (أخف وأسرع)
      let paymentData: any = null;
      let paymentError: any = null;
      if (paymentId) {

        const byId = await supabase
          .from('payments')
          .select('id, user_id, status, admin_review_status, admin_review_notes, created_at, updated_at')
          .eq('id', paymentId)
          .maybeSingle();
        paymentData = byId.data;
        paymentError = byId.error;
      }

      // 2) إن لم يُعثر أو لم يُمرر paymentId، استخدم RPC ثم آخر دفع للمستخدم
      if (!paymentData) {
        // استخدام RPC لتجنب الـ cache
        let { data: paymentDataArray, error: rpcError } = await supabase
          .rpc('get_user_payment_status', { p_user_id: userId });
        paymentError = rpcError;
        paymentData = paymentDataArray && paymentDataArray.length > 0 ? paymentDataArray[0] : null;

        // إذا لم يوجد، جلب آخر دفع بشكل عام
        if (!paymentData) {
          const result = await supabase
            .from('payments')
            .select('id, user_id, status, admin_review_status, admin_review_notes, created_at, updated_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          paymentData = result.data;
          paymentError = result.error;
        }
      }

      if (paymentError || !paymentData) {

        return { status: 'pending', message: 'لم يتم العثور على دفعات' };
      }

      // لا حاجة لجلب بيانات المستخدم لكل تحقق، نقرر الحالة من الدفع مباشرة

      // التحقق من حالة المراجعة والمستخدم
      if (paymentData.admin_review_status === 'approved' || paymentData.status === 'completed') {

        return { 
          status: 'approved', 
          message: paymentData.admin_review_notes || 'تمت الموافقة على دفعتك بنجاح',
          paymentId: paymentData.id
        };
      } else if (paymentData.admin_review_status === 'rejected' || paymentData.status === 'failed') {

        return { 
          status: 'rejected', 
          message: paymentData.admin_review_notes || 'تم رفض دفعتك. يرجى التواصل مع الدعم',
          paymentId: paymentData.id
        };
      } else {

        return { 
          status: 'pending', 
          message: 'دفعتك قيد المراجعة من قبل الإدارة',
          paymentId: paymentData.id
        };
      }
    } catch (error) {

      return { status: 'pending', message: 'حدث خطأ في التحقق من الحالة' };
    }
  }
}

export const paymentService = new PaymentService();
