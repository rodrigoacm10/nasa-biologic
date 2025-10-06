"use client";

import Link from "next/link";
import {
  Calendar,
  Microscope,
  ChevronRight,
  Dna,
  Layers,
  Globe,
} from "lucide-react";

export default function OSDCard({ osd }: { osd: any }) {
  const inv = osd.investigation || {};
  const mission = inv.mission || {};
  const project = inv.project || {};
  const assays = osd.assays || [];
  const organism = osd.study?.samples?.[0]?.characteristics?.Organism;

  const osdId: string | null =
    typeof inv.id === "string" && inv.id.length ? inv.id : null;
  const href = osdId ? `/osds/${osdId}` : undefined;

  const firstAssay = assays[0];
  const assayText = firstAssay
    ? `${firstAssay.type || ""}${
        firstAssay.platform ? ` • ${firstAssay.platform}` : ""
      }`
    : "—";

  const factorSet = new Set<string>(inv.factors || []);
  osd.study?.samples?.forEach((s: any) =>
    Object.values(s.factors || {}).forEach((v: any) => v && factorSet.add(v))
  );
  const factorArr = Array.from(factorSet).slice(0, 3);

  const CardInner = (
    <div className="group relative overflow-hidden rounded-2xl sm:rounded-3xl h-full backdrop-blur-xl bg-white/10 border border-white/20 hover:border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col">
      {/* Overlay minimalista */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-all duration-500 pointer-events-none" />

      <div className="relative p-5 sm:p-6 space-y-4 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white line-clamp-2 group-hover:text-blue-300 transition-colors leading-tight">
              {inv.title || "Untitled"}
            </h3>
            {organism && (
              <div className="flex items-center gap-2 mt-2 text-xs sm:text-sm text-gray-300">
                <div className="p-1.5 rounded-lg bg-blue-500/30">
                  <Dna className="w-3.5 h-3.5 text-blue-200" />
                </div>
                <span className="italic truncate">{organism}</span>
              </div>
            )}
          </div>

          {inv.id && (
            <div className="px-2 py-1 rounded-md bg-white/10 border border-white/20 text-[11px] font-mono text-gray-300">
              {inv.id}
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-xs sm:text-sm text-gray-300/90 line-clamp-3 leading-relaxed">
          {inv.description || "No description available"}
        </p>

        {/* Factors */}
        {factorArr.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {factorArr.map((f, i) => (
              <span
                key={i}
                className="px-2.5 py-1 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs rounded-lg"
              >
                {f}
              </span>
            ))}
          </div>
        )}

        {/* Experimental info */}
        <div className="space-y-2">
          {assayText && assayText !== "—" && (
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-500/30">
                <Microscope className="w-3.5 h-3.5 text-purple-200" />
              </div>
              <span className="text-xs sm:text-sm text-gray-300 truncate">
                {assayText}
              </span>
            </div>
          )}

          {mission?.name && (
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-green-500/30">
                <Calendar className="w-3.5 h-3.5 text-green-200" />
              </div>
              <span className="text-xs sm:text-sm text-gray-300 truncate">
                {mission.name}
              </span>
            </div>
          )}

          {project?.managing_center && (
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/30">
                <Globe className="w-3.5 h-3.5 text-cyan-200" />
              </div>
              <span className="text-xs sm:text-sm text-gray-300 truncate">
                {project.managing_center}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10 mt-auto">
          <span className="text-xs text-gray-400">
            {mission?.link || project?.link ? "External resources" : " "}
          </span>
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-300 group-hover:translate-x-1 transition-all flex-shrink-0" />
        </div>
      </div>

      {/* Shine effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      </div>
    </div>
  );

  return href ? (
    <Link href={href} aria-label={`Open ${inv.id || "OSD"}`}>
      {CardInner}
    </Link>
  ) : (
    <div aria-disabled className="opacity-70 cursor-not-allowed">
      {CardInner}
    </div>
  );
}
