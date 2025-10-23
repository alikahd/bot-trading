// إعدادات خدمات الدردشة المباشرة
export const chatConfig = {
  // Tawk.to - خدمة مجانية وسهلة الاستخدام
  tawk: {
    // نوافذ دردشة منفصلة لكل لغة (حسب توصية Tawk.to)
    properties: {
      ar: {
        propertyId: '68d7390284c419194f0db574', // النافذة العربية
        widgetId: '1j64bdcu7'
      },
      en: {
        propertyId: '68d7390284c419194f0db574', // النافذة الإنجليزية
        widgetId: '1j64dtou2'
      },
      fr: {
        propertyId: '68d7390284c419194f0db574', // النافذة الفرنسية
        widgetId: '1j64e6asf'
      }
    },
    enabled: true
  },

  // Crisp - خدمة حديثة مع ميزات متقدمة (بدون علامة تجارية)
  crisp: {
    websiteId: 'ae35cdb6-1c6a-472e-b6a6-0ca4570138ad', // ضع Website ID هنا من https://crisp.chat
    enabled: false
  },

  // Intercom - خدمة احترافية للشركات الكبيرة
  intercom: {
    appId: 'YOUR_INTERCOM_APP_ID', // احصل عليه من https://intercom.com
  },

  // المزود الافتراضي للدردشة - مؤقتاً Tawk حتى إعداد Crisp
  provider: 'tawk' as 'tawk' | 'crisp' | 'intercom',

  // إعدادات عامة
  settings: {
    // اللغة الافتراضية
    defaultLanguage: 'ar',
    // اسم المستخدم الافتراضي
    defaultUserName: 'عميل جديد',
    
    // رسالة الترحيب
    welcomeMessage: 'مرحباً! كيف يمكننا مساعدتك؟',
    
    // إظهار الدردشة على الهواتف
    showOnMobile: true,
    
    // إظهار الدردشة على سطح المكتب
    showOnDesktop: true,

    // إعدادات خاصة بالهواتف
    mobile: {
      // موقع زر الدردشة (bottom-right, bottom-left, top-right, top-left)
      position: 'bottom-right',
      // المسافة من الحواف (بالبكسل)
      margin: {
        bottom: 20,
        right: 20,
        left: 20,
        top: 20
      },
      // حجم زر الدردشة
      buttonSize: 'medium', // small, medium, large
      // فتح النافذة في وضع ملء الشاشة على الهواتف
      fullScreenOnMobile: false,
      // إخفاء الزر عند فتح النافذة
      hideButtonWhenOpen: false,
      // تأخير ظهور الزر (بالثواني)
      showDelay: 2,
      // إظهار رسالة ترحيب تلقائية
      autoWelcomeMessage: true,
      // نص الرسالة الترحيبية
      welcomeText: {
        ar: 'مرحباً! 👋 هل تحتاج مساعدة؟',
        en: 'Hello! 👋 Need help?',
        fr: 'Bonjour! 👋 Besoin d\'aide?'
      },
      // تأثيرات حركية للزر
      animations: {
        // نوع التأثير: bounce, pulse, shake, glow, float
        type: 'pulse',
        // سرعة التأثير (بالثواني)
        duration: 1.5,
        // تكرار التأثير
        infinite: true,
        // تأخير بين التكرارات (بالثواني)
        delay: 0.5
      }
    },
    
    // إعدادات خاصة بسطح المكتب
    desktop: {
      // موقع زر الدردشة
      position: 'bottom-right',
      // المسافة من الحواف
      margin: {
        bottom: 20,
        right: 20
      },
      // حجم النافذة عند الفتح
      windowSize: {
        width: 400,
        height: 600,
        maxWidth: 450,
        maxHeight: 700
      },
      // فتح النافذة كنافذة منبثقة وليس ملء الشاشة
      openAsPopup: true,
      // موقع النافذة المنبثقة
      popupPosition: 'bottom-right'
    }
  }
};

// دليل الإعداد لكل خدمة
export const setupGuide = {
  tawk: {
    name: 'Tawk.to',
    website: 'https://tawk.to',
    steps: [
      '1. اذهب إلى https://tawk.to وأنشئ حساب مجاني',
      '2. أضف موقعك الإلكتروني',
      '3. انسخ Property ID من لوحة التحكم',
      '4. استبدل YOUR_TAWK_PROPERTY_ID في الكود',
      '5. احفظ وأعد تشغيل التطبيق'
    ],
    features: [
      '✅ مجاني تماماً',
      '✅ دعم عربي كامل',
      '✅ تطبيق هاتف للرد',
      '✅ تتبع الزوار',
      '✅ ملفات وصور'
    ]
  },

  crisp: {
    name: 'Crisp',
    website: 'https://crisp.chat',
    steps: [
      '1. اذهب إلى https://crisp.chat وأنشئ حساب',
      '2. أضف موقعك الإلكتروني',
      '3. انسخ Website ID من الإعدادات',
      '4. استبدل YOUR_CRISP_WEBSITE_ID في الكود',
      '5. فعّل provider: "crisp" في App.tsx'
    ],
    features: [
      '✅ خطة مجانية متاحة',
      '✅ تصميم عصري',
      '✅ بوت ذكي',
      '✅ تكامل مع أدوات أخرى',
      '✅ تحليلات متقدمة'
    ]
  },

  intercom: {
    name: 'Intercom',
    website: 'https://intercom.com',
    steps: [
      '1. اذهب إلى https://intercom.com وأنشئ حساب',
      '2. أضف تطبيقك',
      '3. انسخ App ID من الإعدادات',
      '4. استبدل YOUR_INTERCOM_APP_ID في الكود',
      '5. فعّل provider: "intercom" في App.tsx'
    ],
    features: [
      '✅ خدمة احترافية',
      '✅ أتمتة متقدمة',
      '✅ تكامل CRM',
      '✅ تحليلات عميقة',
      '⚠️ مدفوع (تجربة مجانية)'
    ]
  }
};

export default chatConfig;
