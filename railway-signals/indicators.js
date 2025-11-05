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

// تحليل وإنشاء توصية
export function analyzeSignal(prices, symbol) {
  const rsi = calculateRSI(prices);
  const { macd, signal } = calculateMACD(prices);
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const currentPrice = prices[prices.length - 1];
  
  let direction = null;
  let confidence = 0;
  const reasons = [];
  
  // استراتيجية 1: RSI
  if (rsi < 35) {
    direction = 'CALL';
    confidence += 30;
    reasons.push('RSI Oversold');
  } else if (rsi > 65) {
    direction = 'PUT';
    confidence += 30;
    reasons.push('RSI Overbought');
  }
  
  // استراتيجية 2: MACD
  if (macd > signal) {
    if (direction === 'CALL' || !direction) {
      direction = 'CALL';
      confidence += 25;
      reasons.push('MACD Bullish');
    }
  } else if (macd < signal) {
    if (direction === 'PUT' || !direction) {
      direction = 'PUT';
      confidence += 25;
      reasons.push('MACD Bearish');
    }
  }
  
  // استراتيجية 3: EMA Crossover
  if (ema12 > ema26) {
    if (direction === 'CALL' || !direction) {
      direction = 'CALL';
      confidence += 20;
      reasons.push('EMA Bullish');
    }
  } else if (ema12 < ema26) {
    if (direction === 'PUT' || !direction) {
      direction = 'PUT';
      confidence += 20;
      reasons.push('EMA Bearish');
    }
  }
  
  // فقط التوصيات القوية (≥50% + إشارتين)
  if (direction && confidence >= 50 && reasons.length >= 2) {
    const cleanSymbol = symbol.replace(/frx|OTC_/gi, '');
    const isOTC = symbol.includes('OTC');
    
    return {
      symbol: cleanSymbol + (isOTC ? ' (OTC)' : ''),
      direction,
      price: currentPrice,
      rsi: rsi.toFixed(2),
      confidence: Math.min(confidence, 95),
      reasons: reasons.join(' • ')
    };
  }
  
  return null;
}
