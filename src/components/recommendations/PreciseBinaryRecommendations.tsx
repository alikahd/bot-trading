import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Target,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  BarChart3,
  Zap,
  Pause,
  Play,
  ChevronDown,
  ChevronUp,
  Volume2,
  VolumeX
} from 'lucide-react';
import { advancedAnalysisEngine } from '../../services/advancedAnalysis';
import { useLanguage } from '../../contexts/LanguageContext';
import { notificationSound } from '../../services/notificationSound';
import { MarketStatusBanner } from '../ui/MarketStatusBanner';

// تعريف النوع محلياً
interface BinaryOptionRecommendation {
  id: string;
  symbol: string;
  symbolName: string;
  direction: 'CALL' | 'PUT';
  confidence: number;
  timeframe: string;
  expiryMinutes: 1 | 2 | 3 | 5;
  entryTime: Date;
  expiryTime: Date;
  currentPrice: number;
  targetPrice: number;
  reasoning: string;
  riskLevel: string;
  successProbability: number;
  indicators: any;
}

interface PreciseBinaryRecommendationsProps {
  isActive: boolean;
}

export const PreciseBinaryRecommendations: React.FC<PreciseBinaryRecommendationsProps> = ({ isActive }) => {
  const { t, language, dir } = useLanguage();
  const [recommendations, setRecommendations] = useState<BinaryOptionRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isPaused, setIsPaused] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedTimeframes, setSelectedTimeframes] = useState<number[]>([1, 2, 3, 5]); // جميع الأطر مفعلة افتراضياً
  const [allRecommendations, setAllRecommendations] = useState<BinaryOptionRecommendation[]>([]); // جميع التوصيات
  const [showTimeframeFilter, setShowTimeframeFilter] = useState(false); // إظهار/إخفاء قائمة التصفية
  const [currentRecommendationIndex, setCurrentRecommendationIndex] = useState(0); // مؤشر التوصية الحالية للإرسال
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
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setIsMarketOpen(checkMarketStatus());
    }, 1000);

    setIsMarketOpen(checkMarketStatus());

    return () => clearInterval(timer);
  }, []);

  // جلب التوصيات عند التحميل - فقط إذا كان البوت مفعل
  useEffect(() => {
    if (isActive && !isPaused) {
      loadRecommendations();
    }
  }, [isActive]);

  // تحديث التوصيات كل دقيقة
  useEffect(() => {
    if (!isActive || isPaused) return;
    
    const interval = setInterval(() => {
      if (!isPaused) {
        loadRecommendations();
      }
    }, 60000); // 60 ثانية - تحديث قائمة التوصيات

    return () => clearInterval(interval);
  }, [isActive, isPaused]);

  // إرسال توصية واحدة كل 5 ثواني إلى Telegram
  useEffect(() => {
    if (!isActive || isPaused || allRecommendations.length === 0) return;
    
    const sendInterval = setInterval(() => {
      if (!isPaused && allRecommendations.length > 0) {
        // الانتقال للتوصية التالية (دائري)
        setCurrentRecommendationIndex((prevIndex) => 
          (prevIndex + 1) % allRecommendations.length
        );
      }
    }, 5000); // 5 ثواني

    return () => clearInterval(sendInterval);
  }, [isActive, isPaused, allRecommendations, currentRecommendationIndex]);

  // تصفية التوصيات حسب الأطر الزمنية المختارة
  useEffect(() => {
    const filtered = allRecommendations.filter(rec => 
      selectedTimeframes.includes(rec.expiryMinutes)
    );
    setRecommendations(filtered);
  }, [allRecommendations, selectedTimeframes]);

  // إغلاق القائمة عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showTimeframeFilter && !target.closest('.timeframe-filter-container')) {
        setShowTimeframeFilter(false);
      }
    };

    if (showTimeframeFilter) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showTimeframeFilter]);

  const loadRecommendations = async () => {
    if (!isActive || isPaused) {

      return;
    }
    
    setIsLoading(true);
    try {

      // استخدام المحرك المتقدم للتحليل (يستخدم بيانات Binary.com WebSocket)
      const signals = await advancedAnalysisEngine.analyzeAllSymbols();

      if (signals.length === 0) {

        setIsLoading(false);
        return;
      }
      
      // تحويل الإشارات إلى تنسيق التوصيات الدقيقة - عرض المزيد من التوصيات
      const recs: BinaryOptionRecommendation[] = signals.slice(0, 12).map((signal) => ({
        id: `${signal.symbol}-${Date.now()}`,
        symbol: signal.symbol,
        symbolName: signal.symbol.replace('_OTC', '').replace('_otc', ''), // إزالة OTC إذا وجد
        direction: signal.direction,
        confidence: Math.round(signal.confidence),
        timeframe: `${signal.timeframe}m`,
        expiryMinutes: signal.timeframe as 1 | 2 | 3 | 5,
        entryTime: new Date(Date.now() + 120000), // بعد دقيقتين - وقت كافٍ للمستخدم
        expiryTime: new Date(Date.now() + 120000 + signal.timeframe * 60000), // بعد وقت الدخول + مدة الصفقة
        currentPrice: signal.entry_price,
        targetPrice: signal.direction === 'CALL' ? 
          signal.entry_price * 1.001 : 
          signal.entry_price * 0.999,
        reasoning: signal.reasoning.join(' • '),
        riskLevel: signal.risk_level === 'LOW' ? 'منخفض' : 
                  signal.risk_level === 'MEDIUM' ? 'متوسط' : 'عالي',
        successProbability: Math.round(signal.expected_success_rate),
        indicators: {
          rsi: Math.round(signal.indicators.rsi || 50),
          macd: {
            value: signal.indicators.macd?.macd || 0,
            signal: signal.indicators.macd?.signal || 0,
            histogram: signal.indicators.macd?.histogram || 0
          },
          ema: {
            fast: signal.indicators.ema12 || 0,
            slow: signal.indicators.ema26 || 0
          },
          bollingerBands: {
            upper: signal.indicators.bollinger?.upper || 0,
            middle: signal.indicators.bollinger?.middle || 0,
            lower: signal.indicators.bollinger?.lower || 0
          },
          trend: signal.market_analysis.trend === 'bullish' ? 'صاعد' :
                signal.market_analysis.trend === 'bearish' ? 'هابط' : 'جانبي',
          momentum: (signal.indicators.macd?.histogram || 0) > 0 ? 'قوي' : 'ضعيف'
        }
      }));

      // تشغيل صوت التنبيه إذا كانت هناك توصيات جديدة (فقط إذا كان مفعلاً)
      if (soundEnabled) {
        if (recs.length > 0 && recommendations.length === 0) {
          // توصيات جديدة للمرة الأولى
          notificationSound.play();

        } else if (recs.length > recommendations.length) {
          // زيادة في عدد التوصيات
          notificationSound.play();

        }
      }

      // ترتيب التوصيات حسب الثقة (الأفضل أولاً)
      const sortedRecs = recs.sort((a, b) => b.confidence - a.confidence);
      
      setAllRecommendations(sortedRecs);
      setLastUpdate(new Date());
      
      // إعادة تعيين المؤشر عند تحديث التوصيات
      setCurrentRecommendationIndex(0);
    } catch (error) {

      // لا نمسح التوصيات القديمة - نبقيها حتى نحصل على جديدة
      // setRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  };
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const getTimeUntilEntry = (entryTime: Date) => {
    const diff = entryTime.getTime() - currentTime.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    if (diff < 0) return t('precise.now');
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-400';
    if (confidence >= 80) return 'text-blue-400';
    if (confidence >= 75) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getRiskColor = (risk: string) => {
    if (risk === t('precise.riskLow') || risk === 'منخفض') return 'text-green-400';
    if (risk === t('precise.riskMedium') || risk === 'متوسط') return 'text-yellow-400';
    return 'text-red-400';
  };

  const translateRiskLevel = (risk: string) => {
    if (!risk) return '';
    const r = risk.toLowerCase();
    
    // ترجمة من العربية إلى اللغة المحددة
    if (r.includes('منخفض')) return t('precise.riskLow');
    if (r.includes('متوسط')) return t('precise.riskMedium');
    if (r.includes('عالي')) return t('precise.riskHigh');
    
    // ترجمة من الإنجليزية إلى اللغة المحددة
    if (r.includes('low')) return t('precise.riskLow');
    if (r.includes('medium') || r.includes('moderate')) return t('precise.riskMedium');
    if (r.includes('high')) return t('precise.riskHigh');
    
    return risk;
  };

  const translateSymbolName = (symbolName: string) => {
    if (!symbolName) return '';
    
    const translations: { [key: string]: { en: string; fr: string; ar: string } } = {
      'يورو/دولار': { 
        en: 'Euro/US Dollar', 
        fr: 'Euro/Dollar Américain', 
        ar: 'اليورو/الدولار الأمريكي' 
      },
      'جنيه/دولار': { 
        en: 'British Pound/US Dollar', 
        fr: 'Livre Sterling/Dollar Américain', 
        ar: 'الجنيه الإسترليني/الدولار الأمريكي' 
      },
      'دولار/ين': { 
        en: 'US Dollar/Japanese Yen', 
        fr: 'Dollar Américain/Yen Japonais', 
        ar: 'الدولار الأمريكي/الين الياباني' 
      },
      'دولار أسترالي/دولار': { 
        en: 'Australian Dollar/US Dollar', 
        fr: 'Dollar Australien/Dollar Américain', 
        ar: 'الدولار الأسترالي/الدولار الأمريكي' 
      },
      'دولار/دولار كندي': { 
        en: 'US Dollar/Canadian Dollar', 
        fr: 'Dollar Américain/Dollar Canadien', 
        ar: 'الدولار الأمريكي/الدولار الكندي' 
      },
      'دولار/فرنك': { 
        en: 'US Dollar/Swiss Franc', 
        fr: 'Dollar Américain/Franc Suisse', 
        ar: 'الدولار الأمريكي/الفرنك السويسري' 
      },
      'دولار نيوزيلندي/دولار': { 
        en: 'New Zealand Dollar/US Dollar', 
        fr: 'Dollar Néo-Zélandais/Dollar Américain', 
        ar: 'الدولار النيوزيلندي/الدولار الأمريكي' 
      },
      'يورو/جنيه': { 
        en: 'Euro/British Pound', 
        fr: 'Euro/Livre Sterling', 
        ar: 'اليورو/الجنيه الإسترليني' 
      },
      'يورو/ين': { 
        en: 'Euro/Japanese Yen', 
        fr: 'Euro/Yen Japonais', 
        ar: 'اليورو/الين الياباني' 
      },
      'جنيه/ين': { 
        en: 'British Pound/Japanese Yen', 
        fr: 'Livre Sterling/Yen Japonais', 
        ar: 'الجنيه الإسترليني/الين الياباني' 
      },
      'دولار أسترالي/ين': { 
        en: 'Australian Dollar/Japanese Yen', 
        fr: 'Dollar Australien/Yen Japonais', 
        ar: 'الدولار الأسترالي/الين الياباني' 
      },
      'ذهب/دولار': { 
        en: 'Gold/US Dollar', 
        fr: 'Or/Dollar Américain', 
        ar: 'الذهب/الدولار الأمريكي' 
      },
      'فضة/دولار': { 
        en: 'Silver/US Dollar', 
        fr: 'Argent/Dollar Américain', 
        ar: 'الفضة/الدولار الأمريكي' 
      }
    };
    
    const translation = translations[symbolName];
    if (translation) {
      return language === 'ar' ? translation.ar : language === 'fr' ? translation.fr : translation.en;
    }
    
    return symbolName;
  };

  // Translate indicator value tokens into current language
  const translateTrend = (value: string) => {
    if (!value) return '';
    const v = value.toLowerCase();
    
    // ترجمة من العربية إلى اللغة المحددة
    if (v.includes('صاعد')) return t('signals.bullish');
    if (v.includes('هابط')) return t('signals.bearish');
    if (v.includes('جانبي')) return t('signals.sideways');
    
    // ترجمة من الإنجليزية إلى اللغة المحددة
    if (v.includes('bull')) return t('signals.bullish');
    if (v.includes('bear')) return t('signals.bearish');
    if (v.includes('side')) return t('signals.sideways');
    
    return value;
  };

  const translateMomentum = (value: string | number) => {
    if (typeof value !== 'string') return String(value);
    const v = value.toLowerCase();
    
    // ترجمة من العربية إلى اللغة المحددة
    if (v.includes('قوي')) return t('signals.strong');
    if (v.includes('إيجابي')) return t('signals.positive');
    if (v.includes('سلبي')) return t('signals.negative');
    if (v.includes('متوسط')) return t('signals.momentum');
    if (v.includes('ضعيف')) return t('signals.decreasing');
    
    // ترجمة من الإنجليزية إلى اللغة المحددة
    if (v.includes('strong')) return t('signals.strong');
    if (v.includes('positive')) return t('signals.positive');
    if (v.includes('negative')) return t('signals.negative');
    if (v.includes('medium')) return t('signals.momentum');
    if (v.includes('weak')) return t('signals.decreasing');
    
    return value;
  };

  const translateReason = (text: string) => {
    if (!text) return '';
    
    let translatedText = text;
    
    // ترجمة المصطلحات العربية والإنجليزية إلى اللغة المحددة
    const translations = [
      // جمل كاملة - يجب أن تكون في البداية
      [/RSI\s+في\s+منطقة\s+التشبع\s+البيعي/gi, `RSI ${t('signals.oversold')}`],
      [/RSI\s+في\s+منطقة\s+التشبع\s+الشرائي/gi, `RSI ${t('signals.overbought')}`],
      [/MACD\s+إيجابي\s+وصاعد/gi, `MACD ${t('signals.positive')} ${language === 'ar' ? 'و' : language === 'fr' ? 'et' : 'and'} ${t('signals.bullish')}`],
      [/MACD\s+سلبي\s+وهابط/gi, `MACD ${t('signals.negative')} ${language === 'ar' ? 'و' : language === 'fr' ? 'et' : 'and'} ${t('signals.bearish')}`],
      [/EMA\s+السريع\s+فوق\s+البطيء/gi, `EMA fast ${language === 'ar' ? 'فوق' : language === 'fr' ? 'au-dessus' : 'above'} slow`],
      [/EMA\s+السريع\s+تحت\s+البطيء/gi, `EMA fast ${language === 'ar' ? 'تحت' : language === 'fr' ? 'en dessous' : 'below'} slow`],
      [/السعر\s+قرب\s+النطاق\s+السفلي/gi, `${language === 'ar' ? 'السعر قرب' : language === 'fr' ? 'Prix près de' : 'Price near'} ${t('signals.lower')} band`],
      [/السعر\s+قرب\s+النطاق\s+العلوي/gi, `${language === 'ar' ? 'السعر قرب' : language === 'fr' ? 'Prix près de' : 'Price near'} ${t('signals.upper')} band`],
      [/في\s*منطقة\s*التشبع\s*البيعي/gi, t('signals.oversold')],
      [/في\s*منطقة\s*التشبع\s*الشرائي/gi, t('signals.overbought')],
      [/في\s*منطقة/gi, language === 'ar' ? 'في منطقة' : language === 'fr' ? 'dans la zone' : 'in zone'],
      [/منطقة/gi, language === 'ar' ? 'منطقة' : language === 'fr' ? 'zone' : 'zone'],
      [/فوق/gi, language === 'ar' ? 'فوق' : language === 'fr' ? 'au-dessus' : 'above'],
      [/تحت/gi, language === 'ar' ? 'تحت' : language === 'fr' ? 'en dessous' : 'below'],
      [/قرب/gi, language === 'ar' ? 'قرب' : language === 'fr' ? 'près de' : 'near'],
      [/النطاق/gi, language === 'ar' ? 'النطاق' : language === 'fr' ? 'bande' : 'band'],
      [/السعر/gi, language === 'ar' ? 'السعر' : language === 'fr' ? 'Prix' : 'Price'],
      [/السريع/gi, language === 'ar' ? 'السريع' : language === 'fr' ? 'rapide' : 'fast'],
      [/البطيء/gi, language === 'ar' ? 'البطيء' : language === 'fr' ? 'lent' : 'slow'],
      
      // الاتجاهات
      [/صاعد|bullish/gi, t('signals.bullish')],
      [/هابط|bearish/gi, t('signals.bearish')],
      [/جانبي|sideways/gi, t('signals.sideways')],
      
      // مستويات RSI
      [/تشبع\s*بيعي|oversold/gi, t('signals.oversold')],
      [/تشبع\s*شرائي|overbought/gi, t('signals.overbought')],
      [/التشبع/gi, 'oversaturation'],
      
      // الدعم والمقاومة
      [/دعم|support/gi, t('signals.support')],
      [/مقاومة|resistance/gi, t('signals.resistance')],
      
      // الزخم والقوة
      [/زخم|momentum/gi, t('signals.momentum')],
      [/إيجابي|positive/gi, t('signals.positive')],
      [/سلبي|negative/gi, t('signals.negative')],
      [/قوي|strong/gi, t('signals.strong')],
      [/ضعيف|weak/gi, t('signals.decreasing')],
      [/متوسط|medium|moderate/gi, t('signals.momentum')],
      
      // الاتجاه والتقاطع
      [/اتجاه|trend/gi, t('signals.trend')],
      [/تقاطع|crossover/gi, t('signals.crossover')],
      
      // مستويات بولينجر
      [/علوي|upper/gi, t('signals.upper')],
      [/سفلي|lower/gi, t('signals.lower')],
      
      // متزايد ومتناقص
      [/متزايد|increasing/gi, t('signals.increasing')],
      [/متناقص|decreasing/gi, t('signals.decreasing')],
      
      // حجم التداول
      [/حجم\s*التداول|volume/gi, t('signals.volume')],
      
      // مؤشرات فنية
      [/ستوكاستيك|stochastic/gi, t('signals.stochastic')],
      [/بولينجر|bollinger/gi, t('signals.bollinger')],
      
      // كلمات ربط
      [/و/g, language === 'ar' ? 'و' : language === 'fr' ? 'et' : 'and']
    ];
    
    // تطبيق جميع الترجمات
    translations.forEach(([pattern, replacement]) => {
      translatedText = translatedText.replace(pattern as RegExp, replacement as string);
    });
    
    return translatedText;
  };

  if (!isActive) {
    return (
      <div className="bg-gray-800 dark:bg-gray-800 bg-gray-100 rounded-lg p-3 sm:p-6 text-center w-full" dir={dir}>
        <Target className="w-8 h-8 sm:w-12 sm:h-12 text-gray-500 mx-auto mb-3 sm:mb-4" />
        <p className="text-gray-400 dark:text-gray-400 text-sm sm:text-base">{t('directives.startBotRecommendations')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 sm:space-y-3" dir={dir}>
      {/* رسالة حالة السوق */}
      <MarketStatusBanner isMarketOpen={isMarketOpen} />
      
      {/* الهيدر */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <div className="p-1 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex-shrink-0">
            <Target className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <h2 className="text-sm sm:text-lg font-bold text-white truncate">{t('precise.title')}</h2>
              {recommendations.length > 0 && (
                <span className="px-1.5 py-0.5 bg-purple-600 text-white text-[10px] rounded-full flex-shrink-0">
                  {recommendations.length}
                </span>
              )}
            </div>
            <p className="text-[10px] sm:text-xs text-gray-400 truncate">
              {lastUpdate ? `${formatTime(lastUpdate)}` : t('precise.loading')}
              {isPaused && <span className="ml-1 text-yellow-400">⏸</span>}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-5 sm:gap-2 flex-shrink-0">
          <button
            onClick={() => {
              const newState = !soundEnabled;
              setSoundEnabled(newState);
              notificationSound.setEnabled(newState);
              // تشغيل صوت اختبار عند التفعيل
              if (newState) {
                notificationSound.play();
              }
            }}
            className="icon-btn hover:opacity-70 transition-opacity"
            title={soundEnabled ? (language === 'ar' ? 'تعطيل الصوت' : language === 'fr' ? 'Désactiver le son' : 'Mute') : (language === 'ar' ? 'تفعيل الصوت' : language === 'fr' ? 'Activer le son' : 'Unmute')}
          >
            {soundEnabled ? (
              <Volume2 className="w-5 h-5 sm:w-5 sm:h-5 text-green-400" />
            ) : (
              <VolumeX className="w-5 h-5 sm:w-5 sm:h-5 text-gray-400" />
            )}
          </button>
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="icon-btn hover:opacity-70 transition-opacity"
            title={isPaused ? (language === 'ar' ? 'استئناف' : language === 'fr' ? 'Reprendre' : 'Resume') : (language === 'ar' ? 'إيقاف' : language === 'fr' ? 'Pause' : 'Pause')}
          >
            {isPaused ? (
              <Play className="w-5 h-5 sm:w-5 sm:h-5 text-green-400" />
            ) : (
              <Pause className="w-5 h-5 sm:w-5 sm:h-5 text-yellow-400" />
            )}
          </button>
          <button
            onClick={loadRecommendations}
            disabled={isLoading}
            className="icon-btn hover:opacity-70 transition-opacity disabled:opacity-30"
          >
            <RefreshCw className={`w-5 h-5 sm:w-5 sm:h-5 text-purple-400 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* الوقت الحالي */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg p-2 sm:p-3 border border-blue-500/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
            <span className="text-xs sm:text-sm text-gray-300">{t('precise.currentTime')}:</span>
          </div>
          <span className="text-base sm:text-xl font-bold text-white font-mono">
            {formatTime(currentTime)}
          </span>
        </div>
      </div>

      {/* تصفية الأطر الزمنية - قائمة منسدلة مدمجة */}
      <div className="relative timeframe-filter-container">
        <button
          onClick={() => setShowTimeframeFilter(!showTimeframeFilter)}
          className="w-full bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-lg p-2 sm:p-3 border border-purple-500/30 hover:border-purple-500/50 transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-semibold text-gray-300">
              {language === 'ar' ? 'تصفية المدة' : language === 'fr' ? 'Filtrer durée' : 'Filter Duration'}
            </span>
            <span className="text-[10px] sm:text-xs text-gray-400">
              ({recommendations.length}/{allRecommendations.length})
            </span>
          </div>
          <div className="flex items-center gap-1">
            {selectedTimeframes.length < 4 && (
              <div className="flex gap-1">
                {selectedTimeframes.map(tf => (
                  <span key={tf} className="px-1.5 py-0.5 bg-purple-600 text-white text-[10px] rounded">
                    {tf}{language === 'ar' ? 'د' : 'm'}
                  </span>
                ))}
              </div>
            )}
            {showTimeframeFilter ? (
              <ChevronUp className="w-4 h-4 text-purple-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-purple-400" />
            )}
          </div>
        </button>

        {/* القائمة المنسدلة */}
        {showTimeframeFilter && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 rounded-lg border border-purple-500/30 shadow-lg shadow-purple-500/20 z-50 overflow-hidden animate-fade-in">
            <div className="p-2 sm:p-3">
              <div className="flex gap-1 sm:gap-1.5 mb-2">
                {[1, 2, 3, 5].map(timeframe => {
                  const count = allRecommendations.filter(r => r.expiryMinutes === timeframe).length;
                  const isSelected = selectedTimeframes.includes(timeframe);
                  return (
                    <button
                      key={timeframe}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedTimeframes(prev => prev.filter(t => t !== timeframe));
                        } else {
                          setSelectedTimeframes(prev => [...prev, timeframe].sort());
                        }
                      }}
                      className={`filter-btn flex-1 px-1.5 py-1.5 sm:px-2 sm:py-2 rounded text-[11px] sm:text-xs font-medium transition-all flex items-center justify-center gap-1 sm:gap-1.5 ${
                        isSelected
                          ? 'bg-purple-600 text-white border border-purple-400'
                          : 'bg-gray-700/50 text-gray-400 border border-gray-600 hover:bg-gray-700'
                      }`}
                    >
                      {isSelected && <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />}
                      <span className="whitespace-nowrap">{timeframe}{language === 'ar' ? 'د' : language === 'fr' ? 'min' : 'm'}</span>
                      {count > 0 && (
                        <span className={`px-1.5 py-0.5 rounded-full text-[8px] sm:text-[9px] font-semibold leading-none flex-shrink-0 ${
                          isSelected ? 'bg-purple-800/80 text-white' : 'bg-gray-600/80 text-gray-200'
                        }`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => {
                  setSelectedTimeframes([1, 2, 3, 5]);
                  setShowTimeframeFilter(false);
                }}
                className="filter-btn w-full px-2 py-1.5 sm:px-3 sm:py-2 rounded text-[11px] sm:text-xs font-medium bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 transition-all"
              >
                {language === 'ar' ? 'تحديد الكل' : language === 'fr' ? 'Tout sélectionner' : 'Select All'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* التوصيات مع شريط التنقل */}
      {isLoading && recommendations.length === 0 ? (
        <div className="text-center py-6 sm:py-8">
          <RefreshCw className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400 animate-spin mx-auto mb-2 sm:mb-3" />
          <p className="text-xs sm:text-sm text-gray-400">{t('precise.analyzing')}</p>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="text-center py-6 sm:py-8 bg-gray-800/50 rounded-lg border border-gray-700">
          <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400 mx-auto mb-2 sm:mb-3" />
          <p className="text-xs sm:text-sm text-gray-400">{t('precise.noRecommendations')}</p>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-1 sm:mt-2">{t('precise.tryLater')}</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto scrollbar-hide pr-2">
          {/* مؤشر التحديث */}
          {isLoading && recommendations.length > 0 && (
            <div className="bg-purple-600/10 border border-purple-500/30 rounded-lg p-2 mb-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-purple-400 animate-spin" />
                <span className="text-xs text-purple-300">
                  {language === 'ar' ? 'جاري تحديث التوصيات...' : 
                   language === 'fr' ? 'Mise à jour des recommandations...' : 
                   'Updating recommendations...'}
                </span>
              </div>
            </div>
          )}
          
          {/* عرض جميع التوصيات مع شريط تمرير */}
          {recommendations.map((rec, index) => (
            <div
              key={`${rec.symbol}-${index}`}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-2.5 sm:p-4 border border-purple-500/30 hover:border-purple-500/50 hover:shadow-purple-500/20 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 shadow-lg cursor-pointer animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* الهيدر */}
              <div className="flex items-start justify-between mb-2 sm:mb-3">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className={`p-1.5 sm:p-2 rounded-lg ${
                    rec.direction === 'CALL' 
                      ? 'bg-green-500/20 border border-green-500/50' 
                      : 'bg-red-500/20 border border-red-500/50'
                  }`}>
                    {rec.direction === 'CALL' ? (
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                    ) : (
                      <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-white">
                        {rec.symbol.replace('_otc', '').length === 6 
                          ? `${rec.symbol.replace('_otc', '').slice(0, 3)}/${rec.symbol.replace('_otc', '').slice(3)}` 
                          : rec.symbol.replace('_otc', '').length === 7
                          ? `${rec.symbol.replace('_otc', '').slice(0, 3)}/${rec.symbol.replace('_otc', '').slice(3)}`
                          : rec.symbol.replace('_otc', '')}
                      </h3>
                      {rec.symbol.includes('_otc') && (
                        <span className="px-1.5 py-0.5 text-[8px] sm:text-[9px] font-bold bg-purple-600/80 text-white rounded">OTC</span>
                      )}
                    </div>
                    <p className="text-[10px] sm:text-xs text-gray-400">
                      {translateSymbolName(rec.symbolName.replace(' OTC', '').replace('OTC', ''))}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`text-base sm:text-lg font-bold ${
                    rec.direction === 'CALL' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {rec.direction === 'CALL' ? '📈' : '📉'}
                  </div>
                  <div className="text-[10px] sm:text-xs text-gray-400">
                    {rec.expiryMinutes}{t('precise.minutes')}
                  </div>
                </div>
              </div>

              {/* معلومات التوقيت */}
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                <div className="bg-blue-600/10 rounded-lg p-2 sm:p-3 border border-blue-500/30">
                  <div className="flex items-center gap-1 sm:gap-2 mb-1">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                    <span className="text-[10px] sm:text-xs text-gray-400">{t('precise.entryTime')}</span>
                  </div>
                  <div className="text-sm sm:text-lg font-bold text-white font-mono">
                    {formatTime(rec.entryTime)}
                  </div>
                  <div className="text-[10px] sm:text-xs text-blue-400 mt-1">
                    {t('precise.after')} {getTimeUntilEntry(rec.entryTime)}
                  </div>
                </div>

                <div className="bg-purple-600/10 rounded-lg p-2 sm:p-3 border border-purple-500/30">
                  <div className="flex items-center gap-1 sm:gap-2 mb-1">
                    <Target className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
                    <span className="text-[10px] sm:text-xs text-gray-400">{t('precise.currentPrice')}</span>
                  </div>
                  <div className="text-sm sm:text-lg font-bold text-white">
                    {rec.currentPrice.toFixed(5)}
                  </div>
                  <div className="text-[10px] sm:text-xs text-purple-400 mt-1">
                    {t('precise.target')}: {rec.targetPrice.toFixed(5)}
                  </div>
                </div>
              </div>

              {/* نسب النجاح والثقة */}
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                <div className="bg-gray-700/50 rounded-lg p-2 sm:p-3 text-center">
                  <div className="text-[10px] sm:text-xs text-gray-400 mb-1">{t('precise.successRate')}</div>
                  <div className={`text-base sm:text-xl font-bold ${getConfidenceColor(rec.successProbability)}`}>
                    {rec.successProbability}%
                  </div>
                </div>

                <div className="bg-gray-700/50 rounded-lg p-2 sm:p-3 text-center">
                  <div className="text-[10px] sm:text-xs text-gray-400 mb-1">{t('precise.confidence')}</div>
                  <div className={`text-base sm:text-xl font-bold ${getConfidenceColor(rec.confidence)}`}>
                    {rec.confidence}%
                  </div>
                </div>

                <div className="bg-gray-700/50 rounded-lg p-2 sm:p-3 text-center">
                  <div className="text-[10px] sm:text-xs text-gray-400 mb-1">{t('precise.risk')}</div>
                  <div className={`text-xs sm:text-sm font-bold ${getRiskColor(rec.riskLevel)}`}>
                    {translateRiskLevel(rec.riskLevel)}
                  </div>
                </div>
              </div>

              {/* المؤشرات الفنية */}
              <div className="bg-gray-700/30 rounded-lg p-2 sm:p-3 mb-2 sm:mb-3">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-400" />
                  <span className="text-xs sm:text-sm font-semibold text-gray-300">{t('precise.technicalIndicators')}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 sm:gap-3 text-[10px] sm:text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">RSI:</span>
                    <span className={`font-bold ${
                      rec.indicators.rsi < 30 ? 'text-green-400' :
                      rec.indicators.rsi > 70 ? 'text-red-400' : 'text-yellow-400'
                    }`}>
                      {rec.indicators.rsi.toFixed(1)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">{t('precise.trend')}:</span>
                    <span className="font-bold text-cyan-400">{translateTrend(rec.indicators.trend)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">MACD:</span>
                    <span className={`font-bold ${
                      rec.indicators.macd.histogram > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {rec.indicators.macd.histogram > 0 ? 'إيجابي' : 'سلبي'} ({rec.indicators.macd.histogram.toFixed(5)})
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">{t('precise.momentum')}:</span>
                    <span className="font-bold text-purple-400">{translateMomentum(rec.indicators.momentum)}</span>
                  </div>
                </div>
              </div>

              {/* السبب */}
              <div className="bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-lg p-2 sm:p-3 border border-purple-500/30">
                <div className="flex items-start gap-2">
                  <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-[10px] sm:text-xs text-gray-400 mb-1">{t('precise.reason')}:</div>
                    <div className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                      {translateReason(rec.reasoning)}
                    </div>
                  </div>
                </div>
              </div>

              {/* تحذير */}
              {(rec.riskLevel?.includes('عالي') || rec.riskLevel?.toLowerCase().includes('high') || rec.riskLevel === t('precise.riskHigh')) && (
                <div className="mt-2 sm:mt-3 bg-red-600/10 border border-red-500/30 rounded-lg p-2 flex items-start gap-2">
                  <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-[10px] sm:text-xs text-red-300">
                    {t('precise.warning')}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* نصائح مهمة - قابلة للطي */}
      <div className="bg-blue-600/10 border border-blue-500/30 rounded-lg overflow-hidden">
        <button
          onClick={() => setShowTips(!showTips)}
          className="w-full p-2 sm:p-3 flex items-center justify-between hover:bg-blue-600/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 flex-shrink-0" />
            <p className="font-semibold text-blue-400 text-xs sm:text-sm">{t('precise.tips')}</p>
          </div>
          {showTips ? (
            <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
          ) : (
            <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
          )}
        </button>
        
        {showTips && (
          <div className="px-3 pb-3 sm:px-4 sm:pb-4 pt-0">
            <ul className="space-y-1 text-[10px] sm:text-xs text-gray-300 leading-relaxed">
              <li>{t('precise.tip1')}</li>
              <li>{t('precise.tip2')}</li>
              <li>{t('precise.tip3')}</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

