/**
 * 🔔 خدمة التنبيهات الصوتية
 * تشغيل صوت عند ظهور توصيات جديدة
 */

class NotificationSoundService {
  private audio: HTMLAudioElement | null = null;
  private isEnabled: boolean = true;
  private lastNotificationTime: number = 0;
  private minTimeBetweenNotifications: number = 3000; // 3 ثواني بين التنبيهات

  constructor() {
    this.initAudio();
  }

  /**
   * تهيئة الصوت - استخدام Web Audio API مباشرة
   */
  private initAudio() {
    try {
      // لا نحتاج لإنشاء Audio element هنا
      // سنستخدم Web Audio API مباشرة في play()
      console.log('✅ تم تهيئة خدمة التنبيهات الصوتية');
    } catch (error) {
      console.error('❌ فشل تهيئة الصوت:', error);
    }
  }

  /**
   * توليد وتشغيل صوت تنبيه هادئ ونقي
   */
  private playBeepSound(): void {
    try {
      console.log('🎵 بدء إنشاء Web Audio Context...');
      
      // إنشاء Audio Context
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      
      if (!AudioContext) {
        console.error('❌ Web Audio API غير مدعوم في هذا المتصفح');
        this.playFallbackSound();
        return;
      }
      
      const audioContext = new AudioContext();
      console.log(`✅ Audio Context تم إنشاؤه - الحالة: ${audioContext.state}`);
      
      // إنشاء oscillator (مولد النغمة)
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // توصيل العقد
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // إعدادات الصوت - نغمة ناعمة وهادئة
      oscillator.type = 'sine'; // موجة جيبية نقية (أنعم صوت)
      oscillator.frequency.value = 523.25; // نغمة C5 (متوسطة وهادئة)
      
      // تأثير fade in و fade out سلس جداً
      const currentTime = audioContext.currentTime;
      const fadeDuration = 0.08; // fade سريع وناعم
      const sustainDuration = 0.25; // مدة الصوت الأساسية
      const totalDuration = fadeDuration * 2 + sustainDuration;
      
      // Fade in ناعم
      gainNode.gain.setValueAtTime(0, currentTime);
      gainNode.gain.linearRampToValueAtTime(0.25, currentTime + fadeDuration); // مستوى صوت هادئ
      
      // Sustain (الاستمرار)
      gainNode.gain.setValueAtTime(0.25, currentTime + fadeDuration);
      
      // Fade out ناعم جداً
      gainNode.gain.linearRampToValueAtTime(0, currentTime + totalDuration);
      
      console.log('🎶 تشغيل نغمة هادئة ونقية (523Hz - C5)');
      
      // تشغيل الصوت
      oscillator.start(currentTime);
      oscillator.stop(currentTime + totalDuration);
      
      console.log('✅ تم تشغيل صوت التنبيه بنجاح (Web Audio API)');
      
      // إغلاق context بعد انتهاء الصوت
      setTimeout(() => {
        audioContext.close();
        console.log('🔚 تم إغلاق Audio Context');
      }, (totalDuration + 0.1) * 1000);
      
    } catch (error) {
      console.error('❌ فشل تشغيل صوت beep:', error);
      console.error('📋 تفاصيل الخطأ:', error);
      // محاولة بديلة باستخدام Audio element
      console.log('🔄 محاولة الصوت البديل...');
      this.playFallbackSound();
    }
  }

  /**
   * صوت بديل باستخدام Audio element
   */
  private playFallbackSound(): void {
    try {
      console.log('🎵 محاولة الصوت البديل (Audio element)...');
      
      if (!this.audio) {
        console.log('📝 إنشاء Audio element جديد...');
        this.audio = new Audio();
        // استخدام data URL لصوت بسيط
        this.audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUKnl8LVkHAU2kdXzzn0vBSJ1xe/glEILElyx6OyrWBUIQ5zd8sFuJAUuhM/z24s4BxlqvvHlnU4LDlCp5fC1ZBwFNpHV88+ALwUhcsXv4ZVDCxFbr+frrVkVB0Kb3fLCcCUFLoTP89uLOAcZar7x5Z1OCw5QqeXwtWQcBTaR1fPPgC8FIXLF7+GVQwsRW6/n661ZFQdCm93ywm8lBS6Ez/PbizgHGWq+8eWdTgsOUKnl8LVkHAU2kdXzz4AvBSFyxe/hlUMLEVuv5+utWRUHQpvd8sJvJQUuhM/z24s4BxlqvvHlnU4LDlCp5fC1ZBwFNpHV88+ALwUhcsXv4ZVDCxFbr+frrVkVB0Kb3fLCbyUFLoTP89uLOAcZar7x5Z1OCw5QqeXwtWQcBTaR1fPPgC8FIXLF7+GVQwsRW6/n661ZFQdCm93ywm8lBS6Ez/PbizgHGWq+8eWdTgsOUKnl8LVkHAU2kdXzz4AvBSFyxe/hlUMLEVuv5+utWRUHQpvd8sJvJQUuhM/z24s4BxlqvvHlnU4LDlCp5fC1ZBwFNpHV88+ALwUhcsXv4ZVDCxFbr+frrVkVB0Kb3fLCbyUFLoTP89uLOAcZar7x5Z1OCw5QqeXwtWQcBTaR1fPPgC8FIXLFw==';
        this.audio.volume = 0.7; // مستوى صوت أعلى
        console.log(`✅ Audio element تم إنشاؤه - مستوى الصوت: ${this.audio.volume}`);
      }
      
      this.audio.currentTime = 0;
      console.log('▶️ محاولة تشغيل الصوت...');
      
      const playPromise = this.audio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('✅ تم تشغيل الصوت البديل بنجاح!');
          })
          .catch(err => {
            console.error('❌ فشل تشغيل الصوت البديل:', err);
            console.error('💡 نصيحة: تأكد من الضغط على زر الصوت 🔊 أولاً لتفعيل الصوت');
          });
      }
      
    } catch (error) {
      console.error('❌ فشل تشغيل الصوت البديل:', error);
      console.error('📋 تفاصيل الخطأ:', error);
    }
  }

  /**
   * تشغيل صوت التنبيه
   */
  public play(): void {
    if (!this.isEnabled) {
      console.log('🔇 الصوت معطل - لن يتم التشغيل');
      return;
    }

    // منع التنبيهات المتكررة بسرعة
    const now = Date.now();
    if (now - this.lastNotificationTime < this.minTimeBetweenNotifications) {
      console.log('⏱️ انتظار بين التنبيهات...');
      return;
    }

    console.log('🔊 محاولة تشغيل صوت التنبيه...');
    
    // استخدام Web Audio API مباشرة
    this.playBeepSound();
    this.lastNotificationTime = now;
  }

  /**
   * تفعيل/تعطيل التنبيهات
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    console.log(`🔔 التنبيهات الصوتية: ${enabled ? 'مفعلة' : 'معطلة'}`);
  }

  /**
   * تغيير مستوى الصوت (0.0 - 1.0)
   */
  public setVolume(volume: number): void {
    if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * الحصول على حالة التفعيل
   */
  public isNotificationEnabled(): boolean {
    return this.isEnabled;
  }
}

// تصدير نسخة واحدة (Singleton)
export const notificationSound = new NotificationSoundService();
