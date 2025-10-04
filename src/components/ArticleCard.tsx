'use client';

import { Article } from '@/@types/article';
import { Calendar, Users, Dna, Microscope, ChevronRight, Coins } from 'lucide-react';
import Link from 'next/link';

interface ArticleCardProps {
  article: Article;
  index: number;
}

export default function ArticleCard({ article, index }: ArticleCardProps) {
  const { article: data } = article;
  console.log(data)
  // Usa o ID do artigo se existir, senão usa o index + 1
  const articleId = data.id || (index + 1).toString();
  
  return (
    <Link href={`/article/${articleId}`}>
      <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
              {data.title}
            </h3>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {data.year}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {data.authors.length} authors
              </span>
            </div>
          </div>

          <p className="text-sm text-gray-600 line-clamp-3">
            {data.abstract}
          </p>

          <div className="space-y-2">
            {data.experimental_factors.organism && (
              <div className="flex items-center gap-2">
                <Dna className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-700 font-medium">
                  Organism: {data.experimental_factors.organism}
                </span>
              </div>
            )}
            
            {data.experimental_factors.tissue_list.length > 0 && (
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-700">
                  Tissues: {data.experimental_factors.tissue_list.join(', ')}
                </span>
              </div>
            )}
            
            {data.experimental_factors.treatment_list.length > 0 && (
              <div className="flex items-center gap-2">
                <Microscope className="w-4 h-4 text-purple-500" />
                <span className="text-sm text-gray-700">
                  Treatment: {data.experimental_factors.treatment_list.join(', ')}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {data.keywords.slice(0, 3).map((keyword, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
              >
                {keyword}
              </span>
            ))}
            {data.keywords.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                +{data.keywords.length - 3} more
              </span>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            {data.technologies.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {data.technologies.slice(0, 2).map((tech, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-md font-medium"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            )}
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
          </div>
        </div>
      </div>
    </Link>
  );
}