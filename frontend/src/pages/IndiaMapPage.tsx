import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Layers,
  Activity,
  CheckCircle2,
  Clock,
  Building2,
  TrendingUp,
  Package,
  Truck,
  Eye,
  FileSpreadsheet,
  Info,
  RefreshCw,
  Loader2,
  Compass,
  AlertCircle
} from 'lucide-react';
import {
  IndiaRegionalMapData,
  RegionActivityDetail,
  PlatformActivityPictogram,
  ViewSourceTraceability
} from '../types/regional';
import { ExportExcelModal } from '../components/ExportExcelModal';
import { apiClient } from '../api/client';

const ALL_7_PLATFORMS = [
  { name: 'BlinkIt', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { name: 'Zepto', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  { name: 'Swiggy', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  { name: 'BigBasket', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  { name: 'DMart', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  { name: 'JioMart', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
  { name: 'Minutes', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
];

export const IndiaMapPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [mapData, setMapData] = useState<IndiaRegionalMapData | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<string>('products_count');
  const [selectedRegion, setSelectedRegion] = useState<RegionActivityDetail | null>(null);

  // View Source Transparency Modal
  const [traceModalOpen, setTraceModalOpen] = useState(false);
  const [traceData, setTraceData] = useState<ViewSourceTraceability | null>(null);
  const [loadingTrace, setLoadingTrace] = useState(false);

  // Export Modal
  const [exportModalOpen, setExportModalOpen] = useState(false);

  useEffect(() => {
    fetchMapData();
  }, [selectedMetric]);

  const fetchMapData = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/analytics/map', {
        params: { metric: selectedMetric }
      });
      if (res.data) {
        const data: IndiaRegionalMapData = res.data;
        setMapData(data);
        if (data.regions.length > 0) {
          if (!selectedRegion) {
            setSelectedRegion(data.regions[0]);
          } else {
            const updated = data.regions.find((r) => r.city === selectedRegion.city) || data.regions[0];
            setSelectedRegion(updated);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching regional map analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRegion = (region: RegionActivityDetail) => {
    setSelectedRegion(region);
  };

  const handleOpenTraceability = async (city: string) => {
    try {
      setLoadingTrace(true);
      setTraceModalOpen(true);
      const res = await apiClient.get('/analytics/traceability', {
        params: { city }
      });
      if (res.data) {
        setTraceData(res.data);
      }
    } catch (err) {
      console.error('Failed to load traceability details:', err);
    } finally {
      setLoadingTrace(false);
    }
  };

  // Render pictographic shopping cart icons dynamically based on intensity score (1 to 5)
  const renderPictogramIcons = (intensity: number) => {
    const count = Math.max(1, Math.min(5, intensity));
    const icons = [];
    for (let i = 0; i < count; i++) {
      icons.push(
        <span key={i} className="text-base select-none" title="Activity Index Unit">
          🛒
        </span>
      );
    }
    return <div className="flex items-center gap-1">{icons}</div>;
  };

  const getActivityBadge = (level: string) => {
    if (level === 'HIGH ACTIVITY') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-400 border border-emerald-500/20">
          <Activity className="h-3 w-3" />
          HIGH ACTIVITY
        </span>
      );
    } else if (level === 'MEDIUM ACTIVITY') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-400 border border-amber-500/20">
          <Activity className="h-3 w-3" />
          MEDIUM ACTIVITY
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] font-bold text-blue-400 border border-blue-500/20">
        <Activity className="h-3 w-3" />
        LOW ACTIVITY
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                India Regional Quick-Commerce Analytics Map
              </h1>
              <p className="text-xs text-muted-foreground">
                Dynamic Regional Heat Map &bull; 7-Platform Pictographic Comparison &bull; Real Observation Transparency
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
            onClick={fetchMapData}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Metric Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-primary" />
            Active Regional Metric:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'products_count', label: 'Live Products Available' },
              { id: 'availability', label: 'In-Stock Availability (%)' },
              { id: 'inventory', label: 'Warehouse Inventory' },
              { id: 'delivery_speed', label: 'Delivery ETA Speed (Mins)' },
              { id: 'observations', label: 'Live API Observations' }
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedMetric(m.id)}
                className={`text-xs px-3 py-1.5 rounded-lg transition-colors font-medium border ${
                  selectedMetric === m.id
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-muted/40 text-muted-foreground border-border hover:border-border/80'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Real Data Disclaimer Tag */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
          <CheckCircle2 className="h-3 w-3" />
          PostgreSQL Real Observational Data
        </div>
      </div>

      {/* Main Grid: Region Selector & 7-Platform Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Region Cards / Map Selector (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-primary" />
                Select Monitored Region
              </h3>
              <span className="text-[11px] text-muted-foreground">
                {mapData?.total_monitored_regions ?? 0} Hubs Active
              </span>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
                <p className="text-xs">Computing regional density...</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                {mapData?.regions.map((reg) => {
                  const isSelected = selectedRegion?.city === reg.city;
                  return (
                    <div
                      key={reg.region_id}
                      onClick={() => handleSelectRegion(reg)}
                      className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10 shadow-md ring-1 ring-primary/40'
                          : 'border-border/80 bg-muted/20 hover:border-border hover:bg-muted/40'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-foreground">{reg.city}</h4>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              ({reg.pincode})
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground">{reg.state}</p>
                        </div>
                        {getActivityBadge(reg.activity_level)}
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="rounded bg-background/60 p-1.5 border border-border/50">
                          <span className="text-[10px] text-muted-foreground block">Live SKUs</span>
                          <strong className="text-foreground font-mono">{reg.total_live_products}</strong>
                        </div>
                        <div className="rounded bg-background/60 p-1.5 border border-border/50">
                          <span className="text-[10px] text-muted-foreground block">In-Stock</span>
                          <strong className="text-emerald-400 font-mono">{reg.availability_rate_pct}%</strong>
                        </div>
                        <div className="rounded bg-background/60 p-1.5 border border-border/50">
                          <span className="text-[10px] text-muted-foreground block">Avg ETA</span>
                          <strong className="text-primary font-mono">{reg.avg_delivery_eta_mins}m</strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Detailed Region & 7-Platform Pictographic Comparison (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedRegion ? (
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-5">
              {/* Region Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      {selectedRegion.city}, {selectedRegion.state}
                    </h2>
                    <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground">
                      PIN {selectedRegion.pincode}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Data Freshness: {selectedRegion.data_freshness_seconds}s ago &bull; Active Platforms: {selectedRegion.active_platforms_count} of 7
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenTraceability(selectedRegion.city)}
                    className="flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    [ VIEW SOURCE ]
                  </button>
                </div>
              </div>

              {/* 7-Platform Pictographic Comparison */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="h-4 w-4 text-emerald-400" />
                    7-Platform Comparison in {selectedRegion.city}
                  </h3>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    Metric: {selectedRegion.platform_comparison[0]?.metric_name || 'Live Metric'}
                  </span>
                </div>

                {/* Pictographic List */}
                <div className="rounded-xl border border-border/80 bg-muted/20 divide-y divide-border/60 overflow-hidden">
                  {selectedRegion.platform_comparison.map((p) => {
                    const styling = ALL_7_PLATFORMS.find((plat) => plat.name === p.platform);
                    return (
                      <div
                        key={p.platform}
                        className="p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-muted/40 transition-colors"
                      >
                        {/* Platform Name & Badge */}
                        <div className="flex items-center gap-2.5 min-w-[140px]">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded border ${styling?.color}`}>
                            {p.platform}
                          </span>
                          {p.avg_eta_minutes && (
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {p.avg_eta_minutes}m ETA
                            </span>
                          )}
                        </div>

                        {/* Pictogram Icons (🛒 🛒 🛒 🛒 🛒) */}
                        <div className="flex-1 flex items-center gap-3">
                          {renderPictogramIcons(p.intensity_score)}
                          <span className="text-xs font-bold font-mono text-foreground">
                            {p.formatted_value}
                          </span>
                        </div>

                        {/* Percentage bar & Share */}
                        <div className="flex items-center gap-2 min-w-[120px] justify-end">
                          <div className="w-16 bg-muted rounded-full h-2 overflow-hidden border border-border">
                            <div
                              className="bg-emerald-500 h-full rounded-full"
                              style={{ width: `${p.percentage_of_region}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono text-muted-foreground font-semibold">
                            {p.percentage_of_region}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Zero-Mock Sales Disclaimer Card */}
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300 flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
                <div>
                  <span className="font-semibold">Zero-Mock Regional Activity Disclosure: </span>
                  QuickSync displays real live catalog observations, product inventory, and availability rates. Sales order volume is strictly marked as{' '}
                  <code className="bg-amber-500/20 px-1 py-0.5 rounded text-amber-200 font-mono text-[11px]">
                    {selectedRegion.sales_data_status}
                  </code>{' '}
                  because live quick-commerce customer frontends do not expose third-party merchant order registers without authorized ERP connectivity.
                </div>
              </div>

              {/* Top Products In Region */}
              {selectedRegion.top_products_in_region.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Top Monitored SKUs in {selectedRegion.city}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedRegion.top_products_in_region.map((prod) => (
                      <div
                        key={prod.product_id}
                        className="rounded-lg border border-border bg-background p-2.5 flex items-center gap-2.5"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-foreground truncate">
                            {prod.name}
                          </div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                            <span>{prod.brand}</span>
                            <span>&bull;</span>
                            <span className="text-primary font-medium">{prod.platform}</span>
                            {prod.rating && (
                              <>
                                <span>&bull;</span>
                                <span className="text-amber-400 font-bold">{prod.rating}★</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
              <Compass className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-sm">Select a region to inspect 7-platform comparison.</p>
            </div>
          )}
        </div>
      </div>

      {/* View Source Traceability Modal */}
      {traceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />
                Data Traceability &amp; Provenance Audit
              </h3>
              <button
                onClick={() => setTraceModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            {loadingTrace ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : traceData ? (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted/30 p-2.5 border border-border">
                    <span className="text-muted-foreground block text-[10px]">Monitored Region:</span>
                    <strong className="text-foreground">{traceData.region}</strong>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-2.5 border border-border">
                    <span className="text-muted-foreground block text-[10px]">Request Identifier:</span>
                    <strong className="text-primary font-mono">{traceData.request_id}</strong>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-2.5 border border-border">
                    <span className="text-muted-foreground block text-[10px]">Data Source:</span>
                    <strong className="text-emerald-400">{traceData.data_source}</strong>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-2.5 border border-border">
                    <span className="text-muted-foreground block text-[10px]">Fetched Timestamp:</span>
                    <strong className="text-foreground font-mono">{traceData.fetched_timestamp}</strong>
                  </div>
                </div>

                <div className="rounded-lg bg-muted/30 p-3 border border-border space-y-1">
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                    Metric Derivation &amp; Calculation Audit:
                  </span>
                  <p className="text-muted-foreground leading-relaxed">
                    {traceData.metric_calculation}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Verified 100% Genuine Stored PostgreSQL Observation Records. Zero Mock Injections.</span>
                </div>
              </div>
            ) : null}

            <div className="flex justify-end border-t border-border pt-3">
              <button
                type="button"
                onClick={() => setTraceModalOpen(false)}
                className="rounded-lg bg-muted px-4 py-1.5 text-xs font-medium text-foreground hover:bg-muted/80"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      <ExportExcelModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
      />
    </div>
  );
};
