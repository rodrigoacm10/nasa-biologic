import { NextRequest, NextResponse } from 'next/server';
import { gunzipSync } from 'zlib';

export const runtime = 'nodejs';

const GITHUB_REPO_URL =
  'https://raw.githubusercontent.com/rodrigoacm10/nasa-biologic-data/refs/heads/main';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  try {
    const articleUrl = `${GITHUB_REPO_URL}/processed_articles/${id}.json`;
    const matchesUrl = `${GITHUB_REPO_URL}/all_matches.json.gz`;

    const [articleResp, matchesResp] = await Promise.all([
      fetch(articleUrl, { next: { revalidate: 60 } }),
      fetch(matchesUrl, { cache: 'no-store' }),
    ]);

    if (!articleResp.ok) {
      return NextResponse.json(
        { error: `Article ${id} not found` },
        { status: 404 },
      );
    }

    const article = await articleResp.json();

    if (!article.article?.id || article.article.id !== id) {
      article.article = { ...article.article, id };
    }

    let matchesForArticle: any | null = null;
    if (matchesResp.ok) {
      const gzBuf = Buffer.from(await matchesResp.arrayBuffer());
      const jsonStr = gunzipSync(gzBuf).toString('utf-8');
      const allMatches = JSON.parse(jsonStr);

      const found = Array.isArray(allMatches)
        ? allMatches.find((m: any) => m.article_id === id)
        : null;

      if (found) {
        if (Array.isArray(found.osd_matches)) {
          found.osd_matches = found.osd_matches
            .filter((m: any) => (m?.similarity ?? 0) > 0.55)
            .sort((a: any, b: any) => (b?.similarity ?? 0) - (a?.similarity ?? 0));
          found.matches_found = found.osd_matches.length;
        }
        matchesForArticle = found;
      }
    } else {
      console.warn('⚠️ all_matches.json.gz não encontrado/indisponível');
    }

    return NextResponse.json({
      ...article,
      matches: matchesForArticle,
    });
  } catch (error) {
    console.error('❌ Error fetching article:', error);
    return NextResponse.json(
      { error: 'Failed to fetch article' },
      { status: 500 },
    );
  }
}
