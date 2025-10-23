import React from 'react';
import { Power } from 'lucide-react';
// دالة مساعدة لدمج الكلاسات
const cn = (...classes: (string | undefined | null | boolean)[]) => {
  return classes.filter(Boolean).join(' ');
};
import { useLanguage } from '../../contexts/LanguageContext';

interface MobileBotControlProps {
  isConnected: boolean;
  onToggleBot: () => void;
}

const MobileBotControl: React.FC<MobileBotControlProps> = ({
  isConnected,
  onToggleBot
}) => {
  const { t } = useLanguage();

  return (
    <div className="md:hidden fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="relative">
        {/* خلفية متوهجة */}
        <div className={cn(
          "absolute inset-0 rounded-full blur-xl opacity-60 transition-all duration-500",
          isConnected ? "bg-red-500/40" : "bg-green-500/40"
        )} />
        
        {/* الزر الرئيسي */}
        <button
          onClick={() => {
            console.log('🔘 زر التشغيل العائم تم النقر عليه');
            onToggleBot();
          }}
          type="button"
          className={cn(
            "group relative px-6 py-4 rounded-full shadow-2xl transition-all duration-500 flex items-center justify-center gap-3 cursor-pointer backdrop-blur-xl border-2 hover:scale-110 transform-gpu min-w-[140px]",
            isConnected 
              ? "bg-gradient-to-r from-red-600/90 via-red-700/90 to-red-800/90 hover:from-red-700/95 hover:via-red-800/95 hover:to-red-900/95 text-white border-red-400/60 hover:border-red-300/80 shadow-red-500/50 hover:shadow-red-400/70" 
              : "bg-gradient-to-r from-green-600/90 via-green-700/90 to-green-800/90 hover:from-green-700/95 hover:via-green-800/95 hover:to-green-900/95 text-white border-green-400/60 hover:border-green-300/80 shadow-green-500/50 hover:shadow-green-400/70"
          )}
          title={isConnected ? t('common.stop') : t('common.start')}
        >
          {/* المحتوى */}
          <div className="relative flex items-center gap-2">
            <Power className="w-5 h-5 transition-transform duration-500 group-hover:rotate-180" />
            <span className="font-bold text-sm whitespace-nowrap">
              {isConnected ? t('common.stop') : t('common.start')}
            </span>
          </div>
          
          {/* مؤشر الحالة النابض */}
          <div className={cn(
            "absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-lg transition-all duration-300",
            isConnected ? "bg-red-400 animate-pulse" : "bg-green-400 animate-bounce"
          )} />
          
          {/* تأثير النبضات */}
          {!isConnected && (
            <div className="absolute inset-0 rounded-full border-2 border-green-400/30 animate-ping" />
          )}
        </button>
        
        {/* نص الحالة */}
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
          <div className={cn(
            "px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm border shadow-lg",
            isConnected 
              ? "bg-red-900/80 text-red-200 border-red-500/30" 
              : "bg-green-900/80 text-green-200 border-green-500/30"
          )}>
            {isConnected ? '🔴 متصل' : '⚪ غير متصل'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileBotControl;
