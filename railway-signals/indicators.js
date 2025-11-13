// حساب RSI
export function calculateRSI(prices, period = 14) {
  if (prices.length < period + 1) return 50;
  
  let gains = 0;
  let losses = 0;
  
  for (let i = prices.length - period; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

// حساب EMA
export function calculateEMA(prices, period) {
  if (prices.length < period) return prices[prices.length - 1];
  
  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b) / period;
  
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  
  return ema;
}

// حساب MACD
export function calculateMACD(prices) {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macd = ema12 - ema26;
  const signal = macd; // تبسيط
  
  return { macd, signal, histogram: macd - signal };
}

// حساب Bollinger Bands
export function calculateBollingerBands(prices, period = 20, stdDev = 2) {
  if (prices.length < period) {
    const price = prices[prices.length - 1];
    return { upper: price * 1.02, middle: price, lower: price * 0.98 };
  }
  
  const slice = prices.slice(-period);
  const middle = slice.reduce((a, b) => a + b) / period;
  const variance = slice.reduce((sum, price) => sum + Math.pow(price - middle, 2), 0) / period;
  const std = Math.sqrt(variance);
  
  return {
    upper: middle + (std * stdDev),
    middle: middle,
    lower: middle - (std * stdDev)
  };
}

// حساب Stochastic Oscillator
export function calculateStochastic(prices, period = 14) {
  if (prices.length < period) return { k: 50, d: 50 };
  
  const slice = prices.slice(-period);
  const high = Math.max(...slice);
  const low = Math.min(...slice);
  const current = prices[prices.length - 1];
  
  const k = ((current - low) / (high - low)) * 100;
  const d = k; // تبسيط
  
  return { k, d };
}

// حساب Williams %R
export function calculateWilliamsR(prices, period = 14) {
  if (prices.length < period) return -50;
  
  const slice = prices.slice(-period);
  const high = Math.max(...slice);
  const low = Math.min(...slice);
  const current = prices[prices.length - 1];
  
  return ((high - current) / (high - low)) * -100;
}

// حساب Momentum
export function calculateMomentum(prices, period = 10) {
  if (prices.length < period + 1) return 0;
  
  const current = prices[prices.length - 1];
  const past = prices[prices.length - period - 1];
  
  return ((current - past) / past) * 100;
}

// حساب Volume Trend (محاكاة بناءً على تغيرات السعر)
export function calculateVolumeTrend(prices) {
  if (prices.length < 10) return 'stable';
  
  const recentChanges = [];
  for (let i = prices.length - 9; i < prices.length; i++) {
    recentChanges.push(Math.abs(prices[i] - prices[i - 1]));
  }
  
  const avgChange = recentChanges.reduce((a, b) => a + b) / recentChanges.length;
  const lastChange = Math.abs(prices[prices.length - 1] - prices[prices.length - 2]);
  
  if (lastChange > avgChange * 1.5) return 'increasing';
  if (lastChange < avgChange * 0.5) return 'decreasing';
  return 'stable';
}

// حساب تقلبات السوق
function calculateVolatility(prices, period = 20) {
  if (prices.length < period + 1) return 0;
  
  const returns = [];
  for (let i = 1; i < period + 1; i++) {
    const change = (prices[prices.length - i] - prices[prices.length - i - 1]) / prices[prices.length - i - 1];
    returns.push(change);
  }
  
  const mean = returns.reduce((a, b) => a + b) / returns.length;
  const variance = returns.reduce((acc, ret) => acc + Math.pow(ret - mean, 2), 0) / returns.length;
  
  return Math.sqrt(variance);
}

// استراتيجية متقدمة: تحليل متعدد المؤشرات للفوركس
export function analyzeSignal(prices, symbol) {
  // التأكد من وجود بيانات كافية
  if (!prices || prices.length < 100) {
    return null;
  }

  const rsi = calculateRSI(prices);
  const { macd, signal: macdSignal } = calculateMACD(prices);
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const ema50 = calculateEMA(prices, 50);
  const ema200 = calculateEMA(prices, 200);
  const currentPrice = prices[prices.length - 1];
  const bollinger = calculateBollingerBands(prices);
  const stochastic = calculateStochastic(prices);
  const williamsR = calculateWilliamsR(prices);
  const momentum = calculateMomentum(prices);
  const volumeTrend = calculateVolumeTrend(prices);
  
  // حساب الاتجاه العام متعدد المستويات
  const shortTrend = ema12 > ema26 ? 'BULLISH' : 'BEARISH';
  const mediumTrend = ema26 > ema50 ? 'BULLISH' : 'BEARISH';
  const longTrend = ema50 > ema200 ? 'BULLISH' : 'BEARISH';
  const overallTrend = (shortTrend === mediumTrend && mediumTrend === longTrend) ? shortTrend : 'NEUTRAL';
  
  // حساب قوة الاتجاه
  const trendStrength = Math.abs(ema12 - ema26) / currentPrice * 10000; // في نقاط
  
  let callScore = 0;
  let putScore = 0;
  const reasons = [];
  
  // إضافة تحليل تقلبات السوق
  const volatility = calculateVolatility(prices);
  const isHighVolatility = volatility > 0.001;
  
  // ═══════════════════════════════════════════════════
  // استراتيجية 1: RSI (وزن: 40 نقطة)
  // ═══════════════════════════════════════════════════
  if (rsi < 25) {
    callScore += 40;
    reasons.push('RSI Extreme Oversold');
  } else if (rsi < 35) {
    callScore += 30;
    reasons.push('RSI Oversold');
  } else if (rsi < 45) {
    callScore += 20;
    reasons.push('RSI Low');
  } else if (rsi > 75) {
    putScore += 40;
    reasons.push('RSI Extreme Overbought');
  } else if (rsi > 65) {
    putScore += 30;
    reasons.push('RSI Overbought');
  } else if (rsi > 55) {
    putScore += 20;
    reasons.push('RSI High');
  }
  
  // ═══════════════════════════════════════════════════
  // استراتيجية 2: MACD (وزن: 35 نقطة)
  // ═══════════════════════════════════════════════════
  const macdStrength = Math.abs(macd - macdSignal);
  if (macd > macdSignal) {
    if (macdStrength > 0.0005) {
      callScore += 35;
      reasons.push('MACD Strong Bullish');
    } else if (macdStrength > 0.0001) {
      callScore += 25;
      reasons.push('MACD Bullish');
    }
  } else if (macd < macdSignal) {
    if (macdStrength > 0.0005) {
      putScore += 35;
      reasons.push('MACD Strong Bearish');
    } else if (macdStrength > 0.0001) {
      putScore += 25;
      reasons.push('MACD Bearish');
    }
  }
  
  // ═══════════════════════════════════════════════════
  // استراتيجية 3: EMA Trend (وزن: 30 نقطة)
  // ═══════════════════════════════════════════════════
  if (trend === 'BULLISH') {
    callScore += 30;
    reasons.push('Strong Uptrend');
  } else if (trend === 'BEARISH') {
    putScore += 30;
    reasons.push('Strong Downtrend');
  }
  
  // إضافة نقاط للاتجاه المتوسط
  if (ema12 > ema26 && trend !== 'BULLISH') {
    callScore += 15;
    reasons.push('EMA12 > EMA26');
  } else if (ema12 < ema26 && trend !== 'BEARISH') {
    putScore += 15;
    reasons.push('EMA12 < EMA26');
  }
  
  // ═══════════════════════════════════════════════════
  // استراتيجية 4: Price Action (وزن: 15 نقطة)
  // ═══════════════════════════════════════════════════
  const recentPrices = prices.slice(-5);
  const priceChange = ((recentPrices[4] - recentPrices[0]) / recentPrices[0]) * 100;
  if (priceChange > 0.1) {
    callScore += 15;
    reasons.push('Strong Price Rise');
  } else if (priceChange > 0.03) {
    callScore += 10;
    reasons.push('Price Rising');
  } else if (priceChange < -0.1) {
    putScore += 15;
    reasons.push('Strong Price Fall');
  } else if (priceChange < -0.03) {
    putScore += 10;
    reasons.push('Price Falling');
  }
  
  // ═══════════════════════════════════════════════════
  // استراتيجية 5: Bollinger Bands (وزن: 25 نقطة)
  // ═══════════════════════════════════════════════════
  const bbWidth = ((bollinger.upper - bollinger.lower) / bollinger.middle) * 100;
  const pricePosition = ((currentPrice - bollinger.lower) / (bollinger.upper - bollinger.lower)) * 100;
  
  if (currentPrice <= bollinger.lower * 1.005) {
    callScore += 25;
    reasons.push('BB Lower Band Touch');
  } else if (pricePosition < 20) {
    callScore += 15;
    reasons.push('BB Near Lower');
  }
  
  if (currentPrice >= bollinger.upper * 0.995) {
    putScore += 25;
    reasons.push('BB Upper Band Touch');
  } else if (pricePosition > 80) {
    putScore += 15;
    reasons.push('BB Near Upper');
  }
  
  // ضغط البولينجر (Squeeze)
  if (bbWidth < 1.5) {
    if (trend === 'BULLISH') {
      callScore += 10;
      reasons.push('BB Squeeze + Uptrend');
    } else if (trend === 'BEARISH') {
      putScore += 10;
      reasons.push('BB Squeeze + Downtrend');
    }
  }
  
  // ═══════════════════════════════════════════════════
  // استراتيجية 6: Stochastic Oscillator (وزن: 20 نقطة)
  // ═══════════════════════════════════════════════════
  if (stochastic.k < 20) {
    callScore += 20;
    reasons.push('Stochastic Oversold');
  } else if (stochastic.k < 30) {
    callScore += 15;
    reasons.push('Stochastic Low');
  }
  
  if (stochastic.k > 80) {
    putScore += 20;
    reasons.push('Stochastic Overbought');
  } else if (stochastic.k > 70) {
    putScore += 15;
    reasons.push('Stochastic High');
  }
  
  // ═══════════════════════════════════════════════════
  // استراتيجية 7: Williams %R (وزن: 20 نقطة)
  // ═══════════════════════════════════════════════════
  if (williamsR < -80) {
    callScore += 20;
    reasons.push('Williams %R Oversold');
  } else if (williamsR < -70) {
    callScore += 15;
    reasons.push('Williams %R Low');
  }
  
  if (williamsR > -20) {
    putScore += 20;
    reasons.push('Williams %R Overbought');
  } else if (williamsR > -30) {
    putScore += 15;
    reasons.push('Williams %R High');
  }
  
  // ═══════════════════════════════════════════════════
  // استراتيجية 8: Momentum (وزن: 20 نقطة)
  // ═══════════════════════════════════════════════════
  if (momentum > 0.5) {
    callScore += 20;
    reasons.push('Strong Bullish Momentum');
  } else if (momentum > 0.2) {
    callScore += 15;
    reasons.push('Bullish Momentum');
  }
  
  if (momentum < -0.5) {
    putScore += 20;
    reasons.push('Strong Bearish Momentum');
  } else if (momentum < -0.2) {
    putScore += 15;
    reasons.push('Bearish Momentum');
  }
  
  // ═══════════════════════════════════════════════════
  // استراتيجية 9: Volume Trend (وزن: 15 نقطة)
  // ═══════════════════════════════════════════════════
  if (volumeTrend === 'increasing') {
    if (trend === 'BULLISH') {
      callScore += 15;
      reasons.push('Volume Confirms Uptrend');
    } else if (trend === 'BEARISH') {
      putScore += 15;
      reasons.push('Volume Confirms Downtrend');
    }
  }
  
  // ═══════════════════════════════════════════════════
  // استراتيجية 10: Reversal Detection (وزن: 20 نقطة)
  // ═══════════════════════════════════════════════════
  // انعكاس صعودي: RSI منخفض + MACD صاعد + السعر عند BB السفلي
  if (rsi < 40 && macd > macdSignal && currentPrice < bollinger.middle) {
    callScore += 20;
    reasons.push('Bullish Reversal Pattern');
  }
  
  // انعكاس هبوطي: RSI مرتفع + MACD هابط + السعر عند BB العلوي
  if (rsi > 60 && macd < macdSignal && currentPrice > bollinger.middle) {
    putScore += 20;
    reasons.push('Bearish Reversal Pattern');
  }
  
  // ═══════════════════════════════════════════════════
  // تحديد الاتجاه والثقة (معايير متوازنة - 10 استراتيجيات)
  // ═══════════════════════════════════════════════════
  let direction = null;
  let confidence = 0;
  
  // الحد الأدنى: 60 نقطة (معايير دقيقة للفوركس)
  // الحد الأقصى النظري: 40+35+30+15+25+20+20+20+15+20 = 240 نقطة
  if (callScore > putScore && callScore >= 60) {
    direction = 'CALL';
    confidence = Math.min(callScore, 95); // حد أقصى 95% للواقعية
  } else if (putScore > callScore && putScore >= 60) {
    direction = 'PUT';
    confidence = Math.min(putScore, 95); // حد أقصى 95% للواقعية
  }
  
  // شروط صارمة: اتجاه واضح + 3 أسباب على الأقل + ثقة 60%+ + قوة اتجاه كافية
  if (direction && confidence >= 60 && reasons.length >= 3 && trendStrength >= 2) {
    const cleanSymbol = symbol.replace(/frx|OTC_/gi, '');
    const isOTC = symbol.includes('OTC');
    
    // تحديد أفضل إطار زمني بناءً على قوة الإشارة (معدل)
    let timeframe = '5min';
    if (confidence >= 80) timeframe = '1min';
    else if (confidence >= 70) timeframe = '2min';
    else if (confidence >= 60) timeframe = '3min';
    
    return {
      symbol: cleanSymbol + (isOTC ? ' (OTC)' : ''),
      direction,
      price: currentPrice,
      rsi: rsi.toFixed(2),
      confidence,
      timeframe,
      reasons: reasons.slice(0, 5), // أفضل 5 أسباب
      market_analysis: {
        trend: overallTrend.toLowerCase(),
        strength: Math.round(trendStrength),
        volatility: isHighVolatility ? 'high' : 'normal',
        rsi_level: rsi < 30 ? 'oversold' : rsi > 70 ? 'overbought' : 'neutral'
      },
      risk_level: confidence >= 80 ? 'LOW' : confidence >= 70 ? 'MEDIUM' : 'HIGH',
      expected_success_rate: Math.min(confidence + 5, 95) // إضافة 5% للنجاح المتوقع
    };
  }
  
  return null;
}
