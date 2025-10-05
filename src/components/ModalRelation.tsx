'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { ArticleMatches } from '@/app/article/[id]/page'
import { Article } from '@/@types/article'
import { renderSimilarityDots } from '@/lib/rendersSimilarityStars'

type BucketKey = 'A' | 'B' | 'C' | 'D'

export default function ModalRelation({
  article,
  osdMathces,
}: {
  article: Article['article']
  osdMathces: ArticleMatches | null | undefined
}) {
  const [open, setOpen] = useState(false)
  const [hoveredOsd, setHoveredOsd] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  
  useEffect(() => {
    if (open) {
      document.body.classList.add('overflow-hidden')
    } else {
      document.body.classList.remove('overflow-hidden')
    }
    return () => document.body.classList.remove('overflow-hidden')
  }, [open])

  
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  
  useEffect(() => {
    if (open) {
      setScale(1)
      setPosition({ x: 0, y: 0 })
    }
  }, [open])

  
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!open) return
      e.preventDefault()
    
      const delta = e.deltaY * -0.001
      const newScale = Math.min(Math.max(0.5, scale + delta), 3)
      setScale(newScale)
    }

    if (open && containerRef.current) {
      containerRef.current.addEventListener('wheel', handleWheel, { passive: false })
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('wheel', handleWheel)
      }
    }
  }, [open, scale])

  
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return 
    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  
  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 3))
  }

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.5))
  }

  const handleResetView = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  
  const bucketFor = (s: number): BucketKey => {
    if (s >= 0.75) return 'A'
    if (s >= 0.65) return 'B'
    if (s >= 0.40) return 'C'
    return 'D'
  }

  
  const distributionStats = useMemo(() => {
    if (!osdMathces || osdMathces.osd_matches.length === 0) {
      return { mean: 0.5, stdDev: 0.2, min: 0, max: 1 }
    }
  
    const similarities = osdMathces.osd_matches.map(m => m.similarity)
    const mean = similarities.reduce((a, b) => a + b, 0) / similarities.length
    const variance = similarities.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / similarities.length
    const stdDev = Math.sqrt(variance)
    const min = Math.min(...similarities)
    const max = Math.max(...similarities)
  
    return { mean, stdDev, min, max }
  }, [osdMathces])

  
  const bucketRadiusRange = useMemo(() => {
    
    const { mean, stdDev } = distributionStats
  
    
    const spreadFactor = Math.max(1, 1.5 - stdDev)
  
    
    const scaleFactor = mean < 0.5 ? 1.3 : 1
  
    
    const baseRanges: Record<BucketKey, { min: number; max: number }> = {
      A: { min: 160, max: 300 },
      B: { min: 360, max: 520 },
      C: { min: 600, max: 770 },
      D: { min: 850, max: 1050 },
    }
  
    return Object.entries(baseRanges).reduce((acc, [key, range]) => {
      acc[key as BucketKey] = {
        min: range.min * scaleFactor,
        max: range.max * scaleFactor * spreadFactor
      }
      return acc
    }, {} as Record<BucketKey, { min: number; max: number }>)
  }, [distributionStats])

  
  const radiusInsideBucket = (s: number, b: BucketKey, index: number, totalInBucket: number) => {
    const { min, max } = bucketRadiusRange[b]
    const ranges: Record<BucketKey, [number, number]> = {
      A: [0.75, 1],
      B: [0.65, 0.74],
      C: [0.4, 0.64],
      D: [0, 0.39],
    }
    const [lo, hi] = ranges[b]
  
    
    const t = hi > lo ? Math.min(1, Math.max(0, (s - lo) / (hi - lo))) : 0
  
    
    const eased = 1 - Math.pow(t, 1.3)
  
    
    const base = min + (max - min) * eased
  
    
    const indexVariation = (index % 7) * ((max - min) / 7)
  
    
    const jitterRange = (max - min) * 0.6 
    const jitter = (Math.random() - 0.5) * jitterRange
  
    
    const hashVariation = (s * 1000 % 1) * ((max - min) / 5)
  
    const finalRadius = base + indexVariation + jitter + hashVariation
  
    return Math.max(min, Math.min(max, finalRadius))
  }

  
  const osdPositions = useMemo(() => {
    if (!osdMathces) return []
  
    const matches = osdMathces.osd_matches
    const total = matches.length || 1
  
    
    const bucketsCount: Record<BucketKey, number> = { A: 0, B: 0, C: 0, D: 0 }
    const bucketsIndices: Record<BucketKey, number> = { A: 0, B: 0, C: 0, D: 0 }
  
    matches.forEach(m => {
      const b = bucketFor(m.similarity)
      bucketsCount[b]++
    })
  
    return matches.map((m, i) => {
      const b = bucketFor(m.similarity)
      const indexInBucket = bucketsIndices[b]++
      const totalInBucket = bucketsCount[b]
    
      
      const radius = radiusInsideBucket(m.similarity, b, indexInBucket, totalInBucket)
    
      
      const baseAngle = (i / total) * 2 * Math.PI
    
      
      const angleJitter = (Math.random() - 0.5) * 2.5
    
      
      const bucketAngleOffset = (indexInBucket / Math.max(1, totalInBucket)) * 1.0
    
      const angle = baseAngle + angleJitter + bucketAngleOffset
    
      return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        angle,
        radius,
      }
    })
  }, [osdMathces, bucketRadiusRange])

  
  const getColorBorder = (s: number) => {
    const b = bucketFor(s)
    if (b === 'A') return 'border-green-500/40'
    if (b === 'B') return 'border-yellow-500/40'
    if (b === 'C') return 'border-orange-500/40'
    return 'border-red-500/40'
  }

  const getColorbg = (s: number) => {
    const b = bucketFor(s)
    if (b === 'A') return 'bg-green-500/30'
    if (b === 'B') return 'bg-yellow-500/30'
    if (b === 'C') return 'bg-orange-500/30'
    return 'bg-red-500/30'
  }

  
  const sizeFromSimilarity = (s: number) => {
    const base = 52
    const maxBoost = 60
    const eased = Math.pow(Math.max(0, Math.min(1, s)), 0.85)
    return base + maxBoost * eased
  }

  const modalContent = open && osdMathces && (
    <div className="fixed inset-0 z-[9999]" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/90"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Fullscreen content */}
      <div className="relative z-[10000] flex flex-col w-screen h-screen">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-black/80">
          <button
            onClick={() => setOpen(false)}
            className="text-white hover:text-gray-300 transition flex items-center gap-2"
          >
            <X className="w-5 h-5" />
            Close
          </button>

          {/* Zoom controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition text-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <span className="text-white text-sm min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition text-white"
              title="Zoom In"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <button
              onClick={handleResetView}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition text-white ml-2"
              title="Reset View"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Central area filling everything */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-hidden flex items-center justify-center"
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Container that moves and scales content */}
          <div 
            className="relative w-full h-full flex items-center justify-center"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            }}
          >
            {/* Circular center */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="relative z-10 bg-gradient-to-br from-blue-900 to-purple-900 rounded-full shadow-2xl p-8 w-64 h-64 flex flex-col items-center justify-center text-center pointer-events-none"
            >
              <h2 className="text-lg font-bold text-white mb-2 line-clamp-3">
                {article.title}
              </h2>
              <p className="text-gray-300 text-xs mb-2 line-clamp-2">
                {article.authors.slice(0, 2).join(', ')}
                {article.authors.length > 2 && ' et al.'}
              </p>
              <div className="text-gray-400 text-[10px] mb-3">
                {article.journal} • {article.year}
              </div>
              <div className="pt-3 border-t border-gray-600 w-full">
                <p className="text-xs text-gray-300 font-semibold">
                  {osdMathces.matches_found} matches
                </p>
              </div>
            </motion.div>

            {/* OSD nodes */}
            {osdMathces.osd_matches.map((match, index) => {
              const position = osdPositions[index]
              const size = sizeFromSimilarity(match.similarity)
              const similarityPct = Math.round((match.similarity ?? 0) * 100)

              return (
                <motion.div
                  key={match.osd_id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.6, delay: index * 0.05 }}
                  className="absolute pointer-events-auto"
                  style={{
                    left: `calc(50% + ${position.x}px)`,
                    top: `calc(50% + ${position.y}px)`,
                    width: `${size}px`,
                    height: `${size}px`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: hoveredOsd === match.osd_id ? 1000 : 'auto',
                  }}
                >
                  {/* Line connecting to center */}
                  <svg
                    className="absolute pointer-events-none"
                    style={{
                      left: `${size / 2}px`,
                      top: `${size / 2}px`,
                      width: `${position.radius}px`,
                      height: '2px',
                      transformOrigin: '0 0',
                      transform: `rotate(${position.angle}rad)`,
                    }}
                  >
                    <line
                      x1="0"
                      y1="0"
                      x2={position.radius}
                      y2="0"
                      stroke="rgba(156, 163, 175, 0.22)"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                  </svg>

                  {/* OSD node */}
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{
                      scale: 1,
                      opacity: 1,
                    }}
                    transition={{ duration: 0.6, delay: index * 0.05 }}
                    onHoverStart={() => setHoveredOsd(match.osd_id)}
                    onHoverEnd={() => setHoveredOsd(null)}
                    className={`
                      ${getColorBorder(match.similarity)} backdrop-blur-[10px] border-2 bg-white/30 snap-start 
                      rounded-full shadow-lg cursor-pointer transition-[box-shadow,transform] duration-200 ${
                        hoveredOsd === match.osd_id ? 'ring-4 ring-white/50' : ''
                      }`}
                    style={{
                      width: `${size}px`,
                      height: `${size}px`,
                    }}
                  >
                    <div className="w-full h-full flex flex-col items-center justify-center p-2">
                      <p className="text-white font-bold text-xs truncate w-full text-center px-1">
                        {match.osd_id}
                      </p>
                      <div className={getColorbg(match.similarity) + ' w-full h-[1px] my-2'}></div>
                      <div>
                        {renderSimilarityDots(similarityPct)}
                      </div>
                      <p className="text-white text-[10px] mt-1 font-semibold">
                        {(match.similarity * 100).toFixed(0)}%
                      </p>
                    </div>
                  </motion.div>

                  {/* Tooltip */}
                  {hoveredOsd === match.osd_id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute top-full mt-4 bg-gray-900 text-white p-4 rounded-lg shadow-2xl z-20 min-w-[250px] left-1/2 transform -translate-x-1/2 border border-gray-700"
                    >
                      <p className="font-bold text-sm mb-2 text-blue-400">
                        {match.title}
                      </p>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-300">
                          <span className="font-semibold">
                            Similarity:
                          </span>{' '}
                          {(match.similarity * 100).toFixed(1)}%
                        </p>
                        {match.confidence && (
                          <p className="text-xs text-gray-300">
                            <span className="font-semibold">
                              Confidence:
                            </span>{' '}
                            {match.confidence}
                          </p>
                        )}
                        {match.method && (
                          <p className="text-xs text-gray-300">
                            <span className="font-semibold">Method:</span>{' '}
                            {match.method}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )
            })}
          </div>

          {/* Fixed legend on screen */}
          <div className="fixed bottom-8 right-8 bg-black/70 backdrop-blur-sm rounded-lg p-4 border border-gray-700 pointer-events-auto z-[10001]">
            <p className="text-white text-sm font-bold mb-3">
              Similarity
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded-full" />
                <span className="text-white text-xs">≥ 75%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500 rounded-full" />
                <span className="text-white text-xs">65–74%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-500 rounded-full" />
                <span className="text-white text-xs">40–64%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded-full" />
                <span className="text-white text-xs">&lt; 40%</span>
              </div>
            </div>
            <p className="text-gray-400 text-[10px] mt-3 italic">
              Closer = higher similarity
            </p>
          </div>

          {/* Fixed instructions on screen */}
          <div className="fixed bottom-8 left-8 bg-black/70 backdrop-blur-sm rounded-lg p-3 border border-gray-700 pointer-events-none z-[10001]">
            <p className="text-white text-xs mb-1">🖱️ Drag to move</p>
            <p className="text-white text-xs">🔍 Scroll to zoom</p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <button
        disabled={!osdMathces}
        onClick={() => setOpen(true)}
        className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-500 disabled:cursor-help"
      >
        Open Modal
      </button>
      {mounted && modalContent && createPortal(modalContent, document.body)}
    </>
  )
}