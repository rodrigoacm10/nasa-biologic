"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { Search, Filter, X, ChevronDown, Sparkles } from "lucide-react";

type CatalogType = "articles" | "osds";

export default function UnifiedSearchBar({
  catalogType,
  onSearch,
  allOsds,
  allArticles,
}: {
  catalogType: CatalogType;
  onSearch: (params: any) => void;
  allOsds: any[];
  allArticles: any[];
}) {
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<any>({});
  const onSearchRef = useRef(onSearch);

  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  // Reset filters when switching catalog type
  useEffect(() => {
    setFilters({});
    setQuery("");
  }, [catalogType]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchRef.current({ q: query.trim(), ...filters });
    }, 300);
    return () => clearTimeout(timer);
  }, [query, filters]);

  // Extract available filters based on catalog type
  const available = useMemo(() => {
    if (catalogType === "articles") {
      const organisms = new Set<string>();
      const tissues = new Set<string>();
      const treatments = new Set<string>();
      const technologies = new Set<string>();

      allArticles.forEach((article) => {
        if (article.article?.experimental_factors?.organism) {
          organisms.add(article.article.experimental_factors.organism);
        }
        article.article?.experimental_factors?.tissue_list?.forEach(
          (t: string) => tissues.add(t)
        );
        article.article?.experimental_factors?.treatment_list?.forEach(
          (t: string) => treatments.add(t)
        );
        article.article?.technologies?.forEach((t: string) =>
          technologies.add(t)
        );
      });

      return {
        organisms: Array.from(organisms).sort(),
        tissues: Array.from(tissues).sort(),
        treatments: Array.from(treatments).sort(),
        technologies: Array.from(technologies).sort(),
      };
    } else {
      const organisms = new Set<string>();
      const missions = new Set<string>();
      const factors = new Set<string>();
      const assayTypes = new Set<string>();
      const platforms = new Set<string>();

      allOsds.forEach((osd) => {
        osd.study?.samples?.forEach((s: any) => {
          if (s.characteristics?.Organism)
            organisms.add(s.characteristics.Organism);
          Object.values(s.factors || {}).forEach(
            (v) => v && factors.add(String(v))
          );
        });
        osd.investigation?.factors?.forEach((f: string) => f && factors.add(f));
        if (osd.investigation?.mission?.name)
          missions.add(osd.investigation.mission.name);
        osd.assays?.forEach((a: any) => {
          if (a.type) assayTypes.add(a.type);
          if (a.platform) platforms.add(a.platform);
        });
      });

      return {
        organisms: Array.from(organisms).sort(),
        missions: Array.from(missions).sort(),
        factors: Array.from(factors).sort(),
        assayTypes: Array.from(assayTypes).sort(),
        platforms: Array.from(platforms).sort(),
      };
    }
  }, [catalogType, allOsds, allArticles]);

  const filterFields =
    catalogType === "articles"
      ? [
          {
            key: "organism",
            label: "Organism",
            color: "blue",
            options: available.organisms,
          },
          {
            key: "tissue",
            label: "Tissue",
            color: "green",
            options: available.tissues,
          },
          {
            key: "treatment",
            label: "Treatment",
            color: "pink",
            options: available.treatments,
          },
          {
            key: "technology",
            label: "Technology",
            color: "purple",
            options: available.technologies,
          },
        ]
      : [
          {
            key: "organism",
            label: "Organism",
            color: "blue",
            options: available.organisms,
          },
          {
            key: "mission",
            label: "Mission",
            color: "green",
            options: available.missions,
          },
          {
            key: "factor",
            label: "Factor",
            color: "pink",
            options: available.factors,
          },
          {
            key: "assayType",
            label: "Assay Type",
            color: "purple",
            options: available.assayTypes,
          },
          {
            key: "platform",
            label: "Platform",
            color: "amber",
            options: available.platforms,
          },
        ];

  const activeCount = Object.values(filters).filter(
    (v) => v && v !== ""
  ).length;

  const clearAll = () => {
    setFilters({});
    setQuery("");
  };

  const colorMap: any = {
    blue: {
      bg: "bg-blue-500/30",
      border: "border-blue-400/30",
      text: "text-blue-100",
      ring: "ring-blue-500/50",
      dot: "bg-blue-400",
    },
    green: {
      bg: "bg-green-500/30",
      border: "border-green-400/30",
      text: "text-green-100",
      ring: "ring-green-500/50",
      dot: "bg-green-400",
    },
    pink: {
      bg: "bg-pink-500/30",
      border: "border-pink-400/30",
      text: "text-pink-100",
      ring: "ring-pink-500/50",
      dot: "bg-pink-400",
    },
    purple: {
      bg: "bg-purple-500/30",
      border: "border-purple-400/30",
      text: "text-purple-100",
      ring: "ring-purple-500/50",
      dot: "bg-purple-400",
    },
    amber: {
      bg: "bg-amber-500/30",
      border: "border-amber-400/30",
      text: "text-amber-100",
      ring: "ring-amber-500/50",
      dot: "bg-amber-400",
    },
  };

  return (
    <div className="sticky top-0 z-20 backdrop-blur-xl bg-black/40 border-b border-white/10 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="relative">
          {/* Main Search */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none group-focus-within:text-blue-400 transition-colors" />
              <input
                type="text"
                placeholder={`Search ${
                  catalogType === "articles" ? "articles" : "datasets"
                } by title, description, ${
                  catalogType === "articles" ? "authors" : "project"
                }...`}
                className="w-full pl-12 pr-4 py-3.5 sm:py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 transition-all shadow-lg hover:bg-white/15"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-6 py-3.5 sm:py-4 rounded-2xl border transition-all flex items-center justify-center gap-2 font-semibold shadow-lg hover:shadow-xl ${
                showFilters || activeCount > 0
                  ? "bg-gradient-to-br from-blue-500/30 to-purple-500/30 border-blue-400/50 text-blue-100 hover:from-blue-500/40 hover:to-purple-500/40"
                  : "bg-white/10 backdrop-blur-md border-white/20 text-gray-200 hover:bg-white/20"
              }`}
            >
              <Filter className="w-5 h-5" />
              <span className="hidden sm:inline">Filters</span>
              {activeCount > 0 && (
                <span className="flex items-center justify-center min-w-[22px] h-5 bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-bold px-2 rounded-full shadow-lg">
                  {activeCount}
                </span>
              )}
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="absolute top-full left-0 right-0 mt-3 p-5 sm:p-6 rounded-2xl backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 shadow-2xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  Advanced Filters
                </h3>
                <span className="text-xs text-gray-400">
                  {catalogType === "articles"
                    ? "Research Articles"
                    : "OSD Datasets"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filterFields.map((field) => {
                  const colors = colorMap[field.color];
                  return (
                    <div key={field.key} className="space-y-2">
                      <label className="text-xs font-semibold text-gray-300 uppercase tracking-wide flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${colors.dot}`}
                        ></div>
                        {field.label} ({field.options?.length ?? 0})
                      </label>

                      <div className="relative">
                        <select
                          value={filters[field.key] || ""}
                          onChange={(e) =>
                            setFilters({
                              ...filters,
                              [field.key]: e.target.value || undefined,
                            })
                          }
                          className={`w-full px-4 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 ${colors.ring} appearance-none cursor-pointer transition-all hover:bg-white/15`}
                        >
                          <option value="" className="bg-gray-800">
                            All {field.label.toLowerCase()}s
                          </option>
                          {(field.options ?? []).map((opt) => (
                            <option
                              key={opt}
                              value={opt}
                              className="bg-gray-800"
                            >
                              {opt}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {activeCount > 0 && (
                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                  <button
                    onClick={clearAll}
                    className="text-sm text-red-400 hover:text-red-300 font-medium transition-colors flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Clear all filters
                  </button>
                  <span className="text-xs text-gray-400">
                    {activeCount} filter{activeCount !== 1 ? "s" : ""} active
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Active Filter Pills */}
        {activeCount > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 animate-in fade-in duration-200">
            {Object.entries(filters).map(([key, value]) =>
              typeof value === "string" && value !== "" ? (
                <span
                  key={key}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-blue-500/30 to-purple-500/30 backdrop-blur-md border border-blue-400/30 text-blue-100 text-sm rounded-full shadow-lg hover:shadow-xl transition-all"
                >
                  <span className="text-xs font-semibold uppercase opacity-70">
                    {key}:
                  </span>
                  <span className="font-medium">{value}</span>
                  <button
                    onClick={() => setFilters({ ...filters, [key]: undefined })}
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
