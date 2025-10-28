#!/usr/bin/env python3
"""
محدث Proxy تلقائي لتجاوز حظر Railway/Render
===========================================
يجلب proxy جديدة ويختبرها ويحدث الملف تلقائياً
"""

import requests
import json
import time
import re
import os
from concurrent.futures import ThreadPoolExecutor, as_completed

class ProxyUpdater:
    def __init__(self):
        self.working_proxies = []
        self.test_timeout = 10
        self.max_proxies = 10
        
    def get_free_proxies_from_api(self):
        """جلب proxy مجانية من APIs مختلفة"""
        proxies = []
        
        # API 1: ProxyScrape
        try:
            print("🔄 جلب proxy من ProxyScrape...")
            url = "https://api.proxyscrape.com/v2/?request=get&protocol=http&timeout=10000&country=all&ssl=all&anonymity=all"
            response = requests.get(url, timeout=30)
            
            if response.status_code == 200:
                proxy_text = response.text.strip()
                for line in proxy_text.split('\n')[:20]:  # أول 20 proxy
                    if ':' in line and len(line.split(':')) == 2:
                        ip, port = line.strip().split(':')
                        if self.is_valid_ip(ip) and port.isdigit():
                            proxies.append(f"{ip}:{port}")
                print(f"✅ تم جلب {len(proxies)} proxy من ProxyScrape")
        except Exception as e:
            print(f"❌ خطأ في ProxyScrape: {e}")
        
        # API 2: Free Proxy List
        try:
            print("🔄 جلب proxy من Free Proxy List...")
            url = "https://www.proxy-list.download/api/v1/get?type=http"
            response = requests.get(url, timeout=30)
            
            if response.status_code == 200:
                for line in response.text.strip().split('\n')[:15]:  # أول 15 proxy
                    if ':' in line and len(line.split(':')) == 2:
                        ip, port = line.strip().split(':')
                        if self.is_valid_ip(ip) and port.isdigit():
                            if f"{ip}:{port}" not in proxies:  # تجنب التكرار
                                proxies.append(f"{ip}:{port}")
                print(f"✅ تم جلب {len(proxies)} proxy إجمالي")
        except Exception as e:
            print(f"❌ خطأ في Free Proxy List: {e}")
        
        return proxies[:30]  # أول 30 proxy فقط
    
    def is_valid_ip(self, ip):
        """التحقق من صحة عنوان IP"""
        pattern = r'^(\d{1,3}\.){3}\d{1,3}$'
        if re.match(pattern, ip):
            parts = ip.split('.')
            return all(0 <= int(part) <= 255 for part in parts)
        return False
    
    def test_proxy(self, proxy_string):
        """اختبار proxy واحد"""
        try:
            ip, port = proxy_string.split(':')
            proxy_dict = {
                'http': f'http://{ip}:{port}',
                'https': f'https://{ip}:{port}'
            }
            
            # اختبار الاتصال
            response = requests.get(
                'https://httpbin.org/ip', 
                proxies=proxy_dict, 
                timeout=self.test_timeout
            )
            
            if response.status_code == 200:
                ip_info = response.json()
                real_ip = ip_info.get('origin', 'unknown')
                
                # اختبار إضافي للتأكد من عمل Proxy
                if real_ip != 'unknown' and real_ip != ip:
                    print(f"✅ Proxy يعمل: {proxy_string} → IP: {real_ip}")
                    return proxy_dict
                else:
                    print(f"⚠️ Proxy مشكوك: {proxy_string} → IP: {real_ip}")
                    return None
            else:
                print(f"❌ Proxy لا يعمل: {proxy_string} → Status: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"❌ Proxy فاشل: {proxy_string} → {str(e)[:50]}...")
            return None
    
    def test_proxies_parallel(self, proxy_list):
        """اختبار عدة proxy بالتوازي"""
        print(f"🔍 اختبار {len(proxy_list)} proxy بالتوازي...")
        
        working_proxies = []
        with ThreadPoolExecutor(max_workers=10) as executor:
            # إرسال جميع المهام
            future_to_proxy = {
                executor.submit(self.test_proxy, proxy): proxy 
                for proxy in proxy_list
            }
            
            # جمع النتائج
            for future in as_completed(future_to_proxy):
                result = future.result()
                if result:
                    working_proxies.append(result)
                    if len(working_proxies) >= self.max_proxies:
                        break
        
        return working_proxies
    
    def update_server_file(self, working_proxies):
        """تحديث ملف السيرفر بـ proxy الجديدة"""
        server_file = "iqoption_unofficial_server.py"
        
        if not os.path.exists(server_file):
            print(f"❌ لم يتم العثور على {server_file}")
            return False
        
        try:
            # قراءة الملف الحالي
            with open(server_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # إنشاء قائمة Proxy الجديدة
            proxy_list_str = "PROXY_LIST = [\n"
            for proxy in working_proxies:
                proxy_list_str += f"    {proxy},\n"
            proxy_list_str += "]"
            
            # استبدال PROXY_LIST القديمة
            pattern = r'PROXY_LIST = \[.*?\]'
            new_content = re.sub(pattern, proxy_list_str, content, flags=re.DOTALL)
            
            # كتابة الملف المحدث
            with open(server_file, 'w', encoding='utf-8') as f:
                f.write(new_content)
            
            print(f"✅ تم تحديث {server_file} بـ {len(working_proxies)} proxy جديدة")
            return True
            
        except Exception as e:
            print(f"❌ خطأ في تحديث الملف: {e}")
            return False
    
    def save_backup_proxies(self, working_proxies):
        """حفظ نسخة احتياطية من Proxy"""
        backup_file = "proxy_backup.json"
        
        try:
            backup_data = {
                'timestamp': time.time(),
                'date': time.strftime('%Y-%m-%d %H:%M:%S'),
                'proxies': working_proxies,
                'count': len(working_proxies)
            }
            
            with open(backup_file, 'w', encoding='utf-8') as f:
                json.dump(backup_data, f, indent=2, ensure_ascii=False)
            
            print(f"✅ تم حفظ نسخة احتياطية في {backup_file}")
            
        except Exception as e:
            print(f"❌ خطأ في حفظ النسخة الاحتياطية: {e}")
    
    def run_update(self):
        """تشغيل عملية التحديث الكاملة"""
        print("🚀 بدء تحديث Proxy تلقائياً...")
        print("=" * 50)
        
        # الخطوة 1: جلب proxy جديدة
        proxy_list = self.get_free_proxies_from_api()
        
        if not proxy_list:
            print("❌ لم يتم العثور على أي proxy")
            return False
        
        print(f"📊 تم جلب {len(proxy_list)} proxy للاختبار")
        
        # الخطوة 2: اختبار Proxy
        working_proxies = self.test_proxies_parallel(proxy_list)
        
        if not working_proxies:
            print("❌ لا توجد proxy تعمل")
            return False
        
        print(f"🎯 تم العثور على {len(working_proxies)} proxy تعمل")
        
        # الخطوة 3: حفظ نسخة احتياطية
        self.save_backup_proxies(working_proxies)
        
        # الخطوة 4: تحديث ملف السيرفر
        success = self.update_server_file(working_proxies)
        
        if success:
            print("\n🎉 تم تحديث Proxy بنجاح!")
            print("📝 الخطوات التالية:")
            print("   1. راجع iqoption_unofficial_server.py")
            print("   2. اختبر السيرفر محلياً")
            print("   3. ارفع التحديث إلى Railway/Render")
            print("   4. فعّل USE_PROXY=true")
            
            # عرض Proxy الجديدة
            print(f"\n✅ Proxy الجديدة ({len(working_proxies)}):")
            for i, proxy in enumerate(working_proxies, 1):
                print(f"   {i}. {proxy['http']}")
            
            return True
        else:
            print("❌ فشل في تحديث ملف السيرفر")
            return False

def main():
    print("🌐 محدث Proxy التلقائي لتجاوز حظر Railway/Render")
    print("=" * 60)
    
    updater = ProxyUpdater()
    
    try:
        success = updater.run_update()
        
        if success:
            print("\n🚀 جاهز للنشر!")
            print("💡 نصيحة: اختبر السيرفر محلياً أولاً:")
            print("   python iqoption_unofficial_server.py")
        else:
            print("\n❌ فشل التحديث - جرب مرة أخرى لاحقاً")
            
    except KeyboardInterrupt:
        print("\n⏹️ تم إيقاف التحديث بواسطة المستخدم")
    except Exception as e:
        print(f"\n❌ خطأ غير متوقع: {e}")

if __name__ == "__main__":
    main()
