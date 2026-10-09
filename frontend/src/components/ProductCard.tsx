import React, { useState } from 'react';
import { ExternalLink, Clock, Zap, Star, ShieldCheck, Tag, ShoppingBag, Store, Info } from 'lucide-react';
import { NormalizedProductItem } from '../types';
import { ViewSourceModal } from './ViewSourceModal';

interface ProductCardProps {
  item: NormalizedProductItem;
}

export const ProductCard: React.FC<ProductCardProps> = ({ item }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Platform badges
  const getPlatformBadge = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes('blinkit')) return { bg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30', name: 'BlinkIt' };
    if (p.includes('zepto')) return { bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30', name: 'Zepto' };
    if (p.includes('swiggy') || p.includes('instamart')) return { bg: 'bg-orange-500/10 text-orange-400 border-orange-500/30', name: 'Swiggy' };
    if (p.includes('bigbasket') || p.includes('bb')) return { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', name: 'BigBasket' };
    if (p.includes('dmart')) return { bg: 'bg-green-500/10 text-green-400 border-green-500/30', name: 'DMart' };
    if (p.includes('jiomart')) return { bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30', name: 'JioMart' };
    if (p.includes('minutes')) return { bg: 'bg-red-500/10 text-red-400 border-red-500/30', name: 'Minutes' };
    return { bg: 'bg-slate-700/50 text-slate-300 border-slate-600', name: platform };
  };

  const platInfo = getPlatformBadge(item.platform);

  const formatTime = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return ts;
    }
  };

  return (
    <>
      <div className="group relative rounded-2xl bg-[#111827] border border-slate-800 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-950/20 transition-all duration-300 flex flex-col justify-between overflow-hidden">
        {/* Top bar with Platform & Status */}
        <div className="p-4 pb-0 flex items-center justify-between">
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${platInfo.bg}`}>
            {platInfo.name}
          </span>

          <div className="flex items-center gap-1.5">
            {item.available ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse" />
                IN STOCK
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                OUT OF STOCK
              </span>
            )}
          </div>
        </div>

        {/* Product Image & Main Details */}
        <div className="p-4 flex gap-4 items-start">
          {/* Image */}
          <div className="w-24 h-24 rounded-xl bg-slate-900 border border-slate-800 flex-shrink-0 flex items-center justify-center overflow-hidden relative">
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.name}
                className="w-full h-full object-contain p-1.5 group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  // Fallback icon on broken remote image
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <ShoppingBag className="w-8 h-8 text-slate-600" />
            )}
            {item.discount_percentage && item.discount_percentage > 0 && (
              <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-rose-500/90 text-white font-bold text-[10px]">
                {item.discount_percentage}% OFF
              </div>
            )}
          </div>

          {/* Title & Metadata */}
          <div className="flex-1 min-w-0">
            {item.brand && (
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">
                {item.brand}
              </span>
            )}
            <h4 className="text-sm font-bold text-white leading-snug line-clamp-2 mt-0.5 group-hover:text-emerald-300 transition-colors">
              {item.name}
            </h4>
            {item.quantity && (
              <span className="text-xs text-slate-400 font-medium block mt-1">
                {item.quantity}
              </span>
            )}

            {/* Ratings & Darkstore */}
            <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
              {item.rating !== null && item.rating !== undefined && (
                <div className="flex items-center gap-1 text-amber-400 font-medium">
                  <Star className="w-3 h-3 fill-amber-400" />
                  <span>{item.rating}</span>
                  {item.rating_count && <span className="text-slate-500">({item.rating_count})</span>}
                </div>
              )}
              {item.store_id && (
                <div className="flex items-center gap-1 text-slate-400 font-mono text-[10px] truncate max-w-[120px]">
                  <Store className="w-3 h-3 text-slate-500 flex-shrink-0" />
                  <span>{item.store_id}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pricing & Stock Banner */}
        <div className="px-4 py-3 bg-slate-900/60 border-t border-b border-slate-800/80 flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-extrabold text-white font-mono tracking-tight">
                ₹{item.offer_price}
              </span>
              {item.mrp && item.mrp > item.offer_price && (
                <span className="text-xs text-slate-500 line-through font-mono">
                  ₹{item.mrp}
                </span>
              )}
            </div>
            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
              LIVE PRICE
            </span>
          </div>

          <div className="text-right">
            {item.eta_minutes !== null && item.eta_minutes !== undefined ? (
              <div className="flex items-center justify-end gap-1 text-xs font-semibold text-cyan-400">
                <Zap className="w-3.5 h-3.5 fill-cyan-400" />
                <span>{item.eta_minutes} mins SLA</span>
              </div>
            ) : item.inventory !== null && item.inventory !== undefined ? (
              <div className="text-xs font-semibold text-slate-300 font-mono">
                Stock: <span className={item.inventory <= 5 ? 'text-amber-400' : 'text-emerald-400'}>{item.inventory} units</span>
              </div>
            ) : (
              <div className="text-[11px] text-slate-400">Standard Delivery</div>
            )}
            <div className="flex items-center justify-end gap-1 text-[10px] text-slate-500 mt-0.5">
              <Clock className="w-2.5 h-2.5" />
              <span>{formatTime(item.fetched_at)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-3 bg-[#0D131F] flex items-center gap-2">
          {item.deeplink ? (
            <a
              href={item.deeplink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm hover:shadow-emerald-900/30"
            >
              <span>Open Product</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            <button
              disabled
              className="flex-1 py-2 px-3 rounded-xl bg-slate-800 text-slate-500 text-xs font-semibold cursor-not-allowed"
            >
              No Deeplink
            </button>
          )}

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700/60 transition"
            title="View exact raw API response and request ID for this data point"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Source</span>
          </button>
        </div>
      </div>

      {/* View Source Modal */}
      <ViewSourceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        requestId={item.request_id}
        platform={item.platform}
        fallbackData={item}
      />
    </>
  );
};
