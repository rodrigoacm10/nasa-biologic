"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Rocket,
  Calendar,
  Microscope,
  Cpu,
  Database,
  MapPin,
  ExternalLink,
  Beaker,
  BookOpen,
  FileText,
  FlaskConical,
  Users,
  Tag,
} from "lucide-react";
import type { OSD } from "@/lib/osds-detail";
import { ensureOsdById } from "@/lib/osds-detail";

export default function OSDDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<OSD | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "samples" | "assays" | "project">(
    "overview"
  );

  useEffect(() => {
    if (!id) return;
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const osd = await ensureOsdById(id as string, "/api/osds");
        if (!alive) return;
        setData(osd);
      } catch (e) {
        console.error(e);
        if (alive) setData(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[url('/src/images/background/test.png')] bg-fixed bg-cover bg-center flex items-center justify-center">
        <div className="fixed w-full h-full bg-black/70 top-0 left-0 z-0"></div>
        <div className="relative z-10 p-6 rounded-3xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin mb-4" />
          <p className="text-gray-200">Loading OSD...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[url('/src/images/background/test.png')] bg-fixed bg-cover bg-center flex items-center justify-center px-6">
        <div className="fixed w-full h-full bg-black/70 top-0 left-0 z-0"></div>
        <div className="relative z-10 text-center p-8 rounded-3xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl">
          <Database className="w-16 h-16 text-gray-400 mb-4 mx-auto" />
          <h2 className="text-2xl font-bold text-white mb-2">OSD not found</h2>
          <Link href="/" className="text-blue-300 hover:text-blue-200">
            Return to catalog
          </Link>
        </div>
      </div>
    );
  }

  const inv = data.investigation;
  const samples = data.study?.samples ?? [];
  const assays = data.assays ?? [];

  const tabs = [
    { id: "overview", label: "Overview", icon: BookOpen },
    { id: "samples", label: `Samples (${samples.length})`, icon: FlaskConical },
    { id: "assays", label: `Assays (${assays.length})`, icon: Beaker },
    { id: "project", label: "Project & Mission", icon: FileText },
  ];

  const uniqueFactors = Array.from(
    new Set([
      ...(inv.factors || []),
      ...samples.flatMap((s) => Object.values(s.factors || {})),
    ])
  ).filter(Boolean);

  const uniqueOrganisms = Array.from(
    new Set(samples.map((s) => s.characteristics?.Organism).filter(Boolean))
  );

  return (
    <div className="min-h-screen bg-[url('/src/images/background/test.png')] bg-fixed bg-cover bg-center">
      <div className="fixed w-full h-full bg-black/70 top-0 left-0 z-0"></div>

      <div className="relative z-10">
        {/* Header */}
        <header className="backdrop-blur-md bg-black/30 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-gray-300 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm sm:text-base">Back to catalog</span>
            </Link>

            <div className="flex items-start gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-600 text-white shadow-lg flex-shrink-0">
                <Rocket className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white font-bricolage leading-tight break-words">
                  {inv.id} — {inv.title || "Untitled"}
                </h1>
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-300 mt-2">
                  {inv.mission?.name && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      {inv.mission.name}
                      {inv.mission.start_date && ` • ${inv.mission.start_date}`}
                    </span>
                  )}
                  {inv.project?.managing_center && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      {inv.project.managing_center}
                    </span>
                  )}
                  {assays[0]?.platform && (
                    <span className="inline-flex items-center gap-1">
                      <Cpu className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      {assays[0].platform}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Tabs */}
          <div className="border-b border-white/20 mb-6">
            <nav className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide">
              {tabs.map((t) => {
                const Icon = t.icon;
                const active = t.id === tab;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id as any)}
                    className={`flex items-center gap-2 px-1 py-3 border-b-2 whitespace-nowrap transition-colors text-sm sm:text-base ${
                      active
                        ? "border-white text-white"
                        : "border-transparent text-gray-400 hover:text-gray-300"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{t.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="rounded-2xl sm:rounded-3xl backdrop-blur-xl bg-white/10 border border-white/20 p-5 sm:p-6 shadow-2xl">
            {tab === "overview" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-white mb-3">
                    Description
                  </h2>
                  <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                    {inv.description || "No description available"}
                  </p>
                </div>

                {uniqueOrganisms.length > 0 && (
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-white mb-3">
                      Organisms
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {uniqueOrganisms.map((org, i) => (
                        <span
                          key={i}
                          className="px-3 py-1.5 rounded-lg bg-blue-500/30 backdrop-blur-sm border border-blue-400/30 text-blue-100 text-sm"
                        >
                          {org}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {uniqueFactors.length > 0 && (
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-white mb-3">
                      Experimental Factors
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {uniqueFactors.map((f: any, i) => (
                        <span
                          key={i}
                          className="px-3 py-1.5 rounded-lg bg-purple-500/30 backdrop-blur-sm border border-purple-400/30 text-purple-100 text-sm"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {inv.publications && inv.publications.length > 0 && (
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-white mb-3">
                      Publications
                    </h2>
                    <ul className="space-y-3">
                      {inv.publications.map((pub, i) => (
                        <li
                          key={i}
                          className="p-4 rounded-xl bg-white/5 border border-white/10"
                        >
                          <h3 className="font-semibold text-white mb-1">
                            {pub.title}
                          </h3>
                          {pub.doi && (
                            <a
                              href={`https://doi.org/${pub.doi}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-300 hover:text-blue-200 text-sm inline-flex items-center gap-1"
                            >
                              {pub.doi} <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          {pub.authors && pub.authors.length > 0 && (
                            <p className="text-xs text-gray-400 mt-2">
                              {pub.authors.join(", ")}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {tab === "samples" && (
              <div className="space-y-4">
                <p className="text-sm text-gray-300">
                  Total samples:{" "}
                  <span className="font-bold text-white">{samples.length}</span>
                </p>
                <div className="overflow-x-auto">
                  <div className="space-y-3">
                    {samples.slice(0, 20).map((s, i) => (
                      <div
                        key={i}
                        className="p-4 rounded-xl bg-white/5 border border-white/10"
                      >
                        <h3 className="font-semibold text-white mb-2 text-sm sm:text-base">
                          {s.sample_name}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                          {s.characteristics &&
                            Object.entries(s.characteristics).map(([k, v]) => (
                              <div key={k} className="text-gray-300">
                                <span className="text-gray-400">{k}:</span>{" "}
                                {v as any}
                              </div>
                            ))}
                        </div>
                        {s.factors && Object.keys(s.factors).length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {Object.entries(s.factors).map(([k, v]) => (
                              <span
                                key={k}
                                className="px-2 py-1 rounded bg-green-500/30 border border-green-400/30 text-green-100 text-xs"
                              >
                                {k}: {v as any}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {samples.length > 20 && (
                    <p className="text-sm text-gray-400 mt-4 text-center">
                      Showing first 20 of {samples.length} samples
                    </p>
                  )}
                </div>
              </div>
            )}

            {tab === "assays" && (
              <div className="space-y-4">
                {assays.map((a, i) => (
                  <div
                    key={i}
                    className="p-5 rounded-xl bg-white/5 border border-white/10"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <Beaker className="w-5 h-5 text-purple-400" />
                      <h3 className="font-semibold text-white text-base sm:text-lg">
                        {a.type || "Unknown Type"}
                      </h3>
                    </div>
                    {a.platform && (
                      <p className="text-sm text-gray-300 mb-2">
                        <span className="text-gray-400">Platform:</span>{" "}
                        {a.platform}
                      </p>
                    )}
                    {a.files && (
                      <div className="space-y-2">
                        {a.files.processed && a.files.processed.length > 0 && (
                          <p className="text-xs text-gray-400">
                            {a.files.processed.length} processed files
                          </p>
                        )}
                        {a.files.raw && a.files.raw.length > 0 && (
                          <p className="text-xs text-gray-400">
                            {a.files.raw.length} raw files
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {tab === "project" && (
              <div className="space-y-6">
                {inv.mission && (
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 flex items-center gap-2">
                      <Rocket className="w-5 h-5" /> Mission
                    </h2>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                      {inv.mission.name && (
                        <p className="text-white font-semibold">
                          {inv.mission.name}
                        </p>
                      )}
                      {inv.mission.start_date && (
                        <p className="text-sm text-gray-300">
                          {inv.mission.start_date} →{" "}
                          {inv.mission.end_date || "Ongoing"}
                        </p>
                      )}
                      {inv.mission.link && (
                        <a
                          href={inv.mission.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-300 hover:text-blue-200 text-sm inline-flex items-center gap-1"
                        >
                          View mission details{" "}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {inv.project && (
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 flex items-center gap-2">
                      <FileText className="w-5 h-5" /> Project
                    </h2>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                      {inv.project.title && (
                        <p className="text-white font-semibold">
                          {inv.project.title}
                        </p>
                      )}
                      {inv.project.identifier && (
                        <p className="text-sm text-gray-400">
                          ID: {inv.project.identifier}
                        </p>
                      )}
                      {inv.project.type && (
                        <p className="text-sm text-gray-300">
                          Type: {inv.project.type}
                        </p>
                      )}
                      {inv.project.managing_center && (
                        <p className="text-sm text-gray-300">
                          Center: {inv.project.managing_center}
                        </p>
                      )}
                      {inv.project.funding && (
                        <p className="text-sm text-gray-300">
                          Funding: {inv.project.funding}
                        </p>
                      )}
                      {inv.project.link && (
                        <a
                          href={inv.project.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-300 hover:text-blue-200 text-sm inline-flex items-center gap-1"
                        >
                          View project details{" "}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {inv.contacts && inv.contacts.length > 0 && (
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 flex items-center gap-2">
                      <Users className="w-5 h-5" /> Contacts
                    </h2>
                    <div className="space-y-2">
                      {inv.contacts.map((c: any, i: any) => (
                        <div
                          key={i}
                          className="p-3 rounded-xl bg-white/5 border border-white/10"
                        >
                          <p className="text-white font-medium">
                            {c.first_name} {c.last_name}
                          </p>
                          <p className="text-xs text-gray-400 capitalize">
                            {c.role}
                          </p>
                          {c.email && (
                            <a
                              href={`mailto:${c.email}`}
                              className="text-xs text-blue-300 hover:text-blue-200"
                            >
                              {c.email}
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
