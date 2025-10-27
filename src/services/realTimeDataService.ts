/**
 * 🚀 خدمة البيانات المباشرة الفورية
 * =======================================
 * نظام مزامنة فوري للأسعار بين جميع المكونات
 */

import { API_ENDPOINTS } from '../config/serverConfig';

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

  /**
   * 🎯 بدء خدمة البيانات المباشرة
   */
  start() {
    if (this.isRunning) return;
    
    console.log('🚀 بدء خدمة البيانات المباشرة الفورية...');
    this.isRunning = true;
    
    // جلب فوري عند البدء
    this.fetchData();
    
    // تحديث كل 2 ثانية للمزامنة الفورية (أسرع)
    this.updateInterval = setInterval(() => {
      this.fetchData();
    }, 2000);
  }

  /**
   * ⏹️ إيقاف خدمة البيانات المباشرة
   */
  stop() {
    if (!this.isRunning) return;
    
    console.log('⏹️ إيقاف خدمة البيانات المباشرة...');
    this.isRunning = false;
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * 📡 جلب البيانات من IQ Option Server
   */
  private async fetchData() {
    try {
      const response = await fetch(API_ENDPOINTS.quotes);
      
      if (!response.ok) {
        console.warn('⚠️ فشل الاتصال بخادم IQ Option - لا توجد بيانات للعرض');
        this.simulateMarketMovement();
        return;
      }

      const data = await response.json();
      const timestamp = Date.now();
      
      // تحويل البيانات إلى تنسيق موحد
      const newQuotes: { [symbol: string]: RealTimeQuote } = {};
      
      Object.entries(data).forEach(([symbol, quoteData]: [string, any]) => {
        const oldQuote = this.quotes[symbol];
        const currentPrice = quoteData.price;
        
        // حساب التغيير
        const change = oldQuote ? currentPrice - oldQuote.price : 0;
        const changePercent = oldQuote && oldQuote.price > 0 
          ? ((currentPrice - oldQuote.price) / oldQuote.price) * 100 
          : 0;

        newQuotes[symbol] = {
          symbol,
          price: currentPrice,
          bid: currentPrice * 0.99999,
          ask: currentPrice * 1.00001,
          change: change,
          changePercent: changePercent,
          timestamp
        };
      });

      // تحديث البيانات المحلية
      this.quotes = newQuotes;
      this.lastUpdate = new Date();
      
      // إشعار جميع المستمعين
      this.notifyListeners();
      
      console.log(`📊 تم تحديث ${Object.keys(newQuotes).length} سعر من السيرفر`);
      
    } catch (error) {
      console.error('❌ خطأ في جلب البيانات المباشرة:', error);
      this.simulateMarketMovement();
    }
  }

  /**
   * 📈 محاكاة حركة السوق الواقعية - معطلة عند عدم الاتصال
   */
  private simulateMarketMovement() {
    // لا نعرض بيانات افتراضية عندما يكون السيرفر خارج الخدمة
    console.log('⚠️ السيرفر غير متاح - لا توجد بيانات للعرض');
    
    // مسح البيانات الموجودة
    this.quotes = {};
    this.lastUpdate = null;
    this.notifyListeners();
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
    console.log(`🎧 اشتراك جديد: ${id}`);
    
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
    console.log(`🔕 إلغاء اشتراك: ${id}`);
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
