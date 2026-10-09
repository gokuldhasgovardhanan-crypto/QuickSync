import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Zap,
  Layers,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Package,
  TrendingUp,
  TrendingDown,
  Star,
  Clock,
  ShieldCheck,
  Search,
  ChevronRight,
  Info,
  Sliders,
  History,
  Check,
  AlertCircle
} from 'lucide-react';
import { apiClient } from '../api/client';
import {
  ProductDemandAnalysis,
  SellerDecisionLog,
  AlternativeProductCandidate,
  LifecycleStatus
} from '../types/demand';
import { useAuth } from '../store/authStore';

export const ProductOptimizationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [products, setProducts] = useState<ProductDemandAnalysis[]>([]);
  const [auditLogs, setAuditLogs] = useState<SellerDecisionLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'actionable' | 'replenish' | 'replace' | 'discontinue' | 'review' | 'logs'>('actionable');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Selected product modal state for actions
  const [selectedProduct, setSelectedProduct] = useState<ProductDemandAnalysis | null>(null);
  const [actionType, setActionType] = useState<'REPLENISH' | 'REPLACE' | 'DISCONTINUE' | 'KEEP' | null>(null);
  const [replenishQty, setReplenishQty] = useState<number>(50);
  const [selectedAltSkuId, setSelectedAltSkuId] = useState<string>('');
  const [decisionNotes, setDecisionNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const fetchOptimizationData = async () => {
    try {
      setLoading(true);
      const [prodRes, logRes] = await Promise.all([
        apiClient.get<ProductDemandAnalysis[]>('/demand/products?period_days=14&limit=100'),
        apiClient.get<SellerDecisionLog[]>('/demand/audit-logs?limit=50')
      ]);
      setProducts(prodRes.data);
      setAuditLogs(logRes.data);

      const targetId = searchParams.get('id');
      if (targetId) {
        const found = prodRes.data.find((p) => p.product_id === targetId);
        if (found) {
          setSelectedProduct(found);
        }
      }
    } catch (err) {
      console.error('Failed to load product optimization data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptimizationData();
  }, []);

  const handleOpenActionModal = (product: ProductDemandAnalysis, type: 'REPLENISH' | 'REPLACE' | 'DISCONTINUE' | 'KEEP') => {
    setSelectedProduct(product);
    setActionType(type);
    setDecisionNotes('');
    setActionSuccessMsg(null);
    if (type === 'REPLENISH') {
      setReplenishQty(product.suggested_replenishment_qty || 50);
    } else if (type === 'REPLACE' && product.alternative_candidates.length > 0) {
      setSelectedAltSkuId(product.alternative_candidates[0].product_id);
    }
  };

  const handleExecuteDecision = async () => {
    if (!selectedProduct || !actionType) return;
    try {
      setSubmitting(true);
      const res = await apiClient.post('/demand/decision', {
        product_id: selectedProduct.product_id,
        recommendation_id: selectedProduct.recommendation_id,
        decision: actionType,
        replenishment_quantity: actionType === 'REPLENISH' ? Number(replenishQty) : undefined,
        target_replacement_product_id: actionType === 'REPLACE' ? selectedAltSkuId : undefined,
        notes: decisionNotes
      });

      setActionSuccessMsg(res.data.message);
      setTimeout(() => {
        setActionType(null);
        setSelectedProduct(null);
        fetchOptimizationData();
      }, 1800);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to submit seller decision.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter products by tab
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      searchQuery === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeTab === 'actionable') {
      return p.recommendation_type !== 'KEEP_MONITORING' && p.recommendation_type !== 'INSUFFICIENT_DATA';
    }
    if (activeTab === 'replenish') {
      return p.recommendation_type === 'REPLENISHMENT';
    }
    if (activeTab === 'replace') {
      return p.recommendation_type === 'REPLACEMENT';
    }
    if (activeTab === 'discontinue') {
      return p.recommendation_type === 'DISCONTINUATION';
    }
    if (activeTab === 'review') {
      return p.lifecycle_status === 'UNDER_REVIEW';
    }
    return true;
  });

  const getLifecycleBadge = (status: LifecycleStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">ACTIVE</span>;
      case 'UNDER_REVIEW':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">UNDER REVIEW</span>;
      case 'REPLENISHMENT_RECOMMENDED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">REPLENISH RECOMMENDED</span>;
      case 'REPLACEMENT_RECOMMENDED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">REPLACEMENT RECOMMENDED</span>;
      case 'DISCONTINUATION_RECOMMENDED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">DISCONTINUATION RECOMMENDED</span>;
      case 'DISCONTINUED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">DISCONTINUED</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">{status}</span>;
    }
  };

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

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-lg shadow-emerald-950/40">
              <Sliders className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight font-['Outfit']">
              Product Decision & Optimization Workbench
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Review explainable AI recommendations, evaluate candidate replacement SKUs, and approve replenishment or discontinuation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/demand')}
            className="px-3 py-1.5 rounded-xl bg-[#111827] hover:bg-slate-800 text-slate-300 font-semibold text-xs border border-slate-800 transition flex items-center gap-1.5"
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Demand Intelligence View</span>
          </button>
        </div>
      </div>

      {/* Navigation Filter Tabs */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3 flex-wrap">
        <div className="flex items-center gap-1.5 bg-[#111827] p-1 rounded-2xl border border-slate-800/80 overflow-x-auto">
          <button
            onClick={() => setActiveTab('actionable')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'actionable'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Actionable Items ({products.filter((p) => p.recommendation_type !== 'KEEP_MONITORING' && p.recommendation_type !== 'INSUFFICIENT_DATA').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('replenish')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'replenish'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-950/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Replenish ({products.filter((p) => p.recommendation_type === 'REPLENISHMENT').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('replace')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'replace'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-950/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Replace ({products.filter((p) => p.recommendation_type === 'REPLACEMENT').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('discontinue')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'discontinue'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Discontinue ({products.filter((p) => p.recommendation_type === 'DISCONTINUATION').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('review')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'review'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Under Review ({products.filter((p) => p.lifecycle_status === 'UNDER_REVIEW').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'logs'
                ? 'bg-slate-700 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Decision Audit Trail ({auditLogs.length})</span>
          </button>
        </div>

        {activeTab !== 'logs' && (
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product or brand..."
              className="w-full pl-9 pr-3 py-1.5 bg-[#111827] border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 transition"
            />
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {activeTab === 'logs' ? (
        /* Decision Audit Trail View */
        <div className="p-6 rounded-3xl bg-[#111827] border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-400" />
                Immutable Seller Decision Audit Trail
              </h3>
              <p className="text-xs text-slate-400">Chronological history of all product approvals, replenishments, and catalog changes.</p>
            </div>
            <span className="text-xs font-mono text-slate-400">{auditLogs.length} total logged events</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#0B0F17] text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                  <th className="py-3 px-3 font-semibold">Product Name</th>
                  <th className="py-3 px-3 font-semibold">Decision</th>
                  <th className="py-3 px-3 font-semibold">Seller</th>
                  <th className="py-3 px-3 font-semibold">Action Attempted</th>
                  <th className="py-3 px-4 font-semibold">Execution Status & Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {auditLogs.length > 0 ? (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 font-bold text-white">
                        {log.product_name}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.decision === 'REPLENISH'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : log.decision === 'REPLACE'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                              : log.decision === 'DISCONTINUE'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          }`}
                        >
                          {log.decision}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-300 text-[11px]">
                        {log.seller_email}
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        {log.action_attempted}
                      </td>
                      <td className="py-3 px-4 text-slate-300 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          <span>{log.action_result}</span>
                        </div>
                        {log.notes && (
                          <span className="text-[10px] text-slate-400 block mt-0.5 italic">Note: "{log.notes}"</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-500">
                      No decision audit logs recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Actionable Product Cards Grid */
        <div className="space-y-4">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((p) => (
              <div
                key={p.product_id}
                className="p-6 rounded-3xl bg-[#111827] border border-slate-800 hover:border-slate-700 space-y-4 shadow-xl transition"
              >
                {/* Header Row */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="w-full h-full object-contain p-1" />
                      ) : (
                        <Package className="w-7 h-7 text-slate-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getPlatformBadge(p.platform)}`}>
                          {p.platform}
                        </span>
                        <h3 className="text-base font-extrabold text-white">
                          {p.name}
                        </h3>
                        {getLifecycleBadge(p.lifecycle_status)}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                        <span>Brand: <span className="text-slate-200 font-semibold">{p.brand || 'N/A'}</span></span>
                        <span>Category: <span className="text-slate-200 font-semibold">{p.category}</span></span>
                        <span>Seller ID: <span className="font-mono text-slate-300">{p.seller_id}</span></span>
                      </div>
                    </div>
                  </div>

                  {/* Quantitative Telemetry Delta Chips */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="px-3 py-2 rounded-xl bg-[#0B0F17] border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Demand Change</span>
                      <span className={`text-xs font-black font-mono ${p.demand_change_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {p.demand_change_pct >= 0 ? `+${p.demand_change_pct}%` : `${p.demand_change_pct}%`}
                      </span>
                    </div>

                    <div className="px-3 py-2 rounded-xl bg-[#0B0F17] border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Sales Velocity</span>
                      <span className="text-xs font-black text-white font-mono">{p.avg_daily_demand} / day</span>
                    </div>

                    <div className="px-3 py-2 rounded-xl bg-[#0B0F17] border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Current Stock</span>
                      <span className={`text-xs font-black font-mono ${p.is_low_stock ? 'text-rose-400' : 'text-slate-200'}`}>
                        {p.current_stock} units ({p.estimated_stock_coverage_days}d)
                      </span>
                    </div>

                    <div className="px-3 py-2 rounded-xl bg-[#0B0F17] border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Rating Trend</span>
                      <span className="text-xs font-black text-amber-400 font-mono flex items-center justify-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400" />
                        {p.rating ? p.rating.toFixed(1) : 'N/A'} ({p.rating_trend})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Explainable Recommendation Rationale Box */}
                <div className={`p-4 rounded-2xl border ${
                  p.recommendation_type === 'REPLENISHMENT'
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : p.recommendation_type === 'REPLACEMENT'
                    ? 'bg-purple-500/10 border-purple-500/30'
                    : p.recommendation_type === 'DISCONTINUATION'
                    ? 'bg-rose-500/10 border-rose-500/30'
                    : 'bg-slate-900/80 border-slate-800'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {p.recommendation_type === 'REPLENISHMENT' && <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />}
                      {p.recommendation_type === 'REPLACEMENT' && <Layers className="w-4 h-4 text-purple-400" />}
                      {p.recommendation_type === 'DISCONTINUATION' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
                      {p.recommendation_type === 'KEEP_MONITORING' && <CheckCircle2 className="w-4 h-4 text-slate-400" />}
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-white">
                          Recommendation: {p.recommendation_type.replace('_', ' ')}
                        </h4>
                        {p.suggested_replenishment_qty && (
                          <span className="text-xs font-black text-amber-300 font-mono">
                            Suggested Quantity: +{p.suggested_replenishment_qty} Units
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-normal">
                        {p.reason_explanation}
                      </p>

                      {/* Transparent Formula Parameters (if Replenishment) */}
                      {p.replenishment_formula_params && (
                        <div className="mt-2 pt-2 border-t border-amber-500/20 flex items-center gap-4 text-[11px] text-amber-400/90 font-mono flex-wrap">
                          <span>Lead Time Demand: <strong>{p.replenishment_formula_params.expected_demand_lead_time} units</strong> ({p.lead_time_days}d)</span>
                          <span>Safety Stock: <strong>{p.replenishment_formula_params.safety_stock} units</strong> ({p.safety_stock_days}d)</span>
                          <span>Available: <strong>{p.replenishment_formula_params.current_stock} units</strong></span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Candidate Alternatives Comparison (if Replacement Recommended) */}
                {p.alternative_candidates && p.alternative_candidates.length > 0 && (
                  <div className="p-4 rounded-2xl bg-[#0B0F17] border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-purple-400" />
                        Available Authorized Replacement Alternatives in Same Category
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Real catalog matched</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {p.alternative_candidates.map((alt) => (
                        <div
                          key={alt.product_id}
                          className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-2 hover:border-purple-500/40 transition"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${getPlatformBadge(alt.platform)}`}>
                                {alt.platform}
                              </span>
                              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                                {alt.match_score}% Match
                              </span>
                            </div>
                            <h5 className="text-xs font-bold text-white mt-1 truncate">{alt.name}</h5>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                              <span className="text-amber-400 font-bold flex items-center gap-0.5">
                                <Star className="w-3 h-3 fill-amber-400" /> {alt.rating?.toFixed(1)}
                              </span>
                              <span>₹{alt.offer_price}</span>
                              <span className="text-slate-300 font-mono">Stock: {alt.current_stock}</span>
                            </div>
                          </div>

                          <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
                            <span>Demand: <strong className="text-emerald-400">{alt.demand_classification.replace('_', ' ')}</strong></span>
                            <span>ETA: {alt.eta_minutes}m</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Seller Interactive Decision Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800">
                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Seller Authorization Required. QuickSync does not make destructive decisions automatically.</span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Keep Monitoring */}
                    <button
                      onClick={() => handleOpenActionModal(p, 'KEEP')}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition"
                    >
                      Keep Monitoring
                    </button>

                    {/* Replenish Button */}
                    <button
                      onClick={() => handleOpenActionModal(p, 'REPLENISH')}
                      className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition flex items-center gap-1 shadow-lg shadow-amber-950/40"
                    >
                      <Zap className="w-3.5 h-3.5 fill-black" />
                      <span>Approve Replenishment</span>
                    </button>

                    {/* Replace Button */}
                    {p.alternative_candidates && p.alternative_candidates.length > 0 && (
                      <button
                        onClick={() => handleOpenActionModal(p, 'REPLACE')}
                        className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs transition flex items-center gap-1 shadow-lg shadow-purple-950/40"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Replace Product</span>
                      </button>
                    )}

                    {/* Discontinue Button */}
                    <button
                      onClick={() => handleOpenActionModal(p, 'DISCONTINUE')}
                      className="px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white font-extrabold text-xs border border-rose-500/40 transition flex items-center gap-1"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Discontinue SKU</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-16 text-center rounded-3xl bg-[#111827] border border-slate-800 space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h3 className="text-base font-extrabold text-white">No pending actionable items in this category</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                All monitored products are currently within stable demand parameters or have already been reviewed.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Interactive Seller Decision Modal */}
      {actionType && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-[#111827] border border-slate-700 p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Confirm Seller Decision
                </span>
                <h3 className="text-lg font-black text-white mt-0.5">
                  {actionType === 'REPLENISH' && `Approve Replenishment: ${selectedProduct.name}`}
                  {actionType === 'REPLACE' && `Approve Product Replacement: ${selectedProduct.name}`}
                  {actionType === 'DISCONTINUE' && `Confirm Product Discontinuation: ${selectedProduct.name}`}
                  {actionType === 'KEEP' && `Keep Monitoring: ${selectedProduct.name}`}
                </h3>
              </div>
              <button
                onClick={() => setActionType(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Action-Specific Inputs */}
            {actionType === 'REPLENISH' && (
              <div className="space-y-3 bg-[#0B0F17] p-4 rounded-2xl border border-slate-800">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Replenishment Quantity (Units)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={replenishQty}
                    onChange={(e) => setReplenishQty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#111827] border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-[11px] text-amber-400/90 mt-1">
                    Suggested formula quantity: <strong>{selectedProduct.suggested_replenishment_qty || 50} units</strong>
                  </p>
                </div>
              </div>
            )}

            {actionType === 'REPLACE' && (
              <div className="space-y-3 bg-[#0B0F17] p-4 rounded-2xl border border-slate-800">
                <label className="text-xs font-bold text-slate-300 block">
                  Select Target Replacement SKU
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedProduct.alternative_candidates.map((alt) => (
                    <label
                      key={alt.product_id}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                        selectedAltSkuId === alt.product_id
                          ? 'bg-purple-950/30 border-purple-500 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="altSku"
                          checked={selectedAltSkuId === alt.product_id}
                          onChange={() => setSelectedAltSkuId(alt.product_id)}
                          className="accent-purple-500"
                        />
                        <div>
                          <span className="text-xs font-bold block">{alt.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {alt.platform} | ₹{alt.offer_price} | {alt.rating}★ ({alt.demand_classification})
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-purple-400">{alt.match_score}%</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {actionType === 'DISCONTINUE' && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2">
                <div className="flex items-center gap-2 text-rose-400 text-xs font-bold">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Permanent Discontinuation Confirmation</span>
                </div>
                <p className="text-xs text-rose-300/90 leading-relaxed">
                  This action confirms that demand for <strong>{selectedProduct.name}</strong> has sustained irreversible decline ({selectedProduct.demand_change_pct}% over {selectedProduct.analysis_period_days}d).
                  Historical sales and price snapshots will remain preserved for analytics.
                </p>
              </div>
            )}

            {/* Seller Notes Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400">
                Seller Decision Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                placeholder="Add audit notes regarding procurement, lead time, or seller rationale..."
                className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            {/* Success Message */}
            {actionSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>{actionSuccessMsg}</span>
              </div>
            )}

            {/* Modal Actions Footer */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setActionType(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition font-semibold"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={handleExecuteDecision}
                className={`px-5 py-2 rounded-xl font-bold text-xs text-white transition flex items-center gap-1.5 shadow-lg ${
                  actionType === 'REPLENISH'
                    ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-950/40'
                    : actionType === 'REPLACE'
                    ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-950/40'
                    : actionType === 'DISCONTINUE'
                    ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-950/40'
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/40'
                } ${submitting ? 'opacity-70 cursor-wait' : ''}`}
              >
                {submitting ? 'Recording Decision...' : 'Confirm & Execute'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
