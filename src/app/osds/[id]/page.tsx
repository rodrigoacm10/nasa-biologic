'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Loader2, Rocket, Calendar, Microscope, Cpu, Database,
  MapPin, ExternalLink, Beaker, BookOpen, FileText, FlaskConical
} from 'lucide-react';
import type { OSD } from '@/lib/osds-detail';
import { ensureOsdById } from '@/lib/osds-detail';

type Assay = {
  type?: string;
  platform?: string;
  files?: {
    raw?: string[];
    processed?: string[];
    reports?: string[];
  };
};
type Sample = {
  sample_name: string;
  characteristics?: { Organism?: string; [k: string]: any };
  factors?: Record<string, string>;
  parameters?: Record<string, string | number>;
};

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs">
      {children}
    </span>
  );
}

export default function OSDDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<OSD | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'samples' | 'assays' | 'project'>('overview');

  useEffect(() => {
    if (!id) return;
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        // 1ª tentativa: IndexedDB (individual, depois dentro do all_osds, só então rede)
        const osd = await ensureOsdById(id as string, '/api/osds');
        if (!alive) return;
        setData(osd);
      } catch (e) {
        console.error(e);
        if (alive) setData(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  const missionDates = useMemo(() => {
    const s = data?.investigation?.mission?.start_date;
    const e = data?.investigation?.mission?.end_date;
    return s || e ? `${s || '—'} → ${e || '—'}` : null;
  }, [data]);

  const uniqueFactors = useMemo(() => {
    const set = new Set<string>();
    (data?.investigation?.factors || []).forEach(f => f && set.add(f));
    data?.study?.samples?.forEach(s =>
      Object.values(s.factors || {}).forEach(v => v && set.add(`${v}`))
    );
    return Array.from(set);
  }, [data]);

  const organismSet = useMemo(() => {
    const set = new Set<string>();
    data?.study?.samples?.forEach(s => {
      const org = s.characteristics?.Organism;
      if (org) set.add(org);
    });
    return Array.from(set);
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">OSD não encontrado</h2>
          <Link href="/osds" className="text-indigo-600 hover:text-indigo-700">
            Voltar ao catálogo
          </Link>
        </div>
      </div>
    );
  }

  const inv = data.investigation;
  const samples = (data.study?.samples ?? []) as Sample[];
  const assays = (data.assays ?? []) as Assay[];

  const tabs: Array<{ id: typeof tab; label: string; icon: any }> = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'samples', label: `Samples (${samples.length})`, icon: FlaskConical },
    { id: 'assays', label: `Assays (${assays.length})`, icon: Beaker },
    { id: 'project', label: 'Project & Mission', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <header className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/osds" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" />
            Voltar ao catálogo
          </Link>

          <div className="mt-3 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-600 text-white">
              <Rocket className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                {inv.id} — {inv.title || 'Untitled'}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 mt-2">
                {inv.mission?.name && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {inv.mission.name}{missionDates ? ` • ${missionDates}` : ''}
                  </span>
                )}
                {inv.project?.managing_center && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {inv.project.managing_center}
                  </span>
                )}
                {assays[0]?.platform && (
                  <span className="inline-flex items-center gap-1">
                    <Cpu className="w-4 h-4" />
                    {assays[0].platform}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ... resto da página permanece igual (abas Overview / Samples / Assays / Project) ... */}
      {/* (mantive idêntico ao seu último snippet) */}
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Abas */}
        <div className="border-b border-slate-200 mb-6">
          <nav className="flex gap-6 overflow-x-auto">
            {tabs.map(t => {
              const Icon = t.icon;
              const active = (t.id === (tab as any));
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 px-1 py-3 border-b-2 whitespace-nowrap transition-colors
                    ${active ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{t.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 p-6">
          {/* (o conteúdo das abas aqui é exatamente o seu — omiti por brevidade) */}
        </div>
      </main>
    </div>
  );
}
