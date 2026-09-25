import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Tick } from '../types';
import { orderBookService, OrderBookDepth, OrderBookLevel } from '../services/OrderBookService';
import { 
  BarChart3, TrendingUp, TrendingDown, Layers, 
  ZoomIn, ZoomOut, Eye, ArrowRightLeft, ShieldAlert,
  Sliders, RefreshCw
} from 'lucide-react';

interface OrderBookDepthChartProps {
  symbol: string;
  activeTick: Tick | undefined;
  className?: string;
}

export const OrderBookDepthChart: React.FC<OrderBookDepthChartProps> = ({
  symbol,
  activeTick,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Configuration States
  const [levelCount, setLevelCount] = useState<number>(20);
  const [aggregation, setAggregation] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'combined' | 'depth' | 'volume'>('combined');
  const [showWalls, setShowWalls] = useState<boolean>(true);

  // Container dimensions for responsive D3 rendering via ResizeObserver
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 700,
    height: 340
  });

  // Hover Tooltip State
  const [hoveredLevel, setHoveredLevel] = useState<{
    level: OrderBookLevel;
    type: 'BID' | 'ASK';
    x: number;
    y: number;
  } | null>(null);

  // Generate current Order Book Depth
  const depthData: OrderBookDepth = useMemo(() => {
    return orderBookService.generateDepth(activeTick, levelCount, aggregation);
  }, [activeTick, symbol, levelCount, aggregation]);

  // Handle ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        if (width > 0) {
          // Responsive height matching screen density
          const calculatedHeight = width < 500 ? 280 : width < 800 ? 320 : 350;
          setDimensions({
            width: Math.floor(width),
            height: calculatedHeight
          });
        }
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Main D3 Rendering Effect
  useEffect(() => {
    if (!svgRef.current || depthData.bids.length === 0 || depthData.asks.length === 0) return;

    const { width, height } = dimensions;
    const margin = { top: 28, right: 65, bottom: 38, left: 65 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    if (innerWidth <= 0 || innerHeight <= 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous drawing for clean refresh

    // Color definitions
    const bidColor = '#10b981'; // Emerald 500
    const bidColorLight = '#34d399';
    const askColor = '#f43f5e'; // Rose 500
    const askColorLight = '#fb7185';
    const gridColor = '#1e293b'; // Slate 800
    const textColor = '#94a3b8'; // Slate 400

    // Reverse bids so prices increase from left to right (lowest bid -> best bid)
    const sortedBids = [...depthData.bids].reverse();
    const sortedAsks = [...depthData.asks]; // best ask -> highest ask

    const minPrice = sortedBids[0].price;
    const maxPrice = sortedAsks[sortedAsks.length - 1].price;
    const maxCumulativeVol = Math.max(
      sortedBids[0].cumulativeVolume,
      sortedAsks[sortedAsks.length - 1].cumulativeVolume
    ) * 1.08;

    const maxSingleVol = Math.max(
      d3.max(depthData.bids, d => d.volume) || 1,
      d3.max(depthData.asks, d => d.volume) || 1
    );

    // Create Scales
    const xScale = d3.scaleLinear()
      .domain([minPrice, maxPrice])
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, maxCumulativeVol])
      .range([innerHeight, 0]);

    // Volume bar height scale (discrete level volume distribution)
    const volScale = d3.scaleLinear()
      .domain([0, maxSingleVol])
      .range([0, innerHeight * 0.38]);

    // Definitions for gradients & clip-paths
    const defs = svg.append('defs');

    // Bid Cumulative Area Gradient
    const bidGrad = defs.append('linearGradient')
      .attr('id', 'bid-depth-grad')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    bidGrad.append('stop').attr('offset', '0%').attr('stop-color', bidColor).attr('stop-opacity', 0.42);
    bidGrad.append('stop').attr('offset', '100%').attr('stop-color', bidColor).attr('stop-opacity', 0.04);

    // Ask Cumulative Area Gradient
    const askGrad = defs.append('linearGradient')
      .attr('id', 'ask-depth-grad')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    askGrad.append('stop').attr('offset', '0%').attr('stop-color', askColor).attr('stop-opacity', 0.42);
    askGrad.append('stop').attr('offset', '100%').attr('stop-color', askColor).attr('stop-opacity', 0.04);

    // Volume Bar Gradients
    const bidBarGrad = defs.append('linearGradient')
      .attr('id', 'bid-bar-grad')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    bidBarGrad.append('stop').attr('offset', '0%').attr('stop-color', bidColorLight).attr('stop-opacity', 0.75);
    bidBarGrad.append('stop').attr('offset', '100%').attr('stop-color', bidColor).attr('stop-opacity', 0.25);

    const askBarGrad = defs.append('linearGradient')
      .attr('id', 'ask-bar-grad')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    askBarGrad.append('stop').attr('offset', '0%').attr('stop-color', askColorLight).attr('stop-opacity', 0.75);
    askBarGrad.append('stop').attr('offset', '100%').attr('stop-color', askColor).attr('stop-opacity', 0.25);

    // Main Chart Canvas Group
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Subtle Horizontal Grid Lines
    const yAxisTicks = yScale.ticks(5);
    g.append('g')
      .attr('class', 'grid')
      .selectAll('line')
      .data(yAxisTicks)
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d))
      .attr('stroke', gridColor)
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3 3')
      .attr('opacity', 0.6);

    // -------------------------------------------------------------
    // 1. DISCRETE LEVEL VOLUME DISTRIBUTION (Histogram Bars)
    // -------------------------------------------------------------
    if (viewMode === 'combined' || viewMode === 'volume') {
      const barWidth = Math.max(2, (innerWidth / (levelCount * 2)) * 0.75);

      // Bid Volume Bars
      g.append('g')
        .attr('class', 'bid-volume-bars')
        .selectAll('rect')
        .data(depthData.bids)
        .enter()
        .append('rect')
        .attr('x', d => xScale(d.price) - barWidth / 2)
        .attr('y', d => innerHeight - volScale(d.volume))
        .attr('width', barWidth)
        .attr('height', d => volScale(d.volume))
        .attr('fill', 'url(#bid-bar-grad)')
        .attr('rx', 1.5)
        .attr('opacity', viewMode === 'volume' ? 0.95 : 0.6);

      // Ask Volume Bars
      g.append('g')
        .attr('class', 'ask-volume-bars')
        .selectAll('rect')
        .data(depthData.asks)
        .enter()
        .append('rect')
        .attr('x', d => xScale(d.price) - barWidth / 2)
        .attr('y', d => innerHeight - volScale(d.volume))
        .attr('width', barWidth)
        .attr('height', d => volScale(d.volume))
        .attr('fill', 'url(#ask-bar-grad)')
        .attr('rx', 1.5)
        .attr('opacity', viewMode === 'volume' ? 0.95 : 0.6);
    }

    // -------------------------------------------------------------
    // 2. CUMULATIVE DEPTH STEPPED AREA CURVES
    // -------------------------------------------------------------
    if (viewMode === 'combined' || viewMode === 'depth') {
      // Area Generators with Stepped Curve
      const bidAreaGenerator = d3.area<OrderBookLevel>()
        .x(d => xScale(d.price))
        .y0(innerHeight)
        .y1(d => yScale(d.cumulativeVolume))
        .curve(d3.curveStepBefore);

      const askAreaGenerator = d3.area<OrderBookLevel>()
        .x(d => xScale(d.price))
        .y0(innerHeight)
        .y1(d => yScale(d.cumulativeVolume))
        .curve(d3.curveStepAfter);

      // Top Edge Line Generators
      const bidLineGenerator = d3.line<OrderBookLevel>()
        .x(d => xScale(d.price))
        .y(d => yScale(d.cumulativeVolume))
        .curve(d3.curveStepBefore);

      const askLineGenerator = d3.line<OrderBookLevel>()
        .x(d => xScale(d.price))
        .y(d => yScale(d.cumulativeVolume))
        .curve(d3.curveStepAfter);

      // Append Bid Area & Line
      g.append('path')
        .datum(sortedBids)
        .attr('fill', 'url(#bid-depth-grad)')
        .attr('d', bidAreaGenerator);

      g.append('path')
        .datum(sortedBids)
        .attr('fill', 'none')
        .attr('stroke', bidColor)
        .attr('stroke-width', 2.2)
        .attr('d', bidLineGenerator);

      // Append Ask Area & Line
      g.append('path')
        .datum(sortedAsks)
        .attr('fill', 'url(#ask-depth-grad)')
        .attr('d', askAreaGenerator);

      g.append('path')
        .datum(sortedAsks)
        .attr('fill', 'none')
        .attr('stroke', askColor)
        .attr('stroke-width', 2.2)
        .attr('d', askLineGenerator);
    }

    // -------------------------------------------------------------
    // 3. MID-PRICE VERTICAL REFERENCE & SPREAD
    // -------------------------------------------------------------
    const midX = xScale(depthData.midPrice);

    // Mid Price Dashed Reference Line
    g.append('line')
      .attr('x1', midX)
      .attr('x2', midX)
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#38bdf8') // Sky 400
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4 4')
      .attr('opacity', 0.85);

    // Mid Price Floating Badge at Top
    const badgeGroup = g.append('g')
      .attr('transform', `translate(${midX}, -10)`);

    const badgeWidth = 92;
    badgeGroup.append('rect')
      .attr('x', -badgeWidth / 2)
      .attr('y', -12)
      .attr('width', badgeWidth)
      .attr('height', 18)
      .attr('rx', 4)
      .attr('fill', '#0b1329')
      .attr('stroke', '#38bdf8')
      .attr('stroke-width', 1);

    badgeGroup.append('text')
      .attr('x', 0)
      .attr('y', 0)
      .attr('text-anchor', 'middle')
      .attr('fill', '#7dd3fc')
      .attr('font-size', '10px')
      .attr('font-weight', '700')
      .attr('font-family', 'monospace')
      .text(`MID ${depthData.midPrice.toFixed(depthData.decimals)}`);

    // -------------------------------------------------------------
    // 4. LIQUIDITY WALL CALLOUTS
    // -------------------------------------------------------------
    if (showWalls) {
      if (depthData.bidWall) {
        const wallX = xScale(depthData.bidWall.price);
        g.append('circle')
          .attr('cx', wallX)
          .attr('cy', innerHeight - 12)
          .attr('r', 3.5)
          .attr('fill', bidColorLight)
          .attr('stroke', '#06080F')
          .attr('stroke-width', 1.5);
      }

      if (depthData.askWall) {
        const wallX = xScale(depthData.askWall.price);
        g.append('circle')
          .attr('cx', wallX)
          .attr('cy', innerHeight - 12)
          .attr('r', 3.5)
          .attr('fill', askColorLight)
          .attr('stroke', '#06080F')
          .attr('stroke-width', 1.5);
      }
    }

    // -------------------------------------------------------------
    // 5. AXES (X-Axis Prices, Left & Right Y-Axis Volumes)
    // -------------------------------------------------------------
    // Bottom X-Axis
    const xAxis = d3.axisBottom(xScale)
      .ticks(width < 550 ? 4 : 7)
      .tickFormat(d => (d as number).toFixed(depthData.decimals));

    const xAxisGroup = g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis);

    xAxisGroup.select('.domain').attr('stroke', gridColor);
    xAxisGroup.selectAll('.tick line').attr('stroke', gridColor);
    xAxisGroup.selectAll('.tick text')
      .attr('fill', textColor)
      .attr('font-family', 'monospace')
      .attr('font-size', '10px')
      .attr('dy', '12px');

    // Left Y-Axis (Bid Volume)
    const yAxisLeft = d3.axisLeft(yScale)
      .ticks(4)
      .tickFormat(d => `${d}L`);

    const yAxisLeftGroup = g.append('g')
      .call(yAxisLeft);

    yAxisLeftGroup.select('.domain').attr('stroke', gridColor);
    yAxisLeftGroup.selectAll('.tick line').attr('stroke', gridColor);
    yAxisLeftGroup.selectAll('.tick text')
      .attr('fill', bidColorLight)
      .attr('font-family', 'monospace')
      .attr('font-size', '9px');

    // Right Y-Axis (Ask Volume)
    const yAxisRight = d3.axisRight(yScale)
      .ticks(4)
      .tickFormat(d => `${d}L`);

    const yAxisRightGroup = g.append('g')
      .attr('transform', `translate(${innerWidth}, 0)`)
      .call(yAxisRight);

    yAxisRightGroup.select('.domain').attr('stroke', gridColor);
    yAxisRightGroup.selectAll('.tick line').attr('stroke', gridColor);
    yAxisRightGroup.selectAll('.tick text')
      .attr('fill', askColorLight)
      .attr('font-family', 'monospace')
      .attr('font-size', '9px');

    // Axis Header Labels
    svg.append('text')
      .attr('x', margin.left)
      .attr('y', 14)
      .attr('fill', bidColor)
      .attr('font-size', '10px')
      .attr('font-weight', '700')
      .attr('font-family', 'monospace')
      .text('◄ BUY DEPTH (BIDS)');

    svg.append('text')
      .attr('x', width - margin.right)
      .attr('y', 14)
      .attr('text-anchor', 'end')
      .attr('fill', askColor)
      .attr('font-size', '10px')
      .attr('font-weight', '700')
      .attr('font-family', 'monospace')
      .text('SELL DEPTH (ASKS) ►');

    // -------------------------------------------------------------
    // 6. INTERACTIVE CROSSHAIR & HOVER LISTENER
    // -------------------------------------------------------------
    const crosshairG = g.append('g').style('display', 'none');

    const crosshairV = crosshairG.append('line')
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '2 2')
      .attr('y1', 0)
      .attr('y2', innerHeight);

    const crosshairPoint = crosshairG.append('circle')
      .attr('r', 4.5)
      .attr('stroke', '#FFFFFF')
      .attr('stroke-width', 2);

    // Overlay Rect for Mouse Tracking
    g.append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .style('cursor', 'crosshair')
      .on('pointermove', function (event) {
        const [mx] = d3.pointer(event);
        const hoveredPrice = xScale.invert(mx);

        // Determine if mouse is on Bid side or Ask side
        let closestLevel: OrderBookLevel | null = null;
        let type: 'BID' | 'ASK' = 'BID';

        if (hoveredPrice <= depthData.midPrice) {
          type = 'BID';
          // Find closest bid
          let minDist = Infinity;
          for (const b of depthData.bids) {
            const dist = Math.abs(b.price - hoveredPrice);
            if (dist < minDist) {
              minDist = dist;
              closestLevel = b;
            }
          }
        } else {
          type = 'ASK';
          let minDist = Infinity;
          for (const a of depthData.asks) {
            const dist = Math.abs(a.price - hoveredPrice);
            if (dist < minDist) {
              minDist = dist;
              closestLevel = a;
            }
          }
        }

        if (closestLevel) {
          const cx = xScale(closestLevel.price);
          const cy = yScale(closestLevel.cumulativeVolume);

          crosshairG.style('display', null);
          crosshairV.attr('x1', cx).attr('x2', cx);
          crosshairPoint
            .attr('cx', cx)
            .attr('cy', cy)
            .attr('fill', type === 'BID' ? bidColor : askColor);

          // Position Tooltip in parent coordinates
          setHoveredLevel({
            level: closestLevel,
            type,
            x: cx + margin.left,
            y: cy + margin.top
          });
        }
      })
      .on('pointerleave', function () {
        crosshairG.style('display', 'none');
        setHoveredLevel(null);
      });

  }, [depthData, dimensions, viewMode, showWalls]);

  return (
    <div className={`bg-slate-900/35 border border-slate-800/60 rounded-2xl shadow-xl backdrop-blur-md p-4 sm:p-5 relative flex flex-col ${className}`}>
      {/* -------------------------------------------------------------
          HEADER & REAL-TIME LIQUIDITY METRICS
          ------------------------------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3.5 mb-2 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-800/60 text-cyan-400">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans">
                Order Book Depth & Volume Distribution
              </h3>
              <span className="flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>D3.JS STREAM</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Live Level-2 Bid/Ask volume curve, discrete order distribution & micro-price
            </p>
          </div>
        </div>

        {/* View Mode & Tiers Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {/* Mode Switcher */}
          <div className="flex items-center p-0.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px]">
            <button
              onClick={() => setViewMode('combined')}
              className={`px-2.5 py-1 rounded transition-colors ${
                viewMode === 'combined'
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Combined
            </button>
            <button
              onClick={() => setViewMode('depth')}
              className={`px-2.5 py-1 rounded transition-colors ${
                viewMode === 'depth'
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Depth Curve
            </button>
            <button
              onClick={() => setViewMode('volume')}
              className={`px-2.5 py-1 rounded transition-colors ${
                viewMode === 'volume'
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Vol Histogram
            </button>
          </div>

          {/* Level Count Selection */}
          <div className="flex items-center space-x-1 pl-2 border-l border-slate-800 text-[11px]">
            <span className="text-slate-500 text-[10px]">Tiers:</span>
            {[10, 20, 30].map(cnt => (
              <button
                key={cnt}
                onClick={() => setLevelCount(cnt)}
                className={`px-1.5 py-0.5 rounded text-[10px] ${
                  levelCount === cnt
                    ? 'bg-slate-800 text-white font-bold border border-slate-700'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {cnt}
              </button>
            ))}
          </div>

          {/* Aggregation */}
          <div className="flex items-center space-x-1 pl-2 border-l border-slate-800 text-[11px]">
            <span className="text-slate-500 text-[10px]">Group:</span>
            {[1, 2, 5].map(ag => (
              <button
                key={ag}
                onClick={() => setAggregation(ag)}
                className={`px-1.5 py-0.5 rounded text-[10px] ${
                  aggregation === ag
                    ? 'bg-slate-800 text-cyan-400 font-bold border border-slate-700'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {ag}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          REAL-TIME QUANTITATIVE GAUGES & IMBALANCE BAR
          ------------------------------------------------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3 font-mono text-xs">
        {/* Total Bid Volume */}
        <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-900/40 flex flex-col justify-between">
          <div className="text-[10px] text-emerald-400/80 flex items-center justify-between">
            <span>TOTAL BID DEPTH</span>
            <TrendingUp className="w-3 h-3 text-emerald-400" />
          </div>
          <div className="text-base font-bold text-emerald-400 mt-1">
            {depthData.totalBidVolume.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">lots</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Best Bid: <strong className="text-slate-200">{activeTick?.bid.toFixed(depthData.decimals) || '--'}</strong>
          </div>
        </div>

        {/* Total Ask Volume */}
        <div className="p-2.5 rounded-xl bg-rose-950/20 border border-rose-900/40 flex flex-col justify-between">
          <div className="text-[10px] text-rose-400/80 flex items-center justify-between">
            <span>TOTAL ASK DEPTH</span>
            <TrendingDown className="w-3 h-3 text-rose-400" />
          </div>
          <div className="text-base font-bold text-rose-400 mt-1">
            {depthData.totalAskVolume.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">lots</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Best Ask: <strong className="text-slate-200">{activeTick?.ask.toFixed(depthData.decimals) || '--'}</strong>
          </div>
        </div>

        {/* Spread & Micro-Price */}
        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
          <div className="text-[10px] text-cyan-400/80 flex items-center justify-between">
            <span>SPREAD & MIDPOINT</span>
            <span className="text-[9px] px-1 py-0.2 bg-cyan-950 text-cyan-300 rounded border border-cyan-800/60">SUB-MS</span>
          </div>
          <div className="text-base font-bold text-white mt-1">
            {depthData.spreadFormatted}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Micro-Price: <strong className="text-cyan-300">{depthData.microPrice.toFixed(depthData.decimals)}</strong>
          </div>
        </div>

        {/* Order Book Imbalance Ratio */}
        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
          <div className="text-[10px] text-slate-400 flex items-center justify-between">
            <span>BOOK IMBALANCE</span>
            <span className={`text-[10px] font-bold ${
              depthData.imbalanceBias === 'BULLISH' ? 'text-emerald-400' :
              depthData.imbalanceBias === 'BEARISH' ? 'text-rose-400' : 'text-slate-400'
            }`}>
              {depthData.imbalanceBias}
            </span>
          </div>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-emerald-400 font-bold text-xs">{depthData.imbalanceRatio}%</span>
            <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden flex">
              <div 
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${depthData.imbalanceRatio}%` }}
              />
              <div 
                className="bg-rose-500 h-full transition-all duration-300"
                style={{ width: `${100 - depthData.imbalanceRatio}%` }}
              />
            </div>
            <span className="text-rose-400 font-bold text-xs">{(100 - depthData.imbalanceRatio).toFixed(1)}%</span>
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">
            {depthData.imbalanceBias === 'BULLISH' ? 'Buyers defending bids' : depthData.imbalanceBias === 'BEARISH' ? 'Sellers stacking offers' : 'Balanced order flow'}
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          D3 CHART CONTAINER (Observed with ResizeObserver)
          ------------------------------------------------------------- */}
      <div 
        ref={containerRef} 
        className="w-full relative rounded-xl bg-slate-950/80 border border-slate-800/80 overflow-hidden flex items-center justify-center min-h-[300px]"
      >
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="w-full h-auto select-none"
        />

        {/* Interactive Floating Tooltip */}
        {hoveredLevel && (
          <div
            className="absolute pointer-events-none z-30 transition-all duration-75"
            style={{
              left: `${Math.min(hoveredLevel.x + 12, dimensions.width - 170)}px`,
              top: `${Math.max(10, Math.min(hoveredLevel.y - 45, dimensions.height - 110))}px`
            }}
          >
            <div className="p-2.5 rounded-lg bg-slate-900/95 border border-slate-700 shadow-2xl backdrop-blur-md text-[11px] font-mono min-w-[155px]">
              <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800">
                <span className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                  hoveredLevel.type === 'BID' 
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60' 
                    : 'bg-rose-950 text-rose-300 border border-rose-800/60'
                }`}>
                  {hoveredLevel.type}
                </span>
                <span className="text-white font-bold text-xs">
                  {hoveredLevel.level.price.toFixed(depthData.decimals)}
                </span>
              </div>
              <div className="space-y-1 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Level Vol:</span>
                  <span className="font-semibold text-white">{hoveredLevel.level.volume} lot</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Cumul. Vol:</span>
                  <span className="font-semibold text-cyan-300">{hoveredLevel.level.cumulativeVolume} lot</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Orders:</span>
                  <span className="text-slate-300">{hoveredLevel.level.orders} orders</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 pt-0.5 border-t border-slate-800/60">
                  <span>Dist. Mid:</span>
                  <span>{hoveredLevel.level.distancePips} pips</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chart Footer Note & Wall Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 mt-2.5 text-[10px] font-mono text-slate-500">
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Green Area: Stepped Bid Liquidity</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span>Red Area: Stepped Ask Liquidity</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-1 bg-cyan-400/80 rounded" />
            <span>Bars: Volume Distribution Histogram</span>
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {depthData.bidWall && (
            <span className="text-emerald-400/90">
              Bid Wall: {depthData.bidWall.price.toFixed(depthData.decimals)} ({depthData.bidWall.volume}L)
            </span>
          )}
          {depthData.askWall && (
            <span className="text-rose-400/90">
              • Ask Wall: {depthData.askWall.price.toFixed(depthData.decimals)} ({depthData.askWall.volume}L)
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
