export default function ProfileLoading() {
  return (
    <div className="pb-16">
      <section className="relative">
        <div className="h-64 w-full bg-white/5 animate-pulse" />
        <div className="max-w-[1200px] mx-auto px-4 md:px-8">
          <div className="-mt-16 flex flex-col md:flex-row gap-6 items-start">
            <div className="w-36 h-36 rounded-2xl bg-white/10 animate-pulse" />
            <div className="pt-2 space-y-2">
              <div className="h-3 w-16 bg-white/5 rounded animate-pulse" />
              <div className="h-12 w-80 bg-white/5 rounded animate-pulse" />
              <div className="h-3 w-32 bg-white/5 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </section>
      <div className="max-w-[1200px] mx-auto px-4 md:px-8 mt-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-white/5 border border-white/10 p-5 h-28 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
