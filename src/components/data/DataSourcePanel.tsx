import React, { useState, useEffect } from 'react';
import { Database, Wifi, WifiOff, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface DataSourcePanelProps {
  isVisible: boolean;
  onClose: () => void;
}

export const DataSourcePanel: React.FC<DataSourcePanelProps> = ({ isVisible, onClose }) => {
  const [useRealData, setUseRealData] = useState(true);
  const [apiLimits, setApiLimits] = useState<any>({});
  const { t, dir } = useLanguage();

  useEffect(() => {
    if (isVisible) {
      // تحديث حالة حدود الطلبات كل 10 ثوانٍ
      const updateLimits = () => {
        const limits = { message: 'البيانات الحقيقية من API' };
        setApiLimits(limits);
      };

      updateLimits();
      const interval = setInterval(updateLimits, 10000);

      return () => clearInterval(interval);
    }
  }, [isVisible]);

  const handleDataSourceToggle = (useReal: boolean) => {
    setUseRealData(useReal);
  };

  const getStatusColor = (canMakeRequest: boolean, requestsUsed: number, requestsLimit: number) => {
    if (!canMakeRequest) return 'text-red-400';
    if (requestsUsed / requestsLimit > 0.8) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getStatusIcon = (canMakeRequest: boolean) => {
    return canMakeRequest ? (
      <CheckCircle className="w-4 h-4 text-green-400" />
    ) : (
      <AlertTriangle className="w-4 h-4 text-red-400" />
    );
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 sm:p-4" dir={dir}>
      <div className="bg-gray-800 rounded-lg p-3 sm:p-6 w-full sm:max-w-6xl max-h-[100vh] sm:max-h-[90vh] overflow-y-auto mx-0 sm:mx-4">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <Database className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">{t('data.manageSources')}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white dark:text-gray-400 dark:hover:text-white text-gray-600 hover:text-gray-900 transition-colors p-1 text-xl sm:text-base"
          >
            ✕
          </button>
        </div>

        {/* تبديل مصدر البيانات */}
        <div className="bg-gray-700 dark:bg-gray-700 bg-gray-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">{t('data.source')}</h3>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <button
              onClick={() => handleDataSourceToggle(true)}
              className={`flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-lg transition-colors text-sm sm:text-base ${
                useRealData 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              <Wifi className="w-3 h-3 sm:w-4 sm:h-4" />
              {t('data.realTime')}
            </button>
            <button
              onClick={() => handleDataSourceToggle(false)}
              className={`flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-lg transition-colors text-sm sm:text-base ${
                !useRealData 
                  ? 'bg-orange-600 text-white' 
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              <WifiOff className="w-3 h-3 sm:w-4 sm:h-4" />
              {t('data.simulated')}
            </button>
          </div>
          <p className="text-xs sm:text-sm text-gray-400 mt-2">
            {useRealData ? t('data.usingRealDesc') : t('data.usingSimDesc')}
          </p>
        </div>

        {/* حالة APIs */}
        {useRealData && apiLimits && typeof apiLimits === 'object' && !apiLimits.message && (
          <div className="bg-gray-700 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">{t('data.apiStatusTitle')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {Object.entries(apiLimits).map(([apiName, data]: [string, any]) => (
                <div key={apiName} className="bg-gray-600 rounded-lg p-2 sm:p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-white capitalize text-sm sm:text-base truncate">
                      {apiName.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    {getStatusIcon(data.canMakeRequest)}
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <Clock className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <span className={`${getStatusColor(data.canMakeRequest, data.requestsUsed, data.requestsLimit)} truncate`}>
                      {data.requestsUsed}/{data.requestsLimit} {t('data.requestsPerMinute')}
                    </span>
                  </div>
                  <div className="w-full bg-gray-500 rounded-full h-1.5 sm:h-2 mt-2">
                    <div 
                      className={`h-1.5 sm:h-2 rounded-full transition-all ${
                        data.requestsUsed / data.requestsLimit > 0.8 
                          ? 'bg-red-500' 
                          : data.requestsUsed / data.requestsLimit > 0.6 
                          ? 'bg-yellow-500' 
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${(data.requestsUsed / data.requestsLimit) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* معلومات APIs */}
        <div className="bg-gray-700 rounded-lg p-3 sm:p-4">
          <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">{t('data.supportedApisInfo')}</h3>
          <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 bg-gray-600 rounded gap-1 sm:gap-0">
              <span className="text-white font-medium">Twelve Data</span>
              <span className="text-gray-400 text-xs sm:text-sm">{t('data.api.twelvedata.desc')}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 bg-gray-600 rounded gap-1 sm:gap-0">
              <span className="text-white font-medium">Binance</span>
              <span className="text-gray-400 text-xs sm:text-sm">{t('data.api.binance.desc')}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 bg-gray-600 rounded gap-1 sm:gap-0">
              <span className="text-white font-medium">Metal API</span>
              <span className="text-gray-400 text-xs sm:text-sm">{t('data.api.metal.desc')}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 bg-gray-600 rounded gap-1 sm:gap-0">
              <span className="text-white font-medium">Alpha Vantage</span>
              <span className="text-gray-400 text-xs sm:text-sm">{t('data.api.alphavantage.desc')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
