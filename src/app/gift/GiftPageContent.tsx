"use client";

import { useState } from "react";
import Image from "next/image";
import { experiences } from "@/lib/data";

const occasions = [
  { label: "Birthday", emoji: "🎂" },
  { label: "Anniversary", emoji: "💍" },
  { label: "Valentine's", emoji: "❤️" },
  { label: "Thank You", emoji: "🙏" },
  { label: "Congratulations", emoji: "🎉" },
  { label: "Just Because", emoji: "✨" },
];

const giftCardValues = [
  { value: 100000, label: "MK 100,000", desc: "Perfect for a brunch date" },
  { value: 250000, label: "MK 250,000", desc: "Ideal for a spa day" },
  { value: 300000, label: "MK 300,000", desc: "The ultimate experience" },
];

type Tab = "cards" | "experiences";
type DeliveryMethod = "email" | "whatsapp";

export default function GiftPageContent() {
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

  return (
    <div className="pt-20 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-8">
        {/* ─── Hero ─── */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-hot-pink/10 border border-brand-hot-pink/20 text-brand-hot-pink text-caption font-medium mb-4">
            <span>🎁</span> Premium Gifting
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-text-primary mb-3 tracking-tight leading-display">
            Give More Than A Gift.
            <span className="gradient-text block mt-1">Give A Memory.</span>
          </h1>
          <p className="text-text-secondary text-body-lg max-w-xl mx-auto">
            Choose a gift card or surprise them with an unforgettable experience, delivered straight to their inbox or phone.
          </p>
        </div>

        {/* ─── Occasions ─── */}
        <section className="mb-10">
          <h2 className="text-heading-md font-bold text-text-primary mb-4 text-center">What&apos;s the occasion?</h2>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {occasions.map((o) => (
              <button
                key={o.label}
                onClick={() => setOccasion(occasion === o.label ? null : o.label)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-body-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  occasion === o.label
                    ? "gradient-brand text-text-on-gradient"
                    : "bg-surface-tertiary text-text-secondary border border-border-subtle hover:bg-surface-elevated hover:text-text-primary"
                }`}
              >
                <span>{o.emoji}</span>
                {o.label}
              </button>
            ))}
          </div>
        </section>

        {/* ─── Tab Switcher ─── */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <button
            onClick={() => setTab("cards")}
            className={`px-6 py-2.5 rounded-full text-body-sm font-semibold transition-all duration-200 ${
              tab === "cards"
                ? "bg-text-primary text-black"
                : "bg-surface-tertiary text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
            }`}
          >
            Gift Cards
          </button>
          <button
            onClick={() => setTab("experiences")}
            className={`px-6 py-2.5 rounded-full text-body-sm font-semibold transition-all duration-200 ${
              tab === "experiences"
                ? "bg-text-primary text-black"
                : "bg-surface-tertiary text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
            }`}
          >
            Gift Experiences
          </button>
        </div>

        {/* ─── Gift Cards ─── */}
        {tab === "cards" && (
          <section className="mb-10">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl mx-auto">
              {giftCardValues.map((card, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedCard(selectedCard === i ? null : i)}
                  className={`relative p-6 rounded-2xl text-left transition-all duration-300 ${
                    selectedCard === i
                      ? "bg-gradient-to-br from-brand-hot-pink to-brand-sunset-orange ring-2 ring-white/20 shadow-brand-glow"
                      : "bg-surface-secondary border border-border-default hover:border-brand-hot-pink/30"
                  }`}
                >
                  {selectedCard === i && (
                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                  )}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                    selectedCard === i ? "bg-white/20" : "bg-gradient-to-br from-brand-hot-pink/20 to-brand-sunset-orange/20"
                  }`}>
                    <span className="text-xl">🎁</span>
                  </div>
                  <p className={`text-heading-lg font-bold mb-1 ${selectedCard === i ? "text-white" : "text-text-primary"}`}>
                    {card.label}
                  </p>
                  <p className={`text-body-sm ${selectedCard === i ? "text-white/80" : "text-text-secondary"}`}>
                    {card.desc}
                  </p>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ─── Gift Experiences ─── */}
        {tab === "experiences" && (
          <section className="mb-10">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {experiences.map((exp) => (
                <button
                  key={exp.id}
                  onClick={() => setSelectedExp(selectedExp === exp.id ? null : exp.id)}
                  className="group relative text-left"
                >
                  <div className={`relative aspect-[3/4] rounded-xl overflow-hidden bg-surface-tertiary transition-all duration-200 ${
                    selectedExp === exp.id ? "ring-2 ring-brand-hot-pink shadow-brand-glow" : ""
                  }`}>
                    <Image
                      src={exp.image}
                      alt={exp.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                    <div className="gradient-overlay-bottom absolute inset-0" />
                    {selectedExp === exp.id && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-brand-hot-pink flex items-center justify-center z-10">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      </div>
                    )}
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-brand-hot-pink/90 text-text-on-gradient text-[10px] font-medium">
                      Gift
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-2.5">
                      <h3 className="text-text-primary font-semibold text-body-sm leading-tight line-clamp-1">{exp.title}</h3>
                      <p className="text-white/60 text-caption mt-0.5 line-clamp-1">{exp.subtitle}</p>
                      <p className="text-text-primary font-semibold text-body-sm mt-1">MK {exp.price.toLocaleString()}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ─── Delivery Form ─── */}
        {!sent && (
          <section className="max-w-xl mx-auto mb-10">
            <div className="bg-surface-secondary rounded-2xl border border-border-default p-6 sm:p-8">
              <h2 className="text-heading-md font-bold text-text-primary mb-6">Recipient Details</h2>

              {/* Delivery Method */}
              <div className="flex gap-2 mb-5">
                <button
                  onClick={() => setDelivery("email")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-body-sm font-medium transition-all ${
                    delivery === "email"
                      ? "gradient-brand text-text-on-gradient"
                      : "bg-surface-tertiary text-text-secondary border border-border-subtle hover:bg-surface-elevated"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  Email
                </button>
                <button
                  onClick={() => setDelivery("whatsapp")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-body-sm font-medium transition-all ${
                    delivery === "whatsapp"
                      ? "gradient-brand text-text-on-gradient"
                      : "bg-surface-tertiary text-text-secondary border border-border-subtle hover:bg-surface-elevated"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  WhatsApp
                </button>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Recipient's name"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-surface-tertiary border border-border-subtle text-text-primary text-body placeholder:text-text-tertiary/60 focus:outline-none focus:border-brand-hot-pink focus:ring-1 focus:ring-brand-hot-pink/50 transition-all"
                />
                <input
                  type={delivery === "email" ? "email" : "tel"}
                  placeholder={delivery === "email" ? "Recipient's email address" : "Recipient's WhatsApp number"}
                  value={recipientContact}
                  onChange={(e) => setRecipientContact(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-surface-tertiary border border-border-subtle text-text-primary text-body placeholder:text-text-tertiary/60 focus:outline-none focus:border-brand-hot-pink focus:ring-1 focus:ring-brand-hot-pink/50 transition-all"
                />
                <input
                  type="text"
                  placeholder="Your name (sender)"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-surface-tertiary border border-border-subtle text-text-primary text-body placeholder:text-text-tertiary/60 focus:outline-none focus:border-brand-hot-pink focus:ring-1 focus:ring-brand-hot-pink/50 transition-all"
                />
                <textarea
                  placeholder="Add a personal message (optional)"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-surface-tertiary border border-border-subtle text-text-primary text-body placeholder:text-text-tertiary/60 focus:outline-none focus:border-brand-hot-pink focus:ring-1 focus:ring-brand-hot-pink/50 transition-all resize-none"
                />
              </div>

              {/* Summary */}
              <div className="mt-6 p-4 rounded-xl bg-surface-tertiary border border-border-subtle">
                <p className="text-caption text-text-tertiary mb-1">Gift summary</p>
                <div className="flex items-center justify-between">
                  <span className="text-body-sm text-text-secondary">
                    {tab === "cards" && selectedCard !== null
                      ? `Gift Card — ${giftCardValues[selectedCard].label}`
                      : tab === "experiences" && selectedExp
                        ? `Experience — ${experiences.find((e) => e.id === selectedExp)?.title}`
                        : "Select a gift above"}
                  </span>
                  <span className="text-heading-sm font-bold text-text-primary">
                    {selectedValue > 0 ? `MK ${selectedValue.toLocaleString()}` : ""}
                  </span>
                </div>
                {occasion && (
                  <p className="text-caption text-text-tertiary mt-2">🎉 {occasion}</p>
                )}
                {message && (
                  <p className="text-caption text-text-tertiary mt-1 italic line-clamp-1">&ldquo;{message}&rdquo;</p>
                )}
              </div>

              <button
                onClick={handleSend}
                disabled={!canSend || sending}
                className="w-full mt-5 py-3 rounded-full gradient-brand text-text-on-gradient font-semibold text-body-sm hover:shadow-brand-glow transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
          </section>
        )}

        {/* ─── Success State ─── */}
        {sent && (
          <section className="max-w-xl mx-auto mb-10">
            <div className="bg-surface-secondary rounded-2xl border border-border-default p-8 text-center">
              <div className="w-16 h-16 rounded-full gradient-brand flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h2 className="text-heading-lg font-bold text-text-primary mb-2">Gift Sent! 🎉</h2>
              <p className="text-text-secondary text-body-sm mb-4">
                Your gift has been delivered to {recipientName} via {delivery === "email" ? "email" : "WhatsApp"}.
              </p>
              <div className="p-4 rounded-xl bg-surface-tertiary border border-border-subtle mb-6 inline-block">
                <p className="text-caption text-text-tertiary mb-1">Redemption Code</p>
                <p className="text-heading-sm font-mono font-bold text-brand-hot-pink tracking-wider">{redemptionCode}</p>
              </div>
              <p className="text-caption text-text-secondary mb-6">
                Share this code with {recipientName} so they can redeem their gift. You can track the status below.
              </p>
              <button
                onClick={() => {
                  setSent(false);
                  setSelectedCard(null);
                  setSelectedExp(null);
                  setRecipientName("");
                  setRecipientContact("");
                  setSenderName("");
                  setMessage("");
                  setOccasion(null);
                }}
                className="px-6 py-2.5 rounded-full gradient-brand text-text-on-gradient font-semibold text-body-sm"
              >
                Send Another Gift
              </button>
            </div>
          </section>
        )}

        {/* ─── Track Redemption ─── */}
        <section className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-heading-md font-bold text-text-primary mb-2">Track Redemption</h2>
            <p className="text-text-secondary text-body-sm">Enter a redemption code to check its status</p>
          </div>

          <div className="bg-surface-secondary rounded-2xl border border-border-default p-6 sm:p-8">
            <div className="flex gap-3 mb-6">
              <input
                type="text"
                placeholder="Enter code (e.g. MOMO-XXXXXX)"
                className="flex-1 px-4 py-3 rounded-xl bg-surface-tertiary border border-border-subtle text-text-primary text-body placeholder:text-text-tertiary/60 focus:outline-none focus:border-brand-hot-pink focus:ring-1 focus:ring-brand-hot-pink/50 transition-all font-mono uppercase"
              />
              <button className="px-6 py-3 rounded-xl gradient-brand text-text-on-gradient font-semibold text-body-sm hover:shadow-brand-glow transition-all duration-300 whitespace-nowrap">
                Check
              </button>
            </div>

            {/* Status Steps */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { step: "Purchased", icon: "🛒", done: true },
                { step: "Delivered", icon: "📨", done: true },
                { step: "Viewed", icon: "👀", done: false },
                { step: "Redeemed", icon: "✅", done: false },
              ].map((s) => (
                <div key={s.step} className={`text-center p-3 rounded-xl transition-all ${
                  s.done ? "bg-surface-tertiary" : "bg-surface-tertiary/50"
                }`}>
                  <span className={`text-xl block mb-1 ${s.done ? "" : "opacity-30"}`}>{s.icon}</span>
                  <p className={`text-caption font-medium ${s.done ? "text-text-primary" : "text-text-tertiary"}`}>{s.step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── How It Works ─── */}
        <section className="mt-16">
          <h2 className="text-heading-md font-bold text-text-primary mb-8 text-center">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { step: "01", title: "Choose", desc: "Pick a gift card value or select an experience to gift", icon: "🎁" },
              { step: "02", title: "Personalise", desc: "Add a message, choose delivery method, and send", icon: "✍️" },
              { step: "03", title: "They Enjoy", desc: "Recipient receives and redeems their unforgettable moment", icon: "✨" },
            ].map((item) => (
              <div key={item.step} className="text-center p-6 rounded-2xl bg-surface-secondary border border-border-default">
                <div className="w-14 h-14 rounded-full gradient-brand flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">{item.icon}</span>
                </div>
                <p className="text-caption text-brand-hot-pink font-semibold mb-1">{item.step}</p>
                <h3 className="text-heading-sm font-bold text-text-primary mb-2">{item.title}</h3>
                <p className="text-body-sm text-text-secondary">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
