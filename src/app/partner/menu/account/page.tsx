"use client";

import { useState, useEffect } from "react";
import { useAuthGuard } from "@/lib/use-auth-guard";

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  bio: string;
  hostName: string;
  yearStarted: number;
  hostPhoto: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
}

export default function AccountSettingsPage() {
  const { allowed: isPartner, loading: authLoading } = useAuthGuard({ requiredRole: "partner" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [form, setForm] = useState<UserProfile>({
    name: "",
    email: "",
    phone: "",
    bio: "",
    hostName: "",
    yearStarted: new Date().getFullYear(),
    hostPhoto: "",
    emailNotifications: true,
    smsNotifications: false,
  });

  useEffect(() => {
    if (authLoading || !isPartner) return;
    // Load from localStorage or use defaults
    const stored = localStorage.getItem("experio-user-profile");
    if (stored) {
      try {
        setForm(JSON.parse(stored));
      } catch {}
    }
    setLoading(false);
  }, [authLoading, isPartner]);

  const updateField = (field: keyof UserProfile, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setMessage(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1000));
    localStorage.setItem("experio-user-profile", JSON.stringify(form));
    setSaving(false);
    setMessage({ type: "success", text: "Settings saved successfully!" });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      updateField("hostPhoto", url);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-2 border-[#FF0F73]/30 border-t-[#FF0F73] animate-spin" />
      </div>
    );
  }

  if (!isPartner) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-display-sm font-bold text-white mb-2">Account Settings</h1>
        <p className="text-[#64748B] text-body-lg">Manage your profile, contact info, and preferences</p>
      </div>

      {message && (
        <div className={`rounded-xl p-4 ${message.type === "success" ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border border-red-500/30 text-red-400"}`}>
          {message.text}
        </div>
      )}

      {/* Profile Section */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-6">
        <h2 className="text-heading-sm font-bold text-white mb-6 flex items-center gap-2">
          <svg className="w-5 h-5 text-[#FF0F73]" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
          Personal Profile
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-body-sm font-medium text-[#CBD5E1]">Full Name</label>
              <input type="text" value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="Your full name" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#FF0F73]/30 focus:border-[#FF0F73] text-body-sm transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-body-sm font-medium text-[#CBD5E1]">Email</label>
              <input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} placeholder="you@example.com" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#FF0F73]/30 focus:border-[#FF0F73] text-body-sm transition-all" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-body-sm font-medium text-[#CBD5E1]">Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="+265 XX XXXXXXX" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#FF0F73]/30 focus:border-[#FF0F73] text-body-sm transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-body-sm font-medium text-[#CBD5E1]">Bio</label>
              <textarea value={form.bio} onChange={(e) => updateField("bio", e.target.value)} placeholder="Tell guests about yourself..." rows={3} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#FF0F73]/30 focus:border-[#FF0F73] text-body-sm resize-y transition-all" />
            </div>
          </div>
        </div>
      </div>

      {/* Host Profile Section */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-6">
        <h2 className="text-heading-sm font-bold text-white mb-6 flex items-center gap-2">
          <svg className="w-5 h-5 text-[#FF0F73]" viewBox="0 0 20 20" fill="currentColor"><path d="M13 6a1 1 0 011 1v2.586l3.293 3.293a1 1 0 01-1.414 1.414L13 10.414V13a1 1 0 11-2 0v-.586L7.707 13.707a1 1 0 01-1.414-1.414L9 9.586V7a1 1 0 112 0v2.586l3.293-3.293a1 1 0 011.414 1.414L11 9.414V7a1 1 0 011-1z" /></svg>
          Host Profile
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-body-sm font-medium text-[#CBD5E1]">Host Name (display name)</label>
              <input type="text" value={form.hostName} onChange={(e) => updateField("hostName", e.target.value)} placeholder="Your host display name" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#FF0F73]/30 focus:border-[#FF0F73] text-body-sm transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-body-sm font-medium text-[#CBD5E1]">Year Started Hosting</label>
              <input type="number" min="2000" max={new Date().getFullYear()} value={form.yearStarted} onChange={(e) => updateField("yearStarted", parseInt(e.target.value) || new Date().getFullYear())} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#FF0F73]/30 focus:border-[#FF0F73] text-body-sm transition-all" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-body-sm font-medium text-[#CBD5E1]">Host Photo</label>
            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white focus:outline-none focus:ring-2 focus:ring-[#FF0F73]/30 focus:border-[#FF0F73] text-body-sm" />
            {form.hostPhoto && (
              <div className="mt-3 flex items-center gap-3">
                <img src={form.hostPhoto} alt="Host photo" className="w-16 h-16 rounded-full object-cover" />
                <span className="text-caption text-[#64748B]">Current photo</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contact Info Section */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-6">
        <h2 className="text-heading-sm font-bold text-white mb-6 flex items-center gap-2">
          <svg className="w-5 h-5 text-[#FF0F73]" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
          Contact Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-body-sm font-medium text-[#CBD5E1]">Contact Email</label>
            <input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} placeholder="host@example.com" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#FF0F73]/30 focus:border-[#FF0F73] text-body-sm transition-all" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-body-sm font-medium text-[#CBD5E1]">Contact Phone</label>
            <input type="tel" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="+265 XX XXXXXXX" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#FF0F73]/30 focus:border-[#FF0F73] text-body-sm transition-all" />
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-6">
        <h2 className="text-heading-sm font-bold text-white mb-6 flex items-center gap-2">
          <svg className="w-5 h-5 text-[#FF0F73]" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" /></svg>
          Notification Preferences
        </h2>

        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 rounded-xl border border-white/[0.06] bg-white/5 cursor-pointer hover:bg-white/[0.02] transition-colors">
            <div>
              <p className="text-body-sm font-semibold text-white">Email Notifications</p>
              <p className="text-caption text-[#64748B]">Receive booking updates, messages, and announcements via email</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={form.emailNotifications} onChange={(e) => updateField("emailNotifications", e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-white/10 peer-focus:ring-4 peer-focus:ring-[#FF0F73]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF0F73]"></div>
            </label>
          </label>

          <label className="flex items-center justify-between p-4 rounded-xl border border-white/[0.06] bg-white/5 cursor-pointer hover:bg-white/[0.02] transition-colors">
            <div>
              <p className="text-body-sm font-semibold text-white">SMS Notifications</p>
              <p className="text-caption text-[#64748B]">Receive urgent alerts and booking confirmations via SMS</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={form.smsNotifications} onChange={(e) => updateField("smsNotifications", e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-white/10 peer-focus:ring-4 peer-focus:ring-[#FF0F73]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF0F73]"></div>
            </label>
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving} className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#FF0F73] to-[#FF7A1A] text-white font-semibold hover:shadow-[0_4px_24px_rgba(255,15,115,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}