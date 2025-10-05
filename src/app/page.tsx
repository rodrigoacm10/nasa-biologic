'use client';

import { useState, useEffect, useMemo } from 'react';
import { Article } from '@/@types/article';
import { Loader2, Database, FileText, FlaskConical, Sparkles, Search, X, Filter, ChevronDown } from 'lucide-react';
import { ensureAllOsdsCached } from '@/lib/osds-cache';
import ArticleCard from '@/components/ArticleCard';
import OSDCard from '@/components/OSDCard';

type CatalogType = 'articles' | 'osds';

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
    mission?: { name?: string; start_date?: string; end_date?: string; link?: string };
    project?: { identifier?: string; title?: string; type?: string; link?: string; managing_center?: string };
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
  const [activeTab, setActiveTab] = useState<CatalogType>('articles');
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<any>({});
  const [showFilters, setShowFilters] = useState(false);
  
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
      if (activeTab === 'articles') {
        fetchArticles({ q: query, ...filters }, true);
      } else {
        const filtered = filterOSDs(allOsds, { q: query, ...filters });
        setFilteredOsds(filtered);
        setVisibleOsds(filtered.slice(0, PAGE_SIZE));
        setOsdsPage(1);
        setOsdsHasMore(filtered.length > PAGE_SIZE);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [query, filters, activeTab, allOsds]);

  useEffect(() => {
    setQuery('');
    setFilters({});
  }, [activeTab]);

  const availableFilters = useMemo(() => {
    if (activeTab === 'articles') {
      const organisms = new Set<string>();
      const tissues = new Set<string>();
      const treatments = new Set<string>();
      const technologies = new Set<string>();

      allArticles.forEach(article => {
        const data = article.article;
        if (data?.experimental_factors?.organism) {
          organisms.add(data.experimental_factors.organism);
        }
        data?.experimental_factors?.tissue_list?.forEach((t: string) => tissues.add(t));
        data?.experimental_factors?.treatment_list?.forEach((t: string) => treatments.add(t));
        data?.technologies?.forEach((t: string) => technologies.add(t));
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

      allOsds.forEach(osd => {
        osd.study?.samples?.forEach((s: any) => {
          if (s.characteristics?.Organism) organisms.add(s.characteristics.Organism);
          Object.values(s.factors || {}).forEach(v => v && factors.add(String(v)));
        });
        osd.investigation?.factors?.forEach((f: string) => f && factors.add(f));
        if (osd.investigation?.mission?.name) missions.add(osd.investigation.mission.name);
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
  }, [activeTab, articles, allOsds]);

  const fetchArticles = async (params = {}, resetPage = true) => {
    if (resetPage) {
      setArticlesLoading(true);
      setArticlesPage(1);
      setArticles([]);
    }
    
    try {
      const queryParams = { ...params, page: resetPage ? 1 : articlesPage + 1, limit: PAGE_SIZE };
      const queryString = new URLSearchParams(
      Object.entries(queryParams)
        .filter(([_, v]) => v !== undefined && v !== null && v.toString() !== '')
        .map(([k, v]) => [k, String(v)]) // 👈 converte para string
    ).toString();
      
      const response = await fetch(`/api/articles?${queryString}`);
      const data: ArticlesResponse = await response.json();
      
      if (resetPage) {
        setArticles(data.articles);
      } else {
        setArticles(prev => [...prev, ...data.articles]);
      }
      
      setArticlesTotal(data.total);
      setArticlesHasMore(data.hasMore);
      setArticlesPage(data.page);
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setArticlesLoading(false);
    }
  };

  const fetchOSDs = async () => {
    setOsdsLoading(true);
    try {
      const data = await ensureAllOsdsCached('/api/osds');
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
    const q = params.q?.toLowerCase() || '';
    const org = params.organism?.toLowerCase() || '';
    const mission = params.mission?.toLowerCase() || '';
    const factor = params.factor?.toLowerCase() || '';
    const assayType = params.assayType?.toLowerCase() || '';
    const platform = params.platform?.toLowerCase() || '';

    return osds.filter(osd => {
      if (q) {
        const blob = [
          osd.investigation?.id,
          osd.investigation?.title,
          osd.investigation?.description,
        ].join(' ').toLowerCase();
        if (!blob.includes(q)) return false;
      }
      if (org && !osd.study?.samples?.some(s => s.characteristics?.Organism?.toLowerCase().includes(org))) return false;
      if (mission && !osd.investigation?.mission?.name?.toLowerCase().includes(mission)) return false;
      if (factor) {
        const hasF = [...(osd.investigation?.factors || []), 
          ...osd.study?.samples?.flatMap(s => Object.values(s.factors || {})) || []
        ].some(f => f?.toString().toLowerCase().includes(factor));
        if (!hasF) return false;
      }
      if (assayType && !osd.assays?.some(a => a.type?.toLowerCase().includes(assayType))) return false;
      if (platform && !osd.assays?.some(a => a.platform?.toLowerCase().includes(platform))) return false;
      return true;
    });
  };

  const loadMore = () => {
    if (activeTab === 'articles') {
      fetchArticles({ q: query, ...filters }, false);
    } else {
      const nextPage = osdsPage + 1;
      const slice = filteredOsds.slice(0, nextPage * PAGE_SIZE);
      setVisibleOsds(slice);
      setOsdsPage(nextPage);
      setOsdsHasMore(slice.length < filteredOsds.length);
    }
  };

  const currentLoading = activeTab === 'articles' ? articlesLoading : osdsLoading;
  const currentItems = activeTab === 'articles' ? articles : visibleOsds;
  const currentTotal = activeTab === 'articles' ? articlesTotal : filteredOsds.length;
  const currentHasMore = activeTab === 'articles' ? articlesHasMore : osdsHasMore;

  const filterFields = activeTab === 'articles' ? [
    { key: 'organism', label: 'Organism', color: 'blue', options: availableFilters.organisms },
    { key: 'tissue', label: 'Tissue', color: 'green', options: availableFilters.tissues },
    { key: 'treatment', label: 'Treatment', color: 'pink', options: availableFilters.treatments },
    { key: 'technology', label: 'Technology', color: 'purple', options: availableFilters.technologies },
  ] : [
    { key: 'organism', label: 'Organism', color: 'blue', options: availableFilters.organisms },
    { key: 'mission', label: 'Mission', color: 'green', options: availableFilters.missions },
    { key: 'factor', label: 'Factor', color: 'pink', options: availableFilters.factors },
    { key: 'assayType', label: 'Assay Type', color: 'purple', options: availableFilters.assayTypes },
    { key: 'platform', label: 'Platform', color: 'amber', options: availableFilters.platforms },
  ];

  const activeFilterCount = Object.values(filters).filter(v => v && v !== '').length;

  const colorMap: any = {
    blue: { dot: 'bg-blue-400' },
    green: { dot: 'bg-green-400' },
    pink: { dot: 'bg-pink-400' },
    purple: { dot: 'bg-purple-400' },
    amber: { dot: 'bg-amber-400' },
  };

  return (
    <div className="min-h-screen bg-[url('/src/images/background/test.png')] bg-fixed bg-cover bg-center">
      <div className="fixed w-full h-full bg-black/70 top-0 left-0 z-0"></div>
      
      <div className="relative z-10 flex min-h-screen px-18">
        {/* Floating Sidebar */}
        <aside className="fixed left-8 top-12 h-screen w-80 lg:w-96 overflow-y-auto scrollbar-hide">
          <div className="space-y-6 pb-20 px-2">
            {/* Logo/Title */}
            <div className="p-6 rounded-3xl backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div>
                  <h1 className="text-2xl font-bold font-bricolage text-white">Nacle</h1>
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
                  onChange={e => setQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
                {query && (
                  <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10">
                    <X className="w-3 h-3 text-gray-400" />
                  </button>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="space-y-2">
              <button
                onClick={() => setActiveTab('articles')}
                className={`w-full p-4 rounded-2xl backdrop-blur-xl border transition-all ${
                  activeTab === 'articles'
                    ? 'bg-gradient-to-br from-green-200/10 to-green-500/30 border-white/20 shadow-xl scale-102'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg">
                      <FileText className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-bold text-white">Research Articles</div>
                      <div className="text-xs text-gray-300">{articlesTotal} items</div>
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('osds')}
                className={`w-full p-4 rounded-2xl backdrop-blur-xl border transition-all ${
                  activeTab === 'osds'
                    ? 'bg-gradient-to-br from-blue-200/10 to-blue-500/30 border-white/20 shadow-xl scale-102'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white/10 border border-gray-200/30">
                      <FlaskConical className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-bold text-white">OSD Datasets</div>
                      <div className="text-xs text-gray-300">{filteredOsds.length} items</div>
                    </div>
                  </div>
                </div>
              </button>
            </div>

            {/* Filters Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`w-full p-4 rounded-2xl backdrop-blur-xl border transition-all flex items-center justify-between ${
                showFilters || activeFilterCount > 0
                  ? 'bg-gradient-to-br from-red-200/10 to-red-500/20 border-white/20'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
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
              <div className="space-y-4 p-5 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 animate-in fade-in slide-in-from-left duration-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wide flex items-center gap-2">
                    Advanced Filters
                  </h3>
                </div>

                {filterFields.map(field => {
                  const colors = colorMap[field.color];
                  return (
                    <div key={field.key} className="space-y-2">
                      <label className="text-xs font-semibold text-gray-300 uppercase tracking-wide flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${colors.dot}`}></div>
                        {field.label} ({field.options?.length || 0})
                      </label>
                      <div className="relative">
                        <select
                          value={filters[field.key] || ''}
                          onChange={e => setFilters({ ...filters, [field.key]: e.target.value || undefined })}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none cursor-pointer"
                        >
                          <option value="" className="bg-gray-800">All {field.label.toLowerCase()}s</option>
                          {field.options?.map((opt: string) => (
                            <option key={opt} value={opt} className="bg-gray-800">{opt}</option>
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

          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 ml-80 lg:ml-96 p-6 lg:p-10">
          {currentLoading ? (
            <div className="flex items-center justify-center min-h-screen">
              <div className="p-8 rounded-3xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl">
                <Loader2 className="w-16 h-16 text-blue-400 animate-spin mb-4 mx-auto" />
                <p className="text-gray-200 text-center">Loading...</p>
              </div>
            </div>
          ) : currentItems.length === 0 ? (
            <div className="flex items-center justify-center min-h-screen">
              <div className="p-12 rounded-3xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl text-center max-w-md">
                <Database className="w-20 h-20 text-gray-400 mb-4 mx-auto" />
                <h3 className="text-xl font-semibold text-white mb-2">No results</h3>
                <p className="text-gray-300">Try adjusting your filters</p>
              </div>
            </div>
          ) : (
            <>
            <div className="flex w-full">
              <div className="inline-flex items-center mb-5">
                <div className="text-xl font-bold text-white mr-2">{currentItems.length}</div>
                <div className="text-xs text-gray-400">of {currentTotal} total</div>
              </div>
            </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6 mb-8">
                {activeTab === 'articles' ? (
                  articles.map((article, idx) => (
                    <div key={`${article.article.title}-${idx}`} className="animate-in fade-in duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                      <ArticleCard article={article} index={idx} />
                    </div>
                  ))
                ) : (
                  visibleOsds.map((osd, idx) => (
                    <div key={osd.investigation.id} className="animate-in fade-in duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                      <OSDCard osd={osd} />
                    </div>
                  ))
                )}
              </div>

              {currentHasMore && (
                <div className="flex justify-center pb-20">
                  <button
                    onClick={loadMore}
                    className="group px-8 py-4 rounded-2xl backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/30 hover:border-white/40 transition-all text-white font-semibold shadow-xl hover:shadow-2xl hover:scale-105"
                  >
                    <span className="flex items-center gap-2">
                      Load more
                    </span>
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}