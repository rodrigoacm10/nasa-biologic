"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Loader2, Filter, ChevronDown } from "lucide-react";
import VaultCard from "./VaultCard";
import type { VaultProps } from "./VaultCard";
import { ensureAllOsdsCached } from "@/lib/osds-cache";
import type { Article } from "@/@types/article";

const ResponsiveContainer = dynamic(
  () => import("recharts").then((m) => m.ResponsiveContainer),
  { ssr: false }
);
const ScatterChart = dynamic(
  () => import("recharts").then((m) => m.ScatterChart),
  { ssr: false }
);
const Scatter = dynamic(() => import("recharts").then((m) => m.Scatter), {
  ssr: false,
});
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), {
  ssr: false,
});
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), {
  ssr: false,
});
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), {
  ssr: false,
});

type OSD = {
  investigation: {
    id: string;
    title?: string;
    mission?: { name?: string; start_date?: string; end_date?: string };
    factors?: string[];
  };
  study?: {
    samples?: Array<{
      characteristics?: { Organism?: string; [k: string]: any };
    }>;
  };
};

interface AllMatchesEntry {
  article_id: string;
  article_title: string;
  total_osds_compared: number;
  matches_found: number;
  osd_matches: Array<{
    osd_id: string;
    title: string;
    similarity: number;
    confidence: string;
    method: string;
  }>;
}

interface VaultRow extends VaultProps {
  key: string;
  organismKey: string;
  treatmentKey: string;
  /** Derived for plotting to satisfy Recharts TS types */
  topicCoveragePct: number; // 0..100
}

const nowYear = new Date().getFullYear();

function parseYearMaybe(str?: string | number | null): number | null {
  if (!str) return null;
  const s = String(str);
  const m = s.match(/(19|20)\d{2}/);
  return m ? Number(m[0]) : null;
}

function missionYear(osd?: OSD): number | null {
  return (
    parseYearMaybe(osd?.investigation?.mission?.end_date) ||
    parseYearMaybe(osd?.investigation?.mission?.start_date) ||
    null
  );
}

function pickFirst<T>(arr?: T[]): T | undefined {
  return arr && arr.length > 0 ? arr[0] : undefined;
}

function strNorm(v?: string | null) {
  return (v || "").trim().toLowerCase();
}

function titleFromFactors(
  organism?: string,
  treatment?: string,
  tissue?: string
) {
  const bits = [organism, treatment, tissue].filter(Boolean);
  return bits.length ? bits.join(" + ") : "Unknown gap";
}

function scoreVault({
  coverage,
  avgMatch,
  lastYear,
  missingFactors,
  connections,
}: {
  coverage: number;
  avgMatch: number;
  lastYear: number | null;
  missingFactors: number;
  connections: number;
}) {
  const lowCoverage = 1 - Math.max(0, Math.min(1, coverage));
  const lowAvg = 1 - Math.max(0, Math.min(1, avgMatch));
  const recencyGap = lastYear
    ? Math.max(0, Math.min(1, (nowYear - lastYear) / 12))
    : 0.5;
  const lowConnections = 1 - Math.max(0, Math.min(1, connections / 250));
  const wCoverage = 0.35,
    wAvg = 0.25,
    wRecency = 0.2,
    wMissing = 0.15,
    wConn = 0.05;
  const raw =
    wCoverage * lowCoverage +
    wAvg * lowAvg +
    wRecency * recencyGap +
    wMissing * missingFactors +
    wConn * lowConnections;
  return Math.round(100 * Math.max(0, Math.min(1, raw)));
}

export default function VaultsTab({
  matchesUrl = "/data/all_matches.json",
}: {
  matchesUrl?: string;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [allMatches, setAllMatches] = useState<AllMatchesEntry[]>([]);
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [allOsds, setAllOsds] = useState<OSD[]>([]);

  const [organismFilter, setOrganismFilter] = useState("");
  const [treatmentFilter, setTreatmentFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [minScore, setMinScore] = useState(60);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(matchesUrl).catch(() =>
          fetch("/api/all_matches")
        );
        if (!res || !res.ok) throw new Error("Cannot load all_matches.json");
        const matches: AllMatchesEntry[] = await res.json();
        setAllMatches(matches || []);

        const aRes = await fetch("/api/articles?limit=9999");
        const aJson = await aRes.json();
        setAllArticles(aJson.articles || []);

        const osds = await ensureAllOsdsCached("/api/osds");
        setAllOsds(Array.isArray(osds) ? osds : []);
      } catch (e: any) {
        setError(e?.message || "Failed to load Vaults");
      } finally {
        setLoading(false);
      }
    })();
  }, [matchesUrl]);

  const { vaults, organisms, treatments, years } = useMemo(() => {
    const artIndex = new Map<string, Article>();
    allArticles.forEach((a) => {
      const id = (a as any).article?.id || (a as any).id || "";
      if (id) artIndex.set(id, a);
    });

    const osdIndex = new Map<string, OSD>();
    allOsds.forEach((o) => osdIndex.set(o.investigation?.id, o));

    const rows: VaultRow[] = [];

    for (const entry of allMatches) {
      const article = artIndex.get(entry.article_id);
      const ef = (article as any)?.article?.experimental_factors || {};

      const organism = ef.organism_raw || ef.organism || "";
      const treatment =
        Array.isArray(ef.treatment_list) && ef.treatment_list.length > 0
          ? ef.treatment_list[0]
          : ef.treatment_raw || ef.treatment || "";
      const tissue =
        Array.isArray(ef.tissue_list) && ef.tissue_list.length > 0
          ? ef.tissue_list[0]
          : ef.tissue || "";

      const avgMatch =
        (entry.osd_matches?.reduce((s, m) => s + (m.similarity || 0), 0) || 0) /
        Math.max(1, entry.osd_matches?.length || 1);
      const connections = entry.matches_found || entry.osd_matches?.length || 0;
      const coverage = Math.max(
        0,
        Math.min(1, connections / Math.max(1, entry.total_osds_compared || 1))
      );

      const yearsTmp: number[] = [];
      for (const m of entry.osd_matches || []) {
        const osd = osdIndex.get(m.osd_id);
        const y = missionYear(osd);
        if (y) yearsTmp.push(y);
      }
      const articleYear = parseYearMaybe((article as any)?.article?.year);
      if (articleYear) yearsTmp.push(articleYear);
      const lastYear = yearsTmp.length ? Math.max(...yearsTmp) : null;

      const oTok = strNorm(organism).split(/\s+/).filter(Boolean)[0] || "";
      const tTok = strNorm(treatment).split(/\s+/).filter(Boolean)[0] || "";
      let missing = 0;
      let denom = 0;
      for (const m of entry.osd_matches || []) {
        const t = strNorm(m.title);
        if (!t) continue;
        denom++;
        const ok = (oTok && t.includes(oTok)) || (tTok && t.includes(tTok));
        if (!ok) missing++;
      }
      const missingFactors = denom ? missing / denom : 0.5;

      const score = scoreVault({
        coverage,
        avgMatch,
        lastYear,
        missingFactors,
        connections,
      });

      const title = titleFromFactors(organism, treatment, tissue);

      const row: VaultRow = {
        key: `${entry.article_id}`,
        title,
        score,
        organism: organism || "Unknown",
        treatment: treatment || "Unspecified",
        tissue: tissue || undefined,
        metrics: { avgMatch, connections, coverage, lastYear, missingFactors },
        insight: insightFromRow({
          organism,
          treatment,
          tissue,
          coverage,
          avgMatch,
          missingFactors,
        }),
        href: `/search?tab=osds&q=${encodeURIComponent(
          [organism, treatment, tissue].filter(Boolean).join(" ")
        )}`,
        organismKey: strNorm(organism),
        treatmentKey: strNorm(treatment),
        topicCoveragePct: Math.round((coverage || 0) * 100),
      };

      rows.push(row);
    }

    rows.sort((a, b) => b.score - a.score);

    const organisms = Array.from(
      new Set(rows.map((r) => r.organism).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
    const treatments = Array.from(
      new Set(rows.map((r) => r.treatment).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
    const years = Array.from(
      new Set(
        rows.flatMap(
          (r) => (r.metrics.lastYear ? [r.metrics.lastYear] : []) as number[]
        )
      )
    ).sort((a, b) => a - b);

    return { vaults: rows, organisms, treatments, years };
  }, [allMatches, allArticles, allOsds]);

  const filtered = useMemo(() => {
    return (vaults || []).filter((v) => {
      if (organismFilter && strNorm(v.organism) !== strNorm(organismFilter))
        return false;
      if (treatmentFilter && strNorm(v.treatment) !== strNorm(treatmentFilter))
        return false;
      if (
        yearFilter &&
        v.metrics.lastYear &&
        String(v.metrics.lastYear) !== String(yearFilter)
      )
        return false;
      if (minScore && v.score < minScore) return false;
      return true;
    });
  }, [vaults, organismFilter, treatmentFilter, yearFilter, minScore]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="p-6 rounded-3xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl">
          <Loader2 className="w-10 h-10 text-blue-400 animate-spin mx-auto" />
          <p className="mt-2 text-gray-200 text-sm text-center">
            Loading Vaults…
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-red-100">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 p-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          Vaults — Knowledge Gaps in Space Biology
        </h1>
        <p className="mt-2 text-sm text-gray-300">
          We analyze connections between Articles and OSDs to surface topics
          with low coverage or outdated evidence. The{" "}
          <span className="text-white font-semibold">VaultScore (0–100)</span>{" "}
          prioritizes low coverage, low average similarity, and weak recency —
          the spots where new studies can contribute the most.
        </p>
        <div className="mt-3 text-[11px] sm:text-xs text-gray-400 flex flex-wrap gap-x-4 gap-y-1">
          <span>
            <span className="text-white/90 font-semibold">Coverage</span>: % of
            related OSDs
          </span>
          <span>
            <span className="text-white/90 font-semibold">AvgMatch</span>:
            average similarity
          </span>
          <span>
            <span className="text-white/90 font-semibold">LastYear</span>: most
            recent year
          </span>
        </div>
      </header>

      {/* Controls */}
      <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-3 text-white/90">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-semibold">Filters</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Select
            label="Organism"
            value={organismFilter}
            onChange={setOrganismFilter}
            options={["", ...organisms]}
          />
          <Select
            label="Treatment"
            value={treatmentFilter}
            onChange={setTreatmentFilter}
            options={["", ...treatments]}
          />
          <Select
            label="Year"
            value={yearFilter}
            onChange={setYearFilter}
            options={["", ...years.map(String)]}
          />
          <div>
            <label className="text-xs text-gray-300">
              Min VaultScore: {minScore}
            </label>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((v, idx) => {
          const { key: reactKey, organismKey, treatmentKey, ...cardProps } = v;
          return (
            <div
              key={reactKey}
              className="animate-in fade-in duration-300"
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              <VaultCard {...cardProps} />
            </div>
          );
        })}
      </section>

      {/* Scatter plot */}
      <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
        <h3 className="text-white font-semibold mb-3">Vault landscape</h3>
        <div className="h-72">
          <ResponsiveContainer>
            <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <XAxis
                type="number"
                dataKey="score"
                name="VaultScore"
                domain={[0, 100]}
                tick={{ fill: "#ddd", fontSize: 12 }}
                label={{
                  value: "VaultScore",
                  position: "insideBottom",
                  dy: 10,
                  fill: "#ccc",
                }}
              />
              <YAxis
                type="number"
                dataKey="topicCoveragePct"
                name="TopicCoverage%"
                domain={[0, 100]}
                tick={{ fill: "#ddd", fontSize: 12 }}
                label={{
                  value: "TopicCoverage (%)",
                  angle: -90,
                  position: "insideLeft",
                  dx: -5,
                  fill: "#ccc",
                }}
              />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={({ payload }) => {
                  const p =
                    payload && payload[0] && (payload[0].payload as VaultRow);
                  if (!p) return null;
                  return (
                    <div className="rounded-lg border border-white/10 bg-black/70 p-2 text-xs text-white">
                      <div className="font-semibold">{p.title}</div>
                      <div>Score: {p.score}</div>
                      <div>Coverage: {p.topicCoveragePct}%</div>
                      <div>AvgMatch: {p.metrics.avgMatch.toFixed(2)}</div>
                    </div>
                  );
                }}
              />
              <Scatter data={filtered} fill="#a78bfa" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <label className="text-xs text-gray-300">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white pr-8"
        >
          {options.map((opt, i) => (
            <option
              key={`${label}-${opt}-${i}`}
              value={opt}
              className="bg-gray-900"
            >
              {opt || `All ${label.toLowerCase()}s`}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>
    </div>
  );
}

function insightFromRow({
  organism,
  treatment,
  tissue,
  coverage,
  avgMatch,
  missingFactors,
}: {
  organism?: string;
  treatment?: string;
  tissue?: string;
  coverage: number;
  avgMatch: number;
  missingFactors: number;
}) {
  const pieces: string[] = [];
  if (organism && treatment)
    pieces.push(
      `Few studies connect ${organism} and ${treatment}${
        tissue ? ` in ${tissue}` : ""
      }.`
    );
  if (coverage < 0.15) pieces.push("Low coverage of related datasets.");
  if (avgMatch < 0.5) pieces.push("Weak average similarity between articles and OSDs.");
  if (missingFactors > 0.5)
    pieces.push("OSD titles rarely mention the article's key factors.");
  return pieces.join(" ");
}
