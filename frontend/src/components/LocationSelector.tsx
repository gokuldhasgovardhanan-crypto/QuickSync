import React, { useState } from 'react';
import { MapPin, ChevronDown, Check, Plus, Navigation } from 'lucide-react';
import { LocationItem } from '../types';
import { apiClient } from '../api/client';

interface LocationSelectorProps {
  locations: LocationItem[];
  selectedLocation: LocationItem;
  onSelectLocation: (location: LocationItem) => void;
  onLocationAdded?: (location: LocationItem) => void;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  locations,
  selectedLocation,
  onSelectLocation,
  onLocationAdded,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);

  // Custom location form state
  const [customCity, setCustomCity] = useState('');
  const [customArea, setCustomArea] = useState('');
  const [customLat, setCustomLat] = useState('12.9716');
  const [customLon, setCustomLon] = useState('77.5946');
  const [customPincode, setCustomPincode] = useState('560001');

  const handleCreateCustomLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/locations', {
        city: customCity,
        area: customArea || undefined,
        latitude: parseFloat(customLat),
        longitude: parseFloat(customLon),
        pincode: customPincode,
        is_default: false,
      });
      if (res.data) {
        onSelectLocation(res.data);
        if (onLocationAdded) onLocationAdded(res.data);
        setShowCustomModal(false);
        setIsOpen(false);
      }
    } catch {
      // Local fallback
      const newLoc: LocationItem = {
        id: `loc_${Date.now()}`,
        city: customCity,
        area: customArea,
        latitude: parseFloat(customLat),
        longitude: parseFloat(customLon),
        pincode: customPincode,
        is_default: false,
        created_at: new Date().toISOString()
      };
      onSelectLocation(newLoc);
      setShowCustomModal(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition"
      >
        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
        <span className="font-medium text-slate-200">{selectedLocation?.city}</span>
        {selectedLocation?.area && <span className="text-slate-500">({selectedLocation.area})</span>}
        <span className="text-slate-400 font-mono text-[11px] bg-slate-800 px-1.5 py-0.5 rounded">
          {selectedLocation?.pincode}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-500 ml-0.5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-[#111827] border border-slate-800 rounded-xl shadow-2xl z-40 p-2 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800 flex justify-between items-center">
            <span>Select Live Location</span>
            <span className="text-[10px] text-emerald-400 font-normal">Location-Aware Data</span>
          </div>

          <div className="py-1 max-h-56 overflow-y-auto space-y-0.5">
            {locations.map((loc) => {
              const isSelected = selectedLocation?.id === loc.id || (selectedLocation?.city === loc.city && selectedLocation?.pincode === loc.pincode);
              return (
                <button
                  key={loc.id || `${loc.city}-${loc.pincode}`}
                  onClick={() => {
                    onSelectLocation(loc);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition text-left ${
                    isSelected ? 'bg-emerald-500/10 text-emerald-300 font-medium' : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-slate-100">{loc.city}</div>
                    <div className="text-[11px] text-slate-400">
                      {loc.area ? `${loc.area} · ` : ''}PIN: {loc.pincode}
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={() => {
                setShowCustomModal(true);
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-200 transition"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              Enter Custom Coordinates
            </button>
          </div>
        </div>
      )}

      {/* Custom Coordinates Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#111827] border border-slate-700 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Navigation className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Add Location / Coordinates</h3>
                <p className="text-xs text-slate-400">Quick-commerce pricing and availability are darkstore-specific</p>
              </div>
            </div>

            <form onSubmit={handleCreateCustomLocation} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">City / Region Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bangalore, Mumbai"
                  value={customCity}
                  onChange={(e) => setCustomCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Area / Neighborhood (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Indiranagar, Koramangala"
                  value={customArea}
                  onChange={(e) => setCustomArea(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={customLat}
                    onChange={(e) => setCustomLat(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={customLon}
                    onChange={(e) => setCustomLon(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Postal Pincode</label>
                <input
                  type="text"
                  required
                  value={customPincode}
                  onChange={(e) => setCustomPincode(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition"
                >
                  Save & Apply
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
