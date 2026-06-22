import { Suspense } from "react";
import PartnerDashboard from "./PartnerDashboard";

function Loading() {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:block w-64 bg-surface-secondary border-r border-border-default p-5">
        <div className="h-9 w-32 bg-surface-tertiary rounded-lg animate-pulse mb-8" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 bg-surface-tertiary rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
      <div className="flex-1 p-6">
        <div className="h-8 w-48 bg-surface-tertiary rounded-lg animate-pulse mb-6" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-surface-tertiary rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<Loading />}>
      <PartnerDashboard />
    </Suspense>
  );
}
