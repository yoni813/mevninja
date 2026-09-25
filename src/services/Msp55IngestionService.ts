import { Msp55IngestionState, DynamicBotTuningParameters, GeminiModelTelemetry } from '../types';

class Msp55IngestionService {
  private state: Msp55IngestionState = {
    pipelineId: 'MSP-55-CORE-INGEST',
    status: 'OPTIMAL',
    ingestionRateTps: 1485,
    avgPipelineLatencyUs: 64,
    geminiTelemetry: {
      primaryModel: 'gemini-3.8-flash',
      fallbackModel: 'gemini-3.7-flash',
      activeModel: 'gemini-3.8-flash',
      fallbackEngaged: false,
      tokenStatus: 'OPTIMAL',
      lastCallLatencyMs: 142,
      totalCalls: 128,
      fallbackCount: 0,
      confidenceScore: 94.8
    },
    macroFeedCount: 6,
    macroHeadlineBias: 'Fed Easing & Disinflation Cycle Active',
    level2ImbalanceSummary: [
      { symbol: 'EURUSD', imbalance: 11.9, buyLiquidityUsd: 13500000, sellLiquidityUsd: 10600000, skewRatio: 1.27 },
      { symbol: 'GBPUSD', imbalance: -9.6, buyLiquidityUsd: 7900000, sellLiquidityUsd: 9550000, skewRatio: 0.83 },
      { symbol: 'BTCUSD', imbalance: 9.2, buyLiquidityUsd: 120500000, sellLiquidityUsd: 99800000, skewRatio: 1.21 },
      { symbol: 'XAUUSD', imbalance: -3.2, buyLiquidityUsd: 22600000, sellLiquidityUsd: 24100000, skewRatio: 0.94 }
    ],
    activeBotTunings: {
      EURUSD: {
        symbol: 'EURUSD',
        dynamicDeviationPts: 5,
        dynamicLotMultiplier: 1.18,
        calculatedLotSize: 0.89,
        dynamicSlPips: 3.2,
        dynamicTpPips: 7.6,
        slippageTolerancePips: 0.8,
        autoBreakEvenTriggerPips: 3.2,
        executionGatingPassed: true,
        regime: 'EXPANSION',
        imbalanceScore: 11.9,
        macroBias: 'RISK_ON',
        tuningRationale: [
          'Gemini gemini-3.8-flash (Primary active @ 142ms) confidence: 94.8%',
          'Level II Order Book depth imbalance: +11.9% bid/ask skew',
          'Macroeconomic regime: RISK_ON (Fed benchmark 4.75%, Core CPI 2.8% disinflation)',
          'Dynamic lot scaling: 1.18x (Allocated: 0.89 lots)',
          'Execution gating: Sub-50ms window primed with 5 points dynamic deviation'
        ],
        lastUpdated: new Date().toISOString()
      }
    },
    lastIngestTimestamp: new Date().toISOString()
  };

  private listeners: Set<() => void> = new Set();
  private isFetching = false;
  private pollInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.fetchTelemetry();
      this.pollInterval = setInterval(() => {
        this.fetchTelemetry();
      }, 4000);
    }
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }

  public getState(): Msp55IngestionState {
    return { ...this.state };
  }

  public getGeminiTelemetry(): GeminiModelTelemetry {
    return { ...this.state.geminiTelemetry };
  }

  public getTuningForSymbol(symbol: string): DynamicBotTuningParameters | undefined {
    return this.state.activeBotTunings[symbol];
  }

  public async fetchTelemetry(): Promise<Msp55IngestionState> {
    if (this.isFetching) return this.state;
    this.isFetching = true;

    try {
      const res = await fetch('/api/msp55/telemetry');
      if (res.ok) {
        const data = await res.json();
        this.state = data;
        this.notify();
      }
    } catch (err) {
      console.warn('[Msp55IngestionService] Telemetry fetch warning:', err);
    } finally {
      this.isFetching = false;
    }

    return this.state;
  }

  public async tuneBotExecution(params: {
    symbol: string;
    baseLot?: number;
    currentPingMs?: number;
    orderFlowImbalance?: number;
    macroBias?: 'RISK_ON' | 'NEUTRAL' | 'RISK_OFF';
    aiSentimentScore?: number;
  }): Promise<DynamicBotTuningParameters | null> {
    try {
      const res = await fetch('/api/msp55/tune-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.tuning) {
          this.state.activeBotTunings[params.symbol] = data.tuning;
          this.notify();
          return data.tuning;
        }
      }
    } catch (err) {
      console.warn('[Msp55IngestionService] Tune bot execution error:', err);
    }
    return null;
  }

  public async simulateGeminiFallback(action: 'TRIGGER_FALLBACK' | 'RESTORE_PRIMARY'): Promise<GeminiModelTelemetry | null> {
    try {
      const res = await fetch('/api/msp55/simulate-gemini-fallback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.telemetry) {
          this.state.geminiTelemetry = data.telemetry;
          this.notify();
          return data.telemetry;
        }
      }
    } catch (err) {
      console.warn('[Msp55IngestionService] Gemini fallback simulation error:', err);
    }
    return null;
  }
}

export const msp55IngestionService = new Msp55IngestionService();
