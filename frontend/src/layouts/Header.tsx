import React, { useState, useEffect } from 'react';
import { Bell, RefreshCw, Radio, User as UserIcon, LogOut, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { useLocationState } from '../hooks/useLocation';
import { useWebSocket } from '../hooks/useWebSocket';
import { LocationSelector } from '../components/LocationSelector';
import { LiveStatusBadge } from '../components/LiveStatusBadge';
import { apiClient } from '../api/client';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { locations, selectedLocation, changeLocation, setLocations } = useLocationState();
  const { isConnected, lastMessage } = useWebSocket();
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');
  const [unreadAlertsCount, setUnreadAlertsCount] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  useEffect(() => {
    // Fetch initial alert count
    apiClient.get('/alerts?status=OPEN').then((res) => {
      if (Array.isArray(res.data)) {
        setUnreadAlertsCount(res.data.length);
      }
    }).catch(() => {});
  }, []);

  // Update real-time trigger on WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      if (lastMessage.event === 'alert_created') {
        setUnreadAlertsCount((prev) => prev + 1);
      }
    }
  }, [lastMessage]);

  const handleManualSync = async () => {
    setIsRefreshing(true);
    try {
      await apiClient.post('/sync/run', { query: 'Milk', platform: 'ALL' });
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch {
      // Handle gracefully
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <header className="h-16 px-6 bg-[#0D131F]/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between z-20">
      {/* Left side: Global Status & Title */}
      <div className="flex items-center gap-4">
        <LiveStatusBadge status={isConnected ? 'LIVE' : 'OFFLINE'} size="md" />

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
          <span>Synced:</span>
          <span className="font-mono text-slate-200 font-medium">{lastSyncTime}</span>
        </div>
      </div>

      {/* Right side: Location Selector, Sync Trigger, Alerts, User Profile */}
      <div className="flex items-center gap-3">
        {/* Location Selector */}
        <LocationSelector
          locations={locations}
          selectedLocation={selectedLocation}
          onSelectLocation={changeLocation}
          onLocationAdded={(loc) => setLocations((prev) => [...prev, loc])}
        />

        {/* Sync Trigger */}
        <button
          onClick={handleManualSync}
          disabled={isRefreshing}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 text-xs font-semibold transition ${
            isRefreshing ? 'opacity-70 cursor-not-allowed' : ''
          }`}
          title="Run instant live sync"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden md:inline">{isRefreshing ? 'Syncing...' : 'Sync Now'}</span>
        </button>

        {/* Notifications / Alerts Link */}
        <Link
          to="/alerts"
          className="relative p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition"
          title="Live Alerts"
        >
          <Bell className="w-4 h-4" />
          {unreadAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center animate-pulse">
              {unreadAlertsCount > 9 ? '9+' : unreadAlertsCount}
            </span>
          )}
        </Link>

        {/* User Role & Profile */}
        <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="text-right">
            <div className="text-xs font-semibold text-white leading-tight">
              {user?.full_name || user?.email?.split('@')[0]}
            </div>
            <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">
              {user?.role}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
