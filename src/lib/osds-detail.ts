import { idbGet, idbSet } from "./idb";
import { ensureAllOsdsCached } from "./osds-cache";

const KEY_ALL_DATA = "all_osds:data";
const KEY_OSD_PREFIX = "osd:";

export interface OSDContact {
  first_name?: string;
  last_name?: string;
  role?: string;
  email?: string;
  affiliation?: string;
}

export type OSD = {
  investigation: {
    contacts?: OSDContact[];
    id: string;
    title?: string;
    description?: string;
    mission?: {
      name?: string;
      start_date?: string;
      end_date?: string;
      link?: string;
    };
    project?: {
      funding: string;
      identifier?: string;
      title?: string;
      type?: string;
      link?: string;
      managing_center?: string;
    };
    factors?: string[];
    publications?: Array<{
      authors?: string[];
      title?: string;
      doi?: string;
      link?: string;
    }>;
  };
  study?: { samples?: any[] };
  assays?: Array<{
    type?: string;
    platform?: string;
    files?: { raw?: string[]; processed?: string[]; reports?: string[] };
  }>;
};

function normId(id: string) {
  return id.startsWith("OSD-") ? id : `OSD-${id}`;
}

async function getOsdFromAllCache(id: string): Promise<OSD | null> {
  const all = await idbGet<any[]>(KEY_ALL_DATA);
  if (!Array.isArray(all)) return null;
  const target = normId(id);
  const hit = all.find((x) => x?.investigation?.id === target);
  return hit || null;
}

async function getOsdIndividual(id: string): Promise<OSD | null> {
  const hit = await idbGet<OSD>(KEY_OSD_PREFIX + normId(id));
  return hit || null;
}

async function putOsdIndividual(osd: OSD) {
  const id = osd?.investigation?.id;
  if (!id) return;
  await idbSet(KEY_OSD_PREFIX + id, osd);
}

/**
 * Garante obter 1 OSD pelo ID, priorizando IndexedDB:
 * 1) cache individual (osd:ID)
 * 2) dentro do all_osds:data já no IDB
 * 3) fallback: fetch /api/osds/[id] e cacheia individual
 */
export async function ensureOsdById(
  id: string,
  sourceUrl = "/api/osds"
): Promise<OSD | null> {
  const target = normId(id);

  const c1 = await getOsdIndividual(target);
  if (c1) return c1;

  const c2 = await getOsdFromAllCache(target);
  if (c2) {
    await putOsdIndividual(c2);
    return c2;
  }

  try {
    const all = await ensureAllOsdsCached(sourceUrl);
    if (Array.isArray(all)) {
      const c3 = all.find((x: any) => x?.investigation?.id === target) || null;
      if (c3) {
        await putOsdIndividual(c3);
        return c3;
      }
    }
  } catch {}

  try {
    const res = await fetch(`${sourceUrl}/${target}`, { cache: "no-store" });
    if (!res.ok) return null;
    const osd = await res.json();
    if (osd?.investigation?.id) await putOsdIndividual(osd);
    return osd;
  } catch {
    return null;
  }
}
