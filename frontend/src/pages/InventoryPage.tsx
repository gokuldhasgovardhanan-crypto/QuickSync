import React, { useState, useEffect } from 'react';
import { Boxes, CheckCircle2, AlertTriangle, XCircle, Store, RefreshCw, Filter, ShieldCheck } from 'lucide-react';
import { apiClient } from '../api/client';
import { ViewSourceModal } from '../components/ViewSourceModal';

export const InventoryPage: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [platform, setPlatform] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/inventory', {
        params: { platform, status_filter: statusFilter },
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
    fetchInventory();
  }, [platform, statusFilter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight font-['Outfit'] flex items-center gap-2.5">
            <Boxes className="w-6 h-6 text-emerald-400" />
            Darkstore Inventory & Stock Signal Telemetry
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real stock count values and availability signals streaming directly from live quick-commerce nodes
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 focus:outline-none"
          >
            <option value="ALL">All Stock States</option>
            <option value="IN_STOCK">In Stock (&gt;5)</option>
            <option value="LOW_STOCK">Low Stock (1-5)</option>
            <option value="OUT_OF_STOCK">Out of Stock (0)</option>
          </select>

          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 focus:outline-none"
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
            onClick={fetchInventory}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="rounded-3xl bg-[#111827] border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-bold">
                <th className="p-4 pl-6">Product</th>
                <th className="p-4">Platform</th>
                <th className="p-4">Stock Signal Status</th>
                <th className="p-4">Live Inventory Units</th>
                <th className="p-4">Darkstore / Store ID</th>
                <th className="p-4">Telemetry Timestamp</th>
                <th className="p-4 pr-6 text-right">Audit Trace</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {items.length > 0 ? (
                items.map((row) => (
                  <tr key={row.product_id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4 pl-6">
                      <div className="font-bold text-white text-sm">{row.name}</div>
                      {row.brand && <div className="text-[11px] text-emerald-400 font-semibold">{row.brand}</div>}
                    </td>
                    <td className="p-4 font-semibold text-slate-300">
                      {row.platform}
                    </td>
                    <td className="p-4">
                      {row.stock_signal === 'IN_STOCK' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          IN STOCK
                        </span>
                      ) : row.stock_signal === 'LOW_STOCK' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-semibold">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          LOW STOCK (&lt;5)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-semibold">
                          <XCircle className="w-3.5 h-3.5" />
                          OUT OF STOCK
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-mono font-bold text-sm">
                      {row.inventory_count !== null && row.inventory_count !== undefined ? (
                        <span className={row.inventory_count === 0 ? 'text-rose-400' : row.inventory_count <= 5 ? 'text-amber-400' : 'text-emerald-400'}>
                          {row.inventory_count} units
                        </span>
                      ) : (
                        <span className="text-slate-400">Signal Available</span>
                      )}
                    </td>
                    <td className="p-4 font-mono text-slate-300 text-xs flex items-center gap-1.5 pt-5">
                      <Store className="w-3.5 h-3.5 text-slate-500" />
                      <span>{row.store_id || 'DARKSTORE_LOC_1'}</span>
                    </td>
                    <td className="p-4 font-mono text-slate-400 text-[11px]">
                      {new Date(row.fetched_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <button
                        onClick={() => setSelectedTraceId(row.request_id || 'qc_inv_snap')}
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
                  <td colSpan={7} className="p-12 text-center text-slate-500">
                    {loading ? 'Retrieving live darkstore inventory signals...' : 'No inventory records found for current filters.'}
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
