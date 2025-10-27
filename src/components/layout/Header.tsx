import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Activity, Database, LogOut, User, Server, Menu, Settings, Globe, TrendingUp } from 'lucide-react';
import { IQOptionStatus } from '../IQOptionStatus';
// تم حذف marketDataService - البيانات من IQ Option مباشرة
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { LanguageSelector } from '../ui/LanguageSelector';
import { cn, designSystem } from '../../styles/designSystem';
import { User as AuthUser } from '../../services/simpleAuthService';
import { useLanguage, Language } from '../../contexts/LanguageContext';

interface HeaderProps {
  isConnected: boolean;
  onToggleBot: () => void;
  onOpenDataSource?: () => void;
  onOpenRealDataPanel?: () => void;
  onOpenApiStatus?: () => void;
  user?: AuthUser | null;
  onLogout?: () => void;
  onOpenSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  isConnected, 
  onToggleBot, 
  onOpenDataSource, 
  onOpenRealDataPanel,
  onOpenApiStatus,
  user,
  onLogout,
  onOpenSettings
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showIQStatus, setShowIQStatus] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // تتبع حجم الشاشة
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // تتبع تغيير حالة showIQStatus
  useEffect(() => {
    console.log('🔄 حالة showIQStatus تغيرت إلى:', showIQStatus);
    console.log('🔍 فحص شرط النافذة - showIQStatus:', showIQStatus);
    if (showIQStatus) {
      console.log('🟢 النافذة يجب أن تظهر الآن!');
      console.log('🎯 محتوى النافذة يُرندر الآن');
    }
  }, [showIQStatus]);
  
  // استخدام السياقات
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date());
    };

    updateTime();
    const timeInterval = setInterval(updateTime, 5000);

    return () => {
      clearInterval(timeInterval);
    };
  }, []);

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isMobileMenuOpen) {
          setIsMobileMenuOpen(false);
        }
        if (showIQStatus) {
          setShowIQStatus(false);
        }
      }
    };

    if (isMobileMenuOpen || showIQStatus) {
      document.addEventListener('keydown', handleEscapeKey);
      if (isMobileMenuOpen) {
        document.body.style.overflow = 'hidden';
      }
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen, showIQStatus]);


  return (
    <>
      {/* إضافة CSS للأنيميشن */}
      <style>{`
        @keyframes slideInFromRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
      
      <header className={cn(
        designSystem.colors.background.secondary,
        'border-b border-slate-800/50 shadow-2xl relative'
      )}
      style={{ zIndex: 50, direction: 'rtl' }}>
      {/* خلفية متدرجة */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-cyan-600/5" />
      {/* طبقة توسيط اللوغو على كامل شريط الهيدر (ديسكتوب فقط) */}
      <div className="hidden md:block absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="relative group">
            {/* خلفية متحركة مع Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-cyan-500/30 rounded-2xl blur-2xl opacity-60 group-hover:opacity-100 transition-all duration-700 animate-pulse" />
            
            {/* حاوية اللوغو مع حدود مضيئة */}
            <div className="relative h-12 sm:h-14 lg:h-16 w-auto flex-shrink-0 p-1 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 shadow-2xl">
              <img 
                src="/images/logo.png" 
                alt="Bot Trading Logo" 
                loading="eager"
                decoding="sync"
                className="h-full w-auto object-contain drop-shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
                style={{ minWidth: '48px', minHeight: '48px' }}
              />
            </div>
          </div>
        </div>
      </div>
      
      
      <div className="relative w-full px-2 sm:px-4 lg:px-8" style={{ zIndex: 10 }}>
        {/* تخطيط للهواتف - حديث واحترافي */}
        <div className="md:hidden relative h-16 px-2" style={{ zIndex: 20 }}>
          {/* اللوغو الحديث - متوسط مع تأثيرات متقدمة */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 10 }}>
            <div className="relative group">
              {/* خلفية متحركة مع Glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-cyan-500/30 rounded-2xl blur-2xl opacity-60 group-hover:opacity-100 transition-all duration-700 animate-pulse" />
              
              {/* حاوية اللوغو مع حدود مضيئة */}
              <div className="relative h-12 w-auto flex-shrink-0 p-1 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 shadow-2xl">
                <img 
                  src="/images/logo.png" 
                  alt="Bot Trading Logo" 
                  loading="eager"
                  decoding="sync"
                  className="h-full w-auto object-contain drop-shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
                  style={{ minWidth: '40px', minHeight: '40px' }}
                />
              </div>
            </div>
          </div>
          
          {/* الأزرار الحديثة - موضوعة فوق اللوغو */}
          <div className="relative flex items-center justify-between h-full" style={{ zIndex: 20 }}>
            {/* زر IQ Option Status الحديث - على اليسار في RTL */}
            <div className="flex items-center">
              <button
                onClick={() => {
                  console.log('📈 زر IQ Option تم النقر عليه في الهاتف');
                  console.log('📊 الحالة قبل التغيير - showIQStatus:', showIQStatus, 'isMobileMenuOpen:', isMobileMenuOpen);
                  const newStatus = !showIQStatus;
                  setShowIQStatus(newStatus);
                  console.log('📊 الحالة بعد التغيير - showIQStatus:', newStatus);
                }}
                type="button"
                className="group p-2 h-10 w-10 rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 text-green-400 hover:text-green-300 transition-all duration-300 flex items-center justify-center shadow-2xl cursor-pointer backdrop-blur-sm border border-green-500/50 hover:border-green-400/70 hover:shadow-green-500/30 hover:scale-105"
                title={language === 'ar' ? 'حالة IQ Option' : language === 'fr' ? 'Statut IQ Option' : 'IQ Option Status'}
              >
                <TrendingUp className="w-6 h-6 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" />
              </button>
            </div>
            
            {/* زر القائمة - على اليمين في RTL */}
            <div className="flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="group p-2 h-10 w-10 rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 text-gray-200 hover:text-white transition-all duration-300 flex items-center justify-center backdrop-blur-sm border border-slate-700/50 hover:border-slate-600/70 shadow-lg hover:shadow-xl hover:shadow-slate-500/20 hover:scale-105"
                type="button"
              >
                <Menu className="w-6 h-6 transition-transform duration-300 group-hover:rotate-90" />
              </button>
            </div>
          </div>
        </div>

        {/* القائمة المنسدلة للهواتف */}
        {isMobileMenuOpen && (
          <>
            {/* خلفية شفافة مع تأثير Blur */}
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in duration-300"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            
            {/* القائمة الحديثة */}
            <div className="absolute top-full left-0 right-0 bg-gradient-to-b from-gray-900 to-gray-800 border-t border-gray-700/50 shadow-2xl z-50 animate-in slide-in-from-top-4 duration-300">
              <div className="p-5 space-y-4">
                {/* معلومات المستخدم */}
                {user && (
                  <div className="flex items-center gap-3 pb-4 border-b border-gray-700/50 bg-gradient-to-r from-blue-600/10 to-purple-600/10 -mx-5 px-5 py-3">
                    <div className="relative">
                      <div className="absolute inset-0 bg-blue-500 rounded-full blur-md opacity-50"></div>
                      <User className="relative w-10 h-10 text-white bg-gradient-to-br from-blue-500 to-blue-600 rounded-full p-2 shadow-lg" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-base">{user.username}</p>
                      <p className="text-blue-300 text-xs font-medium">
                        {user.role === 'admin' ? t('user.admin') : t('user.trader')}
                      </p>
                    </div>
                  </div>
                )}

                {/* خيارات القائمة */}
                <div className="space-y-2.5">
                  {/* زر الإعدادات */}
                  {onOpenSettings && (
                    <button
                      onClick={() => {
                        if (onOpenSettings) {
                          onOpenSettings();
                        }
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 p-3.5 text-gray-300 hover:text-white bg-gray-800/50 hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-purple-600/20 rounded-xl transition-all duration-300 border border-gray-700/50 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20"
                    >
                      <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                      <span className="text-sm font-medium">{t('header.settings')}</span>
                    </button>
                  )}

                  {/* زر اللغة */}
                  <div className="relative group">
                    <button className="w-full flex items-center gap-3 p-3.5 text-gray-300 hover:text-white bg-gray-800/50 hover:bg-gradient-to-r hover:from-green-600/20 hover:to-emerald-600/20 rounded-xl transition-all duration-300 border border-gray-700/50 hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/20">
                      <Globe className="w-5 h-5" />
                      <span className="text-sm font-medium">{t('header.language')}</span>
                      <span className="text-xs bg-gradient-to-r from-green-600 to-emerald-600 text-white px-2.5 py-1 rounded-full uppercase ml-auto font-bold shadow-lg">
                        {language.slice(0, 2)}
                      </span>
                    </button>
                    
                    {/* قائمة اللغات الفرعية - في صف واحد */}
                    <div className="mt-2 ml-8 flex gap-2 p-2 bg-gray-900/50 rounded-lg border border-gray-700/30">
                      {(['ar', 'en', 'fr'] as Language[]).map((lang) => (
                        <button
                          key={lang}
                          onClick={() => {
                            setLanguage(lang);
                            setIsMobileMenuOpen(false);
                          }}
                          className={cn(
                            'flex-1 text-center px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-300',
                            language === lang 
                              ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/30 scale-105' 
                              : 'text-gray-400 hover:bg-gray-700 hover:text-white hover:scale-105'
                          )}
                        >
                          {t(`lang.${lang === 'ar' ? 'arabic' : lang === 'en' ? 'english' : 'french'}`)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* زر الخروج */}
                  {onLogout && (
                    <button
                      onClick={() => {
                        onLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 p-3.5 text-red-400 hover:text-white bg-gray-800/50 hover:bg-gradient-to-r hover:from-red-600/30 hover:to-red-700/30 rounded-xl transition-all duration-300 border border-gray-700/50 hover:border-red-500/50 hover:shadow-lg hover:shadow-red-500/30"
                    >
                      <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                      <span className="text-sm font-medium">{t('header.logout')}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* تخطيط للشاشات الكبيرة - المحتوى فقط (اللوغو متمركز بطبقة عليا) */}
        <div className="hidden md:block relative h-16 sm:h-20">
          <div className="relative flex items-center justify-between h-full px-4">
            {/* الجانب الأيسر - معلومات الحالة */}
            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0 max-w-[40%]">
              <Badge 
                variant={isConnected ? 'success' : 'error'}
                size="sm"
                glow={isConnected}
                pulse={isConnected}
                className="text-xs"
              >
                {isConnected ? t('bot.running') : t('bot.stopped')}
              </Badge>
              
              <div className="hidden sm:block text-xs text-slate-400 font-mono">
                {currentTime.toLocaleTimeString(language === 'fr' ? 'fr-FR' : 'en-US', { 
                  hour12: false,
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </div>

              {/* زر حالة IQ Option */}
              <div className="relative" title={language === 'ar' ? 'حالة IQ Option' : language === 'fr' ? 'Statut IQ Option' : 'IQ Option Status'}>
                <Button
                  onClick={() => setShowIQStatus(!showIQStatus)}
                  variant="glass"
                  size="sm"
                  icon={<TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />}
                  iconOnly={true}
                  className="text-green-400 hover:text-green-300 p-1 sm:p-2"
                />
                
                {/* النافذة المنسدلة للكمبيوتر فقط */}
                {showIQStatus && !isMobile && (
                  <>
                    {/* خلفية شفافة للإغلاق */}
                    <div 
                      className="fixed inset-0 z-40"
                      onClick={() => setShowIQStatus(false)}
                    />
                    
                    {/* محتوى النافذة */}
                    <div className="absolute top-full right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] z-50 animate-in slide-in-from-top-2 duration-200">
                      <IQOptionStatus />
                    </div>
                  </>
                )}
              </div>
              
            </div>

            {/* الجانب الأيمن - الأزرار */}
            <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 flex-1 justify-end min-w-0 max-w-[40%]">
            {/* عرض الأزرار للشاشات الكبيرة */}
            <div className="hidden md:flex items-center gap-1 sm:gap-2 lg:gap-3">
              {/* زر التشغيل/الإيقاف الرئيسي */}
              <Button
                onClick={onToggleBot}
                variant={isConnected ? 'danger' : 'success'}
                size="sm"
                className="shadow-xl text-xs sm:text-sm"
              >
                {isConnected ? t('header.stopBot') : t('header.startBot')}
              </Button>

              {/* أزرار الإعدادات والتحكم */}
              <div className="flex items-center gap-1 sm:gap-2">
                {/* زر إدارة مصادر البيانات - للأدمن فقط */}
                {user?.role === 'admin' && onOpenDataSource && (
                  <Button
                    onClick={onOpenDataSource}
                    variant="ghost"
                    size="sm"
                    icon={<Database className="w-3 h-3 sm:w-4 sm:h-4" />}
                    iconOnly={true}
                    className="hover:bg-slate-800/60 p-1 sm:p-2"
                  />
                )}

                {/* زر البيانات الحقيقية - للأدمن فقط */}
                {user?.role === 'admin' && onOpenRealDataPanel && (
                  <Button
                    onClick={onOpenRealDataPanel}
                    variant="glass"
                    size="sm"
                    icon={<Activity className="w-3 h-3 sm:w-4 sm:h-4" />}
                    iconOnly={true}
                    className="text-blue-400 hover:text-blue-300 p-1 sm:p-2"
                  />
                )}

                {/* زر حالة APIs - للأدمن فقط */}
                {user?.role === 'admin' && onOpenApiStatus && (
                  <div title={t('header.apiStatus')}>
                    <Button
                      onClick={onOpenApiStatus}
                      variant="glass"
                      size="sm"
                      icon={<Server className="w-3 h-3 sm:w-4 sm:h-4" />}
                      iconOnly={true}
                      className="text-purple-400 hover:text-purple-300 p-1 sm:p-2"
                    />
                  </div>
                )}

                {/* زر الإعدادات */}
                {onOpenSettings && (
                  <div title="الإعدادات">
                    <Button
                      onClick={onOpenSettings}
                      variant="ghost"
                      size="sm"
                      icon={<Settings className="w-3 h-3 sm:w-4 sm:h-4" />}
                      iconOnly={true}
                      className="text-gray-400 hover:text-white p-1 sm:p-2"
                    />
                  </div>
                )}

                {/* زر تغيير اللغة */}
                <LanguageSelector variant="default" />


                {/* معلومات المستخدم وتسجيل الخروج */}
                {user && (
                  <>
                    <div className="hidden lg:flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
                      <User className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
                      <div className="text-xs sm:text-sm">
                        <div className="text-white font-medium">{user.username}</div>
                        <div className="text-xs text-slate-400">{user.role === 'admin' ? t('admin.role.admin') : t('admin.role.trader')}</div>
                      </div>
                    </div>

                    {onLogout && (
                      <Button
                        onClick={() => {
                          if (onLogout) {
                            onLogout();
                          }
                        }}
                        variant="danger"
                        size="sm"
                        icon={<LogOut className="w-3 h-3 sm:w-4 sm:h-4" />}
                        iconOnly={true}
                        className="hover:bg-red-600/80 p-1 sm:p-2"
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* القائمة المنسدلة للهواتف */}
        {isMobileMenuOpen && (
                  <>
                    {/* خلفية شفافة للإغلاق */}
                    <div 
                      className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
                      style={{ zIndex: 999998 }}
                      onClick={() => setIsMobileMenuOpen(false)}
                      onTouchStart={() => setIsMobileMenuOpen(false)}
                    />
                    
                    {/* محتوى القائمة */}
                    <div 
                      className={cn(
                        "fixed top-16 w-56 rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2 duration-200",
                        'right-2'
                      )}
                      style={{ 
                        backgroundColor: 'rgb(15 23 42)', 
                        border: '3px solid rgb(59 130 246)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9), 0 0 30px rgba(59, 130, 246, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(16px)',
                        zIndex: 999999,
                        transform: 'translateY(0)',
                        opacity: 1
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                    >
                    <div className="p-3 space-y-2">
                      {/* معلومات المستخدم */}
                      {user && (
                        <div className="flex items-center gap-3 p-4 bg-slate-800 rounded-lg border border-slate-600" 
                             style={{ backgroundColor: 'rgb(30 41 59)', borderColor: 'rgb(71 85 105)' }}>
                          <User className="w-5 h-5 text-blue-400" />
                          <div className="flex-1 min-w-0">
                            <div className="text-white font-bold text-sm truncate">{user.username}</div>
                            <div className="text-xs text-slate-300">{user.role === 'admin' ? t('admin.badge.adminFull') : t('admin.role.trader')}</div>
                          </div>
                        </div>
                      )}



                      {/* إدارة البيانات */}
                      {onOpenDataSource && (
                        <button
                          onClick={() => {
                            onOpenDataSource();
                            setIsMobileMenuOpen(false);
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 p-4 rounded-lg text-slate-200 hover:bg-slate-700 hover:text-white transition-all duration-200 font-medium",
                            'text-right'
                          )}
                          style={{ backgroundColor: 'rgba(51, 65, 85, 0.3)' }}
                        >
                          <Database className="w-5 h-5 text-gray-400" />
                          <span className="text-sm">{t('header.dataManagement')}</span>
                        </button>
                      )}

                      {/* البيانات الحقيقية */}
                      {onOpenRealDataPanel && (
                        <button
                          onClick={() => {
                            onOpenRealDataPanel();
                            setIsMobileMenuOpen(false);
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 p-4 rounded-lg text-blue-300 hover:bg-blue-900/30 hover:text-blue-200 transition-all duration-200 font-medium",
                            'text-right'
                          )}
                          style={{ backgroundColor: 'rgba(30, 58, 138, 0.1)' }}
                        >
                          <Activity className="w-5 h-5 text-blue-400" />
                          <span className="text-sm">{t('header.realData')}</span>
                        </button>
                      )}

                      {/* حالة APIs - للأدمن فقط */}
                      {user?.role === 'admin' && onOpenApiStatus && (
                        <button
                          onClick={() => {
                            onOpenApiStatus();
                            setIsMobileMenuOpen(false);
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 p-4 rounded-lg text-purple-300 hover:bg-purple-900/30 hover:text-purple-200 transition-all duration-200 font-medium",
                            'text-right'
                          )}
                          style={{ backgroundColor: 'rgba(88, 28, 135, 0.1)' }}
                        >
                          <Server className="w-5 h-5 text-purple-400" />
                          <span className="text-sm">{t('header.apiStatus')}</span>
                        </button>
                      )}

                      {/* حالة IQ Option */}
                      <button
                        onClick={() => {
                          setShowIQStatus(!showIQStatus);
                          setIsMobileMenuOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 p-4 rounded-lg text-green-300 hover:bg-green-900/30 hover:text-green-200 transition-all duration-200 font-medium",
                          'text-right'
                        )}
                        style={{ backgroundColor: 'rgba(22, 101, 52, 0.1)' }}
                      >
                        <TrendingUp className="w-5 h-5 text-green-400" />
                        <span className="text-sm">{language === 'ar' ? 'حالة IQ Option' : language === 'fr' ? 'Statut IQ Option' : 'IQ Option Status'}</span>
                      </button>

                      {/* اللغة */}
                      <div className="space-y-3">
                        <div className="text-xs text-slate-400 font-medium px-2">{t('header.language')}</div>
                        <div className="px-2">
                          <LanguageSelector 
                            variant="mobile" 
                            onLanguageChange={() => setIsMobileMenuOpen(false)}
                          />
                        </div>
                      </div>

                      {/* خط فاصل */}
                      {user && onLogout && (
                        <div className="border-t border-slate-600 my-3" style={{ borderColor: 'rgb(71 85 105)' }} />
                      )}

                      {/* تسجيل الخروج */}
                      {user && onLogout && (
                        <button
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            if (onLogout) {
                              onLogout();
                            }
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 p-4 rounded-lg text-red-300 hover:bg-red-900/30 hover:text-red-200 transition-all duration-200 font-bold",
                            'text-right'
                          )}
                          style={{ backgroundColor: 'rgba(127, 29, 29, 0.1)' }}
                        >
                          <LogOut className="w-5 h-5 text-red-400" />
                          <span className={cn("flex-1", 'text-right')}>{t('header.logout')}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}

        {/* نافذة IQ Option المنسدلة للهواتف فقط - باستخدام Portal */}
        {showIQStatus && isMobile && createPortal(
          <div 
            className="fixed inset-0 flex items-start justify-end p-4"
            style={{ 
              zIndex: 999999,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              paddingTop: '80px' // مسافة من الهيدر
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                console.log('🔴 إغلاق النافذة من الخلفية');
                setShowIQStatus(false);
              }
            }}
          >
            <div 
              style={{ 
                width: '100%',
                maxWidth: '400px',
                maxHeight: '80vh',
                overflow: 'auto',
                animation: 'slideInFromRight 0.3s ease-out'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <IQOptionStatus />
            </div>
          </div>,
          document.body
        )}
        </div>
      </div>
    </header>
    </>
  );
};