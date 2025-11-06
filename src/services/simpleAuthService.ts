import { emailService } from './emailService';
import { supabase } from '../config/supabaseClient';
import { realtimeSyncService } from './realtimeSync';
import React from 'react';

// اكتشاف الجهاز المحمول
const isMobile = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// الأنواع البسيطة
export interface User {
  id: string;
  auth_id: string;
  username: string;
  email: string;
  full_name: string;
  country?: string;
  role: 'admin' | 'trader';
  is_active: boolean;
  email_verified: boolean;
  status: string;
  subscription_status?: string;
  subscription_end_date?: string;
  trial_end_date?: string;
  is_trial?: boolean;
  trading_settings?: any;
  last_login?: string;
  created_at: string;
  updated_at?: string;
  redirectTo?: 'email_verification' | 'subscription' | 'payment_pending' | 'blocked' | null;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
}

class SimpleAuthService {
  private authState: AuthState = {
    isAuthenticated: false,
    isLoading: true,
    user: null
  };
  private listeners: ((state: AuthState) => void)[] = [];

  constructor() {
    this.initialize();
  }

  // إضافة مستمع للتغييرات
  addListener(listener: (state: AuthState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // تحديث حالة المصادقة
  private updateAuthState(newState: Partial<AuthState>) {
    this.authState = { ...this.authState, ...newState };
    this.listeners.forEach(listener => listener(this.authState));
  }

  // تهيئة الخدمة
  async initialize() {
    try {
      // Initialize auth service
      
      // محاولة تحميل الحالة من localStorage أولاً للسرعة
      const cachedState = localStorage.getItem('auth_state_cache');
      if (cachedState) {
        try {
          const parsed = JSON.parse(cachedState);
          // تطبيق الحالة المخزنة مؤقتاً
          this.updateAuthState({
            isAuthenticated: parsed.isAuthenticated,
            user: parsed.user,
            isLoading: false
          });
          
          // إذا كان هناك cache، نتحقق من الجلسة في الخلفية
          this.verifySessionInBackground();
          return;
        } catch (e) {
          // تجاهل أخطاء التحليل
        }
      }
      
      // إذا لم يكن هناك cache، نحمل الجلسة مباشرة مع timeout أطول للهاتف
      const sessionPromise = supabase.auth.getSession();
      const timeoutDuration = isMobile() ? 10000 : 5000; // 10 ثوانٍ للهاتف، 5 للكمبيوتر
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session timeout')), timeoutDuration)
      );
      
      let session, error;
      try {
        const result = await Promise.race([sessionPromise, timeoutPromise]) as any;
        session = result.data?.session;
        error = result.error;
      } catch (timeoutError) {
        // Timeout - نحاول مرة أخرى للهاتف
        console.warn('⏱️ Session timeout - محاولة ثانية...');
        
        if (isMobile()) {
          try {
            const { data, error: retryError } = await supabase.auth.getSession();
            if (!retryError && data?.session) {
              session = data.session;
              error = null;
            } else {
              this.updateAuthState({ isAuthenticated: false, user: null, isLoading: false });
              return;
            }
          } catch (e) {
            this.updateAuthState({ isAuthenticated: false, user: null, isLoading: false });
            return;
          }
        } else {
          this.updateAuthState({ isAuthenticated: false, user: null, isLoading: false });
          return;
        }
      }
      
      if (error) {
        // Session error
        
        if (isMobile() && error.message?.includes('session')) {
          // Retry session
          await new Promise(resolve => setTimeout(resolve, 300));
          
          const { data: { session: retrySession }, error: retryError } = await supabase.auth.getSession();
          if (!retryError && retrySession?.user) {
            // Session retry success
            await this.loadUserData(retrySession.user.id);
            return;
          }
        }
        
        this.updateAuthState({ isAuthenticated: false, user: null, isLoading: false });
        return;
      }

      if (session?.user) {
        // Session found
        await this.loadUserData(session.user.id);
      } else {
        // No session
        this.updateAuthState({ isAuthenticated: false, user: null, isLoading: false });
      }

      // الاستماع لتغييرات المصادقة
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('🔔 Auth state changed:', event, session?.user?.email);
        
        if (event === 'SIGNED_IN' && session?.user) {
          // Signed in
          console.log('✅ تسجيل دخول ناجح عبر:', session.user.app_metadata?.provider || 'email');
          
          // ⚡ التحقق من وجود المستخدم في public.users (خاصة لـ OAuth)
          const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('auth_id', session.user.id)
            .maybeSingle();
          
          if (!existingUser) {
            console.log('⚠️ المستخدم غير موجود في public.users - إنشاء سجل جديد...');
            
            // إنشاء سجل للمستخدم (OAuth users)
            const { error: insertError } = await supabase
              .from('users')
              .insert({
                auth_id: session.user.id,
                email: session.user.email,
                username: session.user.user_metadata?.username || session.user.email?.split('@')[0],
                full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0],
                role: 'trader',
                is_active: true,
                email_verified: true, // OAuth users have verified email
                status: 'pending_subscription',
                subscription_status: 'inactive'
              });
            
            if (insertError) {
              console.error('❌ خطأ في إنشاء المستخدم:', insertError);
            } else {
              console.log('✅ تم إنشاء سجل المستخدم بنجاح');
            }
          }
          
          // انتظار إضافي للهاتف المحمول
          if (isMobile()) {
            await new Promise(resolve => setTimeout(resolve, 50));
          }
          
          await this.loadUserData(session.user.id);
          
          // ✅ إرسال إشعار ترحيبي عند أول تسجيل دخول (OAuth أو Email/Password)
          if (this.authState.user?.id && this.authState.user?.subscription_status === 'active') {
            (async () => {
              try {
                const { data: userData } = await supabase
                  .from('users')
                  .select('id, subscription_status')
                  .eq('auth_id', session.user.id)
                  .single();

                if (!userData || userData.subscription_status !== 'active') {
                  return;
                }

                const { data: existingWelcome } = await supabase
                  .from('notifications')
                  .select('id')
                  .eq('recipient_id', userData.id)
                  .ilike('title_ar', '%مرحباً بك%')
                  .limit(1);

                if (!existingWelcome || existingWelcome.length === 0) {
                  // ✅ التحقق من نوع الاشتراك (جديد أم تجديد)
                  const { data: previousSubs } = await supabase
                    .from('subscriptions')
                    .select('id')
                    .eq('user_id', userData.id)
                    .order('created_at', { ascending: false })
                    .limit(2);
                  
                  const isRenewal = !!(previousSubs && previousSubs.length > 1);
                  
                  console.log('📧 إرسال إشعار ترحيبي فوري (OAuth)...');
                  const { adminNotificationService } = await import('./adminNotificationService');
                  await adminNotificationService.sendWelcomeNotification(userData.id, isRenewal);
                  console.log(`✅ تم إرسال الإشعار الترحيبي ${isRenewal ? '(تجديد)' : '(جديد)'}`);
                  
                  // ✅ إرسال إشعار نظام الإحالة بعد 30 ثانية (للمستخدمين الجدد فقط)
                  if (!isRenewal) {
                    setTimeout(async () => {
                      try {
                        console.log('📧 إرسال إشعار نظام الإحالة (بعد 30 ثانية - OAuth)...');
                        await supabase
                          .from('notifications')
                          .insert({
                            recipient_id: userData.id,
                            recipient_type: 'user',
                            type: 'referral_welcome',
                            title: '🎉 Earn up to $5000 monthly!',
                            title_ar: '🎉 اربح حتى $5000 شهرياً!',
                            title_fr: '🎉 Gagnez jusqu\'à $5000 par mois!',
                            message: '🚀 Invite your friends and earn amazing commissions! Each friend who subscribes = commission for you. Your monthly salary from commissions can reach more than $5000! 💰 Start now and share your referral link.',
                            message_ar: '🚀 ادعُ أصدقاءك واربح عمولات مذهلة! كل صديق يشترك = عمولة لك. راتبك الشهري من العمولات قد يصل إلى أكثر من $5000! 💰 ابدأ الآن وشارك رابط الإحالة الخاص بك.',
                            message_fr: '🚀 Invitez vos amis et gagnez des commissions incroyables! Chaque ami qui s\'inscrit = commission pour vous. Votre salaire mensuel peut atteindre plus de $5000! 💰 Commencez maintenant et partagez votre lien de parrainage.',
                            priority: 'high',
                            is_read: false,
                            action_type: 'navigate',
                            action_url: '/referral',
                            action_data: {
                              feature: 'referral_program',
                              potential_earnings: 5000
                            }
                          });
                        
                        console.log('✅ تم إرسال إشعار نظام الإحالة (OAuth)');
                      } catch (referralError) {
                        console.error('⚠️ فشل إرسال إشعار الإحالة (غير حرج):', referralError);
                      }
                    }, 30000); // 30 ثانية
                  }
                }
              } catch (notifError) {
                console.error('⚠️ فشل إرسال الإشعار الترحيبي (غير حرج):', notifError);
              }
            })();
          }
          
          // ⚡ تفعيل Realtime فوراً
          if (this.authState.user?.id) {
            console.log('⚡ تفعيل Realtime للمزامنة الفورية...');
            
            realtimeSyncService.subscribeToUserChanges(
              this.authState.user.id,
              async (_payload) => {
                console.log('🔔 تحديث فوري - تغيير في بيانات المستخدم');
                await this.refreshUserData();
              }
            );
            
            realtimeSyncService.subscribeToSubscriptionChanges(
              this.authState.user.id,
              async (_payload) => {
                console.log('🔔 تحديث فوري - تغيير في الاشتراك');
                await this.refreshUserData();
              }
            );
          }
        } 
        else if (event === 'USER_UPDATED' && session?.user) {
          // تحديث المستخدم - قد يكون بسبب تفعيل البريد
          console.log('👤 User updated, checking email verification...');
          
          // التحقق من تفعيل البريد
          if (session.user.email_confirmed_at) {
            console.log('✅ Email confirmed at:', session.user.email_confirmed_at);
            
            // تحديث قاعدة البيانات
            const { error: updateError } = await supabase
              .from('users')
              .update({
                email_verified: true,
                status: 'pending_subscription',
                email_verified_at: session.user.email_confirmed_at,
                updated_at: new Date().toISOString()
              })
              .eq('auth_id', session.user.id);
            
            if (updateError) {
              console.error('❌ Error updating user:', updateError);
            } else {
              console.log('✅ User updated successfully');
              // إعادة تحميل بيانات المستخدم
              await this.loadUserData(session.user.id);
              
              // ⚡ توجيه المستخدم مباشرة لصفحة الاشتراك بعد تفعيل البريد
              console.log('🎯 توجيه المستخدم لصفحة الاشتراك...');
              
              // تعيين علامة في localStorage للتوجيه
              localStorage.setItem('email_just_verified', 'true');
              
              // إطلاق حدث مخصص لإخبار التطبيق
              window.dispatchEvent(new CustomEvent('email-verified', {
                detail: { userId: session.user.id }
              }));
            }
          }
        }
        else if (event === 'SIGNED_OUT') {
          // Signed out
          this.updateAuthState({ isAuthenticated: false, user: null, isLoading: false });
          // حذف الحالة المخزنة
          localStorage.removeItem('auth_state_cache');
        }
      });

    } catch (error) {
      // Init error
      this.updateAuthState({ isAuthenticated: false, user: null, isLoading: false });
    }
  }

  // التحقق من الجلسة في الخلفية (بدون تعطيل التطبيق)
  private async verifySessionInBackground(): Promise<void> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session?.user) {
        // الجلسة غير صالحة، نحذف الـ cache
        localStorage.removeItem('auth_state_cache');
        this.updateAuthState({ isAuthenticated: false, user: null, isLoading: false });
        return;
      }
      
      // الجلسة صالحة، نحدث البيانات
      await this.loadUserData(session.user.id);
    } catch (error) {
      // خطأ في التحقق، نبقي على الـ cache
    }
  }

  // تحميل بيانات المستخدم
  private async loadUserData(authId: string): Promise<void> {
    try {
      // Load user data
      console.log('📥 جاري تحميل بيانات المستخدم...', authId);
      
      // للهاتف: محاولة مع timeout
      const isMobileDevice = isMobile();
      let data, error;
      
      if (isMobileDevice) {
        // محاولة مع timeout للهاتف
        const loadPromise = supabase
          .from('users')
          .select('*')
          .eq('auth_id', authId)
          .maybeSingle();
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Load timeout')), 10000)
        );
        
        try {
          const result = await Promise.race([loadPromise, timeoutPromise]) as any;
          data = result.data;
          error = result.error;
        } catch (timeoutError) {
          console.warn('⏱️ Timeout في تحميل البيانات - محاولة ثانية...');
          const retryResult = await supabase
            .from('users')
            .select('*')
            .eq('auth_id', authId)
            .maybeSingle();
          data = retryResult.data;
          error = retryResult.error;
        }
      } else {
        // للكمبيوتر: الطريقة العادية
        const result = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', authId)
          .maybeSingle();
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('❌ خطأ في تحميل بيانات المستخدم:', error);
        // إذا كان المستخدم محذوف من جدول users، نسجل خروجه من Auth أيضاً
        await supabase.auth.signOut();
        this.updateAuthState({ isAuthenticated: false, user: null, isLoading: false });
        localStorage.removeItem('auth_state_cache');
        return;
      }

      // إذا لم يوجد المستخدم في جدول users (محذوف)
      if (!data) {
        console.warn('⚠️ المستخدم موجود في Auth لكن محذوف من جدول users');
        // تسجيل خروج من Auth
        await supabase.auth.signOut();
        this.updateAuthState({ isAuthenticated: false, user: null, isLoading: false });
        localStorage.removeItem('auth_state_cache');
        alert('هذا الحساب محذوف. يرجى التسجيل من جديد.');
        return;
      }

      if (data) {
        // User data loaded successfully
        console.log('✅ تم تحميل بيانات المستخدم:', data.email, '- الحالة:', data.status);
        
        // التأكد من أن المستخدم Admin يمكنه الوصول
        if (data.role === 'admin') {
          // Admin recognized
        }
        
        // تحديد إلى أين يجب توجيه المستخدم بناءً على حالته
        let redirectTo = null;
        
        console.log('🔍 تحديد redirectTo للمستخدم:', {
          email: data.email,
          email_verified: data.email_verified,
          status: data.status,
          subscription_status: data.subscription_status,
          is_active: data.is_active
        });
        
        // Admin دائماً يدخل
        const isAdmin = data.role === 'admin';
        
        // 1. إذا كان البريد غير مفعل
        if (!data.email_verified && !isAdmin) {
          console.log('❌ البريد غير مفعل → email_verification');
          redirectTo = 'email_verification';
        }
        // 2. إذا كان الحساب محظور
        else if ((data.status === 'suspended' || data.status === 'cancelled') && !isAdmin) {
          console.log('🚫 الحساب محظور → blocked');
          redirectTo = 'blocked';
        }
        // 3. إذا كان الدفع في انتظار المراجعة
        else if (data.status === 'payment_pending_review' && !isAdmin) {
          console.log('⏳ الدفع قيد المراجعة → payment_pending');
          redirectTo = 'payment_pending';
        }
        // 4. إذا كان المستخدم مشترك ونشط → دخول مباشر للوحة التحكم
        else if (isAdmin || 
                 data.status === 'active' || 
                 data.subscription_status === 'active' || 
                 (data.is_active && data.status !== 'pending_subscription')) {
          console.log('✅ المستخدم نشط → دخول مباشر للوحة التحكم');
          redirectTo = null; // دخول مباشر
          
          // مسح أي بيانات اشتراك قديمة من localStorage
          localStorage.removeItem('show_subscription_page');
          localStorage.removeItem('subscription_step');
          localStorage.removeItem('selected_plan');
        }
        // 5. فقط المستخدمين الذين يحتاجون فعلاً للاشتراك
        else if (data.status === 'pending_subscription' || 
                 (data.subscription_status !== 'active' && data.status !== 'active' && !data.is_active)) {
          console.log('📦 يحتاج اشتراك → subscription');
          redirectTo = 'subscription';
        }
        // 6. حالة احتياطية للمستخدمين الذين لا يتطابقون مع الشروط
        else {
          console.log('🔄 حالة احتياطية → دخول مباشر للوحة التحكم');
          redirectTo = null; // دخول مباشر
        }
        
        console.log('✅ redirectTo النهائي:', redirectTo);
        
        const userWithRedirect = { ...data, redirectTo } as User;
        const newState = { 
          isAuthenticated: true, 
          user: userWithRedirect, 
          isLoading: false 
        };
        this.updateAuthState(newState);
        
        // حفظ الحالة في localStorage للتحميل السريع (مع redirectTo)
        localStorage.setItem('auth_state_cache', JSON.stringify({
          isAuthenticated: true,
          user: userWithRedirect,
          timestamp: Date.now() // إضافة timestamp للتحقق من صلاحية الـ cache
        }));
      } else {
        // User not found
        this.updateAuthState({ isAuthenticated: false, user: null, isLoading: false });
        localStorage.removeItem('auth_state_cache');
      }
    } catch (error) {
      // General load error
      this.updateAuthState({ isAuthenticated: false, user: null, isLoading: false });
      localStorage.removeItem('auth_state_cache');
    }
  }

  // تسجيل الدخول مع التحقق من الاشتراك
  async login(credentials: { username: string; password: string }): Promise<{ success: boolean; error?: string; errorType?: string }> {
    try {
      // Login attempt
      
      // تشخيص إضافي للهاتف المحمول
      const deviceInfo = {
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        userAgent: navigator.userAgent,
        connection: (navigator as any).connection ? {
          effectiveType: (navigator as any).connection.effectiveType,
          downlink: (navigator as any).connection.downlink,
          rtt: (navigator as any).connection.rtt
        } : 'غير متاح',
        online: navigator.onLine,
        cookieEnabled: navigator.cookieEnabled,
        localStorage: typeof(Storage) !== "undefined"
      };
      
      // Device info

      let userEmail: string;
      
      // التحقق من نوع الإدخال (بريد إلكتروني أم اسم مستخدم)
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.username);
      
      if (isEmail) {
        userEmail = credentials.username;
      } else {
        // ✅ استخدام دالة آمنة للبحث عن البريد من username (تتجاوز RLS)
        const { data: emailData, error: emailError } = await supabase
          .rpc('get_user_email_by_username', { p_username: credentials.username });
        
        if (emailError || !emailData) {
          console.error('❌ اسم المستخدم غير موجود');
          return { success: false, error: 'اسم المستخدم غير موجود', errorType: 'username_not_found' };
        }
        
        userEmail = emailData;
      }

      // Authenticate

      // تسجيل الدخول باستخدام البريد الإلكتروني مع معالجة خاصة للهاتف
      let authData, authError;
      
      if (deviceInfo.isMobile) {
        // للهاتف المحمول: محاولة مع timeout أطول
        // Mobile settings
        
        try {
          // إنشاء AbortController للتحكم في timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 ثانية للهاتف
          
          const response = await supabase.auth.signInWithPassword({
            email: userEmail,
            password: credentials.password
          });
          
          clearTimeout(timeoutId);
          authData = response.data;
          authError = response.error;
          
        } catch (error: any) {
          // Network error
          authError = error;
          authData = null;
        }
      } else {
        // للحاسوب: الطريقة العادية
        const response = await supabase.auth.signInWithPassword({
          email: userEmail,
          password: credentials.password
        });
        authData = response.data;
        authError = response.error;
      }

      if (authError || !authData?.user) {
        console.error('❌ فشل في المصادقة:', {
          message: authError?.message,
          status: authError?.status,
          userAgent: navigator.userAgent,
          isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        });
        
        // معالجة خاصة لخطأ "Email not confirmed"
        if (authError?.message?.includes('Email not confirmed')) {
          // إطلاق حدث مخصص لإخبار التطبيق أن البريد غير مفعل
          window.dispatchEvent(new CustomEvent('email-not-verified', { 
            detail: { email: userEmail } 
          }));
          return { success: false, error: 'البريد الإلكتروني غير مفعل. يرجى التحقق من بريدك الإلكتروني وتفعيل الحساب.', errorType: 'email_not_verified' };
        }
        
        // معالجة خاصة لخطأ كلمة المرور الخاطئة
        if (authError?.message?.includes('Invalid login credentials')) {
          return { success: false, error: 'كلمة المرور غير صحيحة', errorType: 'invalid_password' };
        }
        
        // معالجة خاصة للأخطاء الشائعة في الهاتف
        if (authError?.message?.includes('Network request failed') ||
            authError?.status === 0) {
          // Retry auth
          
          // انتظار أطول للهاتف المحمول
          await new Promise(resolve => setTimeout(resolve, 400));
          
          try {
            const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
              email: userEmail,
              password: credentials.password
            });
            
            if (retryError || !retryData.user) {
              console.error('❌ فشل في إعادة المحاولة:', retryError?.message);
              
              // محاولة ثالثة للهاتف المحمول
              await new Promise(resolve => setTimeout(resolve, 500));
              
              const { data: finalData, error: finalError } = await supabase.auth.signInWithPassword({
                email: userEmail,
                password: credentials.password
              });
              
              if (finalError || !finalData.user) {
                console.error('❌ فشل نهائي في المصادقة:', finalError?.message);
                if (finalError?.message?.includes('Invalid login credentials')) {
                  return { success: false, error: 'كلمة المرور غير صحيحة', errorType: 'invalid_password' };
                }
                return { success: false, error: 'فشل في الاتصال. يرجى المحاولة مرة أخرى.', errorType: 'network_error' };
              }
              
              // Third attempt success
              return { success: true };
            }
            
            // Retry success
            return { success: true };
          } catch (retryError) {
            console.error('❌ خطأ في إعادة المحاولة:', retryError);
            return { success: false, error: 'فشل في الاتصال. يرجى المحاولة مرة أخرى.', errorType: 'network_error' };
          }
        }
        
        return { success: false, error: 'فشل في تسجيل الدخول. يرجى التحقق من البيانات والمحاولة مرة أخرى.', errorType: 'general_error' };
      }

      // Login successful
      console.log('✅ تسجيل دخول ناجح - تحميل بيانات المستخدم مع التحقق من الاشتراك...');
      
      // ⚡ تحميل فوري لبيانات المستخدم
      if (authData.user) {
        // ⚡ تحميل البيانات وإرسال الإشعار بشكل متوازي لتسريع العملية
        const loadDataPromise = this.loadUserData(authData.user.id);
        
        // ✅ إرسال إشعار ترحيبي بشكل متوازي (لا ننتظر تحميل البيانات)
        (async () => {
          try {
            // ⚡ جلب بيانات المستخدم أولاً
            const { data: userData } = await supabase
              .from('users')
              .select('id, subscription_status')
              .eq('auth_id', authData.user.id)
              .single();

            if (!userData || userData.subscription_status !== 'active') {
              return; // لا حاجة للمتابعة
            }

            // ⚡ التحقق من الإشعار الموجود
            const { data: existingWelcome } = await supabase
              .from('notifications')
              .select('id')
              .eq('recipient_id', userData.id) // ✅ استخدام users.id
              .ilike('title_ar', '%مرحباً بك%')
              .limit(1);

            if (userData?.subscription_status === 'active') {
              // ✅ التحقق من نوع الاشتراك (جديد أم تجديد)
              const { data: previousSubs } = await supabase
                .from('subscriptions')
                .select('id')
                .eq('user_id', userData.id)
                .order('created_at', { ascending: false })
                .limit(2);
              
              const isRenewal = !!(previousSubs && previousSubs.length > 1);
              
              if (!existingWelcome || existingWelcome.length === 0) {
                console.log('📧 إرسال إشعار ترحيبي فوري...');
                const { adminNotificationService } = await import('./adminNotificationService');
                await adminNotificationService.sendWelcomeNotification(userData.id, isRenewal);
                console.log(`✅ تم إرسال الإشعار الترحيبي ${isRenewal ? '(تجديد)' : '(جديد)'}`);
                
                // ✅ إرسال إشعار نظام الإحالة بعد 30 ثانية (للمستخدمين الجدد فقط)
                if (!isRenewal) {
                  setTimeout(async () => {
                    try {
                      console.log('📧 إرسال إشعار نظام الإحالة (بعد 30 ثانية)...');
                      await supabase
                        .from('notifications')
                        .insert({
                          recipient_id: userData.id,
                          recipient_type: 'user',
                          type: 'referral_welcome',
                          title: '🎉 Earn up to $5000 monthly!',
                          title_ar: '🎉 اربح حتى $5000 شهرياً!',
                          title_fr: '🎉 Gagnez jusqu\'à $5000 par mois!',
                          message: '🚀 Invite your friends and earn amazing commissions! Each friend who subscribes = commission for you. Your monthly salary from commissions can reach more than $5000! 💰 Start now and share your referral link.',
                          message_ar: '🚀 ادعُ أصدقاءك واربح عمولات مذهلة! كل صديق يشترك = عمولة لك. راتبك الشهري من العمولات قد يصل إلى أكثر من $5000! 💰 ابدأ الآن وشارك رابط الإحالة الخاص بك.',
                          message_fr: '🚀 Invitez vos amis et gagnez des commissions incroyables! Chaque ami qui s\'inscrit = commission pour vous. Votre salaire mensuel peut atteindre plus de $5000! 💰 Commencez maintenant et partagez votre lien de parrainage.',
                          priority: 'high',
                          is_read: false,
                          action_type: 'navigate',
                          action_url: '/referral',
                          action_data: {
                            feature: 'referral_program',
                            potential_earnings: 5000
                          }
                        });
                      
                      console.log('✅ تم إرسال إشعار نظام الإحالة');
                    } catch (referralError) {
                      console.error('⚠️ فشل إرسال إشعار الإحالة (غير حرج):', referralError);
                    }
                  }, 30000); // 30 ثانية
                }
              } else {
                console.log('ℹ️ الإشعار الترحيبي تم إرساله مسبقاً');
              }
            }
          } catch (notifError) {
            console.error('⚠️ فشل إرسال الإشعار الترحيبي (غير حرج):', notifError);
          }
        })();

        // ⚡ انتظار تحميل البيانات فقط (الإشعار يُرسل في الخلفية)
        await loadDataPromise;
        
        // ⚡ تفعيل Realtime فوراً بعد تسجيل الدخول للمزامنة الفورية
        if (this.authState.user?.id) {
          console.log('⚡ تفعيل Realtime للمزامنة الفورية...');
          
          realtimeSyncService.subscribeToUserChanges(
            this.authState.user.id,
            async (_payload) => {
              console.log('🔔 تحديث فوري - تغيير في بيانات المستخدم');
              await this.refreshUserData();
            }
          );
          
          realtimeSyncService.subscribeToSubscriptionChanges(
            this.authState.user.id,
            async (_payload) => {
              console.log('🔔 تحديث فوري - تغيير في الاشتراك');
              await this.refreshUserData();
            }
          );
        }
      }
      
      return { success: true };

    } catch (error) {
      console.error('❌ خطأ عام في تسجيل الدخول:', error);
      return { success: false, error: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.', errorType: 'unexpected_error' };
    }
  }

  // تسجيل الخروج
  async logout(): Promise<void> {
    try {
      console.log('🚪 بدء عملية تسجيل الخروج...');
      
      // تحديث الحالة أولاً لإظهار حالة التحميل
      this.updateAuthState({ isAuthenticated: false, user: null, isLoading: true });
      
      // مسح جلسة Supabase بشكل كامل مع timeout
      const logoutPromise = supabase.auth.signOut({ scope: 'global' });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Logout timeout')), 5000)
      );
      
      try {
        await Promise.race([logoutPromise, timeoutPromise]);
        console.log('✅ تم تسجيل الخروج من Supabase');
      } catch (logoutError) {
        console.warn('⚠️ خطأ في تسجيل الخروج من Supabase، سيتم المتابعة:', logoutError);
      }
      
      // مسح جميع مفاتيح Supabase من localStorage
      const supabaseKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('sb-') || 
        key.includes('supabase') || 
        key.includes('auth')
      );
      supabaseKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
          console.log('🗑️ تم حذف مفتاح:', key);
        } catch (e) {
          console.warn('⚠️ فشل في حذف مفتاح:', key, e);
        }
      });
      
      // حذف الحالة المخزنة
      localStorage.removeItem('auth_state_cache');
      
      // مسح بيانات التطبيق الأخرى
      const appKeys = [
        'show_subscription_page',
        'subscription_step', 
        'selected_plan',
        'user_info',
        'active_tab',
        'show_data_source_panel',
        'show_real_data_panel'
      ];
      appKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.warn('⚠️ فشل في حذف مفتاح التطبيق:', key, e);
        }
      });
      
      // مسح sessionStorage
      try {
        sessionStorage.clear();
        console.log('✅ تم مسح sessionStorage');
      } catch (e) {
        console.warn('⚠️ فشل في مسح sessionStorage:', e);
      }
      
      // تحديث الحالة النهائية
      this.updateAuthState({ isAuthenticated: false, user: null, isLoading: false });
      console.log('✅ تم تحديث حالة المصادقة');
      
      // انتظار قصير للتأكد من تطبيق التغييرات
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('✅ تم تسجيل الخروج بنجاح');
      
    } catch (error) {
      console.error('❌ خطأ في تسجيل الخروج:', error);
      
      // حتى لو حدث خطأ، نمسح البيانات المحلية
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (clearError) {
        console.error('❌ فشل في مسح البيانات المحلية:', clearError);
      }
      
      // تحديث الحالة في جميع الأحوال
      this.updateAuthState({ isAuthenticated: false, user: null, isLoading: false });
    }
  }

  // التحقق من الأدوار
  hasRole(role: 'admin' | 'trader'): boolean {
    return this.authState.user?.role === role;
  }

  // الحصول على حالة المصادقة الحالية
  getAuthState(): AuthState {
    return this.authState;
  }

  // جلب جميع المستخدمين (للمديرين فقط)
  async getAllUsers(): Promise<User[]> {
    try {
      console.log('🔍 جلب جميع المستخدمين...');
      console.log('👤 المستخدم الحالي:', this.authState.user?.username, 'الدور:', this.authState.user?.role);

      if (!this.hasRole('admin')) {
        console.error('❌ المستخدم ليس admin:', this.authState.user?.role);
        console.warn('⚠️ إرجاع مصفوفة فارغة بدلاً من رمي خطأ');
        return [];
      }

      console.log('✅ المستخدم admin - جلب البيانات...');
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ خطأ في قاعدة البيانات:', error);
        console.error('تفاصيل الخطأ:', error.message);
        return [];
      }
      
      console.log('✅ تم جلب المستخدمين:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ خطأ في جلب المستخدمين:', error);
      return [];
    }
  }

  // تسجيل مستخدم جديد
  async registerUser(userData: { 
    email: string; 
    password: string; 
    username: string; 
    fullName: string; 
    country?: string; 
  }): Promise<{ success: boolean; error?: string; user?: User }> {
    try {
      // Register user

      // التحقق من عدم وجود المستخدم - استعلامين منفصلين لتجنب مشاكل RLS
      const { data: existingEmail } = await supabase
        .from('users')
        .select('id, auth_id, email_verified')
        .eq('email', userData.email)
        .maybeSingle();

      const { data: existingUsername } = await supabase
        .from('users')
        .select('id, auth_id, email_verified')
        .eq('username', userData.username)
        .maybeSingle();

      const existingUser = existingEmail || existingUsername;

      if (existingUser) {
        // إذا كان المستخدم موجود ولم يفعل بريده، نسمح بإعادة إرسال بريد التأكيد
        if (!existingUser.email_verified) {
          return { 
            success: false, 
            error: 'هذا الحساب موجود بالفعل. يرجى التحقق من بريدك الإلكتروني لتفعيل الحساب.' 
          };
        }
        
        return { 
          success: false, 
          error: 'البريد الإلكتروني أو اسم المستخدم موجود بالفعل' 
        };
      }

      // إنشاء حساب في Auth مع تفعيل البريد الإلكتروني التلقائي من Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            username: userData.username,
            full_name: userData.fullName,
            country: userData.country || ''
          }
        }
      });

      if (authError) {
        // معالجة خطأ المستخدم الموجود في Auth
        if (authError.message.includes('already registered') || authError.message.includes('User already registered')) {
          console.log('⚠️ المستخدم موجود في Auth');
          
          // التحقق من وجود السجل في جدول users
          const { data: existingInDb } = await supabase
            .from('users')
            .select('id, auth_id, email_verified, status')
            .eq('email', userData.email)
            .maybeSingle();
          
          // إذا لم يكن موجوداً في جدول users، نحتاج لحذفه من Auth أولاً
          if (!existingInDb) {
            console.log('⚠️ المستخدم موجود في Auth لكن محذوف من جدول users');
            return {
              success: false,
              error: 'هذا البريد مسجل سابقاً. يرجى التواصل مع الدعم لإعادة تفعيل الحساب، أو استخدام بريد إلكتروني آخر.'
            };
          }
          
          // إذا كان موجوداً لكن البريد غير مفعّل، نعيد إرسال بريد التفعيل
          if (!existingInDb.email_verified) {
            console.log('📧 إعادة إرسال بريد التفعيل...');
            try {
              const { error: resendError } = await supabase.auth.resend({
                type: 'signup',
                email: userData.email,
                options: {
                  emailRedirectTo: `${window.location.origin}/auth/callback`
                }
              });
              
              if (!resendError) {
                console.log('✅ تم إرسال بريد التفعيل');
                return {
                  success: false,
                  error: 'هذا الحساب موجود بالفعل. تم إرسال رابط تفعيل جديد إلى بريدك الإلكتروني.'
                };
              } else {
                console.error('❌ فشل في إعادة الإرسال:', resendError);
              }
            } catch (resendErr) {
              console.error('❌ خطأ في إعادة الإرسال:', resendErr);
            }
          }
          
          return {
            success: false,
            error: 'هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول أو التحقق من بريدك الإلكتروني.'
          };
        }
        throw authError;
      }

      if (authData.user) {
        console.log('✅ تم إنشاء حساب Auth بنجاح:', authData.user.id);
        
        // ✅ إنشاء سجل في جدول users باستخدام دالة آمنة (تتجاوز RLS)
        // نحاول الإنشاء مباشرة، وإذا كان موجود سنعالج الخطأ
        const { data: newUserArray, error: userError } = await supabase
          .rpc('create_new_user', {
            p_auth_id: authData.user.id,
            p_email: userData.email,
            p_username: userData.username,
            p_full_name: userData.fullName,
            p_country: userData.country || null
          });
        
        const newUser = Array.isArray(newUserArray) ? newUserArray[0] : newUserArray;
        console.log('✅ تم إنشاء السجل:', newUser?.id);

        if (userError) {
          console.error('❌ خطأ في إنشاء السجل:', userError);
          
          // حذف المستخدم من Auth لأن الإنشاء فشل
          console.log('🧹 تنظيف - حذف المستخدم من Auth...');
          try {
            await supabase.auth.admin.deleteUser(authData.user.id);
            console.log('✅ تم حذف المستخدم من Auth');
          } catch (deleteErr) {
            console.error('❌ فشل حذف المستخدم من Auth:', deleteErr);
          }
          
          return {
            success: false,
            error: 'حدث خطأ في إنشاء الحساب. يرجى المحاولة مرة أخرى.'
          };
        }
        
        // ✅ التحقق من أن السجل تم إنشاؤه أو إرجاعه
        if (!newUser || !newUser.id) {
          console.error('❌ لم يتم إرجاع بيانات المستخدم');
          
          // حذف من Auth
          try {
            await supabase.auth.admin.deleteUser(authData.user.id);
          } catch (deleteErr) {
            console.error('❌ فشل حذف المستخدم من Auth:', deleteErr);
          }
          
          return {
            success: false,
            error: 'حدث خطأ في إنشاء الحساب. يرجى المحاولة مرة أخرى.'
          };
        }
        
        console.log('✅ تم إنشاء/جلب السجل بنجاح:', newUser.id);
        
        // ملاحظة: Supabase يرسل بريد التفعيل تلقائياً عند signUp
        // لا حاجة لإعادة الإرسال هنا لتجنب خطأ 429 (Too Many Requests)
        if (!newUser.email_verified) {
          console.log('📧 تم إرسال بريد التفعيل تلقائياً من Supabase');
        }

        // تسجيل خروج المستخدم مباشرة بعد التسجيل
        // لأننا نريد أن يفعّل بريده أولاً قبل تسجيل الدخول
        console.log('🚪 تسجيل خروج المستخدم بعد التسجيل...');
        await supabase.auth.signOut();
        
        return { 
          success: true, 
          user: newUser as User 
        };
      }

      return { success: false, error: 'فشل في إنشاء الحساب' };
    } catch (error: any) {
      console.error('❌ خطأ في تسجيل المستخدم:', error);
      
      // معالجة أخطاء محددة
      if (error.code === '23505') {
        return {
          success: false,
          error: 'هذا الحساب موجود بالفعل. يرجى تسجيل الدخول.'
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'حدث خطأ في التسجيل'
      };
    }
  }

  // إنشاء مستخدم جديد (للمديرين)
  async createUser(userData: Partial<User>): Promise<{ success: boolean; error?: string; user?: User }> {
    try {
      if (!this.hasRole('admin')) {
        throw new Error('غير مصرح لك بإنشاء مستخدمين');
      }

      // Create user

      const { data: newUser, error } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        user: newUser as User
      };
    } catch (error) {
      console.error('❌ خطأ في إنشاء المستخدم:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'حدث خطأ في الإنشاء'
      };
    }
  }

  // تحديث بيانات المستخدم
  async updateUser(userId: string, updates: Partial<User>): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.hasRole('admin')) {
        throw new Error('غير مصرح لك بتحديث المستخدمين');
      }

      // Update user

      const { error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      // إذا كان المستخدم الحالي يحدث نفسه، نحديث الحالة المحلية
      if (this.authState.user?.id === userId) {
        this.updateAuthState({
          user: { ...this.authState.user, ...updates }
        });
      }

      return { success: true };
    } catch (error) {
      console.error('❌ خطأ في تحديث المستخدم:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'حدث خطأ في التحديث'
      };
    }
  }

  // حذف مستخدم بالكامل (من Auth و users)
  async deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.hasRole('admin')) {
        throw new Error('غير مصرح لك بحذف المستخدمين');
      }

      console.log('🗑️ حذف المستخدم بالكامل:', userId);

      // استدعاء الدالة لحذف المستخدم من Auth و users
      const { data, error } = await supabase.rpc('delete_user_completely', {
        user_id_to_delete: userId
      });

      if (error) {
        console.error('❌ خطأ في حذف المستخدم:', error);
        throw error;
      }

      // التحقق من النتيجة
      if (data && typeof data === 'object' && 'success' in data) {
        if (data.success) {
          console.log('✅ تم حذف المستخدم بالكامل:', data.deleted_email);
          return { success: true };
        } else {
          console.error('❌ فشل الحذف:', data.error);
          return { success: false, error: data.error };
        }
      }

      return { success: true };
    } catch (error) {
      console.error('❌ خطأ في حذف المستخدم:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'حدث خطأ في الحذف'
      };
    }
  }

  // إعادة تحميل بيانات المستخدم الحالي (مسح الـ cache وإعادة التحميل)
  async refreshUserData(): Promise<void> {
    try {
      console.log('🔄 إعادة تحميل بيانات المستخدم...');
      
      // مسح الـ cache
      localStorage.removeItem('auth_state_cache');
      
      // الحصول على الجلسة الحالية
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session?.user) {
        console.error('❌ لا توجد جلسة نشطة');
        this.updateAuthState({ isAuthenticated: false, user: null, isLoading: false });
        return;
      }
      
      // إعادة تحميل بيانات المستخدم من قاعدة البيانات
      await this.loadUserData(session.user.id);
      console.log('✅ تم إعادة تحميل بيانات المستخدم');
    } catch (error) {
      console.error('❌ خطأ في إعادة تحميل بيانات المستخدم:', error);
    }
  }

  // تغيير كلمة المرور
  async changePassword(username: string, currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      // التحقق من كلمة المرور الحالية بمحاولة تسجيل الدخول
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: username.includes('@') ? username : `${username}@example.com`,
        password: currentPassword
      });

      if (signInError || !authData.user) {
        console.error('❌ كلمة المرور الحالية غير صحيحة');
        return false;
      }

      // تحديث كلمة المرور في Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('❌ خطأ في تحديث كلمة المرور:', error);
        return false;
      }

      console.log('✅ تم تغيير كلمة المرور بنجاح');
      return true;
    } catch (error) {
      console.error('❌ خطأ في تغيير كلمة المرور:', error);
      return false;
    }
  }
}

// إنشاء مثيل واحد من الخدمة
const simpleAuthService = new SimpleAuthService();

// Hook للاستخدام في React
export const useSimpleAuth = () => {
  const [authState, setAuthState] = React.useState<AuthState>(simpleAuthService.getAuthState());

  React.useEffect(() => {
    const unsubscribe = simpleAuthService.addListener(setAuthState);
    return unsubscribe;
  }, []);

  return {
    ...authState,
    login: simpleAuthService.login.bind(simpleAuthService),
    logout: simpleAuthService.logout.bind(simpleAuthService),
    registerUser: simpleAuthService.registerUser.bind(simpleAuthService),
    createUser: simpleAuthService.createUser.bind(simpleAuthService),
    updateUser: simpleAuthService.updateUser.bind(simpleAuthService),
    deleteUser: simpleAuthService.deleteUser.bind(simpleAuthService),
    getAllUsers: simpleAuthService.getAllUsers.bind(simpleAuthService),
    hasRole: simpleAuthService.hasRole.bind(simpleAuthService),
    changePassword: simpleAuthService.changePassword.bind(simpleAuthService),
    // دوال تفعيل البريد الإلكتروني
    verifyEmail: emailService.verifyCode.bind(emailService),
    resendVerificationCode: emailService.resendVerificationCode.bind(emailService),
    checkEmailVerificationStatus: emailService.checkEmailVerificationStatus.bind(emailService)
  };
};

export default simpleAuthService;
