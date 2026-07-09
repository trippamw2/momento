export default function BookingsLoading() {
  return (
    <div className="pt-20 pb-16 min-h-screen bg-[#05070B]">
      <div className="max-w-7xl mx-auto flex gap-6 px-8">
        {/* Sidebar skeleton */}
        <aside className="hidden sm:flex flex-col w-56 flex-shrink-0">
          <div className="bg-[#111827] border border-white/[0.08] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.08]">
              <div className="h-6 w-28 bg-white/[0.06] rounded animate-pulse mb-1" />
              <div className="h-4 w-16 bg-white/[0.06] rounded animate-pulse" />
            </div>
            <div className="p-2 space-y-1">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="h-10 bg-white/[0.06] rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        </aside>

        {/* Main skeleton */}
        <main className="flex-1 min-w-0">
          <div className="h-9 w-48 bg-white/[0.06] rounded animate-pulse mb-1" />
          <div className="h-5 w-32 bg-white/[0.06] rounded animate-pulse mb-6" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#111827] border border-white/[0.08] rounded-2xl overflow-hidden mb-4">
              <div className="flex">
                <div className="w-56 h-44 bg-white/[0.06] animate-pulse flex-shrink-0" />
                <div className="flex-1 p-5 space-y-3">
                  <div className="h-5 w-20 bg-white/[0.06] rounded-full animate-pulse" />
                  <div className="h-7 w-40 bg-white/[0.06] rounded animate-pulse" />
                  <div className="h-4 w-32 bg-white/[0.06] rounded animate-pulse" />
                  <div className="flex gap-4">
                    <div className="h-4 w-28 bg-white/[0.06] rounded animate-pulse" />
                    <div className="h-4 w-20 bg-white/[0.06] rounded animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </main>
      </div>
    </div>
  );
}
