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
  const [params, setParams] = useState<OSDSearchParams>({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 12;

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await ensureAllOsdsCached('/api/osds');
        if (!alive) return;
        setAllOsds(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const available = useMemo(() => {
    const organisms = new Set<string>();
    const missions = new Set<string>();
    const factors = new Set<string>();
    const assayTypes = new Set<string>();
    const platforms = new Set<string>();
    const centers = new Set<string>();

    for (const osd of allOsds) {
      osd.study?.samples?.forEach(s => {
        const org = s.characteristics?.Organism;
        if (org) organisms.add(org);
        Object.values(s.factors || {}).forEach(v => v && factors.add(v));
      });
      osd.investigation?.factors?.forEach(f => f && factors.add(f));
      if (osd.investigation?.mission?.name) missions.add(osd.investigation.mission.name);
      if (osd.investigation?.project?.managing_center) centers.add(osd.investigation.project.managing_center);
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
      if (org) {
        const hasOrg = osd.study?.samples?.some(s => normalizeStr(s.characteristics?.Organism).includes(org));
        if (!hasOrg) return false;
      }
      if (mission && !normalizeStr(osd.investigation?.mission?.name).includes(mission)) return false;
      if (factor) {
        const inInv = (osd.investigation?.factors || []).some(f => normalizeStr(f).includes(factor));
        const inSamples = osd.study?.samples?.some(s =>
          Object.values(s.factors || {}).some(v => normalizeStr(v).includes(factor))
        );
        if (!inInv && !inSamples) return false;
      }
      if (assayType && !osd.assays?.some(a => normalizeStr(a.type).includes(assayType))) return false;
      if (platform && !osd.assays?.some(a => normalizeStr(a.platform).includes(platform))) return false;
      if (center && !normalizeStr(osd.investigation?.project?.managing_center).includes(center)) return false;
      return true;
    });
  }, [allOsds, params]);

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
    <div className="min-h-screen bg-[url('/src/images/background/test.png')] bg-fixed bg-cover bg-center">
      <div className="fixed w-full h-full bg-black/70 top-0 left-0 z-0"></div>
      
      <div className="relative z-10">
        <header className="backdrop-blur-md bg-black/30 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-indigo-500 to-fuchsia-600 rounded-xl sm:rounded-2xl shadow-lg">
                <Rocket className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white font-bricolage">
                  NASA OSD Catalog
                </h1>
                <p className="text-xs sm:text-sm text-gray-300">
                  Open Science Data Repository - Unified ISA-Tab datasets
                </p>
              </div>
            </div>
          </div>
        </header>

        <OSDSearchBar available={available} onSearch={setParams} defaultParams={{}} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 sm:py-32">
              <div className="p-6 rounded-3xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl">
                <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 text-blue-400 animate-spin mb-4" />
                <p className="text-gray-200 text-sm sm:text-base">Loading OSDs from local cache...</p>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 sm:py-32">
              <div className="p-8 sm:p-12 rounded-3xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl text-center max-w-md">
                <Database className="w-16 h-16 sm:w-20 sm:h-20 text-gray-400 mb-4 mx-auto" />
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                  No OSDs found
                </h3>
                <p className="text-sm sm:text-base text-gray-300">
                  Adjust filters or refine your search.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6 px-4 py-3 rounded-2xl backdrop-blur-md bg-white/10 border border-white/20 shadow-lg">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm sm:text-base text-gray-200">
                    <Gauge className="w-4 h-4" />
                    <span>
                      Showing{' '}
                      <span className="font-bold text-white bg-blue-500/30 px-2 py-0.5 rounded">
                        {visible.length}
                      </span>{' '}
                      of{' '}
                      <span className="font-bold text-white bg-purple-500/30 px-2 py-0.5 rounded">
                        {filtered.length}
                      </span>{' '}
                      OSDs
                    </span>
                  </div>
                  
                  <div className="hidden md:flex items-center gap-4 text-xs text-gray-300">
                    <span className="inline-flex items-center gap-2">
                      <Microscope className="w-4 h-4" /> {available.assayTypes.length} assay types
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Layers className="w-4 h-4" /> {available.platforms.length} platforms
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> {available.missions.length} missions
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
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
                    className="px-6 py-3 rounded-2xl backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/30 transition-all text-white font-medium shadow-lg hover:shadow-xl flex items-center gap-2"
                  >
                    <ChevronDown className="w-5 h-5" />
                    Load more OSDs
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}