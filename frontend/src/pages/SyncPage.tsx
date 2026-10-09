import React, { useState, useEffect } from 'react';
import { RefreshCw, PlayCircle, CheckCircle2, XCircle, Clock, Database, Server, Zap } from 'lucide-react';
import { apiClient } from '../api/client';
import { SyncRunItem } from '../types';
import { LiveStatusBadge } from '../components/LiveStatusBadge';

export const SyncPage: React.FC = () => {
  const [runs, setRuns] = useState<SyncRunItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncQuery, setSyncQuery] = useState('Milk');
  const [syncPlatform, setSyncPlatform] = useState('ALL');

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/sync/history');
      if (Array.isArray(res.data)) {
        setRuns(res.data);
      }
    } catch {
      setRuns([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      await apiClient.post('/sync/run', {
        query: syncQuery || 'Milk',
        platform: syncPlatform,
      });
      await fetchHistory();
    } catch {
      // Handled
    } finally {
      setSyncing(false);
    }
  };

  const latestRun = runs[0];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight font-['Outfit'] flex items-center gap-2.5">
            <RefreshCw className="w-6 h-6 text-emerald-400" />
            Live Sync Engine & Ingestion Controller
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manual and scheduled live data pipeline jobs retrieving real-time quick-commerce catalogs
          </p>
        </div>

        <LiveStatusBadge status="LIVE" size="md" />
      </div>

      {/* Sync Trigger Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-[#111827] to-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white font-['Outfit']">Execute On-Demand Live Sync</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Triggers an authenticated live API call to QuickCommerce, normalizes incoming fields, and saves snapshots
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              value={syncQuery}
              onChange={(e) => setSyncQuery(e.target.value)}
              placeholder="Query (e.g. Milk)"
              className="px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
            />
            <select
              value={syncPlatform}
              onChange={(e) => setSyncPlatform(e.target.value)}
              className="px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="ALL">All Platforms</option>
              <option value="BlinkIt">BlinkIt</option>
              <option value="Zepto">Zepto</option>
              <option value="Swiggy">Swiggy</option>
              <option value="BigBasket">BigBasket</option>
              <option value="DMart">DMart</option>
              <option value="JioMart">JioMart</option>
            </select>
            <button
              onClick={handleSyncNow}
              disabled={syncing}
              className={`px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-lg shadow-emerald-950/40 flex items-center gap-2 flex-shrink-0 ${
                syncing ? 'opacity-70 cursor-wait' : ''
              }`}
            >
              <PlayCircle className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Syncing...' : 'SYNC NOW'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Latest Run Telemetry Grid */}
      {latestRun && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-4 rounded-2xl bg-[#111827] border border-slate-800">
            <span className="text-[11px] text-slate-400 uppercase font-bold">Latest Status</span>
            <div className="text-base font-bold text-emerald-400 font-mono mt-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              {latestRun.status}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#111827] border border-slate-800">
            <span className="text-[11px] text-slate-400 uppercase font-bold">Sync Duration</span>
            <div className="text-base font-bold text-cyan-400 font-mono mt-1">
              {latestRun.duration_ms} ms
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#111827] border border-slate-800">
            <span className="text-[11px] text-slate-400 uppercase font-bold">Retrieved</span>
            <div className="text-base font-bold text-white font-mono mt-1">
              {latestRun.products_retrieved} Items
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#111827] border border-slate-800">
            <span className="text-[11px] text-slate-400 uppercase font-bold">Valid Passed</span>
            <div className="text-base font-bold text-emerald-400 font-mono mt-1">
              {latestRun.valid_records}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#111827] border border-slate-800">
            <span className="text-[11px] text-slate-400 uppercase font-bold">Duplicates</span>
            <div className="text-base font-bold text-slate-300 font-mono mt-1">
              {latestRun.duplicate_records}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#111827] border border-slate-800">
            <span className="text-[11px] text-slate-400 uppercase font-bold">API Calls</span>
            <div className="text-base font-bold text-teal-300 font-mono mt-1">
              {latestRun.api_calls}
            </div>
          </div>
        </div>
      )}

      {/* Ingestion History Table */}
      <div className="rounded-3xl bg-[#111827] border border-slate-800 overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Sync Execution History</h3>
          <span className="text-xs text-slate-400 font-mono">{runs.length} Total Runs</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-bold">
                <th className="p-4 pl-6">Job ID / Run</th>
                <th className="p-4">Status</th>
                <th className="p-4">Duration</th>
                <th className="p-4">Products Retrieved</th>
                <th className="p-4">Valid vs Invalid</th>
                <th className="p-4">Duplicates</th>
                <th className="p-4">API Calls</th>
                <th className="p-4 pr-6">Started At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {runs.length > 0 ? (
                runs.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4 pl-6 font-mono font-bold text-white text-[11px]">
                      {r.id.slice(0, 16)}...
                    </td>
                    <td className="p-4">
                      {r.status === 'SUCCESS' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold">
                          <CheckCircle2 className="w-3 h-3" />
                          SUCCESS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[11px] font-semibold">
                          <XCircle className="w-3 h-3" />
                          {r.status}
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-mono text-cyan-400 font-bold">
                      {r.duration_ms} ms
                    </td>
                    <td className="p-4 font-mono font-semibold text-white">
                      {r.products_retrieved}
                    </td>
                    <td className="p-4 font-mono">
                      <span className="text-emerald-400 font-bold">{r.valid_records}</span>
                      <span className="text-slate-500 mx-1">/</span>
                      <span className="text-rose-400 font-bold">{r.invalid_records}</span>
                    </td>
                    <td className="p-4 font-mono text-slate-300">
                      {r.duplicate_records}
                    </td>
                    <td className="p-4 font-mono text-slate-300">
                      {r.api_calls}
                    </td>
                    <td className="p-4 pr-6 font-mono text-slate-400 text-[11px]">
                      {new Date(r.started_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-500">
                    {loading ? 'Loading sync history...' : 'No sync runs recorded yet. Click [SYNC NOW] to start first ingest.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
