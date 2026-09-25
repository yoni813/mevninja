import { Tick } from '../types';

export interface OrderBookLevel {
  price: number;
  volume: number;
  orders: number;
  cumulativeVolume: number;
  distancePips: number;
}

export interface OrderBookDepth {
  symbol: string;
  timestamp: number;
  midPrice: number;
  spread: number;
  spreadFormatted: string;
  decimals: number;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  totalBidVolume: number;
  totalAskVolume: number;
  imbalanceRatio: number; // percentage of bids (0 to 100)
  imbalanceBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  microPrice: number;
  bidWall: { price: number; volume: number } | null;
  askWall: { price: number; volume: number } | null;
}

class OrderBookService {
  // Store persistent volume state per symbol to ensure smooth realism
  private stateCache = new Map<string, {
    bidBaseVolumes: number[];
    askBaseVolumes: number[];
    lastBid: number;
    lastAsk: number;
  }>();

  private getSymbolDecimals(symbol: string): number {
    if (symbol.includes('JPY') || symbol.includes('BTC') || symbol.includes('XAU')) {
      return 2;
    }
    return 5;
  }

  private getStepSize(symbol: string): number {
    if (symbol.includes('BTC')) return 2.5;
    if (symbol.includes('XAU')) return 0.25;
    if (symbol.includes('JPY')) return 0.02;
    return 0.0001; // 1 pip
  }

  public generateDepth(tick: Tick | undefined, levelCount = 20, aggregation = 1): OrderBookDepth {
    if (!tick) {
      return this.getEmptyDepth('UNKNOWN', levelCount);
    }

    const symbol = tick.symbol;
    const decimals = this.getSymbolDecimals(symbol);
    const baseStep = this.getStepSize(symbol);
    const step = baseStep * aggregation;

    const midPrice = Number(((tick.bid + tick.ask) / 2).toFixed(decimals));
    const spread = Math.abs(tick.ask - tick.bid);
    const spreadFormatted = symbol.includes('BTC') || symbol.includes('XAU')
      ? `$${spread.toFixed(2)}`
      : `${(spread * (symbol.includes('JPY') ? 100 : 10000)).toFixed(1)} pips`;

    // Retrieve or initialize cached base volumes for continuity
    let state = this.stateCache.get(symbol);
    if (!state || state.bidBaseVolumes.length !== levelCount) {
      const bidBase = Array.from({ length: levelCount }, (_, i) => {
        // Natural distribution: liquidity increases as distance from mid increases (depth accumulation)
        const base = 4 + Math.log(i + 1.5) * 8 + (Math.sin(i * 0.8) * 3);
        return Math.max(1.5, Number(base.toFixed(2)));
      });
      const askBase = Array.from({ length: levelCount }, (_, i) => {
        const base = 4 + Math.log(i + 1.5) * 8 + (Math.cos(i * 0.8) * 3);
        return Math.max(1.5, Number(base.toFixed(2)));
      });
      state = {
        bidBaseVolumes: bidBase,
        askBaseVolumes: askBase,
        lastBid: tick.bid,
        lastAsk: tick.ask
      };
      this.stateCache.set(symbol, state);
    }

    // Micro-fluctuate volumes based on tick activity
    const bids: OrderBookLevel[] = [];
    let cumBid = 0;
    let maxBidVol = 0;
    let bidWall: { price: number; volume: number } | null = null;

    for (let i = 0; i < levelCount; i++) {
      const p = Number((tick.bid - i * step).toFixed(decimals));
      // Organic jitter ±8%
      const jitter = 1 + (Math.sin(Date.now() / 1200 + i * 1.5) * 0.12);
      const vol = Number((state.bidBaseVolumes[i] * jitter).toFixed(2));
      cumBid += vol;
      const dist = Number((Math.abs(p - midPrice) * (symbol.includes('JPY') ? 100 : symbol.includes('BTC') || symbol.includes('XAU') ? 1 : 10000)).toFixed(1));

      bids.push({
        price: p,
        volume: vol,
        orders: Math.floor(vol * 2.5 + 2),
        cumulativeVolume: Number(cumBid.toFixed(2)),
        distancePips: dist
      });

      if (vol > maxBidVol && i > 2) {
        maxBidVol = vol;
        bidWall = { price: p, volume: vol };
      }
    }

    const asks: OrderBookLevel[] = [];
    let cumAsk = 0;
    let maxAskVol = 0;
    let askWall: { price: number; volume: number } | null = null;

    for (let i = 0; i < levelCount; i++) {
      const p = Number((tick.ask + i * step).toFixed(decimals));
      const jitter = 1 + (Math.cos(Date.now() / 1300 + i * 1.7) * 0.12);
      const vol = Number((state.askBaseVolumes[i] * jitter).toFixed(2));
      cumAsk += vol;
      const dist = Number((Math.abs(p - midPrice) * (symbol.includes('JPY') ? 100 : symbol.includes('BTC') || symbol.includes('XAU') ? 1 : 10000)).toFixed(1));

      asks.push({
        price: p,
        volume: vol,
        orders: Math.floor(vol * 2.5 + 2),
        cumulativeVolume: Number(cumAsk.toFixed(2)),
        distancePips: dist
      });

      if (vol > maxAskVol && i > 2) {
        maxAskVol = vol;
        askWall = { price: p, volume: vol };
      }
    }

    const totalBidVolume = Number(cumBid.toFixed(2));
    const totalAskVolume = Number(cumAsk.toFixed(2));
    const totalVolume = totalBidVolume + totalAskVolume;
    const imbalanceRatio = totalVolume > 0 ? Number(((totalBidVolume / totalVolume) * 100).toFixed(1)) : 50;

    let imbalanceBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
    if (imbalanceRatio > 53) imbalanceBias = 'BULLISH';
    else if (imbalanceRatio < 47) imbalanceBias = 'BEARISH';

    // Quantitative Micro-price: weighted by opposite liquidity
    // MicroPrice = (Bid * AskVol + Ask * BidVol) / (BidVol + AskVol)
    const topBidVol = bids[0]?.volume || 1;
    const topAskVol = asks[0]?.volume || 1;
    const microPrice = Number(
      ((tick.bid * topAskVol + tick.ask * topBidVol) / (topBidVol + topAskVol)).toFixed(decimals)
    );

    return {
      symbol,
      timestamp: tick.timestamp || Date.now(),
      midPrice,
      spread,
      spreadFormatted,
      decimals,
      bids,
      asks,
      totalBidVolume,
      totalAskVolume,
      imbalanceRatio,
      imbalanceBias,
      microPrice,
      bidWall,
      askWall
    };
  }

  private getEmptyDepth(symbol: string, levelCount: number): OrderBookDepth {
    return {
      symbol,
      timestamp: Date.now(),
      midPrice: 0,
      spread: 0,
      spreadFormatted: '0.0 pips',
      decimals: 5,
      bids: [],
      asks: [],
      totalBidVolume: 0,
      totalAskVolume: 0,
      imbalanceRatio: 50,
      imbalanceBias: 'NEUTRAL',
      microPrice: 0,
      bidWall: null,
      askWall: null
    };
  }
}

export const orderBookService = new OrderBookService();
