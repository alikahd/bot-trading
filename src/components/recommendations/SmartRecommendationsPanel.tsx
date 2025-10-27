import React, { useState, useEffect } from 'react';
import { 
  Star, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Clock,
  Shield,
  Zap,
  Award,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  BarChart3,
  Pause,
  Play
} from 'lucide-react';
import { advancedAnalysisEngine } from '../../services/advancedAnalysis';
import { useLanguage } from '../../contexts/LanguageContext';

// تعريف النوع محلياً
interface CurrencyRecommendation {
  symbol: string;
  name: string;
  score: number;
  confidence: number;
  expectedWinRate: number;
  riskLevel: string;
  marketCondition: string;
  nextSignalProbability: number;
  timeframes: Array<{
    duration: number;
    confidence: number;
    expectedDirection: string;
    strength: number;
  }>;
  reasons: string[];
  lastUpdate: Date;
  validUntil: Date;
  entryTime: Date;
  expiryTime: Date;
}

interface SmartRecommendationsPanelProps {
  isActive: boolean;
}

export const SmartRecommendationsPanel: React.FC<SmartRecommendationsPanelProps> = ({ isActive }) => {
  const { t, dir, language } = useLanguage();
  const [recommendations, setRecommendations] = useState<CurrencyRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState<CurrencyRecommendation | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 5000); // تحديث كل 5 ثوانٍ بدلاً من كل ثانية

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isActive) {
      loadRecommendations();
      // تحديث كل 30 ثانية لتقليل الحمل (إذا لم يكن متوقفاً)
      const interval = setInterval(() => {
        if (!isPaused) {
          loadRecommendations();
        }
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [isActive, isPaused]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      console.log('🚀 بدء تحليل التوصيات الذكية من IQ Option...');
      console.log('✅ مصدر البيانات: IQ Option Real Data (بيانات حقيقية)');
      console.log('🎯 الحد الأدنى للثقة: 55% (مع نظام احتياطي عند 45%)');
      
      // استخدام المحرك المتقدم للتحليل (بيانات حقيقية من IQ Option)
      const signals = await advancedAnalysisEngine.analyzeAllSymbols();
      
      console.log(`📊 تم إنشاء ${signals.length} إشارة من المحرك المتقدم`);
      
      // تحويل الإشارات إلى تنسيق التوصيات - عرض المزيد من التوصيات
      const recs: CurrencyRecommendation[] = signals.slice(0, 6).map((signal) => ({
        symbol: signal.symbol,
        name: signal.symbol.replace('_otc', ' OTC'),
        score: Math.round(signal.confidence),
        confidence: Math.round(signal.confidence),
        expectedWinRate: Math.round(signal.expected_success_rate),
        riskLevel: signal.risk_level,
        marketCondition: signal.market_analysis.trend === 'bullish' ? 'TRENDING' : 
                        signal.market_analysis.trend === 'bearish' ? 'TRENDING' : 'RANGING',
        nextSignalProbability: Math.round(signal.confidence * 0.8), // تقدير احتمال الإشارة التالية
        timeframes: [
          {
            duration: signal.timeframe as 1 | 2 | 3 | 5,
            confidence: Math.round(signal.confidence),
            expectedDirection: signal.direction,
            strength: Math.round(signal.market_analysis.strength)
          },
          {
            duration: (signal.timeframe === 5 ? 5 : signal.timeframe * 2) as 1 | 2 | 3 | 5,
            confidence: Math.round(signal.confidence * 0.9),
            expectedDirection: signal.direction,
            strength: Math.round(signal.market_analysis.strength * 0.8)
          }
        ],
        reasons: signal.reasoning,
        lastUpdate: new Date(),
        validUntil: new Date(Date.now() + 15 * 60 * 1000), // صالح لمدة 15 دقيقة
        entryTime: new Date(Date.now() + Math.random() * 60000), // وقت دخول عشوائي خلال الدقيقة القادمة
        expiryTime: new Date(Date.now() + signal.timeframe * 60000) // وقت انتهاء بناءً على الإطار الزمني
      }));
      
      console.log(`✅ تم تحليل ${recs.length} توصية ذكية من أصل ${signals.length} إشارة`);
      if (recs.length > 0) {
        console.log(`📈 نطاق الثقة: ${Math.min(...recs.map(r => r.confidence))}% - ${Math.max(...recs.map(r => r.confidence))}%`);
        console.log(`🎯 متوسط الثقة: ${Math.round(recs.reduce((sum, r) => sum + r.confidence, 0) / recs.length)}%`);
      }
      setRecommendations(recs);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('❌ خطأ في تحميل التوصيات:', error);
      setRecommendations([]);
      setLastUpdate(null);
    } finally {
      setLoading(false);
    }
  };
  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 50) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 75) return 'bg-green-500/20 border-green-500/30';
    if (score >= 60) return 'bg-yellow-500/20 border-yellow-500/30';
    if (score >= 50) return 'bg-orange-500/20 border-orange-500/30';
    return 'bg-red-500/20 border-red-500/30';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'text-green-400';
      case 'MEDIUM': return 'text-yellow-400';
      case 'HIGH': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getRiskText = (risk: string) => {
    switch (risk) {
      case 'LOW': return language === 'ar' ? 'منخفضة' : language === 'fr' ? 'Faible' : 'Low';
      case 'MEDIUM': return language === 'ar' ? 'متوسطة' : language === 'fr' ? 'Moyenne' : 'Medium';
      case 'HIGH': return language === 'ar' ? 'عالية' : language === 'fr' ? 'Élevée' : 'High';
      default: return t('recommendations.undefined');
    }
  };

  const getMarketConditionIcon = (condition: string) => {
    switch (condition) {
      case 'TRENDING': return <TrendingUp className="w-4 h-4 text-blue-400" />;
      case 'RANGING': return <BarChart3 className="w-4 h-4 text-yellow-400" />;
      case 'VOLATILE': return <Zap className="w-4 h-4 text-red-400" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getMarketConditionText = (condition: string) => {
    switch (condition) {
      case 'TRENDING': return t('recommendations.trending');
      case 'RANGING': return t('recommendations.ranging');
      case 'VOLATILE': return t('recommendations.volatile');
      default: return t('recommendations.undefined');
    }
  };

  if (!isActive) {
    return (
      <div className="bg-gray-800 dark:bg-gray-800 bg-gray-100 rounded-lg p-3 sm:p-6 text-center w-full" dir={dir}>
        <Target className="w-8 h-8 sm:w-12 sm:h-12 text-gray-500 mx-auto mb-3 sm:mb-4" />
        <p className="text-gray-400 dark:text-gray-400 text-sm sm:text-base">{t('directives.startBotRecommendations')}</p>
      </div>
    );
  }

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
    
    if (diff < 0) return language === 'ar' ? 'الآن' : language === 'fr' ? 'Maintenant' : 'Now';
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-2 sm:space-y-3" dir={dir}>
      {/* الهيدر */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <div className="p-1 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex-shrink-0">
            <Star className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <h2 className="text-xs sm:text-lg font-bold text-white truncate">{t('recommendations.title')}</h2>
              {recommendations.length > 0 && (
                <span className="px-1.5 py-0.5 bg-purple-600 text-white text-[10px] rounded-full flex-shrink-0">
                  {recommendations.length}
                </span>
              )}
            </div>
            <p className="text-[9px] sm:text-xs text-gray-400 truncate">
              {lastUpdate ? `${formatTime(lastUpdate)}` : t('recommendations.loading')}
              {isPaused && <span className="ml-1 text-yellow-400">⏸</span>}
              {lastUpdate && <span className="ml-1 text-green-400">📊</span>}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-0 flex-shrink-0">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-1 hover:bg-purple-500/20 rounded transition-colors"
            title={isPaused ? (language === 'ar' ? 'استئناف' : language === 'fr' ? 'Reprendre' : 'Resume') : (language === 'ar' ? 'إيقاف' : language === 'fr' ? 'Pause' : 'Pause')}
          >
            {isPaused ? (
              <Play className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
            ) : (
              <Pause className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
            )}
          </button>
          <button
            onClick={loadRecommendations}
            disabled={loading}
            className="p-1 hover:opacity-70 transition-opacity disabled:opacity-30"
          >
            <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 text-purple-400 ${loading ? 'animate-spin' : ''}`} />
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

      {/* قائمة التوصيات مع شريط تمرير */}
      {loading && recommendations.length === 0 ? (
        <div className="text-center py-6 sm:py-8">
          <RefreshCw className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400 animate-spin mx-auto mb-2 sm:mb-3" />
          <p className="text-xs sm:text-sm text-gray-400">{t('recommendations.analyzing')}</p>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="text-center py-6 sm:py-8 bg-gray-800/50 rounded-lg border border-gray-700">
          <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400 mx-auto mb-2 sm:mb-3" />
          <p className="text-xs sm:text-sm text-gray-400">{t('recommendations.noRecommendations')}</p>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-1 sm:mt-2">{t('recommendations.tryLater')}</p>
        </div>
      ) : (
        <div>
          {/* مؤشر جودة التوصيات */}
          {recommendations.length > 0 && (
            <div className="mb-3 p-2 bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-lg border border-purple-500/30">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-300">
                  {language === 'ar' ? 'جودة التوصيات:' : language === 'fr' ? 'Qualité des recommandations:' : 'Recommendations Quality:'}
                </span>
                <div className="flex gap-2">
                  <span className="text-green-400">
                    {recommendations.filter(r => r.confidence >= 75).length} {language === 'ar' ? 'عالية' : language === 'fr' ? 'Haute' : 'High'}
                  </span>
                  <span className="text-yellow-400">
                    {recommendations.filter(r => r.confidence >= 60 && r.confidence < 75).length} {language === 'ar' ? 'متوسطة' : language === 'fr' ? 'Moyenne' : 'Medium'}
                  </span>
                  <span className="text-orange-400">
                    {recommendations.filter(r => r.confidence >= 50 && r.confidence < 60).length} {language === 'ar' ? 'منخفضة' : language === 'fr' ? 'Faible' : 'Low'}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-3 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-600 scrollbar-track-gray-800 pr-2">
            {recommendations.map((recommendation, index) => (
            <div
              key={recommendation.symbol}
              className={`p-3 sm:p-4 rounded-lg border cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/20 animate-fade-in ${
                selectedRecommendation?.symbol === recommendation.symbol
                  ? 'bg-blue-500/20 border-blue-500/50'
                  : 'bg-gray-700/50 border-gray-600/50 hover:bg-gray-700'
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => setSelectedRecommendation(recommendation)}
            >
              {/* رأس التوصية */}
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="text-sm sm:text-lg font-bold text-white truncate">{recommendation.symbol.replace('_otc', '')}</span>
                    {recommendation.symbol.includes('_otc') && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold bg-purple-600/80 text-white rounded">OTC</span>
                    )}
                    {index < 3 && <Award className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 flex-shrink-0" />}
                  </div>
                  <span className="text-xs sm:text-sm text-gray-400 dark:text-gray-400 truncate">{recommendation.name}</span>
                </div>
                
                <div className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg border text-xs sm:text-sm font-bold flex-shrink-0 ml-2 ${getScoreBackground(recommendation.score)}`}>
                  <span className={getScoreColor(recommendation.score)}>{recommendation.score}</span>
                </div>
              </div>

              {/* معلومات التوقيت */}
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                <div className="bg-blue-600/10 rounded-lg p-2 sm:p-3 border border-blue-500/30">
                  <div className="flex items-center gap-1 sm:gap-2 mb-1">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                    <span className="text-[10px] sm:text-xs text-gray-400">
                      {language === 'ar' ? 'وقت الدخول' : language === 'fr' ? 'Heure d\'entrée' : 'Entry Time'}
                    </span>
                  </div>
                  <div className="text-sm sm:text-lg font-bold text-white font-mono">
                    {formatTime(recommendation.entryTime)}
                  </div>
                  <div className="text-[10px] sm:text-xs text-blue-400 mt-1">
                    {language === 'ar' ? 'بعد' : language === 'fr' ? 'Dans' : 'In'} {getTimeUntilEntry(recommendation.entryTime)}
                  </div>
                </div>

                <div className="bg-purple-600/10 rounded-lg p-2 sm:p-3 border border-purple-500/30">
                  <div className="flex items-center gap-1 sm:gap-2 mb-1">
                    <Target className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
                    <span className="text-[10px] sm:text-xs text-gray-400">
                      {language === 'ar' ? 'وقت الانتهاء' : language === 'fr' ? 'Expiration' : 'Expiry Time'}
                    </span>
                  </div>
                  <div className="text-sm sm:text-lg font-bold text-white font-mono">
                    {formatTime(recommendation.expiryTime)}
                  </div>
                  <div className="text-[10px] sm:text-xs text-purple-400 mt-1">
                    {recommendation.timeframes[0].duration}{language === 'ar' ? 'د' : language === 'fr' ? 'min' : 'm'} {language === 'ar' ? 'مدة' : language === 'fr' ? 'durée' : 'duration'}
                  </div>
                </div>
              </div>

              {/* معلومات أساسية */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="flex items-center gap-1 sm:gap-2">
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-gray-300 truncate">{t('trading.confidenceShort')}: {recommendation.confidence}%</span>
                </div>
                
                <div className="flex items-center gap-1 sm:gap-2">
                  <Target className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-gray-300 truncate">{t('trading.winRateShort')}: {recommendation.expectedWinRate}%</span>
                </div>
                
                <div className="flex items-center gap-1 sm:gap-2">
                  <Shield className={`w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 ${getRiskColor(recommendation.riskLevel)}`} />
                  <span className="text-xs sm:text-sm text-gray-300 truncate">{t('signals.riskShort')}: {getRiskText(recommendation.riskLevel)}</span>
                </div>
                
                <div className="flex items-center gap-1 sm:gap-2">
                  {getMarketConditionIcon(recommendation.marketCondition)}
                  <span className="text-xs sm:text-sm text-gray-300 truncate">{getMarketConditionText(recommendation.marketCondition)}</span>
                </div>
              </div>

              {/* أفضل إطار زمني */}
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-gray-300">{t('recommendations.bestTimeframe')}:</span>
                  <div className="flex gap-1">
                    {recommendation.timeframes.slice(0, 2).map((tf, tfIndex) => (
                      <span
                        key={`${recommendation.symbol}-${tf.duration}-${tfIndex}`}
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          tf.expectedDirection === 'CALL' 
                            ? 'bg-green-500/20 text-green-400' 
                            : tf.expectedDirection === 'PUT'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {`${tf.duration}${language === 'ar' ? 'د' : language === 'fr' ? 'min' : 'm'}`} ({tf.confidence}%)
                      </span>
                    ))}
                  </div>
                </div>

              {/* شريط احتمال الإشارة */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400 dark:text-gray-400 text-gray-600">{t('recommendations.signalProbabilityShort')}</span>
                  <span className="text-xs text-gray-300 dark:text-gray-300 text-gray-700">{recommendation.nextSignalProbability}%</span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${recommendation.nextSignalProbability}%` }}
                  />
                </div>
              </div>

              {/* أسباب مختصرة */}
              <div className="text-xs text-gray-400">
                {recommendation.reasons.slice(0, 2).join(' • ')}
              </div>
            </div>
            ))}
          </div>
        </div>
      )}

      {/* تفاصيل التوصية المختارة */}
      {selectedRecommendation && (
        <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600/50">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-400" />
            {t('recommendations.detailsOf')} {selectedRecommendation.symbol}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* الأطر الزمنية */}
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-3">{t('recommendations.recommendedTimeframes')}</h4>
              <div className="space-y-2">
                {selectedRecommendation.timeframes.map((tf, tfIndex) => (
                  <div key={`${selectedRecommendation.symbol}-detail-${tf.duration}-${tfIndex}`} className="flex items-center justify-between p-2 bg-gray-600/30 rounded">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-purple-400" />
                      <span className="text-sm text-white">{tf.duration} {t('recommendations.min')}</span>
                      {tf.expectedDirection !== 'NEUTRAL' && (
                        tf.expectedDirection === 'CALL' 
                          ? <TrendingUp className="w-4 h-4 text-green-400" />
                          : <TrendingDown className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-white">{tf.confidence}%</div>
                      <div className="text-xs text-gray-400">{t('recommendations.strength')}: {tf.strength}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* الأسباب */}
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-3">{t('recommendations.reasons')}</h4>
              <div className="space-y-2">
                {selectedRecommendation.reasons.map((reason: string, index: number) => (
                  <div key={index} className="flex items-start gap-2 p-2 bg-gray-600/30 rounded">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-300">{reason}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* إحصائيات متقدمة */}
          <div className="mt-4 pt-4 border-t border-gray-600/50">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-gray-600/30 rounded-lg">
                <div className="text-lg font-bold text-white">{selectedRecommendation.score}</div>
                <div className="text-xs text-gray-400">{t('recommendations.qualityPointsShort')}</div>
              </div>
              <div className="p-3 bg-gray-600/30 rounded-lg">
                <div className="text-lg font-bold text-white">{selectedRecommendation.confidence}%</div>
                <div className="text-xs text-gray-400">{t('recommendations.confidenceLevelShort')}</div>
              </div>
              <div className="p-3 bg-gray-600/30 rounded-lg">
                <div className="text-lg font-bold text-white">{selectedRecommendation.expectedWinRate}%</div>
                <div className="text-xs text-gray-400">{t('recommendations.winRateShort')}</div>
              </div>
              <div className="p-3 bg-gray-600/30 rounded-lg">
                <div className="text-lg font-bold text-white">{selectedRecommendation.nextSignalProbability}%</div>
                <div className="text-xs text-gray-400">{t('recommendations.signalProbabilityShort')}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// تم استخدام Tailwind CSS classes للشريط التمرير بدلاً من CSS مخصص
