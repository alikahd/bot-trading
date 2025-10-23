import React, { useEffect, useState } from 'react';
import { chatConfig } from '../../config/chatConfig';
import { useLanguage } from '../../contexts/LanguageContext';

interface LiveChatWidgetProps {
  provider?: 'tawk' | 'crisp' | 'intercom';
  crispWebsiteId?: string;
  intercomAppId?: string;
}

const LiveChatWidget: React.FC<LiveChatWidgetProps> = ({
  provider = chatConfig.provider,
  crispWebsiteId = chatConfig.crisp.websiteId,
  intercomAppId = chatConfig.intercom.appId
}) => {
  const { language } = useLanguage();
  const [isMobile, setIsMobile] = useState(false);
  const [isWidgetLoaded, setIsWidgetLoaded] = useState(false);

  // فحص ما إذا كان الجهاز هاتف
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // فحص صحة المعرفات قبل التحميل
  const getValidProvider = () => {
    if (provider === 'crisp') {
      // فحص صحة Website ID
      if (!crispWebsiteId || crispWebsiteId === 'YOUR_CRISP_WEBSITE_ID' || crispWebsiteId.length < 10) {
        // Invalid Crisp ID
        return 'tawk';
      }
    } else if (provider === 'intercom') {
      // فحص صحة App ID
      if (!intercomAppId || intercomAppId === 'YOUR_INTERCOM_APP_ID' || intercomAppId.length < 5) {
        // Invalid Intercom ID
        return 'tawk';
      }
    }
    return provider;
  };
  
  const validProvider = getValidProvider();
  const getChatId = () => {
    // استخدام اللغة من Context بدلاً من URL parameters
    const lang = language;
    
    // Get widget ID for language
    
    switch (lang) {
      case 'ar':
        return `${chatConfig.tawk.properties.ar.propertyId}/${chatConfig.tawk.properties.ar.widgetId}`;
      case 'en':
        return `${chatConfig.tawk.properties.en.propertyId}/${chatConfig.tawk.properties.en.widgetId}`;
      case 'fr':
        return `${chatConfig.tawk.properties.fr.propertyId}/${chatConfig.tawk.properties.fr.widgetId}`;
      default:
        // العربية كلغة افتراضية
        return `${chatConfig.tawk.properties.ar.propertyId}/${chatConfig.tawk.properties.ar.widgetId}`;
    }
  };

  // دالة تحميل Tawk.to حسب الدليل الرسمي مع تحسينات للهواتف
  const loadTawkWidget = () => {
    // Load Tawk widget
    
    // الحصول على Chat ID حسب اللغة
    const chatId = getChatId();
    if (!chatId) {
      // Chat ID not found
      return;
    }
    
    // Chat ID determined
    
    // إعداد Tawk_API (حسب الدليل الرسمي)
    (window as any).Tawk_API = (window as any).Tawk_API || {};
    (window as any).Tawk_LoadStart = new Date();
    
    // إنشاء وتحميل الـ script (حسب الدليل الرسمي)
    const s1 = document.createElement("script");
    const s0 = document.getElementsByTagName("script")[0];
    s1.async = true;
    s1.src = 'https://embed.tawk.to/' + chatId;
    s1.charset = 'UTF-8';
    s1.setAttribute('crossorigin', '*');
    
    // معالجات الأحداث
    s1.onload = () => {
      // Tawk loaded
    };
    
    s1.onerror = () => {
      // Tawk load error
    };
    
    // إضافة الـ script (حسب الدليل الرسمي)
    s0.parentNode?.insertBefore(s1, s0);
    
    // إعداد معلومات المستخدم
    (window as any).Tawk_API.onLoad = function() {
      // Tawk ready
      setIsWidgetLoaded(true);
      
      (window as any).Tawk_API.setAttributes({
        'name': chatConfig.settings.defaultUserName,
        'language': language,
        'chatId': chatId,
        'device': isMobile ? 'mobile' : 'desktop'
      });

      // إعدادات خاصة بالهواتف
      if (isMobile && chatConfig.settings.mobile) {
        const mobileSettings = chatConfig.settings.mobile;
        
        // تأخير ظهور الزر على الهواتف
        if (mobileSettings.showDelay > 0) {
          (window as any).Tawk_API.hideWidget();
          setTimeout(() => {
            (window as any).Tawk_API.showWidget();
            // Widget shown
          }, mobileSettings.showDelay * 1000);
        }

        // رسالة ترحيب تلقائية للهواتف
        if (mobileSettings.autoWelcomeMessage) {
          const welcomeText = mobileSettings.welcomeText[language] || mobileSettings.welcomeText.ar;
          setTimeout(() => {
            (window as any).Tawk_API.addEvent(welcomeText, {
              type: 'system'
            });
            // Welcome message sent
          }, (mobileSettings.showDelay + 1) * 1000);
        }

        // إعدادات فتح النافذة في ملء الشاشة
        if (mobileSettings.fullScreenOnMobile) {
          (window as any).Tawk_API.onChatMaximized = function() {
            // Chat maximized
            document.body.style.overflow = 'hidden';
          };

          (window as any).Tawk_API.onChatMinimized = function() {
            // Chat minimized
            document.body.style.overflow = 'auto';
          };
        }

        // إخفاء الزر عند فتح النافذة
        if (mobileSettings.hideButtonWhenOpen) {
          (window as any).Tawk_API.onChatStarted = function() {
            // Button hidden
          };
        }

        // مراقبة ظهور العنصر وتطبيق التأثيرات
        const applyAnimations = () => {
          const animations = chatConfig.settings.mobile?.animations;
          if (!animations) return;

          // البحث عن جميع العناصر المحتملة
          const selectors = [
            '.tawk-min-container',
            '#tawk-bubble-container', 
            'div[id*="tawk"]',
            '.tawk-chat-widget'
          ];

          let elementFound = false;
          
          selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
              if (element && element instanceof HTMLElement) {
                elementFound = true;
                
                // إنشاء CSS للتأثير
                const animationType = animations.type;
                let keyframes = '';
                
                switch (animationType) {
                  case 'bounce':
                    keyframes = `
                      @keyframes tawkBounce {
                        0%, 20%, 53%, 80%, 100% { transform: translate3d(0,0,0); }
                        40%, 43% { transform: translate3d(0, -10px, 0); }
                        70% { transform: translate3d(0, -5px, 0); }
                        90% { transform: translate3d(0, -2px, 0); }
                      }
                    `;
                    break;
                  case 'pulse':
                    keyframes = `
                      @keyframes tawkPulse {
                        0% { transform: scale(1); }
                        50% { transform: scale(1.1); }
                        100% { transform: scale(1); }
                      }
                    `;
                    break;
                  case 'shake':
                    keyframes = `
                      @keyframes tawkShake {
                        0%, 100% { transform: translateX(0); }
                        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                        20%, 40%, 60%, 80% { transform: translateX(5px); }
                      }
                    `;
                    break;
                  case 'glow':
                    keyframes = `
                      @keyframes tawkGlow {
                        0% { box-shadow: 0 0 5px rgba(59, 130, 246, 0.5); }
                        50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.8), 0 0 30px rgba(59, 130, 246, 0.6); }
                        100% { box-shadow: 0 0 5px rgba(59, 130, 246, 0.5); }
                      }
                    `;
                    break;
                  case 'float':
                    keyframes = `
                      @keyframes tawkFloat {
                        0%, 100% { transform: translateY(0px); }
                        50% { transform: translateY(-8px); }
                      }
                    `;
                    break;
                }

                // إضافة CSS للصفحة
                if (keyframes && !document.getElementById('tawk-animations')) {
                  const style = document.createElement('style');
                  style.id = 'tawk-animations';
                  style.innerHTML = keyframes;
                  document.head.appendChild(style);
                }

                // تطبيق التأثير مباشرة
                element.style.animation = `tawk${animationType.charAt(0).toUpperCase() + animationType.slice(1)} ${animations.duration}s ease-in-out ${animations.infinite ? 'infinite' : '1'}`;
                element.style.animationDelay = `${animations.delay}s`;
                
                // Animation applied
              }
            });
          });

          if (elementFound) {
            // Animations applied
          } else {
            // Retry animations
            // تقليل عدد المحاولات لتجنب الحلقة اللا نهائية
            const retryCount = (applyAnimations as any).retryCount || 0;
            if (retryCount < 10) { // محدود بـ 10 محاولات
              (applyAnimations as any).retryCount = retryCount + 1;
              setTimeout(applyAnimations, 2000); // زيادة الفترة إلى 2 ثانية
            } else {
              // Max retries reached
            }
          }
        };
        
        // إضافة CSS عام للتأثيرات فوراً
        const globalStyle = document.createElement('style');
        globalStyle.id = 'tawk-global-animations';
        globalStyle.innerHTML = `
          @keyframes tawkPulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.15); opacity: 0.8; }
            100% { transform: scale(1); opacity: 1; }
          }
          
          @keyframes tawkBounce {
            0%, 20%, 53%, 80%, 100% { transform: translate3d(0,0,0); }
            40%, 43% { transform: translate3d(0, -12px, 0); }
            70% { transform: translate3d(0, -6px, 0); }
            90% { transform: translate3d(0, -3px, 0); }
          }
          
          /* تطبيق التأثير على جميع عناصر Tawk */
          .tawk-min-container,
          #tawk-bubble-container,
          div[id*="tawk"]:not(iframe) {
            animation: tawkPulse 1.5s ease-in-out infinite !important;
            animation-delay: 0.5s !important;
            transform-origin: center center !important;
          }
        `;
        
        if (!document.getElementById('tawk-global-animations')) {
          document.head.appendChild(globalStyle);
          // Global CSS added
        }

        // بدء تطبيق التأثيرات
        setTimeout(applyAnimations, 2000);
        
        // إعادة المحاولة محدودة العدد للتأكد
        let intervalCount = 0;
        const animationInterval = setInterval(() => {
          intervalCount++;
          if (intervalCount < 5) { // محدود بـ 5 محاولات فقط
            applyAnimations();
          } else {
            // Animation interval stopped
            clearInterval(animationInterval);
          }
        }, 5000); // كل 5 ثواني بدلاً من 3
        
        // تنظيف الـ interval عند إلغاء التحميل
        return () => clearInterval(animationInterval);
      }
      
      // محاولة إخفاء العلامة التجارية (قد لا يعمل مع iframe)
      setTimeout(() => {
        try {
          // إضافة CSS لإخفاء العناصر الخارجية + تحسينات للهواتف + تأثيرات حركية
          const style = document.createElement('style');
          const animations = chatConfig.settings.mobile?.animations;
          
          // إنشاء CSS للتأثيرات الحركية
          const getAnimationCSS = () => {
            if (!animations) return '';
            
            const animationType = animations.type || 'pulse';
            
            switch (animationType) {
              case 'pulse':
                return `
                  @keyframes chatPulse {
                    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
                    50% { transform: scale(1.1); box-shadow: 0 0 0 15px rgba(59, 130, 246, 0); }
                    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
                  }
                `;
              case 'bounce':
                return `
                  @keyframes chatBounce {
                    0%, 20%, 53%, 80%, 100% { transform: translate3d(0,0,0); }
                    40%, 43% { transform: translate3d(0, -8px, 0); }
                    70% { transform: translate3d(0, -4px, 0); }
                    90% { transform: translate3d(0, -2px, 0); }
                  }
                `;
              case 'shake':
                return `
                  @keyframes chatShake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
                    20%, 40%, 60%, 80% { transform: translateX(3px); }
                  }
                `;
              case 'glow':
                return `
                  @keyframes chatGlow {
                    0% { box-shadow: 0 0 5px rgba(59, 130, 246, 0.5); }
                    50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.8), 0 0 30px rgba(59, 130, 246, 0.6); }
                    100% { box-shadow: 0 0 5px rgba(59, 130, 246, 0.5); }
                  }
                `;
              case 'float':
                return `
                  @keyframes chatFloat {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-6px); }
                  }
                `;
              default:
                return '';
            }
          };
          
          style.innerHTML = `
            /* تأثيرات حركية للدردشة */
            ${getAnimationCSS()}
            
            /* إخفاء العناصر الخارجية للعلامة التجارية */
            iframe[src*="tawk.to"] + div,
            div[id*="tawk"] a[href*="tawk.to"],
            .tawk-min-container .tawk-min-branding,
            #tawk-bubble-container .tawk-branding {
              display: none !important;
              visibility: hidden !important;
            }
            
            /* تطبيق التأثيرات على زر الدردشة */
            .tawk-min-container,
            #tawk-bubble-container,
            .tawk-min-container iframe,
            div[id*="tawk"] {
              ${animations ? `
                animation: chat${animations.type.charAt(0).toUpperCase() + animations.type.slice(1)} ${animations.duration}s ease-in-out ${animations.infinite ? 'infinite' : '1'} !important;
                animation-delay: ${animations.delay}s !important;
              ` : ''}
            }
            
            /* تأكيد تطبيق التأثير */
            .tawk-min-container {
              ${animations ? `
                animation-name: chat${animations.type.charAt(0).toUpperCase() + animations.type.slice(1)} !important;
                animation-duration: ${animations.duration}s !important;
                animation-timing-function: ease-in-out !important;
                animation-iteration-count: ${animations.infinite ? 'infinite' : '1'} !important;
                animation-delay: ${animations.delay}s !important;
              ` : ''}
            }
            
            /* تحسينات للهواتف */
            @media (max-width: 768px) {
              #tawk-bubble-container {
                ${isMobile && chatConfig.settings.mobile ? `
                  ${chatConfig.settings.mobile.position.includes('bottom') ? 'bottom' : 'top'}: ${chatConfig.settings.mobile.position.includes('bottom') ? chatConfig.settings.mobile.margin.bottom : chatConfig.settings.mobile.margin.top}px !important;
                  ${chatConfig.settings.mobile.position.includes('right') ? 'right' : 'left'}: ${chatConfig.settings.mobile.position.includes('right') ? chatConfig.settings.mobile.margin.right : chatConfig.settings.mobile.margin.left}px !important;
                ` : ''}
              }
              
              .tawk-min-container {
                ${chatConfig.settings.mobile?.buttonSize === 'small' ? 'transform: scale(0.8);' : 
                  chatConfig.settings.mobile?.buttonSize === 'large' ? 'transform: scale(1.2);' : ''}
              }
              
              ${chatConfig.settings.mobile?.fullScreenOnMobile ? `
                .tawk-chat-panel {
                  width: 100vw !important;
                  height: 100vh !important;
                  top: 0 !important;
                  left: 0 !important;
                  right: 0 !important;
                  bottom: 0 !important;
                  border-radius: 0 !important;
                }
              ` : ''}
            }
          `;
          document.head.appendChild(style);
          
          // CSS applied
        } catch (error) {
          // CSS error
        }
      }, 1000);
    };
  };

  useEffect(() => {
    // Load chat provider
    
    // تحقق من أن الخدمة مفعلة
    if (!chatConfig.tawk.enabled && validProvider === 'tawk') {
      // Tawk disabled
      return;
    }
    
    // تحقق من وجود Tawk.to محمل بالفعل
    if (validProvider === 'tawk' && (window as any).Tawk_API && isWidgetLoaded) {
      // Tawk already loaded
      return;
    }

    if (validProvider === 'tawk') {
      // Apply Tawk guide
      
      // فحص وجود نافذة Tawk.to سابقة
      const existingScript = document.querySelector(`script[src*="embed.tawk.to"]`);
      const existingWidget = document.querySelector('[id*="tawk"]');
      
      if (existingScript || existingWidget) {
        // Remove previous widget
        
        // إزالة النافذة السابقة بالكامل (حسب الدليل الرسمي)
        if (existingScript) existingScript.remove();
        
        // إزالة جميع عناصر Tawk.to
        const tawkElements = document.querySelectorAll('[id*="tawk"], [class*="tawk"], script[src*="tawk"]');
        tawkElements.forEach(element => element.remove());
        
        // إعادة تعيين المتغيرات العامة
        (window as any).Tawk_API = undefined;
        (window as any).Tawk_LoadStart = undefined;
        delete (window as any).Tawk_API;
        delete (window as any).Tawk_LoadStart;
        
        // تحميل النافذة الجديدة بعد تنظيف كامل
        setTimeout(() => {
          // Load new widget
          loadTawkWidget();
        }, 200);
      } else {
        // تحميل النافذة للمرة الأولى
        // First time load
        loadTawkWidget();
      }

    } else if (validProvider === 'crisp') {
      // Crisp Integration مع تحسينات للهواتف
      // Load Crisp
      
      (window as any).$crisp = [];
      (window as any).CRISP_WEBSITE_ID = crispWebsiteId;
      
      const script = document.createElement('script');
      script.src = 'https://client.crisp.chat/l.js';
      script.async = true;
      document.getElementsByTagName('head')[0].appendChild(script);

      // Configure Crisp
      (window as any).$crisp.push(['safe', true]);
      (window as any).$crisp.push(['set', 'user:nickname', [chatConfig.settings.defaultUserName]]);
      (window as any).$crisp.push(['set', 'user:language', [language]]);

      // إعدادات خاصة بالهواتف لـ Crisp
      if (isMobile && chatConfig.settings.mobile) {
        const mobileSettings = chatConfig.settings.mobile;
        
        // تأخير ظهور الزر
        if (mobileSettings.showDelay > 0) {
          (window as any).$crisp.push(['do', 'chat:hide']);
          setTimeout(() => {
            (window as any).$crisp.push(['do', 'chat:show']);
            // Crisp shown
          }, mobileSettings.showDelay * 1000);
        }

        // رسالة ترحيب تلقائية
        if (mobileSettings.autoWelcomeMessage) {
          const welcomeText = mobileSettings.welcomeText[language] || mobileSettings.welcomeText.ar;
          setTimeout(() => {
            (window as any).$crisp.push(['do', 'message:send', ['text', welcomeText]]);
            // Welcome sent
          }, (mobileSettings.showDelay + 1) * 1000);
        }

        // إعدادات CSS للهواتف مع التأثيرات
        setTimeout(() => {
          const style = document.createElement('style');
          const animations = chatConfig.settings.mobile?.animations;
          
          // إنشاء CSS للتأثيرات الحركية
          const getAnimationCSS = () => {
            if (!animations) return '';
            
            const animationType = animations.type || 'pulse';
            
            switch (animationType) {
              case 'pulse':
                return `
                  @keyframes crispPulse {
                    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
                    50% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
                    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
                  }
                `;
              case 'bounce':
                return `
                  @keyframes crispBounce {
                    0%, 20%, 53%, 80%, 100% { transform: translate3d(0,0,0); }
                    40%, 43% { transform: translate3d(0, -8px, 0); }
                    70% { transform: translate3d(0, -4px, 0); }
                    90% { transform: translate3d(0, -2px, 0); }
                  }
                `;
              case 'shake':
                return `
                  @keyframes crispShake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
                    20%, 40%, 60%, 80% { transform: translateX(3px); }
                  }
                `;
              case 'glow':
                return `
                  @keyframes crispGlow {
                    0% { box-shadow: 0 0 5px rgba(59, 130, 246, 0.5); }
                    50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.8), 0 0 30px rgba(59, 130, 246, 0.6); }
                    100% { box-shadow: 0 0 5px rgba(59, 130, 246, 0.5); }
                  }
                `;
              case 'float':
                return `
                  @keyframes crispFloat {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-6px); }
                  }
                `;
              default:
                return '';
            }
          };
          
          style.innerHTML = `
            /* تأثيرات حركية لـ Crisp */
            ${getAnimationCSS()}
            
            /* تطبيق التأثيرات على زر Crisp */
            .crisp-client .crisp-1rjpbb7 {
              ${animations ? `
                animation: crisp${animations.type.charAt(0).toUpperCase() + animations.type.slice(1)} ${animations.duration}s ease-in-out ${animations.infinite ? 'infinite' : '1'};
                animation-delay: ${animations.delay}s;
              ` : ''}
            }
            
            @media (max-width: 768px) {
              .crisp-client {
                ${mobileSettings.position.includes('bottom') ? 'bottom' : 'top'}: ${mobileSettings.position.includes('bottom') ? mobileSettings.margin.bottom : mobileSettings.margin.top}px !important;
                ${mobileSettings.position.includes('right') ? 'right' : 'left'}: ${mobileSettings.position.includes('right') ? mobileSettings.margin.right : mobileSettings.margin.left}px !important;
              }
              
              .crisp-client .crisp-1rjpbb7 {
                ${mobileSettings.buttonSize === 'small' ? 'transform: scale(0.8);' : 
                  mobileSettings.buttonSize === 'large' ? 'transform: scale(1.2);' : ''}
              }
              
              ${mobileSettings.fullScreenOnMobile ? `
                .crisp-client .crisp-1w0qqjm {
                  width: 100vw !important;
                  height: 100vh !important;
                  top: 0 !important;
                  left: 0 !important;
                  right: 0 !important;
                  bottom: 0 !important;
                  border-radius: 0 !important;
                }
              ` : ''}
            }
          `;
          document.head.appendChild(style);
          // Crisp CSS applied
        }, 2000);
      }

    } else if (validProvider === 'intercom') {
      // Intercom Integration مع تحسينات للهواتف
      // Load Intercom
      
      (window as any).intercomSettings = {
        app_id: intercomAppId,
        name: chatConfig.settings.defaultUserName,
        language_override: language === 'ar' ? 'ar' : language === 'fr' ? 'fr' : 'en',
        custom_launcher_selector: isMobile ? '.mobile-chat-launcher' : undefined
      };

      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.async = true;
      script.src = `https://widget.intercom.io/widget/${intercomAppId}`;
      
      const firstScript = document.getElementsByTagName('script')[0];
      firstScript.parentNode?.insertBefore(script, firstScript);

      // إعدادات خاصة بالهواتف لـ Intercom
      if (isMobile && chatConfig.settings.mobile) {
        const mobileSettings = chatConfig.settings.mobile;
        
        // انتظار تحميل Intercom ثم تطبيق الإعدادات
        setTimeout(() => {
          if ((window as any).Intercom) {
            // تأخير ظهور الزر
            if (mobileSettings.showDelay > 0) {
              (window as any).Intercom('hide');
              setTimeout(() => {
                (window as any).Intercom('show');
                // Intercom shown
              }, mobileSettings.showDelay * 1000);
            }

            // رسالة ترحيب تلقائية
            if (mobileSettings.autoWelcomeMessage) {
              const welcomeText = mobileSettings.welcomeText[language] || mobileSettings.welcomeText.ar;
              setTimeout(() => {
                (window as any).Intercom('showNewMessage', welcomeText);
                // Welcome sent
              }, (mobileSettings.showDelay + 1) * 1000);
            }
          }
        }, 3000);

        // إعدادات CSS للهواتف مع التأثيرات
        setTimeout(() => {
          const style = document.createElement('style');
          const animations = chatConfig.settings.mobile?.animations;
          
          // إنشاء CSS للتأثيرات الحركية
          const getAnimationCSS = () => {
            if (!animations) return '';
            
            const animationType = animations.type || 'pulse';
            
            switch (animationType) {
              case 'pulse':
                return `
                  @keyframes intercomPulse {
                    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
                    50% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
                    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
                  }
                `;
              case 'bounce':
                return `
                  @keyframes intercomBounce {
                    0%, 20%, 53%, 80%, 100% { transform: translate3d(0,0,0); }
                    40%, 43% { transform: translate3d(0, -8px, 0); }
                    70% { transform: translate3d(0, -4px, 0); }
                    90% { transform: translate3d(0, -2px, 0); }
                  }
                `;
              case 'shake':
                return `
                  @keyframes intercomShake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
                    20%, 40%, 60%, 80% { transform: translateX(3px); }
                  }
                `;
              case 'glow':
                return `
                  @keyframes intercomGlow {
                    0% { box-shadow: 0 0 5px rgba(59, 130, 246, 0.5); }
                    50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.8), 0 0 30px rgba(59, 130, 246, 0.6); }
                    100% { box-shadow: 0 0 5px rgba(59, 130, 246, 0.5); }
                  }
                `;
              case 'float':
                return `
                  @keyframes intercomFloat {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-6px); }
                  }
                `;
              default:
                return '';
            }
          };
          
          style.innerHTML = `
            /* تأثيرات حركية لـ Intercom */
            ${getAnimationCSS()}
            
            /* تطبيق التأثيرات على زر Intercom */
            .intercom-launcher,
            .intercom-launcher-frame {
              ${animations ? `
                animation: intercom${animations.type.charAt(0).toUpperCase() + animations.type.slice(1)} ${animations.duration}s ease-in-out ${animations.infinite ? 'infinite' : '1'};
                animation-delay: ${animations.delay}s;
              ` : ''}
            }
            
            @media (max-width: 768px) {
              .intercom-launcher {
                ${mobileSettings.position.includes('bottom') ? 'bottom' : 'top'}: ${mobileSettings.position.includes('bottom') ? mobileSettings.margin.bottom : mobileSettings.margin.top}px !important;
                ${mobileSettings.position.includes('right') ? 'right' : 'left'}: ${mobileSettings.position.includes('right') ? mobileSettings.margin.right : mobileSettings.margin.left}px !important;
              }
              
              .intercom-launcher-frame {
                ${mobileSettings.buttonSize === 'small' ? 'transform: scale(0.8);' : 
                  mobileSettings.buttonSize === 'large' ? 'transform: scale(1.2);' : ''}
              }
              
              ${mobileSettings.fullScreenOnMobile ? `
                .intercom-messenger-frame {
                  width: 100vw !important;
                  height: 100vh !important;
                  top: 0 !important;
                  left: 0 !important;
                  right: 0 !important;
                  bottom: 0 !important;
                  border-radius: 0 !important;
                }
              ` : ''}
            }
          `;
          document.head.appendChild(style);
          // Intercom CSS applied
        }, 2000);
      }
    }

    // Cleanup function
    return () => {
      // Remove scripts when component unmounts
      const scripts = document.querySelectorAll('script[src*="tawk.to"], script[src*="crisp.chat"], script[src*="intercom.io"]');
      scripts.forEach(script => script.remove());
    };
  }, [validProvider, crispWebsiteId, intercomAppId, language, isMobile]); // إضافة language و isMobile للتبديل التلقائي

  // عرض مؤشر تحميل اختياري للهواتف (يمكن تفعيله لاحقاً)
  if (false && isMobile && !isWidgetLoaded && chatConfig.settings.mobile?.showDelay > 0) {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span>جاري تحميل الدردشة...</span>
        </div>
      </div>
    );
  }

  return null; // This component doesn't render anything visible
};

export default LiveChatWidget;
