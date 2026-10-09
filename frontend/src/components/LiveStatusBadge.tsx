import React from 'react';
import { Radio, AlertCircle, AlertTriangle, WifiOff, Clock } from 'lucide-react';

interface LiveStatusBadgeProps {
  status: 'LIVE' | 'DEGRADED' | 'OFFLINE' | 'RATE_LIMITED' | 'CACHED' | string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const LiveStatusBadge: React.FC<LiveStatusBadgeProps> = ({
  status = 'LIVE',
  size = 'md',
  showLabel = true,
}) => {
  const normalized = status.toUpperCase();

  let colorClasses = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  let dotClasses = 'bg-emerald-400 shadow-[0_0_8px_#34d399]';
  let label = 'LIVE';
  let icon = <span className={`w-2 h-2 rounded-full ${dotClasses} animate-pulse`} />;

  if (normalized === 'DEGRADED') {
    colorClasses = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    dotClasses = 'bg-amber-400 shadow-[0_0_8px_#fbbf24]';
    label = 'DEGRADED';
    icon = <span className={`w-2 h-2 rounded-full ${dotClasses} animate-pulse`} />;
  } else if (normalized === 'OFFLINE' || normalized === 'ERROR') {
    colorClasses = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    dotClasses = 'bg-rose-500 shadow-[0_0_8px_#f43f5e]';
    label = 'OFFLINE';
    icon = <WifiOff className="w-3.5 h-3.5" />;
  } else if (normalized === 'RATE_LIMITED') {
    colorClasses = 'bg-orange-500/10 text-orange-400 border-orange-500/30';
    dotClasses = 'bg-orange-400 shadow-[0_0_8px_#fb923c]';
    label = 'RATE LIMITED';
    icon = <AlertTriangle className="w-3.5 h-3.5" />;
  } else if (normalized === 'CACHED') {
    colorClasses = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
    dotClasses = 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]';
    label = 'CACHED';
    icon = <Clock className="w-3.5 h-3.5" />;
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : size === 'lg' ? 'px-3.5 py-1.5 text-sm font-semibold' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border backdrop-blur-sm transition-all duration-300 ${sizeClasses} ${colorClasses}`}
    >
      {icon}
      {showLabel && <span>{label}</span>}
    </span>
  );
};
