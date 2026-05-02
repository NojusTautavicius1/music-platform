function Pulse({ className }: { className: string }) {
  return <div className={`bg-white/5 animate-pulse rounded ${className}`} />;
}

function SongRowSkeleton({ i }: { i: number }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/5">
      <span className="w-5 text-xs text-zinc-600 text-right shrink-0">{i}</span>
      <Pulse className="w-9 h-9 rounded shrink-0" />
      <div className="flex-1 min-w-0">
        <Pulse className="h-3.5 w-2/5 mb-1.5" />
        <Pulse className="h-3 w-1/4" />
      </div>
      <Pulse className="h-3 w-10 hidden sm:block" />
      <Pulse className="h-3 w-8" />
    </div>
  );
}

export default function PlaylistLoading() {
  return (
    <div>
      {/* Header skeleton */}
      <div className="px-4 md:px-8 pt-8 md:pt-16 pb-8 flex items-end gap-6 min-h-64 bg-white/5 animate-pulse">
        <Pulse className="w-36 h-36 md:w-56 md:h-56 rounded-md shrink-0" />
        <div className="pb-2 flex-1 min-w-0">
          <Pulse className="h-3 w-20 mb-3" />
          <Pulse className="h-10 md:h-14 w-3/4 mb-3" />
          <Pulse className="h-4 w-1/2 mb-4" />
          <div className="flex gap-3">
            <Pulse className="h-3 w-16" />
            <Pulse className="h-3 w-12" />
            <Pulse className="h-3 w-16" />
          </div>
        </div>
      </div>

      {/* Song rows */}
      <div className="mt-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <SongRowSkeleton key={i} i={i + 1} />
        ))}
      </div>
    </div>
  );
}
