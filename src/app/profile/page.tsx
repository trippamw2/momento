"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import PartnerDashboard from "./PartnerDashboard";

// ─── Types ───

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

type ActivityItem = { action: string; time: string; ts: number };

// ─── Helpers ───

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

function getInitials(name: string, fallback: string): string {
  return name
    ? name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : fallback[0]?.toUpperCase() || "U";
}

// ─── Loading ───

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#05070B]">
      <div className="w-8 h-8 rounded-full border-2 border-[#FF0F73]/30 border-t-[#FF0F73] animate-spin" />
    </div>
  );
}

// ─── Guest ───

function GuestProfile() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#05070B] px-4">
      <div className="max-w-sm text-center">
        <div className="w-20 h-20 rounded-full bg-[#111827] border border-white/[0.08] flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Welcome to Momento</h1>
        <p className="text-white/50 text-sm mb-8">Sign in to view your profile, manage bookings, and more.</p>
        <Link
          href="/discover"
          className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-[#FF0F73] to-[#FF7A1A] text-white font-semibold text-sm hover:shadow-[0_4px_16px_rgba(255,15,115,0.3)] transition-all"
        >
          Discover Experiences
        </Link>
      </div>
    </div>
  );
}

// ─── Settings Sheet ───

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative w-10 h-6 rounded-full transition-all shrink-0 ${enabled ? 'bg-[#FF0F73]' : 'bg-white/10'}`}
    >
      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${enabled ? 'left-[18px]' : 'left-0.5'}`} />
    </button>
  );
}

function SettingsSheet({
  user,
  onClose,
}: {
  user: UserData;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"profile" | "password" | "email" | "notifications" | "account" | "security" | null>("profile");

    // Edit profile
  const [editName, setEditName] = useState(user.profile?.full_name || "");
  const [editEmail, setEditEmail] = useState(user.email || "");
  const [editPhone, setEditPhone] = useState(user.profile?.phone || "");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Toast for coming-soon features
  const [toast, setToast] = useState("");

  // Export data
  const [exporting, setExporting] = useState(false);

  const handleExportData = async () => {
    setExporting(true);
    const token = localStorage.getItem("experio-auth-token");
    try {
      const res = await fetch("/api/auth/me", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `experio-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setToast("Could not export data. Try again.");
      setTimeout(() => setToast(""), 2500);
    } finally {
      setExporting(false);
    }
  };

  // Notification preferences
  const [notificationSettings, setNotificationSettings] = useState({
    push: true,
    email: true,
    sms: true,
    marketing: false,
  });

  // Avatar
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user.profile?.avatar_url || null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

      const handleSaveProfile = async () => {
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
          email: editEmail.trim() !== user.email ? editEmail.trim() : null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        onClose();
      } else {
        setSaveError(data.error || "Failed to update profile");
      }
    } catch {
      setSaveError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) { setPasswordError("Enter your current password"); return; }
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
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordSuccess("Password changed!");
        setTimeout(onClose, 1500);
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
        setAvatarUrl(data.avatar_url);
      }
    } catch { /* silent */ }
    finally { setAvatarUploading(false); }
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-[#111827] border border-white/[0.08] max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle for mobile */}
        <div className="sticky top-0 z-10 bg-[#111827] pt-3 pb-2 flex justify-center sm:hidden">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="px-6 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Settings</h2>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/[0.05] text-white/50 hover:text-white transition-all">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* Tabs */}
          <div className="flex gap-1 mt-4 overflow-x-auto hide-scrollbar">
            {(["profile", "password", "email", "notifications", "account", "security"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  tab === t
                    ? "bg-white/10 text-white"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                {t === "profile" ? "Profile" : t === "password" ? "Password" : t === "email" ? "Email" : t === "notifications" ? "Notifications" : t === "account" ? "Account" : "Security"}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 space-y-5">
          {tab === "profile" && (
            <>
              {/* Avatar (in settings only) */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF0F73] to-[#FF7A1A] flex items-center justify-center text-white text-xl font-bold overflow-hidden hover:opacity-90 transition-opacity disabled:opacity-70 group shrink-0"
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : avatarUploading ? (
                    <div className="w-6 h-6 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <span>{getInitials(user.profile?.full_name || "", user.email)}</span>
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                    <span className="text-white text-[10px] font-medium">Change</span>
                  </div>
                </button>
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                <div>
                  <p className="text-sm font-medium text-white">Profile Photo</p>
                  <p className="text-[11px] text-white/40">Tap to change</p>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs text-white/50 mb-1.5 font-medium">Full name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#0A0E17] text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-1 border border-white/[0.1] focus:border-[#FF0F73] focus:ring-[#FF0F73]/20 transition-all"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs text-white/50 mb-1.5 font-medium">Phone number</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="+260 XXX XXX XXX"
                  className="w-full px-4 py-3 rounded-xl bg-[#0A0E17] text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-1 border border-white/[0.1] focus:border-[#FF0F73] focus:ring-[#FF0F73]/20 transition-all"
                />
              </div>

              {saveError && (
                <p className="text-sm text-red-400 bg-red-500/8 px-3 py-2 rounded-xl">{saveError}</p>
              )}

              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF0F73] to-[#FF7A1A] text-white font-semibold text-sm hover:shadow-[0_4px_16px_rgba(255,15,115,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </>
          )}

          {tab === "password" && (
            <>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-white/40 mb-4">
                Password must be at least 6 characters. Use a mix of letters, numbers, and symbols for a stronger password.
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1.5 font-medium">Current password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#0A0E17] text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-1 border border-white/[0.1] focus:border-[#FF0F73] focus:ring-[#FF0F73]/20 transition-all"
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1.5 font-medium">New password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#0A0E17] text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-1 border border-white/[0.1] focus:border-[#FF0F73] focus:ring-[#FF0F73]/20 transition-all"
                  placeholder="Enter new password"
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1.5 font-medium">Confirm new password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#0A0E17] text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-1 border border-white/[0.1] focus:border-[#FF0F73] focus:ring-[#FF0F73]/20 transition-all"
                  placeholder="Confirm new password"
                />
              </div>
              <div className="text-right -mt-2">
                <button
                  type="button"
                  onClick={() => {
                    const token = localStorage.getItem("experio-auth-token");
                    if (token) {
                      fetch("/api/auth/reset-password", {
                        method: "POST",
                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ email: user.email }),
                      });
                    }
                    setPasswordSuccess("Reset link sent to your email");
                    setTimeout(() => setPasswordSuccess(""), 3000);
                  }}
                  className="text-xs text-[#FF0F73] hover:text-[#e00b41] font-medium transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              {passwordError && <p className="text-sm text-red-400">{passwordError}</p>}
              {passwordSuccess && <p className="text-sm text-emerald-400">{passwordSuccess}</p>}
              <button
                onClick={handleChangePassword}
                disabled={passwordSaving}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF0F73] to-[#FF7A1A] text-white font-semibold text-sm hover:shadow-[0_4px_16px_rgba(255,15,115,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {passwordSaving ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  "Update Password"
                )}
              </button>
            </>
          )}

          {tab === "email" && (
            <>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-white/40 mb-4">
                Change the email address associated with your account. You&apos;ll need to verify the new email.
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1.5 font-medium">Current email</label>
                <p className="text-sm text-white/70 mb-3 px-4 py-3 rounded-xl bg-[#0A0E17] border border-white/[0.1]">{user.email}</p>
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1.5 font-medium">New email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#0A0E17] text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-1 border border-white/[0.1] focus:border-[#FF0F73] focus:ring-[#FF0F73]/20 transition-all"
                  placeholder="new@email.com"
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1.5 font-medium">Current password (for verification)</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#0A0E17] text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-1 border border-white/[0.1] focus:border-[#FF0F73] focus:ring-[#FF0F73]/20 transition-all"
                  placeholder="Enter password to confirm"
                />
              </div>
              {saveError && <p className="text-sm text-red-400">{saveError}</p>}
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF0F73] to-[#FF7A1A] text-white font-semibold text-sm hover:shadow-[0_4px_16px_rgba(255,15,115,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  "Change Email"
                )}
              </button>
            </>
          )}

          {tab === "notifications" && (
            <>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-white/40 mb-4">
                Choose which notifications you&apos;d like to receive.
              </div>
              {[
                { key: "push", label: "Push Notifications", desc: "Booking updates and reminders" },
                { key: "email", label: "Email Notifications", desc: "Promotions and special offers" },
                { key: "sms", label: "SMS Notifications", desc: "Urgent booking alerts" },
                { key: "marketing", label: "Marketing Emails", desc: "Newsletter and updates" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0">
                  <div>
                    <p className="text-sm text-white/80">{item.label}</p>
                    <p className="text-xs text-white/40">{item.desc}</p>
                  </div>
                  <Toggle
                    enabled={notificationSettings[item.key as keyof typeof notificationSettings]}
                    onChange={(v) => setNotificationSettings((prev) => ({ ...prev, [item.key]: v }))}
                  />
                </div>
              ))}
              <p className="text-xs text-white/20 mt-4 text-center">Notification preferences are saved locally.</p>
            </>
          )}

          {tab === "account" && (
            <>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-white/40 mb-4">
                Manage your account settings and data.
              </div>
              <button
                onClick={handleExportData}
                disabled={exporting}
                className="w-full py-3 rounded-xl border border-white/[0.1] text-sm font-medium text-white/70 hover:bg-white/5 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {exporting ? (
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M12 10v6m0 0l-3-3m3 3l3-3" /><path d="M3 17v2a2 2 0 002 2h14a2 2 0 002-2v-2" /><rect x="3" y="4" width="18" height="10" rx="2" /></svg>
                )}
                {exporting ? "Exporting..." : "Export My Data"}
              </button>
              <p className="text-xs text-white/20 mt-1.5 mb-6">Download all your data as a JSON file.</p>
              <button
                onClick={() => {
                  if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
                    const token = localStorage.getItem("experio-auth-token");
                    fetch("/api/auth/me", { method: "DELETE", headers: token ? { Authorization: `Bearer ${token}` } : {} }).then(() => {
                      localStorage.removeItem("experio-auth-token");
                      window.location.href = "/";
                    }).catch(() => {});
                  }
                }}
                className="w-full py-3 rounded-xl bg-red-500/8 text-red-400/70 text-sm font-medium hover:bg-red-500/15 hover:text-red-400 transition-all border border-red-500/10 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6" /><path d="M1 7h22" /><path d="M8 7V4a1 1 0 011-1h6a1 1 0 011 1v3" /></svg>
                Delete Account
              </button>
              <p className="text-xs text-white/20 mt-1.5">Permanently delete your account and all associated data.</p>
            </>
          )}

          {tab === "security" && (
            <>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-white/40 mb-4">
                Manage your account security settings.
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div>
                    <p className="text-sm text-white/80">Two-Factor Authentication (2FA)</p>
                    <p className="text-xs text-white/40">Add an extra layer of security to your account</p>
                  </div>
                  <Toggle enabled={false} onChange={() => { setToast("2FA coming soon"); setTimeout(() => setToast(""), 2500); }} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div>
                    <p className="text-sm text-white/80">Login Alerts</p>
                    <p className="text-xs text-white/40">Get notified when someone logs into your account</p>
                  </div>
                  <Toggle enabled={true} onChange={() => { setToast("Login alerts coming soon"); setTimeout(() => setToast(""), 2500); }} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div>
                    <p className="text-sm text-white/80">Active Sessions</p>
                    <p className="text-xs text-white/40">View and manage devices logged into your account</p>
                  </div>
                  <button className="text-xs text-[#FF0F73] hover:text-[#e00b41] font-medium">Manage</button>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div>
                    <p className="text-sm text-white/80">Passkeys</p>
                    <p className="text-xs text-white/40">Use your device's biometric authentication</p>
                  </div>
                  <button className="text-xs text-[#FF0F73] hover:text-[#e00b41] font-medium">Add Passkey</button>
                </div>
              </div>
            </>
          )}
        </div>
        {/* Toast */}
        {toast && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-white/90 backdrop-blur-sm text-xs text-[#222222] font-medium shadow-xl border border-white/20">
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── User Profile (simplified) ───

function UserProfile({ user: initialUser }: { user: UserData }) {
  const [user] = useState(initialUser);
  const [showSettings, setShowSettings] = useState(false);

  // Recent activity
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [activitiesLoaded, setActivitiesLoaded] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("experio-auth-token");
    if (!token) return;

    const fetchActivities = async () => {
      const items: ActivityItem[] = [];

      // Fetch recent bookings
      try {
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
              : `Booked "${expTitle}"`;
            const ts = new Date(b.booking_date || b.created_at || Date.now()).getTime();
            if (!isNaN(ts)) items.push({ action, time: timeAgo(ts), ts });
          }
        }
      } catch { /* ignore */ }

      // Fetch recent reviews
      try {
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
      } catch { /* ignore */ }

      // Fetch recent loyalty activity
      try {
        const lRes = await fetch("/api/loyalty/history?limit=5", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (lRes.ok) {
          const lData = await lRes.json();
          const txList = lData.transactions || lData.history || lData || [];
          for (const tx of txList) {
            const pts = tx.points || tx.amount || 0;
            const action = `Earned ${pts} loyalty points`;
            const ts = new Date(tx.created_at || Date.now()).getTime();
            if (!isNaN(ts)) items.push({ action, time: timeAgo(ts), ts });
          }
        }
      } catch { /* ignore */ }

      items.sort((a, b) => b.ts - a.ts);
      setActivities(items.slice(0, 5));
      setActivitiesLoaded(true);
    };

    fetchActivities();
  }, []);

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

  const initials = getInitials(user.profile?.full_name || "", user.email);

  return (
    <div className="min-h-screen bg-[#05070B] pt-20 pb-24">
      <div className="max-w-lg mx-auto px-4">

        {/* ─── Profile Header ─── */}
        <div className="flex flex-col items-center text-center mb-8">
          {/* Avatar (display only) */}
          <div className="relative mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FF0F73] to-[#FF7A1A] flex items-center justify-center text-white text-2xl font-bold overflow-hidden shadow-lg">
              {user.profile?.avatar_url ? (
                <img src={user.profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span>{initials}</span>
              )}
            </div>
          </div>

          <h1 className="text-xl font-bold text-white">
            {user.profile?.full_name || "Explorer"}
          </h1>
          <p className="text-sm text-white/40">{user.email}</p>

          {/* Settings gear - only action in header */}
          <button
            onClick={() => setShowSettings(true)}
            className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[11px] text-white/40 hover:text-white/70 hover:bg-white/[0.08] transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </button>
        </div>

        {/* ─── Stats (max 3) ─── */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="rounded-xl bg-[#111827] border border-white/[0.06] p-4 text-center">
            <p className="text-xs text-white/40 mb-1">Member Since</p>
            <p className="text-lg font-bold text-white">2026</p>
          </div>
          <div className="rounded-xl bg-[#111827] border border-white/[0.06] p-4 text-center">
            <p className="text-xs text-white/40 mb-1">Role</p>
            <p className="text-lg font-bold text-white capitalize">{user.role === "partner" ? "Host" : user.role}</p>
          </div>
          <div className="rounded-xl bg-[#111827] border border-white/[0.06] p-4 text-center">
            <p className="text-xs text-white/40 mb-1">Phone</p>
            <p className="text-sm font-bold text-white truncate">
              {user.profile?.phone || "—"}
            </p>
          </div>
        </div>

        {/* ─── Recent Activity ─── */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-white mb-3">Recent Activity</h2>
          <div className="rounded-xl bg-[#111827] border border-white/[0.06] overflow-hidden">
            {activities.length === 0 && !activitiesLoaded ? (
              <div className="flex items-center gap-2 p-4">
                <div className="w-4 h-4 rounded-full border-2 border-[#FF0F73]/30 border-t-[#FF0F73] animate-spin" />
                <span className="text-xs text-white/40">Loading...</span>
              </div>
            ) : activities.length === 0 ? (
              <p className="text-sm text-white/40 p-4">No activity yet. Start exploring!</p>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {activities.map((activity, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#FF0F73] shrink-0" />
                    <p className="flex-1 text-sm text-white/70 truncate">{activity.action}</p>
                    <span className="text-[11px] text-white/30 shrink-0">{activity.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── Quick Links (minimal) ─── */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <Link
            href="/bookings"
            className="flex items-center gap-3 p-3.5 rounded-xl bg-[#111827] border border-white/[0.06] hover:bg-white/[0.03] transition-all"
          >
            <span className="text-lg">◇</span>
            <span className="text-sm font-medium text-white/70">Bookings</span>
          </Link>
          <Link
            href="/saved"
            className="flex items-center gap-3 p-3.5 rounded-xl bg-[#111827] border border-white/[0.06] hover:bg-white/[0.03] transition-all"
          >
            <span className="text-lg">♥</span>
            <span className="text-sm font-medium text-white/70">Saved</span>
          </Link>
        </div>

        {/* ─── Sign Out ─── */}
        <button
          onClick={handleSignOut}
          className="w-full py-3 rounded-xl bg-red-500/8 text-red-400/70 text-sm font-medium hover:bg-red-500/15 hover:text-red-400 transition-all border border-red-500/10 flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </div>

      {/* ─── Settings Sheet ─── */}
      {showSettings && (
        <SettingsSheet
          user={user}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

// ─── Main Page ───

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

  if (user?.role === "partner" || user?.role === "admin") {
    return <PartnerDashboard />;
  }

  if (user) {
    return <UserProfile user={user} />;
  }

  return <GuestProfile />;
}
