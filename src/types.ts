export type ProtocolType = 'WEBSOCKET_JSON' | 'FIX_4_4' | 'OUCH_ITCH';
export type TradingMode = 'SIMULATION' | 'LIVE';

export interface Web3State {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  balance: string | null;
}

export interface ExposureMetrics {
  grossExposure: number;
  netExposure: number;
  marginUtilization: number;
  maxDrawdown: number;
}

export interface ComplianceCheck {
  id: string;
  name: string;
  status: 'PASSED' | 'FAILED' | 'PENDING';
  lastChecked: number;
}

export interface RiskState {
  status: 'SECURE' | 'WARNING' | 'CRITICAL';
  exposure: ExposureMetrics;
  checks: ComplianceCheck[];
}

export interface MarketSentiment {
  score: number; // -100 to +100
  label: 'EXTREME_BEARISH' | 'BEARISH' | 'NEUTRAL' | 'BULLISH' | 'EXTREME_BULLISH';
  trendingKeywords: string[];
}

export interface MacroIndicator {
  id: string;
  name: string;
  actual: string;
  forecast: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  time: string;
}

export interface OrderFlowImbalance {
  symbol: string;
  buyVolume: number;
  sellVolume: number;
  imbalance: number; // -100 to 100
}

export interface Tick {
  symbol: string;
  bid: number;
  ask: number;
  last: number;
  volume: number;
  timestamp: number;
  sourceThread: string;
  sequenceId: number;
}

export interface ConnectionStatus {
  isConnected: boolean;
  protocol: ProtocolType;
  endpoint: string;
  threadId: string;
  latencyMs: number;
  jitterMs: number;
  packetsReceived: number;
  reconnectCount: number;
  lastHeartbeat: number;
}

export interface MqlTradeRequest {
  action: 'TRADE_ACTION_DEAL' | 'TRADE_ACTION_PENDING' | 'TRADE_ACTION_SLTP' | 'TRADE_ACTION_MODIFY' | 'TRADE_ACTION_REMOVE';
  magic: number;
  order: number;
  symbol: string;
  volume: number;
  type: 'ORDER_TYPE_BUY' | 'ORDER_TYPE_SELL' | 'ORDER_TYPE_BUY_LIMIT' | 'ORDER_TYPE_SELL_LIMIT';
  price: number;
  stoploss: number;
  takeprofit: number;
  deviation: number; // Dynamically linked to TERMINAL_PING
  comment: string;
  typeing: 'ORDER_TIME_GTC' | 'ORDER_TIME_SPECIFIED';
  expiration: number;
}

export interface ExecutionResult {
  ticket: number;
  retcode: number;
  comment: string;
  price: number;
  volume: number;
  pingAtExecution: number;
  deviationApplied: number;
  timestamp: number;
  status: 'FILLED' | 'REJECTED' | 'SLIPPAGE_EXCEEDED' | 'TIMEOUT' | 'SPREAD_EXCEEDED';
  mode: TradingMode;
  signature?: string;
}

export interface StrategyConfig {
  id: string;
  name: string;
  type: 'MARKET_MAKER' | 'MOMENTUM_SCALPER' | 'STAT_ARBITRAGE';
  symbol: string;
  active: boolean;
  maxSpread: number;
  orderSize: number;
  targetProfitPips: number;
  stopLossPips: number;
  totalTrades: number;
  pnl: number;
  liveTrades: number;
  livePnl: number;
  metadata?: Record<string, any>;
}

export interface SlippageHeatmapCell {
  assetClass: string;
  assetClassSub: string;
  latencyTier: string;
  latencyMin: number;
  latencyMax: number;
  avgSlippagePts: number;
  p95SlippagePts: number;
  fillRatePct: number;
  sampleCount: number;
  recommendedRoute: string;
}

export interface TerminalLog {
  id: string;
  timestamp: string;
  level: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR' | 'HFT_TICK' | 'EXECUTION' | 'PING';
  message: string;
  thread: string;
  metadata?: Record<string, any>;
}

export type ClearanceLevel = 'LEVEL_3_ANALYST' | 'LEVEL_4_OPERATOR' | 'LEVEL_5_CHIEF_QUANT' | 'LEVEL_5_SYSTEMS_ARCHITECT';

export interface AuthUser {
  traderId: string;
  name: string;
  role: string;
  desk: string;
  clearanceLevel: ClearanceLevel;
  enclaveId: string;
  enclaveAttestation: string;
  loginTime: string;
  sessionToken: string;
  authMethod?: 'ENCLAVE_KEY' | 'GOOGLE_SSO' | 'FACIAL_RECOGNITION' | 'BIOMETRIC_TOUCH' | 'BIOMETRIC' | 'HNS_STAGING';
  email?: string;
  avatar?: string;
  permissions?: string[];
  brokerServerId?: string;
}

export interface UserActivityLog {
  id: string;
  timestamp: string;
  epochMs: number;
  traderId: string;
  role: string;
  action: string;
  module: string;
  details: string;
  severity: 'INFO' | 'SUCCESS' | 'WARN' | 'CRITICAL';
  location: string;
  ip: string;
  metadata?: Record<string, any>;
}

export interface BrokerageServer {
  id: string;
  name: string;
  location: string;
  country: string;
  flag: string;
  facility: string;
  provider: string;
  baselinePingMs: number;
  currentPingMs: number;
  jitterMs: number;
  crossConnectType: string;
  status: 'ACTIVE' | 'ONLINE' | 'STANDBY';
  ipAddress: string;
}

export interface ScreenMonitoringState {
  isActive: boolean;
  fps: number;
  lastCaptureTime: string;
  capturedFramesCount: number;
  aiOversightActive: boolean;
  activeAlertsCount: number;
  screenHealth: 'NORMAL' | 'ELEVATED_LATENCY' | 'ANOMALY_DETECTED';
  latestAiDiagnosis?: AiTroubleshootingReport | null;
}

export interface AiTroubleshootingReport {
  id: string;
  timestamp: string;
  summary: string;
  status: 'HEALTHY' | 'NEEDS_ATTENTION' | 'CRITICAL_ACTION_REQUIRED';
  detectedAnomalies: string[];
  recommendedFixes: string[];
  monitoredMetrics: {
    latency: number;
    spread: number;
    activeWidgets: number;
    riskStatus: string;
  };
}

export interface BackendSystemStatus {
  id: string;
  name: string;
  category: string;
  status: 'ONLINE' | 'OPTIMAL' | 'SECURED' | 'ACTIVE' | 'SYNCHRONIZING';
  primaryMetric: string;
  metricLabel: string;
  secondaryMetric: string;
  secondaryLabel: string;
  description: string;
  latencyNs: number;
  details: Record<string, any>;
}

export interface SystemsOverviewResponse {
  timestamp: number;
  globalHealth: 'OPTIMAL' | 'DEGRADED';
  activeSubsystems: number;
  totalSubsystems: number;
  systems: Record<string, BackendSystemStatus>;
}

export type GeminiModelTier = 'gemini-3.8-flash' | 'gemini-3.7-flash' | 'gemini-flash-latest' | 'gemini-3.1-flash-lite';

export interface GeminiModelTelemetry {
  primaryModel: 'gemini-3.8-flash';
  fallbackModel: 'gemini-3.7-flash';
  activeModel: GeminiModelTier;
  fallbackEngaged: boolean;
  tokenStatus: 'OPTIMAL' | 'QUOTA_EXHAUSTED_FALLBACK' | 'RATE_LIMITED_FALLBACK' | 'TOKEN_ENDED_FALLBACK';
  lastCallLatencyMs: number;
  totalCalls: number;
  fallbackCount: number;
  lastFallbackReason?: string;
  confidenceScore: number;
}

export interface DynamicBotTuningParameters {
  symbol: string;
  dynamicDeviationPts: number;
  dynamicLotMultiplier: number;
  calculatedLotSize: number;
  dynamicSlPips: number;
  dynamicTpPips: number;
  slippageTolerancePips: number;
  autoBreakEvenTriggerPips: number;
  executionGatingPassed: boolean;
  regime: 'EXPANSION' | 'CONSOLIDATION' | 'HIGH_VOLATILITY' | 'ADVERSE_DRIFT';
  imbalanceScore: number;
  macroBias: 'RISK_ON' | 'NEUTRAL' | 'RISK_OFF';
  tuningRationale: string[];
  lastUpdated: string;
}

export interface Msp55IngestionState {
  pipelineId: 'MSP-55-CORE-INGEST';
  status: 'OPTIMAL' | 'HIGH_THROUGHPUT' | 'DEGRADED';
  ingestionRateTps: number;
  avgPipelineLatencyUs: number;
  geminiTelemetry: GeminiModelTelemetry;
  macroFeedCount: number;
  macroHeadlineBias: string;
  level2ImbalanceSummary: {
    symbol: string;
    imbalance: number;
    buyLiquidityUsd: number;
    sellLiquidityUsd: number;
    skewRatio: number;
  }[];
  activeBotTunings: Record<string, DynamicBotTuningParameters>;
  lastIngestTimestamp: string;
}

export interface RoutingLayerDiagnostic {
  layer: 'MQL5_ZERO_COPY' | 'FIX_4_4_KERNEL_BYPASS' | 'SOLARFLARE_EF_VI' | 'FPGA_ACCELERATOR' | 'MEM_RING_BUFFER';
  name: string;
  protocol: string;
  status: 'OPTIMAL' | 'VERIFIED' | 'ONLINE' | 'ACTIVE';
  latencyMetric: string;
  jitterMetric: string;
  throughputOps: string;
  ringBufferHealth: string;
  kernelBypassMode: string;
  dropRatePercent: number;
  sessionState: string;
  checks: {
    name: string;
    passed: boolean;
    detail: string;
  }[];
}

export interface ExnessPosition {
  ticket: number;
  symbol: string;
  type: 'BUY' | 'SELL';
  lots: number;
  openPrice: number;
  currentPrice: number;
  stopLoss: number;
  takeProfit: number;
  pnl: number;
  openTime: string;
  comment?: string;
}

export interface ExnessTradeHistory {
  ticket: number;
  symbol: string;
  type: 'BUY' | 'SELL';
  lots: number;
  openPrice: number;
  closePrice: number;
  pnl: number;
  closeTime: string;
}

export interface BrokerAccountSession {
  isConnected: boolean;
  brokerType: 'EXNESS' | 'MT5_DIRECT' | 'FIX_ECN' | 'CUSTOM_GATEWAY' | 'HNS';
  server: string;
  accountId: string;
  accountName?: string;
  isDemo: boolean;
  leverage: number;
  currency: string;
  connectedAt: string;
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  floatingPnl: number;
  positionsCount: number;
  pingMs?: number;
  jitterMs?: number;
  packetHealth?: string;
  openPositions: ExnessPosition[];
  tradeHistory?: ExnessTradeHistory[];
}

export interface SystemWideDiagnosticReport {
  diagnosticId: string;
  timestamp: string;
  systemReadiness: 'READY_FOR_EXECUTION' | 'OPTIMAL_LOW_LATENCY' | 'STANDBY';
  overallScore: number;
  routingLatencyTickToTradeNs: number;
  p99JitterNs: number;
  mql5Status: RoutingLayerDiagnostic;
  fix44Status: RoutingLayerDiagnostic;
  subsystemsCount: number;
  activeEnclaves: string;
  readinessSummary: string[];
}

