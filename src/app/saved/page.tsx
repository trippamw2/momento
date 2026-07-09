import { Suspense } from "react";
import SavedPageContent from "./SavedPageContent";

function Loading() {
  return (
    <div className="pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="mb-8">
          <div className="h-10 w-36 bg-surface-tertiary rounded-lg animate-pulse mb-2" />
          <div className="h-5 w-48 bg-surface-tertiary rounded-lg animate-pulse" />
        </div>
        <div className="h-10 w-80 bg-surface-tertiary rounded-xl animate-pulse mb-8" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-surface-tertiary rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SavedPage() {
  return (
    <Suspense fallback={<Loading />}>
      <SavedPageContent />
    </Suspense>
  );
}
