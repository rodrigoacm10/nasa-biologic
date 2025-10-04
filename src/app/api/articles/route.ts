import { NextResponse } from 'next/server';
import { Article } from '@/@types/article';

const GITHUB_REPO_URL = 'https://raw.githubusercontent.com/rodrigoacm10/nasa-biologic-data/refs/heads/main';
const ALL_ARTICLES_FILE = 'all_articles.json'; // Nome do arquivo com todos os artigos

// Cache em memória para evitar múltiplas requisições ao GitHub
let articlesCache: Article[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.toLowerCase() || '';
  const organism = searchParams.get('organism')?.toLowerCase() || '';
  const tissue = searchParams.get('tissue')?.toLowerCase() || '';
  const treatment = searchParams.get('treatment')?.toLowerCase() || '';
  const technology = searchParams.get('technology')?.toLowerCase() || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '12');
  
  try {
    // Verificar cache
    const now = Date.now();
    if (!articlesCache || now - cacheTimestamp > CACHE_DURATION) {
      // Buscar o arquivo com todos os artigos
      const response = await fetch(`${GITHUB_REPO_URL}/${ALL_ARTICLES_FILE}`);
      if (!response.ok) {
        throw new Error('Failed to fetch articles');
      }
      articlesCache = await response.json();
      cacheTimestamp = now;
    }
    
    let filteredArticles = articlesCache || [];
    
    // Apply filters
    if (query) {
      filteredArticles = filteredArticles.filter(article => {
        const searchableText = [
          article.article.title,
          article.article.abstract,
          article.article.insights_summary,
          ...article.article.keywords,
          ...article.article.authors,
          article.article.experimental_factors.organism,
          ...article.article.experimental_factors.tissue_list,
          ...article.article.experimental_factors.treatment_list,
          ...article.article.technologies
        ].join(' ').toLowerCase();
        
        return searchableText.includes(query);
      });
    }
    
    if (organism) {
      filteredArticles = filteredArticles.filter(article =>
        article.article.experimental_factors.organism?.toLowerCase().includes(organism)
      );
    }
    
    if (tissue) {
      filteredArticles = filteredArticles.filter(article =>
        article.article.experimental_factors.tissue_list?.some(t => 
          t.toLowerCase().includes(tissue)
        )
      );
    }
    
    if (treatment) {
      filteredArticles = filteredArticles.filter(article =>
        article.article.experimental_factors.treatment_list?.some(t => 
          t.toLowerCase().includes(treatment)
        )
      );
    }
    
    if (technology) {
      filteredArticles = filteredArticles.filter(article =>
        article.article.technologies?.some(t => 
          t.toLowerCase().includes(technology)
        )
      );
    }
    
    // Paginação
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedArticles = filteredArticles.slice(startIndex, endIndex);
    
    return NextResponse.json({
      articles: paginatedArticles,
      total: filteredArticles.length,
      page,
      totalPages: Math.ceil(filteredArticles.length / limit),
      hasMore: endIndex < filteredArticles.length
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
  }
}