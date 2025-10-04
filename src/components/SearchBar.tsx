'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';

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

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      onSearch({ query, ...filters });
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, filters]);

  const clearFilter = (filterType: keyof typeof filters) => {
    setFilters({ ...filters, [filterType]: '' });
  };

  const activeFiltersCount = Object.values(filters).filter(v => v).length;

  return (
    <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search articles, organisms, tissues, treatments..."
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 rounded-xl border transition-all flex items-center gap-2 ${
                showFilters || activeFiltersCount > 0
                  ? 'bg-blue-50 border-blue-200 text-blue-600'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Filter className="w-5 h-5" />
              {activeFiltersCount > 0 && (
                <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-white rounded-xl shadow-lg border border-gray-100 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Organism</label>
                  <select
                    value={filters.organism}
                    onChange={(e) => setFilters({ ...filters, organism: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All organisms</option>
                    {availableFilters.organisms.map(org => (
                      <option key={org} value={org}>{org}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Tissue</label>
                  <select
                    value={filters.tissue}
                    onChange={(e) => setFilters({ ...filters, tissue: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All tissues</option>
                    {availableFilters.tissues.map(tissue => (
                      <option key={tissue} value={tissue}>{tissue}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Treatment</label>
                  <select
                    value={filters.treatment}
                    onChange={(e) => setFilters({ ...filters, treatment: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All treatments</option>
                    {availableFilters.treatments.map(treatment => (
                      <option key={treatment} value={treatment}>{treatment}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Technology</label>
                  <select
                    value={filters.technology}
                    onChange={(e) => setFilters({ ...filters, technology: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All technologies</option>
                    {availableFilters.technologies.map(tech => (
                      <option key={tech} value={tech}>{tech}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => setFilters({ organism: '', tissue: '', treatment: '', technology: '' })}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>

        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {Object.entries(filters).map(([key, value]) => 
              value && (
                <span
                  key={key}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-sm rounded-full"
                >
                  <span className="text-xs font-medium">{key}:</span>
                  {value}
                  <button
                    onClick={() => clearFilter(key as keyof typeof filters)}
                    className="ml-1 hover:bg-blue-100 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
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