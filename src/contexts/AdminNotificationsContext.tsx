/**
 * Context لمشاركة إشعارات الأدمن بين المكونات
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../config/supabaseClient';

export interface AdminNotificationsSummary {
  newUsers: number;
  pendingPayments: number;
  pendingCommissions: number;
  expiringSoon: number;
}

interface AdminNotificationsContextType {
  notifications: AdminNotificationsSummary;
  totalCount: number;
  loadNotifications: () => Promise<void>;
  lastViewedPages: Record<string, string>;
  markPageAsViewed: (page: string) => void;
}

const AdminNotificationsContext = createContext<AdminNotificationsContextType | undefined>(undefined);

export const useAdminNotifications = () => {
  const context = useContext(AdminNotificationsContext);
  if (!context) {
    throw new Error('useAdminNotifications must be used within AdminNotificationsProvider');
  }
  return context;
};

interface AdminNotificationsProviderProps {
  children: ReactNode;
}

export const AdminNotificationsProvider: React.FC<AdminNotificationsProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<AdminNotificationsSummary>({
    newUsers: 0,
    pendingPayments: 0,
    pendingCommissions: 0,
    expiringSoon: 0
  });

  const [lastViewedPages, setLastViewedPages] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('admin_last_viewed_pages');
    return saved ? JSON.parse(saved) : {};
  });

  const totalCount = notifications.newUsers + 
                     notifications.pendingPayments + 
                     notifications.pendingCommissions + 
                     notifications.expiringSoon;

  const markPageAsViewed = (page: string) => {
    const now = new Date().toISOString();
    const updated = { ...lastViewedPages, [page]: now };
    setLastViewedPages(updated);
    localStorage.setItem('admin_last_viewed_pages', JSON.stringify(updated));

  };

  const loadNotifications = async () => {
    try {

      // 1. المستخدمين الجدد (بعد آخر مشاهدة)
      const lastViewedUsers = lastViewedPages['users'] || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const { data: newUsersData } = await supabase
        .from('users')
        .select('id')
        .gte('created_at', lastViewedUsers);
      
      // 2. المدفوعات المعلقة
      const { data: pendingPaymentsData } = await supabase
        .from('payments')
        .select('id')
        .in('status', ['pending', 'pending_review', 'crypto_pending', 'reviewing']);
      
      // 3. العمولات المعلقة
      const { data: pendingCommissionsData } = await supabase
        .from('pending_commissions')
        .select('id')
        .eq('status', 'pending');
      
      // 4. الاشتراكات التي ستنتهي خلال 7 أيام
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      
      const { data: expiringSubscriptions } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('status', 'active')
        .lte('end_date', sevenDaysFromNow.toISOString());
      
      setNotifications({
        newUsers: newUsersData?.length || 0,
        pendingPayments: pendingPaymentsData?.length || 0,
        pendingCommissions: pendingCommissionsData?.length || 0,
        expiringSoon: expiringSubscriptions?.length || 0
      });

    } catch (error) {

    }
  };

  // تحميل عند البداية
  useEffect(() => {
    loadNotifications();
    
    // تحديث كل دقيقة
    const interval = setInterval(loadNotifications, 60000);
    
    return () => clearInterval(interval);
  }, [lastViewedPages]);

  // Realtime subscriptions
  useEffect(() => {
    const usersChannel = supabase
      .channel('admin-notif-users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, loadNotifications)
      .subscribe();

    const paymentsChannel = supabase
      .channel('admin-notif-payments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, loadNotifications)
      .subscribe();

    const commissionsChannel = supabase
      .channel('admin-notif-commissions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pending_commissions' }, loadNotifications)
      .subscribe();

    const subscriptionsChannel = supabase
      .channel('admin-notif-subscriptions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subscriptions' }, loadNotifications)
      .subscribe();

    return () => {
      supabase.removeChannel(usersChannel);
      supabase.removeChannel(paymentsChannel);
      supabase.removeChannel(commissionsChannel);
      supabase.removeChannel(subscriptionsChannel);
    };
  }, []);

  return (
    <AdminNotificationsContext.Provider value={{
      notifications,
      totalCount,
      loadNotifications,
      lastViewedPages,
      markPageAsViewed
    }}>
      {children}
    </AdminNotificationsContext.Provider>
  );
};
