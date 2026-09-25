import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { Sparkles, Activity, Globe, Info, Filter, ArrowUpRight, TrendingUp, Layers, RefreshCw } from 'lucide-react';
import { QuantumInfinityLogo } from './LogoVariants';

export interface HeatmapCellData {
  pair: string;
  hour: number; // 0 to 23
  hourLabel: string;
  session: 'TOKYO' | 'LONDON' | 'NEW_YORK' | 'OFF_HOURS';
  tickCount: number;
  volatilityPct: number; // e.g. 0.25 to 3.8%
  sentimentScore: number; // -100 to +100
  sentimentDensity: number; // 0 to 1
  spreadAvgPips: number;
  regime: 'LOW_ACTIVITY' | 'STEADY_FLOW' | 'HIGH_VOLATILITY' | 'FLASH_SPIKE';
}

interface MarketVolatilityHeatmapProps {
  className?: string;
  theme?: 'dark' | 'light';
}

const PAIRS = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'XAUUSD', 'BTCUSD'];

// Deterministic mock generator for historical ticks & sentiment density across 24h
function generateHeatmapData(): HeatmapCellData[] {
  const data: HeatmapCellData[] = [];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  PAIRS.forEach((pair, pairIdx) => {
    hours.forEach((h) => {
      // Determine session
      let session: 'TOKYO' | 'LONDON' | 'NEW_YORK' | 'OFF_HOURS' = 'OFF_HOURS';
      if (h >= 0 && h < 8) session = 'TOKYO';
      else if (h >= 8 && h < 13) session = 'LONDON';
      else if (h >= 13 && h < 21) session = 'NEW_YORK';

      // Volatility baseline depends on session & asset
      let baseVol = 0.4;
      if (session === 'LONDON') baseVol = 1.35;
      if (session === 'NEW_YORK') baseVol = 1.65;
      if (h === 13 || h === 14) baseVol = 2.4; // US-UK overlap peak

      if (pair === 'BTCUSD') baseVol *= 2.1;
      if (pair === 'XAUUSD') baseVol *= 1.7;

      // Deterministic pseudo-random variation
      const seed = Math.sin(pairIdx * 100 + h * 17) * 10000;
      const noise = seed - Math.floor(seed);
      const volatilityPct = +(baseVol * (0.7 + noise * 0.9)).toFixed(2);

      // Tick count correlated to volatility
      const tickCount = Math.floor(volatilityPct * 4200 + (noise * 2500) + 800);

      // Sentiment score (-100 to +100)
      const sentimentNoise = Math.cos(pairIdx * 50 + h * 11);
      const sentimentScore = Math.floor(sentimentNoise * 85 + (session === 'NEW_YORK' ? 15 : -10));

      // Sentiment density (0.1 to 1.0)
      const sentimentDensity = +(Math.abs(sentimentScore) / 100 * 0.7 + 0.3).toFixed(2);

      // Average spread
      const spreadAvgPips = +(0.2 + (pair === 'BTCUSD' ? 4.5 : pair === 'XAUUSD' ? 1.8 : 0.4) * (volatilityPct > 2 ? 1.5 : 1)).toFixed(1);

      let regime: 'LOW_ACTIVITY' | 'STEADY_FLOW' | 'HIGH_VOLATILITY' | 'FLASH_SPIKE' = 'STEADY_FLOW';
      if (volatilityPct < 0.8) regime = 'LOW_ACTIVITY';
      else if (volatilityPct >= 2.6) regime = 'FLASH_SPIKE';
      else if (volatilityPct >= 1.5) regime = 'HIGH_VOLATILITY';

      data.push({
        pair,
        hour: h,
        hourLabel: `${h.toString().padStart(2, '0')}:00`,
        session,
        tickCount,
        volatilityPct,
        sentimentScore,
        sentimentDensity,
        spreadAvgPips,
        regime
      });
    });
  });

  return data;
}

export const MarketVolatilityHeatmap: React.FC<MarketVolatilityHeatmapProps> = ({
  className = '',
  theme = 'dark'
}) => {
  const isLight = theme === 'light';
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [activeViewMode, setActiveViewMode] = useState<'volatility' | 'sentiment' | 'density'>('volatility');
  const [selectedCell, setSelectedCell] = useState<HeatmapCellData | null>(null);
  const [hoveredCell, setHoveredCell] = useState<HeatmapCellData | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [dataset, setDataset] = useState<HeatmapCellData[]>(() => generateHeatmapData());
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRefreshData = () => {
    setIsRegenerating(true);
    setTimeout(() => {
      setDataset(generateHeatmapData());
      setIsRegenerating(false);
    }, 300);
  };

  // Summary Metrics
  const summary = useMemo(() => {
    const totalTicks = dataset.reduce((acc, c) => acc + c.tickCount, 0);
    const avgVol = (dataset.reduce((acc, c) => acc + c.volatilityPct, 0) / dataset.length).toFixed(2);
    const spikeHours = dataset.filter(c => c.regime === 'FLASH_SPIKE').length;
    const avgSentiment = Math.round(dataset.reduce((acc, c) => acc + c.sentimentScore, 0) / dataset.length);
    return { totalTicks, avgVol, spikeHours, avgSentiment };
  }, [dataset]);

  // Render D3 Heatmap
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 800;
    const height = 280;
    const margin = { top: 25, right: 30, bottom: 40, left: 68 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const hours = Array.from({ length: 24 }, (_, i) => i);

    // Scales
    const xScale = d3
      .scaleBand<number>()
      .domain(hours)
      .range([0, innerWidth])
      .padding(0.08);

    const yScale = d3
      .scaleBand<string>()
      .domain(PAIRS)
      .range([0, innerHeight])
      .padding(0.08);

    // Color Scales depending on view mode
    // Volatility: Deep Navy / Cyan -> Emerald -> Amber -> Crimson
    const volColorScale = d3
      .scaleLinear<string>()
      .domain([0.3, 1.2, 2.2, 3.8])
      .range(
        isLight
          ? ['#e0f2fe', '#38bdf8', '#fbbf24', '#f43f5e']
          : ['#0c192c', '#0284c7', '#10b981', '#f43f5e']
      )
      .clamp(true);

    // Sentiment: Bearish Red -> Neutral Slate -> Bullish Green
    const sentimentColorScale = d3
      .scaleLinear<string>()
      .domain([-80, 0, 80])
      .range(
        isLight
          ? ['#fca5a5', '#e2e8f0', '#86efac']
          : ['#991b1b', '#1e293b', '#166534']
      )
      .clamp(true);

    // Density: Subtle Blue-Green glowing mesh
    const densityColorScale = d3
      .scaleLinear<string>()
      .domain([0.1, 0.5, 1.0])
      .range(
        isLight
          ? ['#e0f2fe', '#67e8f9', '#10b981']
          : ['#082f49', '#0284c7', '#34d399']
      )
      .clamp(true);

    // Draw Heatmap Cells
    const cells = g
      .selectAll('.heatmap-cell')
      .data(dataset)
      .enter()
      .append('rect')
      .attr('class', 'heatmap-cell')
      .attr('x', (d: HeatmapCellData) => xScale(d.hour) || 0)
      .attr('y', (d: HeatmapCellData) => yScale(d.pair) || 0)
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('rx', 3.5)
      .attr('ry', 3.5)
      .attr('fill', (d: HeatmapCellData) => {
        if (activeViewMode === 'volatility') return volColorScale(d.volatilityPct);
        if (activeViewMode === 'sentiment') return sentimentColorScale(d.sentimentScore);
        return densityColorScale(d.sentimentDensity);
      })
      .attr('stroke', (d: HeatmapCellData) => {
        if (selectedCell && selectedCell.pair === d.pair && selectedCell.hour === d.hour) {
          return '#38bdf8';
        }
        return isLight ? 'rgba(255,255,255,0.7)' : 'rgba(15,23,42,0.6)';
      })
      .attr('stroke-width', (d: HeatmapCellData) => {
        if (selectedCell && selectedCell.pair === d.pair && selectedCell.hour === d.hour) {
          return 2;
        }
        return 0.75;
      })
      .style('cursor', 'pointer')
      .style('transition', 'all 0.15s ease-out');

    // Cell interactions
    cells
      .on('mouseenter', function (event: MouseEvent, d: any) {
        const cellData = d as HeatmapCellData;
        d3.select(this)
          .attr('stroke', '#67e8f9')
          .attr('stroke-width', 2.2)
          .style('filter', 'drop-shadow(0 0 6px rgba(56,189,248,0.5))');

        const [mX, mY] = d3.pointer(event, container);
        setHoveredCell(cellData);
        setTooltipPos({ x: mX, y: mY });
      })
      .on('mousemove', function (event: MouseEvent) {
        const [mX, mY] = d3.pointer(event, container);
        setTooltipPos({ x: mX, y: mY });
      })
      .on('mouseleave', function () {
        d3.select(this)
          .attr('stroke', (d: any) => {
            const cellData = d as HeatmapCellData;
            if (selectedCell && selectedCell.pair === cellData.pair && selectedCell.hour === cellData.hour) {
              return '#38bdf8';
            }
            return isLight ? 'rgba(255,255,255,0.7)' : 'rgba(15,23,42,0.6)';
          })
          .attr('stroke-width', (d: any) => {
            const cellData = d as HeatmapCellData;
            if (selectedCell && selectedCell.pair === cellData.pair && selectedCell.hour === cellData.hour) {
              return 2;
            }
            return 0.75;
          })
          .style('filter', 'none');

        setHoveredCell(null);
        setTooltipPos(null);
      })
      .on('click', function (_: MouseEvent, d: any) {
        const cellData = d as HeatmapCellData;
        setSelectedCell(prev => (prev?.pair === cellData.pair && prev?.hour === cellData.hour ? null : cellData));
      });

    // X-Axis (Hours)
    const xAxis = d3
      .axisBottom(xScale)
      .tickValues(hours.filter(h => h % 2 === 0))
      .tickFormat(h => `${h.toString().padStart(2, '0')}:00`);

    const xAxisGroup = g
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis);

    xAxisGroup.select('.domain').attr('stroke', isLight ? '#cbd5e1' : '#334155');
    xAxisGroup
      .selectAll('.tick line')
      .attr('stroke', isLight ? '#cbd5e1' : '#334155');
    xAxisGroup
      .selectAll('.tick text')
      .attr('fill', isLight ? '#64748b' : '#94a3b8')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .attr('dy', '1em');

    // Y-Axis (Pairs)
    const yAxis = d3.axisLeft(yScale);
    const yAxisGroup = g.append('g').call(yAxis);

    yAxisGroup.select('.domain').remove();
    yAxisGroup.selectAll('.tick line').remove();
    yAxisGroup
      .selectAll('.tick text')
      .attr('fill', isLight ? '#334155' : '#e2e8f0')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('font-family', 'monospace')
      .attr('dx', '-0.5em');

    // Session Indicators (Top Bar)
    const sessionWidth = innerWidth;
    const sessionBar = g.append('g').attr('transform', 'translate(0,-16)');

    // Tokyo: 0-8 (8 hours / 24)
    sessionBar
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', (8 / 24) * sessionWidth)
      .attr('height', 8)
      .attr('rx', 2)
      .attr('fill', '#0284c7')
      .attr('opacity', 0.4);

    // London: 8-13 (5 hours / 24)
    sessionBar
      .append('rect')
      .attr('x', (8 / 24) * sessionWidth)
      .attr('y', 0)
      .attr('width', (5 / 24) * sessionWidth)
      .attr('height', 8)
      .attr('rx', 2)
      .attr('fill', '#10b981')
      .attr('opacity', 0.5);

    // New York: 13-21 (8 hours / 24)
    sessionBar
      .append('rect')
      .attr('x', (13 / 24) * sessionWidth)
      .attr('y', 0)
      .attr('width', (8 / 24) * sessionWidth)
      .attr('height', 8)
      .attr('rx', 2)
      .attr('fill', '#f59e0b')
      .attr('opacity', 0.5);

    // Off-hours: 21-24
    sessionBar
      .append('rect')
      .attr('x', (21 / 24) * sessionWidth)
      .attr('y', 0)
      .attr('width', (3 / 24) * sessionWidth)
      .attr('height', 8)
      .attr('rx', 2)
      .attr('fill', '#64748b')
      .attr('opacity', 0.3);

  }, [dataset, activeViewMode, isLight, selectedCell]);

  return (
    <div className={`rounded-xl border transition-colors ${
      isLight 
        ? 'bg-white border-slate-200 shadow-sm text-slate-800' 
        : 'bg-slate-900 border-slate-800 shadow-md text-slate-100'
    } ${className}`}>
      {/* Widget Header with Nexus Cortex Emblem */}
      <div className={`p-4 sm:p-5 border-b flex flex-col md:flex-row md:items-center justify-between gap-3 ${
        isLight ? 'border-slate-100 bg-slate-50/70' : 'border-slate-800/80 bg-slate-950/40'
      }`}>
        <div className="flex items-center space-x-3">
          <QuantumInfinityLogo size="sm" theme={theme} glow={true} />
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold tracking-tight text-white flex items-center space-x-1.5">
                <span className={isLight ? 'text-slate-900' : 'text-white'}>Institutional Market Volatility Heatmap</span>
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded border font-semibold bg-emerald-950/60 text-emerald-400 border-emerald-800/60 flex items-center space-x-1">
                <Activity className="w-2.5 h-2.5 animate-pulse" />
                <span>d3.js Engine</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Visualizes 24-hour historical tick fluctuations, liquidity bursts, and sentiment density matrix across institutional currency pairs.
            </p>
          </div>
        </div>

        {/* View Mode Controls & Refresh */}
        <div className="flex items-center space-x-2 self-start md:self-auto flex-wrap gap-1.5">
          <div className={`inline-flex p-1 rounded-lg border text-xs font-mono ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <button
              onClick={() => setActiveViewMode('volatility')}
              className={`px-2.5 py-1 rounded font-medium transition-all ${
                activeViewMode === 'volatility'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tick Volatility (%)
            </button>
            <button
              onClick={() => setActiveViewMode('sentiment')}
              className={`px-2.5 py-1 rounded font-medium transition-all ${
                activeViewMode === 'sentiment'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sentiment Density
            </button>
            <button
              onClick={() => setActiveViewMode('density')}
              className={`px-2.5 py-1 rounded font-medium transition-all ${
                activeViewMode === 'density'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Order Flow Density
            </button>
          </div>

          <button
            onClick={handleRefreshData}
            disabled={isRegenerating}
            title="Resample tick clusters"
            className={`p-1.5 rounded-lg border transition-all ${
              isLight
                ? 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 sm:px-5 border-b text-xs font-mono ${
        isLight ? 'border-slate-100 bg-slate-50/30' : 'border-slate-800/50 bg-slate-950/20'
      }`}>
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase">24H TICK VOLUME</span>
          <span className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {summary.totalTicks.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">ticks</span>
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase">AVG REALIZED VOL</span>
          <span className="text-sm font-bold text-cyan-400">
            {summary.avgVol}% <span className="text-[10px] font-normal text-slate-400">pips/hr</span>
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase">FLASH SPIKE PERIODS</span>
          <span className="text-sm font-bold text-rose-400">
            {summary.spikeHours} <span className="text-[10px] font-normal text-slate-400">regimes</span>
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase">MARKET SENTIMENT SKEW</span>
          <span className={`text-sm font-bold ${summary.avgSentiment >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {summary.avgSentiment >= 0 ? `+${summary.avgSentiment}` : summary.avgSentiment} <span className="text-[10px] font-normal text-slate-400">pts</span>
          </span>
        </div>
      </div>

      {/* D3 Heatmap Canvas Container */}
      <div ref={containerRef} className="relative p-4 sm:p-5 overflow-x-auto select-none">
        <svg ref={svgRef} className="w-full min-w-[700px] h-[280px]" />

        {/* Hover Tooltip */}
        {hoveredCell && tooltipPos && (
          <div
            className={`absolute z-30 pointer-events-none p-3 rounded-lg border shadow-xl text-xs font-mono transition-transform duration-75 ${
              isLight
                ? 'bg-white border-slate-300 text-slate-900'
                : 'bg-slate-950 border-cyan-500/50 text-slate-100 shadow-[0_0_20px_rgba(6,182,212,0.25)]'
            }`}
            style={{
              left: Math.min(tooltipPos.x + 14, (containerRef.current?.clientWidth || 700) - 220),
              top: Math.max(10, tooltipPos.y - 120),
              minWidth: '200px'
            }}
          >
            <div className="flex items-center justify-between border-b pb-1.5 mb-1.5 border-slate-700/60">
              <span className="font-bold text-white flex items-center space-x-1.5">
                <span className="text-cyan-400">{hoveredCell.pair}</span>
                <span className="text-slate-400">@ {hoveredCell.hourLabel}</span>
              </span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                hoveredCell.session === 'LONDON' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                hoveredCell.session === 'NEW_YORK' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                hoveredCell.session === 'TOKYO' ? 'bg-sky-950 text-sky-300 border border-sky-800' :
                'bg-slate-800 text-slate-400'
              }`}>
                {hoveredCell.session}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Tick Fluctuations:</span>
                <span className="font-bold text-white">{hoveredCell.tickCount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Historical Volatility:</span>
                <span className="font-bold text-cyan-300">{hoveredCell.volatilityPct}%</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Sentiment Density:</span>
                <span className={`font-bold ${hoveredCell.sentimentScore >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {hoveredCell.sentimentScore > 0 ? '+' : ''}{hoveredCell.sentimentScore} ({Math.round(hoveredCell.sentimentDensity * 100)}%)
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Spread Baseline:</span>
                <span className="text-slate-300">{hoveredCell.spreadAvgPips} pips</span>
              </div>
              <div className="pt-1 mt-1 border-t border-slate-800 flex justify-between items-center text-[10px]">
                <span className="text-slate-500">Regime:</span>
                <span className={`font-bold ${
                  hoveredCell.regime === 'FLASH_SPIKE' ? 'text-rose-400 animate-pulse' :
                  hoveredCell.regime === 'HIGH_VOLATILITY' ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {hoveredCell.regime}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Session Legend & Heatmap Color Guide */}
      <div className={`p-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
        isLight ? 'border-slate-100 bg-slate-50/50' : 'border-slate-800/80 bg-slate-950/40'
      }`}>
        {/* Sessions */}
        <div className="flex items-center space-x-3 text-[11px] font-mono flex-wrap gap-y-1">
          <span className="text-slate-500 font-semibold uppercase">Sessions:</span>
          <span className="inline-flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded bg-sky-600"></span>
            <span className="text-slate-400">Tokyo (00-08 UTC)</span>
          </span>
          <span className="inline-flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded bg-emerald-600"></span>
            <span className="text-slate-400">London (08-13 UTC)</span>
          </span>
          <span className="inline-flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded bg-amber-600"></span>
            <span className="text-slate-400">New York (13-21 UTC)</span>
          </span>
        </div>

        {/* Heatmap Gradient Key */}
        <div className="flex items-center space-x-2 text-[11px] font-mono">
          <span className="text-slate-500">Low</span>
          <div className="w-28 h-2 rounded-full overflow-hidden bg-gradient-to-r from-blue-900 via-emerald-500 to-rose-500" />
          <span className="text-slate-400 font-bold">Spike Peak</span>
        </div>
      </div>

      {/* Optional Selected Cell Drilldown Drawer */}
      {selectedCell && (
        <div className={`p-4 border-t flex items-center justify-between text-xs font-mono ${
          isLight ? 'border-slate-200 bg-blue-50/70 text-slate-800' : 'border-cyan-800/60 bg-cyan-950/20 text-cyan-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <div>
              <span className="font-bold text-white">{selectedCell.pair}</span> active slice at <span className="font-bold">{selectedCell.hourLabel} UTC</span> ({selectedCell.session}):
              {' '}Vol: <strong className="text-cyan-300">{selectedCell.volatilityPct}%</strong>,
              {' '}Ticks: <strong>{selectedCell.tickCount.toLocaleString()}</strong>,
              {' '}Sentiment: <strong className={selectedCell.sentimentScore >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {selectedCell.sentimentScore > 0 ? `+${selectedCell.sentimentScore}` : selectedCell.sentimentScore}
              </strong>
            </div>
          </div>
          <button
            onClick={() => setSelectedCell(null)}
            className="text-[11px] text-slate-400 hover:text-white underline ml-3"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
};
