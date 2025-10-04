'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Loader2, Rocket, Calendar, Microscope, Cpu, Database,
  MapPin, ExternalLink, Beaker, BookOpen, FileText, FlaskConical
} from 'lucide-react';

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
type OSD = {
  investigation: {
    id: string;
    title?: string;
    description?: string;
    mission?: { name?: string; start_date?: string; end_date?: string; link?: string };
    project?: { identifier?: string; title?: string; type?: string; link?: string; managing_center?: string };
    factors?: string[];
    publications?: Array<{ title?: string; doi?: string; link?: string }>;
  };
  study?: { samples?: Sample[] };
  assays?: Assay[];
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
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/osds/${id}`, { cache: 'no-store' });
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error(e);
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
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
  const samples = data.study?.samples ?? [];
  const assays = data.assays ?? [];

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

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Abas */}
        <div className="border-b border-slate-200 mb-6">
          <nav className="flex gap-6 overflow-x-auto">
            {tabs.map(t => {
              const Icon = t.icon;
              const active = tab === t.id;
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
          {tab === 'overview' && (
            <div className="space-y-6">
              {inv.description && (
                <section>
                  <h2 className="text-lg font-semibold text-slate-900 mb-2">Description</h2>
                  <p className="text-slate-700 leading-relaxed">{inv.description}</p>
                </section>
              )}

              <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                  <div className="flex items-center gap-2 mb-2 text-indigo-900">
                    <Microscope className="w-4 h-4" />
                    <h3 className="font-semibold">Assays</h3>
                  </div>
                  <div className="space-y-1 text-indigo-800">
                    {assays.slice(0, 3).map((a, i) => (
                      <div key={i} className="text-sm">
                        {(a.type || '—')} {a.platform ? `• ${a.platform}` : ''}
                      </div>
                    ))}
                    {assays.length === 0 && <div className="text-sm opacity-70">No assays</div>}
                  </div>
                </div>

                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                  <div className="flex items-center gap-2 mb-2 text-emerald-900">
                    <Database className="w-4 h-4" />
                    <h3 className="font-semibold">Organisms</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {organismSet.length
                      ? organismSet.map(o => <Pill key={o}>{o}</Pill>)
                      : <span className="text-sm text-emerald-800 opacity-70">—</span>}
                  </div>
                </div>

                <div className="rounded-xl border border-rose-100 bg-rose-50 p-4">
                  <div className="flex items-center gap-2 mb-2 text-rose-900">
                    <Beaker className="w-4 h-4" />
                    <h3 className="font-semibold">Factors</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {uniqueFactors.length
                      ? uniqueFactors.slice(0, 6).map(f => <Pill key={f}>{f}</Pill>)
                      : <span className="text-sm text-rose-800 opacity-70">—</span>}
                  </div>
                </div>
              </section>

              {(inv.mission?.link || inv.project?.link) && (
                <section className="flex flex-wrap gap-4">
                  {inv.mission?.link && (
                    <a href={inv.mission.link} target="_blank" className="text-indigo-600 hover:underline inline-flex items-center gap-1">
                      Mission page <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {inv.project?.link && (
                    <a href={inv.project.link} target="_blank" className="text-indigo-600 hover:underline inline-flex items-center gap-1">
                      Project page <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </section>
              )}
            </div>
          )}

          {tab === 'samples' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-slate-900">Samples</h2>
              {samples.length === 0 ? (
                <p className="text-slate-600">No samples.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
                    <thead className="bg-slate-50 text-slate-700">
                      <tr>
                        <th className="text-left px-3 py-2 border-b">Sample</th>
                        <th className="text-left px-3 py-2 border-b">Organism</th>
                        <th className="text-left px-3 py-2 border-b">Factors</th>
                        <th className="text-left px-3 py-2 border-b">Parameters</th>
                      </tr>
                    </thead>
                    <tbody>
                      {samples.map((s) => (
                        <tr key={s.sample_name} className="odd:bg-white even:bg-slate-50">
                          <td className="px-3 py-2 align-top font-medium text-slate-900">{s.sample_name}</td>
                          <td className="px-3 py-2 align-top">{s.characteristics?.Organism || '—'}</td>
                          <td className="px-3 py-2 align-top">
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(s.factors || {}).map(([k, v]) => (
                                <Pill key={k}>{k}: {v}</Pill>
                              ))}
                              {!s.factors || Object.keys(s.factors).length === 0 ? '—' : null}
                            </div>
                          </td>
                          <td className="px-3 py-2 align-top">
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(s.parameters || {}).map(([k, v]) => (
                                <Pill key={k}>{k}: {String(v)}</Pill>
                              ))}
                              {!s.parameters || Object.keys(s.parameters).length === 0 ? '—' : null}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === 'assays' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-slate-900">Assays</h2>
              {assays.length === 0 ? (
                <p className="text-slate-600">No assays.</p>
              ) : (
                <div className="space-y-4">
                  {assays.map((a, idx) => (
                    <div key={idx} className="border border-slate-200 rounded-xl p-4">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="text-slate-900 font-medium">
                          {a.type || '—'} {a.platform ? `• ${a.platform}` : ''}
                        </div>
                        <div className="text-xs text-slate-600">
                          {(a.files?.raw?.length || 0) + (a.files?.processed?.length || 0)} files
                        </div>
                      </div>

                      {(a.files?.raw?.length || 0) > 0 && (
                        <div className="mt-3">
                          <div className="text-xs font-semibold text-slate-700 mb-2">Raw files</div>
                          <div className="flex flex-wrap gap-2">
                            {a.files!.raw!.slice(0, 12).map((f) => <Pill key={f}>{f}</Pill>)}
                          </div>
                        </div>
                      )}

                      {(a.files?.processed?.length || 0) > 0 && (
                        <div className="mt-3">
                          <div className="text-xs font-semibold text-slate-700 mb-2">Processed files</div>
                          <div className="flex flex-wrap gap-2">
                            {a.files!.processed!.slice(0, 12).map((f) => <Pill key={f}>{f}</Pill>)}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'project' && (
            <div className="space-y-6">
              <section>
                <h2 className="text-lg font-semibold text-slate-900 mb-2">Mission</h2>
                {inv.mission?.name ? (
                  <div className="space-y-1 text-slate-700">
                    <div><b>Name:</b> {inv.mission.name}</div>
                    <div><b>Dates:</b> {missionDates || '—'}</div>
                    {inv.mission.link && (
                      <a href={inv.mission.link} target="_blank" className="text-indigo-600 hover:underline inline-flex items-center gap-1">
                        Mission page <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ) : <p className="text-slate-600">—</p>}
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-900 mb-2">Project</h2>
                {inv.project ? (
                  <div className="space-y-1 text-slate-700">
                    {inv.project.title && <div><b>Title:</b> {inv.project.title}</div>}
                    {inv.project.identifier && <div><b>ID:</b> {inv.project.identifier}</div>}
                    {inv.project.type && <div><b>Type:</b> {inv.project.type}</div>}
                    {inv.project.managing_center && <div><b>Managing center:</b> {inv.project.managing_center}</div>}
                    {inv.project.link && (
                      <a href={inv.project.link} target="_blank" className="text-indigo-600 hover:underline inline-flex items-center gap-1">
                        Project page <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ) : <p className="text-slate-600">—</p>}
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
