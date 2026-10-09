import React, { useState, useEffect } from 'react';
import { Settings, Key, ShieldCheck, CheckCircle2, Save, RefreshCw, AlertCircle } from 'lucide-react';
import { apiClient } from '../api/client';
import { SettingsData } from '../types';

export const SettingsApiPage: React.FC = () => {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [city, setCity] = useState('Bangalore');
  const [area, setArea] = useState('Indiranagar');
  const [lat, setLat] = useState('12.9716');
  const [lon, setLon] = useState('77.5946');
  const [pincode, setPincode] = useState('560001');
  const [interval, setIntervalVal] = useState(60);
  const [timeout, setTimeoutVal] = useState(15);
  const [retries, setRetriesVal] = useState(3);

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const fetchSettings = async () => {
    try {
      const res = await apiClient.get('/settings');
      if (res.data) {
        setSettings(res.data);
        setCity(res.data.default_city);
        setArea(res.data.default_area);
        setLat(String(res.data.default_latitude));
        setLon(String(res.data.default_longitude));
        setPincode(res.data.default_pincode);
        setIntervalVal(res.data.sync_interval_seconds);
        setTimeoutVal(res.data.api_timeout_seconds);
        setRetriesVal(res.data.max_retries);
      }
    } catch {
      // Handled
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const payload: any = {
        default_city: city,
        default_area: area,
        default_latitude: parseFloat(lat),
        default_longitude: parseFloat(lon),
        default_pincode: pincode,
        sync_interval_seconds: interval,
        api_timeout_seconds: timeout,
        max_retries: retries,
      };
      if (apiKeyInput.trim()) {
        payload.quickcommerce_api_key = apiKeyInput.trim();
      }

      const res = await apiClient.put('/settings', payload);
      if (res.data) {
        setSettings(res.data);
        setApiKeyInput('');
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch {
      // Handled
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await apiClient.post('/sources/test', {});
      setTestResult(res.data);
    } catch (err: any) {
      setTestResult({
        success: false,
        error_message: err.response?.data?.detail || 'Test request failed.',
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight font-['Outfit'] flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-emerald-400" />
          QuickCommerce API Configuration & Secrets
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Store authorized provider credentials securely on backend. Keys are masked and never exposed to client runtime.
        </p>
      </div>

      {/* Test Connection Banner */}
      {testResult && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-4 ${
            testResult.success
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {testResult.success ? <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />}
            <div>
              <div className="font-bold">
                {testResult.success ? '● CONNECTION VERIFIED' : '● CONNECTION TEST FAILED'}
              </div>
              <div className="text-[11px] opacity-90">
                {testResult.success
                  ? `Live API response verified in ${testResult.latency_ms}ms · Request ID: ${testResult.request_id}`
                  : `Reason: ${testResult.error_message || 'HTTP error'}`}
              </div>
            </div>
          </div>
          <button
            onClick={() => setTestResult(null)}
            className="text-xs text-slate-400 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>Configuration settings updated and applied successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* API Credentials Card */}
        <div className="p-6 rounded-3xl bg-[#111827] border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Key className="w-4 h-4 text-emerald-400" />
              QuickCommerce API Secret Key
            </h3>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                settings?.quickcommerce_api_key_configured
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}
            >
              {settings?.quickcommerce_api_key_configured ? 'Key Configured' : 'Key Missing'}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <label className="block text-slate-300 font-medium">
              Live API Key (Stored securely on backend)
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder={settings?.quickcommerce_api_key_masked || 'Enter X-API-Key (e.g. qc_live_...)'}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-[#0B0F17] border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold border border-slate-700 transition flex items-center justify-center gap-2 flex-shrink-0"
              >
                <ShieldCheck className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
                <span>{testing ? 'Testing...' : 'TEST CONNECTION'}</span>
              </button>
            </div>
            {settings?.quickcommerce_api_key_masked && (
              <p className="text-[11px] text-slate-400 font-mono">
                Current active key: <span className="text-slate-200">{settings.quickcommerce_api_key_masked}</span>
              </p>
            )}
          </div>
        </div>

        {/* Default Coordinates Card */}
        <div className="p-6 rounded-3xl bg-[#111827] border border-slate-800 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Default Darkstore Coordinates
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#0B0F17] border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Area</label>
              <input
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#0B0F17] border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Latitude</label>
              <input
                type="number"
                step="any"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#0B0F17] border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Longitude</label>
              <input
                type="number"
                step="any"
                value={lon}
                onChange={(e) => setLon(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#0B0F17] border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-medium mb-1">Postal Pincode</label>
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#0B0F17] border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Polling & Resiliency Parameters */}
        <div className="p-6 rounded-3xl bg-[#111827] border border-slate-800 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Pipeline Resiliency & Polling Limits
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Sync Interval (Seconds)</label>
              <select
                value={interval}
                onChange={(e) => setIntervalVal(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-[#0B0F17] border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value={15}>15 seconds</option>
                <option value={30}>30 seconds</option>
                <option value={60}>60 seconds (Default)</option>
                <option value={300}>5 minutes</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">API Timeout (Seconds)</label>
              <input
                type="number"
                value={timeout}
                onChange={(e) => setTimeoutVal(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-[#0B0F17] border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Max Retries (Backoff)</label>
              <input
                type="number"
                value={retries}
                onChange={(e) => setRetriesVal(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-[#0B0F17] border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition shadow-lg shadow-emerald-950/40 ${
              saving ? 'opacity-70 cursor-wait' : ''
            }`}
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
