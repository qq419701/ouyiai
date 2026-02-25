import { CoinSymbol, RiskLevel, OrderStatus } from '../../utils/types';

export interface OrderParams {
  accountId: string;
  coin: CoinSymbol;
  side: 'buy' | 'sell';
  sizeUSDT: number;
  price?: number;
  riskLevel: RiskLevel;
  analysisId?: string;
  maxSlippagePct: number;
  batchCount: number;
  batchIntervalSec: number;
}

export interface OrderResult {
  clOrdId: string;
  orderId?: string;
  status: OrderStatus;
  filledSize?: number;
  avgFillPrice?: number;
  actualSlippage?: number;
  errorMessage?: string;
}

export interface BatchOrderResult {
  allResults: OrderResult[];
  totalFilled: number;
  avgPrice: number;
  success: boolean;
}
