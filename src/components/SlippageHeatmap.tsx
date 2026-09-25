import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { SlippageHeatmapCell } from '../types';
import { slippageAnalytics, ASSET_CLASSES, LATENCY_TIERS, getActiveLatencyTier } from '../services/SlippageAnalytics';
import { Activity, Flame, ShieldAlert, Cpu, BarChart3, Info, Crosshair, ArrowUpRight, Zap } from 'lucide-react';

interface SlippageHeatmapProps {
  currentLatencyMs: number;
  onSelectLatencyScenario?: (latencyMs: number) => void;
}

type MetricMode = 'avg' | 'p95' | 'fill';

export const SlippageHeatmap: React.FC<SlippageHeatmapProps> = ({ currentLatencyMs, onSelectLatencyScenario }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [data, setData] = useState<SlippageHeatmapCell[]>(slippageAnalytics.getMatrix());
  const [metricMode, setMetricMode] = useState<MetricMode>('avg');
  const [hoveredCell, setHoveredCell] = useState<SlippageHeatmapCell | null>(null);
  const [selectedCell, setSelectedCell] = useState<SlippageHeatmapCell | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(760);

  // Synchronize current latency with analytics service
  useEffect(() => {
    slippageAnalytics.setLatency(currentLatencyMs);
  }, [currentLatencyMs]);

  // Subscribe to real-time micro-updates from SlippageAnalytics
  useEffect(() => {
    const unsubscribe = slippageAnalytics.subscribe(() => {
      setData(slippageAnalytics.getMatrix());
    });
    return unsubscribe;
  }, []);

  // Responsive container observer
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0] && entries[0].contentRect.width > 0) {
        setContainerWidth(entries[0].contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const activeTierLabel = useMemo(() => getActiveLatencyTier(currentLatencyMs), [currentLatencyMs]);

  // Compute key summary metrics
  const activeCells = useMemo(() => {
    return data.filter((c) => c.latencyTier === activeTierLabel);
  }, [data, activeTierLabel]);

  const avgSlippageCurrentTier = useMemo(() => {
    if (activeCells.length === 0) return 0;
    return Number((activeCells.reduce((acc, c) => acc + c.avgSlippagePts, 0) / activeCells.length).toFixed(2));
  }, [activeCells]);

  const bestAssetCurrentTier = useMemo(() => {
    if (activeCells.length === 0) return null;
    return [...activeCells].sort((a, b) => a.avgSlippagePts - b.avgSlippagePts)[0];
  }, [activeCells]);

  // Render D3 Heatmap
  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = Math.max(580, containerWidth);
    const height = 310;
    const margin = {
      top: 38,
      right: 20,
      bottom: 24,
      left: width < 640 ? 110 : 155,
    };

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.attr('viewBox', `0 0 ${width} ${height}`).attr('width', '100%').attr('height', height);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const xLabels = LATENCY_TIERS.map((t) => t.label);
    const yLabels = ASSET_CLASSES.map((a) => a.name);

    // X and Y scales
    const xScale = d3.scaleBand<string>().domain(xLabels).range([0, innerWidth]).padding(0.08);

    const yScale = d3.scaleBand<string>().domain(yLabels).range([0, innerHeight]).padding(0.08);

    // Color scale definitions
    let colorScale: (val: number) => string;

    if (metricMode === 'avg') {
      // Slippage scale: Low (cyan/emerald) -> Mid (amber) -> High (rose/crimson)
      const colorInterpolator = d3
        .scaleLinear<string>()
        .domain([0.1, 0.6, 1.8, 4.0, 7.5])
        .range(['#064e3b', '#0d9488', '#d97706', '#e11d48', '#881337']);
      colorScale = (val: number) => colorInterpolator(val);
    } else if (metricMode === 'p95') {
      // P95 tail risk scale:
      const colorInterpolator = d3
        .scaleLinear<string>()
        .domain([0.3, 1.2, 3.5, 8.0, 15.0])
        .range(['#064e3b', '#0284c7', '#d97706', '#f43f5e', '#7f1d1d']);
      colorScale = (val: number) => colorInterpolator(val);
    } else {
      // Fill Rate: High % (emerald) -> Moderate (amber) -> Low % (crimson)
      const colorInterpolator = d3
        .scaleLinear<string>()
        .domain([75, 88, 95, 99.5])
        .range(['#881337', '#b45309', '#0d9488', '#059669']);
      colorScale = (val: number) => colorInterpolator(val);
    }

    // Draw active tier highlight column background
    const activeX = xScale(activeTierLabel);
    if (activeX !== undefined) {
      g.append('rect')
        .attr('x', activeX - 3)
        .attr('y', -8)
        .attr('width', xScale.bandwidth() + 6)
        .attr('height', innerHeight + 16)
        .attr('rx', 8)
        .attr('fill', '#0284c7')
        .attr('fill-opacity', 0.08)
        .attr('stroke', '#38bdf8')
        .attr('stroke-opacity', 0.4)
        .attr('stroke-dasharray', '3 3');

      // Add "ACTIVE PING" badge above column
      g.append('text')
        .attr('x', activeX + xScale.bandwidth() / 2)
        .attr('y', -18)
        .attr('text-anchor', 'middle')
        .attr('font-size', '9px')
        .attr('font-weight', '700')
        .attr('font-family', 'monospace')
        .attr('fill', '#38bdf8')
        .text(`LIVE (${currentLatencyMs}ms)`);
    }

    // Draw X Axis Labels (Latency Tiers)
    g.selectAll('.x-label')
      .data(LATENCY_TIERS)
      .enter()
      .append('text')
      .attr('class', 'x-label')
      .attr('x', (d) => (xScale(d.label) || 0) + xScale.bandwidth() / 2)
      .attr('y', -4)
      .attr('text-anchor', 'middle')
      .attr('font-size', width < 640 ? '9px' : '11px')
      .attr('font-weight', (d) => (d.label === activeTierLabel ? '700' : '500'))
      .attr('font-family', 'monospace')
      .attr('fill', (d) => (d.label === activeTierLabel ? '#38bdf8' : '#94a3b8'))
      .text((d) => d.label);

    // Draw Y Axis Labels (Asset Classes)
    yLabels.forEach((label) => {
      const yPos = (yScale(label) || 0) + yScale.bandwidth() / 2;
      const assetObj = ASSET_CLASSES.find((a) => a.name === label);

      const labelGroup = g
        .append('g')
        .attr('class', 'y-label-group')
        .attr('transform', `translate(-12, ${yPos})`);

      labelGroup
        .append('text')
        .attr('text-anchor', 'end')
        .attr('dominant-baseline', 'central')
        .attr('font-size', width < 640 ? '10px' : '11.5px')
        .attr('font-weight', '600')
        .attr('fill', '#e2e8f0')
        .text(label);

      if (width >= 640 && assetObj) {
        labelGroup
          .append('text')
          .attr('text-anchor', 'end')
          .attr('y', 13)
          .attr('font-size', '8.5px')
          .attr('font-family', 'monospace')
          .attr('fill', '#64748b')
          .text(assetObj.sub.split(',')[0] + '..');
      }
    });

    // Draw Heatmap Cells
    const cellGroups = g
      .selectAll<SVGGElement, SlippageHeatmapCell>('.heatmap-cell')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'heatmap-cell')
      .attr('transform', (d: SlippageHeatmapCell) => `translate(${xScale(d.latencyTier) || 0}, ${yScale(d.assetClass) || 0})`)
      .style('cursor', 'pointer')
      .on('mouseenter', (event: MouseEvent, d: SlippageHeatmapCell) => {
        setHoveredCell(d);
        d3.select(event.currentTarget as SVGGElement)
          .select('rect')
          .transition()
          .duration(120)
          .attr('stroke', '#38bdf8')
          .attr('stroke-width', 2);
      })
      .on('mouseleave', (event: MouseEvent, d: SlippageHeatmapCell) => {
        setHoveredCell(null);
        d3.select(event.currentTarget as SVGGElement)
          .select('rect')
          .transition()
          .duration(120)
          .attr('stroke', d.latencyTier === activeTierLabel ? '#0284c7' : '#334155')
          .attr('stroke-width', d.latencyTier === activeTierLabel ? 1.5 : 1);
      })
      .on('click', (_: MouseEvent, d: SlippageHeatmapCell) => {
        setSelectedCell(d);
      });

    // Background rect for each cell
    cellGroups
      .append('rect')
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('rx', 6)
      .attr('fill', (d: SlippageHeatmapCell) => {
        const val =
          metricMode === 'avg'
            ? d.avgSlippagePts
            : metricMode === 'p95'
            ? d.p95SlippagePts
            : d.fillRatePct;
        return colorScale(val);
      })
      .attr('fill-opacity', 0.88)
      .attr('stroke', (d: SlippageHeatmapCell) => (d.latencyTier === activeTierLabel ? '#0284c7' : '#1e293b'))
      .attr('stroke-width', (d: SlippageHeatmapCell) => (d.latencyTier === activeTierLabel ? 1.5 : 1))
      .transition()
      .duration(250);

    // Primary text in cell (Metric Value)
    cellGroups
      .append('text')
      .attr('x', xScale.bandwidth() / 2)
      .attr('y', yScale.bandwidth() / 2 - (yScale.bandwidth() > 38 ? 3 : 0))
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-size', width < 640 ? '10px' : '11.5px')
      .attr('font-weight', '700')
      .attr('font-family', 'monospace')
      .attr('fill', '#ffffff')
      .attr('letter-spacing', '-0.02em')
      .text((d: SlippageHeatmapCell) => {
        if (metricMode === 'avg') return `+${d.avgSlippagePts.toFixed(2)}`;
        if (metricMode === 'p95') return `+${d.p95SlippagePts.toFixed(2)}`;
        return `${d.fillRatePct.toFixed(1)}%`;
      });

    // Secondary subtext in cell (points label or sample count)
    if (yScale.bandwidth() > 38) {
      cellGroups
        .append('text')
        .attr('x', xScale.bandwidth() / 2)
        .attr('y', yScale.bandwidth() / 2 + 12)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('font-size', '8.5px')
        .attr('font-family', 'monospace')
        .attr('fill', '#cbd5e1')
        .attr('fill-opacity', 0.75)
        .text((d: SlippageHeatmapCell) => {
          if (metricMode === 'avg') return 'pts';
          if (metricMode === 'p95') return 'P95 tail';
          return 'fill rate';
        });
    }
  }, [data, metricMode, activeTierLabel, containerWidth, currentLatencyMs]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-cyan-950/60 border border-cyan-800/60 rounded-lg text-cyan-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Cross-Asset Slippage Distribution Heatmap
              </h3>
              <span className="bg-cyan-950 text-cyan-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-cyan-800">
                D3.js Real-Time
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Correlates network execution latency with adverse slippage distributions & fill ratios across 5 asset classes.
            </p>
          </div>
        </div>

        {/* Metric Selector Buttons */}
        <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setMetricMode('avg')}
            className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-all ${
              metricMode === 'avg'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            Avg Slippage
          </button>
          <button
            onClick={() => setMetricMode('p95')}
            className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-all ${
              metricMode === 'p95'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            P95 Tail Risk
          </button>
          <button
            onClick={() => setMetricMode('fill')}
            className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-all ${
              metricMode === 'fill'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            Fill Rate %
          </button>
        </div>
      </div>

      {/* Live KPIs for Active Latency Tier */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
          <div className="text-[10px] uppercase font-mono font-bold text-slate-500">Active Latency Tier</div>
          <div className="text-sm font-bold font-mono text-cyan-400 flex items-center space-x-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>{activeTierLabel} ({currentLatencyMs} ms)</span>
          </div>
        </div>

        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
          <div className="text-[10px] uppercase font-mono font-bold text-slate-500">Tier Mean Slippage</div>
          <div className="text-sm font-bold font-mono text-emerald-400 mt-0.5">
            +{avgSlippageCurrentTier} pts
          </div>
        </div>

        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
          <div className="text-[10px] uppercase font-mono font-bold text-slate-500">Tightest Spread Class</div>
          <div className="text-sm font-bold font-mono text-white mt-0.5 truncate">
            {bestAssetCurrentTier ? bestAssetCurrentTier.assetClass : 'FX Majors'}
          </div>
        </div>

        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
          <div className="text-[10px] uppercase font-mono font-bold text-slate-500">Requote Hazard Zone</div>
          <div className="text-sm font-bold font-mono text-rose-400 mt-0.5 flex items-center space-x-1">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>&gt; 50ms (Crypto/Ind.)</span>
          </div>
        </div>
      </div>

      {/* D3 Heatmap SVG Container */}
      <div ref={containerRef} className="w-full relative overflow-x-auto bg-slate-950/70 p-2 rounded-xl border border-slate-800/60">
        <svg ref={svgRef} className="w-full block select-none" />

        {/* Heatmap Color Scale Legend */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-slate-900 text-[10px] text-slate-400 font-mono">
          <div className="flex items-center space-x-2">
            <span>Tight Slippage / High Fill</span>
            <div className="flex h-2 w-32 rounded overflow-hidden">
              {metricMode === 'fill' ? (
                <>
                  <div className="flex-1 bg-[#881337]"></div>
                  <div className="flex-1 bg-[#b45309]"></div>
                  <div className="flex-1 bg-[#0d9488]"></div>
                  <div className="flex-1 bg-[#059669]"></div>
                </>
              ) : (
                <>
                  <div className="flex-1 bg-[#064e3b]"></div>
                  <div className="flex-1 bg-[#0d9488]"></div>
                  <div className="flex-1 bg-[#d97706]"></div>
                  <div className="flex-1 bg-[#e11d48]"></div>
                  <div className="flex-1 bg-[#881337]"></div>
                </>
              )}
            </div>
            <span>Severe Slippage / Low Fill</span>
          </div>

          <div className="text-[10px] text-slate-500 hidden sm:block">
            Hover cell for routing &amp; distribution stats
          </div>
        </div>
      </div>

      {/* Interactive Cell Inspector / Detail Popover */}
      {(hoveredCell || selectedCell) && (
        <div className="bg-slate-950 border border-cyan-800/50 rounded-xl p-4 transition-all shadow-lg shadow-cyan-950/20">
          {(() => {
            const cell = hoveredCell || selectedCell!;
            const isActive = cell.latencyTier === activeTierLabel;

            return (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                  <div className="flex items-center space-x-2">
                    <Crosshair className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white uppercase">{cell.assetClass}</span>
                    <span className="text-xs text-slate-400 font-mono">({cell.assetClassSub})</span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300">
                      Tier: {cell.latencyTier}
                    </span>
                    {isActive && (
                      <span className="text-[10px] font-mono bg-blue-950 text-blue-400 border border-blue-800 px-1.5 py-0.5 rounded flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                        <span>ACTIVE LIVE ROUTE</span>
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    Optimal Route: <strong className="text-emerald-400">{cell.recommendedRoute}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase">Avg Slippage</div>
                    <div className="text-base font-bold text-white mt-0.5">+{cell.avgSlippagePts} pts</div>
                    <div className="text-[9px] text-slate-400">~{(cell.avgSlippagePts * 0.85).toFixed(2)} bps</div>
                  </div>

                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase">P95 Tail Risk</div>
                    <div className="text-base font-bold text-amber-400 mt-0.5">+{cell.p95SlippagePts} pts</div>
                    <div className="text-[9px] text-slate-400">95% fills within bound</div>
                  </div>

                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase">Fill Probability</div>
                    <div className={`text-base font-bold mt-0.5 ${cell.fillRatePct >= 95 ? 'text-emerald-400' : cell.fillRatePct >= 88 ? 'text-amber-400' : 'text-rose-400'}`}>
                      {cell.fillRatePct}%
                    </div>
                    <div className="text-[9px] text-slate-400">Requote risk: {(100 - cell.fillRatePct).toFixed(1)}%</div>
                  </div>

                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase">Sample Volume</div>
                    <div className="text-base font-bold text-slate-200 mt-0.5">
                      {cell.sampleCount.toLocaleString()}
                    </div>
                    <div className="text-[9px] text-slate-400">ticks recorded</div>
                  </div>
                </div>

                {cell.latencyMax > 50 && (
                  <div className="bg-amber-950/20 border border-amber-900/40 rounded-lg p-2 flex items-center space-x-2 text-[11px] text-amber-300 font-mono">
                    <Info className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                    <span>
                      High-latency warning: At &gt;50ms, {cell.assetClass} order books shift rapidly. Ensure `MqlTradeRequest.deviation` is set to &ge;{Math.round(cell.p95SlippagePts * 1.5)} points to avoid rejection retcodes (10014).
                    </span>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
