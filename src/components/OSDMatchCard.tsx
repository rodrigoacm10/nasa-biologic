import { ensureOsdById, OSD } from "@/lib/osds-detail";
import { renderSimilarityDots } from "@/lib/rendersSimilarityStars";
import { Circle, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export const OSDMatchCard = ({ osd }: any) => {
  const similarityPct = Math.round((osd.similarity ?? 0) * 100);
  const conf = (osd.confidence || "").toLowerCase() as
    | "low"
    | "moderate"
    | "high"
    | string;

  const confStyle =
    conf === "high"
      ? "bg-emerald-500/30 text-emerald-100 border-emerald-400/30"
      : conf === "moderate"
      ? "bg-amber-500/30 text-amber-100 border-amber-400/30"
      : "bg-gray-500/30 text-gray-100 border-gray-400/30";

  return (
    <Link href={`/osds/${osd.osd_id}`}>
      <div
        key={`${osd.osd_id}]`}
        className="flex-shrink-0 w-[420px] sm:w-[540px] p-5 rounded-2xl shadow-xl backdrop-blur-[10px] border border-white/30 bg-white/10 snap-start"
      >
        <div className="flex flex-col gap-3 h-full">
          <div className="grid grid-cols-[90px_1fr] gap-2">
            <div className="rounded-2xl shadow-xl backdrop-blur-[10px] border border-white/30 bg-white/10 snap-start flex items-center justify-center overflow-hidden p-2">
              <img
                src="/src/icons/bacharel.svg"
                alt="icon osd"
                className="w-full h-full object-contain"
              />
            </div>

            <div>
              <div className="flex items-start gap-2 flex-wap">
                <h3 className="text-white font-bold text-lg">{osd.osd_id}</h3>
              </div>

              <p className="text-sm sm:text-base text-gray-300/90 leadng-tight line-clamp-2">
                {osd.title}
              </p>

              <div className="flex">
                <p className="flex items-center gap-2 text-sm text-gray-300/90 leadng-tight line-clamp-2">
                  <span>
                    <img
                      src="/src/icons/peoples.svg"
                      alt="icon osd"
                      className="w-full h-full object-contain"
                    />
                  </span>{" "}
                  {5} authors
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-2">
            <div className="bg-[#53A1EF] rounded-2xl p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="w-[20px] h-[20px]">
                  <img
                    src="/src/icons/dna.svg"
                    alt="icon osd"
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3 className="font-medium text-white flex gap items-center">
                  Organisms
                </h3>
              </div>

              <p className="text-xs text-gray-300/90">mouse</p>
            </div>

            <div className="bg-[#2C782D] rounded-2xl p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="w-[20px] h-[20px]">
                  <img
                    src="/src/icons/dna.svg"
                    alt="icon osd"
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3 className="font-medium text-white flex gap items-center">
                  Description
                </h3>
              </div>

              <p className="text-xs text-gray-300/90">mouse</p>
            </div>

            <div className="bg-[#821F63] rounded-2xl p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="w-[20px] h-[20px]">
                  <img
                    src="/src/icons/dna.svg"
                    alt="icon osd"
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3 className="font-medium text-white flex gap items-center">
                  Organisms
                </h3>
              </div>

              <p className="text-xs text-gray-300/90">Mouse</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-white/20">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-300">Similarity</span>
              <div className="flex items-center gap-2">
                {renderSimilarityDots(similarityPct)}
                <span className="text-sm font-semibold text-white">
                  {similarityPct}%
                </span>
              </div>
            </div>

            {osd.url && (
              <a
                href={osd.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-500/30 hover:bg-blue-500/40 text-blue-100 border border-blue-400/30 text-xs sm:text-sm transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open
              </a>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};
