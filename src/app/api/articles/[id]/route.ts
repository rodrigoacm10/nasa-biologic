import { NextRequest, NextResponse } from 'next/server'

const GITHUB_REPO_URL =
  'https://raw.githubusercontent.com/rodrigoacm10/nasa-biologic-data/refs/heads/main'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params

  try {
    const articleUrl = `${GITHUB_REPO_URL}/processed_articles/${id}.json`
    const matchesUrl = `${GITHUB_REPO_URL}/all_matches.json`

    // Busca em paralelo: artigo + all_matches
    const [articleResp, matchesResp] = await Promise.all([
      fetch(articleUrl, { next: { revalidate: 60 } }),
      fetch(matchesUrl, { cache: 'no-store' }), // Evita cache de 2MB
    ])

    if (!articleResp.ok) {
      return NextResponse.json(
        { error: `Article ${id} not found` },
        { status: 404 },
      )
    }

    const article = await articleResp.json()

    // Garante que o ID interno bate com o parâmetro
    if (!article.article?.id || article.article.id !== id) {
      console.warn(
        `⚠️ ID interno (${article.article?.id}) não corresponde a ${id}`,
      )
      article.article = {
        ...article.article,
        id,
      }
    }

    // Lê e filtra as matches do all_matches.json
    let matchesForArticle: any | null = null
    if (matchesResp.ok) {
      const allMatches = await matchesResp.json()

      const found = Array.isArray(allMatches)
        ? allMatches.find((m) => m.article_id === id)
        : null

      if (found) {
        // Filtra apenas matches com similarity acima de 0.55
        if (Array.isArray(found.osd_matches)) {
          found.osd_matches = found.osd_matches.filter(
            (match: any) => (match?.similarity ?? 0) > 0.55,
          )

          // Ordena os osd_matches por similaridade desc
          found.osd_matches.sort(
            (a: any, b: any) => (b?.similarity ?? 0) - (a?.similarity ?? 0),
          )

          // Atualiza o matches_found com o número real após filtro
          found.matches_found = found.osd_matches.length
        }

        matchesForArticle = found
      }
    } else {
      console.warn('⚠️ all_matches.json não encontrado/indisponível')
    }

    // Retorna artigo + matches (quando houver)
    return NextResponse.json({
      ...article,
      matches: matchesForArticle,
    })
  } catch (error) {
    console.error('❌ Error fetching article:', error)
    return NextResponse.json(
      { error: 'Failed to fetch article' },
      { status: 500 },
    )
  }
}
