import { Suspense } from "react";
import ExperiencesPageContent from "./ExperiencesPageContent";

function Loading() {
  return (
    <div className="pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="mb-8">
          <div className="h-10 w-56 bg-surface-tertiary rounded-lg animate-pulse mb-2" />
          <div className="h-6 w-36 bg-surface-tertiary rounded-lg animate-pulse" />
        </div>
        <div className="h-12 w-full max-w-xl bg-surface-tertiary rounded-xl animate-pulse mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-surface-tertiary rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ExperiencesPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ExperiencesPageContent />
    </Suspense>
  );
}
