'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Article } from '@/@types/article';
import SearchBar from '@/components/SearchBar';
import ArticleCard from '@/components/ArticleCard';
import { Loader2, Database, Rocket } from 'lucide-react';

interface ArticlesResponse {
  articles: Article[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [searchParams, setSearchParams] = useState<any>({});
  const [availableFilters, setAvailableFilters] = useState({
    organisms: [] as string[],
    tissues: [] as string[],
    treatments: [] as string[],
    technologies: [] as string[],
  });
  
  const observer = useRef<IntersectionObserver | null>(null);
  const lastArticleElementRef = useCallback((node: HTMLDivElement) => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreArticles();
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/articles?page=1&limit=12');
      const data: ArticlesResponse = await response.json();
      
      setArticles(data.articles);
      setTotal(data.total);
      setHasMore(data.hasMore);
      setPage(1);
      
      const allResponse = await fetch('/api/articles?limit=1000');
      const allData: ArticlesResponse = await allResponse.json();
      extractFilters(allData.articles);
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchArticles = async (params: any, resetPage: boolean = true) => {
    if (resetPage) {
      setLoading(true);
      setPage(1);
      setArticles([]);
    }
    
    try {
      const queryParams = { ...params, page: resetPage ? 1 : page + 1, limit: 12 };
      const queryString = new URLSearchParams(queryParams).toString();
      const response = await fetch(`/api/articles?${queryString}`);
      const data: ArticlesResponse = await response.json();
      
      if (resetPage) {
        setArticles(data.articles);
      } else {
        setArticles(prev => [...prev, ...data.articles]);
      }
      
      setTotal(data.total);
      setHasMore(data.hasMore);
      setPage(data.page);
      setSearchParams(params);
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreArticles = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await fetchArticles(searchParams, false);
  };

  const extractFilters = (articles: Article[]) => {
    const organisms = new Set<string>();
    const tissues = new Set<string>();
    const treatments = new Set<string>();
    const technologies = new Set<string>();

    articles.forEach(article => {
      if (article.article.experimental_factors.organism) {
        organisms.add(article.article.experimental_factors.organism);
      }
      article.article.experimental_factors.tissue_list?.forEach(t => tissues.add(t));
      article.article.experimental_factors.treatment_list?.forEach(t => treatments.add(t));
      article.article.technologies?.forEach(t => technologies.add(t));
    });

    setAvailableFilters({
      organisms: Array.from(organisms).sort(),
      tissues: Array.from(tissues).sort(),
      treatments: Array.from(treatments).sort(),
      technologies: Array.from(technologies).sort(),
    });
  };

  const handleSearch = (params: any) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== '')
    );
    fetchArticles(cleanParams, true);
  };

  return (
    <div className="min-h-screen bg-[url('/src/images/background/test.png')] bg-fixed bg-cover bg-center">
      <div className="fixed w-full h-full bg-black/70 top-0 left-0 z-0"></div>
      
      <div className="relative pt-18 z-10">
        {/* Header */}
        {/* <header className="backdrop-blur-md bg-black/30 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl sm:rounded-2xl shadow-lg">
                <Rocket className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white font-bricolage">
                  NASA Research Catalog
                </h1>
                <p className="text-xs sm:text-sm text-gray-300">
                  Explore space biology and life science experiments
                </p>
              </div>
            </div>
          </div>
        </header> */}

        <SearchBar onSearch={handleSearch} availableFilters={availableFilters} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 sm:py-32">
              <div className="p-6 rounded-3xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl">
                <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 text-blue-400 animate-spin mb-4" />
                <p className="text-gray-200 text-sm sm:text-base">Loading articles...</p>
              </div>
            </div>
          ) : articles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 sm:py-32">
              <div className="p-8 sm:p-12 rounded-3xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl text-center max-w-md">
                <Database className="w-16 h-16 sm:w-20 sm:h-20 text-gray-400 mb-4 mx-auto" />
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                  No articles found
                </h3>
                <p className="text-sm sm:text-base text-gray-300">
                  Try adjusting your search filters or search terms to find what you're looking for.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6 px-4 py-3 rounded-2xl backdrop-blur-md bg-white/10 border border-white/20 shadow-lg">
                <p className="text-sm sm:text-base text-gray-200">
                  Showing{' '}
                  <span className="font-bold text-white bg-blue-500/30 px-2 py-0.5 rounded">
                    {articles.length}
                  </span>{' '}
                  of{' '}
                  <span className="font-bold text-white bg-purple-500/30 px-2 py-0.5 rounded">
                    {total}
                  </span>{' '}
                  articles
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {articles.map((article, index) => (
                  <div 
                    key={`${article.article.title}-${index}`}
                    ref={index === articles.length - 1 ? lastArticleElementRef : undefined}
                  >
                    <ArticleCard article={article} index={index} />
                  </div>
                ))}
              </div>
              
              {loadingMore && (
                <div className="flex justify-center items-center py-8">
                  <div className="p-4 rounded-2xl backdrop-blur-md bg-white/10 border border-white/20">
                    <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                  </div>
                </div>
              )}
              
              {!hasMore && articles.length > 0 && (
                <div className="text-center py-8">
                  <div className="inline-block px-6 py-4 rounded-2xl backdrop-blur-md bg-white/10 border border-white/20">
                    <p className="text-white font-medium">You've reached the end! 🎉</p>
                    <p className="text-sm text-gray-300 mt-1">All {total} articles loaded</p>
                  </div>
                </div>
              )}
              
              {hasMore && !loadingMore && (
                <div className="flex justify-center py-8">
                  <button
                    onClick={loadMoreArticles}
                    className="px-6 py-3 rounded-2xl backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/30 transition-all text-white font-medium shadow-lg hover:shadow-xl"
                  >
                    Load more articles
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