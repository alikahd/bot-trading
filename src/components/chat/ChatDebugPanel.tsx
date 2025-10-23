import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { chatConfig } from '../../config/chatConfig';
import { useLanguage } from '../../contexts/LanguageContext';

const ChatDebugPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>({});
  const { language } = useLanguage();

  const updateDebugInfo = () => {
    const provider = chatConfig.provider;
    
    let info: any = {
      configLoaded: !!chatConfig,
      activeProvider: provider,
      currentLanguage: language,
      currentTime: new Date().toLocaleTimeString('ar-SA')
    };

    // معلومات خاصة بكل مزود
    if (provider === 'tawk') {
      const currentProperty = chatConfig.tawk.properties[language] || chatConfig.tawk.properties.ar;
      info = {
        ...info,
        tawkEnabled: chatConfig.tawk.enabled,
        propertyId: currentProperty.propertyId,
        widgetId: currentProperty.widgetId,
        tawkApiExists: typeof (window as any).Tawk_API !== 'undefined',
        tawkScriptLoaded: !!document.querySelector('script[src*="embed.tawk.to"]'),
        widgetVisible: !!document.querySelector('#tawkchat-minified-container, .tawk-min-container')
      };
    } else if (provider === 'crisp') {
      info = {
        ...info,
        crispEnabled: chatConfig.crisp.enabled,
        crispWebsiteId: chatConfig.crisp.websiteId,
        crispApiExists: typeof (window as any).$crisp !== 'undefined',
        crispScriptLoaded: !!document.querySelector('script[src*="crisp.chat"]'),
        widgetVisible: !!document.querySelector('.crisp-client')
      };
    } else if (provider === 'intercom') {
      info = {
        ...info,
        intercomAppId: chatConfig.intercom.appId,
        intercomApiExists: typeof (window as any).Intercom !== 'undefined',
        intercomScriptLoaded: !!document.querySelector('script[src*="intercom.io"]'),
        widgetVisible: !!document.querySelector('.intercom-launcher')
      };
    }

    setDebugInfo(info);
  };

  useEffect(() => {
    updateDebugInfo();
    const interval = setInterval(updateDebugInfo, 2000);
    return () => clearInterval(interval);
  }, []);

  const testChatConnection = () => {
    const provider = chatConfig.provider;
    
    if (provider === 'tawk') {
      if (typeof (window as any).Tawk_API !== 'undefined') {
        try {
          (window as any).Tawk_API.toggle();
          alert('✅ Tawk.to يعمل بشكل صحيح!');
        } catch (error) {
          alert('⚠️ Tawk.to محمل لكن هناك مشكلة في التفاعل');
        }
      } else {
        alert('❌ Tawk.to غير محمل');
      }
    } else if (provider === 'crisp') {
      if (typeof (window as any).$crisp !== 'undefined') {
        try {
          (window as any).$crisp.push(['do', 'chat:toggle']);
          alert('✅ Crisp يعمل بشكل صحيح!');
        } catch (error) {
          alert('⚠️ Crisp محمل لكن هناك مشكلة في التفاعل');
        }
      } else {
        alert('❌ Crisp غير محمل - تأكد من Website ID');
      }
    } else if (provider === 'intercom') {
      if (typeof (window as any).Intercom !== 'undefined') {
        try {
          (window as any).Intercom('show');
          alert('✅ Intercom يعمل بشكل صحيح!');
        } catch (error) {
          alert('⚠️ Intercom محمل لكن هناك مشكلة في التفاعل');
        }
      } else {
        alert('❌ Intercom غير محمل - تأكد من App ID');
      }
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
        >
          🔧 تشخيص الدردشة
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 w-80">
      <Card className="bg-gray-900/95 backdrop-blur-sm border-gray-700">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white">🔧 تشخيص الدردشة</h3>
            <Button
              onClick={() => setIsOpen(false)}
              size="sm"
              variant="ghost"
              className="text-gray-400 hover:text-white p-1"
            >
              ✕
            </Button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-gray-400">الخدمة النشطة:</div>
              <div className="text-white font-mono">{debugInfo.activeProvider}</div>
              
              <div className="text-gray-400">اللغة الحالية:</div>
              <div className="text-blue-400 font-bold">
                {debugInfo.currentLanguage?.toUpperCase()}
              </div>
              
              {/* معلومات Tawk */}
              {debugInfo.activeProvider === 'tawk' && (
                <>
                  <div className="text-gray-400">Tawk مفعل:</div>
                  <div className={debugInfo.tawkEnabled ? 'text-green-400' : 'text-red-400'}>
                    {debugInfo.tawkEnabled ? '✅ نعم' : '❌ لا'}
                  </div>
                  
                  <div className="text-gray-400">Property ID:</div>
                  <div className="text-white font-mono text-[10px]">{debugInfo.propertyId}</div>
                  
                  <div className="text-gray-400">Widget ID:</div>
                </>
              )}
              
              {/* معلومات Crisp */}
              {debugInfo.activeProvider === 'crisp' && (
                <>
                  <div className="text-gray-400">Crisp مفعل:</div>
                  <div className={debugInfo.crispEnabled ? 'text-green-400' : 'text-red-400'}>
                    {debugInfo.crispEnabled ? '✅ نعم' : '❌ لا'}
                  </div>
                  
                  <div className="text-gray-400">Website ID:</div>
                  <div className="text-white font-mono text-[10px]">{debugInfo.crispWebsiteId}</div>
                  
                  <div className="text-gray-400">API محمل:</div>
                  <div className={debugInfo.crispApiExists ? 'text-green-400' : 'text-red-400'}>
                    {debugInfo.crispApiExists ? '✅ نعم' : '❌ لا'}
                  </div>
                </>
              )}
              
              {/* معلومات Intercom */}
              {debugInfo.activeProvider === 'intercom' && (
                <>
                  <div className="text-gray-400">App ID:</div>
                  <div className="text-white font-mono text-[10px]">{debugInfo.intercomAppId}</div>
                  
                  <div className="text-gray-400">API محمل:</div>
                  <div className={debugInfo.intercomApiExists ? 'text-green-400' : 'text-red-400'}>
                    {debugInfo.intercomApiExists ? '✅ نعم' : '❌ لا'}
                  </div>
                </>
              )}
              
              <div className="text-gray-400">الويدجت:</div>
              <div className={debugInfo.widgetVisible ? 'text-green-400' : 'text-yellow-400'}>
                {debugInfo.widgetVisible ? '✅ مرئي' : '⏳ جاري التحميل'}
              </div>
              
              <div className="text-gray-400">آخر تحديث:</div>
              <div className="text-white font-mono text-[10px]">{debugInfo.currentTime}</div>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <Button
              onClick={testChatConnection}
              size="sm"
              className="w-full bg-green-600 hover:bg-green-700 text-white text-xs"
            >
              🧪 اختبار {debugInfo.activeProvider?.toUpperCase()}
            </Button>
            
            <Button
              onClick={updateDebugInfo}
              size="sm"
              variant="ghost"
              className="w-full text-gray-400 hover:text-white text-xs"
            >
              🔄 تحديث المعلومات
            </Button>
          </div>

          <div className="mt-3 p-2 bg-gray-800/50 rounded text-[10px] text-gray-400">
            💡 إذا كان كل شيء أخضر ولا ترى زر الدردشة، جرب إعادة تحميل الصفحة
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ChatDebugPanel;
