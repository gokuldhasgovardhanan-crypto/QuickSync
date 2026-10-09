import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, PieChart as PieIcon, RefreshCw, Layers, FileSpreadsheet } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { apiClient } from '../api/client';
import { LiveStatusBadge } from '../components/LiveStatusBadge';
import { ExportExcelModal } from '../components/ExportExcelModal';

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [sumRes, healthRes, priceRes] = await Promise.all([
        apiClient.get('/monitoring/summary'),
        apiClient.get('/monitoring/health'),
        apiClient.get('/prices')
      ]);

      setData({
        summary: sumRes.data,
        health: healthRes.data,
        prices: priceRes.data
      });
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const COLORS = ['#22c55e', '#06b6d4', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#ef4444'];

  const stockPieData = data?.summary ? [
    { name: 'In Stock', value: data.summary.in_stock_products_count || 1 },
    { name: 'Out of Stock', value: data.summary.out_of_stock_products_count || 0 },
  ] : [];

  const platformBarData = data?.health?.platform_health?.map((p: any) => ({
    name: p.platform,
    latency: p.avg_latency_ms,
    successRate: p.success_rate,
  })) || [];

  const priceComparisonData = data?.prices?.slice(0, 6).map((p: any) => ({
    name: p.name.slice(0, 14),
    price: p.current_price,
    mrp: p.mrp || p.current_price,
  })) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight font-['Outfit'] flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-emerald-400" />
            Quick-Commerce Analytics &amp; Intelligence
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Visual telemetry aggregated exclusively from real PostgreSQL historical snapshot records
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setExportModalOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            EXPORT TO EXCEL
          </button>

          <button
            onClick={fetchAnalytics}
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

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Platform Latency Comparison */}
        <div className="p-6 rounded-3xl bg-[#111827] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Platform Latency Distribution (ms)
            </h3>
            <span className="text-xs text-cyan-400 font-mono">Live HTTP Latency</span>
          </div>

          <div className="h-64 w-full">
            {platformBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={platformBarData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F293D" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} unit="ms" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0B0F17', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Bar dataKey="latency" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Awaiting live API responses...
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Live Stock Ratio */}
        <div className="p-6 rounded-3xl bg-[#111827] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Product Stock Availability Ratio
            </h3>
            <span className="text-xs text-emerald-400 font-mono">Snapshot Ratio</span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {stockPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stockPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    <Cell fill="#22c55e" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0B0F17', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-500">Awaiting product snapshots...</div>
            )}
          </div>
        </div>

        {/* Chart 3: Live Price vs MRP Comparison */}
        <div className="p-6 rounded-3xl bg-[#111827] border border-slate-800 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Live Product Pricing vs MRP Spread (INR)
            </h3>
            <span className="text-xs text-emerald-400 font-mono">Audited Deltas</span>
          </div>

          <div className="h-64 w-full">
            {priceComparisonData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priceComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F293D" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} unit="₹" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0B0F17', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Legend />
                  <Bar dataKey="price" name="Live Offer Price" fill="#22c55e" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="mrp" name="MRP" fill="#475569" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Run a live search to generate price spread comparison.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
