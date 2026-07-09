import { Suspense } from "react";
import GiftPageContent from "./GiftPageContent";

function Loading() {
  return (
    <div className="pt-20 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-8">
        <div className="text-center mb-12">
          <div className="h-6 w-32 bg-surface-tertiary rounded-full animate-pulse mx-auto mb-4" />
          <div className="h-12 w-96 bg-surface-tertiary rounded-lg animate-pulse mx-auto mb-3" />
          <div className="h-6 w-72 bg-surface-tertiary rounded-lg animate-pulse mx-auto" />
        </div>
      </div>
    </div>
  );
}

export default function GiftPage() {
  return (
    <Suspense fallback={<Loading />}>
      <GiftPageContent />
    </Suspense>
  );
}
