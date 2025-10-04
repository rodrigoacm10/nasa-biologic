'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Article } from '@/@types/article';
import { 
  ArrowLeft, Calendar, Users, ExternalLink, 
  Dna, Coins, Microscope, Clock, FileText,
  Tag, Beaker, BookOpen, Loader2,
  CoinsIcon
} from 'lucide-react';

export default function ArticleDetail() {
  const params = useParams();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (params.id) {
      fetchArticle(params.id as string);
    }
  }, [params.id]);

  const fetchArticle = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/articles/${id}`);
      const data = await response.json();
      setArticle(data);
    } catch (error) {
      console.error('Error fetching article:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Article not found</h2>
          <Link href="/" className="text-blue-600 hover:text-blue-700">
            Return to catalog
          </Link>
        </div>
      </div>
    );
  }

  const { article: data } = article;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'methods', label: 'Methods', icon: Beaker },
    { id: 'results', label: 'Results', icon: FileText },
    { id: 'experimental', label: 'Experimental', icon: Coins },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to catalog
          </Link>
          
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            {data?.title || ""}
          </h1>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {data?.year || ""}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {data.authors.length} authors
            </span>
            {data.url && (
              <a 
                href={data.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
              >
                <ExternalLink className="w-4 h-4" />
                View original
              </a>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Key Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {data.experimental_factors.organism && (
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <Dna className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">Organism</h3>
              </div>
              <p className="text-blue-700">{data.experimental_factors.organism}</p>
            </div>
          )}
          
          {data.experimental_factors.tissue_list.length > 0 && (
            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
              <div className="flex items-center gap-2 mb-2">
                <CoinsIcon className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-green-900">Tissues</h3>
              </div>
              <p className="text-green-700">{data.experimental_factors.tissue_list.join(', ')}</p>
            </div>
          )}
          
          {data.experimental_factors.treatment_list.length > 0 && (
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
              <div className="flex items-center gap-2 mb-2">
                <Microscope className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-purple-900">Treatment</h3>
              </div>
              <p className="text-purple-700">{data.experimental_factors.treatment_list.join(', ')}</p>
            </div>
          )}
        </div>

        {/* Tabs Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-6 overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-1 py-3 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Abstract</h2>
                <p className="text-gray-600 leading-relaxed">{data.abstract}</p>
              </div>
              
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Key Insights</h2>
                <p className="text-gray-600 leading-relaxed">{data.insights_summary}</p>
              </div>
              
              {data.keywords.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Keywords</h2>
                  <div className="flex flex-wrap gap-2">
                    {data.keywords.map((keyword, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        <Tag className="w-3 h-3" />
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {data.technologies.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Technologies Used</h2>
                  <div className="flex flex-wrap gap-2">
                    {data.technologies.map((tech, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'methods' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Methods</h2>
                <p className="text-gray-600 leading-relaxed">{data.sections.methods}</p>
              </div>
              
              {data.sections.introduction && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Introduction</h2>
                  <p className="text-gray-600 leading-relaxed">{data.sections.introduction}</p>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'results' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Results</h2>
                <p className="text-gray-600 leading-relaxed">{data.sections.results}</p>
              </div>
              
              {data.sections.discussion && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Discussion</h2>
                  <p className="text-gray-600 leading-relaxed">{data.sections.discussion}</p>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'experimental' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {data.experimental_factors.age_at_sampling && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-600" />
                      Age at Sampling
                    </h3>
                    <p className="text-gray-600">
                      {data.experimental_factors.age_at_sampling_detail.raw || data.experimental_factors.age_at_sampling}
                    </p>
                  </div>
                )}
                
                {data.experimental_factors.duration && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-600" />
                      Duration
                    </h3>
                    <p className="text-gray-600">
                      {data.experimental_factors.duration_detail.raw || data.experimental_factors.duration}
                    </p>
                  </div>
                )}
              </div>
              
              {data.funding && data.funding.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Funding</h3>
                  <ul className="space-y-1">
                    {data.funding.map((fund, idx) => (
                      <li key={idx} className="text-gray-600">• {fund}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {data.acknowledgments && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Acknowledgments</h3>
                  <p className="text-gray-600">{data.acknowledgments}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Authors */}
        {data.authors.length > 0 && (
          <div className="mt-8 bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Authors</h2>
            <div className="flex flex-wrap gap-3">
              {data.authors.map((author, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg text-sm"
                >
                  {author}
                </span>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
