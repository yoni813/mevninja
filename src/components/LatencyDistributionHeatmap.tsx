import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  Activity, Zap, AlertTriangle, RefreshCw, Layers, 
  Info, TrendingUp, Filter, ShieldCheck, ChevronRight,
  Cpu, Clock, Gauge, ArrowUpRight, BarChart3, Radio
} from 'lucide-react';

export interface LatencyHeatmapCell {
  hour: number;
  hourLabel: string;
  tierId: number; // 0 = <6ms, 1 = 6-8ms, 2 = 8-12ms, 3 = 12-20ms, 4 = 20-35ms, 5 = >35ms
  tierLabel: string;
  tierRange: string;
  sampleCount: number;
  percentageInTier: number; // e.g. 78.4%
  hourlyTotalTicks: number; // e.g. 185,000 ticks
  hourlySpikesCount: number; // total spikes > 15ms
  spikeFrequencyPct: number; // (hourlySpikesCount / hourlyTotalTicks) * 100
  bottleneckScore: number; // 0 - 100 composite risk score
  bottleneckLevel: 'OPTIMAL' | 'LOW_RISK' | 'MODERATE' | 'BOTTLENECK' | 'CRITICAL_CONGESTION';
  avgLatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  maxSpikeMs: number;
  session: 'ASIAN' | 'LONDON' | 'NY_LONDON_OVERLAP' | 'NY_AFTERNOON' | 'ROLLOVER';
  rootCause: string;
  mitigationRecommendation: string;
}

export interface HourlySummary {
  hour: number;
  hourLabel: string;
  totalTicks: number;
  spikesCount: number;
  spikeFrequencyPct: number;
  avgLatencyMs: number;
  p99LatencyMs: number;
  bottleneckScore: number;
  session: 'ASIAN' | 'LONDON' | 'NY_LONDON_OVERLAP' | 'NY_AFTERNOON' | 'ROLLOVER';
}

interface LatencyDistributionHeatmapProps {
  className?: string;
  theme?: 'dark' | 'light';
  currentRealtimeLatency?: number;
}

const LATENCY_TIERS = [
  { id: 5, label: '> 35.0ms', range: 'Critical Outlier Spike', severity: 'critical' },
  { id: 4, label: '20.0 - 35.0ms', range: 'Severe Jitter', severity: 'high' },
  { id: 3, label: '12.0 - 20.0ms', range: 'Elevated Buffer', severity: 'medium' },
  { id: 2, label: '8.0 - 12.0ms', range: 'Moderate Latency', severity: 'low' },
  { id: 1, label: '6.0 - 8.0ms', range: 'Nominal VPS Baseline', severity: 'nominal' },
  { id: 0, label: '< 6.0ms', range: 'Ultra-Fast Kernel Bypass', severity: 'optimal' },
];

// Helper to determine session by hour (UTC)
function getTradingSession(hour: number): 'ASIAN' | 'LONDON' | 'NY_LONDON_OVERLAP' | 'NY_AFTERNOON' | 'ROLLOVER' {
  if (hour >= 0 && hour < 8) return 'ASIAN';
  if (hour >= 8 && hour < 13) return 'LONDON';
  if (hour >= 13 && hour < 17) return 'NY_LONDON_OVERLAP';
  if (hour >= 17 && hour < 21) return 'NY_AFTERNOON';
  return 'ROLLOVER';
}

// Generate realistic deterministic 24-hour latency distribution data
function generate24HourLatencyData(): { cells: LatencyHeatmapCell[]; hourlySummaries: HourlySummary[] } {
  const cells: LatencyHeatmapCell[] = [];
  const hourlySummaries: HourlySummary[] = [];

  for (let h = 0; h < 24; h++) {
    const session = getTradingSession(h);
    const hourLabel = `${h.toString().padStart(2, '0')}:00`;

    // Baseline tick volume curves based on global FX liquidity
    let baseTicks = 32000;
    let baseSpikeRate = 0.15; // 0.15% baseline spike rate
    let baseLatency = 6.2; // 6.2ms South Africa VPS baseline

    if (session === 'ASIAN') {
      baseTicks = 28000 + Math.sin(h * 0.8) * 8000;
      baseSpikeRate = 0.08 + (h === 4 ? 0.25 : 0); // Tokyo open bump
      baseLatency = 6.1;
    } else if (session === 'LONDON') {
      baseTicks = 115000 + Math.sin((h - 8) * 0.7) * 25000;
      baseSpikeRate = 0.65;
      baseLatency = 6.8;
    } else if (session === 'NY_LONDON_OVERLAP') {
      // Peak liquidity & maximum bottleneck probability
      baseTicks = 195000 + Math.sin((h - 13) * 0.9) * 35000;
      baseSpikeRate = 2.45 + (h === 14 ? 1.4 : h === 15 ? 0.9 : 0); // 14:00 - 15:00 peak
      baseLatency = 8.4;
    } else if (session === 'NY_AFTERNOON') {
      baseTicks = 78000 - (h - 17) * 9000;
      baseSpikeRate = 0.42;
      baseLatency = 6.7;
    } else {
      // Rollover window (21:00 - 23:00)
      baseTicks = 18000;
      baseSpikeRate = 1.15; // Spread widening & rollover processing spikes
      baseLatency = 7.2;
    }

    const hourlyTotalTicks = Math.round(baseTicks);
    const spikeFrequencyPct = Number(baseSpikeRate.toFixed(2));
    const hourlySpikesCount = Math.round((hourlyTotalTicks * spikeFrequencyPct) / 100);

    // Compute composite bottleneck score (0 - 100)
    // Normalized by both tick volume saturation and spike frequency
    const volumeFactor = Math.min(1, hourlyTotalTicks / 220000);
    const spikeFactor = Math.min(1, spikeFrequencyPct / 3.8);
    const bottleneckScore = Math.round((spikeFactor * 65 + volumeFactor * 35));

    let bottleneckLevel: 'OPTIMAL' | 'LOW_RISK' | 'MODERATE' | 'BOTTLENECK' | 'CRITICAL_CONGESTION' = 'OPTIMAL';
    if (bottleneckScore >= 75) bottleneckLevel = 'CRITICAL_CONGESTION';
    else if (bottleneckScore >= 55) bottleneckLevel = 'BOTTLENECK';
    else if (bottleneckScore >= 35) bottleneckLevel = 'MODERATE';
    else if (bottleneckScore >= 18) bottleneckLevel = 'LOW_RISK';

    const avgLatencyMs = Number((baseLatency + (spikeFrequencyPct * 0.45)).toFixed(2));
    const p95LatencyMs = Number((avgLatencyMs + 1.8 + (spikeFrequencyPct * 1.2)).toFixed(2));
    const p99LatencyMs = Number((p95LatencyMs + 3.5 + (spikeFrequencyPct * 4.8)).toFixed(2));
    const maxSpikeMs = Number((p99LatencyMs + 12.0 + (spikeFrequencyPct * 8.5)).toFixed(1));

    hourlySummaries.push({
      hour: h,
      hourLabel,
      totalTicks: hourlyTotalTicks,
      spikesCount: hourlySpikesCount,
      spikeFrequencyPct,
      avgLatencyMs,
      p99LatencyMs,
      bottleneckScore,
      session
    });

    // Root cause and mitigation messages
    let rootCause = 'Optimal fiber baseline execution with zero packet queuing.';
    let mitigationRecommendation = 'Maintain standard DPDK kernel-bypass sockets.';

    if (session === 'NY_LONDON_OVERLAP') {
      rootCause = 'Heavy order flow concentration in Equinix LD4-NY4 transit; micro-burst queue saturation.';
      mitigationRecommendation = 'Engage AWS Nitro Enclave direct queue steering & widen slippage guardrails by 0.3 pips.';
    } else if (session === 'ROLLOVER') {
      rootCause = 'MetaTrader 5 broker daily server maintenance and liquidity provider bank rollovers.';
      mitigationRecommendation = 'Enable temporary protective execution halt on high-spread currency pairs.';
    } else if (session === 'LONDON') {
      rootCause = 'European institutional macroeconomic release flow causing transient NIC ring-buffer congestion.';
      mitigationRecommendation = 'Pre-allocate zero-copy memory ring buffers for top 5 currency pairs.';
    }

    // Distribute sample percentages across the 6 tiers
    // Higher spike frequency shifts percentages upward into tiers 3, 4, and 5
    let p0 = 22; // <6ms
    let p1 = 64; // 6-8ms
    let p2 = 10; // 8-12ms
    let p3 = 3;  // 12-20ms
    let p4 = 0.8; // 20-35ms
    let p5 = 0.2; // >35ms

    if (bottleneckScore > 65) {
      p0 = 8;
      p1 = 44;
      p2 = 26;
      p3 = 14;
      p4 = 5.2;
      p5 = 2.8;
    } else if (bottleneckScore > 40) {
      p0 = 14;
      p1 = 56;
      p2 = 18;
      p3 = 8;
      p4 = 2.8;
      p5 = 1.2;
    }

    const tierPercentages = [p0, p1, p2, p3, p4, p5];

    LATENCY_TIERS.forEach(tier => {
      const pct = tierPercentages[tier.id];
      const count = Math.round((hourlyTotalTicks * pct) / 100);

      cells.push({
        hour: h,
        hourLabel,
        tierId: tier.id,
        tierLabel: tier.label,
        tierRange: tier.range,
        sampleCount: count,
        percentageInTier: pct,
        hourlyTotalTicks,
        hourlySpikesCount,
        spikeFrequencyPct,
        bottleneckScore,
        bottleneckLevel,
        avgLatencyMs,
        p95LatencyMs,
        p99LatencyMs,
        maxSpikeMs,
        session,
        rootCause,
        mitigationRecommendation
      });
    });
  }

  return { cells, hourlySummaries };
}

export const LatencyDistributionHeatmap: React.FC<LatencyDistributionHeatmapProps> = ({
  className = '',
  theme = 'dark',
  currentRealtimeLatency = 6.2
}) => {
  const isLight = theme === 'light';
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // View metric modes
  const [metricMode, setMetricMode] = useState<'spike_frequency' | 'bottleneck_index' | 'tick_volume' | 'sample_density'>('spike_frequency');
  
  // Selected cell & tooltip state
  const [selectedCell, setSelectedCell] = useState<LatencyHeatmapCell | null>(null);
  const [hoveredCell, setHoveredCell] = useState<LatencyHeatmapCell | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [isSimulatingBurst, setIsSimulatingBurst] = useState(false);

  // 24h dataset
  const { cells: dataset, hourlySummaries } = useMemo(() => generate24HourLatencyData(), []);

  // Top-level stats calculation
  const summaryMetrics = useMemo(() => {
    let peakBottleneckHour = hourlySummaries[0];
    let minLatencyHour = hourlySummaries[0];
    let totalTicks = 0;
    let totalSpikes = 0;

    hourlySummaries.forEach(h => {
      totalTicks += h.totalTicks;
      totalSpikes += h.spikesCount;
      if (h.bottleneckScore > peakBottleneckHour.bottleneckScore) {
        peakBottleneckHour = h;
      }
      if (h.avgLatencyMs < minLatencyHour.avgLatencyMs) {
        minLatencyHour = h;
      }
    });

    const avgSpikeFrequency = Number(((totalSpikes / totalTicks) * 100).toFixed(2));

    return {
      peakBottleneckHour,
      minLatencyHour,
      totalTicks,
      totalSpikes,
      avgSpikeFrequency
    };
  }, [hourlySummaries]);

  // Initial cell selection (default to peak bottleneck hour tier 5)
  useEffect(() => {
    if (!selectedCell && dataset.length > 0) {
      const peak = dataset.find(c => c.hour === summaryMetrics.peakBottleneckHour.hour && c.tierId === 5);
      if (peak) setSelectedCell(peak);
    }
  }, [dataset, summaryMetrics, selectedCell]);

  // D3 Heatmap Rendering
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 780;
    const height = 300;

    const margin = { top: 28, right: 20, bottom: 44, left: 105 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const tierIds = [5, 4, 3, 2, 1, 0]; // Descending order: highest latency at top

    // X-Scale (Hours 0-23)
    const xScale = d3
      .scaleBand<number>()
      .domain(hours)
      .range([0, innerWidth])
      .padding(0.08);

    // Y-Scale (Latency Tiers 0-5)
    const yScale = d3
      .scaleBand<number>()
      .domain(tierIds)
      .range([0, innerHeight])
      .padding(0.08);

    // Color Scales
    // 1. Spike Frequency Scale: Green (low spikes) -> Amber (moderate) -> Crimson/Red (high spike bottleneck)
    const spikeColorScale = d3
      .scaleLinear<string>()
      .domain([0.05, 0.8, 1.8, 3.8])
      .range(isLight ? ['#ecfdf5', '#fef3c7', '#fed7aa', '#f43f5e'] : ['#064e3b', '#78350f', '#9a3412', '#e11d48'])
      .clamp(true);

    // 2. Bottleneck Severity Score (0 to 100)
    const bottleneckColorScale = d3
      .scaleLinear<string>()
      .domain([0, 30, 60, 90])
      .range(isLight ? ['#f0fdf4', '#fef08a', '#fb923c', '#e11d48'] : ['#022c22', '#713f12', '#9a3412', '#be123c'])
      .clamp(true);

    // 3. Tick Volume Scale: Deep Cyan to Emerald
    const volumeColorScale = d3
      .scaleLinear<string>()
      .domain([15000, 75000, 150000, 230000])
      .range(isLight ? ['#ecfeff', '#bae6fd', '#38bdf8', '#0284c7'] : ['#083344', '#0c4a6e', '#0284c7', '#06b6d4'])
      .clamp(true);

    // 4. Sample Distribution Density (%)
    const densityColorScale = d3
      .scaleLinear<string>()
      .domain([0, 10, 40, 75])
      .range(isLight ? ['#f8fafc', '#cbd5e1', '#64748b', '#0f172a'] : ['#090d16', '#1e293b', '#334155', '#38bdf8'])
      .clamp(true);

    // Draw Heatmap Cells
    const cells = g
      .selectAll('.latency-heatmap-cell')
      .data(dataset)
      .enter()
      .append('rect')
      .attr('class', 'latency-heatmap-cell')
      .attr('x', (d: LatencyHeatmapCell) => xScale(d.hour) || 0)
      .attr('y', (d: LatencyHeatmapCell) => yScale(d.tierId) || 0)
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('rx', 3)
      .attr('ry', 3)
      .attr('fill', (d: LatencyHeatmapCell) => {
        if (metricMode === 'spike_frequency') {
          // If in tier > 2 (elevated/critical), amplify fill by spike rate
          if (d.tierId >= 3) {
            return spikeColorScale(d.spikeFrequencyPct);
          }
          return isLight ? '#f1f5f9' : '#0a101d';
        }
        if (metricMode === 'bottleneck_index') {
          return bottleneckColorScale(d.bottleneckScore);
        }
        if (metricMode === 'tick_volume') {
          return volumeColorScale(d.hourlyTotalTicks);
        }
        return densityColorScale(d.percentageInTier);
      })
      .attr('stroke', (d: LatencyHeatmapCell) => {
        if (selectedCell && selectedCell.hour === d.hour && selectedCell.tierId === d.tierId) {
          return '#38bdf8';
        }
        if (d.tierId >= 4 && d.spikeFrequencyPct > 2.0) {
          return isLight ? '#fda4af' : '#e11d48';
        }
        return isLight ? 'rgba(255,255,255,0.7)' : 'rgba(15,23,42,0.8)';
      })
      .attr('stroke-width', (d: LatencyHeatmapCell) => {
        if (selectedCell && selectedCell.hour === d.hour && selectedCell.tierId === d.tierId) {
          return 2.5;
        }
        if (d.tierId >= 4 && d.spikeFrequencyPct > 2.0) {
          return 1.2;
        }
        return 0.75;
      })
      .style('cursor', 'pointer')
      .style('transition', 'all 0.15s ease-out');

    // Cell interactions
    cells
      .on('mouseenter', function (event: MouseEvent, d: any) {
        const cellData = d as LatencyHeatmapCell;
        d3.select(this)
          .attr('stroke', '#38bdf8')
          .attr('stroke-width', 2.5)
          .style('filter', 'drop-shadow(0 0 6px rgba(56,189,248,0.6))');

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
            const cellData = d as LatencyHeatmapCell;
            if (selectedCell && selectedCell.hour === cellData.hour && selectedCell.tierId === cellData.tierId) {
              return '#38bdf8';
            }
            if (cellData.tierId >= 4 && cellData.spikeFrequencyPct > 2.0) {
              return isLight ? '#fda4af' : '#e11d48';
            }
            return isLight ? 'rgba(255,255,255,0.7)' : 'rgba(15,23,42,0.8)';
          })
          .attr('stroke-width', (d: any) => {
            const cellData = d as LatencyHeatmapCell;
            if (selectedCell && selectedCell.hour === cellData.hour && selectedCell.tierId === cellData.tierId) {
              return 2.5;
            }
            return 0.75;
          })
          .style('filter', 'none');

        setHoveredCell(null);
        setTooltipPos(null);
      })
      .on('click', function (_: MouseEvent, d: any) {
        const cellData = d as LatencyHeatmapCell;
        setSelectedCell(cellData);
      });

    // X-Axis (Hours)
    const xAxis = d3
      .axisBottom(xScale)
      .tickValues(hours.filter(h => h % 2 === 0))
      .tickFormat(h => `${h.toString().padStart(2, '0')}:00`);

    const xAxisGroup = g
      .append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis);

    xAxisGroup.select('.domain').attr('stroke', isLight ? '#cbd5e1' : '#334155');
    xAxisGroup.selectAll('.tick line').attr('stroke', isLight ? '#cbd5e1' : '#334155');
    xAxisGroup
      .selectAll('.tick text')
      .attr('fill', isLight ? '#64748b' : '#94a3b8')
      .attr('font-family', 'monospace')
      .attr('font-size', '10px');

    // Y-Axis (Latency Tiers)
    const tierMap = new Map(LATENCY_TIERS.map(t => [t.id, t.label]));
    const yAxis = d3
      .axisLeft(yScale)
      .tickFormat(id => tierMap.get(id as number) || '');

    const yAxisGroup = g.append('g').attr('class', 'y-axis').call(yAxis);

    yAxisGroup.select('.domain').attr('stroke', isLight ? '#cbd5e1' : '#334155');
    yAxisGroup.selectAll('.tick line').attr('stroke', isLight ? '#cbd5e1' : '#334155');
    yAxisGroup
      .selectAll('.tick text')
      .attr('fill', (d: any) => {
        const id = d as number;
        if (id === 5) return '#ef4444'; // Red for critical spike
        if (id === 4) return '#f97316'; // Orange for severe jitter
        if (id === 3) return '#eab308'; // Amber for buffer
        if (id === 2) return '#06b6d4'; // Cyan
        return isLight ? '#0f766e' : '#10b981'; // Green for baseline
      })
      .attr('font-family', 'monospace')
      .attr('font-size', '10px')
      .attr('font-weight', '600');

    // Top X-Axis Header Indicator (Tick Volume & Spike Concentration Overlay)
    const topBarHeight = 14;
    const maxTicks: number = d3.max<HourlySummary, number>(hourlySummaries, (s: HourlySummary) => s.totalTicks) || 240000;

    const volumeBarGroup = g.append('g').attr('class', 'top-volume-bars');

    hourlySummaries.forEach(s => {
      const x = xScale(s.hour) || 0;
      const w = xScale.bandwidth();
      const normH = (s.totalTicks / maxTicks) * topBarHeight;

      // Small volume bar indicator above each column
      volumeBarGroup
        .append('rect')
        .attr('x', x)
        .attr('y', -normH - 3)
        .attr('width', w)
        .attr('height', normH)
        .attr('rx', 1.5)
        .attr('fill', s.spikeFrequencyPct > 2.0 ? '#f43f5e' : isLight ? '#0284c7' : '#06b6d4')
        .attr('opacity', 0.65);
    });

  }, [dataset, hourlySummaries, metricMode, selectedCell, isLight]);

  // Handler for simulating live burst traffic test
  const handleSimulateBurst = () => {
    setIsSimulatingBurst(true);
    setTimeout(() => {
      setIsSimulatingBurst(false);
      // Select the active peak bottleneck cell
      const target = dataset.find(c => c.hour === 14 && c.tierId === 5);
      if (target) setSelectedCell(target);
    }, 1200);
  };

  return (
    <div id="vps-latency-heatmap-module" className={`w-full rounded-2xl border p-4 sm:p-5 transition-colors ${
      isLight 
        ? 'bg-white/80 border-slate-200/80 shadow-sm text-slate-900' 
        : 'bg-slate-950/60 border-slate-800/80 shadow-xl text-slate-100'
    } ${className}`}>

      {/* Module Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-800/50">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-mono text-sm font-bold tracking-wider flex items-center space-x-2">
                <span>24-HOUR LATENCY DISTRIBUTION &amp; BOTTLENECK HEATMAP</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-800">
                  D3.js ENGINE
                </span>
              </h3>
            </div>
            <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Evaluates execution spike frequency relative to tick volume to isolate routing congestion across global sessions.
            </p>
          </div>
        </div>

        {/* View Mode Controls */}
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
          <span className="text-slate-400 text-[11px] mr-1 flex items-center">
            <Filter className="w-3 h-3 mr-1" />
            Metric:
          </span>
          {[
            { id: 'spike_frequency', label: 'Spike Freq %' },
            { id: 'bottleneck_index', label: 'Bottleneck Score' },
            { id: 'tick_volume', label: 'Tick Ingestion' },
            { id: 'sample_density', label: 'Tier Density %' }
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => setMetricMode(btn.id as any)}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                metricMode === btn.id
                  ? isLight
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : isLight
                    ? 'bg-slate-100 text-slate-600 hover:text-slate-900'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top 4 Telemetry Kpis */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4 font-mono">
        <div className={`p-3 rounded-xl border ${
          isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-900/40 border-slate-800/80'
        }`}>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Critical Bottleneck Zone</span>
          <div className="flex items-baseline space-x-2 mt-0.5">
            <span className="text-base font-bold text-rose-400">{summaryMetrics.peakBottleneckHour.hourLabel} UTC</span>
            <span className="text-[11px] text-rose-500/90 font-semibold">({summaryMetrics.peakBottleneckHour.spikeFrequencyPct}% spikes)</span>
          </div>
          <span className="text-[10px] text-slate-500 block truncate">NY-London Overlap (230k ticks/hr)</span>
        </div>

        <div className={`p-3 rounded-xl border ${
          isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-900/40 border-slate-800/80'
        }`}>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Fastest Execution Window</span>
          <div className="flex items-baseline space-x-2 mt-0.5">
            <span className="text-base font-bold text-emerald-400">{summaryMetrics.minLatencyHour.hourLabel} UTC</span>
            <span className="text-[11px] text-emerald-500/90 font-semibold">({summaryMetrics.minLatencyHour.avgLatencyMs}ms avg)</span>
          </div>
          <span className="text-[10px] text-slate-500 block truncate">Asian Session Baseline Flow</span>
        </div>

        <div className={`p-3 rounded-xl border ${
          isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-900/40 border-slate-800/80'
        }`}>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">24h Mean Spike Frequency</span>
          <div className="flex items-baseline space-x-2 mt-0.5">
            <span className="text-base font-bold text-cyan-400">{summaryMetrics.avgSpikeFrequency}%</span>
            <span className="text-[11px] text-slate-400">of all ticks</span>
          </div>
          <span className="text-[10px] text-slate-500 block truncate">Target SLA: &lt; 1.00%</span>
        </div>

        <div className={`p-3 rounded-xl border ${
          isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-900/40 border-slate-800/80'
        }`}>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total 24h Ticks Ingested</span>
          <div className="flex items-baseline space-x-2 mt-0.5">
            <span className="text-base font-bold text-purple-400">{(summaryMetrics.totalTicks / 1000000).toFixed(2)}M</span>
            <span className="text-[11px] text-purple-400/80">ticks</span>
          </div>
          <span className="text-[10px] text-slate-500 block truncate">Exness MT5 Low-Latency Feed</span>
        </div>
      </div>

      {/* Global Trading Sessions Timeline Ribbon */}
      <div className={`p-2.5 rounded-xl border mb-3 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono ${
        isLight ? 'bg-slate-100/70 border-slate-200 text-slate-600' : 'bg-slate-900/50 border-slate-800/80 text-slate-400'
      }`}>
        <span className="font-bold text-slate-400 uppercase tracking-wider">Trading Sessions:</span>
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Asian (00:00 - 08:00)</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span>London Open (08:00 - 13:00)</span>
          </span>
          <span className="flex items-center space-x-1 font-bold text-rose-400">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>NY / London Overlap [Peak Spike Risk] (13:00 - 17:00)</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>NY Afternoon (17:00 - 21:00)</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Rollover / Reset (21:00 - 00:00)</span>
          </span>
        </div>
      </div>

      {/* D3 Heatmap Canvas Container */}
      <div 
        ref={containerRef}
        className="relative w-full overflow-x-auto select-none rounded-xl border border-slate-800/30 p-2 bg-slate-950/20"
        style={{ minHeight: '310px' }}
      >
        <svg ref={svgRef} className="w-full overflow-visible" />

        {/* High-Precision Floating Tooltip */}
        {hoveredCell && tooltipPos && (
          <div
            className={`absolute pointer-events-none p-3 rounded-xl shadow-2xl border font-mono text-xs z-50 backdrop-blur-md transition-all ${
              isLight ? 'bg-white/95 border-slate-300 text-slate-900 shadow-slate-300/50' : 'bg-slate-950/95 border-slate-700 text-slate-100 shadow-black/80'
            }`}
            style={{
              left: `${Math.min(tooltipPos.x + 15, (containerRef.current?.clientWidth || 700) - 260)}px`,
              top: `${Math.max(10, tooltipPos.y - 120)}px`,
              minWidth: '240px'
            }}
          >
            {/* Tooltip Header */}
            <div className="flex items-center justify-between border-b pb-1.5 mb-2 border-slate-700/50">
              <div className="flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-bold text-sm">{hoveredCell.hourLabel} UTC</span>
              </div>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                hoveredCell.bottleneckLevel === 'CRITICAL_CONGESTION' || hoveredCell.bottleneckLevel === 'BOTTLENECK'
                  ? 'bg-rose-950/80 text-rose-400 border-rose-800'
                  : hoveredCell.bottleneckLevel === 'MODERATE'
                    ? 'bg-amber-950/80 text-amber-400 border-amber-800'
                    : 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
              }`}>
                {hoveredCell.bottleneckLevel.replace('_', ' ')}
              </span>
            </div>

            {/* Tooltip Content */}
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Latency Tier:</span>
                <span className="font-bold text-cyan-400">{hoveredCell.tierLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Hourly Tick Load:</span>
                <span className="font-bold text-white">{hoveredCell.hourlyTotalTicks.toLocaleString()} ticks/hr</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Spike Frequency Rate:</span>
                <span className={`font-bold ${
                  hoveredCell.spikeFrequencyPct > 2.0 ? 'text-rose-400' : hoveredCell.spikeFrequencyPct > 0.8 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {hoveredCell.spikeFrequencyPct}% ({hoveredCell.hourlySpikesCount} spikes)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Samples In This Tier:</span>
                <span className="font-bold text-purple-300">{hoveredCell.percentageInTier}% of hour</span>
              </div>
              <div className="flex justify-between border-t border-slate-800/60 pt-1">
                <span className="text-slate-400">P99 Latency / Max:</span>
                <span className="font-bold text-slate-200">{hoveredCell.p99LatencyMs}ms / {hoveredCell.maxSpikeMs}ms</span>
              </div>
              <div className="text-[10px] text-slate-400 pt-1 italic">
                Click cell to inspect bottleneck diagnosis
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/40 mt-3 text-xs font-mono">
        {/* Heatmap color gradient legend */}
        <div className="flex items-center space-x-2">
          <span className="text-[11px] text-slate-400">Gradient:</span>
          <div className="flex items-center space-x-1">
            <span className="text-[10px] text-emerald-400">Optimal (0.0%)</span>
            <div className={`h-2.5 w-28 rounded-full ${
              metricMode === 'spike_frequency' 
                ? 'bg-gradient-to-r from-emerald-600 via-amber-500 to-rose-600'
                : metricMode === 'bottleneck_index'
                  ? 'bg-gradient-to-r from-teal-900 via-amber-600 to-rose-700'
                  : 'bg-gradient-to-r from-cyan-900 via-cyan-600 to-sky-400'
            }`} />
            <span className="text-[10px] text-rose-400">Critical (3.8%+)</span>
          </div>
        </div>

        {/* Live Realtime Baseline Reference */}
        <div className="flex items-center space-x-2 text-[11px] text-slate-400">
          <span>Active VPS Realtime:</span>
          <span className="font-bold text-emerald-400">{currentRealtimeLatency.toFixed(1)} ms</span>
          <span className="text-slate-500">•</span>
          <span>Equinix LD4 Cross-Connect</span>
        </div>
      </div>

      {/* Execution Bottleneck Diagnostics Drawer (When a cell is selected) */}
      {selectedCell && (
        <div className={`mt-4 p-4 rounded-xl border font-mono text-xs transition-all ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/70 border-slate-800'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-800/50">
            <div className="flex items-center space-x-2.5">
              <div className={`p-2 rounded-lg border ${
                selectedCell.bottleneckLevel === 'CRITICAL_CONGESTION' || selectedCell.bottleneckLevel === 'BOTTLENECK'
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
              }`}>
                <Gauge className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-white">
                    {selectedCell.hourLabel} UTC Bottleneck Diagnostics
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    Tier: {selectedCell.tierLabel}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  Session: {selectedCell.session} | Total Load: {selectedCell.hourlyTotalTicks.toLocaleString()} ticks/hr
                </span>
              </div>
            </div>

            {/* Quick action button */}
            <button
              onClick={handleSimulateBurst}
              disabled={isSimulatingBurst}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isSimulatingBurst 
                  ? 'bg-slate-800 text-slate-400' 
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSimulatingBurst ? 'animate-spin' : ''}`} />
              <span>{isSimulatingBurst ? 'Benchmarking Route...' : 'Simulate Micro-Burst'}</span>
            </button>
          </div>

          {/* Diagnostic Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div className={`p-3 rounded-lg border ${isLight ? 'bg-white' : 'bg-slate-950/60 border-slate-800'}`}>
              <span className="text-[10px] text-slate-400 uppercase block">Spike vs Volume Ratio</span>
              <div className="text-sm font-bold text-cyan-400 mt-1">
                {selectedCell.hourlySpikesCount} spikes / {Math.round(selectedCell.hourlyTotalTicks / 1000)}k ticks
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Frequency: <span className="text-rose-400 font-semibold">{selectedCell.spikeFrequencyPct}%</span> of incoming ticks
              </div>
            </div>

            <div className={`p-3 rounded-lg border ${isLight ? 'bg-white' : 'bg-slate-950/60 border-slate-800'}`}>
              <span className="text-[10px] text-slate-400 uppercase block">Tail Latency Profile</span>
              <div className="text-sm font-bold text-white mt-1">
                P99: {selectedCell.p99LatencyMs}ms | Peak: {selectedCell.maxSpikeMs}ms
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Target SLA: &lt; 15.0ms (Exceeded by {(selectedCell.maxSpikeMs - 15).toFixed(1)}ms)
              </div>
            </div>

            <div className={`p-3 rounded-lg border ${isLight ? 'bg-white' : 'bg-slate-950/60 border-slate-800'}`}>
              <span className="text-[10px] text-slate-400 uppercase block">Bottleneck Risk Score</span>
              <div className="text-sm font-bold mt-1 flex items-center space-x-2">
                <span className={selectedCell.bottleneckScore > 50 ? 'text-rose-400' : 'text-emerald-400'}>
                  {selectedCell.bottleneckScore} / 100
                </span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded ${
                  selectedCell.bottleneckScore > 50 ? 'bg-rose-950/80 text-rose-300' : 'bg-emerald-950/80 text-emerald-300'
                }`}>
                  {selectedCell.bottleneckLevel}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Calculated via composite congestion heuristic
              </div>
            </div>
          </div>

          {/* Root Cause & Mitigation Guidance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[11px]">
              <span className="font-bold text-rose-400 block mb-1 flex items-center space-x-1">
                <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                Root Cause Isolation:
              </span>
              <p className="text-slate-300 leading-relaxed">
                {selectedCell.rootCause}
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-[11px]">
              <span className="font-bold text-cyan-400 block mb-1 flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                Algorithmic Mitigation Action:
              </span>
              <p className="text-slate-300 leading-relaxed">
                {selectedCell.mitigationRecommendation}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
