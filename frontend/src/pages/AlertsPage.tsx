import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, AlertTriangle, XCircle, ShieldAlert, Check, Filter, RefreshCw, Clock } from 'lucide-react';
import { apiClient } from '../api/client';
import { AlertItem } from '../types';

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/alerts', {
        params: {
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          severity: severityFilter !== 'ALL' ? severityFilter : undefined,
        },
      });
      if (Array.isArray(res.data)) {
        setAlerts(res.data);
      }
    } catch {
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [statusFilter, severityFilter]);

  const handleResolve = async (id: string) => {
    try {
      await apiClient.post(`/alerts/${id}/resolve`, {});
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'RESOLVED' } : a)));
    } catch {
      // Handled
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight font-['Outfit'] flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-emerald-400" />
            Real-Time Alert Feed & Incident Manager
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Automated alerts dispatched on price changes, stockouts, delivery SLA deviations, and API connection failures
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open Incidents</option>
            <option value="RESOLVED">Resolved</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="WARNING">Warning</option>
            <option value="INFO">Info</option>
          </select>

          <button
            onClick={fetchAlerts}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3">
        {alerts.length > 0 ? (
          alerts.map((a) => {
            const isCrit = a.severity === 'CRITICAL';
            const isWarn = a.severity === 'WARNING';
            return (
              <div
                key={a.id}
                className={`p-5 rounded-3xl bg-[#111827] border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isCrit
                    ? 'border-rose-500/30 shadow-lg shadow-rose-950/10'
                    : isWarn
                    ? 'border-amber-500/30'
                    : 'border-slate-800'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`p-2.5 rounded-2xl flex-shrink-0 ${
                      isCrit
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : isWarn
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {isCrit ? <XCircle className="w-5 h-5" /> : isWarn ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-sm">{a.message}</span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isCrit
                            ? 'bg-rose-500/20 text-rose-300'
                            : isWarn
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {a.severity}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                        {a.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-400 font-mono">
                      {a.platform && <span>Platform: <span className="text-slate-200 font-semibold">{a.platform}</span></span>}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(a.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  {a.status === 'OPEN' ? (
                    <button
                      onClick={() => handleResolve(a.id)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold border border-slate-700 transition"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Resolve</span>
                    </button>
                  ) : (
                    <span className="text-xs text-slate-500 font-semibold flex items-center gap-1 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Resolved
                    </span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 rounded-3xl bg-[#111827] border border-slate-800 text-center text-slate-500 text-xs">
            {loading ? 'Streaming alert telemetry...' : 'No active alerts for the selected filters.'}
          </div>
        )}
      </div>
    </div>
  );
};
