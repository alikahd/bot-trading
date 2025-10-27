import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'ar' | 'en' | 'fr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dir: 'rtl' | 'ltr';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// ملفات الترجمة
const translations = {
  ar: {
    // Navigation
    'nav.signals': 'الإشارات',
    'nav.recommendations': 'التوصيات',
    'nav.precise': 'الخيارات',
    'nav.assistant': 'المساعد',
    'nav.admin': 'المدير',
    'nav.subscription': 'الاشتراك',
    'nav.signals.desc': 'إشارات التداول المباشرة',
    'nav.recommendations.desc': 'توصيات مدعومة بالذكاء الاصطناعي',
    'nav.precise.desc': 'توصيات دقيقة بالوقت والمدة للخيارات الثنائية',
    'nav.assistant.desc': 'مساعد ذكي للقرارات',
    'nav.admin.desc': 'إدارة المستخدمين والنظام',
    'nav.subscription.desc': 'إدارة اشتراكك ومتابعة حالة المدفوعات',
    
    // Header
    'header.settings': 'الإعدادات',
    'header.profile': 'الملف الشخصي',
    'header.language': 'اللغة',
    
    // Settings Page
    'settings.title': 'الإعدادات',
    'settings.admin': 'مدير النظام',
    'settings.trader': 'متداول',
    'settings.changePassword': 'تغيير كلمة المرور',
    'settings.currentPassword': 'كلمة المرور الحالية',
    'settings.newPassword': 'كلمة المرور الجديدة',
    'settings.confirmPassword': 'تأكيد كلمة المرور',
    'settings.enterCurrentPassword': 'أدخل كلمة المرور الحالية',
    'settings.enterNewPassword': 'أدخل كلمة المرور الجديدة',
    'settings.reEnterPassword': 'أعد إدخال كلمة المرور',
    'settings.saving': 'جاري الحفظ...',
    'settings.saveNewPassword': 'حفظ كلمة المرور الجديدة',
    'settings.passwordMismatch': 'كلمة المرور غير متطابقة',
    'settings.passwordTooShort': 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
    'settings.passwordChangeSuccess': 'تم تغيير كلمة المرور بنجاح',
    'settings.incorrectPassword': 'كلمة المرور الحالية غير صحيحة',
    'settings.passwordChangeError': 'حدث خطأ أثناء تغيير كلمة المرور',
    'header.theme': 'المظهر',
    'header.lightMode': 'الوضع المضيء',
    'header.startBot': 'تشغيل البوت',
    'header.stopBot': 'إيقاف البوت',
    'header.dataManagement': 'إدارة البيانات',
    'header.realData': 'البيانات الحقيقية',
    'header.apiStatus': 'حالة APIs',
    'header.logout': 'تسجيل الخروج',
    
    // User Roles
    'user.admin': 'مدير النظام',
    'user.trader': 'متداول',
    
    'app.shortName': 'BooTrading',
    'app.fullName': 'بوت التداول الاحترافي',
    
    // Assets
    'assets.title': 'الأصول المتاحة',
    
    // Recommendations
    'recommendations.title': 'التوصيات الذكية',
    'recommendations.subtitle': 'توصيات مدعومة بالذكاء الاصطناعي',
    'recommendations.loading': 'جاري تحميل التوصيات...',
    'recommendations.lastUpdate': 'آخر تحديث',
    'recommendations.trending': 'اتجاهي',
    'recommendations.ranging': 'متذبذب',
    'recommendations.volatile': 'متقلب',
    'recommendations.undefined': 'غير محدد',
    'recommendations.bestTimeframe': 'أفضل إطار زمني',
    'recommendations.signalProbabilityShort': 'احتمال الإشارة',
    'recommendations.detailsOf': 'تفاصيل',
    'recommendations.recommendedTimeframes': 'الأطر الزمنية الموصى بها',
    'recommendations.min': 'دقيقة',
    'recommendations.strength': 'القوة',
    'recommendations.reasons': 'الأسباب',
    'recommendations.qualityPointsShort': 'نقاط الجودة',
    'recommendations.confidenceLevelShort': 'مستوى الثقة',
    'recommendations.winRateShort': 'معدل الربح',
    'recommendations.noRecommendations': 'لا توجد توصيات متاحة حالياً',
    'recommendations.tryLater': 'حاول مرة أخرى لاحقاً',
    'recommendations.retry': 'إعادة المحاولة',
    'recommendations.analyzing': 'جاري تحليل الأسواق...',
    'recommendations.warning': 'تحذير: هذه التوصيات للمرجع فقط وليست نصائح استثمارية.',
    
    // Precise Binary Recommendations
    'precise.title': 'التوصيات الدقيقة',
    'precise.loading': 'جاري التحميل...',
    'precise.currentTime': 'الوقت الحالي',
    'precise.analyzing': 'جاري تحليل الأسواق...',
    'precise.noRecommendations': 'لا توجد توصيات متاحة حالياً',
    'precise.tryLater': 'حاول مرة أخرى لاحقاً',
    'precise.now': 'الآن',
    'precise.minutes': 'د',
    'precise.entryTime': 'وقت الدخول',
    'precise.after': 'بعد',
    'precise.currentPrice': 'السعر الحالي',
    'precise.target': 'الهدف',
    'precise.successRate': 'معدل النجاح',
    'precise.confidence': 'الثقة',
    'precise.risk': 'المخاطر',
    'precise.riskLow': 'منخفض',
    'precise.riskMedium': 'متوسط',
    'precise.riskHigh': 'عالي',
    'precise.technicalIndicators': 'المؤشرات الفنية',
    'precise.trend': 'الاتجاه',
    'precise.momentum': 'الزخم',
    'precise.reason': 'السبب',
    'precise.warning': 'تحذير: هذه توصية عالية المخاطر. تداول بحذر.',
    'precise.tips': 'نصائح مهمة:',
    'precise.tip1': '• تأكد من دخول الصفقة في الوقت المحدد بدقة',
    'precise.tip2': '• راقب السوق قبل الدخول للتأكد من الظروف',
    'precise.tip3': '• لا تتداول أكثر من 2-3% من رأس المال في صفقة واحدة',
    'precise.tip4': '• استخدم هذه التوصيات كمرجع وليس كنصيحة استثمارية',
    'precise.tip5': '• توقف عن التداول إذا خسرت أكثر من 10% في اليوم',
    
    // Subscription & Payments
    'subscription.title': 'الاشتراك والمدفوعات',
    'subscription.back': 'العودة',
    'subscription.refresh': 'تحديث',
    'subscription.loading': 'جاري تحميل البيانات...',
    'subscription.tab': 'الاشتراك',
    'subscription.paymentsTab': 'المدفوعات',
    'subscription.status': 'حالة الاشتراك',
    'subscription.active': 'نشط',
    'subscription.inactive': 'غير نشط',
    'subscription.timeRemaining': 'الوقت المتبقي من الاشتراك',
    'subscription.days': 'يوم',
    'subscription.hours': 'ساعة',
    'subscription.minutes': 'دقيقة',
    'subscription.seconds': 'ثانية',
    'subscription.expired': 'انتهى الاشتراك',
    'subscription.renewNow': 'جدد الآن',
    'subscription.userInfo': 'معلومات المستخدم',
    'subscription.username': 'اسم المستخدم',
    'subscription.email': 'البريد الإلكتروني',
    'subscription.role': 'الدور',
    'subscription.joinDate': 'تاريخ الانضمام',
    'subscription.planDetails': 'تفاصيل الخطة',
    'subscription.planName': 'اسم الخطة',
    'subscription.startDate': 'تاريخ البداية',
    'subscription.endDate': 'تاريخ الانتهاء',
    'subscription.price': 'السعر',
    'subscription.paymentHistory': 'سجل المدفوعات',
    'subscription.noPayments': 'لا توجد مدفوعات',
    'subscription.paymentId': 'رقم المعاملة',
    'subscription.amount': 'المبلغ',
    'subscription.date': 'التاريخ',
    'subscription.method': 'طريقة الدفع',
    'subscription.receipt': 'الإيصال',
    'subscription.viewReceipt': 'عرض الإيصال',
    'subscription.paymentStatus.completed': 'مكتمل',
    'subscription.paymentStatus.pending': 'قيد الانتظار',
    'subscription.paymentStatus.reviewing': 'قيد المراجعة',
    'subscription.paymentStatus.failed': 'فاشل',
    'subscription.paymentStatus.refunded': 'مسترد',
    'subscription.paymentStatus.cancelled': 'ملغي',
    
    // Sections
    'sections.signals.title': 'الإشارات الفورية',
    'sections.signals.desc': 'إشارات التداول المباشرة مع التحليل الفني المتقدم',
    'sections.recommendations.title': 'التوصيات الذكية',
    'sections.recommendations.desc': 'توصيات مدعومة بالذكاء الاصطناعي وتحليل البيانات',
    'sections.assistant.title': 'مساعد التداول الذكي',
    'sections.assistant.desc': 'مساعد ذكي لاتخاذ قرارات التداول',
    
    // Languages
    'lang.arabic': 'العربية',
    'lang.english': 'English',
    'lang.french': 'Français',
    
    // Login
    'login.title': 'تسجيل الدخول',
    'login.subtitle': 'بوت التداول الاحترافي',
    'login.username': 'اسم المستخدم أو البريد الإلكتروني',
    'login.password': 'كلمة المرور',
    'login.button': 'تسجيل الدخول',
    'login.loading': 'جاري تسجيل الدخول...',
    'login.noAccount': 'ليس لديك حساب؟',
    'login.subscribe': 'اشترك الآن',
    'login.successRate': 'معدل النجاح',
    'login.marketMonitoring': 'مراقبة السوق',
    'login.winRate': '95%+ معدل نجاح',
    'login.newUser': 'مستخدم جديد؟',
    'login.createAccount': 'إنشاء حساب جديد',
    'login.forgotPassword': 'نسيت كلمة المرور؟',
    
    // Password Reset
    'passwordReset.title': 'استعادة كلمة المرور',
    'passwordReset.emailStep': 'أدخل بريدك الإلكتروني المسجل',
    'passwordReset.codeStep': 'أدخل الرمز المرسل إلى بريدك',
    'passwordReset.passwordStep': 'أدخل كلمة المرور الجديدة',
    'passwordReset.successStep': 'تم استعادة كلمة المرور بنجاح',
    'passwordReset.emailLabel': 'البريد الإلكتروني',
    'passwordReset.emailPlaceholder': 'أدخل بريدك الإلكتروني',
    'passwordReset.codeLabel': 'رمز التحقق',
    'passwordReset.codeHint': 'تم إرسال رمز مكون من 6 أرقام إلى بريدك',
    'passwordReset.newPasswordLabel': 'كلمة المرور الجديدة',
    'passwordReset.newPasswordPlaceholder': 'أدخل كلمة المرور الجديدة',
    'passwordReset.confirmPasswordLabel': 'تأكيد كلمة المرور',
    'passwordReset.confirmPasswordPlaceholder': 'أعد إدخال كلمة المرور',
    'passwordReset.sendCode': 'إرسال الرمز',
    'passwordReset.sending': 'جاري الإرسال...',
    'passwordReset.verify': 'تحقق',
    'passwordReset.verifying': 'جاري التحقق...',
    'passwordReset.resetPassword': 'إعادة تعيين كلمة المرور',
    'passwordReset.resetting': 'جاري التحديث...',
    'passwordReset.successTitle': 'تم بنجاح!',
    'passwordReset.successMessage': 'تم إعادة تعيين كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.',
    'passwordReset.backToLogin': 'العودة لتسجيل الدخول',
    'passwordReset.resendCode': 'إعادة إرسال الرمز',
    'passwordReset.showPassword': 'إظهار كلمة المرور',
    'passwordReset.hidePassword': 'إخفاء كلمة المرور',
    
    // Register
    'register.title': 'إنشاء حساب جديد',
    'register.subtitle': 'انضم إلى منصة التداول الذكي',
    'register.email': 'البريد الإلكتروني',
    'register.username': 'اسم المستخدم',
    'register.fullName': 'الاسم الكامل',
    'register.country': 'اختر الدولة أو ابحث...',
    'register.password': 'كلمة المرور',
    'register.confirmPassword': 'تأكيد كلمة المرور',
    'register.createAccount': 'إنشاء حساب',
    'register.creating': 'جاري إنشاء الحساب...',
    'register.usernameAvailable': 'اسم المستخدم متاح',
    'register.usernameTaken': 'اسم المستخدم مستخدم بالفعل',
    'register.searchResults': 'نتيجة',
    'register.noResults': 'لا توجد نتائج مطابقة',
    'register.successRate': 'معدل النجاح',
    'register.marketMonitoring': 'مراقبة السوق',
    'register.hasAccount': 'لديك حساب بالفعل؟',
    'register.loginButton': 'تسجيل الدخول',
    'register.termsPrefix': 'أوافق على',
    'register.termsLink': 'الشروط والأحكام',
    
    // Register validation errors
    'register.error.emailRequired': 'البريد الإلكتروني مطلوب',
    'register.error.emailInvalid': 'البريد الإلكتروني غير صحيح',
    'register.error.usernameRequired': 'اسم المستخدم مطلوب',
    'register.error.usernameLength': 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل',
    'register.error.usernameFormat': 'اسم المستخدم يجب أن يحتوي على أحرف وأرقام فقط',
    'register.error.usernameTaken': 'اسم المستخدم مستخدم بالفعل',
    'register.error.usernameChecking': 'جاري التحقق من توفر اسم المستخدم...',
    'register.error.usernameWait': 'يرجى انتظار التحقق من توفر اسم المستخدم',
    'register.error.fullNameRequired': 'الاسم الكامل مطلوب',
    'register.error.fullNameLength': 'الاسم الكامل يجب أن يكون حرفين على الأقل',
    'register.error.countryRequired': 'الدولة مطلوبة',
    'register.error.passwordRequired': 'كلمة المرور مطلوبة',
    'register.error.passwordLength': 'كلمة المرور يجب أن تكون 8 أحرف على الأقل',
    'register.error.passwordFormat': 'كلمة المرور يجب أن تحتوي على حرف كبير وصغير ورقم',
    'register.error.confirmPasswordRequired': 'تأكيد كلمة المرور مطلوب',
    'register.error.passwordMismatch': 'كلمة المرور غير متطابقة',
    
    // Login validation errors
    'login.error.usernameRequired': 'اسم المستخدم أو البريد الإلكتروني مطلوب',
    'login.error.passwordRequired': 'كلمة المرور مطلوبة',
    
    // Install App
    'install.title': 'تثبيت التطبيق',
    'install.button': 'تثبيت',
    'install.buttonFull': 'تثبيت التطبيق',
    'install.description': 'أضف بوت التداول لهاتفك',
    'install.subtitle': 'وصول سريع وعمل بدون إنترنت',
    'install.benefits.offline': 'عمل بدون إنترنت',
    'install.benefits.homescreen': 'وصول سريع من الشاشة الرئيسية',
    'install.benefits.notifications': 'إشعارات فورية',
    'install.benefits.native': 'تجربة تطبيق أصلي',
    'install.later': 'لاحقاً',
    'install.installed': 'التطبيق مثبت',
    'install.tip': '💡 نصيحة: يمكنك الدفع حتى بدون حساب PayPal باستخدام بطاقتك الائتمانية مباشرة',

    // Common
    'common.loading': 'جاري التحميل...',
    'common.error': 'حدث خطأ',
    'common.success': 'تم بنجاح',
    'common.cancel': 'إلغاء',
    'common.save': 'حفظ',
    'common.close': 'إغلاق',
    'common.yes': 'نعم',
    'common.no': 'لا',
    'common.confirm': 'تأكيد',
    'common.delete': 'حذف',
    'common.edit': 'تعديل',
    'common.add': 'إضافة',
    'common.search': 'بحث',
    'common.filter': 'تصفية',
    'common.refresh': 'تحديث',
    'common.back': 'رجوع',
    'common.backToDashboard': 'الرجوع للوحة التحكم',
    'common.logout': 'تسجيل الخروج',
    'common.next': 'التالي',
    'common.previous': 'السابق',
    'common.submit': 'إرسال',
    'common.reset': 'إعادة تعيين',
    'common.clear': 'مسح',
    'common.select': 'اختيار',
    'common.all': 'الكل',
    'common.none': 'لا شيء',
    'common.active': 'نشط',
    'common.inactive': 'غير نشط',
    'common.enabled': 'مفعل',
    'common.disabled': 'معطل',
    'common.online': 'متصل',
    'common.offline': 'غير متصل',
    'common.connected': 'متصل',
    'common.disconnected': 'منقطع',
    'common.start': 'تشغيل',
    'common.stop': 'إيقاف',
    
    // Binary Options Settings
    'binarySettings.title': 'إعدادات الخيارات الثنائية',
    'binarySettings.signalsSettings': 'إعدادات الإشارات',
    'binarySettings.minConfidence': 'الحد الأدنى للثقة',
    'binarySettings.maxSignalsPerHour': 'أقصى إشارات في الساعة',
    'binarySettings.preferredRiskLevel': 'مستوى المخاطرة المفضل',
    'binarySettings.riskLow': 'منخفضة',
    'binarySettings.riskMedium': 'متوسطة',
    'binarySettings.riskHigh': 'عالية',
    'binarySettings.preferredTimeframes': 'الأطر الزمنية المفضلة',
    'binarySettings.alertSettings': 'إعدادات التنبيهات',
    'binarySettings.soundAlerts': 'التنبيهات الصوتية',
    'binarySettings.browserNotifications': 'إشعارات المتصفح',
    'binarySettings.signalAlerts': 'تنبيهات الإشارات',
    'binarySettings.tradeResults': 'نتائج الصفقات',
    'binarySettings.connectionStatus': 'حالة الاتصال',
    'binarySettings.testAlert': 'اختبار التنبيه',
    'binarySettings.technicalAnalysisSettings': 'إعدادات التحليل الفني',
    'binarySettings.rsiPeriod': 'فترة RSI',
    'binarySettings.bollingerPeriod': 'فترة Bollinger',
    'binarySettings.macdFast': 'MACD سريع',
    'binarySettings.macdSlow': 'MACD بطيء',
    'binarySettings.macdSignal': 'إشارة MACD',
    'binarySettings.riskManagement': 'إدارة المخاطر',
    'binarySettings.maxRiskPerTrade': 'أقصى مخاطرة لكل صفقة',
    'binarySettings.dailyLossLimit': 'حد الخسارة اليومية',
    'binarySettings.consecutiveLossLimit': 'حد الخسائر المتتالية',
    'binarySettings.filterWeakSignals': 'تصفية الإشارات الضعيفة',
    'binarySettings.requireMultipleConfirmations': 'طلب تأكيدات متعددة',
    'binarySettings.avoidHighVolatility': 'تجنب التقلبات العالية',
    'binarySettings.respectMarketHours': 'احترام ساعات السوق',
    'binarySettings.resetToDefaults': 'استعادة الافتراضي',
    'binarySettings.saveSettings': 'حفظ الإعدادات',
    
    // Subscription and Payments Page
    'subscriptionPage.title': 'الاشتراك والمدفوعات',
    'subscriptionPage.back': 'العودة',
    'subscriptionPage.loading': 'جاري تحميل البيانات...',
    'subscriptionPage.subscriptionTab': 'الاشتراك',
    'subscriptionPage.paymentsTab': 'المدفوعات',
    'subscriptionPage.subscriptionStatus': 'حالة الاشتراك',
    'subscriptionPage.active': 'نشط',
    'subscriptionPage.inactive': 'غير نشط',
    'subscriptionPage.timeRemaining': 'الوقت المتبقي من الاشتراك',
    'subscriptionPage.days': 'يوم',
    'subscriptionPage.hours': 'ساعة',
    'subscriptionPage.minutes': 'دقيقة',
    'subscriptionPage.seconds': 'ثانية',
    'subscriptionPage.startDate': 'البداية',
    'subscriptionPage.endDate': 'الانتهاء',
    'subscriptionPage.price': 'السعر',
    'subscriptionPage.contactSupport': 'التواصل مع الدعم',
    'subscriptionPage.renewSubscription': 'تجديد الاشتراك',
    'subscriptionPage.renewNow': 'تجديد الآن',
    'subscriptionPage.planFeatures': 'مميزات الباقة',
    'subscriptionPage.userInfo': 'معلومات المستخدم',
    'subscriptionPage.admin': 'مدير',
    'subscriptionPage.trader': 'متداول',
    'subscriptionPage.memberSince': 'عضو منذ',
    'subscriptionPage.paymentHistory': 'سجل المدفوعات',
    'subscriptionPage.noPayments': 'لا توجد مدفوعات',
    'subscriptionPage.notSpecified': 'غير محدد',
    'subscriptionPage.reference': 'المرجع',
    'subscriptionPage.paymentProof': 'إثبات الدفع',
    'subscriptionPage.status.completed': 'مكتمل',
    'subscriptionPage.status.pending': 'قيد الانتظار',
    'subscriptionPage.status.reviewing': 'قيد المراجعة',
    'subscriptionPage.status.failed': 'فاشل',
    'subscriptionPage.status.refunded': 'مسترد',
    'subscriptionPage.status.cancelled': 'ملغي',
    
    // Subscription Widget
    'subscriptionWidget.expired': 'منتهي الصلاحية',
    'subscriptionWidget.expiringSoon': 'ينتهي قريباً',
    'subscriptionWidget.active': 'نشط',
    'subscriptionWidget.subscription': 'الاشتراك',
    'subscriptionWidget.details': 'التفاصيل',
    'subscriptionWidget.planType': 'نوع الباقة',
    'subscriptionWidget.unspecifiedPlan': 'باقة غير محددة',
    'subscriptionWidget.expiresOn': 'ينتهي في',
    'subscriptionWidget.viewDetails': 'عرض التفاصيل',
    'subscriptionWidget.renewNow': 'تجديد الآن',
    
    // Subscription Banner
    'subscriptionBanner.expiredTitle': 'انتهى الاشتراك',
    'subscriptionBanner.expiredMessage': 'انتهت صلاحية اشتراكك. يرجى تجديد الاشتراك للمتابعة.',
    'subscriptionBanner.expiringSoonTitle': 'ينتهي الاشتراك قريباً',
    'subscriptionBanner.expiringSoonMessage': 'سينتهي اشتراكك خلال',
    'subscriptionBanner.day': 'يوم',
    'subscriptionBanner.days': 'أيام',
    'subscriptionBanner.remaining': 'متبقية',
    'subscriptionBanner.plan': 'الباقة',
    'subscriptionBanner.price': 'السعر',
    
    // Subscription Blocked Page
    'subscriptionBlocked.warning': 'تحذير الاشتراك',
    'subscriptionBlocked.expiredMessage': 'انتهت صلاحية اشتراكك. يرجى تجديد الاشتراك للمتابعة في استخدام البوت.',
    'subscriptionBlocked.expiringSoonMessage': 'اشتراكك على وشك الانتهاء. يرجى التجديد لتجنب انقطاع الخدمة.',
    'subscriptionBlocked.status': 'حالة الاشتراك',
    'subscriptionBlocked.timeRemaining': 'الوقت المتبقي',
    'subscriptionBlocked.renewNow': 'تجديد الاشتراك الآن',
    'subscriptionBlocked.refreshStatus': 'تحديث الحالة',
    'subscriptionBlocked.logout': 'تسجيل الخروج',
    'subscriptionBlocked.helpMessage': 'إذا واجهت أي مشاكل في التجديد، يرجى التواصل مع فريق الدعم الفني.',
    'subscriptionBlocked.lastUpdate': 'آخر تحديث',
    
    // Payment Status Page
    'paymentStatus.title': 'حالة المدفوعات',
    'paymentStatus.subtitle': 'تتبع حالة مدفوعاتك واشتراكاتك',
    'paymentStatus.lastUpdate': 'آخر تحديث',
    'paymentStatus.refreshing': 'جاري التحديث...',
    'paymentStatus.refreshNow': 'تحديث فوري',
    'paymentStatus.reviewingTitle': 'مدفوعات قيد المراجعة',
    'paymentStatus.reviewingMessage': 'لديك مدفوعات قيد المراجعة. سيتم تحديث الحالة تلقائياً عند موافقة المدير.',
    'paymentStatus.checkNow': 'تحقق الآن',
    'paymentStatus.noPayments': 'لا توجد مدفوعات',
    'paymentStatus.noPaymentsMessage': 'لم تقم بأي عمليات دفع حتى الآن',
    'paymentStatus.unspecifiedPlan': 'باقة غير محددة',
    'paymentStatus.proofImage': 'صورة تأكيد الدفع',
    'paymentStatus.amount': 'المبلغ',
    'paymentStatus.plan': 'الباقة',
    'paymentStatus.user': 'المستخدم',
    'paymentStatus.email': 'البريد الإلكتروني',
    'paymentStatus.paymentMethod': 'طريقة الدفع',
    'paymentStatus.submissionDate': 'تاريخ الإرسال',
    'paymentStatus.reviewStatus': 'حالة المراجعة',
    'paymentStatus.pendingReview': 'في انتظار المراجعة',
    'paymentStatus.accepted': 'تم قبول الدفع',
    'paymentStatus.rejected': 'تم رفض الدفع',
    'paymentStatus.importantInfo': 'معلومات مهمة',
    'paymentStatus.cryptocurrency': 'عملة رقمية',
    
    // Payment Review Page
    'paymentReview.paymentDetails': 'تفاصيل الدفع',
    'paymentReview.checking': 'جاري التحقق...',
    'paymentReview.updateStatus': 'تحديث الحالة',
    'paymentReview.pendingMessage': 'تم استلام صورة إثبات الدفع وهي قيد المراجعة من قبل المدير. عادة ما تستغرق عملية المراجعة من 2-24 ساعة.',
    'paymentReview.approvedMessage': '🎉 تهانينا! تم قبول دفعتك وتفعيل حسابك بنجاح. يمكنك الآن تسجيل الدخول والاستفادة من جميع ميزات الباقة.',
    'paymentReview.rejectedMessage': 'لم يتم قبول دفعتك. يرجى مراجعة ملاحظات المدير أدناه والتواصل معنا إذا كان لديك أي استفسار.',
    'paymentReview.adminNote': 'ملاحظة المدير',
    'paymentReview.rejectionReason': 'سبب الرفض',
    'paymentReview.info1': 'يتم تحديث الحالة تلقائياً كل 30 ثانية',
    'paymentReview.info2': 'في حالة القبول، ستتمكن من تسجيل الدخول فوراً',
    'paymentReview.info3': 'في حالة الرفض، يمكنك إعادة المحاولة بدفعة جديدة',
    'paymentReview.info4': 'للاستفسارات، تواصل معنا عبر البريد الإلكتروني',
    'paymentReview.lastUpdate': 'آخر تحديث',
    'paymentReview.reviewingMessage': 'يتم مراجعة دفعتك من قبل المدير',
    'paymentReview.approvedTitle': 'تم تفعيل حسابك بنجاح',
    'paymentReview.rejectedTitle': 'لم يتم قبول دفعتك',
    'paymentReview.title': 'مراجعة الدفع',
    'paymentReview.acceptedTitle': 'تم قبول الدفع!',
    'paymentReview.canLoginNow': 'يمكنك الآن تسجيل الدخول والوصول إلى جميع الميزات!',
    'paymentReview.loginNow': 'تسجيل الدخول الآن',
    'paymentReview.backToLogin': 'العودة لتسجيل الدخول',
    'paymentReview.tryAgain': 'إعادة المحاولة',
    
    // Trading
    'trading.signals': 'الإشارات',
    'trading.signal': 'إشارة',
    'trading.buy': 'شراء',
    'trading.sell': 'بيع',
    'trading.call': 'صاعد',
    'trading.put': 'هابط',
    'trading.price': 'السعر',
    'trading.amount': 'المبلغ',
    'trading.profit': 'الربح',
    'trading.loss': 'الخسارة',
    'trading.balance': 'الرصيد',
    'trading.asset': 'الأصل',
    'trading.assets': 'الأصول',
    'trading.expiry': 'انتهاء الصلاحية',
    'trading.duration': 'المدة',
    'trading.direction': 'الاتجاه',
    'trading.strength': 'القوة',
    'trading.confidence': 'الثقة',
    'trading.recommendation': 'التوصية',
    'trading.analysis': 'التحليل',
    'trading.strategy': 'الاستراتيجية',
    'trading.performance': 'الأداء',
    'trading.history': 'التاريخ',
    'trading.statistics': 'الإحصائيات',
    'trading.winRate': 'معدل الفوز',
    'trading.totalTrades': 'إجمالي الصفقات',
    'trading.profitLoss': 'الربح والخسارة',
    'trading.riskLevel': 'مستوى المخاطرة',
    'trading.lowRisk': 'مخاطرة منخفضة',
    'trading.lowRiskShort': 'منخفض',
    'trading.mediumRisk': 'مخاطرة متوسطة',
    'trading.mediumRiskShort': 'متوسط',
    'trading.highRisk': 'مخاطرة عالية',
    'trading.highRiskShort': 'عالي',
    
    // Bot Status
    'bot.status': 'حالة البوت',
    'bot.running': 'يعمل',
    'bot.stopped': 'متوقف',
    'bot.starting': 'جاري التشغيل',
    'bot.stopping': 'جاري الإيقاف',
    'bot.error': 'خطأ في البوت',
    'bot.connected': 'متصل',
    'bot.disconnected': 'منقطع',
    'bot.autoTrading': 'التداول التلقائي',
    'bot.manualTrading': 'التداول اليدوي',
    
    // Admin Panel
    'admin.title': 'لوحة إدارة النظام',
    'admin.users': 'المستخدمون',
    'admin.user': 'مستخدم',
    'admin.addUser': 'إضافة مستخدم',
    'admin.editUser': 'تعديل مستخدم',
    'admin.deleteUser': 'حذف مستخدم',
    'admin.username': 'اسم المستخدم',
    'admin.email': 'البريد الإلكتروني',
    'admin.password': 'كلمة المرور',
    'admin.role': 'الدور',
    'admin.status': 'الحالة',
    'admin.lastLogin': 'آخر دخول',
    'admin.createdAt': 'تاريخ الإنشاء',
    'admin.actions': 'الإجراءات',
    'admin.totalUsers': 'إجمالي المستخدمين',
    'admin.activeUsers': 'المستخدمون النشطون',
    'admin.adminUsers': 'المديرون',
    'admin.traderUsers': 'المتداولون',
    
    'admin.userDeleted': 'تم حذف المستخدم بنجاح',
    'admin.userUpdated': 'تم تحديث المستخدم بنجاح',
    'admin.userCreated': 'تم إنشاء المستخدم بنجاح',
    
    // Data Management
    'data.title': 'إدارة البيانات',
    'data.realTime': 'البيانات الحقيقية',
    'data.simulated': 'البيانات المحاكاة',
    'data.source': 'مصدر البيانات',
    'data.status': 'حالة البيانات',
    'data.lastUpdate': 'آخر تحديث',
    'data.refresh': 'تحديث البيانات',
    'data.connection': 'الاتصال',
    'data.quality': 'جودة البيانات',
    'data.excellent': 'ممتازة',
    'data.good': 'جيدة',
    'data.poor': 'ضعيفة',
    'data.failed': 'فشل',
    'data.manageSources': 'إدارة مصادر البيانات',
    'data.usingRealDesc': 'يتم استخدام APIs حقيقية للحصول على البيانات المباشرة',
    'data.usingSimDesc': 'يتم استخدام بيانات محاكاة للاختبار والتطوير',
    'data.apiStatusTitle': 'حالة APIs',
    'data.supportedApisInfo': 'معلومات APIs المدعومة',
    'data.requestsPerMinute': 'طلبات/دقيقة',
    'data.api.twelvedata.desc': 'فوركس وأسهم - 8 طلبات/دقيقة',
    'data.api.binance.desc': 'عملات مشفرة - WebSocket مباشر',
    'data.api.metal.desc': 'معادن نفيسة - 10 طلبات/دقيقة',
    'data.api.alphavantage.desc': 'بيانات مالية - 5 طلبات/دقيقة',
    'data.setupInstructions.title': '📝 تعليمات الإعداد:',
    'data.setup.step1': '1. انسخ ملف .env.example إلى .env',
    'data.setup.step2': '2. احصل على مفاتيح API من المواقع المذكورة في الملف',
    'data.setup.step3': '3. أضف المفاتيح في ملف .env',
    'data.setup.step4': '4. أعد تشغيل التطبيق لتفعيل البيانات الحقيقية',
    // Real data & logs
    'data.realDataAndLogs': 'البيانات الحقيقية والسجلات',
    'data.realEnabled': 'البيانات الحقيقية مفعلة',
    'data.simEnabled': 'البيانات المحاكاة مفعلة',
    'data.enableReal': 'تفعيل البيانات الحقيقية',
    'data.disableReal': 'تعطيل البيانات الحقيقية',
    'data.testConnection': 'اختبار الاتصال',
    'data.testing': 'جاري الاختبار...'
    ,'data.logs': 'السجلات',
    'data.entries': 'إدخال',
    'data.liveDataLog': 'سجل البيانات المباشر',
    'data.clearLogs': 'مسح السجل',
    'data.noLogsYet': 'لا توجد سجلات بعد. جرب تفعيل البيانات الحقيقية أو اختبار الاتصال.',
    'data.toggleLogs': 'عرض/إخفاء السجلات',
    'data.simulatedSafeNote': 'البيانات المحاكاة آمنة ومثالية للتعلم والاختبار بدون مخاطر.',
    
    // Notifications
    'notification.newSignal': 'إشارة جديدة',
    'notification.tradeExecuted': 'تم تنفيذ الصفقة',
    'notification.profitMade': 'تم تحقيق ربح',
    'notification.lossIncurred': 'تم تكبد خسارة',
    'notification.botStarted': 'تم تشغيل البوت',
    'notification.botStopped': 'تم إيقاف البوت',
    'notification.connectionLost': 'انقطع الاتصال',
    'notification.connectionRestored': 'تم استعادة الاتصال',
    
    // Binary Signals
    'signals.title': 'الإشارات المباشرة',
    'signals.panelTitle': 'الإشارات الفورية',
    'signals.noSignalsPanel': 'لا توجد إشارات حالياً',
    'signals.noSignalsDesc': 'سيتم عرض الإشارات عند تشغيل البوت',
    'signals.buy': 'شراء',
    'signals.sell': 'بيع',
    'signals.price': 'السعر',
    'signals.live': 'مباشر',
    'signals.allTimeframes': 'جميع الأوقات',
    'signals.minute': 'دقيقة',
    'signals.minutes': 'دقائق',
    'signals.confidence': 'ثقة',
    'signals.todaySignals': 'إشارات اليوم',
    'signals.avgConfidence': 'متوسط الثقة',
    'signals.lowRisk': 'مخاطر منخفضة',
    'signals.trades5min': 'صفقات 5 دقائق',
    'signals.noSignals': 'لا توجد إشارات تطابق المعايير المحددة',
    'signals.searching': 'جاري البحث عن فرص تداول...',
    'signals.direction': 'الاتجاه',
    'signals.entryPrice': 'سعر الدخول',
    'signals.duration': 'مدة الصفقة',
    'signals.risk': 'المخاطرة',
    'signals.winRate': 'نسبة النجاح',
    'signals.timeRemaining': 'الوقت المتبقي',
    'signals.technicalAnalysis': 'التحليل الفني',
    'signals.precise': 'دقيقة',
    'signals.trend': 'الاتجاه',
    'signals.bullish': 'صاعد',
    'signals.bearish': 'هابط',
    'signals.sideways': 'جانبي',
    'signals.oversold': 'تشبع بيعي',
    'signals.overbought': 'تشبع شرائي',
    'signals.crossover': 'تقاطع',
    'signals.support': 'دعم',
    'signals.resistance': 'مقاومة',
    'signals.strong': 'قوي',
    'signals.bollinger': 'بولينجر',
    'signals.lower': 'سفلي',
    'signals.upper': 'علوي',
    'signals.momentum': 'زخم',
    'signals.positive': 'إيجابي',
    'signals.negative': 'سلبي',
    'signals.stochastic': 'ستوكاستيك',
    'signals.volume': 'حجم التداول',
    'signals.increasing': 'متزايد',
    'signals.decreasing': 'متناقص',
    'signals.reason': 'السبب',
    'signals.executeBuy': 'تنفيذ شراء',
    'signals.executeSell': 'تنفيذ بيع',
    'signals.warning': 'تحذير: تداول الخيارات الثنائية ينطوي على مخاطر عالية. استخدم هذه الإشارات كمرجع فقط وليس كنصيحة استثمارية.',
    'signals.startBot': 'قم بتشغيل البوت لبدء توليد الإشارات',
    'signals.settings': 'إعدادات الخيارات الثنائية',
    'signals.clearAll': 'مسح الكل',
    'signals.noneNow': 'لا توجد إشارات حالياً',
    'signals.willShowOnStart': 'سيتم عرض الإشارات عند تشغيل البوت',
    'signals.payout': 'العائد',
    'signals.indicators': 'المؤشرات الفنية',
    'signals.reasonsTitle': 'أسباب الإشارة',
    'signals.moreReasons': 'أسباب أخرى',
    'signals.execute': 'تنفيذ',
    'signals.executeTrade': 'تنفيذ الصفقة',
    'signals.details': 'تفاصيل',
    'signals.autoExecute': '✓ سيتم التنفيذ تلقائياً',
    'signals.enterIn': 'دخول خلال',
    
    // Assets (already defined above)
    'assets.all': 'الكل',
    'assets.regular': 'عادي',
    'assets.otc': 'OTC',
    'assets.major': 'رئيسية',
    'assets.crypto': 'مشفرة',
    'assets.commodities': 'سلع',
    'assets.noAssets': 'لا توجد أصول متاحة',
    'assets.noResults': 'لا توجد نتائج للبحث',
    'assets.clearFilters': 'مسح الفلاتر',
    'assets.searchPlaceholder': 'بحث...',
    
    // IQ Option Status
    'iqoption.title': 'IQ Option',
    'iqoption.connected': 'متصل',
    'iqoption.disconnected': 'غير متصل',
    'iqoption.livePrices': 'الأسعار المباشرة',
    'iqoption.lastUpdate': 'آخر تحديث',
    'iqoption.connecting': 'جاري محاولة الاتصال بـ IQ Option...',
    'iqoption.source': 'المصدر',
    'iqoption.realData': 'بيانات IQ Option الحقيقية',
    'iqoption.simulation': 'محاكاة',
    'iqoption.connectionError': 'خطأ في الاتصال',
    'iqoption.noResults': 'لا توجد نتائج',
    'iqoption.searchPlaceholder': 'بحث...',
    'iqoption.pairs': 'زوج',
    
    // Charts
    'charts.candles': 'شموع',
    'charts.line': 'خط',
    'charts.interval': 'الفترة',
    'charts.realtime': 'مباشر',
    'charts.bullish': 'صاعد',
    'charts.bearish': 'هابط',
    
    // Directives / General Status
    'directives.loadingAdmin': 'جاري تحميل لوحة التحكم...',
    'directives.startBotAssistant': 'قم بتشغيل البوت لاستخدام المساعد',
    'directives.startBotRecommendations': 'قم بتشغيل البوت لعرض التوصيات الذكية',
    'directives.startBotRisk': 'قم بتشغيل البوت لعرض إدارة المخاطر',
    'directives.startBotSignals': 'قم بتشغيل البوت لعرض الإشارات المباشرة',

    // Common extras
    'common.now': 'الآن',
    'common.secondsShort': 'ث',

    // Admin Panel
    // Additional Admin keys (placeholders, filters, table labels)
    'admin.desc': 'إدارة شاملة للمستخدمين والنظام',
    'admin.badge.adminFull': 'مدير النظام',
    'admin.badge.adminShort': 'مدير',
    'admin.stats.totalShort': 'إجمالي',
    'admin.stats.totalUsers': 'إجمالي المستخدمين',
    'admin.stats.activeShort': 'نشطين',
    'admin.stats.activeUsers': 'مستخدمين نشطين',
    'admin.stats.admins': 'مديرين',
    'admin.stats.traders': 'متداولين',
    'admin.search.placeholder': 'البحث...',
    'admin.filter.allRoles': 'جميع الأدوار',
    'admin.filter.admins': 'مديرين',
    'admin.filter.traders': 'متداولين',
    'admin.add.short': 'إضافة',
    'admin.add.full': 'إضافة مستخدم',
    'admin.table.user': 'المستخدم',
    'admin.table.role': 'الدور',
    'admin.table.status': 'الحالة',
    'admin.table.lastLogin': 'آخر دخول',
    'admin.table.actions': 'الإجراءات',
    'admin.role.admin': 'مدير',
    'admin.role.trader': 'متداول',
    'admin.noLogin': 'لم يسجل دخول',
    'admin.emptyState': 'لا توجد مستخدمين مطابقين للبحث',
    'admin.modal.add.titleShort': 'إضافة مستخدم',
    'admin.modal.add.title': 'إضافة مستخدم جديد',
    'admin.form.email': 'البريد الإلكتروني',
    'admin.form.username': 'اسم المستخدم',
    'admin.form.password': 'كلمة المرور',
    'admin.form.role': 'الدور',
    'admin.placeholder.email': 'أدخل البريد',
    'admin.placeholder.username': 'أدخل اسم المستخدم',
    'admin.placeholder.password': 'أدخل كلمة المرور',
    'admin.creating': 'جاري الإنشاء...',
    'admin.create': 'إنشاء',
    'admin.modal.edit.title': 'تعديل المستخدم',
    'admin.form.active': 'حساب نشط',
    'admin.saving': 'جاري الحفظ...',
    'admin.confirmDelete': 'هل أنت متأكد من حذف هذا المستخدم؟',
    
    
    // أسباب التوصيات
    'recommendations.reasons.strongTechnical': '🎯 إشارات فنية قوية جداً',
    'recommendations.reasons.lowVolatility': '🔒 تقلبات منخفضة - استقرار عالي',
    'recommendations.reasons.highVolatility': '⚡ تقلبات عالية - فرص سريعة',
    'recommendations.reasons.idealTimeframe': '⏰ إطار {duration} دقيقة مثالي (ثقة {confidence}%)',
    'recommendations.reasons.clearLevels': '🎚️ مستويات دعم ومقاومة واضحة',
    
    // أسماء أزواج العملات
    'currency.EURUSD': 'يورو/دولار أمريكي',
    'currency.EUR/USD': 'يورو/دولار أمريكي',
    'currency.GBPUSD': 'جنيه إسترليني/دولار أمريكي',
    'currency.GBP/USD': 'جنيه إسترليني/دولار أمريكي',
    'currency.USDJPY': 'دولار أمريكي/ين ياباني',
    'currency.USD/JPY': 'دولار أمريكي/ين ياباني',
    'currency.AUDUSD': 'دولار أسترالي/دولار أمريكي',
    'currency.AUD/USD': 'دولار أسترالي/دولار أمريكي',
    'currency.USDCAD': 'دولار أمريكي/دولار كندي',
    'currency.USD/CAD': 'دولار أمريكي/دولار كندي',
    'currency.USDCHF': 'دولار أمريكي/فرنك سويسري',
    'currency.USD/CHF': 'دولار أمريكي/فرنك سويسري',
    'currency.EURGBP': 'يورو/جنيه إسترليني',
    'currency.EUR/GBP': 'يورو/جنيه إسترليني',
    'currency.EURJPY': 'يورو/ين ياباني',
    'currency.EUR/JPY': 'يورو/ين ياباني',
    'currency.GOLD': 'الذهب',
    'currency.BTC': 'بيتكوين',
    'currency.ETH': 'إيثيريوم',
    
    // مساعد التداول الذكي
    'assistant.title': 'مساعد التداول الذكي',
    'assistant.subtitle': 'تحليل الإشارات والتوصيات',
    'assistant.newSignalAvailable': 'إشارة جديدة متاحة',
    'assistant.asset': 'الأصل',
    'assistant.direction': 'الاتجاه',
    'assistant.confidence': 'نسبة الثقة',
    'assistant.duration': 'المدة',
    'assistant.tradeAllowed': 'الصفقة مسموحة',
    'assistant.tradeNotAllowed': 'الصفقة غير مسموحة',
    'assistant.recommendedAmount': 'المبلغ الموصى به',
    'assistant.maxLoss': 'أقصى خسارة',
    'assistant.expectedProfit': 'الربح المتوقع',
    'assistant.copyAsset': 'نسخ الأصل',
    'assistant.copyInstructions': 'نسخ التعليمات',
    'assistant.copied': 'تم النسخ!',
    'assistant.bestRecommendations': 'أفضل التوصيات الحالية',
    'assistant.points': 'نقاط',
    'assistant.success': 'نجاح',
    'assistant.smartTradingTips': 'نصائح التداول الذكي',
    'assistant.tip1': 'تحقق من تحليل المخاطر قبل أي صفقة',
    'assistant.tip2': 'استخدم المبلغ الموصى به من النظام',
    'assistant.tip3': 'راقب نسبة الثقة والقوة للإشارات',
    'assistant.tip4': 'اتبع التوصيات عالية الجودة فقط',
    'assistant.tip5': 'احتفظ بسجل لجميع صفقاتك',
    'assistant.tip6': 'لا تتداول أكثر من 5% من رأس المال يومياً',
    'assistant.warning': 'تذكر: هذا مساعد فقط. أنت مسؤول عن جميع قرارات التداول. ابدأ بمبالغ صغيرة واتبع إدارة المخاطر بدقة.',
    
    // أزرار الثيم
    'theme.dark': 'الوضع المظلم',
    'theme.light': 'الوضع المضيء',
    'theme.toggle': 'تغيير الوضع',

    // صفحات الاشتراك
    'subscription.planTitle': 'اختر باقتك المثالية',
    'subscription.subtitle': 'انضم إلى آلاف المتداولين الناجحين واحصل على إشارات تداول احترافية',
    'subscription.backToLogin': 'العودة لتسجيل الدخول',
    'subscription.monthly': 'الباقة الشهرية',
    'subscription.annual': 'الباقة السنوية',
    'subscription.threeyears': 'باقة 3 سنوات',
    'subscription.mostPopular': 'الأكثر شعبية',
    'subscription.save': 'وفر',
    'subscription.month': 'شهر',
    'subscription.year': 'سنة',
    'subscription.years': 'سنوات',
    'subscription.selectPlan': 'اختيار الباقة',
    'subscription.features.realtime': 'إشارات فورية',
    'subscription.features.technical': 'التحليل الفني',
    'subscription.features.risk': 'إدارة المخاطر',
    'subscription.features.support': 'دعم 24/7',
    'subscription.features.priority': 'دعم أولوية',
    'subscription.features.advanced': 'استراتيجيات متقدمة',
    'subscription.features.api': 'وصول API',
    'subscription.features.premium': 'ميزات متميزة',
    'subscription.features.unlimited': 'إشارات غير محدودة',
    'subscription.features.exclusive': 'تحليلات حصرية',

    // صفحة معلومات المستخدم
    'userinfo.title': 'معلومات المستخدم',
    'userinfo.subtitle': 'يرجى إدخال معلوماتك الشخصية لإتمام عملية الاشتراك',
    'userinfo.selectedPlan': 'الباقة المختارة',
    'userinfo.fullName': 'الاسم الكامل',
    'userinfo.email': 'البريد الإلكتروني',
    'userinfo.phone': 'رقم الهاتف',
    'userinfo.country': 'البلد',
    'userinfo.placeholder.fullName': 'أدخل اسمك الكامل',
    'userinfo.placeholder.email': 'أدخل بريدك الإلكتروني',
    'userinfo.placeholder.phone': 'أدخل رقم هاتفك',
    'userinfo.placeholder.country': 'اختر بلدك',
    'userinfo.continue': 'المتابعة للدفع',
    'userinfo.back': 'رجوع',

    // صفحة الدفع
    'payment.loadingData': 'جاري تحميل البيانات...',
    'payment.title': 'إتمام الدفع',
    'payment.subtitle': 'اختر طريقة الدفع المناسبة لك',
    'payment.orderSummary': 'ملخص الطلب',
    'payment.plan': 'الباقة',
    'payment.duration': 'المدة',
    'payment.total': 'المجموع',
    'payment.paymentMethod': 'طريقة الدفع',
    'payment.paypal': 'PayPal',
    'payment.usdt': 'USDT (Tether)',
    'payment.card': 'بطاقة ائتمان',
    'payment.paypalDesc': 'ادفع بأمان باستخدام PayPal',
    'payment.usdtDesc': 'ادفع بالعملة المشفرة USDT',
    'payment.cardDesc': 'ادفع بالبطاقة الائتمانية أو المدينة',
    'payment.processing': 'جاري المعالجة...',
    'payment.payNow': 'ادفع الآن',
    'payment.back': 'رجوع',
    'payment.loadingButtons': 'جاري تحميل أزرار الدفع...',
    'payment.pleaseWait': 'يرجى الانتظار قليلاً',
    'payment.paypalError': 'خطأ في تحميل PayPal',
    'payment.retry': 'إعادة المحاولة',
    'payment.payWithPaypal': 'الدفع عبر حساب PayPal',
    'payment.payWithCard': 'الدفع بالبطاقة البنكية',
    'payment.securePayment': 'دفع آمن ومشفر عبر PayPal',
    'payment.payWithCrypto': 'الدفع بالعملة الرقمية (USDT)',
    'payment.hideCrypto': 'إخفاء خيار العملة الرقمية',
    'payment.cryptoTitle': 'الدفع بالعملة الرقمية (USDT)',
    'payment.cryptoInstructions': 'اتبع الخطوات التالية لإتمام عملية الدفع بنجاح',
    'payment.paymentSteps': 'خطوات الدفع:',
    'payment.step1': 'انسخ عنوان المحفظة USDT (TRC20) أدناه',
    'payment.step2': 'افتح محفظتك الرقمية (Binance, Trust Wallet, إلخ)',
    'payment.step3': 'اختر إرسال USDT على شبكة',
    'payment.step4': 'الصق عنوان المحفظة وأرسل المبلغ المحدد بالضبط',
    'payment.step5': 'التقط صورة لإثبات الدفع (Screenshot) وارفعها أدناه',
    'payment.importantWarning': '⚠️ تحذير مهم:',
    'payment.warning1': 'تأكد من استخدام شبكة',
    'payment.warning2': 'إرسال USDT على شبكة أخرى (ERC20, BEP20) سيؤدي لفقدان الأموال',
    'payment.warning3': 'تحقق من العنوان جيداً قبل الإرسال',
    'payment.walletAddress': 'عنوان USDT (TRC20):',
    'payment.copy': 'نسخ',
    'payment.copied': 'تم النسخ',
    'payment.amountRequired': 'المبلغ المطلوب إرساله',
    'payment.uploadProof': 'رفع صورة إثبات الدفع:',
    'payment.uploadImage': 'اضغط لرفع صورة',
    'payment.imageUploaded': 'تم رفع الصورة',
    'payment.submitProof': 'إرسال إثبات الدفع',
    'payment.submitting': 'جاري الإرسال...',
    'payment.uploadSuccess': 'تم رفع الصورة بنجاح!',
    'payment.uploadSuccessDesc': 'يمكنك الآن تأكيد الدفع أو تغيير الصورة إذا أردت',
    'payment.changeImage': 'تغيير الصورة',
    'payment.processingPayment': 'جاري المعالجة...',
    'payment.processingDesc': 'يتم حفظ بيانات الدفع، سيتم توجيهك لصفحة المراجعة...',
    'payment.backButton': 'العودة',
    'payment.changePlan': 'تغيير الباقة',
    'payment.maxSize': 'حد أقصى',
    'payment.payWithCardButton': 'الدفع بالبطاقة',

    // صفحة نجاح الدفع
    'paymentSuccess.title': 'تم الدفع بنجاح!',
    'paymentSuccess.subtitle': 'شكراً لك على اشتراكك في بوت التداول الاحترافي',
    'paymentSuccess.orderNumber': 'رقم الطلب',
    'paymentSuccess.plan': 'الباقة',
    'paymentSuccess.validUntil': 'صالحة حتى',
    'paymentSuccess.nextSteps': 'الخطوات التالية',
    'paymentSuccess.step1': 'سيتم تفعيل حسابك خلال دقائق قليلة',
    'paymentSuccess.step2': 'ستحصل على بريد إلكتروني بتفاصيل الاشتراك',
    'paymentSuccess.step3': 'يمكنك الآن الوصول لجميع ميزات البوت المتميزة',
    'paymentSuccess.loginNow': 'تسجيل الدخول الآن',

    // صفحة الشروط والأحكام
    'terms.title': 'الشروط والأحكام',
    'terms.lastUpdated': 'آخر تحديث:',
    'terms.acceptance.title': 'قبول الشروط',
    'terms.acceptance.content': 'باستخدام المنصة، توافق على هذه الشروط. نحتفظ بحق التعديل دون إشعار مسبق.',
    'terms.services.title': 'الخدمات',
    'terms.services.content': 'نوفر إشارات تداول تعليمية مبنية على الذكاء الاصطناعي. الإشارات اقتراحات وليست نصائح ملزمة.',
    'terms.risks.title': 'المخاطر',
    'terms.risks.content': 'التداول عالي المخاطر وقد يؤدي لخسارة رأس المال. لا تستثمر أموالاً لا تستطيع خسارتها.',
    'terms.responsibilities.title': 'المسؤوليات',
    'terms.responsibilities.content': 'أنت مسؤول عن قراراتك الاستثمارية. نحن غير مسؤولين عن الخسائر المحتملة.',
    'terms.agreement': 'بالاستخدام، تقر بقراءة وفهم والموافقة على جميع الشروط.',
    'terms.acceptButton': 'أوافق على الشروط',
    'terms.backButton': 'العودة',
    'terms.agreementDeclaration': 'إقرار الموافقة',

    // صفحة التواصل
    'contact.title': 'تواصل معنا',
    'contact.description': 'نحن هنا لمساعدتك! تواصل معنا عبر أي من الطرق التالية',
    'contact.backButton': 'العودة',
    'contact.formTitle': 'أرسل لنا رسالة',
    'contact.nameLabel': 'الاسم',
    'contact.emailLabel': 'البريد الإلكتروني',
    'contact.subjectLabel': 'الموضوع',
    'contact.messageLabel': 'الرسالة',
    'contact.sendButton': 'إرسال الرسالة',
    'contact.sending': 'جاري الإرسال...',
    'contact.liveChatTitle': 'دردشة مباشرة',
    'contact.liveChatDesc': 'تحدث مع فريق الدعم مباشرة',
    'contact.liveChatButton': 'بدء المحادثة',
    'contact.emailTitle': 'البريد الإلكتروني',
    'contact.emailDesc': 'راسلنا على البريد الإلكتروني',
    'contact.emailButton': 'إرسال إيميل',
    'contact.contactMethods': 'طرق التواصل',
    'contact.chatUnavailable': 'خدمة الدردشة المباشرة غير متاحة حالياً. يرجى استخدام النموذج أدناه أو التواصل عبر البريد الإلكتروني.',
    'contact.messageSent': 'تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.',

    // صفحة من نحن
    'about.title': 'من نحن',
    'about.description': 'نحن فريق من المحترفين المتخصصين في التكنولوجيا المالية',
    'about.backButton': 'العودة',
    'about.vision.title': 'رؤيتنا',
    'about.vision.content': 'أن نكون الرائدين في مجال تقنيات التداول الذكي ونمكن المتداولين من تحقيق أهدافهم المالية.',
    'about.mission.title': 'رسالتنا',
    'about.mission.content': 'تطوير حلول تداول ذكية ومبتكرة تساعد المتداولين على اتخاذ قرارات مدروسة وتحقيق نتائج أفضل.',
    'about.whyDifferent': 'لماذا نحن مختلفون؟',
    'about.whyDifferentDesc': 'نقدم ميزات فريدة تجعلنا الخيار الأمثل للمتداولين',
    'about.achievements': 'إنجازاتنا بالأرقام',
    'about.coreValues': 'قيمنا الأساسية',
    
    // الميزات
    'about.features.analysis.title': 'تحليل متقدم',
    'about.features.analysis.desc': 'نستخدم أحدث تقنيات الذكاء الاصطناعي لتحليل الأسواق المالية وتوفير إشارات دقيقة.',
    'about.features.security.title': 'أمان عالي',
    'about.features.security.desc': 'نضمن حماية بياناتك وخصوصيتك من خلال أعلى معايير الأمان والتشفير.',
    'about.features.speed.title': 'سرعة فائقة',
    'about.features.speed.desc': 'إشارات فورية وتحديثات مباشرة لضمان عدم تفويت أي فرصة تداول مربحة.',
    'about.features.coverage.title': 'تغطية شاملة',
    'about.features.coverage.desc': 'نغطي جميع الأسواق الرئيسية من الفوركس والعملات المشفرة إلى الأسهم والسلع.',
    
    // القيم
    'about.values.transparency.title': 'الشفافية',
    'about.values.transparency.desc': 'نؤمن بالشفافية الكاملة في جميع عملياتنا ونتائج إشاراتنا.',
    'about.values.reliability.title': 'الموثوقية',
    'about.values.reliability.desc': 'نسعى لتقديم خدمة موثوقة ومستقرة يمكن الاعتماد عليها.',
    'about.values.excellence.title': 'التميز',
    'about.values.excellence.desc': 'نهدف إلى التميز في كل ما نقدمه من خدمات وحلول تقنية.',
    
    // الإحصائيات
    'about.stats.activeTraders': 'متداول نشط',
    'about.stats.successRate': 'معدل نجاح الإشارات',
    'about.stats.support': 'دعم فني',
    'about.stats.userRating': 'تقييم المستخدمين',
    
    // الفوتر
    'footer.telegram': 'تلغرام',
    'footer.discord': 'ديسكورد',
    'footer.email': 'البريد الإلكتروني',
    'footer.terms': 'الشروط والأحكام',
    'footer.contact': 'اتصل بنا',
    'footer.about': 'من نحن',
    'footer.logoAlt': 'بوت التداول الاحترافي',
    'footer.copyright': 'بوت التداول الاحترافي. جميع الحقوق محفوظة.',
    
    // نصوص إضافية لصفحة نجاح الدفع
    'paymentSuccess.needHelp': 'تحتاج مساعدة؟',
    'paymentSuccess.contactUs': 'تواصل معنا',
  },
  en: {
    // Navigation
    'nav.signals': 'Signals',
    'nav.recommendations': 'Recommendations',
    'nav.precise': 'Options',
    'nav.assistant': 'Assistant',
    'nav.admin': 'Admin',
    'nav.subscription': 'Subscription',
    'nav.signals.desc': 'Real-time trading signals',
    'nav.recommendations.desc': 'AI-powered recommendations',
    'nav.precise.desc': 'Precise time and duration recommendations for binary options',
    'nav.assistant.desc': 'Smart decision assistant',
    'nav.admin.desc': 'User and system management',
    'nav.subscription.desc': 'Manage your subscription and track payment status',
    
    // Header
    'header.settings': 'Settings',
    'header.logout': 'Logout',
    'header.profile': 'Profile',
    'header.language': 'Language',
    
    // Settings Page
    'settings.title': 'Settings',
    'settings.admin': 'System Administrator',
    'settings.trader': 'Trader',
    'settings.changePassword': 'Change Password',
    'settings.currentPassword': 'Current Password',
    'settings.newPassword': 'New Password',
    'settings.confirmPassword': 'Confirm Password',
    'settings.enterCurrentPassword': 'Enter current password',
    'settings.enterNewPassword': 'Enter new password',
    'settings.reEnterPassword': 'Re-enter new password',
    'settings.saving': 'Saving...',
    'settings.saveNewPassword': 'Save New Password',
    'settings.passwordMismatch': 'Passwords do not match',
    'settings.passwordTooShort': 'Password must be at least 6 characters',
    'settings.passwordChangeSuccess': 'Password changed successfully',
    'settings.incorrectPassword': 'Current password is incorrect',
    'settings.passwordChangeError': 'Error changing password',
    'header.theme': 'Theme',
    'header.darkMode': 'Dark Mode',
    'header.lightMode': 'Light Mode',
    'header.startBot': 'Start Bot',
    'header.stopBot': 'Stop Bot',
    'header.dataManagement': 'Data Management',
    'header.realData': 'Real Data',
    'header.apiStatus': 'API Status',
    
    // User Roles
    'user.admin': 'System Administrator',
    'user.trader': 'Trader',
    
    // App names
    'app.shortName': 'BooTrading',
    'app.fullName': 'Professional Trading Bot',
    
    // Assets
    'assets.title': 'Available Assets',
    'assets.all': 'All',
    'assets.regular': 'Regular',
    'assets.otc': 'OTC',
    'assets.major': 'Major',
    'assets.crypto': 'Crypto',
    'assets.commodities': 'Commodities',
    'assets.noAssets': 'No assets available',
    'assets.noResults': 'No search results',
    'assets.clearFilters': 'Clear Filters',
    'assets.searchPlaceholder': 'Search...',
    
    // IQ Option Status
    'iqoption.title': 'IQ Option',
    'iqoption.connected': 'Connected',
    'iqoption.disconnected': 'Disconnected',
    'iqoption.livePrices': 'Live Prices',
    'iqoption.lastUpdate': 'Last update',
    'iqoption.connecting': 'Attempting to connect to IQ Option...',
    'iqoption.source': 'Source',
    'iqoption.realData': 'IQ Option Real Data',
    'iqoption.simulation': 'Simulation',
    'iqoption.connectionError': 'Connection Error',
    'iqoption.noResults': 'No results found',
    'iqoption.searchPlaceholder': 'Search...',
    'iqoption.pairs': 'pairs',
    
    // Sections
    'sections.signals.title': 'Live Signals',
    'sections.signals.desc': 'Real-time trading signals with advanced technical analysis',
    'sections.recommendations.title': 'Smart Recommendations',
    'sections.recommendations.desc': 'AI-powered recommendations and data analysis',
    'sections.assistant.title': 'Smart Trading Assistant',
    'sections.assistant.desc': 'Intelligent assistant for trading decisions',
    
    // Languages
    'lang.arabic': 'العربية',
    'lang.english': 'English',
    'lang.french': 'Français',
    
    // Login
    'login.title': 'Login',
    'login.subtitle': 'Professional Trading Bot',
    'login.username': 'Username or Email',
    'login.password': 'Password',
    'login.button': 'Login',
    'login.loading': 'Logging in...',
    'login.noAccount': 'Don\'t have an account?',
    'login.subscribe': 'Subscribe Now',
    'login.successRate': 'Success Rate',
    'login.marketMonitoring': 'Market Monitoring',
    'login.winRate': '95%+ Win Rate',
    'login.newUser': 'New user?',
    'login.createAccount': 'Create New Account',
    'login.forgotPassword': 'Forgot Password?',
    
    // Password Reset
    'passwordReset.title': 'Password Recovery',
    'passwordReset.emailStep': 'Enter your registered email',
    'passwordReset.codeStep': 'Enter the code sent to your email',
    'passwordReset.passwordStep': 'Enter your new password',
    'passwordReset.successStep': 'Password recovered successfully',
    'passwordReset.emailLabel': 'Email Address',
    'passwordReset.emailPlaceholder': 'Enter your email',
    'passwordReset.codeLabel': 'Verification Code',
    'passwordReset.codeHint': 'A 6-digit code was sent to your email',
    'passwordReset.newPasswordLabel': 'New Password',
    'passwordReset.newPasswordPlaceholder': 'Enter new password',
    'passwordReset.confirmPasswordLabel': 'Confirm Password',
    'passwordReset.confirmPasswordPlaceholder': 'Re-enter password',
    'passwordReset.sendCode': 'Send Code',
    'passwordReset.sending': 'Sending...',
    'passwordReset.verify': 'Verify',
    'passwordReset.verifying': 'Verifying...',
    'passwordReset.resetPassword': 'Reset Password',
    'passwordReset.resetting': 'Resetting...',
    'passwordReset.successTitle': 'Success!',
    'passwordReset.successMessage': 'Your password has been reset successfully. You can now log in with your new password.',
    'passwordReset.backToLogin': 'Back to Login',
    'passwordReset.resendCode': 'Resend Code',
    'passwordReset.showPassword': 'Show Password',
    'passwordReset.hidePassword': 'Hide Password',
    
    // Register
    'register.title': 'Create New Account',
    'register.subtitle': 'Join the Smart Trading Platform',
    'register.email': 'Email Address',
    'register.username': 'Username',
    'register.fullName': 'Full Name',
    'register.country': 'Select country or search...',
    'register.password': 'Password',
    'register.confirmPassword': 'Confirm Password',
    'register.createAccount': 'Create Account',
    'register.creating': 'Creating account...',
    'register.usernameAvailable': 'Username available',
    'register.usernameTaken': 'Username already taken',
    'register.searchResults': 'result',
    'register.noResults': 'No matching results',
    'register.successRate': 'Success Rate',
    'register.marketMonitoring': 'Market Monitoring',
    'register.hasAccount': 'Already have an account?',
    'register.loginButton': 'Login',
    'register.termsPrefix': 'I agree to the',
    'register.termsLink': 'Terms and Conditions',
    
    // Register validation errors
    'register.error.emailRequired': 'Email is required',
    'register.error.emailInvalid': 'Invalid email address',
    'register.error.usernameRequired': 'Username is required',
    'register.error.usernameLength': 'Username must be at least 3 characters',
    'register.error.usernameFormat': 'Username must contain only letters and numbers',
    'register.error.usernameTaken': 'Username is already taken',
    'register.error.usernameChecking': 'Checking username availability...',
    'register.error.usernameWait': 'Please wait for username availability check',
    'register.error.fullNameRequired': 'Full name is required',
    'register.error.fullNameLength': 'Full name must be at least 2 characters',
    'register.error.countryRequired': 'Country is required',
    'register.error.passwordRequired': 'Password is required',
    'register.error.passwordLength': 'Password must be at least 8 characters',
    'register.error.passwordFormat': 'Password must contain uppercase, lowercase and number',
    'register.error.confirmPasswordRequired': 'Password confirmation is required',
    'register.error.passwordMismatch': 'Passwords do not match',
    
    // Login validation errors
    'login.error.usernameRequired': 'Username or email is required',
    'login.error.passwordRequired': 'Password is required',
    
    // Install App
    'install.title': 'Install App',
    'install.button': 'Install',
    'install.buttonFull': 'Install App',
    'install.description': 'Add Trading Bot to your phone',
    'install.subtitle': 'Quick access and offline functionality',
    'install.benefits.offline': 'Works offline',
    'install.benefits.homescreen': 'Quick access from home screen',
    'install.benefits.notifications': 'Instant notifications',
    'install.benefits.native': 'Native app experience',
    'install.later': 'Later',
    'install.installed': 'App Installed',
    'install.tip': '💡 Tip: You can pay even without a PayPal account using your credit card directly',

    // Common
    'common.loading': 'Loading...',
    'common.error': 'An error occurred',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.close': 'Close',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.confirm': 'Confirm',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.refresh': 'Refresh',
    'common.back': 'Back',
    'common.backToDashboard': 'Back to Dashboard',
    'common.logout': 'Logout',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.submit': 'Submit',
    'common.reset': 'Reset',
    'common.clear': 'Clear',
    'common.select': 'Select',
    'common.all': 'All',
    'common.none': 'None',
    'common.active': 'Active',
    'common.inactive': 'Inactive',
    'common.enabled': 'Enabled',
    'common.disabled': 'Disabled',
    'common.online': 'Online',
    'common.offline': 'Offline',
    'common.connected': 'Connected',
    'common.disconnected': 'Disconnected',
    'common.start': 'Start',
    'common.stop': 'Stop',
    
    // Binary Options Settings
    'binarySettings.title': 'Binary Options Settings',
    'binarySettings.signalsSettings': 'Signals Settings',
    'binarySettings.minConfidence': 'Minimum Confidence',
    'binarySettings.maxSignalsPerHour': 'Max Signals Per Hour',
    'binarySettings.preferredRiskLevel': 'Preferred Risk Level',
    'binarySettings.riskLow': 'Low',
    'binarySettings.riskMedium': 'Medium',
    'binarySettings.riskHigh': 'High',
    'binarySettings.preferredTimeframes': 'Preferred Timeframes',
    'binarySettings.alertSettings': 'Alert Settings',
    'binarySettings.soundAlerts': 'Sound Alerts',
    'binarySettings.browserNotifications': 'Browser Notifications',
    'binarySettings.signalAlerts': 'Signal Alerts',
    'binarySettings.tradeResults': 'Trade Results',
    'binarySettings.connectionStatus': 'Connection Status',
    'binarySettings.testAlert': 'Test Alert',
    'binarySettings.technicalAnalysisSettings': 'Technical Analysis Settings',
    'binarySettings.rsiPeriod': 'RSI Period',
    'binarySettings.bollingerPeriod': 'Bollinger Period',
    'binarySettings.macdFast': 'MACD Fast',
    'binarySettings.macdSlow': 'MACD Slow',
    'binarySettings.macdSignal': 'MACD Signal',
    'binarySettings.riskManagement': 'Risk Management',
    'binarySettings.maxRiskPerTrade': 'Max Risk Per Trade',
    'binarySettings.dailyLossLimit': 'Daily Loss Limit',
    'binarySettings.consecutiveLossLimit': 'Consecutive Loss Limit',
    'binarySettings.filterWeakSignals': 'Filter Weak Signals',
    'binarySettings.requireMultipleConfirmations': 'Require Multiple Confirmations',
    'binarySettings.avoidHighVolatility': 'Avoid High Volatility',
    'binarySettings.respectMarketHours': 'Respect Market Hours',
    'binarySettings.resetToDefaults': 'Reset to Defaults',
    'binarySettings.saveSettings': 'Save Settings',
    
    // Subscription and Payments Page
    'subscriptionPage.title': 'Subscription & Payments',
    'subscriptionPage.back': 'Back',
    'subscriptionPage.loading': 'Loading data...',
    'subscriptionPage.subscriptionTab': 'Subscription',
    'subscriptionPage.paymentsTab': 'Payments',
    'subscriptionPage.subscriptionStatus': 'Subscription Status',
    'subscriptionPage.active': 'Active',
    'subscriptionPage.inactive': 'Inactive',
    'subscriptionPage.timeRemaining': 'Time Remaining',
    'subscriptionPage.days': 'Days',
    'subscriptionPage.hours': 'Hours',
    'subscriptionPage.minutes': 'Minutes',
    'subscriptionPage.seconds': 'Seconds',
    'subscriptionPage.startDate': 'Start Date',
    'subscriptionPage.endDate': 'End Date',
    'subscriptionPage.price': 'Price',
    'subscriptionPage.contactSupport': 'Contact Support',
    'subscriptionPage.renewSubscription': 'Renew Subscription',
    'subscriptionPage.renewNow': 'Renew Now',
    'subscriptionPage.planFeatures': 'Plan Features',
    'subscriptionPage.userInfo': 'User Information',
    'subscriptionPage.admin': 'Admin',
    'subscriptionPage.trader': 'Trader',
    'subscriptionPage.memberSince': 'Member Since',
    'subscriptionPage.paymentHistory': 'Payment History',
    'subscriptionPage.noPayments': 'No payments found',
    'subscriptionPage.notSpecified': 'Not specified',
    'subscriptionPage.reference': 'Reference',
    'subscriptionPage.paymentProof': 'Payment Proof',
    'subscriptionPage.status.completed': 'Completed',
    'subscriptionPage.status.pending': 'Pending',
    'subscriptionPage.status.reviewing': 'Under Review',
    'subscriptionPage.status.failed': 'Failed',
    'subscriptionPage.status.refunded': 'Refunded',
    'subscriptionPage.status.cancelled': 'Cancelled',
    
    // Subscription Widget
    'subscriptionWidget.expired': 'Expired',
    'subscriptionWidget.expiringSoon': 'Expiring Soon',
    'subscriptionWidget.active': 'Active',
    'subscriptionWidget.subscription': 'Subscription',
    'subscriptionWidget.details': 'Details',
    'subscriptionWidget.planType': 'Plan Type',
    'subscriptionWidget.unspecifiedPlan': 'Unspecified Plan',
    'subscriptionWidget.expiresOn': 'Expires On',
    'subscriptionWidget.viewDetails': 'View Details',
    'subscriptionWidget.renewNow': 'Renew Now',
    
    // Subscription Banner
    'subscriptionBanner.expiredTitle': 'Subscription Expired',
    'subscriptionBanner.expiredMessage': 'Your subscription has expired. Please renew to continue.',
    'subscriptionBanner.expiringSoonTitle': 'Subscription Expiring Soon',
    'subscriptionBanner.expiringSoonMessage': 'Your subscription expires in',
    'subscriptionBanner.day': 'day',
    'subscriptionBanner.days': 'days',
    'subscriptionBanner.remaining': 'remaining',
    'subscriptionBanner.plan': 'Plan',
    'subscriptionBanner.price': 'Price',
    
    // Subscription Blocked Page
    'subscriptionBlocked.warning': 'Subscription Warning',
    'subscriptionBlocked.expiredMessage': 'Your subscription has expired. Please renew to continue using the bot.',
    'subscriptionBlocked.expiringSoonMessage': 'Your subscription is about to expire. Please renew to avoid service interruption.',
    'subscriptionBlocked.status': 'Subscription Status',
    'subscriptionBlocked.timeRemaining': 'Time Remaining',
    'subscriptionBlocked.renewNow': 'Renew Subscription Now',
    'subscriptionBlocked.refreshStatus': 'Refresh Status',
    'subscriptionBlocked.logout': 'Logout',
    'subscriptionBlocked.helpMessage': 'If you encounter any issues with renewal, please contact technical support.',
    'subscriptionBlocked.lastUpdate': 'Last Update',
    
    // Payment Status Page
    'paymentStatus.title': 'Payment Status',
    'paymentStatus.subtitle': 'Track your payments and subscriptions',
    'paymentStatus.lastUpdate': 'Last Update',
    'paymentStatus.refreshing': 'Refreshing...',
    'paymentStatus.refreshNow': 'Refresh Now',
    'paymentStatus.reviewingTitle': 'Payments Under Review',
    'paymentStatus.reviewingMessage': 'You have payments under review. Status will be updated automatically upon admin approval.',
    'paymentStatus.checkNow': 'Check Now',
    'paymentStatus.noPayments': 'No Payments',
    'paymentStatus.noPaymentsMessage': 'You haven\'t made any payments yet',
    'paymentStatus.unspecifiedPlan': 'Unspecified Plan',
    'paymentStatus.proofImage': 'Payment Proof Image',
    'paymentStatus.amount': 'Amount',
    'paymentStatus.plan': 'Plan',
    'paymentStatus.user': 'User',
    'paymentStatus.email': 'Email',
    'paymentStatus.paymentMethod': 'Payment Method',
    'paymentStatus.submissionDate': 'Submission Date',
    'paymentStatus.reviewStatus': 'Review Status',
    'paymentStatus.pendingReview': 'Pending Review',
    'paymentStatus.accepted': 'Payment Accepted',
    'paymentStatus.rejected': 'Payment Rejected',
    'paymentStatus.importantInfo': 'Important Information',
    'paymentStatus.cryptocurrency': 'Cryptocurrency',
    
    // Payment Review Page
    'paymentReview.paymentDetails': 'Payment Details',
    'paymentReview.checking': 'Checking...',
    'paymentReview.updateStatus': 'Update Status',
    'paymentReview.pendingMessage': 'Payment proof image has been received and is under review by the admin. Review process usually takes 2-24 hours.',
    'paymentReview.approvedMessage': '🎉 Congratulations! Your payment has been accepted and your account has been activated successfully. You can now login and enjoy all plan features.',
    'paymentReview.rejectedMessage': 'Your payment was not accepted. Please review the admin notes below and contact us if you have any questions.',
    'paymentReview.adminNote': 'Admin Note',
    'paymentReview.rejectionReason': 'Rejection Reason',
    'paymentReview.info1': 'Status is automatically updated every 30 seconds',
    'paymentReview.info2': 'If approved, you can login immediately',
    'paymentReview.info3': 'If rejected, you can try again with a new payment',
    'paymentReview.info4': 'For inquiries, contact us via email',
    'paymentReview.lastUpdate': 'Last Update',
    'paymentReview.reviewingMessage': 'Your payment is being reviewed by the admin',
    'paymentReview.approvedTitle': 'Your account has been activated successfully',
    'paymentReview.rejectedTitle': 'Your payment was not accepted',
    'paymentReview.title': 'Payment Review',
    'paymentReview.acceptedTitle': 'Payment Accepted!',
    'paymentReview.canLoginNow': 'You can now login and access all features!',
    'paymentReview.loginNow': 'Login Now',
    'paymentReview.backToLogin': 'Back to Login',
    'paymentReview.tryAgain': 'Try Again',
    
    // Trading
    'trading.signals': 'Signals',
    'trading.signal': 'Signal',
    'trading.buy': 'Buy',
    'trading.sell': 'Sell',
    'trading.call': 'Call',
    'trading.put': 'Put',
    'trading.price': 'Price',
    'trading.amount': 'Amount',
    'trading.profit': 'Profit',
    'trading.loss': 'Loss',
    'trading.balance': 'Balance',
    'trading.asset': 'Asset',
    'trading.assets': 'Assets',
    'trading.expiry': 'Expiry',
    'trading.duration': 'Duration',
    'trading.direction': 'Direction',
    'trading.strength': 'Strength',
    'trading.confidence': 'Confidence',
    'trading.confidenceShort': 'Confidence',
    'trading.recommendation': 'Recommendation',
    'trading.analysis': 'Analysis',
    'trading.strategy': 'Strategy',
    'trading.performance': 'Performance',
    'trading.history': 'History',
    'trading.statistics': 'Statistics',
    'trading.winRate': 'Win Rate',
    'trading.winRateShort': 'Win Rate',
    'trading.totalTrades': 'Total Trades',
    'trading.profitLoss': 'Profit & Loss',
    'trading.riskLevel': 'Risk Level',
    'trading.lowRisk': 'Low Risk',
    'trading.lowRiskShort': 'Low',
    'trading.mediumRisk': 'Medium Risk',
    'trading.mediumRiskShort': 'Medium',
    'trading.highRisk': 'High Risk',
    'trading.highRiskShort': 'High',
    
    // Bot Status
    'bot.status': 'Bot Status',
    'bot.running': 'Running',
    'bot.stopped': 'Stopped',
    'bot.starting': 'Starting',
    'bot.stopping': 'Stopping',
    'bot.error': 'Bot Error',
    'bot.connected': 'Connected',
    'bot.disconnected': 'Disconnected',
    'bot.autoTrading': 'Auto Trading',
    'bot.manualTrading': 'Manual Trading',
    
    // Admin Panel
    'admin.title': 'System Administration Panel',
    'admin.users': 'Users',
    'admin.user': 'User',
    'admin.addUser': 'Add User',
    'admin.editUser': 'Edit User',
    'admin.deleteUser': 'Delete User',
    'admin.username': 'Username',
    'admin.email': 'Email',
    'admin.password': 'Password',
    'admin.role': 'Role',
    'admin.status': 'Status',
    'admin.lastLogin': 'Last Login',
    'admin.createdAt': 'Created At',
    'admin.actions': 'Actions',
    'admin.totalUsers': 'Total Users',
    'admin.activeUsers': 'Active Users',
    'admin.adminUsers': 'Administrators',
    'admin.traderUsers': 'Traders',
    
    'admin.userDeleted': 'User deleted successfully',
    'admin.userUpdated': 'User updated successfully',
    'admin.userCreated': 'User created successfully',
    
    // Data Management
    'data.title': 'Data Management',
    'data.realTime': 'Real Data',
    'data.simulated': 'Simulated Data',
    'data.source': 'Data Source',
    'data.status': 'Data Status',
    'data.lastUpdate': 'Last Update',
    'data.refresh': 'Refresh Data',
    'data.connection': 'Connection',
    'data.quality': 'Data Quality',
    'data.excellent': 'Excellent',
    'data.good': 'Good',
    'data.poor': 'Poor',
    'data.failed': 'Failed',
    'data.manageSources': 'Data Sources Management',
    'data.usingRealDesc': 'Using real APIs to fetch live data',
    'data.usingSimDesc': 'Using simulated data for testing and development',
    'data.apiStatusTitle': 'APIs Status',
    'data.supportedApisInfo': 'Supported APIs Information',
    'data.requestsPerMinute': 'requests/min',
    'data.api.twelvedata.desc': 'Forex & Stocks - 8 requests/min',
    'data.api.binance.desc': 'Cryptocurrencies - Live WebSocket',
    'data.api.metal.desc': 'Precious Metals - 10 requests/min',
    'data.api.alphavantage.desc': 'Financial Data - 5 requests/min',
    'data.setupInstructions.title': '📝 Setup Instructions:',
    'data.setup.step1': '1. Copy .env.example to .env',
    'data.setup.step2': '2. Obtain API keys from the listed providers',
    'data.setup.step3': '3. Add the keys to the .env file',
    'data.setup.step4': '4. Restart the app to enable real data',
    // Real data & logs
    'data.realDataAndLogs': 'Real Data & Logs',
    'data.realEnabled': 'Real data is enabled',
    'data.simEnabled': 'Simulated data is enabled',
    'data.enableReal': 'Enable Real Data',
    'data.disableReal': 'Disable Real Data',
    'data.testConnection': 'Test Connection',
    'data.testing': 'Testing...'
    ,'data.logs': 'Logs',
    'data.entries': 'entries',
    'data.liveDataLog': 'Live Data Log',
    'data.clearLogs': 'Clear Logs',
    'data.noLogsYet': 'No logs yet. Try enabling real data or testing the connection.',
    'data.toggleLogs': 'Show/Hide Logs',
    'data.simulatedSafeNote': 'Simulated data is safe and ideal for learning and testing without risks.',
    
    // Notifications
    'notification.newSignal': 'New Signal',
    'notification.tradeExecuted': 'Trade Executed',
    'notification.profitMade': 'Profit Made',
    'notification.lossIncurred': 'Loss Incurred',
    'notification.botStarted': 'Bot Started',
    'notification.botStopped': 'Bot Stopped',
    'notification.connectionLost': 'Connection Lost',
    'notification.connectionRestored': 'Connection Restored',
    
    // Binary Signals
    'signals.title': 'Live Signals',
    'signals.panelTitle': 'Live Signals',
    'signals.noSignalsPanel': 'No signals currently',
    'signals.noSignalsDesc': 'Signals will appear when the bot is running',
    'signals.buy': 'Buy',
    'signals.sell': 'Sell',
    'signals.price': 'Price',
    'signals.live': 'Live',
    'signals.allTimeframes': 'All Timeframes',
    'signals.minute': 'minute',
    'signals.minutes': 'minutes',
    'signals.confidence': 'Confidence',
    'signals.todaySignals': 'Today\'s Signals',
    'signals.avgConfidence': 'Avg Confidence',
    'signals.lowRisk': 'Low Risk',
    'signals.trades5min': '5min Trades',
    'signals.noSignals': 'No signals match the specified criteria',
    'signals.searching': 'Searching for trading opportunities...',
    'signals.direction': 'Direction',
    'signals.entryPrice': 'Entry Price',
    'signals.duration': 'Duration',
    'signals.risk': 'Risk',
    'signals.riskShort': 'Risk',
    'signals.winRate': 'Win Rate',
    'signals.timeRemaining': 'Time Remaining',
    'signals.technicalAnalysis': 'Technical Analysis',
    'signals.precise': 'Precise',
    'signals.trend': 'Trend',
    'signals.bullish': 'Bullish',
    'signals.bearish': 'Bearish',
    'signals.sideways': 'Sideways',
    'signals.oversold': 'Oversold',
    'signals.overbought': 'Overbought',
    'signals.crossover': 'Crossover',
    'signals.support': 'Support',
    'signals.resistance': 'Resistance',
    'signals.strong': 'Strong',
    'signals.bollinger': 'Bollinger',
    'signals.lower': 'Lower',
    'signals.upper': 'Upper',
    'signals.momentum': 'Momentum',
    'signals.positive': 'Positive',
    'signals.negative': 'Negative',
    'signals.stochastic': 'Stochastic',
    'signals.volume': 'Volume',
    'signals.increasing': 'Increasing',
    'signals.decreasing': 'Decreasing',
    'signals.reason': 'Reason',
    'signals.executeBuy': 'Execute Buy',
    'signals.executeSell': 'Execute Sell',
    'signals.warning': 'Warning: Binary options trading involves high risk. Use these signals as reference only and not as investment advice.',
    'signals.startBot': 'Start the bot to begin generating signals',
    'signals.settings': 'Binary Options Settings',
    'signals.clearAll': 'Clear All',
    'signals.noneNow': 'No signals at the moment',
    'signals.willShowOnStart': 'Signals will appear once the bot is running',
    'signals.payout': 'Payout',
    'signals.indicators': 'Technical Indicators',
    'signals.reasonsTitle': 'Signal Reasons',
    'signals.moreReasons': 'more reasons',
    'signals.execute': 'Execute',
    'signals.executeTrade': 'Execute Trade',
    'signals.details': 'Details',
    'signals.autoExecute': '✓ Will execute automatically',
    'signals.enterIn': 'Entry in',
    
    // Directives / General Status
    'directives.noAssets': 'No assets available at the moment',
    'directives.loadingAdmin': 'Loading admin panel...',
    'directives.startBotAssistant': 'Start the bot to use the assistant',
    'directives.startBotRecommendations': 'Start the bot to view smart recommendations',
    'directives.startBotRisk': 'Start the bot to view risk management',
    'directives.startBotSignals': 'Start the bot to view live signals',

    // Common extras
    'common.now': 'Now',
    'common.secondsShort': 's',

    // Additional Admin keys (placeholders, filters, table labels)
    'admin.desc': 'Comprehensive user and system management',
    'admin.badge.adminFull': 'System Admin',
    'admin.badge.adminShort': 'Admin',
    'admin.stats.totalShort': 'Total',
    'admin.stats.totalUsers': 'Total Users',
    'admin.stats.activeShort': 'Active',
    'admin.stats.activeUsers': 'Active Users',
    'admin.stats.admins': 'Admins',
    'admin.stats.traders': 'Traders',
    'admin.search.placeholder': 'Search...',
    'admin.filter.allRoles': 'All roles',
    'admin.filter.admins': 'Admins',
    'admin.filter.traders': 'Traders',
    'admin.add.short': 'Add',
    'admin.add.full': 'Add User',
    'admin.table.user': 'User',
    'admin.table.role': 'Role',
    'admin.table.status': 'Status',
    'admin.table.lastLogin': 'Last Login',
    'admin.table.actions': 'Actions',
    'admin.role.admin': 'Admin',
    'admin.role.trader': 'Trader',
    'admin.noLogin': 'Never logged in',
    'admin.emptyState': 'No users match your search',
    'admin.modal.add.titleShort': 'Add User',
    'admin.modal.add.title': 'Create New User',
    'admin.form.email': 'Email',
    'admin.form.username': 'Username',
    'admin.form.password': 'Password',
    'admin.form.role': 'Role',
    'admin.placeholder.email': 'Enter email',
    'admin.placeholder.username': 'Enter username',
    'admin.placeholder.password': 'Enter password',
    'admin.creating': 'Creating...',
    'admin.create': 'Create',
    'admin.modal.edit.title': 'Edit User',
    'admin.form.active': 'Active account',
    'admin.saving': 'Saving...',
    'admin.confirmDelete': 'Are you sure you want to delete this user?',
    
    // Smart Recommendations
    'recommendations.title': 'Smart Recommendations',
    'recommendations.subtitle': 'Top currency pairs to trade',
    'recommendations.loading': 'Loading recommendations...',
    'recommendations.lastUpdate': 'Last Update',
    'recommendations.refresh': 'Refresh',
    'recommendations.score': 'Score',
    'recommendations.marketCondition': 'Market Condition',
    'recommendations.trending': 'Trending',
    'recommendations.ranging': 'Ranging',
    'recommendations.volatile': 'Volatile',
    'recommendations.undefined': 'Undefined',
    'recommendations.timeframe': 'Timeframe',
    'recommendations.expectedReturn': 'Expected Return',
    'recommendations.confidence': 'Confidence Level',
    'recommendations.marketAnalysis': 'Market Analysis',
    'recommendations.technicalIndicators': 'Technical Indicators',
    'recommendations.supportLevel': 'Support Level',
    'recommendations.resistanceLevel': 'Resistance Level',
    'recommendations.recommendation': 'Recommendation',
    'recommendations.execute': 'Execute',
    'recommendations.details': 'Details',
    'recommendations.noRecommendations': 'No recommendations available at the moment',
    'recommendations.tryLater': 'Try again later',
    'recommendations.startBot': 'Start the bot to begin market analysis',
    'recommendations.errorLoading': 'Error loading recommendations',
    'recommendations.bestTimeframe': 'Best timeframe',
    'recommendations.signalProbability': 'Signal probability',
    'recommendations.signalProbabilityShort': 'Signal probability',
    'recommendations.reasons': 'Recommendation reasons',
    'recommendations.qualityPoints': 'Quality points',
    'recommendations.qualityPointsShort': 'Quality points',
    'recommendations.confidenceLevel': 'Confidence level',
    'recommendations.confidenceLevelShort': 'Confidence level',
    'recommendations.winRate': 'Win rate',
    'recommendations.winRateShort': 'Win rate',
    'recommendations.retry': 'Retry',
    'recommendations.analyzing': 'Analyzing the market and generating recommendations...',
    'recommendations.detailsOf': 'Details of',
    'recommendations.recommendedTimeframes': 'Recommended timeframes',
    'recommendations.strength': 'Strength',
    'recommendations.warning': 'These recommendations are based on technical analysis and are not investment advice. Please conduct your own research before making any trading decisions.',
    'recommendations.min': 'min',
    
    // Precise Binary Recommendations
    'precise.title': 'Precise Recommendations',
    'precise.subtitle': 'For Binary Options',
    'precise.currentTime': 'Time',
    'precise.analyzing': 'Analyzing pairs...',
    'precise.noRecommendations': 'No recommendations available',
    'precise.tryLater': 'Try refreshing later',
    'precise.entryTime': 'Entry Time',
    'precise.after': 'After',
    'precise.currentPrice': 'Current Price',
    'precise.target': 'Target',
    'precise.successRate': 'Success Rate',
    'precise.confidence': 'Confidence',
    'precise.risk': 'Risk',
    'precise.low': 'Low',
    'precise.medium': 'Medium',
    'precise.high': 'High',
    'precise.technicalIndicators': 'Technical Indicators',
    'precise.trend': 'Trend',
    'precise.momentum': 'Momentum',
    'precise.reason': 'Recommendation Reason',
    'precise.warning': 'Warning: This trade has high risk. Trade with caution!',
    'precise.tips': '💡 Important Tips:',
    'precise.tip1': '• Enter the trade at the exact specified time',
    'precise.tip2': '• Use the recommended duration (1-5 minutes)',
    'precise.tip3': '• Recommendations with 85%+ success rate are best',
    'precise.tip4': '• Avoid high-risk trades if you are a beginner',
    'precise.tip5': '• Don\'t invest more than 2-5% of capital in one trade',
    'precise.call': 'Call',
    'precise.put': 'Put',
    'precise.minutes': 'm',
    'precise.now': 'Now',
    'precise.loading': 'Loading...',
    'precise.riskLow': 'Low',
    'precise.riskMedium': 'Medium',
    'precise.riskHigh': 'High',
    
    // أسباب التوصيات
    'recommendations.reasons.strongTechnical': '🎯 Very strong technical signals',
    'recommendations.reasons.positiveTechnical': '📈 Positive technical signals',
    'recommendations.reasons.strongBullishTrend': '📊 Strong bullish trend',
    'recommendations.reasons.strongBearishTrend': '📊 Strong bearish trend',
    'recommendations.reasons.lowVolatility': '🔒 Low volatility - high stability',
    'recommendations.reasons.highVolatility': '⚡ High volatility - quick opportunities',
    'recommendations.reasons.idealTimeframe': '⏰ {duration} minute timeframe ideal (confidence {confidence}%)',
    'recommendations.reasons.clearLevels': '🎚️ Clear support and resistance levels',
    
    // أسماء أزواج العملات
    'currency.EURUSD': 'Euro/US Dollar',
    'currency.EUR/USD': 'Euro/US Dollar',
    'currency.GBPUSD': 'British Pound/US Dollar',
    'currency.GBP/USD': 'British Pound/US Dollar',
    'currency.USDJPY': 'US Dollar/Japanese Yen',
    'currency.USD/JPY': 'US Dollar/Japanese Yen',
    'currency.AUDUSD': 'Australian Dollar/US Dollar',
    'currency.AUD/USD': 'Australian Dollar/US Dollar',
    'currency.USDCAD': 'US Dollar/Canadian Dollar',
    'currency.USD/CAD': 'US Dollar/Canadian Dollar',
    'currency.USDCHF': 'US Dollar/Swiss Franc',
    'currency.USD/CHF': 'US Dollar/Swiss Franc',
    'currency.EURGBP': 'Euro/British Pound',
    'currency.EUR/GBP': 'Euro/British Pound',
    'currency.EURJPY': 'Euro/Japanese Yen',
    'currency.EUR/JPY': 'Euro/Japanese Yen',
    'currency.GOLD': 'Gold',
    'currency.BTC': 'Bitcoin',
    'currency.ETH': 'Ethereum',
    
    // مساعد التداول الذكي
    'assistant.title': 'Smart Trading Assistant',
    'assistant.subtitle': 'Signal Analysis and Recommendations',
    'assistant.newSignalAvailable': 'New Signal Available',
    'assistant.asset': 'Asset',
    'assistant.direction': 'Direction',
    'assistant.confidence': 'Confidence',
    'assistant.duration': 'Duration',
    'assistant.tradeAllowed': 'Trade Allowed',
    'assistant.tradeNotAllowed': 'Trade Not Allowed',
    'assistant.recommendedAmount': 'Recommended Amount',
    'assistant.maxLoss': 'Max Loss',
    'assistant.expectedProfit': 'Expected Profit',
    'assistant.copyAsset': 'Copy Asset',
    'assistant.copyInstructions': 'Copy Instructions',
    'assistant.copied': 'Copied!',
    'assistant.bestRecommendations': 'Best Current Recommendations',
    'assistant.points': 'Points',
    'assistant.success': 'Success',
    'assistant.smartTradingTips': 'Smart Trading Tips',
    'assistant.tip1': 'Check risk analysis before any trade',
    'assistant.tip2': 'Use the recommended amount from the system',
    'assistant.tip3': 'Monitor confidence and strength of signals',
    'assistant.tip4': 'Follow only high-quality recommendations',
    'assistant.tip5': 'Keep a record of all your trades',
    'assistant.tip6': 'Don\'t trade more than 5% of capital daily',
    'assistant.warning': 'Remember: This is just an assistant. You are responsible for all trading decisions. Start with small amounts and follow risk management carefully.',
    
    // أزرار الثيم
    'theme.dark': 'Dark Mode',
    'theme.light': 'Light Mode',
    'theme.toggle': 'Toggle Theme',

    // صفحات الاشتراك
    'subscription.planTitle': 'Choose Your Perfect Plan',
    'subscription.subtitle': 'Join thousands of successful traders and get professional trading signals',
    'subscription.backToLogin': 'Back to Login',
    'subscription.monthly': 'Monthly Plan',
    'subscription.annual': 'Annual Plan',
    'subscription.threeyears': '3-Year Plan',
    'subscription.mostPopular': 'Most Popular',
    'subscription.save': 'Save',
    'subscription.month': 'month',
    'subscription.year': 'year',
    'subscription.years': 'years',
    'subscription.selectPlan': 'Select Plan',
    'subscription.features.realtime': 'Real-time signals',
    'subscription.features.technical': 'Technical analysis',
    'subscription.features.risk': 'Risk management',
    'subscription.features.support': '24/7 support',
    'subscription.features.priority': 'Priority support',
    'subscription.features.advanced': 'Advanced strategies',
    'subscription.features.api': 'API access',
    'subscription.features.premium': 'Premium features',
    'subscription.features.unlimited': 'Unlimited signals',
    'subscription.features.exclusive': 'Exclusive analysis',

    // صفحة معلومات المستخدم
    'userinfo.title': 'User Information',
    'userinfo.subtitle': 'Please enter your personal information to complete the subscription process',
    'userinfo.selectedPlan': 'Selected Plan',
    'userinfo.fullName': 'Full Name',
    'userinfo.email': 'Email Address',
    'userinfo.phone': 'Phone Number',
    'userinfo.country': 'Country',
    'userinfo.placeholder.fullName': 'Enter your full name',
    'userinfo.placeholder.email': 'Enter your email address',
    'userinfo.placeholder.phone': 'Enter your phone number',
    'userinfo.placeholder.country': 'Select your country',
    'userinfo.continue': 'Continue to Payment',
    'userinfo.back': 'Back',

    // صفحة الدفع
    'payment.loadingData': 'Loading data...',
    'payment.title': 'Complete Payment',
    'payment.subtitle': 'Choose your preferred payment method',
    'payment.orderSummary': 'Order Summary',
    'payment.plan': 'Plan',
    'payment.duration': 'Duration',
    'payment.total': 'Total',
    'payment.paymentMethod': 'Payment Method',
    'payment.paypal': 'PayPal',
    'payment.usdt': 'USDT (Tether)',
    'payment.card': 'Credit Card',
    'payment.paypalDesc': 'Pay securely with PayPal',
    'payment.usdtDesc': 'Pay with USDT cryptocurrency',
    'payment.cardDesc': 'Pay with credit or debit card',
    'payment.processing': 'Processing...',
    'payment.payNow': 'Pay Now',
    'payment.back': 'Back',
    'payment.loadingButtons': 'Loading payment buttons...',
    'payment.pleaseWait': 'Please wait a moment',
    'payment.paypalError': 'PayPal loading error',
    'payment.retry': 'Retry',
    'payment.payWithPaypal': 'Pay with PayPal Account',
    'payment.payWithCard': 'Pay with Credit Card',
    'payment.securePayment': 'Secure and encrypted payment via PayPal',
    'payment.payWithCrypto': 'Pay with Cryptocurrency (USDT)',
    'payment.hideCrypto': 'Hide Cryptocurrency Option',
    'payment.cryptoTitle': 'Pay with Cryptocurrency (USDT)',
    'payment.cryptoInstructions': 'Follow these steps to complete your payment successfully',
    'payment.paymentSteps': 'Payment Steps:',
    'payment.step1': 'Copy the USDT (TRC20) wallet address below',
    'payment.step2': 'Open your digital wallet (Binance, Trust Wallet, etc.)',
    'payment.step3': 'Select send USDT on',
    'payment.step4': 'Paste the wallet address and send the exact amount',
    'payment.step5': 'Take a screenshot of payment proof and upload it below',
    'payment.importantWarning': '⚠️ Important Warning:',
    'payment.warning1': 'Make sure to use',
    'payment.warning2': 'Sending USDT on another network (ERC20, BEP20) will result in loss of funds',
    'payment.warning3': 'Double-check the address before sending',
    'payment.walletAddress': 'USDT Address (TRC20):',
    'payment.copy': 'Copy',
    'payment.copied': 'Copied',
    'payment.amountRequired': 'Amount to Send',
    'payment.uploadProof': 'Upload Payment Proof:',
    'payment.uploadImage': 'Click to upload image',
    'payment.imageUploaded': 'Image uploaded',
    'payment.submitProof': 'Submit Payment Proof',
    'payment.submitting': 'Submitting...',
    'payment.uploadSuccess': 'Image uploaded successfully!',
    'payment.uploadSuccessDesc': 'You can now confirm payment or change the image if you want',
    'payment.changeImage': 'Change Image',
    'payment.processingPayment': 'Processing...',
    'payment.processingDesc': 'Saving payment data, you will be redirected to review page...',
    'payment.backButton': 'Back',
    'payment.changePlan': 'Change Plan',
    'payment.maxSize': 'Max',
    'payment.payWithCardButton': 'Pay with Card',

    // صفحة نجاح الدفع
    'paymentSuccess.title': 'Payment Successful!',
    'paymentSuccess.subtitle': 'Thank you for subscribing to the Professional Trading Bot',
    'paymentSuccess.orderNumber': 'Order Number',
    'paymentSuccess.plan': 'Plan',
    'paymentSuccess.validUntil': 'Valid Until',
    'paymentSuccess.nextSteps': 'Next Steps',
    'paymentSuccess.step1': 'Your account will be activated within a few minutes',
    'paymentSuccess.step2': 'You will receive an email with subscription details',
    'paymentSuccess.step3': 'You can now access all premium bot features',
    'paymentSuccess.loginNow': 'Login Now',

    // Terms and Conditions Page
    'terms.title': 'Terms and Conditions',
    'terms.lastUpdated': 'Last Updated:',
    'terms.acceptance.title': 'Terms Acceptance',
    'terms.acceptance.content': 'By using the platform, you agree to these terms. We reserve the right to modify without prior notice.',
    'terms.services.title': 'Services',
    'terms.services.content': 'We provide educational trading signals based on AI. Signals are suggestions, not binding advice.',
    'terms.risks.title': 'Risks',
    'terms.risks.content': 'Trading is high-risk and may result in capital loss. Do not invest money you cannot afford to lose.',
    'terms.responsibilities.title': 'Responsibilities',
    'terms.responsibilities.content': 'You are responsible for your investment decisions. We are not liable for potential losses.',
    'terms.agreement': 'By using this platform, you acknowledge reading, understanding, and agreeing to all terms.',
    'terms.acceptButton': 'Accept Terms',
    'terms.backButton': 'Back',
    'terms.agreementDeclaration': 'Agreement Declaration',

    // Contact Page
    'contact.title': 'Contact Us',
    'contact.description': 'We\'re here to help! Contact us through any of the following methods',
    'contact.backButton': 'Back',
    'contact.formTitle': 'Send us a message',
    'contact.nameLabel': 'Name',
    'contact.emailLabel': 'Email',
    'contact.subjectLabel': 'Subject',
    'contact.messageLabel': 'Message',
    'contact.sendButton': 'Send Message',
    'contact.sending': 'Sending...',
    'contact.liveChatTitle': 'Live Chat',
    'contact.liveChatDesc': 'Chat with our support team directly',
    'contact.liveChatButton': 'Start Chat',
    'contact.emailTitle': 'Email',
    'contact.emailDesc': 'Send us an email',
    'contact.emailButton': 'Send Email',
    'contact.contactMethods': 'Contact Methods',
    'contact.chatUnavailable': 'Live chat service is currently unavailable. Please use the form below or contact us via email.',
    'contact.messageSent': 'Your message has been sent successfully! We will contact you soon.',

    // About Page
    'about.title': 'About Us',
    'about.description': 'We are a team of professionals specialized in financial technology',
    'about.backButton': 'Back',
    'about.vision.title': 'Our Vision',
    'about.vision.content': 'To be leaders in smart trading technologies and enable traders to achieve their financial goals.',
    'about.mission.title': 'Our Mission',
    'about.mission.content': 'Develop smart and innovative trading solutions that help traders make informed decisions and achieve better results.',
    'about.whyDifferent': 'Why Are We Different?',
    'about.whyDifferentDesc': 'We offer unique features that make us the optimal choice for traders',
    'about.achievements': 'Our Achievements in Numbers',
    'about.coreValues': 'Our Core Values',
    
    // Features
    'about.features.analysis.title': 'Advanced Analysis',
    'about.features.analysis.desc': 'We use the latest AI technologies to analyze financial markets and provide accurate signals.',
    'about.features.security.title': 'High Security',
    'about.features.security.desc': 'We ensure the protection of your data and privacy through the highest security and encryption standards.',
    'about.features.speed.title': 'Ultra Speed',
    'about.features.speed.desc': 'Instant signals and live updates to ensure you don\'t miss any profitable trading opportunity.',
    'about.features.coverage.title': 'Comprehensive Coverage',
    'about.features.coverage.desc': 'We cover all major markets from forex and cryptocurrencies to stocks and commodities.',
    
    // Values
    'about.values.transparency.title': 'Transparency',
    'about.values.transparency.desc': 'We believe in complete transparency in all our operations and signal results.',
    'about.values.reliability.title': 'Reliability',
    'about.values.reliability.desc': 'We strive to provide reliable and stable service that can be depended upon.',
    'about.values.excellence.title': 'Excellence',
    'about.values.excellence.desc': 'We aim for excellence in everything we offer in terms of services and technical solutions.',
    
    // Statistics
    'about.stats.activeTraders': 'Active Traders',
    'about.stats.successRate': 'Signal Success Rate',
    'about.stats.support': 'Technical Support',
    'about.stats.userRating': 'User Rating',
    
    // Footer
    'footer.telegram': 'Telegram',
    'footer.discord': 'Discord',
    'footer.email': 'Email',
    'footer.terms': 'Terms',
    'footer.contact': 'Contact',
    'footer.about': 'About',
    'footer.logoAlt': 'Professional Trading Bot',
    'footer.copyright': 'Professional Trading Bot. All rights reserved.',
    
    // Additional texts for payment success page
    'paymentSuccess.needHelp': 'Need help?',
    'paymentSuccess.contactUs': 'Contact us',
  },
  fr: {
    // Navigation
    'nav.signals': 'Signaux',
    'nav.recommendations': 'Recommandations',
    'nav.precise': 'Options',
    'nav.assistant': 'Assistant',
    'nav.admin': 'Admin',
    'nav.subscription': 'Abonnement',
    'nav.signals.desc': 'Signaux de trading en temps réel',
    'nav.recommendations.desc': 'Recommandations alimentées par IA',
    'nav.precise.desc': 'Recommandations précises avec temps et durée pour options binaires',
    'nav.assistant.desc': 'Assistant intelligent pour décisions',
    'nav.admin.desc': 'Gestion des utilisateurs et du système',
    'nav.subscription.desc': 'Gérez votre abonnement et suivez l\'état des paiements',
    
    // Header
    'header.settings': 'Paramètres',
    'header.logout': 'Déconnexion',
    'header.profile': 'Profil',
    'header.language': 'Langue',
    
    // Settings Page
    'settings.title': 'Paramètres',
    'settings.admin': 'Administrateur',
    'settings.trader': 'Trader',
    'settings.changePassword': 'Changer le mot de passe',
    'settings.currentPassword': 'Mot de passe actuel',
    'settings.newPassword': 'Nouveau mot de passe',
    'settings.confirmPassword': 'Confirmer le mot de passe',
    'settings.enterCurrentPassword': 'Entrez le mot de passe actuel',
    'settings.enterNewPassword': 'Entrez le nouveau mot de passe',
    'settings.reEnterPassword': 'Ré-entrez le mot de passe',
    'settings.saving': 'Enregistrement...',
    'settings.saveNewPassword': 'Enregistrer le nouveau mot de passe',
    'settings.passwordMismatch': 'Les mots de passe ne correspondent pas',
    'settings.passwordTooShort': 'Le mot de passe doit contenir au moins 6 caractères',
    'settings.passwordChangeSuccess': 'Mot de passe changé avec succès',
    'settings.incorrectPassword': 'Le mot de passe actuel est incorrect',
    'settings.passwordChangeError': 'Erreur lors du changement de mot de passe',
    'header.theme': 'Thème',
    'header.darkMode': 'Mode Sombre',
    'header.lightMode': 'Mode Clair',
    'header.startBot': 'Démarrer Bot',
    'header.stopBot': 'Arrêter Bot',
    'header.dataManagement': 'Gestion des Données',
    'header.realData': 'Données Réelles',
    'header.apiStatus': 'État des APIs',
    
    // User Roles
    'user.admin': 'Administrateur Système',
    'user.trader': 'Trader',
    
    // App names
    'app.shortName': 'BooTrading',
    'app.fullName': 'Bot de Trading Professionnel',
    
    // Assets
    'assets.title': 'Actifs Disponibles',
    'assets.all': 'Tout',
    'assets.regular': 'Régulier',
    'assets.otc': 'OTC',
    'assets.major': 'Majeurs',
    'assets.crypto': 'Crypto',
    'assets.commodities': 'Matières Premières',
    'assets.noAssets': 'Aucun actif disponible',
    'assets.noResults': 'Aucun résultat de recherche',
    'assets.clearFilters': 'Effacer les Filtres',
    'assets.searchPlaceholder': 'Rechercher...',
    
    // IQ Option Status
    'iqoption.title': 'IQ Option',
    'iqoption.connected': 'Connecté',
    'iqoption.disconnected': 'Déconnecté',
    'iqoption.livePrices': 'Prix en Direct',
    'iqoption.lastUpdate': 'Dernière mise à jour',
    'iqoption.connecting': 'Tentative de connexion à IQ Option...',
    'iqoption.source': 'Source',
    'iqoption.realData': 'Données réelles IQ Option',
    'iqoption.simulation': 'Simulation',
    'iqoption.connectionError': 'Erreur de connexion',
    'iqoption.noResults': 'Aucun résultat',
    'iqoption.searchPlaceholder': 'Rechercher...',
    'iqoption.pairs': 'paires',
    
    // Sections
    'sections.signals.title': 'Signaux en Direct',
    'sections.signals.desc': 'Signaux de trading en temps réel avec analyse technique avancée',
    'sections.recommendations.title': 'Recommandations Intelligentes',
    'sections.recommendations.desc': 'Recommandations alimentées par IA et analyse de données',
    'sections.assistant.title': 'Assistant de Trading Intelligent',
    'sections.assistant.desc': 'Assistant intelligent pour les décisions de trading',
    
    // Languages
    'lang.arabic': 'العربية',
    'lang.english': 'English',
    'lang.french': 'Français',
    
    // Login
    'login.title': 'Connexion',
    'login.subtitle': 'Bot de Trading Professionnel',
    'login.username': 'Nom d\'utilisateur ou Email',
    'login.password': 'Mot de passe',
    'login.button': 'Se connecter',
    'login.loading': 'Connexion en cours...',
    'login.noAccount': 'Vous n\'avez pas de compte?',
    'login.subscribe': 'S\'abonner maintenant',
    'login.successRate': 'Taux de Réussite',
    'login.marketMonitoring': 'Surveillance du Marché',
    'login.winRate': '95%+ Taux de Réussite',
    'login.newUser': 'Nouvel utilisateur?',
    'login.createAccount': 'Créer un Nouveau Compte',
    'login.forgotPassword': 'Mot de passe oublié?',
    
    // Password Reset
    'passwordReset.title': 'Récupération du Mot de Passe',
    'passwordReset.emailStep': 'Entrez votre email enregistré',
    'passwordReset.codeStep': 'Entrez le code envoyé à votre email',
    'passwordReset.passwordStep': 'Entrez votre nouveau mot de passe',
    'passwordReset.successStep': 'Mot de passe récupéré avec succès',
    'passwordReset.emailLabel': 'Adresse Email',
    'passwordReset.emailPlaceholder': 'Entrez votre email',
    'passwordReset.codeLabel': 'Code de Vérification',
    'passwordReset.codeHint': 'Un code à 6 chiffres a été envoyé à votre email',
    'passwordReset.newPasswordLabel': 'Nouveau Mot de Passe',
    'passwordReset.newPasswordPlaceholder': 'Entrez le nouveau mot de passe',
    'passwordReset.confirmPasswordLabel': 'Confirmer le Mot de Passe',
    'passwordReset.confirmPasswordPlaceholder': 'Re-entrez le mot de passe',
    'passwordReset.sendCode': 'Envoyer le Code',
    'passwordReset.sending': 'Envoi en cours...',
    'passwordReset.verify': 'Vérifier',
    'passwordReset.verifying': 'Vérification...',
    'passwordReset.resetPassword': 'Réinitialiser le Mot de Passe',
    'passwordReset.resetting': 'Réinitialisation...',
    'passwordReset.successTitle': 'Succès!',
    'passwordReset.successMessage': 'Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.',
    'passwordReset.backToLogin': 'Retour à la Connexion',
    'passwordReset.resendCode': 'Renvoyer le Code',
    'passwordReset.showPassword': 'Afficher le Mot de Passe',
    'passwordReset.hidePassword': 'Masquer le Mot de Passe',
    
    // Register
    'register.title': 'Créer un Nouveau Compte',
    'register.subtitle': 'Rejoignez la Plateforme de Trading Intelligente',
    'register.email': 'Adresse Email',
    'register.username': 'Nom d\'utilisateur',
    'register.fullName': 'Nom Complet',
    'register.country': 'Sélectionnez un pays ou recherchez...',
    'register.password': 'Mot de Passe',
    'register.confirmPassword': 'Confirmer le Mot de Passe',
    'register.createAccount': 'Créer un Compte',
    'register.creating': 'Création du compte...',
    'register.usernameAvailable': 'Nom d\'utilisateur disponible',
    'register.usernameTaken': 'Nom d\'utilisateur déjà pris',
    'register.searchResults': 'résultat',
    'register.noResults': 'Aucun résultat correspondant',
    'register.successRate': 'Taux de Réussite',
    'register.marketMonitoring': 'Surveillance du Marché',
    'register.hasAccount': 'Vous avez déjà un compte?',
    'register.loginButton': 'Se connecter',
    'register.termsPrefix': 'J\'accepte les',
    'register.termsLink': 'Conditions Générales',
    
    // Register validation errors
    'register.error.emailRequired': 'L\'email est requis',
    'register.error.emailInvalid': 'Adresse email invalide',
    'register.error.usernameRequired': 'Le nom d\'utilisateur est requis',
    'register.error.usernameLength': 'Le nom d\'utilisateur doit contenir au moins 3 caractères',
    'register.error.usernameFormat': 'Le nom d\'utilisateur ne doit contenir que des lettres et des chiffres',
    'register.error.usernameTaken': 'Le nom d\'utilisateur est déjà pris',
    'register.error.usernameChecking': 'Vérification de la disponibilité...',
    'register.error.usernameWait': 'Veuillez attendre la vérification de disponibilité',
    'register.error.fullNameRequired': 'Le nom complet est requis',
    'register.error.fullNameLength': 'Le nom complet doit contenir au moins 2 caractères',
    'register.error.countryRequired': 'Le pays est requis',
    'register.error.passwordRequired': 'Le mot de passe est requis',
    'register.error.passwordLength': 'Le mot de passe doit contenir au moins 8 caractères',
    'register.error.passwordFormat': 'Le mot de passe doit contenir une majuscule, une minuscule et un chiffre',
    'register.error.confirmPasswordRequired': 'La confirmation du mot de passe est requise',
    'register.error.passwordMismatch': 'Les mots de passe ne correspondent pas',
    
    // Login validation errors
    'login.error.usernameRequired': 'Le nom d\'utilisateur ou l\'email est requis',
    'login.error.passwordRequired': 'Le mot de passe est requis',
    
    // Install App
    'install.title': 'Installer l\'App',
    'install.button': 'Installer',
    'install.buttonFull': 'Installer l\'App',
    'install.description': 'Ajoutez le Bot de Trading à votre téléphone',
    'install.subtitle': 'Accès rapide et fonctionnement hors ligne',
    'install.benefits.offline': 'Fonctionne hors ligne',
    'install.benefits.homescreen': 'Accès rapide depuis l\'écran d\'accueil',
    'install.benefits.notifications': 'Notifications instantanées',
    'install.benefits.native': 'Expérience d\'application native',
    'install.later': 'Plus tard',
    'install.installed': 'App Installée',
    'install.tip': '💡 Astuce: Vous pouvez payer même sans compte PayPal en utilisant directement votre carte de crédit',

    // Common
    'common.loading': 'Chargement...',
    'common.error': 'Une erreur s\'est produite',
    'common.success': 'Succès',
    'common.cancel': 'Annuler',
    'common.save': 'Enregistrer',
    'common.close': 'Fermer',
    'common.yes': 'Oui',
    'common.no': 'Non',
    'common.confirm': 'Confirmer',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.add': 'Ajouter',
    'common.search': 'Rechercher',
    'common.filter': 'Filtrer',
    'common.refresh': 'Actualiser',
    'common.back': 'Retour',
    'common.backToDashboard': 'Retour au tableau de bord',
    'common.logout': 'Se déconnecter',
    'common.next': 'Suivant',
    'common.previous': 'Précédent',
    'common.submit': 'Soumettre',
    'common.reset': 'Réinitialiser',
    'common.clear': 'Effacer',
    'common.select': 'Sélectionner',
    'common.all': 'Tout',
    'common.none': 'Aucun',
    'common.active': 'Actif',
    'common.inactive': 'Inactif',
    'common.enabled': 'Activé',
    'common.disabled': 'Désactivé',
    'common.online': 'En ligne',
    'common.offline': 'Hors ligne',
    'common.connected': 'Connecté',
    'common.disconnected': 'Déconnecté',
    'common.start': 'Démarrer',
    'common.stop': 'Arrêter',
    
    // Binary Options Settings
    'binarySettings.title': 'Paramètres des Options Binaires',
    'binarySettings.signalsSettings': 'Paramètres des Signaux',
    'binarySettings.minConfidence': 'Confiance Minimale',
    'binarySettings.maxSignalsPerHour': 'Max Signaux Par Heure',
    'binarySettings.preferredRiskLevel': 'Niveau de Risque Préféré',
    'binarySettings.riskLow': 'Faible',
    'binarySettings.riskMedium': 'Moyen',
    'binarySettings.riskHigh': 'Élevé',
    'binarySettings.preferredTimeframes': 'Périodes Préférées',
    'binarySettings.alertSettings': 'Paramètres d\'Alerte',
    'binarySettings.soundAlerts': 'Alertes Sonores',
    'binarySettings.browserNotifications': 'Notifications du Navigateur',
    'binarySettings.signalAlerts': 'Alertes de Signal',
    'binarySettings.tradeResults': 'Résultats des Trades',
    'binarySettings.connectionStatus': 'État de Connexion',
    'binarySettings.testAlert': 'Tester l\'Alerte',
    'binarySettings.technicalAnalysisSettings': 'Paramètres d\'Analyse Technique',
    'binarySettings.rsiPeriod': 'Période RSI',
    'binarySettings.bollingerPeriod': 'Période Bollinger',
    'binarySettings.macdFast': 'MACD Rapide',
    'binarySettings.macdSlow': 'MACD Lent',
    'binarySettings.macdSignal': 'Signal MACD',
    'binarySettings.riskManagement': 'Gestion des Risques',
    'binarySettings.maxRiskPerTrade': 'Risque Max Par Trade',
    'binarySettings.dailyLossLimit': 'Limite de Perte Quotidienne',
    'binarySettings.consecutiveLossLimit': 'Limite de Pertes Consécutives',
    'binarySettings.filterWeakSignals': 'Filtrer les Signaux Faibles',
    'binarySettings.requireMultipleConfirmations': 'Exiger Plusieurs Confirmations',
    'binarySettings.avoidHighVolatility': 'Éviter Haute Volatilité',
    'binarySettings.respectMarketHours': 'Respecter les Heures de Marché',
    'binarySettings.resetToDefaults': 'Réinitialiser par Défaut',
    'binarySettings.saveSettings': 'Enregistrer les Paramètres',
    
    // Subscription and Payments Page
    'subscriptionPage.title': 'Abonnement et Paiements',
    'subscriptionPage.back': 'Retour',
    'subscriptionPage.loading': 'Chargement des données...',
    'subscriptionPage.subscriptionTab': 'Abonnement',
    'subscriptionPage.paymentsTab': 'Paiements',
    'subscriptionPage.subscriptionStatus': 'État de l\'Abonnement',
    'subscriptionPage.active': 'Actif',
    'subscriptionPage.inactive': 'Inactif',
    'subscriptionPage.timeRemaining': 'Temps Restant',
    'subscriptionPage.days': 'Jours',
    'subscriptionPage.hours': 'Heures',
    'subscriptionPage.minutes': 'Minutes',
    'subscriptionPage.seconds': 'Secondes',
    'subscriptionPage.startDate': 'Date de Début',
    'subscriptionPage.endDate': 'Date de Fin',
    'subscriptionPage.price': 'Prix',
    'subscriptionPage.contactSupport': 'Contacter le Support',
    'subscriptionPage.renewSubscription': 'Renouveler l\'Abonnement',
    'subscriptionPage.renewNow': 'Renouveler Maintenant',
    'subscriptionPage.planFeatures': 'Caractéristiques du Plan',
    'subscriptionPage.userInfo': 'Informations Utilisateur',
    'subscriptionPage.admin': 'Administrateur',
    'subscriptionPage.trader': 'Trader',
    'subscriptionPage.memberSince': 'Membre Depuis',
    'subscriptionPage.paymentHistory': 'Historique des Paiements',
    'subscriptionPage.noPayments': 'Aucun paiement trouvé',
    'subscriptionPage.notSpecified': 'Non spécifié',
    'subscriptionPage.reference': 'Référence',
    'subscriptionPage.paymentProof': 'Preuve de Paiement',
    'subscriptionPage.status.completed': 'Complété',
    'subscriptionPage.status.pending': 'En Attente',
    'subscriptionPage.status.reviewing': 'En Révision',
    'subscriptionPage.status.failed': 'Échoué',
    'subscriptionPage.status.refunded': 'Remboursé',
    'subscriptionPage.status.cancelled': 'Annulé',
    
    // Subscription Widget
    'subscriptionWidget.expired': 'Expiré',
    'subscriptionWidget.expiringSoon': 'Expire Bientôt',
    'subscriptionWidget.active': 'Actif',
    'subscriptionWidget.subscription': 'Abonnement',
    'subscriptionWidget.details': 'Détails',
    'subscriptionWidget.planType': 'Type de Plan',
    'subscriptionWidget.unspecifiedPlan': 'Plan Non Spécifié',
    'subscriptionWidget.expiresOn': 'Expire Le',
    'subscriptionWidget.viewDetails': 'Voir les Détails',
    'subscriptionWidget.renewNow': 'Renouveler Maintenant',
    
    // Subscription Banner
    'subscriptionBanner.expiredTitle': 'Abonnement Expiré',
    'subscriptionBanner.expiredMessage': 'Votre abonnement a expiré. Veuillez renouveler pour continuer.',
    'subscriptionBanner.expiringSoonTitle': 'Abonnement Expire Bientôt',
    'subscriptionBanner.expiringSoonMessage': 'Votre abonnement expire dans',
    'subscriptionBanner.day': 'jour',
    'subscriptionBanner.days': 'jours',
    'subscriptionBanner.remaining': 'restant',
    'subscriptionBanner.plan': 'Plan',
    'subscriptionBanner.price': 'Prix',
    
    // Subscription Blocked Page
    'subscriptionBlocked.warning': 'Avertissement d\'Abonnement',
    'subscriptionBlocked.expiredMessage': 'Votre abonnement a expiré. Veuillez renouveler pour continuer à utiliser le bot.',
    'subscriptionBlocked.expiringSoonMessage': 'Votre abonnement est sur le point d\'expirer. Veuillez renouveler pour éviter l\'interruption du service.',
    'subscriptionBlocked.status': 'État de l\'Abonnement',
    'subscriptionBlocked.timeRemaining': 'Temps Restant',
    'subscriptionBlocked.renewNow': 'Renouveler l\'Abonnement Maintenant',
    'subscriptionBlocked.refreshStatus': 'Actualiser l\'État',
    'subscriptionBlocked.logout': 'Déconnexion',
    'subscriptionBlocked.helpMessage': 'Si vous rencontrez des problèmes avec le renouvellement, veuillez contacter le support technique.',
    'subscriptionBlocked.lastUpdate': 'Dernière Mise à Jour',
    
    // Payment Status Page
    'paymentStatus.title': 'État des Paiements',
    'paymentStatus.subtitle': 'Suivez vos paiements et abonnements',
    'paymentStatus.lastUpdate': 'Dernière Mise à Jour',
    'paymentStatus.refreshing': 'Actualisation...',
    'paymentStatus.refreshNow': 'Actualiser Maintenant',
    'paymentStatus.reviewingTitle': 'Paiements en Révision',
    'paymentStatus.reviewingMessage': 'Vous avez des paiements en révision. Le statut sera mis à jour automatiquement après approbation de l\'administrateur.',
    'paymentStatus.checkNow': 'Vérifier Maintenant',
    'paymentStatus.noPayments': 'Aucun Paiement',
    'paymentStatus.noPaymentsMessage': 'Vous n\'avez effectué aucun paiement pour le moment',
    'paymentStatus.unspecifiedPlan': 'Plan Non Spécifié',
    'paymentStatus.proofImage': 'Image de Preuve de Paiement',
    'paymentStatus.amount': 'Montant',
    'paymentStatus.plan': 'Plan',
    'paymentStatus.user': 'Utilisateur',
    'paymentStatus.email': 'Email',
    'paymentStatus.paymentMethod': 'Méthode de Paiement',
    'paymentStatus.submissionDate': 'Date de Soumission',
    'paymentStatus.reviewStatus': 'État de Révision',
    'paymentStatus.pendingReview': 'En Attente de Révision',
    'paymentStatus.accepted': 'Paiement Accepté',
    'paymentStatus.rejected': 'Paiement Rejeté',
    'paymentStatus.importantInfo': 'Informations Importantes',
    'paymentStatus.cryptocurrency': 'Cryptomonnaie',
    
    // Payment Review Page
    'paymentReview.paymentDetails': 'Détails du Paiement',
    'paymentReview.checking': 'Vérification...',
    'paymentReview.updateStatus': 'Mettre à Jour le Statut',
    'paymentReview.pendingMessage': 'L\'image de preuve de paiement a été reçue et est en cours de révision par l\'administrateur. Le processus de révision prend généralement 2 à 24 heures.',
    'paymentReview.approvedMessage': '🎉 Félicitations! Votre paiement a été accepté et votre compte a été activé avec succès. Vous pouvez maintenant vous connecter et profiter de toutes les fonctionnalités du plan.',
    'paymentReview.rejectedMessage': 'Votre paiement n\'a pas été accepté. Veuillez consulter les notes de l\'administrateur ci-dessous et nous contacter si vous avez des questions.',
    'paymentReview.adminNote': 'Note de l\'Administrateur',
    'paymentReview.rejectionReason': 'Raison du Rejet',
    'paymentReview.info1': 'Le statut est automatiquement mis à jour toutes les 30 secondes',
    'paymentReview.info2': 'Si approuvé, vous pouvez vous connecter immédiatement',
    'paymentReview.info3': 'Si rejeté, vous pouvez réessayer avec un nouveau paiement',
    'paymentReview.info4': 'Pour toute question, contactez-nous par email',
    'paymentReview.lastUpdate': 'Dernière Mise à Jour',
    'paymentReview.reviewingMessage': 'Votre paiement est en cours de révision par l\'administrateur',
    'paymentReview.approvedTitle': 'Votre compte a été activé avec succès',
    'paymentReview.rejectedTitle': 'Votre paiement n\'a pas été accepté',
    'paymentReview.title': 'Révision du Paiement',
    'paymentReview.acceptedTitle': 'Paiement Accepté!',
    'paymentReview.canLoginNow': 'Vous pouvez maintenant vous connecter et accéder à toutes les fonctionnalités!',
    'paymentReview.loginNow': 'Se Connecter Maintenant',
    'paymentReview.backToLogin': 'Retour à la Connexion',
    'paymentReview.tryAgain': 'Réessayer',
    
    // Trading
    'trading.signals': 'Signaux',
    'trading.signal': 'Signal',
    'trading.buy': 'Acheter',
    'trading.sell': 'Vendre',
    'trading.call': 'Call',
    'trading.put': 'Put',
    'trading.price': 'Prix',
    'trading.amount': 'Montant',
    'trading.profit': 'Profit',
    'trading.loss': 'Perte',
    'trading.balance': 'Solde',
    'trading.asset': 'Actif',
    'trading.assets': 'Actifs',
    'trading.expiry': 'Expiration',
    'trading.duration': 'Durée',
    'trading.direction': 'Direction',
    'trading.strength': 'Force',
    'trading.confidence': 'Confiance',
    'trading.confidenceShort': 'Confiance',
    'trading.recommendation': 'Recommandation',
    'trading.analysis': 'Analyse',
    'trading.strategy': 'Stratégie',
    'trading.performance': 'Performance',
    'trading.history': 'Historique',
    'trading.statistics': 'Statistiques',
    'trading.winRate': 'Taux de Réussite',
    'trading.winRateShort': 'Taux de Réussite',
    'trading.totalTrades': 'Total des Trades',
    'trading.profitLoss': 'Profit & Perte',
    'trading.riskLevel': 'Niveau de Risque',
    'trading.lowRisk': 'Risque Faible',
    'trading.lowRiskShort': 'Faible',
    'trading.mediumRisk': 'Risque Moyen',
    'trading.mediumRiskShort': 'Moyen',
    'trading.highRisk': 'Risque Élevé',
    'trading.highRiskShort': 'Élevé',
    
    // Bot Status
    'bot.status': 'Statut du Bot',
    'bot.running': 'En Marche',
    'bot.stopped': 'Arrêté',
    'bot.starting': 'Démarrage',
    'bot.stopping': 'Arrêt',
    'bot.error': 'Erreur Bot',
    'bot.connected': 'Connecté',
    'bot.disconnected': 'Déconnecté',
    'bot.autoTrading': 'Trading Auto',
    'bot.manualTrading': 'Trading Manuel',
    
    // Admin Panel
    'admin.title': 'Panneau d\'Administration',
    'admin.users': 'Utilisateurs',
    'admin.user': 'Utilisateur',
    'admin.addUser': 'Ajouter Utilisateur',
    'admin.editUser': 'Modifier Utilisateur',
    'admin.deleteUser': 'Supprimer Utilisateur',
    'admin.username': 'Nom d\'utilisateur',
    'admin.email': 'Email',
    'admin.password': 'Mot de passe',
    'admin.role': 'Rôle',
    'admin.status': 'Statut',
    'admin.lastLogin': 'Dernière Connexion',
    'admin.createdAt': 'Créé le',
    'admin.actions': 'Actions',
    'admin.totalUsers': 'Total Utilisateurs',
    'admin.activeUsers': 'Utilisateurs Actifs',
    'admin.adminUsers': 'Administrateurs',
    'admin.traderUsers': 'Traders',
    'admin.confirmDelete': 'Êtes-vous sûr de vouloir supprimer cet utilisateur?',
    'admin.userDeleted': 'Utilisateur supprimé avec succès',
    'admin.userUpdated': 'Utilisateur mis à jour avec succès',
    'admin.userCreated': 'Utilisateur créé avec succès',
    
    // Data Management
    'data.title': 'Gestion des Données',
    'data.realTime': 'Données Réelles',
    'data.simulated': 'Données Simulées',
    'data.source': 'Source de Données',
    'data.status': 'Statut des Données',
    'data.lastUpdate': 'Dernière Mise à Jour',
    'data.refresh': 'Actualiser Données',
    'data.connection': 'Connexion',
    'data.quality': 'Qualité des Données',
    'data.excellent': 'Excellente',
    'data.good': 'Bonne',
    'data.poor': 'Faible',
    'data.failed': 'Échec',
    'data.manageSources': 'Gestion des sources de données',
    'data.usingRealDesc': 'Utilisation d’APIs réelles pour les données en direct',
    'data.usingSimDesc': 'Utilisation de données simulées pour tests et développement',
    'data.apiStatusTitle': 'Statut des APIs',
    'data.supportedApisInfo': 'Informations sur les APIs prises en charge',
    'data.requestsPerMinute': 'requêtes/min',
    'data.api.twelvedata.desc': 'Forex & Actions - 8 requêtes/min',
    'data.api.binance.desc': 'Cryptomonnaies - WebSocket en direct',
    'data.api.metal.desc': 'Métaux précieux - 10 requêtes/min',
    'data.api.alphavantage.desc': 'Données financières - 5 requêtes/min',
    'data.setupInstructions.title': '📝 Instructions de configuration :',
    'data.setup.step1': '1. Copier .env.example vers .env',
    'data.setup.step2': '2. Obtenir les clés API des services listés',
    'data.setup.step3': '3. Ajouter les clés dans le fichier .env',
    'data.setup.step4': '4. Redémarrer l’application pour activer les données réelles',
    // Real data & logs
    'data.realDataAndLogs': 'Données Réelles & Journaux',
    'data.realEnabled': 'Données réelles activées',
    'data.simEnabled': 'Données simulées activées',
    'data.enableReal': 'Activer les Données Réelles',
    'data.disableReal': 'Désactiver les Données Réelles',
    'data.testConnection': 'Tester la Connexion',
    'data.testing': 'Test en cours...'
    ,'data.logs': 'Journaux',
    'data.entries': 'entrées',
    'data.liveDataLog': 'Journal des Données en Direct',
    'data.clearLogs': 'Effacer le journal',
    'data.noLogsYet': 'Aucun journal pour le moment. Essayez d’activer les données réelles ou de tester la connexion.',
    'data.toggleLogs': 'Afficher/Masquer les journaux',
    'data.simulatedSafeNote': 'Les données simulées sont sûres et idéales pour apprendre et tester sans risques.',
    
    // Notifications
    'notification.newSignal': 'Nouveau Signal',
    'notification.tradeExecuted': 'Trade Exécuté',
    'notification.profitMade': 'Profit Réalisé',
    'notification.lossIncurred': 'Perte Subie',
    'notification.botStarted': 'Bot Démarré',
    'notification.botStopped': 'Bot Arrêté',
    'notification.connectionLost': 'Connexion Perdue',
    'notification.connectionRestored': 'Connexion Rétablie',
    
    // Binary Signals
    'signals.title': 'Signaux en Direct',
    'signals.panelTitle': 'Signaux en Direct',
    'signals.noSignalsPanel': 'Aucun signal actuellement',
    'signals.noSignalsDesc': 'Les signaux apparaîtront lorsque le bot fonctionnera',
    'signals.buy': 'Acheter',
    'signals.sell': 'Vendre',
    'signals.price': 'Prix',
    'signals.live': 'Direct',
    'signals.allTimeframes': 'Toutes Périodes',
    'signals.minute': 'minute',
    'signals.minutes': 'minutes',
    'signals.confidence': 'Confiance',
    'signals.todaySignals': 'Signaux du Jour',
    'signals.avgConfidence': 'Confiance Moy.',
    'signals.lowRisk': 'Risque Faible',
    'signals.trades5min': 'Trades 5min',
    'signals.noSignals': 'Aucun signal ne correspond aux critères spécifiés',
    'signals.searching': 'Recherche d\'opportunités de trading...',
    'signals.direction': 'Direction',
    'signals.entryPrice': 'Prix d\'Entrée',
    'signals.duration': 'Durée',
    'signals.risk': 'Risque',
    'signals.riskShort': 'Risque',
    'signals.winRate': 'Taux de Réussite',
    'signals.timeRemaining': 'Temps Restant',
    'signals.technicalAnalysis': 'Analyse Technique',
    'signals.precise': 'Précis',
    'signals.trend': 'Tendance',
    'signals.bullish': 'Haussier',
    'signals.bearish': 'Baissier',
    'signals.sideways': 'Latéral',
    'signals.oversold': 'Survente',
    'signals.overbought': 'Surachat',
    'signals.crossover': 'Croisement',
    'signals.support': 'Support',
    'signals.resistance': 'Résistance',
    'signals.strong': 'Fort',
    'signals.bollinger': 'Bollinger',
    'signals.lower': 'Inférieur',
    'signals.upper': 'Supérieur',
    'signals.momentum': 'Momentum',
    'signals.positive': 'Positif',
    'signals.negative': 'Négatif',
    'signals.stochastic': 'Stochastique',
    'signals.volume': 'Volume',
    'signals.increasing': 'Croissant',
    'signals.decreasing': 'Décroissant',
    'signals.reason': 'Raison',
    'signals.executeBuy': 'Exécuter Achat',
    'signals.executeSell': 'Exécuter Vente',
    'signals.warning': 'Attention: Le trading d\'options binaires implique des risques élevés. Utilisez ces signaux comme référence uniquement et non comme conseil d\'investissement.',
    'signals.startBot': 'Démarrez le bot pour commencer à générer des signaux',
    'signals.settings': 'Paramètres Options Binaires',
    'signals.clearAll': 'Tout effacer',
    'signals.noneNow': 'Aucun signal pour le moment',
    'signals.willShowOnStart': 'Les signaux apparaîtront une fois le bot démarré',
    'signals.payout': 'Rendement',
    'signals.indicators': 'Indicateurs Techniques',
    'signals.reasonsTitle': 'Raisons du Signal',
    'signals.moreReasons': 'autres raisons',
    'signals.execute': 'Exécuter',
    'signals.executeTrade': 'Exécuter le trade',
    'signals.details': 'Détails',
    'signals.autoExecute': '✓ S\'exécutera automatiquement',
    'signals.enterIn': 'Entrée dans',
    
    // Directives / General Status
    'directives.noAssets': 'Aucun actif disponible pour le moment',
    'directives.loadingAdmin': 'Chargement du panneau d’administration...',
    'directives.startBotAssistant': 'Démarrez le bot pour utiliser l’assistant',
    'directives.startBotRecommendations': 'Démarrez le bot pour afficher les recommandations intelligentes',
    'directives.startBotRisk': 'Démarrez le bot pour afficher la gestion des risques',
    'directives.startBotSignals': 'Démarrez le bot pour afficher les signaux en direct',

    // Common extras
    'common.now': 'Maintenant',
    'common.secondsShort': 's',

    // Additional Admin keys (placeholders, filters, table labels)
    'admin.desc': 'Gestion complète des utilisateurs et du système',
    'admin.badge.adminFull': 'Admin Système',
    'admin.badge.adminShort': 'Admin',
    'admin.stats.totalShort': 'Total',
    'admin.stats.totalUsers': 'Utilisateurs Totaux',
    'admin.stats.activeShort': 'Actifs',
    'admin.stats.activeUsers': 'Utilisateurs Actifs',
    'admin.stats.admins': 'Admins',
    'admin.stats.traders': 'Traders',
    'admin.search.placeholder': 'Rechercher...',
    'admin.filter.allRoles': 'Tous les rôles',
    'admin.filter.admins': 'Admins',
    'admin.filter.traders': 'Traders',
    'admin.add.short': 'Ajouter',
    'admin.add.full': 'Ajouter un utilisateur',
    'admin.table.user': 'Utilisateur',
    'admin.table.role': 'Rôle',
    'admin.table.status': 'Statut',
    'admin.table.lastLogin': 'Dernière Connexion',
    'admin.table.actions': 'Actions',
    'admin.role.admin': 'Admin',
    'admin.role.trader': 'Trader',
    'admin.noLogin': 'Jamais connecté',
    'admin.emptyState': 'Aucun utilisateur ne correspond à votre recherche',
    'admin.modal.add.titleShort': 'Ajouter un utilisateur',
    'admin.modal.add.title': 'Créer un nouvel utilisateur',
    'admin.form.email': 'E-mail',
    'admin.form.username': 'Nom d\'utilisateur',
    'admin.form.password': 'Mot de passe',
    'admin.form.role': 'Rôle',
    'admin.placeholder.email': 'Saisir l\'e-mail',
    'admin.placeholder.username': 'Saisir le nom d\'utilisateur',
    'admin.placeholder.password': 'Saisir le mot de passe',
    'admin.creating': 'Création...',
    'admin.create': 'Créer',
    'admin.modal.edit.title': 'Modifier l\'utilisateur',
    'admin.form.active': 'Compte actif',
    'admin.saving': 'Enregistrement...',
    
    // Smart Recommendations
    'recommendations.title': 'Recommandations Intelligentes',
    'recommendations.subtitle': 'Meilleures paires de devises à trader',
    'recommendations.loading': 'Chargement des recommandations...',
    'recommendations.lastUpdate': 'Dernière mise à jour',
    'recommendations.refresh': 'Actualiser',
    'recommendations.score': 'Score',
    'recommendations.marketCondition': 'Condition du marché',
    'recommendations.trending': 'Tendance',
    'recommendations.ranging': 'Latéral',
    'recommendations.volatile': 'Volatil',
    'recommendations.undefined': 'Indéfini',
    'recommendations.timeframe': 'Horizon temporel',
    'recommendations.expectedReturn': 'Rendement attendu',
    'recommendations.confidence': 'Niveau de confiance',
    'recommendations.marketAnalysis': 'Analyse du marché',
    'recommendations.technicalIndicators': 'Indicateurs techniques',
    'recommendations.supportLevel': 'Niveau de support',
    'recommendations.resistanceLevel': 'Niveau de résistance',
    'recommendations.recommendation': 'Recommandation',
    'recommendations.execute': 'Exécuter',
    'recommendations.details': 'Détails',
    'recommendations.noRecommendations': 'Aucune recommandation disponible pour le moment',
    'recommendations.tryLater': 'Réessayez plus tard',
    'recommendations.startBot': 'Démarrez le bot pour commencer l\'analyse du marché',
    'recommendations.errorLoading': 'Erreur lors du chargement des recommandations',
    'recommendations.bestTimeframe': 'Meilleur horizon',
    'recommendations.signalProbability': 'Probabilité du signal',
    'recommendations.signalProbabilityShort': 'Probabilité du signal',
    'recommendations.reasons': 'Raisons de la recommandation',
    'recommendations.qualityPoints': 'Points de qualité',
    'recommendations.qualityPointsShort': 'Points de qualité',
    'recommendations.confidenceLevel': 'Niveau de confiance',
    'recommendations.confidenceLevelShort': 'Niveau de confiance',
    'recommendations.winRate': 'Taux de réussite',
    'recommendations.winRateShort': 'Taux de réussite',
    'recommendations.retry': 'Réessayer',
    'recommendations.analyzing': 'Analyse du marché et génération des recommandations...',
    'recommendations.detailsOf': 'Détails de',
    'recommendations.recommendedTimeframes': 'Horizons recommandés',
    'recommendations.strength': 'Force',
    'recommendations.warning': 'Ces recommandations sont basées sur l\'analyse technique et ne constituent pas des conseils d\'investissement. Veuillez effectuer vos propres recherches avant de prendre des décisions de trading.',
    'recommendations.min': 'min',
    
    // Precise Binary Recommendations
    'precise.title': 'Recommandations Précises',
    'precise.subtitle': 'Pour Options Binaires',
    'precise.currentTime': 'Heure',
    'precise.analyzing': 'Analyse des paires...',
    'precise.noRecommendations': 'Aucune recommandation disponible',
    'precise.tryLater': 'Réessayez plus tard',
    'precise.entryTime': 'Heure d\'Entrée',
    'precise.after': 'Après',
    'precise.currentPrice': 'Prix Actuel',
    'precise.target': 'Cible',
    'precise.successRate': 'Taux de Réussite',
    'precise.confidence': 'Confiance',
    'precise.risk': 'Risque',
    'precise.low': 'Faible',
    'precise.medium': 'Moyen',
    'precise.high': 'Élevé',
    'precise.technicalIndicators': 'Indicateurs Techniques',
    'precise.trend': 'Tendance',
    'precise.momentum': 'Momentum',
    'precise.reason': 'Raison de la Recommandation',
    'precise.warning': 'Attention: Ce trade présente un risque élevé. Tradez avec prudence!',
    'precise.tips': '💡 Conseils Importants:',
    'precise.tip1': '• Entrez le trade à l\'heure exacte spécifiée',
    'precise.tip2': '• Utilisez la durée recommandée (1-5 minutes)',
    'precise.tip3': '• Les recommandations avec 85%+ de réussite sont les meilleures',
    'precise.tip4': '• Évitez les trades à haut risque si vous êtes débutant',
    'precise.tip5': '• N\'investissez pas plus de 2-5% du capital dans un trade',
    'precise.call': 'Call',
    'precise.put': 'Put',
    'precise.minutes': 'm',
    'precise.now': 'Maintenant',
    'precise.loading': 'Chargement...',
    'precise.riskLow': 'Faible',
    'precise.riskMedium': 'Moyen',
    'precise.riskHigh': 'Élevé',
    
    // أسباب التوصيات
    'recommendations.reasons.strongTechnical': '🎯 Signaux techniques très forts',
    'recommendations.reasons.positiveTechnical': '📈 Signaux techniques positifs',
    'recommendations.reasons.strongBullishTrend': '📊 Tendance haussière forte',
    'recommendations.reasons.strongBearishTrend': '📊 Tendance baissière forte',
    'recommendations.reasons.lowVolatility': '🔒 Faible volatilité - haute stabilité',
    'recommendations.reasons.highVolatility': '⚡ Haute volatilité - opportunités rapides',
    'recommendations.reasons.idealTimeframe': '⏰ Horizon {duration} minute idéal (confiance {confidence}%)',
    'recommendations.reasons.clearLevels': '🎚️ Niveaux de support et résistance clairs',
    
    // أسماء أزواج العملات
    'currency.EURUSD': 'Euro/Dollar Américain',
    'currency.EUR/USD': 'Euro/Dollar Américain',
    'currency.GBPUSD': 'Livre Sterling/Dollar Américain',
    'currency.GBP/USD': 'Livre Sterling/Dollar Américain',
    'currency.USDJPY': 'Dollar Américain/Yen Japonais',
    'currency.USD/JPY': 'Dollar Américain/Yen Japonais',
    'currency.AUDUSD': 'Dollar Australien/Dollar Américain',
    'currency.AUD/USD': 'Dollar Australien/Dollar Américain',
    'currency.USDCAD': 'Dollar Américain/Dollar Canadien',
    'currency.USD/CAD': 'Dollar Américain/Dollar Canadien',
    'currency.USDCHF': 'Dollar Américain/Franc Suisse',
    'currency.USD/CHF': 'Dollar Américain/Franc Suisse',
    'currency.EURGBP': 'Euro/Livre Sterling',
    'currency.EUR/GBP': 'Euro/Livre Sterling',
    'currency.EURJPY': 'Euro/Yen Japonais',
    'currency.EUR/JPY': 'Euro/Yen Japonais',
    'currency.GOLD': 'Or',
    'currency.BTC': 'Bitcoin',
    'currency.ETH': 'Ethereum',
    
    // مساعد التداول الذكي
    'assistant.title': 'Assistant de Trading Intelligent',
    'assistant.subtitle': 'Analyse des Signaux et Recommandations',
    'assistant.newSignalAvailable': 'Nouveau Signal Disponible',
    'assistant.asset': 'Actif',
    'assistant.direction': 'Direction',
    'assistant.confidence': 'Confiance',
    'assistant.duration': 'Durée',
    'assistant.tradeAllowed': 'Trade Autorisé',
    'assistant.tradeNotAllowed': 'Trade Non Autorisé',
    'assistant.recommendedAmount': 'Montant Recommandé',
    'assistant.maxLoss': 'Perte Max',
    'assistant.expectedProfit': 'Profit Attendu',
    'assistant.copyAsset': 'Copier Actif',
    'assistant.copyInstructions': 'Copier Instructions',
    'assistant.copied': 'Copié!',
    'assistant.bestRecommendations': 'Meilleures Recommandations Actuelles',
    'assistant.points': 'Points',
    'assistant.success': 'Succès',
    'assistant.smartTradingTips': 'Conseils de Trading Intelligents',
    'assistant.tip1': 'Vérifiez l\'analyse des risques avant tout trade',
    'assistant.tip2': 'Utilisez le montant recommandé par le système',
    'assistant.tip3': 'Surveillez la confiance et la force des signaux',
    'assistant.tip4': 'Suivez uniquement les recommandations de haute qualité',
    'assistant.tip5': 'Tenez un registre de tous vos trades',
    'assistant.tip6': 'Ne tradez pas plus de 5% du capital quotidiennement',
    'assistant.warning': 'Rappel: Ceci n\'est qu\'un assistant. Vous êtes responsable de toutes les décisions de trading. Commencez avec de petits montants et suivez la gestion des risques attentivement.',
    
    // أزرار الثيم
    'theme.dark': 'Mode Sombre',
    'theme.light': 'Mode Clair',
    'theme.toggle': 'Changer le Thème',

    // صفحات الاشتراك
    'subscription.planTitle': 'Choisissez Votre Plan Parfait',
    'subscription.subtitle': 'Rejoignez des milliers de traders prospères et obtenez des signaux de trading professionnels',
    'subscription.backToLogin': 'Retour à la Connexion',
    'subscription.monthly': 'Plan Mensuel',
    'subscription.annual': 'Plan Annuel',
    'subscription.threeyears': 'Plan 3 Ans',
    'subscription.mostPopular': 'Le Plus Populaire',
    'subscription.save': 'Économisez',
    'subscription.month': 'mois',
    'subscription.year': 'année',
    'subscription.years': 'années',
    'subscription.selectPlan': 'Sélectionner le Plan',
    'subscription.features.realtime': 'Signaux en temps réel',
    'subscription.features.technical': 'Analyse technique',
    'subscription.features.risk': 'Gestion des risques',
    'subscription.features.support': 'Support 24/7',
    'subscription.features.priority': 'Support prioritaire',
    'subscription.features.advanced': 'Stratégies avancées',
    'subscription.features.api': 'Accès API',
    'subscription.features.premium': 'Fonctionnalités premium',
    'subscription.features.unlimited': 'Signaux illimités',
    'subscription.features.exclusive': 'Analyses exclusives',

    // صفحة معلومات المستخدم
    'userinfo.title': 'Informations Utilisateur',
    'userinfo.subtitle': 'Veuillez saisir vos informations personnelles pour finaliser le processus d\'abonnement',
    'userinfo.selectedPlan': 'Plan Sélectionné',
    'userinfo.fullName': 'Nom Complet',
    'userinfo.email': 'Adresse E-mail',
    'userinfo.phone': 'Numéro de Téléphone',
    'userinfo.country': 'Pays',
    'userinfo.placeholder.fullName': 'Entrez votre nom complet',
    'userinfo.placeholder.email': 'Entrez votre adresse e-mail',
    'userinfo.placeholder.phone': 'Entrez votre numéro de téléphone',
    'userinfo.placeholder.country': 'Sélectionnez votre pays',
    'userinfo.continue': 'Continuer vers le Paiement',
    'userinfo.back': 'Retour',

    // صفحة الدفع
    'payment.loadingData': 'Chargement des données...',
    'payment.title': 'Finaliser le Paiement',
    'payment.subtitle': 'Choisissez votre méthode de paiement préférée',
    'payment.orderSummary': 'Résumé de la Commande',
    'payment.plan': 'Plan',
    'payment.duration': 'Durée',
    'payment.total': 'Total',
    'payment.paymentMethod': 'Méthode de Paiement',
    'payment.paypal': 'PayPal',
    'payment.usdt': 'USDT (Tether)',
    'payment.card': 'Carte de Crédit',
    'payment.paypalDesc': 'Payez en sécurité avec PayPal',
    'payment.usdtDesc': 'Payez avec la cryptomonnaie USDT',
    'payment.cardDesc': 'Payez avec une carte de crédit ou de débit',
    'payment.processing': 'Traitement...',
    'payment.payNow': 'Payer Maintenant',
    'payment.back': 'Retour',
    'payment.loadingButtons': 'Chargement des boutons de paiement...',
    'payment.pleaseWait': 'Veuillez patienter un instant',
    'payment.paypalError': 'Erreur de chargement PayPal',
    'payment.retry': 'Réessayer',
    'payment.payWithPaypal': 'Payer avec compte PayPal',
    'payment.payWithCard': 'Payer par carte bancaire',
    'payment.securePayment': 'Paiement sécurisé et crypté via PayPal',
    'payment.payWithCrypto': 'Payer avec cryptomonnaie (USDT)',
    'payment.hideCrypto': 'Masquer l\'option cryptomonnaie',
    'payment.cryptoTitle': 'Payer avec cryptomonnaie (USDT)',
    'payment.cryptoInstructions': 'Suivez ces étapes pour finaliser votre paiement',
    'payment.paymentSteps': 'Étapes de paiement:',
    'payment.step1': 'Copiez l\'adresse du portefeuille USDT (TRC20) ci-dessous',
    'payment.step2': 'Ouvrez votre portefeuille numérique (Binance, Trust Wallet, etc.)',
    'payment.step3': 'Sélectionnez envoyer USDT sur le réseau',
    'payment.step4': 'Collez l\'adresse du portefeuille et envoyez le montant exact',
    'payment.step5': 'Prenez une capture d\'écran de la preuve de paiement et téléchargez-la ci-dessous',
    'payment.importantWarning': '⚠️ Avertissement Important:',
    'payment.warning1': 'Assurez-vous d\'utiliser le réseau',
    'payment.warning2': 'L\'envoi d\'USDT sur un autre réseau (ERC20, BEP20) entraînera une perte de fonds',
    'payment.warning3': 'Vérifiez bien l\'adresse avant d\'envoyer',
    'payment.walletAddress': 'Adresse USDT (TRC20):',
    'payment.copy': 'Copier',
    'payment.copied': 'Copié',
    'payment.amountRequired': 'Montant à envoyer',
    'payment.uploadProof': 'Télécharger la preuve de paiement:',
    'payment.uploadImage': 'Cliquez pour télécharger l\'image',
    'payment.imageUploaded': 'Image téléchargée',
    'payment.submitProof': 'Soumettre la preuve de paiement',
    'payment.submitting': 'Envoi en cours...',
    'payment.uploadSuccess': 'Image téléchargée avec succès!',
    'payment.uploadSuccessDesc': 'Vous pouvez maintenant confirmer le paiement ou changer l\'image si vous le souhaitez',
    'payment.changeImage': 'Changer l\'image',
    'payment.processingPayment': 'Traitement en cours...',
    'payment.processingDesc': 'Enregistrement des données de paiement, vous serez redirigé vers la page de révision...',
    'payment.backButton': 'Retour',
    'payment.changePlan': 'Changer le plan',
    'payment.maxSize': 'Max',
    'payment.payWithCardButton': 'Payer par carte',

    // صفحة نجاح الدفع
    'paymentSuccess.title': 'Paiement Réussi !',
    'paymentSuccess.subtitle': 'Merci de vous être abonné au Bot de Trading Professionnel',
    'paymentSuccess.orderNumber': 'Numéro de Commande',
    'paymentSuccess.plan': 'Plan',
    'paymentSuccess.validUntil': 'Valide Jusqu\'au',
    'paymentSuccess.nextSteps': 'Prochaines Étapes',
    'paymentSuccess.step1': 'Votre compte sera activé dans quelques minutes',
    'paymentSuccess.step2': 'Vous recevrez un e-mail avec les détails de l\'abonnement',
    'paymentSuccess.step3': 'Vous pouvez maintenant accéder à toutes les fonctionnalités premium du bot',
    'paymentSuccess.loginNow': 'Se Connecter Maintenant',

    // Page Conditions Générales
    'terms.title': 'Conditions Générales',
    'terms.lastUpdated': 'Dernière mise à jour:',
    'terms.acceptance.title': 'Acceptation des Conditions',
    'terms.acceptance.content': 'En utilisant la plateforme, vous acceptez ces conditions. Nous nous réservons le droit de modifier sans préavis.',
    'terms.services.title': 'Services',
    'terms.services.content': 'Nous fournissons des signaux de trading éducatifs basés sur l\'IA. Les signaux sont des suggestions, pas des conseils contraignants.',
    'terms.risks.title': 'Risques',
    'terms.risks.content': 'Le trading est à haut risque et peut entraîner une perte de capital. N\'investissez pas d\'argent que vous ne pouvez pas vous permettre de perdre.',
    'terms.responsibilities.title': 'Responsabilités',
    'terms.responsibilities.content': 'Vous êtes responsable de vos décisions d\'investissement. Nous ne sommes pas responsables des pertes potentielles.',
    'terms.agreement': 'En utilisant cette plateforme, vous reconnaissez avoir lu, compris et accepté toutes les conditions.',
    'terms.acceptButton': 'Accepter les Conditions',
    'terms.backButton': 'Retour',
    'terms.agreementDeclaration': 'Déclaration d\'Accord',

    // Page Contact
    'contact.title': 'Contactez-nous',
    'contact.description': 'Nous sommes là pour vous aider ! Contactez-nous par l\'une des méthodes suivantes',
    'contact.backButton': 'Retour',
    'contact.formTitle': 'Envoyez-nous un message',
    'contact.nameLabel': 'Nom',
    'contact.emailLabel': 'Email',
    'contact.subjectLabel': 'Sujet',
    'contact.messageLabel': 'Message',
    'contact.sendButton': 'Envoyer le message',
    'contact.sending': 'Envoi en cours...',
    'contact.liveChatTitle': 'Chat en direct',
    'contact.liveChatDesc': 'Chattez directement avec notre équipe de support',
    'contact.liveChatButton': 'Démarrer le chat',
    'contact.emailTitle': 'Email',
    'contact.emailDesc': 'Envoyez-nous un email',
    'contact.emailButton': 'Envoyer un email',
    'contact.contactMethods': 'Méthodes de Contact',
    'contact.chatUnavailable': 'Le service de chat en direct n\'est actuellement pas disponible. Veuillez utiliser le formulaire ci-dessous ou nous contacter par email.',
    'contact.messageSent': 'Votre message a été envoyé avec succès ! Nous vous contacterons bientôt.',

    // Page À Propos
    'about.title': 'À Propos de Nous',
    'about.description': 'Nous sommes une équipe de professionnels spécialisés dans la technologie financière',
    'about.backButton': 'Retour',
    'about.vision.title': 'Notre Vision',
    'about.vision.content': 'Être leaders dans les technologies de trading intelligent et permettre aux traders d\'atteindre leurs objectifs financiers.',
    'about.mission.title': 'Notre Mission',
    'about.mission.content': 'Développer des solutions de trading intelligentes et innovantes qui aident les traders à prendre des décisions éclairées et obtenir de meilleurs résultats.',
    'about.whyDifferent': 'Pourquoi Sommes-nous Différents ?',
    'about.whyDifferentDesc': 'Nous offrons des fonctionnalités uniques qui font de nous le choix optimal pour les traders',
    'about.achievements': 'Nos Réalisations en Chiffres',
    'about.coreValues': 'Nos Valeurs Fondamentales',
    
    // Fonctionnalités
    'about.features.analysis.title': 'Analyse Avancée',
    'about.features.analysis.desc': 'Nous utilisons les dernières technologies d\'IA pour analyser les marchés financiers et fournir des signaux précis.',
    'about.features.security.title': 'Haute Sécurité',
    'about.features.security.desc': 'Nous garantissons la protection de vos données et de votre vie privée grâce aux plus hauts standards de sécurité et de chiffrement.',
    'about.features.speed.title': 'Vitesse Ultra',
    'about.features.speed.desc': 'Signaux instantanés et mises à jour en direct pour vous assurer de ne manquer aucune opportunité de trading rentable.',
    'about.features.coverage.title': 'Couverture Complète',
    'about.features.coverage.desc': 'Nous couvrons tous les marchés principaux du forex et des cryptomonnaies aux actions et matières premières.',
    
    // Valeurs
    'about.values.transparency.title': 'Transparence',
    'about.values.transparency.desc': 'Nous croyons en la transparence complète dans toutes nos opérations et résultats de signaux.',
    'about.values.reliability.title': 'Fiabilité',
    'about.values.reliability.desc': 'Nous nous efforçons de fournir un service fiable et stable sur lequel on peut compter.',
    'about.values.excellence.title': 'Excellence',
    'about.values.excellence.desc': 'Nous visons l\'excellence dans tout ce que nous offrons en termes de services et solutions techniques.',
    
    // Statistiques
    'about.stats.activeTraders': 'Traders Actifs',
    'about.stats.successRate': 'Taux de Réussite des Signaux',
    'about.stats.support': 'Support Technique',
    'about.stats.userRating': 'Évaluation des Utilisateurs',
    
    // Pied de page
    'footer.telegram': 'Telegram',
    'footer.discord': 'Discord',
    'footer.email': 'Email',
    'footer.terms': 'Conditions',
    'footer.contact': 'Contact',
    'footer.about': 'À Propos',
    'footer.logoAlt': 'Bot de Trading Professionnel',
    'footer.copyright': 'Bot de Trading Professionnel. Tous droits réservés.',
    
    // Textes supplémentaires pour la page de succès de paiement
    'paymentSuccess.needHelp': 'Besoin d\'aide ?',
    'paymentSuccess.contactUs': 'Contactez-nous',
  },
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app-language');
    const lang = (saved as Language) || 'ar';
    // تحديث selectedLanguage للـ manifest
    localStorage.setItem('selectedLanguage', lang);
    // تحديث language لـ PayPal SDK
    localStorage.setItem('language', lang);
    return lang;
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app-language', lang);
    localStorage.setItem('selectedLanguage', lang); // للـ manifest
    localStorage.setItem('language', lang); // لـ PayPal SDK
    
    // تطبيق الاتجاه حسب اللغة
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    
    // تحديث manifest حسب اللغة الجديدة
    if (typeof window !== 'undefined' && (window as any).updateAppManifest) {
      (window as any).updateAppManifest();
    }
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };

  const dir = language === 'ar' ? 'rtl' : 'ltr'; // تغيير الاتجاه حسب اللغة

  useEffect(() => {
    // تطبيق الاتجاه عند التحميل
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [language, dir]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
