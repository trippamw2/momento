export default function ExperienceDetailLoading() {
  return (
    <div className="pt-16 min-h-screen bg-[#05070B]">
      {/* Hero skeleton */}
      <div className="relative h-[50vh] sm:h-[65vh] md:h-[75vh] bg-white/[0.06] animate-pulse" />

      {/* Content skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:grid lg:grid-cols-3 lg:gap-10 relative -mt-24 z-20">
        <div className="lg:col-span-2">
          <div className="bg-[#111827] rounded-2xl border border-white/[0.08] p-5 sm:p-8 mb-6 shadow-sm">
            {/* Mood tags */}
            <div className="flex gap-2 mb-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-7 w-16 bg-white/[0.06] rounded-full animate-pulse" />
              ))}
            </div>
            {/* Title */}
            <div className="h-10 w-3/4 bg-white/[0.06] rounded-lg animate-pulse mb-2" />
            <div className="h-7 w-1/2 bg-white/[0.06] rounded-lg animate-pulse mb-5" />
            {/* Meta */}
            <div className="flex gap-4 mb-6">
              <div className="h-5 w-40 bg-white/[0.06] rounded animate-pulse" />
              <div className="h-5 w-24 bg-white/[0.06] rounded animate-pulse" />
              <div className="h-5 w-28 bg-white/[0.06] rounded animate-pulse" />
            </div>
            {/* Description */}
            <div className="space-y-2 mb-8">
              <div className="h-4 w-full bg-white/[0.06] rounded animate-pulse" />
              <div className="h-4 w-5/6 bg-white/[0.06] rounded animate-pulse" />
              <div className="h-4 w-4/6 bg-white/[0.06] rounded animate-pulse" />
            </div>
            {/* Includes */}
            <div className="grid sm:grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 bg-white/[0.06] rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>
        {/* Sidebar skeleton */}
        <div className="hidden lg:block">
          <div className="bg-[#111827] rounded-2xl border border-white/[0.08] p-6 shadow-sm">
            <div className="h-8 w-28 bg-white/[0.06] rounded animate-pulse mb-5" />
            <div className="h-64 bg-white/[0.06] rounded-xl animate-pulse mb-4" />
            <div className="h-12 bg-white/[0.06] rounded-xl animate-pulse mb-4" />
            <div className="h-12 bg-white/[0.06] rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
