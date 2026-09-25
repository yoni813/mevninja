import { RiskState } from '../types';

export class RiskManagementService {
  private killSwitchActive = false;
  private killSwitchReason = '';
  public readonly maxPositionSize = 2000000; // $2M Notional
  public readonly maxMarginUtilization = 0.90; // 90% Ceiling
  public readonly dailyDrawdownLimit = 0.04; // 4.0%
  public readonly maxLeverage = 100; // 1:100 Institutional

  private state: RiskState = {
    status: 'SECURE',
    exposure: {
      grossExposure: 1250000,
      netExposure: 450000,
      marginUtilization: 24.5,
      maxDrawdown: 1.2
    },
    checks: [
      { id: 'c1', name: 'AML / KYC Verification', status: 'PASSED', lastChecked: Date.now() },
      { id: 'c2', name: 'Wash Trade Prevention (WTP)', status: 'PASSED', lastChecked: Date.now() },
      { id: 'c3', name: 'Fat Finger Price Limits', status: 'PASSED', lastChecked: Date.now() },
      { id: 'c4', name: 'Pattern Day Trader (PDT) Status', status: 'PASSED', lastChecked: Date.now() },
      { id: 'c5', name: 'Max Position Size Limit', status: 'PASSED', lastChecked: Date.now() },
      { id: 'c6', name: 'FLASHSCALPER Dynamic Equity Risk (0.5% - 1.0%)', status: 'PASSED', lastChecked: Date.now() },
      { id: 'c7', name: 'Tier-1 News Guard Blackout Window (±10m)', status: 'PASSED', lastChecked: Date.now() },
      { id: 'c8', name: 'London-New York Session Overlap Gate', status: 'PASSED', lastChecked: Date.now() },
      { id: 'c9', name: 'ATR Dynamic Stops & +3.5 Pip Auto-Breakeven', status: 'PASSED', lastChecked: Date.now() }
    ]
  };

  private intervalId: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.intervalId = setInterval(() => this.simulateRiskFluctuations(), 3000);
    }
  }

  public cleanup() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private simulateRiskFluctuations() {
    if (this.killSwitchActive) {
      this.state.status = 'CRITICAL';
      return;
    }
    // Slightly fluctuate exposure for realism
    const delta = (Math.random() - 0.5) * 50000;
    this.state.exposure.grossExposure = Math.max(0, this.state.exposure.grossExposure + delta);
    this.state.exposure.marginUtilization = (this.state.exposure.grossExposure / 5000000) * 100;
    
    if (this.state.exposure.marginUtilization > 80) {
      this.state.status = 'CRITICAL';
    } else if (this.state.exposure.marginUtilization > 60) {
      this.state.status = 'WARNING';
    } else {
      this.state.status = 'SECURE';
    }
  }

  public engageKillSwitch(reason = 'Manual Chief Risk Officer Emergency Trigger'): void {
    this.killSwitchActive = true;
    this.killSwitchReason = reason;
    this.state.status = 'CRITICAL';
  }

  public disengageKillSwitch(): void {
    this.killSwitchActive = false;
    this.killSwitchReason = '';
    this.state.status = 'SECURE';
  }

  public isKillSwitchActive(): boolean {
    return this.killSwitchActive;
  }

  public getKillSwitchReason(): string {
    return this.killSwitchReason;
  }

  public getRiskState(): RiskState {
    return { ...this.state };
  }

  public validatePreTrade(volume: number, price: number): { approved: boolean; reason?: string } {
    if (this.killSwitchActive) {
      return {
        approved: false,
        reason: `Kill-Switch Engaged: All trade dispatches halted (${this.killSwitchReason || 'Emergency Halt'}).`
      };
    }

    const tradeValue = volume * price * 100000; // standard forex lot calculation
    const projectedGross = this.state.exposure.grossExposure + tradeValue;
    
    // Check Max Position Size Limit
    if (tradeValue > this.maxPositionSize) {
      return { 
        approved: false, 
        reason: `Fat Finger Check Failed: Trade value ($${tradeValue.toLocaleString()}) exceeds max single order size of $2,000,000.` 
      };
    }

    // Check Margin Utilization Ceiling (90%)
    const projectedUtilization = projectedGross / 5000000;
    if (projectedUtilization > this.maxMarginUtilization) {
      return { 
        approved: false, 
        reason: `Margin Check Failed: Trade would drive margin utilization to ${(projectedUtilization * 100).toFixed(1)}% (exceeds 90% ceiling).` 
      };
    }

    // Daily Drawdown Limit Check
    if (this.state.exposure.maxDrawdown > this.dailyDrawdownLimit * 100) {
      return {
        approved: false,
        reason: `Daily Drawdown Limit Breached: Current drawdown (${this.state.exposure.maxDrawdown}%) exceeds 4.0% threshold.`
      };
    }

    // Ensure all compliance checks pass (WTP, KYC, PDT)
    const failedCheck = this.state.checks.find(c => c.status !== 'PASSED');
    if (failedCheck) {
      return { approved: false, reason: `Regulatory Check Failed: ${failedCheck.name} is not PASSED.` };
    }

    return { approved: true };
  }
}

export const riskManagement = new RiskManagementService();
