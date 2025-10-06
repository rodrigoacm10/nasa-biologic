"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Search, Loader2, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Article } from "@/@types/article";

interface ArticleSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectArticle: (articleId: string) => void;
}

export default function ArticleSelectorModal({
  isOpen,
  onClose,
  onSelectArticle,
}: ArticleSelectorModalProps) {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchArticles();
      document.body.classList.add("overflow-hidden");
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      document.body.classList.remove("overflow-hidden");
      setSearchQuery("");
    }
    return () => document.body.classList.remove("overflow-hidden");
  }, [isOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/articles?limit=9999");
      const data = await response.json();
      setArticles(data.articles || []);
      setFilteredArticles(data.articles || []);
    } catch (error) {
      console.error("Error fetching articles:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredArticles(articles);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = articles.filter((article) => {
      const data = article.article;
      return (
        data.title?.toLowerCase().includes(query) ||
        data.authors?.some((author) => author.toLowerCase().includes(query)) ||
        data.keywords?.some((keyword) =>
          keyword.toLowerCase().includes(query)
        ) ||
        data.experimental_factors?.organism?.toLowerCase().includes(query)
      );
    });
    setFilteredArticles(filtered);
  }, [searchQuery, articles]);

  const handleSelectArticle = (articleId: string) => {
    onSelectArticle(articleId);
    onClose();
  };

  if (!mounted || !isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999]" role="dialog" aria-modal="true">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-[10000] flex items-center justify-center min-h-screen p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="w-full max-w-4xl max-h-[85vh] flex flex-col bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 rounded-3xl border border-white/20 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-black/40 backdrop-blur-xl">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                Select an Article
              </h2>
              <p className="text-sm text-gray-400">
                Choose an article to view its OSD matches
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
          <div className="px-6 py-4 bg-black/20 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search by title, author, keyword, organism..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
            <div className="mt-2 text-sm text-gray-400">
              {filteredArticles.length} article
              {filteredArticles.length !== 1 ? "s" : ""} found
            </div>
          </div>

          {/* Articles List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <FileText className="w-16 h-16 text-gray-600 mb-4" />
                <p className="text-gray-400 text-lg">No articles found</p>
                <p className="text-gray-500 text-sm mt-2">
                  Try adjusting your search query
                </p>
              </div>
            ) : (
              filteredArticles.map((article, idx) => {
                const data = article.article;
                return (
                  <motion.button
                    key={`${data.title}-${idx}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    onClick={() => handleSelectArticle(data.id)}
                    className="w-full text-left p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all group"
                  >
                    <h3 className="text-white font-semibold mb-2 line-clamp-2 group-hover:text-blue-300 transition-colors">
                      {data.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mb-2">
                      <span>{data.year}</span>
                      <span>•</span>
                      <span>{data.authors?.length || 0} authors</span>
                      {data.experimental_factors?.organism && (
                        <>
                          <span>•</span>
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded">
                            {data.experimental_factors.organism}
                          </span>
                        </>
                      )}
                    </div>
                    {data.keywords && data.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {data.keywords.slice(0, 3).map((keyword, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-white/10 text-gray-300 rounded text-xs"
                          >
                            {keyword}
                          </span>
                        ))}
                        {data.keywords.length > 3 && (
                          <span className="px-2 py-0.5 text-gray-400 text-xs">
                            +{data.keywords.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </motion.button>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
