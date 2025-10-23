import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Database, 
  Activity,
  CheckCircle,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';
// تم حذف marketDataService - البيانات من IQ Option مباشرة
import { useLanguage } from '../../contexts/LanguageContext';
import { API_ENDPOINTS } from '../../config/serverConfig';

interface RealDataToggleProps {
  onToggle?: (enabled: boolean) => void;
}

export const RealDataToggle: React.FC<RealDataToggleProps> = ({ onToggle }) => {
  const [isRealDataEnabled, setIsRealDataEnabled] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const { t, dir, language } = useLanguage();

  useEffect(() => {
    // الاستماع لـ console.log
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    const addLog = (level: string, message: string) => {
      const now = new Date();
      const timestamp = now.toLocaleTimeString(language === 'fr' ? 'fr-FR' : 'en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      const logEntry = `[${timestamp}] ${level}: ${message}`;
      setLogs(prev => [...prev.slice(-19), logEntry]); // آخر 20 سجل
    };

    console.log = (...args) => {
      const message = args.join(' ');
      if (message.includes('🔄') || message.includes('📊') || message.includes('🌐') || 
          message.includes('✅') || message.includes('⚠️') || message.includes('❌') ||
          message.includes('🔍')) {
        addLog('INFO', message);
      }
      originalLog.apply(console, args);
    };

    console.warn = (...args) => {
      const message = args.join(' ');
      if (message.includes('API') || message.includes('البيانات')) {
        addLog('WARN', message);
      }
      originalWarn.apply(console, args);
    };

    console.error = (...args) => {
      const message = args.join(' ');
      if (message.includes('API') || message.includes('البيانات')) {
        addLog('ERROR', message);
      }
      originalError.apply(console, args);
    };

    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, []);

  const handleToggle = () => {
    const newState = !isRealDataEnabled;
    setIsRealDataEnabled(newState);
    // تم حذف marketDataService.setUseRealData - البيانات دائماً حقيقية من IQ Option
    onToggle?.(newState);
    
    // مسح الـ logs عند التبديل
    setLogs([]);
  };

  const testConnection = async () => {
    setIsTestingConnection(true);
    setLogs([]); // مسح الـ logs السابقة
    
    try {
      console.log('🧪 بدء اختبار الاتصال بـ IQ Option Server...');
      
      // اختبار الاتصال بالخادم
      const testSymbols = ['EURUSD_otc', 'GBPUSD_otc', 'EURJPY_otc'];
      
      for (const symbol of testSymbols) {
        console.log(`🔍 اختبار ${symbol}...`);
        
        try {
          // جلب البيانات مباشرة من IQ Option Server
          const response = await fetch(API_ENDPOINTS.quote(symbol));
          
          if (response.ok) {
            const data = await response.json();
            const logMsg = `✅ ${symbol}: متصل - السعر ${data.price}`;
            console.log(logMsg);
            setLogs(prev => [...prev, logMsg]);
          } else {
            const logMsg = `⚠️ ${symbol}: فشل الاتصال`;
            console.warn(logMsg);
            setLogs(prev => [...prev, logMsg]);
          }
        } catch (err) {
          const logMsg = `❌ ${symbol}: خطأ في الاتصال`;
          console.error(logMsg, err);
          setLogs(prev => [...prev, logMsg]);
        }
        
        await new Promise(resolve => setTimeout(resolve, 500)); // انتظار نصف ثانية
      }
      
      const successMsg = '✅ انتهى اختبار الاتصال بنجاح';
      console.log(successMsg);
      setLogs(prev => [...prev, successMsg]);
    } catch (error) {
      const errorMsg = '❌ خطأ عام في اختبار الاتصال';
      console.error(errorMsg, error);
      setLogs(prev => [...prev, errorMsg]);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const getLogColor = (log: string) => {
    if (log.includes('ERROR')) return 'text-red-400';
    if (log.includes('WARN')) return 'text-yellow-400';
    if (log.includes('✅')) return 'text-green-400';
    if (log.includes('❌')) return 'text-red-400';
    if (log.includes('⚠️')) return 'text-yellow-400';
    return 'text-gray-300';
  };

  return (
    <div className="bg-gray-800 rounded-lg p-3 sm:p-4" dir={dir}>
      {/* الهيدر */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <div className={`p-1.5 sm:p-2 rounded-lg ${isRealDataEnabled ? 'bg-green-600' : 'bg-gray-600'} flex-shrink-0`}>
            {isRealDataEnabled ? <Wifi className="w-4 h-4 sm:w-5 sm:h-5 text-white" /> : <WifiOff className="w-4 h-4 sm:w-5 sm:h-5 text-white" />}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-white truncate">{t('data.source')}</h3>
            <p className="text-xs sm:text-sm text-gray-300 truncate">
              {isRealDataEnabled ? t('data.realEnabled') : t('data.simEnabled')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setShowLogs(!showLogs)}
            className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
              showLogs ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            title={t('data.toggleLogs')}
          >
            {showLogs ? <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" /> : <Eye className="w-3 h-3 sm:w-4 sm:h-4" />}
          </button>
        </div>
      </div>

      {/* أزرار التحكم */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-3 sm:mb-4">
        <button
          onClick={handleToggle}
          className={`flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-lg transition-colors text-sm sm:text-base ${
            isRealDataEnabled
              ? 'bg-orange-600 hover:bg-orange-700 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          <Database className="w-3 h-3 sm:w-4 sm:h-4" />
          {isRealDataEnabled ? t('data.disableReal') : t('data.enableReal')}
        </button>

        <button
          onClick={testConnection}
          disabled={isTestingConnection || !isRealDataEnabled}
          className="flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm sm:text-base"
        >
          <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${isTestingConnection ? 'animate-spin' : ''}`} />
          {isTestingConnection ? t('data.testing') : t('data.testConnection')}
        </button>
      </div>

      {/* حالة البيانات */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mb-3 sm:mb-4">
        <div className="bg-gray-700/50 p-2 sm:p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-1 sm:mb-2">
            <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-medium text-white truncate">{t('data.status')}</span>
          </div>
          <div className={`text-xs sm:text-sm truncate ${isRealDataEnabled ? 'text-green-400' : 'text-gray-400'}`}>
            {isRealDataEnabled ? t('data.realTime') : t('data.simulated')}
          </div>
        </div>

        <div className="bg-gray-700/50 p-2 sm:p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-1 sm:mb-2">
            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-medium text-white truncate">{t('data.logs')}</span>
          </div>
          <div className="text-xs sm:text-sm text-gray-300 truncate">
            {logs.length} {t('data.entries')}
          </div>
        </div>
      </div>

      {/* عرض السجلات */}
      {showLogs && (
        <div className="bg-gray-900/50 rounded-lg p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <h4 className="text-xs sm:text-sm font-semibold text-white truncate">{t('data.liveDataLog')}</h4>
            <button
              onClick={clearLogs}
              className="text-xs text-gray-400 hover:text-white transition-colors flex-shrink-0 ml-2"
            >
              {t('data.clearLogs')}
            </button>
          </div>
          
          <div className="max-h-40 sm:max-h-60 overflow-y-auto space-y-1">
            {logs.length === 0 ? (
              <div className="text-center text-gray-500 text-xs sm:text-sm py-3 sm:py-4">
                {t('data.noLogsYet')}
              </div>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className={`text-xs font-mono p-1.5 sm:p-2 rounded bg-gray-800/50 ${getLogColor(log)} break-words`}
                >
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      )}

     

      {!isRealDataEnabled && (
        <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-blue-900/30 border border-blue-600/30 rounded-lg">
          <div className="flex items-start gap-2 text-blue-400 text-xs sm:text-sm">
            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              {t('data.simulatedSafeNote')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
