"use client";

import { useState, useEffect, useCallback } from "react";

interface Notification {
  id: string;
  title: string;
  body?: string;
  is_read: boolean;
  created_at: string;
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

export default function NotificationsSection() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("experio-auth-token");
    if (!token) {
      setLoading(false);
      setError("Sign in to view notifications");
      return;
    }

    fetch("/api/notifications?limit=20", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        const list: Notification[] = (data.notifications || []).map((n: Notification) => ({
          id: n.id,
          title: n.title,
          body: n.body || n.title,
          is_read: n.is_read,
          created_at: n.created_at,
        }));
        setNotifications(Array.isArray(list) ? list : []);
      })
      .catch(() => setError("Could not load notifications"))
      .finally(() => setLoading(false));
  }, []);

  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    bookings: true,
    cancellations: true,
    reviews: true,
    payouts: true,
    reports: true,
  });

  const markAllRead = useCallback(async () => {
    const token = localStorage.getItem("experio-auth-token");
    if (!token) return;
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ markAll: true }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        showToast("All marked as read");
      }
    } catch { /* silent */ }
  }, [showToast]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-body-sm text-[#6a6a6a]">
          {loading ? "Loading..." : error ? error : `${unreadCount} unread`}
        </p>
        {!loading && !error && notifications.length > 0 && (
          <button
            onClick={markAllRead}
            className="px-4 py-1.5 rounded-lg bg-white text-[#6a6a6a] text-caption font-medium hover:bg-[#f7f7f7] transition-colors border border-[#dddddd]"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="space-y-2 mb-8">
        {loading ? (
          <div className="flex items-center gap-2 p-4">
            <div className="w-4 h-4 rounded-full border-2 border-[#FF0F73]/30 border-t-[#FF0F73] animate-spin" />
            <span className="text-caption text-[#929292]">Loading notifications...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-caption text-[#929292]">{error}</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-caption text-[#929292]">No notifications yet</div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-xl border transition-all shadow-sm ${
                !n.is_read ? "bg-white border-[#FF0F73]/20" : "bg-white border-[#ebebeb]"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!n.is_read ? "bg-[#FF0F73]" : "bg-transparent"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-body-sm font-medium text-[#222222]">{n.title}</h3>
                    <span className="text-caption text-[#929292] flex-shrink-0">{timeAgo(n.created_at)}</span>
                  </div>
                  <p className="text-caption text-[#6a6a6a] mt-0.5">{n.body}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-5 rounded-xl bg-white border border-[#ebebeb] shadow-sm">
        <h3 className="text-body-sm font-semibold text-[#222222] mb-4">Notification Preferences</h3>
        <div className="space-y-3">
          {[
            { key: "bookings", label: "New Bookings", desc: "When a customer books an experience" },
            { key: "cancellations", label: "Cancellations", desc: "When a booking is cancelled" },
            { key: "reviews", label: "Reviews", desc: "When a new review is posted" },
            { key: "payouts", label: "Payouts", desc: "When a payout is processed" },
            { key: "reports", label: "Weekly Reports", desc: "Weekly performance summary" },
          ].map((pref) => (
            <label key={pref.key} className="flex items-center justify-between py-2 border-b border-[#ebebeb] last:border-b-0 cursor-pointer">
              <div>
                <p className="text-body-sm text-[#222222]">{pref.label}</p>
                <p className="text-caption text-[#929292]">{pref.desc}</p>
              </div>
              <button
                type="button"
                onClick={() => setPrefs((prev) => ({ ...prev, [pref.key]: !prev[pref.key] }))}
                className={`relative w-10 h-6 rounded-full transition-all shrink-0 ${
                  prefs[pref.key] ? "bg-[#FF0F73]" : "bg-[#ebebeb]"
                }`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                    prefs[pref.key] ? "right-0.5" : "left-0.5"
                  }`}
                />
              </button>
            </label>
          ))}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-white/90 backdrop-blur-sm border border-[#ebebeb] shadow-xl text-sm text-[#222222] font-medium">
          {toast}
        </div>
      )}
    </div>
  );
}
