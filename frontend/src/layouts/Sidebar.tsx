import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  ShoppingBag,
  ArrowLeftRight,
  Boxes,
  TrendingDown,
  TrendingUp,
  Sliders,
  Truck,
  ShieldAlert,
  Activity,
  Bell,
  RefreshCw,
  Server,
  BarChart3,
  Settings,
  ShieldCheck,
  PlayCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Zap,
  GitMerge,
  Compass,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuth } from '../store/authStore';

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Live Search', path: '/live-search', icon: Search },
    { label: 'Live Products', path: '/products', icon: ShoppingBag },
    { label: 'Product Matching', path: '/product-matching', icon: GitMerge, highlight: true },
    { label: 'India Regional Map', path: '/india-map', icon: Compass, highlight: true },
    { label: 'Demand Intelligence', path: '/demand', icon: TrendingUp },
    { label: 'Product Optimization', path: '/product-optimization', icon: Sliders },
    { label: 'Comparison', path: '/comparison', icon: ArrowLeftRight },
    { label: 'Inventory', path: '/inventory', icon: Boxes },
    { label: 'Price Monitoring', path: '/prices', icon: TrendingDown },
    { label: 'Delivery ETA', path: '/delivery', icon: Truck },
    { label: 'Data Quality', path: '/data-quality', icon: ShieldCheck },
    { label: 'Monitoring', path: '/monitoring', icon: Activity },
    { label: 'Alerts', path: '/alerts', icon: Bell },
    { label: 'Sync Engine', path: '/sync', icon: RefreshCw },
    { label: 'Data Sources', path: '/sources', icon: Server },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 },
    { label: 'API & Settings', path: '/settings/api', icon: Settings },
    ...(user?.role === 'ADMIN' ? [{ label: 'Admin', path: '/admin', icon: ShieldAlert }] : []),
    { label: 'Live Demo Flow', path: '/demo', icon: PlayCircle, highlight: true },
  ];

  return (
    <aside
      className={`relative flex flex-col justify-between bg-[#0D131F] border-r border-slate-800 transition-all duration-300 z-30 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div>
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-800/80">
          {!collapsed ? (
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-950/40 text-white font-black">
                <Zap className="w-5 h-5 fill-white" />
              </div>
              <div>
                <h1 className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5 font-['Outfit']">
                  QUICKSYNC
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono font-normal">
                    v1.0
                  </span>
                </h1>
                <p className="text-[10px] text-slate-400 truncate max-w-[140px]">
                  Commerce Data Infra
                </p>
              </div>
            </div>
          ) : (
            <div className="mx-auto w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-950/40 text-white font-black">
              <Zap className="w-5 h-5 fill-white" />
            </div>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation List */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-170px)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm'
                      : item.highlight
                      ? 'text-teal-300 bg-teal-950/40 hover:bg-teal-900/50 border border-teal-800/60'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  } ${collapsed ? 'justify-center px-2' : ''}`
                }
                title={collapsed ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${item.highlight ? 'text-teal-400' : ''}`} />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Info & Logout Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-[#0B0F17]/60">
        {!collapsed ? (
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-emerald-400">
                {user?.email?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white truncate">
                  {user?.full_name || user?.email?.split('@')[0]}
                </div>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                  {user?.role}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full flex justify-center p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
};
