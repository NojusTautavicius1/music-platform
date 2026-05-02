export default function SettingsLoading() {
  return (
    <div className="p-4 md:p-8 max-w-2xl space-y-8">
      <div className="h-8 w-32 bg-white/5 rounded animate-pulse" />
      <div className="flex gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-9 w-24 rounded-full bg-white/5 animate-pulse" />
        ))}
      </div>
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 w-full rounded-lg bg-white/5 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
