import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, ExternalLink, Zap, Star, ShieldCheck, Check, X, RefreshCw, Store } from 'lucide-react';
import { apiClient } from '../api/client';
import { PlatformComparison } from '../types';
import { useLocationState } from '../hooks/useLocation';
import { LiveStatusBadge } from '../components/LiveStatusBadge';
import { ViewSourceModal } from '../components/ViewSourceModal';

export const ComparisonPage: React.FC = () => {
  const [productQuery, setProductQuery] = useState('Milk');
  const [items, setItems] = useState<PlatformComparison[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);
  const { selectedLocation } = useLocationState();

  const fetchComparison = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/comparison', {
        params: { q: productQuery.trim() },
      });
      if (Array.isArray(res.data)) {
        setItems(res.data);
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComparison();
  }, [productQuery, selectedLocation]);

  const quickItems = ['Milk', 'Bread', 'Eggs', 'Butter', 'Rice', 'Coffee'];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight font-['Outfit'] flex items-center gap-2.5">
            <ArrowLeftRight className="w-6 h-6 text-emerald-400" />
            Cross-Platform Comparison Engine
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Side-by-side price, inventory, and delivery SLA comparison across quick-commerce providers
          </p>
        </div>

        <LiveStatusBadge status="LIVE" size="md" />
      </div>

      {/* Query Selector */}
      <div className="p-6 rounded-3xl bg-[#111827] border border-slate-800 space-y-3 shadow-xl">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={productQuery}
            onChange={(e) => setProductQuery(e.target.value)}
            placeholder="Enter product to compare (e.g. Milk, Bread, Eggs)..."
            className="flex-1 px-4 py-3 bg-[#0B0F17] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 font-medium"
          />
          <button
            onClick={fetchComparison}
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Update Comparison</span>
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap pt-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Compare Quickly:</span>
          {quickItems.map((item) => (
            <button
              key={item}
              onClick={() => setProductQuery(item)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition border ${
                productQuery === item
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="rounded-3xl bg-[#111827] border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-bold">
                <th className="p-4 pl-6">Platform</th>
                <th className="p-4">Live Price</th>
                <th className="p-4">MRP</th>
                <th className="p-4">Availability</th>
                <th className="p-4">Darkstore Stock</th>
                <th className="p-4">Delivery SLA</th>
                <th className="p-4">Store ID</th>
                <th className="p-4">Fetched Timestamp</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {items.length > 0 ? (
                items.map((row) => (
                  <tr key={row.platform} className="hover:bg-slate-800/40 transition">
                    <td className="p-4 pl-6 font-bold text-white flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                      <span>{row.platform}</span>
                    </td>
                    <td className="p-4 font-mono font-extrabold text-sm text-emerald-400">
                      ₹{row.price}
                    </td>
                    <td className="p-4 font-mono text-slate-500">
                      {row.mrp ? `₹${row.mrp}` : '—'}
                    </td>
                    <td className="p-4">
                      {row.available ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold">
                          <Check className="w-3 h-3" />
                          IN STOCK
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[11px] font-semibold">
                          <X className="w-3 h-3" />
                          OUT OF STOCK
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-mono text-slate-300">
                      {row.inventory !== null && row.inventory !== undefined ? (
                        <span className={row.inventory <= 5 ? 'text-amber-400 font-bold' : 'text-slate-200'}>
                          {row.inventory} units
                        </span>
                      ) : (
                        <span className="text-slate-500">Signal OK</span>
                      )}
                    </td>
                    <td className="p-4">
                      {row.eta_minutes !== null && row.eta_minutes !== undefined ? (
                        <span className="inline-flex items-center gap-1 text-cyan-400 font-semibold font-mono">
                          <Zap className="w-3.5 h-3.5 fill-cyan-400" />
                          {row.eta_minutes} mins
                        </span>
                      ) : (
                        <span className="text-slate-400">10-15m</span>
                      )}
                    </td>
                    <td className="p-4 font-mono text-slate-400 text-[11px]">
                      {row.store_id || 'DARKSTORE_1'}
                    </td>
                    <td className="p-4 font-mono text-slate-400 text-[11px]">
                      {new Date(row.fetched_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="p-4 pr-6 text-right space-x-2">
                      {row.deeplink && (
                        <a
                          href={row.deeplink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 text-xs font-semibold"
                        >
                          <span>Open</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      <button
                        onClick={() => setSelectedTraceId(row.request_id || 'qc_req_comp')}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-medium border border-slate-700"
                      >
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        <span>Source</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-500">
                    {loading ? 'Querying live platform prices...' : `No live comparison records found for "${productQuery}".`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Traceability Modal */}
      <ViewSourceModal
        isOpen={!!selectedTraceId}
        onClose={() => setSelectedTraceId(null)}
        requestId={selectedTraceId || ''}
      />
    </div>
  );
};
