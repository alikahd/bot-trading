#!/usr/bin/env python3
"""
خادم IQ Option عالمي - يدعم مكتبات مختلفة
===============================================
يحاول استخدام أي مكتبة IQ Option متوفرة تلقائياً
"""

from flask import Flask, jsonify
from flask_cors import CORS
import logging
import time
import threading
import os
import requests
import random
import math

# إعداد السجلات
logging.basicConfig(
    level=logging.INFO,  # عودة إلى INFO لتقليل الرسائل
    format='%(levelname)s:%(name)s:%(message)s'
)
logger = logging.getLogger(__name__)

# إخفاء رسائل DEBUG من مكتبة iqoptionapi
logging.getLogger('iqoptionapi').setLevel(logging.WARNING)
logging.getLogger('urllib3').setLevel(logging.WARNING)

app = Flask(__name__)
CORS(app)

# =======================
# اكتشاف المكتبة المتوفرة
# =======================

IQ_AVAILABLE = False
IQ_Option = None
iq_api = None

def detect_iq_library():
    """اكتشاف مكتبة IQ Option المتوفرة"""
    global IQ_AVAILABLE, IQ_Option
    
    # تجربة المكتبات المختلفة
    libraries_to_try = [
        ("iqoptionapi.stable_api", "IQ_Option"),
        ("iqoptionapi", "IQ_Option"), 
        ("iq_option_api", "IQ_Option"),
        ("iqoption", "IQ_Option")
    ]
    
    for module_name, class_name in libraries_to_try:
        try:
            module = __import__(module_name, fromlist=[class_name])
            IQ_Option = getattr(module, class_name)
            IQ_AVAILABLE = True
            logger.info(f"✅ تم العثور على مكتبة: {module_name}.{class_name}")
            return True
        except ImportError:
            logger.debug(f"⚠️ لم يتم العثور على: {module_name}")
        except AttributeError:
            logger.debug(f"⚠️ لا توجد فئة {class_name} في {module_name}")
    
    logger.error("❌ لم يتم العثور على أي مكتبة IQ Option!")
    return False

# اكتشاف المكتبة عند التشغيل
detect_iq_library()

# =======================
# إعدادات IQ Option + Proxy
# =======================

IQ_EMAIL = "qarali131@gmail.com"
IQ_PASSWORD = "Azert@0208"

# إعدادات Proxy للتجاوز حظر Railway/Render
PROXY_ENABLED = os.getenv('USE_PROXY', 'false').lower() == 'true'
PROXY_LIST = [
    {'http': 'http://72.10.160.94:12797', 'https': 'https://72.10.160.94:12797'},
    {'http': 'http://196.204.83.235:1981', 'https': 'https://196.204.83.235:1981'},
    {'http': 'http://43.229.79.217:3128', 'https': 'https://43.229.79.217:3128'},
    {'http': 'http://45.144.234.129:53681', 'https': 'https://45.144.234.129:53681'},
    {'http': 'http://172.86.66.151:3128', 'https': 'https://172.86.66.151:3128'},
]

# Proxy rotation للتنويع
current_proxy_index = 0

def get_next_proxy():
    """الحصول على proxy التالي من القائمة"""
    global current_proxy_index
    if not PROXY_LIST:
        return None
    
    proxy = PROXY_LIST[current_proxy_index]
    current_proxy_index = (current_proxy_index + 1) % len(PROXY_LIST)
    return proxy

def test_proxy(proxy):
    """اختبار proxy للتأكد من عمله"""
    try:
        response = requests.get('https://httpbin.org/ip', proxies=proxy, timeout=10)
        if response.status_code == 200:
            ip_info = response.json()
            logger.info(f"✅ Proxy يعمل - IP: {ip_info.get('origin', 'unknown')}")
            return True
    except Exception as e:
        logger.warning(f"⚠️ Proxy لا يعمل: {e}")
    return False

# متغيرات عامة
prices_cache = {}
connection_status = "disconnected"
last_update_time = 0

# رموز العملات - جميع الأزواج المتوفرة
CURRENCY_SYMBOLS = {
    # الأزواج الرئيسية (Major Pairs)
    'EURUSD_otc': ['EURUSD-OTC', 'EURUSD', 'EUR/USD'],
    'GBPUSD_otc': ['GBPUSD-OTC', 'GBPUSD', 'GBP/USD'],
    'USDJPY_otc': ['USDJPY-OTC', 'USDJPY', 'USD/JPY'],
    'AUDUSD_otc': ['AUDUSD-OTC', 'AUDUSD', 'AUD/USD'],
    'USDCAD_otc': ['USDCAD-OTC', 'USDCAD', 'USD/CAD'],
    'USDCHF_otc': ['USDCHF-OTC', 'USDCHF', 'USD/CHF'],
    'NZDUSD_otc': ['NZDUSD-OTC', 'NZDUSD', 'NZD/USD'],
    
    # الأزواج المتقاطعة (Cross Pairs)
    'EURGBP_otc': ['EURGBP-OTC', 'EURGBP', 'EUR/GBP'],
    'EURJPY_otc': ['EURJPY-OTC', 'EURJPY', 'EUR/JPY'],
    'EURCHF_otc': ['EURCHF-OTC', 'EURCHF', 'EUR/CHF'],
    'EURAUD_otc': ['EURAUD-OTC', 'EURAUD', 'EUR/AUD'],
    'EURCAD_otc': ['EURCAD-OTC', 'EURCAD', 'EUR/CAD'],
    'EURNZD_otc': ['EURNZD-OTC', 'EURNZD', 'EUR/NZD'],
    
    'GBPJPY_otc': ['GBPJPY-OTC', 'GBPJPY', 'GBP/JPY'],
    'GBPCHF_otc': ['GBPCHF-OTC', 'GBPCHF', 'GBP/CHF'],
    'GBPAUD_otc': ['GBPAUD-OTC', 'GBPAUD', 'GBP/AUD'],
    'GBPCAD_otc': ['GBPCAD-OTC', 'GBPCAD', 'GBP/CAD'],
    'GBPNZD_otc': ['GBPNZD-OTC', 'GBPNZD', 'GBP/NZD'],
    
    'AUDJPY_otc': ['AUDJPY-OTC', 'AUDJPY', 'AUD/JPY'],
    'AUDCHF_otc': ['AUDCHF-OTC', 'AUDCHF', 'AUD/CHF'],
    'AUDCAD_otc': ['AUDCAD-OTC', 'AUDCAD', 'AUD/CAD'],
    'AUDNZD_otc': ['AUDNZD-OTC', 'AUDNZD', 'AUD/NZD'],
    
    'NZDJPY_otc': ['NZDJPY-OTC', 'NZDJPY', 'NZD/JPY'],
    'NZDCHF_otc': ['NZDCHF-OTC', 'NZDCHF', 'NZD/CHF'],
    'NZDCAD_otc': ['NZDCAD-OTC', 'NZDCAD', 'NZD/CAD'],
    
    'CADJPY_otc': ['CADJPY-OTC', 'CADJPY', 'CAD/JPY'],
    'CADCHF_otc': ['CADCHF-OTC', 'CADCHF', 'CAD/CHF'],
    
    'CHFJPY_otc': ['CHFJPY-OTC', 'CHFJPY', 'CHF/JPY'],
    
    # العملات الناشئة والغريبة (Exotic Pairs)
    'USDRUB_otc': ['USDRUB-OTC', 'USDRUB', 'USD/RUB'],
    'USDTRY_otc': ['USDTRY-OTC', 'USDTRY', 'USD/TRY'],
    'USDZAR_otc': ['USDZAR-OTC', 'USDZAR', 'USD/ZAR'],
    'USDMXN_otc': ['USDMXN-OTC', 'USDMXN', 'USD/MXN'],
    'USDBRL_otc': ['USDBRL-OTC', 'USDBRL', 'USD/BRL'],
    'USDSGD_otc': ['USDSGD-OTC', 'USDSGD', 'USD/SGD'],
    'USDHKD_otc': ['USDHKD-OTC', 'USDHKD', 'USD/HKD'],
    'USDKRW_otc': ['USDKRW-OTC', 'USDKRW', 'USD/KRW'],
    'USDINR_otc': ['USDINR-OTC', 'USDINR', 'USD/INR'],
    'USDCNH_otc': ['USDCNH-OTC', 'USDCNH', 'USD/CNH'],
    
    # أزواج النفط والذهب
    'XAUUSD_otc': ['XAUUSD-OTC', 'XAUUSD', 'XAU/USD', 'GOLD'],
    'XAGUSD_otc': ['XAGUSD-OTC', 'XAGUSD', 'XAG/USD', 'SILVER'],
    'USOIL_otc': ['USOIL-OTC', 'USOIL', 'OIL', 'CRUDE'],
    'UKOIL_otc': ['UKOIL-OTC', 'UKOIL', 'BRENT'],
    
    # العملات المشفرة الرئيسية
    'BTCUSD_otc': ['BTCUSD-OTC', 'BTCUSD', 'BTC/USD', 'BITCOIN'],
    'ETHUSD_otc': ['ETHUSD-OTC', 'ETHUSD', 'ETH/USD', 'ETHEREUM'],
    'LTCUSD_otc': ['LTCUSD-OTC', 'LTCUSD', 'LTC/USD', 'LITECOIN'],
    'XRPUSD_otc': ['XRPUSD-OTC', 'XRPUSD', 'XRP/USD', 'RIPPLE'],
}

# =======================
# دوال IQ Option
# =======================

def setup_proxy_for_iqoption():
    """إعداد proxy لـ IQ Option API"""
    if not PROXY_ENABLED or not PROXY_LIST:
        logger.info("🌐 الاتصال المباشر بـ IQ Option (بدون proxy)")
        return None
    
    # اختبار proxy servers
    working_proxy = None
    for _ in range(len(PROXY_LIST)):
        proxy = get_next_proxy()
        if test_proxy(proxy):
            working_proxy = proxy
            break
    
    if working_proxy:
        logger.info(f"🔄 استخدام Proxy: {working_proxy}")
        # تطبيق proxy على requests session
        try:
            import urllib3
            # تعطيل تحذيرات SSL للproxy
            urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
        except:
            pass
        return working_proxy
    else:
        logger.warning("⚠️ لا يوجد proxy يعمل - الاتصال المباشر")
        return None

def connect_to_iqoption():
    """الاتصال بـ IQ Option مع دعم Proxy لتجاوز حظر Railway/Render"""
    global iq_api, connection_status
    
    if not IQ_AVAILABLE or not IQ_Option:
        logger.warning("⚠️ مكتبة IQ Option غير متوفرة - استخدام البيانات التجريبية")
        connection_status = "demo_mode"
        return False
    
    try:
        # إعداد proxy إذا كان مفعل
        proxy = setup_proxy_for_iqoption()
        
        logger.info("🔌 محاولة الاتصال بـ IQ Option...")
        if proxy:
            logger.info("🌐 الاتصال عبر Proxy لتجاوز حظر Railway/Render")
        
        iq_api = IQ_Option(IQ_EMAIL, IQ_PASSWORD)
        
        # تطبيق proxy على IQ Option API إذا كان متوفر
        if proxy and hasattr(iq_api, 'set_proxy'):
            try:
                iq_api.set_proxy(proxy)
                logger.info("✅ تم تطبيق Proxy على IQ Option API")
            except Exception as e:
                logger.warning(f"⚠️ فشل تطبيق Proxy: {e}")
        
        # محاولة إضافة timeout قصير لتجنب التأخير
        if hasattr(iq_api, 'set_session_timeout'):
            try:
                iq_api.set_session_timeout(15)  # timeout أطول قليلاً للproxy
            except:
                pass
        
        check, reason = iq_api.connect()
        
        if check:
            logger.info("✅ تم الاتصال بـ IQ Option بنجاح!")
            if proxy:
                logger.info("🎯 نجح تجاوز حظر Railway/Render باستخدام Proxy")
            
            # التبديل للحساب التجريبي
            try:
                if hasattr(iq_api, 'change_balance'):
                    iq_api.change_balance("PRACTICE")
                    logger.info("✅ تم التبديل للحساب التجريبي")
            except Exception as e:
                logger.warning(f"⚠️ تحذير: فشل التبديل للحساب التجريبي: {e}")
            
            connection_status = "connected"
            return True
        else:
            logger.warning(f"⚠️ فشل الاتصال: {reason}")
            if proxy:
                logger.warning("🔄 قد يكون Proxy محظور أيضاً - جرب proxy آخر")
            logger.info("📊 التبديل للوضع التجريبي")
            connection_status = "demo_mode"
            return False
            
    except Exception as e:
        logger.warning(f"⚠️ خطأ في الاتصال: {e}")
        if "getaddrinfo failed" in str(e):
            logger.warning("🚫 يبدو أن Railway/Render يحظر الاتصال بـ IQ Option")
            logger.info("💡 نصيحة: فعّل USE_PROXY=true وأضف proxy servers")
        logger.info("📊 التبديل للوضع التجريبي")
        connection_status = "demo_mode"
        return False

def get_price_safe(symbol, iq_symbol):
    """جلب السعر بطريقة آمنة - الأولوية للسعر الفوري"""
    
    # الطريقة 1: get_realtime_candles (الأسرع والأكثر دقة للسعر الحالي)
    try:
        if hasattr(iq_api, 'get_realtime_candles'):
            # تشغيل stream أولاً إذا لم يكن نشطاً
            if hasattr(iq_api, 'start_candles_stream'):
                try:
                    iq_api.start_candles_stream(iq_symbol, 60, 1)
                    time.sleep(0.05)  # سرعة فورية قصوى (50ms)
                except:
                    pass
            
            result = iq_api.get_realtime_candles(iq_symbol, 60)
            if result and len(result) > 0:
                latest = list(result.values())[-1]
                price = latest['close']
                logger.info(f"📊 {symbol}: ${price} من get_realtime_candles ({iq_symbol})")
                return float(price)
    except Exception as e:
        pass
    
    # الطريقة 2: get_candles (احتياطي)
    try:
        if hasattr(iq_api, 'get_candles'):
            end_time = int(time.time())
            result = iq_api.get_candles(iq_symbol, 60, 1, end_time)
            if result and len(result) > 0:
                price = result[0]['close']
                logger.info(f"📊 {symbol}: ${price} من get_candles ({iq_symbol})")
                return float(price)
    except Exception as e:
        pass
    
    return None

def get_iqoption_price(symbol):
    """جلب السعر من IQ Option مع دعم رموز متعددة"""
    global iq_api
    
    if not iq_api or connection_status != "connected":
        return None
    
    # جرب جميع الرموز المتاحة للعملة
    symbols_to_try = CURRENCY_SYMBOLS.get(symbol, [symbol])
    
    for iq_symbol in symbols_to_try:
        try:
            price = get_price_safe(symbol, iq_symbol)
            if price and price > 0:
                logger.info(f"✅ {symbol}: ${price} من IQ Option ({iq_symbol})")
                return price
        except Exception as e:
            continue
    
    return None

def update_iqoption_prices():
    """تحديث الأسعار من IQ Option"""
    global prices_cache, last_update_time, connection_status
    
    # محاولة الاتصال
    max_attempts = 3
    for attempt in range(max_attempts):
        if connect_to_iqoption():
            break
        logger.warning(f"⚠️ محاولة الاتصال {attempt + 1}/{max_attempts} فشلت")
        time.sleep(5)
    
    if connection_status != "connected":
        logger.error("❌ فشل الاتصال بـ IQ Option بعد عدة محاولات!")
        return
    
    consecutive_failures = 0
    max_failures = 5
    
    while True:
        try:
            updated_count = 0
            
            # التحقق من حالة الاتصال
            if connection_status != "connected":
                logger.warning("⚠️ فقدان الاتصال، محاولة إعادة الاتصال...")
                if not connect_to_iqoption():
                    time.sleep(30)
                    continue
            
            # تحديث فوري بسرعة السوق الحقيقية (دفعات ضخمة)
            symbols_list = list(CURRENCY_SYMBOLS.keys())
            batch_size = 30  # معالجة 30 زوج في كل دفعة للسرعة الفورية
            
            for i in range(0, len(symbols_list), batch_size):
                batch = symbols_list[i:i + batch_size]
                
                for symbol in batch:
                    try:
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
                        
                        time.sleep(0.01)  # تأخير فوري قصوى (10ms فقط!)
                        
                    except Exception as e:
                        pass  # تجاهل الأخطاء للحفاظ على الاستمرارية
                
                # بدون استراحة بين المجموعات للسرعة القصوى
                # if i + batch_size < len(symbols_list):
                #     time.sleep(0.5)
            
            last_update_time = time.time()
            
            if updated_count > 0:
                logger.info(f"✅ تم تحديث {updated_count} سعر من IQ Option")
            else:
                consecutive_failures += 1
                logger.warning(f"⚠️ لم يتم تحديث أي أسعار ({consecutive_failures}/{max_failures})")
            
            # إعادة الاتصال إذا فشل عدة مرات
            if consecutive_failures >= max_failures:
                logger.warning("⚠️ فشل متكرر، محاولة إعادة الاتصال...")
                connection_status = "disconnected"
                consecutive_failures = 0
                time.sleep(10)
                continue
            
            time.sleep(0.2 if updated_count > 0 else 2)  # تحديث فوري قصوى كل 200ms! ⚡⚡⚡
            
        except KeyboardInterrupt:
            logger.info("⏹️ تم إيقاف التحديث")
            break
        except Exception as e:
            logger.error(f"❌ خطأ عام في التحديث: {e}")
            consecutive_failures += 1
            time.sleep(10)

# =======================
# API Endpoints
# =======================

@app.route('/api/status')
def get_status():
    """حالة الخادم"""
    return jsonify({
        'connection': connection_status,
        'provider': 'iqoption_universal',
        'library': IQ_Option.__module__ if IQ_Option else None,
        'cached_prices': len(prices_cache),
        'last_update': last_update_time,
        'server_time': time.time(),
        'library_available': IQ_AVAILABLE
    })

@app.route('/api/quotes')
def get_all_quotes():
    """جلب جميع الأسعار"""
    return jsonify(prices_cache)

@app.route('/api/quotes/<symbol>')
def get_quote(symbol):
    """جلب سعر محدد"""
    if symbol in prices_cache:
        return jsonify(prices_cache[symbol])
    else:
        return jsonify({'error': f'Quote for {symbol} not available'}), 404

@app.route('/api/symbols')
def get_symbols():
    """جلب قائمة جميع الرموز المتوفرة"""
    symbols_info = {}
    for symbol, alternatives in CURRENCY_SYMBOLS.items():
        symbols_info[symbol] = {
            'symbol': symbol,
            'alternatives': alternatives,
            'available': symbol in prices_cache,
            'last_price': prices_cache[symbol]['price'] if symbol in prices_cache else None,
            'last_update': prices_cache[symbol]['timestamp'] if symbol in prices_cache else None
        }
    
    return jsonify({
        'total_symbols': len(CURRENCY_SYMBOLS),
        'available_prices': len(prices_cache),
        'symbols': symbols_info
    })

@app.route('/')
def home():
    """الصفحة الرئيسية"""
    return jsonify({
        'server': 'IQ Option Universal API Server',
        'status': connection_status,
        'library': IQ_Option.__module__ if IQ_Option else None,
        'library_available': IQ_AVAILABLE,
        'endpoints': {
            '/api/status': 'Server status',
            '/api/quotes': 'All quotes',
            '/api/quotes/<symbol>': 'Specific quote',
            '/api/symbols': 'List all available symbols'
        }
    })

# =======================
# بدء الخادم
# =======================

if __name__ == '__main__':
    logger.info("=" * 50)
    logger.info("🌐 خادم IQ Option العالمي")
    logger.info("=" * 50)
    
    if not IQ_AVAILABLE:
        logger.error("❌ لا توجد مكتبة IQ Option متوفرة!")
        logger.info("📦 جرب تشغيل: python test_iq_libraries.py")
    else:
        logger.info(f"✅ مكتبة متوفرة: {IQ_Option.__module__}")
        logger.info(f"📧 البريد: {IQ_EMAIL}")
        
        # بدء تحديث الأسعار في خيط منفصل
        update_thread = threading.Thread(target=update_iqoption_prices, daemon=True)
        update_thread.start()
    
    # الحصول على المنفذ من متغير البيئة أو استخدام 5000 كافتراضي
    port = int(os.environ.get('PORT', 5000))
    
    logger.info(f"🌐 الخادم يعمل على http://0.0.0.0:{port}")
    logger.info("=" * 50)
    
    app.run(host='0.0.0.0', port=port, debug=False)
