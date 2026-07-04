"use client";

export default function NotificationsSection() {
  const mockNotifications = [
    { id: "N1", title: "New booking received", desc: "Chimwemwe Banda booked Sunset Cruise", time: "12m ago", read: false },
    { id: "N2", title: "Review alert", desc: "New 5-star review on Spa Day", time: "2h ago", read: false },
    { id: "N3", title: "Payout processed", desc: "MK 845,000 sent to your account", time: "1d ago", read: false },
    { id: "N4", title: "Experience suggestion", desc: "Pool & Lunch is trending — consider adding slots", time: "2d ago", read: true },
    { id: "N5", title: "Weekly report ready", desc: "Your performance summary for Jun 14-20", time: "3d ago", read: true },
    { id: "N6", title: "Cancellation notice", desc: "Rooftop Dining booking cancelled by guest", time: "4d ago", read: true },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-body-sm text-[#6a6a6a]">{mockNotifications.filter((n) => !n.read).length} unread</p>
        <button className="px-4 py-1.5 rounded-lg bg-white text-[#6a6a6a] text-caption font-medium hover:bg-[#f7f7f7] transition-colors border border-[#dddddd]">
          Mark all as read
        </button>
      </div>

      <div className="space-y-2 mb-8">
        {mockNotifications.map((n) => (
          <div
            key={n.id}
            className={`p-4 rounded-xl border transition-all shadow-sm ${
              !n.read
                ? "bg-white border-[#FF0F73]/20"
                : "bg-white border-[#ebebeb]"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!n.read ? "bg-[#FF0F73]" : "bg-transparent"}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-body-sm font-medium text-[#222222]">{n.title}</h3>
                  <span className="text-caption text-[#929292] flex-shrink-0">{n.time}</span>
                </div>
                <p className="text-caption text-[#6a6a6a] mt-0.5">{n.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-5 rounded-xl bg-white border border-[#ebebeb] shadow-sm">
        <h3 className="text-body-sm font-semibold text-[#222222] mb-4">Notification Preferences</h3>
        <div className="space-y-3">
          {[
            { label: "New Bookings", desc: "When a customer books an experience" },
            { label: "Cancellations", desc: "When a booking is cancelled" },
            { label: "Reviews", desc: "When a new review is posted" },
            { label: "Payouts", desc: "When a payout is processed" },
            { label: "Weekly Reports", desc: "Weekly performance summary" },
          ].map((pref) => (
            <label key={pref.label} className="flex items-center justify-between py-2 border-b border-[#ebebeb] last:border-b-0">
              <div>
                <p className="text-body-sm text-[#222222]">{pref.label}</p>
                <p className="text-caption text-[#929292]">{pref.desc}</p>
              </div>
              <div className="relative w-10 h-6 rounded-full bg-[#FF0F73] cursor-pointer transition-colors">
                <div className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-white shadow-sm" />
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
