import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle2, XCircle, Clock, Zap, AlertTriangle, RefreshCw, Server, WifiOff } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts';
import { apiClient } from '../api/client';
import { ApiHealthMetric } from '../types';
import { LiveStatusBadge } from '../components/LiveStatusBadge';

export const MonitoringPage: React.FC = () => {
  const [metrics, setMetrics] = useState<ApiHealthMetric | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/monitoring/health');
      if (res.data) {
        setMetrics(res.data);
      }
    } catch {
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight font-['Outfit'] flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-emerald-400" />
            QuickCommerce API Health & Telemetry
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time latency histograms, error rates, timeout audits and platform status
          </p>
        </div>

        <button
          onClick={fetchMetrics}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition self-start"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">Success Rate</span>
          <div className="text-3xl font-black text-emerald-400 font-mono mt-2">
            {metrics ? `${metrics.success_rate}%` : '—'}
          </div>
          <span className="text-[11px] text-slate-400">
            {metrics ? `${metrics.success_requests} of ${metrics.total_requests} reqs` : '0 requests'}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">Average Latency</span>
          <div className="text-3xl font-black text-cyan-400 font-mono mt-2">
            {metrics ? `${metrics.avg_latency_ms} ms` : '—'}
          </div>
          <span className="text-[11px] text-slate-400">Round-trip HTTP time</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">Timeouts (504)</span>
          <div className="text-3xl font-black text-amber-400 font-mono mt-2">
            {metrics ? metrics.timeouts : '0'}
          </div>
          <span className="text-[11px] text-slate-400">Handled by retry backoff</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">Rate Limits (429)</span>
          <div className="text-3xl font-black text-rose-400 font-mono mt-2">
            {metrics ? metrics.rate_limits : '0'}
          </div>
          <span className="text-[11px] text-slate-400">Circuit breaker pauses</span>
        </div>
      </div>

      {/* Latency Trend Chart */}
      <div className="p-6 rounded-3xl bg-[#111827] border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Live Response Latency Trend (ms)
          </h3>
          <span className="text-xs text-emerald-400 font-mono">Hourly Averaged</span>
        </div>

        <div className="h-64 w-full">
          {metrics?.hourly_latency_trend && metrics.hourly_latency_trend.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.hourly_latency_trend}>
                <defs>
                  <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F293D" vertical={false} />
                <XAxis dataKey="time" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} unit="ms" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B0F17', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="avg_latency" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#latencyGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              No API requests logged yet. Search live products to build latency trend.
            </div>
          )}
        </div>
      </div>

      {/* Platform Health Grid */}
      <div className="p-6 rounded-3xl bg-[#111827] border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Per-Platform Health & Circuit State
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics?.platform_health && metrics.platform_health.length > 0 ? (
            metrics.platform_health.map((p) => (
              <div key={p.platform} className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{p.platform}</span>
                  <LiveStatusBadge status={p.status || 'LIVE'} size="sm" />
                </div>
                <div className="text-xs space-y-1 text-slate-400">
                  <div className="flex justify-between">
                    <span>Success Rate:</span>
                    <span className="text-emerald-400 font-mono font-bold">{p.success_rate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Latency:</span>
                    <span className="text-cyan-400 font-mono">{p.avg_latency_ms} ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Status:</span>
                    <span className="text-slate-300 font-mono">HTTP {p.last_status_code || 200}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-4 text-center py-6 text-xs text-slate-500">
              Loading platform telemetry...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
