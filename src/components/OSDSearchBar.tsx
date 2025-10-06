"use client";

import { useEffect, useState, useRef } from "react";
import { Search, Filter, X, ChevronDown } from "lucide-react";

export type OSDSearchParams = {
  q?: string;
  organism?: string;
  mission?: string;
  factor?: string;
  assayType?: string;
  platform?: string;
  center?: string;
  startDate?: string;
  endDate?: string;
};

export default function OSDSearchBar({
  available,
  onSearch,
  defaultParams,
}: {
  available: {
    organisms: string[];
    missions: string[];
    factors: string[];
    assayTypes: string[];
    platforms: string[];
    centers: string[];
  };
  onSearch: (p: OSDSearchParams) => void;
  defaultParams?: OSDSearchParams;
}) {
  const [p, setP] = useState<OSDSearchParams>(defaultParams || {});
  const [showFilters, setShowFilters] = useState(false);
  const onSearchRef = useRef(onSearch);

  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchRef.current(p);
    }, 300);
    return () => clearTimeout(timer);
  }, [p]);

  const clearAll = () => {
    const empty: OSDSearchParams = {};
    setP(empty);
  };

  const activeCount = Object.values(p).filter((v) => v && v !== "").length;

  return (
    <div className="sticky top-0 z-20 backdrop-blur-xl bg-black/40 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="relative">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by title, description, project..."
                className="w-full pl-12 pr-4 py-3 sm:py-3.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-lg"
                value={p.q ?? ""}
                onChange={(e) => setP({ ...p, q: e.target.value })}
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-5 sm:px-6 py-3 sm:py-3.5 rounded-2xl border transition-all flex items-center justify-center gap-2 font-medium shadow-lg ${
                showFilters || activeCount > 0
                  ? "bg-blue-500/30 border-blue-400/50 text-blue-100 hover:bg-blue-500/40"
                  : "bg-white/10 backdrop-blur-md border-white/20 text-gray-200 hover:bg-white/20"
              }`}
            >
              <Filter className="w-5 h-5" />
              <span className="hidden sm:inline">Filters</span>
              {activeCount > 0 && (
                <span className="flex items-center justify-center min-w-[20px] h-5 bg-blue-500 text-white text-xs font-bold px-1.5 rounded-full">
                  {activeCount}
                </span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="absolute top-full left-0 right-0 mt-3 p-5 sm:p-6 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl space-y-4 z-50">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-300 uppercase tracking-wide flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                    Organism ({available.organisms.length})
                  </label>
                  <div className="relative">
                    <select
                      value={p.organism ?? ""}
                      onChange={(e) =>
                        setP({ ...p, organism: e.target.value || undefined })
                      }
                      className="w-full px-4 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer transition-all hover:bg-white/15"
                    >
                      <option value="" className="bg-gray-800">
                        All organisms
                      </option>
                      {available.organisms.map((x) => (
                        <option key={x} value={x} className="bg-gray-800">
                          {x}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-300 uppercase tracking-wide flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    Mission ({available.missions.length})
                  </label>
                  <div className="relative">
                    <select
                      value={p.mission ?? ""}
                      onChange={(e) =>
                        setP({ ...p, mission: e.target.value || undefined })
                      }
                      className="w-full px-4 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 appearance-none cursor-pointer transition-all hover:bg-white/15"
                    >
                      <option value="" className="bg-gray-800">
                        All missions
                      </option>
                      {available.missions.map((x) => (
                        <option key={x} value={x} className="bg-gray-800">
                          {x}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-300 uppercase tracking-wide flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-pink-400"></div>
                    Factor ({available.factors.length})
                  </label>
                  <div className="relative">
                    <select
                      value={p.factor ?? ""}
                      onChange={(e) =>
                        setP({ ...p, factor: e.target.value || undefined })
                      }
                      className="w-full px-4 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50 appearance-none cursor-pointer transition-all hover:bg-white/15"
                    >
                      <option value="" className="bg-gray-800">
                        All factors
                      </option>
                      {available.factors.map((x) => (
                        <option key={x} value={x} className="bg-gray-800">
                          {x}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-300 uppercase tracking-wide flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                    Assay Type ({available.assayTypes.length})
                  </label>
                  <div className="relative">
                    <select
                      value={p.assayType ?? ""}
                      onChange={(e) =>
                        setP({ ...p, assayType: e.target.value || undefined })
                      }
                      className="w-full px-4 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none cursor-pointer transition-all hover:bg-white/15"
                    >
                      <option value="" className="bg-gray-800">
                        All assay types
                      </option>
                      {available.assayTypes.map((x) => (
                        <option key={x} value={x} className="bg-gray-800">
                          {x}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-300 uppercase tracking-wide flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                    Platform ({available.platforms.length})
                  </label>
                  <div className="relative">
                    <select
                      value={p.platform ?? ""}
                      onChange={(e) =>
                        setP({ ...p, platform: e.target.value || undefined })
                      }
                      className="w-full px-4 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 appearance-none cursor-pointer transition-all hover:bg-white/15"
                    >
                      <option value="" className="bg-gray-800">
                        All platforms
                      </option>
                      {available.platforms.map((x) => (
                        <option key={x} value={x} className="bg-gray-800">
                          {x}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-300 uppercase tracking-wide flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                    Center ({available.centers.length})
                  </label>
                  <div className="relative">
                    <select
                      value={p.center ?? ""}
                      onChange={(e) =>
                        setP({ ...p, center: e.target.value || undefined })
                      }
                      className="w-full px-4 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 appearance-none cursor-pointer transition-all hover:bg-white/15"
                    >
                      <option value="" className="bg-gray-800">
                        All centers
                      </option>
                      {available.centers.map((x) => (
                        <option key={x} value={x} className="bg-gray-800">
                          {x}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {activeCount > 0 && (
                <div className="pt-3 border-t border-white/10">
                  <button
                    onClick={clearAll}
                    className="text-sm text-red-400 hover:text-red-300 font-medium transition-colors flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {activeCount > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {Object.entries(p).map(([key, value]) =>
              value && value !== "" ? (
                <span
                  key={key}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/30 backdrop-blur-md border border-blue-400/30 text-blue-100 text-sm rounded-full shadow-lg"
                >
                  <span className="text-xs font-semibold uppercase opacity-70">
                    {key}:
                  </span>
                  <span className="font-medium">{value}</span>
                  <button
                    onClick={() => setP({ ...p, [key]: undefined })}
                    className="ml-1 hover:bg-blue-400/30 rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ) : null
            )}
          </div>
        )}
      </div>
    </div>
  );
}
