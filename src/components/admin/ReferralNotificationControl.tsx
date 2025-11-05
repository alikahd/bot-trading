import React, { useState, useEffect } from 'react';
import { Send, Users, Clock, CheckCircle, XCircle, Bell } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { supabase } from '../../config/supabaseClient';
import { adminNotificationService } from '../../services/adminNotificationService';

export const ReferralNotificationControl: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [sendingStatus, setSendingStatus] = useState<Record<string, 'pending' | 'success' | 'error'>>({});
  const [forceResend, setForceResend] = useState(false);
  const [stats, setStats] = useState({
    totalActive: 0,
    sentToday: 0,
    lastSent: null as string | null
  });

  // جلب المستخدمين النشطين
  useEffect(() => {
    loadActiveUsers();
    loadStats();
  }, []);

  const loadActiveUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name, username, subscription_status, created_at')
        .eq('subscription_status', 'active')
        .eq('is_active', true)
        .eq('role', 'trader')  // ✅ فقط المتداولين وليس الأدمن
        .order('created_at', { ascending: false });

      if (error) throw error;

      setActiveUsers(data || []);
      setStats(prev => ({ ...prev, totalActive: data?.length || 0 }));
    } catch (error) {
      console.error('❌ خطأ في جلب المستخدمين:', error);
    }
  };

  const loadStats = async () => {
    try {
      // عدد الإشعارات المرسلة اليوم
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('notifications')
        .select('created_at')
        .in('type', ['referral_welcome', 'referral_reminder'])
        .gte('created_at', today.toISOString());

      if (error) throw error;

      setStats(prev => ({
        ...prev,
        sentToday: data?.length || 0,
        lastSent: data && data.length > 0 ? data[0].created_at : null
      }));
    } catch (error) {
      console.error('❌ خطأ في جلب الإحصائيات:', error);
    }
  };

  // إرسال لمستخدم واحد
  const sendToUser = async (userId: string) => {
    setSendingStatus(prev => ({ ...prev, [userId]: 'pending' }));

    try {
      const result = await adminNotificationService.sendReferralReminder(userId, forceResend);

      if (result.success) {
        setSendingStatus(prev => ({ ...prev, [userId]: 'success' }));
        await loadStats();
      } else {
        setSendingStatus(prev => ({ ...prev, [userId]: 'error' }));
      }
    } catch (error) {
      console.error('❌ خطأ في الإرسال:', error);
      setSendingStatus(prev => ({ ...prev, [userId]: 'error' }));
    }
  };

  // إرسال للمستخدمين المحددين
  const sendToSelected = async () => {
    if (selectedUsers.length === 0) {
      alert('يرجى اختيار مستخدم واحد على الأقل');
      return;
    }

    setLoading(true);

    for (const userId of selectedUsers) {
      await sendToUser(userId);
      // انتظار قصير بين كل إرسال
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setLoading(false);
    setSelectedUsers([]);
  };

  // إرسال لجميع المستخدمين النشطين
  const sendToAll = async () => {
    if (!confirm(`هل أنت متأكد من إرسال إشعار الإحالة لجميع المستخدمين النشطين (${activeUsers.length} مستخدم)؟`)) {
      return;
    }

    setLoading(true);

    for (const user of activeUsers) {
      await sendToUser(user.id);
      // انتظار قصير بين كل إرسال
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setLoading(false);
  };

  // تبديل اختيار مستخدم
  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // اختيار/إلغاء اختيار الكل
  const toggleSelectAll = () => {
    if (selectedUsers.length === activeUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(activeUsers.map(u => u.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">المستخدمين النشطين</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalActive}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">إشعارات اليوم</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.sentToday}</p>
            </div>
            <Bell className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">آخر إرسال</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {stats.lastSent ? new Date(stats.lastSent).toLocaleString('ar') : 'لا يوجد'}
              </p>
            </div>
            <Clock className="w-8 h-8 text-orange-500" />
          </div>
        </Card>
      </div>

      {/* أزرار التحكم */}
      <Card className="p-6">
        {/* خيار الإرسال الإجباري */}
        <div className="mb-4 flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <input
            type="checkbox"
            id="forceResend"
            checked={forceResend}
            onChange={(e) => setForceResend(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="forceResend" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
            ⚠️ إرسال إجباري (تجاوز قيد الـ 7 أيام)
          </label>
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          <Button
            onClick={sendToSelected}
            disabled={loading || selectedUsers.length === 0}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Send className="w-4 h-4" />
            إرسال للمحددين ({selectedUsers.length})
          </Button>

          <Button
            onClick={sendToAll}
            disabled={loading || activeUsers.length === 0}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
          >
            <Send className="w-4 h-4" />
            إرسال للجميع ({activeUsers.length})
          </Button>

          <Button
            onClick={toggleSelectAll}
            disabled={loading}
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white"
          >
            {selectedUsers.length === activeUsers.length ? 'إلغاء الكل' : 'اختيار الكل'}
          </Button>

          <Button
            onClick={() => {
              loadActiveUsers();
              loadStats();
            }}
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white"
          >
            تحديث
          </Button>
        </div>

        {/* قائمة المستخدمين */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-right p-3">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === activeUsers.length && activeUsers.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded"
                  />
                </th>
                <th className="text-right p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">الاسم</th>
                <th className="text-right p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">اسم المستخدم</th>
                <th className="text-right p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">البريد</th>
                <th className="text-right p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">الحالة</th>
                <th className="text-right p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {activeUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => toggleUserSelection(user.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="p-3 text-sm text-gray-900 dark:text-white">
                    {user.full_name || '-'}
                  </td>
                  <td className="p-3 text-sm font-medium text-blue-600 dark:text-blue-400">
                    @{user.username}
                  </td>
                  <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                    {user.email}
                  </td>
                  <td className="p-3">
                    {sendingStatus[user.id] === 'pending' && (
                      <span className="inline-flex items-center gap-1 text-xs text-blue-600">
                        <Clock className="w-3 h-3 animate-spin" />
                        جاري الإرسال...
                      </span>
                    )}
                    {sendingStatus[user.id] === 'success' && (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle className="w-3 h-3" />
                        تم الإرسال
                      </span>
                    )}
                    {sendingStatus[user.id] === 'error' && (
                      <span className="inline-flex items-center gap-1 text-xs text-red-600">
                        <XCircle className="w-3 h-3" />
                        فشل
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <Button
                      onClick={() => sendToUser(user.id)}
                      disabled={loading || sendingStatus[user.id] === 'pending'}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      إرسال
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {activeUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              لا يوجد مستخدمين نشطين
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
