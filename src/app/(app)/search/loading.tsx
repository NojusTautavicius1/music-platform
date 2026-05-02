function Pulse({ className }: { className: string }) {
  return <div className={`bg-white/5 animate-pulse rounded ${className}`} />;
}

export default function SearchLoading() {
  return (
    <div className="p-4 md:p-8">
      <Pulse className="h-9 w-36 mb-8" />

      {/* Genre grid skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <Pulse key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
