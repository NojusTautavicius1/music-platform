function Pulse({ className }: { className: string }) {
  return <div className={`bg-white/5 animate-pulse rounded ${className}`} />;
}

function CardSkeleton({ size }: { size: number }) {
  const inner = size - 24;
  return (
    <div className="shrink-0 p-3" style={{ width: size }}>
      <div
        className="bg-white/5 animate-pulse rounded-md"
        style={{ width: inner, height: inner }}
      />
      <Pulse className="mt-3 h-3.5 w-3/4" />
      <Pulse className="mt-1.5 h-3 w-1/2" />
    </div>
  );
}

function HorizontalRow({ count, cardSize, label }: { count: number; cardSize: number; label: string }) {
  return (
    <section>
      <Pulse className="h-7 w-48 mb-6" />
      <div className="flex gap-1 overflow-hidden" aria-label={label}>
        {Array.from({ length: count }).map((_, i) => (
          <CardSkeleton key={i} size={cardSize} />
        ))}
      </div>
    </section>
  );
}

function GridRow({ count, gridClass, label }: { count: number; gridClass: string; label: string }) {
  return (
    <section>
      <Pulse className="h-7 w-48 mb-6" />
      <div className={`grid gap-1 ${gridClass}`} aria-label={label}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="p-3">
            <Pulse className="aspect-square rounded-md" />
            <Pulse className="mt-3 h-3.5 w-3/4" />
            <Pulse className="mt-1.5 h-3 w-1/2" />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function HomeLoading() {
  return (
    <div className="p-4 md:p-8 space-y-12 max-w-[1600px]">
      {/* Greeting */}
      <div>
        <Pulse className="h-10 md:h-14 w-64 mb-2" />
        <Pulse className="h-4 w-40" />
      </div>

      {/* Made for you */}
      <HorizontalRow count={4} cardSize={216} label="Loading Made for you" />

      {/* Recently played */}
      <GridRow count={6} gridClass="grid-cols-2 sm:grid-cols-3 lg:grid-cols-6" label="Loading recently played" />

      {/* Jump back in */}
      <GridRow count={4} gridClass="grid-cols-2 sm:grid-cols-4" label="Loading jump back in" />

      {/* Genre chips */}
      <section>
        <Pulse className="h-7 w-36 mb-6" />
        <div className="flex gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Pulse key={i} className="h-10 w-24 shrink-0 rounded-full" />
          ))}
        </div>
      </section>

      {/* New releases */}
      <GridRow count={8} gridClass="grid-cols-2 sm:grid-cols-4 lg:grid-cols-8" label="Loading new releases" />
    </div>
  );
}
