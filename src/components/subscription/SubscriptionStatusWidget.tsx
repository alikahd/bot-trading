import React from 'react';
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  CreditCard,
  Timer,
  TrendingUp,
  Shield,
  Calendar
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { cn } from '../../styles/designSystem';
import { SubscriptionStatus } from '../../hooks/useSubscriptionStatus';
import { useLanguage } from '../../contexts/LanguageContext';

interface SubscriptionStatusWidgetProps {
  status: SubscriptionStatus;
  onViewDetails?: () => void;
  onRenew?: () => void;
  compact?: boolean;
}

export const SubscriptionStatusWidget: React.FC<SubscriptionStatusWidgetProps> = ({
  status,
  onViewDetails,
  onRenew,
  compact = false
}) => {
  const { t, language } = useLanguage();

  const getStatusConfig = () => {
    if (status.isExpired) {
      return {
        color: 'text-red-400',
        bgColor: 'bg-red-500/10 border-red-500/30',
        icon: <AlertTriangle className="w-5 h-5" />,
        text: t('subscriptionWidget.expired'),
        variant: 'error' as const
      };
    }
    
    if (status.isExpiringSoon) {
      return {
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/10 border-yellow-500/30',
        icon: <Clock className="w-5 h-5" />,
        text: t('subscriptionWidget.expiringSoon'),
        variant: 'warning' as const
      };
    }
    
    return {
      color: 'text-green-400',
      bgColor: 'bg-green-500/10 border-green-500/30',
      icon: <CheckCircle className="w-5 h-5" />,
      text: t('subscriptionWidget.active'),
      variant: 'success' as const
    };
  };

  const statusConfig = getStatusConfig();

  if (compact) {
    return (
      <Card variant="glass" padding="sm" className={cn("border", statusConfig.bgColor)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={statusConfig.color}>
              {statusConfig.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-medium text-sm">{t('subscriptionWidget.subscription')}:</span>
                <Badge variant={statusConfig.variant} className="text-xs">
                  {statusConfig.text}
                </Badge>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {status.timeUntilExpiry}
              </div>
            </div>
          </div>
          
          {onViewDetails && (
            <Button
              onClick={onViewDetails}
              variant="ghost"
              size="sm"
              className="text-xs"
            >
              {t('subscriptionWidget.details')}
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card variant="glass" padding="md" className={cn("border", statusConfig.bgColor)}>
      <div className="space-y-4">
        {/* العنوان والحالة */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={statusConfig.color}>
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{t('subscriptionPage.subscriptionStatus')}</h3>
              <Badge variant={statusConfig.variant} className="mt-1">
                {statusConfig.text}
              </Badge>
            </div>
          </div>
          
          <div className={statusConfig.color}>
            {statusConfig.icon}
          </div>
        </div>

        {/* معلومات الاشتراك */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-slate-400" />
            <span className="text-slate-300 font-medium">
              {status.timeUntilExpiry}
            </span>
          </div>

          {/* عد تنازلي مفصل */}
          {!status.isExpired && (
            <div className="bg-slate-800/30 rounded-lg p-3">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-xl font-bold text-white">
                    {status.daysRemaining}
                  </div>
                  <div className="text-xs text-slate-400">{t('subscriptionPage.days')}</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-white">
                    {status.hoursRemaining}
                  </div>
                  <div className="text-xs text-slate-400">{t('subscriptionPage.hours')}</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-white">
                    {status.minutesRemaining}
                  </div>
                  <div className="text-xs text-slate-400">{t('subscriptionPage.minutes')}</div>
                </div>
              </div>
            </div>
          )}

          {/* معلومات الباقة */}
          {status.subscription && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-slate-400" />
                <span className="text-slate-300 text-sm">
                  {t('subscriptionWidget.planType')}: {status.subscription.subscription_plans?.name_ar || 
                             status.subscription.subscription_plans?.name || 
                             t('subscriptionWidget.unspecifiedPlan')}
                </span>
              </div>
              
              {status.subscription.end_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-300 text-sm">
                    {t('subscriptionWidget.expiresOn')}: {new Date(status.subscription.end_date).toLocaleDateString(language === 'ar' ? 'ar-SA' : language === 'fr' ? 'fr-FR' : 'en-US')}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* الأزرار */}
        <div className="flex gap-2 pt-2 border-t border-slate-700">
          {onViewDetails && (
            <Button
              onClick={onViewDetails}
              variant="secondary"
              size="sm"
              className="flex-1"
            >
              {t('subscriptionWidget.viewDetails')}
            </Button>
          )}
          
          {(status.isExpired || status.isExpiringSoon) && onRenew && (
            <Button
              onClick={onRenew}
              variant="primary"
              size="sm"
              icon={<CreditCard className="w-4 h-4" />}
              className="flex-1"
            >
              {t('subscriptionWidget.renewNow')}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
