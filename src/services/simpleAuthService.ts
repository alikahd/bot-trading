import { emailService } from './emailService';
import { supabase } from '../config/supabaseClient';
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
      
      // إذا لم يكن هناك cache، نحمل الجلسة مباشرة مع timeout
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session timeout')), 3000)
      );
      
      let session, error;
      try {
        const result = await Promise.race([sessionPromise, timeoutPromise]) as any;
        session = result.data?.session;
        error = result.error;
      } catch (timeoutError) {
        // Timeout - نعتبر المستخدم غير مسجل دخول
        this.updateAuthState({ isAuthenticated: false, user: null, isLoading: false });
        return;
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
          // انتظار إضافي للهاتف المحمول
          if (isMobile()) {
            await new Promise(resolve => setTimeout(resolve, 50));
          }
          await this.loadUserData(session.user.id);
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
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authId)
        .maybeSingle();

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
        console.log('📊 بيانات المستخدم الكاملة:', JSON.stringify(data, null, 2));
        
        // التأكد من أن المستخدم Admin يمكنه الوصول
        if (data.email === 'hichamkhad00@gmail.com') {
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
        const isAdmin = data.email === 'hichamkhad00@gmail.com';
        
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
        // 4. إذا كان الاشتراك نشط والمستخدم نشط → دخول مباشر
        else if ((data.status === 'active' && data.subscription_status === 'active' && data.is_active) || isAdmin) {
          console.log('✅ المستخدم نشط → دخول مباشر');
          redirectTo = null; // لا توجيه، دخول مباشر
          
          // مسح أي بيانات اشتراك قديمة من localStorage
          localStorage.removeItem('show_subscription_page');
          localStorage.removeItem('subscription_step');
          localStorage.removeItem('selected_plan');
        }
        // 5. إذا كان يحتاج اشتراك (البريد مفعل لكن لا يوجد اشتراك نشط)
        else if (data.status === 'pending_subscription' || data.subscription_status !== 'active') {
          console.log('📦 يحتاج اشتراك → subscription');
          redirectTo = 'subscription';
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
  async login(credentials: { username: string; password: string }): Promise<boolean> {
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
        
        // التحقق من حالة المستخدم عند استخدام البريد الإلكتروني
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, email, is_active, email_verified, status, subscription_status')
          .eq('email', userEmail)
          .single();

        if (userError || !userData) {
          console.error('❌ البريد الإلكتروني غير موجود');
          return false;
        }
        
        // ملاحظة: تم إزالة التحقق من email_verified والاشتراك هنا
        // سيتم التوجيه حسب حالة المستخدم (redirectTo) بعد تسجيل الدخول
      } else {
        // Username search
        
        // البحث عن المستخدم باسم المستخدم
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, email, is_active, email_verified, status, subscription_status')
          .eq('username', credentials.username)
          .single();

        if (userError || !userData) {
          console.error('❌ اسم المستخدم غير موجود');
          return false;
        }
        
        userEmail = userData.email;
        
        // ملاحظة: تم إزالة التحقق من email_verified والاشتراك هنا
        // سيتم التوجيه حسب حالة المستخدم (redirectTo) بعد تسجيل الدخول
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
          return false;
        }
        
        // معالجة خاصة للأخطاء الشائعة في الهاتف
        if (authError?.message?.includes('Invalid login credentials') || 
            authError?.message?.includes('Network request failed') ||
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
                return false;
              }
              
              // Third attempt success
              return true;
            }
            
            // Retry success
            return true;
          } catch (retryError) {
            console.error('❌ خطأ في إعادة المحاولة:', retryError);
            return false;
          }
        }
        
        return false;
      }

      // Login successful
      // سيتم تحميل بيانات المستخدم تلقائياً عبر onAuthStateChange
      return true;

    } catch (error) {
      console.error('❌ خطأ عام في تسجيل الدخول:', error);
      return false;
    }
  }

  // تسجيل الخروج
  async logout(): Promise<void> {
    try {
      // Logout started
      
      // مسح جلسة Supabase بشكل كامل
      await supabase.auth.signOut({ scope: 'local' });
      // Session cleared
      
      // مسح جميع مفاتيح Supabase من localStorage
      const supabaseKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('sb-') || 
        key.includes('supabase') || 
        key.includes('auth')
      );
      supabaseKeys.forEach(key => {
        localStorage.removeItem(key);
        // Key removed
      });
      
      // حذف الحالة المخزنة
      localStorage.removeItem('auth_state_cache');
      
      // مسح جميع بيانات localStorage
      localStorage.clear();
      // localStorage cleared
      
      // مسح sessionStorage أيضاً
      sessionStorage.clear();
      // sessionStorage cleared
      
      // تحديث الحالة
      this.updateAuthState({ isAuthenticated: false, user: null, isLoading: false });
      // Auth state updated
      
    } catch (error) {
      // Logout error
      // حتى لو حدث خطأ، نمسح البيانات المحلية
      localStorage.clear();
      sessionStorage.clear();
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
        // التحقق من وجود السجل في جدول users بـ auth_id
        const { data: existingUserByAuthId } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', authData.user.id)
          .maybeSingle();

        if (existingUserByAuthId) {
          // السجل موجود بالفعل، نعيد البيانات الموجودة
          console.log('✅ المستخدم موجود بالفعل في جدول users');
          
          // تسجيل خروج المستخدم إذا لم يكن بريده مفعّل
          if (!existingUserByAuthId.email_verified) {
            console.log('🚪 تسجيل خروج المستخدم (البريد غير مفعّل)...');
            await supabase.auth.signOut();
          }
          
          return { 
            success: true, 
            user: existingUserByAuthId as User 
          };
        }

        // إنشاء سجل جديد في جدول users
        console.log('📝 إنشاء سجل جديد في جدول users...');
        const { data: newUser, error: userError } = await supabase
          .from('users')
          .insert({
            auth_id: authData.user.id,
            username: userData.username,
            email: userData.email,
            full_name: userData.fullName,
            country: userData.country || '',
            role: 'trader',
            is_active: false,
            email_verified: false, // سيتم تحديثه تلقائياً عند تأكيد البريد
            status: 'pending_email_verification'
          })
          .select()
          .single();
        
        console.log('✅ تم إنشاء السجل:', newUser?.id);

        if (userError) {
          // إذا كان الخطأ بسبب duplicate key، نحاول جلب السجل الموجود
          if (userError.code === '23505') {
            console.log('⚠️ السجل موجود بالفعل، جاري جلب البيانات...');
            const { data: existingRecord } = await supabase
              .from('users')
              .select('*')
              .eq('auth_id', authData.user.id)
              .maybeSingle();
            
            if (existingRecord) {
              // تسجيل خروج المستخدم إذا لم يكن بريده مفعّل
              if (!existingRecord.email_verified) {
                console.log('🚪 تسجيل خروج المستخدم (البريد غير مفعّل)...');
                await supabase.auth.signOut();
              }
              
              return { 
                success: true, 
                user: existingRecord as User 
              };
            }
          }
          throw userError;
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
