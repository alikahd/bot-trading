export interface Asset {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export interface Signal {
  id: string;
  asset: string;
  type: 'CALL' | 'PUT';
  confidence: number;
  timestamp: Date;
  price: number;
  indicators: {
    rsi: number;
    macd: number;
    bollinger: 'upper' | 'middle' | 'lower';
  };
}

export interface Trade {
  id: string;
  asset: string;
  type: 'CALL' | 'PUT';
  amount: number;
  openPrice: number;
  closePrice?: number;
  timestamp: Date;
  closeTime?: Date;
  status: 'OPEN' | 'WIN' | 'LOSS';
  profit?: number;
}

export interface Strategy {
  id: string;
  name: string;
  enabled: boolean;
  rsiThreshold: number;
  macdThreshold: number;
  tradeAmount: number;
  maxDailyTrades: number;
  stopLoss: number;
  takeProfit: number;
}