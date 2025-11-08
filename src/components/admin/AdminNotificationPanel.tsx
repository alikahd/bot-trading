/**
 * 🔔 لوحة إرسال التنبيهات للأدمن
 */

import React, { useState, useEffect } from 'react';
import { Send, Users, User, Bell, AlertCircle, AlertTriangle, Megaphone, Trash2, RefreshCw, Upload, X } from 'lucide-react';
import { adminNotificationService, CreateNotificationData } from '../../services/adminNotificationService';
import { useLanguage } from '../../contexts/LanguageContext';
import { supabase } from '../../config/supabaseClient';

export const AdminNotificationPanel: React.FC = () => {
  const { language, dir } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  
  // بيانات النموذج
  const [recipientType, setRecipientType] = useState<'all_users' | 'multiple_users'>('all_users');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserList, setShowUserList] = useState(false);
  const [type, setType] = useState<'info' | 'warning' | 'error' | 'success' | 'announcement'>('info');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [titleEn, setTitleEn] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [titleFr, setTitleFr] = useState('');
  const [messageEn, setMessageEn] = useState('');
  const [messageAr, setMessageAr] = useState('');
  const [messageFr, setMessageFr] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  // جلب المستخدمين
  const loadUsers = async () => {
    setLoadingUsers(true);
    try {

      // جلب المستخدمين (استخدام auth_id للتنبيهات)
      const { data: usersData, error } = await supabase
        .from('users')
        .select('id, auth_id, username, email, full_name, status, subscription_status, subscription_end_date, is_active, preferred_language');
      
      if (error) {

        throw error;
      }

      // جلب معلومات الدفع لكل مستخدم
      const usersWithPaymentInfo = await Promise.all(
        (usersData || []).map(async (user: any) => {
          // التحقق من وجود دفعة مكتملة
          const { data: payments } = await supabase
            .from('payments')
            .select('status')
            .eq('user_id', user.id)
            .eq('status', 'completed')
            .limit(1);
          
          return {
            ...user,
            has_completed_payment: payments && payments.length > 0
          };
        })
      );

      // ترتيب المستخدمين: المشتركون أولاً، ثم حسب الاسم
      const sortedUsers = usersWithPaymentInfo.sort((a: any, b: any) => {
        // أولاً: المشتركون النشطون
        if (a.subscription_status === 'active' && b.subscription_status !== 'active') return -1;
        if (a.subscription_status !== 'active' && b.subscription_status === 'active') return 1;
        
        // ثانياً: حسب الاسم
        const nameA = a.username || a.email || a.full_name || '';
        const nameB = b.username || b.email || b.full_name || '';
        return nameA.localeCompare(nameB);
      });
      
      setUsers(sortedUsers);
    } catch (error: any) {

      alert(`فشل جلب المستخدمين: ${error?.message || 'خطأ غير معروف'}`);
    } finally {
      setLoadingUsers(false);
    }
  };
  
  // دالة دقيقة لتحديد حالة الاشتراك (بناءً على الدفع الفعلي)
  const getSubscriptionStatus = (user: any) => {
    const now = new Date();
    const endDate = user.subscription_end_date ? new Date(user.subscription_end_date) : null;
    
    // 1. التحقق من وجود دفعة مكتملة (completed payment)
    const hasCompletedPayment = user.has_completed_payment === true;
    
    // 2. التحقق من الاشتراك النشط مع دفع مكتمل
    if (hasCompletedPayment && user.subscription_status === 'active' && user.status === 'active') {
      if (endDate && endDate > now) {
        return { icon: '✅', text: 'مشترك نشط', color: 'text-green-400' };
      } else if (endDate && endDate <= now) {
        return { icon: '⏰', text: 'منتهي', color: 'text-orange-400' };
      } else {
        return { icon: '✅', text: 'مشترك', color: 'text-green-400' };
      }
    }
    
    // 3. اشتراك نشط لكن بدون دفع مكتمل (قيد المراجعة)
    if (user.subscription_status === 'active' && !hasCompletedPayment) {
      return { icon: '⏳', text: 'قيد المراجعة', color: 'text-yellow-400' };
    }
    
    // 4. منتهي
    if (user.subscription_status === 'expired' || (endDate && endDate <= now)) {
      return { icon: '❌', text: 'منتهي', color: 'text-red-400' };
    }
    
    // 5. ملغي
    if (user.subscription_status === 'cancelled') {
      return { icon: '🚫', text: 'ملغي', color: 'text-gray-400' };
    }
    
    // 6. قيد الانتظار
    if (user.subscription_status === 'pending') {
      return { icon: '⏳', text: 'قيد المراجعة', color: 'text-yellow-400' };
    }
    
    // 7. غير مشترك
    return { icon: '⭕', text: 'غير مشترك', color: 'text-gray-500' };
  };

  // جلب الإحصائيات
  const loadStats = async () => {
    const result = await adminNotificationService.getNotificationStats();
    if (result.success && result.stats) {
      setStats(result.stats);
    }
  };

  useEffect(() => {
    loadStats();
    loadUsers();

    // ✅ إعداد Realtime للمستخدمين والإشعارات

    // مزامنة المستخدمين
    const usersChannel = supabase
      .channel('admin-notification-users-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        (_payload) => {

          loadUsers(); // إعادة تحميل قائمة المستخدمين
        }
      )
      .subscribe();

    // مزامنة الإشعارات
    const notificationsChannel = supabase
      .channel('admin-notifications-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        (_payload) => {

          loadStats(); // إعادة تحميل الإحصائيات
        }
      )
      .subscribe();

    // تنظيف عند إلغاء التحميل
    return () => {

      supabase.removeChannel(usersChannel);
      supabase.removeChannel(notificationsChannel);
    };
  }, []);

  // معالجة رفع الصورة
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('حجم الصورة يجب أن يكون أقل من 2MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // رفع الصورة إلى Supabase Storage
  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;
    
    try {
      const fileName = `notification-${Date.now()}-${imageFile.name}`;
      const { error } = await supabase.storage
        .from('notifications')
        .upload(fileName, imageFile);
      
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from('notifications')
        .getPublicUrl(fileName);
      
      return publicUrl;
    } catch (error) {

      return null;
    }
  };

  // إرسال التنبيه
  const handleSend = async () => {
    // التحقق من اختيار المستخدمين
    if (recipientType === 'multiple_users' && selectedUserIds.length === 0) {
      alert(language === 'ar' ? 'الرجاء اختيار مستخدم واحد على الأقل' : 'Please select at least one user');
      return;
    }
    
    // التحقق من جميع اللغات (إجبارية دائماً)
    if (!titleEn || !messageEn) {
      alert(language === 'ar' ? 'الرجاء ملء العنوان والرسالة بالإنجليزية' : 'Please fill English title and message');
      return;
    }
    if (!titleAr || !messageAr) {
      alert(language === 'ar' ? 'الرجاء ملء العنوان والرسالة بالعربية' : 'Please fill Arabic title and message');
      return;
    }
    if (!titleFr || !messageFr) {
      alert(language === 'ar' ? 'الرجاء ملء العنوان والرسالة بالفرنسية' : 'Please fill French title and message');
      return;
    }

    setLoading(true);

    // رفع الصورة إذا كانت موجودة
    let imageUrl = null;
    if (imageFile) {
      imageUrl = await uploadImage();
      if (!imageUrl) {
        alert('فشل رفع الصورة');
        setLoading(false);
        return;
      }
    }

    const data: CreateNotificationData = {
      title: titleEn,
      title_ar: titleAr || undefined,
      title_fr: titleFr || undefined,
      message: messageEn,
      message_ar: messageAr || undefined,
      message_fr: messageFr || undefined,
      type,
      priority,
      expires_at: expiresAt || undefined,
      image_url: imageUrl || undefined,
    } as any;

    let result;
    if (recipientType === 'all_users') {
      result = await adminNotificationService.sendToAllUsers(data);
    } else {
      // إرسال لعدة مستخدمين محددين - استخدام auth_id
      const selectedUsers = users.filter(u => selectedUserIds.includes(u.id));
      const results = await Promise.all(
        selectedUsers.map(user => {
          const authId = user.auth_id || user.id; // استخدام auth_id إذا كان موجوداً

          return adminNotificationService.sendToUser(authId, data);
        })
      );
      result = {
        success: results.every(r => r.success),
        message: `تم إرسال التنبيه إلى ${results.filter(r => r.success).length} من ${selectedUserIds.length} مستخدم`
      };
    }

    setLoading(false);

    if (result.success) {
      alert(language === 'ar' ? '✅ تم إرسال التنبيه بنجاح!' : '✅ Notification sent successfully!');
      // مسح النموذج
      setTitleEn('');
      setTitleAr('');
      setTitleFr('');
      setMessageEn('');
      setMessageAr('');
      setMessageFr('');
      setSelectedUserIds([]);
      setExpiresAt('');
      setImageFile(null);
      setImagePreview('');
      loadStats();
    } else {
      alert(`❌ ${result.error}`);
    }
  };

  // حذف المنتهية
  const handleDeleteExpired = async () => {
    if (!confirm(language === 'ar' ? 'هل تريد حذف التنبيهات المنتهية؟' : 'Delete expired notifications?')) {
      return;
    }

    const result = await adminNotificationService.deleteExpiredNotifications();
    if (result.success) {
      alert(`✅ ${language === 'ar' ? 'تم حذف' : 'Deleted'} ${result.count} ${language === 'ar' ? 'تنبيه' : 'notifications'}`);
      loadStats();
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-2 sm:p-6 space-y-2 sm:space-y-6" dir={dir}>
      {/* الهيدر */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-2 sm:p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg">
            <Bell className="w-5 h-5 sm:w-8 sm:h-8 text-purple-400" />
          </div>
          <div>
            <h1 className="text-base sm:text-2xl font-bold text-white">
              {language === 'ar' ? 'إدارة التنبيهات' : language === 'fr' ? 'Gestion des notifications' : 'Notifications Management'}
            </h1>
            <p className="text-gray-400 text-[10px] sm:text-sm">
              {language === 'ar' ? 'إرسال تنبيهات للمستخدمين' : language === 'fr' ? 'Envoyer des notifications aux utilisateurs' : 'Send notifications to users'}
            </p>
          </div>
        </div>
        <button
          onClick={handleDeleteExpired}
          className="flex items-center gap-1 sm:gap-2 px-1.5 py-1 sm:px-4 sm:py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-[10px] sm:text-sm"
        >
          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">{language === 'ar' ? 'حذف المنتهية' : 'Delete Expired'}</span>
        </button>
      </div>

      {/* الإحصائيات */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 sm:gap-4">
          <div className="bg-gray-800 rounded-lg p-2 sm:p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-[10px] sm:text-sm">{language === 'ar' ? 'المجموع' : 'Total'}</p>
                <p className="text-sm sm:text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <Bell className="w-5 h-5 sm:w-8 sm:h-8 text-blue-400" />
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-2 sm:p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-[10px] sm:text-sm">{language === 'ar' ? 'غير مقروءة' : 'Unread'}</p>
                <p className="text-sm sm:text-2xl font-bold text-white">{stats.unread}</p>
              </div>
              <AlertCircle className="w-5 h-5 sm:w-8 sm:h-8 text-yellow-400" />
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-2 sm:p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-[10px] sm:text-sm">{language === 'ar' ? 'تحذيرات' : 'Warnings'}</p>
                <p className="text-sm sm:text-2xl font-bold text-white">{stats.byType.warning || 0}</p>
              </div>
              <AlertTriangle className="w-5 h-5 sm:w-8 sm:h-8 text-orange-400" />
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-2 sm:p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-[10px] sm:text-sm">{language === 'ar' ? 'عاجلة' : 'Urgent'}</p>
                <p className="text-sm sm:text-2xl font-bold text-white">{stats.byPriority.urgent || 0}</p>
              </div>
              <Megaphone className="w-5 h-5 sm:w-8 sm:h-8 text-red-400" />
            </div>
          </div>
        </div>
      )}

      {/* نموذج الإرسال */}
      <div className="bg-gray-800 rounded-lg p-3 sm:p-6 border border-gray-700">
        <h2 className="text-sm sm:text-xl font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
          <Send className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
          {language === 'ar' ? 'إرسال تنبيه جديد' : language === 'fr' ? 'Envoyer une nouvelle notification' : 'Send New Notification'}
        </h2>

        <div className="space-y-3 sm:space-y-4">
          {/* نوع المستقبل */}
          <div>
            <label className="block text-[11px] sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
              {language === 'ar' ? 'المستقبل' : 'Recipient'}
            </label>
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <button
                onClick={() => {
                  setRecipientType('all_users');
                  setSelectedUserIds([]);
                }}
                className={`flex items-center justify-center gap-1 sm:gap-2 px-2 py-2 sm:px-4 sm:py-3 rounded-lg border-2 transition-colors text-xs sm:text-sm ${
                  recipientType === 'all_users'
                    ? 'border-purple-500 bg-purple-500/20 text-white'
                    : 'border-gray-600 bg-gray-700 text-gray-400 hover:border-gray-500'
                }`}
              >
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">{language === 'ar' ? 'جميع المستخدمين' : 'All Users'}</span>
                <span className="sm:hidden">{language === 'ar' ? 'الكل' : 'All'}</span>
              </button>
              <button
                onClick={() => {
                  setRecipientType('multiple_users');
                  if (users.length === 0) loadUsers();
                }}
                className={`flex items-center justify-center gap-1 sm:gap-2 px-2 py-2 sm:px-4 sm:py-3 rounded-lg border-2 transition-colors text-xs sm:text-sm ${
                  recipientType === 'multiple_users'
                    ? 'border-purple-500 bg-purple-500/20 text-white'
                    : 'border-gray-600 bg-gray-700 text-gray-400 hover:border-gray-500'
                }`}
              >
                <User className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">{language === 'ar' ? 'اختر من القائمة' : 'Select from List'}</span>
                <span className="sm:hidden">{language === 'ar' ? 'اختر' : 'Select'}</span>
                {selectedUserIds.length > 0 && (
                  <span className="bg-purple-600 text-white text-[10px] sm:text-xs px-1.5 py-0.5 sm:px-2 rounded-full ml-1 sm:ml-2">
                    {selectedUserIds.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* اختيار المستخدمين المتعددين */}
          {recipientType === 'multiple_users' && (
            <div>
              {/* زر فتح/إغلاق القائمة */}
              <button
                onClick={() => {
                  setShowUserList(!showUserList);
                  if (!showUserList && users.length === 0) {
                    loadUsers();
                  }
                }}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-purple-400" />
                  <span className="text-white font-medium">
                    {language === 'ar' ? 'اختر المستخدمين' : 'Select Users'}
                  </span>
                  {selectedUserIds.length > 0 && (
                    <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                      {selectedUserIds.length} {language === 'ar' ? 'محدد' : 'selected'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {users.length > 0 && (
                    <div className="flex gap-2 text-xs">
                      <span className="text-green-400">✅ {users.filter(u => getSubscriptionStatus(u).icon === '✅').length}</span>
                      <span className="text-orange-400">⏰ {users.filter(u => getSubscriptionStatus(u).icon === '⏰').length}</span>
                      <span className="text-red-400">❌ {users.filter(u => getSubscriptionStatus(u).icon === '❌').length}</span>
                      <span className="text-gray-500">⭕ {users.filter(u => getSubscriptionStatus(u).icon === '⭕').length}</span>
                    </div>
                  )}
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${showUserList ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* القائمة القابلة للطي */}
              {showUserList && (
                <div className="mt-3 space-y-3 animate-in slide-in-from-top-2">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const filteredUsers = users.filter(user => {
                            if (!searchQuery) return true;
                            const query = searchQuery.toLowerCase();
                            const username = (user.username || '').toLowerCase();
                            const email = (user.email || '').toLowerCase();
                            const fullName = (user.full_name || '').toLowerCase();
                            return username.includes(query) || email.includes(query) || fullName.includes(query);
                          });
                          setSelectedUserIds(filteredUsers.map(u => u.id));
                        }}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded transition-colors"
                      >
                        {language === 'ar' ? 'تحديد الكل' : 'Select All'}
                      </button>
                      <button
                        onClick={() => setSelectedUserIds([])}
                        className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded transition-colors"
                      >
                        {language === 'ar' ? 'إلغاء التحديد' : 'Clear All'}
                      </button>
                    </div>
                    <button
                      onClick={loadUsers}
                      disabled={loadingUsers}
                      className="p-1.5 hover:bg-gray-700 rounded transition-colors"
                      title={language === 'ar' ? 'تحديث القائمة' : 'Refresh list'}
                    >
                      <RefreshCw className={`w-4 h-4 text-gray-400 ${loadingUsers ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
              {loadingUsers ? (
                <div className="text-gray-400 text-center py-4">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                  جاري التحميل...
                </div>
              ) : users.length === 0 ? (
                <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 text-yellow-300 text-sm">
                  ⚠️ لا يوجد مستخدمين في قاعدة البيانات.
                </div>
              ) : (
                <div className="space-y-3">
                  {/* شريط البحث */}
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={language === 'ar' ? 'ابحث عن مستخدم...' : 'Search for a user...'}
                      className="w-full px-4 py-2 pr-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                      dir="rtl"
                    />
                    <User className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                  
                  {/* القائمة */}
                  <div className="border border-gray-600 rounded-lg overflow-hidden">
                    <div className="max-h-96 overflow-y-auto">
                      <div className="divide-y divide-gray-700">
                        {users
                          .filter(user => {
                            if (!searchQuery) return true;
                            const query = searchQuery.toLowerCase();
                            const username = (user.username || '').toLowerCase();
                            const email = (user.email || '').toLowerCase();
                            const fullName = (user.full_name || '').toLowerCase();
                            return username.includes(query) || email.includes(query) || fullName.includes(query);
                          })
                          .map(user => {
                            const status = getSubscriptionStatus(user);
                            const displayName = user.username || user.email || user.full_name || user.id.substring(0, 8);
                            const langIcon = user.preferred_language === 'ar' ? '🇸🇦' : user.preferred_language === 'fr' ? '🇫🇷' : '🇬🇧';
                            const langText = user.preferred_language === 'ar' ? 'عربي' : user.preferred_language === 'fr' ? 'فرنسي' : 'إنجليزي';
                            const endDate = user.subscription_end_date ? new Date(user.subscription_end_date).toLocaleDateString('ar-SA') : '-';
                            const isSelected = selectedUserIds.includes(user.id);
                            
                            return (
                              <div
                                key={user.id}
                                onClick={() => {
                                  if (isSelected) {
                                    setSelectedUserIds(selectedUserIds.filter(id => id !== user.id));
                                  } else {
                                    setSelectedUserIds([...selectedUserIds, user.id]);
                                  }
                                }}
                                className={`p-4 cursor-pointer transition-colors ${
                                  isSelected 
                                    ? 'bg-purple-900/30 border-r-4 border-purple-500' 
                                    : 'hover:bg-gray-700/50'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {}}
                                    className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                                  />
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <div className="font-medium text-white">{displayName}</div>
                                        {user.email && user.username && (
                                          <div className="text-xs text-gray-400">{user.email}</div>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                                          {status.icon} {status.text}
                                        </span>
                                        <span className="inline-flex items-center gap-1 text-xs text-gray-300">
                                          {langIcon} {langText}
                                        </span>
                                        <span className="text-xs text-gray-400">{endDate}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
                </div>
              )}
            </div>
          )}

          {/* النوع والأولوية */}
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <div>
              <label className="block text-[11px] sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                {language === 'ar' ? 'النوع' : 'Type'}
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-2 py-1.5 sm:px-4 sm:py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none text-xs sm:text-sm"
              >
                <option value="info">ℹ️ Info</option>
                <option value="warning">⚠️ Warning</option>
                <option value="error">❌ Error</option>
                <option value="success">✅ Success</option>
                <option value="announcement">📢 Announcement</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                {language === 'ar' ? 'الأولوية' : 'Priority'}
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-2 py-1.5 sm:px-4 sm:py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none text-xs sm:text-sm"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">🔴 Urgent</option>
              </select>
            </div>
          </div>

          {/* العناوين */}
          <div className="space-y-2 sm:space-y-3">
            <label className="block text-[11px] sm:text-sm font-medium text-gray-300">
              {language === 'ar' ? 'العنوان' : 'Title'} *
              {recipientType === 'multiple_users' && selectedUserIds.length > 0 && (() => {
                const selectedUsers = users.filter(u => selectedUserIds.includes(u.id));
                const languages = [...new Set(selectedUsers.map(u => u.preferred_language))];
                return (
                  <span className="text-xs text-blue-400 mr-2">
                    ({languages.map(lang => lang === 'ar' ? '🇸🇦' : lang === 'fr' ? '🇫🇷' : '🇬🇧').join(' ')})
                  </span>
                );
              })()}
            </label>
            
            {/* جميع اللغات دائماً - لضمان ظهور التنبيه حتى لو غيّر المستخدم لغته */}
            <input
              type="text"
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              placeholder="English Title *"
              className="w-full px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none text-xs sm:text-sm"
            />
            <input
              type="text"
              value={titleAr}
              onChange={(e) => setTitleAr(e.target.value)}
              placeholder="العنوان بالعربية *"
              className="w-full px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none text-xs sm:text-sm"
              dir="rtl"
            />
            <input
              type="text"
              value={titleFr}
              onChange={(e) => setTitleFr(e.target.value)}
              placeholder="Titre en français *"
              className="w-full px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none text-xs sm:text-sm"
            />
          </div>

          {/* الرسائل */}
          <div className="space-y-2 sm:space-y-3">
            <label className="block text-[11px] sm:text-sm font-medium text-gray-300">
              {language === 'ar' ? 'الرسالة' : 'Message'} *
              {recipientType === 'multiple_users' && selectedUserIds.length > 0 && (() => {
                const selectedUsers = users.filter(u => selectedUserIds.includes(u.id));
                const languages = [...new Set(selectedUsers.map(u => u.preferred_language))];
                return (
                  <span className="text-xs text-blue-400 mr-2">
                    ({languages.map(lang => lang === 'ar' ? '🇸🇦' : lang === 'fr' ? '🇫🇷' : '🇬🇧').join(' ')})
                  </span>
                );
              })()}
            </label>
            
            {/* جميع اللغات دائماً - لضمان ظهور التنبيه حتى لو غيّر المستخدم لغته */}
            <textarea
              value={messageEn}
              onChange={(e) => setMessageEn(e.target.value)}
              placeholder="English Message *"
              rows={2}
              className="w-full px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none resize-none text-xs sm:text-sm"
            />
            <textarea
              value={messageAr}
              onChange={(e) => setMessageAr(e.target.value)}
              placeholder="الرسالة بالعربية *"
              rows={2}
              className="w-full px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none resize-none text-xs sm:text-sm"
              dir="rtl"
            />
            <textarea
              value={messageFr}
              onChange={(e) => setMessageFr(e.target.value)}
              placeholder="Message en français *"
              rows={2}
              className="w-full px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none resize-none text-xs sm:text-sm"
            />
          </div>

          {/* رفع صورة */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {language === 'ar' ? 'صورة (اختياري)' : 'Image (Optional)'}
            </label>
            <div className="space-y-2">
              <label className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white hover:bg-gray-600 cursor-pointer transition-colors">
                <Upload className="w-4 h-4" />
                {language === 'ar' ? 'اختر صورة' : 'Choose Image'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
              {imagePreview && (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
                  <button
                    onClick={() => { setImageFile(null); setImagePreview(''); }}
                    className="absolute top-2 right-2 p-1 bg-red-500 rounded-full hover:bg-red-600"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* تاريخ الانتهاء */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {language === 'ar' ? 'تاريخ الانتهاء (اختياري)' : 'Expiration Date (Optional)'}
            </label>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
            />
          </div>

          {/* ملاحظة عن اللغة */}
          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3">
            <div className="space-y-2">
              <p className="text-blue-300 text-sm font-semibold">
                💡 {language === 'ar' ? 'كيف يتم تحديد اللغة؟' : 'How is the language determined?'}
              </p>
              <p className="text-blue-200 text-xs">
                {language === 'ar' ? 
                  '• يتم عرض التنبيه بناءً على اللغة المفضلة للمستخدم (preferred_language) المحفوظة في قاعدة البيانات.' : 
                  '• The notification is displayed based on the user\'s preferred language (preferred_language) saved in the database.'}
              </p>
              <p className="text-blue-200 text-xs">
                {language === 'ar' ? 
                  '• إذا كانت اللغة المفضلة "ar" → يعرض النسخة العربية (title_ar, message_ar)' : 
                  '• If preferred language is "ar" → shows Arabic version (title_ar, message_ar)'}
              </p>
              <p className="text-blue-200 text-xs">
                {language === 'ar' ? 
                  '• إذا كانت اللغة المفضلة "fr" → يعرض النسخة الفرنسية (title_fr, message_fr)' : 
                  '• If preferred language is "fr" → shows French version (title_fr, message_fr)'}
              </p>
              <p className="text-blue-200 text-xs">
                {language === 'ar' ? 
                  '• إذا لم تتوفر الترجمة أو اللغة "en" → يعرض النسخة الإنجليزية (title, message)' : 
                  '• If translation not available or language is "en" → shows English version (title, message)'}
              </p>
              <p className="text-yellow-200 text-xs mt-2">
                🔍 {language === 'ar' ? 
                  'يمكنك رؤية اللغة المفضلة لكل مستخدم في القائمة أعلاه (🇸🇦 عربي، 🇫🇷 فرنسي، 🇬🇧 إنجليزي)' : 
                  'You can see each user\'s preferred language in the list above (🇸🇦 Arabic, 🇫🇷 French, 🇬🇧 English)'}
              </p>
            </div>
          </div>

          {/* زر الإرسال */}
          <button
            onClick={handleSend}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                {language === 'ar' ? 'جاري الإرسال...' : 'Sending...'}
              </>
            ) : (
              <>
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                {language === 'ar' ? 'إرسال التنبيه' : language === 'fr' ? 'Envoyer' : 'Send Notification'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
