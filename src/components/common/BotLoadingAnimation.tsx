import React from 'react';
import { Bot, TrendingUp, Zap } from 'lucide-react';

interface BotLoadingAnimationProps {
  size?: 'sm' | 'md' | 'lg';
}

export const BotLoadingAnimation: React.FC<BotLoadingAnimationProps> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-14 h-14',
    lg: 'w-20 h-20'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-7 h-7',
    lg: 'w-10 h-10'
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* الدائرة الخارجية المتحركة */}
      <div className={`${sizeClasses[size]} relative`}>
        {/* دائرة متوهجة خلفية */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-20 animate-pulse"></div>
        
        {/* دوائر دوارة */}
        <div className="absolute inset-0 animate-spin-slow">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
        </div>
        
        <div className="absolute inset-0 animate-spin-reverse">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-cyan-500 rounded-full"></div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-pink-500 rounded-full"></div>
        </div>

        {/* أيقونة البوت في المنتصف */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Bot className={`${iconSizes[size]} text-blue-400 animate-bounce-slow`} />
        </div>
      </div>

      {/* أيقونات التوصيات المتحركة */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* أيقونة الترند */}
        <TrendingUp 
          className="absolute w-3 h-3 text-green-400 animate-float-1" 
          style={{ 
            top: '-10%', 
            right: '-10%',
            animationDelay: '0s'
          }} 
        />
        
        {/* أيقونة البرق */}
        <Zap 
          className="absolute w-3 h-3 text-yellow-400 animate-float-2" 
          style={{ 
            bottom: '-10%', 
            left: '-10%',
            animationDelay: '0.5s'
          }} 
        />
      </div>

      <style>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes spin-reverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes float-1 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.6;
          }
          50% {
            transform: translate(10px, -10px) scale(1.2);
            opacity: 1;
          }
        }

        @keyframes float-2 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.6;
          }
          50% {
            transform: translate(-10px, 10px) scale(1.2);
            opacity: 1;
          }
        }

        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }

        .animate-spin-reverse {
          animation: spin-reverse 4s linear infinite;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        .animate-float-1 {
          animation: float-1 3s ease-in-out infinite;
        }

        .animate-float-2 {
          animation: float-2 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
