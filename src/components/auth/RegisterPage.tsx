import React, { useState, useEffect, useRef } from 'react';
import { Bot, Lock, User, Eye, EyeOff, Mail, MapPin, UserPlus, Check, X, Loader } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Footer } from '../layout/Footer';
import { supabase } from '../../config/supabaseClient';

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
  isLoading: boolean;
  error: string | null;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ 
  onRegister, 
  onNavigateToLogin,
  onNavigateToTerms, 
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
  const { t } = useLanguage();
  const countryDropdownRef = useRef<HTMLDivElement>(null);

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
      // سيتم التوجه لصفحة الاشتراك من App.tsx
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
        if (!value) {
          errors.password = t('register.error.passwordRequired');
        } else if (value.length < 6) {
          errors.password = t('register.error.passwordLength');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex flex-col">
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
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>
                </div>
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
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {t('register.creating')}
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                    {t('register.createAccount')}
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
