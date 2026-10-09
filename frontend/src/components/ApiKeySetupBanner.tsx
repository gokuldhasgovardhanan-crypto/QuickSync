import React from 'react';
import { Key, AlertTriangle, ArrowRight, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ApiKeySetupBannerProps {
  isConfigured: boolean;
}

export const ApiKeySetupBanner: React.FC<ApiKeySetupBannerProps> = ({ isConfigured }) => {
  if (isConfigured) return null;

  return (
    <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex-shrink-0">
          <Key className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-amber-200">
            QuickCommerce API Key Not Configured
          </h4>
          <p className="text-xs text-amber-300/80 mt-0.5">
            QuickSync strictly connects to live APIs. To stream live data across BlinkIt, Zepto, Swiggy, and others, configure your authorized API key in Settings.
          </p>
        </div>
      </div>
      <Link
        to="/settings/api"
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex-shrink-0 shadow-lg shadow-amber-950/40"
      >
        <span>Configure API Key</span>
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
};
