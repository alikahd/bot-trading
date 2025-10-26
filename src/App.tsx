import { useState, useEffect } from 'react';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { EmailVerificationPage } from './components/auth/EmailVerificationPage';
import { PasswordResetPage } from './components/auth/PasswordResetPage';
import { SubscriptionPage } from './components/subscription/SubscriptionPage';
import { TermsPage } from './pages/TermsPage';
// تم حذف testApis - لم يعد مطلوباً
// تم إلغاء صفحة معلومات المستخدم
// import { UserInfoPage } from './components/UserInfoPage';
import { PaymentPage } from './components/payments/PaymentPage';
import { PaymentSuccessPage } from './components/payments/PaymentSuccessPage';
import { PaymentPendingPage } from './components/payments/PaymentPendingPage';
import { PaymentReviewPage } from './components/payments/PaymentReviewPage';
import { AdminPanel } from './components/admin/AdminPanel';
import { Header } from './components/layout/Header';
import { Navigation } from './components/navigation/Navigation';
import MobileBotControl from './components/layout/MobileBotControl';
import { AssetsList } from './components/assets/AssetsList';
// Removed StrategySettings and TradesHistory per user request
import { SmartRecommendationsPanel } from './components/recommendations/SmartRecommendationsPanel';
import { PreciseBinaryRecommendations } from './components/recommendations/PreciseBinaryRecommendations';
// تم حذف RiskManagementPanel و IQOptionConnection و SimulatedTradesPanel و BinarySignalsPanel و BinaryOptionsSettings بناءً على طلب المستخدم
// import { ManualTradingAssistant } from './components/trading/ManualTradingAssistant'; // تم حذفه بناءً على طلب المستخدم
import { DataSourcePanel } from './components/data/DataSourcePanel';
import { RealDataToggle } from './components/data/RealDataToggle';
// تم حذف ApiStatusPanel
// تم حذف marketDataService - البيانات من IQ Option مباشرة
import { Footer } from './components/layout/Footer';
import { supabase } from './config/supabaseClient';
import { paymentService } from './services/paymentService';
import { AppRouter, useRouter, PageType } from './components/navigation/AppRouter';
import { Card } from './components/ui/Card';
import { cn, designSystem } from './styles/designSystem';
import { useSimpleAuth } from './services/simpleAuthService';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { subscriptionService } from './services/subscriptionService';
import { useSubscriptionStatus } from './hooks/useSubscriptionStatus';
import { SubscriptionStatusBanner } from './components/subscription/SubscriptionStatusBanner';
import { SubscriptionBlockedPage } from './components/subscription/SubscriptionBlockedPage';
import { SubscriptionAndPaymentsPage } from './components/subscription/SubscriptionAndPaymentsPage';
import LiveChatWidget from './components/chat/LiveChatWidget';
import { SettingsPage } from './components/settings/SettingsPage';
import { clearAllCaches } from './utils/cacheUtils';
// import { navigateWithURL, getCurrentPath, getPathFromState, getStateFromPath } from './utils/navigationHelper';

// مفاتيح localStorage
const STORAGE_KEYS = {
  SUBSCRIPTION_STEP: 'subscription_step',
  SELECTED_PLAN: 'selected_plan',
  USER_INFO: 'user_info',
  SHOW_SUBSCRIPTION_PAGE: 'show_subscription_page',
  ACTIVE_TAB: 'active_tab',
  SHOW_DATA_SOURCE_PANEL: 'show_data_source_panel',
  SHOW_REAL_DATA_PANEL: 'show_real_data_panel'
};

// دوال مساعدة لـ localStorage
const saveToStorage = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('Failed to save to localStorage:', error);
  }
};

const loadFromStorage = (key: string, defaultValue: any = null) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.warn('Failed to load from localStorage:', error);
    return defaultValue;
  }
};

function App() {
  // نظام المصادقة
  const { isAuthenticated, isLoading, login, logout, user, registerUser } = useSimpleAuth();
  
  // تحميل الحالة من URL عند بدء التطبيق (سيتم استخدامه لاحقاً)
  // const initialState = getStateFromPath(getCurrentPath());
  
  // إخفاء شاشة التحميل الأولية عند تحميل التطبيق
  useEffect(() => {
    // إخفاء شاشة التحميل فوراً عند تحميل المكون
    const hideLoader = () => {
      if (typeof window !== 'undefined' && (window as any).hideInitialLoader) {
        (window as any).hideInitialLoader();
      }
    };
    
    // إخفاء فوراً إذا كان التحميل انتهى
    if (!isLoading) {
      hideLoader();
    } else {
      // أو بعد 300ms كحد أقصى
      const timeout = setTimeout(hideLoader, 300);
      return () => clearTimeout(timeout);
    }
  }, [isLoading]);

  // تم حذف IQ Option WebSocket - الآن نستخدم Python Backend
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showRegisterPage, setShowRegisterPage] = useState(false);
  const [showLoginPage, setShowLoginPage] = useState(false);
  const [showPasswordResetPage, setShowPasswordResetPage] = useState(false);
  const [showTermsPage, setShowTermsPage] = useState(false);
  const [showEmailVerificationFromLogin, setShowEmailVerificationFromLogin] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  
  // نظام التوجيه
  const { currentPage, navigate } = useRouter();

  // حالة البوت - في المكون الرئيسي
  const [isActive, setIsActive] = useState(false);
  
  const toggleBot = () => {
    setIsActive(!isActive);
    console.log(`🤖 البوت ${!isActive ? 'مُفعّل' : 'متوقف'}`);
  };

  // معالجة callback من Supabase بعد تأكيد البريد
  useEffect(() => {
    const handleEmailConfirmation = async () => {
      const hash = window.location.hash;
      console.log('🔍 Checking URL hash:', hash);
      
      // التحقق من وجود access_token أو type=recovery (يعني تم تفعيل البريد)
      if (hash && (hash.includes('access_token') || hash.includes('type=signup'))) {
        console.log('✅ تم اكتشاف callback من Supabase - البريد مفعّل');
        
        try {
          // الحصول على session الحالية
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          console.log('📊 Session data:', {
            hasSession: !!session,
            email: session?.user?.email,
            email_confirmed_at: session?.user?.email_confirmed_at,
            error: sessionError
          });
          
          if (session?.user) {
            console.log('📧 تحديث قاعدة البيانات...');
            console.log('User ID:', session.user.id);
            console.log('Email:', session.user.email);
            
            // تحديث قاعدة البيانات
            const { data: updateData, error: updateError } = await supabase
              .from('users')
              .update({
                email_verified: true,
                status: 'pending_subscription',
                email_verified_at: session.user.email_confirmed_at || new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('auth_id', session.user.id)
              .select();
            
            if (updateError) {
              console.error('❌ خطأ في تحديث قاعدة البيانات:', updateError);
            } else {
              console.log('✅ تم تحديث قاعدة البيانات بنجاح:', updateData);
            }
          } else {
            console.warn('⚠️ لا توجد session - قد يكون الرابط منتهي الصلاحية');
          }
        } catch (error) {
          console.error('❌ خطأ في معالجة callback:', error);
        }
        
        // بدلاً من تسجيل الخروج، نحتفظ بالجلسة ونوجه للاشتراك
        setTimeout(async () => {
          console.log('✅ البريد مفعّل - التوجيه لصفحة الاشتراك...');
          
          // مسح hash من URL
          window.history.replaceState(null, '', window.location.pathname);
          
          // مسح الـ cache القديم
          localStorage.removeItem('auth_state_cache');
          
          // تحديث حالة التطبيق للتوجه لصفحة الاشتراك
          localStorage.setItem('show_subscription_page', 'true');
          localStorage.setItem('email_just_verified', 'true');
          
          // عرض رسالة للمستخدم
          alert('✅ تم تفعيل بريدك الإلكتروني بنجاح!\n\nسيتم توجيهك الآن لاختيار باقة الاشتراك.');
          
          // إعادة تحميل الصفحة لتطبيق التغييرات
          // هذا سيجعل simpleAuthService يحمل البيانات الجديدة من قاعدة البيانات
          window.location.reload();
        }, 1500);
      }
    };
    
    handleEmailConfirmation();
  }, []);

  // مستمع لحدث "البريد غير مفعل"
  useEffect(() => {
    const handleEmailNotVerified = (event: Event) => {
      const customEvent = event as CustomEvent;
      const email = customEvent.detail?.email;
      if (email) {
        console.log('📧 البريد غير مفعل:', email);
        setUnverifiedEmail(email);
        setShowLoginPage(false);
        setShowEmailVerificationFromLogin(true);
      }
    };

    window.addEventListener('email-not-verified', handleEmailNotVerified as EventListener);
    return () => window.removeEventListener('email-not-verified', handleEmailNotVerified as EventListener);
  }, []);

  // مستمع للتنقل من Footer
  useEffect(() => {
    const handleFooterNavigate = (event: CustomEvent) => {
      const { page } = event.detail;
      console.log('Received footer navigation event:', page);
      navigate(page);
    };

    window.addEventListener('footerNavigate', handleFooterNavigate as EventListener);
    
    return () => {
      window.removeEventListener('footerNavigate', handleFooterNavigate as EventListener);
    };
  }, [navigate]);

  // حالة التطبيق مع استعادة من localStorage
  const [showDataSourcePanel, setShowDataSourcePanel] = useState(() => 
    loadFromStorage(STORAGE_KEYS.SHOW_DATA_SOURCE_PANEL, false)
  );
  const [showRealDataPanel, setShowRealDataPanel] = useState(() => 
    loadFromStorage(STORAGE_KEYS.SHOW_REAL_DATA_PANEL, false)
  );
  // تم حذف showApiStatusPanel
  const [activeTab, setActiveTab] = useState<'signals' | 'recommendations' | 'precise' | 'admin' | 'subscription'>(() => 
    loadFromStorage(STORAGE_KEYS.ACTIVE_TAB, 'recommendations')
  );
  
  // تحديث URL عند تغيير activeTab للمستخدمين المسجلين
  useEffect(() => {
    if (isAuthenticated && activeTab === 'subscription') {
      // فحص أمني: التأكد من أن المستخدم لديه اشتراك نشط
      const hasActiveSubscription = user && (user.status === 'active' || user.subscription_status === 'active');
      
      if (hasActiveSubscription) {
        // إضافة URL لصفحة المدفوعات والاشتراكات
        const currentPath = window.location.pathname;
        if (currentPath !== '/subscription/manage') {
          window.history.pushState({ authenticated: true, tab: 'subscription' }, '', '/subscription/manage');
          window.dispatchEvent(new CustomEvent('app-navigate', { detail: { path: '/subscription/manage' } }));
        }
      } else {
        // المستخدم ليس لديه اشتراك - منع الوصول وإعادة توجيه
        console.log('⚠️ محاولة الوصول لصفحة المدفوعات بدون اشتراك نشط');
        setActiveTab('recommendations');
        setShowSubscriptionPage(true);
      }
    }
  }, [activeTab, isAuthenticated, user]);
  const [showSubscriptionPage, setShowSubscriptionPage] = useState(() => 
    loadFromStorage(STORAGE_KEYS.SHOW_SUBSCRIPTION_PAGE, false)
  );
  
  // حالات تدفق الاشتراك مع استعادة من localStorage
  const [subscriptionStep, setSubscriptionStep] = useState<'plans' | 'userinfo' | 'payment' | 'success' | 'pending' | 'review'>('plans');
  
  // Log عند تغيير showSubscriptionPage وتحديث URL
  useEffect(() => {
    console.log('📄 showSubscriptionPage تغير إلى:', showSubscriptionPage);
    
    // تحديث URL عند فتح/إغلاق صفحة الاشتراك
    if (showSubscriptionPage) {
      const path = subscriptionStep === 'plans' ? '/subscription' : 
                   subscriptionStep === 'payment' ? '/payment' :
                   subscriptionStep === 'success' ? '/payment/success' :
                   subscriptionStep === 'pending' ? '/payment/pending' :
                   subscriptionStep === 'review' ? '/payment/review' : '/subscription';
      window.history.pushState({}, '', path);
      window.dispatchEvent(new CustomEvent('app-navigate', { detail: { path } }));
    } else if (isAuthenticated) {
      // العودة للصفحة الرئيسية
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new CustomEvent('app-navigate', { detail: { path: '/' } }));
    }
  }, [showSubscriptionPage, subscriptionStep, isAuthenticated]);
  
  // Log عند تغيير subscriptionStep وتحديث URL
  useEffect(() => {
    console.log('🔄 subscriptionStep تغير إلى:', subscriptionStep);
    
    // تحديث URL حسب حالة الاشتراك
    if (showSubscriptionPage) {
      let path = '/subscription';
      if (subscriptionStep === 'payment') path = '/payment';
      else if (subscriptionStep === 'success') path = '/payment/success';
      else if (subscriptionStep === 'pending') path = '/payment/pending';
      else if (subscriptionStep === 'review') path = '/payment/review';
      
      // إذا كان مسجل دخول، نستخدم pushState مع حماية
      if (isAuthenticated) {
        window.history.pushState({ authenticated: true }, '', path);
      } else {
        window.history.pushState({}, '', path);
      }
      window.dispatchEvent(new CustomEvent('app-navigate', { detail: { path } }));
    }
  }, [subscriptionStep, showSubscriptionPage, isAuthenticated]);
  
  // إضافة حاجز في التاريخ عند تسجيل الدخول لمنع الرجوع للصفحات المحظورة فقط
  useEffect(() => {
    if (isAuthenticated) {
      const currentPath = window.location.pathname;
      const forbiddenPaths = ['/', '/login', '/register'];
      
      // إذا كنا في صفحة محظورة، نستبدلها بصفحة آمنة
      if (forbiddenPaths.includes(currentPath)) {
        window.history.replaceState(
          { authenticated: true, safe: true }, 
          '', 
          '/subscription'
        );
        console.log('🔒 تم استبدال الصفحة المحظورة بصفحة آمنة');
      }
    }
  }, [isAuthenticated]);
  
  // الاستماع لزر الرجوع في المتصفح لتحديث حالة الاشتراك والدفع
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      console.log('🔙 زر الرجوع - المسار:', path, '| مسجل دخول:', isAuthenticated);
      
      // منع الرجوع للصفحات المحظورة فقط (السماح بالرجوع للصفحات الصالحة)
      if (isAuthenticated) {
        const forbiddenPaths = ['/', '/login', '/register'];
        if (forbiddenPaths.includes(path)) {
          console.log('🚫 محاولة الرجوع لصفحة محظورة - إعادة التوجيه');
          
          // تم إزالة منع الرجوع - السماح بالتنقل الطبيعي
          // window.history.forward();
          
          // تحديث الحالة للبقاء في الصفحة الحالية
          setShowLoginPage(false);
          setShowRegisterPage(false);
          setShowPasswordResetPage(false);
          
          return;
        }
      }
      
      // تحديث الحالة بناءً على URL - التنقل الطبيعي
      if (path === '/subscription/manage') {
        // صفحة المدفوعات والاشتراكات - فقط للمستخدمين الذين لديهم اشتراك
        // منع الوصول للمستخدمين الجدد الذين لم يدفعوا بعد
        if (user && (user.status === 'active' || user.subscription_status === 'active')) {
          setActiveTab('subscription');
          setShowSubscriptionPage(false);
          setShowLoginPage(false);
          setShowRegisterPage(false);
        } else {
          // المستخدم ليس لديه اشتراك - إعادة توجيه لصفحة الاشتراك
          console.log('⚠️ محاولة الوصول لصفحة المدفوعات بدون اشتراك - إعادة توجيه');
          window.history.replaceState({ authenticated: true }, '', '/subscription');
          setShowSubscriptionPage(true);
          setSubscriptionStep('plans');
        }
      } else if (path === '/subscription') {
        setShowSubscriptionPage(true);
        setSubscriptionStep('plans');
        setShowLoginPage(false);
        setShowRegisterPage(false);
      } else if (path === '/payment') {
        setShowSubscriptionPage(true);
        setSubscriptionStep('payment');
        setShowLoginPage(false);
        setShowRegisterPage(false);
      } else if (path === '/payment/success' || path === '/payment/pending' || path === '/payment/review') {
        // صفحات نتائج الدفع - فقط للمستخدمين الذين لديهم اشتراك أو في عملية دفع
        const hasSubscriptionOrPending = user && (
          user.status === 'active' || 
          user.subscription_status === 'active' || 
          user.subscription_status === 'pending' ||
          lastPaymentData // لديه بيانات دفع حديثة
        );
        
        if (hasSubscriptionOrPending) {
          setShowSubscriptionPage(true);
          if (path === '/payment/success') setSubscriptionStep('success');
          else if (path === '/payment/pending') setSubscriptionStep('pending');
          else if (path === '/payment/review') setSubscriptionStep('review');
          setShowLoginPage(false);
          setShowRegisterPage(false);
        } else {
          // المستخدم ليس لديه اشتراك أو دفع - إعادة توجيه لصفحة الاشتراك
          console.log('⚠️ محاولة الوصول لصفحة نتائج الدفع بدون اشتراك');
          window.history.replaceState({ authenticated: true }, '', '/subscription');
          setShowSubscriptionPage(true);
          setSubscriptionStep('plans');
        }
      } else if (path === '/login') {
        // السماح بالوصول فقط إذا لم يكن مسجل دخول
        if (!isAuthenticated) {
          setShowLoginPage(true);
          setShowRegisterPage(false);
          setShowSubscriptionPage(false);
        }
      } else if (path === '/register') {
        // السماح بالوصول فقط إذا لم يكن مسجل دخول
        if (!isAuthenticated) {
          setShowRegisterPage(true);
          setShowLoginPage(false);
          setShowSubscriptionPage(false);
        }
      } else if (path === '/reset-password') {
        setShowPasswordResetPage(true);
        setShowLoginPage(false);
        setShowRegisterPage(false);
        setShowSubscriptionPage(false);
      } else if (path === '/terms' || path === '/contact' || path === '/about') {
        // صفحات خاصة - يتم التعامل معها في AppRouter
        setShowSubscriptionPage(false);
        setShowLoginPage(false);
        setShowRegisterPage(false);
        setShowPasswordResetPage(false);
      } else if (path === '/') {
        // السماح بالوصول للصفحة الرئيسية فقط إذا لم يكن مسجل دخول
        if (!isAuthenticated) {
          setShowSubscriptionPage(false);
          setShowLoginPage(false);
          setShowRegisterPage(false);
          setShowPasswordResetPage(false);
          setShowEmailVerificationFromLogin(false);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isAuthenticated, showSubscriptionPage, subscriptionStep]);
  
  const [selectedPlan, setSelectedPlan] = useState<any>(() => 
    loadFromStorage(STORAGE_KEYS.SELECTED_PLAN, null)
  );
  const [userInfo, setUserInfo] = useState<any>(() => 
    loadFromStorage(STORAGE_KEYS.USER_INFO, null)
  );
  const [lastPaymentData, setLastPaymentData] = useState<any>(null);
  
  // حالة البوت - مبسطة (بدون useRealTimeTrading المحذوف)
  const [assets] = useState<any[]>([]);
  const [signals, setSignals] = useState<any[]>([]);
  const [strategy] = useState('balanced');
  const [isConnected] = useState(true); // دائماً متصل بـ IQ Option
  
  const clearSignals = () => {
    setSignals([]);
    console.log('🗑️ تم مسح جميع الإشارات');
  };
  
  const executeSignal = (signal: any) => {
    console.log('⚡ تنفيذ الإشارة:', signal);
    // يمكن إضافة منطق التنفيذ هنا لاحقاً
  };

  // تفعيل البيانات الحقيقية عند بدء التطبيق
  useEffect(() => {
    console.log('🚀 تهيئة النظام - البيانات الحقيقية من IQ Option...');
    console.log('✅ النظام جاهز - البيانات من Python Backend → IQ Option');
  }, []);

  // حفظ البيانات في localStorage عند تغييرها - تم دمجها لتحسين الأداء
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveToStorage(STORAGE_KEYS.SHOW_DATA_SOURCE_PANEL, showDataSourcePanel);
      saveToStorage(STORAGE_KEYS.SHOW_REAL_DATA_PANEL, showRealDataPanel);
      saveToStorage(STORAGE_KEYS.ACTIVE_TAB, activeTab);
      saveToStorage(STORAGE_KEYS.SHOW_SUBSCRIPTION_PAGE, showSubscriptionPage);
      saveToStorage(STORAGE_KEYS.SUBSCRIPTION_STEP, subscriptionStep);
      saveToStorage(STORAGE_KEYS.SELECTED_PLAN, selectedPlan);
      saveToStorage(STORAGE_KEYS.USER_INFO, userInfo);
    }, 500); // تأخير 500ms لتجميع التغييرات

    return () => clearTimeout(timeoutId);
  }, [showDataSourcePanel, showRealDataPanel, activeTab, showSubscriptionPage, subscriptionStep, selectedPlan, userInfo]);

  // دوال معالجة المصادقة
  const handleLogin = async (credentials: { username: string; password: string }) => {
    setIsLoginLoading(true);
    setAuthError(null);
    
    try {
      const result = await login(credentials);
      if (!result) {
        setAuthError('فشل في تسجيل الدخول');
        return false;
      }
      
      // مسح التاريخ السابق وإنشاء نقطة بداية جديدة بعد تسجيل الدخول
      console.log('✅ تسجيل دخول ناجح - مسح التاريخ السابق');
      window.history.replaceState({ page: 'subscription', authenticated: true }, '', '/subscription');
      
      return true;
    } catch (error) {
      setAuthError('حدث خطأ أثناء تسجيل الدخول');
      return false;
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleRegister = async (userData: {
    email: string;
    username: string;
    fullName: string;
    country: string;
    password: string;
  }) => {
    setIsRegisterLoading(true);
    setAuthError(null);
    
    try {
      const result = await registerUser(userData);
      if (!result.success) {
        setAuthError(result.error || 'فشل في إنشاء الحساب');
        return { success: false, error: result.error };
      }
      
      // بعد التسجيل الناجح، عرض رسالة وإرجاعه لتسجيل الدخول
      // المستخدم يجب أن يفعل بريده أولاً قبل الاشتراك
      setShowRegisterPage(false);
      
      // عرض رسالة النجاح
      alert('✅ تم إنشاء الحساب بنجاح!\n\n📧 تم إرسال رابط التفعيل إلى بريدك الإلكتروني.\n\nيرجى التحقق من بريدك والنقر على الرابط لتفعيل حسابك، ثم تسجيل الدخول.');
      
      // التوجه لصفحة تسجيل الدخول
      setShowLoginPage(true);
      
      return { success: true };
    } catch (error) {
      setAuthError('حدث خطأ أثناء إنشاء الحساب');
      return { success: false, error: 'حدث خطأ أثناء إنشاء الحساب' };
    } finally {
      setIsRegisterLoading(false);
    }
  };

  const handleBackToLogin = async () => {
    // مسح جميع بيانات الاشتراك والدفع من localStorage
    localStorage.removeItem('auth_state_cache');
    localStorage.removeItem('show_subscription_page');
    localStorage.removeItem('subscription_step');
    localStorage.removeItem('selected_plan');
    localStorage.removeItem('user_info');
    
    // إذا كان المستخدم مسجل دخول، تسجيل خروج أولاً
    if (isAuthenticated) {
      await logout();
    }
    
    setShowRegisterPage(false);
    setShowSubscriptionPage(false);
    setShowLoginPage(true);
    setAuthError(null);
    setSubscriptionStep('plans');
    setSelectedPlan(null);
    setUserInfo(null);
    
    // تحديث URL
    window.history.pushState({ page: 'login' }, '', '/login');
    window.dispatchEvent(new CustomEvent('app-navigate', { detail: { path: '/login' } }));
  };

  const handleNavigateToRegister = () => {
    setShowRegisterPage(true);
    setShowLoginPage(false);
    setShowPasswordResetPage(false);
    setAuthError(null);
    
    // تحديث URL
    window.history.pushState({ page: 'register' }, '', '/register');
    window.dispatchEvent(new CustomEvent('app-navigate', { detail: { path: '/register' } }));
  };

  const handleNavigateToPasswordReset = () => {
    setShowPasswordResetPage(true);
    setShowLoginPage(false);
    setShowRegisterPage(false);
    setAuthError(null);
    
    // تحديث URL
    window.history.pushState({ page: 'reset-password' }, '', '/reset-password');
    window.dispatchEvent(new CustomEvent('app-navigate', { detail: { path: '/reset-password' } }));
  };

  const handleNavigateToTerms = () => {
    setShowTermsPage(true);
    setShowRegisterPage(false);
    
    // تحديث URL
    window.history.pushState({ page: 'terms' }, '', '/terms');
    window.dispatchEvent(new CustomEvent('app-navigate', { detail: { path: '/terms' } }));
  };

  const handleBackToLoginFromPasswordReset = () => {
    setShowPasswordResetPage(false);
    setShowLoginPage(true);
    setAuthError(null);
    
    // تحديث URL
    window.history.pushState({ page: 'login' }, '', '/login');
    window.dispatchEvent(new CustomEvent('app-navigate', { detail: { path: '/login' } }));
  };

  const handleNavigateToSubscription = () => {
    setShowSubscriptionPage(true);
    setSubscriptionStep('plans');
    setAuthError(null);
    
    // تحديث URL
    if (isAuthenticated) {
      // للمستخدمين المسجلين - استخدام pushState عادي
      window.history.pushState({ authenticated: true, noBack: true }, '', '/subscription');
    } else {
      // للمستخدمين غير المسجلين
      window.history.pushState({ page: 'subscription' }, '', '/subscription');
    }
    window.dispatchEvent(new CustomEvent('app-navigate', { detail: { path: '/subscription' } }));
  };

  // دوال معالجة تدفق الاشتراك
  const handleSelectPlan = (plan: any) => {
    console.log('Plan selected:', plan);
    setSelectedPlan(plan);
    // التوجه مباشرة لصفحة الدفع (تم إلغاء صفحة معلومات المستخدم)
    setSubscriptionStep('payment');
  };

  const handlePaymentComplete = async (paymentMethod: string = 'paypal', status: string = 'completed', paymentData?: any) => {
    console.log('🔄 Payment completed with method:', paymentMethod, 'status:', status, 'data:', paymentData);
    console.log('👤 Current user:', user);
    console.log('📋 Current userInfo:', userInfo);
    
    try {
      // إنشاء userInfo من بيانات المستخدم إذا لم تكن موجودة
      const effectiveUserInfo = userInfo && userInfo.id ? userInfo : (user ? {
        id: user.id,
        fullName: user.full_name || user.username,
        email: user.email,
        country: (user as any).country || 'المغرب',
        phone: (user as any).phone || ''
      } : null);
      
      console.log('🔍 effectiveUserInfo:', effectiveUserInfo);
      
      // حفظ بيانات المستخدم والاشتراك في قاعدة البيانات
      if (selectedPlan && effectiveUserInfo) {
        console.log('📝 إنشاء الاشتراك...', { userInfo: effectiveUserInfo, selectedPlan, paymentMethod, status });
        
        const result = await subscriptionService.createSubscription(
          effectiveUserInfo,
          selectedPlan,
          paymentMethod,
          status,
          paymentData
        );

        console.log('📊 نتيجة إنشاء الاشتراك:', result);
        console.log('✅ result.success =', result.success);

        if (result.success) {
          console.log('✅ تم إنشاء الاشتراك بنجاح');
          
          // حفظ بيانات الدفع
          setLastPaymentData(result.paymentData || paymentData);
          
          // التدفق الجديد حسب طريقة الدفع
          if (paymentMethod === 'paypal' || paymentMethod === 'credit_card') {
            // الدفع المباشر - تفعيل فوري
            console.log('💳 دفع مباشر - التوجيه إلى صفحة النجاح');
            if (status === 'completed') {
              setSubscriptionStep('success');
            } else {
              setSubscriptionStep('pending');
            }
          } else if (paymentMethod === 'bitcoin' || paymentMethod.includes('crypto')) {
            // العملات الرقمية - انتظار مراجعة الأدمن
            console.log('🪙 عملة رقمية - التوجيه إلى صفحة المراجعة');
            console.log('🔧 تعيين subscriptionStep من', subscriptionStep, 'إلى review');
            setSubscriptionStep('review');
            console.log('✅ تم تعيين subscriptionStep إلى: review');
          }
        } else {
          console.error('❌ فشل في إنشاء الاشتراك:', result.error);
          console.error('❌ result.success = false');
          alert('حدث خطأ في إنشاء الاشتراك: ' + (result.error || 'خطأ غير معروف'));
        }
      } else {
        console.error('❌ بيانات ناقصة:', { selectedPlan, userInfo });
        alert('بيانات الاشتراك أو المستخدم غير متوفرة');
      }
    } catch (error) {
      console.error('❌ خطأ في معالجة الدفع:', error);
      alert('حدث خطأ في معالجة الدفع: ' + (error instanceof Error ? error.message : 'خطأ غير معروف'));
    }
  };

  // دالة مسح جميع البيانات المحفوظة
  const clearAllStoredData = () => {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  };

  // مسح البيانات عند تسجيل الخروج
  const handleLogout = async () => {
    // Logout process
    
    try {
      // مسح جميع البيانات المحفوظة
      clearAllStoredData();
      
      // مسح جميع أنواع الـ Cache
      await clearAllCaches();
      
      // تسجيل الخروج من النظام
      await logout();
      
      // إعادة تحميل الصفحة فوراً لضمان مسح كل شيء
      window.location.href = window.location.origin;
      
    } catch (error) {
      // Logout error
      // حتى لو حدث خطأ، نعيد تحميل الصفحة
      window.location.href = window.location.origin;
    }
  };

  // تطبيق المزودين دائماً أولاً
  return (
    <ThemeProvider>
      <LanguageProvider>
        <>
          {/* Live Chat Widget - يظهر في جميع الصفحات */}
          <LiveChatWidget />
          <AppRouter 
            currentPage={currentPage} 
            onNavigate={navigate}
            onNavigateToLogin={() => setShowLoginPage(true)}
            onNavigateToRegister={handleNavigateToRegister}
            isAuthenticated={isAuthenticated}
            user={user}
            onLogout={handleLogout}
          >
            <AppContent 
            isAuthenticated={isAuthenticated}
            isLoading={isLoading}
            user={user}
            login={handleLogin}
            logout={logout}
            handleLogout={handleLogout}
            isLoginLoading={isLoginLoading}
            showRegisterPage={showRegisterPage}
            showLoginPage={showLoginPage}
            setShowLoginPage={setShowLoginPage}
            handleRegister={handleRegister}
            handleNavigateToRegister={handleNavigateToRegister}
            handleNavigateToPasswordReset={handleNavigateToPasswordReset}
            handleBackToLoginFromPasswordReset={handleBackToLoginFromPasswordReset}
            showPasswordResetPage={showPasswordResetPage}
            showTermsPage={showTermsPage}
            handleNavigateToTerms={handleNavigateToTerms}
            handleNavigateToSubscription={handleNavigateToSubscription}
            isRegisterLoading={isRegisterLoading}
            authError={authError}
            showEmailVerificationFromLogin={showEmailVerificationFromLogin}
            unverifiedEmail={unverifiedEmail}
            setShowEmailVerificationFromLogin={setShowEmailVerificationFromLogin}
            setUnverifiedEmail={setUnverifiedEmail}
            showDataSourcePanel={showDataSourcePanel}
            setShowDataSourcePanel={setShowDataSourcePanel}
            showRealDataPanel={showRealDataPanel}
            setShowRealDataPanel={setShowRealDataPanel}
            // تم حذف showApiStatusPanel
            showSubscriptionPage={showSubscriptionPage}
            setShowSubscriptionPage={setShowSubscriptionPage}
            subscriptionStep={subscriptionStep}
            setSubscriptionStep={setSubscriptionStep}
            selectedPlan={selectedPlan}
            setSelectedPlan={setSelectedPlan}
            userInfo={userInfo}
            setUserInfo={setUserInfo}
            lastPaymentData={lastPaymentData}
            handleSelectPlan={handleSelectPlan}
            handlePaymentComplete={handlePaymentComplete}
            handleBackToLogin={handleBackToLogin}
            activeTab={activeTab}
            setActiveTab={(tab) => setActiveTab(tab as 'signals' | 'recommendations' | 'precise' | 'admin' | 'subscription')}
            assets={assets}
            signals={signals}
            strategy={strategy}
            isConnected={isConnected}
            executeSignal={executeSignal}
            isActive={isActive}
            toggleBot={toggleBot}
            clearSignals={clearSignals}
            onNavigate={navigate}
          />
          </AppRouter>
        </>
      </LanguageProvider>
    </ThemeProvider>
  );
}

interface AppContentProps {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
  login: (credentials: { username: string; password: string }) => Promise<boolean>;
  logout: () => void;
  handleLogout: () => Promise<void>;
  isLoginLoading: boolean;
  showRegisterPage: boolean;
  showLoginPage: boolean;
  setShowLoginPage: (show: boolean) => void;
  handleRegister: (userData: {
    email: string;
    username: string;
    fullName: string;
    country: string;
    password: string;
  }) => Promise<{ success: boolean; error?: string }>;
  handleNavigateToRegister: () => void;
  handleNavigateToPasswordReset: () => void;
  handleBackToLoginFromPasswordReset: () => void;
  showPasswordResetPage: boolean;
  // Terms
  showTermsPage: boolean;
  handleNavigateToTerms: () => void;
  handleNavigateToSubscription: () => void;
  isRegisterLoading: boolean;
  authError: string | null;
  showEmailVerificationFromLogin: boolean;
  unverifiedEmail: string;
  setShowEmailVerificationFromLogin: (show: boolean) => void;
  setUnverifiedEmail: (email: string) => void;
  showDataSourcePanel: boolean;
  setShowDataSourcePanel: (show: boolean) => void;
  showRealDataPanel: boolean;
  setShowRealDataPanel: (show: boolean) => void;
  // تم حذف showApiStatusPanel
  showSubscriptionPage: boolean;
  setShowSubscriptionPage: (show: boolean) => void;
  subscriptionStep: 'plans' | 'userinfo' | 'payment' | 'success' | 'pending' | 'review';
  setSubscriptionStep: (step: 'plans' | 'userinfo' | 'payment' | 'success' | 'pending' | 'review') => void;
  selectedPlan: any;
  setSelectedPlan: (plan: any) => void;
  userInfo: any;
  setUserInfo: (info: any) => void;
  lastPaymentData: any;
  handleSelectPlan: (plan: any) => void;
  handlePaymentComplete: (paymentMethod?: string, status?: string, paymentData?: any) => void;
  handleBackToLogin: () => void;
  activeTab: string;
  setActiveTab: (tab: 'signals' | 'recommendations' | 'precise' | 'admin' | 'subscription') => void;
  assets: any[];
  signals: any[];
  strategy: any;
  isConnected: boolean;
  executeSignal: (signal: any) => void;
  isActive: boolean;
  toggleBot: () => void;
  clearSignals: () => void;
  onNavigate: (page: PageType) => void;
}

const AppContent: React.FC<AppContentProps> = ({
  isAuthenticated,
  isLoading,
  user,
  login,
  logout,
  handleLogout,
  isLoginLoading,
  showRegisterPage,
  showLoginPage,
  setShowLoginPage,
  handleRegister,
  handleNavigateToRegister,
  handleNavigateToPasswordReset,
  handleBackToLoginFromPasswordReset,
  showPasswordResetPage,
  showTermsPage,
  handleNavigateToTerms,
  handleNavigateToSubscription,
  isRegisterLoading,
  authError,
  showEmailVerificationFromLogin,
  unverifiedEmail,
  setShowEmailVerificationFromLogin,
  setUnverifiedEmail,
  showDataSourcePanel,
  setShowDataSourcePanel,
  showRealDataPanel,
  setShowRealDataPanel,
  // تم حذف showApiStatusPanel,
  showSubscriptionPage,
  setShowSubscriptionPage,
  subscriptionStep,
  setSubscriptionStep,
  selectedPlan,
  userInfo,
  lastPaymentData,
  handleSelectPlan,
  handlePaymentComplete,
  handleBackToLogin,
  activeTab,
  setActiveTab,
  assets,
  isActive,
  toggleBot,
  onNavigate,
}) => {
  
  // حالة صفحة الإعدادات
  const [settingsVisible, setSettingsVisible] = useState(false);
  
  // التحقق من حالة الاشتراك للمستخدمين المسجلين
  const { status: subscriptionStatus, loading: subscriptionLoading, refresh: refreshSubscription } = useSubscriptionStatus(user?.id);
  
  
  // التحقق من حالة المستخدم المسجل وتوجيهه للصفحة المناسبة
  if (isAuthenticated && user) {
    // 1. إذا كان البريد غير مفعل، عرض صفحة التفعيل مع زر إعادة الإرسال
    if (user.redirectTo === 'email_verification') {
      return (
        <EmailVerificationPage
          email={user.email}
          fullName={user.full_name || user.username}
          onVerificationSuccess={() => {
            // بعد التفعيل، إعادة تحميل الصفحة
            window.location.reload();
          }}
          onBackToRegister={() => {
            // تسجيل الخروج والعودة لتسجيل الدخول
            logout();
          }}
          onVerifyCode={async () => {
            // نظام الرموز غير مستخدم، نستخدم روابط Supabase
            return { success: false, error: 'يرجى استخدام رابط التفعيل المرسل إلى بريدك' };
          }}
          isLoading={false}
        />
      );
    }

    // 2. إذا كان يحتاج اشتراك، توجيه لصفحة الاشتراك
    // ✅ التحقق من أن المستخدم فعلاً يحتاج اشتراك (ليس نشط)
    const needsSubscription = user.redirectTo === 'subscription' && 
                              user.status !== 'active' && 
                              user.subscription_status !== 'active';
    
    if (needsSubscription || (showSubscriptionPage && user.status !== 'active')) {
      console.log('📍 في صفحة الاشتراك - subscriptionStep:', subscriptionStep);
      
      if (!showSubscriptionPage && needsSubscription) {
        handleNavigateToSubscription();
      }
      
      // إنشاء userInfo من بيانات المستخدم إذا لم تكن موجودة
      const currentUserInfo = userInfo || {
        id: user.id, // ✅ إضافة ID المستخدم
        fullName: user.full_name || user.username,
        email: user.email,
      };
      
      // عرض صفحة الاشتراك حسب الخطوة
      console.log('🔀 Switch على subscriptionStep:', subscriptionStep);
      console.log('📦 selectedPlan:', selectedPlan);
      console.log('👤 currentUserInfo:', currentUserInfo);
      
      switch (subscriptionStep) {
        case 'payment':
          return (
            <PaymentPage 
              selectedPlan={selectedPlan}
              userInfo={currentUserInfo}
              onPaymentComplete={handlePaymentComplete}
              onBack={() => setSubscriptionStep('plans')}
              onEditPlan={() => setSubscriptionStep('plans')}
            />
          );
        
        case 'success':
          return (
            <PaymentSuccessPage 
              selectedPlan={selectedPlan}
              userInfo={currentUserInfo}
              onBackToLogin={handleBackToLogin}
            />
          );

        case 'pending':
          return (
            <PaymentPendingPage 
              selectedPlan={selectedPlan}
              userInfo={currentUserInfo}
              onBackToLogin={handleBackToLogin}
            />
          );
        
        case 'review':
          return (
            <PaymentReviewPage 
              selectedPlan={selectedPlan}
              userInfo={currentUserInfo}
              paymentData={lastPaymentData || {}}
              onBackToLogin={handleBackToLogin}
              onCheckStatus={async () => {
                try {
                  const result = await paymentService.checkUserPaymentStatus(user?.id, (lastPaymentData as any)?.id);
                  return result;
                } catch (error) {
                  console.error('خطأ في التحقق من حالة الدفع:', error);
                  return { status: 'pending', message: 'خطأ في التحقق' };
                }
              }}
            />
          );
        
        default:
          return (
            <SubscriptionPage 
              onSelectPlan={handleSelectPlan}
              onBackToLogin={handleBackToLogin}
            />
          );
      }
    }

    // 3. إذا كان الدفع في انتظار الموافقة
    if (user.redirectTo === 'payment_pending') {
      return (
        <PaymentPendingPage
          selectedPlan={selectedPlan}
          userInfo={userInfo}
          onBackToLogin={() => logout()}
          onBackToHome={() => logout()}
          onCheckStatus={() => window.location.reload()}
        />
      );
    }

    // 4. إذا كان الحساب محظور
    if (user.redirectTo === 'blocked') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
          <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-8 text-center max-w-md">
            <h2 className="text-2xl font-bold text-red-400 mb-4">حساب محظور</h2>
            <p className="text-gray-300 mb-6">تم حظر حسابك. يرجى التواصل مع الإدارة.</p>
            <button
              onClick={logout}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      );
    }
  }

  // إذا كان المستخدم مسجل الدخول لكن اشتراكه منتهي فعلياً، عرض صفحة الحجب
  // ملاحظة: إذا كان الاشتراك ينتهي قريباً فقط (isExpiringSoon)، نعرض بانر تحذير فقط وليس حجب كامل
  if (isAuthenticated && !subscriptionLoading && subscriptionStatus.isExpired && user?.role !== 'admin') {
    return (
      <SubscriptionBlockedPage
        subscriptionStatus={subscriptionStatus}
        onRenewSubscription={() => setShowSubscriptionPage(true)}
        onLogout={logout}
        onRefresh={refreshSubscription}
      />
    );
  }
  
  // إذا كان المستخدم غير مسجل الدخول، عرض صفحة التسجيل أو تسجيل الدخول أو الاشتراك
  if (!isAuthenticated && !isLoading) {
    // عرض صفحة تسجيل الدخول
    if (showLoginPage) {
      return (
        <LoginPage 
          onLogin={login}
          onNavigateToSubscription={handleNavigateToSubscription}
          onNavigateToRegister={handleNavigateToRegister}
          onNavigateToPasswordReset={handleNavigateToPasswordReset}
          onBack={() => setShowLoginPage(false)}
          isLoading={isLoginLoading}
          error={authError}
        />
      );
    }

    // عرض صفحة تفعيل البريد (بعد محاولة تسجيل الدخول ببريد غير مفعل)
    if (showEmailVerificationFromLogin && unverifiedEmail) {
      return (
        <EmailVerificationPage
          email={unverifiedEmail}
          fullName=""
          onVerificationSuccess={() => {
            // بعد التفعيل، العودة لتسجيل الدخول
            setShowEmailVerificationFromLogin(false);
            setUnverifiedEmail('');
            setShowLoginPage(true);
            alert('✅ تم تفعيل البريد بنجاح! يمكنك الآن تسجيل الدخول.');
          }}
          onBackToRegister={() => {
            // العودة لتسجيل الدخول
            setShowEmailVerificationFromLogin(false);
            setUnverifiedEmail('');
            setShowLoginPage(true);
          }}
          onVerifyCode={async () => {
            return { success: false, error: 'يرجى استخدام رابط التفعيل المرسل إلى بريدك' };
          }}
          isLoading={false}
        />
      );
    }

    // عرض صفحة استعادة كلمة المرور
    if (showPasswordResetPage) {
      return (
        <PasswordResetPage
          onBack={handleBackToLoginFromPasswordReset}
        />
      );
    }

    // عرض صفحة الشروط والأحكام
    if (showTermsPage) {
      return (
        <TermsPage
          onBack={handleNavigateToRegister}
        />
      );
    }

    // عرض صفحة التسجيل
    if (showRegisterPage) {
      return (
        <RegisterPage
          onRegister={handleRegister}
          onNavigateToLogin={handleBackToLogin}
          onNavigateToTerms={handleNavigateToTerms}
          isLoading={isRegisterLoading}
          error={authError}
        />
      );
    }

    if (showSubscriptionPage) {
      // عرض الصفحة المناسبة حسب خطوة الاشتراك
      switch (subscriptionStep) {
        case 'plans':
          return (
            <SubscriptionPage 
              onSelectPlan={handleSelectPlan}
              onBackToLogin={handleBackToLogin}
            />
          );
        
        case 'payment':
          return (
            <PaymentPage 
              selectedPlan={selectedPlan}
              userInfo={userInfo}
              onPaymentComplete={handlePaymentComplete}
              onBack={() => setSubscriptionStep('plans')}
              onEditPlan={() => setSubscriptionStep('plans')}
            />
          );
        
        case 'success':
          return (
            <PaymentSuccessPage 
              selectedPlan={selectedPlan}
              userInfo={userInfo}
              onBackToLogin={handleBackToLogin}
            />
          );

        case 'pending':
          return (
            <PaymentPendingPage 
              selectedPlan={selectedPlan}
              userInfo={userInfo}
              onBackToLogin={handleBackToLogin}
            />
          );
        
        case 'review':
          return (
            <PaymentReviewPage 
              selectedPlan={selectedPlan}
              userInfo={userInfo}
              paymentData={lastPaymentData || {}}
              onBackToLogin={handleBackToLogin}
              onCheckStatus={async () => {
                // التحقق من حالة المراجعة
                try {
                  const result = await paymentService.checkUserPaymentStatus(user?.id || userInfo?.id, (lastPaymentData as any)?.id);
                  return result;
                } catch (error) {
                  console.error('خطأ في التحقق من حالة الدفع:', error);
                  return { status: 'pending', message: 'خطأ في التحقق' };
                }
              }}
            />
          );
        
        default:
          return (
            <SubscriptionPage 
              onSelectPlan={handleSelectPlan}
              onBackToLogin={handleBackToLogin}
            />
          );
      }
    }
    
    // الصفحة الرئيسية (الافتراضية)
    return (
      <LandingPage 
        onNavigateToLogin={() => {
          // التوجه إلى صفحة تسجيل الدخول فوراً
          setShowLoginPage(true);
          window.history.pushState({ page: 'login' }, '', '/login');
          window.dispatchEvent(new CustomEvent('app-navigate', { detail: { path: '/login' } }));
        }}
        onNavigateToRegister={() => {
          // التوجه إلى صفحة التسجيل فوراً
          handleNavigateToRegister();
        }}
        onNavigate={(page) => {
          // التعامل مع التنقل من الفوتر أو أي مكان آخر
          if (page === 'login') {
            setShowLoginPage(true);
          } else if (page === 'register') {
            handleNavigateToRegister();
          } else {
            // تمرير التنقل للصفحات الأخرى (terms, contact, about) إلى نظام التوجيه
            onNavigate(page as any);
          }
        }}
      />
    );
  }

  // إذا كان التحميل جارياً أو مسجل دخول لكن بيانات المستخدم لم تُحمّل بعد
  if (isLoading || (isAuthenticated && !user)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">
            {isAuthenticated ? 'جاري تحميل بيانات المستخدم...' : 'جاري التحميل...'}
          </p>
        </div>
      </div>
    );
  }

  // 🔒 حماية شاملة: منع الدخول للوحة التحكم (Dashboard) بدون اشتراك نشط
  // لوحة التحكم تحتوي على جميع وظائف البوت (الإشارات، التوصيات، التحليلات)
  if (isAuthenticated && user && user.role !== 'admin') {
    // فحص حالة الاشتراك مع الأخذ بعين الاعتبار الوقت المتبقي
    const hasActiveSubscription = user.subscription_status === 'active' || user.status === 'active';
    const hasTimeRemaining = subscriptionStatus && subscriptionStatus.isActive; // يتحقق من الوقت المتبقي
    const isOwner = user.email === 'hichamkhad00@gmail.com'; // حساب المالك
    
    // السماح بالدخول إذا كان الاشتراك نشط أو لديه وقت متبقي أو هو المالك
    if (!hasActiveSubscription && !hasTimeRemaining && !isOwner) {
      console.warn('🚫 محاولة الدخول للوحة التحكم بدون اشتراك نشط!');
      console.log('📊 تفاصيل المستخدم:', {
        id: user.id,
        email: user.email,
        username: user.username,
        status: user.status,
        subscription_status: user.subscription_status,
        subscriptionStatus: subscriptionStatus,
        role: user.role
      });
      
      // إجبار التوجيه لصفحة الاشتراك
      if (!showSubscriptionPage) {
        handleNavigateToSubscription();
      }
      
      // عرض صفحة الاشتراك فقط
      return (
        <SubscriptionPage 
          onSelectPlan={handleSelectPlan}
          onBackToLogin={handleBackToLogin}
        />
      );
    }
  }

  // المستخدم مسجل الدخول ولديه اشتراك نشط - عرض التطبيق الرئيسي
  return (
    <div className={cn(
      designSystem.colors.background.primary,
      "min-h-screen relative overflow-hidden"
    )}>
      {/* خلفية متحركة */}
      <div className="absolute inset-0 opacity-30 dark:opacity-30 opacity-20">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 dark:bg-purple-500 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-500 dark:bg-yellow-500 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 dark:bg-pink-500 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>
      {/* المحتوى الرئيسي */}
      <div className="relative z-10">
        <Header 
          isConnected={isActive} 
          onToggleBot={toggleBot}
          onOpenDataSource={() => setShowDataSourcePanel(true)}
          onOpenRealDataPanel={() => setShowRealDataPanel(true)}
          onOpenApiStatus={() => {}} // تم تعطيل ApiStatus
          user={user}
          onLogout={handleLogout}
          onOpenSettings={() => setSettingsVisible(true)}
        />
        
        <main className="w-full px-0 py-2 sm:py-4 space-y-3 sm:space-y-4">
          {/* شريط التنقل العصري */}
          <Navigation 
            activeTab={activeTab}
            onTabChange={(tab) => setActiveTab(tab as any)}
            userRole={user?.role}
          />
          {/* بانر حالة الاشتراك */}
          {!subscriptionLoading && user?.role !== 'admin' && (
            <div className="px-2 sm:px-4">
              <SubscriptionStatusBanner
                status={subscriptionStatus}
                onRenew={() => setShowSubscriptionPage(true)}
                onViewDetails={() => setActiveTab('subscription' as any)}
              />
            </div>
          )}

          {/* التخطيط المتجاوب المحسن */}
          <div className={`grid grid-cols-1 lg:grid-cols-12 gap-2 ${(['assistant','recommendations','admin','subscription','payments'].includes(activeTab as any) ? 'px-0' : 'px-1')}`}>
            {/* الشريط الجانبي الأيسر - الأصول والإعدادات (مخفي في لوحة التحكم) */}
            {activeTab !== 'admin' && (
              <div className="order-2 lg:order-none lg:col-span-6 space-y-2 sm:space-y-3">
                <Card variant="glass" padding="sm">
                  <AssetsList assets={assets} isActive={isActive} />
                </Card>
              </div>
            )}

            {/* المحتوى الرئيسي */}
            <div className={`order-1 lg:order-none space-y-2 sm:space-y-3 ${activeTab === 'admin' ? 'lg:col-span-12' : 'lg:col-span-6'}`}>
              <Card variant="elevated" padding={(activeTab === 'recommendations' || activeTab === 'precise' || (activeTab === 'admin' && user?.role === 'admin') || (activeTab === 'subscription' && user?.role === 'trader') || (activeTab === 'payments' && user?.role === 'trader')) ? 'none' : 'sm'} className="overflow-hidden min-h-[400px] sm:min-h-[500px]">
                {activeTab === 'recommendations' && (
                  <div className="py-2 sm:py-3 lg:py-4">
                    <div className="px-4 sm:px-6 lg:px-8">
                      <SmartRecommendationsPanel isActive={isActive} />
                    </div>
                  </div>
                )}
                
                {activeTab === 'precise' && (
                  <div className="py-2 sm:py-3 lg:py-4">
                    <div className="px-4 sm:px-6 lg:px-8">
                      <PreciseBinaryRecommendations isActive={isActive} />
                    </div>
                  </div>
                )}
                
                {/* تم حذف تبويبات إدارة المخاطر واتصال IQ Option والصفقات المحاكاة بناءً على طلب المستخدم */}
                
                {/* تم حذف مساعد التداول بناءً على طلب المستخدم */}

                {activeTab === 'admin' && user?.role === 'admin' && (
                  <AdminPanel key={`admin-${user.id}`} currentUser={user} />
                )}
                
                {activeTab === 'subscription' && user?.role === 'trader' && (
                  <SubscriptionAndPaymentsPage
                    key={`subscription-${user.id}-${subscriptionStatus.isActive}`}
                    status={subscriptionStatus}
                    userInfo={userInfo}
                    userId={user?.id}
                    onBack={() => setActiveTab('signals')}
                    onRenew={() => {
                      setActiveTab('signals');
                      handleNavigateToSubscription();
                    }}
                  />
                )}
              </Card>
            </div>

            {/* الشريط الجانبي الأيمن - تمت إزالته بناءً على طلب المستخدم */}
          </div>
        </main>
      </div>

      {/* لوحة إدارة مصادر البيانات */}
      <DataSourcePanel 
        isVisible={showDataSourcePanel}
        onClose={() => setShowDataSourcePanel(false)}
      />

      {/* لوحة البيانات الحقيقية */}
      {showRealDataPanel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-gray-800 rounded-lg p-4 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">البيانات الحقيقية</h2>
              <button 
                onClick={() => setShowRealDataPanel(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <RealDataToggle />
          </Card>
        </div>
      )}

      {/* تم حذف لوحة حالة APIs */}

      {/* صفحة الإعدادات */}
      <SettingsPage 
        isVisible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        user={user}
      />

      <Footer onNavigate={onNavigate} />
      
      {/* زر التحكم العائم للهواتف */}
      <MobileBotControl 
        isConnected={isActive} 
        onToggleBot={toggleBot}
      />
    </div>
  );
}

export default App;