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
  private lastUpdate: Date | null = null;
  private binaryWS: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
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
          console.error('⏱️ انتهت مهلة الاتصال - إعادة المحاولة...');
          this.binaryWS.close();
          this.handleReconnect();
        }
      }, 10000); // 10 ثوانٍ timeout
      
      this.binaryWS.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log('✅ WebSocket متصل');
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
          console.log(`📊 إحصائيات Binary.com:`);
          console.log(`   - رموز مشترك فيها: ${this.subscribedSymbols.size}`);
          console.log(`   - رموز مستلمة: ${this.receivedSymbols.size}`);
          console.log(`   - رموز نشطة: ${Object.keys(this.quotes).length}`);
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
      
      this.binaryWS.onerror = (error) => {
        clearTimeout(connectionTimeout);
        console.error('❌ خطأ في خدمة البيانات:', error);
        console.error('🌐 البيئة الحالية:', {
          hostname: window.location.hostname,
          protocol: window.location.protocol,
          isSecure: window.location.protocol === 'https:'
        });
      };
      
    } catch (error) {
      console.error('❌ فشل الاتصال بخدمة البيانات:', error);
      console.error('📋 تفاصيل الخطأ:', error);
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
      // العملات الرئيسية (Major Pairs) - أزواج الفوركس فقط
      'frxEURUSD', 'frxGBPUSD', 'frxUSDJPY', 'frxAUDUSD', 
      'frxUSDCAD', 'frxUSDCHF', 'frxNZDUSD',
      
      // العملات المتقاطعة (Cross Pairs) - أزواج الفوركس فقط
      'frxEURGBP', 'frxEURJPY', 'frxEURCHF', 'frxEURAUD', 
      'frxEURCAD', 'frxEURNZD', 'frxGBPJPY', 'frxGBPCHF', 
      'frxGBPAUD', 'frxGBPCAD', 'frxGBPNZD', 'frxAUDJPY', 
      'frxAUDCHF', 'frxAUDCAD', 'frxAUDNZD', 'frxNZDJPY', 
      'frxNZDCHF', 'frxNZDCAD', 'frxCADJPY', 'frxCADCHF', 
      'frxCHFJPY'
    ];
    
    console.log(`📡 بدء الاشتراك في ${symbols.length} رمز...`);
    
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
      
      console.log(`✅ تم الاشتراك في الدفعة ${Math.floor(i / batchSize) + 1}/${Math.ceil(symbols.length / batchSize)} (${batch.length} رموز)`);
      
      // انتظار قبل إرسال الدفعة التالية
      if (i + batchSize < symbols.length) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }
    
    console.log(`🎉 تم الاشتراك في جميع الرموز (${symbols.length} رمز)`);
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
        console.error('❌ WebSocket error:', data.error.message);
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
          console.log(`📊 رمز جديد: ${localSymbol} (${this.receivedSymbols.size}/${this.subscribedSymbols.size})`);
        }
        
        // استقبال بيانات جديدة
        if (!this.quotes[localSymbol]) {
          console.log(`📊 ${localSymbol}: ${data.tick.quote}`);
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
      console.error('❌ خطأ في معالجة رسالة البيانات:', error);
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
      // العملات الرئيسية (Major Pairs) - عادي أو OTC حسب وقت السوق
      'frxEURUSD': isMarketClosed ? 'EURUSD_OTC' : 'EURUSD',
      'frxGBPUSD': isMarketClosed ? 'GBPUSD_OTC' : 'GBPUSD',
      'frxUSDJPY': isMarketClosed ? 'USDJPY_OTC' : 'USDJPY',
      'frxAUDUSD': isMarketClosed ? 'AUDUSD_OTC' : 'AUDUSD',
      'frxUSDCAD': isMarketClosed ? 'USDCAD_OTC' : 'USDCAD',
      'frxUSDCHF': isMarketClosed ? 'USDCHF_OTC' : 'USDCHF',
      'frxNZDUSD': isMarketClosed ? 'NZDUSD_OTC' : 'NZDUSD',
      
      // العملات المتقاطعة (Cross Pairs) - عادي أو OTC حسب وقت السوق
      'frxEURGBP': isMarketClosed ? 'EURGBP_OTC' : 'EURGBP',
      'frxEURJPY': isMarketClosed ? 'EURJPY_OTC' : 'EURJPY',
      'frxEURCHF': isMarketClosed ? 'EURCHF_OTC' : 'EURCHF',
      'frxEURAUD': isMarketClosed ? 'EURAUD_OTC' : 'EURAUD',
      'frxEURCAD': isMarketClosed ? 'EURCAD_OTC' : 'EURCAD',
      'frxEURNZD': isMarketClosed ? 'EURNZD_OTC' : 'EURNZD',
      'frxGBPJPY': isMarketClosed ? 'GBPJPY_OTC' : 'GBPJPY',
      'frxGBPCHF': isMarketClosed ? 'GBPCHF_OTC' : 'GBPCHF',
      'frxGBPAUD': isMarketClosed ? 'GBPAUD_OTC' : 'GBPAUD',
      'frxGBPCAD': isMarketClosed ? 'GBPCAD_OTC' : 'GBPCAD',
      'frxGBPNZD': isMarketClosed ? 'GBPNZD_OTC' : 'GBPNZD',
      'frxAUDJPY': isMarketClosed ? 'AUDJPY_OTC' : 'AUDJPY',
      'frxAUDCHF': isMarketClosed ? 'AUDCHF_OTC' : 'AUDCHF',
      'frxAUDCAD': isMarketClosed ? 'AUDCAD_OTC' : 'AUDCAD',
      'frxAUDNZD': isMarketClosed ? 'AUDNZD_OTC' : 'AUDNZD',
      'frxNZDJPY': isMarketClosed ? 'NZDJPY_OTC' : 'NZDJPY',
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
      console.error('❌ فشل في إعادة الاتصال - التبديل للبيانات الاحتياطية');
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
    console.warn('⚠️ WebSocket غير متصل - محاولة إعادة الاتصال...');
    console.warn('🌐 البيئة:', window.location.hostname);
    console.warn('💡 إذا استمرت المشكلة، تحقق من:');
    console.warn('   1. اتصال الإنترنت');
    console.warn('   2. إعدادات CORS');
    console.warn('   3. جدار الحماية');
    
    // محاولة إعادة الاتصال تلقائياً
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      // محاولة إعادة الاتصال
      this.handleReconnect();
    } else {
      console.error('❌ فشلت جميع محاولات إعادة الاتصال');
      console.error('💡 يرجى إعادة تحميل الصفحة');
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
        console.error(`❌ خطأ في إشعار المستمع ${listener.id}:`, error);
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
      console.warn('⚠️ لا توجد أسعار متاحة! تحقق من اتصال خدمة البيانات');
      console.warn('🌐 البيئة:', window.location.hostname);
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
