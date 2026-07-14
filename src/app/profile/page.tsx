"use client";

import { useEffect, useState, useRef } from "react";
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

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Avatar upload state
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Recent activity from real data
  type ActivityItem = { action: string; time: string; ts: number };
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [activitiesLoaded, setActivitiesLoaded] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("experio-auth-token");
    if (!token) return;

    const fetchActivities = async () => {
      const items: ActivityItem[] = [];

      try {
        // Fetch recent bookings
        const bRes = await fetch("/api/bookings?limit=5", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (bRes.ok) {
          const bData = await bRes.json();
          const bookingList = bData.bookings || bData || [];
          for (const b of bookingList) {
            const expTitle = b.experiences?.title || b.experience_title || "Experience";
            const status = b.status || "pending";
            const action = status === "completed"
              ? `Completed "${expTitle}"`
              : status === "confirmed"
              ? `Booked "${expTitle}"`
              : `Booked "${expTitle}"`;
            const ts = new Date(b.booking_date || b.created_at || Date.now()).getTime();
            if (!isNaN(ts)) items.push({ action, time: timeAgo(ts), ts });
          }
        }
      } catch { /* ignore bookings fetch */ }

      try {
        // Fetch recent reviews
        const rRes = await fetch("/api/reviews/mine?limit=5", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (rRes.ok) {
          const rData = await rRes.json();
          const reviewList = rData.reviews || rData || [];
          for (const r of reviewList) {
            const expTitle = r.experiences?.title || r.experience_title || "Experience";
            const action = `Reviewed "${expTitle}"`;
            const ts = new Date(r.created_at || Date.now()).getTime();
            if (!isNaN(ts)) items.push({ action, time: timeAgo(ts), ts });
          }
        }
      } catch { /* ignore reviews fetch */ }

      try {
        // Fetch recent loyalty transactions
        const lRes = await fetch("/api/loyalty/history?limit=5", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (lRes.ok) {
          const lData = await lRes.json();
          const txList = lData.transactions || lData.history || lData || [];
          for (const tx of txList) {
            const pts = tx.points || tx.amount || 0;
            const reason = tx.reason || tx.description || "Earned points";
            const action = `Earned ${pts} loyalty points`;
            const ts = new Date(tx.created_at || Date.now()).getTime();
            if (!isNaN(ts)) items.push({ action, time: timeAgo(ts), ts });
          }
        }
      } catch { /* ignore loyalty fetch */ }

      // Sort by most recent first, take top 5
      items.sort((a, b) => b.ts - a.ts);
      setActivities(items.slice(0, 5));
      setActivitiesLoaded(true);
    };

    fetchActivities();
  }, []);

  function timeAgo(ts: number): string {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    return `${weeks}w ago`;
  }

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

  const handleChangePassword = async () => {
    if (!newPassword) { setPasswordError("Enter a new password"); return; }
    if (newPassword.length < 6) { setPasswordError("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { setPasswordError("Passwords do not match"); return; }

    setPasswordSaving(true);
    setPasswordError("");
    setPasswordSuccess("");
    const token = localStorage.getItem("experio-auth-token");

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ new_password: newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordSuccess("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setShowPasswordForm(false), 2000);
      } else {
        setPasswordError(data.error || "Failed to change password");
      }
    } catch {
      setPasswordError("Network error. Please try again.");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarUploading(true);
    const token = localStorage.getItem("experio-auth-token");

    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await fetch("/api/auth/avatar", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.avatar_url) {
        setUser((prev) => ({
          ...prev,
          profile: { ...prev.profile, avatar_url: data.avatar_url },
        }));
      }
    } catch { /* ignore upload error */ }
    finally { setAvatarUploading(false); }
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
              <div className="relative shrink-0">
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-[#FF0F73] to-[#FF7A1A] flex items-center justify-center text-white text-heading-xl font-bold shadow-lg border-4 border-[#111827] overflow-hidden hover:opacity-90 transition-opacity disabled:opacity-70 group"
                >
                  {user.profile?.avatar_url ? (
                    <img src={user.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : avatarUploading ? (
                    <div className="w-8 h-8 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <span>{initials}</span>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                    <span className="text-white text-xs font-medium">Change</span>
                  </div>
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
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
                  <span className="text-[#64748B]">Email</span>
                  <span className="text-[#F1F5F9] font-medium">{user.email}</span>
                </div>
                <div className="flex justify-between py-2.5 border-b border-white/[0.06]">
                  <span className="text-[#64748B]">Phone</span>
                  <span className={`font-medium ${user.profile?.phone ? "text-[#F1F5F9]" : "text-[#64748B]"}`}>
                    {user.profile?.phone || "—"}
                  </span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-[#64748B]">Password</span>
                  <button
                    onClick={() => { setShowPasswordForm(!showPasswordForm); setPasswordError(""); setPasswordSuccess(""); }}
                    className="text-[#FF0F73] text-body-sm font-medium hover:underline"
                  >
                    {showPasswordForm ? "Cancel" : "Change"}
                  </button>
                </div>
                {showPasswordForm && (
                  <div className="pt-3 pb-2 space-y-3 border-t border-white/[0.06]">
                    <input
                      type="password"
                      placeholder="New password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-[#0A0E17] text-[#F1F5F9] text-body-sm placeholder:text-[#64748B] focus:outline-none focus:ring-1 border border-white/[0.1] focus:border-[#FF0F73] focus:ring-[#FF0F73]/20 transition-all"
                    />
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-[#0A0E17] text-[#F1F5F9] text-body-sm placeholder:text-[#64748B] focus:outline-none focus:ring-1 border border-white/[0.1] focus:border-[#FF0F73] focus:ring-[#FF0F73]/20 transition-all"
                    />
                    {passwordError && (
                      <p className="text-body-sm text-[#c13515]">{passwordError}</p>
                    )}
                    {passwordSuccess && (
                      <p className="text-body-sm text-emerald-400">{passwordSuccess}</p>
                    )}
                    <button
                      onClick={handleChangePassword}
                      disabled={passwordSaving}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF0F73] to-[#FFA22C] text-white font-semibold text-body-sm hover:shadow-[0_4px_20px_rgba(255,15,115,0.35)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {passwordSaving ? (
                        <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      ) : (
                        "Update Password"
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Gift Cards */}
            <GiftCardSection email={user.email} />

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
                {activities.length === 0 && !activitiesLoaded ? (
                  <div className="flex items-center gap-2 py-2">
                    <div className="w-4 h-4 rounded-full border-2 border-[#FF0F73]/30 border-t-[#FF0F73] animate-spin" />
                    <span className="text-caption text-[#64748B]">Loading activity...</span>
                  </div>
                ) : activities.length === 0 ? (
                  <p className="text-caption text-[#64748B] py-2">No recent activity yet. Start booking experiences!</p>
                ) : (
                  activities.map((activity, i) => (
                    <div key={i} className="flex items-center gap-3 py-2 border-b border-white/[0.06] last:border-0">
                      <div className="w-2 h-2 rounded-full bg-[#FF0F73]" />
                      <p className="flex-1 text-body-sm text-[#CBD5E1]">{activity.action}</p>
                      <span className="text-caption text-[#64748B]">{activity.time}</span>
                    </div>
                  ))
                )}
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
                          {link.icon === "calendar" ? "◇" : link.icon === "chat" ? "▣" : link.icon === "heart" ? "♥" : link.icon === "gift" ? "▩" : "★"}
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

/** Gift card summary section for user dashboard */
function GiftCardSection({ email }: { email: string }) {
  const [giftCards, setGiftCards] = useState<Array<{ code: string; amount: number; balance: number; status: string; created_at: string; recipient_name: string | null }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGiftCards = async () => {
      const token = localStorage.getItem("experio-auth-token");
      if (!token) { setLoading(false); return; }
      try {
        const res = await fetch("/api/gift-cards?limit=5", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setGiftCards(data.giftCards || []);
        }
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    fetchGiftCards();
  }, [email]);

  const activeCards = giftCards.filter(g => g.status === "active" || g.status === "partially_redeemed");
  const totalBalance = activeCards.reduce((sum, g) => sum + g.balance, 0);

  if (loading) {
    return (
      <div className="rounded-2xl bg-[#111827] border border-white/[0.08] p-6">
        <div className="animate-pulse flex gap-3">
          <div className="h-4 w-24 bg-white/[0.06] rounded" />
          <div className="h-4 w-16 bg-white/[0.06] rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-[#111827] border border-white/[0.08] p-6">
      <h2 className="text-heading-sm font-bold text-[#F1F5F9] mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-[#FF0F73]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h18v18H3V3z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v8M8 12h8" />
        </svg>
        Gift Cards
      </h2>

      {giftCards.length === 0 ? (
        <p className="text-body-sm text-[#64748B]">No gift cards yet.</p>
      ) : (
        <>
          {/* Mini stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="p-3 rounded-xl bg-[#1A2332] text-center">
              <p className="text-heading-sm font-bold text-[#F1F5F9]">{giftCards.length}</p>
              <p className="text-caption text-[#64748B]">Total</p>
            </div>
            <div className="p-3 rounded-xl bg-[#1A2332] text-center">
              <p className="text-heading-sm font-bold text-emerald-400">{activeCards.length}</p>
              <p className="text-caption text-[#64748B]">Active</p>
            </div>
            <div className="p-3 rounded-xl bg-[#1A2332] text-center">
              <p className="text-heading-sm font-bold text-[#F1F5F9]">MK {totalBalance.toLocaleString()}</p>
              <p className="text-caption text-[#64748B]">Balance</p>
            </div>
          </div>

          {/* Recent gift cards */}
          <div className="space-y-2">
            {giftCards.slice(0, 3).map((gc) => {
              const statusColors: Record<string, string> = {
                active: "text-emerald-400",
                partially_redeemed: "text-amber-400",
                redeemed: "text-blue-400",
                expired: "text-red-400",
                cancelled: "text-gray-500",
              };
              return (
                <div key={gc.code} className="flex items-center justify-between py-2 px-3 rounded-xl bg-[#1A2332]">
                  <div className="min-w-0 flex-1">
                    <p className="text-body-sm font-mono text-[#F1F5F9] font-medium truncate">{gc.code}</p>
                    <p className="text-caption text-[#64748B] truncate">{gc.recipient_name || "—"}</p>
                  </div>
                  <div className="text-right ml-3">
                    <p className="text-body-sm font-medium text-[#F1F5F9]">MK {gc.balance.toLocaleString()}</p>
                    <p className={`text-caption font-medium capitalize ${statusColors[gc.status] || "text-[#64748B]"}`}>{gc.status.replace("_", " ")}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <Link
            href="/gift"
            className="mt-3 block text-center py-2.5 rounded-xl bg-[#FF0F73]/10 text-[#FF0F73] text-body-sm font-semibold hover:bg-[#FF0F73]/20 transition-all"
          >
            View All Gift Cards
          </Link>
        </>
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
