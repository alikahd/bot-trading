#!/usr/bin/env python3
"""
مثال على إعداد Proxy للتجاوز حظر Railway/Render
=====================================================
استبدل PROXY_LIST في iqoption_unofficial_server.py بهذه القائمة
"""

# قائمة Proxy servers للاستخدام مع IQ Option
# يمكن الحصول على proxy مجانية من: https://free-proxy-list.net/

PROXY_LIST = [
    # مثال على proxy مجانية (قم بتحديثها بانتظام)
    {'http': 'http://185.199.229.156:7492', 'https': 'https://185.199.229.156:7492'},
    {'http': 'http://185.199.228.220:7300', 'https': 'https://185.199.228.220:7300'},
    {'http': 'http://185.199.231.45:8382', 'https': 'https://185.199.231.45:8382'},
    {'http': 'http://188.74.210.207:6286', 'https': 'https://188.74.210.207:6286'},
    {'http': 'http://188.74.183.10:8279', 'https': 'https://188.74.183.10:8279'},
    
    # مثال على proxy مع authentication (إذا كان لديك حساب مدفوع)
    # {'http': 'http://username:password@premium-proxy.com:8080', 'https': 'https://username:password@premium-proxy.com:8080'},
    
    # مثال على proxy من خدمات مدفوعة
    # Bright Data (Luminati)
    # {'http': 'http://customer-username:password@zproxy.lum-superproxy.io:22225', 'https': 'https://customer-username:password@zproxy.lum-superproxy.io:22225'},
    
    # Smartproxy
    # {'http': 'http://username:password@gate.smartproxy.com:10000', 'https': 'https://username:password@gate.smartproxy.com:10000'},
    
    # ProxyMesh
    # {'http': 'http://username:password@us-wa.proxymesh.com:31280', 'https': 'https://username:password@us-wa.proxymesh.com:31280'},
]

# إعدادات إضافية
PROXY_SETTINGS = {
    'rotation_enabled': True,  # تدوير Proxy تلقائياً
    'test_on_startup': True,   # اختبار Proxy عند البدء
    'fallback_to_direct': True,  # العودة للاتصال المباشر إذا فشلت جميع Proxy
    'max_retries': 3,          # عدد المحاولات لكل proxy
    'timeout': 10,             # مهلة الاتصال بالثواني
}

def get_working_proxies():
    """
    اختبار جميع proxy servers وإرجاع التي تعمل فقط
    """
    import requests
    working_proxies = []
    
    print("🔍 اختبار Proxy servers...")
    
    for i, proxy in enumerate(PROXY_LIST, 1):
        try:
            print(f"⏳ اختبار Proxy {i}/{len(PROXY_LIST)}: {proxy['http']}")
            
            # اختبار الاتصال
            response = requests.get(
                'https://httpbin.org/ip', 
                proxies=proxy, 
                timeout=PROXY_SETTINGS['timeout']
            )
            
            if response.status_code == 200:
                ip_info = response.json()
                print(f"✅ Proxy {i} يعمل - IP: {ip_info.get('origin', 'unknown')}")
                working_proxies.append(proxy)
            else:
                print(f"❌ Proxy {i} لا يعمل - Status: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Proxy {i} لا يعمل - خطأ: {str(e)[:50]}...")
    
    print(f"\n📊 النتيجة: {len(working_proxies)}/{len(PROXY_LIST)} proxy يعمل")
    return working_proxies

def update_proxy_list_from_api():
    """
    تحديث قائمة Proxy من API مجاني
    """
    try:
        import requests
        import json
        
        # API مجاني للحصول على proxy list
        api_url = "https://api.proxyscrape.com/v2/?request=get&protocol=http&timeout=10000&country=all&ssl=all&anonymity=all"
        
        print("🔄 جلب proxy جديدة من API...")
        response = requests.get(api_url, timeout=30)
        
        if response.status_code == 200:
            proxy_text = response.text.strip()
            proxy_lines = proxy_text.split('\n')
            
            new_proxies = []
            for line in proxy_lines[:10]:  # أخذ أول 10 proxy فقط
                if ':' in line:
                    ip, port = line.strip().split(':')
                    proxy_dict = {
                        'http': f'http://{ip}:{port}',
                        'https': f'https://{ip}:{port}'
                    }
                    new_proxies.append(proxy_dict)
            
            print(f"✅ تم جلب {len(new_proxies)} proxy جديدة")
            return new_proxies
        else:
            print(f"❌ فشل جلب proxy من API - Status: {response.status_code}")
            return []
            
    except Exception as e:
        print(f"❌ خطأ في جلب proxy من API: {e}")
        return []

if __name__ == "__main__":
    print("🌐 مثال على إعداد Proxy لتجاوز حظر Railway/Render")
    print("=" * 60)
    
    # اختبار Proxy الحالية
    working_proxies = get_working_proxies()
    
    if working_proxies:
        print(f"\n✅ يمكنك استخدام هذه Proxy:")
        for i, proxy in enumerate(working_proxies, 1):
            print(f"  {i}. {proxy['http']}")
        
        print(f"\n📝 انسخ هذا الكود إلى iqoption_unofficial_server.py:")
        print("PROXY_LIST = [")
        for proxy in working_proxies:
            print(f"    {proxy},")
        print("]")
        
    else:
        print("\n❌ لا توجد proxy تعمل في القائمة الحالية")
        print("💡 جرب تحديث القائمة من API...")
        
        # محاولة جلب proxy جديدة
        new_proxies = update_proxy_list_from_api()
        if new_proxies:
            print("🔍 اختبار Proxy الجديدة...")
            working_new_proxies = []
            
            for proxy in new_proxies[:5]:  # اختبار أول 5 فقط
                try:
                    response = requests.get('https://httpbin.org/ip', proxies=proxy, timeout=10)
                    if response.status_code == 200:
                        working_new_proxies.append(proxy)
                        print(f"✅ Proxy جديدة تعمل: {proxy['http']}")
                except:
                    pass
            
            if working_new_proxies:
                print(f"\n✅ تم العثور على {len(working_new_proxies)} proxy جديدة تعمل!")
                print("📝 استخدم هذا الكود:")
                print("PROXY_LIST = [")
                for proxy in working_new_proxies:
                    print(f"    {proxy},")
                print("]")
    
    print(f"\n🚀 لتفعيل Proxy في Railway/Render:")
    print("   1. أضف متغير البيئة: USE_PROXY=true")
    print("   2. حدّث PROXY_LIST في iqoption_unofficial_server.py")
    print("   3. ارفع الكود الجديد")
    print("   4. راقب اللوجز للتأكد من العمل")
