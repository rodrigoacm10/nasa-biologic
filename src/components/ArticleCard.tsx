"use client";

import { Article } from "@/@types/article";
import {
  Calendar,
  Users,
  Dna,
  Microscope,
  ChevronRight,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ArticleCardProps {
  article: Article;
  index: number;
}

export default function ArticleCard({ article, index }: ArticleCardProps) {
  const router = useRouter();
  const { article: data } = article;
  const articleId = data.id || (index + 1).toString();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();

    const card = e.currentTarget as HTMLElement;
    const rect = card.getBoundingClientRect();

    sessionStorage.setItem(
      "cardAnimation",
      JSON.stringify({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      })
    );

    card.style.transition = "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
    card.style.transform = "scale(0.98)";

    if ("startViewTransition" in document) {
      (document as any).startViewTransition(() => {
        router.push(`/article/${articleId}`);
      });
    } else {
      setTimeout(() => {
        router.push(`/article/${articleId}`);
      }, 300);
    }
  };

  return (
    <div
      onClick={handleClick}
      style={{ viewTransitionName: `article-${articleId}` }}
      className="group relative overflow-hidden rounded-2xl h-full sm:rounded-3xl backdrop-blur-xl bg-white/10 border border-white/20 hover:border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col" // 👈 adiciona flex-col
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-all duration-500 pointer-events-none" />

      <div className="relative p-5 sm:p-6 space-y-4 flex-1 flex flex-col">
        {/* Title */}
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white line-clamp-2 group-hover:text-blue-300 transition-colors leading-tight">
            {data.title}
          </h3>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs sm:text-sm text-gray-300">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {data.year}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {data.authors.length} authors
            </span>
          </div>
        </div>

        {/* Abstract */}
        <p className="text-xs sm:text-sm text-gray-300/90 line-clamp-3 leading-relaxed">
          {data.abstract}
        </p>

        {/* Experimental Factors */}
        <div className="space-y-2">
          {data.experimental_factors.organism && (
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-500/30">
                <Dna className="w-3.5 h-3.5 text-blue-200" />
              </div>
              <span className="text-xs sm:text-sm text-white font-medium truncate">
                {data.experimental_factors.organism}
                {data.experimental_factors.organism.toLowerCase() !==
                  data.experimental_factors.organism_raw.toLowerCase() && (
                  <span className="text-xs text-gray-400 ml-2">
                    ({data.experimental_factors.organism_raw})
                  </span>
                )}
              </span>
            </div>
          )}

          {data.experimental_factors.tissue_list.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-green-500/30">
                <Layers className="w-3.5 h-3.5 text-green-200" />
              </div>
              <span className="text-xs sm:text-sm text-gray-300 truncate">
                {data.experimental_factors.tissue_list.slice(0, 2).join(", ")}
                {data.experimental_factors.tissue_list.length > 2 &&
                  ` +${data.experimental_factors.tissue_list.length - 2}`}
              </span>
            </div>
          )}

          {data.experimental_factors.treatment_list.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-500/30">
                <Microscope className="w-3.5 h-3.5 text-purple-200" />
              </div>
              <span className="text-xs sm:text-sm text-gray-300 truncate">
                {data.experimental_factors.treatment_list[0]}
                {data.experimental_factors.treatment_list.length > 1 &&
                  ` +${data.experimental_factors.treatment_list.length - 1}`}
              </span>
            </div>
          )}
        </div>

        {/* Keywords */}
        {data.keywords.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {data.keywords.slice(0, 3).map((keyword, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs rounded-lg"
              >
                {keyword}
              </span>
            ))}
            {data.keywords.length > 3 && (
              <span className="px-2.5 py-1 bg-white/5 border border-white/10 text-gray-400 text-xs rounded-lg">
                +{data.keywords.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10 mt-auto">
          {" "}
          {/* 👈 mt-auto empurra o footer pro fim */}
          {data.technologies.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {data.technologies.slice(0, 2).map((tech, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-blue-500/30 border border-blue-400/30 text-blue-100 text-xs rounded-md font-medium"
                >
                  {tech}
                </span>
              ))}
              {data.technologies.length > 2 && (
                <span className="px-2 py-1 bg-white/5 text-gray-400 text-xs rounded-md">
                  +{data.technologies.length - 2}
                </span>
              )}
            </div>
          )}
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-300 group-hover:translate-x-1 transition-all flex-shrink-0" />
        </div>
      </div>

      {/* Shine effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      </div>
    </div>
  );
}
