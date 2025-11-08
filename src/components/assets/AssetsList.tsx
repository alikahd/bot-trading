import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown, Activity, Search } from 'lucide-react';
import { Asset } from '../../types/trading';
import { useLanguage } from '../../contexts/LanguageContext';
import { realTimeDataService, RealTimeQuote } from '../../services/realTimeDataService';

interface AssetsListProps {
  assets?: Asset[];
  isActive: boolean;
}

export const AssetsList: React.FC<AssetsListProps> = ({ assets: propAssets, isActive }) => {
  const { t, dir } = useLanguage();
  const [assets, setAssets] = useState<Asset[]>(propAssets || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'major' | 'crypto' | 'commodities' | 'indices' | 'synthetic' | 'exotic'>('all');
  
  // عدد الخانات العشرية حسب نوع الزوج - دقة عالية
  const getDecimals = (symbol: string) => {
    const upper = symbol.toUpperCase();
    if (upper.includes('BTC') || upper.includes('ETH') || upper.includes('LTC')) return 2; // كريبتو
    if (upper.includes('JPY')) return 3; // أزواج الين
    if (/^[A-Z]{6}/.test(upper)) return 6; // فوركس قياسي - 6 خانات عشرية
    return 6; // افتراضي - 6 خانات عشرية
  };
  
  // الاشتراك في البيانات المباشرة الفورية - يعمل دائماً (حتى لو كان البوت متوقف)
  useEffect(() => {
    
    // بدء خدمة البيانات إذا لم تكن تعمل
    if (!realTimeDataService.isActive()) {
      realTimeDataService.start();
    }
    
    // الاشتراك في خدمة البيانات المباشرة
    const unsubscribe = realTimeDataService.subscribe('assets-list', (realTimeQuotes) => {
      
      // تحويل البيانات إلى تنسيق Asset
      const loadedAssets: Asset[] = Object.values(realTimeQuotes).map((quote: RealTimeQuote) => ({
        symbol: quote.symbol,
        name: quote.symbol.replace('_otc', ''), // إزالة _otc من الاسم - سيظهر badge منفصل
        price: quote.price,
        change: quote.change,
        changePercent: quote.changePercent,
      }));

      setAssets(loadedAssets);
    });

    return () => {
      unsubscribe();
    };
  }, []); // إزالة isActive من dependencies - يعمل دائماً

  // تم استبدال الكود القديم بخدمة البيانات المباشرة الفورية

  // فلترة وبحث الأصول
  const filteredAssets = useMemo(() => {
    let filtered = assets;

    // فلترة حسب النوع
    if (filterType !== 'all') {
      filtered = filtered.filter((asset) => {
        const symbol = asset.symbol.toUpperCase();
        
        if (filterType === 'major') {
          return ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'USDCHF', 'NZDUSD']
            .some(major => symbol.includes(major));
        } else if (filterType === 'crypto') {
          return ['BTC', 'ETH', 'LTC', 'XRP', 'BCH', 'EOS', 'BNB', 'ADA', 'XLM', 'TRX', 'DOT', 'LINK', 'UNI', 'SOL', 'AVAX', 'MATIC'].some(crypto => symbol.includes(crypto));
        } else if (filterType === 'commodities') {
          return ['XAU', 'XAG', 'XPD', 'XPT', 'BRENT', 'WTI', 'NGAS', 'GOLD', 'SILVER', 'OIL'].some(commodity => symbol.includes(commodity));
        } else if (filterType === 'indices') {
          return ['AUS200', 'US500', 'US30', 'JPN225', 'HK50', 'UK100', 'EU50', 'GER40', 'FRA40'].some(index => symbol.includes(index));
        } else if (filterType === 'synthetic') {
          return ['VOL', 'BOOM', 'CRASH', 'JUMP'].some(synthetic => symbol.includes(synthetic));
        } else if (filterType === 'exotic') {
          return ['RUB', 'TRY', 'ZAR', 'MXN', 'BRL', 'SGD', 'HKD', 'KRW', 'INR', 'CNH', 'THB', 'PLN', 'SEK', 'NOK', 'DKK'].some(exotic => symbol.includes(exotic));
        }
        return true;
      });
    }

    // البحث النصي
    if (searchTerm) {
      filtered = filtered.filter((asset) => 
        asset.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // ترتيب أبجدي
    return filtered.sort((a, b) => a.symbol.localeCompare(b.symbol));
  }, [assets, searchTerm, filterType]);
  
  if (!isActive) {
    return (
      <div className="bg-gray-800 dark:bg-gray-800 bg-gray-100 rounded-lg p-3 sm:p-6 text-center w-full" dir={dir}>
        <Activity className="w-8 h-8 sm:w-12 sm:h-12 text-gray-500 mx-auto mb-3 sm:mb-4" />
        <p className="text-gray-400 dark:text-gray-400 text-sm sm:text-base">{t('directives.startBotRecommendations')}</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gray-800 dark:bg-gray-800 bg-gray-100 rounded-lg p-1 sm:p-2 lg:p-3 w-full max-w-full overflow-hidden" dir={dir}>
        {/* الهيدر مع الفلاتر المحسنة */}
        <div className="flex flex-col gap-2 mb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 sm:gap-2">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
              <h2 className="text-sm sm:text-base lg:text-lg font-bold text-white dark:text-white text-gray-900 truncate">
                {t('assets.title')}
              </h2>
              <span className="text-xs text-green-400 animate-pulse" title="مزامنة فورية - كل 3 ثوانٍ">🔄</span>
            </div>
            <span className="px-1.5 py-0.5 bg-green-600 text-white text-xs rounded-full">
              {filteredAssets.length}/{assets.length}
            </span>
          </div>
          
          {/* شريط البحث مصغر */}
          <div className="relative">
            <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('assets.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 sm:pl-10 pr-2 sm:pr-3 py-1 sm:py-2 bg-gray-700/50 border border-gray-600 rounded text-white text-xs sm:text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* قائمة الفلترة المنسدلة */}
          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="filter-select w-full pl-3 pr-10 py-1.5 sm:py-3 bg-gray-700/50 border border-gray-600 rounded text-white text-sm sm:text-base focus:outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer"
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
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* حاوية قابلة للتمرير للأصول مع شريط تمرير مخصص */}
        <div className="max-h-48 sm:max-h-64 lg:max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 pr-2">
          {/* عرض الجدول للشاشات الكبيرة */}
          <div className="hidden md:block">
            <div className="space-y-1.5">
              {filteredAssets.map((asset) => (
                <div 
                  key={asset.symbol}
                  className="flex items-center justify-between p-2 sm:p-3 lg:p-3.5 bg-gray-700 dark:bg-gray-700 bg-gray-200 rounded-lg transition-all duration-300 hover:bg-gray-600/70 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/20 cursor-pointer animate-fade-in"
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-white dark:text-white text-gray-900 text-xs md:text-sm lg:text-base truncate tracking-tight">
                        {asset.name.replace(' OTC', '').replace('OTC', '').replace('_otc', '')}
                      </div>
                      {asset.symbol.includes('_otc') && (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold bg-purple-600/80 text-white rounded">OTC</span>
                      )}
                    </div>
                    <div className="text-[11px] md:text-xs text-gray-400 dark:text-gray-400 text-gray-600">
                      {(() => {
                        const cleanSymbol = asset.symbol.replace('_otc', '');
                        return cleanSymbol.length === 6 
                          ? `${cleanSymbol.slice(0, 3)}/${cleanSymbol.slice(3)}` 
                          : cleanSymbol.length === 7
                          ? `${cleanSymbol.slice(0, 3)}/${cleanSymbol.slice(3)}`
                          : cleanSymbol;
                      })()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-xs md:text-sm lg:text-base text-white dark:text-white text-gray-900">
                      {asset.price.toFixed(getDecimals(asset.symbol))}
                    </div>
                    <div className={`flex items-center justify-end gap-1 text-[11px] md:text-xs ${
                      asset.changePercent >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {asset.changePercent >= 0 ? (
                        <TrendingUp className="w-3 h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4" />
                      ) : (
                        <TrendingDown className="w-3 h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4" />
                      )}
                      {asset.changePercent >= 0 ? '+' : ''}{asset.changePercent.toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* عرض البطاقات مضغوطة جداً للهواتف */}
          <div className="md:hidden">
            <div className="space-y-1">
              {filteredAssets.map((asset) => (
                <div 
                  key={asset.symbol}
                  className="bg-gray-700 dark:bg-gray-700 bg-gray-200 rounded p-2 transition-all duration-300 hover:bg-gray-600/70 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/20 cursor-pointer animate-fade-in"
                >
                  {/* صف واحد مضغوط: اسم الأصل والسعر والتغيير */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <div className="font-medium text-white dark:text-white text-gray-900 text-xs truncate">
                          {asset.name.replace(' OTC', '').replace('OTC', '').replace('_otc', '')}
                        </div>
                        {asset.symbol.includes('_otc') && (
                          <span className="px-1 py-0.5 text-[8px] font-bold bg-purple-600/80 text-white rounded flex-shrink-0">OTC</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-400 text-gray-600">
                        {(() => {
                          const cleanSymbol = asset.symbol.replace('_otc', '');
                          return cleanSymbol.length === 6 
                            ? `${cleanSymbol.slice(0, 3)}/${cleanSymbol.slice(3)}` 
                            : cleanSymbol.length === 7
                            ? `${cleanSymbol.slice(0, 3)}/${cleanSymbol.slice(3)}`
                            : cleanSymbol;
                        })()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="font-mono text-sm text-white dark:text-white text-gray-900">
                        {asset.price.toFixed(getDecimals(asset.symbol))}
                      </div>
                      <div className={`flex items-center gap-1 text-xs px-1 py-0.5 rounded ${
                        asset.changePercent >= 0 
                          ? 'text-green-400 bg-green-900/20' 
                          : 'text-red-400 bg-red-900/20'
                      }`}>
                        {asset.changePercent >= 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {asset.changePercent >= 0 ? '+' : ''}{asset.changePercent.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* رسالة في حالة عدم وجود أصول أو نتائج بحث */}
          {filteredAssets.length === 0 && (
            <div className="text-center py-4 text-gray-400 dark:text-gray-400 text-gray-600">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <div className="text-xs sm:text-sm">
                {searchTerm || filterType !== 'all' 
                  ? t('assets.noResults')
                  : t('assets.noAssets')
                }
              </div>
              {(searchTerm || filterType !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterType('all');
                  }}
                  className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                >
                  {t('assets.clearFilters')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};