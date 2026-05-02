function Pulse({ className }: { className: string }) {
  return <div className={`bg-white/5 animate-pulse rounded ${className}`} />;
}

export default function LibraryLoading() {
  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <Pulse className="h-9 w-40" />
        <Pulse className="h-9 w-32 rounded-full" />
      </div>

      {/* Grid of 12 playlist cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="p-3">
            <Pulse className="aspect-square rounded-md" />
            <Pulse className="mt-3 h-3.5 w-3/4" />
            <Pulse className="mt-1.5 h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
