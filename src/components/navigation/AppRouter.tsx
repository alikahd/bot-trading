import React, { useState } from 'react';
import { TermsPage } from '../../pages/TermsPage';
import { ContactPage } from '../../pages/ContactPage';
import { AboutPage } from '../../pages/AboutPage';

export type PageType = 'main' | 'terms' | 'contact' | 'about';

interface AppRouterProps {
  currentPage: PageType;
  onNavigate: (page: PageType) => void;
  children: React.ReactNode;
  onNavigateToLogin?: () => void;
  onNavigateToRegister?: () => void;
  // إضافة معاملات حالة المستخدم
  isAuthenticated?: boolean;
  user?: any;
  onLogout?: () => void;
}

export const AppRouter: React.FC<AppRouterProps> = ({ 
  currentPage, 
  onNavigate, 
  children,
  onNavigateToLogin,
  onNavigateToRegister,
  isAuthenticated,
  user,
  onLogout
}) => {
  const handleBackToMain = () => {
    onNavigate('main');
  };

  // دوال محسنة للعودة للصفحة الرئيسية ثم فتح صفحات التسجيل
  const handleLoginFromSubPage = () => {

    onNavigate('main');
    // تأخير بسيط للتأكد من تحديث الصفحة
    setTimeout(() => {
      onNavigateToLogin && onNavigateToLogin();
    }, 100);
  };

  const handleRegisterFromSubPage = () => {

    onNavigate('main');
    // تأخير بسيط للتأكد من تحديث الصفحة
    setTimeout(() => {
      onNavigateToRegister && onNavigateToRegister();
    }, 100);
  };

  switch (currentPage) {
    case 'terms':
      return <TermsPage 
        onBack={handleBackToMain} 
        onNavigateToLogin={handleLoginFromSubPage} 
        onNavigateToRegister={handleRegisterFromSubPage}
        isAuthenticated={isAuthenticated}
        user={user}
        onLogout={onLogout}
      />;
    
    case 'contact':
      return <ContactPage 
        onBack={handleBackToMain} 
        onNavigateToLogin={handleLoginFromSubPage} 
        onNavigateToRegister={handleRegisterFromSubPage}
        isAuthenticated={isAuthenticated}
        user={user}
        onLogout={onLogout}
      />;
    
    case 'about':
      return <AboutPage 
        onBack={handleBackToMain} 
        onNavigateToLogin={handleLoginFromSubPage} 
        onNavigateToRegister={handleRegisterFromSubPage}
        isAuthenticated={isAuthenticated}
        user={user}
        onLogout={onLogout}
      />;
    
    case 'main':
    default:
      return <>{children}</>;
  }
};

// Hook مخصص لإدارة التوجيه مع دعم URL
export const useRouter = () => {
  // الحصول على الصفحة الحالية من URL
  const getInitialPage = (): PageType => {
    const path = window.location.pathname.replace(/^\//, '');
    if (path === 'terms' || path === 'contact' || path === 'about') {
      return path as PageType;
    }
    return 'main';
  };

  const [currentPage, setCurrentPage] = useState<PageType>(getInitialPage());

  const navigate = (page: PageType) => {
    setCurrentPage(page);
    
    // تحديث URL في المتصفح
    const url = page === 'main' ? '/' : `/${page}`;
    window.history.pushState({}, '', url);
    
    // إرسال حدث للـ Router
    window.dispatchEvent(new CustomEvent('app-navigate', { 
      detail: { path: url } 
    }));
  };

  // الاستماع لزر الرجوع في المتصفح
  React.useEffect(() => {
    const handlePopState = () => {
      const newPage = getInitialPage();
      setCurrentPage(newPage);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return {
    currentPage,
    navigate
  };
};
