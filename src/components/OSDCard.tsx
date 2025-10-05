'use client';

import Link from 'next/link';
import { Calendar, Microscope, ExternalLink, ChevronRight, Dna } from 'lucide-react';

export default function OSDCard({ osd }: { osd: any }) {
  const inv = osd.investigation || {};
  const mission = inv.mission || {};
  const project = inv.project || {};
  const assays = osd.assays || [];
  const organism = osd.study?.samples?.[0]?.characteristics?.Organism;

  const osdId: string | null = typeof inv.id === 'string' && inv.id.length ? inv.id : null;
  const href = osdId ? `/osds/${osdId}` : undefined;

  const patternSeed = (inv.id || 'OSD').split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0) % 6;
  const gradients = [
    'from-indigo-500 to-fuchsia-600',
    'from-blue-500 to-emerald-500',
    'from-rose-500 to-amber-500',
    'from-cyan-500 to-purple-600',
    'from-lime-500 to-sky-500',
    'from-amber-500 to-pink-600',
  ];

  const firstAssay = assays[0];
  const assayText = firstAssay ? `${firstAssay.type || ''} • ${firstAssay.platform || ''}` : '—';

  const factorSet = new Set<string>(inv.factors || []);
  osd.study?.samples?.forEach((s: any) => Object.values(s.factors || {}).forEach((v: any) => v && factorSet.add(v)));
  const factorArr = Array.from(factorSet).slice(0, 3);

  const CardInner = (
    <div className="group relative overflow-hidden rounded-2xl sm:rounded-3xl backdrop-blur-xl bg-white/10 border border-white/20 hover:border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
      {/* Gradient Header */}
      <div className={`h-32 sm:h-40 bg-gradient-to-br ${gradients[patternSeed]} relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 grid grid-cols-8 grid-rows-8">
            {Array.from({ length: 64 }).map((_, i) => (
              <div
                key={i}
                className={`border border-white/10 ${i % 3 === patternSeed ? 'bg-white/20' : ''}`}
              />
            ))}
          </div>
        </div>
        
        {/* ID Badge */}
        <div className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-black/30 backdrop-blur-sm border border-white/20">
          <span className="text-white text-xs sm:text-sm font-mono font-bold">{inv.id}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 space-y-3 sm:space-y-4">
        <div>
          <h3 className="font-bold text-base sm:text-lg text-white group-hover:text-blue-300 transition-colors line-clamp-2 leading-tight mb-1">
            {inv.title || 'Untitled'}
          </h3>
          {organism && (
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-300">
              <Dna className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="italic">{organism}</span>
            </div>
          )}
        </div>

        <p className="text-xs sm:text-sm text-gray-300/90 line-clamp-3 leading-relaxed">
          {inv.description || 'No description available'}
        </p>

        {/* Factors */}
        <div className="flex flex-wrap gap-2">
          {factorArr.length > 0 ? (
            factorArr.map(f => (
              <span
                key={f}
                className="px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs"
              >
                {f}
              </span>
            ))
          ) : (
            <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-400 text-xs">
              No factors
            </span>
          )}
        </div>

        {/* Footer Info */}
        <div className="pt-3 border-t border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs sm:text-sm text-gray-300">
            <div className="flex items-center gap-1.5">
              <Microscope className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="truncate">{assayText}</span>
            </div>
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-blue-400 transition-colors flex-shrink-0" />
          </div>

          {mission?.name && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{mission.name}</span>
            </div>
          )}

          {project?.managing_center && (
            <div className="text-xs text-gray-400 truncate">
              {project.managing_center}
            </div>
          )}
        </div>

        {/* External Links */}
        {(mission?.link || project?.link) && (
          <div className="flex flex-wrap items-center gap-3 text-xs pt-2 border-t border-white/10">
            {mission?.link && (
              <a
                href={mission.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-300 hover:text-blue-200 inline-flex items-center gap-1 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                Mission <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {project?.link && (
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-300 hover:text-blue-200 inline-flex items-center gap-1 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                Project <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return href ? (
    <Link href={href} aria-label={`Open ${inv.id || 'OSD'}`}>
      {CardInner}
    </Link>
  ) : (
    <div aria-disabled className="opacity-70 cursor-not-allowed">
      {CardInner}
    </div>
  );
}