import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { Asset } from '../../types/trading';
import { useLanguage } from '../../contexts/LanguageContext';

interface AssetsListProps {
  assets?: Asset[];
  isActive: boolean;
}

export const AssetsList: React.FC<AssetsListProps> = ({ assets: propAssets, isActive }) => {
  const { t, dir } = useLanguage();
  const [assets, setAssets] = useState<Asset[]>(propAssets || []);
  const [filter, setFilter] = useState<'all' | 'regular' | 'otc'>('all');
  
  // عدد الخانات العشرية حسب نوع الزوج
  const getDecimals = (symbol: string) => {
    const upper = symbol.toUpperCase();
    if (upper.includes('BTC') || upper.includes('ETH') || upper.includes('LTC')) return 2; // كريبتو
    if (upper.includes('JPY')) return 3; // أزواج الين
    if (/^[A-Z]{6}$/.test(upper)) return 5; // فوركس قياسي
    return 2; // افتراضي
  };
  
  // تحميل الأصول من API - فقط إذا كان البوت مفعل
  useEffect(() => {
    if (isActive) {
      console.log('🔄 تحميل الأصول...');
      loadAssetsFromAPI();
    }
  }, [isActive]);

  // الاشتراك في التحديثات الفورية لكل أصل - تم تعطيله لتحسين الأداء
  useEffect(() => {
    if (assets.length === 0) return;
    
    console.log('⚠️ تم تعطيل الاشتراك في التحديثات الفورية لتحسين الأداء');
    const unsubscribeFunctions: (() => void)[] = [];
    
    // تم تعطيل الاشتراك الفوري لتقليل الحمل على المتصفح
    // يمكن إعادة تفعيله عند الحاجة
    /*
    assets.forEach((asset) => {
      const unsubscribe = binaryOptionsAPI.subscribeToRealTimeUpdates(
        asset.symbol,
        (quote) => {
          setAssets((prevAssets) => 
            prevAssets.map((a) => 
              a.symbol === quote.symbol
                ? {
                    ...a,
                    price: quote.price,
                    change: quote.change24h,
                    changePercent: quote.changePercent24h,
                  }
                : a
            )
          );
        }
      );
      
      if (unsubscribe) {
        unsubscribeFunctions.push(unsubscribe);
      }
    });
    */
    
    // تنظيف الاشتراكات عند إلغاء المكون
    return () => {
      console.log('🔕 إلغاء الاشتراك في التحديثات الفورية...');
      unsubscribeFunctions.forEach((unsubscribe) => unsubscribe());
    };
  }, [assets.length]); // يعيد الاشتراك عند تغير عدد الأصول


  const loadAssetsFromAPI = async () => {
    console.log('📊 جلب الأصول مباشرة من IQ Option Server...');
    
    try {
      // جلب البيانات مباشرة من الخادم
      const response = await fetch('http://localhost:5001/api/quotes');
      
      if (!response.ok) {
        console.error('❌ فشل الاتصال بالخادم');
        return;
      }
      
      const quotes = await response.json();
      console.log('✅ البيانات المستلمة:', quotes);
      
      // تحويل البيانات إلى تنسيق Asset
      const loadedAssets: Asset[] = Object.entries(quotes).map(([symbol, data]: [string, any]) => ({
        symbol: symbol,
        name: symbol.replace('_otc', ' OTC'),
        price: data.price,
        change: data.change || 0,
        changePercent: data.changePercent || 0,
      }));
      
      console.log(`✅ تم تحميل ${loadedAssets.length} أصل من IQ Option`);
      setAssets(loadedAssets);
      
    } catch (error) {
      console.error('❌ خطأ في جلب الأصول:', error);
      
      // استخدام أصول افتراضية في حالة الخطأ
      const defaultAssets: Asset[] = [
        { symbol: 'EURUSD_otc', name: 'EUR/USD OTC', price: 1.0850, change: 0, changePercent: 0 },
        { symbol: 'GBPUSD_otc', name: 'GBP/USD OTC', price: 1.2650, change: 0, changePercent: 0 },
        { symbol: 'USDJPY_otc', name: 'USD/JPY OTC', price: 149.50, change: 0, changePercent: 0 },
      ];
      console.log('⚠️ استخدام أصول افتراضية');
      setAssets(defaultAssets);
    }
  };

  const filteredAssets = assets.filter(asset => {
    if (filter === 'all') return true;
    if (filter === 'otc') return asset.symbol.includes('-OTC');
    if (filter === 'regular') return !asset.symbol.includes('-OTC');
    return true;
  });
  
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
        {/* الهيدر مع الفلاتر - مضغوط للهواتف */}
        <div className="flex flex-col gap-2 mb-2">
          <div className="flex items-center gap-1 sm:gap-2">
            <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
            <h2 className="text-sm sm:text-base lg:text-lg font-bold text-white dark:text-white text-gray-900 truncate">
              {t('assets.title')}
            </h2>
            <span className="px-1.5 py-0.5 bg-green-600 text-white text-xs rounded-full">
              {filteredAssets.length}
            </span>
            <span className="text-xs text-green-400 animate-pulse" title="تحديث فوري مباشر (كل 500ms)">●</span>
          </div>
          
          {/* فلاتر OTC - خلفية صغيرة جداً للهواتف */}
          <div className="flex gap-1">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 h-5 flex items-center justify-center text-xs font-medium rounded transition-all ${
                filter === 'all' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {t('assets.all')}
            </button>
            <button
              onClick={() => setFilter('regular')}
              className={`flex-1 h-5 flex items-center justify-center text-xs font-medium rounded transition-all ${
                filter === 'regular' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {t('assets.regular')}
            </button>
            <button
              onClick={() => setFilter('otc')}
              className={`flex-1 h-5 flex items-center justify-center text-xs font-medium rounded transition-all ${
                filter === 'otc' ? 'bg-orange-600 text-white shadow-lg' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              OTC
            </button>
          </div>
        </div>

        {/* حاوية قابلة للتمرير للأصول - مضغوطة */}
        <div className="max-h-48 sm:max-h-64 lg:max-h-80 overflow-y-auto pr-1 assets-scroll">
          {/* عرض الجدول للشاشات الكبيرة */}
          <div className="hidden md:block">
            <div className="space-y-1.5">
              {filteredAssets.map((asset) => (
                <div 
                  key={asset.symbol}
                  className="flex items-center justify-between p-2 sm:p-3 lg:p-3.5 bg-gray-700 dark:bg-gray-700 bg-gray-200 rounded-lg transition-all duration-200"
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="font-medium text-white dark:text-white text-gray-900 text-xs md:text-sm lg:text-base truncate tracking-tight">{asset.name}</div>
                    <div className="text-[11px] md:text-xs text-gray-400 dark:text-gray-400 text-gray-600">
                      {asset.symbol.length === 6 
                        ? `${asset.symbol.slice(0, 3)}/${asset.symbol.slice(3)}` 
                        : asset.symbol.length === 7
                        ? `${asset.symbol.slice(0, 3)}/${asset.symbol.slice(3)}`
                        : asset.symbol}
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
                  className="bg-gray-700 dark:bg-gray-700 bg-gray-200 rounded p-2 transition-all duration-200"
                >
                  {/* صف واحد مضغوط: اسم الأصل والسعر والتغيير */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white dark:text-white text-gray-900 text-xs truncate">{asset.name}</div>
                      <div className="text-xs text-gray-400 dark:text-gray-400 text-gray-600">
                        {asset.symbol.length === 6 
                          ? `${asset.symbol.slice(0, 3)}/${asset.symbol.slice(3)}` 
                          : asset.symbol.length === 7
                          ? `${asset.symbol.slice(0, 3)}/${asset.symbol.slice(3)}`
                          : asset.symbol}
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

          {/* رسالة في حالة عدم وجود أصول */}
          {filteredAssets.length === 0 && (
            <div className="text-center py-4 text-gray-400 dark:text-gray-400 text-gray-600">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <div className="text-xs sm:text-sm">{t('assets.noAssets')}</div>
            </div>
          )}
        </div>
      </div>

    </>
  );
};