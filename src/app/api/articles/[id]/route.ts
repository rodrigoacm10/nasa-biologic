import { NextRequest, NextResponse } from 'next/server';

const GITHUB_REPO_URL =
  'https://raw.githubusercontent.com/rodrigoacm10/nasa-biologic-data/refs/heads/main/processed_articles';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const url = `${GITHUB_REPO_URL}/${id}.json`;
    const response = await fetch(url);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Article ${id} not found` },
        { status: 404 }
      );
    }

    const article = await response.json();

    if (!article.article?.id || article.article.id !== id) {
      console.warn(`⚠️ ID interno (${article.article?.id}) não corresponde a ${id}`);
      article.article = {
        ...article.article,
        id,
      };
    }

    return NextResponse.json(article);
  } catch (error) {
    console.error('❌ Error fetching article:', error);
    return NextResponse.json(
      { error: 'Failed to fetch article' },
      { status: 500 }
    );
  }
}
