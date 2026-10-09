import React, { useState, useEffect } from 'react';
import { Server, CheckCircle2, WifiOff, Clock, Zap, RefreshCw, ShieldCheck } from 'lucide-react';
import { apiClient } from '../api/client';
import { PlatformItem } from '../types';
import { LiveStatusBadge } from '../components/LiveStatusBadge';

export const DataSourcesPage: React.FC = () => {
  const [sources, setSources] = useState<PlatformItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const fetchSources = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/sources');
      if (Array.isArray(res.data)) {
        setSources(res.data);
      }
    } catch {
      setSources([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await apiClient.post('/sources/test', {});
      setTestResult(res.data);
      await fetchSources();
    } catch (err: any) {
      setTestResult({
        success: false,
        error_message: err.response?.data?.detail || 'Connection test failed',
        status_code: 502,
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight font-['Outfit'] flex items-center gap-2.5">
            <Server className="w-6 h-6 text-emerald-400" />
            Quick-Commerce Data Sources & Upstream Nodes
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time status, network latency, and connectivity state across all supported darkstore networks
          </p>
        </div>

        <button
          onClick={handleTestConnection}
          disabled={testing}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-950/40 ${
            testing ? 'opacity-70 cursor-wait' : ''
          }`}
        >
          <ShieldCheck className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
          <span>{testing ? 'Testing Live Providers...' : 'TEST LIVE CONNECTION'}</span>
        </button>
      </div>

      {/* Test Connection Result Banner */}
      {testResult && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-4 animate-in fade-in duration-200 ${
            testResult.success
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {testResult.success ? <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" /> : <WifiOff className="w-5 h-5 text-rose-400 flex-shrink-0" />}
            <div>
              <div className="font-bold">
                {testResult.success ? '● CONNECTION VERIFIED' : '● CONNECTION FAILED'}
              </div>
              <div className="text-[11px] opacity-90">
                {testResult.success
                  ? `QuickCommerce API latency: ${testResult.latency_ms}ms · Request ID: ${testResult.request_id}`
                  : `Error: ${testResult.error_message || 'HTTP error'}`}
              </div>
            </div>
          </div>
          {testResult.credits_remaining !== null && testResult.credits_remaining !== undefined && (
            <span className="font-mono text-xs px-2.5 py-1 rounded bg-slate-900 border border-slate-700">
              Credits: {testResult.credits_remaining}
            </span>
          )}
        </div>
      )}

      {/* Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sources.map((src) => {
          const isLive = src.status === 'LIVE';
          return (
            <div
              key={src.id}
              className="p-5 rounded-3xl bg-[#111827] border border-slate-800 hover:border-emerald-500/30 transition flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-xs font-bold text-emerald-400">
                      {src.name[0]}
                    </div>
                    <span className="font-bold text-white text-sm">{src.name}</span>
                  </div>
                  <LiveStatusBadge status={src.status} size="sm" />
                </div>

                <div className="mt-4 space-y-2 text-xs text-slate-400 pt-3 border-t border-slate-800/80">
                  <div className="flex justify-between items-center">
                    <span>Last Sync:</span>
                    <span className="text-slate-200 font-mono text-[11px]">
                      {src.last_sync_at
                        ? new Date(src.last_sync_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                        : 'Live Ready'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span>Latency:</span>
                    <span className="text-cyan-400 font-mono font-semibold">
                      {src.last_latency_ms ? `${src.last_latency_ms} ms` : '< 2.0s'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span>Status Code:</span>
                    <span className="text-slate-300 font-mono text-[11px]">
                      HTTP {src.last_status_code || 200}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                <span>Direct Connector</span>
                <span className="text-emerald-400 font-medium">SSL Encrypted</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
