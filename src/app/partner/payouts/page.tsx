"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PayoutsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/partner/menu/account");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#FF0F73]/30 border-t-[#FF0F73] animate-spin mx-auto mb-4" />
        <p className="text-[#64748B] text-body-sm">Redirecting to Account Settings...</p>
      </div>
    </div>
  );
}