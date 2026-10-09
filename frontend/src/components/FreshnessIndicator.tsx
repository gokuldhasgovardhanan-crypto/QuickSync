import React from 'react';
import { Clock, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface FreshnessIndicatorProps {
  status?: 'FRESH' | 'AGING' | 'STALE' | 'OFFLINE' | string;
  ageSeconds?: number;
  lastFetchedAt?: string;
  className?: string;
}

export const FreshnessIndicator: React.FC<FreshnessIndicatorProps> = ({
  status = 'FRESH',
  ageSeconds,
  lastFetchedAt,
  className = '',
}) => {
  const norm = (status || 'OFFLINE').toUpperCase();

  let badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  let label = 'FRESH (0-30s)';
  let icon = <CheckCircle2 className="w-3.5 h-3.5" />;

  if (norm === 'AGING') {
    badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    label = 'AGING (31-120s)';
    icon = <AlertTriangle className="w-3.5 h-3.5" />;
  } else if (norm === 'STALE') {
    badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    label = 'STALE (>120s)';
    icon = <XCircle className="w-3.5 h-3.5" />;
  } else if (norm === 'OFFLINE') {
    badgeColor = 'bg-slate-700/50 text-slate-400 border-slate-600';
    label = 'OFFLINE';
    icon = <Clock className="w-3.5 h-3.5" />;
  }

  const formatTime = (ts?: string) => {
    if (!ts) return 'Never';
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return ts;
    }
  };

  return (
    <div className={`flex items-center gap-2 text-xs ${className}`}>
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${badgeColor} font-medium`}>
        {icon}
        <span>{label}</span>
      </span>
      {lastFetchedAt && (
        <span className="text-slate-400">
          Last fetch: <span className="text-slate-200 font-mono font-medium">{formatTime(lastFetchedAt)}</span>
          {ageSeconds !== undefined && ageSeconds !== null && (
            <span className="text-slate-500 ml-1">({ageSeconds}s ago)</span>
          )}
        </span>
      )}
    </div>
  );
};
