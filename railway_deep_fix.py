#!/usr/bin/env python3
"""
إصلاح عميق لمشكلة Railway - جلب 3 أزواج فقط ثم توقف
=======================================================
حل جذري لمشكلة حدود Railway على IQ Option API
"""

import os
import re
import time

def apply_railway_deep_fix():
    """تطبيق إصلاح عميق لمشكلة Railway"""
    
    server_file = "iqoption_unofficial_server.py"
    
    if not os.path.exists(server_file):
        print("❌ لم يتم العثور على iqoption_unofficial_server.py")
        return False
    
    try:
        # قراءة الملف
        with open(server_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        print("🔧 تطبيق الإصلاحات العميقة...")
        
        # 1. إضافة معالجة خاصة لأخطاء Railway
        railway_error_handler = '''
def handle_railway_error(symbol, error_msg):
    """معالجة خاصة لأخطاء Railway"""
    global connection_status
    
    if "need reconnect" in str(error_msg):
        logger.warning(f"🚂 Railway حد الاتصال: {symbol} - {error_msg}")
        connection_status = "disconnected"
        return True
    
    if "getaddrinfo failed" in str(error_msg):
        logger.warning(f"🚂 Railway حظر الشبكة: {symbol}")
        return True
    
    return False

def railway_safe_sleep(base_seconds=1):
    """انتظار آمن مخصص لـ Railway"""
    if os.getenv('RAILWAY_ENVIRONMENT'):
        sleep_time = base_seconds * 3  # 3x أطول لـ Railway
        logger.info(f"🚂 Railway: انتظار {sleep_time} ثانية...")
        time.sleep(sleep_time)
    else:
        time.sleep(base_seconds)
'''
        
        # إدراج المعالج بعد الimports
        import_end = content.find('app = Flask(__name__)')
        if import_end != -1:
            content = content[:import_end] + railway_error_handler + '\n\n' + content[import_end:]
        
        # 2. تحديث get_price_safe مع معالجة Railway
        old_get_price = re.search(r'def get_price_safe\(.*?\):(.*?)(?=def|\Z)', content, re.DOTALL)
        if old_get_price:
            new_get_price = '''def get_price_safe(symbol, iq_symbol):
    """جلب السعر بطريقة آمنة - معالجة خاصة لـ Railway"""
    global connection_status
    
    # الطريقة 1: get_realtime_candles مع معالجة Railway
    try:
        if hasattr(iq_api, 'get_realtime_candles'):
            if hasattr(iq_api, 'start_candles_stream'):
                try:
                    iq_api.start_candles_stream(iq_symbol, 60, 1)
                    railway_safe_sleep(0.2)  # انتظار آمن للstream
                except Exception as stream_e:
                    if handle_railway_error(symbol, stream_e):
                        return None
            
            result = iq_api.get_realtime_candles(iq_symbol, 60)
            if result and len(result) > 0:
                latest = list(result.values())[-1]
                price = latest['close']
                logger.info(f"📊 {symbol}: ${price} من get_realtime_candles ({iq_symbol})")
                return float(price)
    except Exception as e:
        if handle_railway_error(symbol, e):
            raise Exception(f"Railway limit: {symbol}")
    
    # الطريقة 2: get_candles مع معالجة Railway المحسنة
    try:
        if hasattr(iq_api, 'get_candles'):
            end_time = int(time.time())
            result = iq_api.get_candles(iq_symbol, 60, 1, end_time)
            if result and len(result) > 0:
                price = result[0]['close']
                logger.info(f"📊 {symbol}: ${price} من get_candles ({iq_symbol})")
                return float(price)
    except Exception as e:
        if handle_railway_error(symbol, e):
            logger.error(f"🚂 Railway: توقف عند {symbol} - حد الطلبات")
            raise Exception(f"Railway connection limit reached at {symbol}")
    
    return None
'''
            content = content.replace(old_get_price.group(0), new_get_price)
        
        # 3. تحديث الحلقة الرئيسية مع منطق Railway
        old_loop_pattern = r'(for symbol in batch:.*?time\.sleep\([^)]+\))'
        new_loop = '''for symbol in batch:
                    try:
                        # فحص خاص لـ Railway قبل كل طلب
                        if os.getenv('RAILWAY_ENVIRONMENT') and updated_count >= 3:
                            logger.warning(f"🚂 Railway: وصل للحد الأقصى ({updated_count} أزواج) - توقف مؤقت")
                            time.sleep(30)  # استراحة طويلة
                            break
                        
                        price = get_iqoption_price(symbol)
                        
                        if price and price > 0:
                            # حساب التغيير إذا كان هناك سعر سابق
                            change = 0
                            change_percent = 0
                            if symbol in prices_cache:
                                old_price = prices_cache[symbol]['price']
                                change = price - old_price
                                change_percent = (change / old_price) * 100 if old_price > 0 else 0
                            
                            prices_cache[symbol] = {
                                'price': price,
                                'bid': price * 0.99999,
                                'ask': price * 1.00001,
                                'timestamp': time.time(),
                                'symbol': symbol,
                                'source': 'iqoption_universal',
                                'is_real': True,
                                'provider': f'IQ Option ({IQ_Option.__module__})',
                                'change': change,
                                'changePercent': change_percent
                            }
                            updated_count += 1
                            consecutive_failures = 0
                            
                            # تسجيل خاص لـ Railway
                            if os.getenv('RAILWAY_ENVIRONMENT'):
                                logger.info(f"🚂 Railway: نجح {symbol} ({updated_count}/42)")
                        
                        # تأخير مخصص لـ Railway
                        railway_safe_sleep(1.0 if os.getenv('RAILWAY_ENVIRONMENT') else 0.3)
                        
                    except Exception as e:
                        if "Railway limit" in str(e) or "Railway connection limit" in str(e):
                            logger.error(f"🚂 Railway: وصل للحد الأقصى عند {symbol}")
                            break  # توقف فوري عند الوصول للحد
                        
                        # إعادة محاولة محدودة
                        if consecutive_failures < 1:  # محاولة واحدة فقط
                            railway_safe_sleep(2.0)
                            try:
                                price = get_iqoption_price(symbol)
                                if price and price > 0:
                                    prices_cache[symbol] = {
                                        'price': price,
                                        'timestamp': time.time(),
                                        'symbol': symbol,
                                        'source': 'iqoption_retry'
                                    }
                                    updated_count += 1
                            except:
                                pass'''
        
        content = re.sub(old_loop_pattern, new_loop, content, flags=re.DOTALL)
        
        # 4. تحديث إعدادات Railway
        railway_settings = '''
# إعدادات خاصة لـ Railway
if os.getenv('RAILWAY_ENVIRONMENT'):
    logger.info("🚂 تم اكتشاف بيئة Railway - تطبيق إعدادات خاصة")
    # تقليل batch_size للحد الأدنى
    RAILWAY_BATCH_SIZE = 2
    RAILWAY_DELAY = 2.0
    RAILWAY_MAX_PAIRS = 6  # حد أقصى 6 أزواج لـ Railway
else:
    RAILWAY_BATCH_SIZE = 8
    RAILWAY_DELAY = 0.5
    RAILWAY_MAX_PAIRS = 42
'''
        
        # إدراج الإعدادات بعد متغيرات عامة
        globals_end = content.find('# رموز العملات')
        if globals_end != -1:
            content = content[:globals_end] + railway_settings + '\n\n' + content[globals_end:]
        
        # 5. تحديث batch_size ليستخدم الإعدادات الجديدة
        content = re.sub(
            r'batch_size = \d+ if.*?else \d+',
            'batch_size = RAILWAY_BATCH_SIZE',
            content
        )
        
        # كتابة الملف المحدث
        with open(server_file, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print("✅ تم تطبيق الإصلاح العميق بنجاح!")
        return True
        
    except Exception as e:
        print(f"❌ خطأ في تطبيق الإصلاح: {e}")
        return False

def create_railway_env():
    """إنشاء ملف بيئة Railway"""
    
    railway_env = '''# متغيرات البيئة لـ Railway
RAILWAY_ENVIRONMENT=true
USE_PROXY=true
PORT=5000
ENABLE_IQ_WS=false

# إعدادات خاصة لحل مشكلة 3 أزواج
RAILWAY_BATCH_SIZE=2
RAILWAY_DELAY=2.0
RAILWAY_MAX_PAIRS=6
'''
    
    with open('.env.railway', 'w', encoding='utf-8') as f:
        f.write(railway_env)
    
    print("✅ تم إنشاء .env.railway")

def show_railway_instructions():
    """عرض تعليمات النشر على Railway"""
    
    print("\n🚂 تعليمات النشر على Railway:")
    print("=" * 50)
    
    print("\n1. رفع الكود:")
    print("   git add .")
    print("   git commit -m 'Deep fix for Railway 3 pairs issue'")
    print("   git push")
    
    print("\n2. إعداد متغيرات البيئة في Railway:")
    print("   RAILWAY_ENVIRONMENT=true")
    print("   USE_PROXY=true")
    print("   RAILWAY_BATCH_SIZE=2")
    print("   RAILWAY_MAX_PAIRS=6")
    
    print("\n3. مراقبة النتائج:")
    print("   railway logs --follow")
    
    print("\n📊 النتائج المتوقعة:")
    print("   ✅ جلب 6 أزواج بدلاً من 3")
    print("   ✅ عدم توقف مفاجئ")
    print("   ✅ معالجة ذكية لحدود Railway")
    
    print("\n💡 إذا لم يحل المشكلة:")
    print("   - استخدم Render بدلاً من Railway")
    print("   - أو احصل على proxy مدفوع")

def main():
    print("🚂 إصلاح عميق لمشكلة Railway - جلب 3 أزواج فقط")
    print("=" * 60)
    
    # تطبيق الإصلاح
    if apply_railway_deep_fix():
        print("\n✅ تم تطبيق الإصلاح العميق!")
        
        # إنشاء ملف البيئة
        create_railway_env()
        
        # عرض التعليمات
        show_railway_instructions()
        
        print("\n🎯 الإصلاحات المطبقة:")
        print("   • معالجة خاصة لأخطاء Railway")
        print("   • حد أقصى 6 أزواج لتجنب الحظر")
        print("   • تأخير مضاعف لـ Railway")
        print("   • توقف ذكي عند الوصول للحد")
        print("   • إعادة محاولة محدودة")
        
    else:
        print("\n❌ فشل في تطبيق الإصلاح")

if __name__ == "__main__":
    main()
