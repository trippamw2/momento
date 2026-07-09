"use client";

export default function ExperienceForm({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 sm:pt-20 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg mx-4 rounded-2xl bg-white border border-[#ebebeb] p-6 max-h-[80vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-heading-md font-bold text-[#222222]">Add Experience</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#f7f7f7] text-[#6a6a6a]">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="space-y-4">
          {[
            { label: "Title", placeholder: "e.g. Pool & Lunch" },
            { label: "Subtitle", placeholder: "e.g. Sun, Swim & Sip" },
            { label: "Description", placeholder: "Describe the experience...", type: "textarea" },
            { label: "Price (MWK)", placeholder: "e.g. 45000", type: "number" },
            { label: "Duration", placeholder: "e.g. 4 hours" },
            { label: "Capacity", placeholder: "e.g. 10", type: "number" },
            { label: "Location", placeholder: "e.g. Lilongwe" },
          ].map((field) => (
            <div key={field.label}>
              <label className="block text-body-sm font-medium text-[#222222] mb-1.5">{field.label}</label>
              {field.type === "textarea" ? (
                <textarea rows={3} placeholder={field.placeholder} className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#dddddd] text-[#222222] text-body-sm placeholder:text-[#929292] focus:outline-none focus:border-[#FF0F73] focus:ring-1 focus:ring-[#FF0F73]/40 transition-all resize-none" />
              ) : (
                <input type={field.type || "text"} placeholder={field.placeholder} className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#dddddd] text-[#222222] text-body-sm placeholder:text-[#929292] focus:outline-none focus:border-[#FF0F73] focus:ring-1 focus:ring-[#FF0F73]/40 transition-all" />
              )}
            </div>
          ))}
          <div>
            <label className="block text-body-sm font-medium text-[#222222] mb-1.5">Category</label>
            <select className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#dddddd] text-[#222222] text-body-sm focus:outline-none focus:border-[#FF0F73] appearance-none cursor-pointer">
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
        </div>
        <div className="flex gap-3 mt-6">
          <button className="flex-1 py-2.5 rounded-xl bg-[#FF0F73] text-white font-semibold text-body-sm hover:shadow-[0_4px_24px_rgba(255, 15, 115, 0.25)] transition-all">
            Save Experience
          </button>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white text-[#6a6a6a] text-body-sm font-medium border border-[#dddddd] hover:bg-[#f7f7f7] transition-all">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
