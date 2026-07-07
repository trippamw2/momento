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
    <div className="min-h-screen flex items-center justify-center pt-20 bg-[#05070B]">
      <div className="w-8 h-8 rounded-full border-2 border-[#FF0F73]/30 border-t-[#FF0F73] animate-spin" />
    </div>
  );
}

function UserProfile({ user }: { user: UserData }) {
  const handleSignOut = async () => {
    const token = localStorage.getItem("momento-auth-token");
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch { /* still clear local state */ }
    localStorage.removeItem("momento-auth-token");
    localStorage.removeItem("momento-user-role");
    localStorage.removeItem("momento-signup-role");
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen pt-20 pb-16 bg-[#05070B]">
      <div className="max-w-3xl mx-auto px-4 sm:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-[#FF0F73] flex items-center justify-center text-white text-heading font-bold">
              {user.profile?.full_name?.[0] || user.email[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <h1 className="text-heading-xl font-bold text-[#F1F5F9]">
                {user.profile?.full_name || "User Profile"}
              </h1>
              <p className="text-[#CBD5E1] text-body-sm">{user.email}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-[#111827] border border-white/[0.08] p-6 mb-6">
          <h2 className="text-heading-sm font-bold text-[#F1F5F9] mb-4">Account Details</h2>
          <div className="space-y-3 text-body-sm">
            <div className="flex justify-between py-2 border-b border-white/[0.08]">
              <span className="text-[#CBD5E1]">Email</span>
              <span className="text-[#F1F5F9]">{user.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/[0.08]">
              <span className="text-[#CBD5E1]">Role</span>
              <span className="text-[#F1F5F9] capitalize">{user.role}</span>
            </div>
            {user.profile?.phone && (
              <div className="flex justify-between py-2 border-b border-white/[0.08]">
                <span className="text-[#CBD5E1]">Phone</span>
                <span className="text-[#F1F5F9]">{user.profile.phone}</span>
              </div>
            )}
            <div className="flex justify-between py-2">
              <span className="text-[#CBD5E1]">Member since</span>
              <span className="text-[#F1F5F9]">2026</span>
            </div>
          </div>
        </div>

        {/* Loyalty Program */}
        <div className="mb-6">
          <LoyaltyBadge />
        </div>

        <div className="rounded-2xl bg-[#111827] border border-white/[0.08] p-6">
          <h2 className="text-heading-sm font-bold text-[#F1F5F9] mb-4">Quick Links</h2>
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
                className="px-4 py-3 rounded-xl bg-[#1E293B] border border-white/[0.1] text-body-sm text-[#CBD5E1] hover:text-[#F1F5F9] hover:bg-white/[0.05] transition-all text-center font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={handleSignOut}
            className="px-6 py-2.5 rounded-xl bg-red-500/10 text-red-400 text-body-sm font-medium hover:bg-red-500/20 transition-all border border-red-500/20"
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
    <div className="min-h-screen pt-20 pb-16 flex items-center justify-center bg-[#05070B]">
      <div className="max-w-md mx-auto px-4 text-center">
        <div className="w-20 h-20 rounded-full bg-[#111827] border border-white/[0.08] flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        </div>
        <h1 className="text-heading-xl font-bold text-[#F1F5F9] mb-2">Welcome to Momento</h1>
        <p className="text-[#CBD5E1] text-body mb-8">
          Sign in to view your profile, manage bookings, and access partner tools.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/experiences"
            className="px-6 py-3 rounded-xl bg-[#1E293B] text-[#F1F5F9] font-semibold text-body-sm hover:bg-white/[0.05] transition-all border border-white/[0.1]"
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
      <div className="min-h-screen pt-20 pb-16 flex items-center justify-center bg-[#05070B]">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  // Partner → show PartnerDashboard
  if (user?.role === "partner" || user?.role === "admin") {
    return <PartnerDashboard />;
  }

  // Authenticated user → show user profile
  if (user) {
    return <UserProfile user={user} />;
  }

  // Guest → show welcome page
  return <GuestProfile />;
}
