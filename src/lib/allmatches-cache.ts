// Cache de all_matches em IndexedDB — espelhando o padrão das OSDs
// Chave = article_id  | Store = 'all_matches_by_article' | Meta = 'all_matches_meta'

export interface AllMatch {
  osd_id: string;
  title: string;
  similarity: number;
  confidence?: string;
  method?: string;
  url?: string;
}

export interface AllMatchesEntry {
  article_id: string;
  article_title: string;
  total_osds_compared: number;
  matches_found: number;
  osd_matches: AllMatch[];
}

type DB = IDBDatabase;

const DB_NAME = 'nasa-cache';
const DB_VERSION = 5; // incremente se mudar schema
const STORE = 'all_matches_by_article';
const META = 'all_matches_meta';
const META_KEY = 'all_matches_meta_key';

function openDB(): Promise<DB> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'article_id' });
      }
      if (!db.objectStoreNames.contains(META)) {
        db.createObjectStore(META, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function putAll(db: DB, rows: AllMatchesEntry[]) {
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction([STORE], 'readwrite');
    const st = tx.objectStore(STORE);
    // limpa antes de repopular (mantém simples/robusto)
    const clearReq = st.clear();
    clearReq.onsuccess = () => {
      for (const row of rows) st.put(row);
    };
    clearReq.onerror = () => reject(clearReq.error);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getAll(db: DB): Promise<AllMatchesEntry[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE], 'readonly');
    const st = tx.objectStore(STORE);
    const req = st.getAll();
    req.onsuccess = () => resolve((req.result || []) as AllMatchesEntry[]);
    req.onerror = () => reject(req.error);
  });
}

async function getOne(db: DB, articleId: string): Promise<AllMatchesEntry | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE], 'readonly');
    const st = tx.objectStore(STORE);
    const req = st.get(articleId);
    req.onsuccess = () => resolve(req.result as any);
    req.onerror = () => reject(req.error);
  });
}

async function getMeta(db: DB): Promise<{ key: string; updatedAt: number } | null> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction([META], 'readonly');
    const st = tx.objectStore(META);
    const req = st.get(META_KEY);
    req.onsuccess = () => resolve((req.result as any) || null);
    req.onerror = () => reject(req.error);
  });
}

async function setMeta(db: DB, updatedAt: number) {
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction([META], 'readwrite');
    const st = tx.objectStore(META);
    const req = st.put({ key: META_KEY, updatedAt });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Baixa e popula o cache, retornando o array completo.
 * - Usa TTL simples (12h) para invalidar.
 * - Você pode forçar com forceRefresh=true.
 */
export async function ensureAllMatchesCached(
  apiUrl: string = '/api/all_matches',
  opts?: { forceRefresh?: boolean; ttlMs?: number }
): Promise<AllMatchesEntry[]> {
  const ttlMs = opts?.ttlMs ?? 12 * 60 * 60 * 1000; // 12h
  const db = await openDB();

  // se não estiver forçado, e meta estiver fresca, devolve do cache
  if (!opts?.forceRefresh) {
    try {
      const meta = await getMeta(db);
      if (meta && Date.now() - meta.updatedAt < ttlMs) {
        const cached = await getAll(db);
        if (cached.length) return cached;
      }
    } catch { /* segue */ }
  }

  // baixa do backend (que já descompacta o .gz)
  const res = await fetch(apiUrl, { cache: 'no-store' });
  if (!res.ok) throw new Error('Cannot load all_matches from API');
  const rows = (await res.json()) as AllMatchesEntry[];

  // popula o cache
  try {
    await putAll(db, rows);
    await setMeta(db, Date.now());
  } catch (e) {
    console.warn('⚠️ Failed to write all_matches cache:', e);
  }

  return rows;
}

export async function getMatchesForArticle(articleId: string): Promise<AllMatchesEntry | undefined> {
  const db = await openDB();
  return getOne(db, articleId);
}

export async function getAllMatchesFromCache(): Promise<AllMatchesEntry[]> {
  const db = await openDB();
  return getAll(db);
}

export async function clearAllMatchesCache() {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction([STORE, META], 'readwrite');
    tx.objectStore(STORE).clear();
    tx.objectStore(META).delete(META_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
