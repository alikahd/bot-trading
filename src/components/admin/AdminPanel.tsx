import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  UserPlus, 
  Edit3, 
  Trash2, 
  Shield, 
  Search,
  Activity,
  Crown,
  CreditCard,
  DollarSign,
  Calendar,
  TrendingUp,
  Settings,
  BarChart3,
  PieChart,
  Menu,
  Smartphone,
  Monitor
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { cn } from '../../styles/designSystem';
import { User, useSimpleAuth } from '../../services/simpleAuthService';
import { SubscriptionManagement } from './SubscriptionManagement';
import { PaymentManagement } from './PaymentManagement';
import { subscriptionService } from '../../services/subscriptionService';

interface AdminPanelProps {
  currentUser: User;
}

type TabType = 'dashboard' | 'users' | 'subscriptions' | 'payments' | 'settings';

export const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser }) => {
  const { getAllUsers, createUser: authCreateUser, updateUser: authUpdateUser, deleteUser: authDeleteUser } = useSimpleAuth();
  
  // الحالات الأساسية
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'trader'>('all');
  const loadingRef = useRef(false);
  
  // حالات النماذج
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    username: '',
    full_name: '',
    country: '',
    role: 'trader' as 'admin' | 'trader'
  });
  
  // حالات التحميل
  const [createLoading, setCreateLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // إحصائيات لوحة التحكم
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    admins: 0,
    traders: 0,
    totalRevenue: 0,
    activeSubscriptions: 0,
    pendingPayments: 0
  });

  // تحميل البيانات
  useEffect(() => {
    loadDashboardData();
  }, []);

  const withTimeout = async <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
      const id = setTimeout(() => {
        console.warn(`⏰ ${label} timed out after ${ms}ms`);
        reject(new Error('timeout'));
      }, ms);
      promise.then(
        (val) => { clearTimeout(id); resolve(val); },
        (err) => { clearTimeout(id); reject(err); }
      );
    });
  };

  const loadDashboardData = async () => {
    try {
      if (loadingRef.current) {
        console.log('⏳ تجاهل تحميل متزامن للوحة التحكم');
        return;
      }
      loadingRef.current = true;
      console.log('🔄 بدء تحميل بيانات لوحة التحكم...');
      setLoading(true);
      
      // جلب البيانات بالتوازي مع حماية timeout لكل استدعاء
      console.log('📥 جلب المستخدمين...');
      console.log('📊 جلب الاشتراكات...');
      const [usersRes, subsRes] = await Promise.allSettled([
        withTimeout(getAllUsers(), 8000, 'getAllUsers'),
        withTimeout(subscriptionService.getAllSubscriptions(), 8000, 'getAllSubscriptions')
      ]);
      const usersData = usersRes.status === 'fulfilled' ? usersRes.value : [];
      const subscriptions = subsRes.status === 'fulfilled' ? subsRes.value : [];
      if (usersRes.status !== 'fulfilled') console.warn('⚠️ getAllUsers failed or timed out');
      if (subsRes.status !== 'fulfilled') console.warn('⚠️ getAllSubscriptions failed or timed out');
      
      console.log('✅ تم جلب المستخدمين:', usersData.length);
      console.log('✅ تم جلب الاشتراكات:', subscriptions.length);
      setUsers(usersData);
      
      const dashboardStats = {
        totalUsers: usersData.length,
        activeUsers: usersData.filter(u => u.is_active).length,
        admins: usersData.filter(u => u.role === 'admin').length,
        traders: usersData.filter(u => u.role === 'trader').length,
        totalRevenue: subscriptions.reduce((sum: number, sub: any) => sum + (sub.subscription_plans?.price || 0), 0),
        activeSubscriptions: subscriptions.filter((sub: any) => sub.status === 'active').length,
        pendingPayments: subscriptions.filter((sub: any) => sub.status === 'pending').length
      };
      
      console.log('📈 الإحصائيات:', dashboardStats);
      setStats(dashboardStats);
      console.log('✅ تم تحميل لوحة التحكم بنجاح');
    } catch (error) {
      console.error('❌ خطأ في تحميل لوحة التحكم:', error);
      // تعيين إحصائيات افتراضية في حالة الخطأ
      setStats({
        totalUsers: 0,
        activeUsers: 0,
        admins: 0,
        traders: 0,
        totalRevenue: 0,
        activeSubscriptions: 0,
        pendingPayments: 0
      });
    } finally {
      console.log('🏁 انتهى تحميل لوحة التحكم');
      setLoading(false);
      loadingRef.current = false;
    }
  };

  // تصفية المستخدمين
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    
    return matchesSearch && matchesRole;
  });

  // قائمة التبويبات
  const tabs = [
    { id: 'dashboard', label: 'لوحة المعلومات', icon: BarChart3 },
    { id: 'users', label: 'إدارة المستخدمين', icon: Users },
    { id: 'subscriptions', label: 'إدارة الاشتراكات', icon: CreditCard },
    { id: 'payments', label: 'إدارة المدفوعات', icon: DollarSign },
    { id: 'settings', label: 'الإعدادات', icon: Settings }
  ];

  // بطاقات الإحصائيات
  const StatCard = ({ title, value, icon: Icon, color, trend }: {
    title: string;
    value: number;
    icon: any;
    color: 'blue' | 'green' | 'purple' | 'orange';
    trend?: number;
  }) => (
    <Card className="p-3 sm:p-4 lg:p-6 hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 hover:scale-105">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 sm:mb-2 truncate">
            {title}
          </p>
          <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {value.toLocaleString()}
          </p>
          {trend && (
            <p className={cn(
              "text-xs flex items-center gap-1 font-medium",
              trend > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            )}>
              <TrendingUp className={cn(
                "w-3 h-3",
                trend < 0 && "rotate-180"
              )} />
              <span className="hidden sm:inline">{trend > 0 ? '+' : ''}{trend}% من الشهر الماضي</span>
              <span className="sm:hidden">{trend > 0 ? '+' : ''}{trend}%</span>
            </p>
          )}
        </div>
        <div className={cn(
          "p-2 sm:p-3 rounded-xl shadow-lg flex-shrink-0",
          color === 'blue' && "bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600 dark:from-blue-900/30 dark:to-blue-800/30 dark:text-blue-400",
          color === 'green' && "bg-gradient-to-br from-green-100 to-green-200 text-green-600 dark:from-green-900/30 dark:to-green-800/30 dark:text-green-400",
          color === 'purple' && "bg-gradient-to-br from-purple-100 to-purple-200 text-purple-600 dark:from-purple-900/30 dark:to-purple-800/30 dark:text-purple-400",
          color === 'orange' && "bg-gradient-to-br from-orange-100 to-orange-200 text-orange-600 dark:from-orange-900/30 dark:to-orange-800/30 dark:text-orange-400"
        )}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
        </div>
      </div>
    </Card>
  );


  // محتوى لوحة المعلومات
  const DashboardContent = () => (
    <div className="space-y-4 sm:space-y-6">
      {/* الإحصائيات الرئيسية */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <StatCard
          title="إجمالي المستخدمين"
          value={stats.totalUsers}
          icon={Users}
          color="blue"
          trend={12}
        />
        <StatCard
          title="المستخدمين النشطين"
          value={stats.activeUsers}
          icon={Activity}
          color="green"
          trend={8}
        />
        <StatCard
          title="الاشتراكات النشطة"
          value={stats.activeSubscriptions}
          icon={CreditCard}
          color="purple"
          trend={15}
        />
        <StatCard
          title="إجمالي الإيرادات"
          value={stats.totalRevenue}
          icon={DollarSign}
          color="orange"
          trend={22}
        />
      </div>

      {/* الرسوم البيانية والتحليلات */}
      <div className="grid grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-6">
        <Card className="p-3 sm:p-4 lg:p-6">
          <h3 className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
            <PieChart className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            <span className="hidden sm:inline">توزيع المستخدمين</span>
            <span className="sm:hidden">التوزيع</span>
          </h3>
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">المتداولين</span>
              <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{stats.traders}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">المديرين</span>
              <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{stats.admins}</span>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 lg:p-6">
          <h3 className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            <span className="hidden sm:inline">الأنشطة الحديثة</span>
            <span className="sm:hidden">الأنشطة</span>
          </h3>
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                <span className="hidden sm:inline">تم تسجيل مستخدم جديد</span>
                <span className="sm:hidden">مستخدم جديد</span>
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                <span className="hidden sm:inline">تم تفعيل اشتراك جديد</span>
                <span className="sm:hidden">اشتراك جديد</span>
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0"></div>
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                <span className="hidden sm:inline">دفعة في انتظار المراجعة</span>
                <span className="sm:hidden">دفعة معلقة</span>
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* معلومات سريعة */}
      <div className="grid grid-cols-3 lg:grid-cols-3 gap-2 sm:gap-4">
        <Card className="p-2 sm:p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
          <div className="flex items-center gap-1 sm:gap-3">
            <Smartphone className="w-4 h-4 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-blue-900 dark:text-blue-100 truncate">
                <span className="hidden sm:inline">مستخدمي الهاتف</span>
                <span className="sm:hidden">الهاتف</span>
              </p>
              <p className="text-xs sm:text-lg font-bold text-blue-700 dark:text-blue-300">
                {Math.round(stats.totalUsers * 0.7)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-2 sm:p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
          <div className="flex items-center gap-1 sm:gap-3">
            <Monitor className="w-4 h-4 sm:w-8 sm:h-8 text-green-600 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-green-900 dark:text-green-100 truncate">
                <span className="hidden sm:inline">مستخدمي الكمبيوتر</span>
                <span className="sm:hidden">الكمبيوتر</span>
              </p>
              <p className="text-xs sm:text-lg font-bold text-green-700 dark:text-green-300">
                {Math.round(stats.totalUsers * 0.3)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-2 sm:p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
          <div className="flex items-center gap-1 sm:gap-3">
            <Calendar className="w-4 h-4 sm:w-8 sm:h-8 text-purple-600 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-purple-900 dark:text-purple-100 truncate">
                <span className="hidden sm:inline">هذا الشهر</span>
                <span className="sm:hidden">الشهر</span>
              </p>
              <p className="text-xs sm:text-lg font-bold text-purple-700 dark:text-purple-300">
                {stats.activeSubscriptions} <span className="hidden sm:inline">اشتراك</span>
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );

  // محتوى إدارة المستخدمين
  const UsersContent = () => (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
      {/* شريط البحث والفلاتر */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* البحث والتصفية في صف واحد للهواتف */}
          <div className="flex gap-2 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="البحث عن مستخدم..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 sm:py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as any)}
              className="px-2 sm:px-4 py-2 sm:py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-w-[100px] sm:min-w-[120px]"
            >
              <option value="all">جميع الأدوار</option>
              <option value="admin">المديرين</option>
              <option value="trader">المتداولين</option>
            </select>
          </div>
          
          {/* الأزرار في صف واحد للهواتف */}
          <div className="flex gap-2 sm:gap-3">
            <Button
              onClick={exportUsers}
              variant="ghost"
              size="sm"
              className="flex items-center justify-center gap-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 py-2 flex-1"
            >
              📊 <span className="hidden sm:inline">تصدير البيانات</span><span className="sm:hidden">تصدير</span>
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 text-xs sm:text-sm shadow-lg py-2 flex-1"
            >
              <UserPlus className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">إضافة مستخدم</span><span className="sm:hidden">إضافة</span>
            </Button>
          </div>
        </div>
      </div>

      {/* قائمة المستخدمين */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredUsers.map((user) => (
          <Card key={user.id} className="p-4 hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl">
            {/* معلومات المستخدم */}
            <div className="flex items-center gap-3 mb-3">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg",
                user.role === 'admin' 
                  ? "bg-gradient-to-br from-red-500 to-red-600" 
                  : "bg-gradient-to-br from-blue-500 to-blue-600"
              )}>
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white text-base">
                  {user.username}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user.email}
                </p>
              </div>
            </div>

            {/* الأزرار في صف واحد */}
            <div className="flex gap-1 mb-3 w-full">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditUser(user)}
                className="px-2 py-1 text-xs hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors flex items-center justify-center gap-1 flex-1 min-w-0"
              >
                <Edit3 className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                <span className="hidden sm:inline">تعديل</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleUserStatus(user.id, user.is_active)}
                className="px-2 py-1 text-xs hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors flex items-center justify-center gap-1 flex-1 min-w-0"
              >
                {user.is_active ? "⏸️" : "▶️"}
                <span className="hidden sm:inline">{user.is_active ? "إيقاف" : "تفعيل"}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => resetUserPassword(user.id, user.username)}
                className="px-2 py-1 text-xs hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded transition-colors flex items-center justify-center gap-1 flex-1 min-w-0"
              >
                🔑
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteUser(user.id)}
                disabled={deleteLoading}
                className="px-2 py-1 text-xs hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors disabled:opacity-50 flex items-center justify-center gap-1 flex-1 min-w-0"
              >
                {deleteLoading ? (
                  <div className="w-3 h-3 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                ) : (
                  <Trash2 className="w-3 h-3 text-red-600 dark:text-red-400" />
                )}
              </Button>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 dark:text-gray-400">الدور:</span>
                <Badge 
                  variant={user.role === 'admin' ? 'destructive' : 'info'}
                  className="text-xs px-2 py-0.5"
                >
                  {user.role === 'admin' ? '👑 مدير' : '👤 متداول'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 dark:text-gray-400">الحالة:</span>
                <Badge 
                  variant={user.is_active ? 'success' : 'secondary'}
                  className="text-xs px-2 py-0.5"
                >
                  {user.is_active ? '✅ نشط' : '⏸️ غير نشط'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 dark:text-gray-400">البريد:</span>
                <Badge 
                  variant={user.email_verified ? 'success' : 'warning'}
                  className="text-xs px-2 py-0.5"
                >
                  {user.email_verified ? '✅ مفعل' : '⚠️ غير مفعل'}
                </Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            لا توجد نتائج
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            لم يتم العثور على مستخدمين مطابقين لمعايير البحث
          </p>
        </div>
      )}
    </div>
  );

  // إنشاء مستخدم جديد
  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.username || !newUser.full_name) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      setCreateLoading(true);
      const result = await authCreateUser({
        email: newUser.email,
        username: newUser.username,
        full_name: newUser.full_name,
        country: newUser.country,
        role: newUser.role,
        is_active: true,
        email_verified: true,
        status: 'active'
      });

      if (result.success) {
        alert('تم إنشاء المستخدم بنجاح!');
        setShowCreateModal(false);
        setNewUser({
          email: '',
          password: '',
          username: '',
          full_name: '',
          country: '',
          role: 'trader'
        });
        await loadDashboardData();
      } else {
        alert(`خطأ: ${result.error}`);
      }
    } catch (error) {
      console.error('خطأ في إنشاء المستخدم:', error);
      alert('حدث خطأ أثناء إنشاء المستخدم');
    } finally {
      setCreateLoading(false);
    }
  };

  // تحديث مستخدم
  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      setUpdateLoading(true);
      const result = await authUpdateUser(editingUser.id, {
        username: editingUser.username,
        full_name: editingUser.full_name,
        country: editingUser.country,
        role: editingUser.role,
        is_active: editingUser.is_active,
        email_verified: editingUser.email_verified
      });

      if (result.success) {
        alert('تم تحديث المستخدم بنجاح!');
        setShowEditModal(false);
        setEditingUser(null);
        await loadDashboardData();
      } else {
        alert(`خطأ: ${result.error}`);
      }
    } catch (error) {
      console.error('خطأ في تحديث المستخدم:', error);
      alert('حدث خطأ أثناء تحديث المستخدم');
    } finally {
      setUpdateLoading(false);
    }
  };

  // حذف مستخدم
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟ هذا الإجراء لا يمكن التراجع عنه.')) {
      return;
    }

    try {
      setDeleteLoading(true);
      const result = await authDeleteUser(userId);
      
      if (result.success) {
        alert('تم حذف المستخدم بنجاح!');
        await loadDashboardData();
      } else {
        alert(`خطأ: ${result.error}`);
      }
    } catch (error) {
      console.error('خطأ في حذف المستخدم:', error);
      alert('حدث خطأ أثناء حذف المستخدم');
    } finally {
      setDeleteLoading(false);
    }
  };

  // فتح نموذج التعديل
  const handleEditUser = (user: User) => {
    setEditingUser({ ...user });
    setShowEditModal(true);
  };

  // إغلاق النماذج
  const closeModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setEditingUser(null);
    setNewUser({
      email: '',
      password: '',
      username: '',
      full_name: '',
      country: '',
      role: 'trader'
    });
  };

  // تصدير بيانات المستخدمين
  const exportUsers = () => {
    const csvContent = [
      ['اسم المستخدم', 'البريد الإلكتروني', 'الاسم الكامل', 'الدور', 'الحالة', 'البلد', 'تاريخ التسجيل'].join(','),
      ...users.map(user => [
        user.username,
        user.email,
        user.full_name,
        user.role === 'admin' ? 'مدير' : 'متداول',
        user.is_active ? 'نشط' : 'غير نشط',
        user.country || '',
        new Date(user.created_at).toLocaleDateString('ar-SA')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `users_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // تحديث حالة المستخدم بسرعة
  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const result = await authUpdateUser(userId, { is_active: !currentStatus });
      if (result.success) {
        await loadDashboardData();
      } else {
        alert(`خطأ: ${result.error}`);
      }
    } catch (error) {
      console.error('خطأ في تحديث حالة المستخدم:', error);
    }
  };

  // إعادة تعيين كلمة المرور
  const resetUserPassword = async (_userId: string, username: string) => {
    if (!confirm(`هل تريد إعادة تعيين كلمة المرور للمستخدم ${username}؟`)) {
      return;
    }
    
    const newPassword = prompt('أدخل كلمة المرور الجديدة:');
    if (!newPassword || newPassword.length < 6) {
      alert('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    try {
      // هذه الوظيفة تحتاج تطوير إضافي في simpleAuthService
      alert('تم إعادة تعيين كلمة المرور بنجاح! (محاكاة)');
    } catch (error) {
      console.error('خطأ في إعادة تعيين كلمة المرور:', error);
    }
  };

  // نموذج إنشاء مستخدم جديد
  const CreateUserModal = () => (
    showCreateModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              إضافة مستخدم جديد
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  البريد الإلكتروني *
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="example@email.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  كلمة المرور *
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="كلمة مرور قوية"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  اسم المستخدم *
                </label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="اسم المستخدم"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  الاسم الكامل *
                </label>
                <input
                  type="text"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="الاسم الكامل"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  البلد
                </label>
                <input
                  type="text"
                  value={newUser.country}
                  onChange={(e) => setNewUser({...newUser, country: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="البلد"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  الدور
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value as 'admin' | 'trader'})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="trader">متداول</option>
                  <option value="admin">مدير</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleCreateUser}
                disabled={createLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {createLoading ? 'جاري الإنشاء...' : 'إنشاء المستخدم'}
              </Button>
              <Button
                onClick={closeModals}
                variant="ghost"
                className="flex-1"
              >
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  );

  // نموذج تعديل المستخدم
  const EditUserModal = () => (
    showEditModal && editingUser && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              تعديل المستخدم: {editingUser.username}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  value={editingUser.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                />
                <p className="text-xs text-gray-500 mt-1">لا يمكن تعديل البريد الإلكتروني</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  اسم المستخدم
                </label>
                <input
                  type="text"
                  value={editingUser.username}
                  onChange={(e) => setEditingUser({...editingUser, username: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  الاسم الكامل
                </label>
                <input
                  type="text"
                  value={editingUser.full_name}
                  onChange={(e) => setEditingUser({...editingUser, full_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  البلد
                </label>
                <input
                  type="text"
                  value={editingUser.country || ''}
                  onChange={(e) => setEditingUser({...editingUser, country: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  الدور
                </label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({...editingUser, role: e.target.value as 'admin' | 'trader'})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="trader">متداول</option>
                  <option value="admin">مدير</option>
                </select>
              </div>
              
              <div className="flex items-center gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingUser.is_active}
                    onChange={(e) => setEditingUser({...editingUser, is_active: e.target.checked})}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">نشط</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingUser.email_verified}
                    onChange={(e) => setEditingUser({...editingUser, email_verified: e.target.checked})}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">البريد مفعل</span>
                </label>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleUpdateUser}
                disabled={updateLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {updateLoading ? 'جاري التحديث...' : 'حفظ التغييرات'}
              </Button>
              <Button
                onClick={closeModals}
                variant="ghost"
                className="flex-1"
              >
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-400">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-full">
      <div className="flex h-full">
        {/* الشريط الجانبي داخل الحاوية */}
        <div className="hidden lg:block w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-lg">
          {/* رأس الشريط الجانبي */}
          <div className="flex items-center h-16 px-4 bg-gradient-to-l from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800">
            <Shield className="w-8 h-8 text-white drop-shadow-lg" />
            <h1 className="mr-3 text-xl font-bold text-white drop-shadow-sm">لوحة التحكم</h1>
          </div>
          
          {/* قائمة التنقل */}
          <div className="flex-1 overflow-y-auto py-4">
            <nav className="px-3 space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={cn(
                      "w-full group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200",
                      activeTab === tab.id
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200 shadow-sm border border-blue-200 dark:border-blue-800"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700/50 dark:hover:text-white"
                    )}
                  >
                    <Icon className="mr-3 flex-shrink-0 h-5 w-5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
          
          {/* معلومات المستخدم */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-lg">
                  <Crown className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="mr-3">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  {currentUser.username}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  مدير النظام
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* المحتوى الرئيسي */}
        <div className="flex-1 overflow-hidden">
          {/* شريط علوي للهاتف */}
          <div className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Shield className="w-6 h-6 text-blue-600" />
                لوحة التحكم
              </h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </div>
            
            {/* قائمة الهاتف المنسدلة */}
            {isMobileMenuOpen && (
              <div className="mt-3 space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id as TabType);
                        setIsMobileMenuOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        activeTab === tab.id
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <main className="h-full overflow-y-auto">
            <div className="p-4 sm:p-6 lg:p-8">
              {/* رأس الصفحة */}
              <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                      {tabs.find(tab => tab.id === activeTab)?.label}
                    </h1>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      إدارة شاملة وتحكم متقدم في جميع جوانب النظام
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">مرحباً،</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{currentUser.username}</p>
                  </div>
                </div>
              </div>

              {/* المحتوى حسب التبويب */}
              <div className="space-y-6">
                {activeTab === 'dashboard' && <DashboardContent />}
                {activeTab === 'users' && <UsersContent />}
                {activeTab === 'subscriptions' && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <SubscriptionManagement 
                      isVisible={true}
                      onClose={() => setActiveTab('dashboard')}
                    />
                  </div>
                )}
                {activeTab === 'payments' && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <PaymentManagement currentUser={currentUser} />
                  </div>
                )}
                {activeTab === 'settings' && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                    <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      الإعدادات
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      قريباً... سيتم إضافة إعدادات النظام المتقدمة هنا
                    </p>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
      
      {/* النماذج */}
      <CreateUserModal />
      <EditUserModal />
    </div>
  );
};
