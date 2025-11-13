import WebSocket from 'ws';

// جلب السعر الحقيقي من Binary.com WebSocket
export async function getBinaryPrice(symbol) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
    
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error('Timeout'));
    }, 15000); // زيادة إلى 15 ثانية
    
    ws.on('open', () => {
      ws.send(JSON.stringify({ ticks: symbol, subscribe: 1 }));
    });
    
    ws.on('message', (data) => {
      try {
        const response = JSON.parse(data.toString());
        
        if (response.tick) {
          clearTimeout(timeout);
          ws.close();
          resolve(response.tick.quote);
        }
        
        if (response.error) {
          clearTimeout(timeout);
          ws.close();
          reject(new Error(response.error.message));
        }
      } catch (error) {
        clearTimeout(timeout);
        ws.close();
        reject(error);
      }
    });
    
    ws.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

// جلب بيانات تاريخية من Binary.com مع إعادة المحاولة
export async function getHistoricalData(symbol, count = 100, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const data = await getHistoricalDataSingle(symbol, count);
      return data;
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      // انتظار قبل إعادة المحاولة
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
}

// دالة مساعدة لجلب البيانات مرة واحدة
function getHistoricalDataSingle(symbol, count = 100) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
    const prices = [];
    
    const timeout = setTimeout(() => {
      ws.close();
      if (prices.length > 0) {
        resolve(prices);
      } else {
        reject(new Error('Timeout - no data received'));
      }
    }, 20000); // زيادة إلى 20 ثانية للبيانات التاريخية
    
    ws.on('open', () => {
      ws.send(JSON.stringify({ 
        ticks_history: symbol,
        count: count,
        end: 'latest',
        style: 'ticks'
      }));
    });
    
    ws.on('message', (data) => {
      try {
        const response = JSON.parse(data.toString());
        
        if (response.history) {
          clearTimeout(timeout);
          ws.close();
          resolve(response.history.prices.map(p => parseFloat(p)));
        }
        
        if (response.error) {
          clearTimeout(timeout);
          ws.close();
          reject(new Error(response.error.message));
        }
      } catch (error) {
        clearTimeout(timeout);
        ws.close();
        reject(error);
      }
    });
    
    ws.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}
