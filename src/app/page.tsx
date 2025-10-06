"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { Article } from "@/@types/article";
import { Loader2, Database, Menu, X } from "lucide-react";
import { ensureAllOsdsCached } from "@/lib/osds-cache";
import ArticleCard from "@/components/ArticleCard";
import OSDCard from "@/components/OSDCard";
import OrganismBubbleChart from "@/components/graphs/OrganismBubbleChart";
import MatchesTab from "@/components/MatchTab";
import SidebarContent from "@/components/SideBarContent";
import PaginationControls from "@/components/PaginationControls";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [articlesTotal, setArticlesTotal] = useState(0);
  const [articlesPage, setArticlesPage] = useState(1);

  const [allOsds, setAllOsds] = useState<OSD[]>([]);
  const [osdsLoading, setOsdsLoading] = useState(true);
  const [filteredOsds, setFilteredOsds] = useState<OSD[]>([]);
  const [visibleOsds, setVisibleOsds] = useState<OSD[]>([]);
  const [osdsPage, setOsdsPage] = useState(1);

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

  const handleSearch = () => {
    if (activeTab === "articles") {
      fetchArticles({ q: query, ...filters }, true);
    } else if (activeTab === "osds") {
      const filtered = filterOSDs(allOsds, { q: query, ...filters });
      setFilteredOsds(filtered);
      setVisibleOsds(filtered.slice(0, PAGE_SIZE));
      setOsdsPage(1);
    }
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
      : [];

  const activeFilterCount = Object.values(filters).filter(
    (v) => v && v !== ""
  ).length;

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

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 h-screen overflow-y-auto scrollbar-hide z-40 transition-transform duration-300
          w-80 sm:w-96
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:left-4 xl:left-8
        `}
      >
        <div className="min-h-screen bg-black/40 lg:bg-transparent backdrop-blur-sm lg:backdrop-blur-none p-4 lg:p-0 lg:pt-12">
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute top-4 right-4 lg:hidden p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <SidebarContent
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            setSidebarOpen={setSidebarOpen}
            query={query}
            setQuery={setQuery}
            filters={filters}
            setFilters={setFilters}
            handleSearch={handleSearch}
            articlesTotal={articlesTotal}
            filteredOsdsLength={filteredOsds.length}
            filterFields={filterFields}
            activeFilterCount={activeFilterCount}
          />
        </div>
      </aside>

      {/* Main Content */}
      <main className="relative z-10 lg:ml-80 xl:ml-96 px-4 sm:px-6 lg:px-10 py-16 lg:py-6">
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

            <PaginationControls
              currentPage={currentPage}
              totalPages={currentTotalPages}
              onPageChange={goToPage}
            />

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
              <PaginationControls
                currentPage={currentPage}
                totalPages={currentTotalPages}
                onPageChange={goToPage}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}