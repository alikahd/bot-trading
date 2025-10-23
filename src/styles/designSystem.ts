// نظام التصميم العصري المتكامل - الإصدار 4.0 مع تحسينات متقدمة
export const designSystem = {
  // نظام الألوان العصري - تدرجات متقدمة مع دعم الثيمات
  colors: {
    // الخلفيات المحسنة مع تدرجات أنيقة
    background: {
      primary: 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950',
      secondary: 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900',
      accent: 'bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800',
      card: 'bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 border border-slate-700/60 backdrop-blur-md',
      glass: 'bg-slate-800/70 backdrop-blur-2xl border border-slate-700/50 shadow-2xl',
      overlay: 'bg-black/70 backdrop-blur-md',
    },
    
    // النصوص المتدرجة
    text: {
      primary: 'text-slate-50 dark:text-slate-50 text-slate-900',
      secondary: 'text-slate-300 dark:text-slate-300 text-slate-600',
      muted: 'text-slate-500 dark:text-slate-500 text-slate-400',
      accent: 'text-blue-400 dark:text-blue-400 text-blue-600',
      gradient: 'bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent dark:from-blue-400 dark:via-purple-400 dark:to-cyan-400 from-blue-600 via-purple-600 to-cyan-600',
      glow: 'text-white drop-shadow-[0_0_10px_rgba(59,130,246,0.5)] dark:text-white dark:drop-shadow-[0_0_10px_rgba(59,130,246,0.5)] text-slate-900 drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]',
    },
    
    // الحدود المتقدمة
    border: {
      primary: 'border-slate-800/50 dark:border-slate-800/50 border-slate-300/50',
      accent: 'border-slate-700/60 dark:border-slate-700/60 border-slate-400/60',
      glow: 'border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)] dark:border-blue-500/30 dark:shadow-[0_0_20px_rgba(59,130,246,0.1)] border-blue-400/30 shadow-[0_0_20px_rgba(59,130,246,0.05)]',
      gradient: 'border-transparent bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-cyan-500/20 dark:from-blue-500/20 dark:via-purple-500/20 dark:to-cyan-500/20 from-blue-400/20 via-purple-400/20 to-cyan-400/20',
    },
    
    // الألوان الوظيفية المحسنة
    status: {
      success: {
        bg: 'bg-emerald-500/20',
        border: 'border-emerald-500/30',
        text: 'text-emerald-400',
        glow: 'shadow-[0_0_20px_rgba(16,185,129,0.2)]',
      },
      warning: {
        bg: 'bg-amber-500/20',
        border: 'border-amber-500/30',
        text: 'text-amber-400',
        glow: 'shadow-[0_0_20px_rgba(245,158,11,0.2)]',
      },
      error: {
        bg: 'bg-red-500/20',
        border: 'border-red-500/30',
        text: 'text-red-400',
        glow: 'shadow-[0_0_20px_rgba(239,68,68,0.2)]',
      },
      info: {
        bg: 'bg-blue-500/20',
        border: 'border-blue-500/30',
        text: 'text-blue-400',
        glow: 'shadow-[0_0_20px_rgba(59,130,246,0.2)]',
      },
      default: {
        bg: 'bg-slate-500/20',
        border: 'border-slate-500/30',
        text: 'text-slate-400',
        glow: 'shadow-[0_0_20px_rgba(100,116,139,0.2)]',
      },
      destructive: {
        bg: 'bg-red-500/20',
        border: 'border-red-500/30',
        text: 'text-red-400',
        glow: 'shadow-[0_0_20px_rgba(239,68,68,0.2)]',
      },
      secondary: {
        bg: 'bg-gray-500/20',
        border: 'border-gray-500/30',
        text: 'text-gray-400',
        glow: 'shadow-[0_0_20px_rgba(107,114,128,0.2)]',
      },
    },
    
    // ألوان التداول المتقدمة
    trading: {
      profit: {
        text: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
        glow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]',
      },
      loss: {
        text: 'text-red-400',
        bg: 'bg-red-500/10',
        border: 'border-red-500/20',
        glow: 'shadow-[0_0_15px_rgba(239,68,68,0.3)]',
      },
      call: {
        bg: 'bg-gradient-to-r from-emerald-500 to-green-500',
        text: 'text-white',
        shadow: 'shadow-[0_4px_20px_rgba(16,185,129,0.4)]',
      },
      put: {
        bg: 'bg-gradient-to-r from-red-500 to-rose-500',
        text: 'text-white',
        shadow: 'shadow-[0_4px_20px_rgba(239,68,68,0.4)]',
      },
    }
  },
  
  // المسافات المتدرجة
  spacing: {
    xs: 'p-2',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
    xxl: 'p-12',
  },
  
  // الحواف المدورة المتقدمة
  radius: {
    none: 'rounded-none',
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    xl: 'rounded-3xl',
    full: 'rounded-full',
  },
  
  // الظلال المتقدمة
  shadow: {
    none: 'shadow-none',
    sm: 'shadow-lg shadow-black/10',
    md: 'shadow-xl shadow-black/20',
    lg: 'shadow-2xl shadow-black/30',
    xl: 'shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]',
    glow: 'shadow-[0_0_30px_rgba(59,130,246,0.3)]',
    colored: {
      blue: 'shadow-[0_8px_30px_rgba(59,130,246,0.3)]',
      emerald: 'shadow-[0_8px_30px_rgba(16,185,129,0.3)]',
      red: 'shadow-[0_8px_30px_rgba(239,68,68,0.3)]',
      purple: 'shadow-[0_8px_30px_rgba(147,51,234,0.3)]',
    }
  },
  
  // الخطوط المحسنة
  typography: {
    display: {
      xl: 'text-4xl font-black tracking-tight',
      lg: 'text-3xl font-bold tracking-tight',
      md: 'text-2xl font-bold tracking-tight',
    },
    heading: {
      xl: 'text-2xl font-bold',
      lg: 'text-xl font-bold',
      md: 'text-lg font-semibold',
      sm: 'text-base font-medium',
    },
    body: {
      xl: 'text-lg leading-relaxed',
      lg: 'text-base leading-relaxed',
      md: 'text-sm leading-relaxed',
      sm: 'text-xs leading-relaxed',
    },
    mono: 'font-mono tracking-wide',
    gradient: 'bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent font-bold',
  },
  
  // الانتقالات المتقدمة
  transitions: {
    fast: 'transition-all duration-150 ease-out',
    normal: 'transition-all duration-300 ease-out',
    slow: 'transition-all duration-500 ease-out',
    bounce: 'transition-all duration-300 ease-bounce',
    spring: 'transition-all duration-700 ease-spring',
  },
  
  // الأزرار المحسنة مع تأثيرات متقدمة
  buttons: {
    primary: 'bg-gradient-to-r from-blue-600 via-blue-700 to-blue-600 hover:from-blue-700 hover:via-blue-800 hover:to-blue-700 text-white px-6 py-3 rounded-2xl font-bold shadow-[0_10px_40px_rgba(59,130,246,0.35)] hover:shadow-[0_15px_50px_rgba(59,130,246,0.45)] transform hover:scale-105 active:scale-95 transition-all duration-500 border border-blue-500/30',
    secondary: 'bg-gradient-to-br from-slate-800/90 via-slate-700/90 to-slate-800/90 hover:from-slate-700/95 hover:via-slate-600/95 hover:to-slate-700/95 text-slate-200 px-6 py-3 rounded-2xl font-bold border border-slate-600/60 hover:border-slate-500/70 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-105 active:scale-95',
    success: 'bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-600 hover:from-emerald-700 hover:via-emerald-800 hover:to-emerald-700 text-white px-6 py-3 rounded-2xl font-bold shadow-[0_10px_40px_rgba(16,185,129,0.35)] hover:shadow-[0_15px_50px_rgba(16,185,129,0.45)] transform hover:scale-105 active:scale-95 transition-all duration-500 border border-emerald-500/30',
    danger: 'bg-gradient-to-r from-red-600 via-red-700 to-red-600 hover:from-red-700 hover:via-red-800 hover:to-red-700 text-white px-6 py-3 rounded-2xl font-bold shadow-[0_10px_40px_rgba(239,68,68,0.35)] hover:shadow-[0_15px_50px_rgba(239,68,68,0.45)] transform hover:scale-105 active:scale-95 transition-all duration-500 border border-red-500/30',
    ghost: 'hover:bg-gradient-to-br hover:from-slate-800/70 hover:via-slate-700/70 hover:to-slate-800/70 text-slate-300 hover:text-white px-6 py-3 rounded-2xl font-semibold backdrop-blur-xl transition-all duration-500 border border-transparent hover:border-slate-600/50 transform hover:scale-105 active:scale-95',
    glass: 'bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-2xl font-semibold backdrop-blur-2xl border border-white/20 hover:border-white/40 shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-105 active:scale-95',
  },
  
  // البطاقات المحسنة مع تدرجات وتأثيرات متقدمة
  cards: {
    default: 'bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 rounded-2xl shadow-2xl border border-slate-700/60 backdrop-blur-md transition-all duration-500 hover:border-slate-600/70',
    elevated: 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-slate-700/70 backdrop-blur-lg transition-all duration-500 hover:shadow-[0_25px_60px_rgba(0,0,0,0.6)]',
    glass: 'bg-slate-800/70 backdrop-blur-2xl rounded-2xl shadow-2xl border border-slate-700/50 transition-all duration-500 hover:bg-slate-800/80 hover:border-slate-600/60',
    interactive: 'bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 rounded-2xl shadow-2xl border border-slate-700/60 hover:shadow-[0_25px_60px_rgba(0,0,0,0.6)] hover:border-blue-500/40 hover:scale-[1.02] cursor-pointer transition-all duration-500 backdrop-blur-md',
    glow: 'bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 rounded-2xl shadow-[0_0_40px_rgba(59,130,246,0.25)] border border-blue-500/40 backdrop-blur-md transition-all duration-500 hover:shadow-[0_0_50px_rgba(59,130,246,0.35)]',
  },
  
  // التخطيط المتجاوب
  layout: {
    container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
    section: 'py-12 lg:py-16',
    grid: {
      cols1: 'grid grid-cols-1 gap-6',
      cols2: 'grid grid-cols-1 lg:grid-cols-2 gap-6',
      cols3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
      cols4: 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6',
      responsive: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6',
    },
    flex: {
      center: 'flex items-center justify-center',
      between: 'flex items-center justify-between',
      start: 'flex items-center justify-start',
      end: 'flex items-center justify-end',
      col: 'flex flex-col',
      colCenter: 'flex flex-col items-center justify-center',
    }
  },
  
  // التأثيرات المتقدمة
  effects: {
    blur: {
      sm: 'backdrop-blur-sm',
      md: 'backdrop-blur-md',
      lg: 'backdrop-blur-lg',
      xl: 'backdrop-blur-xl',
      '2xl': 'backdrop-blur-2xl',
    },
    glow: {
      sm: 'drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]',
      md: 'drop-shadow-[0_0_20px_rgba(59,130,246,0.4)]',
      lg: 'drop-shadow-[0_0_30px_rgba(59,130,246,0.5)]',
    },
    gradient: {
      primary: 'bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600',
      secondary: 'bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800',
      success: 'bg-gradient-to-r from-emerald-500 to-green-500',
      danger: 'bg-gradient-to-r from-red-500 to-rose-500',
      radial: 'bg-radial-gradient from-blue-600/20 via-purple-600/10 to-transparent',
    }
  }
};

// مساعدات للتصميم المتقدمة
export const cn = (...classes: (string | undefined | null | boolean)[]) => 
  classes.filter(Boolean).join(' ');

// أنواع البيانات المحدثة
export type CardVariant = 'default' | 'elevated' | 'glass' | 'interactive' | 'glow';
export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'glass';
export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'default' | 'destructive' | 'secondary';
export type ShadowVariant = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'glow';
export type EffectVariant = 'none' | 'glow' | 'blur' | 'gradient';

// مساعدات للمكونات المحدثة
export const getCardClasses = (variant: CardVariant = 'default', className = '') => {
  return cn(designSystem.cards[variant], className);
};

export const getButtonClasses = (variant: ButtonVariant = 'primary', className = '') => {
  return cn(designSystem.buttons[variant], className);
};

export const getBadgeClasses = (variant: BadgeVariant = 'info', className = '') => {
  // التأكد من أن variant صالح وموجود في designSystem
  const safeVariant = variant && designSystem.colors.status[variant] ? variant : 'info';
  const status = designSystem.colors.status[safeVariant];
  
  return cn(
    status.bg,
    status.border,
    status.text,
    'px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm',
    className
  );
};

export const getShadowClasses = (variant: ShadowVariant = 'md', color?: 'blue' | 'emerald' | 'red' | 'purple') => {
  if (color && designSystem.shadow.colored[color]) {
    return designSystem.shadow.colored[color];
  }
  return designSystem.shadow[variant];
};

export const getGradientText = (className = '') => {
  return cn(designSystem.typography.gradient, className);
};

export const getGlowEffect = (intensity: 'sm' | 'md' | 'lg' = 'md') => {
  return designSystem.effects.glow[intensity];
};

// مساعدات للتداول
export const getTradingClasses = (type: 'profit' | 'loss' | 'call' | 'put', className = '') => {
  const trading = designSystem.colors.trading[type];
  const classes = [];
  
  if ('bg' in trading) classes.push(trading.bg);
  if ('text' in trading) classes.push(trading.text);
  if ('border' in trading) classes.push(trading.border);
  if ('shadow' in trading) classes.push(trading.shadow);
  if ('glow' in trading) classes.push(trading.glow);
  
  return cn(...classes, className);
};

// مساعدات للحالات
export const getStatusClasses = (status: BadgeVariant, withGlow = false, className = '') => {
  const statusConfig = designSystem.colors.status[status];
  return cn(
    statusConfig.bg,
    statusConfig.border,
    statusConfig.text,
    withGlow ? statusConfig.glow : '',
    'px-3 py-2 rounded-xl border backdrop-blur-sm font-medium',
    className
  );
};

// مساعدات للتخطيط
export const getLayoutClasses = (type: keyof typeof designSystem.layout.flex | keyof typeof designSystem.layout.grid) => {
  if (type in designSystem.layout.flex) {
    return designSystem.layout.flex[type as keyof typeof designSystem.layout.flex];
  }
  if (type in designSystem.layout.grid) {
    return designSystem.layout.grid[type as keyof typeof designSystem.layout.grid];
  }
  return '';
};

// مساعدات للتأثيرات
export const getBlurEffect = (intensity: keyof typeof designSystem.effects.blur = 'md') => {
  return designSystem.effects.blur[intensity];
};

export const getGradientBackground = (type: keyof typeof designSystem.effects.gradient = 'primary') => {
  return designSystem.effects.gradient[type];
};

// ثوابت التصميم
export const DESIGN_TOKENS = {
  borderRadius: {
    sm: '12px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  spacing: {
    xs: '8px',
    sm: '12px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060,
  }
} as const;
