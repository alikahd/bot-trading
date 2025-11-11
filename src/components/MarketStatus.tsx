/**
 * 🎯 Market Status Component
 * =======================================
 * مكون لعرض حالة السوق والأسعار المباشرة
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Wifi, WifiOff, Activity, DollarSign, Search, TrendingUp, TrendingDown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { realTimeDataService, RealTimeQuote } from '../services/realTimeDataService';
import { MarketStatusBanner } from './ui/MarketStatusBanner';

// تعريف محلي للأسعار
interface MarketQuote {
  symbol: string;
  bid: number;
  ask: number;
  price: number;
  timestamp: number;
  change: number;
  changePercent: number;
}

export const MarketStatus: React.FC = () => {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const [isConnected, setIsConnected] = useState(false);
  const [quotes, setQuotes] = useState<{ [key: string]: MarketQuote }>({});
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [dataSource, setDataSource] = useState<string>(language === 'ar' ? 'بيانات فورية' : language === 'fr' ? 'Données en temps réel' : 'Real-Time Data');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'major' | 'crypto' | 'commodities' | 'indices' | 'synthetic' | 'exotic'>('all');
  const [isMarketOpen, setIsMarketOpen] = useState(true);

  // التحقق من حالة السوق
  const checkMarketStatus = () => {
    const now = new Date();
    const day = now.getUTCDay();
    const hour = now.getUTCHours();
    
    // يفتح: الأحد 22:00 GMT | يغلق: الجمعة 22:00 GMT
    if (day === 6) return false; // السبت - مغلق
    if (day === 0 && hour < 22) return false; // الأحد قبل 22:00
    if (day === 5 && hour >= 22) return false; // الجمعة بعد 22:00
    
    return true;
  };

  useEffect(() => {

    // بدء خدمة البيانات إذا لم تكن تعمل
    if (!realTimeDataService.isActive()) {

      realTimeDataService.start();
    }
    
    // الاشتراك في خدمة البيانات المباشرة
    const unsubscribe = realTimeDataService.subscribe('market-status', (realTimeQuotes) => {

      // تحويل البيانات إلى تنسيق MarketQuote
      const formattedQuotes: { [key: string]: MarketQuote } = {};
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

    // تحديث حالة السوق
    const marketTimer = setInterval(() => {
      setIsMarketOpen(checkMarketStatus());
    }, 5000);
    
    setIsMarketOpen(checkMarketStatus());

    return () => {

      unsubscribe();
      clearInterval(marketTimer);
    };
  }, [language]);

  const formatPrice = (price: number, symbol: string) => {
    const decimals = symbol.includes('JPY') ? 3 : 6; // 6 خانات عشرية للدقة العالية
    return price.toFixed(decimals);
  };

  const formatChangePercent = (changePercent: number) => {
    const sign = changePercent >= 0 ? '+' : '';
    return `${sign}${changePercent.toFixed(2)}%`;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-400';
    if (change < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  // تصنيف الأزواج
  const categorizeSymbol = (symbol: string): 'major' | 'crypto' | 'commodities' | 'indices' | 'synthetic' | 'exotic' => {
    const cleanSymbol = symbol.replace('_otc', '').replace('_OTC', '');
    
    // الأزواج الرئيسية (Major Pairs)
    const majorPairs = ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD'];
    
    // العملات الرقمية (Cryptocurrencies)
    const cryptoPairs = [
      'BTCUSD', 'ETHUSD', 'BNBUSD', 'XRPUSD', 'ADAUSD', 'SOLUSD', 'DOTUSD', 'MATICUSD',
      'AVAXUSD', 'LINKUSD', 'UNIUSD', 'LTCUSD', 'BCHUSD', 'EOSUSD', 'XLMUSD', 'TRXUSD',
      'ATOMUSD', 'ALGOUSD', 'VETUSD', 'FILUSD', 'XTZUSD', 'EGLDUSD', 'THETAUSD',
      'AXSUSD', 'MANAUSD', 'SANDUSD', 'GRTUSD', 'FTMUSD', 'NEARUSD', 'APEUSD',
      'LDOUSD', 'ARBUSD', 'OPUSD', 'SUIUSD', 'APTUSD'
    ];
    
    // السلع (Commodities)
    const commodities = ['XAUUSD', 'XAGUSD', 'XPDUSD', 'XPTUSD', 'BROUSD', 'WTIOUSD'];
    
    // المؤشرات (Indices)
    const indices = ['AUS200', 'FCHI', 'FTSE', 'GDAXI', 'DJI', 'SPC', 'N225', 'AS51'];
    
    // المؤشرات التركيبية (Synthetic Indices)
    const syntheticIndices = [
      'R_10', 'R_25', 'R_50', 'R_75', 'R_100',
      '1HZ10V', '1HZ25V', '1HZ50V', '1HZ75V', '1HZ100V',
      'BOOM300N', 'BOOM500', 'BOOM1000',
      'CRASH300N', 'CRASH500', 'CRASH1000',
      'JD10', 'JD25', 'JD50', 'JD75', 'JD100', 'JD150', 'JD200', 'JD250',
      'STPRNG', 'WLDAUD', 'WLDEUR', 'WLDGBP', 'WLDUSD', 'WLDXAU'
    ];
    
    if (majorPairs.includes(cleanSymbol)) return 'major';
    if (cryptoPairs.includes(cleanSymbol)) return 'crypto';
    if (commodities.includes(cleanSymbol)) return 'commodities';
    if (indices.includes(cleanSymbol)) return 'indices';
    if (syntheticIndices.includes(cleanSymbol)) return 'synthetic';
    return 'exotic';
  };

  // فلترة وترتيب الأزواج
  const filteredQuotes = useMemo(() => {
    let filtered = Object.entries(quotes);

    // تطبيق الفلتر حسب النوع
    if (filterType !== 'all') {
      filtered = filtered.filter(([symbol]) => categorizeSymbol(symbol) === filterType);
    }

    // تطبيق البحث
    if (searchTerm) {
      filtered = filtered.filter(([symbol]) => 
        symbol.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // ترتيب حسب الأولوية: رئيسية → رقمية → سلع → مؤشرات → تركيبية → ناشئة
    return filtered.sort(([a], [b]) => {
      const categoryA = categorizeSymbol(a);
      const categoryB = categorizeSymbol(b);
      
      // ترتيب الأولوية
      const priorityOrder: { [key: string]: number } = {
        'major': 1,      // الأزواج الرئيسية أولاً
        'crypto': 2,     // العملات الرقمية ثانياً
        'commodities': 3, // السلع ثالثاً
        'indices': 4,    // المؤشرات رابعاً
        'synthetic': 5,  // المؤشرات التركيبية خامساً
        'exotic': 6      // العملات الناشئة أخيراً
      };
      
      const priorityA = priorityOrder[categoryA] || 999;
      const priorityB = priorityOrder[categoryB] || 999;
      
      // إذا كانت الأولوية مختلفة، رتب حسب الأولوية
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // إذا كانت نفس الفئة، رتب أبجدياً
      return a.localeCompare(b);
    });
  }, [quotes, searchTerm, filterType]);

  return (
    <div className="space-y-2 sm:space-y-3" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* رسالة حالة السوق */}
      <MarketStatusBanner isMarketOpen={isMarketOpen} />
      
      <div className="bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-700">
        {/* حالة الاتصال */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {isConnected ? (
            <Wifi className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
          ) : (
            <WifiOff className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
          )}
          <span className="text-white font-semibold text-sm sm:text-base">
            {language === 'ar' ? 'حالة السوق' : language === 'fr' ? 'État du Marché' : 'Market Status'}
          </span>
          <span className="px-1.5 py-0.5 bg-green-600 text-white text-xs rounded-full">
            {filteredQuotes.length}/{Object.keys(quotes).length}
          </span>
        </div>
        
        <div className="flex flex-col items-end gap-0.5 sm:gap-1">
          <span className={`text-xs sm:text-sm font-medium ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
            {isConnected 
              ? (language === 'ar' ? 'متصل' : language === 'fr' ? 'Connecté' : 'Connected')
              : (language === 'ar' ? 'غير متصل' : language === 'fr' ? 'Déconnecté' : 'Disconnected')
            }
          </span>
          <span className="text-[10px] sm:text-xs text-gray-400">{dataSource}</span>
        </div>
      </div>

      {/* آخر تحديث */}
      {lastUpdate && (
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-2 sm:mb-3">
          <Activity className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="text-[10px] sm:text-xs">
            {language === 'ar' ? 'آخر تحديث' : language === 'fr' ? 'Dernière mise à jour' : 'Last update'}: {lastUpdate.toLocaleTimeString()}
          </span>
        </div>
      )}

      {/* شريط البحث والفلاتر */}
      <div className="flex flex-col sm:flex-row gap-2 mb-3 sm:mb-4">
        {/* البحث */}
        <div className="relative flex-1">
          <Search className={`absolute ${isRTL ? 'right-2 sm:right-3' : 'left-2 sm:left-3'} top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400`} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={language === 'ar' ? 'بحث...' : language === 'fr' ? 'Rechercher...' : 'Search...'}
            className={`w-full ${isRTL ? 'pr-8 sm:pr-10 pl-3 sm:pl-4' : 'pl-8 sm:pl-10 pr-3 sm:pr-4'} py-1.5 sm:py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white text-xs sm:text-sm placeholder:text-gray-500 focus:outline-none focus:border-blue-500 focus:bg-gray-700 transition-all`}
          />
        </div>

        {/* الفلاتر */}
        <div className="relative">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className={`filter-select w-full sm:w-auto ${isRTL ? 'pr-3 sm:pr-4 pl-8 sm:pl-10' : 'pl-3 sm:pl-4 pr-8 sm:pr-10'} py-1.5 sm:py-2 rounded-lg text-white text-xs sm:text-sm`}
          >
            <option value="all">{language === 'ar' ? 'الكل' : language === 'fr' ? 'Tous' : 'All'}</option>
            <option value="major">{language === 'ar' ? 'رئيسية' : language === 'fr' ? 'Majeurs' : 'Major'}</option>
            <option value="crypto">{language === 'ar' ? 'مشفرة' : language === 'fr' ? 'Crypto' : 'Crypto'}</option>
            <option value="commodities">{language === 'ar' ? 'سلع' : language === 'fr' ? 'Matières premières' : 'Commodities'}</option>
            <option value="indices">{language === 'ar' ? 'مؤشرات' : language === 'fr' ? 'Indices' : 'Indices'}</option>
            <option value="synthetic">{language === 'ar' ? 'صناعية' : language === 'fr' ? 'Synthétiques' : 'Synthetic'}</option>
            <option value="exotic">{language === 'ar' ? 'نادرة' : language === 'fr' ? 'Exotiques' : 'Exotic'}</option>
          </select>
          <div className={`absolute ${isRTL ? 'left-2 sm:left-3' : 'right-2 sm:right-3'} top-1/2 transform -translate-y-1/2 pointer-events-none`}>
            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* قائمة الأسعار */}
      {isConnected && filteredQuotes.length > 0 && (
        <div className="space-y-1.5 sm:space-y-2 max-h-[50vh] sm:max-h-96 overflow-y-auto scrollbar-hide">
          {filteredQuotes.map(([symbol, quote]) => (
            <div 
              key={symbol}
              className="flex items-center justify-between p-2 sm:p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            >
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-white font-medium text-sm sm:text-base truncate">{symbol}</div>
                  <div className={`text-[10px] sm:text-xs ${getChangeColor(quote.changePercent)}`}>
                    {formatChangePercent(quote.changePercent)}
                  </div>
                </div>
              </div>
              
              <div className="text-right flex-shrink-0">
                <div className={`flex items-center gap-1 font-bold text-sm sm:text-base ${getChangeColor(quote.changePercent)}`}>
                  {quote.changePercent > 0 ? (
                    <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                  ) : quote.changePercent < 0 ? (
                    <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" />
                  ) : null}
                  <span>{formatPrice(quote.price, symbol)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* رسالة عدم وجود نتائج */}
      {isConnected && filteredQuotes.length === 0 && (
        <div className="text-center py-6 sm:py-8">
          <Search className="w-10 h-10 sm:w-12 sm:h-12 text-gray-500 mx-auto mb-2 sm:mb-3" />
          <p className="text-gray-400 text-sm">
            {language === 'ar' ? 'لا توجد نتائج' : language === 'fr' ? 'Aucun résultat' : 'No results found'}
          </p>
        </div>
      )}

      {/* رسالة عدم الاتصال */}
      {!isConnected && (
        <div className="text-center py-3 sm:py-4">
          <WifiOff className="w-6 h-6 sm:w-8 sm:h-8 text-gray-500 mx-auto mb-1.5 sm:mb-2" />
          <p className="text-gray-400 text-xs sm:text-sm">
            {language === 'ar' ? 'جاري محاولة الاتصال...' : language === 'fr' ? 'Tentative de connexion...' : 'Attempting to connect...'}
          </p>
        </div>
      )}
      </div>
    </div>
  );
};

export default MarketStatus;
