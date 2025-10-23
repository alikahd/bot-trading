import React from 'react';

interface ConnectionStatusProps {
  isRealData: boolean;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
  apiStatus?: { [key: string]: any };
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  isRealData, 
  connectionQuality,
  apiStatus 
}) => {
  const getStatusIcon = () => {
    // لا نعرض أي أيقونة
    return null;
  };

  const getStatusText = () => {
    if (!isRealData) {
      return null; // لا نعرض أي نص للبيانات المحاكاة
    }

    switch (connectionQuality) {
      case 'excellent':
        return 'ممتاز';
      case 'good':
        return 'جيد';
      case 'poor':
        return 'ضعيف';
      case 'disconnected':
        return 'منقطع';
      default:
        return 'غير معروف';
    }
  };

  const getStatusColor = () => {
    if (!isRealData) {
      return 'text-orange-400';
    }

    switch (connectionQuality) {
      case 'excellent':
      case 'good':
        return 'text-green-400';
      case 'poor':
        return 'text-yellow-400';
      case 'disconnected':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getActiveApisCount = () => {
    if (!apiStatus || !isRealData) return 0;
    return Object.values(apiStatus).filter((status: any) => status.canMakeRequest).length;
  };

  const getTotalApisCount = () => {
    if (!apiStatus || !isRealData) return 0;
    return Object.keys(apiStatus).length;
  };

  const statusText = getStatusText();
  const statusIcon = getStatusIcon();
  
  return (
    <div className="flex items-center gap-2 text-sm">
      {statusIcon && statusIcon}
      {statusText && (
        <span className={getStatusColor()}>
          {statusText}
        </span>
      )}
      {isRealData && apiStatus && (
        <span className="text-gray-400 dark:text-gray-400 text-gray-600 text-xs">
          ({getActiveApisCount()}/{getTotalApisCount()} APIs)
        </span>
      )}
    </div>
  );
};
