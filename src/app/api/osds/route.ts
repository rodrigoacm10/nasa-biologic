import { NextResponse } from 'next/server';

const GITHUB_RAW = 'https://raw.githubusercontent.com/rodrigoacm10/nasa-biologic-data/refs/heads/main';
const OSDS_GZ = 'all_osds.json.gz';

// Proxy do GET: repassa o .gz como veio do GitHub
export async function GET() {
  const upstream = await fetch(`${GITHUB_RAW}/${OSDS_GZ}`, {
    // repassa o cache do edge/browser se quiser
    cache: 'no-store',
  });
  if (!upstream.ok) {
    return NextResponse.json({ error: 'Failed to fetch all_osds.json.gz' }, { status: upstream.status });
  }

  // Clona os headers importantes (Content-Length, ETag, Last-Modified, etc.)
  const headers = new Headers(upstream.headers);
  // deixe o tipo correto do arquivo comprimido
  headers.set('Content-Type', 'application/gzip');
  // controle de cache (ajuste ao seu gosto)
  headers.set('Cache-Control', 'public, max-age=300, s-maxage=300');

  const stream = upstream.body!;
  return new NextResponse(stream, { status: 200, headers });
}

// HEAD para checar ETag/Last-Modified sem baixar o corpo
export async function HEAD() {
  const head = await fetch(`${GITHUB_RAW}/${OSDS_GZ}`, { method: 'HEAD', cache: 'no-store' });
  const headers = new Headers();
  ['etag','last-modified','content-length'].forEach((h) => {
    const v = head.headers.get(h);
    if (v) headers.set(h, v);
  });
  headers.set('Cache-Control', 'no-cache');
  return new NextResponse(null, { status: head.status, headers });
}
