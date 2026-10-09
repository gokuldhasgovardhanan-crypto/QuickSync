import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Boxes,
  RotateCcw,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ChevronRight,
  Package,
  Layers,
  Star,
  MessageSquare,
  HelpCircle,
  Zap,
  Info
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
  Legend
} from 'recharts';
import { apiClient } from '../api/client';
import {
  DemandDashboardSummary,
  ProductDemandAnalysis,
  DemandClassification
} from '../types/demand';
import { LiveStatusBadge } from '../components/LiveStatusBadge';

export const DemandDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [periodDays, setPeriodDays] = useState<number>(14);
  const [summary, setSummary] = useState<DemandDashboardSummary | null>(null);
  const [products, setProducts] = useState<ProductDemandAnalysis[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterClassification, setFilterClassification] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchDemandData = async () => {
    try {
      setLoading(true);
      const [sumRes, prodRes] = await Promise.all([
        apiClient.get<DemandDashboardSummary>(`/demand/summary?period_days=${periodDays}`),
        apiClient.get<ProductDemandAnalysis[]>(`/demand/products?period_days=${periodDays}&limit=100`)
      ]);
      setSummary(sumRes.data);
      setProducts(prodRes.data);
    } catch (err) {
      console.error('Failed to load demand intelligence data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemandData();
  }, [periodDays]);

  // Categories list
  const categories = Array.from(new Set(products.map((p) => p.category))).filter(Boolean);

  // Filtered products
  const filteredProducts = products.filter((p) => {
    const matchesClass =
      filterClassification === 'ALL' || p.demand_classification === filterClassification;
    const matchesCat = filterCategory === 'ALL' || p.category === filterCategory;
    const matchesSearch =
      searchQuery === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesClass && matchesCat && matchesSearch;
  });

  const getPlatformBadge = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes('blinkit')) return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
    if (p.includes('zepto')) return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
    if (p.includes('swiggy')) return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
    if (p.includes('bigbasket')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    if (p.includes('dmart')) return 'bg-green-500/10 text-green-400 border-green-500/30';
    if (p.includes('jiomart')) return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    return 'bg-slate-800 text-slate-300 border-slate-700';
  };

  const getTrendBadge = (classification: DemandClassification, changePct: number) => {
    switch (classification) {
      case 'INCREASING_DEMAND':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
            +{changePct}% Increasing
          </span>
        );
      case 'DECLINING_DEMAND':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
            {changePct}% Declining
          </span>
        );
      case 'STABLE_DEMAND':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <RotateCcw className="w-3 h-3 text-cyan-400" />
            {changePct >= 0 ? `+${changePct}%` : `${changePct}%`} Stable
          </span>
        );
      case 'INSUFFICIENT_DATA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            Insufficient Data
          </span>
        );
    }
  };

  const getRecommendationPill = (type: string) => {
    switch (type) {
      case 'REPLENISHMENT':
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 inline-flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
            Replenish Required
          </span>
        );
      case 'REPLACEMENT':
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 inline-flex items-center gap-1">
            <Layers className="w-3 h-3 text-purple-400" />
            Replace SKU
          </span>
        );
      case 'DISCONTINUATION':
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 inline-flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            Discontinue SKU
          </span>
        );
      case 'KEEP_MONITORING':
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700 inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-slate-400" />
            Routine Monitor
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-800/60 text-slate-400 border border-slate-700/60">
            Pending Data
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header with Title & Period Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-600 to-cyan-500 shadow-lg shadow-emerald-950/40">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight font-['Outfit']">
              Demand-Driven Product Intelligence
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic demand classifications, stockout risk velocity, and customer feedback signals from real operational data.
          </p>
        </div>

        {/* Action Bar */}
        <div className="flex items-center gap-3">
          {/* Time Window Buttons */}
          <div className="flex items-center bg-[#111827] border border-slate-800 rounded-xl p-1 text-xs font-semibold">
            {[7, 14, 30].map((days) => (
              <button
                key={days}
                onClick={() => setPeriodDays(days)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  periodDays === days
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {days} Days
              </button>
            ))}
          </div>

          <button
            onClick={() => navigate('/product-optimization')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 transition flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Product Decision Workbench</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Top Level Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Increasing Demand */}
        <div
          onClick={() => setFilterClassification('INCREASING_DEMAND')}
          className={`p-4 rounded-2xl bg-[#111827] border transition cursor-pointer hover:border-emerald-500/50 hover:shadow-lg ${
            filterClassification === 'INCREASING_DEMAND'
              ? 'border-emerald-500 shadow-lg shadow-emerald-950/30'
              : 'border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-emerald-400 font-medium">
            <span>Increasing Demand</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-white mt-2 font-['Outfit']">
            {summary?.increasing_demand_count ?? 0}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Sustained demand surge (+10%)</p>
        </div>

        {/* High Demand + Low Stock */}
        <div
          onClick={() => {
            setFilterClassification('ALL');
            navigate('/product-optimization');
          }}
          className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 transition cursor-pointer hover:border-rose-500 hover:shadow-lg"
        >
          <div className="flex items-center justify-between text-xs text-rose-400 font-bold">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              High Demand / Low Stock
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-300 mt-2 font-['Outfit']">
            {summary?.high_demand_low_stock_count ?? 0}
          </div>
          <p className="text-[10px] text-rose-400/80 mt-1">Imminent stockout risk</p>
        </div>

        {/* Replenishment Recommendations */}
        <div
          onClick={() => navigate('/product-optimization')}
          className="p-4 rounded-2xl bg-[#111827] border border-slate-800 transition cursor-pointer hover:border-amber-500/50 hover:shadow-lg"
        >
          <div className="flex items-center justify-between text-xs text-amber-400 font-medium">
            <span>Replenish Orders</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2 font-['Outfit']">
            {summary?.replenishment_recommended_count ?? 0}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Formula suggested buffer</p>
        </div>

        {/* Stable Demand */}
        <div
          onClick={() => setFilterClassification('STABLE_DEMAND')}
          className={`p-4 rounded-2xl bg-[#111827] border transition cursor-pointer hover:border-cyan-500/50 hover:shadow-lg ${
            filterClassification === 'STABLE_DEMAND'
              ? 'border-cyan-500 shadow-lg shadow-cyan-950/30'
              : 'border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-cyan-400 font-medium">
            <span>Stable Demand</span>
            <RotateCcw className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2 font-['Outfit']">
            {summary?.stable_demand_count ?? 0}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Consistent daily orders</p>
        </div>

        {/* Declining Demand */}
        <div
          onClick={() => setFilterClassification('DECLINING_DEMAND')}
          className={`p-4 rounded-2xl bg-[#111827] border transition cursor-pointer hover:border-purple-500/50 hover:shadow-lg ${
            filterClassification === 'DECLINING_DEMAND'
              ? 'border-purple-500 shadow-lg shadow-purple-950/30'
              : 'border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-purple-400 font-medium">
            <span>Declining Demand</span>
            <TrendingDown className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2 font-['Outfit']">
            {summary?.declining_demand_count ?? 0}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Replace or Discontinue</p>
        </div>

        {/* Insufficient Data */}
        <div
          onClick={() => setFilterClassification('INSUFFICIENT_DATA')}
          className={`p-4 rounded-2xl bg-[#111827] border transition cursor-pointer hover:border-slate-600 hover:shadow-lg ${
            filterClassification === 'INSUFFICIENT_DATA'
              ? 'border-slate-500 shadow-lg'
              : 'border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Insufficient Data</span>
            <HelpCircle className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-black text-slate-300 mt-2 font-['Outfit']">
            {summary?.insufficient_data_count ?? 0}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">&lt; 3 observation periods</p>
        </div>
      </div>

      {/* Critical High Demand + Low Stock Banner */}
      {summary && summary.top_replenishment_items && summary.top_replenishment_items.length > 0 && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-950/40 via-[#111827] to-[#111827] border border-amber-500/30 shadow-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                <Zap className="w-4 h-4 fill-amber-400" />
              </span>
              <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                High Demand + Low Stock Replenishment Actionable ({summary.top_replenishment_items.length})
              </h3>
            </div>
            <span className="text-xs text-amber-400/90 font-mono">
              Lead Time + Safety Stock Coverage Deficit Detected
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {summary.top_replenishment_items.slice(0, 3).map((item) => (
              <div
                key={item.product_id}
                className="p-3.5 rounded-2xl bg-[#0B0F17] border border-slate-800 flex flex-col justify-between space-y-2 hover:border-amber-500/50 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getPlatformBadge(item.platform)}`}>
                        {item.platform}
                      </span>
                      <span className="text-xs font-bold text-white truncate max-w-[150px]">
                        {item.name}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Stock: <span className="text-rose-400 font-bold">{item.current_stock} units</span> ({item.estimated_stock_coverage_days}d coverage)
                    </p>
                  </div>
                  <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-300 text-xs font-black">
                    +{item.suggested_replenishment_qty} units
                  </span>
                </div>

                <div className="text-[11px] text-slate-300 bg-slate-900/60 p-2 rounded-lg border border-slate-800/80 leading-relaxed">
                  {item.reason_explanation}
                </div>

                <button
                  onClick={() => navigate(`/product-optimization?id=${item.product_id}`)}
                  className="w-full py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-semibold text-xs border border-amber-500/30 transition flex items-center justify-center gap-1"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Review Replenishment Order</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics & Feedback Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Category Demand Distribution Chart */}
        <div className="lg:col-span-2 p-5 rounded-3xl bg-[#111827] border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <BarChart className="w-4 h-4 text-emerald-400" />
                Category Demand & Unit Velocity ({periodDays} Days)
              </h3>
              <p className="text-xs text-slate-400">Total units sold and demand growth trends by retail category</p>
            </div>
          </div>

          <div className="h-64 w-full">
            {summary && summary.category_demand_distribution && summary.category_demand_distribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.category_demand_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="category" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0B0F17', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                    itemStyle={{ color: '#E2E8F0' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="total_units_sold" name="Total Units Sold" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="increasing_count" name="Surging SKUs" fill="#38BDF8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="declining_count" name="Declining SKUs" fill="#F43F5E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Insufficient data for category chart
              </div>
            )}
          </div>
        </div>

        {/* Live Customer Feedback Signals */}
        <div className="p-5 rounded-3xl bg-[#111827] border border-slate-800 space-y-3 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                Live Customer Feedback Signals
              </h3>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono font-bold">
                VERIFIED REVIEWS
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Real review sentiment driving demand shifts</p>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-[220px] pr-1">
            {summary && summary.recent_feedback_signals && summary.recent_feedback_signals.length > 0 ? (
              summary.recent_feedback_signals.slice(0, 4).map((fb) => (
                <div key={fb.id} className="p-2.5 rounded-xl bg-[#0B0F17] border border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300 flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      {fb.rating}.0
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                        fb.sentiment === 'POSITIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : fb.sentiment === 'NEGATIVE'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {fb.sentiment}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 line-clamp-2 italic">"{fb.review_text}"</p>
                  <div className="flex items-center gap-1 flex-wrap pt-0.5">
                    {fb.feedback_tags?.map((t) => (
                      <span key={t} className="text-[9px] px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 font-mono">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-500">
                Customer feedback data unavailable
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Feedback loop connected</span>
            <span className="text-emerald-400 font-mono">100% Deterministic</span>
          </div>
        </div>
      </div>

      {/* Granular Demand Catalog Table */}
      <div className="p-5 rounded-3xl bg-[#111827] border border-slate-800 space-y-4 shadow-xl">
        {/* Table Filters Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by product name or brand..."
                className="w-full pl-9 pr-3 py-2 bg-[#0B0F17] border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Category Select */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 bg-[#0B0F17] border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Classification Filter Pills */}
            <div className="flex items-center bg-[#0B0F17] border border-slate-800 rounded-xl p-0.5 text-xs">
              {['ALL', 'INCREASING_DEMAND', 'STABLE_DEMAND', 'DECLINING_DEMAND', 'INSUFFICIENT_DATA'].map((cls) => (
                <button
                  key={cls}
                  onClick={() => setFilterClassification(cls)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition ${
                    filterClassification === cls
                      ? 'bg-slate-700 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cls === 'ALL' ? 'All Trends' : cls.replace('_DEMAND', '').replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Monitored Products Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#0B0F17] text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Product & Platform</th>
                <th className="py-3 px-3 font-semibold">Category</th>
                <th className="py-3 px-3 font-semibold">Demand Trend</th>
                <th className="py-3 px-3 font-semibold">Daily Sales Velocity</th>
                <th className="py-3 px-3 font-semibold">Stock Coverage</th>
                <th className="py-3 px-3 font-semibold">Customer Rating</th>
                <th className="py-3 px-3 font-semibold">Recommendation</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((p) => (
                  <tr key={p.product_id} className="hover:bg-slate-800/30 transition group">
                    {/* Product & Platform */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.name} className="w-full h-full object-contain p-1" />
                          ) : (
                            <Package className="w-5 h-5 text-slate-600" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${getPlatformBadge(p.platform)}`}>
                              {p.platform}
                            </span>
                            <span className="font-bold text-white group-hover:text-emerald-400 transition">
                              {p.name}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400">{p.brand || 'QuickCommerce SKU'}</span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 font-medium">
                        {p.category}
                      </span>
                    </td>

                    {/* Demand Trend */}
                    <td className="py-3.5 px-3">
                      {getTrendBadge(p.demand_classification, p.demand_change_pct)}
                    </td>

                    {/* Daily Sales Velocity */}
                    <td className="py-3.5 px-3 font-mono">
                      {p.has_sufficient_data ? (
                        <div>
                          <span className="text-white font-bold">{p.avg_daily_demand} units/day</span>
                          <p className="text-[10px] text-slate-400">{p.units_sold} total units ({periodDays}d)</p>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Insufficient Data</span>
                      )}
                    </td>

                    {/* Stock Coverage */}
                    <td className="py-3.5 px-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-bold font-mono ${
                              p.is_low_stock ? 'text-rose-400' : 'text-slate-200'
                            }`}
                          >
                            {p.current_stock} units
                          </span>
                          {p.is_low_stock && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-rose-500/20 text-rose-400 font-bold">
                              LOW
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ~{p.estimated_stock_coverage_days} days buffer
                        </span>
                      </div>
                    </td>

                    {/* Customer Rating */}
                    <td className="py-3.5 px-3">
                      {p.rating ? (
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span className="font-bold text-white">{p.rating.toFixed(1)}</span>
                          <span className="text-[10px] text-slate-400">({p.rating_count || 0})</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic text-[11px]">No reviews</span>
                      )}
                    </td>

                    {/* Recommendation */}
                    <td className="py-3.5 px-3">
                      {getRecommendationPill(p.recommendation_type)}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => navigate(`/product-optimization?id=${p.product_id}`)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 hover:text-emerald-300 font-bold text-xs border border-emerald-500/30 transition inline-flex items-center gap-1"
                      >
                        <span>Optimize</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No products match the selected criteria.
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
