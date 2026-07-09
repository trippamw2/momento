"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PartnerDashboard from "./PartnerDashboard";
import LoyaltyBadge from "@/components/LoyaltyBadge";

type UserProfileData = {
  full_name?: string | null;
  avatar_url?: string | null;
  phone?: string | null;
  birthdate?: string | null;
};

type UserData = {
  id: string;
  email: string;
  role: "user" | "partner" | "admin";
  profile?: UserProfileData | null;
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

function UserProfile({ user: initialUser }: { user: UserData }) {
  const [user, setUser] = useState(initialUser);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(user.profile?.full_name || "");
  const [editPhone, setEditPhone] = useState(user.profile?.phone || "");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const handleEdit = () => {
    setEditName(user.profile?.full_name || "");
    setEditPhone(user.profile?.phone || "");
    setSaveError("");
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    const token = localStorage.getItem("experio-auth-token");
    try {
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          full_name: editName.trim() || null,
          phone: editPhone.trim() || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser((prev) => ({
          ...prev,
          profile: { ...prev.profile, full_name: editName.trim() || null, phone: editPhone.trim() || null },
        }));
        setEditing(false);
      } else {
        setSaveError(data.error || "Failed to update profile");
      }
    } catch {
      setSaveError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    const token = localStorage.getItem("experio-auth-token");
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch { /* still clear local state */ }
    localStorage.removeItem("experio-auth-token");
    localStorage.removeItem("experio-user-role");
    localStorage.removeItem("experio-signup-role");
    window.location.href = "/";
  };

  const initials = user.profile?.full_name
    ? user.profile.full_name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : user.email[0]?.toUpperCase() || "U";

  return (
    <div className="min-h-screen pt-20 pb-16 bg-[#05070B] relative">
      {/* Cover Gradient */}
      <div className="absolute top-20 left-0 right-0 h-48 bg-gradient-to-b from-[#FF0F73]/20 via-[#FF7A1A]/10 to-transparent pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-8 relative">
        {/* Header Card */}
        <div className="rounded-2xl bg-[#111827] border border-white/[0.08] overflow-hidden mb-6 shadow-lg">
          <div className="h-24 sm:h-32 bg-gradient-to-r from-[#FF0F73]/30 via-[#FFA22C]/20 to-[#F82D7B]/30" />
          <div className="px-6 pb-6 -mt-12 sm:-mt-16">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-[#FF0F73] to-[#FF7A1A] flex items-center justify-center text-white text-heading-xl font-bold shadow-lg border-4 border-[#111827] shrink-0">
                {initials}
              </div>
              <div className="min-w-0 flex-1 sm:pb-2">
                <div className="flex items-center gap-3 mt-2 sm:mt-0">
                  <h1 className="text-heading-xl font-bold text-[#F1F5F9] truncate">
                    {user.profile?.full_name || "User Profile"}
                  </h1>
                  <button
                    onClick={handleEdit}
                    className="shrink-0 p-2 rounded-xl bg-[#1E293B] border border-white/[0.1] text-[#CBD5E1] hover:text-[#FF0F73] hover:border-[#FF0F73]/30 transition-all"
                    title="Edit profile"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
                <p className="text-[#CBD5E1] text-body-sm">{user.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Member Since", value: "2026", icon: "calendar" },
            { label: "Role", value: user.role.charAt(0).toUpperCase() + user.role.slice(1), icon: "user" },
            { label: "Status", value: "Active", icon: "check" },
            { label: "Phone", value: user.profile?.phone || "Not set", icon: "phone", muted: !user.profile?.phone },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-[#111827] border border-white/[0.08] p-4 hover:border-white/[0.15] transition-all">
              <p className="text-caption text-[#64748B] mb-1">{stat.label}</p>
              <p className={`text-heading-sm font-bold truncate ${stat.muted ? "text-[#64748B]" : "text-[#F1F5F9]"}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left: Account + Loyalty */}
          <div className="lg:col-span-2 space-y-6">
            {/* Account Details */}
            <div className="rounded-2xl bg-[#111827] border border-white/[0.08] p-6">
              <h2 className="text-heading-sm font-bold text-[#F1F5F9] mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-[#FF0F73]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Account Details
              </h2>
              <div className="space-y-3 text-body-sm">
                <div className="flex justify-between py-2.5 border-b border-white/[0.06]">
                  <span className="text-[#94A3B8]">Email</span>
                  <span className="text-[#F1F5F9] font-medium">{user.email}</span>
                </div>
                <div className="flex justify-between py-2.5 border-b border-white/[0.06]">
                  <span className="text-[#94A3B8]">Phone</span>
                  <span className={`font-medium ${user.profile?.phone ? "text-[#F1F5F9]" : "text-[#64748B]"}`}>
                    {user.profile?.phone || "â€”"}
                  </span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-[#94A3B8]">Password</span>
                  <span className="text-[#64748B]">â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢</span>
                </div>
              </div>
            </div>

            {/* Loyalty Program */}
            <LoyaltyBadge />

            {/* Recent Activity */}
            <div className="rounded-2xl bg-[#111827] border border-white/[0.08] p-6">
              <h2 className="text-heading-sm font-bold text-[#F1F5F9] mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-[#FF0F73]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Recent Activity
              </h2>
              <div className="space-y-3">
                {[
                  { action: "Booked Sunset Cruise", time: "3 days ago" },
                  { action: "Earned 550 loyalty points", time: "3 days ago" },
                  { action: "Reviewed Spa Day", time: "1 week ago" },
                  { action: "Saved Date Night to wishlist", time: "2 weeks ago" },
                ].map((activity, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-white/[0.06] last:border-0">
                    <div className="w-2 h-2 rounded-full bg-[#FF0F73]" />
                    <p className="flex-1 text-body-sm text-[#CBD5E1]">{activity.action}</p>
                    <span className="text-caption text-[#64748B]">{activity.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Quick Links + Sign Out */}
          <div className="space-y-4">
            {/* Quick Actions */}
            <div className="rounded-2xl bg-[#111827] border border-white/[0.08] p-5">
              <h2 className="text-heading-sm font-bold text-[#F1F5F9] mb-4">Quick Actions</h2>
              <div className="space-y-2">
                {[
                  { label: "My Bookings", href: "/bookings", icon: "calendar" },
                  { label: "Messages", href: "/messages", icon: "chat" },
                  { label: "Saved Experiences", href: "/saved", icon: "heart" },
                  { label: "Gift Cards", href: "/gift", icon: "gift" },
                  { label: "Loyalty Rewards", href: "/loyalty", icon: "star" },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#1E293B] border border-white/[0.1] text-body-sm text-[#CBD5E1] hover:text-[#F1F5F9] hover:bg-white/[0.05] transition-all"
                  >
                    <span className="w-8 h-8 rounded-lg bg-[#0A0E17] flex items-center justify-center shrink-0">
                      <span className="text-[#FF0F73] text-sm">
                        {link.icon === "calendar" ? "ðŸ“…" : link.icon === "chat" ? "ðŸ’¬" : link.icon === "heart" ? "â™¥" : link.icon === "gift" ? "ðŸŽ" : "â­"}
                      </span>
                    </span>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Sign Out */}
            <button
              onClick={handleSignOut}
              className="w-full py-3 rounded-xl bg-red-500/10 text-red-400 text-body-sm font-medium hover:bg-red-500/20 transition-all border border-red-500/20 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {editing && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          onClick={() => setEditing(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-[#111827] border border-white/[0.08] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1.5 bg-gradient-to-r from-[#FF0F73] via-[#FFA22C] to-[#F82D7B]" />
            <div className="p-7">
              <h2 className="text-heading-lg font-bold text-[#F1F5F9] mb-1">Edit Profile</h2>
              <p className="text-caption text-[#CBD5E1] mb-5">Update your personal information</p>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-caption text-[#CBD5E1] mb-1.5 font-medium">Full name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[#0A0E17] text-[#F1F5F9] text-body-sm placeholder:text-[#64748B] focus:outline-none focus:ring-1 border border-white/[0.1] focus:border-[#FF0F73] focus:ring-[#FF0F73]/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-caption text-[#CBD5E1] mb-1.5 font-medium">Phone number</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="+260 XXX XXX XXX"
                    className="w-full px-4 py-3 rounded-xl bg-[#0A0E17] text-[#F1F5F9] text-body-sm placeholder:text-[#64748B] focus:outline-none focus:ring-1 border border-white/[0.1] focus:border-[#FF0F73] focus:ring-[#FF0F73]/20 transition-all"
                  />
                </div>

                {saveError && (
                  <p className="text-body-sm text-[#c13515] bg-[#c13515]/8 px-3 py-2 rounded-xl">{saveError}</p>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 py-3 rounded-xl bg-[#1E293B] text-[#CBD5E1] font-semibold text-body-sm border border-white/[0.1] hover:bg-white/[0.05] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#FF0F73] to-[#FFA22C] text-white font-semibold text-body-sm hover:shadow-[0_4px_20px_rgba(255,15,115,0.35)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
        <h1 className="text-heading-xl font-bold text-[#F1F5F9] mb-2">Welcome to Experio</h1>
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
      const token = localStorage.getItem("experio-auth-token");
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
          localStorage.removeItem("experio-auth-token");
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
