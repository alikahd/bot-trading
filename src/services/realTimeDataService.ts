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
      // العملات الرئيسية (Major Pairs)
      'frxEURUSD', 'frxGBPUSD', 'frxUSDJPY', 'frxAUDUSD', 
      'frxUSDCAD', 'frxUSDCHF', 'frxNZDUSD',
      
      // العملات المتقاطعة (Cross Pairs)
      'frxEURGBP', 'frxEURJPY', 'frxEURCHF', 'frxEURAUD', 
      'frxEURCAD', 'frxEURNZD', 'frxGBPJPY', 'frxGBPCHF', 
      'frxGBPAUD', 'frxGBPCAD', 'frxGBPNZD', 'frxAUDJPY', 
      'frxAUDCHF', 'frxAUDCAD', 'frxAUDNZD', 'frxNZDJPY', 
      'frxNZDCHF', 'frxNZDCAD', 'frxCADJPY', 'frxCADCHF', 
      'frxCHFJPY'
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
    // الجمعة بعد 21:00 UTC إلى الأحد قبل 21:00 UTC
    if (day === 6) return true; // السبت - مغلق
    if (day === 0 && hour < 21) return true; // الأحد قبل 21:00 - مغلق
    if (day === 5 && hour >= 21) return true; // الجمعة بعد 21:00 - مغلق
    
    return false; // السوق مفتوح
  }

  /**
   * 🔄 تحويل الرموز إلى رموز محلية (مع الحفاظ على OTC/عادي)
   */
  private convertSymbol(sourceSymbol: string): string | null {
    // فحص إذا كان السوق مغلق (عطلة نهاية الأسبوع أو خارج ساعات التداول)
    const isMarketClosed = this.isForexMarketClosed();
    
    const symbolMap: { [key: string]: string } = {
      // العملات الرئيسية (Major Pairs) - يتحول تلقائياً لـ OTC عند إغلاق السوق
      'frxEURUSD': isMarketClosed ? 'EURUSD_otc' : 'EURUSD',
      'frxGBPUSD': isMarketClosed ? 'GBPUSD_otc' : 'GBPUSD',
      'frxUSDJPY': isMarketClosed ? 'USDJPY_otc' : 'USDJPY',
      'frxAUDUSD': isMarketClosed ? 'AUDUSD_otc' : 'AUDUSD',
      'frxUSDCAD': isMarketClosed ? 'USDCAD_otc' : 'USDCAD',
      'frxUSDCHF': isMarketClosed ? 'USDCHF_otc' : 'USDCHF',
      'frxNZDUSD': isMarketClosed ? 'NZDUSD_otc' : 'NZDUSD',
      
      // العملات المتقاطعة (Cross Pairs) - يتحول تلقائياً لـ OTC عند إغلاق السوق
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
      'frxNZDCHF': 'NZDCHF',
      'frxNZDCAD': 'NZDCAD',
      'frxCADJPY': 'CADJPY',
      'frxCADCHF': 'CADCHF',
      'frxCHFJPY': 'CHFJPY'
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
