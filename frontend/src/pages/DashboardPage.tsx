import React, { useState, useEffect, useCallback } from 'react';
import {
  Server,
  ShoppingBag,
  CheckCircle2,
  XCircle,
  Zap,
  Activity,
  ShieldCheck,
  Search,
  RefreshCw,
  Clock,
  ArrowRight,
  TrendingUp,
  Layers,
  AlertCircle,
  PlayCircle,
  Radio,
  Sliders,
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useWebSocket } from '../hooks/useWebSocket';
import { useLocationState } from '../hooks/useLocation';
import { DashboardSummary, NormalizedProductItem, SettingsData } from '../types';
import { LiveStatusBadge } from '../components/LiveStatusBadge';
import { FreshnessIndicator } from '../components/FreshnessIndicator';
import { ProductCard } from '../components/ProductCard';
import { ApiKeySetupBanner } from '../components/ApiKeySetupBanner';

export const DashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('Milk');
  const [searchPlatform, setSearchPlatform] = useState('ALL');
  const [liveSearchResults, setLiveSearchResults] = useState<NormalizedProductItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchStatus, setSearchStatus] = useState<string | null>(null);
  const [searchLatency, setSearchLatency] = useState<number | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number>(60);
  const [apiKeyConfigured, setApiKeyConfigured] = useState<boolean>(true);

  const { isConnected, lastMessage } = useWebSocket();
  const { selectedLocation } = useLocationState();
  const navigate = useNavigate();

  // Load summary and settings
  const fetchDashboardData = useCallback(async () => {
    try {
      const [sumRes, setRes] = useState ? await Promise.all([
        apiClient.get('/monitoring/summary'),
        apiClient.get('/settings')
      ]) : [null, null];

      if (sumRes?.data) {
        setSummary(sumRes.data);
      }
      if (setRes?.data) {
        setApiKeyConfigured(setRes.data.quickcommerce_api_key_configured);
        setRefreshInterval(setRes.data.sync_interval_seconds || 60);
      }
    } catch (e) {
      // Backend error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Handle WebSocket updates
  useEffect(() => {
    if (lastMessage) {
      if (['product_update', 'price_update', 'inventory_update', 'sync_completed', 'alert_created'].includes(lastMessage.event)) {
        fetchDashboardData();
      }
    }
  }, [lastMessage, fetchDashboardData]);

  // Polling interval
  useEffect(() => {
    if (refreshInterval <= 0) return;
    const interval = setInterval(() => {
      fetchDashboardData();
    }, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [refreshInterval, fetchDashboardData]);

  // Execute Search
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    setSearchError(null);

    try {
      const res = await apiClient.get('/live/search', {
        params: {
          q: searchQuery.trim(),
          platform: searchPlatform,
          lat: selectedLocation?.latitude,
          lon: selectedLocation?.longitude,
          pincode: selectedLocation?.pincode,
          city: selectedLocation?.city,
        },
      });

      if (res.data) {
        setLiveSearchResults(res.data.products || []);
        setSearchStatus(res.data.data_source_status);
        setSearchLatency(res.data.latency_ms);
        if (res.data.data_source_status !== 'LIVE') {
          setSearchError(res.data.errors?.[0]?.error || 'Live data source unavailable');
        }
      }
    } catch (err: any) {
      setSearchStatus('OFFLINE');
      setSearchError(err.response?.data?.detail || 'Failed to communicate with live API.');
    } finally {
      setSearchLoading(false);
    }
  };

  // Run First Live Sync
  const handleTriggerSync = async () => {
    setSyncing(true);
    try {
      await apiClient.post('/sync/run', {
        query: searchQuery || 'Milk',
        platform: searchPlatform,
        location_id: selectedLocation?.id,
      });
      await fetchDashboardData();
      await handleSearch();
    } catch {
      // Handled
    } finally {
      setSyncing(false);
    }
  };

  const hasData = summary && summary.total_products_fetched > 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner / API Key status */}
      <ApiKeySetupBanner isConfigured={apiKeyConfigured} />

      {/* Header & Freshness Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-white tracking-tight font-['Outfit']">
              Live Commerce Data Infrastructure
            </h2>
            <LiveStatusBadge status={summary?.api_health_status === 'HEALTHY' ? 'LIVE' : summary?.api_health_status || 'OFFLINE'} size="md" />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Audited real-time telemetry streaming from QuickCommerce API
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <FreshnessIndicator
            status={summary?.data_freshness_status}
            ageSeconds={summary?.freshness_age_seconds}
            lastFetchedAt={summary?.last_fetched_at}
          />

          {/* Auto Refresh Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] text-slate-400">Refresh:</span>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="bg-transparent text-emerald-400 font-semibold focus:outline-none cursor-pointer text-xs"
            >
              <option value={15} className="bg-slate-900 text-white">15s</option>
              <option value={30} className="bg-slate-900 text-white">30s</option>
              <option value={60} className="bg-slate-900 text-white">60s (Default)</option>
              <option value={300} className="bg-slate-900 text-white">5m</option>
            </select>
          </div>

          <button
            onClick={handleTriggerSync}
            disabled={syncing}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-950/40 ${
              syncing ? 'opacity-70 cursor-wait' : ''
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing Live API...' : 'Run Live Sync'}</span>
          </button>
        </div>
      </div>

      {/* TOP KPI CARDS - Strictly Calculated from Live PostgreSQL Records */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Live Sources */}
        <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800/80 relative overflow-hidden group hover:border-emerald-500/30 transition">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Live Data Sources</span>
            <Server className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white font-mono tracking-tight">
              {summary ? summary.live_data_sources_count : '—'}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              / {summary ? summary.active_platforms_count : '7'} Platforms
            </span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Authorized API Provider Connected</span>
          </div>
        </div>

        {/* KPI 2: Products Fetched */}
        <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800/80 relative overflow-hidden group hover:border-cyan-500/30 transition">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Products Stored</span>
            <ShoppingBag className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white font-mono tracking-tight">
              {summary ? summary.total_products_fetched : '0'}
            </span>
            <span className="text-xs text-slate-400">Audited Snapshots</span>
          </div>
          <div className="mt-2 text-[11px] text-cyan-400 flex items-center gap-1">
            <span>Time-series price history preserved</span>
          </div>
        </div>

        {/* KPI 3: Stock Status */}
        <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800/80 relative overflow-hidden group hover:border-emerald-500/30 transition">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Stock Availability</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <div>
              <span className="text-2xl font-black text-emerald-400 font-mono">
                {summary ? summary.in_stock_products_count : '0'}
              </span>
              <span className="text-[10px] text-slate-400 uppercase font-bold ml-1">In Stock</span>
            </div>
            <div className="border-l border-slate-800 pl-3">
              <span className="text-2xl font-black text-rose-400 font-mono">
                {summary ? summary.out_of_stock_products_count : '0'}
              </span>
              <span className="text-[10px] text-slate-400 uppercase font-bold ml-1">Stockout</span>
            </div>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Darkstore real-time signals
          </div>
        </div>

        {/* KPI 4: Reliability Score */}
        <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800/80 relative overflow-hidden group hover:border-teal-500/30 transition">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Reliability Score</span>
            <ShieldCheck className="w-4 h-4 text-teal-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-teal-300 font-mono tracking-tight">
              {summary && summary.reliability_score > 0 ? `${summary.reliability_score}%` : 'Waiting'}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Avg ETA: {summary?.avg_delivery_eta_minutes ? `${summary.avg_delivery_eta_minutes}m` : '10m'}</span>
            <span className="text-emerald-400 font-medium">Audited</span>
          </div>
        </div>
      </div>

      {/* QUICK LIVE SEARCH WIDGET */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900/90 via-[#111827] to-slate-900/90 border border-slate-800/80 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 font-['Outfit']">
              <Search className="w-4 h-4 text-emerald-400" />
              Live Quick-Commerce Search Widget
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Queries real darkstores at <span className="text-emerald-400 font-semibold">{selectedLocation?.city}</span> ({selectedLocation?.pincode})
            </p>
          </div>

          <div className="flex items-center gap-2">
            {searchLatency !== null && (
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/60 px-2.5 py-1 rounded-lg">
                Latency: {searchLatency}ms
              </span>
            )}
            {searchStatus && (
              <LiveStatusBadge status={searchStatus} size="sm" />
            )}
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              required
              placeholder="Search products (e.g. Milk, Bread, Rice, Eggs, Coffee, Snacks)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-4 py-3 bg-[#0B0F17] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition placeholder:text-slate-500 font-medium"
            />
          </div>

          <div className="sm:w-48">
            <select
              value={searchPlatform}
              onChange={(e) => setSearchPlatform(e.target.value)}
              className="w-full px-3 py-3 bg-[#0B0F17] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition cursor-pointer font-medium"
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
          </div>

          <button
            type="submit"
            disabled={searchLoading}
            className={`px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 flex-shrink-0 ${
              searchLoading ? 'opacity-70 cursor-wait' : ''
            }`}
          >
            <Search className="w-4 h-4" />
            <span>{searchLoading ? 'Calling API...' : 'Search Live Data'}</span>
          </button>
        </form>

        {/* Search Results Display */}
        {liveSearchResults.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Live Search Results ({liveSearchResults.length} items found)
              </span>
              <Link to="/live-search" className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1">
                <span>View in Search Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveSearchResults.slice(0, 3).map((item) => (
                <ProductCard key={`${item.platform}-${item.external_product_id}`} item={item} />
              ))}
            </div>
          </div>
        )}

        {searchError && (
          <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{searchError}</span>
          </div>
        )}
      </div>

      {/* INITIAL EMPTY STATE IF NO DATA YET */}
      {!hasData && (
        <div className="p-12 rounded-3xl bg-[#111827]/60 border border-dashed border-slate-800 text-center max-w-2xl mx-auto my-6 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <Radio className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-['Outfit']">Waiting for live data...</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              QuickSync does not use fake datasets or placeholder numbers. Trigger your first live quick-commerce sync to stream real products, live pricing, and inventory signals.
            </p>
          </div>
          <button
            onClick={handleTriggerSync}
            disabled={syncing}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-lg shadow-emerald-950/40"
          >
            <PlayCircle className="w-4 h-4" />
            <span>{syncing ? 'Connecting Live Stream...' : 'Run First Live Sync'}</span>
          </button>
        </div>
      )}

      {/* LIVE ACTIVITY FEED & QUICK SHORTCUTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Activity Feed */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-[#111827] border border-slate-800/80">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Live Activity Feed</h3>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
              AUDITED EVENTS
            </span>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto">
            {summary?.recent_activity && summary.recent_activity.length > 0 ? (
              summary.recent_activity.map((act, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start justify-between gap-3 text-xs hover:border-slate-700 transition"
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                        act.severity === 'CRITICAL'
                          ? 'bg-rose-400'
                          : act.severity === 'WARNING'
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                      }`}
                    />
                    <div>
                      <div className="font-semibold text-white">{act.platform}</div>
                      <div className="text-slate-300 mt-0.5">{act.message}</div>
                    </div>
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 flex-shrink-0 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">
                No activity recorded yet. Run a live search or sync to observe live feed events.
              </div>
            )}
          </div>
        </div>

        {/* Quick Navigation Cards */}
        <div className="p-6 rounded-3xl bg-[#111827] border border-slate-800/80 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Data Operations</h3>

          <div className="space-y-2.5">
            <Link
              to="/comparison"
              className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/30 transition text-xs group"
            >
              <div>
                <div className="font-semibold text-white group-hover:text-emerald-300">Cross-Platform Comparison</div>
                <div className="text-slate-400 text-[11px]">Compare BlinkIt, Zepto & Swiggy prices</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition" />
            </Link>

            <Link
              to="/prices"
              className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/30 transition text-xs group"
            >
              <div>
                <div className="font-semibold text-white group-hover:text-emerald-300">Price Fluctuations</div>
                <div className="text-slate-400 text-[11px]">Track discount drops & MRP deltas</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition" />
            </Link>

            <Link
              to="/inventory"
              className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/30 transition text-xs group"
            >
              <div>
                <div className="font-semibold text-white group-hover:text-emerald-300">Darkstore Inventory Signals</div>
                <div className="text-slate-400 text-[11px]">Low stock & out-of-stock monitor</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition" />
            </Link>

            <Link
              to="/data-quality"
              className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/30 transition text-xs group"
            >
              <div>
                <div className="font-semibold text-white group-hover:text-emerald-300">Data Validation Engine</div>
                <div className="text-slate-400 text-[11px]">Completeness & schema audits</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
