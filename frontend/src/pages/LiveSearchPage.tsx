import React, { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw, AlertCircle, MapPin, Zap, Layers, Sparkles } from 'lucide-react';
import { apiClient } from '../api/client';
import { useLocationState } from '../hooks/useLocation';
import { NormalizedProductItem } from '../types';
import { ProductCard } from '../components/ProductCard';
import { LiveStatusBadge } from '../components/LiveStatusBadge';
import { ErrorState } from '../components/ErrorState';

export const LiveSearchPage: React.FC = () => {
  const [query, setQuery] = useState('Milk');
  const [platform, setPlatform] = useState('ALL');
  const [products, setProducts] = useState<NormalizedProductItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('LIVE');
  const [latency, setLatency] = useState<number | null>(null);
  const [requestId, setRequestId] = useState<string>('');
  const [fetchedAt, setFetchedAt] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCached, setIsCached] = useState<boolean>(false);
  const [cacheAge, setCacheAge] = useState<number | undefined>(undefined);

  const { selectedLocation } = useLocationState();

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await apiClient.get('/live/search', {
        params: {
          q: query.trim(),
          platform: platform,
          lat: selectedLocation?.latitude,
          lon: selectedLocation?.longitude,
          pincode: selectedLocation?.pincode,
          city: selectedLocation?.city,
        },
      });

      if (res.data) {
        setProducts(res.data.products || []);
        setStatus(res.data.data_source_status);
        setLatency(res.data.latency_ms);
        setRequestId(res.data.request_id);
        setFetchedAt(res.data.fetched_at);
        setIsCached(res.data.is_cached);
        setCacheAge(res.data.cache_age_seconds);

        if (res.data.data_source_status !== 'LIVE' && res.data.errors?.length > 0) {
          setErrorMsg(res.data.errors[0]?.error || 'Failed to retrieve live data.');
        }
      }
    } catch (err: any) {
      setStatus('OFFLINE');
      setErrorMsg(err.response?.data?.detail || 'Upstream connection error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSearch();
  }, [selectedLocation, platform]);

  const quickPills = ['Milk', 'Bread', 'Rice', 'Eggs', 'Coffee', 'Butter', 'Cheese', 'Snacks', 'Tea', 'Apples'];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight font-['Outfit'] flex items-center gap-2.5">
            <Search className="w-6 h-6 text-emerald-400" />
            Live Product Search Console
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Queries live quick-commerce platforms for location: <span className="text-emerald-400 font-semibold">{selectedLocation?.city}</span> ({selectedLocation?.pincode})
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isCached ? (
            <LiveStatusBadge status="CACHED" size="md" showLabel />
          ) : (
            <LiveStatusBadge status={status} size="md" />
          )}
          {isCached && cacheAge !== undefined && (
            <span className="text-xs text-cyan-400 font-mono">({cacheAge}s old)</span>
          )}
        </div>
      </div>

      {/* Search Filter Controls */}
      <div className="p-6 rounded-3xl bg-[#111827] border border-slate-800 space-y-4 shadow-xl">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              required
              placeholder="Search live items (e.g. Amul Milk, Britannia Bread, Eggs)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-4 pr-4 py-3 bg-[#0B0F17] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition font-medium"
            />
          </div>

          <div className="sm:w-56">
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full px-3 py-3 bg-[#0B0F17] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition cursor-pointer font-medium"
            >
              <option value="ALL">All Platforms</option>
              <option value="BlinkIt">BlinkIt</option>
              <option value="Zepto">Zepto</option>
              <option value="Swiggy">Swiggy (Instamart)</option>
              <option value="BigBasket">BigBasket (BB Now)</option>
              <option value="DMart">DMart Ready</option>
              <option value="JioMart">JioMart</option>
              <option value="Minutes">Minutes</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`px-7 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 ${
              loading ? 'opacity-70 cursor-wait' : ''
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Querying Live API...' : 'Search Live'}</span>
          </button>
        </form>

        {/* Quick Suggestion Pills */}
        <div className="flex items-center gap-2 flex-wrap pt-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quick Suggestions:</span>
          {quickPills.map((pill) => (
            <button
              key={pill}
              type="button"
              onClick={() => {
                setQuery(pill);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition border ${
                query === pill
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {pill}
            </button>
          ))}
        </div>
      </div>

      {/* Search Header Telemetry */}
      {products.length > 0 && (
        <div className="flex items-center justify-between px-2 text-xs text-slate-400">
          <div>
            Showing <span className="text-white font-bold">{products.length}</span> verified live items for "{query}"
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px]">
            {latency !== null && <span>Latency: <span className="text-cyan-400">{latency}ms</span></span>}
            {requestId && <span>Request ID: <span className="text-slate-300">{requestId}</span></span>}
          </div>
        </div>
      )}

      {/* Results Grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((item) => (
            <ProductCard key={`${item.platform}-${item.external_product_id}`} item={item} />
          ))}
        </div>
      ) : !loading ? (
        errorMsg ? (
          <ErrorState
            type={status}
            errorMessage={errorMsg}
            lastSuccessfulFetch={fetchedAt}
            onRetry={handleSearch}
          />
        ) : (
          <ErrorState
            type="NO_RESULTS"
            errorMessage={`No live products matching "${query}" were returned by the QuickCommerce API for ${selectedLocation?.city}.`}
            onRetry={handleSearch}
          />
        )
      ) : (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Querying QuickCommerce API across connected platforms...</p>
        </div>
      )}
    </div>
  );
};
