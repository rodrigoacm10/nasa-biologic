'use client'

import { useState, useEffect, ReactNode } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Article } from '@/@types/article'
import {
  ArrowLeft,
  Calendar,
  Users,
  ExternalLink,
  Dna,
  Microscope,
  Clock,
  FileText,
  Tag,
  Beaker,
  BookOpen,
  Loader2,
  CoinsIcon,
  FlaskConical,
  ShieldCheck,
  Circle,
} from 'lucide-react'

type MatchEntry = {
  osd_id: string
  title: string
  similarity: number
  confidence?: 'low' | 'moderate' | 'high' | string
  method?: string
  url?: string
}

type ArticleMatches = {
  article_id: string
  article_title: string
  total_osds_compared: number
  matches_found: number
  osd_matches: MatchEntry[]
}

type APIResponse = {
  article: Article['article']
  matches?: ArticleMatches | null
}

export default function ArticleDetail() {
  const params = useParams()
  const [article, setArticle] = useState<APIResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (params.id) {
      fetchArticle(params.id as string)
    }
  }, [params.id])

  const fetchArticle = async (id: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/articles/${id}`)
      const data = await response.json()
      setArticle(data)
    } catch (error) {
      console.error('Error fetching article:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    )
  }

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Article not found
          </h2>
          <Link href="/" className="text-blue-600 hover:text-blue-700">
            Return to catalog
          </Link>
        </div>
      </div>
    )
  }

  const { article: data, matches } = article

  const baseTabs: any = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'methods', label: 'Methods', icon: Beaker },
    { id: 'results', label: 'Results', icon: FileText },
    { id: 'experimental', label: 'Experimental', icon: FlaskConical },
  ]

  // Verifica se há matches válidas
  const hasMatches = matches?.osd_matches && matches.osd_matches.length > 0
  const matchCount = hasMatches ? matches.osd_matches.length : 0

  // Sempre adiciona a aba, mas com estado disabled se não houver matches
  const tabs = [
    ...baseTabs,
    {
      id: 'matches',
      label: `Matches (${matchCount})`,
      icon: ShieldCheck,
      disabled: !hasMatches,
    },
  ]

  // Função para renderizar as bolinhas de similaridade
  const renderSimilarityDots = (similarityPct: number) => {
    let dotsCount = 1
    let color = 'text-gray-400'

    if (similarityPct > 75) {
      dotsCount = 3
      color = 'text-emerald-500'
    } else if (similarityPct > 65) {
      dotsCount = 2
      color = 'text-amber-500'
    }

    return (
      <div className="flex items-center gap-1">
        {[...Array(3)].map((_, i) => (
          <Circle
            key={i}
            className={`w-2 h-2 ${i < dotsCount ? color : 'text-gray-200'}`}
            fill="currentColor"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[url('/src/images/background/test.png')] bg-fixed bg-cover bg-center py-30 px-16">
        <div className="fixed w-full h-full bg-black/60 top-0 left-0 z-10"></div>
        <div className="relative">
        <div className="absolute w-full h-full rounded-[50px] shadow-xl backdrop-blur-[10px] border border-white/50 bg-black/20"></div>

        <header className="relative py-12 font-bricolage z-30">
            <div className="max-w-7xl mx-auto">
            <Link
                href="/"
                className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-300 transition-colors mb-4"
            >
                <ArrowLeft className="w-5 h-5" />
                Back to catalog
            </Link>

            <h1 className="text-4xl! md:text-3xl max-w-180 font-bold text-white mb-3">
                {data?.title || ""}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {data?.year || ""}
                </span>
                <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {data?.authors?.length ?? 0} authors
                </span>
                {data?.url && (
                <a
                    href={data.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
                >
                    <ExternalLink className="w-4 h-4" />
                    View original
                </a>
                )}
            </div>
            </div>
        </header>

        <main className="relative max-w-7xl mx-auto px-4 py-8 z-30">
            {/* Key Information Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-180 mb-8 font-bricolage">
            {data?.experimental_factors?.organism && (
                <div className="flex flex-col justify-center pl-4 rounded-[25px] shadow-xl backdrop-blur-[10px] border border-white/20 bg-blue-400/30">
                <div className="flex flex-row items-center gap-2">
                    <Dna className="w-5 h-5 text-white" />
                    <h3 className="font-normal text-xl text-white">Organism</h3>
                </div>
                <p className="text-white font-normal">
                    {data.experimental_factors.organism}
                </p>
                </div>
            )}

            {data?.experimental_factors?.tissue_list?.length > 0 && (
                <div className="flex flex-col justify-center pl-4 rounded-[25px] shadow-xl backdrop-blur-[10px] border border-white/20 bg-green-500/60">
                <div className="flex items-center gap-2 mb-2">
                    <CoinsIcon className="w-5 h-5 text-white" />
                    <h3 className="font-normal text-xl text-white">Tissue</h3>
                </div>
                <p className="text-white">
                    {data.experimental_factors.tissue_list.join(", ")}
                </p>
                </div>
            )}

            {data?.experimental_factors?.treatment_list?.length > 0 && (
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                <div className="flex items-center gap-2 mb-2">
                    <Microscope className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold text-purple-900">Treatment</h3>
                </div>
                <p className="text-purple-700">
                    {data.experimental_factors.treatment_list.join(", ")}
                </p>
                </div>
            )}
            </div>

            {/* Tabs Navigation (agora respeita disabled) */}
            <div className="border-b border-gray-200 mb-6">
            <nav className="flex gap-6 overflow-x-auto">
                {tabs.map((tab) => {
                const Icon = tab.icon
                const isDisabled = tab?.disabled
                return (
                    <button
                    key={tab.id}
                    onClick={() => !isDisabled && setActiveTab(tab.id)}
                    disabled={isDisabled}
                    className={`flex items-center gap-2 px-1 py-3 border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === tab.id
                        ? "border-blue-600 text-blue-600"
                        : isDisabled
                        ? "border-transparent text-gray-300 cursor-not-allowed"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                    >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{tab.label}</span>
                    </button>
                )
                })}
            </nav>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
            {activeTab === "overview" && (
                <div className="space-y-6">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">
                    Abstract
                    </h2>
                    <p className="text-gray-600 leading-relaxed">
                    {data?.abstract}
                    </p>
                </div>

                <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">
                    Key Insights
                    </h2>
                    <p className="text-gray-600 leading-relaxed">
                    {data?.insights_summary}
                    </p>
                </div>

                {data?.keywords?.length > 0 && (
                    <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">
                        Keywords
                    </h2>
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

                {data?.technologies?.length > 0 && (
                    <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">
                        Technologies Used
                    </h2>
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

            {activeTab === "methods" && (
                <div className="space-y-6">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">
                    Methods
                    </h2>
                    <p className="text-gray-600 leading-relaxed">
                    {data?.sections?.methods}
                    </p>
                </div>

                {data?.sections?.introduction && (
                    <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">
                        Introduction
                    </h2>
                    <p className="text-gray-600 leading-relaxed">
                        {data.sections.introduction}
                    </p>
                    </div>
                )}
                </div>
            )}

            {activeTab === "results" && (
                <div className="space-y-6">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">
                    Results
                    </h2>
                    <p className="text-gray-600 leading-relaxed">
                    {data?.sections?.results}
                    </p>
                </div>

                {data?.sections?.discussion && (
                    <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">
                        Discussion
                    </h2>
                    <p className="text-gray-600 leading-relaxed">
                        {data.sections.discussion}
                    </p>
                    </div>
                )}
                </div>
            )}

            {activeTab === "experimental" && (
                <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {data?.experimental_factors?.age_at_sampling && (
                    <div className="space-y-2">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-600" />
                        Age at Sampling
                        </h3>
                        <p className="text-gray-600">
                        {data.experimental_factors?.age_at_sampling_detail?.raw ||
                            data.experimental_factors?.age_at_sampling}
                        </p>
                    </div>
                    )}

                    {data?.experimental_factors?.duration && (
                    <div className="space-y-2">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-600" />
                        Duration
                        </h3>
                        <p className="text-gray-600">
                        {data.experimental_factors?.duration_detail?.raw ||
                            data.experimental_factors?.duration}
                        </p>
                    </div>
                    )}
                </div>

                {data?.funding && data.funding.length > 0 && (
                    <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Funding</h3>
                    <ul className="space-y-1">
                        {data.funding.map((fund, idx) => (
                        <li key={idx} className="text-gray-600">
                            • {fund}
                        </li>
                        ))}
                    </ul>
                    </div>
                )}

                {data?.acknowledgments && (
                    <div>
                    <h3 className="font-semibold text-gray-900 mb-3">
                        Acknowledgments
                    </h3>
                    <p className="text-gray-600">{data.acknowledgments}</p>
                    </div>
                )}
                </div>
            )}

            {/* NOVA ABA: Matches */}
            {activeTab === "matches" && matches && hasMatches && (
                <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm">
                    Total OSDs compared: {matches.total_osds_compared}
                    </span>
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm">
                    Matches found: {matches.matches_found}
                    </span>
                </div>

                <ul className="divide-y divide-gray-100">
                    {matches.osd_matches.map((m, idx) => {
                    const similarityPct = Math.round((m.similarity ?? 0) * 100)
                    const conf = (m.confidence || "").toLowerCase() as
                        | "low"
                        | "moderate"
                        | "high"
                        | string

                    const confStyle =
                        conf === "high"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                        : conf === "moderate"
                        ? "bg-amber-50 text-amber-700 border-amber-100"
                        : "bg-gray-50 text-gray-700 border-gray-100"

                    return (
                        <li key={`${m.osd_id}-${idx}`} className="py-5">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                                {m.osd_id}
                                </span>
                                <h3 className="text-base md:text-lg font-semibold text-gray-900">
                                {m.title}
                                </h3>
                            </div>

                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                <span
                                className={`text-xs px-2 py-1 rounded border ${confStyle}`}
                                >
                                Confidence: {m.confidence ?? "n/a"}
                                </span>
                                {m.method && (
                                <span className="text-xs px-2 py-1 rounded border bg-blue-50 text-blue-700 border-blue-100">
                                    Method: {m.method}
                                </span>
                                )}
                            </div>
                            </div>

                            <div className="flex items-center gap-4">
                            <div className="flex flex-col items-end gap-1">
                                <span className="text-xs text-gray-500">Similarity</span>
                                <div className="flex items-center gap-2">
                                {renderSimilarityDots(similarityPct)}
                                <span className="text-sm font-semibold text-gray-700">
                                    {similarityPct}%
                                </span>
                                </div>
                            </div>
                            </div>
                        </div>

                        {m.url && (
                            <div className="mt-3">
                            <a
                                href={m.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Open OSD record
                            </a>
                            </div>
                        )}
                        </li>
                    )
                    })}
                </ul>
                </div>
            )}
            </div>

            {/* Authors */}
            {data?.authors?.length > 0 && (
            <div className="mt-8 bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Authors
                </h2>
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
    </div>
    );
}
