/**
 * محرك التحليل الفني المتقدم
 * يوفر تحليل فني دقيق جداً باستخدام مؤشرات متعددة وخوارزميات ذكية
 */

export interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicators {
  // مؤشرات الزخم
  rsi: number;
  rsiSignal: 'OVERSOLD' | 'OVERBOUGHT' | 'NEUTRAL';
  stochastic: { k: number; d: number; signal: 'BUY' | 'SELL' | 'NEUTRAL' };
  
  // مؤشرات الاتجاه
  macd: { line: number; signal: number; histogram: number; trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL' };
  ema: { ema12: number; ema26: number; ema50: number; ema200: number };
  sma: { sma20: number; sma50: number; sma200: number };
  
  // مؤشرات التقلب
  bollinger: { upper: number; middle: number; lower: number; bandwidth: number; position: 'UPPER' | 'MIDDLE' | 'LOWER' };
  atr: number; // Average True Range
  
  // مؤشرات الحجم
  volumeProfile: 'HIGH' | 'NORMAL' | 'LOW';
  obv: number; // On-Balance Volume
  
  // مستويات الدعم والمقاومة
  support: number[];
  resistance: number[];
  pivotPoints: { pivot: number; r1: number; r2: number; r3: number; s1: number; s2: number; s3: number };
  
  // التحليل الشامل
  overallTrend: 'STRONG_BULLISH' | 'BULLISH' | 'NEUTRAL' | 'BEARISH' | 'STRONG_BEARISH';
  volatility: 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  strength: number; // 0-100
}

export interface SignalAnalysis {
  direction: 'CALL' | 'PUT' | 'NEUTRAL';
  confidence: number; // 0-100
  strength: number; // 0-100
  quality: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  timeframe: 1 | 2 | 3 | 5; // دقائق
  reasons: string[];
  riskLevel: 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  expectedWinRate: number; // 0-100
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
}

class AdvancedTechnicalEngine {
  /**
   * حساب جميع المؤشرات الفنية
   */
  calculateAllIndicators(candles: CandleData[], currentPrice: number): TechnicalIndicators {
    const closes = candles.map(c => c.close);
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    const volumes = candles.map(c => c.volume);

    // حساب المؤشرات
    const rsi = this.calculateRSI(closes, 14);
    const stochastic = this.calculateStochastic(highs, lows, closes, 14, 3);
    const macd = this.calculateMACD(closes);
    const ema = this.calculateEMAs(closes);
    const sma = this.calculateSMAs(closes);
    const bollinger = this.calculateBollingerBands(closes, currentPrice, 20, 2);
    const atr = this.calculateATR(highs, lows, closes, 14);
    const obv = this.calculateOBV(closes, volumes);
    const volumeProfile = this.analyzeVolumeProfile(volumes);
    const { support, resistance } = this.findSupportResistance(candles);
    const pivotPoints = this.calculatePivotPoints(candles[candles.length - 1]);
    const overallTrend = this.determineOverallTrend(ema, sma, macd, rsi);
    const volatility = this.classifyVolatility(atr, bollinger.bandwidth);
    const strength = this.calculateTrendStrength(ema, macd, rsi, stochastic);

    return {
      rsi,
      rsiSignal: rsi <= 30 ? 'OVERSOLD' : rsi >= 70 ? 'OVERBOUGHT' : 'NEUTRAL',
      stochastic,
      macd,
      ema,
      sma,
      bollinger,
      atr,
      volumeProfile,
      obv,
      support,
      resistance,
      pivotPoints,
      overallTrend,
      volatility,
      strength
    };
  }

  /**
   * توليد إشارة تداول دقيقة جداً
   */
  generatePreciseSignal(candles: CandleData[], currentPrice: number): SignalAnalysis | null {
    if (candles.length < 200) {

      return null;
    }

    const indicators = this.calculateAllIndicators(candles, currentPrice);
    
    // تحليل متعدد المستويات
    const signalScores = this.analyzeMultipleSignals(indicators, currentPrice);
    
    // تصفية الإشارات الضعيفة
    if (signalScores.totalScore < 60) {
      return null; // إشارة ضعيفة جداً
    }

    // تحديد الاتجاه
    const direction = this.determineDirection(signalScores);
    if (direction === 'NEUTRAL') {
      return null; // لا توجد إشارة واضحة
    }

    // حساب الثقة والقوة
    const confidence = this.calculateConfidence(signalScores, indicators);
    const strength = this.calculateSignalStrength(signalScores, indicators);
    
    // تصفية الإشارات منخفضة الثقة
    if (confidence < 75) {
      return null; // ثقة منخفضة جداً
    }

    // تحديد الإطار الزمني الأمثل
    const timeframe = this.determineOptimalTimeframe(indicators, signalScores);
    
    // حساب مستويات الدخول والخروج
    const { targetPrice, stopLoss } = this.calculateEntryExitLevels(
      currentPrice,
      direction,
      indicators
    );

    // تقييم الجودة
    const quality = this.assessSignalQuality(confidence, strength, indicators);
    
    // توليد الأسباب
    const reasons = this.generateSignalReasons(signalScores, indicators, direction);
    
    // تقييم المخاطر
    const riskLevel = this.assessRiskLevel(indicators, confidence, strength);
    
    // حساب نسبة النجاح المتوقعة
    const expectedWinRate = this.calculateExpectedWinRate(
      confidence,
      strength,
      indicators,
      quality
    );

    return {
      direction,
      confidence,
      strength,
      quality,
      timeframe,
      reasons,
      riskLevel,
      expectedWinRate,
      entryPrice: currentPrice,
      targetPrice,
      stopLoss
    };
  }

  /**
   * حساب RSI (مؤشر القوة النسبية) - دقيق جداً
   */
  private calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50;

    let gains = 0;
    let losses = 0;

    // حساب المتوسط الأولي
    for (let i = prices.length - period; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses += Math.abs(change);
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    // تطبيق معادلة Wilder's Smoothing
    for (let i = prices.length - period + 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? Math.abs(change) : 0;

      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
    }

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  /**
   * حساب Stochastic Oscillator
   */
  private calculateStochastic(
    highs: number[],
    lows: number[],
    closes: number[],
    kPeriod: number = 14,
    dPeriod: number = 3
  ): { k: number; d: number; signal: 'BUY' | 'SELL' | 'NEUTRAL' } {
    if (closes.length < kPeriod) return { k: 50, d: 50, signal: 'NEUTRAL' };

    const recentHighs = highs.slice(-kPeriod);
    const recentLows = lows.slice(-kPeriod);
    const currentClose = closes[closes.length - 1];

    const highestHigh = Math.max(...recentHighs);
    const lowestLow = Math.min(...recentLows);

    const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;

    // حساب %D (متوسط متحرك لـ %K)
    const kValues = [];
    for (let i = closes.length - kPeriod; i < closes.length; i++) {
      const slice = closes.slice(Math.max(0, i - kPeriod + 1), i + 1);
      const h = Math.max(...highs.slice(Math.max(0, i - kPeriod + 1), i + 1));
      const l = Math.min(...lows.slice(Math.max(0, i - kPeriod + 1), i + 1));
      kValues.push(((slice[slice.length - 1] - l) / (h - l)) * 100);
    }

    const d = kValues.slice(-dPeriod).reduce((a, b) => a + b, 0) / dPeriod;

    // تحديد الإشارة
    let signal: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';
    if (k < 20 && d < 20 && k > d) signal = 'BUY'; // ذروة بيع مع تقاطع صاعد
    else if (k > 80 && d > 80 && k < d) signal = 'SELL'; // ذروة شراء مع تقاطع هابط

    return { k, d, signal };
  }

  /**
   * حساب MACD (Moving Average Convergence Divergence)
   */
  private calculateMACD(prices: number[]): {
    line: number;
    signal: number;
    histogram: number;
    trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  } {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macdLine = ema12 - ema26;

    // حساب خط الإشارة (EMA 9 من MACD)
    const macdValues = [];
    for (let i = 26; i < prices.length; i++) {
      const e12 = this.calculateEMA(prices.slice(0, i + 1), 12);
      const e26 = this.calculateEMA(prices.slice(0, i + 1), 26);
      macdValues.push(e12 - e26);
    }

    const signalLine = this.calculateEMA(macdValues, 9);
    const histogram = macdLine - signalLine;

    // تحديد الاتجاه
    let trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
    if (macdLine > signalLine && histogram > 0) trend = 'BULLISH';
    else if (macdLine < signalLine && histogram < 0) trend = 'BEARISH';

    return { line: macdLine, signal: signalLine, histogram, trend };
  }

  /**
   * حساب المتوسطات المتحركة الأسية (EMA)
   */
  private calculateEMAs(prices: number[]): {
    ema12: number;
    ema26: number;
    ema50: number;
    ema200: number;
  } {
    return {
      ema12: this.calculateEMA(prices, 12),
      ema26: this.calculateEMA(prices, 26),
      ema50: this.calculateEMA(prices, 50),
      ema200: this.calculateEMA(prices, 200)
    };
  }

  /**
   * حساب EMA واحد
   */
  private calculateEMA(prices: number[], period: number): number {
    if (prices.length === 0) return 0;
    if (prices.length < period) return prices[prices.length - 1];

    const multiplier = 2 / (period + 1);
    let ema = prices[0];

    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }

    return ema;
  }

  /**
   * حساب المتوسطات المتحركة البسيطة (SMA)
   */
  private calculateSMAs(prices: number[]): {
    sma20: number;
    sma50: number;
    sma200: number;
  } {
    return {
      sma20: this.calculateSMA(prices, 20),
      sma50: this.calculateSMA(prices, 50),
      sma200: this.calculateSMA(prices, 200)
    };
  }

  /**
   * حساب SMA واحد
   */
  private calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1] || 0;
    const slice = prices.slice(-period);
    return slice.reduce((sum, price) => sum + price, 0) / period;
  }

  /**
   * حساب Bollinger Bands
   */
  private calculateBollingerBands(
    prices: number[],
    currentPrice: number,
    period: number = 20,
    stdDevMultiplier: number = 2
  ): {
    upper: number;
    middle: number;
    lower: number;
    bandwidth: number;
    position: 'UPPER' | 'MIDDLE' | 'LOWER';
  } {
    const sma = this.calculateSMA(prices, period);
    const slice = prices.slice(-period);
    
    const variance = slice.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    const upper = sma + (stdDev * stdDevMultiplier);
    const lower = sma - (stdDev * stdDevMultiplier);
    const bandwidth = ((upper - lower) / sma) * 100;

    // تحديد موقع السعر
    let position: 'UPPER' | 'MIDDLE' | 'LOWER' = 'MIDDLE';
    if (currentPrice >= upper * 0.98) position = 'UPPER';
    else if (currentPrice <= lower * 1.02) position = 'LOWER';

    return { upper, middle: sma, lower, bandwidth, position };
  }

  /**
   * حساب Average True Range (ATR)
   */
  private calculateATR(highs: number[], lows: number[], closes: number[], period: number = 14): number {
    if (closes.length < period + 1) return 0;

    const trueRanges = [];
    for (let i = 1; i < closes.length; i++) {
      const high = highs[i];
      const low = lows[i];
      const prevClose = closes[i - 1];

      const tr = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      );
      trueRanges.push(tr);
    }

    return this.calculateSMA(trueRanges, period);
  }

  /**
   * حساب On-Balance Volume (OBV)
   */
  private calculateOBV(closes: number[], volumes: number[]): number {
    let obv = 0;
    for (let i = 1; i < closes.length; i++) {
      if (closes[i] > closes[i - 1]) {
        obv += volumes[i];
      } else if (closes[i] < closes[i - 1]) {
        obv -= volumes[i];
      }
    }
    return obv;
  }

  /**
   * تحليل ملف الحجم
   */
  private analyzeVolumeProfile(volumes: number[]): 'HIGH' | 'NORMAL' | 'LOW' {
    if (volumes.length < 20) return 'NORMAL';

    const avgVolume = this.calculateSMA(volumes, 20);
    const currentVolume = volumes[volumes.length - 1];
    const ratio = currentVolume / avgVolume;

    if (ratio >= 1.5) return 'HIGH';
    else if (ratio <= 0.5) return 'LOW';
    else return 'NORMAL';
  }

  /**
   * إيجاد مستويات الدعم والمقاومة
   */
  private findSupportResistance(candles: CandleData[]): {
    support: number[];
    resistance: number[];
  } {
    const support: number[] = [];
    const resistance: number[] = [];

    // البحث عن القمم والقيعان المحلية
    for (let i = 5; i < candles.length - 5; i++) {
      const current = candles[i];
      const isLocalHigh = candles.slice(i - 5, i).every(c => c.high < current.high) &&
                          candles.slice(i + 1, i + 6).every(c => c.high < current.high);
      const isLocalLow = candles.slice(i - 5, i).every(c => c.low > current.low) &&
                         candles.slice(i + 1, i + 6).every(c => c.low > current.low);

      if (isLocalHigh) resistance.push(current.high);
      if (isLocalLow) support.push(current.low);
    }

    // ترتيب وإرجاع أقرب 3 مستويات
    return {
      support: support.sort((a, b) => b - a).slice(0, 3),
      resistance: resistance.sort((a, b) => a - b).slice(0, 3)
    };
  }

  /**
   * حساب نقاط البايفوت
   */
  private calculatePivotPoints(lastCandle: CandleData): {
    pivot: number;
    r1: number;
    r2: number;
    r3: number;
    s1: number;
    s2: number;
    s3: number;
  } {
    const { high, low, close } = lastCandle;
    const pivot = (high + low + close) / 3;

    return {
      pivot,
      r1: (2 * pivot) - low,
      r2: pivot + (high - low),
      r3: high + 2 * (pivot - low),
      s1: (2 * pivot) - high,
      s2: pivot - (high - low),
      s3: low - 2 * (high - pivot)
    };
  }

  /**
   * تحديد الاتجاه العام
   */
  private determineOverallTrend(
    ema: any,
    sma: any,
    macd: any,
    rsi: number
  ): 'STRONG_BULLISH' | 'BULLISH' | 'NEUTRAL' | 'BEARISH' | 'STRONG_BEARISH' {
    let bullishSignals = 0;
    let bearishSignals = 0;

    // تحليل المتوسطات المتحركة
    if (ema.ema12 > ema.ema26 && ema.ema26 > ema.ema50) bullishSignals += 2;
    else if (ema.ema12 < ema.ema26 && ema.ema26 < ema.ema50) bearishSignals += 2;

    // تحليل SMA للتأكيد
    if (sma.sma20 > sma.sma50) bullishSignals += 0.5;
    else if (sma.sma20 < sma.sma50) bearishSignals += 0.5;

    // تحليل MACD
    if (macd.trend === 'BULLISH') bullishSignals++;
    else if (macd.trend === 'BEARISH') bearishSignals++;

    // تحليل RSI
    if (rsi > 50) bullishSignals++;
    else if (rsi < 50) bearishSignals++;

    const diff = bullishSignals - bearishSignals;
    if (diff >= 3) return 'STRONG_BULLISH';
    else if (diff >= 1) return 'BULLISH';
    else if (diff <= -3) return 'STRONG_BEARISH';
    else if (diff <= -1) return 'BEARISH';
    else return 'NEUTRAL';
  }

  /**
   * تصنيف التقلبات
   */
  private classifyVolatility(atr: number, bandwidth: number): 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' {
    const volatilityScore = (atr * 100) + (bandwidth / 2);

    if (volatilityScore < 0.5) return 'VERY_LOW';
    else if (volatilityScore < 1.0) return 'LOW';
    else if (volatilityScore < 2.0) return 'MEDIUM';
    else if (volatilityScore < 3.5) return 'HIGH';
    else return 'VERY_HIGH';
  }

  /**
   * حساب قوة الاتجاه
   */
  private calculateTrendStrength(ema: any, macd: any, rsi: number, stochastic: any): number {
    let strength = 0;

    // قوة المتوسطات المتحركة
    if (ema.ema12 > ema.ema26 && ema.ema26 > ema.ema50 && ema.ema50 > ema.ema200) strength += 30;
    else if (ema.ema12 < ema.ema26 && ema.ema26 < ema.ema50 && ema.ema50 < ema.ema200) strength += 30;
    else if (ema.ema12 > ema.ema26 || ema.ema26 > ema.ema50) strength += 15;

    // قوة MACD
    if (Math.abs(macd.histogram) > 0.001) strength += 25;

    // قوة RSI
    if (rsi < 30 || rsi > 70) strength += 20;
    else if (rsi >= 40 && rsi <= 60) strength += 10;

    // قوة Stochastic
    if (stochastic.signal !== 'NEUTRAL') strength += 15;

    return Math.min(100, strength);
  }

  /**
   * تحليل إشارات متعددة
   */
  private analyzeMultipleSignals(indicators: TechnicalIndicators, currentPrice: number): any {
    const scores = {
      rsiScore: 0,
      macdScore: 0,
      stochasticScore: 0,
      bollingerScore: 0,
      emaScore: 0,
      volumeScore: 0,
      supportResistanceScore: 0,
      totalScore: 0,
      bullishSignals: 0,
      bearishSignals: 0
    };

    // تحليل RSI
    if (indicators.rsiSignal === 'OVERSOLD') {
      scores.rsiScore = 25;
      scores.bullishSignals++;
    } else if (indicators.rsiSignal === 'OVERBOUGHT') {
      scores.rsiScore = 25;
      scores.bearishSignals++;
    }

    // تحليل MACD
    if (indicators.macd.trend === 'BULLISH' && indicators.macd.histogram > 0) {
      scores.macdScore = 20;
      scores.bullishSignals++;
    } else if (indicators.macd.trend === 'BEARISH' && indicators.macd.histogram < 0) {
      scores.macdScore = 20;
      scores.bearishSignals++;
    }

    // تحليل Stochastic
    if (indicators.stochastic.signal === 'BUY') {
      scores.stochasticScore = 15;
      scores.bullishSignals++;
    } else if (indicators.stochastic.signal === 'SELL') {
      scores.stochasticScore = 15;
      scores.bearishSignals++;
    }

    // تحليل Bollinger
    if (indicators.bollinger.position === 'LOWER') {
      scores.bollingerScore = 20;
      scores.bullishSignals++;
    } else if (indicators.bollinger.position === 'UPPER') {
      scores.bollingerScore = 20;
      scores.bearishSignals++;
    }

    // تحليل EMA
    if (indicators.ema.ema12 > indicators.ema.ema26 && indicators.ema.ema26 > indicators.ema.ema50) {
      scores.emaScore = 15;
      scores.bullishSignals++;
    } else if (indicators.ema.ema12 < indicators.ema.ema26 && indicators.ema.ema26 < indicators.ema.ema50) {
      scores.emaScore = 15;
      scores.bearishSignals++;
    }

    // تحليل الحجم
    if (indicators.volumeProfile === 'HIGH') {
      scores.volumeScore = 10;
    }

    // تحليل الدعم والمقاومة
    const nearSupport = indicators.support.some(s => Math.abs(currentPrice - s) / currentPrice < 0.002);
    const nearResistance = indicators.resistance.some(r => Math.abs(currentPrice - r) / currentPrice < 0.002);
    
    if (nearSupport) {
      scores.supportResistanceScore = 15;
      scores.bullishSignals++;
    } else if (nearResistance) {
      scores.supportResistanceScore = 15;
      scores.bearishSignals++;
    }

    // حساب النقاط الإجمالية
    scores.totalScore = Object.values(scores).reduce((sum: number, val: any) => 
      typeof val === 'number' ? sum + val : sum, 0
    );

    return scores;
  }

  /**
   * تحديد اتجاه الإشارة
   */
  private determineDirection(signalScores: any): 'CALL' | 'PUT' | 'NEUTRAL' {
    const { bullishSignals, bearishSignals } = signalScores;
    
    if (bullishSignals > bearishSignals && bullishSignals >= 3) return 'CALL';
    else if (bearishSignals > bullishSignals && bearishSignals >= 3) return 'PUT';
    else return 'NEUTRAL';
  }

  /**
   * حساب الثقة
   */
  private calculateConfidence(signalScores: any, indicators: TechnicalIndicators): number {
    let confidence = 50;

    // ثقة النقاط الإجمالية
    confidence += (signalScores.totalScore / 120) * 30;

    // ثقة قوة الاتجاه
    confidence += (indicators.strength / 100) * 15;

    // تعديل حسب التقلبات
    if (indicators.volatility === 'VERY_LOW' || indicators.volatility === 'LOW') {
      confidence += 10;
    } else if (indicators.volatility === 'VERY_HIGH') {
      confidence -= 15;
    }

    // تعديل حسب الحجم
    if (indicators.volumeProfile === 'HIGH') {
      confidence += 5;
    }

    return Math.max(0, Math.min(100, Math.round(confidence)));
  }

  /**
   * حساب قوة الإشارة
   */
  private calculateSignalStrength(signalScores: any, indicators: TechnicalIndicators): number {
    let strength = indicators.strength * 0.6; // 60% من قوة الاتجاه

    // إضافة قوة الإشارات
    const signalRatio = Math.max(signalScores.bullishSignals, signalScores.bearishSignals) / 6;
    strength += signalRatio * 40; // 40% من نسبة الإشارات

    return Math.max(0, Math.min(100, Math.round(strength)));
  }

  /**
   * تحديد الإطار الزمني الأمثل
   */
  private determineOptimalTimeframe(indicators: TechnicalIndicators, signalScores: any): 1 | 2 | 3 | 5 {
    // إطار زمني قصير للتقلبات العالية
    if (indicators.volatility === 'VERY_HIGH' || indicators.volatility === 'HIGH') {
      return 1;
    }
    
    // إطار زمني متوسط للتقلبات المتوسطة
    if (indicators.volatility === 'MEDIUM') {
      return signalScores.totalScore >= 80 ? 3 : 2;
    }
    
    // إطار زمني طويل للتقلبات المنخفضة والإشارات القوية
    if (indicators.overallTrend === 'STRONG_BULLISH' || indicators.overallTrend === 'STRONG_BEARISH') {
      return 5;
    }
    
    return 3; // افتراضي
  }

  /**
   * حساب مستويات الدخول والخروج
   */
  private calculateEntryExitLevels(
    currentPrice: number,
    direction: 'CALL' | 'PUT',
    indicators: TechnicalIndicators
  ): { targetPrice: number; stopLoss: number } {
    const atrMultiplier = 1.5;
    const atrValue = indicators.atr;

    if (direction === 'CALL') {
      return {
        targetPrice: currentPrice + (atrValue * atrMultiplier),
        stopLoss: currentPrice - (atrValue * 0.5)
      };
    } else {
      return {
        targetPrice: currentPrice - (atrValue * atrMultiplier),
        stopLoss: currentPrice + (atrValue * 0.5)
      };
    }
  }

  /**
   * تقييم جودة الإشارة
   */
  private assessSignalQuality(
    confidence: number,
    strength: number,
    indicators: TechnicalIndicators
  ): 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' {
    const score = (confidence * 0.6) + (strength * 0.4);

    if (score >= 85 && indicators.volatility !== 'VERY_HIGH') return 'EXCELLENT';
    else if (score >= 75) return 'GOOD';
    else if (score >= 65) return 'FAIR';
    else return 'POOR';
  }

  /**
   * توليد أسباب الإشارة
   */
  private generateSignalReasons(
    signalScores: any,
    indicators: TechnicalIndicators,
    direction: 'CALL' | 'PUT'
  ): string[] {
    const reasons: string[] = [];

    // إضافة معلومات النقاط إذا كانت عالية
    if (signalScores.totalScore >= 80) {
      reasons.push(`💯 نقاط قوة عالية (${signalScores.totalScore}/120)`);
    }

    if (direction === 'CALL') {
      if (indicators.rsiSignal === 'OVERSOLD') {
        reasons.push(`📊 RSI في ذروة البيع (${indicators.rsi.toFixed(1)})`);
      }
      if (indicators.macd.trend === 'BULLISH') {
        reasons.push('📈 MACD يشير لاتجاه صاعد قوي');
      }
      if (indicators.stochastic.signal === 'BUY') {
        reasons.push('🎯 Stochastic يعطي إشارة شراء');
      }
      if (indicators.bollinger.position === 'LOWER') {
        reasons.push('🔵 السعر عند الحد السفلي لبولينجر - فرصة شراء');
      }
      if (indicators.overallTrend === 'STRONG_BULLISH' || indicators.overallTrend === 'BULLISH') {
        reasons.push('⬆️ الاتجاه العام صاعد');
      }
    } else {
      if (indicators.rsiSignal === 'OVERBOUGHT') {
        reasons.push(`📊 RSI في ذروة الشراء (${indicators.rsi.toFixed(1)})`);
      }
      if (indicators.macd.trend === 'BEARISH') {
        reasons.push('📉 MACD يشير لاتجاه هابط قوي');
      }
      if (indicators.stochastic.signal === 'SELL') {
        reasons.push('🎯 Stochastic يعطي إشارة بيع');
      }
      if (indicators.bollinger.position === 'UPPER') {
        reasons.push('🔴 السعر عند الحد العلوي لبولينجر - فرصة بيع');
      }
      if (indicators.overallTrend === 'STRONG_BEARISH' || indicators.overallTrend === 'BEARISH') {
        reasons.push('⬇️ الاتجاه العام هابط');
      }
    }

    if (indicators.volumeProfile === 'HIGH') {
      reasons.push('📊 حجم تداول عالي يدعم الإشارة');
    }

    if (indicators.strength >= 70) {
      reasons.push(`💪 قوة الاتجاه عالية (${indicators.strength}/100)`);
    }

    return reasons;
  }

  /**
   * تقييم مستوى المخاطرة
   */
  private assessRiskLevel(
    indicators: TechnicalIndicators,
    confidence: number,
    strength: number
  ): 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' {
    let riskScore = 0;

    // مخاطر التقلبات
    if (indicators.volatility === 'VERY_HIGH') riskScore += 40;
    else if (indicators.volatility === 'HIGH') riskScore += 30;
    else if (indicators.volatility === 'MEDIUM') riskScore += 15;
    else if (indicators.volatility === 'LOW') riskScore += 5;

    // مخاطر الثقة
    if (confidence < 70) riskScore += 30;
    else if (confidence < 80) riskScore += 15;

    // مخاطر القوة
    if (strength < 50) riskScore += 20;
    else if (strength < 70) riskScore += 10;

    if (riskScore >= 60) return 'VERY_HIGH';
    else if (riskScore >= 40) return 'HIGH';
    else if (riskScore >= 25) return 'MEDIUM';
    else if (riskScore >= 10) return 'LOW';
    else return 'VERY_LOW';
  }

  /**
   * حساب نسبة النجاح المتوقعة
   */
  private calculateExpectedWinRate(
    confidence: number,
    strength: number,
    indicators: TechnicalIndicators,
    quality: string
  ): number {
    let winRate = 50; // نقطة البداية

    // تحسين حسب الثقة
    winRate += (confidence - 50) * 0.6;

    // تحسين حسب القوة
    winRate += (strength - 50) * 0.3;

    // تحسين حسب الجودة
    if (quality === 'EXCELLENT') winRate += 10;
    else if (quality === 'GOOD') winRate += 5;

    // تعديل حسب التقلبات
    if (indicators.volatility === 'VERY_LOW' || indicators.volatility === 'LOW') {
      winRate += 5;
    } else if (indicators.volatility === 'VERY_HIGH') {
      winRate -= 10;
    }

    // تعديل حسب قوة الاتجاه
    if (indicators.overallTrend === 'STRONG_BULLISH' || indicators.overallTrend === 'STRONG_BEARISH') {
      winRate += 8;
    }

    return Math.max(60, Math.min(95, Math.round(winRate)));
  }
}

export const advancedTechnicalEngine = new AdvancedTechnicalEngine();
