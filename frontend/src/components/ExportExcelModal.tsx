import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  Building2,
  Layers,
  MapPin,
  Calendar,
  Sparkles,
  Info,
  Loader2
} from 'lucide-react';
import { ExportOptions, ExportFilterRequest } from '../types/export';
import { apiClient } from '../api/client';

interface ExportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultBrand?: string;
  defaultPlatform?: string;
}

export const ExportExcelModal: React.FC<ExportExcelModalProps> = ({
  isOpen,
  onClose,
  defaultBrand,
  defaultPlatform
}) => {
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [options, setOptions] = useState<ExportOptions | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Selected filters
  const [selectedBrands, setSelectedBrands] = useState<string[]>(defaultBrand ? [defaultBrand] : []);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(defaultPlatform ? [defaultPlatform] : []);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('ALL');
  const [includeMatches, setIncludeMatches] = useState(true);
  const [includeSales, setIncludeSales] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchOptions();
      if (defaultBrand) setSelectedBrands([defaultBrand]);
      if (defaultPlatform) setSelectedPlatforms([defaultPlatform]);
    }
  }, [isOpen, defaultBrand, defaultPlatform]);

  const fetchOptions = async () => {
    try {
      setLoadingOptions(true);
      setError(null);
      const res = await apiClient.get('/export/options');
      if (res.data) {
        setOptions(res.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Error loading filter metadata');
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleToggleBrand = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  const handleTogglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  const handleToggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      setError(null);
      setDownloadSuccess(false);

      const filterPayload: ExportFilterRequest = {
        brands: selectedBrands.length > 0 ? selectedBrands : undefined,
        platforms: selectedPlatforms.length > 0 ? selectedPlatforms : undefined,
        categories: selectedCategories.length > 0 ? selectedCategories : undefined,
        city: selectedCity !== 'ALL' ? selectedCity : undefined,
        include_identity_matches: includeMatches,
        include_sales_metrics: includeSales
      };

      const res = await apiClient.post('/export/excel', filterPayload, {
        responseType: 'blob'
      });

      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().slice(0, 10);
      link.setAttribute('download', `QuickSync_MultiBrand_Export_${timestamp}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setDownloadSuccess(true);
      setTimeout(() => {
        setDownloadSuccess(false);
      }, 4000);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to download Excel file.');
    } finally {
      setDownloading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-3xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                Multi-Brand Data Export to Excel
                <span className="text-xs font-mono uppercase bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                  .xlsx
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Structured export directly from PostgreSQL real observation records.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="flex items-center gap-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {downloadSuccess && (
            <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Excel file generated and downloaded successfully!</span>
            </div>
          )}

          {loadingOptions ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mb-2" />
              <p className="text-sm">Loading available brands, platforms, and locations...</p>
            </div>
          ) : (
            <>
              {/* Brand Filter */}
              <div>
                <label className="text-xs font-semibold text-foreground flex items-center justify-between mb-2">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-emerald-400" />
                    Select Brands ({selectedBrands.length === 0 ? 'All Brands Selected' : `${selectedBrands.length} selected`})
                  </span>
                  {selectedBrands.length > 0 && (
                    <button
                      onClick={() => setSelectedBrands([])}
                      className="text-[11px] text-emerald-400 hover:underline"
                    >
                      Clear Brand Filter
                    </button>
                  )}
                </label>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-1 border border-border/60 rounded-lg bg-muted/20">
                  {options?.brands.map((b) => {
                    const isSelected = selectedBrands.includes(b);
                    return (
                      <button
                        key={b}
                        type="button"
                        onClick={() => handleToggleBrand(b)}
                        className={`text-xs px-2.5 py-1 rounded-md transition-colors border ${
                          isSelected
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-medium'
                            : 'bg-background text-muted-foreground border-border hover:border-border/80'
                        }`}
                      >
                        {b}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Platform Filter */}
              <div>
                <label className="text-xs font-semibold text-foreground flex items-center justify-between mb-2">
                  <span className="flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-emerald-400" />
                    Select Platforms ({selectedPlatforms.length === 0 ? 'All 7 Platforms' : `${selectedPlatforms.length} selected`})
                  </span>
                  {selectedPlatforms.length > 0 && (
                    <button
                      onClick={() => setSelectedPlatforms([])}
                      className="text-[11px] text-emerald-400 hover:underline"
                    >
                      Clear Platform Filter
                    </button>
                  )}
                </label>
                <div className="flex flex-wrap gap-2">
                  {options?.platforms.map((p) => {
                    const isSelected = selectedPlatforms.includes(p);
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handleTogglePlatform(p)}
                        className={`text-xs px-3 py-1.5 rounded-md transition-colors border ${
                          isSelected
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-medium'
                            : 'bg-muted/40 text-muted-foreground border-border hover:border-border/80'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* City & Category row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-2">
                    <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                    Regional Location
                  </label>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="ALL">All Monitored Locations (National)</option>
                    <option value="Bengaluru">Bengaluru / Bangalore (Primary Hub)</option>
                    <option value="Mumbai">Mumbai (Western Region)</option>
                    <option value="Delhi NCR">Delhi NCR (Northern Region)</option>
                    <option value="Hyderabad">Hyderabad (Southern Hub)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-2">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                    Category Scope
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {options?.categories.map((c) => {
                      const isSelected = selectedCategories.includes(c);
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => handleToggleCategory(c)}
                          className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
                            isSelected
                              ? 'bg-primary/20 text-primary border-primary/40'
                              : 'bg-background text-muted-foreground border-border'
                          }`}
                        >
                          {c}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Data Inclusions */}
              <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                <h4 className="text-xs font-semibold text-foreground">Data Dimensions Included in Excel:</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Brand & SKU Identity</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Canonical Identity (QS-PROD)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Price & MRP Snapshots</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Warehouse Inventory</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Availability & ETA Speed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Match Confidence & GTIN</span>
                  </div>
                </div>

                {/* Zero-Mock Notice */}
                <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-[11px] text-amber-300">
                  <Info className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
                  <div>
                    <span className="font-semibold">Zero-Mock Real Data Policy: </span>
                    QuickSync exports real live API observations from PostgreSQL. If sales volume is not provided by authorized catalog endpoints, the column explicitly displays &quot;DATA NOT AVAILABLE FROM CURRENT SOURCE&quot; to maintain data integrity.
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-6 py-4 bg-muted/30">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading || loadingOptions}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-500 disabled:opacity-50 transition-colors"
          >
            {downloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating Excel (.xlsx)...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                EXPORT TO EXCEL (.XLSX)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
