/**
 * 🎯 Connection Status Component
 * =======================================
 * مكون لعرض حالة الاتصال
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Wifi, WifiOff, Activity, DollarSign, TrendingUp, Search } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { IQOptionQuote } from '../services/iqOptionTypes';
import { realTimeDataService, RealTimeQuote } from '../services/realTimeDataService';

export const IQOptionStatus: React.FC = () => {
  const { language, t } = useLanguage();
  const [isConnected, setIsConnected] = useState(false);
  const [quotes, setQuotes] = useState<{ [key: string]: IQOptionQuote }>({});
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [dataSource, setDataSource] = useState<string>(language === 'ar' ? 'محاكاة' : language === 'fr' ? 'Simulation' : 'Simulation');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'major' | 'crypto' | 'commodities' | 'indices' | 'synthetic' | 'exotic'>('all');

  useEffect(() => {
    console.log('🚀 الاشتراك في البيانات المباشرة الفورية');
    
    // بدء خدمة البيانات إذا لم تكن تعمل
    if (!realTimeDataService.isActive()) {
      console.log('🔌 بدء خدمة البيانات...');
      realTimeDataService.start();
    }
    
    // الاشتراك في خدمة البيانات المباشرة
    const unsubscribe = realTimeDataService.subscribe('iqoption-status', (realTimeQuotes) => {
      console.log('📊 تحديث فوري - IQOptionStatus:', Object.keys(realTimeQuotes).length, 'أسعار');
      
      // تحويل البيانات إلى تنسيق IQOptionQuote
      const formattedQuotes: { [key: string]: IQOptionQuote } = {};
      Object.entries(realTimeQuotes).forEach(([symbol, quote]: [string, RealTimeQuote]) => {
        formattedQuotes[symbol] = {
          symbol: quote.symbol,
          bid: quote.bid,
          ask: quote.ask,
          price: quote.price,
          timestamp: quote.timestamp,
          change: quote.change,
          changePercent: quote.changePercent
        };
      });
      
      setQuotes(formattedQuotes);
      setLastUpdate(realTimeDataService.getLastUpdate());
      setIsConnected(realTimeDataService.isActive());
      setDataSource(language === 'ar' ? 'بيانات فورية' : 
                   language === 'fr' ? 'Données en temps réel' : 
                   'Real-Time Data');
    });

    return () => {
      console.log('🔕 إلغاء الاشتراك - IQOptionStatus');
      unsubscribe();
    };
  }, [language]);

  const formatPrice = (price: number, symbol: string) => {
    const decimals = symbol.includes('JPY') ? 3 : 6; // 6 خانات عشرية للدقة العالية
    return price.toFixed(decimals);
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(6)}`; // 6 خانات عشرية للدقة العالية
  };

  // فلترة وبحث الأسعار
  const filteredQuotes = useMemo(() => {
    let filtered = Object.entries(quotes);

    // فلترة حسب النوع
    if (filterType !== 'all') {
      filtered = filtered.filter(([symbol]) => {
        const upperSymbol = symbol.toUpperCase();
        
        if (filterType === 'major') {
          return ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'USDCHF', 'NZDUSD']
            .some(major => upperSymbol.includes(major));
        } else if (filterType === 'crypto') {
          return ['BTC', 'ETH', 'LTC', 'XRP', 'BCH', 'EOS', 'BNB', 'ADA', 'XLM', 'TRX', 'DOT', 'LINK', 'UNI', 'SOL', 'AVAX', 'MATIC'].some(crypto => upperSymbol.includes(crypto));
        } else if (filterType === 'commodities') {
          return ['XAU', 'XAG', 'XPD', 'XPT', 'BRENT', 'WTI', 'NGAS', 'GOLD', 'SILVER', 'OIL'].some(commodity => upperSymbol.includes(commodity));
        } else if (filterType === 'indices') {
          return ['AUS200', 'US500', 'US30', 'JPN225', 'HK50', 'UK100', 'EU50', 'GER40', 'FRA40'].some(index => upperSymbol.includes(index));
        } else if (filterType === 'synthetic') {
          return ['VOL', 'BOOM', 'CRASH', 'JUMP'].some(synthetic => upperSymbol.includes(synthetic));
        } else if (filterType === 'exotic') {
          return ['RUB', 'TRY', 'ZAR', 'MXN', 'BRL', 'SGD', 'HKD', 'KRW', 'INR', 'CNH', 'THB', 'PLN', 'SEK', 'NOK', 'DKK'].some(exotic => upperSymbol.includes(exotic));
        }
        return true;
      });
    }

    // البحث النصي
    if (searchTerm) {
      filtered = filtered.filter(([symbol]) => 
        symbol.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // ترتيب أبجدي
    return filtered.sort(([a], [b]) => a.localeCompare(b));
  }, [quotes, searchTerm, filterType]);

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      {/* حالة الاتصال */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Wifi className="w-5 h-5 text-green-400" />
          ) : (
            <WifiOff className="w-5 h-5 text-red-400" />
          )}
          <span className="text-white font-semibold">حالة الاتصال</span>
        </div>
        
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
            <span className={`text-sm ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
              {isConnected ? 
                (language === 'ar' ? 'متصل فورياً' : language === 'fr' ? 'Connecté en temps réel' : 'Real-Time Connected') :
                (language === 'ar' ? 'غير متصل' : language === 'fr' ? 'Déconnecté' : 'Disconnected')
              }
            </span>
          </div>
          <span className="text-xs text-gray-400">
            {language === 'ar' ? `المصدر: ${dataSource}` : 
             language === 'fr' ? `Source: ${dataSource}` : 
             `Source: ${dataSource}`}
          </span>
          {lastUpdate && (
            <span className="text-xs text-blue-400">
              {language === 'ar' ? 'آخر تحديث: ' : language === 'fr' ? 'Dernière MAJ: ' : 'Last Update: '}
              {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* الأسعار المباشرة */}
      {isConnected && Object.keys(quotes).length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-gray-300">
                {t('iqoption.livePrices')}
              </span>
              <span className="text-xs text-green-400 animate-pulse" title="مزامنة فورية - كل 3 ثوانٍ">🔄</span>
            </div>
            <span className="text-xs text-gray-400">
              {filteredQuotes.length}/{Object.keys(quotes).length} {t('iqoption.pairs')}
            </span>
          </div>

          {/* شريط البحث والفلترة */}
          <div className="space-y-2 mb-3">
            {/* شريط البحث مصغر جداً */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
              <input
                type="text"
                placeholder={t('iqoption.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-7 pr-2 py-0.5 bg-gray-700/50 border border-gray-600 rounded text-white text-xs placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* قائمة الفلترة المنسدلة */}
            <div className="relative">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="filter-select w-full pl-3 pr-8 py-1.5 sm:py-2.5 bg-gray-700/50 border border-gray-600 rounded text-white text-sm sm:text-base focus:outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer"
              >
                <option value="all">{t('assets.all')}</option>
                <option value="major">{t('assets.major')}</option>
                <option value="crypto">{t('assets.crypto')}</option>
                <option value="commodities">{t('assets.commodities')}</option>
                <option value="indices">المؤشرات</option>
                <option value="synthetic">التركيبية</option>
                <option value="exotic">الناشئة</option>
              </select>
              {/* أيقونة السهم - مع مساحة أكبر */}
              <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* منطقة التمرير للأسعار */}
          <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 pr-2">
            <div className="space-y-2">
              {filteredQuotes.length > 0 ? 
                filteredQuotes.map(([symbol, quote]) => (
                  <div key={symbol} className="flex items-center justify-between p-2 bg-gray-700/50 rounded hover:bg-gray-700/70 transition-colors">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-yellow-400" />
                      <div className="flex flex-col">
                        <span className="text-white font-medium text-sm">
                          {symbol.replace('_otc', '').toUpperCase()}
                        </span>
                        {symbol.includes('_otc') && (
                          <span className="text-[10px] text-purple-400 font-semibold">OTC</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-white font-mono text-sm">
                        {formatPrice(quote.price, symbol)}
                      </div>
                      <div className={`text-xs flex items-center gap-1 ${
                        quote.change >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        <TrendingUp className={`w-3 h-3 ${quote.change < 0 ? 'rotate-180' : ''}`} />
                        {formatChange(quote.change)}
                        {quote.changePercent !== 0 && (
                          <span className="ml-1">
                            ({quote.changePercent >= 0 ? '+' : ''}{quote.changePercent.toFixed(2)}%)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
               : 
                <div className="text-center py-4 text-gray-400 text-sm">
                  {t('iqoption.noResults')}
                </div>
              }
            </div>
          </div>

          {lastUpdate && (
            <div className="text-xs text-gray-400 text-center mt-2 pt-2 border-t border-gray-700">
              {t('iqoption.lastUpdate')}: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
        </div>
      )}

      {/* رسالة عدم الاتصال */}
      {!isConnected && (
        <div className="text-center py-4">
          <WifiOff className="w-8 h-8 text-gray-500 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">
            {t('iqoption.connecting')}
          </p>
        </div>
      )}
    </div>
  );
};

export default IQOptionStatus;
