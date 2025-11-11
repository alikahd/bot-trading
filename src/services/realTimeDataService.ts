/**
 * 🚀 خدمة البيانات المباشرة الفورية - Binary.com WebSocket
 * ===========================================================
 * نظام مزامنة فوري للأسعار من Binary.com (نفس أسعار منصات الخيارات الثنائية)
 */

export interface RealTimeQuote {
  symbol: string;
  price: number;
  bid: number;
  ask: number;
  change: number;
  changePercent: number;
  timestamp: number;
}

export interface RealTimeDataListener {
  id: string;
  callback: (quotes: { [symbol: string]: RealTimeQuote }) => void;
}

class RealTimeDataService {
  private listeners: RealTimeDataListener[] = [];
  private quotes: { [symbol: string]: RealTimeQuote } = {};
  private updateInterval: NodeJS.Timeout | null = null;
  private isRunning = false;
  private binaryWS: WebSocket | null = null;
  private maxReconnectAttempts = 5;
  private reconnectAttempts = 0;
  private lastUpdate: Date | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private subscribedSymbols = new Set<string>(); // تتبع الرموز المشترك فيها
  private receivedSymbols = new Set<string>(); // تتبع الرموز المستلمة
  private statsInterval: NodeJS.Timeout | null = null; // عرض إحصائيات دورية

  /**
   * 🎯 بدء خدمة البيانات المباشرة - Binary.com WebSocket
   */
  start() {
    if (this.isRunning) return;
    
    // بدء خدمة البيانات المباشرة
    this.isRunning = true;
    
    // الاتصال بخدمة البيانات
    this.connectToDataService();
    
    // fallback - جلب البيانات كل 5 ثوانٍ في حالة فشل WebSocket
    this.updateInterval = setInterval(() => {
      if (!this.binaryWS || this.binaryWS.readyState !== WebSocket.OPEN) {
        this.fetchFallbackData();
      }
    }, 5000);
  }

  /**
   * ⏹️ إيقاف خدمة البيانات المباشرة
   */
  stop() {
    if (!this.isRunning) return;
    
    // إيقاف خدمة البيانات
    this.isRunning = false;
    
    // إغلاق WebSocket
    if (this.binaryWS) {
      this.binaryWS.close();
      this.binaryWS = null;
    }
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }
    
    // مسح الإحصائيات
    this.subscribedSymbols.clear();
    this.receivedSymbols.clear();
  }

  /**
   * 🔌 الاتصال بـ Binary.com WebSocket
   */
  private connectToDataService() {
    try {
      // WebSocket endpoint
      const wsUrl = 'wss://ws.binaryws.com/websockets/v3?app_id=1089';
      
      this.binaryWS = new WebSocket(wsUrl);
      
      // تعيين timeout للاتصال
      const connectionTimeout = setTimeout(() => {
        if (this.binaryWS && this.binaryWS.readyState !== WebSocket.OPEN) {

          this.binaryWS.close();
          this.handleReconnect();
        }
      }, 10000); // 10 ثوانٍ timeout
      
      this.binaryWS.onopen = () => {
        clearTimeout(connectionTimeout);

        this.reconnectAttempts = 0;
        
        // إرسال ping للحفاظ على الاتصال
        if (this.binaryWS && this.binaryWS.readyState === WebSocket.OPEN) {
          this.binaryWS.send(JSON.stringify({ ping: 1 }));
        }
        
        // إرسال ping كل 30 ثانية للحفاظ على الاتصال
        this.pingInterval = setInterval(() => {
          if (this.binaryWS && this.binaryWS.readyState === WebSocket.OPEN) {
            this.binaryWS.send(JSON.stringify({ ping: 1 }));
          }
        }, 30000);
        
        // عرض إحصائيات كل 10 ثوانٍ
        this.statsInterval = setInterval(() => {

        }, 10000);
        
        this.subscribeToSymbols();
      };
      
      this.binaryWS.onmessage = (event) => {
        this.handleDataMessage(event);
      };
      
      this.binaryWS.onclose = () => {
        clearTimeout(connectionTimeout);
        if (this.pingInterval) {
          clearInterval(this.pingInterval);
          this.pingInterval = null;
        }
        if (this.statsInterval) {
          clearInterval(this.statsInterval);
          this.statsInterval = null;
        }
        // انقطع الاتصال
        this.handleReconnect();
      };
      
      this.binaryWS.onerror = (_error) => {
        clearTimeout(connectionTimeout);

      };
      
    } catch (error) {

      this.handleReconnect();
    }
  }

  /**
   * 📡 الاشتراك في رموز العملات
   */
  private async subscribeToSymbols() {
    if (!this.binaryWS || this.binaryWS.readyState !== WebSocket.OPEN) return;
    
    // جميع الرموز المتاحة في Binary.com - بيانات حقيقية 24/7
    const symbols = [
      // ===== العملات الرئيسية (Major Pairs) =====
      'frxEURUSD', 'frxGBPUSD', 'frxUSDJPY', 'frxAUDUSD', 
      'frxUSDCAD', 'frxUSDCHF', 'frxNZDUSD',
      
      // ===== العملات المتقاطعة EUR (Cross Pairs) =====
      'frxEURGBP', 'frxEURJPY', 'frxEURCHF', 'frxEURAUD', 
      'frxEURCAD', 'frxEURNZD',
      
      // ===== العملات المتقاطعة GBP (Cross Pairs) =====
      'frxGBPJPY', 'frxGBPCHF', 'frxGBPAUD', 'frxGBPCAD', 
      'frxGBPNZD',
      
      // ===== العملات المتقاطعة AUD (Cross Pairs) =====
      'frxAUDJPY', 'frxAUDCHF', 'frxAUDCAD', 'frxAUDNZD',
      
      // ===== العملات المتقاطعة NZD (Cross Pairs) =====
      'frxNZDJPY', 'frxNZDCHF', 'frxNZDCAD',
      
      // ===== العملات المتقاطعة CAD/CHF (Cross Pairs) =====
      'frxCADJPY', 'frxCADCHF', 'frxCHFJPY',
      
      // ===== العملات الناشئة - أوروبا (Exotic Pairs - Europe) =====
      'frxUSDNOK', 'frxUSDSEK', 'frxUSDPLN', 'frxUSDDKK',
      'frxUSDCZK', 'frxUSDHUF', 'frxUSDRON', 'frxUSDHRK',
      'frxEURNOK', 'frxEURSEK', 'frxEURPLN', 'frxEURDKK',
      'frxEURCZK', 'frxEURHUF', 'frxEURRON', 'frxEURHRK',
      'frxGBPNOK', 'frxGBPSEK', 'frxGBPPLN', 'frxGBPDKK',
      
      // ===== العملات الناشئة - أمريكا اللاتينية (Exotic Pairs - Latin America) =====
      'frxUSDMXN', 'frxUSDCLP', 'frxUSDBRL', 'frxUSDCOP',
      'frxUSDPEN', 'frxUSDUYU',
      'frxEURMXN', 'frxEURCLP', 'frxEURBRL',
      'frxGBPMXN', 'frxGBPCLP', 'frxGBPBRL',
      
      // ===== العملات الناشئة - آسيا (Exotic Pairs - Asia) =====
      'frxUSDTRY', 'frxUSDZAR', 'frxUSDSGD', 'frxUSDHKD',
      'frxUSDTHB', 'frxUSDKRW', 'frxUSDINR', 'frxUSDIDR',
      'frxUSDMYR', 'frxUSDPHP', 'frxUSDCNH',
      'frxEURTRY', 'frxEURZAR', 'frxEURSGD', 'frxEURHKD',
      'frxGBPTRY', 'frxGBPZAR', 'frxGBPSGD', 'frxGBPHKD',
      
      // ===== المؤشرات (Indices) =====
      'OTC_AUS_200', 'OTC_FCHI', 'OTC_FTSE', 'OTC_GDAXI',
      'OTC_DJI', 'OTC_SPC', 'OTC_N225', 'OTC_AS51',
      
      // ===== السلع (Commodities) =====
      'frxXAUUSD', 'frxXAGUSD', 'frxXPDUSD', 'frxXPTUSD',
      'frxBROUSD', 'frxWTIOUSD',
      
      // ===== العملات الرقمية الرئيسية (Major Cryptocurrencies) =====
      'cryBTCUSD', 'cryETHUSD', 'cryBNBUSD', 'cryXRPUSD',
      'cryADAUSD', 'crySOLUSD', 'cryDOTUSD', 'cryMATICUSD',
      'cryAVAXUSD', 'cryLINKUSD', 'cryUNIUSD',
      
      // ===== العملات الرقمية الإضافية (Additional Cryptocurrencies) =====
      'cryLTCUSD', 'cryBCHUSD', 'cryEOSUSD', 'cryXLMUSD',
      'cryTRXUSD', 'cryATOMUSD', 'cryALGOUSD', 'cryVETUSD',
      'cryFILUSD', 'cryXTZUSD', 'cryEGLDUSD', 'cryTHETAUSD',
      'cryAXSUSD', 'cryMANAUSD', 'crySANDUSD', 'cryGRTUSD',
      'cryFTMUSD', 'cryNEARUSD', 'cryAPEUSD', 'cryLDOUSD',
      'cryARBUSD', 'cryOPUSD', 'crySUIUSD', 'cryAPTUSD',
      
      // ===== المؤشرات التركيبية (Synthetic Indices) =====
      'R_10', 'R_25', 'R_50', 'R_75', 'R_100',
      '1HZ10V', '1HZ25V', '1HZ50V', '1HZ75V', '1HZ100V',
      'BOOM300N', 'BOOM500', 'BOOM1000',
      'CRASH300N', 'CRASH500', 'CRASH1000',
      'JD10', 'JD25', 'JD50', 'JD75', 'JD100',
      'JD150', 'JD200', 'JD250',
      'STPRNG', 'WLDAUD', 'WLDEUR', 'WLDGBP', 'WLDUSD',
      'WLDXAU'
    ];

    // الاشتراك في دفعات صغيرة (10 رموز في كل دفعة)
    const batchSize = 10;
    const delayBetweenBatches = 500; // نصف ثانية بين كل دفعة
    
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      
      // إرسال دفعة الرموز
      batch.forEach(symbol => {
        if (this.binaryWS && this.binaryWS.readyState === WebSocket.OPEN) {
          const request = {
            ticks: symbol,
            subscribe: 1
          };
          this.binaryWS.send(JSON.stringify(request));
          this.subscribedSymbols.add(symbol); // تتبع الرموز المشترك فيها
        }
      });

      // انتظار قبل إرسال الدفعة التالية
      if (i + batchSize < symbols.length) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }

  }

  /**
   * 📨 معالجة رسائل البيانات
   */
  private handleDataMessage(event: MessageEvent) {
    try {
      const data = JSON.parse(event.data);
      
      // معالجة رسالة pong
      if (data.pong) {
        // Pong received
        return;
      }
      
      // معالجة رسالة authorize
      if (data.authorize) {
        // Authorized
        return;
      }
      
      // معالجة رسالة error
      if (data.error) {

        return;
      }
      
      if (data.tick) {
        // تحويل الرمز إلى الرمز المحلي
        const sourceSymbol = data.tick.symbol;
        const localSymbol = this.convertSymbol(sourceSymbol);
        if (!localSymbol) {
          return;
        }
        
        // تتبع الرموز المستلمة
        if (!this.receivedSymbols.has(sourceSymbol)) {
          this.receivedSymbols.add(sourceSymbol);

        }
        
        // استقبال بيانات جديدة
        if (!this.quotes[localSymbol]) {

        }
        
        // استخدام القيم الدقيقة مباشرة
        const price = parseFloat(data.tick.quote);
        const bid = data.tick.bid ? parseFloat(data.tick.bid) : price;
        const ask = data.tick.ask ? parseFloat(data.tick.ask) : price;
        const timestamp = data.tick.epoch ? data.tick.epoch * 1000 : Date.now();
        
        // حساب التغيير
        const oldQuote = this.quotes[localSymbol];
        const change = oldQuote ? price - oldQuote.price : 0;
        const changePercent = oldQuote && oldQuote.price > 0 
          ? ((price - oldQuote.price) / oldQuote.price) * 100 
          : 0;
        
        // تحديث البيانات بالقيم الدقيقة
        this.quotes[localSymbol] = {
          symbol: localSymbol,
          price: price,
          bid: bid,
          ask: ask,
          change: change,
          changePercent: changePercent,
          timestamp: timestamp
        };
        
        // تم إيقاف logging لتقليل الإزعاج
      }
      
      // إشعار المستمعين فوراً (بدون تأخير)
      this.notifyListeners();
      this.lastUpdate = new Date();
      
    } catch (error) {

    }
  }

  /**
   * 🕐 فحص إذا كان سوق الفوركس مغلق
   */
  private isForexMarketClosed(): boolean {
    const now = new Date();
    const day = now.getUTCDay(); // 0 = الأحد, 6 = السبت
    const hour = now.getUTCHours();
    
    // سوق الفوركس مغلق في عطلة نهاية الأسبوع
    // يفتح: الأحد 22:00 GMT/UTC
    // يغلق: الجمعة 22:00 GMT/UTC
    if (day === 6) return true; // السبت - مغلق طوال اليوم
    if (day === 0 && hour < 22) return true; // الأحد قبل 22:00 UTC - مغلق
    if (day === 5 && hour >= 22) return true; // الجمعة بعد 22:00 UTC - مغلق
    
    return false; // السوق مفتوح
  }

  /**
   * 🔄 تحويل الرموز إلى رموز محلية (مع الحفاظ على OTC/عادي)
   */
  private convertSymbol(sourceSymbol: string): string | null {
    // فحص إذا كان السوق مغلق (عطلة نهاية الأسبوع أو خارج ساعات التداول)
    const isMarketClosed = this.isForexMarketClosed();
    
    const symbolMap: { [key: string]: string } = {
      // ===== العملات الرئيسية (Major Pairs) =====
      'frxEURUSD': isMarketClosed ? 'EURUSD_otc' : 'EURUSD',
      'frxGBPUSD': isMarketClosed ? 'GBPUSD_otc' : 'GBPUSD',
      'frxUSDJPY': isMarketClosed ? 'USDJPY_otc' : 'USDJPY',
      'frxAUDUSD': isMarketClosed ? 'AUDUSD_otc' : 'AUDUSD',
      'frxUSDCAD': isMarketClosed ? 'USDCAD_otc' : 'USDCAD',
      'frxUSDCHF': isMarketClosed ? 'USDCHF_otc' : 'USDCHF',
      'frxNZDUSD': isMarketClosed ? 'NZDUSD_otc' : 'NZDUSD',
      
      // ===== العملات المتقاطعة (Cross Pairs) =====
      'frxEURGBP': isMarketClosed ? 'EURGBP_otc' : 'EURGBP',
      'frxEURJPY': isMarketClosed ? 'EURJPY_otc' : 'EURJPY',
      'frxEURCHF': isMarketClosed ? 'EURCHF_otc' : 'EURCHF',
      'frxEURAUD': isMarketClosed ? 'EURAUD_otc' : 'EURAUD',
      'frxEURCAD': isMarketClosed ? 'EURCAD_otc' : 'EURCAD',
      'frxEURNZD': isMarketClosed ? 'EURNZD_otc' : 'EURNZD',
      'frxGBPJPY': isMarketClosed ? 'GBPJPY_otc' : 'GBPJPY',
      'frxGBPCHF': isMarketClosed ? 'GBPCHF_otc' : 'GBPCHF',
      'frxGBPAUD': isMarketClosed ? 'GBPAUD_otc' : 'GBPAUD',
      'frxGBPCAD': isMarketClosed ? 'GBPCAD_otc' : 'GBPCAD',
      'frxGBPNZD': isMarketClosed ? 'GBPNZD_otc' : 'GBPNZD',
      'frxAUDJPY': isMarketClosed ? 'AUDJPY_otc' : 'AUDJPY',
      'frxAUDCHF': isMarketClosed ? 'AUDCHF_otc' : 'AUDCHF',
      'frxAUDCAD': isMarketClosed ? 'AUDCAD_otc' : 'AUDCAD',
      'frxAUDNZD': isMarketClosed ? 'AUDNZD_otc' : 'AUDNZD',
      'frxNZDJPY': isMarketClosed ? 'NZDJPY_otc' : 'NZDJPY',
      'frxNZDCHF': isMarketClosed ? 'NZDCHF_otc' : 'NZDCHF',
      'frxNZDCAD': isMarketClosed ? 'NZDCAD_otc' : 'NZDCAD',
      'frxCADJPY': isMarketClosed ? 'CADJPY_otc' : 'CADJPY',
      'frxCADCHF': isMarketClosed ? 'CADCHF_otc' : 'CADCHF',
      'frxCHFJPY': isMarketClosed ? 'CHFJPY_otc' : 'CHFJPY',
      
      // ===== العملات الناشئة - أوروبا (Exotic Pairs - Europe) =====
      'frxUSDNOK': isMarketClosed ? 'USDNOK_otc' : 'USDNOK',
      'frxUSDSEK': isMarketClosed ? 'USDSEK_otc' : 'USDSEK',
      'frxUSDPLN': isMarketClosed ? 'USDPLN_otc' : 'USDPLN',
      'frxUSDDKK': isMarketClosed ? 'USDDKK_otc' : 'USDDKK',
      'frxUSDCZK': isMarketClosed ? 'USDCZK_otc' : 'USDCZK',
      'frxUSDHUF': isMarketClosed ? 'USDHUF_otc' : 'USDHUF',
      'frxUSDRON': isMarketClosed ? 'USDRON_otc' : 'USDRON',
      'frxUSDHRK': isMarketClosed ? 'USDHRK_otc' : 'USDHRK',
      'frxEURNOK': isMarketClosed ? 'EURNOK_otc' : 'EURNOK',
      'frxEURSEK': isMarketClosed ? 'EURSEK_otc' : 'EURSEK',
      'frxEURPLN': isMarketClosed ? 'EURPLN_otc' : 'EURPLN',
      'frxEURDKK': isMarketClosed ? 'EURDKK_otc' : 'EURDKK',
      'frxEURCZK': isMarketClosed ? 'EURCZK_otc' : 'EURCZK',
      'frxEURHUF': isMarketClosed ? 'EURHUF_otc' : 'EURHUF',
      'frxEURRON': isMarketClosed ? 'EURRON_otc' : 'EURRON',
      'frxEURHRK': isMarketClosed ? 'EURHRK_otc' : 'EURHRK',
      'frxGBPNOK': isMarketClosed ? 'GBPNOK_otc' : 'GBPNOK',
      'frxGBPSEK': isMarketClosed ? 'GBPSEK_otc' : 'GBPSEK',
      'frxGBPPLN': isMarketClosed ? 'GBPPLN_otc' : 'GBPPLN',
      'frxGBPDKK': isMarketClosed ? 'GBPDKK_otc' : 'GBPDKK',
      
      // ===== العملات الناشئة - أمريكا اللاتينية (Exotic Pairs - Latin America) =====
      'frxUSDMXN': isMarketClosed ? 'USDMXN_otc' : 'USDMXN',
      'frxUSDCLP': isMarketClosed ? 'USDCLP_otc' : 'USDCLP',
      'frxUSDBRL': isMarketClosed ? 'USDBRL_otc' : 'USDBRL',
      'frxUSDCOP': isMarketClosed ? 'USDCOP_otc' : 'USDCOP',
      'frxUSDPEN': isMarketClosed ? 'USDPEN_otc' : 'USDPEN',
      'frxUSDUYU': isMarketClosed ? 'USDUYU_otc' : 'USDUYU',
      'frxEURMXN': isMarketClosed ? 'EURMXN_otc' : 'EURMXN',
      'frxEURCLP': isMarketClosed ? 'EURCLP_otc' : 'EURCLP',
      'frxEURBRL': isMarketClosed ? 'EURBRL_otc' : 'EURBRL',
      'frxGBPMXN': isMarketClosed ? 'GBPMXN_otc' : 'GBPMXN',
      'frxGBPCLP': isMarketClosed ? 'GBPCLP_otc' : 'GBPCLP',
      'frxGBPBRL': isMarketClosed ? 'GBPBRL_otc' : 'GBPBRL',
      
      // ===== العملات الناشئة - آسيا (Exotic Pairs - Asia) =====
      'frxUSDTRY': isMarketClosed ? 'USDTRY_otc' : 'USDTRY',
      'frxUSDZAR': isMarketClosed ? 'USDZAR_otc' : 'USDZAR',
      'frxUSDSGD': isMarketClosed ? 'USDSGD_otc' : 'USDSGD',
      'frxUSDHKD': isMarketClosed ? 'USDHKD_otc' : 'USDHKD',
      'frxUSDTHB': isMarketClosed ? 'USDTHB_otc' : 'USDTHB',
      'frxUSDKRW': isMarketClosed ? 'USDKRW_otc' : 'USDKRW',
      'frxUSDINR': isMarketClosed ? 'USDINR_otc' : 'USDINR',
      'frxUSDIDR': isMarketClosed ? 'USDIDR_otc' : 'USDIDR',
      'frxUSDMYR': isMarketClosed ? 'USDMYR_otc' : 'USDMYR',
      'frxUSDPHP': isMarketClosed ? 'USDPHP_otc' : 'USDPHP',
      'frxUSDCNH': isMarketClosed ? 'USDCNH_otc' : 'USDCNH',
      'frxEURTRY': isMarketClosed ? 'EURTRY_otc' : 'EURTRY',
      'frxEURZAR': isMarketClosed ? 'EURZAR_otc' : 'EURZAR',
      'frxEURSGD': isMarketClosed ? 'EURSGD_otc' : 'EURSGD',
      'frxEURHKD': isMarketClosed ? 'EURHKD_otc' : 'EURHKD',
      'frxGBPTRY': isMarketClosed ? 'GBPTRY_otc' : 'GBPTRY',
      'frxGBPZAR': isMarketClosed ? 'GBPZAR_otc' : 'GBPZAR',
      'frxGBPSGD': isMarketClosed ? 'GBPSGD_otc' : 'GBPSGD',
      'frxGBPHKD': isMarketClosed ? 'GBPHKD_otc' : 'GBPHKD',
      
      // ===== المؤشرات (Indices) - OTC دائماً =====
      'OTC_AUS_200': 'AUS200',
      'OTC_FCHI': 'FCHI',
      'OTC_FTSE': 'FTSE',
      'OTC_GDAXI': 'GDAXI',
      'OTC_DJI': 'DJI',
      'OTC_SPC': 'SPC',
      'OTC_N225': 'N225',
      'OTC_AS51': 'AS51',
      
      // ===== السلع (Commodities) =====
      'frxXAUUSD': isMarketClosed ? 'XAUUSD_otc' : 'XAUUSD',
      'frxXAGUSD': isMarketClosed ? 'XAGUSD_otc' : 'XAGUSD',
      'frxXPDUSD': isMarketClosed ? 'XPDUSD_otc' : 'XPDUSD',
      'frxXPTUSD': isMarketClosed ? 'XPTUSD_otc' : 'XPTUSD',
      'frxBROUSD': isMarketClosed ? 'BROUSD_otc' : 'BROUSD',
      'frxWTIOUSD': isMarketClosed ? 'WTIOUSD_otc' : 'WTIOUSD',
      
      // ===== العملات الرقمية الرئيسية (Major Cryptocurrencies) - 24/7 =====
      'cryBTCUSD': 'BTCUSD',
      'cryETHUSD': 'ETHUSD',
      'cryBNBUSD': 'BNBUSD',
      'cryXRPUSD': 'XRPUSD',
      'cryADAUSD': 'ADAUSD',
      'crySOLUSD': 'SOLUSD',
      'cryDOTUSD': 'DOTUSD',
      'cryMATICUSD': 'MATICUSD',
      'cryAVAXUSD': 'AVAXUSD',
      'cryLINKUSD': 'LINKUSD',
      'cryUNIUSD': 'UNIUSD',
      
      // ===== العملات الرقمية الإضافية (Additional Cryptocurrencies) - 24/7 =====
      'cryLTCUSD': 'LTCUSD',
      'cryBCHUSD': 'BCHUSD',
      'cryEOSUSD': 'EOSUSD',
      'cryXLMUSD': 'XLMUSD',
      'cryTRXUSD': 'TRXUSD',
      'cryATOMUSD': 'ATOMUSD',
      'cryALGOUSD': 'ALGOUSD',
      'cryVETUSD': 'VETUSD',
      'cryFILUSD': 'FILUSD',
      'cryXTZUSD': 'XTZUSD',
      'cryEGLDUSD': 'EGLDUSD',
      'cryTHETAUSD': 'THETAUSD',
      'cryAXSUSD': 'AXSUSD',
      'cryMANAUSD': 'MANAUSD',
      'crySANDUSD': 'SANDUSD',
      'cryGRTUSD': 'GRTUSD',
      'cryFTMUSD': 'FTMUSD',
      'cryNEARUSD': 'NEARUSD',
      'cryAPEUSD': 'APEUSD',
      'cryLDOUSD': 'LDOUSD',
      'cryARBUSD': 'ARBUSD',
      'cryOPUSD': 'OPUSD',
      'crySUIUSD': 'SUIUSD',
      'cryAPTUSD': 'APTUSD',
      
      // ===== المؤشرات التركيبية (Synthetic Indices) - 24/7 =====
      'R_10': 'R_10',
      'R_25': 'R_25',
      'R_50': 'R_50',
      'R_75': 'R_75',
      'R_100': 'R_100',
      '1HZ10V': '1HZ10V',
      '1HZ25V': '1HZ25V',
      '1HZ50V': '1HZ50V',
      '1HZ75V': '1HZ75V',
      '1HZ100V': '1HZ100V',
      'BOOM300N': 'BOOM300N',
      'BOOM500': 'BOOM500',
      'BOOM1000': 'BOOM1000',
      'CRASH300N': 'CRASH300N',
      'CRASH500': 'CRASH500',
      'CRASH1000': 'CRASH1000',
      'JD10': 'JD10',
      'JD25': 'JD25',
      'JD50': 'JD50',
      'JD75': 'JD75',
      'JD100': 'JD100',
      'JD150': 'JD150',
      'JD200': 'JD200',
      'JD250': 'JD250',
      'STPRNG': 'STPRNG',
      'WLDAUD': 'WLDAUD',
      'WLDEUR': 'WLDEUR',
      'WLDGBP': 'WLDGBP',
      'WLDUSD': 'WLDUSD',
      'WLDXAU': 'WLDXAU'
    };
    
    return symbolMap[sourceSymbol] || null;
  }

  /**
   * 🔄 إعادة الاتصال التلقائي
   */
  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {

      this.fetchFallbackData();
      return;
    }
    
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // exponential backoff
    
    // إعادة محاولة الاتصال
    
    setTimeout(() => {
      if (this.isRunning) {
        this.connectToDataService();
      }
    }, delay);
  }

  /**
   * 📡 جلب البيانات الاحتياطية (عند فشل WebSocket)
   */
  private fetchFallbackData() {

    // محاولة إعادة الاتصال تلقائياً
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      // محاولة إعادة الاتصال
      this.handleReconnect();
    } else {

    }
  }

  /**
   * 📢 إشعار جميع المستمعين بالتحديثات
   */
  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener.callback(this.quotes);
      } catch (error) {

      }
    });
  }

  /**
   * 🎧 الاشتراك في التحديثات المباشرة
   */
  subscribe(id: string, callback: (quotes: { [symbol: string]: RealTimeQuote }) => void): () => void {
    // اشتراك جديد
    
    const listener: RealTimeDataListener = { id, callback };
    this.listeners.push(listener);
    
    // إرسال البيانات الحالية فوراً
    if (Object.keys(this.quotes).length > 0) {
      callback(this.quotes);
    }
    
    // بدء الخدمة إذا لم تكن تعمل
    if (!this.isRunning) {
      this.start();
    }
    
    // إرجاع دالة إلغاء الاشتراك
    return () => {
      this.unsubscribe(id);
    };
  }

  /**
   * 🔕 إلغاء الاشتراك
   */
  unsubscribe(id: string) {
    // إلغاء اشتراك
    this.listeners = this.listeners.filter(listener => listener.id !== id);
    
    // إيقاف الخدمة إذا لم يعد هناك مستمعون
    if (this.listeners.length === 0) {
      this.stop();
    }
  }

  /**
   * 📊 الحصول على البيانات الحالية
   */
  getCurrentQuotes(): { [symbol: string]: RealTimeQuote } {
    const quotesCount = Object.keys(this.quotes).length;
    if (quotesCount === 0) {

    }
    return { ...this.quotes };
  }

  /**
   * ⏰ الحصول على وقت آخر تحديث
   */
  getLastUpdate(): Date | null {
    return this.lastUpdate;
  }

  /**
   * 🔄 الحصول على حالة الخدمة
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * 📈 الحصول على عدد المستمعين
   */
  getListenersCount(): number {
    return this.listeners.length;
  }
}

// إنشاء مثيل واحد مشترك
export const realTimeDataService = new RealTimeDataService();
