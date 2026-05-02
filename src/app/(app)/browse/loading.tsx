function Pulse({ className }: { className: string }) {
  return <div className={`bg-white/5 animate-pulse rounded ${className}`} />;
}

export default function BrowseLoading() {
  return (
    <div className="p-4 md:p-8">
      {/* Page title */}
      <Pulse className="h-9 w-32 mb-8" />

      {/* Filter bar */}
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <Pulse key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>

      {/* Table header */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-white/10 mb-1">
        <Pulse className="h-3 w-4" />
        <Pulse className="h-3 w-8" />
        <Pulse className="h-3 flex-1" />
        <Pulse className="h-3 w-16 hidden sm:block" />
        <Pulse className="h-3 w-10" />
      </div>

      {/* Table rows */}
      {Array.from({ length: 15 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-b border-white/5">
          <Pulse className="w-5 h-3" />
          <Pulse className="w-9 h-9 rounded shrink-0" />
          <div className="flex-1 min-w-0">
            <Pulse className="h-3.5 w-2/5 mb-1.5" />
            <Pulse className="h-3 w-1/4" />
          </div>
          <Pulse className="h-3 w-16 hidden sm:block" />
          <Pulse className="h-3 w-8" />
        </div>
      ))}
    </div>
  );
}
