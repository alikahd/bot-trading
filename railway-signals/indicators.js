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

// استراتيجية صارمة: تحليل متعدد الأطر الزمنية
export function analyzeSignal(prices, symbol) {
  const rsi = calculateRSI(prices);
  const { macd, signal: macdSignal } = calculateMACD(prices);
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const ema50 = calculateEMA(prices, 50);
  const currentPrice = prices[prices.length - 1];
  
  // حساب الاتجاه العام
  const trend = ema12 > ema26 && ema26 > ema50 ? 'BULLISH' : 
                ema12 < ema26 && ema26 < ema50 ? 'BEARISH' : 'NEUTRAL';
  
  let callScore = 0;
  let putScore = 0;
  const reasons = [];
  
  // ═══════════════════════════════════════════════════
  // استراتيجية 1: RSI (وزن: 35 نقطة)
  // ═══════════════════════════════════════════════════
  if (rsi < 30) {
    callScore += 35;
    reasons.push('RSI Oversold (<30)');
  } else if (rsi < 40) {
    callScore += 20;
    reasons.push('RSI Low (<40)');
  } else if (rsi > 70) {
    putScore += 35;
    reasons.push('RSI Overbought (>70)');
  } else if (rsi > 60) {
    putScore += 20;
    reasons.push('RSI High (>60)');
  }
  
  // ═══════════════════════════════════════════════════
  // استراتيجية 2: MACD (وزن: 30 نقطة)
  // ═══════════════════════════════════════════════════
  const macdStrength = Math.abs(macd - macdSignal);
  if (macd > macdSignal && macdStrength > 0.0001) {
    callScore += 30;
    reasons.push('MACD Bullish Cross');
  } else if (macd < macdSignal && macdStrength > 0.0001) {
    putScore += 30;
    reasons.push('MACD Bearish Cross');
  }
  
  // ═══════════════════════════════════════════════════
  // استراتيجية 3: EMA Trend (وزن: 25 نقطة)
  // ═══════════════════════════════════════════════════
  if (trend === 'BULLISH') {
    callScore += 25;
    reasons.push('Strong Uptrend');
  } else if (trend === 'BEARISH') {
    putScore += 25;
    reasons.push('Strong Downtrend');
  }
  
  // ═══════════════════════════════════════════════════
  // استراتيجية 4: Price Action (وزن: 10 نقطة)
  // ═══════════════════════════════════════════════════
  const recentPrices = prices.slice(-5);
  const priceChange = ((recentPrices[4] - recentPrices[0]) / recentPrices[0]) * 100;
  if (priceChange > 0.05) {
    callScore += 10;
    reasons.push('Price Rising');
  } else if (priceChange < -0.05) {
    putScore += 10;
    reasons.push('Price Falling');
  }
  
  // ═══════════════════════════════════════════════════
  // تحديد الاتجاه والثقة (شروط صارمة)
  // ═══════════════════════════════════════════════════
  let direction = null;
  let confidence = 0;
  
  if (callScore > putScore && callScore >= 60) {
    direction = 'CALL';
    confidence = Math.min(callScore, 95);
  } else if (putScore > callScore && putScore >= 60) {
    direction = 'PUT';
    confidence = Math.min(putScore, 95);
  }
  
  // يجب أن يكون هناك اتجاه واضح + ثقة عالية
  if (direction && confidence >= 60 && reasons.length >= 2) {
    const cleanSymbol = symbol.replace(/frx|OTC_/gi, '');
    const isOTC = symbol.includes('OTC');
    
    // تحديد أفضل إطار زمني بناءً على قوة الإشارة
    let timeframe = '5min';
    if (confidence >= 85) timeframe = '1min';
    else if (confidence >= 75) timeframe = '2min';
    else if (confidence >= 65) timeframe = '3min';
    
    return {
      symbol: cleanSymbol + (isOTC ? ' (OTC)' : ''),
      direction,
      price: currentPrice,
      rsi: rsi.toFixed(2),
      confidence,
      timeframe,
      reasons: reasons.join(' • ')
    };
  }
  
  return null;
}
