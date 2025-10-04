'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Article } from '@/@types/article';
import SearchBar from '@/app/components/SearchBar';
import ArticleCard from '@/app/components/ArticleCard';
import { Loader2, Database, Rocket, ChevronDown } from 'lucide-react';

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
      // Fetch first page to get filters
      const response = await fetch('/api/articles?page=1&limit=12');
      const data: ArticlesResponse = await response.json();
      
      setArticles(data.articles);
      setTotal(data.total);
      setHasMore(data.hasMore);
      setPage(1);
      
      // Fetch all articles for filters (sem paginação)
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <Rocket className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">NASA Research Catalog</h1>
              <p className="text-sm text-gray-600">Explore space biology and life science experiments</p>
            </div>
          </div>
        </div>
      </header>

      <SearchBar onSearch={handleSearch} availableFilters={availableFilters} />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-600">Loading articles...</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Database className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No articles found</h3>
            <p className="text-gray-600 text-center max-w-md">
              Try adjusting your search filters or search terms to find what you're looking for.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-900">{articles.length}</span> of{' '}
                <span className="font-semibold text-gray-900">{total}</span> articles
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            )}
            
            {!hasMore && articles.length > 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>You've reached the end! 🎉</p>
                <p className="text-sm mt-1">All {total} articles loaded</p>
              </div>
            )}
            
            {hasMore && !loadingMore && (
              <div className="flex justify-center py-8">
                <button
                  onClick={loadMoreArticles}
                  className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-700"
                >
                  <ChevronDown className="w-5 h-5" />
                  Load more articles
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}