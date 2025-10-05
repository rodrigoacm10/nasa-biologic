import { NextRequest, NextResponse } from 'next/server';

const GITHUB_REPO_URL =
  'https://raw.githubusercontent.com/rodrigoacm10/nasa-biologic-data/refs/heads/main';

export async function GET(req: NextRequest) {
  try {
    const url = `${GITHUB_REPO_URL}/all_matches.json`;
    const resp = await fetch(url, { cache: 'no-store' });
    if (!resp.ok) {
      return NextResponse.json({ error: 'all_matches.json not found' }, { status: 404 });
    }

    const data = await resp.json();

    // filtros opcionais via query (?article_id=...&q=...&threshold=0.55&limit=100)
    const { searchParams } = new URL(req.url);
    const articleId = searchParams.get('article_id')?.trim();
    const q = searchParams.get('q')?.toLowerCase().trim();
    const threshold = Number(searchParams.get('threshold') || '0');
    const limit = Number(searchParams.get('limit') || '0');

    let rows = Array.isArray(data) ? data : [];

    if (articleId) {
      rows = rows.filter((r: any) => r?.article_id === articleId);
    }

    if (q) {
      rows = rows.filter((r: any) =>
        `${r?.article_id || ''} ${r?.article_title || ''}`.toLowerCase().includes(q)
      );
    }

    if (threshold > 0) {
      rows = rows.map((r: any) => {
        if (Array.isArray(r?.osd_matches)) {
          const filtered = r.osd_matches
            .filter((m: any) => (m?.similarity ?? 0) >= threshold)
            .sort((a: any, b: any) => (b?.similarity ?? 0) - (a?.similarity ?? 0));
          return { ...r, osd_matches: filtered, matches_found: filtered.length };
        }
        return r;
      });
    }

    if (limit > 0) rows = rows.slice(0, limit);

    return NextResponse.json(rows);
  } catch (err) {
    console.error('❌ Error fetching all_matches:', err);
    return NextResponse.json({ error: 'Failed to fetch all_matches' }, { status: 500 });
  }
}
