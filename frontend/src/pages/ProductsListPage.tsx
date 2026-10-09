import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, Filter, RefreshCw, Eye, FileSpreadsheet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { LiveStatusBadge } from '../components/LiveStatusBadge';
import { ExportExcelModal } from '../components/ExportExcelModal';

export const ProductsListPage: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [platform, setPlatform] = useState('ALL');
  const [search, setSearch] = useState('');
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/products', {
        params: { platform: platform !== 'ALL' ? platform : undefined, q: search.trim() || undefined },
      });
      if (Array.isArray(res.data)) {
        setProducts(res.data);
      }
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [platform]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight font-['Outfit'] flex items-center gap-2.5">
            <ShoppingBag className="w-6 h-6 text-emerald-400" />
            Audited Live Product Catalog
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Normalized product records stored from real-time quick-commerce sync runs
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setExportModalOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            EXPORT TO EXCEL
          </button>

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
            onClick={fetchProducts}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <ExportExcelModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
      />

      {/* Products Table */}
      <div className="rounded-3xl bg-[#111827] border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-bold">
                <th className="p-4 pl-6">Product / Brand</th>
                <th className="p-4">Platform</th>
                <th className="p-4">Current Price</th>
                <th className="p-4">MRP</th>
                <th className="p-4">Availability</th>
                <th className="p-4">Inventory</th>
                <th className="p-4">Last Fetched</th>
                <th className="p-4 pr-6 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {products.length > 0 ? (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4 pl-6">
                      <div className="font-bold text-white text-sm">{p.name}</div>
                      <div className="text-[11px] text-emerald-400 font-semibold">{p.brand || 'General'}</div>
                    </td>
                    <td className="p-4 font-semibold text-slate-300">
                      {p.platform}
                    </td>
                    <td className="p-4 font-mono font-bold text-sm text-emerald-400">
                      ₹{p.current_price}
                    </td>
                    <td className="p-4 font-mono text-slate-500">
                      {p.mrp ? `₹${p.mrp}` : '—'}
                    </td>
                    <td className="p-4">
                      {p.available ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          IN STOCK
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                          OUT OF STOCK
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-mono text-slate-300">
                      {p.inventory !== null && p.inventory !== undefined ? `${p.inventory} units` : 'Signal OK'}
                    </td>
                    <td className="p-4 font-mono text-slate-400 text-[11px]">
                      {new Date(p.last_fetched).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <Link
                        to={`/products/${p.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700"
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                        <span>History</span>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-500">
                    {loading ? 'Retrieving catalog from database...' : 'No products found. Run live search or sync to store products.'}
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
