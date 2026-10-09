import React, { useState, useEffect } from 'react';
import { TrendingDown, TrendingUp, Minus, ShieldCheck, RefreshCw, Filter, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { apiClient } from '../api/client';
import { LiveStatusBadge } from '../components/LiveStatusBadge';
import { ViewSourceModal } from '../components/ViewSourceModal';

export const PriceMonitoringPage: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState('ALL');
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/prices', {
        params: { platform: selectedPlatform },
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
    fetchPrices();
  }, [selectedPlatform]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight font-['Outfit'] flex items-center gap-2.5">
            <TrendingDown className="w-6 h-6 text-emerald-400" />
            Live Price Monitoring & Fluctuations
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time price changes, discounts, and delta calculations computed from immutable PostgreSQL snapshots
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 focus:outline-none"
          >
            <option value="ALL">All Platforms</option>
            <option value="BlinkIt">BlinkIt</option>
            <option value="Zepto">Zepto</option>
            <option value="Swiggy">Swiggy</option>
            <option value="BigBasket">BigBasket</option>
            <option value="DMart">DMart</option>
            <option value="JioMart">JioMart</option>
            <option value="Minutes">Minutes</option>
          </select>

          <button
            onClick={fetchPrices}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Price Table */}
      <div className="rounded-3xl bg-[#111827] border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-bold">
                <th className="p-4 pl-6">Product / Brand</th>
                <th className="p-4">Platform</th>
                <th className="p-4">Current Price</th>
                <th className="p-4">Previous Price</th>
                <th className="p-4">Difference</th>
                <th className="p-4">Percentage Fluctuation</th>
                <th className="p-4">MRP / Discount</th>
                <th className="p-4">Snapshot Timestamp</th>
                <th className="p-4 pr-6 text-right">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {items.length > 0 ? (
                items.map((row) => {
                  const isDrop = row.price_difference < 0;
                  const isIncrease = row.price_difference > 0;
                  return (
                    <tr key={row.product_id} className="hover:bg-slate-800/40 transition">
                      <td className="p-4 pl-6">
                        <div className="font-bold text-white text-sm">{row.name}</div>
                        {row.brand && <div className="text-[11px] text-emerald-400 font-semibold">{row.brand}</div>}
                      </td>
                      <td className="p-4 font-semibold text-slate-300">
                        {row.platform}
                      </td>
                      <td className="p-4 font-mono font-extrabold text-sm text-white">
                        ₹{row.current_price}
                      </td>
                      <td className="p-4 font-mono text-slate-400">
                        ₹{row.previous_price}
                      </td>
                      <td className="p-4 font-mono font-bold">
                        {isDrop ? (
                          <span className="text-emerald-400 flex items-center gap-0.5">
                            <ArrowDownRight className="w-4 h-4" />
                            -₹{Math.abs(row.price_difference)}
                          </span>
                        ) : isIncrease ? (
                          <span className="text-rose-400 flex items-center gap-0.5">
                            <ArrowUpRight className="w-4 h-4" />
                            +₹{row.price_difference}
                          </span>
                        ) : (
                          <span className="text-slate-500 flex items-center gap-0.5">
                            <Minus className="w-3.5 h-3.5" />
                            ₹0
                          </span>
                        )}
                      </td>
                      <td className="p-4 font-mono font-bold">
                        {isDrop ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {row.percentage_change}%
                          </span>
                        ) : isIncrease ? (
                          <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            +{row.percentage_change}%
                          </span>
                        ) : (
                          <span className="text-slate-500">0.0%</span>
                        )}
                      </td>
                      <td className="p-4 font-mono text-slate-400">
                        {row.mrp ? `₹${row.mrp}` : '—'}
                        {row.discount_percentage ? ` (${row.discount_percentage}% off)` : ''}
                      </td>
                      <td className="p-4 font-mono text-slate-400 text-[11px]">
                        {new Date(row.fetched_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <button
                          onClick={() => setSelectedTraceId(row.request_id || 'qc_price_snap')}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-medium border border-slate-700"
                        >
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          <span>Audit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-500">
                    {loading ? 'Analyzing live price snapshots...' : 'No price records found. Run a live search to store initial price baseline.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ViewSourceModal
        isOpen={!!selectedTraceId}
        onClose={() => setSelectedTraceId(null)}
        requestId={selectedTraceId || ''}
      />
    </div>
  );
};
