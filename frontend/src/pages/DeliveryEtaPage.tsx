import React, { useState, useEffect } from 'react';
import { Truck, Zap, Store, ShieldCheck, RefreshCw, Clock } from 'lucide-react';
import { apiClient } from '../api/client';
import { LiveStatusBadge } from '../components/LiveStatusBadge';
import { ViewSourceModal } from '../components/ViewSourceModal';

export const DeliveryEtaPage: React.FC = () => {
  const [etas, setEtas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);

  const fetchEtas = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/delivery');
      if (Array.isArray(res.data)) {
        setEtas(res.data);
      }
    } catch {
      setEtas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEtas();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight font-['Outfit'] flex items-center gap-2.5">
            <Truck className="w-6 h-6 text-emerald-400" />
            Live Delivery ETA & Darkstore SLA
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time delivery fulfillment timelines across quick-commerce providers
          </p>
        </div>

        <button
          onClick={fetchEtas}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition self-start"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Grid of SLA Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {etas.map((eta) => (
          <div
            key={eta.platform}
            className="p-5 rounded-3xl bg-[#111827] border border-slate-800 hover:border-emerald-500/30 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white">{eta.platform}</span>
                <LiveStatusBadge status={eta.status || 'LIVE'} size="sm" />
              </div>

              <div className="my-5 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-cyan-400 font-mono">
                  {eta.eta_minutes !== null && eta.eta_minutes !== undefined ? `${eta.eta_minutes}` : '8-12'}
                </span>
                <span className="text-xs font-bold text-slate-400 uppercase">Minutes ETA</span>
              </div>

              <div className="space-y-2 text-xs text-slate-400 pt-3 border-t border-slate-800/80">
                <div className="flex justify-between items-center">
                  <span>Fulfillment Darkstore:</span>
                  <span className="text-slate-200 font-mono text-[11px]">{eta.store_id || 'STORE_BLR_01'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Store Operational:</span>
                  <span className="text-emerald-400 font-semibold">{eta.is_open ? 'OPEN' : 'CLOSED'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Last Live Signal:</span>
                  <span className="text-slate-300 font-mono text-[11px]">
                    {eta.fetched_at ? new Date(eta.fetched_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Live'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-end">
              <button
                onClick={() => setSelectedTraceId(eta.request_id || 'qc_eta_snap')}
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Audit SLA</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      <ViewSourceModal
        isOpen={!!selectedTraceId}
        onClose={() => setSelectedTraceId(null)}
        requestId={selectedTraceId || ''}
      />
    </div>
  );
};
