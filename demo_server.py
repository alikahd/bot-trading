"""
🎯 Demo Binary Options Server
============================
خادم تجريبي بأسعار واقعية محاكاة
بدون الحاجة لمكتبات خارجية معقدة

يولد أسعار واقعية لأزواج العملات
مع تقلبات طبيعية ومؤشرات فنية
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import time
import random
import math
import threading
from datetime import datetime

app = Flask(__name__)
CORS(app)

# =======================
# بيانات الأسعار المحاكاة
# =======================

# الأسعار الأساسية (قريبة من الواقع)
BASE_PRICES = {
    'EURUSD': 1.0850,
    'EURUSD_otc': 1.0850,
    'GBPUSD': 1.2750,
    'GBPUSD_otc': 1.2750,
    'USDJPY': 149.50,
    'USDJPY_otc': 149.50,
    'AUDUSD': 0.6650,
    'AUDUSD_otc': 0.6650,
    'USDCAD': 1.3580,
    'USDCAD_otc': 1.3580,
    'USDCHF': 0.9120,
    'USDCHF_otc': 0.9120,
}

# كاش الأسعار الحالية
current_prices = {}
price_history = {}
available_assets = set()

# =======================
# مولد الأسعار الواقعية
# =======================

def generate_realistic_price(symbol, base_price, time_factor):
    """توليد سعر واقعي مع تقلبات طبيعية"""
    
    # تقلبات مختلفة حسب الزوج
    volatility = {
        'EURUSD': 0.0001,
        'GBPUSD': 0.0002,
        'USDJPY': 0.01,
        'AUDUSD': 0.0002,
        'USDCAD': 0.0001,
        'USDCHF': 0.0001,
    }.get(symbol.replace('_otc', ''), 0.0001)
    
    # موجة سينوسية للاتجاه العام
    trend = math.sin(time_factor * 0.01) * volatility * 5
    
    # ضوضاء عشوائية
    noise = random.gauss(0, volatility)
    
    # تقلبات دقيقة
    micro_movement = random.gauss(0, volatility * 0.3)
    
    # السعر الجديد
    new_price = base_price + trend + noise + micro_movement
    
    # تقريب حسب نوع الزوج
    if 'JPY' in symbol:
        return round(new_price, 2)
    else:
        return round(new_price, 5)

def generate_candle_data(symbol, duration, count):
    """توليد بيانات شموع واقعية"""
    candles = []
    base_price = BASE_PRICES.get(symbol.replace('_otc', ''), 1.0)
    
    current_time = int(time.time())
    
    for i in range(count):
        timestamp = current_time - (duration * (count - i))
        
        # سعر الافتتاح
        open_price = generate_realistic_price(symbol, base_price, timestamp)
        
        # تقلبات خلال الفترة
        high_offset = random.uniform(0, 0.0005)
        low_offset = random.uniform(0, 0.0005)
        
        high_price = open_price + high_offset
        low_price = open_price - low_offset
        
        # سعر الإغلاق (قريب من الافتتاح)
        close_change = random.gauss(0, 0.0002)
        close_price = open_price + close_change
        
        # التأكد من أن High/Low منطقيين
        high_price = max(high_price, open_price, close_price) + random.uniform(0, 0.0001)
        low_price = min(low_price, open_price, close_price) - random.uniform(0, 0.0001)
        
        # حجم التداول المحاكي
        volume = random.randint(100, 1000)
        
        candle = {
            "timestamp": timestamp,
            "open": round(open_price, 5),
            "high": round(high_price, 5),
            "low": round(low_price, 5),
            "close": round(close_price, 5),
            "volume": volume
        }
        
        candles.append(candle)
        base_price = close_price  # السعر التالي يبدأ من إغلاق السابق
    
    return candles

def update_prices():
    """تحديث الأسعار بشكل دوري"""
    global current_prices, available_assets
    
    while True:
        try:
            current_time = time.time()
            
            for symbol, base_price in BASE_PRICES.items():
                # توليد سعر جديد
                new_price = generate_realistic_price(symbol, base_price, current_time)
                
                # تحديث الكاش
                current_prices[symbol] = {
                    'price': new_price,
                    'timestamp': current_time,
                    'symbol': symbol
                }
                
                # إضافة للأصول المتاحة
                available_assets.add(symbol)
                
                # حفظ في التاريخ
                if symbol not in price_history:
                    price_history[symbol] = []
                
                price_history[symbol].append({
                    'price': new_price,
                    'timestamp': current_time
                })
                
                # الاحتفاظ بآخر 1000 نقطة فقط
                if len(price_history[symbol]) > 1000:
                    price_history[symbol] = price_history[symbol][-1000:]
            
            print(f"✅ تم تحديث {len(current_prices)} سعر - {datetime.now().strftime('%H:%M:%S')}")
            
        except Exception as e:
            print(f"❌ خطأ في تحديث الأسعار: {e}")
        
        time.sleep(2)  # تحديث كل ثانيتين

# =======================
# API Endpoints
# =======================

@app.route('/api/status')
def get_status():
    """حالة الخادم"""
    return jsonify({
        'connection': 'stable',
        'provider': 'demo_simulator',
        'available_assets': list(available_assets),
        'cached_prices': len(current_prices),
        'last_update': time.time(),
        'server_time': time.time(),
        'mode': 'demo_binary_options'
    })

@app.route('/api/available')
def get_available():
    """الأصول المتاحة"""
    return jsonify(list(available_assets))

@app.route('/api/price/<symbol>')
def get_price(symbol):
    """سعر أصل معين"""
    if symbol in current_prices:
        return jsonify(current_prices[symbol])
    else:
        return jsonify({'error': 'Asset not available'}), 404

@app.route('/api/candles/<symbol>')
def get_candles(symbol):
    """شموع أصل معين"""
    duration = int(request.args.get('duration', 60))
    count = int(request.args.get('count', 100))
    
    try:
        candles = generate_candle_data(symbol, duration, count)
        return jsonify(candles)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/')
def home():
    """الصفحة الرئيسية"""
    return jsonify({
        'service': 'Demo Binary Options Backend API',
        'version': '1.0.0',
        'status': 'running',
        'provider': 'demo_simulator',
        'note': 'This is a demo server with realistic simulated data',
        'endpoints': {
            '/api/status': 'حالة الاتصال',
            '/api/available': 'الأصول المتاحة',
            '/api/price/<symbol>': 'سعر أصل',
            '/api/candles/<symbol>?duration=60&count=100': 'بيانات الشموع'
        }
    })

# =======================
# بدء الخادم
# =======================

if __name__ == '__main__':
    print("🎯 بدء خادم Demo Binary Options...")
    print("📊 توليد أسعار واقعية محاكاة...")
    
    # بدء تحديث الأسعار في خيط منفصل
    price_thread = threading.Thread(target=update_prices, daemon=True)
    price_thread.start()
    
    # انتظار ثانيتين لتوليد البيانات الأولية
    time.sleep(2)
    
    print("🚀 بدء الخادم على http://localhost:5000")
    print("💡 افتح المتصفح على http://localhost:5173")
    print("🎯 هذا خادم تجريبي بأسعار محاكاة واقعية")
    
    app.run(host='0.0.0.0', port=5000, debug=False)
