import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown, Activity, Search } from 'lucide-react';
import { Asset } from '../../types/trading';
import { useLanguage } from '../../contexts/LanguageContext';
import { realTimeDataService, RealTimeQuote } from '../../services/realTimeDataService';
import { MarketStatusBanner } from '../ui/MarketStatusBanner';

interface AssetsListProps {
  assets?: Asset[];
  isActive: boolean;
}

export const AssetsList: React.FC<AssetsListProps> = ({ assets: propAssets, isActive }) => {
  const { t, dir } = useLanguage();
  const [assets, setAssets] = useState<Asset[]>(propAssets || []);
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

    // تحديث حالة السوق
    const marketTimer = setInterval(() => {
      setIsMarketOpen(checkMarketStatus());
    }, 5000);
    
    setIsMarketOpen(checkMarketStatus());

    return () => {
      unsubscribe();
      clearInterval(marketTimer);
    };
  }, []); // إزالة isActive من dependencies - يعمل دائماً

  // تم استبدال الكود القديم بخدمة البيانات المباشرة الفورية

  // تصنيف الأصول
  const categorizeAsset = (symbol: string): 'major' | 'crypto' | 'commodities' | 'indices' | 'synthetic' | 'exotic' => {
    const cleanSymbol = symbol.replace('_otc', '').replace('_OTC', '').toUpperCase();
    
    // الأزواج الرئيسية
    const majorPairs = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'USDCHF', 'NZDUSD'];
    
    // العملات الرقمية
    const cryptoPairs = [
      'BTCUSD', 'ETHUSD', 'BNBUSD', 'XRPUSD', 'ADAUSD', 'SOLUSD', 'DOTUSD', 'MATICUSD',
      'AVAXUSD', 'LINKUSD', 'UNIUSD', 'LTCUSD', 'BCHUSD', 'EOSUSD', 'XLMUSD', 'TRXUSD',
      'ATOMUSD', 'ALGOUSD', 'VETUSD', 'FILUSD', 'XTZUSD', 'EGLDUSD', 'THETAUSD',
      'AXSUSD', 'MANAUSD', 'SANDUSD', 'GRTUSD', 'FTMUSD', 'NEARUSD', 'APEUSD',
      'LDOUSD', 'ARBUSD', 'OPUSD', 'SUIUSD', 'APTUSD'
    ];
    
    // السلع
    const commodities = ['XAUUSD', 'XAGUSD', 'XPDUSD', 'XPTUSD', 'BROUSD', 'WTIOUSD'];
    
    // المؤشرات
    const indices = ['AUS200', 'FCHI', 'FTSE', 'GDAXI', 'DJI', 'SPC', 'N225', 'AS51'];
    
    // المؤشرات التركيبية
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

  // فلترة وبحث الأصول
  const filteredAssets = useMemo(() => {
    let filtered = assets;

    // فلترة حسب النوع
    if (filterType !== 'all') {
      filtered = filtered.filter((asset) => categorizeAsset(asset.symbol) === filterType);
    }

    // البحث النصي
    if (searchTerm) {
      filtered = filtered.filter((asset) => 
        asset.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // ترتيب حسب الأولوية: رئيسية → رقمية → سلع → مؤشرات → تركيبية → ناشئة
    return filtered.sort((a, b) => {
      const categoryA = categorizeAsset(a.symbol);
      const categoryB = categorizeAsset(b.symbol);
      
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
      return a.symbol.localeCompare(b.symbol);
    });
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
      {/* رسالة حالة السوق */}
      <MarketStatusBanner isMarketOpen={isMarketOpen} />
      
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
              className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white text-xs sm:text-sm placeholder:text-gray-500 focus:outline-none focus:border-blue-500 focus:bg-gray-700 transition-all"
            />
          </div>

          {/* قائمة الفلترة المنسدلة */}
          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="filter-select w-full px-3 sm:px-4 py-1.5 sm:py-2 pr-8 sm:pr-10 rounded-lg text-white text-xs sm:text-sm"
            >
              <option value="all">{t('assets.all')}</option>
              <option value="major">{t('assets.major')}</option>
              <option value="crypto">{t('assets.crypto')}</option>
              <option value="commodities">{t('assets.commodities')}</option>
              <option value="indices">المؤشرات</option>
              <option value="synthetic">التركيبية</option>
              <option value="exotic">الناشئة</option>
            </select>
            <div className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* حاوية قابلة للتمرير للأصول مع شريط تمرير مخفي */}
        <div className="max-h-48 sm:max-h-64 lg:max-h-80 overflow-y-auto scrollbar-hide">
          {/* عرض الجدول للشاشات الكبيرة */}
          <div className="hidden md:block">
            <div className="space-y-1.5 sm:space-y-2">
              {filteredAssets.map((asset) => (
                <div 
                  key={asset.symbol}
                  className="flex items-center justify-between p-2 sm:p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="text-white font-medium text-sm sm:text-base truncate">
                          {asset.name.replace(' OTC', '').replace('OTC', '').replace('_otc', '')}
                        </div>
                        {asset.symbol.includes('_otc') && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold bg-purple-600/80 text-white rounded flex-shrink-0">OTC</span>
                        )}
                      </div>
                      <div className={`text-[10px] sm:text-xs ${
                        asset.changePercent >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {asset.changePercent >= 0 ? '+' : ''}{asset.changePercent.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right flex-shrink-0">
                    <div className={`flex items-center gap-1 font-bold text-sm sm:text-base ${
                      asset.changePercent >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {asset.changePercent >= 0 ? (
                        <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                      ) : (
                        <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" />
                      )}
                      <span>{asset.price.toFixed(getDecimals(asset.symbol))}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* عرض البطاقات مضغوطة جداً للهواتف */}
          <div className="md:hidden">
            <div className="space-y-1.5">
              {filteredAssets.map((asset) => (
                <div 
                  key={asset.symbol}
                  className="flex items-center justify-between p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Activity className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <div className="text-white font-medium text-sm truncate">
                          {asset.name.replace(' OTC', '').replace('OTC', '').replace('_otc', '')}
                        </div>
                        {asset.symbol.includes('_otc') && (
                          <span className="px-1 py-0.5 text-[8px] font-bold bg-purple-600/80 text-white rounded flex-shrink-0">OTC</span>
                        )}
                      </div>
                      <div className={`text-[10px] ${
                        asset.changePercent >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {asset.changePercent >= 0 ? '+' : ''}{asset.changePercent.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right flex-shrink-0">
                    <div className={`flex items-center gap-1 font-bold text-sm ${
                      asset.changePercent >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {asset.changePercent >= 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      <span>{asset.price.toFixed(getDecimals(asset.symbol))}</span>
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