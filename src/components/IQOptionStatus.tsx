/**
 * 🎯 IQ Option Connection Status Component
 * =======================================
 * مكون لعرض حالة الاتصال مع IQ Option
 */

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Activity, DollarSign, TrendingUp } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { IQOptionQuote } from '../services/iqOptionTypes';

export const IQOptionStatus: React.FC = () => {
  const { language } = useLanguage();
  const [isConnected, setIsConnected] = useState(false);
  const [quotes, setQuotes] = useState<{ [key: string]: IQOptionQuote }>({});
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [dataSource, setDataSource] = useState<string>(language === 'ar' ? 'محاكاة' : language === 'fr' ? 'Simulation' : 'Simulation');

  useEffect(() => {
    // جلب البيانات مباشرة من IQ Option Server
    const fetchRealData = async () => {
      try {
        console.log('📊 جلب بيانات IQ Option من الخادم...');
        const response = await fetch('http://localhost:5001/api/quotes');
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ تم استلام البيانات من IQ Option:', data);
          
          setIsConnected(true);
          setDataSource('IQ Option Real Data');
          
          // تحويل البيانات إلى تنسيق IQOptionQuote
          const formattedQuotes: { [key: string]: IQOptionQuote } = {};
          Object.entries(data).forEach(([symbol, quoteData]: [string, any]) => {
            formattedQuotes[symbol] = {
              symbol: symbol,
              bid: quoteData.bid || quoteData.price * 0.99999,
              ask: quoteData.ask || quoteData.price * 1.00001,
              price: quoteData.price,
              timestamp: Date.now(),
              change: quoteData.change || 0,
              changePercent: quoteData.changePercent || 0
            };
          });
          
          setQuotes(formattedQuotes);
          setLastUpdate(new Date());
          
          console.log(`✅ تم تحميل ${Object.keys(formattedQuotes).length} سعر من IQ Option`);
        } else {
          console.warn('⚠️ فشل الاتصال بخادم IQ Option');
          setIsConnected(false);
          setDataSource('غير متصل');
        }
      } catch (error) {
        console.error('❌ خطأ في جلب البيانات:', error);
        setIsConnected(false);
        setDataSource('خطأ في الاتصال');
      }
    };

    // جلب فوري عند البدء
    fetchRealData();

    // تحديث كل 30 ثانية (تقليل الطلبات)
    const updateInterval = setInterval(fetchRealData, 30000);

    return () => {
      clearInterval(updateInterval);
    };
  }, []);

  const formatPrice = (price: number, symbol: string) => {
    const decimals = symbol.includes('JPY') ? 3 : 5;
    return price.toFixed(decimals);
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(5)}`;
  };

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
          <span className="text-white font-semibold">IQ Option</span>
        </div>
        
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className={`text-sm ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
              {isConnected ? 
                (language === 'ar' ? 'متصل' : language === 'fr' ? 'Connecté' : 'Connected') :
                (language === 'ar' ? 'غير متصل' : language === 'fr' ? 'Déconnecté' : 'Disconnected')
              }
            </span>
          </div>
          <span className="text-xs text-gray-400">
            {language === 'ar' ? `المصدر: ${dataSource}` : 
             language === 'fr' ? `Source: ${dataSource}` : 
             `Source: ${dataSource}`}
          </span>
        </div>
      </div>

      {/* الأسعار المباشرة */}
      {isConnected && Object.keys(quotes).length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-gray-300">
              {language === 'ar' ? 'الأسعار المباشرة' : 
               language === 'fr' ? 'Prix en direct' : 
               'Live Prices'}
            </span>
          </div>

          {Object.entries(quotes).map(([symbol, quote]) => (
            <div key={symbol} className="flex items-center justify-between p-2 bg-gray-700/50 rounded">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-yellow-400" />
                <span className="text-white font-medium">{symbol.replace('_otc', '')}</span>
              </div>
              
              <div className="text-right">
                <div className="text-white font-mono">
                  {formatPrice(quote.price, symbol)}
                </div>
                <div className={`text-xs flex items-center gap-1 ${
                  quote.change >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  <TrendingUp className={`w-3 h-3 ${quote.change < 0 ? 'rotate-180' : ''}`} />
                  {formatChange(quote.change)}
                </div>
              </div>
            </div>
          ))}

          {lastUpdate && (
            <div className="text-xs text-gray-400 text-center mt-2">
              {language === 'ar' ? 'آخر تحديث' : 
               language === 'fr' ? 'Dernière mise à jour' : 
               'Last update'}: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
        </div>
      )}

      {/* رسالة عدم الاتصال */}
      {!isConnected && (
        <div className="text-center py-4">
          <WifiOff className="w-8 h-8 text-gray-500 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">
            {language === 'ar' ? 'جاري محاولة الاتصال بـ IQ Option...' :
             language === 'fr' ? 'Tentative de connexion à IQ Option...' :
             'Attempting to connect to IQ Option...'}
          </p>
        </div>
      )}
    </div>
  );
};

export default IQOptionStatus;
