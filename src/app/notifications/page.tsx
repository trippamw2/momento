"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { getNotifications, markAsRead, markAllAsRead, type AppNotification } from "@/lib/notifications-engine";

const NOTIF_ICONS: Record<string, string> = {
  booking_confirmed: "✅",
  booking_cancelled: "❌",
  booking_reminder: "⏰",
  points_earned: "⭐",
  tier_upgrade: "🏆",
  gift_received: "🎁",
  gift_redeemed: "🎉",
  review_request: "✍️",
  new_experience: "✨",
  flash_sale: "🔥",
  achievement_unlocked: "🏅",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<AppNotification[]>(() => getNotifications());

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const handleMarkRead = (id: string) => {
    markAsRead(id);
    setNotifications(getNotifications());
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
    setNotifications(getNotifications());
  };

  return (
    <main className="pt-24 pb-16 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-heading-xl font-bold text-white">Notifications</h1>
            <p className="text-[#94A3B8] text-body-sm mt-1">
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-body-sm text-[#FF0F73] hover:text-[#FF0F73]/80 font-semibold transition-colors"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* List */}
        {notifications.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">🔔</div>
            <h2 className="text-heading-md font-bold text-white mb-2">No notifications yet</h2>
            <p className="text-[#94A3B8] text-body-sm">
              You&apos;ll see updates about your bookings, rewards, and more here.
            </p>
            <Link
              href="/experiences"
              className="inline-block mt-6 px-6 py-3 rounded-xl bg-[#FF0F73] text-white font-semibold text-body-sm hover:shadow-[0_4px_16px_rgba(255, 15, 115, 0.3)] transition-all"
            >
              Explore Experiences
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`rounded-2xl border p-4 transition-all ${
                  n.read
                    ? "bg-[#0A0E17] border-white/[0.06]"
                    : "bg-[#111827] border-[#FF0F73]/20 shadow-[0_0_0_1px_rgba(255, 15, 115, 0.1)]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg mt-0.5">{NOTIF_ICONS[n.type] || "🔔"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={`text-body-sm font-semibold ${n.read ? "text-[#CBD5E1]" : "text-white"}`}>
                        {n.title}
                      </h3>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-caption text-[#64748B]">{n.time}</span>
                        {!n.read && (
                          <button
                            onClick={() => handleMarkRead(n.id)}
                            className="w-6 h-6 rounded-full bg-[#FF0F73]/10 hover:bg-[#FF0F73]/20 flex items-center justify-center transition-colors"
                            title="Mark as read"
                          >
                            <svg className="w-3 h-3 text-[#FF0F73]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-caption text-[#94A3B8] mt-1 line-clamp-2">{n.description}</p>
                    {n.actionLabel && n.actionHref && (
                      <Link
                        href={n.actionHref}
                        onClick={() => handleMarkRead(n.id)}
                        className="inline-block mt-2 text-caption font-semibold text-[#FF0F73] hover:text-[#FF0F73]/80 transition-colors"
                      >
                        {n.actionLabel} →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
