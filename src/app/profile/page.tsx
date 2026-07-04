"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PartnerDashboard from "./PartnerDashboard";
import LoyaltyBadge from "@/components/LoyaltyBadge";

type UserData = {
  id: string;
  email: string;
  role: "user" | "partner" | "admin";
  profile?: {
    full_name?: string;
    avatar_url?: string;
    phone?: string;
  } | null;
  partnerProfile?: {
    id: string;
    business_name: string;
    verification_status: string;
  } | null;
};

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center pt-20">
      <div className="w-8 h-8 rounded-full border-2 border-[#FF0F73]/30 border-t-[#FF0F73] animate-spin" />
    </div>
  );
}

function UserProfile({ user }: { user: UserData }) {
  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-[#FF0F73] flex items-center justify-center text-white text-heading font-bold">
              {user.profile?.full_name?.[0] || user.email[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <h1 className="text-heading-xl font-bold text-[#222222]">
                {user.profile?.full_name || "User Profile"}
              </h1>
              <p className="text-[#6a6a6a] text-body-sm">{user.email}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-[#ebebeb] p-6 mb-6 shadow-sm">
          <h2 className="text-heading-sm font-bold text-[#222222] mb-4">Account Details</h2>
          <div className="space-y-3 text-body-sm">
            <div className="flex justify-between py-2 border-b border-[#ebebeb]">
              <span className="text-[#6a6a6a]">Email</span>
              <span className="text-[#222222]">{user.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#ebebeb]">
              <span className="text-[#6a6a6a]">Role</span>
              <span className="text-[#222222] capitalize">{user.role}</span>
            </div>
            {user.profile?.phone && (
              <div className="flex justify-between py-2 border-b border-[#ebebeb]">
                <span className="text-[#6a6a6a]">Phone</span>
                <span className="text-[#222222]">{user.profile.phone}</span>
              </div>
            )}
            <div className="flex justify-between py-2">
              <span className="text-[#6a6a6a]">Member since</span>
              <span className="text-[#222222]">2026</span>
            </div>
          </div>
        </div>

        {/* Loyalty Program */}
        <div className="mb-6">
          <LoyaltyBadge />
        </div>

        <div className="rounded-2xl bg-white border border-[#ebebeb] p-6 shadow-sm">
          <h2 className="text-heading-sm font-bold text-[#222222] mb-4">Quick Links</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: "My Bookings", href: "/bookings" },
              { label: "Saved Experiences", href: "/saved" },
              { label: "Gift Cards", href: "/gift" },
              { label: "Loyalty Rewards", href: "/loyalty" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-3 rounded-xl bg-[#f7f7f7] border border-[#ebebeb] text-body-sm text-[#6a6a6a] hover:text-[#222222] hover:border-[#dddddd] transition-all text-center font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => {
              localStorage.removeItem("momento-auth-token");
              window.location.href = "/";
            }}
            className="px-6 py-2.5 rounded-xl bg-red-50 text-red-500 text-body-sm font-medium hover:bg-red-100 transition-all border border-red-200"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

function GuestProfile() {
  return (
    <div className="min-h-screen pt-20 pb-16 flex items-center justify-center">
      <div className="max-w-md mx-auto px-4 text-center">
        <div className="w-20 h-20 rounded-full bg-[#f7f7f7] flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-[#929292]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        </div>
        <h1 className="text-heading-xl font-bold text-[#222222] mb-2">Welcome to Momento</h1>
        <p className="text-[#6a6a6a] text-body mb-8">
          Sign in to view your profile, manage bookings, and access partner tools.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/experiences"
            className="px-6 py-3 rounded-xl bg-white text-[#222222] font-semibold text-body-sm hover:bg-[#f7f7f7] transition-all border border-[#dddddd]"
          >
            Browse Experiences
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("momento-auth-token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        } else {
          localStorage.removeItem("momento-auth-token");
        }
      } catch {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) return <Loading />;
  if (error) {
    return (
      <div className="min-h-screen pt-20 pb-16 flex items-center justify-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  // Partner â†’ show PartnerDashboard
  if (user?.role === "partner" || user?.role === "admin") {
    return <PartnerDashboard />;
  }

  // Authenticated user â†’ show user profile
  if (user) {
    return <UserProfile user={user} />;
  }

  // Guest â†’ show welcome page
  return <GuestProfile />;
}
