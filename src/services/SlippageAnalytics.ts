import { SlippageHeatmapCell } from '../types';

export const ASSET_CLASSES = [
  { id: 'fx_majors', name: 'FX Majors', sub: 'EURUSD, USDJPY, GBPUSD' },
  { id: 'fx_crosses', name: 'FX Crosses', sub: 'EURGBP, AUDCAD, NZDUSD' },
  { id: 'crypto', name: 'Crypto Pairs', sub: 'BTCUSD, ETHUSD, SOLUSD' },
  { id: 'commodities', name: 'Commodities', sub: 'XAUUSD, WTI, XAGUSD' },
  { id: 'indices', name: 'Equity Indices', sub: 'US100, SPX500, GER40' },
];

export const LATENCY_TIERS = [
  { id: 't1', label: '< 10ms', min: 0, max: 10, desc: 'Ultra-Low DMA' },
  { id: 't2', label: '10 - 25ms', min: 10, max: 25, desc: 'Co-Located FIX' },
  { id: 't3', label: '25 - 50ms', min: 25, max: 50, desc: 'Cross-Region WAN' },
  { id: 't4', label: '50 - 100ms', min: 50, max: 100, desc: 'Buffer Congestion' },
  { id: 't5', label: '> 100ms', min: 100, max: 999, desc: 'Critical Spike' },
];

export function getActiveLatencyTier(latencyMs: number): string {
  if (latencyMs < 10) return '< 10ms';
  if (latencyMs <= 25) return '10 - 25ms';
  if (latencyMs <= 50) return '25 - 50ms';
  if (latencyMs <= 100) return '50 - 100ms';
  return '> 100ms';
}

class SlippageAnalyticsService {
  private baseMatrix: SlippageHeatmapCell[] = [];
  private listeners: Set<() => void> = new Set();
  private timer: ReturnType<typeof setInterval> | null = null;
  private currentPing: number = 14;

  constructor() {
    this.initMatrix();
    this.startMicroVariations();
  }

  private initMatrix() {
    const routes: Record<string, string[]> = {
      'FX Majors': ['LD4 Slough', 'NY4 Secaucus', 'TY3 Tokyo', 'FR2 Frankfurt', 'HK1 Hong Kong'],
      'FX Crosses': ['LD4 Slough', 'NY4 Secaucus', 'SG1 Singapore', 'FR2 Frankfurt', 'ZH1 Zurich'],
      'Crypto Pairs': ['AWS us-east-1', 'Deribit Tokyo', 'Binance Tokyo Direct', 'FTX Coloc', 'Dublin WAN'],
      'Commodities': ['CME Aurora', 'LD4 LME Direct', 'NYMEX Secaucus', 'Zurich Vault', 'Singapore Hub'],
      'Equity Indices': ['CME Aurora', 'NASDAQ Carteret', 'Eurex Frankfurt', 'ICE Mahwah', 'London LSE'],
    };

    // Baseline multipliers per asset class (volatility & depth characteristics)
    const assetMultipliers: Record<string, { baseSlip: number; p95Factor: number; fillDrop: number }> = {
      'FX Majors': { baseSlip: 0.18, p95Factor: 1.8, fillDrop: 0.05 },
      'FX Crosses': { baseSlip: 0.42, p95Factor: 2.1, fillDrop: 0.08 },
      'Crypto Pairs': { baseSlip: 0.95, p95Factor: 2.8, fillDrop: 0.16 },
      'Commodities': { baseSlip: 0.55, p95Factor: 2.3, fillDrop: 0.11 },
      'Equity Indices': { baseSlip: 0.38, p95Factor: 2.0, fillDrop: 0.09 },
    };

    const cells: SlippageHeatmapCell[] = [];

    ASSET_CLASSES.forEach((ac) => {
      const config = assetMultipliers[ac.name];

      LATENCY_TIERS.forEach((tier, tierIdx) => {
        // Higher tier index = dramatically higher slippage and tail risk
        const tierMultiplier = Math.pow(1.85, tierIdx);
        const avgSlippage = Number((config.baseSlip * tierMultiplier).toFixed(2));
        const p95Slippage = Number((avgSlippage * config.p95Factor).toFixed(2));
        const fillRate = Number(Math.max(68, 99.8 - tierIdx * 100 * config.fillDrop).toFixed(1));
        const sampleCount = Math.floor(4500 / (tierIdx + 1) + Math.random() * 200);

        cells.push({
          assetClass: ac.name,
          assetClassSub: ac.sub,
          latencyTier: tier.label,
          latencyMin: tier.min,
          latencyMax: tier.max,
          avgSlippagePts: avgSlippage,
          p95SlippagePts: p95Slippage,
          fillRatePct: fillRate,
          sampleCount,
          recommendedRoute: routes[ac.name][tierIdx] || 'Global FIX Mesh',
        });
      });
    });

    this.baseMatrix = cells;
  }

  public setLatency(latencyMs: number) {
    this.currentPing = latencyMs;
  }

  public getMatrix(): SlippageHeatmapCell[] {
    return [...this.baseMatrix];
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  private startMicroVariations() {
    this.timer = setInterval(() => {
      // Simulate slight micro-fluctuations in active tiers to represent live order book depth shifts
      const activeTier = getActiveLatencyTier(this.currentPing);

      this.baseMatrix = this.baseMatrix.map((cell) => {
        // Cells in the active tier fluctuate more dynamically
        const isActive = cell.latencyTier === activeTier;
        const drift = (Math.random() - 0.48) * (isActive ? 0.04 : 0.015);
        const newAvg = Math.max(0.08, Number((cell.avgSlippagePts + drift).toFixed(2)));
        const newP95 = Number((newAvg * (1.7 + Math.random() * 0.4)).toFixed(2));
        const newSample = cell.sampleCount + (isActive && Math.random() > 0.4 ? 1 : 0);

        return {
          ...cell,
          avgSlippagePts: newAvg,
          p95SlippagePts: newP95,
          sampleCount: newSample,
        };
      });

      this.notify();
    }, 1500);
  }

  public recordLiveExecution(assetClass: string, ping: number, actualDeviationApplied: number) {
    const tier = getActiveLatencyTier(ping);
    const cell = this.baseMatrix.find((c) => c.assetClass === assetClass && c.latencyTier === tier);
    if (cell) {
      cell.sampleCount += 1;
      // Exponential moving average update
      cell.avgSlippagePts = Number((cell.avgSlippagePts * 0.95 + actualDeviationApplied * 0.05).toFixed(2));
      this.notify();
    }
  }
}

export const slippageAnalytics = new SlippageAnalyticsService();
