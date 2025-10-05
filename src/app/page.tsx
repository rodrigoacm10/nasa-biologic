"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { Article } from "@/@types/article";
import {
  Loader2,
  Database,
  FileText,
  FlaskConical,
  Search,
  X,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Menu,
  Heart,
} from "lucide-react";
import { ensureAllOsdsCached } from "@/lib/osds-cache";
import ArticleCard from "@/components/ArticleCard";
import OSDCard from "@/components/OSDCard";
import OrganismBubbleChart from "@/components/graphs/OrganismBubbleChart";
import SidebarGroupLabel from "@/components/SiderGroupRelations";
import MatchesTab from "@/components/MatchTab";

// Lazy: Recharts é usado dentro do VaultsTab; evitar SSR
const VaultsTab = dynamic(() => import("@/components/VaultTab"), {
  ssr: false,
});

type CatalogType = "articles" | "osds" | "vaults" | "matches";

interface ArticlesResponse {
  articles: Article[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

type OSD = {
  investigation: {
    id: string;
    title?: string;
    description?: string;
    mission?: {
      name?: string;
      start_date?: string;
      end_date?: string;
      link?: string;
    };
    project?: {
      identifier?: string;
      title?: string;
      type?: string;
      link?: string;
      managing_center?: string;
    };
    factors?: string[];
  };
  study?: {
    samples?: Array<{
      characteristics?: { Organism?: string; [k: string]: any };
      factors?: Record<string, string>;
    }>;
  };
  assays?: Array<{ type?: string; platform?: string }>;
};

export default function UnifiedCatalogPage() {
  const [activeTab, setActiveTab] = useState<CatalogType>("articles");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<any>({});
  const [showFilters, setShowFilters] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [articlesTotal, setArticlesTotal] = useState(0);
  const [articlesPage, setArticlesPage] = useState(1);
  const [articlesHasMore, setArticlesHasMore] = useState(true);

  const [allOsds, setAllOsds] = useState<OSD[]>([]);
  const [osdsLoading, setOsdsLoading] = useState(true);
  const [filteredOsds, setFilteredOsds] = useState<OSD[]>([]);
  const [visibleOsds, setVisibleOsds] = useState<OSD[]>([]);
  const [osdsPage, setOsdsPage] = useState(1);
  const [osdsHasMore, setOsdsHasMore] = useState(true);

  const PAGE_SIZE = 12;

  const fetchAllArticles = async () => {
    const response = await fetch(`/api/articles?limit=9999`);
    const data = await response.json();
    setAllArticles(data.articles);
  };

  useEffect(() => {
    fetchAllArticles();
    fetchArticles();
    fetchOSDs();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === "articles") {
        fetchArticles({ q: query, ...filters }, true);
      } else if (activeTab === "osds") {
        const filtered = filterOSDs(allOsds, { q: query, ...filters });
        setFilteredOsds(filtered);
        setVisibleOsds(filtered.slice(0, PAGE_SIZE));
        setOsdsPage(1);
        setOsdsHasMore(filtered.length > PAGE_SIZE);
      }
      // Vaults tem filtros próprios dentro do componente VaultsTab
    }, 100);
    return () => clearTimeout(timer);
  }, [query, filters, activeTab, allOsds]);

  useEffect(() => {
    setQuery("");
    setFilters({});
  }, [activeTab]);

  const availableFilters = useMemo(() => {
    if (activeTab === "articles") {
      const organisms = new Set<string>();
      const tissues = new Set<string>();
      const treatments = new Set<string>();
      const technologies = new Set<string>();

      allArticles.forEach((article) => {
        const data = article.article;
        if (data?.experimental_factors?.organism) {
          organisms.add(data.experimental_factors.organism);
        }
        data?.experimental_factors?.tissue_list?.forEach((t: string) =>
          tissues.add(t)
        );
        data?.experimental_factors?.treatment_list?.forEach((t: string) =>
          treatments.add(t)
        );
        (data?.technologies || []).forEach((t: string) => technologies.add(t));
      });

      return {
        organisms: Array.from(organisms).sort(),
        tissues: Array.from(tissues).sort(),
        treatments: Array.from(treatments).sort(),
        technologies: Array.from(technologies).sort(),
      };
    } else if (activeTab === "osds") {
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
    // Vaults usa filtros internos → devolve vazio para esconder UI daqui
    return {
      organisms: [],
      tissues: [],
      treatments: [],
      technologies: [],
      missions: [],
      factors: [],
      assayTypes: [],
      platforms: [],
    } as any;
  }, [activeTab, allArticles, allOsds]);

  const fetchArticles = async (params: any = {}, resetPage = true) => {
    if (resetPage) {
      setArticlesLoading(true);
      setArticlesPage(1);
      setArticles([]);
    }

    try {
      const page = params.page || (resetPage ? 1 : articlesPage);
      const queryParams = { ...params, page, limit: PAGE_SIZE };
      const queryString = new URLSearchParams(
        Object.entries(queryParams)
          .filter(
            ([_, v]) => v !== undefined && v !== null && v.toString() !== ""
          )
          .map(([k, v]) => [k, String(v)])
      ).toString();

      const response = await fetch(`/api/articles?${queryString}`);
      const data: ArticlesResponse = await response.json();

      setArticles(data.articles);
      setArticlesTotal(data.total);
      setArticlesHasMore(data.hasMore);
      setArticlesPage(data.page);
    } catch (error) {
      console.error("Error fetching articles:", error);
    } finally {
      setArticlesLoading(false);
    }
  };

  const fetchOSDs = async () => {
    setOsdsLoading(true);
    try {
      const data = await ensureAllOsdsCached("/api/osds");
      const osds = Array.isArray(data) ? data : [];
      setAllOsds(osds);
      setFilteredOsds(osds);
      setVisibleOsds(osds.slice(0, PAGE_SIZE));
      setOsdsHasMore(osds.length > PAGE_SIZE);
    } catch (e) {
      console.error(e);
    } finally {
      setOsdsLoading(false);
    }
  };

  const filterOSDs = (osds: OSD[], params: any) => {
    const q = params.q?.toLowerCase() || "";
    const org = params.organism?.toLowerCase() || "";
    const mission = params.mission?.toLowerCase() || "";
    const factor = params.factor?.toLowerCase() || "";
    const assayType = params.assayType?.toLowerCase() || "";
    const platform = params.platform?.toLowerCase() || "";

    return osds.filter((osd) => {
      if (q) {
        const blob = [
          osd.investigation?.id,
          osd.investigation?.title,
          osd.investigation?.description,
        ]
          .join(" ")
          .toLowerCase();
        if (!blob.includes(q)) return false;
      }
      if (
        org &&
        !osd.study?.samples?.some((s) =>
          s.characteristics?.Organism?.toLowerCase().includes(org)
        )
      )
        return false;
      if (
        mission &&
        !osd.investigation?.mission?.name?.toLowerCase().includes(mission)
      )
        return false;
      if (factor) {
        const hasF = [
          ...(osd.investigation?.factors || []),
          ...((osd.study?.samples || []).flatMap((s) =>
            Object.values(s.factors || {})
          ) as string[]),
        ].some((f) => f?.toString().toLowerCase().includes(factor));
        if (!hasF) return false;
      }
      if (
        assayType &&
        !osd.assays?.some((a) => a.type?.toLowerCase().includes(assayType))
      )
        return false;
      if (
        platform &&
        !osd.assays?.some((a) => a.platform?.toLowerCase().includes(platform))
      )
        return false;
      return true;
    });
  };

  const goToPage = (page: number) => {
    if (activeTab === "articles") {
      fetchArticles({ q: query, ...filters, page }, false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (activeTab === "osds") {
      const start = (page - 1) * PAGE_SIZE;
      const end = start + PAGE_SIZE;
      setVisibleOsds(filteredOsds.slice(start, end));
      setOsdsPage(page);
      setOsdsHasMore(end < filteredOsds.length);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const currentTotalPages =
    activeTab === "articles"
      ? Math.ceil(articlesTotal / PAGE_SIZE)
      : activeTab === "osds"
      ? Math.ceil(filteredOsds.length / PAGE_SIZE)
      : 0;

  const currentPage =
    activeTab === "articles"
      ? articlesPage
      : activeTab === "osds"
      ? osdsPage
      : 1;

  const currentLoading =
    activeTab === "articles"
      ? articlesLoading
      : activeTab === "osds"
      ? osdsLoading
      : false;
  const currentItems =
    activeTab === "articles"
      ? articles
      : activeTab === "osds"
      ? visibleOsds
      : [];
  const currentTotal =
    activeTab === "articles"
      ? articlesTotal
      : activeTab === "osds"
      ? filteredOsds.length
      : 0;

  const filterFields =
    activeTab === "articles"
      ? [
          {
            key: "organism",
            label: "Organism",
            color: "blue",
            options: availableFilters.organisms,
          },
          {
            key: "tissue",
            label: "Tissue",
            color: "green",
            options: availableFilters.tissues,
          },
          {
            key: "treatment",
            label: "Treatment",
            color: "pink",
            options: availableFilters.treatments,
          },
          {
            key: "technology",
            label: "Technology",
            color: "purple",
            options: availableFilters.technologies,
          },
        ]
      : activeTab === "osds"
      ? [
          {
            key: "organism",
            label: "Organism",
            color: "blue",
            options: availableFilters.organisms,
          },
          {
            key: "mission",
            label: "Mission",
            color: "green",
            options: availableFilters.missions,
          },
          {
            key: "factor",
            label: "Factor",
            color: "pink",
            options: availableFilters.factors,
          },
          {
            key: "assayType",
            label: "Assay Type",
            color: "purple",
            options: availableFilters.assayTypes,
          },
          {
            key: "platform",
            label: "Platform",
            color: "amber",
            options: availableFilters.platforms,
          },
        ]
      : []; // Vaults → sem filtros aqui

  const activeFilterCount = Object.values(filters).filter(
    (v) => v && v !== ""
  ).length;

  const colorMap: any = {
    blue: { dot: "bg-blue-400" },
    green: { dot: "bg-green-400" },
    pink: { dot: "bg-pink-400" },
    purple: { dot: "bg-purple-400" },
    amber: { dot: "bg-amber-400" },
  };

  const PaginationControls = () => {
    if (currentTotalPages <= 1) return null;

    const getPageNumbers = () => {
      const pages: (number | string)[] = [];
      const maxVisible = 7;

      if (currentTotalPages <= maxVisible) {
        return Array.from({ length: currentTotalPages }, (_, i) => i + 1);
      }

      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push("...");
        pages.push(currentTotalPages);
      } else if (currentPage >= currentTotalPages - 3) {
        pages.push(1);
        pages.push("...");
        for (let i = currentTotalPages - 4; i <= currentTotalPages; i++)
          pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(currentTotalPages);
      }

      return pages;
    };

    return (
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 my-6 sm:my-8 px-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-xl backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all group"
          >
            <ChevronLeft className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
          </button>

          <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-xl backdrop-blur-xl bg-white/5 border border-white/10">
            {getPageNumbers().map((page, idx) => {
              if (page === "...") {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-1 sm:px-2 text-gray-400 text-xs sm:text-sm"
                  >
                    ...
                  </span>
                );
              }

              const pageNum = page as number;
              const isActive = pageNum === currentPage;

              return (
                <button
                  key={pageNum}
                  onClick={() => goToPage(pageNum)}
                  className={`min-w-[32px] sm:min-w-[40px] px-1.5 sm:px-2 py-1 rounded-lg font-semibold text-xs sm:text-sm transition-all ${
                    isActive
                      ? "bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg scale-105"
                      : "text-gray-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === currentTotalPages}
            className="p-2 rounded-xl backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all group"
          >
            <ChevronRight className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
          </button>
        </div>

        <div className="px-3 sm:px-4 py-1 rounded-xl backdrop-blur-xl bg-white/5 border border-white/10">
          <span className="text-xs sm:text-sm text-gray-300">
            Page <span className="font-bold text-white">{currentPage}</span> of{" "}
            <span className="font-bold text-white">{currentTotalPages}</span>
          </span>
        </div>
      </div>
    );
  };

  const SidebarContent = () => (
    <div className="space-y-4 sm:space-y-6 pb-20 px-2">
      {/* Logo/Title */}
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
            className="w-full pl-10 pr-10 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10"
            >
              <X className="w-3 h-3 text-gray-400" />
            </button>
          )}
        </div>
      </div>

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
                  {filteredOsds.length} items
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
                {/* simple “gap” icon */}
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

        {/* Dica: conecte este botão a uma rota /matches ou a um tab futuro "matches" */}
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

      {/* Filters Toggle (esconde quando Vaults está ativo) */}
      {activeTab !== "vaults" && (
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

              {activeFilterCount > 0 && (
                <button
                  onClick={() => setFilters({})}
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
    </div>
  );

  return (
    <div className="min-h-screen bg-[url('/src/images/background/test.png')] bg-fixed bg-cover bg-center">
      <div className="fixed w-full h-full bg-black/70 top-0 left-0 z-0"></div>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-3 rounded-xl backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/20 transition-all shadow-lg"
      >
        <Menu className="w-6 h-6 text-white" />
        {activeFilterCount > 0 && activeTab !== "vaults" && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-purple-500 text-white text-xs font-bold flex items-center justify-center">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar - Mobile Drawer / Desktop Fixed */}
      <aside
        className={`
          fixed top-0 h-screen overflow-y-auto scrollbar-hide z-40 transition-transform duration-300
          w-80 sm:w-96
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:left-4 xl:left-8
        `}
      >
        <div className="min-h-screen bg-black/40 lg:bg-transparent backdrop-blur-sm lg:backdrop-blur-none p-4 lg:p-0 lg:pt-12">
          {/* Close button for mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute top-4 right-4 lg:hidden p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <SidebarContent />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="relative z-10 lg:ml-80 xl:ml-96 px-4 sm:px-6 lg:px-10 py-16 lg:py-6">
        {/* Branch para VAULTS: usa UI própria e não compartilha a paginação/filtros daqui */}
        {activeTab === "vaults" ? (
          <div className="mb-8">
            <VaultsTab matchesUrl="/api/all_matches" />
          </div>
        ) : activeTab === "matches" ? (
          <div className="mb-8">
            <MatchesTab />
          </div>
        ) : currentLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="p-6 sm:p-8 rounded-3xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl">
              <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 text-blue-400 animate-spin mb-4 mx-auto" />
              <p className="text-gray-200 text-center text-sm sm:text-base">
                Loading...
              </p>
            </div>
          </div>
        ) : currentItems.length === 0 ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="p-8 sm:p-12 rounded-3xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl text-center max-w-md mx-4">
              <Database className="w-16 h-16 sm:w-20 sm:h-20 text-gray-400 mb-4 mx-auto" />
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                No results
              </h3>
              <p className="text-sm sm:text-base text-gray-300">
                Try adjusting your filters
              </p>
            </div>
          </div>
        ) : (
          <>
            {activeTab === "articles" && (
              <div className="mb-6">
                <OrganismBubbleChart articles={allArticles} />
              </div>
            )}

            <PaginationControls />

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-4 sm:gap-6 mb-8">
              {activeTab === "articles"
                ? articles.map((article, idx) => (
                    <div
                      key={`${article.article.title}-${idx}`}
                      className="animate-in fade-in duration-300"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <ArticleCard article={article} index={idx} />
                    </div>
                  ))
                : visibleOsds.map((osd, idx) => (
                    <div
                      key={osd.investigation.id}
                      className="animate-in fade-in duration-300"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <OSDCard osd={osd} />
                    </div>
                  ))}
            </div>

            <div className="pb-20">
              <PaginationControls />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
