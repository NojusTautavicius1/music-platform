function Pulse({ className }: { className: string }) {
  return <div className={`bg-white/5 animate-pulse rounded ${className}`} />;
}

export default function StatsLoading() {
  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Page title */}
      <Pulse className="h-9 w-40" />

      {/* Metric cards row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/5 bg-white/5 p-5">
            <Pulse className="h-3 w-24 mb-3" />
            <Pulse className="h-8 w-20 mb-1" />
            <Pulse className="h-3 w-16" />
          </div>
        ))}
      </div>

      {/* Chart area */}
      <div className="rounded-2xl border border-white/5 bg-white/5 p-5">
        <Pulse className="h-5 w-36 mb-6" />
        <Pulse className="h-48 w-full rounded-xl" />
      </div>

      {/* Two side-by-side sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, col) => (
          <div key={col} className="rounded-2xl border border-white/5 bg-white/5 p-5">
            <Pulse className="h-5 w-32 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Pulse className="w-9 h-9 rounded shrink-0" />
                  <div className="flex-1 min-w-0">
                    <Pulse className="h-3.5 w-3/4 mb-1.5" />
                    <Pulse className="h-3 w-1/2" />
                  </div>
                  <Pulse className="h-3 w-8" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
