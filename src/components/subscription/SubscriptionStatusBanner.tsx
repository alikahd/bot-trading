import React from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import { cn } from '../../styles/designSystem';
import { SubscriptionStatus } from '../../hooks/useSubscriptionStatus';
import { useLanguage } from '../../contexts/LanguageContext';

interface SubscriptionStatusBannerProps {
  status: SubscriptionStatus;
  onRenew?: () => void;
  onViewDetails?: () => void;
}

export const SubscriptionStatusBanner: React.FC<SubscriptionStatusBannerProps> = ({
  status,
  onRenew
}) => {
  const { t } = useLanguage();

  if (status.isActive && !status.isExpiringSoon) {
    return null; // لا نعرض شيئاً إذا كان الاشتراك نشطاً وليس قريباً من الانتهاء
  }

  const getBannerConfig = () => {
    if (status.isExpired) {
      return {
        variant: 'error' as const,
        icon: <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />,
        title: t('subscriptionBanner.expiredTitle'),
        message: t('subscriptionBanner.expiredMessage'),
        bgColor: 'bg-red-500/10 border-red-500/30',
        textColor: 'text-red-400'
      };
    }

    if (status.isExpiringSoon) {
      return {
        variant: 'warning' as const,
        icon: <Clock className="w-4 h-4 sm:w-5 sm:h-5" />,
        title: t('subscriptionBanner.expiringSoonTitle'),
        message: `${t('subscriptionBanner.expiringSoonMessage')} ${status.daysRemaining} ${status.daysRemaining === 1 ? t('subscriptionBanner.day') : t('subscriptionBanner.days')}.`,
        bgColor: 'bg-yellow-500/10 border-yellow-500/30',
        textColor: 'text-yellow-400'
      };
    }

    return null;
  };

  const config = getBannerConfig();
  if (!config) return null;

  return (
    <div className={cn("mb-2 sm:mb-3 px-2 sm:px-4 py-1.5 sm:py-2.5 rounded-lg border flex items-center justify-between gap-2 sm:gap-3", config.bgColor)}>
      {/* الأيقونة والرسالة */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
        <div className={cn("flex-shrink-0", config.textColor)}>
          {config.icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className={cn("text-xs sm:text-sm font-medium", config.textColor)}>
            {config.title}
          </p>
          <p className="text-[10px] sm:text-xs text-gray-400 truncate">
            {status.daysRemaining} {status.daysRemaining === 1 ? t('subscriptionBanner.day') : t('subscriptionBanner.days')} {t('subscriptionBanner.remaining')}
          </p>
        </div>
      </div>
      
      {/* الأزرار */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {onRenew && (
          <button
            onClick={onRenew}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:scale-95 transition-all duration-200 text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 whitespace-nowrap rounded-lg font-semibold text-white shadow-lg flex items-center justify-center min-h-[36px] sm:min-h-[40px]"
          >
            {t('subscriptionPage.renewNow')}
          </button>
        )}
      </div>
    </div>
  );
};
