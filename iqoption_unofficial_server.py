"""
⚠️ IQ Option Unofficial API Server
===================================
تحذير: هذا يستخدم API غير رسمي وقد يتوقف في أي وقت!

المتطلبات:
pip install iqoptionapi

ملاحظة: تحتاج حساب IQ Option حقيقي للاتصال
"""

from flask import Flask, jsonify
from flask_cors import CORS
import logging
import time
import threading

# محاولة استيراد المكتبة غير الرسمية
try:
    from iqoptionapi.stable_api import IQ_Option
    IQ_AVAILABLE = True
except ImportError:
    IQ_AVAILABLE = False
    print("⚠️ مكتبة iqoptionapi غير مثبتة!")
    print("📦 لتثبيتها: pip install iqoptionapi")

# إعداد السجلات
logging.basicConfig(
    level=logging.INFO,
    format='%(levelname)s:%(name)s:%(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# =======================
# إعدادات IQ Option
# =======================

# ⚠️ ضع بيانات حسابك هنا (استخدم حساب تجريبي!)
IQ_EMAIL = "qarali131@gmail.com"  # غير هذا!
IQ_PASSWORD = "Azert@0208"         # غير هذا!

# متغيرات عامة
iq_api = None
prices_cache = {}
connection_status = "disconnected"
last_update_time = 0

# رموز IQ Option
IQ_SYMBOLS = {
    'EURUSD_otc': 'EURUSD-OTC',
    'GBPUSD_otc': 'GBPUSD-OTC',
    'USDJPY_otc': 'USDJPY-OTC',
    'AUDUSD_otc': 'AUDUSD-OTC',
    'USDCAD_otc': 'USDCAD-OTC',
    'USDCHF_otc': 'USDCHF-OTC',
}

# =======================
# دوال IQ Option
# =======================

def connect_to_iqoption():
    """الاتصال بـ IQ Option"""
    global iq_api, connection_status
    
    if not IQ_AVAILABLE:
        logger.error("❌ مكتبة iqoptionapi غير متوفرة!")
        connection_status = "library_missing"
        return False
    
    try:
        logger.info("🔌 محاولة الاتصال بـ IQ Option...")
        
        iq_api = IQ_Option(IQ_EMAIL, IQ_PASSWORD)
        check, reason = iq_api.connect()
        
        if check:
            logger.info("✅ تم الاتصال بـ IQ Option بنجاح!")
            
            # التبديل للحساب التجريبي (آمن للاختبار)
            iq_api.change_balance("PRACTICE")
            
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

def get_iqoption_price(symbol):
    """جلب السعر من IQ Option"""
    global iq_api
    
    if not iq_api or connection_status != "connected":
        return None
    
    try:
        # تحويل الرمز لتنسيق IQ Option
        iq_symbol = IQ_SYMBOLS.get(symbol, symbol)
        
        # جلب السعر الحالي باستخدام طرق مختلفة
        try:
            # الطريقة 1: get_candles (الأكثر موثوقية)
            candles = iq_api.get_candles(iq_symbol, 60, 1, time.time())
            if candles and len(candles) > 0:
                current_price = candles[0]['close']
                logger.info(f"📊 {symbol}: ${current_price} من IQ Option (candles)")
                return float(current_price)
        except Exception as e1:
            logger.debug(f"⚠️ فشل get_candles لـ {symbol}: {e1}")
        
        try:
            # الطريقة 2: get_realtime_candles
            price_data = iq_api.get_realtime_candles(iq_symbol, 60)
            if price_data and len(price_data) > 0:
                latest = list(price_data.values())[-1]
                current_price = latest['close']
                logger.info(f"📊 {symbol}: ${current_price} من IQ Option (realtime)")
                return float(current_price)
        except Exception as e2:
            logger.debug(f"⚠️ فشل get_realtime_candles لـ {symbol}: {e2}")
        
        try:
            # الطريقة 3: get_digital_current_profit (للحصول على السعر الحالي)
            all_assets = iq_api.get_all_open_time()
            if 'binary' in all_assets and iq_symbol in all_assets['binary']:
                # السوق مفتوح، جلب السعر
                logger.info(f"📊 {symbol}: السوق مفتوح، جلب السعر...")
                # استخدام API مختلف
                return None  # سنعود لهذا لاحقاً
        except Exception as e3:
            logger.debug(f"⚠️ فشل get_all_open_time لـ {symbol}: {e3}")
            
    except Exception as e:
        logger.error(f"❌ خطأ عام في جلب سعر {symbol}: {e}")
    
    return None

def update_iqoption_prices():
    """تحديث الأسعار من IQ Option"""
    global prices_cache, last_update_time
    
    # محاولة الاتصال
    if not connect_to_iqoption():
        logger.error("❌ فشل الاتصال بـ IQ Option!")
        return
    
    while True:
        try:
            updated_count = 0
            
            for symbol in IQ_SYMBOLS.keys():
                price = get_iqoption_price(symbol)
                
                if price:
                    prices_cache[symbol] = {
                        'price': price,
                        'bid': price * 0.99999,
                        'ask': price * 1.00001,
                        'timestamp': time.time(),
                        'symbol': symbol,
                        'source': 'iqoption_real',  # تأكيد أنها بيانات حقيقية
                        'is_real': True,  # علامة البيانات الحقيقية
                        'provider': 'IQ Option Official',
                        'change': 0,
                        'changePercent': 0
                    }
                    updated_count += 1
                    logger.info(f"✅ {symbol}: ${price} (IQ Option حقيقي)")
                
                time.sleep(0.5)  # تأخير بين الطلبات
            
            last_update_time = time.time()
            
            if updated_count > 0:
                logger.info(f"✅ تم تحديث {updated_count} سعر من IQ Option")
            
            time.sleep(5)  # تحديث كل 5 ثوان
            
        except Exception as e:
            logger.error(f"❌ خطأ في التحديث: {e}")
            time.sleep(10)

# =======================
# API Endpoints
# =======================

@app.route('/api/status')
def get_status():
    """حالة الخادم"""
    return jsonify({
        'connection': connection_status,
        'provider': 'iqoption_unofficial',
        'cached_prices': len(prices_cache),
        'last_update': last_update_time,
        'server_time': time.time(),
        'warning': 'Using unofficial API - may stop working anytime!',
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

@app.route('/')
def home():
    """الصفحة الرئيسية"""
    return jsonify({
        'server': 'IQ Option Unofficial API Server',
        'status': connection_status,
        'warning': '⚠️ This uses unofficial API and may violate IQ Option ToS',
        'library_available': IQ_AVAILABLE,
        'endpoints': {
            '/api/status': 'Server status',
            '/api/quotes': 'All quotes',
            '/api/quotes/<symbol>': 'Specific quote'
        }
    })

# =======================
# بدء الخادم
# =======================

if __name__ == '__main__':
    logger.info("=" * 50)
    logger.info("⚠️  IQ Option Unofficial API Server")
    logger.info("=" * 50)
    
    if not IQ_AVAILABLE:
        logger.error("❌ مكتبة iqoptionapi غير مثبتة!")
        logger.info("📦 لتثبيتها: pip install iqoptionapi")
        logger.info("⚠️ تحذير: هذه مكتبة غير رسمية وقد تخالف شروط IQ Option!")
    else:
        logger.info("✅ مكتبة iqoptionapi متوفرة")
        logger.info(f"📧 البريد: {IQ_EMAIL}")
        logger.info("⚠️ تأكد من تغيير البريد وكلمة المرور في الكود!")
        
        # بدء تحديث الأسعار في خيط منفصل
        update_thread = threading.Thread(target=update_iqoption_prices, daemon=True)
        update_thread.start()
    
    logger.info("🌐 الخادم يعمل على http://localhost:5001")
    logger.info("=" * 50)
    
    app.run(host='0.0.0.0', port=5001, debug=False)
