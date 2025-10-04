import { idbGet, idbSet } from './idb';

const KEY_DATA = 'all_osds:data';
const KEY_META = 'all_osds:meta';

type CacheMeta = {
  etag?: string;
  lastModified?: string;
  updatedAt: number;
};

// tenta usar DecompressionStream do browser (Chrome, Edge, Firefox recentes)
async function gunzipToJSON(res: Response): Promise<any> {
  if ('DecompressionStream' in self) {
    const ds = new (self as any).DecompressionStream('gzip');
    const decompressed = res.body!.pipeThrough(ds);
    const jsonRes = new Response(decompressed);
    return await jsonRes.json();
  } else {
    // fallback com pako (opcional). Se não quiser dependência, remova esse bloco.
    // import dinamicamente apenas no fallback:
    const { default: pako } = await import(/* webpackChunkName: "pako" */ 'pako');
    const buf = new Uint8Array(await res.arrayBuffer());
    const out = pako.ungzip(buf, { to: 'string' });
    return JSON.parse(out);
  }
}

export async function ensureAllOsdsCached(sourceUrl = '/api/osds'): Promise<any> {
  // 1) tenta ler meta/data do IDB
  const meta = (await idbGet<CacheMeta>(KEY_META)) || undefined;
  const cached = await idbGet<any>(KEY_DATA);

  // 2) checa atualização usando HEAD (ETag / Last-Modified)
  let needFetch = true;
  try {
    const head = await fetch(sourceUrl, { method: 'HEAD', cache: 'no-store' });
    const newEtag = head.headers.get('etag') || undefined;
    const newLM = head.headers.get('last-modified') || undefined;

    if (meta?.etag && newEtag && meta.etag === newEtag && cached) {
      needFetch = false;
      return cached;
    }
    if (!newEtag && meta?.lastModified && newLM && meta.lastModified === newLM && cached) {
      needFetch = false;
      return cached;
    }
  } catch {
    // se o HEAD falhar e já temos cache, devolve cache
    if (cached) return cached;
    // senão, segue para o fetch do .gz
  }

  // 3) baixa o .gz, descompacta e guarda
  const res = await fetch(sourceUrl, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Falha no download do all_osds.json.gz: ${res.status}`);

  const data = await gunzipToJSON(res);

  const newMeta: CacheMeta = {
    etag: res.headers.get('etag') || undefined,
    lastModified: res.headers.get('last-modified') || undefined,
    updatedAt: Date.now(),
  };
  await idbSet(KEY_DATA, data);
  await idbSet(KEY_META, newMeta);

  return data;
}
