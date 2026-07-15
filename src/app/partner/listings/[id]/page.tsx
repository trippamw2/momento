"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthGuard } from "@/lib/use-auth-guard";

interface Experience {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  price: number;
  duration: string;
  category: string;
  location: string;
  status: "draft" | "active" | "unlisted" | "published";
  rating: number;
  review_count: number;
  booking_count: number;
  revenue: number;
  images: string[];
  max_guests: number;
  itinerary?: ItineraryItem[];
  pricing?: PricingData;
  availability?: AvailabilityData;
  group_size?: GroupSizeData;
  location_details?: LocationData;
  host_expertise?: HostExpertiseData;
  about_host?: AboutHostData;
  guest_requirements?: GuestRequirementsData;
}

interface ItineraryItem {
  id: string;
  time: string;
  title: string;
  description: string;
  photo?: string;
}

interface PricingData {
  solo_price: number;
  group_price: number;
  is_private: boolean;
  private_max: number;
  public_max: number;
}

interface AvailabilityData {
  cutoff_time: string;
  new_guest_cutoff: string;
  available_days: string[];
  time_from: string;
  time_to: string;
}

interface GroupSizeData {
  public_max: number;
  private_max: number;
  min_guests: number;
}

interface LocationData {
  city: string;
  meeting_point: string;
  what_to_bring: string;
  notes: string;
}

interface HostExpertiseData {
  introduction: string;
  qualifications: string;
  languages: string;
  response_time: string;
}

interface AboutHostData {
  name: string;
  year_started: number;
  photo: string;
  email: string;
  phone: string;
}

interface GuestRequirementsData {
  min_age: number;
  activity_level: string;
  skill_level: string;
  accessibility: string[];
  languages: string;
  cancellation_policy: string;
  custom_link: string;
}

const CATEGORIES = ["Date", "Chill", "Celebrate", "Escape"];
const CITIES = ["Lilongwe", "Blantyre", "Mzuzu", "Zomba", "Mangochi", "Salima", "Other"];
const CUTOFF_OPTIONS = ["1 hour before", "2 hours before", "6 hours before", "12 hours before", "24 hours before", "48 hours before"];
const GUEST_CUTOFF_OPTIONS = ["Anytime", "1 day before", "2 days before", "7 days before"];
const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const ACTIVITY_LEVELS = ["All levels", "Beginner-friendly", "Moderate", "Advanced", "Strenuous"];
const SKILL_LEVELS = ["None", "Beginner", "Intermediate", "Advanced"];
const ACCESSIBILITY_OPTIONS = ["Wheelchair accessible", "Hearing loop available", "Service animals allowed", "Visual aids available", "Quiet space available", "All-gender restroom"];
const CANCELLATION_POLICIES = [
  "Flexible (full refund 24h before)",
  "Moderate (full refund 5 days before)",
  "Strict (50% refund 7 days before)",
  "Very Strict (no refund)",
];
const RESPONSE_TIMES = ["Within 1 hour", "Within a few hours", "Within 24 hours"];

export default function ListingEditorPage() {
  const { allowed: isPartner, loading: authLoading } = useAuthGuard({ requiredRole: "partner" });
  const params = useParams();
  const router = useRouter();
  const isNew = params.id === "new";
  const listingId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [expandedSections, setExpandedSections] = useState<string[]>(["photos", "basic"]);

  const [form, setForm] = useState<Experience>({
    id: "",
    title: "",
    subtitle: "",
    description: "",
    price: 0,
    duration: "",
    category: "",
    location: "",
    status: "draft",
    rating: 0,
    review_count: 0,
    booking_count: 0,
    revenue: 0,
    images: [],
    max_guests: 10,
    itinerary: [],
    pricing: { solo_price: 0, group_price: 0, is_private: false, private_max: 4, public_max: 10 },
    availability: { cutoff_time: "24 hours before", new_guest_cutoff: "Anytime", available_days: DAYS_OF_WEEK, time_from: "09:00", time_to: "18:00" },
    group_size: { public_max: 10, private_max: 4, min_guests: 1 },
    location_details: { city: "", meeting_point: "", what_to_bring: "", notes: "" },
    host_expertise: { introduction: "", qualifications: "", languages: "", response_time: "Within a few hours" },
    about_host: { name: "", year_started: new Date().getFullYear(), photo: "", email: "", phone: "" },
    guest_requirements: { min_age: 18, activity_level: "All levels", skill_level: "None", accessibility: [], languages: "", cancellation_policy: "Flexible (full refund 24h before)", custom_link: "" },
  });

  // Fetch listing on mount (if editing)
  useEffect(() => {
    if (authLoading || !isPartner) return;
    if (isNew) {
      setLoading(false);
      return;
    }
    const token = localStorage.getItem("experio-auth-token");
    if (!token) return;

    fetch(`/api/experiences/${listingId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        const mapped = {
          id: String(data.id ?? ""),
          title: String(data.title ?? data.name ?? ""),
          subtitle: data.subtitle,
          description: data.description ?? "",
          price: Number(data.price ?? 0),
          duration: data.duration ?? "",
          category: data.category ?? "",
          location: data.location ?? "",
          status: (String(data.status ?? "draft") as "draft" | "active" | "unlisted" | "published"),
          rating: Number(data.rating ?? 0),
          review_count: Number(data.review_count ?? 0),
          booking_count: Number(data.booking_count ?? 0),
          revenue: Number(data.revenue ?? 0),
          images: Array.isArray(data.images) ? data.images : (data.image ? [data.image] : []),
          max_guests: Number(data.max_guests ?? data.capacity ?? 10),
          itinerary: Array.isArray(data.itinerary) ? data.itinerary : [],
          pricing: data.pricing ?? { solo_price: 0, group_price: 0, is_private: false, private_max: 4, public_max: 10 },
          availability: data.availability ?? { cutoff_time: "24 hours before", new_guest_cutoff: "Anytime", available_days: DAYS_OF_WEEK, time_from: "09:00", time_to: "18:00" },
          group_size: data.group_size ?? { public_max: 10, private_max: 4, min_guests: 1 },
          location_details: data.location_details ?? { city: "", meeting_point: "", what_to_bring: "", notes: "" },
          host_expertise: data.host_expertise ?? { introduction: "", qualifications: "", languages: "", response_time: "Within a few hours" },
          about_host: data.about_host ?? { name: "", year_started: new Date().getFullYear(), photo: "", email: "", phone: "" },
          guest_requirements: data.guest_requirements ?? { min_age: 18, activity_level: "All levels", skill_level: "None", accessibility: [], languages: "", cancellation_policy: "Flexible (full refund 24h before)", custom_link: "" },
        };
        setForm(mapped);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load experience");
      })
      .finally(() => setLoading(false));
  }, [authLoading, isPartner, isNew, listingId]);

  const updateField = useCallback(<K extends keyof Experience>(field: K, value: Experience[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const updateNested = useCallback(<T extends object>(parent: keyof Experience, child: keyof T, value: any) => {
    setForm((prev) => ({
      ...prev,
      [parent]: { ...(prev[parent] as object), [child]: value } as T,
    }));
  }, []);

  const addItineraryItem = () => {
    setForm((prev) => ({
      ...prev,
      itinerary: [
        ...(prev.itinerary ?? []),
        { id: Date.now().toString(), time: "", title: "", description: "", photo: "" },
      ],
    }));
  };

  const removeItineraryItem = (id: string) => {
    setForm((prev) => ({
      ...prev,
      itinerary: (prev.itinerary ?? []).filter((item) => item.id !== id),
    }));
  };

  const updateItineraryItem = (id: string, field: keyof ItineraryItem, value: any) => {
    setForm((prev) => ({
      ...prev,
      itinerary: (prev.itinerary ?? []).map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const newImages = files.slice(0, 10 - (form.images?.length ?? 0)).map((file) => URL.createObjectURL(file));
    setForm((prev) => ({ ...prev, images: [...(prev.images ?? []), ...newImages] }));
  };

  const removeImage = (index: number) => {
    setForm((prev) => ({ ...prev, images: prev.images?.filter((_, i) => i !== index) ?? [] }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }
    setError("");
    setSaving(true);

    const token = localStorage.getItem("experio-auth-token");
    if (!token) {
      setError("Not authenticated");
      setSaving(false);
      return;
    }

    const payload = {
      title: form.title,
      subtitle: form.subtitle,
      description: form.description,
      price: form.price,
      duration: form.duration,
      category: form.category,
      location: form.location,
      status: "draft",
      max_guests: form.max_guests,
      images: form.images,
      itinerary: form.itinerary,
      pricing: form.pricing,
      availability: form.availability,
      group_size: form.group_size,
      location_details: form.location_details,
      host_expertise: form.host_expertise,
      about_host: form.about_host,
      guest_requirements: form.guest_requirements,
    };

    try {
      const url = isNew ? "/api/experiences" : `/api/experiences/${listingId}`;
      const method = isNew ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        router.push("/partner/listings");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => (prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]));
  };

  const Section = ({ id, title, icon, children, required = false }: { id: string; title: string; icon: React.ReactNode; children: React.ReactNode; required?: boolean }) => {
    const isOpen = expandedSections.includes(id);
    return (
      <div className="rounded-2xl border border-white/[0.08] bg-[#111827] overflow-hidden">
        <button
          onClick={() => toggleSection(id)}
          className="w-full px-5 py-4 flex items-center gap-3 hover:bg-white/[0.02] transition-colors text-left"
        >
          <span className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">{icon}</span>
          <div className="flex-1 min-w-0">
            <h3 className="text-body font-semibold text-white flex items-center gap-2">
              {title}
              {required && <span className="text-caption text-[#FF0F73]">*</span>}
            </h3>
            <p className="text-caption text-[#64748B]">Click to expand</p>
          </div>
          <svg
            className={`w-5 h-5 text-[#64748B] transition-transform ${isOpen ? "rotate-180" : ""}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
        {isOpen && (
          <div className="px-5 pb-5 border-t border-white/[0.06] animate-slide-down">{children}</div>
        )}
      </div>
    );
  };

  const Input = ({ label, type = "text", value, onChange, placeholder, required, error, min, max }: { label: string; type?: string; value: string | number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string; required?: boolean; error?: string | false; min?: string; max?: string }) => (
    <div className="space-y-1.5">
      <label className="block text-body-sm font-medium text-[#CBD5E1]">{label}{required && <span className="text-[#FF0F73] ml-1">*</span>}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        min={min}
        max={max}
        className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${
          error ? "border-red-500 focus:ring-red-500/30 focus:border-red-500"
          : "border-white/[0.08] focus:ring-[#FF0F73]/30 focus:border-[#FF0F73]"
        } text-white placeholder-[#64748B] focus:outline-none transition-all text-body-sm`}
      />
      {error && <p className="text-caption text-red-400">{error}</p>}
    </div>
  );

  const Textarea = ({ label, value, onChange, placeholder, rows = 3, required, error }: { label: string; value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; placeholder?: string; rows?: number; required?: boolean; error?: string | false }) => (
    <div className="space-y-1.5">
      <label className="block text-body-sm font-medium text-[#CBD5E1]">{label}{required && <span className="text-[#FF0F73] ml-1">*</span>}</label>
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${
          error ? "border-red-500 focus:ring-red-500/30 focus:border-red-500"
          : "border-white/[0.08] focus:ring-[#FF0F73]/30 focus:border-[#FF0F73]"
        } text-white placeholder-[#64748B] focus:outline-none transition-all text-body-sm resize-y`}
      />
      {error && <p className="text-caption text-red-400">{error}</p>}
    </div>
  );

  const Select = ({ label, value, onChange, options, required, error }: { label: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: string[]; required?: boolean; error?: string | false }) => (
    <div className="space-y-1.5">
      <label className="block text-body-sm font-medium text-[#CBD5E1]">{label}{required && <span className="text-[#FF0F73] ml-1">*</span>}</label>
      <select
        value={value}
        onChange={onChange}
        className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${
          error ? "border-red-500 focus:ring-red-500/30 focus:border-red-500"
          : "border-white/[0.08] focus:ring-[#FF0F73]/30 focus:border-[#FF0F73]"
        } text-white focus:outline-none transition-all text-body-sm appearance-none cursor-pointer`}
      >
        <option value="" disabled>Select an option</option>
        {options.map((opt: string) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      {error && <p className="text-caption text-red-400">{error}</p>}
    </div>
  );

  const CheckboxGroup = ({ label, options, value, onChange }: { label: string; options: string[]; value: string[]; onChange: (val: string[]) => void }) => (
    <div className="space-y-2">
      <label className="block text-body-sm font-medium text-[#CBD5E1] mb-2">{label}</label>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {options.map((opt: string) => (
          <label key={opt} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.includes(opt)}
              onChange={(e) => onChange(e.target.checked ? [...value, opt] : value.filter((v: string) => v !== opt))}
              className="w-4 h-4 rounded border-white/30 text-[#FF0F73] focus:ring-[#FF0F73] focus:ring-2 bg-white/5"
            />
            <span className="text-body-sm text-white">{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-2 border-[#FF0F73]/30 border-t-[#FF0F73] animate-spin" />
      </div>
    );
  }

  if (!isPartner) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <a href="/partner/listings" className="p-2 rounded-xl hover:bg-white/[0.04] transition-colors md:hidden">
            <svg className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </a>
          <div>
            <h1 className="text-display-sm font-bold text-white mb-1">{isNew ? "New Experience" : "Edit Experience"}</h1>
            <p className="text-[#64748B] text-body-lg">
              {isNew
                ? "Create your experience step by step. All changes are saved when you click Save."
                : `Currently: <span className="px-2 py-0.5 text-caption font-medium bg-emerald-500/20 text-emerald-400 border-emerald-500/30 rounded-full">${form.status}</span>`}
            </p>
          </div>
        </div>
        {!isNew && (
          <a
            href={`/experiences/${listingId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl border border-white/[0.08] text-white/80 font-medium text-body-sm hover:bg-white/5 transition-colors self-start"
          >
            View on Site
          </a>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400 text-body-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-red-400 hover:text-red-300">×</button>
        </div>
      )}

      {/* Sections */}
      <div className="space-y-6">
        {/* A. PHOTOS */}
        <Section id="photos" title="Photos" required icon={<svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm12 8H4V6h12v6z" /><path d="M8 10a2 2 0 114 0 2 2 0 01-4 0z" /><path d="M14 6a1 1 0 011 1v1h1a1 1 0 010 2h-1v1a1 1 0 11-2 0v-1H8a1 1 0 010-2h1V7a1 1 0 011-1z" /></svg>}>
          <div className="space-y-4">
            <p className="text-body-sm text-[#64748B]">
              Add at least 7 photos. First photo is the cover. Drag to reorder (click and drag not implemented - use remove/add).
              <span className={`ml-2 font-medium ${(form.images?.length ?? 0) >= 7 ? "text-emerald-400" : "text-amber-400"}`}>
                {form.images?.length ?? 0}/7 minimum
              </span>
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {(form.images ?? []).map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group">
                  <img src={img} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                  {idx === 0 && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 text-caption font-medium bg-black/70 text-white rounded">Cover</span>
                  )}
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeImage(idx); }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500/90 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M6 4a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zM4 6v12a2 2 0 002 2h10a2 2 0 002-2V6H4z" /></svg>
                  </button>
                </div>
              ))}
              <label className="col-span-1 aspect-square rounded-xl border-2 border-dashed border-white/[0.15] hover:border-[#FF0F73]/50 hover:bg-white/[0.02] transition-all flex flex-col items-center justify-center cursor-pointer group">
                <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                <svg className="w-10 h-10 text-white/30 group-hover:text-[#FF0F73] transition-colors" viewBox="0 0 20 20" fill="currentColor"><path d="M10.293 5.707a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L12.586 6H5a1 1 0 110-2h7.586l-3.293-3.293a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414z" /><path d="M4 12a2 2 0 00-2 2v4a2 2 0 002 2h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.586l1.293-1.293a1 1 0 10-1.414-1.414l-4 4a1 1 0 000 1.414l4 4a1 1 0 001.414-1.414L13.414 14H18a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4a2 2 0 012-2h2.586z" /></svg>
                <span className="mt-2 text-caption text-white/60">Add Photos</span>
              </label>
            </div>
          </div>
        </Section>

        {/* B. TITLE & DESCRIPTION */}
        <Section id="basic" title="Title & Description" required icon={<svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zm-4 0H9v2h2V9z" clipRule="evenodd" /></svg>}>
          <div className="space-y-4">
            <Input label="Experience Title" value={form.title} onChange={(e) => updateField("title", e.target.value)} placeholder="e.g. Sunset Wine Tasting at Cape Maclear" required error={!form.title && "Title is required"} />
            <Input label="Subtitle (optional)" value={form.subtitle ?? ""} onChange={(e) => updateField("subtitle", e.target.value)} placeholder="e.g. Sun, Swim & Sip by the lake" />
            <Textarea label="Description" value={form.description} onChange={(e) => updateField("description", e.target.value)} placeholder="Describe what guests will experience, what makes it unique, and what they should expect." rows={4} required error={!form.description && "Description is required"} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select label="Category" value={form.category} onChange={(e) => updateField("category", e.target.value)} options={CATEGORIES} required error={!form.category && "Category required"} />
              <Input label="Duration" value={form.duration} onChange={(e) => updateField("duration", e.target.value)} placeholder="e.g. 2 hours, Full day" required error={!form.duration && "Duration required"} />
            </div>
          </div>
        </Section>

        {/* C. ITINERARY */}
        <Section id="itinerary" title="Itinerary" icon={<svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>}>
          <div className="space-y-4">
            <p className="text-body-sm text-[#64748B]">Add activities in order. Each activity can have a time, title, description, and optional photo.</p>
            {(form.itinerary ?? []).length === 0 ? (
              <button onClick={addItineraryItem} className="w-full px-4 py-4 rounded-xl border-2 border-dashed border-white/[0.15] hover:border-[#FF0F73]/50 hover:bg-white/[0.02] transition-all text-center text-body-sm text-[#64748B] hover:text-white">
                + Add First Activity
              </button>
            ) : (
              <div className="space-y-4">
                {(form.itinerary ?? []).map((item, idx) => (
                  <div key={item.id} className="rounded-xl border border-white/[0.08] bg-white/5 p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="w-8 h-8 rounded-full bg-[#FF0F73]/20 text-[#FF0F73] flex items-center justify-center font-bold text-body-sm flex-shrink-0">{idx + 1}</span>
                        <div className="flex-1 min-w-0">
                          <Input label="Time" type="time" value={item.time} onChange={(e) => updateItineraryItem(item.id, "time", e.target.value)} placeholder="10:00" />
                        </div>
                      </div>
                      <button onClick={() => removeItineraryItem(item.id)} className="p-2 rounded-lg hover:bg-white/5 transition-colors text-[#64748B] hover:text-red-400">
                        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path d="M6 4a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zM4 6v12a2 2 0 002 2h10a2 2 0 002-2V6H4z" /></svg>
                      </button>
                    </div>
                    <Input label="Activity Title" value={item.title} onChange={(e) => updateItineraryItem(item.id, "title", e.target.value)} placeholder="e.g. Welcome & Introduction" />
                    <Textarea label="Description" value={item.description} onChange={(e) => updateItineraryItem(item.id, "description", e.target.value)} placeholder="What happens during this activity?" rows={2} />
                  </div>
                ))}
                <button onClick={addItineraryItem} className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-white/[0.15] hover:border-[#FF0F73]/50 hover:bg-white/[0.02] transition-all text-center text-body-sm text-[#64748B] hover:text-white">
                  + Add Another Activity
                </button>
              </div>
            )}
          </div>
        </Section>

        {/* D. PRICING */}
        <Section id="pricing" title="Pricing (Solo & Groups, Public & Private)" icon={<svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zm0 4v8a2 2 0 002 2h12a2 2 0 002-2V8H4zm2-2h12v2H6V6zm0 4h12v2H6v-2z" /></svg>}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Solo Price (MK per person)" type="number" value={form.pricing?.solo_price ?? 0} onChange={(e) => updateNested("pricing", "solo_price", Number(e.target.value))} placeholder="50000" />
              <Input label="Group Price (MK per group)" type="number" value={form.pricing?.group_price ?? 0} onChange={(e) => updateNested("pricing", "group_price", Number(e.target.value))} placeholder="200000" />
            </div>
            <div className="space-y-3">
              <label className="block text-body-sm font-medium text-[#CBD5E1]">Experience Type</label>
              <div className="grid grid-cols-2 gap-4">
                <label className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${form.pricing?.is_private ? "border-[#FF0F73] bg-[#FF0F73]/10" : "border-white/[0.08] hover:border-white/20"}`}>
                  <input type="radio" name="experience_type" checked={form.pricing?.is_private} onChange={() => updateNested("pricing", "is_private", true)} className="sr-only" />
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-[#FF0F73]" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    <div>
                      <p className="text-body font-semibold text-white">Private</p>
                      <p className="text-caption text-[#64748B]">Exclusive bookings for private groups</p>
                    </div>
                  </div>
                </label>
                <label className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${!form.pricing?.is_private ? "border-[#FF0F73] bg-[#FF0F73]/10" : "border-white/[0.08] hover:border-white/20"}`}>
                  <input type="radio" name="experience_type" checked={!form.pricing?.is_private} onChange={() => updateNested("pricing", "is_private", false)} className="sr-only" />
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-[#FF0F73]" viewBox="0 0 20 20" fill="currentColor"><path d="M13 6a1 1 0 011 1v2.586l3.293 3.293a1 1 0 01-1.414 1.414L13 10.414V13a1 1 0 11-2 0v-.586L7.707 13.707a1 1 0 01-1.414-1.414L9 9.586V7a1 1 0 112 0v2.586l3.293-3.293a1 1 0 011.414 1.414L11 9.414V7a1 1 0 011-1z" /></svg>
                    <div>
                      <p className="text-body font-semibold text-white">Public</p>
                      <p className="text-caption text-[#64748B]">Open to individual bookings</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label={form.pricing?.is_private ? "Max Group Size (Private)" : "Max Group Size (Public)"} type="number" min="1" value={form.pricing?.is_private ? form.pricing?.private_max ?? 4 : form.pricing?.public_max ?? 10} onChange={(e) => updateNested("pricing", form.pricing?.is_private ? "private_max" : "public_max", Number(e.target.value))} />
              <Input label="Min Guests Required" type="number" min="1" value={form.group_size?.min_guests ?? 1} onChange={(e) => updateNested("group_size", "min_guests", Number(e.target.value))} />
            </div>
          </div>
        </Section>

        {/* E. AVAILABILITY */}
        <Section id="availability" title="Availability & Cutoff" icon={<svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" /></svg>}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select label="Booking Cutoff Time" value={form.availability?.cutoff_time ?? "24 hours before"} onChange={(e) => updateNested("availability", "cutoff_time", e.target.value)} options={CUTOFF_OPTIONS} />
              <Select label="New Guest Cutoff" value={form.availability?.new_guest_cutoff ?? "Anytime"} onChange={(e) => updateNested("availability", "new_guest_cutoff", e.target.value)} options={GUEST_CUTOFF_OPTIONS} />
            </div>
            <div>
              <label className="block text-body-sm font-medium text-[#CBD5E1] mb-2">Available Days</label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <label key={day} className={`px-3 py-1.5 rounded-full text-caption font-medium cursor-pointer transition-all ${(form.availability?.available_days ?? []).includes(day) ? "bg-[#FF0F73] text-white" : "bg-white/5 text-[#64748B] hover:bg-white/10 hover:text-white border border-white/[0.08]"}`}>
                    <input type="checkbox" checked={(form.availability?.available_days ?? []).includes(day)} onChange={(e) => updateNested("availability", "available_days", e.target.checked ? [...(form.availability?.available_days ?? []), day] : (form.availability?.available_days ?? []).filter((d) => d !== day))} className="sr-only" />
                    {day.slice(0, 3)}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Available From" type="time" value={form.availability?.time_from ?? "09:00"} onChange={(e) => updateNested("availability", "time_from", e.target.value)} />
              <Input label="Available To" type="time" value={form.availability?.time_to ?? "18:00"} onChange={(e) => updateNested("availability", "time_to", e.target.value)} />
            </div>
          </div>
        </Section>

        {/* F. GROUP SIZE */}
        <Section id="group-size" title="Group Size (Public & Private)" icon={<svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="Public Max Guests" type="number" min="1" max="100" value={form.group_size?.public_max ?? 10} onChange={(e) => updateNested("group_size", "public_max", Number(e.target.value))} />
              <Input label="Private Max Guests" type="number" min="1" max="20" value={form.group_size?.private_max ?? 4} onChange={(e) => updateNested("group_size", "private_max", Number(e.target.value))} />
              <Input label="Min Guests Required" type="number" min="1" value={form.group_size?.min_guests ?? 1} onChange={(e) => updateNested("group_size", "min_guests", Number(e.target.value))} />
            </div>
          </div>
        </Section>

        {/* G. LOCATION */}
        <Section id="location" title="Location" required icon={<svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>}>
          <div className="space-y-4">
            <Select label="City" value={form.location_details?.city ?? form.location} onChange={(e) => { updateNested("location_details", "city", e.target.value); updateField("location", e.target.value); }} options={CITIES} required />
            <Input label="Meeting Point Address" value={form.location_details?.meeting_point ?? ""} onChange={(e) => updateNested("location_details", "meeting_point", e.target.value)} placeholder="Exact address or landmark" />
            <Textarea label="What to Bring" value={form.location_details?.what_to_bring ?? ""} onChange={(e) => updateNested("location_details", "what_to_bring", e.target.value)} placeholder="e.g. Comfortable shoes, water bottle, sunscreen" rows={2} />
            <Textarea label="Location Notes" value={form.location_details?.notes ?? ""} onChange={(e) => updateNested("location_details", "notes", e.target.value)} placeholder="Any additional info about the location" rows={2} />
          </div>
        </Section>

        {/* H. HOST EXPERTISE */}
        <Section id="host-expertise" title="Host Expertise" icon={<svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13 6a1 1 0 011 1v2.586l3.293 3.293a1 1 0 01-1.414 1.414L13 10.414V13a1 1 0 11-2 0v-.586L7.707 13.707a1 1 0 01-1.414-1.414L9 9.586V7a1 1 0 112 0v2.586l3.293-3.293a1 1 0 011.414 1.414L11 9.414V7a1 1 0 011-1z" /></svg>}>
          <div className="space-y-4">
            <Textarea label="Introduction" value={form.host_expertise?.introduction ?? ""} onChange={(e) => updateNested("host_expertise", "introduction", e.target.value)} placeholder="Tell guests about yourself as a host — your background, passion, and what makes your experiences special" rows={3} />
            <Textarea label="Qualifications & Certifications" value={form.host_expertise?.qualifications ?? ""} onChange={(e) => updateNested("host_expertise", "qualifications", e.target.value)} placeholder="List any relevant certifications, training, or qualifications" rows={3} />
            <Input label="Languages You Speak" value={form.host_expertise?.languages ?? ""} onChange={(e) => updateNested("host_expertise", "languages", e.target.value)} placeholder="English, Chichewa, Spanish (comma-separated)" />
            <Select label="Response Time Goal" value={form.host_expertise?.response_time ?? "Within a few hours"} onChange={(e) => updateNested("host_expertise", "response_time", e.target.value)} options={RESPONSE_TIMES} />
          </div>
        </Section>

        {/* I. ABOUT HOST */}
        <Section id="about-host" title="About Host" icon={<svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Host Name" value={form.about_host?.name ?? ""} onChange={(e) => updateNested("about_host", "name", e.target.value)} placeholder="Your display name" />
              <Input label="Year Started Hosting" type="number" min="2000" max={String(new Date().getFullYear())} value={form.about_host?.year_started ?? new Date().getFullYear()} onChange={(e) => updateNested("about_host", "year_started", Number(e.target.value))} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Contact Email" type="email" value={form.about_host?.email ?? ""} onChange={(e) => updateNested("about_host", "email", e.target.value)} placeholder="you@example.com" />
              <Input label="Contact Phone" type="tel" value={form.about_host?.phone ?? ""} onChange={(e) => updateNested("about_host", "phone", e.target.value)} placeholder="+265 XX XXXXXXX" />
            </div>
            <div>
              <label className="block text-body-sm font-medium text-[#CBD5E1] mb-2">Host Photo</label>
              <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) updateNested("about_host", "photo", URL.createObjectURL(file)); }} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white focus:outline-none focus:ring-2 focus:ring-[#FF0F73]/30 focus:border-[#FF0F73] text-body-sm" />
            </div>
          </div>
        </Section>

        {/* J. GUEST REQUIREMENTS */}
        <Section id="guest-requirements" title="Guest Requirements" icon={<svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="Minimum Age" type="number" min="0" max="100" value={form.guest_requirements?.min_age ?? 18} onChange={(e) => updateNested("guest_requirements", "min_age", Number(e.target.value))} />
              <Select label="Activity Level" value={form.guest_requirements?.activity_level ?? "All levels"} onChange={(e) => updateNested("guest_requirements", "activity_level", e.target.value)} options={ACTIVITY_LEVELS} />
              <Select label="Skill Level Required" value={form.guest_requirements?.skill_level ?? "None"} onChange={(e) => updateNested("guest_requirements", "skill_level", e.target.value)} options={SKILL_LEVELS} />
            </div>
            <CheckboxGroup label="Accessibility Features" options={ACCESSIBILITY_OPTIONS} value={form.guest_requirements?.accessibility ?? []} onChange={(val) => updateNested("guest_requirements", "accessibility", val)} />
            <Input label="Languages Offered" value={form.guest_requirements?.languages ?? ""} onChange={(e) => updateNested("guest_requirements", "languages", e.target.value)} placeholder="English, Chichewa, French (comma-separated)" />
            <Select label="Cancellation Policy" value={form.guest_requirements?.cancellation_policy ?? "Flexible (full refund 24h before)"} onChange={(e) => updateNested("guest_requirements", "cancellation_policy", e.target.value)} options={CANCELLATION_POLICIES} />
            <Input label="Custom Link (waiver, website, etc.)" value={form.guest_requirements?.custom_link ?? ""} onChange={(e) => updateNested("guest_requirements", "custom_link", e.target.value)} placeholder="https://example.com/waiver" />
          </div>
        </Section>
      </div>

      {/* Sticky Save Bar */}
      <div className="sticky bottom-0 z-50 bg-gradient-to-t from-[#05070B] to-transparent pt-6 pb-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-end gap-4">
          <a href="/partner/listings" className="px-6 py-3 rounded-xl border border-white/[0.08] text-white font-medium hover:bg-white/5 transition-all text-center">
            Cancel
          </a>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#FF0F73] to-[#FF7A1A] text-white font-semibold hover:shadow-[0_4px_24px_rgba(255,15,115,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-center"
          >
            {saving ? (
              <>
                <svg className="w-5 h-5 animate-spin inline-block mr-2" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                Saving...
              </>
            ) : (
              "Save Experience"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}