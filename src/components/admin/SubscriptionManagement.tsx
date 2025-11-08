import React, { useState, useEffect } from 'react';
import { 
  Search, 
  RefreshCw, 
  Edit3, 
  Play, 
  Pause, 
  Calendar,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RotateCcw,
  Eye,
  User,
  Mail,
  CreditCard,
  X,
  MoreVertical,
  Settings,
  Trash2
} from 'lucide-react';
import { subscriptionService } from '../../services/subscriptionService';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { supabase } from '../../config/supabaseClient';

interface SubscriptionData {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  user_role?: string;
  plan_name_ar: string;
  plan_name: string;
  status: 'active' | 'expired' | 'pending' | 'cancelled' | 'suspended' | 'paused';
  start_date: string;
  end_date: string;
  amount_paid: number;
  currency: string;
  days_remaining: number;
  payment_method?: string;
  created_at: string;
}

interface EditSubscriptionData {
  id: string;
  status: 'active' | 'expired' | 'pending' | 'cancelled' | 'suspended' | 'paused';
  start_date: string;
  end_date: string;
  amount_paid: number;
}

interface SubscriptionManagementProps {
  isVisible: boolean;
  onClose: () => void;
}

interface Stats {
  total: number;
  active: number;
  expired: number;
  revenue: number;
}

export const SubscriptionManagement: React.FC<SubscriptionManagementProps> = ({ 
  isVisible
}) => {
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState<Stats>({
    total: 0,
    active: 0,
    expired: 0,
    revenue: 0
  });
  const [selectedSubscription, setSelectedSubscription] = useState<SubscriptionData | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editData, setEditData] = useState<EditSubscriptionData>({
    id: '',
    status: 'active',
    start_date: '',
    end_date: '',
    amount_paid: 0
  });
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  // يحدد إن كانت قائمة عنصر معين يجب أن تُفتح للأعلى لتفادي القص
  const [, setOpenUpFor] = useState<string | null>(null);
  // مراجع لعناصر صفوف الأزرار لقياس موضعها عند الفتح
  const rowRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

  const toggleDropdown = (id: string, forceUp?: boolean) => {
    const willOpen = openDropdown !== id;
    setOpenDropdown(willOpen ? id : null);
    if (willOpen) {
      const el = rowRefs.current[id];
      if (el) {
        const rect = el.getBoundingClientRect();
        const viewportH = window.innerHeight || document.documentElement.clientHeight;
        const availableBelow = viewportH - rect.bottom; // المساحة المتاحة أسفل الزر
        const threshold = 200; // إذا كانت المساحة المتاحة أقل من 200px فافتح للأعلى
        const shouldOpenUp = forceUp ? true : (availableBelow < threshold);
        setOpenUpFor(shouldOpenUp ? id : null);
      } else {
        setOpenUpFor(null);
      }
    } else {
      setOpenUpFor(null);
    }
  };
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  useEffect(() => {

    if (isVisible) {

      fetchSubscriptions();

      // ✅ إعداد Realtime للاشتراكات

      const subscriptionsChannel = supabase
        .channel('subscriptions-management-changes')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'subscriptions' },
          (_payload) => {

            fetchSubscriptions(); // إعادة تحميل البيانات
          }
        )
        .subscribe();

      // تنظيف عند إخفاء النافذة
      return () => {

        supabase.removeChannel(subscriptionsChannel);
      };
    }
  }, [isVisible]);

  // تحميل إضافي عند تحميل المكون
  useEffect(() => {

  }, []);

  // إغلاق القائمة عند النقر خارجها أو فتح نافذة أخرى
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown && !(event.target as Element).closest('.dropdown-menu')) {
        setOpenDropdown(null);
        setOpenUpFor(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  // إغلاق القائمة المنسدلة عند فتح أي نافذة منبثقة
  useEffect(() => {
    if (showAdvancedSettings || showDetailsModal || showEditModal || showExtendModal || showEmailModal) {
      setOpenDropdown(null);
      setOpenUpFor(null);
    }
  }, [showAdvancedSettings, showDetailsModal, showEditModal, showExtendModal, showEmailModal]);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const data = await subscriptionService.getAllSubscriptions();

      setSubscriptions(data);
      // حساب الإيرادات برقمين بعد الفاصلة
      const totalRevenue = data.reduce((sum, sub) => sum + (sub.amount_paid || 0), 0);
      const formattedRevenue = Math.round(totalRevenue * 100) / 100;
      
      setStats({
        total: data.length,
        active: data.filter(sub => sub.status === 'active').length,
        expired: data.filter(sub => sub.status === 'expired').length,
        revenue: formattedRevenue
      });
    } catch (error) {

    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubscription = async (id: string, updates: Partial<{
    status: 'active' | 'expired' | 'pending' | 'cancelled' | 'suspended' | 'paused';
    start_date: string;
    end_date: string;
    amount_paid: number;
  }>) => {
    setActionLoading(id);
    try {

      // استدعاء API لتحديث الاشتراك
      await subscriptionService.updateSubscription(id, updates);

      // إعادة تحميل البيانات
      await fetchSubscriptions();
    } catch (error) {

      // يمكن إضافة toast notification هنا
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewDetails = (subscription: SubscriptionData) => {
    setSelectedSubscription(subscription);
    setShowDetailsModal(true);
  };

  const handleDeleteSubscription = async (id: string) => {
    setActionLoading(id);
    try {

      // يمكن إضافة API call للحذف هنا
      await fetchSubscriptions();
      setShowDeleteConfirm(null);
    } catch (error) {

    } finally {
      setActionLoading(null);
    }
  };

  const handleExtendSubscription = async (id: string, months: number) => {
    setActionLoading(id);
    try {

      // حساب تاريخ انتهاء جديد
      const subscription = subscriptions.find(s => s.id === id);
      if (subscription) {
        const newEndDate = new Date(subscription.end_date);
        newEndDate.setMonth(newEndDate.getMonth() + months);
        
        await handleUpdateSubscription(id, {
          end_date: newEndDate.toISOString(),
          status: 'active'
        });
      }
      setShowExtendModal(false);
    } catch (error) {

    } finally {
      setActionLoading(null);
    }
  };

  const handleSendEmail = async (subscription: SubscriptionData) => {
    try {

      // يمكن إضافة API call لإرسال البريد هنا
      setShowEmailModal(false);
    } catch (error) {

    }
  };

  const getStatusBadge = (status: string, daysRemaining?: number, userRole?: string) => {
    // المديرون دائماً نشطون
    if (userRole === 'admin') {
      return <Badge variant="success" size="sm">مدير</Badge>;
    }
    
    if (daysRemaining !== undefined && daysRemaining <= 7 && daysRemaining > 0) {
      return <Badge variant="warning" size="sm">ينتهي قريباً</Badge>;
    }
    
    switch (status) {
      case 'active': return <Badge variant="success" size="sm">نشط</Badge>;
      case 'expired': return <Badge variant="error" size="sm">منتهي</Badge>;
      case 'paused': return <Badge variant="warning" size="sm">متوقف</Badge>;
      case 'cancelled': return <Badge variant="error" size="sm">ملغي</Badge>;
      case 'pending': return <Badge variant="warning" size="sm">معلق</Badge>;
      default: return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredSubscriptions = subscriptions.filter(sub =>
    (sub.user_email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (sub.user_name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  // تشخيص إضافي

  if (!isVisible) return null;

  return (
    <>
      {/* CSS لشريط التمرير */}
      <style>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: #1e293b;
          border-radius: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #475569;
          border-radius: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
      `}</style>
      
      {/* المحتوى مباشرة بدون نافذة منبثقة */}
      <div className="space-y-4 p-4" dir="rtl">
          {/* الإحصائيات */}
          <div className="grid grid-cols-4 gap-1 sm:gap-2 lg:gap-4 mb-3 sm:mb-4 lg:mb-6">
            <Card padding="sm" className="text-center py-1 sm:py-2">
              <div className="text-sm sm:text-base lg:text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-[8px] sm:text-[10px] lg:text-sm text-gray-400">إجمالي</div>
            </Card>
            <Card padding="sm" className="text-center py-1 sm:py-2">
              <div className="text-sm sm:text-base lg:text-2xl font-bold text-green-400">{stats.active}</div>
              <div className="text-[8px] sm:text-[10px] lg:text-sm text-gray-400">نشط</div>
            </Card>
            <Card padding="sm" className="text-center py-1 sm:py-2">
              <div className="text-sm sm:text-base lg:text-2xl font-bold text-red-400">{stats.expired}</div>
              <div className="text-[8px] sm:text-[10px] lg:text-sm text-gray-400">منتهي</div>
            </Card>
            <Card padding="sm" className="text-center py-1 sm:py-2">
              <div className="text-sm sm:text-base lg:text-2xl font-bold text-yellow-400">${stats.revenue.toFixed(2)}</div>
              <div className="text-[8px] sm:text-[10px] lg:text-sm text-gray-400">إيرادات</div>
            </Card>
          </div>

          {/* أدوات البحث والتحكم */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 lg:gap-4 mb-3 sm:mb-4 lg:mb-6">
            <div className="relative flex-1">
              <Search className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
              <input
                type="text"
                placeholder="البحث بالاسم أو البريد..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-700/50 border border-slate-600/50 text-white rounded-lg pr-8 sm:pr-10 pl-2 sm:pl-4 py-2 sm:py-3 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
              />
            </div>
            <Button
              onClick={fetchSubscriptions}
              variant="secondary"
              icon={<RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />}
              disabled={loading}
              className="w-full sm:w-auto text-sm py-2"
            >
              تحديث
            </Button>
          </div>

          {/* عرض البيانات */}
          {loading ? (
            <div className="text-center py-6 sm:py-8 lg:py-12">
              <RefreshCw className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-blue-400 mx-auto mb-2 sm:mb-4" />
              <p className="text-gray-400 text-sm sm:text-base lg:text-lg">جاري تحميل بيانات المشتركين...</p>
            </div>
          ) : (
            <>
              {/* عرض الجدول للشاشات الكبيرة */}
              <div className="hidden lg:block">
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto rounded-lg border border-slate-700/50 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-800/50">
                      <tr>
                        <th className="text-right py-4 px-6 text-gray-300 font-medium">المستخدم</th>
                        <th className="text-right py-4 px-4 text-gray-300 font-medium">الاشتراك</th>
                        <th className="text-right py-4 px-4 text-gray-300 font-medium">الحالة</th>
                        <th className="text-right py-4 px-4 text-gray-300 font-medium">المبلغ</th>
                        <th className="text-center py-4 px-4 text-gray-300 font-medium w-16">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSubscriptions.map((sub, idx) => (
                        <tr key={sub.id} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                                <User className="w-5 h-5 text-white" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium text-white truncate">{sub.user_name || 'غير محدد'}</div>
                                <div className="text-sm text-gray-400 truncate">{sub.user_email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="space-y-1">
                              <div className="text-white font-medium">{sub.plan_name_ar || sub.plan_name}</div>
                              <div className="text-xs text-gray-400">
                                {formatDate(sub.start_date)} - {formatDate(sub.end_date)}
                              </div>
                              {sub.user_role === 'admin' ? (
                                <div className="text-xs text-blue-400">مدير - غير محدود</div>
                              ) : (
                                <div className={`text-xs ${sub.days_remaining <= 7 ? 'text-yellow-400' : sub.days_remaining <= 0 ? 'text-red-400' : 'text-green-400'}`}>
                                  {sub.days_remaining > 0 ? `${sub.days_remaining} يوم متبقي` : 'منتهي الصلاحية'}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            {getStatusBadge(sub.status, sub.days_remaining, sub.user_role)}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-1 text-green-400 font-medium">
                              <DollarSign className="w-4 h-4" />
                              {sub.amount_paid}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="relative" ref={(el) => { rowRefs.current[sub.id] = el; }}>
                              <Button
                                onClick={() => toggleDropdown(sub.id, idx >= filteredSubscriptions.length - 2)}
                                variant="ghost"
                                size="sm"
                                icon={<MoreVertical className="w-4 h-4" />}
                                iconOnly
                                className="hover:bg-slate-600/50 text-gray-400 hover:text-white"
                              />
                              
                              {/* قائمة منسدلة */}
                              {openDropdown === sub.id && (
                                <div className={`dropdown-menu absolute ${idx === 0 ? 'top-full mt-8' : 'bottom-full mb-1'} w-56 max-h-80 overflow-auto bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-lg shadow-2xl`}
                                     style={{ left: 0, zIndex: 999999 }}>
                                  <div className="py-2">
                                    <button
                                      onClick={() => {
                                        handleViewDetails(sub);
                                        setOpenDropdown(null);
                                      }}
                                      className="w-full text-right px-4 py-2 text-sm text-gray-300 hover:bg-slate-700/50 hover:text-white flex items-center gap-3"
                                    >
                                      <Eye className="w-4 h-4 text-blue-400" />
                                      عرض التفاصيل
                                    </button>
                                    
                                    <button
                                      onClick={() => {
                                        setSelectedSubscription(sub);
                                        setEditData({
                                          id: sub.id,
                                          status: sub.status,
                                          start_date: sub.start_date,
                                          end_date: sub.end_date,
                                          amount_paid: sub.amount_paid
                                        });
                                        setShowEditModal(true);
                                        setOpenDropdown(null);
                                      }}
                                      className="w-full text-right px-4 py-2 text-sm text-gray-300 hover:bg-slate-700/50 hover:text-white flex items-center gap-3"
                                    >
                                      <Edit3 className="w-4 h-4 text-orange-400" />
                                      تعديل الاشتراك
                                    </button>
                                    
                                    <div className="border-t border-slate-700/50 my-1"></div>
                                    
                                    {sub.status === 'active' ? (
                                      <button
                                        onClick={() => {
                                          handleUpdateSubscription(sub.id, { status: 'paused' });
                                          setOpenDropdown(null);
                                        }}
                                        disabled={actionLoading === sub.id}
                                        className="w-full text-right px-4 py-2 text-sm text-gray-300 hover:bg-slate-700/50 hover:text-white flex items-center gap-3 disabled:opacity-50"
                                      >
                                        <Pause className="w-4 h-4 text-yellow-400" />
                                        إيقاف الاشتراك
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => {
                                          handleUpdateSubscription(sub.id, { status: 'active' });
                                          setOpenDropdown(null);
                                        }}
                                        disabled={actionLoading === sub.id}
                                        className="w-full text-right px-4 py-2 text-sm text-gray-300 hover:bg-slate-700/50 hover:text-white flex items-center gap-3 disabled:opacity-50"
                                      >
                                        <Play className="w-4 h-4 text-green-400" />
                                        تفعيل الاشتراك
                                      </button>
                                    )}
                                    
                                    <button
                                      onClick={() => {
                                        setSelectedSubscription(sub);
                                        setShowExtendModal(true);
                                        setOpenDropdown(null);
                                      }}
                                      className="w-full text-right px-4 py-2 text-sm text-gray-300 hover:bg-slate-700/50 hover:text-white flex items-center gap-3"
                                    >
                                      <Calendar className="w-4 h-4 text-green-400" />
                                      تمديد الاشتراك
                                    </button>
                                    
                                    <button
                                      onClick={() => {
                                        setSelectedSubscription(sub);
                                        setShowEmailModal(true);
                                        setOpenDropdown(null);
                                      }}
                                      className="w-full text-right px-4 py-2 text-sm text-gray-300 hover:bg-slate-700/50 hover:text-white flex items-center gap-3"
                                    >
                                      <Mail className="w-4 h-4 text-blue-400" />
                                      إرسال بريد إلكتروني
                                    </button>
                                    
                                    <button
                                      onClick={() => {
                                        setSelectedSubscription(sub);
                                        setShowAdvancedSettings(true);
                                        setOpenDropdown(null);
                                      }}
                                      className="w-full text-right px-4 py-2 text-sm text-gray-300 hover:bg-slate-700/50 hover:text-white flex items-center gap-3"
                                    >
                                      <Settings className="w-4 h-4 text-purple-400" />
                                      إعدادات متقدمة
                                    </button>
                                    
                                    <div className="border-t border-slate-700/50 my-1"></div>
                                    
                                    <button
                                      onClick={() => {
                                        setShowDeleteConfirm(sub.id);
                                        setOpenDropdown(null);
                                      }}
                                      className="w-full text-right px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-3"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      حذف الاشتراك
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* عرض البطاقات للشاشات الصغيرة والمتوسطة */}
              <div className="lg:hidden space-y-2 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
                {filteredSubscriptions.map((sub, idx) => (
                  <div key={sub.id} className={`relative ${openDropdown === sub.id ? 'z-[3000]' : ''} overflow-visible`}>
                    <Card padding="sm" className="hover:border-blue-500/30 transition-colors overflow-visible relative">
                      <div className="space-y-2">
                      {/* معلومات المستخدم مع قائمة الإجراءات */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-white text-base truncate">{sub.user_name || 'غير محدد'}</div>
                            <div className="text-xs text-gray-400 truncate">{sub.user_email}</div>
                          </div>
                        </div>
                        
                        {/* قائمة الإجراءات */}
                        <div className="relative flex-shrink-0" ref={(el) => { rowRefs.current[sub.id] = el; }}>
                          <Button
                            onClick={() => toggleDropdown(sub.id, idx >= filteredSubscriptions.length - 2)}
                            variant="ghost"
                            size="sm"
                            icon={<MoreVertical className="w-4 h-4" />}
                            iconOnly
                            className="hover:bg-slate-600/50 text-gray-400 hover:text-white p-1"
                          />
                          
                          {/* قائمة منسدلة للهواتف */}
                          {openDropdown === sub.id && (
                            <div className={`dropdown-menu absolute ${idx === 0 ? 'top-full mt-8' : 'bottom-full mb-1'} w-48 bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-lg shadow-2xl`}
                                 style={{ left: 0, zIndex: 999999 }}>
                              <div className="py-2">
                                <button
                                  onClick={() => {
                                    handleViewDetails(sub);
                                    setOpenDropdown(null);
                                  }}
                                  className="w-full text-right px-4 py-2 text-sm text-gray-300 hover:bg-slate-700/50 hover:text-white flex items-center gap-3"
                                >
                                  <Eye className="w-4 h-4 text-blue-400" />
                                  عرض التفاصيل
                                </button>
                                
                                <button
                                  onClick={() => {
                                    setSelectedSubscription(sub);
                                    setEditData({
                                      id: sub.id,
                                      status: sub.status,
                                      start_date: sub.start_date,
                                      end_date: sub.end_date,
                                      amount_paid: sub.amount_paid
                                    });
                                    setShowEditModal(true);
                                    setOpenDropdown(null);
                                  }}
                                  className="w-full text-right px-4 py-2 text-sm text-gray-300 hover:bg-slate-700/50 hover:text-white flex items-center gap-3"
                                >
                                  <Edit3 className="w-4 h-4 text-orange-400" />
                                  تعديل الاشتراك
                                </button>
                                
                                <div className="border-t border-slate-700/50 my-1"></div>
                                
                                {sub.status === 'active' ? (
                                  <button
                                    onClick={() => {
                                      handleUpdateSubscription(sub.id, { status: 'paused' });
                                      setOpenDropdown(null);
                                    }}
                                    disabled={actionLoading === sub.id}
                                    className="w-full text-right px-4 py-2 text-sm text-gray-300 hover:bg-slate-700/50 hover:text-white flex items-center gap-3 disabled:opacity-50"
                                  >
                                    <Pause className="w-4 h-4 text-yellow-400" />
                                    إيقاف الاشتراك
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      handleUpdateSubscription(sub.id, { status: 'active' });
                                      setOpenDropdown(null);
                                    }}
                                    disabled={actionLoading === sub.id}
                                    className="w-full text-right px-4 py-2 text-sm text-gray-300 hover:bg-slate-700/50 hover:text-white flex items-center gap-3 disabled:opacity-50"
                                  >
                                    <Play className="w-4 h-4 text-green-400" />
                                    تفعيل الاشتراك
                                  </button>
                                )}
                                
                                <button
                                  onClick={() => {
                                    setSelectedSubscription(sub);
                                    setShowExtendModal(true);
                                    setOpenDropdown(null);
                                  }}
                                  className="w-full text-right px-4 py-2 text-sm text-gray-300 hover:bg-slate-700/50 hover:text-white flex items-center gap-3"
                                >
                                  <Calendar className="w-4 h-4 text-green-400" />
                                  تمديد الاشتراك
                                </button>
                                
                                <button
                                  onClick={() => {
                                    setSelectedSubscription(sub);
                                    setShowEmailModal(true);
                                    setOpenDropdown(null);
                                  }}
                                  className="w-full text-right px-4 py-2 text-sm text-gray-300 hover:bg-slate-700/50 hover:text-white flex items-center gap-3"
                                >
                                  <Mail className="w-4 h-4 text-blue-400" />
                                  إرسال بريد إلكتروني
                                </button>
                                
                                <div className="border-t border-slate-700/50 my-1"></div>
                                
                                <button
                                  onClick={() => {
                                    setShowDeleteConfirm(sub.id);
                                    setOpenDropdown(null);
                                  }}
                                  className="w-full text-right px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-3"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  حذف الاشتراك
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* الحالة والباقة */}
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-medium text-sm truncate">{sub.plan_name_ar || sub.plan_name}</div>
                          <div className="text-xs text-gray-400">
                            {formatDate(sub.start_date)} - {formatDate(sub.end_date)}
                          </div>
                        </div>
                        {getStatusBadge(sub.status, sub.days_remaining, sub.user_role)}
                      </div>

                      {/* المبلغ والأيام المتبقية */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-700/30">
                        <div className="flex items-center gap-1 text-green-400 font-medium text-sm">
                          <DollarSign className="w-3 h-3" />
                          {sub.amount_paid}
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          {sub.user_role === 'admin' ? (
                            <span className="text-blue-400 font-medium text-xs">
                              مدير - غير محدود
                            </span>
                          ) : (
                            <span className={`font-medium text-xs ${sub.days_remaining <= 7 ? 'text-yellow-400' : sub.days_remaining <= 0 ? 'text-red-400' : 'text-green-400'}`}>
                              {sub.days_remaining > 0 ? `${sub.days_remaining} يوم متبقي` : 'منتهي'}
                            </span>
                          )}
                        </div>
                      </div>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>

              {/* رسالة عدم وجود نتائج */}
              {!loading && filteredSubscriptions.length === 0 && (
                <div className="text-center py-6 sm:py-8 lg:py-12">
                  <AlertTriangle className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-2 sm:mb-4" />
                  <p className="text-gray-400 text-base sm:text-lg mb-1 sm:mb-2">لا توجد اشتراكات مطابقة للبحث</p>
                  <p className="text-gray-500 text-xs sm:text-sm">جرب تغيير كلمات البحث أو مسح الفلتر</p>
                </div>
              )}
            </>
          )}
      </div>

      {/* جميع النوافذ المنبثقة */}
      
      {/* نافذة عرض التفاصيل */}
      {showDetailsModal && selectedSubscription && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-2 sm:p-4" 
          style={{zIndex: 999998}}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDetailsModal(false);
            }
          }}
        >
            <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-lg w-full max-w-sm sm:max-w-2xl max-h-[90vh] overflow-y-auto mx-2">
              <div className="p-3 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-6">
                  <h3 className="text-lg sm:text-xl font-bold text-white">تفاصيل الاشتراك</h3>
                  <Button
                    onClick={() => setShowDetailsModal(false)}
                    variant="ghost"
                    size="sm"
                    icon={<X className="w-5 h-5" />}
                    iconOnly
                    className="hover:bg-red-500/20 text-red-400"
                  />
                </div>

                <div className="space-y-3 sm:space-y-6">
                  {/* معلومات المستخدم */}
                  <div className="bg-slate-700/30 rounded-lg p-2 sm:p-4">
                    <h4 className="text-base sm:text-lg font-medium text-white mb-2 sm:mb-3">معلومات المستخدم</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                      <div>
                        <label className="text-xs sm:text-sm text-gray-400">الاسم</label>
                        <div className="text-white font-medium text-sm sm:text-base">{selectedSubscription.user_name}</div>
                      </div>
                      <div>
                        <label className="text-xs sm:text-sm text-gray-400">البريد الإلكتروني</label>
                        <div className="text-white font-medium text-sm sm:text-base truncate">{selectedSubscription.user_email}</div>
                      </div>
                    </div>
                  </div>

                  {/* معلومات الاشتراك */}
                  <div className="bg-slate-700/30 rounded-lg p-2 sm:p-4">
                    <h4 className="text-base sm:text-lg font-medium text-white mb-2 sm:mb-3">تفاصيل الاشتراك</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                      <div>
                        <label className="text-xs sm:text-sm text-gray-400">نوع الباقة</label>
                        <div className="text-white font-medium text-sm sm:text-base">{selectedSubscription.plan_name_ar}</div>
                      </div>
                      <div>
                        <label className="text-xs sm:text-sm text-gray-400">الحالة</label>
                        <div>{getStatusBadge(selectedSubscription.status, selectedSubscription.days_remaining, selectedSubscription.user_role)}</div>
                      </div>
                      <div>
                        <label className="text-xs sm:text-sm text-gray-400">تاريخ البداية</label>
                        <div className="text-white font-medium text-sm sm:text-base">{formatDate(selectedSubscription.start_date)}</div>
                      </div>
                      <div>
                        <label className="text-xs sm:text-sm text-gray-400">تاريخ الانتهاء</label>
                        <div className="text-white font-medium text-sm sm:text-base">{formatDate(selectedSubscription.end_date)}</div>
                      </div>
                      <div>
                        <label className="text-xs sm:text-sm text-gray-400">المبلغ المدفوع</label>
                        <div className="text-green-400 font-medium text-sm sm:text-base">${selectedSubscription.amount_paid}</div>
                      </div>
                      <div>
                        <label className="text-xs sm:text-sm text-gray-400">طريقة الدفع</label>
                        <div className="text-white font-medium text-sm sm:text-base">{selectedSubscription.payment_method || 'غير محدد'}</div>
                      </div>
                    </div>
                  </div>

                  {/* الأيام المتبقية */}
                  {selectedSubscription.user_role !== 'admin' && (
                    <div className="bg-slate-700/30 rounded-lg p-2 sm:p-4">
                      <h4 className="text-base sm:text-lg font-medium text-white mb-2 sm:mb-3">الوقت المتبقي</h4>
                      <div className="text-center">
                        <div className={`text-xl sm:text-3xl font-bold ${selectedSubscription.days_remaining <= 7 ? 'text-yellow-400' : selectedSubscription.days_remaining <= 0 ? 'text-red-400' : 'text-green-400'}`}>
                          {selectedSubscription.days_remaining > 0 ? `${selectedSubscription.days_remaining} يوم` : 'منتهي الصلاحية'}
                        </div>
                        <div className="text-gray-400 text-xs sm:text-sm mt-1">
                          {selectedSubscription.days_remaining > 0 ? 'متبقي في الاشتراك' : 'انتهت صلاحية الاشتراك'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-3 sm:mt-6 pt-2 sm:pt-4 border-t border-slate-700/50">
                  <Button
                    onClick={() => setShowDetailsModal(false)}
                    variant="secondary"
                    className="w-full sm:w-auto text-sm"
                  >
                    إغلاق
                  </Button>
                  <Button
                    onClick={() => {
                      setEditData({
                        id: selectedSubscription.id,
                        status: selectedSubscription.status,
                        start_date: selectedSubscription.start_date,
                        end_date: selectedSubscription.end_date,
                        amount_paid: selectedSubscription.amount_paid
                      });
                      setShowDetailsModal(false);
                      setShowEditModal(true);
                    }}
                    variant="primary"
                    icon={<Edit3 className="w-3 h-3 sm:w-4 sm:h-4" />}
                    className="w-full sm:w-auto text-sm"
                  >
                    تعديل الاشتراك
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* نافذة تعديل الاشتراك */}
      {showEditModal && selectedSubscription && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-2 sm:p-4" 
          style={{zIndex: 999997}}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEditModal(false);
            }
          }}
        >
            <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-lg w-full max-w-xs sm:max-w-md mx-2">
              <div className="p-3 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-6">
                  <h3 className="text-lg sm:text-xl font-bold text-white">تعديل الاشتراك</h3>
                  <Button
                    onClick={() => setShowEditModal(false)}
                    variant="ghost"
                    size="sm"
                    icon={<X className="w-5 h-5" />}
                    iconOnly
                    className="hover:bg-red-500/20 text-red-400"
                  />
                </div>

                <div className="space-y-2 sm:space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">الحالة</label>
                    <select
                      value={editData.status}
                      onChange={(e) => setEditData({...editData, status: e.target.value as 'active' | 'expired' | 'pending' | 'cancelled' | 'suspended' | 'paused'})}
                      className="w-full bg-slate-700/50 border border-slate-600/50 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500/50"
                    >
                      <option value="active">نشط</option>
                      <option value="paused">متوقف</option>
                      <option value="expired">منتهي</option>
                      <option value="cancelled">ملغي</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">تاريخ البداية</label>
                    <input
                      type="date"
                      value={editData.start_date?.split('T')[0]}
                      onChange={(e) => setEditData({...editData, start_date: e.target.value})}
                      className="w-full bg-slate-700/50 border border-slate-600/50 text-white rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-sm focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">تاريخ الانتهاء</label>
                    <input
                      type="date"
                      value={editData.end_date?.split('T')[0]}
                      onChange={(e) => setEditData({...editData, end_date: e.target.value})}
                      className="w-full bg-slate-700/50 border border-slate-600/50 text-white rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-sm focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">المبلغ المدفوع</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editData.amount_paid}
                      onChange={(e) => setEditData({...editData, amount_paid: parseFloat(e.target.value) || 0})}
                      className="w-full bg-slate-700/50 border border-slate-600/50 text-white rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-sm focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-3 sm:mt-6 pt-2 sm:pt-4 border-t border-slate-700/50">
                  <Button
                    onClick={() => setShowEditModal(false)}
                    variant="secondary"
                    className="w-full sm:w-auto text-sm"
                  >
                    إلغاء
                  </Button>
                  <Button
                    onClick={async () => {
                      await handleUpdateSubscription(editData.id, {
                        status: editData.status,
                        start_date: editData.start_date,
                        end_date: editData.end_date,
                        amount_paid: editData.amount_paid
                      });
                      setShowEditModal(false);
                    }}
                    variant="primary"
                    icon={<CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />}
                    disabled={actionLoading === editData.id}
                    className="w-full sm:w-auto text-sm"
                  >
                    حفظ التغييرات
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* نافذة تأكيد الحذف */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[70] p-2 sm:p-4">
            <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-lg w-full max-w-xs sm:max-w-md mx-2">
              <div className="p-3 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <XCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-400" />
                  <h3 className="text-lg sm:text-xl font-bold text-white">تأكيد الحذف</h3>
                </div>
                
                <p className="text-gray-300 mb-3 sm:mb-6 text-sm sm:text-base">
                  هل أنت متأكد من حذف هذا الاشتراك؟ هذا الإجراء لا يمكن التراجع عنه.
                </p>

                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                  <Button
                    onClick={() => setShowDeleteConfirm(null)}
                    variant="secondary"
                    className="w-full sm:w-auto text-sm"
                  >
                    إلغاء
                  </Button>
                  <Button
                    onClick={() => handleDeleteSubscription(showDeleteConfirm)}
                    variant="primary"
                    icon={<Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />}
                    disabled={actionLoading === showDeleteConfirm}
                    className="bg-red-600 hover:bg-red-700 w-full sm:w-auto text-sm"
                  >
                    حذف الاشتراك
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* نافذة تمديد الاشتراك */}
        {showExtendModal && selectedSubscription && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[60] p-2 sm:p-4">
            <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-lg w-full max-w-xs sm:max-w-md mx-2">
              <div className="p-3 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-6">
                  <h3 className="text-lg sm:text-xl font-bold text-white">تمديد الاشتراك</h3>
                  <Button
                    onClick={() => setShowExtendModal(false)}
                    variant="ghost"
                    size="sm"
                    icon={<X className="w-4 h-4 sm:w-5 sm:h-5" />}
                    iconOnly
                    className="hover:bg-red-500/20 text-red-400"
                  />
                </div>

                <div className="space-y-2 sm:space-y-4">
                  <div className="bg-slate-700/30 rounded-lg p-2 sm:p-4">
                    <div className="text-xs sm:text-sm text-gray-400 mb-1">المستخدم</div>
                    <div className="text-white font-medium text-sm sm:text-base">{selectedSubscription.user_name}</div>
                  </div>

                  <div className="space-y-2 sm:space-y-3">
                    <h4 className="text-base sm:text-lg font-medium text-white">اختر مدة التمديد:</h4>
                    
                    <Button
                      onClick={() => handleExtendSubscription(selectedSubscription.id, 1)}
                      variant="secondary"
                      className="w-full justify-between text-sm"
                      disabled={actionLoading === selectedSubscription.id}
                    >
                      <span>شهر واحد</span>
                      <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                    
                    <Button
                      onClick={() => handleExtendSubscription(selectedSubscription.id, 3)}
                      variant="secondary"
                      className="w-full justify-between text-sm"
                      disabled={actionLoading === selectedSubscription.id}
                    >
                      <span>3 أشهر</span>
                      <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                    
                    <Button
                      onClick={() => handleExtendSubscription(selectedSubscription.id, 6)}
                      variant="secondary"
                      className="w-full justify-between text-sm"
                      disabled={actionLoading === selectedSubscription.id}
                    >
                      <span>6 أشهر</span>
                      <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                    
                    <Button
                      onClick={() => handleExtendSubscription(selectedSubscription.id, 12)}
                      variant="primary"
                      className="w-full justify-between text-sm"
                      disabled={actionLoading === selectedSubscription.id}
                    >
                      <span>سنة كاملة</span>
                      <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* نافذة إرسال بريد إلكتروني */}
        {showEmailModal && selectedSubscription && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[60] p-2 sm:p-4">
            <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-lg w-full max-w-sm sm:max-w-lg mx-2">
              <div className="p-3 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-6">
                  <h3 className="text-lg sm:text-xl font-bold text-white">إرسال بريد إلكتروني</h3>
                  <Button
                    onClick={() => setShowEmailModal(false)}
                    variant="ghost"
                    size="sm"
                    icon={<X className="w-4 h-4 sm:w-5 sm:h-5" />}
                    iconOnly
                    className="hover:bg-red-500/20 text-red-400"
                  />
                </div>

                <div className="space-y-2 sm:space-y-4">
                  <div className="bg-slate-700/30 rounded-lg p-2 sm:p-4 space-y-2 sm:space-y-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                      <div>
                        <div className="text-xs sm:text-sm text-gray-400">من</div>
                        <div className="text-white font-medium text-sm sm:text-base">support@tradingbot.com</div>
                        <div className="text-xs text-gray-500">بريد الدعم الفني</div>
                      </div>
                    </div>
                    
                    <div className="border-t border-slate-600/50 pt-2 sm:pt-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                        <div>
                          <div className="text-xs sm:text-sm text-gray-400">إلى</div>
                          <div className="text-white font-medium text-sm sm:text-base truncate">{selectedSubscription.user_email}</div>
                          <div className="text-xs text-gray-500">المستخدم المحدد</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 sm:space-y-3">
                    <h4 className="text-base sm:text-lg font-medium text-white">قوالب البريد الإلكتروني:</h4>
                    
                    <Button
                      onClick={() => handleSendEmail(selectedSubscription)}
                      variant="secondary"
                      className="w-full justify-between text-sm"
                    >
                      <span>تذكير بانتهاء الاشتراك</span>
                      <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
                    </Button>
                    
                    <Button
                      onClick={() => handleSendEmail(selectedSubscription)}
                      variant="secondary"
                      className="w-full justify-between text-sm"
                    >
                      <span>فاتورة الاشتراك</span>
                      <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                    </Button>
                    
                    <Button
                      onClick={() => handleSendEmail(selectedSubscription)}
                      variant="secondary"
                      className="w-full justify-between text-sm"
                    >
                      <span>رسالة ترحيب</span>
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                    </Button>
                    
                    <Button
                      onClick={() => handleSendEmail(selectedSubscription)}
                      variant="primary"
                      className="w-full justify-between text-sm"
                    >
                      <span>رسالة مخصصة</span>
                      <Edit3 className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* نافذة تأكيد الحذف */}
      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4" 
          style={{zIndex: 999996}}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDeleteConfirm(null);
            }
          }}
        >
          <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <XCircle className="w-8 h-8 text-red-400" />
                <h3 className="text-xl font-bold text-white">تأكيد الحذف</h3>
              </div>
              
              <p className="text-gray-300 mb-6">
                هل أنت متأكد من حذف هذا الاشتراك؟ هذا الإجراء لا يمكن التراجع عنه.
              </p>

              <div className="flex justify-end gap-3">
                <Button
                  onClick={() => setShowDeleteConfirm(null)}
                  variant="secondary"
                >
                  إلغاء
                </Button>
                <Button
                  onClick={() => handleDeleteSubscription(showDeleteConfirm)}
                  variant="primary"
                  icon={<Trash2 className="w-4 h-4" />}
                  disabled={actionLoading === showDeleteConfirm}
                  className="bg-red-600 hover:bg-red-700"
                >
                  حذف الاشتراك
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* نافذة تمديد الاشتراك */}
      {showExtendModal && selectedSubscription && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4" 
          style={{zIndex: 999995}}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowExtendModal(false);
            }
          }}
        >
          <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">تمديد الاشتراك</h3>
                <Button
                  onClick={() => setShowExtendModal(false)}
                  variant="ghost"
                  size="sm"
                  icon={<X className="w-5 h-5" />}
                  iconOnly
                  className="hover:bg-red-500/20 text-red-400"
                />
              </div>

              <div className="space-y-2 sm:space-y-4">
                <div className="bg-slate-700/30 rounded-lg p-2 sm:p-4">
                  <div className="text-sm text-gray-400 mb-1">المستخدم</div>
                  <div className="text-white font-medium">{selectedSubscription.user_name}</div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-lg font-medium text-white">اختر مدة التمديد:</h4>
                  
                  <Button
                    onClick={() => handleExtendSubscription(selectedSubscription.id, 1)}
                    variant="secondary"
                    className="w-full justify-between"
                    disabled={actionLoading === selectedSubscription.id}
                  >
                    <span>شهر واحد</span>
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    onClick={() => handleExtendSubscription(selectedSubscription.id, 3)}
                    variant="secondary"
                    className="w-full justify-between"
                    disabled={actionLoading === selectedSubscription.id}
                  >
                    <span>3 أشهر</span>
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    onClick={() => handleExtendSubscription(selectedSubscription.id, 6)}
                    variant="secondary"
                    className="w-full justify-between"
                    disabled={actionLoading === selectedSubscription.id}
                  >
                    <span>6 أشهر</span>
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    onClick={() => handleExtendSubscription(selectedSubscription.id, 12)}
                    variant="primary"
                    className="w-full justify-between"
                    disabled={actionLoading === selectedSubscription.id}
                  >
                    <span>سنة كاملة</span>
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* نافذة إرسال بريد إلكتروني */}
      {showEmailModal && selectedSubscription && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4" 
          style={{zIndex: 999994}}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEmailModal(false);
            }
          }}
        >
          <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-lg w-full max-w-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">إرسال بريد إلكتروني</h3>
                <Button
                  onClick={() => setShowEmailModal(false)}
                  variant="ghost"
                  size="sm"
                  icon={<X className="w-5 h-5" />}
                  iconOnly
                  className="hover:bg-red-500/20 text-red-400"
                />
              </div>

              <div className="space-y-4">
                <div className="bg-slate-700/30 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-green-400" />
                    <div>
                      <div className="text-sm text-gray-400">من</div>
                      <div className="text-white font-medium">support@tradingbot.com</div>
                      <div className="text-xs text-gray-500">بريد الدعم الفني</div>
                    </div>
                  </div>
                  
                  <div className="border-t border-slate-600/50 pt-3">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-blue-400" />
                      <div>
                        <div className="text-sm text-gray-400">إلى</div>
                        <div className="text-white font-medium">{selectedSubscription.user_email}</div>
                        <div className="text-xs text-gray-500">المستخدم المحدد</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-lg font-medium text-white">قوالب البريد الإلكتروني:</h4>
                  
                  <Button
                    onClick={() => handleSendEmail(selectedSubscription)}
                    variant="secondary"
                    className="w-full justify-between"
                  >
                    <span>تذكير بانتهاء الاشتراك</span>
                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  </Button>
                  
                  <Button
                    onClick={() => handleSendEmail(selectedSubscription)}
                    variant="secondary"
                    className="w-full justify-between"
                  >
                    <span>فاتورة الاشتراك</span>
                    <CreditCard className="w-4 h-4 text-green-400" />
                  </Button>
                  
                  <Button
                    onClick={() => handleSendEmail(selectedSubscription)}
                    variant="secondary"
                    className="w-full justify-between"
                  >
                    <span>رسالة ترحيب</span>
                    <CheckCircle className="w-4 h-4 text-blue-400" />
                  </Button>
                  
                  <Button
                    onClick={() => handleSendEmail(selectedSubscription)}
                    variant="primary"
                    className="w-full justify-between"
                  >
                    <span>رسالة مخصصة</span>
                    <Edit3 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* نافذة الإعدادات المتقدمة - فوق كل شيء */}
      {showAdvancedSettings && selectedSubscription && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4" 
          style={{zIndex: 999999}}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAdvancedSettings(false);
            }
          }}
        >
          <div 
            className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">الإعدادات المتقدمة</h3>
                  <Button
                    onClick={() => setShowAdvancedSettings(false)}
                    variant="ghost"
                    size="sm"
                    icon={<X className="w-5 h-5" />}
                    iconOnly
                    className="hover:bg-red-500/20 text-red-400"
                  />
                </div>

                <div className="space-y-6">
                  {/* معلومات المستخدم */}
                  <div className="bg-slate-700/30 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-400" />
                      معلومات المستخدم
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-400">الاسم</label>
                        <div className="text-white font-medium">{selectedSubscription.user_name}</div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">البريد الإلكتروني</label>
                        <div className="text-white font-medium">{selectedSubscription.user_email}</div>
                      </div>
                    </div>
                  </div>

                  {/* إعدادات الإشعارات */}
                  <div className="bg-slate-700/30 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-400" />
                      إعدادات الإشعارات
                    </h4>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3">
                        <input type="checkbox" defaultChecked className="rounded bg-slate-600 border-slate-500" />
                        <span className="text-white">إشعار قبل انتهاء الاشتراك بـ 7 أيام</span>
                      </label>
                      <label className="flex items-center gap-3">
                        <input type="checkbox" defaultChecked className="rounded bg-slate-600 border-slate-500" />
                        <span className="text-white">إشعار عند تجديد الاشتراك</span>
                      </label>
                      <label className="flex items-center gap-3">
                        <input type="checkbox" className="rounded bg-slate-600 border-slate-500" />
                        <span className="text-white">إشعارات العروض الخاصة</span>
                      </label>
                    </div>
                  </div>

                  {/* إعدادات الفوترة */}
                  <div className="bg-slate-700/30 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-green-400" />
                      إعدادات الفوترة
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-gray-400">طريقة الدفع المفضلة</label>
                        <select className="w-full mt-1 bg-slate-600 border border-slate-500 text-white rounded-lg px-3 py-2">
                          <option value="paypal">PayPal</option>
                          <option value="card">بطاقة ائتمان</option>
                          <option value="crypto">عملة رقمية</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">عملة الفوترة</label>
                        <select className="w-full mt-1 bg-slate-600 border border-slate-500 text-white rounded-lg px-3 py-2">
                          <option value="USD">دولار أمريكي (USD)</option>
                          <option value="EUR">يورو (EUR)</option>
                          <option value="SAR">ريال سعودي (SAR)</option>
                        </select>
                      </div>
                      <label className="flex items-center gap-3">
                        <input type="checkbox" className="rounded bg-slate-600 border-slate-500" />
                        <span className="text-white">تجديد تلقائي للاشتراك</span>
                      </label>
                    </div>
                  </div>

                  {/* إعدادات الأمان */}
                  <div className="bg-slate-700/30 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                      <Settings className="w-5 h-5 text-purple-400" />
                      إعدادات الأمان
                    </h4>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3">
                        <input type="checkbox" defaultChecked className="rounded bg-slate-600 border-slate-500" />
                        <span className="text-white">المصادقة الثنائية</span>
                      </label>
                      <label className="flex items-center gap-3">
                        <input type="checkbox" className="rounded bg-slate-600 border-slate-500" />
                        <span className="text-white">تسجيل الخروج من جميع الأجهزة</span>
                      </label>
                      <div>
                        <label className="text-sm text-gray-400">مستوى الأمان</label>
                        <select className="w-full mt-1 bg-slate-600 border border-slate-500 text-white rounded-lg px-3 py-2">
                          <option value="basic">أساسي</option>
                          <option value="medium" selected>متوسط</option>
                          <option value="high">عالي</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-700/50">
                  <Button
                    onClick={() => setShowAdvancedSettings(false)}
                    variant="secondary"
                  >
                    إلغاء
                  </Button>
                  <Button
                    onClick={() => {

                      setShowAdvancedSettings(false);
                    }}
                    variant="primary"
                    icon={<CheckCircle className="w-4 h-4" />}
                  >
                    حفظ الإعدادات
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
    </>
  );
};
