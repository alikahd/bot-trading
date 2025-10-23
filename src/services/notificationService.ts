import { BinarySignal } from './binaryOptionsSignals';

class NotificationService {
  private audioContext: AudioContext | null = null;
  private isEnabled = true;

  constructor() {
    // إنشاء AudioContext عند الحاجة
    this.initAudioContext();
  }

  private initAudioContext() {
    // AudioContext will be created on first user interaction
    // to comply with browser autoplay policies
  }
  
  private ensureAudioContext() {
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        console.warn('Audio notifications not supported:', error);
      }
    }
  }

  // تشغيل صوت تنبيه للإشارة
  playSignalAlert(signal: BinarySignal) {
    if (!this.isEnabled) return;
    
    // Create AudioContext on first user interaction
    this.ensureAudioContext();
    if (!this.audioContext) return;

    try {
      // إنشاء نغمة مختلفة حسب نوع الإشارة
      const frequency = signal.direction === 'CALL' ? 800 : 600; // نغمة أعلى للشراء
      const duration = 0.3; // ثلث ثانية

      this.playTone(frequency, duration);

      // إشعار المتصفح
      this.showBrowserNotification(signal);

    } catch (error) {
      console.error('خطأ في تشغيل التنبيه الصوتي:', error);
    }
  }

  // تشغيل نغمة
  public playTone(frequency: number, duration: number) {
    this.ensureAudioContext();
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = 'sine';

    // تدرج الصوت
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // إشعار المتصفح
  private async showBrowserNotification(signal: BinarySignal) {
    if (!('Notification' in window)) return;

    // طلب الإذن إذا لم يكن ممنوحاً
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }

    if (Notification.permission === 'granted') {
      const notification = new Notification(`إشارة جديدة - ${signal.symbol}`, {
        body: `${signal.direction === 'CALL' ? 'شراء' : 'بيع'} - ثقة: ${signal.confidence}% - مدة: ${signal.expiryTime} دقيقة`,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: signal.id,
        requireInteraction: true,
      });

      // إغلاق الإشعار تلقائياً بعد 10 ثوانٍ
      setTimeout(() => {
        notification.close();
      }, 10000);

      // التعامل مع النقر على الإشعار
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  }

  // تشغيل صوت نجاح الصفقة
  playSuccessSound() {
    if (!this.isEnabled) return;
    
    this.ensureAudioContext();
    if (!this.audioContext) return;
    
    // نغمة صاعدة للنجاح
    this.playTone(523, 0.2); // C5
    setTimeout(() => this.playTone(659, 0.2), 100); // E5
    setTimeout(() => this.playTone(784, 0.3), 200); // G5
  }

  // تشغيل صوت فشل الصفقة
  playFailureSound() {
    if (!this.isEnabled) return;
    
    this.ensureAudioContext();
    if (!this.audioContext) return;
    
    // نغمة هابطة للفشل
    this.playTone(400, 0.2);
    setTimeout(() => this.playTone(350, 0.2), 100);
    setTimeout(() => this.playTone(300, 0.3), 200);
  }

  // تشغيل صوت تحذير
  playWarningSound() {
    if (!this.isEnabled) return;
    
    this.ensureAudioContext();
    if (!this.audioContext) return;
    
    // نغمة متكررة للتحذير
    for (let i = 0; i < 3; i++) {
      setTimeout(() => this.playTone(1000, 0.1), i * 150);
    }
  }

  // تفعيل/إلغاء التنبيهات
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  // التحقق من حالة التنبيهات
  isNotificationEnabled(): boolean {
    return this.isEnabled;
  }

  // طلب أذونات الإشعارات
  async requestPermissions(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('المتصفح لا يدعم الإشعارات');
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  // إشعار انتهاء صلاحية الصفقة
  notifyTradeExpiry(signal: BinarySignal, result: 'WIN' | 'LOSS') {
    this.showBrowserNotification({
      ...signal,
      id: `expiry_${signal.id}`,
    });

    if (result === 'WIN') {
      this.playSuccessSound();
    } else {
      this.playFailureSound();
    }
  }

  // تنبيه عند وصول الصفقة لنقطة الربح/الخسارة
  notifyPriceAlert(symbol: string, _currentPrice: number, targetPrice: number, type: 'PROFIT' | 'LOSS') {
    const message = type === 'PROFIT' 
      ? `وصل ${symbol} لنقطة الربح: ${targetPrice}`
      : `وصل ${symbol} لنقطة الخسارة: ${targetPrice}`;

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`تنبيه سعر - ${symbol}`, {
        body: message,
        icon: '/favicon.ico'
      });
    }

    if (type === 'PROFIT') {
      this.playSuccessSound();
    } else {
      this.playWarningSound();
    }
  }

  // تنبيه عند تغيير حالة الاتصال
  notifyConnectionStatus(isConnected: boolean) {
    const message = isConnected ? 'تم الاتصال بالبيانات المباشرة' : 'انقطع الاتصال - التبديل للبيانات المحاكاة';
    
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('حالة الاتصال', {
        body: message,
        icon: '/favicon.ico'
      });
    }

    // صوت مختلف حسب الحالة
    if (isConnected) {
      this.playTone(800, 0.2);
    } else {
      this.playWarningSound();
    }
  }
}

export const notificationService = new NotificationService();
