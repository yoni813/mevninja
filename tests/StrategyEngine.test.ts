import { describe, it, expect } from 'vitest';
import { strategyService } from '../src/services/StrategyService';

describe('S.H.A.F.T. FLASHSCALPER Strategy & Execution Engine (StrategyService.ts)', () => {
  it('should load default FLASHSCALPER strategy configuration locked in engine', () => {
    const strategies = strategyService.getStrategies();
    const flashScalper = strategies.find(s => s.id === 'strat-flashscalper');

    expect(flashScalper).toBeDefined();
    expect(flashScalper?.name).toContain('FLASHSCALPER');
    expect(flashScalper?.active).toBe(true);
    expect(flashScalper?.metadata?.baselineLatencyMs).toBe(6.2);
    expect(flashScalper?.metadata?.executionTimeoutMs).toBe(50);
    expect(flashScalper?.metadata?.spreadFilterMaxPips).toBe(1.5);
    expect(flashScalper?.metadata?.calibrationStatus).toBe('LOCKED_IN_ENGINE');
  });

  it('should support switching between SIMULATION and LIVE trading modes', () => {
    strategyService.setTradingMode('LIVE');
    expect(strategyService.getTradingMode()).toBe('LIVE');

    strategyService.setTradingMode('SIMULATION');
    expect(strategyService.getTradingMode()).toBe('SIMULATION');
  });

  it('should allow toggling strategy active state', () => {
    strategyService.toggleStrategy('strat-1');
    const strat1 = strategyService.getStrategies().find(s => s.id === 'strat-1');
    expect(strat1?.active).toBe(true);

    strategyService.toggleStrategy('strat-1');
    const strat1Off = strategyService.getStrategies().find(s => s.id === 'strat-1');
    expect(strat1Off?.active).toBe(false);
  });
});
