import { useState } from "react";
import {
  FileText,
  FlaskConical,
  Search,
  X,
  Filter,
  ChevronDown,
  Heart,
} from "lucide-react";
import SidebarGroupLabel from "@/components/SiderGroupRelations";

type CatalogType = "articles" | "osds" | "vaults" | "matches";

interface SidebarContentProps {
  activeTab: CatalogType;
  setActiveTab: (tab: CatalogType) => void;
  setSidebarOpen: (open: boolean) => void;
  query: string;
  setQuery: (query: string) => void;
  filters: any;
  setFilters: (filters: any) => void;
  handleSearch: () => void;
  articlesTotal: number;
  filteredOsdsLength: number;
  filterFields: Array<{
    key: string;
    label: string;
    color: string;
    options: string[];
  }>;
  activeFilterCount: number;
}

const colorMap: any = {
  blue: { dot: "bg-blue-400" },
  green: { dot: "bg-green-400" },
  pink: { dot: "bg-pink-400" },
  purple: { dot: "bg-purple-400" },
  amber: { dot: "bg-amber-400" },
};

export default function SidebarContent({
  activeTab,
  setActiveTab,
  setSidebarOpen,
  query,
  setQuery,
  filters,
  setFilters,
  handleSearch,
  articlesTotal,
  filteredOsdsLength,
  filterFields,
  activeFilterCount,
}: SidebarContentProps) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 px-2">
      {/* Logo/Title & Search */}
      <div className="p-4 sm:p-6 rounded-3xl backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-bricolage text-white">
              Nacle
            </h1>
            <p className="text-xs text-gray-300">Space Biology Research</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
          <input
            type="text"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
            className="w-full pl-10 pr-24 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-16 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10"
            >
              <X className="w-3 h-3 text-gray-400" />
            </button>
          )}
          <button
            onClick={handleSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold transition-all"
          >
            Go
          </button>
        </div>
      </div>

      {/* Filters Toggle */}
      {activeTab !== "vaults" && activeTab !== "matches" && (
        <>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`w-full p-4 rounded-2xl backdrop-blur-xl border transition-all flex items-center justify-between ${
              showFilters || activeFilterCount > 0
                ? "bg-gradient-to-br from-red-200/10 to-red-500/20 border-white/20"
                : "bg-white/5 border-white/10 hover:bg-white/10"
            }`}
          >
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-white" />
              <span className="text-sm font-semibold text-white">Filters</span>
            </div>
            {activeFilterCount > 0 && (
              <span className="px-2 py-1 rounded-full bg-purple-500 text-white text-xs font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Filter Fields */}
          {showFilters && (
            <div className="space-y-4 p-4 sm:p-5 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 animate-in fade-in slide-in-from-left duration-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-white uppercase tracking-wide flex items-center gap-2">
                  Advanced Filters
                </h3>
              </div>

              {filterFields.map((field: any) => {
                const colors = colorMap[field.color];
                return (
                  <div key={field.key} className="space-y-2">
                    <label className="text-xs font-semibold text-gray-300 uppercase tracking-wide flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${colors.dot}`}
                      ></div>
                      {field.label} ({field.options?.length || 0})
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
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none cursor-pointer"
                      >
                        <option value="" className="bg-gray-800">
                          All {field.label.toLowerCase()}s
                        </option>
                        {field.options?.map((opt: string) => (
                          <option key={opt} value={opt} className="bg-gray-800">
                            {opt}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                );
              })}

              <button
                onClick={handleSearch}
                className="w-full py-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold text-sm hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg"
              >
                Apply Filters
              </button>

              {activeFilterCount > 0 && (
                <button
                  onClick={() => {
                    setFilters({});
                    handleSearch();
                  }}
                  className="w-full py-2 text-sm text-red-400 hover:text-red-300 font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* Tabs */}
      <div className="space-y-3">
        {/* ===== Group: CONTENT ===== */}
        <SidebarGroupLabel label="Content" accent="emerald" />

        <button
          onClick={() => {
            setActiveTab("articles");
            setSidebarOpen(false);
          }}
          className={`w-full p-4 rounded-2xl backdrop-blur-xl border transition-all ${
            activeTab === "articles"
              ? "bg-gradient-to-br from-green-200/10 to-green-500/30 border-white/20 shadow-xl scale-102"
              : "bg-white/5 border-white/10 hover:bg-white/10"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-white">
                  Research Articles
                </div>
                <div className="text-xs text-gray-300">
                  {articlesTotal} items
                </div>
              </div>
            </div>
          </div>
        </button>

        <button
          onClick={() => {
            setActiveTab("osds");
            setSidebarOpen(false);
          }}
          className={`w-full p-4 rounded-2xl backdrop-blur-xl border transition-all ${
            activeTab === "osds"
              ? "bg-gradient-to-br from-blue-200/10 to-blue-500/30 border-white/20 shadow-xl scale-102"
              : "bg-white/5 border-white/10 hover:bg-white/10"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/10 border border-gray-200/30">
                <FlaskConical className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-white">OSD Datasets</div>
                <div className="text-xs text-gray-300">
                  {filteredOsdsLength} items
                </div>
              </div>
            </div>
          </div>
        </button>

        {/* ===== Group: RELATIONS ===== */}
        <SidebarGroupLabel label="Relations" accent="purple" />

        <button
          onClick={() => {
            setActiveTab("vaults");
            setSidebarOpen(false);
          }}
          className={`w-full p-4 rounded-2xl backdrop-blur-xl border transition-all ${
            activeTab === "vaults"
              ? "bg-gradient-to-br from-purple-200/10 to-purple-500/30 border-white/20 shadow-xl scale-102"
              : "bg-white/5 border-white/10 hover:bg-white/10"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/10 border border-gray-200/30">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  className="text-white"
                >
                  <path
                    fill="currentColor"
                    d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Zm1 14.93V20h-2v-3.07A8.009 8.009 0 0 1 4.07 13H1v-2h3.07A8.009 8.009 0 0 1 11 4.07V1h2v3.07A8.009 8.009 0 0 1 19.93 11H23v2h-3.07A8.009 8.009 0 0 1 13 16.93Zm-1-2.93a3 3 0 1 1 3-3a3 3 0 0 1-3 3Z"
                  />
                </svg>
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-white">Vaults</div>
                <div className="text-xs text-gray-300">Knowledge Gaps</div>
              </div>
            </div>
          </div>
        </button>

        <button
          onClick={() => {
            setActiveTab("matches");
            setSidebarOpen(false);
          }}
          className={`w-full mt-2 p-4 rounded-2xl backdrop-blur-xl border transition-all ${
            activeTab === "matches"
              ? "bg-gradient-to-br from-yellow-200/10 to-yellow-500/30 border-white/20 shadow-xl scale-102"
              : "bg-white/5 border-white/10 hover:bg-white/10"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/10 border border-gray-200/30">
                <Heart className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-white">Matches</div>
                <div className="text-xs text-gray-300">Article ↔ OSD links</div>
              </div>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}