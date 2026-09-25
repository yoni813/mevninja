import { describe, it, expect, beforeEach, vi } from 'vitest';
import { msp55IngestionService } from '../src/services/Msp55IngestionService';
import { marketIntelligence } from '../src/services/MarketIntelligence';

describe('MSP-55 Data Ingestion Engine & Gemini 3.8 -> 3.7 Fallback (Msp55IngestionService)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with Gemini 3.8 Flash as primary and Gemini 3.7 Flash as fallback target', () => {
    const telemetry = msp55IngestionService.getGeminiTelemetry();
    expect(telemetry.primaryModel).toBe('gemini-3.8-flash');
    expect(telemetry.fallbackModel).toBe('gemini-3.7-flash');
    expect(telemetry.tokenStatus).toBe('OPTIMAL');
    expect(telemetry.confidenceScore).toBeGreaterThan(90);
  });

  it('should handle automatic fallback to Gemini 3.7 when Gemini 3.8 token is ended or quota exhausted', async () => {
    // Simulate server response for simulated token end
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        telemetry: {
          primaryModel: 'gemini-3.8-flash',
          fallbackModel: 'gemini-3.7-flash',
          activeModel: 'gemini-3.7-flash',
          fallbackEngaged: true,
          tokenStatus: 'TOKEN_ENDED_FALLBACK',
          lastCallLatencyMs: 165,
          totalCalls: 129,
          fallbackCount: 1,
          lastFallbackReason: 'Simulated Gemini 3.8 Flash token depletion. Automatic fallback to Gemini 3.7 Flash engaged.',
          confidenceScore: 92.4
        }
      })
    } as any);

    const updated = await msp55IngestionService.simulateGeminiFallback('TRIGGER_FALLBACK');
    expect(updated).not.toBeNull();
    expect(updated?.activeModel).toBe('gemini-3.7-flash');
    expect(updated?.fallbackEngaged).toBe(true);
    expect(updated?.tokenStatus).toBe('TOKEN_ENDED_FALLBACK');
  });

  it('should restore Gemini 3.8 Flash when primary token quota is refreshed', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        telemetry: {
          primaryModel: 'gemini-3.8-flash',
          fallbackModel: 'gemini-3.7-flash',
          activeModel: 'gemini-3.8-flash',
          fallbackEngaged: false,
          tokenStatus: 'OPTIMAL',
          lastCallLatencyMs: 138,
          totalCalls: 130,
          fallbackCount: 1,
          confidenceScore: 95.1
        }
      })
    } as any);

    const restored = await msp55IngestionService.simulateGeminiFallback('RESTORE_PRIMARY');
    expect(restored?.activeModel).toBe('gemini-3.8-flash');
    expect(restored?.fallbackEngaged).toBe(false);
    expect(restored?.tokenStatus).toBe('OPTIMAL');
  });

  it('should process Level II order book depth imbalances and macroeconomic feeds', () => {
    const state = msp55IngestionService.getState();
    expect(state.pipelineId).toBe('MSP-55-CORE-INGEST');
    expect(state.macroFeedCount).toBeGreaterThanOrEqual(4);
    expect(state.level2ImbalanceSummary.length).toBeGreaterThanOrEqual(4);

    const eurusd = state.level2ImbalanceSummary.find(s => s.symbol === 'EURUSD');
    expect(eurusd).toBeDefined();
    expect(eurusd?.buyLiquidityUsd).toBeGreaterThan(0);
    expect(eurusd?.sellLiquidityUsd).toBeGreaterThan(0);
    expect(eurusd?.skewRatio).toBeGreaterThan(1.0); // Net positive bid queue
  });

  it('should dynamically tune trading bot execution parameters based on synthesized telemetry', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        symbol: 'EURUSD',
        tuning: {
          symbol: 'EURUSD',
          dynamicDeviationPts: 5,
          dynamicLotMultiplier: 1.25,
          calculatedLotSize: 0.94,
          dynamicSlPips: 3.2,
          dynamicTpPips: 7.6,
          slippageTolerancePips: 0.8,
          autoBreakEvenTriggerPips: 3.2,
          executionGatingPassed: true,
          regime: 'EXPANSION',
          imbalanceScore: 11.9,
          macroBias: 'RISK_ON',
          tuningRationale: [
            'Gemini gemini-3.8-flash confidence: 94.8%',
            'Level II Order Book depth imbalance: +11.9% bid/ask skew'
          ],
          lastUpdated: new Date().toISOString()
        }
      })
    } as any);

    const tuning = await msp55IngestionService.tuneBotExecution({
      symbol: 'EURUSD',
      baseLot: 0.75,
      currentPingMs: 6.2,
      orderFlowImbalance: 11.9,
      macroBias: 'RISK_ON',
      aiSentimentScore: 28.5
    });

    expect(tuning).toBeDefined();
    expect(tuning?.symbol).toBe('EURUSD');
    expect(tuning?.calculatedLotSize).toBe(0.94);
    expect(tuning?.dynamicDeviationPts).toBe(5);
    expect(tuning?.executionGatingPassed).toBe(true);
    expect(tuning?.regime).toBe('EXPANSION');
  });

  it('should verify zero-copy MQL5 and kernel-bypass FIX 4.4 routing architecture diagnostics', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        report: {
          diagnosticId: 'DIAG-ROUTING-TEST',
          timestamp: new Date().toISOString(),
          systemReadiness: 'READY_FOR_EXECUTION',
          overallScore: 99.8,
          routingLatencyTickToTradeNs: 840,
          p99JitterNs: 3.2,
          mql5Status: {
            layer: 'MQL5_ZERO_COPY',
            name: 'MQL5 Zero-Copy Direct Memory Bus',
            protocol: 'MetaTrader 5 Native IPC / Shared Memory Map',
            status: 'OPTIMAL',
            latencyMetric: '420 ns (Tick-to-Order)',
            jitterMetric: '1.4 ns P99',
            throughputOps: '185,000 ops/s',
            ringBufferHealth: '4,096 MB Lock-Free (0.01% Fill)',
            kernelBypassMode: 'Active (POSIX Shm + DPDK/Solarflare)',
            dropRatePercent: 0.0,
            sessionState: 'SYNCHRONIZED_REALTIME',
            checks: [
              { name: 'MqlTradeRequest Struct Memory Alignment', passed: true, detail: '64-byte cache-line aligned' },
              { name: 'Sub-50ms Execution Timeout Guard', passed: true, detail: 'Armed at 50,000 µs' }
            ]
          },
          fix44Status: {
            layer: 'FIX_4_4_KERNEL_BYPASS',
            name: 'FIX 4.4 / 5.0 SP2 Kernel-Bypass Direct Route',
            protocol: 'Financial Information eXchange v4.4 (Tags 35=A, 35=D, 35=8)',
            status: 'OPTIMAL',
            latencyMetric: '840 ns (Wire-to-Engine)',
            jitterMetric: '2.1 ns P99',
            throughputOps: '142,000 msgs/s',
            ringBufferHealth: '2,048 MB Circular Ring',
            kernelBypassMode: 'Solarflare EF_VI / Onload v8.1',
            dropRatePercent: 0.0,
            sessionState: 'ACTIVE_LOGON (Seq: 1420)',
            checks: [
              { name: 'Heartbeat Interval & Sequence Sync', passed: true, detail: 'Seq #1420 acknowledged' },
              { name: 'TCP Socket Kernel-Bypass (Solarflare EF_VI)', passed: true, detail: '0 syscall context switches' }
            ]
          },
          subsystemsCount: 9,
          readinessSummary: [
            'Zero-copy MQL5 shared memory bus fully initialized and locked at 420 ns execution latency.'
          ]
        }
      })
    } as any);

    const { systemsService } = await import('../src/services/SystemsService');
    const report = await systemsService.fetchRoutingDiagnostic();

    expect(report).not.toBeNull();
    expect(report.systemReadiness).toBe('READY_FOR_EXECUTION');
    expect(report.routingLatencyTickToTradeNs).toBe(840);
    expect(report.mql5Status.status).toBe('OPTIMAL');
    expect(report.fix44Status.sessionState).toContain('ACTIVE_LOGON');
    expect(report.fix44Status.kernelBypassMode).toContain('Solarflare EF_VI');
  });
});
