function Pulse({ className }: { className: string }) {
  return <div className={`bg-white/5 animate-pulse rounded ${className}`} />;
}

export default function SearchResultsLoading() {
  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Top result */}
      <section>
        <Pulse className="h-7 w-28 mb-4" />
        <div className="flex gap-4 p-4 rounded-xl bg-white/5">
          <Pulse className="w-24 h-24 md:w-32 md:h-32 rounded-md shrink-0" />
          <div className="flex-1 min-w-0 py-2">
            <Pulse className="h-3 w-16 mb-3" />
            <Pulse className="h-7 w-1/2 mb-2" />
            <Pulse className="h-4 w-1/3" />
          </div>
        </div>
      </section>

      {/* Song rows */}
      <section>
        <Pulse className="h-7 w-24 mb-4" />
        <div className="space-y-0">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-2 py-2.5 border-b border-white/5">
              <span className="w-5 text-xs text-zinc-600 text-right shrink-0">{i + 1}</span>
              <Pulse className="w-9 h-9 rounded shrink-0" />
              <div className="flex-1 min-w-0">
                <Pulse className="h-3.5 w-2/5 mb-1.5" />
                <Pulse className="h-3 w-1/4" />
              </div>
              <Pulse className="h-3 w-8" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
