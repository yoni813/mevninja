# Sunshine High Algorithmic Frequency Trading (S.H.A.F.T.)
## Institutional Deployment, Gateway Integration & Operational Runbook

---

### Executive Architecture Overview

**Sunshine High Algorithmic Frequency Trading (S.H.A.F.T.)** is an ultra-low-latency algorithmic trading platform engineered for sub-millisecond execution, automated pre-trade risk management, MetaTrader 5 (MT5) MQL5 direct integration, and institutional multi-asset arbitrage.

```
                               ┌──────────────────────────────────────────────────────────┐
                               │       S.H.A.F.T. INSTITUTIONAL TRADING WORKBENCH        │
                               │          (React 19 / TypeScript / Vite / Tailwind)       │
                               └────────────────────────────┬─────────────────────────────┘
                                                            │
                                        ┌───────────────────┴───────────────────┐
                                        ▼                                       ▼
                       ┌─────────────────────────────────┐     ┌─────────────────────────────────┐
                       │    FULL-STACK API & FIX ENGINE  │     │   MULTI-THREADED TICK WORKER    │
                       │     (Express / Node.js CJS)     │     │     (Isolated Web Worker)       │
                       └────────────────┬────────────────┘     └────────────────┬────────────────┘
                                        │                                       │
        ┌───────────────────────────────┼───────────────────────────────┐       │
        ▼                               ▼                               ▼       ▼
┌───────────────┐               ┌───────────────┐               ┌───────────────┐
│ MT5 GATEWAY   │               │ FIX 4.4 / 5.0 │               │ LIVE MARKET   │
│ WebAPI Bridge │               │ Session Hub   │               │ Feed Proxies  │
└───────┬───────┘               └───────┬───────┘               └───────┬───────┘
        │                               │                               │
        ▼                               ▼                               ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                      CO-LOCATION DATACENTER INFRASTRUCTURE                    │
│   • Equinix ZA-JNB (Teraco Isando): 6.2ms baseline (Exness MT5 Core)          │
│   • Equinix LD4 (Slough UK): 1.2ms baseline (LMAX / Currenex)                 │
│   • Equinix NY4 (Secaucus NJ): 14.2ms baseline (CME / FXall)                  │
│   • Equinix FR2 (Frankfurt): 4.8ms baseline (Deutsche Börse / Eurex)          │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

### 1. REST & FIX Protocol Endpoint Directory

#### REST API Endpoints
| HTTP Method | Route | Description | Status |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/market/live-feed` | Live ECB FX interbank rates & Binance Crypto | `LIVE_CONNECTED` |
| `GET` | `/api/market/order-flow` | 20-level Level II order book depth & imbalance | `LIVE_CONNECTED` |
| `GET` | `/api/brokerage/servers` | Directory of 7 co-location facility gateways | `LIVE_CONNECTED` |
| `POST` | `/api/brokerage/select-server` | Live gateway handover & ping recalibration | `LIVE_CONNECTED` |
| `POST` | `/api/brokerage/credentials/authenticate` | Broker credentials validation (Real vs Demo) | `GATEWAY_BRIDGE` |
| `GET` | `/api/brokerage/account/telemetry` | Live Equity, Balance, Margin, Free Margin, PnL | `LIVE_CONNECTED` |
| `POST` | `/api/mt5/execute-order` | Direct MQL5 trade order execution bridge | `GATEWAY_BRIDGE` |
| `GET` | `/api/mt5/positions` | Active MT5 positions with live tick mark-to-market | `LIVE_CONNECTED` |
| `POST` | `/api/mt5/close-position` | Instant position square-off by ticket number | `LIVE_CONNECTED` |
| `POST` | `/api/bot/control` | Master switch for FLASHSCALPER automated loop | `LIVE_CONNECTED` |
| `GET` | `/api/bot/status` | Bot loop state, cadence, win-rate, and confidence | `LIVE_CONNECTED` |
| `POST` | `/api/monitoring/analyze-frame` | Gemini AI Screen Anomaly & Spread Oversight | `LIVE_CONNECTED` |

#### FIX 4.4 / 5.0 SP2 Message Types
| Tag 35 (MsgType) | Message Name | Direction | Implementation Details |
| :--- | :--- | :--- | :--- |
| `35=A` | **Logon** | Outbound | Authenticates FIX Session with `SenderCompID` and `TargetCompID`. |
| `35=D` | **NewOrderSingle** | Outbound | Sends `ClOrdID` (Tag 11), `Symbol` (Tag 55), `Side` (Tag 54), `Price` (Tag 44). |
| `35=8` | **ExecutionReport** | Inbound | Returns `OrdStatus` (Tag 39=2 Filled), `LastPx` (Tag 31), `LastQty` (Tag 32). |
| `35=F` | **OrderCancelRequest** | Outbound | Emergency cancel request for pending orders. |
| `35=0` | **Heartbeat** | Bidirectional | 30-second keepalive interval monitoring jitter and packet health. |

---

### 2. Pre-Trade Quantitative Risk Controls (`RiskManagement.ts`)

1. **Fat-Finger Position Cap**: Hard ceiling at **$2,000,000 notional** per single trade order.
2. **Margin Utilization Ceiling**: Rejects any order that would drive account margin utilization above **90%**.
3. **Daily Drawdown Circuit Breaker**: Auto-halts trading if daily drawdown breaches **4.0%**.
4. **Leverage Bounding**: Institutional 100x leverage limit for margin calculations.
5. **Wash Trading Prevention (WTP)**: Blocks opposite side orders on the same instrument within a 500ms window.
6. **Master Emergency Kill-Switch**: Zero-latency global halt halting all bot loops and pending orders via `engageKillSwitch()`.

---

### 3. Execution Engine & MQL5 Protocol Rules (`ExecutionEngine.ts`)

1. **Dynamic Deviation Mapping**:
   $$\text{Deviation (Points)} = \begin{cases} 5 \text{ pts } (0.5 \text{ pips}), & \text{if Ping} \le 8\text{ ms} \\ 8 \text{ pts } (0.8 \text{ pips}), & \text{if } 8 < \text{Ping} \le 15\text{ ms} \\ 10 \text{ pts } (1.0 \text{ pips}), & \text{if Ping} > 15\text{ ms} \end{cases}$$
2. **Spread Filter**: Hard cap at **1.5 pips** for FX Majors (`EURUSD`, `GBPUSD`). Orders exceeding this return MQL5 RetCode `10015` (`TRADE_RETCODE_INVALID_PRICE`).
3. **Execution Timeout Guard**: Orders taking $>50\text{ ms}$ to fill are aborted with RetCode `10006` (`TRADE_RETCODE_CONNECTION`).
4. **Slippage Tolerance Cap**: Max allowable slippage is capped at **1.0 pip**, rejecting breaches with RetCode `10014` (`TRADE_RETCODE_REQUOTE`).
5. **ATR Dynamic Anchoring**: Stop-Loss ($1.2 \times \text{ATR}$) and Take-Profit ($2.0 \times \text{ATR}$) calculated dynamically from tick volatility.

---

### 4. Continuous Integration & Automated Testing

The project includes an automated test runner and GitHub Actions CI workflow:

```bash
# 1. Run Quantitative Risk and Execution Module Analysis
npm run analyze

# 2. Run Automated Unit Tests (15 tests across 4 test suites)
npm test

# 3. TypeScript Compilation & Linting
npm run lint

# 4. Production Build Verification
npm run build
```

---

### 5. Production Build & Deployment

To deploy in an institutional environment or Cloud Run container:

```bash
# Set Production Environment
export NODE_ENV=production

# Compile static assets and bundle server.ts into dist/server.cjs
npm run build

# Launch standalone high-performance server
npm start
```

*Server binds to `0.0.0.0:3000` with native ESM/CommonJS compatibility.*
