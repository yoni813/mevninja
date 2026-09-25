import { describe, it, expect } from 'vitest';
import { executionEngine } from '../src/services/ExecutionEngine';

describe('S.H.A.F.T. Execution Engine & MQL5 Protocol Bridge (ExecutionEngine.ts)', () => {
  it('should dynamically adapt deviation in points based on terminal ping (TERMINAL_PING)', () => {
    // Equinix ZA-JNB Baseline (6.2ms) -> 5 points (0.5 pips)
    expect(executionEngine.calculateDynamicDeviation(6.2)).toBe(5);
    // Low latency ECN (12ms) -> 8 points (0.8 pips)
    expect(executionEngine.calculateDynamicDeviation(12.0)).toBe(8);
    // Elevated latency (25ms) -> 10 points (1.0 pip max cap)
    expect(executionEngine.calculateDynamicDeviation(25.0)).toBe(10);
    // Severe spike (80ms) -> Capped strictly at 10 points
    expect(executionEngine.calculateDynamicDeviation(80.0)).toBe(10);
  });

  it('should construct compliant MqlTradeRequest structs', () => {
    executionEngine.setPing(6.2);
    const request = executionEngine.createTradeRequest('EURUSD', 'ORDER_TYPE_BUY', 2.5, 1.08450);

    expect(request.action).toBe('TRADE_ACTION_DEAL');
    expect(request.magic).toBe(20260316);
    expect(request.symbol).toBe('EURUSD');
    expect(request.volume).toBe(2.5);
    expect(request.type).toBe('ORDER_TYPE_BUY');
    expect(request.deviation).toBe(5);
    expect(request.stoploss).toBeLessThan(request.price);
    expect(request.takeprofit).toBeGreaterThan(request.price);
    expect(request.typeing).toBe('ORDER_TIME_GTC');
  });

  it('should calculate dynamic lot sizes strictly within 0.5% - 1.0% equity risk boundaries', () => {
    const equity = 100000;
    // 0.5% risk on $100k = $500 risk amount; 10 pips stop = 5.0 lots
    const lotSize = executionEngine.calculateDynamicLotSize(equity, 0.5, 10, 'EURUSD');
    expect(lotSize).toBe(5.0);

    // Clamping: If 3.0% requested, clamps to max 1.0%
    const clampedMaxLot = executionEngine.calculateDynamicLotSize(equity, 3.0, 10, 'EURUSD');
    expect(clampedMaxLot).toBe(10.0);

    // Clamping: If 0.1% requested, clamps to min 0.5%
    const clampedMinLot = executionEngine.calculateDynamicLotSize(equity, 0.1, 10, 'EURUSD');
    expect(clampedMinLot).toBe(5.0);
  });

  it('should provide complete FlashScalper configuration constants', () => {
    const config = executionEngine.getFlashScalperConfig();
    expect(config.botName).toBe('FLASHSCALPER');
    expect(config.baselineLatencyMs).toBe(6.2);
    expect(config.executionTimeoutMs).toBe(50);
    expect(config.spreadFilterMaxPips).toBe(1.5);
    expect(config.slippageTolerancePips).toBe(1.0);
    expect(config.breakEvenTriggerPips).toBe(3.5);
  });
});
