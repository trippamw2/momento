"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthGuard } from "@/lib/use-auth-guard";

const CATEGORIES = [
  "Food & Drink", "Adventure", "Wellness", "Arts & Culture",
  "Music & Nightlife", "Nature & Outdoors", "Workshops", "Luxury",
];

interface PartnerData {
  business_name: string;
  business_description: string;
  business_email: string;
  business_phone: string;
  business_website: string;
  business_address: string;
  business_city: string;
  business_country: string;
  categories: string[];
  bank_name: string;
  bank_account_number: string;
  bank_account_name: string;
  payout_method: string;
  id_document_type: string;
  id_document_url: string;
  onboarding_completed: boolean;
  onboarding_step: number;
}

const DEFAULT_DATA: PartnerData = {
  business_name: "",
  business_description: "",
  business_email: "",
  business_phone: "",
  business_website: "",
  business_address: "",
  business_city: "",
  business_country: "Malawi",
  categories: [],
  bank_name: "",
  bank_account_number: "",
  bank_account_name: "",
  payout_method: "bank_transfer",
  id_document_type: "national_id",
  id_document_url: "",
  onboarding_completed: false,
  onboarding_step: 0,
};

const STEPS = [
  { label: "Business Profile", icon: "1" },
  { label: "Location & Categories", icon: "2" },
  { label: "Bank Details", icon: "3" },
  { label: "Verification", icon: "4" },
];

export default function PartnerOnboardingPage() {
  const router = useRouter();
  const { allowed: isPartner, loading: authLoading } = useAuthGuard({ requiredRole: "partner" });
  const [step, setStep] = useState(1);
  const [data, setData] = useState<PartnerData>(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (authLoading || !isPartner) return;
    const fetchPartner = async () => {
      try {
        const token = localStorage.getItem("experio-auth-token");
        if (!token) return;
        const res = await fetch("/api/partners/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const d = await res.json();
          if (d.partner) {
            if (d.partner.onboarding_completed) {
              router.replace("/partner/dashboard");
              return;
            }
            setData({
              business_name: d.partner.business_name || "",
              business_description: d.partner.business_description || "",
              business_email: d.partner.business_email || "",
              business_phone: d.partner.business_phone || "",
              business_website: d.partner.business_website || "",
              business_address: d.partner.business_address || "",
              business_city: d.partner.business_city || "",
              business_country: d.partner.business_country || "Malawi",
              categories: d.partner.categories || [],
              bank_name: d.partner.bank_name || "",
              bank_account_number: d.partner.bank_account_number || "",
              bank_account_name: d.partner.bank_account_name || "",
              payout_method: d.partner.payout_method || "bank_transfer",
              id_document_type: d.partner.id_document_type || "national_id",
              id_document_url: d.partner.id_document_url || "",
              onboarding_completed: d.partner.onboarding_completed || false,
              onboarding_step: d.partner.onboarding_step || 0,
            });
            setStep(Math.max(1, (d.partner.onboarding_step || 0) + 1));
          }
        }
      } catch (e) {
        console.error("Failed to load partner data:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchPartner();
  }, [authLoading, isPartner, router]);

  const update = (field: keyof PartnerData, value: unknown) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const toggleCategory = (cat: string) => {
    setData(prev => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter(c => c !== cat)
        : [...prev.categories, cat],
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem("experio-auth-token");
      if (!token) return;
      await fetch("/api/partners/me", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          onboarding_completed: true,
          onboarding_step: 4,
        }),
      });
      router.push("/partner/dashboard");
    } catch (e) {
      console.error("Failed to complete onboarding:", e);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#05070B] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#FF0F73]/30 border-t-[#FF0F73] animate-spin" />
      </div>
    );
  }

  if (!isPartner) {
    return (
      <div className="min-h-screen bg-[#05070B] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-heading-xl font-bold text-[#F1F5F9] mb-3">Partner Access Required</h1>
          <p className="text-[#94A3B8] mb-6">Please sign in with a partner account.</p>
          <Link href="/" className="px-6 py-3 rounded-xl bg-[#FF0F73] text-white font-semibold">Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05070B] pt-24 pb-20">
      <div className="max-w-2xl mx-auto px-4">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((s, i) => (
            <div key={s.label} className="flex items-center">
              <div className={`flex items-center gap-2 ${i + 1 <= step ? "text-[#FF0F73]" : "text-[#64748B]"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-caption font-bold ${
                  i + 1 < step ? "bg-[#FF0F73] text-white" : i + 1 === step ? "bg-[#FF0F73]/20 text-[#FF0F73] border border-[#FF0F73]" : "bg-[#1A2332] text-[#64748B] border border-white/[0.08]"
                }`}>
                  {i + 1 < step ? "✓" : s.icon}
                </div>
                <span className="text-caption font-medium hidden sm:block">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`w-8 sm:w-16 h-px mx-2 ${i + 1 < step ? "bg-[#FF0F73]" : "bg-white/[0.08]"}`} />}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-6 sm:p-8">
          {/* Step 1: Business Profile */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-heading-md font-bold text-[#F1F5F9] mb-4">Business Profile</h2>
              <div>
                <label className="text-caption text-[#94A3B8] font-medium mb-1 block">Business Name *</label>
                <input value={data.business_name} onChange={e => update("business_name", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#05070B] border border-white/[0.08] text-[#F1F5F9] text-body-sm focus:outline-none focus:border-[#FF0F73]" placeholder="e.g. Lilongwe Food Tours" />
              </div>
              <div>
                <label className="text-caption text-[#94A3B8] font-medium mb-1 block">Description</label>
                <textarea value={data.business_description} onChange={e => update("business_description", e.target.value)} rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-[#05070B] border border-white/[0.08] text-[#F1F5F9] text-body-sm focus:outline-none focus:border-[#FF0F73] resize-none" placeholder="Tell guests about your business..." />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-caption text-[#94A3B8] font-medium mb-1 block">Email</label>
                  <input value={data.business_email} onChange={e => update("business_email", e.target.value)} type="email"
                    className="w-full px-4 py-3 rounded-xl bg-[#05070B] border border-white/[0.08] text-[#F1F5F9] text-body-sm focus:outline-none focus:border-[#FF0F73]" placeholder="business@example.com" />
                </div>
                <div>
                  <label className="text-caption text-[#94A3B8] font-medium mb-1 block">Phone</label>
                  <input value={data.business_phone} onChange={e => update("business_phone", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[#05070B] border border-white/[0.08] text-[#F1F5F9] text-body-sm focus:outline-none focus:border-[#FF0F73]" placeholder="+265..." />
                </div>
              </div>
              <div>
                <label className="text-caption text-[#94A3B8] font-medium mb-1 block">Website</label>
                <input value={data.business_website} onChange={e => update("business_website", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#05070B] border border-white/[0.08] text-[#F1F5F9] text-body-sm focus:outline-none focus:border-[#FF0F73]" placeholder="https://..." />
              </div>
            </div>
          )}

          {/* Step 2: Location & Categories */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-heading-md font-bold text-[#F1F5F9] mb-4">Location & Categories</h2>
              <div>
                <label className="text-caption text-[#94A3B8] font-medium mb-1 block">Address</label>
                <input value={data.business_address} onChange={e => update("business_address", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#05070B] border border-white/[0.08] text-[#F1F5F9] text-body-sm focus:outline-none focus:border-[#FF0F73]" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-caption text-[#94A3B8] font-medium mb-1 block">City</label>
                  <input value={data.business_city} onChange={e => update("business_city", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[#05070B] border border-white/[0.08] text-[#F1F5F9] text-body-sm focus:outline-none focus:border-[#FF0F73]" />
                </div>
                <div>
                  <label className="text-caption text-[#94A3B8] font-medium mb-1 block">Country</label>
                  <input value={data.business_country} onChange={e => update("business_country", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[#05070B] border border-white/[0.08] text-[#F1F5F9] text-body-sm focus:outline-none focus:border-[#FF0F73]" />
                </div>
              </div>
              <div>
                <label className="text-caption text-[#94A3B8] font-medium mb-2 block">Categories</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => toggleCategory(cat)}
                      className={`px-4 py-2 rounded-xl text-caption font-medium transition-all ${
                        data.categories.includes(cat)
                          ? "bg-[#FF0F73] text-white" : "bg-[#05070B] text-[#94A3B8] border border-white/[0.08] hover:border-[#FF0F73]/50"
                      }`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Bank Details */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-heading-md font-bold text-[#F1F5F9] mb-4">Bank Details</h2>
              <p className="text-body-sm text-[#94A3B8] mb-4">This is where your payouts will be sent.</p>
              <div>
                <label className="text-caption text-[#94A3B8] font-medium mb-1 block">Payout Method</label>
                <select value={data.payout_method} onChange={e => update("payout_method", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#05070B] border border-white/[0.08] text-[#F1F5F9] text-body-sm focus:outline-none focus:border-[#FF0F73]">
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="mobile_money">Mobile Money</option>
                </select>
              </div>
              <div>
                <label className="text-caption text-[#94A3B8] font-medium mb-1 block">Bank Name</label>
                <input value={data.bank_name} onChange={e => update("bank_name", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#05070B] border border-white/[0.08] text-[#F1F5F9] text-body-sm focus:outline-none focus:border-[#FF0F73]" placeholder="e.g. National Bank of Malawi" />
              </div>
              <div>
                <label className="text-caption text-[#94A3B8] font-medium mb-1 block">Account Number</label>
                <input value={data.bank_account_number} onChange={e => update("bank_account_number", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#05070B] border border-white/[0.08] text-[#F1F5F9] text-body-sm focus:outline-none focus:border-[#FF0F73]" />
              </div>
              <div>
                <label className="text-caption text-[#94A3B8] font-medium mb-1 block">Account Name</label>
                <input value={data.bank_account_name} onChange={e => update("bank_account_name", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#05070B] border border-white/[0.08] text-[#F1F5F9] text-body-sm focus:outline-none focus:border-[#FF0F73]" placeholder="Name on the account" />
              </div>
            </div>
          )}

          {/* Step 4: Verification */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-heading-md font-bold text-[#F1F5F9] mb-4">Verification</h2>
              <p className="text-body-sm text-[#94A3B8] mb-4">Upload an ID document to verify your identity.</p>
              <div>
                <label className="text-caption text-[#94A3B8] font-medium mb-1 block">Document Type</label>
                <select value={data.id_document_type} onChange={e => update("id_document_type", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#05070B] border border-white/[0.08] text-[#F1F5F9] text-body-sm focus:outline-none focus:border-[#FF0F73]">
                  <option value="national_id">National ID</option>
                  <option value="passport">Passport</option>
                  <option value="drivers_license">Driver&apos;s License</option>
                </select>
              </div>
              <div>
                <label className="text-caption text-[#94A3B8] font-medium mb-1 block">Document URL</label>
                <input value={data.id_document_url} onChange={e => update("id_document_url", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#05070B] border border-white/[0.08] text-[#F1F5F9] text-body-sm focus:outline-none focus:border-[#FF0F73]" placeholder="Link to your ID document image" />
                <p className="text-caption text-[#64748B] mt-1">Provide a link to a photo/scan of your document</p>
              </div>
              <div className="flex items-start gap-3 mt-4 p-4 rounded-xl bg-[#05070B] border border-white/[0.08]">
                <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-white/[0.08] text-[#FF0F73] focus:ring-[#FF0F73]" />
                <p className="text-body-sm text-[#94A3B8]">
                  I confirm that all information provided is accurate and I agree to the platform&apos;s terms of service.
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/[0.08]">
            <button
              onClick={() => setStep(s => Math.max(1, s - 1))}
              disabled={step === 1}
              className="px-5 py-2.5 rounded-xl border border-white/[0.08] text-[#F1F5F9] font-semibold text-body-sm hover:bg-white/[0.05] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {step < 4 ? (
              <button
                onClick={() => setStep(s => Math.min(4, s + 1))}
                disabled={step === 1 && !data.business_name}
                className="px-6 py-2.5 rounded-xl bg-[#FF0F73] text-white font-semibold text-body-sm hover:shadow-[0_4px_16px_rgba(255,15,115,0.3)] transition-all disabled:opacity-50"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!confirmed || submitting || !data.bank_account_number}
                className="px-6 py-2.5 rounded-xl bg-[#FF0F73] text-white font-semibold text-body-sm hover:shadow-[0_4px_16px_rgba(255,15,115,0.3)] transition-all disabled:opacity-50"
              >
                {submitting ? "Completing..." : "Complete Setup"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
