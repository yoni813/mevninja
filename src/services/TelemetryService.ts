import { UserActivityLog, BrokerageServer, ScreenMonitoringState, AiTroubleshootingReport, BrokerAccountSession } from '../types';
import { connectionManager } from './ConnectionManager';

class TelemetryService {
  private activeBrokerageServer: BrokerageServer = {
    id: 'exness-trial9',
    name: 'Exness-MT5Trial9 // Trial Gateway 9',
    location: 'Johannesburg (Teraco / ZA-JNB)',
    country: 'South Africa',
    flag: '🇿🇦',
    facility: 'Exness MT5 Direct Institutional Co-Location',
    provider: 'Exness MetaTrader 5 Trial Server 9 (MT5Trial9)',
    baselinePingMs: 6.2,
    currentPingMs: 6.2,
    jitterMs: 0.32,
    crossConnectType: 'Direct 10Gbps Single-Mode Fiber Cross-Connect',
    status: 'ACTIVE',
    ipAddress: '197.189.240.19'
  };

  private listeners: Array<(servers: BrokerageServer[], active: BrokerageServer) => void> = [];
  private activityListeners: Array<(logs: UserActivityLog[]) => void> = [];
  private cachedLogs: UserActivityLog[] = [];

  private cachedExnessAccount: BrokerAccountSession | null = null;
  private accountListeners: Array<(account: BrokerAccountSession) => void> = [];
  private telemetryInterval: any = null;

  constructor() {
    this.startTelemetryPolling();
  }

  private startTelemetryPolling() {
    if (this.telemetryInterval) clearInterval(this.telemetryInterval);
    this.telemetryInterval = setInterval(() => {
      if (this.accountListeners.length > 0) {
        this.fetchExnessAccountTelemetry();
      }
    }, 2000);
  }

  // Direct Exness Authentication
  public async authenticateExness(params: {
    server: string;
    login: string;
    password?: string;
    isDemo?: boolean;
    initialBalance?: number;
    leverage?: number;
    currency?: string;
  }): Promise<BrokerAccountSession | null> {
    try {
      const res = await fetch('/api/brokerage/credentials/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.account) {
          this.cachedExnessAccount = data.account;
          this.notifyAccountListeners();
          this.fetchActivities();
          return data.account;
        }
      }
    } catch (e) {
      console.warn('[TelemetryService] Exness authentication error:', e);
    }
    return null;
  }

  // Fetch Live Exness Account Telemetry (Balance, Equity, Margin, PnL)
  public async fetchExnessAccountTelemetry(): Promise<BrokerAccountSession | null> {
    try {
      const res = await fetch('/api/brokerage/account/telemetry');
      if (res.ok) {
        const data = await res.json();
        if (data.account) {
          this.cachedExnessAccount = data.account;
          this.notifyAccountListeners();
          return data.account;
        }
      }
    } catch (e) {
      console.warn('[TelemetryService] Failed to fetch Exness telemetry:', e);
    }
    return this.cachedExnessAccount;
  }

  public subscribeExnessAccount(listener: (account: BrokerAccountSession) => void): () => void {
    this.accountListeners.push(listener);
    if (this.cachedExnessAccount) {
      listener(this.cachedExnessAccount);
    } else {
      this.fetchExnessAccountTelemetry().then(acc => {
        if (acc) listener(acc);
      });
    }
    return () => {
      this.accountListeners = this.accountListeners.filter(l => l !== listener);
    };
  }

  private notifyAccountListeners() {
    if (this.cachedExnessAccount) {
      this.accountListeners.forEach(fn => fn(this.cachedExnessAccount!));
    }
  }

  public getCachedAccount(): BrokerAccountSession | null {
    return this.cachedExnessAccount;
  }

  // Close Position and Realize Profit/Loss into Wallet Balance
  public async closeExnessPosition(ticket: number): Promise<{ success: boolean; closedPosition: any; newBalance: number; account: BrokerAccountSession } | null> {
    try {
      const res = await fetch('/api/brokerage/account/close-position', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.account) {
          this.cachedExnessAccount = data.account;
          this.notifyAccountListeners();
          this.fetchActivities();
          return data;
        }
      }
    } catch (e) {
      console.warn('[TelemetryService] Close position failed:', e);
    }
    return null;
  }

  // Deposit or Withdraw from Exness Wallet Balance
  public async adjustExnessWalletBalance(amount: number, action: 'DEPOSIT' | 'WITHDRAW' = 'DEPOSIT', note?: string): Promise<{ success: boolean; newBalance: number; account: BrokerAccountSession } | null> {
    try {
      const res = await fetch('/api/brokerage/account/deposit-withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, action, note })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.account) {
          this.cachedExnessAccount = data.account;
          this.notifyAccountListeners();
          this.fetchActivities();
          return data;
        }
      }
    } catch (e) {
      console.warn('[TelemetryService] Deposit/Withdraw error:', e);
    }
    return null;
  }

  // Adjust Account Leverage
  public async updateExnessLeverage(leverage: number): Promise<BrokerAccountSession | null> {
    try {
      const res = await fetch('/api/brokerage/account/leverage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leverage })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.account) {
          this.cachedExnessAccount = data.account;
          this.notifyAccountListeners();
          return data.account;
        }
      }
    } catch (e) {
      console.warn('[TelemetryService] Leverage update failed:', e);
    }
    return null;
  }

  // Log user activity to backend
  public async logActivity(activity: {
    traderId: string;
    role: string;
    action: string;
    module: string;
    details: string;
    severity: 'INFO' | 'SUCCESS' | 'WARN' | 'CRITICAL';
    location?: string;
    metadata?: Record<string, any>;
  }): Promise<UserActivityLog | null> {
    try {
      const res = await fetch('/api/telemetry/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activity)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.entry) {
          this.cachedLogs.unshift(data.entry);
          this.notifyActivityListeners();
          return data.entry;
        }
      }
    } catch (e) {
      console.warn('[TelemetryService] Activity log fallback:', e);
    }
    return null;
  }

  public async fetchActivities(): Promise<UserActivityLog[]> {
    try {
      const res = await fetch('/api/telemetry/activities');
      if (res.ok) {
        const data = await res.json();
        this.cachedLogs = data.activities || [];
        this.notifyActivityListeners();
        return this.cachedLogs;
      }
    } catch (e) {
      console.warn('[TelemetryService] Failed to fetch activities:', e);
    }
    return this.cachedLogs;
  }

  public subscribeActivities(listener: (logs: UserActivityLog[]) => void): () => void {
    this.activityListeners.push(listener);
    if (this.cachedLogs.length > 0) {
      listener(this.cachedLogs);
    } else {
      this.fetchActivities().then(logs => listener(logs));
    }
    return () => {
      this.activityListeners = this.activityListeners.filter(l => l !== listener);
    };
  }

  private notifyActivityListeners() {
    this.activityListeners.forEach(fn => fn([...this.cachedLogs]));
  }

  // Brokerage Servers
  public async fetchBrokerageServers(): Promise<{ servers: BrokerageServer[]; activeServerId: string }> {
    try {
      const res = await fetch('/api/brokerage/servers');
      if (res.ok) {
        const data = await res.json();
        const active = data.servers.find((s: BrokerageServer) => s.id === data.activeServerId);
        if (active) {
          this.activeBrokerageServer = active;
        }
        return data;
      }
    } catch (e) {
      console.warn('[TelemetryService] Failed to fetch brokerage servers:', e);
    }
    return { servers: [this.activeBrokerageServer], activeServerId: this.activeBrokerageServer.id };
  }

  public async selectBrokerageServer(serverId: string, traderId?: string): Promise<BrokerageServer | null> {
    try {
      const res = await fetch('/api/brokerage/select-server', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId, traderId: traderId || 'CHIEF_QUANT' })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.activeServer) {
          this.activeBrokerageServer = data.activeServer;
          // Synchronize ConnectionManager baseline ping with new broker location!
          connectionManager.setBaseline(data.activeServer.baselinePingMs);
          this.fetchActivities();
          return data.activeServer;
        }
      }
    } catch (e) {
      console.warn('[TelemetryService] Failed to switch brokerage server:', e);
    }
    return null;
  }

  public getActiveBrokerageServer(): BrokerageServer {
    return this.activeBrokerageServer;
  }

  // Screen Monitoring & AI Oversight
  public async sendScreenFrameTelemetry(metrics: {
    activeWidgets: string[];
    latencyMs: number;
    spread: number;
    errorsCount: number;
    openPositionsCount: number;
  }): Promise<boolean> {
    try {
      const res = await fetch('/api/monitoring/screen-frame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metrics)
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  public async requestAiTroubleshootingAnalysis(params: {
    currentLatency: number;
    activeServer: string;
    activeWidgets: string[];
    openPositions: any[];
    marketSpread: number;
    recentErrors: string[];
  }): Promise<AiTroubleshootingReport | null> {
    try {
      const res = await fetch('/api/monitoring/analyze-frame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (res.ok) {
        const data = await res.json();
        return data.diagnosis;
      }
    } catch (e) {
      console.warn('[TelemetryService] AI Screen analysis error:', e);
    }
    return null;
  }

  public async fetchMonitoringStatus(): Promise<ScreenMonitoringState | null> {
    try {
      const res = await fetch('/api/monitoring/status');
      if (res.ok) {
        const data = await res.json();
        return data.session;
      }
    } catch (e) {
      console.warn('[TelemetryService] Failed to fetch monitoring status:', e);
    }
    return null;
  }
}

export const telemetryService = new TelemetryService();
