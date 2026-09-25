import React, { useState } from 'react';
import { ConnectionStatus, ProtocolType } from '../types';
import { connectionManager } from '../services/ConnectionManager';
import { Network, Cpu, Shield, Zap, RefreshCw, Radio, Terminal } from 'lucide-react';

interface ConnectionManagerViewProps {
  status: ConnectionStatus;
  onStatusChange: (status: ConnectionStatus) => void;
}

export const ConnectionManagerView: React.FC<ConnectionManagerViewProps> = ({ status, onStatusChange }) => {
  const [selectedProtocol, setSelectedProtocol] = useState<ProtocolType>(status.protocol);
  const [endpointInput, setEndpointInput] = useState(status.endpoint);

  const handleProtocolChange = (protocol: ProtocolType) => {
    setSelectedProtocol(protocol);
    let defaultEndpoint = 'wss://hft.fx-gateway.io/feed/v2';
    if (protocol === 'FIX_4_4') defaultEndpoint = 'tcp://fix.prime-broker.com:9800';
    if (protocol === 'OUCH_ITCH') defaultEndpoint = 'udp://itch.nasdaq-hft.net:14000';
    setEndpointInput(defaultEndpoint);
    connectionManager.setProtocol(protocol, defaultEndpoint);
  };

  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-blue-600/20 border border-blue-500/40 rounded-xl text-blue-400">
            <Network className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white">Async Message Broker & Event-Driven FIX Gateway</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Optimizes event-driven microservices with refined asynchronous message brokers. Ensures maximum data integrity, zero-loss routing, and seamless integration across parallel execution cores without blocking the strategy execution loop.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Protocol & Endpoint Configuration */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm md:col-span-1 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Radio className="w-4 h-4 text-emerald-400" />
            <span>Protocol Configuration</span>
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Select Protocol / Feed</label>
              <div className="space-y-2">
                {[
                  { id: 'FIX_4_4', name: 'FIX 4.4 (Financial Information eXchange)', desc: 'Direct market access via FIX session' },
                  { id: 'WEBSOCKET_JSON', name: 'Secure WebSocket (WSS JSON)', desc: 'Binary/JSON low-latency streaming' },
                  { id: 'OUCH_ITCH', name: 'NASDAQ OUCH / ITCH Binary Feed', desc: 'Sub-microsecond multicast feed' },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleProtocolChange(p.id as ProtocolType)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      selectedProtocol === p.id
                        ? 'bg-blue-950/40 border-blue-600 text-white'
                        : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-bold text-xs text-white">{p.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Gateway Endpoint</label>
              <input
                type="text"
                value={endpointInput}
                onChange={(e) => setEndpointInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Thread & Session State Inspector */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm md:col-span-2 space-y-5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-purple-400" />
            <span>Thread & Session Telemetry</span>
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 font-mono">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-500">Connection State</div>
              <div className="text-sm font-bold mt-1 flex items-center space-x-2">
                <span className={`w-2.5 h-2.5 rounded-full ${status.isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`}></span>
                <span className={status.isConnected ? 'text-emerald-400' : 'text-rose-400'}>
                  {status.isConnected ? 'CONNECTED' : 'DISCONNECTED'}
                </span>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-500">Worker PID / Thread</div>
              <div className="text-sm font-bold text-purple-400 mt-1">{status.threadId}</div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-500">Packets Received</div>
              <div className="text-sm font-bold text-white mt-1">{status.packetsReceived.toLocaleString()}</div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-500">Reconnect Attempts</div>
              <div className="text-sm font-bold text-blue-400 mt-1">{status.reconnectCount}</div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-500">Last Heartbeat</div>
              <div className="text-sm font-bold text-slate-300 mt-1">
                {new Date(status.lastHeartbeat).toLocaleTimeString()}
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-500">Terminal Ping</div>
              <div className="text-sm font-bold text-amber-400 mt-1">{status.latencyMs} ms</div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <Terminal className="w-3.5 h-3.5 text-blue-400" />
              <span>FIX / WebSocket Frame Payload Sample</span>
            </h4>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto">
              {`8=FIX.4.4|9=118|35=W|49=PRIME_GATEWAY|56=CLIENT_TERMINAL|34=${status.packetsReceived}|52=${new Date().toISOString()}|55=EURUSD|270=1.08450|271=1.00|10=184|`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
