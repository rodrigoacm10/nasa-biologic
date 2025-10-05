'use client';

import { motion } from 'framer-motion';
import { Info, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';

export interface VaultProps {
  title: string;
  score: number; // 0–100
  organism: string;
  treatment: string;
  tissue?: string;
  metrics: {
    avgMatch: number; // 0–1
    connections: number; // integer
    coverage: number; // 0–1
    lastYear: number | null;
    missingFactors: number; // 0–1
  };
  insight: string;
  /** Optional: where to send the user when clicking Explore */
  href?: string;
}

export default function VaultCard({ title, score, organism, treatment, tissue, metrics, insight, href }: VaultProps) {
  const pct = Math.max(0, Math.min(100, Math.round(score)));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 sm:p-5 hover:bg-white/10 transition-colors"
    >
      {/* Glow */}
      <div className="pointer-events-none absolute -inset-1 opacity-20 [mask-image:radial-gradient(60%_60%_at_50%_0%,black,transparent)]" style={{ background: 'radial-gradient(60% 60% at 50% 0%, rgba(56,189,248,0.35), rgba(168,85,247,0.2), transparent)' }} />

      {/* Header */}
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-white leading-snug">{title}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-blue-500/20 border border-blue-400/30 px-2 py-1 text-blue-100">{organism || 'Unknown organism'}</span>
            <span className="rounded-full bg-pink-500/20 border border-pink-400/30 px-2 py-1 text-pink-100">{treatment || 'Unspecified treatment'}</span>
            {tissue && (
              <span className="rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2 py-1 text-emerald-100">{tissue}</span>
            )}
          </div>
        </div>

        {/* Score Gauge */}
        <div className="relative grid place-items-center w-16 h-16">
          <div
            className="w-16 h-16 rounded-full grid place-items-center text-white text-xs font-bold"
            style={{
              background: `conic-gradient(#a78bfa ${pct * 3.6}deg, rgba(255,255,255,0.08) ${pct * 3.6}deg)`,
            }}
            aria-label={`VaultScore ${pct}`}
          >
            <div className="w-12 h-12 rounded-full bg-black/60 border border-white/10 grid place-items-center">
              <span>{pct}</span>
            </div>
          </div>
          <span className="mt-1 text-[10px] text-gray-300">VaultScore</span>
        </div>
      </div>

      {/* Metrics */}
      <div className="relative mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2">
        <Metric label="AvgMatch" value={(metrics.avgMatch ?? 0).toFixed(2)} />
        <Metric label="Connections" value={metrics.connections?.toString() ?? '0'} />
        <Metric label="Coverage" value={`${Math.round((metrics.coverage ?? 0) * 100)}%`} />
        <Metric label="LastYear" value={metrics.lastYear ? String(metrics.lastYear) : '—'} />
        <Metric label="MissingOverlap" value={`${Math.round((metrics.missingFactors ?? 0) * 100)}%`} />
      </div>

      {/* Insight */}
      <div className="relative mt-3 text-sm text-gray-200/90 flex items-start gap-2">
        <Info className="w-4 h-4 mt-0.5 text-purple-300" />
        <p className="leading-snug">{insight}</p>
      </div>

      {/* CTA */}
      {href && (
        <div className="mt-4">
          <Link
            href={href}
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/20 transition-colors"
          >
            <LinkIcon className="w-4 h-4" />
            Explore related datasets
          </Link>
        </div>
      )}
    </motion.div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-2">
      <div className="text-[10px] uppercase tracking-wide text-gray-400">{label}</div>
      <div className="text-sm font-semibold text-white">{value}</div>
    </div>
  );
}