import React from 'react';
import { TrendingUp, Target, DollarSign, BarChart3 } from 'lucide-react';

interface PerformanceMetricsProps {
  stats: {
    totalTrades: number;
    winTrades: number;
    lossTrades: number;
    winRate: number;
    totalProfit: number;
  };
  signals: any[];
  isVisible: boolean;
  onClose: () => void;
}

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ 
  stats, 
  signals, 
  isVisible, 
  onClose 
}) => {
  if (!isVisible) return null;

  // حساب إحصائيات إضافية
  const avgProfit = stats.totalTrades > 0 ? stats.totalProfit / stats.totalTrades : 0;
  const profitFactor = stats.lossTrades > 0 ? 
    (stats.winTrades * Math.abs(avgProfit)) / (stats.lossTrades * Math.abs(avgProfit)) : 
    stats.winTrades > 0 ? 999 : 0;

  const recentSignals = signals.slice(0, 10);
  const avgConfidence = recentSignals.length > 0 ? 
    recentSignals.reduce((sum, signal) => sum + signal.confidence, 0) / recentSignals.length : 0;

  const signalsByRisk = {
    low: recentSignals.filter(s => s.riskLevel === 'low').length,
    medium: recentSignals.filter(s => s.riskLevel === 'medium').length,
    high: recentSignals.filter(s => s.riskLevel === 'high').length,
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
      <div className="bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold text-white">مؤشرات الأداء المتقدمة</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* إحصائيات التداول الأساسية */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-gray-400">إجمالي الصفقات</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.totalTrades}</div>
          </div>

          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-400">معدل الربح</span>
            </div>
            <div className="text-2xl font-bold text-green-400">
              {formatPercentage(stats.winRate)}
            </div>
          </div>

          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-gray-400">إجمالي الربح</span>
            </div>
            <div className={`text-2xl font-bold ${
              stats.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {formatCurrency(stats.totalProfit)}
            </div>
          </div>

          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-gray-400">عامل الربح</span>
            </div>
            <div className={`text-2xl font-bold ${
              profitFactor >= 1.5 ? 'text-green-400' : 
              profitFactor >= 1 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {profitFactor === 999 ? '∞' : profitFactor.toFixed(2)}
            </div>
          </div>
        </div>

        {/* إحصائيات الإشارات */}
        <div className="bg-gray-700 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">إحصائيات الإشارات</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{recentSignals.length}</div>
              <div className="text-sm text-gray-400">إشارات حديثة</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {formatPercentage(avgConfidence)}
              </div>
              <div className="text-sm text-gray-400">متوسط الثقة</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{signalsByRisk.medium}</div>
              <div className="text-sm text-gray-400">مخاطرة متوسطة</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{signalsByRisk.high}</div>
              <div className="text-sm text-gray-400">مخاطرة عالية</div>
            </div>
          </div>
        </div>

        {/* توزيع المخاطر */}
        <div className="bg-gray-700 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">توزيع المخاطر</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-green-400">مخاطرة منخفضة</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-green-400 h-2 rounded-full"
                    style={{ 
                      width: `${recentSignals.length > 0 ? (signalsByRisk.low / recentSignals.length) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
                <span className="text-white text-sm w-8">{signalsByRisk.low}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-yellow-400">مخاطرة متوسطة</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-yellow-400 h-2 rounded-full"
                    style={{ 
                      width: `${recentSignals.length > 0 ? (signalsByRisk.medium / recentSignals.length) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
                <span className="text-white text-sm w-8">{signalsByRisk.medium}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-red-400">مخاطرة عالية</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-red-400 h-2 rounded-full"
                    style={{ 
                      width: `${recentSignals.length > 0 ? (signalsByRisk.high / recentSignals.length) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
                <span className="text-white text-sm w-8">{signalsByRisk.high}</span>
              </div>
            </div>
          </div>
        </div>

        {/* نصائح الأداء */}
        <div className="bg-blue-900 bg-opacity-50 rounded-lg p-4">
          <h4 className="text-white font-semibold mb-2">💡 نصائح لتحسين الأداء:</h4>
          <ul className="text-sm text-blue-200 space-y-1">
            {stats.winRate < 60 && (
              <li>• معدل الربح منخفض - فكر في تعديل إعدادات الاستراتيجية</li>
            )}
            {avgConfidence < 75 && (
              <li>• متوسط ثقة الإشارات منخفض - قد تحتاج لتحسين المؤشرات</li>
            )}
            {signalsByRisk.high > signalsByRisk.low && (
              <li>• كثرة الإشارات عالية المخاطر - فكر في تقليل حد المخاطرة</li>
            )}
            {stats.totalTrades < 10 && (
              <li>• عدد الصفقات قليل - امنح البوت وقتاً أكثر لجمع البيانات</li>
            )}
            {profitFactor < 1 && (
              <li>• عامل الربح سلبي - راجع استراتيجية إدارة المخاطر</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};
