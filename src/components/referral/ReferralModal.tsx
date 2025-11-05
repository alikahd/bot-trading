import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { ReferralPanel } from './ReferralPanel';

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export const ReferralModal: React.FC<ReferralModalProps> = ({
  isOpen,
  onClose,
  userId
}) => {
  // منع التمرير في الخلفية عند فتح النافذة
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="relative w-full sm:max-w-5xl h-[85vh] sm:h-auto sm:max-h-[92vh] overflow-y-auto scrollbar-hide bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl border-t sm:border border-slate-700/50"
        onClick={(e) => e.stopPropagation()}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', fontSize: '1.05em' }}
      >
        {/* مقبض السحب للهواتف */}
        <div className="sm:hidden flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-slate-600 rounded-full"></div>
        </div>

        {/* زر الإغلاق */}
        <button
          onClick={onClose}
          className="absolute top-2 sm:top-4 right-2 sm:right-4 z-10 p-0.5 sm:p-2 text-gray-400 hover:text-white bg-transparent sm:bg-slate-800/50 hover:bg-slate-700/30 sm:hover:bg-slate-700/50 rounded sm:rounded-lg transition-all duration-200"
        >
          <X className="w-5 h-5 sm:w-5 sm:h-5" />
        </button>

        {/* المحتوى */}
        <div className="p-2 sm:p-8 pt-2 sm:pt-8">
          <ReferralPanel userId={userId} />
        </div>
      </div>
    </div>
  );
};
