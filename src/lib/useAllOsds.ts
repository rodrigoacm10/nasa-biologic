"use client";

import { useEffect, useState } from 'react';
import { ensureAllOsdsCached } from './osds-cache';

export function useAllOsds() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const d = await ensureAllOsdsCached('/api/osds');
        if (!alive) return;
        setData(d);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || 'Erro ao carregar OSDs');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return { data, loading, error };
}
