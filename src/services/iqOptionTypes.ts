/**
 * 🎯 IQ Option Types - Simple Type Definitions
 * ============================================
 * تعريفات الأنواع فقط - بدون تعقيدات
 */

export interface IQOptionQuote {
  symbol: string;
  bid: number;
  ask: number;
  price: number;
  timestamp: number;
  change: number;
  changePercent: number;
}

export interface IQOptionCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
