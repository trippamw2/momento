"use client";

import { useState, useCallback } from "react";

export default function ExperienceForm({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [capacity, setCapacity] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("Romantic");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!title.trim() || !price.trim() || !duration.trim() || !location.trim()) {
      setError("Title, Price, Duration, and Location are required");
      return;
    }

    setSaving(true);
    setError("");
    const token = localStorage.getItem("experio-auth-token");

    try {
      const res = await fetch("/api/experiences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: title.trim(),
          subtitle: subtitle.trim() || null,
          description: description.trim() || null,
          price: parseInt(price, 10),
          currency: "MWK",
          duration: duration.trim(),
          capacity: capacity ? parseInt(capacity, 10) : null,
          location: location.trim(),
          category,
          status: "draft",
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(onClose, 1500);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create experience");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [title, subtitle, description, price, duration, capacity, location, category, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 sm:pt-20 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg mx-4 rounded-2xl bg-white border border-[#ebebeb] p-6 max-h-[80vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-heading-md font-bold text-[#222222]">Add Experience</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#f7f7f7] text-[#6a6a6a]">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {success ? (
          <div className="py-8 text-center">
            <svg className="w-12 h-12 text-emerald-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-body-sm font-medium text-[#222222]">Experience created!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {[
              { label: "Title", placeholder: "e.g. Pool & Lunch", value: title, set: setTitle },
              { label: "Subtitle", placeholder: "e.g. Sun, Swim & Sip", value: subtitle, set: setSubtitle },
              { label: "Description", placeholder: "Describe the experience...", value: description, set: setDescription, type: "textarea" },
              { label: "Price (MWK)", placeholder: "e.g. 45000", value: price, set: setPrice, type: "number" },
              { label: "Duration", placeholder: "e.g. 4 hours", value: duration, set: setDuration },
              { label: "Capacity", placeholder: "e.g. 10", value: capacity, set: setCapacity, type: "number" },
              { label: "Location", placeholder: "e.g. Lilongwe", value: location, set: setLocation },
            ].map((field) => (
              <div key={field.label}>
                <label className="block text-body-sm font-medium text-[#222222] mb-1.5">{field.label}</label>
                {field.type === "textarea" ? (
                  <textarea
                    rows={3}
                    value={field.value}
                    onChange={(e) => field.set(e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#dddddd] text-[#222222] text-body-sm placeholder:text-[#929292] focus:outline-none focus:border-[#FF0F73] focus:ring-1 focus:ring-[#FF0F73]/40 transition-all resize-none"
                  />
                ) : (
                  <input
                    type={field.type || "text"}
                    value={field.value}
                    onChange={(e) => field.set(e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#dddddd] text-[#222222] text-body-sm placeholder:text-[#929292] focus:outline-none focus:border-[#FF0F73] focus:ring-1 focus:ring-[#FF0F73]/40 transition-all"
                  />
                )}
              </div>
            ))}
            <div>
              <label className="block text-body-sm font-medium text-[#222222] mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#dddddd] text-[#222222] text-body-sm focus:outline-none focus:border-[#FF0F73] appearance-none cursor-pointer"
              >
                <option>Romantic</option>
                <option>Wellness</option>
                <option>Food & Drink</option>
                <option>Luxury</option>
                <option>Adventure</option>
                <option>Entertainment</option>
                <option>Family</option>
              </select>
            </div>
            <div>
              <label className="block text-body-sm font-medium text-[#222222] mb-1.5">Moods</label>
              <div className="flex flex-wrap gap-1.5">
                {["Romantic", "Relax", "Celebrate", "Escape", "Indulge"].map((m) => (
                  <label key={m} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f7f7f7] border border-[#ebebeb] cursor-pointer hover:bg-[#f0f0f0] transition-colors">
                    <input type="checkbox" className="accent-[#FF0F73]" />
                    <span className="text-caption text-[#6a6a6a]">{m}</span>
                  </label>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 text-red-600 text-caption border border-red-200">
                {error}
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-[#FF0F73] text-white font-semibold text-body-sm hover:shadow-[0_4px_24px_rgba(255, 15, 115, 0.25)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving && (
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                )}
                {saving ? "Saving..." : "Save Experience"}
              </button>
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white text-[#6a6a6a] text-body-sm font-medium border border-[#dddddd] hover:bg-[#f7f7f7] transition-all">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}