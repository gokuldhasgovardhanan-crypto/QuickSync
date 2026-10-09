import React, { useState, useEffect } from 'react';
import {
  GitMerge,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  Filter,
  Search,
  Layers,
  ArrowRight,
  ShieldCheck,
  Building2,
  Tag,
  Package,
  Sparkles,
  Info,
  Loader2,
  RefreshCw,
  Eye,
  FileSpreadsheet
} from 'lucide-react';
import {
  ProductIdentityMatch,
  CanonicalProduct,
  MatchEngineStats,
  MatchConfidenceLevel
} from '../types/matching';
import { ExportExcelModal } from '../components/ExportExcelModal';
import { apiClient } from '../api/client';

export const ProductMatchingPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [runningEngine, setRunningEngine] = useState(false);
  const [stats, setStats] = useState<MatchEngineStats | null>(null);
  const [matches, setMatches] = useState<ProductIdentityMatch[]>([]);
  const [canonicalProducts, setCanonicalProducts] = useState<CanonicalProduct[]>([]);
  const [activeTab, setActiveTab] = useState<'matches' | 'canonical' | 'reviews'>('matches');

  // Filters
  const [selectedConfidence, setSelectedConfidence] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Review Modal state
  const [reviewingMatch, setReviewingMatch] = useState<ProductIdentityMatch | null>(null);
  const [reviewDecision, setReviewDecision] = useState<'ACCEPTED' | 'REJECTED'>('ACCEPTED');
  const [reviewReason, setReviewReason] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // Evidence inspector modal
  const [inspectingMatch, setInspectingMatch] = useState<ProductIdentityMatch | null>(null);

  useEffect(() => {
    fetchData();
  }, [selectedConfidence, selectedStatus, selectedPlatform]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // 1. Fetch Stats
      const statsRes = await apiClient.get('/products/match-engine/stats');
      if (statsRes.data) {
        setStats(statsRes.data);
      }

      // 2. Fetch Matches
      const matchParams: any = { limit: 150 };
      if (selectedConfidence !== 'ALL') matchParams.confidence = selectedConfidence;
      if (selectedStatus !== 'ALL') matchParams.status = selectedStatus;
      if (selectedPlatform !== 'ALL') matchParams.platform = selectedPlatform;

      const matchesRes = await apiClient.get('/products/matches', { params: matchParams });
      if (matchesRes.data) {
        setMatches(matchesRes.data);
      }

      // 3. Fetch Canonical
      const canRes = await apiClient.get('/products/canonical', { params: { limit: 100 } });
      if (canRes.data) {
        setCanonicalProducts(canRes.data);
      }
    } catch (err) {
      console.error('Error fetching product matching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunEngine = async () => {
    try {
      setRunningEngine(true);
      const res = await apiClient.post('/products/match-engine/run');
      if (res.data) {
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to trigger matching engine:', err);
    } finally {
      setRunningEngine(false);
    }
  };

  const handleOpenReview = (match: ProductIdentityMatch, decision: 'ACCEPTED' | 'REJECTED') => {
    setReviewingMatch(match);
    setReviewDecision(decision);
    setReviewReason(
      decision === 'ACCEPTED'
        ? 'Verified physical brand, pack size, and variant match across platform listings.'
        : 'Different variant or pack size — reject canonical grouping.'
    );
  };

  const handleSubmitReview = async () => {
    if (!reviewingMatch) return;
    try {
      setSubmittingReview(true);
      const res = await apiClient.post(`/products/matches/${reviewingMatch.id}/review`, {
        decision: reviewDecision,
        reason: reviewReason
      });

      if (res.data?.success) {
        setReviewingMatch(null);
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to submit match review:', err);
    } finally {
      setSubmittingReview(false);
    }
  };

  const getConfidenceBadge = (conf: MatchConfidenceLevel) => {
    switch (conf) {
      case 'HIGH_CONFIDENCE':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" />
            HIGH CONFIDENCE
          </span>
        );
      case 'MEDIUM_CONFIDENCE':
      case 'REQUIRES_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/20">
            <AlertTriangle className="h-3 w-3" />
            REQUIRES REVIEW
          </span>
        );
      case 'LOW_CONFIDENCE':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-400 border border-rose-500/20">
            <XCircle className="h-3 w-3" />
            LOW CONFIDENCE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground border border-border">
            UNMATCHED
          </span>
        );
    }
  };

  const filteredMatches = matches.filter((m) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.canonical_name.toLowerCase().includes(q) ||
      m.platform_product_name.toLowerCase().includes(q) ||
      m.canonical_code.toLowerCase().includes(q) ||
      (m.platform_brand && m.platform_brand.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <GitMerge className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Product Identity &amp; Matching Engine
              </h1>
              <p className="text-xs text-muted-foreground">
                Cross-Platform Duplicate Detection &bull; Multi-Signal Identity Normalization &bull; Canonical Clustering
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setExportModalOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4" />
            EXPORT TO EXCEL
          </button>

          <button
            onClick={handleRunEngine}
            disabled={runningEngine}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {runningEngine ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Clustering SKUs...
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                RUN MATCHING ENGINE
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">Canonical Products</span>
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {stats?.total_canonical_products ?? 0}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Unique physical SKUs clustered</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">High Confidence</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            {stats?.high_confidence_matches ?? 0}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Multi-signal verified (GTIN/Brand/Pack)</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">Requires Human Review</span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">
            {stats?.pending_review_count ?? 0}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Medium/Low confidence queues</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">Total Platform SKUs</span>
            <Layers className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {stats?.total_platform_products ?? 0}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Across 7 Quick-Commerce platforms</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-border">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('matches')}
            className={`pb-3 text-xs font-semibold transition-colors border-b-2 ${
              activeTab === 'matches'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Detected Identity Matches ({matches.length})
          </button>
          <button
            onClick={() => setActiveTab('canonical')}
            className={`pb-3 text-xs font-semibold transition-colors border-b-2 ${
              activeTab === 'canonical'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Canonical Product Registry ({canonicalProducts.length})
          </button>
        </div>

        <button
          onClick={fetchData}
          className="pb-3 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className="h-3 w-3" />
          Refresh
        </button>
      </div>

      {/* Content Area */}
      {activeTab === 'matches' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search products or canonical IDs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-lg border border-border bg-background pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary w-60"
                />
              </div>

              <select
                value={selectedConfidence}
                onChange={(e) => setSelectedConfidence(e.target.value)}
                className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
              >
                <option value="ALL">All Confidence Levels</option>
                <option value="HIGH_CONFIDENCE">High Confidence (Score &gt; 80%)</option>
                <option value="MEDIUM_CONFIDENCE">Medium Confidence (Requires Review)</option>
                <option value="LOW_CONFIDENCE">Low Confidence (&lt; 50%)</option>
              </select>

              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
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

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
              >
                <option value="ALL">All Review Statuses</option>
                <option value="AUTO_MATCHED">Auto Matched</option>
                <option value="PENDING_REVIEW">Pending Human Review</option>
                <option value="ACCEPTED">Accepted by Admin</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          {/* Matches List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-sm">Evaluating cross-platform identity signals...</p>
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <GitMerge className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-foreground">No matches found for current filter</h3>
              <p className="text-xs text-muted-foreground mt-1">Try switching filters or run the matching engine.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {filteredMatches.map((m) => (
                <div
                  key={m.id}
                  className="rounded-xl border border-border bg-card p-4 shadow-sm hover:border-border/80 transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Left: Platform Product vs Canonical Product */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                      {/* Platform SKU */}
                      <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                          <span className="font-semibold text-primary">{m.platform}</span>
                          <span className="font-mono text-[10px]">{m.platform_quantity || 'Pack N/A'}</span>
                        </div>
                        <h4 className="text-xs font-bold text-foreground line-clamp-1">
                          {m.platform_product_name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                          <span>Brand: <strong className="text-foreground">{m.platform_brand || 'N/A'}</strong></span>
                          {m.offer_price && (
                            <span>&bull; Price: <strong className="text-emerald-400">₹{m.offer_price}</strong></span>
                          )}
                        </div>
                      </div>

                      {/* Canonical Identity */}
                      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 relative">
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                          <span className="font-mono font-bold text-primary">{m.canonical_code}</span>
                          <span className="text-[10px] text-primary/80">CANONICAL PRODUCT</span>
                        </div>
                        <h4 className="text-xs font-bold text-foreground line-clamp-1">
                          {m.canonical_name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                          <span>Canonical Brand: <strong className="text-foreground">{m.canonical_brand || 'N/A'}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Middle: Match Confidence & Signals */}
                    <div className="flex flex-col items-start lg:items-center gap-1.5 min-w-[200px]">
                      <div className="flex items-center gap-2">
                        {getConfidenceBadge(m.confidence_level)}
                        <span className="text-xs font-bold font-mono text-foreground">
                          {m.match_score.toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-1 max-w-[240px] text-center">
                        {m.match_reason}
                      </p>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setInspectingMatch(m)}
                        className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        title="View Matching Signals Breakdown"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Signals
                      </button>

                      {m.status === 'PENDING_REVIEW' || m.confidence_level === 'MEDIUM_CONFIDENCE' ? (
                        <>
                          <button
                            onClick={() => handleOpenReview(m, 'ACCEPTED')}
                            className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors shadow-sm"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            ACCEPT
                          </button>
                          <button
                            onClick={() => handleOpenReview(m, 'REJECTED')}
                            className="flex items-center gap-1 rounded-lg bg-rose-600/20 text-rose-300 border border-rose-600/30 px-3 py-1.5 text-xs font-semibold hover:bg-rose-600/30 transition-colors"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            REJECT
                          </button>
                        </>
                      ) : (
                        <span className="text-[11px] font-medium text-muted-foreground uppercase px-2 py-1 rounded bg-muted/40">
                          {m.status.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Canonical Registry Tab */}
      {activeTab === 'canonical' && (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/20">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Canonical Product Catalog (Clustered Identities)
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Unique physical products mapped from multi-platform listing variations.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                <tr>
                  <th className="py-3 px-4 font-semibold">Canonical Code</th>
                  <th className="py-3 px-4 font-semibold">Standard Product Name</th>
                  <th className="py-3 px-4 font-semibold">Brand</th>
                  <th className="py-3 px-4 font-semibold">Pack Size</th>
                  <th className="py-3 px-4 font-semibold">GTIN / Barcode</th>
                  <th className="py-3 px-4 font-semibold text-right">Linked Platform SKUs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {canonicalProducts.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-primary">
                      {c.canonical_code}
                    </td>
                    <td className="py-3 px-4 font-medium text-foreground">
                      {c.canonical_name}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {c.brand || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {c.quantity || 'Standard'}
                    </td>
                    <td className="py-3 px-4 font-mono text-muted-foreground">
                      {c.gtin ? (
                        <span className="bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          {c.gtin}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/60">No GTIN</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-foreground">
                      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary font-mono text-xs">
                        {c.linked_products_count}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review Decision Modal */}
      {reviewingMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Human Match Verification
              </h3>
              <button
                onClick={() => setReviewingMatch(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded-lg bg-muted/40 p-3 space-y-1.5 border border-border">
                <div className="text-muted-foreground">Platform SKU:</div>
                <div className="font-bold text-foreground">
                  [{reviewingMatch.platform}] {reviewingMatch.platform_product_name}
                </div>
                <div className="text-muted-foreground mt-2">Target Canonical Identity:</div>
                <div className="font-bold text-primary font-mono">
                  {reviewingMatch.canonical_code} &mdash; {reviewingMatch.canonical_name}
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground mb-1 block">Decision:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewDecision('ACCEPTED')}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold transition-colors ${
                      reviewDecision === 'ACCEPTED'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-muted/30 text-muted-foreground border-border'
                    }`}
                  >
                    ACCEPT AS SAME PRODUCT
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewDecision('REJECTED')}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold transition-colors ${
                      reviewDecision === 'REJECTED'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-muted/30 text-muted-foreground border-border'
                    }`}
                  >
                    REJECT (DISTINCT PRODUCT)
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground mb-1 block">Audit Notes &amp; Rationale:</label>
                <textarea
                  rows={3}
                  value={reviewReason}
                  onChange={(e) => setReviewReason(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Explain why this match is approved or rejected..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setReviewingMatch(null)}
                className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitReview}
                disabled={submittingReview}
                className="rounded-lg bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1.5"
              >
                {submittingReview && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Confirm Decision
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Evidence Inspector Modal */}
      {inspectingMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                Matching Signal Breakdown
              </h3>
              <button
                onClick={() => setInspectingMatch(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded-lg bg-muted/40 p-3 space-y-1">
                <div className="font-semibold text-foreground">Match Reason:</div>
                <div className="text-muted-foreground">{inspectingMatch.match_reason}</div>
              </div>

              <div className="border border-border rounded-lg p-3 space-y-2">
                <div className="font-semibold text-foreground">Computed Identity Attributes:</div>
                <pre className="rounded bg-background p-2 text-[11px] text-emerald-400 overflow-x-auto font-mono">
                  {JSON.stringify(inspectingMatch.matching_attributes, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end border-t border-border pt-3">
              <button
                type="button"
                onClick={() => setInspectingMatch(null)}
                className="rounded-lg bg-muted px-4 py-1.5 text-xs font-medium text-foreground hover:bg-muted/80"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Excel Modal */}
      <ExportExcelModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
      />
    </div>
  );
};
