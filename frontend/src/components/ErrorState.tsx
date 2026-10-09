import React from 'react';
import { WifiOff, AlertTriangle, Key, Clock, RefreshCw, ServerCrash, SearchX } from 'lucide-react';

interface ErrorStateProps {
  type?: 'OFFLINE' | 'AUTH_ERROR' | 'RATE_LIMITED' | 'NO_RESULTS' | 'SERVER_ERROR' | string;
  errorMessage?: string;
  statusCode?: number;
  lastSuccessfulFetch?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  type = 'OFFLINE',
  errorMessage,
  statusCode,
  lastSuccessfulFetch,
  onRetry,
}) => {
  const norm = type.toUpperCase();

  let title = 'DATA SOURCE OFFLINE';
  let desc = 'Unable to reach the live quick-commerce provider API.';
  let icon = <WifiOff className="w-10 h-10 text-rose-400" />;
  let badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/30';

  if (norm === 'AUTH_ERROR' || statusCode === 401) {
    title = 'API AUTHENTICATION FAILED';
    desc = 'Invalid or missing API key. Please check your credentials in Settings.';
    icon = <Key className="w-10 h-10 text-amber-400" />;
    badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  } else if (norm === 'RATE_LIMITED' || statusCode === 429) {
    title = 'LIVE REQUESTS RATE LIMITED';
    desc = 'Provider rate limit exceeded (HTTP 429). The system has backed off to protect quota.';
    icon = <Clock className="w-10 h-10 text-orange-400" />;
    badgeColor = 'bg-orange-500/10 text-orange-400 border-orange-500/30';
  } else if (norm === 'NO_RESULTS') {
    title = 'NO LIVE PRODUCTS FOUND';
    desc = 'No quick-commerce products matched your query for this specific location.';
    icon = <SearchX className="w-10 h-10 text-slate-400" />;
    badgeColor = 'bg-slate-700/50 text-slate-300 border-slate-600';
  } else if (statusCode === 502 || statusCode === 504) {
    title = 'DATA SOURCE OFFLINE';
    desc = statusCode === 502 ? 'HTTP 502 – Upstream platform error' : 'HTTP 504 – Provider timeout';
    icon = <ServerCrash className="w-10 h-10 text-rose-400" />;
    badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
  }

  return (
    <div className="p-8 rounded-3xl bg-[#111827]/80 border border-slate-800 text-center max-w-lg mx-auto my-8 space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto shadow-inner">
        {icon}
      </div>

      <div className="space-y-1.5">
        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${badgeColor} uppercase tracking-wider`}>
          {statusCode ? `HTTP ${statusCode}` : 'Error State'}
        </span>
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
          {errorMessage || desc}
        </p>
      </div>

      {lastSuccessfulFetch && (
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400 font-mono inline-block">
          Last successful response: <span className="text-slate-200">{lastSuccessfulFetch}</span>
        </div>
      )}

      {onRetry && (
        <div>
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition border border-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      )}
    </div>
  );
};
