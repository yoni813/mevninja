import { describe, it, expect, beforeEach } from 'vitest';
import { RiskManagementService } from '../src/services/RiskManagement';

describe('S.H.A.F.T. Risk Management Engine (RiskManagement.ts)', () => {
  let riskService: RiskManagementService;

  beforeEach(() => {
    riskService = new RiskManagementService();
  });

  it('should approve valid standard institutional orders within risk parameters', () => {
    // 5.0 lots EURUSD @ 1.0845 = $542,250 notional
    const result = riskService.validatePreTrade(5.0, 1.0845);
    expect(result.approved).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('should reject fat-finger orders exceeding $2,000,000 max single position size', () => {
    // 25.0 lots EURUSD @ 1.0845 = $2,711,250 notional
    const result = riskService.validatePreTrade(25.0, 1.0845);
    expect(result.approved).toBe(false);
    expect(result.reason).toContain('Fat Finger Check Failed');
    expect(result.reason).toContain('2,000,000');
  });

  it('should reject trades that would exceed 90% margin utilization ceiling', () => {
    // 40.0 lots of BTCUSD @ 67,000 = $268,000,000 notional
    const result = riskService.validatePreTrade(40.0, 67000);
    expect(result.approved).toBe(false);
    expect(result.reason).toBeDefined();
  });

  it('should immediately halt all trade dispatches when emergency kill-switch is engaged', () => {
    expect(riskService.isKillSwitchActive()).toBe(false);

    riskService.engageKillSwitch('Chief Risk Officer Market Black Swan Protocol');
    expect(riskService.isKillSwitchActive()).toBe(true);
    expect(riskService.getKillSwitchReason()).toContain('Black Swan Protocol');

    const result = riskService.validatePreTrade(1.0, 1.0845);
    expect(result.approved).toBe(false);
    expect(result.reason).toContain('Kill-Switch Engaged');

    riskService.disengageKillSwitch();
    expect(riskService.isKillSwitchActive()).toBe(false);
    const retryResult = riskService.validatePreTrade(1.0, 1.0845);
    expect(retryResult.approved).toBe(true);
  });

  it('should return initial risk state containing all 9 compliance checks', () => {
    const state = riskService.getRiskState();
    expect(state.checks.length).toBe(9);
    expect(state.checks.map(c => c.name)).toContain('Wash Trade Prevention (WTP)');
    expect(state.checks.map(c => c.name)).toContain('AML / KYC Verification');
    expect(state.checks.map(c => c.name)).toContain('Max Position Size Limit');
  });
});
