import React from 'react';
import { supabase } from '../config/supabaseClient';

export interface User {
  id: string;
  auth_id?: string;
  username: string;
  email?: string;
  role: 'admin' | 'trader';
  is_active: boolean;
  trading_settings: {
    riskLevel: 'low' | 'medium' | 'high';
    autoExecute: boolean;
    minConfidence: number;
    maxDailyTrades: number;
    preferredTimeframes: string[];
  };
  created_at: string;
  last_login?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

class AuthService {
  private currentUser: User | null = null;
  private listeners: ((state: AuthState) => void)[] = [];

  constructor() {
    // محاولة استعادة المستخدم من localStorage
    this.restoreSession();
    
    // الاستماع لتغييرات المصادقة
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // تحديث بيانات المستخدم عند تسجيل الدخول
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', session.user.id)
          .single();
        
        if (userData) {
          this.currentUser = userData as User;
          this.saveSession(this.currentUser);
          this.notifyListeners();
        }
      } else if (event === 'SIGNED_OUT') {
        // مسح بيانات المستخدم عند تسجيل الخروج
        this.currentUser = null;
        localStorage.removeItem('trading_bot_user');
        this.notifyListeners();
      }
    });
  }

  // استعادة الجلسة من localStorage
  private restoreSession() {
    try {
      const savedUser = localStorage.getItem('trading_bot_user');
      if (savedUser) {
        this.currentUser = JSON.parse(savedUser);
        this.notifyListeners();
      }
    } catch (error) {

      localStorage.removeItem('trading_bot_user');
    }
  }

  // حفظ الجلسة في localStorage
  private saveSession(user: User) {
    try {
      localStorage.setItem('trading_bot_user', JSON.stringify(user));
    } catch (error) {

    }
  }

  // إشعار المستمعين بتغيير الحالة
  private notifyListeners() {
    const state: AuthState = {
      user: this.currentUser,
      isAuthenticated: !!this.currentUser,
      isLoading: false,
      error: null
    };
    
    this.listeners.forEach(listener => listener(state));
  }

  // تسجيل الدخول
  async login(credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> {
    try {
      let email = credentials.username;
      
      // إذا لم يكن البريد الإلكتروني، ابحث عن المستخدم باسم المستخدم
      if (!credentials.username.includes('@')) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('email, auth_id')
          .eq('username', credentials.username)
          .eq('is_active', true)
          .single();

        if (userError || !userData?.email) {
          return {
            success: false,
            error: 'اسم المستخدم غير موجود أو غير نشط'
          };
        }
        
        email = userData.email;
      }

      // تسجيل الدخول باستخدام Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: credentials.password
      });

      if (authError || !authData.user) {
        return {
          success: false,
          error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
        };
      }

      // الحصول على بيانات المستخدم من جدول users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authData.user.id)
        .eq('is_active', true)
        .single();

      if (userError || !userData) {
        // إنشاء مستخدم جديد إذا لم يكن موجوداً
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            auth_id: authData.user.id,
            username: credentials.username,
            email: authData.user.email,
            role: 'trader'
          })
          .select()
          .single();

        if (createError || !newUser) {
          return {
            success: false,
            error: 'فشل في إنشاء ملف المستخدم'
          };
        }

        this.currentUser = newUser as User;
      } else {
        // تحديث وقت آخر دخول
        await supabase
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', userData.id);

        this.currentUser = userData as User;
      }

      this.saveSession(this.currentUser);
      this.notifyListeners();

      return { success: true };
    } catch (error) {

      return {
        success: false,
        error: 'حدث خطأ أثناء تسجيل الدخول. حاول مرة أخرى.'
      };
    }
  }

  // تسجيل الخروج
  async logout() {
    await supabase.auth.signOut();
    this.currentUser = null;
    localStorage.removeItem('trading_bot_user');
    this.notifyListeners();
  }

  // الحصول على المستخدم الحالي
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  // التحقق من المصادقة
  isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  // التحقق من الصلاحيات
  hasRole(role: 'admin' | 'trader'): boolean {
    return this.currentUser?.role === role || this.currentUser?.role === 'admin';
  }

  // الاشتراك في تغييرات الحالة
  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);
    
    // إرسال الحالة الحالية فوراً
    listener({
      user: this.currentUser,
      isAuthenticated: !!this.currentUser,
      isLoading: false,
      error: null
    });

    // إرجاع دالة إلغاء الاشتراك
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // تحديث إعدادات التداول
  async updateTradingSettings(settings: Partial<User['trading_settings']>): Promise<boolean> {
    if (!this.currentUser) return false;

    try {
      const updatedSettings = {
        ...this.currentUser.trading_settings,
        ...settings
      };

      const { error } = await supabase
        .from('users')
        .update({ trading_settings: updatedSettings })
        .eq('id', this.currentUser.id);

      if (error) {

        return false;
      }

      // تحديث المستخدم المحلي
      this.currentUser.trading_settings = updatedSettings;
      this.saveSession(this.currentUser);
      this.notifyListeners();

      return true;
    } catch (error) {

      return false;
    }
  }

  // الحصول على إعدادات التداول
  getTradingSettings() {
    return this.currentUser?.trading_settings || {
      riskLevel: 'medium' as const,
      autoExecute: false,
      minConfidence: 80,
      maxDailyTrades: 20,
      preferredTimeframes: ['1m', '2m', '3m', '5m']
    };
  }
}

// إنشاء مثيل واحد من الخدمة
export const authService = new AuthService();

// Hook للاستخدام في React
export const useAuth = () => {
  const [authState, setAuthState] = React.useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  });

  React.useEffect(() => {
    const unsubscribe = authService.subscribe(setAuthState);
    return unsubscribe;
  }, []);

  return {
    ...authState,
    login: authService.login.bind(authService),
    logout: authService.logout.bind(authService),
    updateTradingSettings: authService.updateTradingSettings.bind(authService),
    getTradingSettings: authService.getTradingSettings.bind(authService),
    hasRole: authService.hasRole.bind(authService)
  };
};

export default authService;
