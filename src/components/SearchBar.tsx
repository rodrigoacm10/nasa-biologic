'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Filter, X, ChevronDown } from 'lucide-react';

interface SearchBarProps {
  onSearch: (params: SearchParams) => void;
  availableFilters: FilterOptions;
}

interface SearchParams {
  query: string;
  organism: string;
  tissue: string;
  treatment: string;
  technology: string;
}

interface FilterOptions {
  organisms: string[];
  tissues: string[];
  treatments: string[];
  technologies: string[];
}

export default function SearchBar({ onSearch, availableFilters }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Omit<SearchParams, 'query'>>({
    organism: '',
    tissue: '',
    treatment: '',
    technology: '',
  });

  // Use ref to avoid dependency issues
  const onSearchRef = useRef(onSearch);
  
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  // Debounced search effect - sem onSearch nas dependências
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const searchParams = { 
        query: query.trim(), 
        ...filters 
      };
      onSearchRef.current(searchParams);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, filters]); // Removido onSearch daqui

  const clearFilter = useCallback((filterType: keyof typeof filters) => {
    setFilters(prev => ({ ...prev, [filterType]: '' }));
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters({
      organism: '',
      tissue: '',
      treatment: '',
      technology: '',
    });
  }, []);

  const activeFiltersCount = Object.values(filters).filter(v => v).length;

  return (
    <div className="sticky top-12 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="relative">
          {/* Search Input & Filter Button */}
          <div className="flex flex-col items-center justify-center sm:flex-row gap-3">
            <div className="relative w-full max-w-180">
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none z-20" />
              <input
                type="text"
                placeholder="Search articles, organisms, tissues, treatments..."
                className="w-full pl-4 pr-12 py-3 sm:py-3.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-4xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 transition-all shadow-lg"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-5 sm:px-4 py-3 sm:py-3.5 rounded-4xl border transition-all flex items-center justify-center gap-2 font-medium shadow-lg ${
                showFilters || activeFiltersCount > 0
                  ? 'bg-blue-500/30 border-blue-400/50 text-blue-100 hover:bg-blue-500/40'
                  : 'bg-white/10 backdrop-blur-md border-white/20 text-gray-200 hover:bg-white/20'
              }`}
            >
              <Filter className="w-5 h-5" />
              <span className="hidden sm:inline">Filters</span>
              {activeFiltersCount > 0 && (
                <span className="flex items-center justify-center min-w-[20px] h-5 bg-blue-500 text-white text-xs font-bold px-1.5 rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="absolute top-full left-0 right-0 mt-3 p-5 sm:p-6 rounded-2xl backdrop-blur-xl bg-black/80 border border-white/20 shadow-2xl space-y-4 z-50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Organism Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-300 uppercase tracking-wide flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                    Organism ({availableFilters.organisms.length})
                  </label>
                  <div className="relative">
                    <select
                      value={filters.organism}
                      onChange={(e) => setFilters(prev => ({ ...prev, organism: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer transition-all hover:bg-white/15"
                    >
                      <option value="" className="bg-gray-800">All organisms</option>
                      {availableFilters.organisms.map(org => (
                        <option key={org} value={org} className="bg-gray-800">{org}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                
                {/* Tissue Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-300 uppercase tracking-wide flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    Tissue ({availableFilters.tissues.length})
                  </label>
                  <div className="relative">
                    <select
                      value={filters.tissue}
                      onChange={(e) => setFilters(prev => ({ ...prev, tissue: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 appearance-none cursor-pointer transition-all hover:bg-white/15"
                    >
                      <option value="" className="bg-gray-800">All tissues</option>
                      {availableFilters.tissues.map(tissue => (
                        <option key={tissue} value={tissue} className="bg-gray-800">{tissue}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                
                {/* Treatment Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-300 uppercase tracking-wide flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-pink-400"></div>
                    Treatment ({availableFilters.treatments.length})
                  </label>
                  <div className="relative">
                    <select
                      value={filters.treatment}
                      onChange={(e) => setFilters(prev => ({ ...prev, treatment: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50 appearance-none cursor-pointer transition-all hover:bg-white/15"
                    >
                      <option value="" className="bg-gray-800">All treatments</option>
                      {availableFilters.treatments.map(treatment => (
                        <option key={treatment} value={treatment} className="bg-gray-800">{treatment}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                
                {/* Technology Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-300 uppercase tracking-wide flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                    Technology ({availableFilters.technologies.length})
                  </label>
                  <div className="relative">
                    <select
                      value={filters.technology}
                      onChange={(e) => setFilters(prev => ({ ...prev, technology: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none cursor-pointer transition-all hover:bg-white/15"
                    >
                      <option value="" className="bg-gray-800">All technologies</option>
                      {availableFilters.technologies.map(tech => (
                        <option key={tech} value={tech} className="bg-gray-800">{tech}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
              
              {/* Clear All Button */}
              {activeFiltersCount > 0 && (
                <div className="pt-3 border-t border-white/10">
                  <button
                    onClick={clearAllFilters}
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

        {/* Active Filter Pills */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {Object.entries(filters).map(([key, value]) => 
              value && (
                <span
                  key={key}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/30 backdrop-blur-md border border-blue-400/30 text-blue-100 text-sm rounded-full shadow-lg"
                >
                  <span className="text-xs font-semibold uppercase opacity-70">{key}:</span>
                  <span className="font-medium">{value}</span>
                  <button
                    onClick={() => clearFilter(key as keyof typeof filters)}
                    className="ml-1 hover:bg-blue-400/30 rounded-full p-0.5 transition-colors"
                    aria-label={`Remove ${key} filter`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}