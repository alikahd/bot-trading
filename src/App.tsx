import { useState, useEffect, useRef } from 'react';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { EmailVerificationPage } from './components/auth/EmailVerificationPage';
import { EmailVerifiedSuccessPage } from './components/auth/EmailVerifiedSuccessPage';
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
import { AdminNotificationsProvider } from './contexts/AdminNotificationsContext';
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
import { AdminNotificationBanner } from './components/notifications/AdminNotificationBanner';
import { SubscriptionBlockedPage } from './components/subscription/SubscriptionBlockedPage';
import { SubscriptionAndPaymentsPage } from './components/subscription/SubscriptionAndPaymentsPage';
import LiveChatWidget from './components/chat/LiveChatWidget';
import { SettingsPage } from './components/settings/SettingsPage';
import { ReferralModal } from './components/referral/ReferralModal';
import { clearAllCaches } from './utils/cacheUtils';
import { BotLoadingAnimation } from './components/common/BotLoadingAnimation';
import { periodicNotificationService } from './services/periodicNotificationService';
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
  
  // بدء خدمة الإشعارات الدورية
  useEffect(() => {
    if (isAuthenticated && user?.subscription_status === 'active') {
      console.log('🚀 تفعيل خدمة الإشعارات الدورية');
      periodicNotificationService.start();
      
      return () => {
        console.log('⏹️ إيقاف خدمة الإشعارات الدورية');
        periodicNotificationService.stop();
      };
    }
  }, [isAuthenticated, user?.subscription_status]);

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
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showRegisterPage, setShowRegisterPage] = useState(false);
  const [showLoginPage, setShowLoginPage] = useState(false);
  const [showPasswordResetPage, setShowPasswordResetPage] = useState(false);
  const [showTermsPage, setShowTermsPage] = useState(false);
  const [showEmailVerificationFromLogin, setShowEmailVerificationFromLogin] = useState(false);
  const [showEmailVerifiedSuccess, setShowEmailVerifiedSuccess] = useState(false);
  const [isProcessingEmailVerification, setIsProcessingEmailVerification] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  
  // نظام التوجيه
  const { currentPage, navigate } = useRouter();

  // حالة البوت - في المكون الرئيسي
  const [isActive, setIsActive] = useState(false);
  
  
  const toggleBot = () => {
    setIsActive(!isActive);
    console.log(`🤖 البوت ${!isActive ? 'مُفعّل' : 'متوقف'}`);
  };

  // ⚡ Ref لمنع التنفيذ المتكرر في React Strict Mode
  const isProcessingCallback = useRef(false);
  
  // معالجة callback من Supabase بعد تأكيد البريد
  useEffect(() => {
    const handleEmailConfirmation = async () => {
      // ⚡ منع التنفيذ المتكرر
      if (isProcessingCallback.current) {
        console.log('⏭️ [SKIP] تخطي - جاري المعالجة بالفعل');
        return;
      }
      
      const hash = window.location.hash;
      const searchParams = new URLSearchParams(window.location.search);
      
      console.log('🔍 [EMAIL VERIFICATION] Checking URL:', {
        hash: hash || '<empty>',
        search: window.location.search || '<empty>',
        pathname: window.location.pathname,
        fullURL: window.location.href
      });
      
      // التحقق من وجود access_token أو code (PKCE flow) في hash أو query params
      const hasAccessToken = hash.includes('access_token') || searchParams.has('access_token');
      const hasCode = searchParams.has('code'); // PKCE flow
      const hasTypeSignup = hash.includes('type=signup') || searchParams.get('type') === 'signup';
      const hasConfirmation = hash.includes('confirmation') || searchParams.has('confirmation');
      const isAuthCallback = window.location.pathname === '/auth/callback';
      
      if (!(hasAccessToken || hasCode || hasTypeSignup || hasConfirmation || (isAuthCallback && hasCode))) {
        // لا يوجد callback - تحقق من الحالة البديلة
        isProcessingCallback.current = false; // ⚡ إعادة تعيين
        try {
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user?.email_confirmed_at) {
            console.log('🔍 تم العثور على session مفعلة بدون hash - التحقق من حالة التفعيل');
            
            // التحقق من قاعدة البيانات
            const { data: userData } = await supabase
              .from('users')
              .select('email_verified, status')
              .eq('auth_id', session.user.id)
              .single();
            
            // إذا كان البريد مفعّل حديثاً (خلال آخر دقيقة)
            const verifiedAt = new Date(session.user.email_confirmed_at);
            const now = new Date();
            const diffMinutes = (now.getTime() - verifiedAt.getTime()) / (1000 * 60);
            
            if (diffMinutes < 1 && userData && !userData.email_verified) {
              console.log('✅ تم اكتشاف تفعيل حديث - تحديث قاعدة البيانات');
              
              // تحديث قاعدة البيانات
              await supabase
                .from('users')
                .update({
                  email_verified: true,
                  status: 'pending_subscription',
                  email_verified_at: session.user.email_confirmed_at,
                  updated_at: new Date().toISOString()
                })
                .eq('auth_id', session.user.id);
              
              // عرض صفحة التأكيد
              setTimeout(() => {
                setShowLoginPage(false);
                setShowRegisterPage(false);
                setShowEmailVerificationFromLogin(false);
                setShowEmailVerifiedSuccess(true);
              }, 500);
            }
          }
        } catch (error) {
          console.error('❌ خطأ في التحقق من session:', error);
        }
        return; // ⚡ خروج مبكر
      }
      
      // يوجد callback - معالجة
      console.log('✅ تم اكتشاف callback من Supabase', {
        hasAccessToken,
        hasCode,
        isAuthCallback,
        code: searchParams.get('code')?.substring(0, 10) + '...'
      });
      
      // ⚡ عرض شاشة تحميل فوراً (قبل أي معالجة)
      setIsProcessingEmailVerification(true);
      console.log('⏳ عرض شاشة التحميل فوراً');
      
      // ⚡ تعيين flag - بدء المعالجة
      isProcessingCallback.current = true;
      console.log('🔒 [LOCK] تم قفل المعالجة');
      
      // متغير للتحقق من Google OAuth
      let isGoogleOAuth = false;
      
      try {
        let session = null;
        let sessionError = null;
        
        // إذا كان لدينا code (PKCE flow)، نحتاج لتبديله بـ session
        if (hasCode && searchParams.get('code')) {
          console.log('🔄 تبديل PKCE code بـ session...');
          
          // ⚡ مسح الـ code من URL فوراً لمنع إعادة الاستخدام
          const code = searchParams.get('code')!;
          window.history.replaceState(null, '', '/');
          console.log('🧹 تم مسح code من URL');
          
          try {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            session = data.session;
            sessionError = error;
            
            if (error) {
              // ⚡ تجاهل الخطأ إذا كان الـ code مستخدم بالفعل (React Strict Mode)
              if (error.message.includes('code verifier')) {
                console.log('⚠️ الكود مستخدم بالفعل - تجاهل (React Strict Mode)');
              } else {
                console.error('❌ خطأ في تبديل code:', error);
              }
            } else {
              console.log('✅ تم تبديل code بنجاح');
            }
          } catch (err) {
            console.log('⚠️ خطأ في exchangeCodeForSession - تجاهل');
          }
        } else {
          // الحصول على session الحالية
          const { data, error } = await supabase.auth.getSession();
          session = data.session;
          sessionError = error;
        }
        
        console.log('📊 Session data:', {
          hasSession: !!session,
          email: session?.user?.email,
          email_confirmed_at: session?.user?.email_confirmed_at,
          provider: session?.user?.app_metadata?.provider,
          error: sessionError
        });
        
        // ✅ التحقق من مصدر التسجيل
        const isGoogleAuth = session?.user?.app_metadata?.provider === 'google';
        console.log('🔍 مصدر التسجيل:', isGoogleAuth ? 'Google OAuth' : 'Email/Password');
        
        if (session?.user) {
          // إذا كان Google OAuth، نتحقق من حالة المستخدم ونوجهه مباشرة
          if (isGoogleAuth) {
            console.log('🔐 [GOOGLE OAUTH] التحقق من حالة المستخدم...');
            console.log('⚡ [GOOGLE OAUTH] تعيين isGoogleOAuth = true');
            isGoogleOAuth = true; // ✅ تعيين flag
            
            const { data: userData } = await supabase
              .from('users')
              .select('email_verified, status, subscription_status, is_active')
              .eq('auth_id', session.user.id)
              .single();
            
            console.log('👤 بيانات المستخدم:', userData);
            
            // تحديث البيانات إذا لزم الأمر
            if (userData && !userData.email_verified) {
              await supabase
                .from('users')
                .update({
                  email_verified: true,
                  email_verified_at: session.user.email_confirmed_at || new Date().toISOString(),
                  updated_at: new Date().toISOString()
                })
                .eq('auth_id', session.user.id);
            }
            
            // ✅ توجيه مباشر بدون عرض صفحة التأكيد
            console.log('✅ [GOOGLE OAUTH] توجيه مباشر بدون نافذة تأكيد');
            
            // ⚡ إخفاء شاشة التحميل
            setIsProcessingEmailVerification(false);
            
            // ⚡ لا نعرض نافذة التأكيد - نخرج فوراً
            // سيتم التوجيه التلقائي من خلال simpleAuthService
            // URL تم مسحه بالفعل في الأعلى
            console.log('🚪 [GOOGLE OAUTH] RETURN - خروج من handleEmailConfirmation');
            return; // ⚡ خروج فوري بدون عرض أي شيء
          }
          
          // Email/Password - معالجة عادية
          console.log('📧 Email/Password - تحديث قاعدة البيانات...');
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
      
      // ⚡ فقط لـ Email/Password - عرض صفحة التأكيد
      console.log('🔍 [FINAL CHECK] isGoogleOAuth =', isGoogleOAuth);
      
      // ⚡ تحقق إضافي: هل هناك session نشطة؟
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const hasActiveSession = !!currentSession;
      console.log('🔍 [SESSION CHECK] hasActiveSession =', hasActiveSession);
      
      // ⚡ لا نعرض النافذة إذا:
      // 1. Google OAuth (isGoogleOAuth = true)
      // 2. يوجد session نشطة (المستخدم مسجل دخول بالفعل)
      if (!isGoogleOAuth && !hasActiveSession) {
        console.log('✅ [EMAIL/PASSWORD] عرض صفحة التأكيد');
        
        // URL تم مسحه بالفعل في الأعلى
        
        // إخفاء جميع الصفحات الأخرى
        setShowLoginPage(false);
        setShowRegisterPage(false);
        setShowEmailVerificationFromLogin(false);
        
        // عرض صفحة تأكيد التفعيل فوراً
        setShowEmailVerifiedSuccess(true);
        setIsProcessingEmailVerification(false);
      } else {
        console.log('⚡ تم التخطي - لا نعرض نافذة التأكيد (Google OAuth أو session نشطة)');
        // إخفاء شاشة التحميل
        setIsProcessingEmailVerification(false);
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

  // ⚡ مستمع لحدث "تفعيل البريد" - توجيه مباشر لصفحة الاشتراك
  useEffect(() => {
    const handleEmailVerified = (event: Event) => {
      const customEvent = event as CustomEvent;
      
      console.log('✅ تم تفعيل البريد - توجيه لصفحة الاشتراك', customEvent.detail?.userId);
      
      // إخفاء صفحات التسجيل/الدخول
      setShowLoginPage(false);
      setShowRegisterPage(false);
      setShowEmailVerificationFromLogin(false);
      
      // إظهار صفحة الاشتراك مباشرة
      setShowSubscriptionPage(true);
      setSubscriptionStep('plans');
      
      // تحديث URL إلى صفحة الاشتراك
      window.history.replaceState({ authenticated: true }, '', '/subscription');
      
      // مسح العلامة
      localStorage.removeItem('email_just_verified');
    };

    window.addEventListener('email-verified', handleEmailVerified as EventListener);
    return () => window.removeEventListener('email-verified', handleEmailVerified as EventListener);
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

  // إعادة تعيين حالة التحقق عند تسجيل الخروج
  useEffect(() => {
    if (!isAuthenticated) {
      // عند تسجيل الخروج، إعادة تعيين جميع الحالات
      setIsCheckingSubscription(false);
      setShowSubscriptionPage(false);
      localStorage.removeItem(STORAGE_KEYS.SHOW_SUBSCRIPTION_PAGE);
      
      // ✅ إعادة تحميل الصفحة لمسح subscriptionStatus من الذاكرة
      // هذا يضمن عدم ظهور نافذة انتهاء الاشتراك من الجلسة السابقة
      console.log('🔄 تم إعادة تعيين جميع الحالات - سيتم إعادة تحميل الصفحة');
    }
  }, [isAuthenticated]);


  // معالجة التوجيه التلقائي بعد تسجيل الدخول
  useEffect(() => {
    if (isAuthenticated && user && !isLoading) {
      console.log('🔄 معالجة التوجيه التلقائي للمستخدم:', user.email, 'redirectTo:', user.redirectTo);
      
      // ✅ فحص فوري من بيانات المستخدم - بدون انتظار subscriptionStatus
      const isAdmin = user.role === 'admin';
      const hasActiveSubscription = user.subscription_status === 'active';
      
      // إخفاء صفحات المصادقة
      setShowLoginPage(false);
      setShowRegisterPage(false);
      setShowPasswordResetPage(false);
      setShowEmailVerificationFromLogin(false);
      
      // ✅ Admin أو مشترك → دخول فوري بدون انتظار
      if (isAdmin || hasActiveSubscription) {
        console.log(isAdmin ? '👑 Admin - دخول فوري' : '✅ مشترك - دخول فوري');
        setShowSubscriptionPage(false);
        localStorage.removeItem(STORAGE_KEYS.SHOW_SUBSCRIPTION_PAGE);
        setActiveTab('recommendations');
        window.history.replaceState({ authenticated: true }, '', '/dashboard');
        setIsCheckingSubscription(false); // ✅ إيقاف فحص الاشتراك فوراً
        return;
      }
      
      // للمستخدمين غير المشتركين، معالجة حسب redirectTo
      if (user.redirectTo === 'email_verification') {
        console.log('📧 توجيه لتفعيل البريد الإلكتروني');
        setUnverifiedEmail(user.email);
        setShowEmailVerificationFromLogin(true);
        setIsCheckingSubscription(false);
      } else if (user.redirectTo === 'subscription') {
        console.log('📦 توجيه لصفحة الاشتراك - المستخدم غير مشترك');
        setShowSubscriptionPage(true);
        setSubscriptionStep('plans');
        window.history.replaceState({ authenticated: true }, '', '/subscription');
        setIsCheckingSubscription(false);
      } else if (user.redirectTo === 'payment_pending') {
        console.log('⏳ توجيه لصفحة انتظار المراجعة');
        setShowSubscriptionPage(true);
        setSubscriptionStep('review');
        window.history.replaceState({ authenticated: true }, '', '/payment/review');
        setIsCheckingSubscription(false);
      } else if (user.redirectTo === 'blocked') {
        console.log('🚫 المستخدم محظور');
        alert('تم حظر حسابك. يرجى التواصل مع الدعم.');
        handleLogout();
        setIsCheckingSubscription(false);
      } else {
        // حالة احتياطية - دخول للوحة التحكم
        console.log('✅ دخول للوحة التحكم (حالة احتياطية)');
        setShowSubscriptionPage(false);
        localStorage.removeItem(STORAGE_KEYS.SHOW_SUBSCRIPTION_PAGE);
        setActiveTab('recommendations');
        window.history.replaceState({ authenticated: true }, '', '/dashboard');
        setIsCheckingSubscription(false);
      }
    }
  }, [isAuthenticated, user, isLoading]);

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
      const hasActiveSubscription = user && (user.role === 'admin' || user.subscription_status === 'active');
      
      if (hasActiveSubscription) {
        // إضافة URL لصفحة المدفوعات والاشتراكات
        const currentPath = window.location.pathname;
        if (currentPath !== '/subscription/manage') {
          window.history.pushState({ authenticated: true, tab: 'subscription' }, '', '/subscription/manage');
          window.dispatchEvent(new CustomEvent('app-navigate', { detail: { path: '/subscription/manage' } }));
        }
      } else {
        // المستخدم ليس لديه اشتراك - منع الوصول وإعادة توجيه
        console.log('⚠️ محاولة الوصول لصفحة المدفوعات بدون اشتراك ساري');
        setActiveTab('recommendations');
        setShowSubscriptionPage(true);
      }
    }
  }, [activeTab, isAuthenticated, user]);
  
  // ✅ إيقاف فحص الاشتراك للمشتركين والـ admin
  useEffect(() => {
    if (isAuthenticated && user && isCheckingSubscription) {
      const isAdmin = user.role === 'admin';
      const hasActiveSubscription = user.subscription_status === 'active';
      
      if (isAdmin || hasActiveSubscription) {
        console.log('✅ إيقاف فحص الاشتراك - المستخدم مشترك أو admin');
        setIsCheckingSubscription(false);
      }
    }
  }, [isAuthenticated, user, isCheckingSubscription]);
  
  const [showSubscriptionPage, setShowSubscriptionPage] = useState(false);
  
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
      // إذا كان مسجل دخول وليس في صفحة اشتراك، العودة للوحة التحكم
      const currentPath = window.location.pathname;
      if (currentPath !== '/dashboard' && !currentPath.startsWith('/subscription') && !currentPath.startsWith('/payment')) {
        window.history.pushState({}, '', '/dashboard');
        window.dispatchEvent(new CustomEvent('app-navigate', { detail: { path: '/dashboard' } }));
      }
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
      
      // إذا كنا في صفحة محظورة، نستبدلها بلوحة التحكم
      if (forbiddenPaths.includes(currentPath)) {
        window.history.replaceState(
          { authenticated: true, safe: true }, 
          '', 
          '/dashboard'
        );
        console.log('🔒 تم استبدال الصفحة المحظورة بلوحة التحكم');
      }
    }
  }, [isAuthenticated]);
  
  // الاستماع لزر الرجوع في المتصفح لتحديث حالة الاشتراك والدفع
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const path = window.location.pathname;
      console.log('🔙 زر الرجوع - المسار:', path, '| مسجل دخول:', isAuthenticated);
      
      // منع الرجوع من الصفحة الرئيسية تماماً
      if ((path === '/' || path === '/home') && event.state?.preventBack) {
        console.log('🚫 منع الرجوع من الصفحة الرئيسية');
        window.history.pushState({ page: 'landing', preventBack: true }, '', '/home');
        return;
      }
      
      // منع الرجوع للصفحات المحظورة فقط (السماح بالرجوع للصفحات الصالحة)
      if (isAuthenticated) {
        const forbiddenPaths = ['/', '/home', '/login', '/register'];
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
      if (path === '/dashboard') {
        // صفحة لوحة التحكم - فقط للمستخدمين المشتركين
        if (isAuthenticated && user && (user.role === 'admin' || user.subscription_status === 'active')) {
          setShowSubscriptionPage(false);
          setShowLoginPage(false);
          setShowRegisterPage(false);
          setShowPasswordResetPage(false);
          setActiveTab('recommendations');
        } else {
          // المستخدم غير مشترك - إعادة توجيه لصفحة الاشتراك
          console.log('⚠️ محاولة الوصول للوحة التحكم بدون اشتراك ساري - إعادة توجيه');
          window.history.replaceState({ authenticated: true }, '', '/subscription');
          setShowSubscriptionPage(true);
          setSubscriptionStep('plans');
        }
      } else if (path === '/subscription/manage') {
        // صفحة المدفوعات والاشتراكات - فقط للمستخدمين الذين لديهم اشتراك
        // منع الوصول للمستخدمين الجدد الذين لم يدفعوا بعد
        if (user && (user.role === 'admin' || user.subscription_status === 'active')) {
          setActiveTab('subscription');
          setShowSubscriptionPage(false);
          setShowLoginPage(false);
          setShowRegisterPage(false);
        } else {
          // المستخدم ليس لديه اشتراك - إعادة توجيه لصفحة الاشتراك
          console.log('⚠️ محاولة الوصول لصفحة المدفوعات بدون اشتراك ساري - إعادة توجيه');
          window.history.replaceState({ authenticated: true }, '', '/subscription');
          setShowSubscriptionPage(true);
          setSubscriptionStep('plans');
        }
      } else if (path === '/subscription') {
        // ✅ فحص: فقط المستخدمين غير المشتركين يمكنهم الوصول لصفحة الاشتراك
        const isAdmin = user?.role === 'admin';
        const hasActiveSubscription = user?.status === 'active' && user?.subscription_status === 'active';
        
        if (!hasActiveSubscription && !isAdmin) {
          setShowSubscriptionPage(true);
          setSubscriptionStep('plans');
        } else {
          // المستخدم مشترك - إعادة توجيه للوحة التحكم
          console.log('🚫 المستخدم مشترك - منع الوصول لصفحة الاشتراك');
          setShowSubscriptionPage(false);
          window.history.replaceState({ authenticated: true }, '', '/dashboard');
        }
        setShowLoginPage(false);
        setShowRegisterPage(false);
      } else if (path === '/payment') {
        // ✅ فحص: فقط المستخدمين غير المشتركين يمكنهم الوصول لصفحة الدفع
        const isAdmin = user?.role === 'admin';
        const hasActiveSubscription = user?.status === 'active' && user?.subscription_status === 'active';
        
        if (!hasActiveSubscription && !isAdmin) {
          setShowSubscriptionPage(true);
          setSubscriptionStep('payment');
        } else {
          // المستخدم مشترك - إعادة توجيه للوحة التحكم
          console.log('🚫 المستخدم مشترك - منع الوصول لصفحة الدفع');
          setShowSubscriptionPage(false);
          window.history.replaceState({ authenticated: true }, '', '/dashboard');
        }
        setShowLoginPage(false);
        setShowRegisterPage(false);
      } else if (path === '/payment/success' || path === '/payment/pending' || path === '/payment/review') {
        // صفحات نتائج الدفع - فقط للمستخدمين الذين لديهم اشتراك أو في عملية دفع
        const hasSubscriptionOrPending = user && (
          user.subscription_status === 'active' || 
          user.subscription_status === 'pending' ||
          user.role === 'admin' ||
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
          console.log('⚠️ محاولة الوصول لصفحة نتائج الدفع بدون اشتراك ساري');
          window.history.replaceState({ authenticated: true }, '', '/subscription');
          setShowSubscriptionPage(true);
          setSubscriptionStep('plans');
        }
      } else if (path === '/login') {
        // منع الوصول لصفحة تسجيل الدخول من الصفحة الرئيسية
        if (!isAuthenticated) {
          setShowLoginPage(true);
          setShowRegisterPage(false);
          setShowSubscriptionPage(false);
        } else {
          // إذا كان مسجل دخول، منع الوصول والعودة للصفحة الرئيسية
          console.log('🚫 محاولة الوصول لصفحة تسجيل الدخول وأنت مسجل دخول - العودة للصفحة الرئيسية');
          window.history.pushState({ page: 'landing', preventBack: true }, '', '/');
        }
      } else if (path === '/register') {
        // منع الوصول لصفحة التسجيل من الصفحة الرئيسية
        if (!isAuthenticated) {
          setShowRegisterPage(true);
          setShowLoginPage(false);
          setShowSubscriptionPage(false);
        } else {
          // إذا كان مسجل دخول، منع الوصول والعودة للصفحة الرئيسية
          console.log('🚫 محاولة الوصول لصفحة التسجيل وأنت مسجل دخول - العودة للصفحة الرئيسية');
          window.history.pushState({ page: 'landing', preventBack: true }, '', '/');
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
        // منع الرجوع من الصفحة الرئيسية - البقاء فيها
        console.log('📍 في الصفحة الرئيسية - منع الرجوع');
        window.history.pushState({ page: 'landing', preventBack: true }, '', '/');
        
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
      // لا نحفظ showSubscriptionPage في localStorage لتجنب ظهور صفحة الاشتراك للمستخدمين المشتركين
      saveToStorage(STORAGE_KEYS.SUBSCRIPTION_STEP, subscriptionStep);
      saveToStorage(STORAGE_KEYS.SELECTED_PLAN, selectedPlan);
      saveToStorage(STORAGE_KEYS.USER_INFO, userInfo);
    }, 500); // تأخير 500ms لتجميع التغييرات

    return () => clearTimeout(timeoutId);
  }, [showDataSourcePanel, showRealDataPanel, activeTab, subscriptionStep, selectedPlan, userInfo]);

  // دوال معالجة المصادقة
  const handleLogin = async (credentials: { username: string; password: string }) => {
    setIsLoginLoading(true);
    setAuthError(null);
    
    try {
      const result = await login(credentials);
      if (!result.success) {
        // عرض رسالة خطأ محددة حسب نوع الخطأ
        if (result.errorType === 'email_not_found') {
          setAuthError('البريد الإلكتروني غير موجود. يرجى التحقق من البريد أو إنشاء حساب جديد.');
        } else if (result.errorType === 'username_not_found') {
          setAuthError('اسم المستخدم غير موجود. يرجى التحقق من اسم المستخدم أو إنشاء حساب جديد.');
        } else if (result.errorType === 'invalid_password') {
          setAuthError('كلمة المرور غير صحيحة. يرجى التحقق من كلمة المرور والمحاولة مرة أخرى.');
        } else if (result.errorType === 'email_not_verified') {
          setAuthError('البريد الإلكتروني غير مفعل. يرجى التحقق من بريدك الإلكتروني وتفعيل الحساب.');
        } else {
          setAuthError(result.error || 'فشل في تسجيل الدخول');
        }
        return false;
      }
      
      // تسجيل دخول ناجح - بدء التحقق من الاشتراك
      console.log('✅ تسجيل دخول ناجح - بدء التحقق من حالة الاشتراك...');
      
      // تفعيل شاشة التحميل للتحقق من الاشتراك
      setIsCheckingSubscription(true);
      
      // انتظار قصير لتحميل بيانات المستخدم
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // إخفاء صفحة تسجيل الدخول
      setShowLoginPage(false);
      
      // سيتم التوجيه تلقائياً حسب حالة المستخدم (redirectTo) من خلال useEffect
      // وسيتم إيقاف شاشة التحميل بعد التحقق الكامل
      
      return true;
    } catch (error) {
      console.error('خطأ في تسجيل الدخول:', error);
      setAuthError('حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.');
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
      
      // بعد التسجيل الناجح، RegisterPage ستعرض EmailVerificationPage تلقائياً
      // لا حاجة لتوجيه هنا - RegisterPage تتعامل مع كل شيء
      return { success: true };
    } catch (error) {
      setAuthError('حدث خطأ أثناء إنشاء الحساب');
      return { success: false, error: 'حدث خطأ أثناء إنشاء الحساب' };
    } finally {
      setIsRegisterLoading(false);
    }
  };

  // معالج للتوجيه من صفحة تأكيد التفعيل إلى صفحة تسجيل الدخول
  const handleGoToLoginFromVerified = () => {
    console.log('🔐 التوجيه لصفحة تسجيل الدخول');
    setShowEmailVerifiedSuccess(false);
    setShowLoginPage(true);
  };

  const handleBackToLogin = async () => {
    console.log('🔙 بدء عملية العودة لصفحة تسجيل الدخول...');
    
    // مسح جميع بيانات الاشتراك والدفع من localStorage
    localStorage.removeItem('auth_state_cache');
    localStorage.removeItem('show_subscription_page');
    localStorage.removeItem('subscription_step');
    localStorage.removeItem('selected_plan');
    localStorage.removeItem('user_info');
    
    // إعادة تعيين جميع الحالات
    setShowRegisterPage(false);
    setShowSubscriptionPage(false);
    setAuthError(null);
    setSubscriptionStep('plans');
    setSelectedPlan(null);
    setUserInfo(null);
    setIsLoginLoading(false); // ✅ إيقاف شاشة تحميل تسجيل الدخول
    setIsCheckingSubscription(false); // ✅ إيقاف شاشة التحقق من الاشتراك
    
    // إذا كان المستخدم مسجل دخول، تسجيل خروج أولاً
    if (isAuthenticated) {
      console.log('🔓 تسجيل خروج المستخدم...');
      await logout();
      // انتظار قصير للتأكد من اكتمال تسجيل الخروج
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // عرض صفحة تسجيل الدخول
    setShowLoginPage(true);
    
    // تحديث URL
    window.history.pushState({ page: 'login' }, '', '/login');
    window.dispatchEvent(new CustomEvent('app-navigate', { detail: { path: '/login' } }));
    
    console.log('✅ تم التوجيه لصفحة تسجيل الدخول');
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

  const handleBackToDashboard = () => {
    setShowSubscriptionPage(false);
    setActiveTab('recommendations'); // العودة للتبويب الافتراضي
    
    // تحديث URL للعودة للوحة التحكم
    window.history.pushState({ authenticated: true }, '', '/dashboard');
    window.dispatchEvent(new CustomEvent('app-navigate', { detail: { path: '/dashboard' } }));
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
        fullName: user.full_name || user.username || user.email?.split('@')[0] || '',
        email: user.email,
        country: (user as any).country || 'المغرب',
        phone: (user as any).phone || ''
      } : null);
      
      console.log('🔍 effectiveUserInfo:', effectiveUserInfo);
      console.log('📋 full_name من قاعدة البيانات:', user?.full_name);
      
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

  // مسح البيانات عند تسجيل الخروج
  const handleLogout = async () => {
    console.log('🚪 بدء عملية تسجيل الخروج من App.tsx...');
    
    try {
      // إعادة تعيين جميع الحالات المتعلقة بالاشتراك
      setIsCheckingSubscription(false);
      setShowSubscriptionPage(false);
      
      // ✅ مسح كامل لـ localStorage و sessionStorage
      console.log('🧹 مسح localStorage و sessionStorage...');
      localStorage.clear();
      sessionStorage.clear();
      
      // ✅ مسح جميع أنواع الـ Cache (Service Worker, etc.)
      console.log('🧹 مسح Service Worker Cache...');
      await clearAllCaches();
      
      // ✅ تسجيل الخروج من Supabase (يقوم بإعادة التحميل تلقائياً)
      console.log('🚪 تسجيل الخروج من Supabase...');
      await logout();
      
      // ملاحظة: logout() يقوم بإعادة تحميل الصفحة تلقائياً
      
    } catch (error) {
      console.error('❌ خطأ في تسجيل الخروج:', error);
      
      // ✅ في حالة الخطأ، نمسح كل شيء ونعيد التحميل
      try {
        localStorage.clear();
        sessionStorage.clear();
        await clearAllCaches();
      } catch (clearError) {
        console.error('❌ خطأ في مسح البيانات:', clearError);
      }
      
      // إعادة تحميل قوية مع timestamp
      console.log('🔄 إعادة تحميل الصفحة...');
      window.location.href = window.location.origin + '?_logout=' + Date.now();
    }
  };

  // ⚡ أولوية قصوى: عرض صفحة تأكيد التفعيل أو loading أثناء المعالجة
  if (isProcessingEmailVerification || showEmailVerifiedSuccess) {
    if (showEmailVerifiedSuccess) {
      return (
        <ThemeProvider>
          <LanguageProvider>
            <EmailVerifiedSuccessPage onGoToLogin={handleGoToLoginFromVerified} />
          </LanguageProvider>
        </ThemeProvider>
      );
    }
    // أثناء المعالجة، عرض loading
    return (
      <ThemeProvider>
        <LanguageProvider>
          <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
            <BotLoadingAnimation />
          </div>
        </LanguageProvider>
      </ThemeProvider>
    );
  }

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
            setShowRegisterPage={setShowRegisterPage}
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
            handleBackToDashboard={handleBackToDashboard}
            isCheckingSubscription={isCheckingSubscription}
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
  setShowRegisterPage: (show: boolean) => void;
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
  handleBackToDashboard: () => void;
  isCheckingSubscription: boolean;
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
  setShowRegisterPage,
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
  handleBackToDashboard,
  isCheckingSubscription,
  activeTab,
  setActiveTab,
  assets,
  isActive,
  toggleBot,
  onNavigate,
}) => {
  
  // حالة صفحة الإعدادات
  const [settingsVisible, setSettingsVisible] = useState(false);
  
  // حالة نافذة الإحالة
  const [showReferralModal, setShowReferralModal] = useState(false);
  
  // التحقق من حالة الاشتراك للمستخدمين المسجلين
  const { status: subscriptionStatus, loading: subscriptionLoading, refresh: refreshSubscription } = useSubscriptionStatus(user?.id);
  
  // منع عرض صفحة الاشتراك للمستخدمين المشتركين
  useEffect(() => {
    if (isAuthenticated && user && showSubscriptionPage) {
      const isAdmin = user.role === 'admin';
      const hasActiveSubscription = user.subscription_status === 'active';
      
      if (hasActiveSubscription || isAdmin) {
        console.log('🚫 منع عرض صفحة الاشتراك للمستخدم المشترك');
        setShowSubscriptionPage(false);
        localStorage.removeItem(STORAGE_KEYS.SHOW_SUBSCRIPTION_PAGE);
      }
    }
  }, [isAuthenticated, user, showSubscriptionPage]);

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

    // 2. فحص دقيق لحالة الاشتراك
    const isAdmin = user.role === 'admin';
    const hasActiveSubscription = user.subscription_status === 'active';
    
    // ✅ المستخدم يحتاج اشتراك فقط إذا:
    // - redirectTo === 'subscription' و
    // - ليس admin و
    // - subscription_status ليس active
    const needsSubscription = user.redirectTo === 'subscription' && 
                              !isAdmin &&
                              user.subscription_status !== 'active';
    
    console.log('🔐 فحص الاشتراك:', {
      isAdmin,
      hasActiveSubscription,
      needsSubscription,
      showSubscriptionPage,
      status: user.status,
      subscription_status: user.subscription_status
    });
    
    // ❌ إذا كان المستخدم مشترك، لا تعرض صفحة الاشتراك نهائياً
    if (hasActiveSubscription || isAdmin) {
      if (showSubscriptionPage) {
        console.log('⚠️ المستخدم مشترك لكن showSubscriptionPage = true، إخفاءها...');
        setShowSubscriptionPage(false);
        localStorage.removeItem(STORAGE_KEYS.SHOW_SUBSCRIPTION_PAGE);
      }
    }
    
    if (needsSubscription || (showSubscriptionPage && !hasActiveSubscription && !isAdmin)) {
      console.log('📍 في صفحة الاشتراك - subscriptionStep:', subscriptionStep);
      
      if (!showSubscriptionPage && needsSubscription) {
        handleNavigateToSubscription();
      }
      
      // إنشاء userInfo من بيانات المستخدم إذا لم تكن موجودة
      const currentUserInfo = userInfo || {
        id: user.id, // ✅ إضافة ID المستخدم
        fullName: user.full_name || user.username || user.email?.split('@')[0] || '',
        email: user.email,
        country: user.country, // ✅ إضافة الدولة
        phone: user.phone, // ✅ إضافة رقم الهاتف
      };
      
      // عرض صفحة الاشتراك حسب الخطوة
      console.log('🔀 Switch على subscriptionStep:', subscriptionStep);
      console.log('📦 selectedPlan:', selectedPlan);
      console.log('👤 currentUserInfo:', currentUserInfo);
      console.log('📋 full_name من قاعدة البيانات:', user.full_name);
      
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
              onBackToDashboard={handleBackToDashboard}
              hasActiveSubscription={
                (user?.subscription_status === 'active' && user?.status === 'active') ||
                user?.role === 'admin'
              }
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
  // لا نعرض صفحة الحظر إذا كان هناك خطأ في الاتصال أو جاري التحميل
  const isConnectionError = subscriptionStatus.timeUntilExpiry?.includes('خطأ في الاتصال') || 
                           subscriptionStatus.timeUntilExpiry?.includes('يرجى المحاولة لاحقاً') ||
                           subscriptionStatus.timeUntilExpiry?.includes('يعمل مؤقتاً') ||
                           subscriptionStatus.timeUntilExpiry?.includes('جاري تحميل') ||
                           subscriptionStatus.subscription?.plan_name?.includes('جاري التحميل');
  
  // فقط نعرض نافذة الحظر إذا كان الاشتراك منتهي فعلاً وليس بسبب خطأ اتصال
  // ✅ فحص إضافي: التأكد من أن المستخدم فعلاً منتهي الاشتراك من بيانات user
  const isAdmin = user?.role === 'admin';
  const hasActiveSubscription = user?.status === 'active' && user?.subscription_status === 'active';
  const shouldShowBlockedPage = isAuthenticated && 
                                !subscriptionLoading && 
                                !isCheckingSubscription && // ✅ لا تعرض أثناء التحقق
                                subscriptionStatus.isExpired && 
                                !isConnectionError && 
                                !isAdmin &&
                                !hasActiveSubscription; // ✅ فحص نهائي من بيانات user
  
  if (shouldShowBlockedPage) {
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
          onBack={() => setShowRegisterPage(false)}
          isLoading={isRegisterLoading}
          error={authError}
        />
      );
    }

    // ✅ فحص نهائي: لا تعرض صفحة الاشتراك للمستخدمين المشتركين
    const isAdmin = user?.role === 'admin';
    const hasActiveSubscription = user?.status === 'active' && user?.subscription_status === 'active';
    
    if (showSubscriptionPage && !hasActiveSubscription && !isAdmin) {
      // عرض الصفحة المناسبة حسب خطوة الاشتراك
      switch (subscriptionStep) {
        case 'plans':
          return (
            <SubscriptionPage 
              onSelectPlan={handleSelectPlan}
              onBackToLogin={handleBackToLogin}
              onBackToDashboard={handleBackToDashboard}
              hasActiveSubscription={
                (user?.subscription_status === 'active' && user?.status === 'active') ||
                user?.role === 'admin'
              }
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
              onBackToDashboard={handleBackToDashboard}
              hasActiveSubscription={
                (user?.subscription_status === 'active' && user?.status === 'active') ||
                user?.role === 'admin'
              }
            />
          );
      }
    }
    
    // الصفحة الرئيسية (الافتراضية)
    // تحديث URL إلى /home
    if (window.location.pathname === '/') {
      window.history.replaceState({}, '', '/home');
    }
    
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
          <BotLoadingAnimation size="lg" />
          <p className="text-white text-lg mt-4">
            {isAuthenticated ? 'جاري تحميل بيانات المستخدم...' : 'جاري التحميل...'}
          </p>
        </div>
      </div>
    );
  }

  // 🔒 حماية شاملة: منع الدخول للوحة التحكم (Dashboard) بدون اشتراك نشط
  // لوحة التحكم تحتوي على جميع وظائف البوت (الإشارات، التوصيات، التحليلات)
  if (isAuthenticated && user && user.role !== 'admin') {
    // فحص حالة الاشتراك - يجب أن يكون كلاهما نشط
    const hasActiveSubscription = user.subscription_status === 'active' && user.status === 'active';
    const isOwner = user.role === 'admin'; // حساب المالك
    
    // إذا كان لديه اشتراك نشط في قاعدة البيانات أو هو المالك، السماح بالدخول مباشرة
    if (hasActiveSubscription || isOwner) {
      // ✅ لديه اشتراك نشط - السماح بالدخول
      console.log('✅ مستخدم مشترك - الدخول للوحة التحكم');
    } else {
      // ❌ ليس لديه اشتراك نشط - فحص إضافي من subscriptionStatus
      const hasTimeRemaining = subscriptionStatus && subscriptionStatus.isActive;
      
      if (!hasTimeRemaining) {
        console.warn('🚫 محاولة الدخول للوحة التحكم بدون اشتراك ساري!');
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
            onBackToDashboard={handleBackToDashboard}
            hasActiveSubscription={
              (user?.subscription_status === 'active' && user?.status === 'active') ||
              user?.role === 'admin'
            }
          />
        );
      }
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
        {user?.role === 'admin' ? (
          <AdminNotificationsProvider>
            <Header 
              isConnected={isActive} 
              onToggleBot={toggleBot}
              user={user}
              onLogout={handleLogout}
              onOpenSettings={() => setSettingsVisible(true)}
              onOpenReferral={() => setShowReferralModal(true)}
            />
          </AdminNotificationsProvider>
        ) : (
          <Header 
            isConnected={isActive} 
            onToggleBot={toggleBot}
            user={user}
            onLogout={handleLogout}
            onOpenSettings={() => setSettingsVisible(true)}
            onOpenReferral={() => setShowReferralModal(true)}
          />
        )}
        
        <main className="w-full px-0 py-2 sm:py-4 space-y-3 sm:space-y-4">
          {/* شريط التنقل العصري */}
          <Navigation 
            activeTab={activeTab}
            onTabChange={(tab) => setActiveTab(tab as any)}
            userRole={user?.role}
          />
          {/* بانر التنبيهات الإدارية */}
          {user && (
            <div className="px-2 sm:px-4">
              <AdminNotificationBanner />
            </div>
          )}

          {/* بانر حالة الاشتراك */}
          {!subscriptionLoading && 
           !isCheckingSubscription && 
           user?.role !== 'admin' && 
           !(user?.status === 'active' && user?.subscription_status === 'active') && (
            <div className="px-2 sm:px-4">
              <SubscriptionStatusBanner
                status={subscriptionStatus}
                onRenew={() => setShowSubscriptionPage(true)}
                onViewDetails={() => setActiveTab('subscription' as any)}
              />
            </div>
          )}

          {/* التخطيط المتجاوب المحسن */}
          <div className={`grid grid-cols-1 lg:grid-cols-12 gap-2 ${(['assistant','recommendations','admin','subscription','payments'].includes(activeTab as any) ? 'px-0' : 'px-1')}`} style={{ direction: 'rtl' }}>
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

      {/* نافذة الإحالة */}
      {user && (
        <ReferralModal
          isOpen={showReferralModal}
          onClose={() => setShowReferralModal(false)}
          userId={user.id}
        />
      )}

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