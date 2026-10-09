import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Clock, Zap, Star, ShieldCheck, ShoppingBag, Store, Tag } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { apiClient } from '../api/client';
import { ProductDetail } from '../types';
import { LiveStatusBadge } from '../components/LiveStatusBadge';
import { ViewSourceModal } from '../components/ViewSourceModal';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      setLoading(true);
      apiClient.get(`/products/${id}`)
        .then((res) => setProduct(res.data))
        .catch(() => setProduct(null))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 text-xs">
        Loading historical snapshots for product {id}...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p>Product not found.</p>
        <Link to="/products" className="text-emerald-400 text-xs font-semibold mt-2 inline-block">
          Return to Product Catalog
        </Link>
      </div>
    );
  }

  const priceTrendData = product.price_history?.map((p) => ({
    time: new Date(p.fetched_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    price: p.offer_price,
    mrp: p.mrp || p.offer_price,
  })).reverse() || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Back Button */}
      <Link
        to="/products"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Products</span>
      </Link>

      {/* Main Spec Card */}
      <div className="p-8 rounded-3xl bg-[#111827] border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-8 shadow-2xl">
        {/* Image */}
        <div className="w-full h-64 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center p-4">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="max-h-full max-w-full object-contain" />
          ) : (
            <ShoppingBag className="w-16 h-16 text-slate-600" />
          )}
        </div>

        {/* Specs & Pricing */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              {product.platform}
            </span>
            {product.brand && (
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {product.brand}
              </span>
            )}
          </div>

          <h2 className="text-2xl font-black text-white font-['Outfit']">{product.name}</h2>
          {product.quantity && <p className="text-sm text-slate-400">{product.quantity}</p>}

          <div className="flex items-baseline gap-3 pt-2">
            <span className="text-3xl font-black text-emerald-400 font-mono">
              ₹{product.latest_price?.offer_price || 0}
            </span>
            {product.latest_price?.mrp && product.latest_price.mrp > (product.latest_price.offer_price || 0) && (
              <span className="text-base text-slate-500 line-through font-mono">
                ₹{product.latest_price.mrp}
              </span>
            )}
            {product.latest_price?.discount_percentage && (
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
                {product.latest_price.discount_percentage}% OFF
              </span>
            )}
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 font-medium">Availability</span>
              <div className="font-bold text-emerald-400 mt-0.5">
                {product.latest_inventory?.available ? 'IN STOCK' : 'OUT OF STOCK'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 font-medium">Darkstore Inventory</span>
              <div className="font-bold text-white font-mono mt-0.5">
                {product.latest_inventory?.inventory !== null && product.latest_inventory?.inventory !== undefined
                  ? `${product.latest_inventory.inventory} units`
                  : 'Signal OK'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 font-medium">Delivery SLA</span>
              <div className="font-bold text-cyan-400 font-mono mt-0.5">
                {product.latest_eta ? `${product.latest_eta} mins` : '10-15 mins'}
              </div>
            </div>
          </div>

          {/* Action Links */}
          <div className="flex items-center gap-3 pt-4">
            {product.deeplink && (
              <a
                href={product.deeplink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-950/40"
              >
                <span>Open Product Link</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              onClick={() => setSelectedTraceId(product.latest_price?.request_id || 'qc_req_prod')}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Audit Lineage</span>
            </button>
          </div>
        </div>
      </div>

      {/* Historical Price Chart */}
      <div className="p-6 rounded-3xl bg-[#111827] border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Audited Historical Price Trend
        </h3>

        <div className="h-64 w-full">
          {priceTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={priceTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F293D" vertical={false} />
                <XAxis dataKey="time" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} unit="₹" domain={['dataMin - 5', 'dataMax + 5']} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B0F17', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Line type="stepAfter" dataKey="price" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 4, fill: '#22c55e' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              Only single snapshot stored yet. Run syncs to build time-series graph.
            </div>
          )}
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
