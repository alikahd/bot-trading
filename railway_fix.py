#!/usr/bin/env python3
"""
إصلاح مشكلة Railway - جلب 3 أزواج فقط بدلاً من 42
========================================================
يحسن إعدادات IQ Option للعمل على البيئة السحابية
"""

import os
import re

def update_server_for_railway():
    """تحديث إعدادات السيرفر للعمل بشكل أفضل على Railway"""
    
    server_file = "iqoption_unofficial_server.py"
    
    if not os.path.exists(server_file):
        print("❌ لم يتم العثور على iqoption_unofficial_server.py")
        return False
    
    try:
        # قراءة الملف
        with open(server_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # التحديثات المطلوبة
        updates = [
            # تقليل batch_size للاستقرار
            (r'batch_size = \d+', 'batch_size = 8'),
            
            # زيادة التأخير بين الطلبات
            (r'time\.sleep\(0\.0\d+\)', 'time.sleep(0.1)'),
            
            # تقليل timeout للاستجابة السريعة
            (r'iq_api\.set_session_timeout\(\d+\)', 'iq_api.set_session_timeout(20)'),
            
            # إضافة إعادة محاولة للأسعار الفاشلة
            (r'pass  # تجاهل الأخطاء للحفاظ على الاستمرارية', '''# إعادة محاولة للأسعار الفاشلة
                        if consecutive_failures < 2:
                            time.sleep(0.5)
                            try:
                                price = get_iqoption_price(symbol)
                                if price and price > 0:
                                    quotes_data[symbol] = {
                                        'price': price,
                                        'timestamp': time.time(),
                                        'symbol': symbol,
                                        'source': 'iqoption_retry'
                                    }
                                    updated_count += 1
                            except:
                                pass'''),
        ]
        
        # تطبيق التحديثات
        updated_content = content
        for pattern, replacement in updates:
            updated_content = re.sub(pattern, replacement, updated_content)
        
        # إضافة proxy مخصص لـ Railway
        railway_proxy = '''
# Proxy مخصص لـ Railway (أضف proxy مدفوع هنا)
RAILWAY_PROXY_LIST = [
    # ProxyMesh (موصى به - $10/شهر)
    # {'http': 'http://username:password@us-wa.proxymesh.com:31280', 'https': 'https://username:password@us-wa.proxymesh.com:31280'},
    
    # Bright Data (أفضل جودة - $500+/شهر)
    # {'http': 'http://customer-username:password@zproxy.lum-superproxy.io:22225', 'https': 'https://customer-username:password@zproxy.lum-superproxy.io:22225'},
    
    # إذا كان لديك proxy مدفوع، أضفه هنا
]

# استخدام proxy مخصص لـ Railway
if os.getenv('RAILWAY_ENVIRONMENT') or os.getenv('RENDER'):
    if RAILWAY_PROXY_LIST:
        PROXY_LIST = RAILWAY_PROXY_LIST
        print("🚂 استخدام proxy مخصص لـ Railway/Render")
'''
        
        # إضافة الكود الجديد بعد PROXY_LIST الأصلية
        proxy_pattern = r'(PROXY_LIST = \[.*?\])'
        updated_content = re.sub(
            proxy_pattern, 
            r'\1' + railway_proxy, 
            updated_content, 
            flags=re.DOTALL
        )
        
        # كتابة الملف المحدث
        with open(server_file, 'w', encoding='utf-8') as f:
            f.write(updated_content)
        
        print("✅ تم تحديث السيرفر لـ Railway بنجاح!")
        print("\n📝 التحديثات المطبقة:")
        print("   • تقليل batch_size إلى 8 للاستقرار")
        print("   • زيادة التأخير إلى 100ms")
        print("   • إضافة إعادة محاولة للأسعار الفاشلة")
        print("   • إعدادات proxy مخصصة لـ Railway")
        
        return True
        
    except Exception as e:
        print(f"❌ خطأ في التحديث: {e}")
        return False

def add_premium_proxy():
    """إضافة proxy مدفوع للحصول على أفضل النتائج"""
    
    print("\n💰 للحصول على أفضل النتائج، استخدم proxy مدفوع:")
    print("\n🥇 الخيارات الموصى بها:")
    
    print("\n1. ProxyMesh ($10/شهر - الأرخص):")
    print("   - اذهب إلى: https://proxymesh.com/")
    print("   - سجل حساب واحصل على username/password")
    print("   - أضف في RAILWAY_PROXY_LIST:")
    print("   {'http': 'http://username:password@us-wa.proxymesh.com:31280'}")
    
    print("\n2. Bright Data ($500+/شهر - الأفضل):")
    print("   - اذهب إلى: https://brightdata.com/")
    print("   - احصل على residential proxy")
    print("   - أضف في RAILWAY_PROXY_LIST:")
    print("   {'http': 'http://customer-user:pass@zproxy.lum-superproxy.io:22225'}")
    
    print("\n3. Smartproxy ($75/شهر - متوسط):")
    print("   - اذهب إلى: https://smartproxy.com/")
    print("   - احصل على datacenter proxy")
    print("   - أضف في RAILWAY_PROXY_LIST:")
    print("   {'http': 'http://username:password@gate.smartproxy.com:10000'}")

def test_current_setup():
    """اختبار الإعداد الحالي"""
    
    print("\n🧪 لاختبار الإعداد الحالي:")
    print("1. شغل السيرفر محلياً:")
    print("   python iqoption_unofficial_server.py")
    
    print("\n2. اختبر API:")
    print("   curl http://localhost:5000/api/quotes")
    
    print("\n3. تحقق من عدد الأزواج:")
    print("   يجب أن ترى أكثر من 3 أزواج")
    
    print("\n4. ارفع إلى Railway:")
    print("   git add .")
    print("   git commit -m 'Fix Railway 3 pairs issue'")
    print("   git push")

def main():
    print("🚂 إصلاح مشكلة Railway - جلب 3 أزواج فقط")
    print("=" * 50)
    
    # تحديث السيرفر
    if update_server_for_railway():
        print("\n✅ تم الإصلاح بنجاح!")
        
        # نصائح إضافية
        add_premium_proxy()
        test_current_setup()
        
        print("\n🎯 الخطوات التالية:")
        print("1. ✅ تم تحسين الإعدادات للبيئة السحابية")
        print("2. 💰 أضف proxy مدفوع للحصول على أفضل النتائج")
        print("3. 🧪 اختبر محلياً ثم ارفع إلى Railway")
        print("4. 📊 راقب اللوجز للتأكد من جلب أكثر من 3 أزواج")
        
    else:
        print("\n❌ فشل الإصلاح - تحقق من وجود الملف")

if __name__ == "__main__":
    main()
