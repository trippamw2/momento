import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Discover — Momento",
  description: "Swipe through unforgettable experiences. Save, gift, share, or book instantly.",
};

export default function DiscoverLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
