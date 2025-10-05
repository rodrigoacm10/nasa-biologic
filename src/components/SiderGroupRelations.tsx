export default function SidebarGroupLabel({ label, accent = 'emerald' }: { label: string; accent?: 'emerald' | 'purple' | 'sky' }) {
  const dot = {
    emerald: 'bg-emerald-400/60',
    purple: 'bg-purple-400/60',
    sky: 'bg-sky-400',
  }[accent];

  return (
    <div className="select-none" role="heading" aria-level={2}>
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-300">
        <span className="flex-1 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        <span className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full border border-white/10 text-white/90">
          <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
          {label}
        </span>
        <span className="flex-1 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      </div>
    </div>
  );
}
