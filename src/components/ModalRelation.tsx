"use client";

import { useState, useMemo, useEffect, useRef, ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { motion } from "framer-motion";
import { ArticleMatches } from "@/app/article/[id]/page";
import { Article } from "@/@types/article";

type BucketKey = "A" | "B" | "C" | "D";

export default function ModalRelation({
  article,
  osdMathces,
  children,
}: {
  article: Article["article"];
  osdMathces: ArticleMatches | null | undefined;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [hoveredOsd, setHoveredOsd] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const [scale, setScale] = useState(0.6);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => document.body.classList.remove("overflow-hidden");
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [open]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!open) return;
      e.preventDefault();

      const delta = e.deltaY * -0.001;
      const newScale = Math.min(Math.max(0.5, scale + delta), 3);
      setScale(newScale);
    };

    if (open && containerRef.current) {
      containerRef.current.addEventListener("wheel", handleWheel, {
        passive: false,
      });
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener("wheel", handleWheel);
      }
    };
  }, [open, scale]);

  const goToOsd = (
    e: React.MouseEvent | React.KeyboardEvent,
    osdId: string
  ) => {
    const formattedOsdId = osdId.replace(/^OSD-/, "");

    if (("metaKey" in e && e.metaKey) || ("ctrlKey" in e && e.ctrlKey)) {
      window.open(`/osds/${formattedOsdId}`, "_blank", "noopener,noreferrer");
      return;
    }
    router.push(`/osds/${formattedOsdId}`);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  };

  const handleResetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const bucketFor = (s: number): BucketKey => {
    if (s >= 0.72) return "A";
    if (s >= 0.6) return "B";
    if (s >= 0.4) return "C";
    return "D";
  };

  const distributionStats = useMemo(() => {
    if (!osdMathces || osdMathces.osd_matches.length === 0) {
      return { mean: 0.5, stdDev: 0.2, min: 0, max: 1 };
    }

    const similarities = osdMathces.osd_matches.map((m) => m.similarity);
    const mean = similarities.reduce((a, b) => a + b, 0) / similarities.length;
    const variance =
      similarities.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      similarities.length;
    const stdDev = Math.sqrt(variance);
    const min = Math.min(...similarities);
    const max = Math.max(...similarities);

    return { mean, stdDev, min, max };
  }, [osdMathces]);

  const bucketRadiusRange = useMemo(() => {
    const { mean, stdDev } = distributionStats;

    const spreadFactor = Math.max(1.2, 1.8 - stdDev);
    const scaleFactor = mean < 0.5 ? 1.4 : 1.1;

    const baseRanges: Record<BucketKey, { min: number; max: number }> = {
      A: { min: 80, max: 140 },
      B: { min: 160, max: 230 },
      C: { min: 560, max: 740 },
      D: { min: 875, max: 1060 },
    };

    return Object.entries(baseRanges).reduce((acc, [key, range]) => {
      acc[key as BucketKey] = {
        min: range.min * scaleFactor,
        max: range.max * scaleFactor * spreadFactor,
      };
      return acc;
    }, {} as Record<BucketKey, { min: number; max: number }>);
  }, [distributionStats]);

  const radiusInsideBucket = (
    s: number,
    b: BucketKey,
    index: number,
    totalInBucket: number
  ) => {
    const { min, max } = bucketRadiusRange[b];
    const ranges: Record<BucketKey, [number, number]> = {
      A: [0.75, 1],
      B: [0.65, 0.74],
      C: [0.4, 0.64],
      D: [0, 0.39],
    };
    const [lo, hi] = ranges[b];
    const t = hi > lo ? Math.min(1, Math.max(0, (s - lo) / (hi - lo))) : 0;

    const eased = 1 - Math.pow(t, 2.0);
    const base = min + (max - min) * eased;

    const range = max - min;
    const indexVariation = (index % 11) * (range / 18);
    const jitterRange = range * 0.35;
    const jitter = (Math.random() - 0.5) * jitterRange;
    const hashVariation = ((s * 1000) % 1) * (range / 12);
    const densitySpread =
      totalInBucket > 4 ? (Math.random() - 0.5) * (range * 0.25) : 0;

    const finalRadius =
      base + indexVariation + jitter + hashVariation + densitySpread;
    return Math.max(min, Math.min(max, finalRadius));
  };

  const getColorBg = (s: number) => {
    const b = bucketFor(s);
    if (b === "A") return "from-emerald-400/90 to-teal-500/90";
    if (b === "B") return "from-amber-400/90 to-yellow-500/90";
    if (b === "C") return "from-orange-400/90 to-rose-400/90";
    return "from-rose-400/90 to-pink-500/90";
  };

  const getBorderGlow = (s: number) => {
    const b = bucketFor(s);
    if (b === "A") return "shadow-emerald-500/50";
    if (b === "B") return "shadow-amber-500/50";
    if (b === "C") return "shadow-orange-500/50";
    return "shadow-rose-500/50";
  };

  const getHoverRing = (s: number) => {
    const b = bucketFor(s);
    if (b === "A") return "ring-emerald-400/60";
    if (b === "B") return "ring-amber-400/60";
    if (b === "C") return "ring-orange-400/60";
    return "ring-rose-400/60";
  };

  const sizeFromSimilarity = (s: number) => {
    const base = 58;
    const maxBoost = 68;
    const eased = Math.pow(Math.max(0, Math.min(1, s)), 0.85);
    return base + maxBoost * eased;
  };

  // ==== NOVO: Solver de colisões e posicionamento determinístico ====

  // Espaçamento mínimo entre bordas das bolhas (aumente para mais folga)
  const PADDING = 6;

  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, v));

  // PRNG determinístico por id (para estabilidade visual entre renders)
  const seeded = (key: string) => {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < key.length; i++) {
      h ^= key.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return () => {
      h += 0x6d2b79f5;
      let t = Math.imul(h ^ (h >>> 15), 1 | h);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  type Node = {
    id: string;
    r: number; // raio do círculo (size/2)
    orbit: number; // raio orbital (distância ao centro)
    orbitMin: number;
    orbitMax: number;
    x: number;
    y: number;
    angle: number;
  };

  const osdPositions = useMemo(() => {
    if (!osdMathces || !osdMathces.osd_matches?.length) return [];

    const matches = osdMathces.osd_matches;

    // Contagem por bucket para distribuir ângulos
    const bucketsCount: Record<BucketKey, number> = { A: 0, B: 0, C: 0, D: 0 };
    const bucketsIndex: Record<BucketKey, number> = { A: 0, B: 0, C: 0, D: 0 };
    for (const m of matches) bucketsCount[bucketFor(m.similarity)]++;

    // 1) Posicionamento inicial
    const nodes: Node[] = matches.map((m, i) => {
      const b = bucketFor(m.similarity);
      const idxInB = bucketsIndex[b]++;
      const totalInB = Math.max(1, bucketsCount[b]);
      const orbit = radiusInsideBucket(m.similarity, b, idxInB, totalInB);

      const rnd = seeded(`${m.osd_id}:${i}`);
      const baseAngle = (idxInB / totalInB) * Math.PI * 2;
      const angleJitter = (rnd() - 0.5) * 1.2; // jitter determinístico
      const angle = baseAngle + angleJitter;

      const size = sizeFromSimilarity(m.similarity);
      const r = size / 2;

      const { min, max } = bucketRadiusRange[b];

      return {
        id: m.osd_id,
        r,
        orbit,
        orbitMin: min,
        orbitMax: max,
        angle,
        x: Math.cos(angle) * orbit,
        y: Math.sin(angle) * orbit,
      };
    });

    // 2) Relaxação por colisões
    const MAX_ITERS = 140;
    for (let iter = 0; iter < MAX_ITERS; iter++) {
      let moved = false;

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const ni = nodes[i];
          const nj = nodes[j];

          let dx = nj.x - ni.x;
          let dy = nj.y - ni.y;
          let dist = Math.hypot(dx, dy);

          // se coincidirem, dá um empurrão determinístico
          if (dist === 0) {
            const bumpRnd = seeded(ni.id + nj.id)();
            const bump = 0.5 + bumpRnd * 0.5;
            nj.x += bump;
            nj.y -= bump;
            dx = nj.x - ni.x;
            dy = nj.y - ni.y;
            dist = Math.hypot(dx, dy);
          }

          const minDist = ni.r + nj.r + PADDING;
          if (dist < minDist) {
            const overlap = (minDist - dist) / 2;

            const ux = dx / dist;
            const uy = dy / dist;

            // separa em direções opostas
            ni.x -= ux * overlap;
            ni.y -= uy * overlap;
            nj.x += ux * overlap;
            nj.y += uy * overlap;

            // Reprojeção para o anel do bucket (clamp no raio)
            for (const n of [ni, nj]) {
              const ang = Math.atan2(n.y, n.x);
              let rad = Math.hypot(n.x, n.y);
              rad = clamp(rad, n.orbitMin, n.orbitMax);
              n.angle = ang;
              n.orbit = rad;
              n.x = Math.cos(ang) * rad;
              n.y = Math.sin(ang) * rad;
            }

            moved = true;
          }
        }
      }

      if (!moved) break;
    }

    // 3) Formato esperado pelo render
    return nodes.map((n) => ({
      x: n.x,
      y: n.y,
      angle: n.angle,
      radius: n.orbit, // usado na linha de conexão
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [osdMathces, bucketRadiusRange]);

  const modalContent = open && osdMathces && (
    <div className="fixed inset-0 z-[9999]" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-gradient-to-br from-gray-950 via-slate-950 to-gray-950"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      <div className="relative z-[10000] flex flex-col w-screen h-screen">
        {/* Glass Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-black/40 backdrop-blur-xl border-b border-white/10">
          <button
            onClick={() => setOpen(false)}
            className="text-white/90 hover:text-white transition-all flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 backdrop-blur-sm"
          >
            <X className="w-5 h-5" />
            <span className="font-medium">Close</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleZoomOut}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-white backdrop-blur-sm"
              title="Zoom Out"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <div className="px-4 py-2 bg-white/10 rounded-xl backdrop-blur-sm">
              <span className="text-white text-sm font-semibold">
                {Math.round(scale * 100)}%
              </span>
            </div>
            <button
              onClick={handleZoomIn}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-white backdrop-blur-sm"
              title="Zoom In"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            {/* <button
              onClick={handleResetView}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-white backdrop-blur-sm ml-2"
              title="Reset View"
            >
              <Maximize2 className="w-5 h-5" />
            </button> */}
          </div>
        </div>

        <div
          ref={containerRef}
          className="flex-1 overflow-hidden flex items-center justify-center"
          style={{ cursor: isDragging ? "grabbing" : "grab" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            className="relative w-full h-full flex items-center justify-center"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transition: isDragging ? "none" : "transform 0.1s ease-out",
            }}
          >
            {/* Central Glass Node */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="relative z-10 bg-gradient-to-br from-blue-950/40 via-purple-950/40 to-indigo-950/40 backdrop-blur-2xl border border-white/20 rounded-full shadow-2xl p-10 w-80 h-80 flex flex-col items-center justify-center text-center pointer-events-none"
              style={{
                boxShadow:
                  "0 0 80px rgba(99, 102, 241, 0.2), inset 0 0 60px rgba(255, 255, 255, 0.03)",
              }}
            >
              <h2 className="text-xl font-bold text-white mb-3 line-clamp-3 drop-shadow-lg">
                {article.title}
              </h2>
              <p className="text-gray-200 text-sm mb-3 line-clamp-2">
                {article.authors.slice(0, 2).join(", ")}
                {article.authors.length > 2 && " et al."}
              </p>
              <div className="text-gray-300 text-xs mb-4">
                {article.journal} • {article.year}
              </div>
              <div className="pt-4 border-t border-white/20 w-full">
                <p className="text-sm text-white font-semibold">
                  {osdMathces.matches_found} matches found
                </p>
              </div>
            </motion.div>

            {/* OSD Nodes */}
            {osdMathces.osd_matches.map((match, index) => {
              const pos = osdPositions[index];
              const size = sizeFromSimilarity(match.similarity);
              const similarityPct = Math.round((match.similarity ?? 0) * 100);

              return (
                <motion.div
                  key={match.osd_id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    duration: 0.8,
                    delay: index * 0.03,
                    ease: "easeOut",
                  }}
                  className="absolute pointer-events-auto"
                  style={{
                    left: `calc(50% + ${pos.x}px)`,
                    top: `calc(50% + ${pos.y}px)`,
                    width: `${size}px`,
                    height: `${size}px`,
                    transform: "translate(-50%, -50%)",
                    zIndex: hoveredOsd === match.osd_id ? 1000 : "auto",
                  }}
                >
                  {/* Connection Line */}
                  <svg
                    className="absolute pointer-events-none opacity-30"
                    style={{
                      left: `${size / 2}px`,
                      top: `${size / 2}px`,
                      width: `${pos.radius}px`,
                      height: "2px",
                      transformOrigin: "0 0",
                      transform: `rotate(${pos.angle}rad)`,
                    }}
                  >
                    <line
                      x1="0"
                      y1="0"
                      x2={pos.radius}
                      y2="0"
                      stroke="rgba(255, 255, 255, 0.2)"
                      strokeWidth="1.5"
                      strokeDasharray="6 6"
                    />
                  </svg>

                  {/* Glass OSD Node */}
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                    onHoverStart={() => setHoveredOsd(match.osd_id)}
                    onHoverEnd={() => setHoveredOsd(null)}
                    // ↓↓↓ ADIÇÕES IMPORTANTES ↓↓↓
                    onMouseDown={(e) => {
                      // evita que o clique na bolha comece o "drag" do mapa
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      // se estiver arrastando, não navega
                      if (isDragging) return;
                      goToOsd(e, match.osd_id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        goToOsd(e, match.osd_id);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`Abrir OSD ${match.osd_id}`}
                    title={`Abrir OSD ${match.osd_id}`}
                    className={`
    bg-gradient-to-br ${getColorBg(match.similarity)}
    backdrop-blur-xl border border-white/30
    rounded-full shadow-2xl ${getBorderGlow(match.similarity)}
    cursor-pointer transition-all duration-300
    ${
      hoveredOsd === match.osd_id
        ? `ring-4 ${getHoverRing(match.similarity)} shadow-lg`
        : ""
    }
  `}
                    style={{
                      width: `${size}px`,
                      height: `${size}px`,
                      boxShadow:
                        hoveredOsd === match.osd_id
                          ? `0 0 40px rgba(255, 255, 255, 0.3), 0 20px 60px rgba(0, 0, 0, 0.4)`
                          : `0 8px 32px rgba(0, 0, 0, 0.3)`,
                    }}
                  >
                    <div className="w-full h-full flex flex-col items-center justify-center p-3 relative">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none" />
                      <p className="text-white font-bold text-sm truncate w-full text-center px-2 drop-shadow-lg relative z-10">
                        {match.osd_id}
                      </p>
                      <div className="w-3/4 h-[2px] my-2 rounded-full bg-white/30 backdrop-blur-sm relative z-10" />
                      <p className="text-white text-lg font-bold drop-shadow-lg relative z-10">
                        {similarityPct}%
                      </p>
                    </div>
                  </motion.div>

                  {/* Glass Tooltip */}
                  {hoveredOsd === match.osd_id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full mt-4 bg-black/90 backdrop-blur-xl text-white p-5 rounded-2xl shadow-2xl z-20 min-w=[280px] left-1/2 transform -translate-x-1/2 border border-white/20"
                      style={{
                        boxShadow:
                          "0 20px 60px rgba(0, 0, 0, 0.6), inset 0 0 20px rgba(255, 255, 255, 0.03)",
                      }}
                    >
                      <p className="font-bold text-base mb-3 text-blue-300 leading-tight">
                        {match.title}
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between py-2 px-3 bg-white/5 rounded-lg">
                          <span className="font-semibold text-sm text-gray-300">
                            Similarity
                          </span>
                          <span className="text-white font-bold">
                            {(match.similarity * 100).toFixed(1)}%
                          </span>
                        </div>
                        {match.confidence && (
                          <div className="flex items-center justify-between py-2 px-3 bg-white/5 rounded-lg">
                            <span className="font-semibold text-sm text-gray-300">
                              Confidence
                            </span>
                            <span className="text-white font-medium">
                              {match.confidence}
                            </span>
                          </div>
                        )}
                        {match.method && (
                          <div className="flex items-center justify-between py-2 px-3 bg-white/5 rounded-lg">
                            <span className="font-semibold text-sm text-gray-300">
                              Method
                            </span>
                            <span className="text-white font-medium">
                              {match.method}
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Glass Legend */}
          <div className="fixed bottom-8 right-8 bg-black/70 backdrop-blur-2xl rounded-2xl p-5 border border-white/20 pointer-events-auto z-[10001] shadow-2xl">
            <p className="text-white text-base font-bold mb-4">
              Similarity Scale
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 group">
                <div className="w-5 h-5 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full shadow-lg shadow-emerald-500/50" />
                <span className="text-white text-sm font-medium">
                  ≥ 72% - Excellent
                </span>
              </div>
              <div className="flex items-center gap-3 group">
                <div className="w-5 h-5 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full shadow-lg shadow-amber-500/50" />
                <span className="text-white text-sm font-medium">
                  60–71% - Good
                </span>
              </div>
              <div className="flex items-center gap-3 group">
                <div className="w-5 h-5 bg-gradient-to-br from-orange-400 to-rose-400 rounded-full shadow-lg shadow-orange-500/50" />
                <span className="text-white text-sm font-medium">
                  40–59% - Fair
                </span>
              </div>
              <div className="flex items-center gap-3 group">
                <div className="w-5 h-5 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full shadow-lg shadow-rose-500/50" />
                <span className="text-white text-sm font-medium">
                  &lt; 40% - Poor
                </span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-gray-400 text-xs italic">
                Closer to center = Higher similarity
              </p>
            </div>
          </div>

          {/* Glass Instructions */}
          <div className="fixed bottom-8 left-8 bg-black/70 backdrop-blur-2xl rounded-2xl p-4 border border-white/20 pointer-events-none z-[10001] shadow-2xl">
            <p className="text-white text-sm mb-2 flex items-center gap-2">
              <span className="text-lg">🖱️</span>
              <span className="font-medium">Drag to move</span>
            </p>
            <p className="text-white text-sm flex items-center gap-2">
              <span className="text-lg">🔍</span>
              <span className="font-medium">Scroll to zoom</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* esse button eu quero q seja um chilcren, mas caso apertar vai abrir um modal, quero por ex colocar uma div, um card e caso aperte, abra o modal */}
      <div
        onClick={() => osdMathces && setOpen(true)}
        className={`${
          !osdMathces ? "cursor-not-allowed opacity-60" : "cursor-pointer"
        }`}
      >
        {children}
      </div>
      {mounted && modalContent && createPortal(modalContent, document.body)}
    </>
  );
}
