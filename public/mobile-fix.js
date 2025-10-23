// إصلاح بسيط لمشاكل الهاتف المحمول
(function() {
  'use strict';
  
  // التحقق من الجهاز المحمول
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (!isMobile) return;
  
  console.log('📱 تطبيق إصلاحات الهاتف المحمول...');
  
  // إصلاح مشكلة الأحرف الكبيرة في حقول الإدخال
  function fixInputAttributes(input) {
    if (!input) return;
    
    const placeholder = input.placeholder?.toLowerCase() || '';
    const type = input.type?.toLowerCase() || '';
    
    // إصلاح حقول البريد الإلكتروني واسم المستخدم
    if (type === 'email' || 
        placeholder.includes('بريد') || 
        placeholder.includes('email') ||
        placeholder.includes('مستخدم') ||
        placeholder.includes('username')) {
      
      input.setAttribute('autocapitalize', 'none');
      input.setAttribute('autocorrect', 'off');
      input.setAttribute('spellcheck', 'false');
      input.style.textTransform = 'none';
      
      console.log('🔧 تم إصلاح حقل الإدخال:', placeholder);
    }
  }
  
  // تحسين الأداء للهاتف
  function initializeMobileOptimizations() {
    if (!document.body) {
      setTimeout(initializeMobileOptimizations, 100);
      return;
    }
    
    // إضافة class للجسم
    document.body.classList.add('mobile-device');
    
    // تحسين scroll
    document.body.style.webkitOverflowScrolling = 'touch';
    document.body.style.overscrollBehavior = 'none';
    
    // مراقبة الحقول الجديدة
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType === 1) { // Element node
            const inputs = node.querySelectorAll ? node.querySelectorAll('input') : [];
            inputs.forEach(fixInputAttributes);
            
            if (node.tagName === 'INPUT') {
              fixInputAttributes(node);
            }
          }
        });
      });
    });
    
    // تطبيق الإصلاحات على الحقول الموجودة
    document.querySelectorAll('input').forEach(fixInputAttributes);
    
    // مراقبة الحقول الجديدة
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    console.log('✅ تم تطبيق إصلاحات الهاتف المحمول');
  }
  
  // منع التكبير عند focus على input
  document.addEventListener('focusin', function(e) {
    if (e.target.matches('input, select, textarea')) {
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
      }
    }
  });
  
  document.addEventListener('focusout', function(e) {
    if (e.target.matches('input, select, textarea')) {
      setTimeout(() => {
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
          viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover');
        }
      }, 300);
    }
  });
  
  // معالجة خاصة للوحة المفاتيح
  let initialHeight = window.innerHeight;
  window.addEventListener('resize', function() {
    const currentHeight = window.innerHeight;
    const heightDiff = initialHeight - currentHeight;
    
    if (heightDiff > 150) {
      document.body.classList.add('keyboard-open');
    } else {
      document.body.classList.remove('keyboard-open');
    }
  });
  
  // إصلاح مشاكل الشبكة للهاتف المحمول
  window.addEventListener('online', function() {
    console.log('📶 الاتصال بالإنترنت متاح');
  });
  
  window.addEventListener('offline', function() {
    console.log('📵 انقطع الاتصال بالإنترنت');
  });
  
  // تحسين localStorage للهاتف
  try {
    localStorage.setItem('mobile-test', 'test');
    localStorage.removeItem('mobile-test');
    console.log('💾 localStorage يعمل بشكل صحيح');
  } catch (e) {
    console.error('❌ مشكلة في localStorage:', e);
  }
  
  // تحسين cookies للهاتف
  if (!navigator.cookieEnabled) {
    console.warn('🍪 Cookies غير مفعلة - قد يؤثر على تسجيل الدخول');
  }
  
  // معالجة خاصة لـ iOS Safari
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    console.log('🍎 تطبيق إصلاحات iOS Safari...');
    
    // إصلاح مشكلة viewport في iOS
    document.addEventListener('orientationchange', function() {
      setTimeout(function() {
        window.scrollTo(0, 0);
      }, 500);
    });
  }
  
  // معالجة خاصة لـ Android
  if (/Android/.test(navigator.userAgent)) {
    console.log('🤖 تطبيق إصلاحات Android...');
    
    // تحسين الأداء للأندرويد
    document.addEventListener('touchstart', function() {}, { passive: true });
  }
  
  // تشغيل التحسينات عند تحميل DOM أو فوراً إذا كان محملاً
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMobileOptimizations);
  } else {
    initializeMobileOptimizations();
  }
  
})();
