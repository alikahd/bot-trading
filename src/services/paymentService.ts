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
      console.log('✅ استخدام الـ cache:', this.paymentsCache.length);
      return this.paymentsCache;
    }
    
    try {
      console.log('🔍 جلب المدفوعات (مع retry)...');
      
      // محاولة 1: استعلام بسيط
      let payments = null;
      let error = null;
      
      try {
        // ✅ استعلام بسيط ومباشر - بدون retry معقد
        console.log('🚀 جلب المدفوعات مباشرة...');

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
          console.warn('⚠️ تعذر جلب معلومات المستخدمين، سيتم عرض المدفوعات بدون التفاصيل:', ue);
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

        console.log('📦 نتيجة الاستعلام:', {
          hasData: !!payments,
          dataLength: payments?.length || 0
        });

        if (payments && payments.length > 0) {
          console.log('✅ تم جلب المدفوعات:', payments.length);
        }
      } catch (e: any) {
        console.error('❌ فشلت المحاولة:', e.message);
        console.error('❌ تفاصيل الخطأ:', e);

        error = e;
        payments = null;
      }

      if (error) {
        console.error('❌ خطأ في جلب المدفوعات:', error);
        
        // إرجاع cache إذا موجود
        if (this.paymentsCache && this.paymentsCache.length > 0) {
          console.log('✅ استخدام البيانات المحفوظة مؤقتاً');
          return this.paymentsCache;
        }
        
        // إرجاع مصفوفة فارغة بدلاً من رسالة الصيانة
        console.log('⚠️ لا يوجد cache - إرجاع مصفوفة فارغة');
        return [];
      }

      if (!payments || payments.length === 0) {
        console.log('⚠️ لا توجد مدفوعات');
        return [];
      }

      console.log('✅ تم جلب المدفوعات:', payments.length);

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
      console.error('❌ Error fetching payments:', error);
      // إرجاع مصفوفة فارغة بدلاً من رمي خطأ
      return [];
    }
  }

  // تحديث حالة الدفع مع تفعيل الاشتراك تلقائياً
  async updatePaymentStatus(paymentId: string, status: 'pending' | 'completed' | 'failed' | 'reviewing'): Promise<void> {
    try {
      console.log('🔄 تحديث حالة الدفع:', { paymentId, status });
      
      const { data, error } = await supabase
        .rpc('update_payment_status_with_subscription', {
          payment_id: paymentId,
          new_status: status
        });

      if (error) {
        console.error('❌ خطأ في تحديث حالة الدفع:', error);
        throw error;
      }

      console.log('✅ تم تحديث حالة الدفع بنجاح مع تفعيل الاشتراك:', data);
      
      // إشعار إضافي للمدير وتفعيل المستخدم
      if (status === 'completed') {
        console.log('🎉 تم تفعيل الاشتراك تلقائياً!');
        await this.activateUserAccount(paymentId);
      } else if (status === 'failed') {
        console.log('❌ تم إلغاء الاشتراك تلقائياً!');
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  }

  // تفعيل حساب المستخدم عند قبول الدفع
  private async activateUserAccount(paymentId: string): Promise<void> {
    try {
      console.log('🔓 تفعيل حساب المستخدم للدفع:', paymentId);
      
      // جلب معرف المستخدم من الدفع
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select('user_id')
        .eq('id', paymentId)
        .single();

      if (paymentError || !payment) {
        console.error('❌ فشل في جلب بيانات الدفع:', paymentError);
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
        console.error('❌ فشل في تفعيل حساب المستخدم:', updateError);
        return;
      }

      console.log('✅ تم تفعيل حساب المستخدم بنجاح');
    } catch (error) {
      console.error('❌ خطأ في تفعيل حساب المستخدم:', error);
    }
  }

  // إنشاء دفع جديد
  async createPayment(paymentData: Partial<Payment>): Promise<Payment> {
    try {
      console.log('💳 إنشاء دفع جديد:', paymentData);
      
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
        console.error('❌ خطأ في إنشاء الدفع:', error);
        throw error;
      }

      // جلب الدفع المنشأ
      const { data: createdPayment, error: fetchError } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (fetchError) {
        console.error('❌ خطأ في جلب الدفع المنشأ:', fetchError);
        throw fetchError;
      }

      console.log('✅ تم إنشاء الدفع بنجاح:', paymentId);
      return createdPayment;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  }

  // رفع صورة تأكيد الدفع
  async uploadPaymentProof(paymentId: string, file: File): Promise<string> {
    try {
      console.log('📤 بدء رفع صورة تأكيد الدفع...');
      console.log('🔍 معرف الدفع:', paymentId);
      console.log('📁 تفاصيل الملف:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: new Date(file.lastModified).toISOString()
      });
      
      // رفع الصورة إلى Supabase Storage
      const fileName = `payment-proofs/${paymentId}-${Date.now()}.${file.name.split('.').pop()}`;
      console.log('📂 اسم الملف المولد:', fileName);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, file);

      if (uploadError) {
        console.error('❌ خطأ في رفع الصورة:', uploadError);
        console.error('🔍 تفاصيل الخطأ:', {
          message: uploadError.message,
          name: uploadError.name,
          stack: uploadError.stack
        });
        throw uploadError;
      }

      console.log('✅ تم رفع الصورة بنجاح:', uploadData);

      // الحصول على رابط الصورة
      const { data: urlData } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(fileName);

      const imageUrl = urlData.publicUrl;
      console.log('🔗 رابط الصورة المولد:', imageUrl);

      // تحديث الدفع بمعلومات الصورة
      console.log('🔄 تحديث قاعدة البيانات...');
      const { data: updateData, error: updateError } = await supabase
        .from('payments')
        .update({ 
          proof_image: imageUrl,
          status: 'reviewing',
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId)
        .select();

      if (updateError) {
        console.error('❌ خطأ في تحديث معلومات الصورة:', updateError);
        throw updateError;
      }

      console.log('✅ تم تحديث قاعدة البيانات بنجاح:', updateData);
      console.log('✅ تم رفع صورة تأكيد الدفع بنجاح');
      return imageUrl;
    } catch (error) {
      console.error('Error uploading payment proof:', error);
      throw error;
    }
  }

  // حساب إحصائيات المدفوعات
  async getPaymentStats(): Promise<PaymentStats> {
    try {
      console.log('📊 حساب إحصائيات المدفوعات...');
      
      const { data, error } = await supabase
        .rpc('get_payment_statistics');

      if (error) {
        console.error('❌ خطأ في حساب الإحصائيات:', error);
        throw error;
      }

      console.log('✅ تم حساب الإحصائيات بنجاح:', data);
      return data;
    } catch (error) {
      console.error('Error calculating payment stats:', error);
      throw error;
    }
  }

  // جلب صورة إثبات الدفع لدفعة معينة
  async getPaymentProofImage(paymentId: string): Promise<{ crypto_proof_image?: string; proof_image?: string } | null> {
    try {
      console.log('🖼️ جلب صورة إثبات الدفع:', paymentId);
      
      const { data, error } = await supabase
        .from('payments')
        .select('crypto_proof_image,proof_image')
        .eq('id', paymentId)
        .single();
      
      if (error) {
        console.error('❌ خطأ في جلب الصورة:', error);
        return null;
      }
      
      console.log('✅ تم جلب الصورة بنجاح');
      return data;
    } catch (error) {
      console.error('Error fetching payment proof image:', error);
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
      console.error('Error searching payments:', error);
      throw error;
    }
  }

  // التحقق من حالة دفع مستخدم معين
  async checkUserPaymentStatus(userId: string, paymentId?: string): Promise<{ status: string; message?: string; paymentId?: string }> {
    try {
      console.log('🔍 التحقق من حالة دفع المستخدم:', userId);
      
      // 1) إذا توفّر paymentId استخدمه مباشرة (أخف وأسرع)
      let paymentData: any = null;
      let paymentError: any = null;
      if (paymentId) {
        console.log('🎯 التحقق بواسطة paymentId المباشر:', paymentId);
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

        console.log('🔍 استعلام الدفع عبر RPC');
        console.log('📦 البيانات المستلمة:', paymentData);

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
        console.error('❌ خطأ في جلب حالة الدفع:', paymentError);
        return { status: 'pending', message: 'لم يتم العثور على دفعات' };
      }

      // لا حاجة لجلب بيانات المستخدم لكل تحقق، نقرر الحالة من الدفع مباشرة
      console.log('📊 بيانات الدفع:', {
        payment_status: paymentData.status,
        admin_review_status: paymentData.admin_review_status,
        payment_id: paymentData.id
      });

      // التحقق من حالة المراجعة والمستخدم
      if (paymentData.admin_review_status === 'approved' || paymentData.status === 'completed') {
        console.log('✅ الدفع موافق عليه والمستخدم نشط');
        return { 
          status: 'approved', 
          message: paymentData.admin_review_notes || 'تمت الموافقة على دفعتك بنجاح',
          paymentId: paymentData.id
        };
      } else if (paymentData.admin_review_status === 'rejected' || paymentData.status === 'failed') {
        console.log('❌ الدفع مرفوض');
        return { 
          status: 'rejected', 
          message: paymentData.admin_review_notes || 'تم رفض دفعتك. يرجى التواصل مع الدعم',
          paymentId: paymentData.id
        };
      } else {
        console.log('⏳ الدفع قيد المراجعة');
        return { 
          status: 'pending', 
          message: 'دفعتك قيد المراجعة من قبل الإدارة',
          paymentId: paymentData.id
        };
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      return { status: 'pending', message: 'حدث خطأ في التحقق من الحالة' };
    }
  }
}

export const paymentService = new PaymentService();
