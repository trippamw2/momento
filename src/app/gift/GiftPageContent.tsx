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

  const categoryExp = activeFilter === "All" ? experiences : experiences.filter((e) => e.category === activeFilter.toLowerCase());

  const handleTrackCode = async () => {
    if (!trackCode.trim()) return;
    setTracking(true);
    try {
      const res = await fetch(`/api/gift-cards/check?code=${trackCode}`);
      const data = await res.json();
      if (res.ok && data) {
        setTrackResult({ found: true, value: `MK ${data.amount?.toLocaleString() || "0"}`, status: data.status || "active" });
      } else {
        setTrackResult({ found: false });
      }
    } catch {
      setTrackResult({ found: false });
    } finally {
      setTracking(false);
    }
  };

  const handleSend = () => {
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSent(true);
      setRedemptionCode(`MOMO-${Math.random().toString(36).slice(2, 8).toUpperCase()}`);
    }, 1500);
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
      <section className="relative min-h-[55vh] flex items-center justify-center overflow-hidden mb-10">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1519741497674-611481863552?w=1920&q=85"
            alt="Couple gifting a luxury experience"
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/70 to-white/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#ff385c]/5 to-transparent" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-[#dddddd] text-[#6a6a6a] text-caption font-medium mb-5 backdrop-blur-md">
            <span className="text-sm">🎁</span> Premium Gifting
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[#222222] mb-3 tracking-tight leading-[1.08]">
            Give More Than A Gift,
            <span className="block mt-1 bg-gradient-to-r from-[#ff385c] to-[#FF7A18] bg-clip-text text-transparent">
              Give A Memory.
            </span>
          </h1>

          <p className="text-[#6a6a6a] text-body-lg sm:text-heading-md max-w-lg mx-auto mb-8 leading-relaxed">
            Surprise someone with experiences they&apos;ll never forget.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {[
              { icon: "⚡", label: "Instant Delivery" },
              { icon: "📅", label: "Valid For 12 Months" },
              { icon: "✓", label: "Easy Redemption" },
            ].map((badge) => (
              <div
                key={badge.label}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/80 border border-[#dddddd] backdrop-blur-md shadow-sm"
              >
                <span className="text-sm">{badge.icon}</span>
                <span className="text-[#6a6a6a] text-body-sm font-medium">{badge.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-14">
        {/* ─── Experience Finder ─── */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-heading-xl font-bold text-[#222222]">Find the perfect gift</h2>
            <Link
              href="/experiences"
              className="text-body-sm text-[#6a6a6a] hover:text-[#222222] transition-colors flex items-center gap-1"
            >
              Browse all
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>

          {/* ─── Filters ─── */}
          <div className="flex flex-wrap items-center gap-2.5 mb-6">
            <span className="text-caption font-medium text-[#929292] uppercase tracking-wider mr-1">Category</span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`px-4 py-2 rounded-full text-body-sm font-medium transition-all duration-200 ${
                  activeFilter === cat
                    ? "bg-[#ff385c] text-white shadow-[0_2px_8px_rgba(255,56,92,0.25)]"
                    : "bg-white border border-[#ebebeb] text-[#6a6a6a] hover:bg-[#f7f7f7] hover:text-[#222222]"
                }`}
              >
                {cat === "Day Out" ? "Day Out" : cat}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 mb-8">
            <span className="text-caption font-medium text-[#929292] uppercase tracking-wider mr-1">Location</span>
            {locations.slice(0, 5).map((loc) => (
              <Link
                key={loc}
                href={loc === "All" ? "/experiences" : `/experiences?location=${loc}`}
                className="px-4 py-2 rounded-full text-body-sm font-medium bg-white border border-[#ebebeb] text-[#6a6a6a] hover:bg-[#f7f7f7] hover:text-[#222222] transition-all shadow-sm"
              >
                {loc}
              </Link>
            ))}
            <Link
              href="/experiences"
              className="px-4 py-2 rounded-full text-body-sm font-medium text-[#929292] hover:text-[#6a6a6a] transition-all"
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
                      : "bg-white border border-[#ebebeb] text-[#6a6a6a] hover:bg-[#f7f7f7] hover:text-[#222222]"
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
            <p className="text-[#6a6a6a] text-body-lg">Choose an amount and surprise someone special</p>
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
                <p className="text-[#6a6a6a] text-body-sm leading-relaxed">{item.desc}</p>
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
                    : "bg-white border border-[#ebebeb] text-[#6a6a6a] hover:bg-[#f7f7f7] hover:text-[#222222]"
                }`}
              >
                Gift Cards
              </button>
              <button
                onClick={() => { setTab("experiences"); setSelectedCard(null); }}
                className={`px-6 py-2.5 rounded-full text-body-sm font-semibold transition-all duration-200 ${
                  tab === "experiences"
                    ? "bg-[#ff385c] text-white shadow-[0_2px_8px_rgba(255,56,92,0.25)]"
                    : "bg-white border border-[#ebebeb] text-[#6a6a6a] hover:bg-[#f7f7f7] hover:text-[#222222]"
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
                        <p className={`text-caption mt-1 ${selectedCard === i ? "text-white/80" : "text-[#6a6a6a]"}`}>{card.desc}</p>
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
                          : "bg-white border border-[#ebebeb] text-[#6a6a6a] hover:bg-[#f7f7f7]"
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
                          : "bg-white border border-[#ebebeb] text-[#6a6a6a] hover:bg-[#f7f7f7]"
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
                      className="w-full px-4 py-3 rounded-xl bg-white border border-[#ebebeb] text-[#222222] text-body placeholder:text-[#929292] focus:outline-none focus:border-[#ff385c] focus:ring-1 focus:ring-[#ff385c]/30 transition-all"
                    />
                    <input
                      type={delivery === "email" ? "email" : "tel"}
                      placeholder={delivery === "email" ? "Recipient's email address" : "Recipient's WhatsApp number"}
                      value={recipientContact}
                      onChange={(e) => setRecipientContact(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-[#ebebeb] text-[#222222] text-body placeholder:text-[#929292] focus:outline-none focus:border-[#ff385c] focus:ring-1 focus:ring-[#ff385c]/30 transition-all"
                    />
                    <input
                      type="text"
                      placeholder="Your name (sender)"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-[#ebebeb] text-[#222222] text-body placeholder:text-[#929292] focus:outline-none focus:border-[#ff385c] focus:ring-1 focus:ring-[#ff385c]/30 transition-all"
                    />
                    <textarea
                      placeholder="Add a personal message (optional)"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-[#ebebeb] text-[#222222] text-body placeholder:text-[#929292] focus:outline-none focus:border-[#ff385c] focus:ring-1 focus:ring-[#ff385c]/30 transition-all resize-none"
                    />
                  </div>

                  {/* Summary */}
                  <div className="p-4 rounded-xl bg-[#f7f7f7] border border-[#ebebeb] mb-5">
                    <p className="text-caption text-[#6a6a6a] mb-1">Gift summary</p>
                    <div className="flex items-center justify-between">
                      <span className="text-body-sm text-[#6a6a6a]">
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
                      <p className="text-caption text-[#6a6a6a] mt-2">🎉 {occasion}</p>
                    )}
                    {message && (
                      <p className="text-caption text-[#6a6a6a] mt-1 italic line-clamp-1">&ldquo;{message}&rdquo;</p>
                    )}
                  </div>

                  <button
                    onClick={handleSend}
                    disabled={!canSend || sending}
                    className="w-full py-3.5 rounded-xl bg-[#ff385c] text-white font-semibold text-body-sm hover:shadow-[0_4px_16px_rgba(255,56,92,0.3)] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {sending ? (
                      <>
                        <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Sending...
                      </>
                    ) : (
                      `Send ${tab === "cards" ? "Gift Card" : "Experience"}`
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
                <p className="text-[#6a6a6a] text-body-sm mb-4">
                  Your gift has been delivered to {recipientName} via {delivery === "email" ? "email" : "WhatsApp"}.
                </p>
                <div className="p-4 rounded-xl bg-[#f7f7f7] border border-[#ebebeb] mb-6 inline-block">
                  <p className="text-caption text-[#6a6a6a] mb-1">Redemption Code</p>
                  <p className="text-heading-sm font-mono font-bold text-[#ff385c] tracking-wider">{redemptionCode}</p>
                </div>
                <p className="text-caption text-[#6a6a6a] mb-6">
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

        {/* ─── Track Redemption ─── */}
        <section className="max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-heading-lg font-bold text-[#222222] mb-2">Track Redemption</h2>
            <p className="text-[#6a6a6a] text-body-sm">Enter a redemption code to check its status</p>
          </div>

          <div className="bg-white rounded-2xl border border-[#dddddd] p-6 sm:p-8 shadow-sm">
            <div className="flex gap-3 mb-6">
              <input
                type="text"
                placeholder="Enter code (e.g. MOMO-XXXXXX)"
                value={trackCode}
                onChange={(e) => setTrackCode(e.target.value.toUpperCase())}
                className="flex-1 px-4 py-3 rounded-xl bg-white border border-[#ebebeb] text-[#222222] text-body placeholder:text-[#929292] focus:outline-none focus:border-[#ff385c] focus:ring-1 focus:ring-[#ff385c]/30 transition-all font-mono uppercase"
              />
              <button
                onClick={handleTrackCode}
                className="px-6 py-3 rounded-xl bg-[#ff385c] text-white font-semibold text-body-sm hover:shadow-[0_4px_16px_rgba(255,56,92,0.3)] transition-all duration-300 whitespace-nowrap"
              >
                {tracking ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  "Check"
                )}
              </button>
            </div>

            {trackResult && (
              <div className={`p-4 rounded-xl mb-4 border ${
                trackResult.found
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-red-50 border-red-200"
              }`}>
                <p className={`text-body-sm font-medium ${trackResult.found ? "text-emerald-700" : "text-red-700"}`}>
                  {trackResult.found ? "✓ Gift card found" : "✗ Code not found"}
                </p>
                {trackResult.found && (
                  <p className="text-caption text-[#6a6a6a] mt-1">
                    Value: {trackResult.value} · Status: {trackResult.status}
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-4 gap-2">
              {[
                { step: "Purchased", icon: "🛒", done: true },
                { step: "Delivered", icon: "📨", done: true },
                { step: "Viewed", icon: "👀", done: false },
                { step: "Redeemed", icon: "✅", done: false },
              ].map((s) => (
                <div key={s.step} className={`text-center p-3 rounded-xl transition-all ${
                  s.done ? "bg-[#f7f7f7]" : "bg-[#f7f7f7]/50"
                }`}>
                  <span className={`text-xl block mb-1 ${s.done ? "" : "opacity-30"}`}>{s.icon}</span>
                  <p className={`text-caption font-medium ${s.done ? "text-[#222222]" : "text-[#929292]"}`}>{s.step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}