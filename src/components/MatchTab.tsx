"use client";

import { useState, useEffect } from "react";
import { Loader2, Link2, Eye } from "lucide-react";
import ArticleSelectorModal from "./ArticleSelectorModal";
import ModalRelation from "./ModalRelation";
import { Article } from "@/@types/article";
import { ArticleMatches } from "@/app/article/[id]/page";

export default function MatchesTab() {
  const [showSelector, setShowSelector] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<
    Article["article"] | null
  >(null);
  const [matches, setMatches] = useState<ArticleMatches | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setShowSelector(true);
  }, []);

  const handleSelectArticle = async (articleId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/articles/${articleId}`);
      const data = await res.json();
      setSelectedArticle(data.article);
      setMatches(data.matches || null);
    } catch (err) {
      console.error("Error fetching article:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedArticle(null);
    setMatches(null);
    setShowSelector(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="p-8 rounded-2xl backdrop-blur-sm bg-white/5 border border-white/10">
          <Loader2 className="w-10 h-10 text-white/70 animate-spin mb-3 mx-auto" />
          <p className="text-white/80 text-center text-sm">
            Loading article matches…
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ArticleSelectorModal
        isOpen={showSelector}
        onClose={() => setShowSelector(false)}
        onSelectArticle={handleSelectArticle}
      />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {selectedArticle ? (
          <div className="space-y-8">
            {/* Header do Artigo — minimal */}
            <div className="rounded-2xl border border-white/10 bg-yellow-200/5 backdrop-blur-sm p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">
                    <span className="text-[11px] uppercase tracking-wide text-white/70">
                      Selected Article
                    </span>
                  </div>
                  <h2 className="mt-3 text-2xl md:text-3xl font-semibold text-white leading-snug">
                    {selectedArticle.title}
                  </h2>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-white/70">
                    <span>{selectedArticle.year}</span>
                    {selectedArticle.authors?.length ? (
                      <>
                        <span>•</span>
                        <span>{selectedArticle.authors.length} authors</span>
                      </>
                    ) : null}
                    {selectedArticle.experimental_factors?.organism && (
                      <>
                        <span>•</span>
                        <span className="px-2 py-0.5 rounded-md bg-yellow-400/10 border border-white/10 text-white/80">
                          {selectedArticle.experimental_factors.organism}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleReset}
                  className="self-start inline-flex max-w-fit items-center gap-2 rounded-lg border border-white/10 bg-yellow-400/10 hover:bg-white/10 text-white/80 px-3 py-2 text-sm transition"
                >
                  <Link2 className="w-4 h-4" />
                  Change Article
                </button>
              </div>
            </div>

            {/* CTA em destaque — líquido sutil (/5–/10) */}
            {matches && matches.osd_matches?.length > 0 && (
              <ModalRelation article={selectedArticle} osdMathces={matches}>
                <div className="rounded-2xl border-2 border-white/15 bg-yellow-200/5 hover:bg-white/10 backdrop-blur-sm transition p-6 md:p-8">
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-yellow-500/5 border border-white/10">
                      <span className="text-[11px] uppercase tracking-wide text-white/70">
                        Interactive
                      </span>
                    </div>

                    <h3 className="text-2xl md:text-3xl font-semibold text-white">
                      Open Relationship Map
                    </h3>

                    <p className="text-white/70 text-sm md:text-base max-w-2xl">
                      Explore how this article connects to{" "}
                      <span className="text-white font-medium">
                        {matches.matches_found}
                      </span>{" "}
                      OSD dataset{matches.matches_found !== 1 ? "s" : ""}.
                    </p>

                    <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 hover:bg-white/20 px-5 py-3 transition text-white font-medium">
                      <Eye className="w-5 h-5" />
                      Open Map
                    </div>

                    {/* mini stats, minimal */}
                    <div className="flex flex-wrap justify-center gap-2 pt-2">
                      <span className="text-xs md:text-sm text-white/70 px-3 py-1 rounded-full border border-white/10 bg-white/5">
                        {matches.matches_found} matches
                      </span>
                      <span className="text-xs md:text-sm text-white/70 px-3 py-1 rounded-full border border-white/10 bg-white/5">
                        {matches.total_osds_compared} OSDs compared
                      </span>
                      <span className="text-xs md:text-sm text-white/70 px-3 py-1 rounded-full border border-white/10 bg-white/5">
                        {(
                          (matches.matches_found /
                            matches.total_osds_compared) *
                          100
                        ).toFixed(1)}
                        % rate
                      </span>
                    </div>
                  </div>
                </div>
              </ModalRelation>
            )}

            {/* Aviso simples quando não há conexões */}
            {matches &&
              (!matches.osd_matches || matches.osd_matches.length === 0) && (
                <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 text-center">
                  <p className="text-white/80 font-medium">
                    No OSD connections found for this article.
                  </p>
                  <p className="text-white/60 text-sm mt-1">
                    Try selecting another article.
                  </p>
                </div>
              )}
          </div>
        ) : (
          // Estado vazio — minimal
          !showSelector && (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center p-10 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm max-w-md">
                <h3 className="text-xl font-semibold text-white mb-2">
                  No Article Selected
                </h3>
                <p className="text-white/70 mb-6 text-sm">
                  Select an article to explore its OSD connections.
                </p>
                <button
                  onClick={() => setShowSelector(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 hover:bg-white/20 text-white px-4 py-2 transition"
                >
                  <Link2 className="w-4 h-4" />
                  Select an Article
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </>
  );
}
