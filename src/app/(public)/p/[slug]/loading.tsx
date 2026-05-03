export default function Loading() {
  return (
    <div className="animate-pulse p-8 space-y-6">
      <div className="flex gap-6">
        <div className="w-56 h-56 rounded-md bg-white/5 shrink-0" />
        <div className="flex-1 space-y-3 pt-4">
          <div className="h-4 w-24 bg-white/5 rounded" />
          <div className="h-10 w-3/4 bg-white/5 rounded" />
          <div className="h-4 w-1/2 bg-white/5 rounded" />
        </div>
      </div>
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 bg-white/5 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
