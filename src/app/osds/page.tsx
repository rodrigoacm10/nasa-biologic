'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Rocket, Microscope, Calendar, Layers, Database, Loader2, ChevronDown, Gauge } from 'lucide-react';
import { ensureAllOsdsCached } from '@/lib/osds-cache';
import OSDSearchBar, {OSDSearchParams} from '@/components/OSDSearchBar';
import OSDCard from '@/components/OSDCard';

type OSD = {
  investigation: {
    id: string;
    title?: string;
    description?: string;
    mission?: { name?: string; start_date?: string; end_date?: string; link?: string };
    project?: { identifier?: string; title?: string; type?: string; link?: string; managing_center?: string };
    factors?: string[];
  };
  study?: {
    samples?: Array<{
      characteristics?: { Organism?: string; [k: string]: any };
      factors?: Record<string, string>;
    }>;
  };
  assays?: Array<{ type?: string; platform?: string }>;
};

function normalizeStr(x?: string) {
  return (x || '').toLowerCase();
}

export default function OSDCatalogPage() {
  const [allOsds, setAllOsds] = useState<OSD[]>([]);
  const [loading, setLoading] = useState(true);

  // filtros e paginação
  const [params, setParams] = useState<OSDSearchParams>({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 12;

  // carregar do IndexedDB (via /api/osds + gunzip)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await ensureAllOsdsCached('/api/osds');
        if (!alive) return;
        // data pode ser array grande de OSDs
        setAllOsds(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // extrair filtros disponíveis dinamicamente
  const available = useMemo(() => {
    const organisms = new Set<string>();
    const missions = new Set<string>();
    const factors = new Set<string>();
    const assayTypes = new Set<string>();
    const platforms = new Set<string>();
    const centers = new Set<string>();

    for (const osd of allOsds) {
      // organismo (do sample)
      osd.study?.samples?.forEach(s => {
        const org = s.characteristics?.Organism;
        if (org) organisms.add(org);
        Object.values(s.factors || {}).forEach(v => v && factors.add(v));
      });
      // fatores de investigation também
      osd.investigation?.factors?.forEach(f => f && factors.add(f));
      // missão / centro
      if (osd.investigation?.mission?.name) missions.add(osd.investigation.mission.name);
      if (osd.investigation?.project?.managing_center) centers.add(osd.investigation.project.managing_center);
      // ensaios
      osd.assays?.forEach(a => {
        if (a.type) assayTypes.add(a.type);
        if (a.platform) platforms.add(a.platform);
      });
    }

    return {
      organisms: Array.from(organisms).sort(),
      missions: Array.from(missions).sort(),
      factors: Array.from(factors).sort(),
      assayTypes: Array.from(assayTypes).sort(),
      platforms: Array.from(platforms).sort(),
      centers: Array.from(centers).sort(),
    };
  }, [allOsds]);

  // aplicar filtros (client-side)
  const filtered = useMemo(() => {
    const q = normalizeStr(params.q);
    const org = normalizeStr(params.organism);
    const mission = normalizeStr(params.mission);
    const factor = normalizeStr(params.factor);
    const assayType = normalizeStr(params.assayType);
    const platform = normalizeStr(params.platform);
    const center = normalizeStr(params.center);

    const start = params.startDate ? new Date(params.startDate) : undefined;
    const end = params.endDate ? new Date(params.endDate) : undefined;

    return allOsds.filter(osd => {
      // texto livre
      if (q) {
        const blob = [
          osd.investigation?.id,
          osd.investigation?.title,
          osd.investigation?.description,
          osd.investigation?.mission?.name,
          osd.investigation?.project?.title,
          osd.investigation?.project?.type,
          ...(osd.investigation?.factors || []),
          ...(osd.assays?.map(a => `${a.type} ${a.platform}`) || []),
          ...(osd.study?.samples?.map(s => s.characteristics?.Organism || '') || []),
        ].join(' • ').toLowerCase();
        if (!blob.includes(q)) return false;
      }

      // organism
      if (org) {
        const hasOrg = osd.study?.samples?.some(s => normalizeStr(s.characteristics?.Organism).includes(org));
        if (!hasOrg) return false;
      }

      // mission
      if (mission) {
        if (!normalizeStr(osd.investigation?.mission?.name).includes(mission)) return false;
      }

      // factor (pode estar em investigation.factors ou nos samples)
      if (factor) {
        const inInv = (osd.investigation?.factors || []).some(f => normalizeStr(f).includes(factor));
        const inSamples = osd.study?.samples?.some(s =>
          Object.values(s.factors || {}).some(v => normalizeStr(v).includes(factor))
        );
        if (!inInv && !inSamples) return false;
      }

      // ensaio
      if (assayType) {
        const ok = osd.assays?.some(a => normalizeStr(a.type).includes(assayType));
        if (!ok) return false;
      }

      if (platform) {
        const ok = osd.assays?.some(a => normalizeStr(a.platform).includes(platform));
        if (!ok) return false;
      }

      if (center) {
        if (!normalizeStr(osd.investigation?.project?.managing_center).includes(center)) return false;
      }

      // janela de datas pela missão (opcional)
      if (start || end) {
        const s = osd.investigation?.mission?.start_date; // dd/mm/yyyy ou similar
        const e = osd.investigation?.mission?.end_date;
        const parse = (d?: string) => {
          if (!d) return undefined;
          // tenta dd/mm/yyyy
          const m = d.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
          if (m) return new Date(+m[3], +m[2]-1, +m[1]);
          // fallback: Date()
          const dt = new Date(d);
          return isNaN(+dt) ? undefined : dt;
        };
        const ms = parse(s);
        const me = parse(e);
        if (start && ms && ms < start && (!end || (me && me < start))) return false;
        if (end && me && me > end && (!start || (ms && ms > end))) return false;
      }

      return true;
    });
  }, [allOsds, params]);

  // paginação incremental
  const [visible, setVisible] = useState<OSD[]>([]);
  useEffect(() => {
    setPage(1);
    const slice = filtered.slice(0, PAGE_SIZE);
    setVisible(slice);
    setHasMore(slice.length < filtered.length);
  }, [filtered]);

  const loadMore = () => {
    const nextPage = page + 1;
    const slice = filtered.slice(0, nextPage * PAGE_SIZE);
    setVisible(slice);
    setPage(nextPage);
    setHasMore(slice.length < filtered.length);
  };

  // infinite scroll
  const obs = useRef<IntersectionObserver | null>(null);
  const lastRef = useCallback((node: HTMLDivElement | null) => {
    if (!hasMore || loading) return;
    if (obs.current) obs.current.disconnect();
    obs.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) loadMore();
    });
    if (node) obs.current.observe(node);
  }, [hasMore, loading, page, filtered.length]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <header className="bg-white/80 backdrop-blur border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-600 text-white">
            <Rocket className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">NASA OSD Catalog</h1>
            <p className="text-sm text-slate-600">Datasets ISA-Tab unificados (offline-friendly)</p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <OSDSearchBar
          available={available}
          onSearch={setParams}
          defaultParams={{}}
        />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
            <p className="text-slate-600">Carregando OSDs do cache local…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Database className="w-16 h-16 text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Nenhum OSD encontrado</h3>
            <p className="text-slate-600 text-center max-w-md">
              Ajuste os filtros ou refine a busca.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between text-sm text-slate-600">
              <div className="flex items-center gap-3">
                <Gauge className="w-4 h-4" />
                <span>Mostrando <b className="text-slate-900">{visible.length}</b> de <b className="text-slate-900">{filtered.length}</b> OSDs</span>
              </div>
              <div className="hidden md:flex items-center gap-4">
                <span className="inline-flex items-center gap-2"><Microscope className="w-4 h-4" /> {available.assayTypes.length} tipos de ensaio</span>
                <span className="inline-flex items-center gap-2"><Layers className="w-4 h-4" /> {available.platforms.length} plataformas</span>
                <span className="inline-flex items-center gap-2"><Calendar className="w-4 h-4" /> {available.missions.length} missões</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {visible.map((osd, idx) => (
                <div key={osd.investigation.id} ref={idx === visible.length - 1 ? lastRef : undefined}>
                  <OSDCard osd={osd} />
                </div>
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center py-8">
                <button
                  onClick={loadMore}
                  className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700"
                >
                  <ChevronDown className="w-5 h-5" />
                  Carregar mais
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
