import React from 'react';
import { AlertCircle, Clock, Calendar } from 'lucide-react';

interface MarketStatusBannerProps {
  isMarketOpen: boolean;
}

export const MarketStatusBanner: React.FC<MarketStatusBannerProps> = ({ isMarketOpen }) => {
  if (isMarketOpen) return null;

  return (
    <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-6 h-6 text-orange-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            السوق مغلق حالياً
          </h3>
          <p className="text-orange-200 text-sm mb-3">
            سوق الفوركس مغلق خلال عطلة نهاية الأسبوع. التوصيات متوقفة مؤقتاً.
          </p>
          <div className="bg-orange-900/30 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm text-orange-100">
              <Clock className="w-4 h-4" />
              <span className="font-semibold">ساعات العمل:</span>
            </div>
            <ul className="text-sm text-orange-200 space-y-1 mr-6">
              <li>• <strong>الأحد 22:00 GMT</strong> → <strong>الجمعة 22:00 GMT</strong></li>
              <li>• السوق مغلق: <strong>السبت والأحد (حتى 22:00 GMT)</strong></li>
            </ul>
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm text-orange-300">
            <span className="inline-block w-2 h-2 bg-orange-400 rounded-full animate-pulse"></span>
            <span>سيتم استئناف التوصيات تلقائياً عند افتتاح السوق</span>
          </div>
        </div>
      </div>
    </div>
  );
};
