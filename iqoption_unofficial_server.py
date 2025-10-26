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

# إعداد السجلات
logging.basicConfig(
    level=logging.INFO,  # عودة إلى INFO لتقليل الرسائل
    format='%(levelname)s:%(name)s:%(message)s'
)
logger = logging.getLogger(__name__)

# إعدادات خاصة للبيئة السحابية
IS_CLOUD = os.environ.get('RAILWAY_ENVIRONMENT') or os.environ.get('PORT')
CLOUD_BATCH_SIZE = 2 if IS_CLOUD else 5  # تقليل أكثر للسحابة
CLOUD_DELAY = 1.5 if IS_CLOUD else 0.3   # تأخير أطول
CLOUD_BATCH_DELAY = 5 if IS_CLOUD else 1  # استراحة أطول بين المجموعات
CLOUD_CYCLE_DELAY = 15 if IS_CLOUD else 5  # تأخير أطول بين الدورات

if IS_CLOUD:
    logger.info("🌩️ تم اكتشاف البيئة السحابية - استخدام إعدادات محسنة جداً")
    logger.info(f"📊 إعدادات السحابة: batch={CLOUD_BATCH_SIZE}, delay={CLOUD_DELAY}s, batch_delay={CLOUD_BATCH_DELAY}s")

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
# إعدادات IQ Option
# =======================

IQ_EMAIL = "qarali131@gmail.com"
IQ_PASSWORD = "Azert@0208"

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

def connect_to_iqoption():
    """الاتصال بـ IQ Option"""
    global iq_api, connection_status
    
    if not IQ_AVAILABLE or not IQ_Option:
        logger.error("❌ مكتبة IQ Option غير متوفرة!")
        connection_status = "library_missing"
        return False
    
    try:
        logger.info("🔌 محاولة الاتصال بـ IQ Option...")
        
        iq_api = IQ_Option(IQ_EMAIL, IQ_PASSWORD)
        
        # محاولة إضافة timeout إذا كان متوفراً
        if hasattr(iq_api, 'set_session_timeout'):
            try:
                iq_api.set_session_timeout(30)
            except:
                pass
        
        check, reason = iq_api.connect()
        
        if check:
            logger.info("✅ تم الاتصال بـ IQ Option بنجاح!")
            
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
            logger.error(f"❌ فشل الاتصال: {reason}")
            connection_status = "failed"
            return False
            
    except Exception as e:
        logger.error(f"❌ خطأ في الاتصال: {e}")
        connection_status = "error"
        return False

def get_price_safe(symbol, iq_symbol):
    """جلب السعر بطريقة آمنة مع معالجة الأخطاء وإعادة الاتصال"""
    global iq_api, connection_status
    
    if not iq_api:
        return None
    
    methods = [
        ('get_candles', lambda s: iq_api.get_candles(s, 60, 1, time.time())),
        ('get_realtime_candles', lambda s: iq_api.get_realtime_candles(s, 60))
    ]
    
    for method_name, method_func in methods:
        try:
            result = method_func(iq_symbol)
            if result and len(result) > 0:
                if method_name == 'get_candles':
                    price = result[0]['close']
                    logger.info(f"📊 {symbol}: ${price} من get_candles ({iq_symbol})")
                    return float(price)
                elif method_name == 'get_realtime_candles':
                    latest = list(result.values())[-1]
                    price = latest['close']
                    logger.info(f"📊 {symbol}: ${price} من get_realtime_candles ({iq_symbol})")
                    return float(price)
        except Exception as e:
            error_msg = str(e).lower()
            # إذا كان الخطأ يتطلب إعادة اتصال
            if 'reconnect' in error_msg or 'connection' in error_msg or 'closed' in error_msg:
                logger.warning(f"🔄 اكتشاف انقطاع الاتصال في {symbol}, تعيين حالة إعادة الاتصال...")
                connection_status = "disconnected"
                return None
            logger.debug(f"⚠️ {method_name} فشل لـ {symbol}: {e}")
            continue
    
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
    """تحديث الأسعار من IQ Option مع تحسينات للبيئة السحابية"""
    global prices_cache, last_update_time, connection_status
    
    consecutive_failures = 0
    max_failures = 5  # زيادة عدد المحاولات
    reconnect_attempts = 0
    max_reconnect_attempts = 3
    
    while True:
        try:
            # محاولة الاتصال إذا لم نكن متصلين
            if connection_status != "connected":
                if reconnect_attempts >= max_reconnect_attempts:
                    logger.error("❌ تم الوصول للحد الأقصى من محاولات الاتصال، توقف مؤقت...")
                    time.sleep(300)  # توقف 5 دقائق
                    reconnect_attempts = 0
                    continue
                
                logger.info(f"🔄 محاولة الاتصال ({reconnect_attempts + 1}/{max_reconnect_attempts})...")
                if not connect_to_iqoption():
                    reconnect_attempts += 1
                    wait_time = min(30 * reconnect_attempts, 120)  # تأخير متزايد
                    logger.error(f"❌ فشل الاتصال، إعادة المحاولة خلال {wait_time} ثانية...")
                    time.sleep(wait_time)
                    continue
                else:
                    reconnect_attempts = 0  # إعادة تعيين عند نجاح الاتصال
            
            # ترتيب الرموز حسب الأولوية (الرموز المهمة أولاً)
            priority_symbols = [
                'EURUSD_otc', 'GBPUSD_otc', 'USDJPY_otc', 'AUDUSD_otc', 
                'USDCAD_otc', 'USDCHF_otc', 'EURGBP_otc', 'EURJPY_otc'
            ]
            
            # ترتيب: الرموز المهمة أولاً، ثم الباقي
            symbols_list = []
            for symbol in priority_symbols:
                if symbol in CURRENCY_SYMBOLS:
                    symbols_list.append(symbol)
            
            # إضافة باقي الرموز
            for symbol in CURRENCY_SYMBOLS.keys():
                if symbol not in symbols_list:
                    symbols_list.append(symbol)
            
            updated_count = 0
            batch_size = CLOUD_BATCH_SIZE
            total_batches = (len(symbols_list) + batch_size - 1) // batch_size
            
            logger.info(f"🔄 بدء تحديث {len(symbols_list)} رمز في {total_batches} مجموعة...")
            
            # معالجة الرموز في مجموعات صغيرة
            for batch_num, i in enumerate(range(0, len(symbols_list), batch_size)):
                batch = symbols_list[i:i + batch_size]
                logger.debug(f"📦 معالجة المجموعة {batch_num + 1}/{total_batches}: {batch}")
                
                batch_success = 0
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
                                'source': 'iqoption_cloud',
                                'is_real': True,
                                'provider': f'IQ Option Cloud ({IQ_Option.__module__})',
                                'change': change,
                                'changePercent': change_percent
                            }
                            updated_count += 1
                            batch_success += 1
                            consecutive_failures = 0
                        
                        # تأخير حسب البيئة
                        time.sleep(CLOUD_DELAY)
                        
                    except Exception as e:
                        logger.debug(f"⚠️ خطأ في جلب {symbol}: {e}")
                        # لا نتوقف، نكمل مع الرمز التالي
                
                # تقرير تقدم المجموعة
                if batch_success > 0:
                    logger.info(f"✅ المجموعة {batch_num + 1}: تم تحديث {batch_success}/{len(batch)} رمز")
                
                # استراحة بين المجموعات حسب البيئة
                if i + batch_size < len(symbols_list):
                    time.sleep(CLOUD_BATCH_DELAY)
            
            last_update_time = time.time()
            
            if updated_count > 0:
                success_rate = (updated_count / len(symbols_list)) * 100
                logger.info(f"✅ تم تحديث {updated_count}/{len(symbols_list)} سعر ({success_rate:.1f}%)")
                consecutive_failures = 0
            else:
                consecutive_failures += 1
                logger.warning(f"⚠️ لم يتم تحديث أي أسعار ({consecutive_failures}/{max_failures})")
            
            # إعادة الاتصال إذا فشل عدة مرات أو معدل النجاح منخفض
            if consecutive_failures >= max_failures or (updated_count > 0 and updated_count < len(symbols_list) * 0.3):
                logger.warning("⚠️ أداء ضعيف أو فشل متكرر، إعادة الاتصال...")
                connection_status = "disconnected"
                consecutive_failures = 0
                time.sleep(15)
                continue
            
            # تأخير متكيف حسب الأداء والبيئة
            if IS_CLOUD:
                # في البيئة السحابية: تأخير أطول وتكيف حسب معدل النجاح
                if updated_count > len(symbols_list) * 0.8:
                    sleep_time = CLOUD_CYCLE_DELAY  # أداء جيد
                elif updated_count > len(symbols_list) * 0.5:
                    sleep_time = CLOUD_CYCLE_DELAY * 1.5  # أداء متوسط
                else:
                    sleep_time = CLOUD_CYCLE_DELAY * 2  # أداء ضعيف
            else:
                sleep_time = 5 if updated_count > len(symbols_list) * 0.7 else 10
            
            logger.info(f"😴 استراحة لمدة {sleep_time:.1f} ثانية... (أداء: {updated_count}/{len(symbols_list)})")
            time.sleep(sleep_time)
            
        except Exception as e:
            logger.error(f"❌ خطأ في حلقة التحديث: {e}")
            connection_status = "error"
            consecutive_failures += 1
            time.sleep(30)  # تأخير أطول عند الخطأ

# =======================
# API Endpoints
# =======================

@app.route('/api/status')
def get_status():
    """حالة الخادم مع معلومات البيئة"""
    return jsonify({
        'connection': connection_status,
        'provider': 'iqoption_universal',
        'cached_prices': len(prices_cache),
        'total_symbols': len(CURRENCY_SYMBOLS),
        'coverage_percentage': (len(prices_cache) / len(CURRENCY_SYMBOLS)) * 100 if CURRENCY_SYMBOLS else 0,
        'last_update': last_update_time,
        'server_time': time.time(),
        'library': IQ_Option.__module__ if IQ_Option else None,
        'library_available': IQ_AVAILABLE,
        'environment': {
            'is_cloud': bool(IS_CLOUD),
            'batch_size': CLOUD_BATCH_SIZE,
            'delay': CLOUD_DELAY,
            'batch_delay': CLOUD_BATCH_DELAY
        }
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

@app.route('/api/debug')
def get_debug_info():
    """معلومات تشخيصية مفصلة"""
    # تجميع إحصائيات الأسعار
    fresh_prices = 0
    old_prices = 0
    current_time = time.time()
    
    for symbol, data in prices_cache.items():
        age = current_time - data.get('timestamp', 0)
        if age < 300:  # أقل من 5 دقائق
            fresh_prices += 1
        else:
            old_prices += 1
    
    # قائمة الرموز المفقودة
    missing_symbols = [symbol for symbol in CURRENCY_SYMBOLS.keys() if symbol not in prices_cache]
    
    return jsonify({
        'connection_status': connection_status,
        'environment': {
            'is_cloud': bool(IS_CLOUD),
            'railway_env': os.environ.get('RAILWAY_ENVIRONMENT'),
            'port_env': os.environ.get('PORT'),
            'batch_size': CLOUD_BATCH_SIZE,
            'delay': CLOUD_DELAY,
            'batch_delay': CLOUD_BATCH_DELAY,
            'cycle_delay': CLOUD_CYCLE_DELAY
        },
        'statistics': {
            'total_symbols': len(CURRENCY_SYMBOLS),
            'cached_prices': len(prices_cache),
            'fresh_prices': fresh_prices,
            'old_prices': old_prices,
            'missing_count': len(missing_symbols),
            'coverage_percentage': (len(prices_cache) / len(CURRENCY_SYMBOLS)) * 100 if CURRENCY_SYMBOLS else 0,
            'fresh_percentage': (fresh_prices / len(prices_cache)) * 100 if prices_cache else 0
        },
        'missing_symbols': missing_symbols[:10],  # أول 10 رموز مفقودة
        'last_update': last_update_time,
        'server_time': current_time,
        'library_info': {
            'available': IQ_AVAILABLE,
            'module': IQ_Option.__module__ if IQ_Option else None
        }
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
            '/api/symbols': 'List all available symbols',
            '/api/debug': 'Detailed diagnostic information'
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
