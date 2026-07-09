"use client";

import { useState, useEffect, useCallback } from "react";

interface Setting {
  id: string;
  key: string;
  value: string;
  description: string | null;
  updated_at: string;
}

export default function AdminSettingsSection() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  const getToken = () => localStorage.getItem("experio-auth-token");

  const fetchSettings = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return;
      const res = await fetch("/api/admin/settings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings || []);
        const vals: Record<string, string> = {};
        (data.settings || []).forEach((s: Setting) => { vals[s.key] = s.value; });
        setEditValues(vals);
      }
    } catch (e) {
      console.error("Failed to fetch settings:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSave = async (key: string) => {
    setSaving(key);
    try {
      const token = getToken();
      if (!token) return;
      await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: editValues[key] }),
      });
      fetchSettings();
    } catch (e) {
      console.error("Failed to save setting:", e);
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-[#FF0F73]/30 border-t-[#FF0F73] animate-spin" />
      </div>
    );
  }

  const settingConfigs: Record<string, { label: string; type: string; min?: string; max?: string }> = {
    platform_commission_percent: { label: "Platform Commission (%)", type: "number", min: "0", max: "50" },
    min_payout_amount: { label: "Minimum Payout Amount (MK)", type: "number", min: "0" },
    payout_schedule: { label: "Payout Schedule", type: "select" },
    auto_approve_payouts: { label: "Auto-Approve Payouts", type: "select" },
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-[#0F172A] border border-white/[0.08] shadow-sm p-6">
        <h3 className="text-heading-sm font-bold text-[#F1F5F9] mb-1">Platform Commission Settings</h3>
        <p className="text-caption text-[#64748B] mb-6">Control how much the platform earns from each booking.</p>

        <div className="space-y-4">
          {settings.map((s) => {
            const config = settingConfigs[s.key] || { label: s.key, type: "text" };
            return (
              <div key={s.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl bg-[#05070B] border border-white/[0.05]">
                <div className="flex-1">
                  <label className="text-body-sm font-medium text-[#F1F5F9]">{config.label}</label>
                  {s.description && <p className="text-caption text-[#64748B] mt-0.5">{s.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {config.type === "select" ? (
                    <select
                      value={editValues[s.key] ?? s.value}
                      onChange={(e) => setEditValues(prev => ({ ...prev, [s.key]: e.target.value }))}
                      className="px-3 py-2 rounded-lg text-body-sm border border-white/[0.08] bg-[#0F172A] text-[#F1F5F9] focus:outline-none focus:border-[#FF0F73] min-w-[140px]"
                    >
                      {s.key === "payout_schedule" && (
                        <>
                          <option value="weekly">Weekly</option>
                          <option value="biweekly">Biweekly</option>
                          <option value="monthly">Monthly</option>
                        </>
                      )}
                      {s.key === "auto_approve_payouts" && (
                        <>
                          <option value="true">Enabled</option>
                          <option value="false">Disabled</option>
                        </>
                      )}
                    </select>
                  ) : (
                    <input
                      type={config.type}
                      value={editValues[s.key] ?? s.value}
                      onChange={(e) => setEditValues(prev => ({ ...prev, [s.key]: e.target.value }))}
                      min={config.min}
                      max={config.max}
                      className="px-3 py-2 rounded-lg text-body-sm border border-white/[0.08] bg-[#0F172A] text-[#F1F5F9] focus:outline-none focus:border-[#FF0F73] w-32"
                    />
                  )}
                  <button
                    onClick={() => handleSave(s.key)}
                    disabled={saving === s.key || editValues[s.key] === s.value}
                    className="px-4 py-2 rounded-lg text-caption font-medium bg-[#FF0F73] text-white hover:shadow-[0_4px_16px_rgba(255,15,115,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving === s.key ? "..." : "Save"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Commission Preview */}
      <div className="rounded-xl bg-[#0F172A] border border-white/[0.08] shadow-sm p-6">
        <h3 className="text-body-sm font-semibold text-[#F1F5F9] mb-3">How It Works</h3>
        <div className="space-y-2 text-body-sm text-[#94A3B8]">
          <p>1. Guest books an experience and pays MK 100,000</p>
          <p>2. Platform takes <span className="text-[#FF0F73] font-medium">{editValues.platform_commission_percent ?? "10"}%</span> commission = MK {(100000 * Number(editValues.platform_commission_percent ?? 10) / 100).toLocaleString()}</p>
          <p>3. Partner receives <span className="text-emerald-400 font-medium">MK {(100000 - 100000 * Number(editValues.platform_commission_percent ?? 10) / 100).toLocaleString()}</span></p>
        </div>
      </div>
    </div>
  );
}
