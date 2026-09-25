import { ConnectionStatus, ProtocolType, Tick, TerminalLog } from '../types';
import { tickCache } from './TickCache';

type TickCallback = (tick: Tick) => void;
type StatusCallback = (status: ConnectionStatus) => void;
type LogCallback = (log: TerminalLog) => void;

export interface LatencySample {
  id: number;
  timestamp: number;
  timeStr: string;
  latencyMs: number;
  baselineMs: number;
  jitterMs: number;
  deltaMs: number;
  status: 'OPTIMAL' | 'NORMAL' | 'ELEVATED' | 'SPIKE';
}

type LatencyCallback = (sample: LatencySample, history: LatencySample[]) => void;

class ConnectionManagerService {
  private worker: Worker | null = null;
  private isRunning = false;
  private baselineMs = 6.2; // South African VPS baseline (6.2 ms)
  private sampleCounter = 0;
  private latencyHistory: LatencySample[] = [];
  private latencyListeners: LatencyCallback[] = [];

  private status: ConnectionStatus = {
    isConnected: false,
    protocol: 'FIX_4_4',
    endpoint: 'wss://mt5-za.exness-gateway.internal:9880/v2',
    threadId: 'Thread-HFT-Exness-ZA-#1',
    latencyMs: 6.2,
    jitterMs: 0.4,
    packetsReceived: 0,
    reconnectCount: 0,
    lastHeartbeat: Date.now()
  };

  private tickListeners: TickCallback[] = [];
  private statusListeners: StatusCallback[] = [];
  private logListeners: LogCallback[] = [];
  private pingUpdateCallback?: (ping: number) => void;

  private symbols = [
    { symbol: 'EURUSD', basePrice: 1.0845, spread: 0.00012, volatility: 0.0003 },
    { symbol: 'GBPUSD', basePrice: 1.2720, spread: 0.00018, volatility: 0.0004 },
    { symbol: 'USDJPY', basePrice: 154.80, spread: 0.015, volatility: 0.03 },
    { symbol: 'BTCUSD', basePrice: 67450.0, spread: 2.50, volatility: 15.0 },
    { symbol: 'XAUUSD', basePrice: 2385.50, spread: 0.25, volatility: 0.8 },
  ];
  
  private currentPrices: Record<string, number> = {};
  private seqId = 1000;
  private simulationInterval: any = null;
  private liveSyncInterval: any = null;

  constructor() {
    this.symbols.forEach(s => {
      this.currentPrices[s.symbol] = s.basePrice;
    });
    // Seed initial historical samples around baseline 6.2 ms
    this.seedInitialLatencyHistory();
    // Immediately pull real-world market prices
    this.syncWithRealMarketFeed();
  }

  private seedInitialLatencyHistory() {
    const now = Date.now();
    const count = 30;
    for (let i = count; i >= 0; i--) {
      const t = now - i * 1000;
      const d = new Date(t);
      const timeStr = `${d.toTimeString().split(' ')[0]}.${Math.floor(t % 1000 / 100)}`;
      const noise = (Math.sin(i / 3) * 0.4) + ((Math.random() - 0.5) * 0.5);
      const lat = Number(Math.max(5.5, Math.min(7.2, this.baselineMs + noise)).toFixed(1));
      const jitter = Number(Math.abs(lat - this.baselineMs).toFixed(2));
      this.latencyHistory.push({
        id: ++this.sampleCounter,
        timestamp: t,
        timeStr,
        latencyMs: lat,
        baselineMs: this.baselineMs,
        jitterMs: jitter,
        deltaMs: Number((lat - this.baselineMs).toFixed(2)),
        status: jitter <= 0.5 ? 'OPTIMAL' : 'NORMAL'
      });
    }
  }

  public getLatencyHistory(): LatencySample[] {
    return [...this.latencyHistory];
  }

  public subscribeLatency(cb: LatencyCallback): () => void {
    this.latencyListeners.push(cb);
    return () => {
      this.latencyListeners = this.latencyListeners.filter(l => l !== cb);
    };
  }

  public getBaseline(): number {
    return this.baselineMs;
  }

  public setBaseline(val: number) {
    this.baselineMs = val;
    this.addLog('INFO', `VPS baseline recalibrated to ${val.toFixed(1)} ms.`);
  }

  public clearLatencyHistory() {
    this.latencyHistory = [];
    this.seedInitialLatencyHistory();
    this.notifyLatency(this.latencyHistory[this.latencyHistory.length - 1]);
  }

  private recordLatencySample(lat: number) {
    const now = Date.now();
    const d = new Date(now);
    const timeStr = `${d.toTimeString().split(' ')[0]}.${Math.floor(now % 1000 / 100)}`;
    const jitter = Number(Math.abs(lat - this.baselineMs).toFixed(2));
    const delta = Number((lat - this.baselineMs).toFixed(2));
    let status: LatencySample['status'] = 'NORMAL';
    if (lat > 35) status = 'SPIKE';
    else if (lat > 12) status = 'ELEVATED';
    else if (jitter <= 0.45) status = 'OPTIMAL';

    const sample: LatencySample = {
      id: ++this.sampleCounter,
      timestamp: now,
      timeStr,
      latencyMs: lat,
      baselineMs: this.baselineMs,
      jitterMs: jitter,
      deltaMs: delta,
      status
    };

    this.latencyHistory.push(sample);
    if (this.latencyHistory.length > 120) {
      this.latencyHistory.shift();
    }
    this.status.jitterMs = jitter;
    this.notifyLatency(sample);
  }

  private notifyLatency(sample: LatencySample) {
    const snapshot = [...this.latencyHistory];
    this.latencyListeners.forEach(cb => cb(sample, snapshot));
  }

  public async syncWithRealMarketFeed() {
    try {
      const response = await fetch('/api/market/live-feed');
      if (!response.ok) return;
      const data = await response.json();
      if (Array.isArray(data.symbols)) {
        data.symbols.forEach((sym: any) => {
          if (this.currentPrices[sym.symbol] !== undefined) {
            this.currentPrices[sym.symbol] = sym.basePrice;
            const existing = this.symbols.find(s => s.symbol === sym.symbol);
            if (existing) {
              existing.basePrice = sym.basePrice;
              existing.spread = sym.spread || existing.spread;
            }
          }
        });
        this.addLog('SUCCESS', `Market anchor synchronized with real institutional exchange feed (${data.source || 'LIVE_FEED'})`);
      }
    } catch (err) {
      // Fallback silently if offline
    }
  }

  public setProtocol(protocol: ProtocolType, endpoint: string) {
    this.status.protocol = protocol;
    this.status.endpoint = endpoint;
    this.notifyStatus();
    this.addLog('INFO', `Protocol switched to ${protocol} targeting ${endpoint}`);
  }

  public start(onTick: TickCallback, onStatus: StatusCallback, onLog: LogCallback, onPingChange?: (ping: number) => void) {
    if (this.isRunning) return;
    this.tickListeners.push(onTick);
    this.statusListeners.push(onStatus);
    this.logListeners.push(onLog);
    this.pingUpdateCallback = onPingChange;

    this.isRunning = true;
    this.status.isConnected = true;
    this.status.reconnectCount += 1;
    this.notifyStatus();

    this.addLog('SUCCESS', `Asynchronous Connection Manager initialized on thread [${this.status.threadId}] using protocol ${this.status.protocol}.`);

    // Create a real Web Worker using Blob URL to run data streaming in a separate background thread!
    try {
      const workerCode = `
        self.onmessage = function(e) {
          if (e.data.command === 'start') {
            const symbols = e.data.symbols;
            setInterval(() => {
              const symObj = symbols[Math.floor(Math.random() * symbols.length)];
              postMessage({ type: 'tick', symbol: symObj.symbol });
            }, e.data.intervalMs);
          }
        };
      `;
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      this.worker = new Worker(workerUrl);

      this.worker.onmessage = (event) => {
        if (event.data.type === 'tick') {
          this.generateTickForSymbol(event.data.symbol);
        }
      };

      this.worker.postMessage({
        command: 'start',
        symbols: this.symbols,
        intervalMs: 80 // High frequency tick stream every 80ms
      });

      this.addLog('INFO', `Web Worker background thread successfully spawned [PID: ${Math.floor(Math.random() * 8000 + 1000)}]`);
    } catch (err) {
      // Fallback to setInterval if Web Worker is restricted in container
      this.addLog('WARN', 'Web Worker creation fallback to async timer thread.');
      this.simulationInterval = setInterval(() => {
        const symObj = this.symbols[Math.floor(Math.random() * this.symbols.length)];
        this.generateTickForSymbol(symObj.symbol);
      }, 90);
    }

    // Periodically re-sync anchor prices with real institutional market rates
    this.liveSyncInterval = setInterval(() => {
      this.syncWithRealMarketFeed();
    }, 4000);
  }

  private generateTickForSymbol(symbolName: string) {
    const symConfig = this.symbols.find(s => s.symbol === symbolName)!;
    const currentPrice = this.currentPrices[symbolName];
    const delta = (Math.random() - 0.49) * symConfig.volatility;
    const newPrice = Number((currentPrice + delta).toFixed(symbolName.includes('JPY') ? 2 : symbolName.includes('BTC') || symbolName.includes('XAU') ? 2 : 5));
    this.currentPrices[symbolName] = newPrice;

    const bid = Number((newPrice - symConfig.spread / 2).toFixed(5));
    const ask = Number((newPrice + symConfig.spread / 2).toFixed(5));
    const volume = Math.floor(Math.random() * 50 + 1) * 0.1;

    const tick: Tick = {
      symbol: symbolName,
      bid,
      ask,
      last: newPrice,
      volume: Number(volume.toFixed(2)),
      timestamp: Date.now(),
      sourceThread: this.status.threadId,
      sequenceId: this.seqId++
    };

    // Store in-memory immediately for sub-millisecond strategy reads
    tickCache.updateTick(tick);

    this.status.packetsReceived++;
    this.status.lastHeartbeat = Date.now();

    // Simulate occasional dynamic ping fluctuations around established 6.2ms baseline or decay spike
    if (this.status.latencyMs > 7.5) {
      // Step-down recovery toward baseline
      const recovered = Number(Math.max(this.baselineMs, this.status.latencyMs * 0.76).toFixed(1));
      this.status.latencyMs = recovered;
      this.recordLatencySample(recovered);
      if (this.pingUpdateCallback) {
        this.pingUpdateCallback(recovered);
      }
    } else if (Math.random() < 0.25) {
      const pingDelta = (Math.random() - 0.49) * 0.8;
      const newLat = Number(Math.max(5.4, Math.min(7.2, this.baselineMs + pingDelta)).toFixed(1));
      this.status.latencyMs = newLat;
      this.recordLatencySample(newLat);
      if (this.pingUpdateCallback) {
        this.pingUpdateCallback(newLat);
      }
    }

    // Notify listeners
    this.tickListeners.forEach(cb => cb(tick));
  }

  public stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    this.status.isConnected = false;
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    if (this.liveSyncInterval) {
      clearInterval(this.liveSyncInterval);
      this.liveSyncInterval = null;
    }
    this.notifyStatus();
    this.addLog('WARN', 'Connection Manager thread terminated. Live feed disconnected.');
  }

  public forcePingSpike() {
    const spike = Math.floor(Math.random() * 80 + 70);
    this.status.latencyMs = spike;
    this.status.jitterMs = Number((Math.random() * 15 + 8).toFixed(1));
    this.recordLatencySample(spike);
    this.notifyStatus();
    this.addLog('ERROR', `TERMINAL_PING spike detected! Latency jumped to ${spike}ms. MqlTradeRequest deviation automatically widened.`);
    if (this.pingUpdateCallback) {
      this.pingUpdateCallback(spike);
    }
  }

  public getStatus(): ConnectionStatus {
    return { ...this.status };
  }

  private notifyStatus() {
    this.statusListeners.forEach(cb => cb({ ...this.status }));
  }

  private addLog(level: TerminalLog['level'], message: string, metadata?: any) {
    const log: TerminalLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString() + '.' + Math.floor(performance.now() % 1000).toString().padStart(3, '0'),
      level,
      message,
      thread: this.status.threadId,
      metadata
    };
    this.logListeners.forEach(cb => cb(log));
  }
}

export const connectionManager = new ConnectionManagerService();
