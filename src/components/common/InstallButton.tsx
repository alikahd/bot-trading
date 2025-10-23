import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Sparkles } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface InstallButtonProps {
  className?: string;
}

export const InstallButton: React.FC<InstallButtonProps> = ({ className = '' }) => {
  // State variables for PWA installation
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const { t } = useLanguage();

  useEffect(() => {
    // فحص أولي لحالة التثبيت
    const checkInstallStatus = () => {
      const hasServiceWorker = 'serviceWorker' in navigator;
      const hasManifest = document.querySelector('link[rel="manifest"]');
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = (window.navigator as any).standalone === true;
      const isInstalled = isStandalone || isInWebAppiOS;
      
      setIsInstalled(isInstalled);
      // تحديث isInstallable بناءً على المتطلبات الأساسية
      const installable = hasServiceWorker && hasManifest && !isInstalled;
      setIsInstallable(Boolean(installable));
      
      // إذا كان قابل للتثبيت، تحقق من وجود الدالة العامة
      if (installable && window.checkInstallStatus) {
        const globalStatus = window.checkInstallStatus();
        setIsInstallable(globalStatus.isInstallable || false);
      }
    };

    // فحص فوري
    checkInstallStatus();
    
    // فحص دوري كل ثانيتين لمدة 10 ثوانِ
    let checkCount = 0;
    const intervalId = setInterval(() => {
      checkCount++;
      checkInstallStatus();
      
      if (checkCount >= 5) { // 5 × 2 ثانية = 10 ثوانِ
        clearInterval(intervalId);
      }
    }, 2000);

    // مستمع لحدث إمكانية التثبيت
    const handleInstallable = (event: any) => {
      setIsInstallable(true);
      setDeferredPrompt(event.detail?.prompt || null);
    };

    // مستمع لحدث التثبيت الناجح
    const handleInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    // إضافة المستمعين
    window.addEventListener('pwa-installable', handleInstallable);
    window.addEventListener('pwa-installed', handleInstalled);

    // تنظيف المستمعين والفترة الزمنية
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('pwa-installable', handleInstallable);
      window.removeEventListener('pwa-installed', handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    // فحص إذا كان الجهاز هاتف محمول
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // للهواتف: استخدام الدالة المحسنة مباشرة
      if (window.installApp) {
        try {
          await window.installApp();
          // إغلاق النافذة المنبثقة إذا كانت مفتوحة
          setShowInstallPrompt(false);
        } catch (error) {
          console.error('❌ InstallButton - Error installing app on mobile:', error);
        }
        return;
      }
    }
    
    // للكمبيوتر: استخدام الدالة العادية
    if (window.installApp) {
      try {
        await window.installApp();
        // إغلاق النافذة المنبثقة إذا كانت مفتوحة
        setShowInstallPrompt(false);
      } catch (error) {
        console.error('❌ InstallButton - Error installing app:', error);
      }
      return;
    }

    // Fallback للطريقة القديمة
    if (!deferredPrompt) {
      return;
    }

    try {
      // إظهار نافذة التثبيت
      deferredPrompt.prompt();
      
      // انتظار اختيار المستخدم
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      
      // مسح المتغير
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    } catch (error) {
      console.error('❌ InstallButton - Error during installation:', error);
    }
  };

  const dismissPrompt = () => {
    setShowInstallPrompt(false);
  };

  // إذا كان التطبيق مثبت بالفعل
  if (isInstalled) {
    return (
      <div className={`flex items-center gap-2 text-green-400 text-sm ${className}`}>
        <div className="relative">
          <Smartphone className="w-4 h-4" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        </div>
        <span>{t('install.installed')}</span>
      </div>
    );
  }

  // إذا لم يكن قابل للتثبيت
  if (!isInstallable) {
    return null;
  }

  return (
    <>
      {/* زر التثبيت الجديد الجذاب */}
      <div className={`relative group ${className}`}>
        {/* تأثير الوهج */}
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-300 animate-pulse"></div>
        
        {/* الزر الرئيسي */}
        <button
          onClick={handleInstall}
          className="relative flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border border-white/20"
        >
          {/* أيقونة التطبيق */}
          <div className="relative">
            <img 
              src="/images/icon.png" 
              alt="App Icon" 
              className="w-5 h-5 rounded-lg shadow-sm"
              onError={(e) => {
                // إذا فشل تحميل الصورة، استخدم أيقونة افتراضية
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
              }}
            />
            <Smartphone className="w-5 h-5 text-white hidden" />
            <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-yellow-300 animate-ping" />
          </div>
          
          {/* النص */}
          <span className="hidden sm:inline">{t('install.buttonFull')}</span>
          <span className="sm:hidden">{t('install.button')}</span>
          
          {/* أيقونة التحميل */}
          <Download className="w-4 h-4 animate-bounce" />
        </button>
      </div>

      {/* نافذة التثبيت المنبثقة المحسنة */}
      {showInstallPrompt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            {/* الهيدر */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <img 
                      src="/images/icon.png" 
                      alt="App Icon" 
                      className="w-8 h-8 rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <Smartphone className="w-8 h-8 text-white hidden" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                    <Sparkles className="w-2 h-2 text-yellow-800" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{t('install.title')}</h3>
                  <p className="text-sm text-slate-400">{t('app.shortName')}</p>
                </div>
              </div>
              <button
                onClick={dismissPrompt}
                className="w-8 h-8 bg-slate-700/50 hover:bg-slate-600/50 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* المحتوى */}
            <div className="mb-6">
              <p className="text-slate-300 text-sm leading-relaxed mb-4">
                {t('install.description')}
              </p>
              
              <div className="space-y-3 text-xs text-slate-400">
                <div className="flex items-center gap-3 p-2 bg-slate-700/30 rounded-lg">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>{t('install.benefits.homescreen')}</span>
                </div>
                <div className="flex items-center gap-3 p-2 bg-slate-700/30 rounded-lg">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                  <span>{t('install.benefits.offline')}</span>
                </div>
                <div className="flex items-center gap-3 p-2 bg-slate-700/30 rounded-lg">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                  <span>{t('install.benefits.notifications')}</span>
                </div>
                <div className="flex items-center gap-3 p-2 bg-slate-700/30 rounded-lg">
                  <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" style={{animationDelay: '1.5s'}}></div>
                  <span>{t('install.benefits.native')}</span>
                </div>
              </div>
            </div>

            {/* الأزرار */}
            <div className="flex gap-3">
              <button
                onClick={dismissPrompt}
                className="flex-1 px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-xl transition-all duration-200 text-sm font-medium"
              >
                {t('install.later')}
              </button>
              <button
                onClick={handleInstall}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all duration-200 text-sm font-bold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                {t('install.button')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default InstallButton;
