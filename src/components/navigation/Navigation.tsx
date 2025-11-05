import React from 'react';
import {
  Star,
  Target,
  ShieldCheck,
  CreditCard
} from 'lucide-react';
// import { Badge } from './ui/Badge'; // تم إزالة الاستخدام
import { cn, designSystem } from '../../styles/designSystem';
import { useLanguage } from '../../contexts/LanguageContext';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: 'signals' | 'recommendations' | 'precise' | 'admin' | 'subscription') => void;
  userRole?: 'admin' | 'trader';
}

const getTabsConfig = (t: (key: string) => string) => [
  { 
    id: 'recommendations', 
    label: t('nav.recommendations'), 
    icon: Star, 
    color: 'purple',
    description: t('nav.recommendations.desc')
  },
  { 
    id: 'precise', 
    label: t('nav.precise'), 
    icon: Target, 
    color: 'orange',
    description: t('nav.precise.desc')
  },
  { 
    id: 'admin', 
    label: t('nav.admin'), 
    icon: ShieldCheck, 
    color: 'yellow',
    description: t('nav.admin.desc'),
    adminOnly: true
  },
  { 
    id: 'subscription', 
    label: t('nav.subscription'), 
    icon: CreditCard, 
    color: 'green',
    description: t('nav.subscription.desc'),
    traderOnly: true
  },
];

export const Navigation: React.FC<NavigationProps> = ({ 
  activeTab, 
  onTabChange, 
  userRole = 'trader'
}) => {
  const { t } = useLanguage();
  const tabs = getTabsConfig(t);
  const getTabColorClasses = (color: string, isActive: boolean) => {
    const colorMap = {
      blue: isActive 
        ? 'bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 text-white shadow-blue-500/50' 
        : 'hover:bg-blue-500/10 hover:text-blue-400 hover:border-blue-500/30',
      purple: isActive 
        ? 'bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 text-white shadow-purple-500/50' 
        : 'hover:bg-purple-500/10 hover:text-purple-400 hover:border-purple-500/30',
      red: isActive 
        ? 'bg-gradient-to-br from-red-400 via-red-500 to-red-600 text-white shadow-red-500/50' 
        : 'hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30',
      green: isActive 
        ? 'bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 text-white shadow-emerald-500/50' 
        : 'hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/30',
      orange: isActive 
        ? 'bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 text-white shadow-orange-500/50' 
        : 'hover:bg-orange-500/10 hover:text-orange-400 hover:border-orange-500/30',
      indigo: isActive 
        ? 'bg-gradient-to-br from-indigo-400 via-indigo-500 to-indigo-600 text-white shadow-indigo-500/50' 
        : 'hover:bg-indigo-500/10 hover:text-indigo-400 hover:border-indigo-500/30',
      yellow: isActive 
        ? 'bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 text-white shadow-yellow-500/50' 
        : 'hover:bg-yellow-500/10 hover:text-yellow-400 hover:border-yellow-500/30',
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  // تصفية التبويبات حسب دور المستخدم
  const filteredTabs = tabs.filter(tab => {
    if (tab.adminOnly) {
      return userRole === 'admin';
    }
    if (tab.traderOnly) {
      return userRole === 'trader';
    }
    return true;
  });

  return (
    <nav className={cn(
      designSystem.colors.background.card,
      'rounded-xl p-2 xs:p-2.5 sm:p-4 md:p-5 lg:p-6 shadow-2xl w-full max-w-full overflow-hidden'
    )}
    style={{ direction: 'rtl' }}>
      
      {/* أزرار التنقل الحديثة والأنيقة */}
      <div className="flex flex-nowrap justify-center items-stretch gap-1 xs:gap-1.5 sm:gap-2 md:gap-3 lg:gap-4 w-full">
        {filteredTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id as 'signals' | 'recommendations' | 'precise' | 'admin' | 'subscription')}
              className={cn(
                'group relative overflow-hidden rounded-xl sm:rounded-2xl transition-all duration-500 ease-out',
                'flex flex-col items-center justify-center gap-0.5 xs:gap-0.5 sm:gap-1.5 md:gap-2',
                'p-0 xs:p-0.5 sm:p-3 md:p-3.5 lg:p-3',
                'flex-1 min-w-0 max-w-none',
                'h-auto min-h-[52px] xs:min-h-[56px] sm:min-h-[80px] md:min-h-[85px] lg:min-h-[70px]',
                'border-2 backdrop-blur-xl transform-gpu',
                isActive 
                  ? cn(
                      getTabColorClasses(tab.color, true),
                      'shadow-2xl scale-105 border-transparent ring-2 ring-white/30 shadow-lg'
                    )
                  : cn(
                      'bg-gradient-to-br from-slate-700/50 to-slate-800/50 text-gray-100 border-slate-600/40',
                      'hover:from-slate-600/60 hover:to-slate-700/60 hover:border-slate-500/50 hover:scale-[1.03] hover:shadow-xl hover:shadow-slate-400/30',
                      getTabColorClasses(tab.color, false)
                    )
              )}
            >
              {/* خلفية متحركة مع تأثير Shimmer */}
              <div className={cn(
                'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700',
                'bg-gradient-to-br from-white/10 via-white/5 to-transparent'
              )} />
              
              {/* تأثير Glow للزر النشط */}
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-t from-white/20 via-transparent to-white/10 pointer-events-none" />
              )}

              {/* أيقونة حديثة مع Glow */}
              <div className={cn(
                'relative z-10 p-0 xs:p-0.5 sm:p-2 md:p-2.5 lg:p-1.5 rounded-lg sm:rounded-xl transition-all duration-500 group-hover:scale-110',
                isActive 
                  ? 'bg-white shadow-[0_0_20px_rgba(255,255,255,0.5)] ring-2 ring-white/80' 
                  : 'bg-slate-600/70 group-hover:bg-slate-500/80 group-hover:shadow-xl'
              )}>
                {/* Glow Effect للأيقونة */}
                {isActive && (
                  <div className="absolute inset-0 bg-white rounded-xl blur-md -z-10 opacity-80" />
                )}
                <Icon className={cn(
                  'transition-all duration-500 group-hover:rotate-6 stroke-[1.5]',
                  'w-5 h-5 xs:w-5 xs:h-5 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-5 lg:h-5',
                  isActive ? 'text-gray-950 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]' : 'text-gray-100 group-hover:text-white'
                )} />
              </div>

              {/* النص الحديث والأنيق */}
              <div className="relative z-10 text-center space-y-0.5 min-w-0 w-full px-0.5 sm:px-1">
                <div className={cn(
                  'font-black leading-tight whitespace-nowrap overflow-hidden text-ellipsis transition-all duration-500 group-hover:scale-105',
                  'text-[10px] xs:text-[11px] sm:text-xs md:text-sm lg:text-sm',
                  isActive 
                    ? 'text-white drop-shadow-[0_3px_12px_rgba(0,0,0,1)] [text-shadow:_1px_1px_3px_rgb(0_0_0_/_90%),_-1px_-1px_3px_rgb(0_0_0_/_90%)]' 
                    : 'text-gray-100 group-hover:text-white'
                )}>
                  {tab.label}
                </div>
                <div className={cn(
                  'text-[10px] sm:text-xs leading-snug hidden lg:block whitespace-normal break-words transition-all duration-500 font-bold text-[10px]',
                  isActive 
                    ? 'text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] [text-shadow:_1px_1px_2px_rgb(0_0_0_/_80%)]' 
                    : 'text-gray-200 group-hover:text-gray-100'
                )}>
                  {tab.description}
                </div>
              </div>

              {/* مؤشرات نشطة حديثة */}
              {isActive && (
                <>
                  {/* مؤشر علوي مع Glow */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-transparent via-white to-transparent rounded-b-full shadow-lg shadow-white/50" />
                  
                  {/* مؤشر سفلي مع Glow */}
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-transparent via-white to-transparent rounded-t-full shadow-lg shadow-white/50" />
                  
                  {/* نقاط جانبية مضيئة */}
                  <div className="absolute top-1/2 left-1 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-transparent via-white/60 to-transparent rounded-full" />
                  <div className="absolute top-1/2 right-1 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-transparent via-white/60 to-transparent rounded-full" />
                </>
              )}

              {/* تأثير Pulse للزر النشط */}
              {isActive && (
                <div className="absolute inset-0 rounded-2xl animate-pulse bg-white/5 pointer-events-none" />
              )}
            </button>
          );
        })}
      </div>

      {/* إحصائيات سريعة - تم حذفها بناءً على طلب المستخدم */}
    </nav>
  );
};
