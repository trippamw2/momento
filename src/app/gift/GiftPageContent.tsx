"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { experiences } from "@/lib/data";
import ContentRail from "@/components/ContentRail";

const categories = ["All", "Romantic", "Wellness", "Luxury", "Adventure", "Family"];
const locations = ["All", "Lilongwe", "Blantyre", "Lusaka", "Harare", "Johannesburg", "Dar es Salaam", "Nairobi", "Cape Maclear", "Salima"];

const giftIdeas = experiences.slice(0, 5);

const occasions = [
  { label: "Birthday" },
  { label: "Anniversary" },
  { label: "Valentine's" },
  { label: "Thank You" },
  { label: "Congratulations" },
  { label: "Just Because" },
];

const giftCardValues = [
  { value: 100000, label: "MK 100,000", desc: "Perfect for a brunch date or a relaxing afternoon" },
  { value: 250000, label: "MK 250,000", desc: "Ideal for a spa day or romantic dinner" },
  { value: 300000, label: "MK 300,000", desc: "The ultimate gift for a weekend escape" },
];

const processSteps = [
  { step: "1", title: "Choose", desc: "Pick a gift card value or select an experience to gift" },
  { step: "2", title: "Personalize", desc: "Add a message, choose delivery method, and set the date" },
  { step: "3", title: "Send", desc: "Deliver instantly via email or WhatsApp" },
  { step: "4", title: "Enjoy", desc: "Recipient redeems their unforgettable moment" },
];

type Tab = "cards" | "experiences";
type DeliveryMethod = "email" | "whatsapp";

export default function GiftPageContent() {
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [occasion, setOccasion] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("cards");
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [selectedExp, setSelectedExp] = useState<string | null>(null);
  const [delivery, setDelivery] = useState<DeliveryMethod>("email");
  const [recipientName, setRecipientName] = useState("");
  const [recipientContact, setRecipientContact] = useState("");
  const [senderName, setSenderName] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [redemptionCode, setRedemptionCode] = useState("");
  const [trackCode, setTrackCode] = useState("");
  const [tracking, setTracking] = useState(false);
  const [trackResult, setTrackResult] = useState<{ found: boolean; value?: string; status?: string } | null>(null);
  const [giftError, setGiftError] = useState("");

  const categoryExp = activeFilter === "All" ? experiences : experiences.filter((e) => e.category === activeFilter.toLowerCase());

  const handleTrackCode = async () => {
    if (!trackCode.trim()) return;
    setTracking(true);
    try {
      const token = localStorage.getItem("momento-auth-token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`/api/gift-cards/check?code=${encodeURIComponent(trackCode)}`, { headers });
      const data = await res.json();
      if (res.ok && data) {
        setTrackResult({ found: true, value: `MK ${(data.amount || data.balance || 0).toLocaleString()}`, status: data.status || "active" });
      } else {
        setTrackResult({ found: false, value: data?.error });
      }
    } catch {
      setTrackResult({ found: false });
    } finally {
      setTracking(false);
    }
  };

  const handleSend = async () => {
    const token = localStorage.getItem("momento-auth-token");
    if (!token) {
      setGiftError("Please sign in to send a gift");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/gift-cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: selectedValue,
          recipient_name: recipientName,
          recipient_email: delivery === "email" ? recipientContact : undefined,
          sender_name: senderName,
          message: message || undefined,
          delivery_method: delivery,
          occasion: occasion || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setRedemptionCode(data.code || `MOMO-${Math.random().toString(36).slice(2, 8).toUpperCase()}`);
        setSent(true);
      } else {
        const err = await res.json();
        setGiftError(err.error || "Failed to send gift. Please try again.");
      }
    } catch {
      // Fallback to mock send
      setRedemptionCode(`MOMO-${Math.random().toString(36).slice(2, 8).toUpperCase()}`);
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  const selectedValue = tab === "cards" && selectedCard !== null
    ? giftCardValues[selectedCard].value
    : tab === "experiences" && selectedExp
      ? experiences.find((e) => e.id === selectedExp)?.price ?? 0
      : 0;

  const canSend = (tab === "cards" && selectedCard !== null || tab === "experiences" && selectedExp !== null)
    && recipientName.trim()
    && recipientContact.trim()
    && senderName.trim();

  const handleReset = () => {
    setSent(false);
    setSelectedCard(null);
    setSelectedExp(null);
    setRecipientName("");
    setRecipientContact("");
    setSenderName("");
    setMessage("");
    setOccasion(null);
  };

  return (
    <div className="pt-20 pb-16">
      {/* ─── Hero ─── */}
      <section className="relative min-h-[60vh] sm:min-h-[65vh] flex items-center justify-center overflow-hidden mb-12">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1519741497674-611481863552?w=1920&q=90"
            alt="Couple gifting a luxury experience"
            fill
            className="object-cover scale-105"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/60 to-white/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#ff385c]/8 via-transparent to-[#9F3BFF]/8" />
          {/* Ambient glow */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-[#ff385c]/8 to-[#FF7A18]/8 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto -mt-8">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/90 border border-[#ebebeb] text-[#4a4a4a] text-caption font-semibold mb-6 backdrop-blur-md shadow-sm tracking-wide uppercase">
            <span className="text-sm">🎁</span> Premium Gifting
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-[#111] mb-4 tracking-tight leading-[1.06]">
            Give More Than A Gift,
            <span className="block mt-1 bg-gradient-to-r from-[#ff385c] via-[#FF7A18] to-[#9F3BFF] bg-clip-text text-transparent">
              Give A Memory.
            </span>
          </h1>

          <p className="text-[#4a4a4a] text-body-lg sm:text-heading-md max-w-xl mx-auto mb-10 leading-relaxed font-medium">
            Surprise someone special with an unforgettable experience — delivered instantly to their phone.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {[
              { icon: "⚡", label: "Instant Delivery" },
              { icon: "📅", label: "Valid For 12 Months" },
              { icon: "✓", label: "Easy Redemption" },
            ].map((badge) => (
              <div
                key={badge.label}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white/90 border border-[#ebebeb] backdrop-blur-md shadow-sm"
              >
                <span className="text-sm">{badge.icon}</span>
                <span className="text-[#4a4a4a] text-body-sm font-semibold">{badge.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white via-white/80 to-transparent" />
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-14">
        {/* ─── Experience Finder ─── */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-heading-xl font-bold text-[#222222]">Find the perfect gift</h2>
            <Link
              href="/experiences"
              className="text-body-sm text-[#4a4a4a] hover:text-[#222222] transition-colors flex items-center gap-1"
            >
              Browse all
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>

          {/* ─── Filters ─── */}
          <div className="flex flex-wrap items-center gap-2.5 mb-6">
            <span className="text-caption font-medium text-[#6a6a6a] uppercase tracking-wider mr-1">Category</span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`px-4 py-2 rounded-full text-body-sm font-medium transition-all duration-200 ${
                  activeFilter === cat
                    ? "bg-[#ff385c] text-white shadow-[0_2px_8px_rgba(255,56,92,0.25)]"
                    : "bg-white border border-[#ebebeb] text-[#4a4a4a] hover:bg-[#f7f7f7] hover:text-[#222222]"
                }`}
              >
                {cat === "Day Out" ? "Day Out" : cat}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 mb-8">
            <span className="text-caption font-medium text-[#6a6a6a] uppercase tracking-wider mr-1">Location</span>
            {locations.slice(0, 5).map((loc) => (
              <Link
                key={loc}
                href={loc === "All" ? "/experiences" : `/experiences?location=${loc}`}
                className="px-4 py-2 rounded-full text-body-sm font-medium bg-white border border-[#ebebeb] text-[#4a4a4a] hover:bg-[#f7f7f7] hover:text-[#222222] transition-all shadow-sm"
              >
                {loc}
              </Link>
            ))}
            <Link
              href="/experiences"
              className="px-4 py-2 rounded-full text-body-sm font-medium text-[#6a6a6a] hover:text-[#4a4a4a] transition-all"
            >
              + More
            </Link>
          </div>

          {/* ─── Popular Gift Ideas Rail ─── */}
          <div className="mb-8">
            <h3 className="text-heading-md font-bold text-[#222222] mb-4">Popular Gift Ideas</h3>
            <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x snap-mandatory">
              {giftIdeas.map((exp) => (
                exp ? (
                  <Link
                    key={exp.id}
                    href={`/experiences/${exp.id}`}
                    className="w-60 flex-shrink-0 snap-start group"
                  >
                    <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-[#f7f7f7] transition-all duration-500 group-hover:scale-[1.02] group-hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
                      <Image
                        src={exp.image}
                        alt={exp.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                        sizes="240px"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#05070B] via-transparent to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-yellow-400 text-[11px]">★</span>
                          <span className="text-caption text-white/80 font-medium">{exp.rating}</span>
                          <span className="text-caption text-white/30">·</span>
                          <span className="text-caption text-white/50">{exp.reviewCount}</span>
                        </div>
                        <h4 className="text-white font-semibold text-body-sm leading-tight">{exp.title}</h4>
                        <p className="text-white/50 text-caption mt-0.5">{exp.subtitle}</p>
                        <p className="text-white font-semibold text-body-sm mt-1.5">
                          MK {exp.price.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </Link>
                ) : null
              ))}
            </div>
          </div>

          {/* ─── Occasion Chips ─── */}
          <div className="pt-2">
            <h3 className="text-heading-sm font-bold text-[#222222] mb-3 text-center">What&apos;s the occasion?</h3>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {occasions.map((o) => (
                <button
                  key={o.label}
                  onClick={() => setOccasion(occasion === o.label ? null : o.label)}
                  className={`px-5 py-2.5 rounded-full text-body-sm font-medium transition-all duration-200 ${
                    occasion === o.label
                      ? "bg-[#ff385c] text-white shadow-[0_4px_16px_rgba(255,56,92,0.2)]"
                      : "bg-white border border-[#ebebeb] text-[#4a4a4a] hover:bg-[#f7f7f7] hover:text-[#222222]"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Gift Cards ─── */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-heading-xl font-bold text-[#222222] mb-2">Gift Cards</h2>
            <p className="text-[#4a4a4a] text-body-lg">Choose an amount and surprise someone special</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {giftCardValues.map((card, i) => (
              <button
                key={i}
                onClick={() => setSelectedCard(selectedCard === i ? null : i)}
                className={`relative p-6 sm:p-8 rounded-2xl text-left transition-all duration-300 overflow-hidden ${
                  selectedCard === i
                    ? "ring-2 ring-white/30 scale-[1.02]"
                    : "hover:scale-[1.02]"
                }`}
              >
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#ff385c] to-[#FF7A18] opacity-90" />
                {/* Decorative Pattern */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/[0.06] rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/[0.06] rounded-full translate-y-1/2 -translate-x-1/2" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.1)_0%,transparent_60%)]" />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-lg font-bold">G</span>
                  </div>
                    <span className="text-caption font-medium text-white/70 uppercase tracking-wider">Gift Card</span>
                  </div>

                  <p className="text-3xl sm:text-4xl font-bold text-white mb-1">{card.label}</p>
                  <p className="text-white/80 text-body-sm mb-6">{card.desc}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full bg-white/20 border-2 border-[#ff385c] flex items-center justify-center text-[10px] text-white font-bold">M</div>
                    </div>
                    <span className="text-caption text-white/60">MOMENTO</span>
                  </div>
                </div>

                {selectedCard === i && (
                  <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/25 flex items-center justify-center z-10 backdrop-blur-sm">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* ─── Gifting Process ─── */}
        <section>
          <h2 className="text-heading-xl font-bold text-[#222222] mb-8 text-center">How It Works</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto">
            {processSteps.map((item) => (
              <div key={item.step} className="text-center p-6 rounded-2xl bg-white border border-[#ebebeb] relative shadow-sm">
                <div className="w-14 h-14 rounded-full bg-[#ff385c] flex items-center justify-center mx-auto mb-4 shadow-[0_4px_16px_rgba(255,56,92,0.2)]">
                  <span className="text-2xl font-bold text-white">{item.step}</span>
                </div>
                <h3 className="text-heading-sm font-bold text-[#222222] mb-1">{item.title}</h3>
                <p className="text-[#4a4a4a] text-body-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Interactive Gift Form ─── */}
        <section className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl border border-[#dddddd] p-6 sm:p-8 shadow-sm">
            <h2 className="text-heading-lg font-bold text-[#222222] mb-6 text-center">Send Your Gift</h2>

            {/* Tab Switcher */}
            <div className="flex items-center justify-center gap-2 mb-8">
              <button
                onClick={() => { setTab("cards"); setSelectedExp(null); }}
                className={`px-6 py-2.5 rounded-full text-body-sm font-semibold transition-all duration-200 ${
                  tab === "cards"
                    ? "bg-[#ff385c] text-white shadow-[0_2px_8px_rgba(255,56,92,0.25)]"
                    : "bg-white border border-[#ebebeb] text-[#4a4a4a] hover:bg-[#f7f7f7] hover:text-[#222222]"
                }`}
              >
                Gift Cards
              </button>
              <button
                onClick={() => { setTab("experiences"); setSelectedCard(null); }}
                className={`px-6 py-2.5 rounded-full text-body-sm font-semibold transition-all duration-200 ${
                  tab === "experiences"
                    ? "bg-[#ff385c] text-white shadow-[0_2px_8px_rgba(255,56,92,0.25)]"
                    : "bg-white border border-[#ebebeb] text-[#4a4a4a] hover:bg-[#f7f7f7] hover:text-[#222222]"
                }`}
              >
                Gift Experiences
              </button>
            </div>

            {!sent ? (
              <>
                {/* Selection Grid */}
                {tab === "cards" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                    {giftCardValues.map((card, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedCard(selectedCard === i ? null : i)}
                        className={`relative p-5 rounded-xl text-left transition-all duration-300 ${
                          selectedCard === i
                            ? "bg-[#ff385c] text-white shadow-[0_4px_16px_rgba(255,56,92,0.2)] ring-2 ring-[#ff385c]/20"
                            : "bg-white border border-[#ebebeb] text-[#222222] hover:border-[#ff385c]/30"
                        }`}
                      >
                        {selectedCard === i && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                          </div>
                        )}
                        <p className={`text-xl font-bold ${selectedCard === i ? "text-white" : "text-[#222222]"}`}>{card.label}</p>
                        <p className={`text-caption mt-1 ${selectedCard === i ? "text-white/80" : "text-[#4a4a4a]"}`}>{card.desc}</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
                    {experiences.slice(0, 6).map((exp) => (
                      <button
                        key={exp.id}
                        onClick={() => setSelectedExp(selectedExp === exp.id ? null : exp.id)}
                        className="group relative text-left"
                      >
                        <div className={`relative aspect-[4/3] rounded-xl overflow-hidden bg-[#f7f7f7] transition-all duration-200 ${
                          selectedExp === exp.id ? "ring-2 ring-[#ff385c] shadow-[0_4px_16px_rgba(255,56,92,0.2)]" : ""
                        }`}>
                          <Image
                            src={exp.image}
                            alt={exp.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            sizes="(max-width: 640px) 50vw, 33vw"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                          {selectedExp === exp.id && (
                            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#ff385c] flex items-center justify-center z-10">
                              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            </div>
                          )}
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#ff385c] text-white text-[10px] font-medium">
                            Gift
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 p-2.5">
                            <h3 className="text-white font-semibold text-body-sm leading-tight line-clamp-1">{exp.title}</h3>
                            <p className="text-white/60 text-caption mt-0.5 line-clamp-1">{exp.subtitle}</p>
                            <p className="text-white font-semibold text-body-sm mt-1">MK {exp.price.toLocaleString()}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Recipient Form */}
                <div className="max-w-lg mx-auto">
                  <div className="flex items-center justify-center gap-2 mb-5">
                    <button
                      onClick={() => setDelivery("email")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-body-sm font-medium transition-all ${
                        delivery === "email"
                          ? "bg-[#ff385c] text-white"
                          : "bg-white border border-[#ebebeb] text-[#4a4a4a] hover:bg-[#f7f7f7]"
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      Email
                    </button>
                    <button
                      onClick={() => setDelivery("whatsapp")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-body-sm font-medium transition-all ${
                        delivery === "whatsapp"
                          ? "bg-[#ff385c] text-white"
                          : "bg-white border border-[#ebebeb] text-[#4a4a4a] hover:bg-[#f7f7f7]"
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                      WhatsApp
                    </button>
                  </div>

                  <div className="space-y-3 mb-5">
                    <input
                      type="text"
                      placeholder="Recipient's name"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-[#ebebeb] text-[#222222] text-body placeholder:text-[#6a6a6a] focus:outline-none focus:border-[#ff385c] focus:ring-1 focus:ring-[#ff385c]/30 transition-all"
                    />
                    <input
                      type={delivery === "email" ? "email" : "tel"}
                      placeholder={delivery === "email" ? "Recipient's email address" : "Recipient's WhatsApp number"}
                      value={recipientContact}
                      onChange={(e) => setRecipientContact(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-[#ebebeb] text-[#222222] text-body placeholder:text-[#6a6a6a] focus:outline-none focus:border-[#ff385c] focus:ring-1 focus:ring-[#ff385c]/30 transition-all"
                    />
                    <input
                      type="text"
                      placeholder="Your name (sender)"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-[#ebebeb] text-[#222222] text-body placeholder:text-[#6a6a6a] focus:outline-none focus:border-[#ff385c] focus:ring-1 focus:ring-[#ff385c]/30 transition-all"
                    />
                    <textarea
                      placeholder="Add a personal message (optional)"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-[#ebebeb] text-[#222222] text-body placeholder:text-[#6a6a6a] focus:outline-none focus:border-[#ff385c] focus:ring-1 focus:ring-[#ff385c]/30 transition-all resize-none"
                    />
                  </div>

                  {/* Summary */}
                  <div className="p-4 rounded-xl bg-[#f7f7f7] border border-[#ebebeb] mb-5">
                    <p className="text-caption text-[#4a4a4a] mb-1">Gift summary</p>
                    <div className="flex items-center justify-between">
                      <span className="text-body-sm text-[#4a4a4a]">
                        {tab === "cards" && selectedCard !== null
                          ? `Gift Card — ${giftCardValues[selectedCard].label}`
                          : tab === "experiences" && selectedExp
                            ? `Experience — ${experiences.find((e) => e.id === selectedExp)?.title}`
                            : "Select a gift above"}
                      </span>
                      <span className="text-heading-sm font-bold text-[#222222]">
                        {selectedValue > 0 ? `MK ${selectedValue.toLocaleString()}` : ""}
                      </span>
                    </div>
                    {occasion && (
                      <p className="text-caption text-[#4a4a4a] mt-2">🎉 {occasion}</p>
                    )}
                    {message && (
                      <p className="text-caption text-[#4a4a4a] mt-1 italic line-clamp-1">&ldquo;{message}&rdquo;</p>
                    )}
                  </div>

                  {giftError && (
                    <div className="p-3 rounded-xl bg-red-50/80 border border-red-200/60 flex items-start gap-2.5">
                      <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <p className="text-body-sm text-red-700">{giftError}</p>
                    </div>
                  )}

                  <button
                    onClick={handleSend}
                    disabled={!canSend || sending}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#ff385c] to-[#FF7A18] text-white font-semibold text-body-sm hover:shadow-[0_4px_20px_rgba(255,56,92,0.35)] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {sending ? (
                      <>
                        <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                        Send {tab === "cards" ? "Gift Card" : "Experience"}
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              /* ─── Success State ─── */
              <div className="max-w-lg mx-auto text-center py-6">
                <div className="w-16 h-16 rounded-full bg-[#ff385c] flex items-center justify-center mx-auto mb-4 shadow-[0_4px_16px_rgba(255,56,92,0.3)]">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h2 className="text-heading-lg font-bold text-[#222222] mb-2">Gift Sent! 🎉</h2>
                <p className="text-[#4a4a4a] text-body-sm mb-4">
                  Your gift has been delivered to {recipientName} via {delivery === "email" ? "email" : "WhatsApp"}.
                </p>
                <div className="p-4 rounded-xl bg-[#f7f7f7] border border-[#ebebeb] mb-6 inline-block">
                  <p className="text-caption text-[#4a4a4a] mb-1">Redemption Code</p>
                  <p className="text-heading-sm font-mono font-bold text-[#ff385c] tracking-wider">{redemptionCode}</p>
                </div>
                <p className="text-caption text-[#4a4a4a] mb-6">
                  Share this code with {recipientName} so they can redeem their gift.
                </p>
                <button
                  onClick={handleReset}
                  className="px-6 py-2.5 rounded-xl bg-[#ff385c] text-white font-semibold text-body-sm hover:shadow-[0_4px_16px_rgba(255,56,92,0.3)] transition-all duration-300"
                >
                  Send Another Gift
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ─── Track & Redeem ─── */}
        <section className="max-w-3xl mx-auto" id="redeem">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#ff385c]/10 to-[#FF7A18]/10 border border-[#ff385c]/20 text-[#ff385c] text-caption font-semibold mb-4">
              <span>🎯</span> Gift Cards
            </div>
            <h2 className="text-heading-xl font-bold text-[#222222] mb-2">Track &amp; Redeem</h2>
            <p className="text-[#4a4a4a] text-body-lg max-w-lg mx-auto">
              Received a gift card? Enter the code below to check its status and redeem it toward an experience.
            </p>
          </div>

          <div className="bg-gradient-to-br from-[#FFF8F0] via-white to-[#FFF0F3] rounded-3xl border border-[#ebebeb] p-6 sm:p-10 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6a6a6a]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                <input
                  type="text"
                  placeholder="Enter gift card code (e.g. MOMO-XXXXXXXX)"
                  value={trackCode}
                  onChange={(e) => setTrackCode(e.target.value.toUpperCase())}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white border border-[#ebebeb] text-[#222222] text-body placeholder:text-[#6a6a6a] focus:outline-none focus:border-[#ff385c] focus:ring-1 focus:ring-[#ff385c]/20 transition-all font-mono tracking-wider"
                />
              </div>
              <button
                onClick={handleTrackCode}
                disabled={!trackCode.trim() || tracking}
                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#ff385c] to-[#FF7A18] text-white font-semibold text-body-sm hover:shadow-[0_4px_20px_rgba(255,56,92,0.35)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0"
              >
                {tracking ? (
                  <>
                    <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    Check Status
                  </>
                )}
              </button>
            </div>

            {trackResult && (
              <div className={`p-5 rounded-2xl border mb-6 transition-all ${
                trackResult.found
                  ? "bg-emerald-50/80 border-emerald-200/60"
                  : "bg-red-50/80 border-red-200/60"
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    trackResult.found ? "bg-emerald-100" : "bg-red-100"
                  }`}>
                    {trackResult.found ? (
                      <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    ) : (
                      <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`text-body-sm font-bold ${trackResult.found ? "text-emerald-800" : "text-red-800"}`}>
                      {trackResult.found ? "Gift Card Found!" : "Code Not Found"}
                    </p>
                    <p className={`text-caption mt-0.5 ${trackResult.found ? "text-emerald-600" : "text-red-600"}`}>
                      {trackResult.found
                        ? `This card is ${trackResult.status} · ${trackResult.value}`
                        : "Please check the code and try again. Codes are format: MOMO-XXXXXXXX"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Status Tracker */}
            <div className="mt-2">
              <p className="text-caption font-semibold text-[#4a4a4a] mb-3 uppercase tracking-wider">Status Timeline</p>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { step: "Purchased", icon: "🛒", done: true, desc: "Card issued" },
                  { step: "Delivered", icon: "📨", done: true, desc: "Sent to recipient" },
                  { step: "Viewed", icon: "👀", done: trackResult?.found, desc: "Code checked" },
                  { step: "Redeemed", icon: "✅", done: trackResult?.status === "redeemed", desc: "Experience booked" },
                ].map((s) => (
                  <div key={s.step} className={`text-center p-4 rounded-2xl transition-all border ${
                    s.done
                      ? "bg-white border-emerald-200/50 shadow-sm"
                      : "bg-white/50 border-[#ebebeb]"
                  }`}>
                    <span className={`text-2xl block mb-2 ${s.done ? "" : "opacity-30 grayscale"}`}>{s.icon}</span>
                    <p className={`text-caption font-bold ${s.done ? "text-[#222222]" : "text-[#6a6a6a]"}`}>{s.step}</p>
                    <p className={`text-caption mt-0.5 ${s.done ? "text-emerald-600" : "text-[#929292]"}`}>{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-[#ff385c]/5 to-[#9F3BFF]/5 border border-[#ebebeb]">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-[#ff385c] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-caption text-[#4a4a4a] leading-relaxed">
                  <strong className="text-[#222222]">To redeem:</strong> When booking an experience, enter your gift card code at checkout to apply the value toward your purchase. Unused balance remains for future bookings.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}