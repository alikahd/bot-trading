// نظام إدارة المخاطر المتقدم للخيارات الثنائية

export interface RiskSettings {
  // إعدادات المخاطر الأساسية
  maxRiskPerTrade: number; // نسبة مئوية من رأس المال (1-10%)
  dailyLossLimit: number; // حد الخسارة اليومية (5-25%)
  maxConsecutiveLosses: number; // عدد الخسائر المتتالية المسموح (2-10)
  
  // إعدادات متقدمة
  maxDailyTrades: number; // أقصى عدد صفقات يومياً
  cooldownAfterLoss: number; // فترة انتظار بعد الخسارة (بالدقائق)
  dynamicPositionSizing: boolean; // تعديل حجم الصفقة حسب الأداء
  
  // إعدادات الحساب
  accountBalance: number; // رصيد الحساب
  currency: 'USD' | 'EUR' | 'GBP';
  
  // إعدادات التوقف
  stopTradingOnTarget: boolean; // توقف عند الوصول للهدف
  dailyProfitTarget: number; // هدف الربح اليومي
  
  // إعدادات الوقت
  tradingHours: {
    start: string; // "09:00"
    end: string; // "17:00"
    timezone: string; // "UTC"
  };
  enforceTradingHours: boolean; // فرض ساعات التداول
  
  // إعدادات السوق
  avoidHighVolatility: boolean; // تجنب التقلبات العالية
  avoidNews: boolean; // تجنب أوقات الأخبار
  minSignalConfidence: number; // الحد الأدنى لثقة الإشارة
}

export interface TradeRisk {
  symbol: string;
  amount: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence: number;
  expectedWinRate: number;
  marketVolatility: 'LOW' | 'MEDIUM' | 'HIGH';
  timeframe: number;
}

export interface RiskAnalysis {
  allowed: boolean;
  reason: string;
  recommendedAmount: number;
  riskScore: number; // 0-100
  warnings: string[];
  suggestions: string[];
}

export interface DailyStats {
  tradesCount: number;
  winCount: number;
  lossCount: number;
  totalProfit: number;
  totalLoss: number;
  netProfit: number;
  winRate: number;
  consecutiveLosses: number;
  lastTradeTime: number;
  riskExposure: number; // المخاطرة الحالية
}

class AdvancedRiskManagementService {
  private settings: RiskSettings;
  private dailyStats: DailyStats;
  private tradeHistory: any[] = [];
  private blacklistedAssets: Set<string> = new Set();
  private cooldownAssets: Map<string, number> = new Map();

  constructor() {
    // الإعدادات الافتراضية المحافظة
    this.settings = {
      maxRiskPerTrade: 2, // 2% من رأس المال
      dailyLossLimit: 10, // 10% خسارة يومية
      maxConsecutiveLosses: 3,
      maxDailyTrades: 20,
      cooldownAfterLoss: 5, // 5 دقائق
      dynamicPositionSizing: true,
      accountBalance: 1000,
      currency: 'USD',
      stopTradingOnTarget: true,
      dailyProfitTarget: 5, // 5% ربح يومي
      tradingHours: {
        start: "00:00",
        end: "23:59",
        timezone: "UTC"
      },
      enforceTradingHours: false, // تعطيل فرض ساعات التداول للاختبار
      avoidHighVolatility: true,
      avoidNews: true,
      minSignalConfidence: 75
    };

    this.dailyStats = this.initializeDailyStats();
    this.loadSettings();
    this.loadDailyStats();
  }

  // تحليل المخاطر قبل الصفقة
  analyzeTradeRisk(trade: TradeRisk): RiskAnalysis {
    const analysis: RiskAnalysis = {
      allowed: true,
      reason: '',
      recommendedAmount: 0,
      riskScore: 0,
      warnings: [],
      suggestions: []
    };

    // فحص الحد الأقصى للصفقات اليومية
    if (this.dailyStats.tradesCount >= this.settings.maxDailyTrades) {
      analysis.allowed = false;
      analysis.reason = `تم الوصول للحد الأقصى من الصفقات اليومية (${this.settings.maxDailyTrades})`;
      return analysis;
    }

    // فحص حد الخسارة اليومية
    const dailyLossPercentage = Math.abs(this.dailyStats.totalLoss) / this.settings.accountBalance * 100;
    if (dailyLossPercentage >= this.settings.dailyLossLimit) {
      analysis.allowed = false;
      analysis.reason = `تم الوصول لحد الخسارة اليومية (${this.settings.dailyLossLimit}%)`;
      return analysis;
    }

    // فحص الخسائر المتتالية
    if (this.dailyStats.consecutiveLosses >= this.settings.maxConsecutiveLosses) {
      analysis.allowed = false;
      analysis.reason = `تم الوصول للحد الأقصى من الخسائر المتتالية (${this.settings.maxConsecutiveLosses})`;
      return analysis;
    }

    // فحص هدف الربح اليومي
    if (this.settings.stopTradingOnTarget) {
      const dailyProfitPercentage = this.dailyStats.netProfit / this.settings.accountBalance * 100;
      if (dailyProfitPercentage >= this.settings.dailyProfitTarget) {
        analysis.allowed = false;
        analysis.reason = `تم تحقيق هدف الربح اليومي (${this.settings.dailyProfitTarget}%)`;
        return analysis;
      }
    }

    // فحص فترة التهدئة
    const cooldownTime = this.cooldownAssets.get(trade.symbol) || 0;
    if (Date.now() < cooldownTime) {
      const remainingMinutes = Math.ceil((cooldownTime - Date.now()) / 60000);
      analysis.allowed = false;
      analysis.reason = `${trade.symbol} في فترة تهدئة لمدة ${remainingMinutes} دقيقة`;
      return analysis;
    }

    // فحص الأصول المحظورة
    if (this.blacklistedAssets.has(trade.symbol)) {
      analysis.allowed = false;
      analysis.reason = `${trade.symbol} محظور مؤقتاً بسبب الأداء الضعيف`;
      return analysis;
    }

    // فحص ساعات التداول
    if (!this.isWithinTradingHours()) {
      analysis.allowed = false;
      analysis.reason = 'خارج ساعات التداول المحددة';
      return analysis;
    }

    // فحص ثقة الإشارة
    if (trade.confidence < this.settings.minSignalConfidence) {
      analysis.allowed = false;
      analysis.reason = `ثقة الإشارة منخفضة (${trade.confidence}% < ${this.settings.minSignalConfidence}%)`;
      return analysis;
    }

    // فحص التقلبات العالية
    if (this.settings.avoidHighVolatility && trade.marketVolatility === 'HIGH') {
      analysis.warnings.push('⚠️ تقلبات عالية في السوق - زيادة المخاطر');
      analysis.riskScore += 20;
    }

    // حساب المبلغ الموصى به
    analysis.recommendedAmount = this.calculateOptimalAmount(trade);
    
    // حساب نقاط المخاطرة
    analysis.riskScore = this.calculateRiskScore(trade, analysis.recommendedAmount);
    
    // إضافة تحذيرات واقتراحات
    this.addWarningsAndSuggestions(trade, analysis);

    return analysis;
  }

  // حساب المبلغ الأمثل للصفقة
  private calculateOptimalAmount(trade: TradeRisk): number {
    let baseAmount = this.settings.accountBalance * (this.settings.maxRiskPerTrade / 100);
    
    // تعديل حسب الأداء (إذا كان مفعلاً)
    if (this.settings.dynamicPositionSizing) {
      const winRate = this.dailyStats.winRate;
      
      if (winRate > 70) {
        baseAmount *= 1.2; // زيادة 20% للأداء الجيد
      } else if (winRate < 50) {
        baseAmount *= 0.8; // تقليل 20% للأداء الضعيف
      }
    }
    
    // تعديل حسب مستوى المخاطرة
    switch (trade.riskLevel) {
      case 'LOW':
        baseAmount *= 1.1;
        break;
      case 'MEDIUM':
        baseAmount *= 1.0;
        break;
      case 'HIGH':
        baseAmount *= 0.7;
        break;
    }
    
    // تعديل حسب ثقة الإشارة
    const confidenceMultiplier = trade.confidence / 100;
    baseAmount *= confidenceMultiplier;
    
    // تعديل حسب نسبة النجاح المتوقعة
    const winRateMultiplier = trade.expectedWinRate / 100;
    baseAmount *= winRateMultiplier;
    
    // حد أدنى وأقصى
    const minAmount = 5; // حد أدنى 5 دولار
    const maxAmount = this.settings.accountBalance * 0.05; // حد أقصى 5% من الرصيد
    
    return Math.max(minAmount, Math.min(maxAmount, Math.round(baseAmount)));
  }

  // حساب نقاط المخاطرة
  private calculateRiskScore(trade: TradeRisk, amount: number): number {
    let score = 0;
    
    // مخاطر المبلغ
    const amountRisk = (amount / this.settings.accountBalance) * 100;
    score += amountRisk * 10;
    
    // مخاطر مستوى الصفقة
    switch (trade.riskLevel) {
      case 'LOW': score += 10; break;
      case 'MEDIUM': score += 25; break;
      case 'HIGH': score += 40; break;
    }
    
    // مخاطر التقلبات
    switch (trade.marketVolatility) {
      case 'LOW': score += 5; break;
      case 'MEDIUM': score += 15; break;
      case 'HIGH': score += 30; break;
    }
    
    // مخاطر الثقة
    score += (100 - trade.confidence) * 0.3;
    
    // مخاطر الإطار الزمني
    if (trade.timeframe <= 2) score += 15; // أطر قصيرة أكثر خطورة
    
    // مخاطر الأداء الحالي
    if (this.dailyStats.consecutiveLosses > 0) {
      score += this.dailyStats.consecutiveLosses * 10;
    }
    
    return Math.min(100, Math.max(0, score));
  }

  // إضافة تحذيرات واقتراحات
  private addWarningsAndSuggestions(trade: TradeRisk, analysis: RiskAnalysis): void {
    // تحذيرات
    if (analysis.riskScore > 70) {
      analysis.warnings.push('🔴 مخاطرة عالية جداً - فكر مرتين قبل التنفيذ');
    } else if (analysis.riskScore > 50) {
      analysis.warnings.push('🟡 مخاطرة متوسطة إلى عالية');
    }
    
    if (this.dailyStats.consecutiveLosses > 1) {
      analysis.warnings.push(`⚠️ ${this.dailyStats.consecutiveLosses} خسائر متتالية - كن حذراً`);
    }
    
    if (trade.confidence < 80) {
      analysis.warnings.push('📊 ثقة الإشارة أقل من المثالي');
    }
    
    // اقتراحات
    if (analysis.recommendedAmount < trade.amount) {
      analysis.suggestions.push(`💡 يُنصح بتقليل المبلغ إلى $${analysis.recommendedAmount}`);
    }
    
    if (trade.timeframe <= 2) {
      analysis.suggestions.push('⏰ فكر في استخدام إطار زمني أطول لتقليل المخاطر');
    }
    
    if (this.dailyStats.winRate < 60) {
      analysis.suggestions.push('📈 راجع استراتيجيتك - معدل النجاح منخفض اليوم');
    }
    
    if (trade.marketVolatility === 'HIGH') {
      analysis.suggestions.push('🌊 انتظر حتى تهدأ التقلبات للحصول على فرص أفضل');
    }
  }

  // تسجيل نتيجة الصفقة
  recordTradeResult(tradeId: string, result: 'WIN' | 'LOSS', amount: number, profit: number): void {
    const trade = {
      id: tradeId,
      timestamp: Date.now(),
      result,
      amount,
      profit,
      netResult: result === 'WIN' ? profit : -amount
    };
    
    this.tradeHistory.push(trade);
    this.updateDailyStats(trade);
    
    // تطبيق فترة التهدئة عند الخسارة
    if (result === 'LOSS' && this.settings.cooldownAfterLoss > 0) {
      const symbol = this.getTradeSymbol(tradeId); // يجب تنفيذ هذه الدالة
      if (symbol) {
        const cooldownEnd = Date.now() + (this.settings.cooldownAfterLoss * 60000);
        this.cooldownAssets.set(symbol, cooldownEnd);
      }
    }
    
    // إدارة الأصول ضعيفة الأداء
    this.manageUnderperformingAssets();
    
    // حفظ الإحصائيات
    this.saveDailyStats();
  }

  // تحديث الإحصائيات اليومية
  private updateDailyStats(trade: any): void {
    this.dailyStats.tradesCount++;
    
    if (trade.result === 'WIN') {
      this.dailyStats.winCount++;
      this.dailyStats.totalProfit += trade.profit;
      this.dailyStats.consecutiveLosses = 0; // إعادة تعيين الخسائر المتتالية
    } else {
      this.dailyStats.lossCount++;
      this.dailyStats.totalLoss += trade.amount;
      this.dailyStats.consecutiveLosses++;
    }
    
    this.dailyStats.netProfit = this.dailyStats.totalProfit - this.dailyStats.totalLoss;
    this.dailyStats.winRate = (this.dailyStats.winCount / this.dailyStats.tradesCount) * 100;
    this.dailyStats.lastTradeTime = trade.timestamp;
    
    // حساب المخاطرة الحالية
    this.dailyStats.riskExposure = (Math.abs(this.dailyStats.totalLoss) / this.settings.accountBalance) * 100;
  }

  // إدارة الأصول ضعيفة الأداء
  private manageUnderperformingAssets(): void {
    // تحليل أداء كل أصل
    const assetPerformance = new Map<string, { wins: number; losses: number; winRate: number }>();
    
    // حساب أداء الأصول من آخر 10 صفقات لكل أصل
    this.tradeHistory.slice(-50).forEach(trade => {
      const symbol = this.getTradeSymbol(trade.id);
      if (!symbol) return;
      
      if (!assetPerformance.has(symbol)) {
        assetPerformance.set(symbol, { wins: 0, losses: 0, winRate: 0 });
      }
      
      const perf = assetPerformance.get(symbol)!;
      if (trade.result === 'WIN') {
        perf.wins++;
      } else {
        perf.losses++;
      }
      
      const total = perf.wins + perf.losses;
      perf.winRate = total > 0 ? (perf.wins / total) * 100 : 0;
    });
    
    // حظر الأصول ضعيفة الأداء مؤقتاً
    assetPerformance.forEach((perf, symbol) => {
      const totalTrades = perf.wins + perf.losses;
      if (totalTrades >= 5 && perf.winRate < 30) {
        this.blacklistedAssets.add(symbol);
        // إزالة الحظر بعد ساعة
        setTimeout(() => {
          this.blacklistedAssets.delete(symbol);
        }, 60 * 60 * 1000);
      }
    });
  }

  // فحص ساعات التداول
  private isWithinTradingHours(): boolean {
    // إذا كان فرض ساعات التداول معطل، اسمح بالتداول في أي وقت
    if (!this.settings.enforceTradingHours) {
      return true;
    }
    
    const now = new Date();
    const currentHour = now.getUTCHours();
    const currentMinute = now.getUTCMinutes();
    const currentTime = currentHour * 60 + currentMinute;
    
    const [startHour, startMinute] = this.settings.tradingHours.start.split(':').map(Number);
    const [endHour, endMinute] = this.settings.tradingHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    return currentTime >= startTime && currentTime <= endTime;
  }

  // الحصول على رمز الأصل من معرف الصفقة (يجب تنفيذها حسب نظام معرفات الصفقات)
  private getTradeSymbol(_tradeId: string): string | null {
    // هذه دالة مؤقتة - يجب ربطها بنظام إدارة الصفقات الفعلي

    return 'EURUSD'; // مؤقت
  }

  // تحديث الإعدادات
  updateSettings(newSettings: Partial<RiskSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
  }

  // الحصول على الإعدادات الحالية
  getSettings(): RiskSettings {
    return { ...this.settings };
  }

  // فحص ساعات التداول (دالة عامة)
  checkTradingHours(): boolean {
    return this.isWithinTradingHours();
  }

  // الحصول على الإحصائيات اليومية
  getDailyStats(): DailyStats {
    return { ...this.dailyStats };
  }

  // إعادة تعيين الإحصائيات اليومية
  resetDailyStats(): void {
    this.dailyStats = this.initializeDailyStats();
    this.saveDailyStats();
  }

  // تهيئة الإحصائيات اليومية
  private initializeDailyStats(): DailyStats {
    return {
      tradesCount: 0,
      winCount: 0,
      lossCount: 0,
      totalProfit: 0,
      totalLoss: 0,
      netProfit: 0,
      winRate: 0,
      consecutiveLosses: 0,
      lastTradeTime: 0,
      riskExposure: 0
    };
  }

  // حفظ الإعدادات
  private saveSettings(): void {
    localStorage.setItem('riskManagementSettings', JSON.stringify(this.settings));
  }

  // تحميل الإعدادات
  private loadSettings(): void {
    const saved = localStorage.getItem('riskManagementSettings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.settings = { ...this.settings, ...parsed };
      } catch (error) {

      }
    }
  }

  // حفظ الإحصائيات اليومية
  private saveDailyStats(): void {
    const today = new Date().toDateString();
    localStorage.setItem(`dailyStats_${today}`, JSON.stringify(this.dailyStats));
  }

  // تحميل الإحصائيات اليومية
  private loadDailyStats(): void {
    const today = new Date().toDateString();
    const saved = localStorage.getItem(`dailyStats_${today}`);
    if (saved) {
      try {
        this.dailyStats = JSON.parse(saved);
      } catch (error) {

      }
    }
  }

  // الحصول على تقرير المخاطر الشامل
  getRiskReport(): any {
    return {
      currentRiskLevel: this.getCurrentRiskLevel(),
      dailyStats: this.dailyStats,
      settings: this.settings,
      blacklistedAssets: Array.from(this.blacklistedAssets),
      cooldownAssets: Object.fromEntries(this.cooldownAssets),
      recommendations: this.generateRiskRecommendations()
    };
  }

  // تحديد مستوى المخاطرة الحالي
  private getCurrentRiskLevel(): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const riskFactors = [];
    
    if (this.dailyStats.riskExposure > 15) riskFactors.push('high_exposure');
    if (this.dailyStats.consecutiveLosses >= 2) riskFactors.push('consecutive_losses');
    if (this.dailyStats.winRate < 50) riskFactors.push('low_win_rate');
    if (this.dailyStats.tradesCount > this.settings.maxDailyTrades * 0.8) riskFactors.push('high_frequency');
    
    if (riskFactors.length >= 3) return 'CRITICAL';
    if (riskFactors.length >= 2) return 'HIGH';
    if (riskFactors.length >= 1) return 'MEDIUM';
    return 'LOW';
  }

  // توليد توصيات إدارة المخاطر
  private generateRiskRecommendations(): string[] {
    const recommendations = [];
    
    if (this.dailyStats.consecutiveLosses >= 2) {
      recommendations.push('خذ استراحة قصيرة وراجع استراتيجيتك');
    }
    
    if (this.dailyStats.winRate < 60) {
      recommendations.push('قلل من حجم الصفقات حتى يتحسن الأداء');
    }
    
    if (this.dailyStats.riskExposure > 10) {
      recommendations.push('تجنب المخاطرة الإضافية اليوم');
    }
    
    if (this.blacklistedAssets.size > 0) {
      recommendations.push('ركز على الأصول ذات الأداء الجيد');
    }
    
    return recommendations;
  }
}

export const advancedRiskManagement = new AdvancedRiskManagementService();
