import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, AlertTriangle, XCircle, RefreshCw, FileText, Database } from 'lucide-react';
import { apiClient } from '../api/client';
import { DataQualityReport } from '../types';
import { LiveStatusBadge } from '../components/LiveStatusBadge';

export const DataQualityPage: React.FC = () => {
  const [report, setReport] = useState<DataQualityReport | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/data-quality');
      if (res.data) {
        setReport(res.data);
      }
    } catch {
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const hasData = report && report.total_records > 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight font-['Outfit'] flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            Live Data Quality & Schema Integrity Engine
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time validation audits verifying types, mandatory fields, and range integrity before persistence
          </p>
        </div>

        <button
          onClick={fetchReport}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition self-start"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {!hasData ? (
        <div className="p-12 rounded-3xl bg-[#111827]/80 border border-slate-800 text-center max-w-lg mx-auto my-8 space-y-3">
          <Database className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="text-lg font-bold text-white">No live data available</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Data quality scores are calculated exclusively from live ingested API payloads. Run a live search or sync to generate audit scores.
          </p>
        </div>
      ) : (
        <>
          {/* Top Score & Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">Quality Score</span>
              <div className="text-3xl font-black text-emerald-400 font-mono mt-2">
                {report.quality_score}%
              </div>
              <span className="text-[11px] text-emerald-500 font-medium">Valid / Total Records</span>
            </div>

            <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">Total Ingested</span>
              <div className="text-3xl font-black text-white font-mono mt-2">
                {report.total_records}
              </div>
              <span className="text-[11px] text-cyan-400 font-medium">{report.valid_records} Valid Passed</span>
            </div>

            <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">Schema Completeness</span>
              <div className="text-3xl font-black text-teal-300 font-mono mt-2">
                {report.completeness_percentage}%
              </div>
              <span className="text-[11px] text-slate-400">{report.invalid_records} Missing Fields</span>
            </div>

            <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">API Ingest Errors</span>
              <div className="text-3xl font-black text-rose-400 font-mono mt-2">
                {report.api_errors_count}
              </div>
              <span className="text-[11px] text-slate-400">{report.stale_records_count} Stale snapshots</span>
            </div>
          </div>

          {/* Validation Failures / Audits Log */}
          <div className="p-6 rounded-3xl bg-[#111827] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                Live Validation Audit Trail
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                {report.validation_failures_summary.length} Recent Audit Entries
              </span>
            </div>

            {report.validation_failures_summary.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {report.validation_failures_summary.map((f, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs flex items-start justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{f.platform}</span>
                        <span className="text-slate-400">· {f.item}</span>
                      </div>
                      <div className="text-amber-400 mt-1 font-mono text-[11px]">
                        {f.errors.join(', ')}
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 whitespace-nowrap">
                      {new Date(f.checked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-emerald-400/80 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>All recent live product responses passed 100% of schema validation checks.</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
