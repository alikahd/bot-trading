import React from 'react';
import { AlertTriangle, CreditCard, LogOut, RefreshCw, Clock } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { cn } from '../../styles/designSystem';
import { useLanguage } from '../../contexts/LanguageContext';
import { SubscriptionStatus } from '../../hooks/useSubscriptionStatus';

interface SubscriptionBlockedPageProps {
  subscriptionStatus: SubscriptionStatus;
  onRenewSubscription: () => void;
  onLogout: () => void;
  onRefresh: () => void;
}

export const SubscriptionBlockedPage: React.FC<SubscriptionBlockedPageProps> = ({
  subscriptionStatus,
  onRenewSubscription,
  onLogout,
  onRefresh
}) => {
  const { t, language, dir } = useLanguage();

  const getStatusColor = () => {
    if (subscriptionStatus.isExpired) return 'text-red-400';
    if (subscriptionStatus.isExpiringSoon) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getStatusBadgeVariant = () => {
    if (subscriptionStatus.isExpired) return 'error';
    if (subscriptionStatus.isExpiringSoon) return 'warning';
    return 'success';
  };

  const getStatusText = () => {
    if (subscriptionStatus.isExpired) return t('subscriptionBanner.expiredTitle');
    if (subscriptionStatus.isExpiringSoon) return t('subscriptionWidget.expiringSoon');
    return t('subscriptionWidget.active');
  };

  return (
    <div className={cn("min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4")} dir={dir}>
      <div className={cn("w-full max-w-md")}>
        {/* بطاقة الحجب الرئيسية */}
        <Card variant="glass" padding="lg" className={cn("text-center space-y-6")}>
          {/* أيقونة التحذير */}
          <div className={cn("flex justify-center")}>
            <div className={cn("w-20 h-20 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full flex items-center justify-center border border-red-500/30")}>
              <AlertTriangle className="w-10 h-10 text-red-400" />
            </div>
          </div>

          {/* العنوان الرئيسي */}
          <div className={cn("space-y-2")}>
            <h1 className={cn("text-2xl font-bold text-white")}>
              {subscriptionStatus.isExpired ? t('subscriptionBanner.expiredTitle') : t('subscriptionBlocked.warning')}
            </h1>
            <p className={cn("text-slate-300 text-sm leading-relaxed")}>
              {subscriptionStatus.isExpired 
                ? t('subscriptionBlocked.expiredMessage')
                : t('subscriptionBlocked.expiringSoonMessage')
              }
            </p>
          </div>

          {/* معلومات الاشتراك */}
          <div className={cn("bg-slate-800/50 rounded-lg p-4 space-y-3")}>
            <div className={cn("flex items-center justify-between")}>
              <span className={cn("text-slate-400 text-sm")}>{t('subscriptionBlocked.status')}:</span>
              <Badge variant={getStatusBadgeVariant()} className={cn("px-3 py-1")}>
                {getStatusText()}
              </Badge>
            </div>

            {subscriptionStatus.subscription && (
              <div className={cn("flex items-center justify-between")}>
                <span className={cn("text-slate-400 text-sm")}>{t('subscriptionWidget.planType')}:</span>
                <span className={cn("text-white font-medium text-sm")}>
                  {subscriptionStatus.subscription.plan_name_ar || 
                   subscriptionStatus.subscription.plan_name || 
                   subscriptionStatus.subscription.subscription_plans?.name_ar || 
                   subscriptionStatus.subscription.subscription_plans?.name || 
                   t('subscriptionWidget.unspecifiedPlan')}
                </span>
              </div>
            )}

            <div className={cn("flex items-center justify-between")}>
              <span className={cn("text-slate-400 text-sm")}>{t('subscriptionBlocked.timeRemaining')}:</span>
              <div className={cn("flex items-center gap-2")}>
                <Clock className="w-4 h-4 text-slate-400" />
                <span className={cn("font-mono text-sm", getStatusColor())}>
                  {subscriptionStatus.timeUntilExpiry}
                </span>
              </div>
            </div>

            {/* عد تنازلي مفصل */}
            {!subscriptionStatus.isExpired && (
              <div className={cn("grid grid-cols-3 gap-2 pt-2 border-t border-slate-700")}>
                <div className={cn("text-center")}>
                  <div className={cn("text-lg font-bold text-white")}>
                    {subscriptionStatus.daysRemaining}
                  </div>
                  <div className={cn("text-xs text-slate-400")}>{t('subscriptionPage.days')}</div>
                </div>
                <div className={cn("text-center")}>
                  <div className={cn("text-lg font-bold text-white")}>
                    {subscriptionStatus.hoursRemaining}
                  </div>
                  <div className={cn("text-xs text-slate-400")}>{t('subscriptionPage.hours')}</div>
                </div>
                <div className={cn("text-center")}>
                  <div className={cn("text-lg font-bold text-white")}>
                    {subscriptionStatus.minutesRemaining}
                  </div>
                  <div className={cn("text-xs text-slate-400")}>{t('subscriptionPage.minutes')}</div>
                </div>
              </div>
            )}
          </div>

          {/* الأزرار */}
          <div className={cn("space-y-3")}>
            {/* زر التجديد */}
            <Button
              onClick={onRenewSubscription}
              variant="primary"
              size="lg"
              icon={<CreditCard className="w-5 h-5" />}
              className={cn("w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700")}
            >
              {t('subscriptionBlocked.renewNow')}
            </Button>

            {/* أزرار ثانوية */}
            <div className={cn("grid grid-cols-2 gap-3")}>
              <Button
                onClick={onRefresh}
                variant="secondary"
                size="sm"
                icon={<RefreshCw className="w-4 h-4" />}
                className={cn("flex-1")}
              >
                {t('subscriptionBlocked.refreshStatus')}
              </Button>
              
              <Button
                onClick={onLogout}
                variant="ghost"
                size="sm"
                icon={<LogOut className="w-4 h-4" />}
                className={cn("flex-1 text-slate-400 hover:text-white")}
              >
                {t('subscriptionBlocked.logout')}
              </Button>
            </div>
          </div>

          {/* رسالة المساعدة */}
          <div className={cn("text-xs text-slate-500 leading-relaxed")}>
            {t('subscriptionBlocked.helpMessage')}
          </div>
        </Card>

        {/* معلومات إضافية */}
        <div className={cn("mt-4 text-center")}>
          <p className={cn("text-xs text-slate-600")}>
            {t('subscriptionBlocked.lastUpdate')}: {new Date().toLocaleTimeString(language === 'ar' ? 'ar-SA' : language === 'fr' ? 'fr-FR' : 'en-US')}
          </p>
        </div>
      </div>
    </div>
  );
};
