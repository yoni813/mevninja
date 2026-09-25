import { Tick } from '../types';

class InMemoryTickCache {
  private cache = new Map<string, Tick>();
  private tickHistory = new Map<string, Tick[]>();
  private maxHistoryPerSymbol = 500;
  private readCount = 0;
  private totalReadTimeMicroseconds = 0;

  public updateTick(tick: Tick): void {
    const start = performance.now();
    this.cache.set(tick.symbol, tick);

    let history = this.tickHistory.get(tick.symbol);
    if (!history) {
      history = [];
      this.tickHistory.set(tick.symbol, history);
    }
    history.push(tick);
    if (history.length > this.maxHistoryPerSymbol) {
      history.shift();
    }
    const elapsed = performance.now() - start;
    this.totalReadTimeMicroseconds += elapsed * 1000;
  }

  /**
   * Sub-millisecond direct access to latest tick bypassing UI/chart updates
   */
  public getLatestTick(symbol: string): { tick: Tick | undefined; accessTimeUs: number } {
    const start = performance.now();
    const tick = this.cache.get(symbol);
    const end = performance.now();
    
    this.readCount++;
    const accessTimeUs = (end - start) * 1000;
    this.totalReadTimeMicroseconds += accessTimeUs;

    return { tick, accessTimeUs };
  }

  public getAllLatestTicks(): Map<string, Tick> {
    return new Map(this.cache);
  }

  public getHistory(symbol: string): Tick[] {
    return this.tickHistory.get(symbol) || [];
  }

  public getCacheStats() {
    const avgReadTimeUs = this.readCount > 0 ? (this.totalReadTimeMicroseconds / this.readCount).toFixed(2) : '0.00';
    return {
      totalSymbols: this.cache.size,
      totalReads: this.readCount,
      avgReadTimeUs: Number(avgReadTimeUs),
      memoryFootprintBytes: this.cache.size * 128 + Array.from(this.tickHistory.values()).reduce((acc, h) => acc + h.length * 96, 0)
    };
  }

  public clear(): void {
    this.cache.clear();
    this.tickHistory.clear();
    this.readCount = 0;
    this.totalReadTimeMicroseconds = 0;
  }
}

export const tickCache = new InMemoryTickCache();
