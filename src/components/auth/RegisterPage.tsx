import React, { useState, useEffect, useRef } from 'react';
import { Bot, Lock, User, Eye, EyeOff, Mail, MapPin, UserPlus, Check, X, Loader, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Footer } from '../layout/Footer';
import { supabase } from '../../config/supabaseClient';
import { BotLoadingAnimation } from '../common/BotLoadingAnimation';
import { EmailVerificationPage } from './EmailVerificationPage';

interface RegisterPageProps {
  onRegister: (userData: {
    email: string;
    username: string;
    fullName: string;
    country: string;
    password: string;
  }) => Promise<{ success: boolean; error?: string }>;
  onNavigateToLogin: () => void;
  onNavigateToTerms?: () => void;
  onBack?: () => void;
  isLoading: boolean;
  error: string | null;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ 
  onRegister, 
  onNavigateToLogin,
  onNavigateToTerms,
  onBack,
  isLoading, 
  error 
}) => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    fullName: '',
    country: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [countrySearch, setCountrySearch] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameCheckResult, setUsernameCheckResult] = useState<'available' | 'taken' | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);
  const { t, language } = useLanguage();
  const countryDropdownRef = useRef<HTMLDivElement>(null);

  // دالة للتحقق من قوة كلمة المرور
  const checkPasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password)) strength++; // حروف صغيرة
    if (/[A-Z]/.test(password)) strength++; // حروف كبيرة
    if (/[0-9]/.test(password)) strength++; // أرقام
    if (/[^a-zA-Z0-9]/.test(password)) strength++; // رموز خاصة
    
    if (strength <= 2) return 'weak';
    if (strength <= 4) return 'medium';
    return 'strong';
  };

  // منع الرجوع للخلف باستخدام زر المتصفح/الهاتف
  useEffect(() => {
    // إضافة حالة جديدة للتاريخ عند تحميل الصفحة
    window.history.pushState({ page: 'register', preventBack: true }, '', window.location.pathname);

    const handlePopState = (event: PopStateEvent) => {
      // إذا حاول المستخدم الرجوع، نمنعه ونعيده للأمام
      if (event.state?.preventBack) {
        window.history.pushState({ page: 'register', preventBack: true }, '', window.location.pathname);
        console.log('🚫 تم منع الرجوع للخلف - استخدم زر الرجوع في الصفحة');
      }
    };

    // الاستماع لحدث الرجوع
    window.addEventListener('popstate', handlePopState);

    // التنظيف عند إلغاء تحميل المكون
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // إغلاق القائمة المنسدلة عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setShowCountryDropdown(false);
        setCountrySearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // التحقق من توفر اسم المستخدم
  const checkUsernameAvailability = async (username: string) => {
    if (!username || username.length < 3) {
      setUsernameCheckResult(null);
      return;
    }

    setIsCheckingUsername(true);
    setUsernameCheckResult(null);

    try {
      console.log('🔍 التحقق من توفر اسم المستخدم:', username);
      
      const { data, error } = await supabase
        .from('users')
        .select('id, username')
        .eq('username', username);

      console.log('📊 نتيجة البحث:', { data, error });

      if (error) {
        console.error('❌ خطأ في البحث:', error);
        setUsernameCheckResult(null);
      } else if (data && data.length > 0) {
        // يوجد مستخدم بهذا الاسم - مأخوذ
        console.log('❌ اسم المستخدم مأخوذ');
        setUsernameCheckResult('taken');
      } else {
        // لا يوجد مستخدم بهذا الاسم - متاح
        console.log('✅ اسم المستخدم متاح');
        setUsernameCheckResult('available');
      }
    } catch (error) {
      console.error('❌ خطأ في التحقق من اسم المستخدم:', error);
      setUsernameCheckResult(null);
    } finally {
      setIsCheckingUsername(false);
    }
  };

  // تأخير التحقق من اسم المستخدم
  useEffect(() => {
    // إعادة تعيين حالة التحقق عند تغيير اسم المستخدم
    setUsernameCheckResult(null);
    setIsCheckingUsername(false);
    
    const timer = setTimeout(() => {
      if (formData.username && formData.username.length >= 3) {
        checkUsernameAvailability(formData.username);
      }
    }, 500); // تأخير 500ms

    return () => clearTimeout(timer);
  }, [formData.username]);

  // قائمة جميع دول العالم (195 دولة)
  const countries = [
    // الدول العربية (22 دولة)
    'الإمارات العربية المتحدة', 'البحرين', 'الجزائر', 'السعودية', 'السودان', 'الصومال', 'العراق', 'الكويت', 'المغرب', 'اليمن',
    'تونس', 'جزر القمر', 'جيبوتي', 'سوريا', 'عمان', 'فلسطين', 'قطر', 'لبنان', 'ليبيا', 'مصر', 'موريتانيا', 'الأردن',
    
    // أفريقيا (54 دولة)
    'أنغولا', 'إثيوبيا', 'إريتريا', 'أوغندا', 'بوتسوانا', 'بوركينا فاسو', 'بوروندي', 'بنين', 'تشاد', 'توغو', 'تنزانيا',
    'الجابون', 'جامبيا', 'جمهورية أفريقيا الوسطى', 'جمهورية الكونغو', 'جمهورية الكونغو الديمقراطية', 'جنوب أفريقيا', 'جنوب السودان',
    'الرأس الأخضر', 'رواندا', 'زامبيا', 'زيمبابوي', 'ساحل العاج', 'سان تومي وبرينسيبي', 'سيراليون', 'السنغال', 'إسواتيني',
    'غانا', 'غينيا', 'غينيا الاستوائية', 'غينيا بيساو', 'الكاميرون', 'كينيا', 'ليبيريا', 'ليسوتو',
    'مالاوي', 'مالي', 'مدغشقر', 'النيجر', 'نيجيريا', 'ناميبيا', 'موزمبيق',
    
    // آسيا (48 دولة)
    'أفغانستان', 'أرمينيا', 'أذربيجان', 'إندونيسيا', 'أوزبكستان', 'إيران', 'باكستان', 'بنغلاديش', 'بروناي', 'بوتان',
    'تايلاند', 'تايوان', 'تركمانستان', 'تركيا', 'تيمور الشرقية', 'جورجيا', 'كوريا الجنوبية', 'كوريا الشمالية',
    'الصين', 'سريلانكا', 'سنغافورة', 'طاجيكستان', 'الفلبين', 'فيتنام', 'قرغيزستان', 'كازاخستان',
    'كمبوديا', 'لاوس', 'المالديف', 'ماليزيا', 'منغوليا', 'ميانمار', 'نيبال', 'الهند', 'اليابان', 'إسرائيل',
    
    // أوروبا (44 دولة)
    'ألبانيا', 'ألمانيا', 'أندورا', 'أوكرانيا', 'أيرلندا', 'أيسلندا', 'إسبانيا', 'إستونيا', 'إيطاليا', 'البرتغال', 'البوسنة والهرسك',
    'بلجيكا', 'بلغاريا', 'بولندا', 'بيلاروسيا', 'التشيك', 'الجبل الأسود', 'الدنمارك', 'روسيا', 'رومانيا', 'سان مارينو',
    'سلوفاكيا', 'سلوفينيا', 'السويد', 'سويسرا', 'صربيا', 'فرنسا', 'فنلندا', 'كرواتيا', 'كوسوفو', 'لاتفيا',
    'لوكسمبورغ', 'ليتوانيا', 'ليختنشتاين', 'مالطا', 'مقدونيا الشمالية', 'مولدوفا', 'موناكو', 'النرويج', 'النمسا', 'هنغاريا',
    'هولندا', 'اليونان', 'المملكة المتحدة', 'الفاتيكان',
    
    // أمريكا الشمالية (23 دولة)
    'الولايات المتحدة', 'كندا', 'المكسيك', 'غواتيمالا', 'بليز', 'السلفادور', 'هندوراس', 'نيكاراغوا', 'كوستاريكا', 'بنما',
    'كوبا', 'جامايكا', 'هايتي', 'جمهورية الدومينيكان', 'ترينيداد وتوباغو', 'باربادوس', 'سانت لوسيا', 'سانت فنسنت والغرينادين',
    'غرينادا', 'أنتيغوا وباربودا', 'سانت كيتس ونيفيس', 'دومينيكا', 'الباهاما',
    
    // أمريكا الجنوبية (12 دولة)
    'البرازيل', 'الأرجنتين', 'تشيلي', 'كولومبيا', 'فنزويلا', 'بيرو', 'الإكوادور', 'بوليفيا', 'باراغواي', 'أوروغواي',
    'غيانا', 'سورينام',
    
    // أوقيانوسيا (14 دولة)
    'أستراليا', 'نيوزيلندا', 'فيجي', 'بابوا غينيا الجديدة', 'جزر سليمان', 'فانواتو', 'ساموا', 'تونغا', 'كيريباتي', 'توفالو',
    'ناورو', 'بالاو', 'جزر مارشال', 'ميكرونيزيا',
    
    // دول إضافية لضمان التغطية الكاملة
    'مونتينيغرو', 'صربيا والجبل الأسود', 'تشيكوسلوفاكيا السابقة', 'يوغوسلافيا السابقة', 'الاتحاد السوفيتي السابق',
    'جزر كوك', 'نيوي', 'جزر فيرجن البريطانية', 'جزر فيرجن الأمريكية', 'بورتوريكو', 'غوام', 'ساموا الأمريكية',
    'جزر كايمان', 'برمودا', 'جبل طارق', 'جزر فوكلاند', 'غرينلاند', 'جزر فارو', 'جزيرة مان', 'جيرسي', 'غيرنسي',
    'أروبا', 'كوراساو', 'سينت مارتن', 'جزر الأنتيل الهولندية', 'مونتسرات', 'أنغيلا', 'جزر تركس وكايكوس'
  ];

  // تصفية الدول حسب البحث وترتيبها أبجدياً
  const filteredCountries = countries
    .filter(country => country.toLowerCase().includes(countrySearch.toLowerCase()))
    .sort((a, b) => a.localeCompare(b, 'ar'));

  // معالجة اختيار الدولة
  const handleCountrySelect = (country: string) => {
    setFormData(prev => ({ ...prev, country }));
    setCountrySearch('');
    setShowCountryDropdown(false);
    if (validationErrors.country) {
      setValidationErrors(prev => ({ ...prev, country: '' }));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    // التحقق من البريد الإلكتروني
    if (!formData.email) {
      errors.email = t('register.error.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = t('register.error.emailInvalid');
    }

    // التحقق من اسم المستخدم
    if (!formData.username) {
      errors.username = t('register.error.usernameRequired');
    } else if (formData.username.length < 3) {
      errors.username = t('register.error.usernameLength');
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      errors.username = t('register.error.usernameFormat');
    } else if (usernameCheckResult === 'taken') {
      errors.username = t('register.error.usernameTaken');
    } else if (isCheckingUsername) {
      errors.username = t('register.error.usernameChecking');
    } else if (usernameCheckResult !== 'available' && formData.username.length >= 3) {
      errors.username = t('register.error.usernameWait');
    }

    // التحقق من الاسم الكامل
    if (!formData.fullName) {
      errors.fullName = t('register.error.fullNameRequired');
    } else if (!/^[a-zA-Z\s]+$/.test(formData.fullName)) {
      errors.fullName = language === 'ar' 
        ? 'الاسم الكامل يجب أن يحتوي على حروف لاتينية فقط (A-Z)'
        : language === 'fr'
        ? 'Le nom complet ne doit contenir que des lettres latines (A-Z)'
        : 'Full name must contain only Latin letters (A-Z)';
    } else if (formData.fullName.trim().split(/\s+/).length < 2) {
      errors.fullName = 'يجب إدخال الاسم واللقب (اسمين على الأقل)';
    } else if (formData.fullName.length < 2) {
      errors.fullName = t('register.error.fullNameLength');
    }

    // التحقق من الدولة
    if (!formData.country) {
      errors.country = t('register.error.countryRequired');
    }

    // التحقق من كلمة المرور
    if (!formData.password) {
      errors.password = t('register.error.passwordRequired');
    } else if (formData.password.length < 8) {
      errors.password = t('register.error.passwordLength');
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = t('register.error.passwordFormat');
    }

    // التحقق من تأكيد كلمة المرور
    if (!formData.confirmPassword) {
      errors.confirmPassword = t('register.error.confirmPasswordRequired');
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = t('register.error.passwordMismatch');
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // التحقق من توفر اسم المستخدم قبل الإرسال
    if (usernameCheckResult === 'taken') {
      setValidationErrors(prev => ({ ...prev, username: t('register.error.usernameTaken') }));
      return;
    }
    
    if (isCheckingUsername) {
      setValidationErrors(prev => ({ ...prev, username: t('register.error.usernameWait') }));
      return;
    }

    if (usernameCheckResult !== 'available') {
      setValidationErrors(prev => ({ ...prev, username: t('register.error.usernameWait') }));
      return;
    }
    
    if (!validateForm()) {
      return;
    }

    const result = await onRegister({
      email: formData.email,
      username: formData.username,
      fullName: formData.fullName,
      country: formData.country,
      password: formData.password
    });

    if (result.success) {
      // عرض صفحة التحقق من البريد الإلكتروني
      setShowEmailVerification(true);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // التحقق الفوري من الحقول
    const errors: Record<string, string> = { ...validationErrors };
    
    switch (field) {
      case 'email':
        if (!value) {
          errors.email = t('register.error.emailRequired');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.email = t('register.error.emailInvalid');
        } else {
          errors.email = '';
        }
        break;
        
      case 'username':
        if (!value) {
          errors.username = t('register.error.usernameRequired');
        } else if (value.length < 3) {
          errors.username = t('register.error.usernameLength');
        } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
          errors.username = t('register.error.usernameFormat');
        } else {
          errors.username = '';
        }
        // مسح حالة التحقق من اسم المستخدم عند التغيير
        setUsernameCheckResult(null);
        setIsCheckingUsername(false);
        break;
        
      case 'fullName':
        if (!value) {
          errors.fullName = t('register.error.fullNameRequired');
        } else if (!/^[a-zA-Z\s]+$/.test(value)) {
          errors.fullName = language === 'ar' 
            ? 'الاسم الكامل يجب أن يحتوي على حروف لاتينية فقط (A-Z)'
            : language === 'fr'
            ? 'Le nom complet ne doit contenir que des lettres latines (A-Z)'
            : 'Full name must contain only Latin letters (A-Z)';
        } else if (value.trim().split(/\s+/).length < 2) {
          errors.fullName = 'يجب إدخال الاسم واللقب (اسمين على الأقل)';
        } else if (value.length < 2) {
          errors.fullName = t('register.error.fullNameLength');
        } else {
          errors.fullName = '';
        }
        break;
        
      case 'country':
        if (!value) {
          errors.country = t('register.error.countryRequired');
        } else {
          errors.country = '';
        }
        break;
        
      case 'password':
        // تحديث قوة كلمة المرور
        if (value) {
          setPasswordStrength(checkPasswordStrength(value));
        } else {
          setPasswordStrength(null);
        }
        
        if (!value) {
          errors.password = t('register.error.passwordRequired');
        } else if (value.length < 8) {
          errors.password = t('register.error.passwordLength');
        } else if (checkPasswordStrength(value) === 'weak') {
          errors.password = t('settings.passwordTooWeak');
        } else {
          errors.password = '';
        }
        // التحقق من تطابق كلمة المرور
        if (formData.confirmPassword && value !== formData.confirmPassword) {
          errors.confirmPassword = t('register.error.passwordMismatch');
        } else if (formData.confirmPassword) {
          errors.confirmPassword = '';
        }
        break;
        
      case 'confirmPassword':
        if (!value) {
          errors.confirmPassword = t('register.error.confirmPasswordRequired');
        } else if (value !== formData.password) {
          errors.confirmPassword = t('register.error.passwordMismatch');
        } else {
          errors.confirmPassword = '';
        }
        break;
    }
    
    setValidationErrors(errors);
  };

  // معالجة التسجيل بواسطة Google
  const handleGoogleSignup = async () => {
    setGoogleLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('❌ خطأ في Google OAuth:', error);
        alert(t('register.error.googleFailed'));
      }
      // سيتم التوجيه تلقائياً بواسطة Supabase
    } catch (error) {
      console.error('❌ خطأ في Google signup:', error);
      alert(t('register.error.googleFailed'));
    } finally {
      setGoogleLoading(false);
    }
  };

  // إذا تم التسجيل بنجاح، عرض صفحة التحقق من البريد
  if (showEmailVerification) {
    return (
      <EmailVerificationPage
        email={formData.email}
        fullName={formData.fullName}
        onVerificationSuccess={() => {
          // بعد التفعيل الناجح، التوجه لصفحة تسجيل الدخول
          setShowEmailVerification(false);
          onNavigateToLogin();
        }}
        onBackToRegister={() => {
          setShowEmailVerification(false);
        }}
        onVerifyCode={async () => ({ success: true })}
        isLoading={false}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex flex-col">
      {/* زر الرجوع */}
      {onBack && (
        <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-50">
          <button
            onClick={onBack}
            className="text-white hover:text-blue-300 p-2"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* خلفية متحركة */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 sm:-top-40 sm:-right-40 w-40 h-40 sm:w-80 sm:h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 sm:-bottom-40 sm:-left-40 w-40 h-40 sm:w-80 sm:h-80 bg-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-20 left-20 sm:top-40 sm:left-40 w-40 h-40 sm:w-80 sm:h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      </div>

      {/* المحتوى الرئيسي */}
      <div className="flex-1 flex items-center justify-center p-2 sm:p-4 relative z-10">
        <div className="w-full max-w-md">
          {/* الشعار والعنوان */}
          <div className="text-center mb-4 sm:mb-6">
            <div className="flex justify-center mb-2 sm:mb-3">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Bot className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">
              {t('register.title')}
            </h1>
            <p className="text-xs sm:text-sm text-gray-300">
              {t('register.subtitle')}
            </p>
          </div>

          {/* نموذج التسجيل */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-4 sm:p-6 shadow-2xl">
            {error && (
              <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                <p className="text-red-300 text-xs sm:text-sm text-center">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              {/* البريد الإلكتروني */}
              <div>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder={t('register.email')}
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-10 py-2 sm:py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    disabled={isLoading}
                  />
                </div>
                {validationErrors.email && (
                  <p className="text-red-400 text-xs mt-1">{validationErrors.email}</p>
                )}
              </div>

              {/* اسم المستخدم */}
              <div>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    placeholder={t('register.username')}
                    className={`w-full bg-white/5 border rounded-xl px-10 py-2 sm:py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent text-sm ${
                      usernameCheckResult === 'available' 
                        ? 'border-green-500 focus:ring-green-500' 
                        : usernameCheckResult === 'taken' 
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-white/20 focus:ring-blue-500'
                    }`}
                    disabled={isLoading}
                  />
                  
                  {/* مؤشر حالة التحقق */}
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    {isCheckingUsername ? (
                      <Loader className="w-4 h-4 text-blue-400 animate-spin" />
                    ) : usernameCheckResult === 'available' ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : usernameCheckResult === 'taken' ? (
                      <X className="w-4 h-4 text-red-400" />
                    ) : null}
                  </div>
                </div>
                
                {/* رسائل التحقق */}
                {validationErrors.username ? (
                  <p className="text-red-400 text-xs mt-1">{validationErrors.username}</p>
                ) : usernameCheckResult === 'available' ? (
                  <p className="text-green-400 text-xs mt-1 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    {t('register.usernameAvailable')}
                  </p>
                ) : usernameCheckResult === 'taken' ? (
                  <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                    <X className="w-3 h-3" />
                    {t('register.usernameTaken')}
                  </p>
                ) : null}
              </div>

              {/* الاسم الكامل */}
              <div>
                <div className="relative">
                  <UserPlus className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder={t('register.fullName')}
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-10 py-2 sm:py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    disabled={isLoading}
                  />
                </div>
                {validationErrors.fullName && (
                  <p className="text-red-400 text-xs mt-1">{validationErrors.fullName}</p>
                )}
              </div>

              {/* الدولة */}
              <div className="relative">
                <div className="relative" ref={countryDropdownRef}>
                  <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 z-10" />
                  <input
                    type="text"
                    value={formData.country || countrySearch}
                    onChange={(e) => {
                      setCountrySearch(e.target.value);
                      setShowCountryDropdown(true);
                      if (formData.country) {
                        setFormData(prev => ({ ...prev, country: '' }));
                      }
                    }}
                    onFocus={() => setShowCountryDropdown(true)}
                    placeholder={t('register.country')}
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-10 py-2 sm:py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    disabled={isLoading}
                    autoComplete="country"
                  />
                  
                  {/* القائمة المنسدلة للدول */}
                  {showCountryDropdown && (countrySearch || !formData.country) && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800/95 backdrop-blur-sm border border-white/20 rounded-xl shadow-2xl z-30 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                      {filteredCountries.length > 0 ? (
                        <>
                          {countrySearch && (
                            <div className="px-4 py-2 text-xs text-gray-400 border-b border-white/10">
                              {filteredCountries.length} {t('register.searchResults')}
                            </div>
                          )}
                          {filteredCountries.map((country, index) => (
                            <button
                              key={country}
                              type="button"
                              onClick={() => handleCountrySelect(country)}
                              className={`w-full text-right px-4 py-2.5 text-white hover:bg-blue-600/20 focus:bg-blue-600/20 transition-colors text-sm border-b border-white/5 last:border-b-0 focus:outline-none ${
                                index === 0 ? 'rounded-t-xl' : ''
                              } ${
                                index === filteredCountries.length - 1 ? 'rounded-b-xl' : ''
                              }`}
                            >
                              <span className="block truncate">{country}</span>
                            </button>
                          ))}
                        </>
                      ) : (
                        <div className="px-4 py-3 text-gray-400 text-sm text-center">
                          <MapPin className="w-4 h-4 mx-auto mb-1 opacity-50" />
                          {t('register.noResults')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {validationErrors.country && (
                  <p className="text-red-400 text-xs mt-1">{validationErrors.country}</p>
                )}
              </div>

              {/* كلمة المرور */}
              <div>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder={t('register.password')}
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-10 py-2 sm:py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    disabled={isLoading}
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>
                </div>
                
                {/* مؤشر قوة كلمة المرور */}
                {formData.password && passwordStrength && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        passwordStrength === 'weak' ? 'bg-red-500' :
                        passwordStrength === 'medium' ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}></div>
                      <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        passwordStrength === 'medium' ? 'bg-yellow-500' :
                        passwordStrength === 'strong' ? 'bg-green-500' :
                        'bg-gray-600'
                      }`}></div>
                      <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        passwordStrength === 'strong' ? 'bg-green-500' : 'bg-gray-600'
                      }`}></div>
                    </div>
                    <p className={`text-xs ${
                      passwordStrength === 'weak' ? 'text-red-400' :
                      passwordStrength === 'medium' ? 'text-yellow-400' :
                      'text-green-400'
                    }`}>
                      {passwordStrength === 'weak' && t('settings.weakPassword')}
                      {passwordStrength === 'medium' && t('settings.mediumPassword')}
                      {passwordStrength === 'strong' && t('settings.strongPassword')}
                    </p>
                  </div>
                )}
                
                {validationErrors.password && (
                  <p className="text-red-400 text-xs mt-1">{validationErrors.password}</p>
                )}
              </div>

              {/* تأكيد كلمة المرور */}
              <div>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder={t('register.confirmPassword')}
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-10 py-2 sm:py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>
                </div>
                {validationErrors.confirmPassword && (
                  <p className="text-red-400 text-xs mt-1">{validationErrors.confirmPassword}</p>
                )}
              </div>

              {/* خانة الموافقة على الشروط والأحكام */}
              <div className="flex items-center gap-2.5 sm:gap-3">
                {/* Checkbox مخصص */}
                <div 
                  onClick={() => !isLoading && setAcceptedTerms(!acceptedTerms)}
                  className="flex-shrink-0 cursor-pointer"
                >
                  <div className={`
                    w-[18px] h-[18px] sm:w-5 sm:h-5 
                    rounded border-2 
                    flex items-center justify-center
                    transition-all duration-200
                    ${acceptedTerms 
                      ? 'bg-blue-600 border-blue-600' 
                      : 'bg-white/10 border-white/40 hover:border-white/60'
                    }
                    ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}>
                    {acceptedTerms && (
                      <svg 
                        className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" 
                        fill="none" 
                        strokeWidth="3" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                </div>
                
                <label 
                  onClick={() => !isLoading && setAcceptedTerms(!acceptedTerms)}
                  className="text-xs sm:text-sm text-gray-300 cursor-pointer select-none flex-1"
                >
                  {t('register.termsPrefix')}{' '}
                  <button
                    type="button"
                    className="text-blue-400 hover:text-blue-300 underline transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onNavigateToTerms) {
                        onNavigateToTerms();
                      }
                    }}
                  >
                    {t('register.termsLink')}
                  </button>
                </label>
              </div>

              {/* زر التسجيل */}
              <button
                type="submit"
                disabled={
                  isLoading || 
                  !acceptedTerms || 
                  !formData.email || 
                  !formData.username || 
                  !formData.fullName || 
                  !formData.country || 
                  !formData.password || 
                  !formData.confirmPassword ||
                  usernameCheckResult !== 'available' ||
                  isCheckingUsername
                }
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold py-2 px-4 sm:py-2.5 sm:px-5 rounded-xl transition-all duration-200 shadow-lg flex items-center justify-center gap-2 text-sm"
              >
                {isLoading ? (
                  <>
                    <BotLoadingAnimation size="sm" />
                    {t('register.creating')}
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                    {t('register.createAccount')}
                  </>
                )}
              </button>

              {/* فاصل "أو" */}
              <div className="relative my-3 sm:my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20"></div>
                </div>
                <div className="relative flex justify-center text-xs sm:text-sm">
                  <span className="px-2 bg-transparent text-gray-400">{t('register.or')}</span>
                </div>
              </div>

              {/* زر Google */}
              <button
                type="button"
                onClick={handleGoogleSignup}
                disabled={isLoading || googleLoading}
                className="w-full bg-white hover:bg-gray-100 disabled:bg-gray-300 disabled:cursor-not-allowed text-gray-800 font-semibold py-2 px-4 sm:py-2.5 sm:px-5 rounded-xl transition-all duration-200 shadow-lg flex items-center justify-center gap-2 text-sm border border-gray-300"
              >
                {googleLoading ? (
                  <>
                    <BotLoadingAnimation size="sm" />
                    <span>{t('register.googleLoading')}</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span>{t('register.googleButton')}</span>
                  </>
                )}
              </button>

              {/* رابط تسجيل الدخول */}
              <div className="mt-3 sm:mt-4">
                <div className="text-center text-xs sm:text-sm text-gray-300 mb-2 sm:mb-3">
                  {t('register.hasAccount')}
                </div>
                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="w-full bg-transparent border border-white/30 hover:bg-white/10 text-white font-medium py-2 px-4 sm:py-2.5 sm:px-5 rounded-xl transition-all duration-200 text-sm"
                  disabled={isLoading}
                >
                  {t('register.loginButton')}
                </button>
              </div>
            </form>
          </div>

          {/* معلومات إضافية */}
          <div className="mt-3 sm:mt-4 text-center">
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-green-500/20 rounded-lg p-1.5 sm:p-2">
                <div className="text-green-400 font-bold text-sm sm:text-base">95%+</div>
                <div className="text-[10px] sm:text-xs text-green-200">{t('register.successRate')}</div>
              </div>
              <div className="bg-blue-500/20 rounded-lg p-1.5 sm:p-2">
                <div className="text-blue-400 font-bold text-sm sm:text-base">24/7</div>
                <div className="text-[10px] sm:text-xs text-blue-200">{t('register.marketMonitoring')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};
