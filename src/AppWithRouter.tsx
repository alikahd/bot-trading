import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import App from './App';

// مكون لمزامنة الـ URL مع حالة التطبيق
function AppRouterSync() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // الاستماع لأحداث التنقل من التطبيق
    const handleNavigation = (event: CustomEvent) => {
      const { path } = event.detail;
      if (path && path !== location.pathname) {
        navigate(path, { replace: false });
      }
    };

    window.addEventListener('app-navigate' as any, handleNavigation);
    return () => window.removeEventListener('app-navigate' as any, handleNavigation);
  }, [navigate, location]);

  // حفظ المسار الحالي في window لاستخدامه في App
  useEffect(() => {
    (window as any).currentPath = location.pathname;
  }, [location.pathname]);

  return <App />;
}

export function AppWithRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<AppRouterSync />} />
      </Routes>
    </BrowserRouter>
  );
}
