'use client';

import { useEffect, useState } from 'react';

export type OSDSearchParams = {
  q?: string;
  organism?: string;
  mission?: string;
  factor?: string;
  assayType?: string;
  platform?: string;
  center?: string;
  startDate?: string; // yyyy-mm-dd
  endDate?: string;   // yyyy-mm-dd
};

export default function OSDSearchBar({
  available,
  onSearch,
  defaultParams,
}: {
  available: {
    organisms: string[];
    missions: string[];
    factors: string[];
    assayTypes: string[];
    platforms: string[];
    centers: string[];
  };
  onSearch: (p: OSDSearchParams) => void;
  defaultParams?: OSDSearchParams;
}) {
  const [p, setP] = useState<OSDSearchParams>(defaultParams || {});
  useEffect(() => { onSearch(p); }, []); // dispara 1x com default

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 mb-6 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          className="px-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Buscar por título, descrição, projeto…"
          value={p.q ?? ''}
          onChange={e => setP({ ...p, q: e.target.value })}
          onKeyDown={e => e.key === 'Enter' && onSearch(p)}
        />

        <div className="flex  text-black">
          <select className="flex-1 px-3 py-2 rounded-xl border border-slate-500"
                  value={p.organism ?? ''} onChange={e => setP({ ...p, organism: e.target.value || undefined })}>
            <option value="">Organism</option>
            {available.organisms.map(x => <option key={x} value={x}>{x}</option>)}
          </select>

          <select className="flex-1 px-3 py-2 rounded-xl border border-slate-500"
                  value={p.mission ?? ''} onChange={e => setP({ ...p, mission: e.target.value || undefined })}>
            <option value="">Mission</option>
            {available.missions.map(x => <option key={x} value={x}>{x}</option>)}
          </select>
        </div>

        <div className="flex  text-black">
          <select className="flex-1 px-3 py-2 rounded-xl border border-slate-500"
                  value={p.factor ?? ''} onChange={e => setP({ ...p, factor: e.target.value || undefined })}>
            <option value="">Factor</option>
            {available.factors.map(x => <option key={x} value={x}>{x}</option>)}
          </select>

          <select className="flex-1 px-3 py-2 rounded-xl border border-slate-500"
                  value={p.assayType ?? ''} onChange={e => setP({ ...p, assayType: e.target.value || undefined })}>
            <option value="">Assay Type</option>
            {available.assayTypes.map(x => <option key={x} value={x}>{x}</option>)}
          </select>
        </div>

        <div className="flex  text-black">
          <select className="flex-1 px-3 py-2 rounded-xl border border-slate-500"
                  value={p.platform ?? ''} onChange={e => setP({ ...p, platform: e.target.value || undefined })}>
            <option value="">Platform</option>
            {available.platforms.map(x => <option key={x} value={x}>{x}</option>)}
          </select>

          <select className="flex-1 px-3 py-2 rounded-xl border border-slate-500"
                  value={p.center ?? ''} onChange={e => setP({ ...p, center: e.target.value || undefined })}>
            <option value="">Center</option>
            {available.centers.map(x => <option key={x} value={x}>{x}</option>)}
          </select>
        </div>

        <div className="flex  text-black">
          <input type="date" className="flex-1 px-3 py-2 rounded-xl border border-slate-500"
                 value={p.startDate ?? ''} onChange={e => setP({ ...p, startDate: e.target.value || undefined })} />
          <input type="date" className="flex-1 px-3 py-2 rounded-xl border border-slate-500"
                 value={p.endDate ?? ''} onChange={e => setP({ ...p, endDate: e.target.value || undefined })} />
        </div>

        <div className="flex  text-black md:col-span-3">
          <button
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
            onClick={() => onSearch(p)}
          >
            Buscar
          </button>
          <button
            className="px-4 py-2 rounded-xl border border-slate-500 hover:bg-slate-50"
            onClick={() => { const np: OSDSearchParams = {}; setP(np); onSearch(np); }}
          >
            Limpar
          </button>
        </div>
      </div>
    </div>
  );
}
