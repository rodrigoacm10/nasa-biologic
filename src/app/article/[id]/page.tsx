'use client'

import { useState, useEffect, useRef } from 'react'
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
  Layers,
  FlaskConical,
  ShieldCheck,
  Circle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { OSDMatchCard } from '@/components/OSDMatchCard'
import ModalRelation from '@/components/ModalRelation'

export type MatchEntry = {
  osd_id: string
  title: string
  similarity: number
  confidence?: 'low' | 'moderate' | 'high' | string
  method?: string
  url?: string
}

export type ArticleMatches = {
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
  const carouselRef = useRef<HTMLDivElement>(null)

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

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 400
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
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
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
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

  console.log('Article ->', data)
  console.log('MATches -><>', matches)

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'methods', label: 'Methods', icon: Beaker },
    { id: 'results', label: 'Results', icon: FileText },
    { id: 'experimental', label: 'Experimental', icon: FlaskConical },
  ]

  console.log('DATA -><>')

  const hasMatches = matches?.osd_matches && matches.osd_matches.length > 0

  return (
    <div className="min-h-screen bg-[url('/src/images/background/test.png')] bg-fixed bg-cover bg-center py-6 sm:py-12 md:py-20 lg:py-30 px-4 sm:px-6 md:px-10 lg:px-16">
      <div className="fixed w-full h-full bg-black/60 top-0 left-0 z-10"></div>
      <div className="relative space-y-8">
        {/* Main Content Modal */}
        <div className="relative">
          <div className="absolute w-full h-full rounded-2xl sm:rounded-3xl lg:rounded-[50px] shadow-xl backdrop-blur-[10px] border border-white/50 bg-black/20"></div>

          <header className="relative py-6 sm:py-8 md:py-10 lg:py-12 font-bricolage z-30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-300 transition-colors mb-3 sm:mb-4"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">Back to catalog</span>
              </Link>

              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-3xl max-w-full lg:max-w-180 font-bold text-white mb-3 leading-tight">
                {data?.title || ''}
              </h1>

              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                  {data?.year || ''}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                  {data?.authors?.length ?? 0} authors
                </span>
                {data?.url && (
                  <a
                    href={data.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
                  >
                    <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                    View original
                  </a>
                )}
                <ModalRelation article={data} osdMathces={matches}> 
                    <div className="p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    Open Modal
                  </div>
                </ModalRelation>
              </div>
            </div>
          </header>

          <main className="relative max-w-7xl mx-auto px-4 sm:px-6 pb-4 sm:pb-6 md:pb-8 z-30">
            {data?.keywords?.length > 0 && (
              <div className="mb-6">
                <h2 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3">
                  Keywords
                </h2>
                <div className="flex flex-wrap gap-2">
                  {data.keywords.map((keyword, idx) => (
                    <span
                      key={idx}
                      className="inline-flex justify-center items-center gap-2 py-1.5 sm:py-2 px-3 sm:px-4 rounded-2xl sm:rounded-[25px] shadow-xl backdrop-blur-[10px] border border-white/20 bg-black/40 text-xs sm:text-sm"
                    >
                      <Tag className="w-3 h-3" />
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tabs Navigation */}
            <div className="border-b border-gray-200 mb-4 sm:mb-6 -mx-4 sm:mx-0">
              <nav className="flex gap-4 sm:gap-6 overflow-x-auto px-4 sm:px-0 scrollbar-hide">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 sm:gap-2 px-1 py-2 sm:py-3 border-b-2 transition-colors whitespace-nowrap text-sm sm:text-base ${
                        activeTab === tab.id
                          ? 'border-white text-white'
                          : 'border-transparent text-gray-400 hover:text-gray-300'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  )
                })}
              </nav>
            </div>

            {/* Tab Content with Side Image */}
            <div className="relative">
              <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
                {/* Content */}
                <div className="max-w-full lg:max-w-200">
                  {activeTab === 'overview' && (
                    <div className="space-y-4 sm:space-y-6">
                      <div>
                        <h2 className="text-xl sm:text-2xl font-semibold text-white mb-2 sm:mb-3">
                          Abstract
                        </h2>
                        <p className="text-sm sm:text-base text-gray-300/90 leading-relaxed">
                          {data?.abstract}
                        </p>
                      </div>

                      <div>
                        <h2 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3">
                          Key Insights
                        </h2>
                        <p className="text-sm sm:text-base text-gray-300/90 leading-relaxed">
                          {data?.insights_summary}
                        </p>
                      </div>

                      {data?.technologies?.length > 0 && (
                        <div>
                          <h2 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3">
                            Technologies Used
                          </h2>
                          <div className="flex flex-wrap gap-2">
                            {data.technologies.map((tech, idx) => (
                              <span
                                key={idx}
                                className="py-1.5 sm:py-2 px-3 sm:px-4 rounded-2xl sm:rounded-[25px] shadow-xl backdrop-blur-[10px] border border-white/20 bg-pink-500/30 text-xs sm:text-sm font-medium text-white"
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
                    <div className="space-y-4 sm:space-y-6">
                      <div>
                        <h2 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3">
                          Methods
                        </h2>
                        <p className="text-sm sm:text-base text-gray-300/90 leading-relaxed">
                          {data?.sections?.methods}
                        </p>
                      </div>

                      {data?.sections?.introduction && (
                        <div>
                          <h2 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3">
                            Introduction
                          </h2>
                          <p className="text-sm sm:text-base text-gray-300/90 leading-relaxed">
                            {data.sections.introduction}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'results' && (
                    <div className="space-y-4 sm:space-y-6">
                      <div>
                        <h2 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3">
                          Results
                        </h2>
                        <p className="text-sm sm:text-base text-gray-300/90 leading-relaxed">
                          {data?.sections?.results}
                        </p>
                      </div>

                      {data?.sections?.discussion && (
                        <div>
                          <h2 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3">
                            Discussion
                          </h2>
                          <p className="text-sm sm:text-base text-gray-300/90 leading-relaxed">
                            {data.sections.discussion}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'experimental' && (
                    <div className="space-y-4 sm:space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        {data?.experimental_factors?.age_at_sampling && (
                          <div className="space-y-2">
                            <h3 className="text-sm sm:text-base font-semibold text-white flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-300" />
                              Age at Sampling
                            </h3>
                            <p className="text-sm sm:text-base text-gray-300/90">
                              {data.experimental_factors?.age_at_sampling_detail
                                ?.raw ||
                                data.experimental_factors?.age_at_sampling}
                            </p>
                          </div>
                        )}

                        {data?.experimental_factors?.duration && (
                          <div className="space-y-2">
                            <h3 className="text-sm sm:text-base font-semibold text-white flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-300" />
                              Duration
                            </h3>
                            <p className="text-sm sm:text-base text-gray-300/90">
                              {data.experimental_factors?.duration_detail
                                ?.raw || data.experimental_factors?.duration}
                            </p>
                          </div>
                        )}
                      </div>

                      {data?.funding && data.funding.length > 0 && (
                        <div>
                          <h3 className="text-sm sm:text-base font-semibold text-white mb-2 sm:mb-3">
                            Funding
                          </h3>
                          <ul className="space-y-1">
                            {data.funding.map((fund, idx) => (
                              <li
                                key={idx}
                                className="text-sm sm:text-base text-gray-300/90"
                              >
                                • {fund}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {data?.acknowledgments && (
                        <div>
                          <h3 className="text-sm sm:text-base font-semibold text-white mb-2 sm:mb-3">
                            Acknowledgments
                          </h3>
                          <p className="text-sm sm:text-base text-gray-300/90">
                            {data.acknowledgments}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* <div className="hidden lg:flex items-start justify-center pt-8">
                  <img 
                    src="/src/images/organism/molecule.png" 
                    alt="Molecule visualization" 
                    className="w-full max-w-[450px] opacity-60 drop-shadow-lg"
                  />
                </div> */}

                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3 sm:gap-4 max-w-full lg:max-w-120 mb-6 sm:mb-8 font-bricolage">
                  {data?.experimental_factors?.organism && (
                    <div className="flex flex-col justify-center py-3 sm:py-4 pl-3 sm:pl-4 pr-3 rounded-2xl sm:rounded-[25px] shadow-xl backdrop-blur-[10px] border border-white/20 bg-blue-400/30">
                      <div className="flex flex-row items-center gap-2 mb-1">
                        <Dna className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        <h3 className="font-normal text-lg sm:text-xl text-white">
                          Organism
                        </h3>
                      </div>
                      <p className="text-sm sm:text-base text-white font-normal break-words">
                        {data.experimental_factors.organism}
                      </p>
                    </div>
                  )}

                  {data?.experimental_factors?.tissue_list?.length > 0 && (
                    <div className="flex flex-col justify-center py-3 sm:py-4 pl-3 sm:pl-4 pr-3 rounded-2xl sm:rounded-[25px] shadow-xl backdrop-blur-[10px] border border-white/20 bg-green-500/50">
                      <div className="flex items-center gap-2 mb-1">
                        <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        <h3 className="font-normal text-lg sm:text-xl text-white">
                          Tissue
                        </h3>
                      </div>
                      <p className="text-sm sm:text-base text-white break-words">
                        {data.experimental_factors.tissue_list.join(', ')}
                      </p>
                    </div>
                  )}

                  {data?.experimental_factors?.treatment_list?.length > 0 && (
                    <div className="flex flex-col justify-center py-3 sm:py-4 pl-3 sm:pl-4 pr-3 rounded-2xl sm:rounded-[25px] shadow-xl backdrop-blur-[10px] border border-white/20 bg-pink-500/50">
                      <div className="flex items-center gap-2 mb-1">
                        <Microscope className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        <h3 className="font-normal text-lg sm:text-xl text-white">
                          Treatment
                        </h3>
                      </div>
                      <p className="text-sm sm:text-base text-white break-words">
                        {data.experimental_factors.treatment_list.join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Authors */}
            {data?.authors?.length > 0 && (
              <div className="mt-6 sm:mt-8 p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">
                  Authors
                </h2>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {data.authors.map((author, idx) => (
                    <span
                      key={idx}
                      className="py-1.5 sm:py-2 px-3 sm:px-4 rounded-2xl sm:rounded-[25px] shadow-xl backdrop-blur-[10px] border border-white/20 bg-black/40 text-xs sm:text-sm text-white"
                    >
                      {author}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>

        {/* Matches Carousel - Outside Modal */}
        {hasMatches && matches && (
          <div className="relative">
            <div className="absolute w-full h-full rounded-2xl sm:rounded-3xl lg:rounded-[50px] shadow-xl backdrop-blur-[10px] border border-white/50 bg-black/20"></div>

            <div className="relative z-30 py-6 sm:py-8 px-4 sm:px-6">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <div>
                    <h2 className="text-2xl! sm:text-2xl font-bold text-white mb-2 flex items-center gap-2">
                      OSD Matches
                    </h2>
                    {/* <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <span className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-blue-500/30 text-blue-100 rounded-lg text-xs sm:text-sm border border-blue-400/30">
                        Total compared: {matches.total_osds_compared}
                      </span>
                      <span className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-green-500/30 text-green-100 rounded-lg text-xs sm:text-sm border border-green-400/30">
                        Matches found: {matches.matches_found}
                      </span>
                    </div> */}
                  </div>

                  <div className="hidden sm:flex gap-2">
                    <button
                      onClick={() => scrollCarousel('left')}
                      className="p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/30 transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-white" />
                    </button>
                    <button
                      onClick={() => scrollCarousel('right')}
                      className="p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/30 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>

                <div
                  ref={carouselRef}
                  className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {matches.osd_matches.map((m, idx) => {
                    return <OSDMatchCard osd={m} key={idx} />
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
