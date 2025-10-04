'use client';

import Link from 'next/link';
import { Calendar, Microscope, ExternalLink, ChevronRight } from 'lucide-react';

function InfoPill({ children }: { children: React.ReactNode }) {
  return <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs">{children}</span>;
}

export default function OSDCard({ osd }: { osd: any }) {
  const inv = osd.investigation || {};
  const mission = inv.mission || {};
  const project = inv.project || {};
  const assays = osd.assays || [];
  const organism = osd.study?.samples?.[0]?.characteristics?.Organism;

  // id normalizado para rota
  const osdId: string | null = typeof inv.id === 'string' && inv.id.length ? inv.id : null;
  const href = osdId ? `/osds/${osdId}` : undefined;

  // avatar geométrico
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
  const factorArr = Array.from(factorSet).slice(0, 4);

  const CardInner = (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all group cursor-pointer">
      <div className={`h-24 bg-gradient-to-br ${gradients[patternSeed]} relative`}>
        <div className="absolute inset-0 opacity-20 grid grid-cols-8">
          {Array.from({ length: 64 }).map((_, i) => (
            <div key={i} className={`border border-white/10 ${i % 3 === patternSeed ? 'bg-white/20' : ''}`} />
          ))}
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
              {inv.id ? `${inv.id} — ` : ''}{inv.title || 'Untitled'}
            </h3>
            {organism && <p className="text-sm text-slate-600 mt-0.5">{organism}</p>}
          </div>
          {project.managing_center && <InfoPill>{project.managing_center}</InfoPill>}
        </div>

        <p className="text-sm text-slate-700 line-clamp-3">{inv.description}</p>

        <div className="flex flex-wrap gap-2">
          {factorArr.length > 0
            ? factorArr.map(f => <InfoPill key={f}>{f}</InfoPill>)
            : <InfoPill>no factors</InfoPill>}
        </div>

        <div className="flex items-center justify-between text-sm text-slate-600 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <Microscope className="w-4 h-4" /> {assayText}
            </span>
            {mission?.name && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-4 h-4" /> {mission.name}
              </span>
            )}
          </div>

          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
        </div>

        {/* Links externos continuam visíveis */}
        {(mission?.link || project?.link) && (
          <div className="flex items-center gap-3 text-xs pt-1">
            {mission?.link && (
              <a
                href={mission.link}
                target="_blank"
                className="text-indigo-600 hover:underline inline-flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                missão <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {project?.link && (
              <a
                href={project.link}
                target="_blank"
                className="text-indigo-600 hover:underline inline-flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                projeto <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // Se tiver ID, envolve com <Link>; senão, renderiza “disabled”
  return href ? (
    <Link href={href} aria-label={`Abrir ${inv.id || 'OSD'}`}>{CardInner}</Link>
  ) : (
    <div aria-disabled className="opacity-70">{CardInner}</div>
  );
}
