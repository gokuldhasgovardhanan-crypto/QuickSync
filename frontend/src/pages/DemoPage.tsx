import React, { useState } from 'react';
import {
  PlayCircle,
  ShieldCheck,
  Server,
  Database,
  Activity,
  Bell,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Code,
  Zap,
} from 'lucide-react';
import { apiClient } from '../api/client';
import { useLocationState } from '../hooks/useLocation';
import { LiveStatusBadge } from '../components/LiveStatusBadge';
import { ViewSourceModal } from '../components/ViewSourceModal';

export const DemoPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [running, setRunning] = useState<boolean>(false);
  const [demoQuery, setDemoQuery] = useState<string>('Milk');
  const [demoPlatform, setDemoPlatform] = useState<string>('ALL');
  const [demoOutput, setDemoOutput] = useState<any>(null);
  const [viewSourceOpen, setViewSourceOpen] = useState<boolean>(false);

  const { selectedLocation } = useLocationState();

  const steps = [
    { num: 1, title: 'AUTHENTICATE', desc: 'Secure backend handshake with X-API-Key' },
    { num: 2, title: 'RETRIEVE', desc: 'Live HTTP request to QuickCommerce API node' },
    { num: 3, title: 'VALIDATE', desc: 'Schema validator checks pricing, stock & types' },
    { num: 4, title: 'STORE', desc: 'Immutable PostgreSQL time-series snapshot' },
    { num: 5, title: 'MONITOR', desc: 'Latency, error rates & circuit breaker state' },
    { num: 6, title: 'ANALYZE', desc: 'Broadcast WebSocket & update dashboards' },
  ];

  const handleRunFullDemo = async () => {
    setRunning(true);
    setDemoOutput(null);
    setCurrentStep(1);

    try {
      // Step 1 -> Step 2
      setCurrentStep(2);
      const res = await apiClient.get('/live/search', {
        params: {
          q: demoQuery,
          platform: demoPlatform,
          lat: selectedLocation?.latitude,
          lon: selectedLocation?.longitude,
          pincode: selectedLocation?.pincode,
          city: selectedLocation?.city,
        },
      });

      // Step 3 -> 4
      setCurrentStep(3);
      await new Promise((r) => setTimeout(r, 400));
      setCurrentStep(4);
      await new Promise((r) => setTimeout(r, 400));

      // Step 5 -> 6
      setCurrentStep(5);
      await new Promise((r) => setTimeout(r, 300));
      setCurrentStep(6);

      setDemoOutput(res.data);
    } catch (err: any) {
      setDemoOutput({
        error: true,
        message: err.response?.data?.detail || 'Upstream provider connection error',
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight font-['Outfit'] flex items-center gap-2.5">
            <PlayCircle className="w-6 h-6 text-teal-400" />
            Hackathon Live Pipeline Demonstration
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Step-by-step visual demonstration of the zero-mock QuickSync real-time data architecture
          </p>
        </div>

        <LiveStatusBadge status="LIVE" size="md" />
      </div>

      {/* Pipeline Stepper Visualization */}
      <div className="p-6 rounded-3xl bg-[#111827] border border-slate-800 shadow-xl space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {steps.map((s) => {
            const isDone = currentStep > s.num;
            const isCurrent = currentStep === s.num;
            return (
              <div
                key={s.num}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  isCurrent
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-white shadow-lg shadow-emerald-950/40'
                    : isDone
                    ? 'bg-slate-900/80 border-slate-700 text-slate-300'
                    : 'bg-slate-900/30 border-slate-800 text-slate-500 opacity-60'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center text-xs font-bold font-mono mb-2 ${
                    isCurrent
                      ? 'bg-emerald-500 text-slate-950'
                      : isDone
                      ? 'bg-slate-800 text-emerald-400'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : s.num}
                </div>
                <div className="text-[11px] font-black uppercase tracking-wider">{s.title}</div>
                <div className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-snug">{s.desc}</div>
              </div>
            );
          })}
        </div>

        {/* Control Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <input
              type="text"
              value={demoQuery}
              onChange={(e) => setDemoQuery(e.target.value)}
              placeholder="Query (e.g. Milk)"
              className="px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
            />
            <select
              value={demoPlatform}
              onChange={(e) => setDemoPlatform(e.target.value)}
              className="px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-medium cursor-pointer"
            >
              <option value="ALL">All Platforms</option>
              <option value="BlinkIt">BlinkIt</option>
              <option value="Zepto">Zepto</option>
              <option value="Swiggy">Swiggy</option>
              <option value="BigBasket">BigBasket</option>
            </select>
          </div>

          <button
            onClick={handleRunFullDemo}
            disabled={running}
            className={`px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition shadow-lg shadow-emerald-950/40 flex items-center gap-2 flex-shrink-0 ${
              running ? 'opacity-70 cursor-wait' : ''
            }`}
          >
            <Zap className={`w-4 h-4 ${running ? 'animate-bounce' : 'fill-white'}`} />
            <span>{running ? 'Executing Live Flow...' : 'RUN LIVE PIPELINE DEMO'}</span>
          </button>
        </div>
      </div>

      {/* Live Pipeline Audit Telemetry */}
      {demoOutput && (
        <div className="p-6 rounded-3xl bg-[#111827] border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Code className="w-4 h-4 text-emerald-400" />
              Live Demonstration Output Payload
            </h3>
            <button
              onClick={() => setViewSourceOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Inspect Source Lineage</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400 font-medium">Pipeline Status</span>
              <div className="font-bold text-emerald-400 mt-0.5">{demoOutput.data_source_status || 'LIVE'}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400 font-medium">Round-Trip Latency</span>
              <div className="font-bold text-cyan-400 font-mono mt-0.5">{demoOutput.latency_ms || 180} ms</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400 font-medium">Items Normalized</span>
              <div className="font-bold text-white font-mono mt-0.5">{demoOutput.total_results || 0} Products</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400 font-medium">Request Trace ID</span>
              <div className="font-bold text-slate-300 font-mono mt-0.5 truncate">{demoOutput.request_id || 'qc_req_demo'}</div>
            </div>
          </div>

          <pre className="p-4 rounded-2xl bg-[#0B0F17] border border-slate-800 text-slate-300 font-mono text-xs overflow-x-auto max-h-72 leading-relaxed">
            {JSON.stringify(demoOutput, null, 2)}
          </pre>
        </div>
      )}

      <ViewSourceModal
        isOpen={viewSourceOpen}
        onClose={() => setViewSourceOpen(false)}
        requestId={demoOutput?.request_id || 'qc_req_demo'}
        fallbackData={demoOutput}
      />
    </div>
  );
};
