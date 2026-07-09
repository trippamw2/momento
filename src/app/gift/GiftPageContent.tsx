"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import QRCode from "qrcode";
import { experiences } from "@/lib/data";
import GiftCard, { GIFT_CARD_VARIANTS } from "@/components/GiftCard";
import { sendGiftCard } from "@/lib/gift-engine";
import { downloadGiftPDF } from "@/lib/gift-card-pdf";
import GiftHero from "./GiftHero";
import TrackRedeem from "./TrackRedeem";

const categories = ["All", "Date", "Chill", "Celebrate", "Escape"];
const locations = ["All", "Lilongwe", "Blantyre"];

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
  { value: 50000, label: "MK 50,000", desc: "Perfect for a coffee date or a small treat" },
  { value: 100000, label: "MK 100,000", desc: "Great for a brunch date or relaxing afternoon" },
  { value: 200000, label: "MK 200,000", desc: "Ideal for a spa day or romantic dinner" },
  { value: 300000, label: "MK 300,000", desc: "Perfect for a weekend escape" },
  { value: 500000, label: "MK 500,000", desc: "The ultimate premium gift experience" },
];

const processSteps = [
  { step: "1", title: "Choose", desc: "Pick a gift card value or select an experience to gift" },
  { step: "2", title: "Personalize", desc: "Add a message, choose delivery method, and set the date" },
  { step: "3", title: "Send", desc: "Deliver instantly via email or WhatsApp" },
  { step: "4", title: "Enjoy", desc: "Recipient redeems their unforgettable moment" },
];

type Tab = "cards" | "experiences";
type DeliveryMethod = "email" | "whatsapp";
type SendMode = "now" | "schedule";

function tomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

export default function GiftPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
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
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const [sent, setSent] = useState(false);
  const [redemptionCode, setRedemptionCode] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [giftError, setGiftError] = useState("");
  const [sendMode, setSendMode] = useState<SendMode>("now");
  const [scheduleDate, setScheduleDate] = useState(tomorrow);
  const cardRef = useRef<HTMLDivElement>(null);

  // Generate QR code when gift is sent
  useEffect(() => {
    if (sent && redemptionCode) {
      QRCode.toDataURL(redemptionCode, {
        width: 200,
        margin: 1,
        color: { dark: "#1a1a2e", light: "#ffffff" },
      }).then(setQrDataUrl).catch((err) => console.error("QR code generation failed:", err));
    }
  }, [sent, redemptionCode]);

  // Handle payment return: when redirected back from PayChangu with payment status
  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    const txRef = searchParams.get("tx_ref");
    if (!paymentStatus || !txRef) return;

    if (paymentStatus === "success" || paymentStatus === "initiated") {
      // In dev mode, simulate webhook by calling it from the client
      processPaymentReturn(txRef);
    }
    // Clean up the URL params so refresh doesn't re-trigger
    router.replace("/gift", { scroll: false });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function processPaymentReturn(txRef: string) {
    setSending(true);
    try {
      // Call the webhook endpoint to process the payment and create the gift card
      const res = await fetch("/api/payments/paychangu-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "success",
          reference: txRef,
          event_type: "api.charge.payment",
        }),
      });

      const data = await res.json();
      if (res.ok && data.code) {
        setRedemptionCode(data.code);
        // Trigger WhatsApp delivery if sending now (email handled server-side by webhook)
        if (sendMode === "now" && delivery === "whatsapp") {
          sendGiftCard({
            id: data.gift_card_id || "",
            code: data.code,
            amount: selectedValue,
            balance: selectedValue,
            currency: "MWK",
            recipientName,
            recipientContact,
            senderName,
            message: message || undefined,
            deliveryMethod: delivery,
            occasion: occasion || undefined,
            status: "active",
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 365 * 86400000).toISOString(),
          });
        }
        setSent(true);
      } else {
        setGiftError("Payment was processed but gift card creation failed. Please contact support.");
      }
    } catch {
      setGiftError("Network error processing payment return. Please try again.");
    } finally {
      setSending(false);
    }
  }

  const handleContinueToPayment = async () => {
    const token = localStorage.getItem("experio-auth-token");
    if (!token) {
      setGiftError("Please sign in to send a gift");
      return;
    }

    setPaying(true);
    setPayError("");
    setGiftError("");

    try {
      const res = await fetch("/api/payments/paychangu-gift", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: selectedValue,
          recipient_name: recipientName,
          recipient_email: delivery === "email" ? recipientContact : undefined,
          sender_name: senderName,
          message: message || undefined,
          delivery_method: delivery,
          occasion: occasion || undefined,
          schedule_date: sendMode === "schedule" ? scheduleDate : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.checkout_url) {
        // Redirect to PayChangu checkout
        window.location.href = data.checkout_url;
      } else {
        setPayError(data?.error || "Failed to initiate payment");
      }
    } catch {
      setPayError("Network error. Please try again.");
    } finally {
      setPaying(false);
    }
  };

  const handleSend = async () => {
    const token = localStorage.getItem("experio-auth-token");
    if (!token) {
      setGiftError("Please sign in to send a gift");
      return;
    }

    setSending(true);
    setGiftError("");

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
          schedule_date: sendMode === "schedule" ? scheduleDate : undefined,
        }),
      });

      let code: string;
      if (res.ok) {
        const data = await res.json();
        code = data.code || "";
      } else {
        setGiftError("Failed to create gift card. Please try again.");
        return;
      }

      setRedemptionCode(code);

      // Trigger WhatsApp delivery if sending now (email handled server-side)
      if (sendMode === "now" && delivery === "whatsapp") {
        sendGiftCard({
          id: "",
          code,
          amount: selectedValue,
          balance: selectedValue,
          currency: "MWK",
          recipientName,
          recipientContact,
          senderName,
          message: message || undefined,
          deliveryMethod: delivery,
          occasion: occasion || undefined,
          status: "active",
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 365 * 86400000).toISOString(),
        });
      }

      setSent(true);
    } catch {
      setGiftError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleDownloadCard = useCallback(async () => {
    if (!cardRef.current || !qrDataUrl) return;
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const rect = cardRef.current.getBoundingClientRect();
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
      ctx.scale(2, 2);

      // Draw ATM-style card background
      const gradient = ctx.createLinearGradient(0, 0, rect.width, rect.height);
      gradient.addColorStop(0, "#1a1a2e");
      gradient.addColorStop(0.5, "#16213e");
      gradient.addColorStop(1, "#0f3460");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(0, 0, rect.width, rect.height, 16);
      ctx.fill();

      // Decorative elements
      ctx.fillStyle = "rgba(255, 15, 115, 0.08)";
      ctx.beginPath();
      ctx.arc(rect.width - 40, -20, 100, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(159, 59, 255, 0.06)";
      ctx.beginPath();
      ctx.arc(-30, rect.height - 30, 80, 0, Math.PI * 2);
      ctx.fill();

      // Experio brand mark
      ctx.fillStyle = "#FF0F73";
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "right";
      ctx.fillText("✦ Experio", rect.width - 20, 30);

      // Card chip
      ctx.fillStyle = "rgba(255, 200, 50, 0.7)";
      ctx.beginPath();
      ctx.roundRect(20, 40, 40, 30, 6);
      ctx.fill();

      // Gift Card label
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "9px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("GIFT CARD", 20, 90);

      // Value amount
      const selectedGiftValue = tab === "cards" && selectedCard !== null ? giftCardValues[selectedCard].label : "Experience";
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 24px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(selectedGiftValue, 20, 125);

      // Card number
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.font = "bold 16px monospace";
      ctx.textAlign = "left";
      ctx.fillText(redemptionCode, 20, 160);

      // Recipient
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("TO", 20, 185);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 14px sans-serif";
      ctx.fillText(recipientName, 20, 205);

      // From
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("FROM", 20, 230);
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "12px sans-serif";
      ctx.fillText(senderName, 20, 248);

      // Gift message
      if (message) {
        ctx.fillStyle = "rgba(255,255,255,0.25)";
        ctx.font = "9px sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("MESSAGE", 20, 268);
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "italic 10px sans-serif";
        const maxW = Math.min(rect.width - 140, 200);
        const truncated = message.length > 80 ? message.slice(0, 77) + "..." : message;
        ctx.fillText(truncated, 20, 283, maxW);
      }

      // QR Code
      if (qrDataUrl) {
        const qrImg = new window.Image();
        qrImg.onload = () => {
          ctx.drawImage(qrImg, rect.width - 110, rect.height - 130, 90, 90);
          const link = document.createElement("a");
          link.download = `experio-giftcard-${redemptionCode}.png`;
          link.href = canvas.toDataURL();
          link.click();
        };
        qrImg.src = qrDataUrl;
        return;
      }

      const link = document.createElement("a");
      link.download = `experio-giftcard-${redemptionCode}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (e) { console.warn("Failed to download gift card image:", e); }
  }, [redemptionCode, qrDataUrl, recipientName, senderName, tab, selectedCard]);

  const selectedValue = tab === "cards" && selectedCard !== null
    ? giftCardValues[selectedCard].value
    : tab === "experiences" && selectedExp
      ? experiences.find((e) => e.id === selectedExp)?.price ?? 0
      : 0;

  const handleDownloadPDF = useCallback(() => {
    downloadGiftPDF({
      recipientName,
      senderName,
      amount: selectedValue,
      currency: "MWK",
      code: redemptionCode,
      message: message || undefined,
      occasion: occasion || undefined,
      qrDataUrl: qrDataUrl || undefined,
      expiresAt: new Date(Date.now() + 365 * 86400000).toISOString(),
    });
  }, [recipientName, senderName, selectedValue, redemptionCode, message, occasion, qrDataUrl]);

  const canSend = (tab === "cards" && selectedCard !== null || tab === "experiences" && selectedExp !== null)
    && recipientName.trim()
    && recipientContact.trim()
    && senderName.trim()
    && (sendMode === "now" || (sendMode === "schedule" && scheduleDate.trim()));

  const handleReset = () => {
    setSent(false);
    setSelectedCard(null);
    setSelectedExp(null);
    setRecipientName("");
    setRecipientContact("");
    setSenderName("");
    setMessage("");
    setOccasion(null);
    setSendMode("now");
    setScheduleDate(tomorrow());
  };

  // Compute which step the user is on for the progress indicator
  const currentStep = useMemo(() => {
    if (sent) return 4;
    if (tab === "cards" && selectedCard !== null || tab === "experiences" && selectedExp !== null) {
      if (recipientName.trim() && senderName.trim()) return 3; // Ready to send
      return 2; // Personalize
    }
    return 1; // Choose
  }, [sent, tab, selectedCard, selectedExp, recipientName, senderName]);

  const scheduleLabel = sendMode === "schedule" && scheduleDate
    ? new Date(scheduleDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  return (
    <div className="pt-20 pb-16">
      {/* ─── Hero ─── */}
      <GiftHero />

      {/* ─── How It Works ─── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-8 mt-12 relative z-10 mb-12">
        <h2 className="text-center text-heading-xl font-bold text-[#F1F5F9] mb-8">How It Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {processSteps.map((step, i) => {
            const icons = [
              <svg key="choose" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
              <svg key="personalize" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>,
              <svg key="send" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>,
              <svg key="enjoy" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
            ];
            return (
              <div key={step.step} className="p-6 rounded-2xl bg-[#111827] border border-white/[0.06] text-center transition-all duration-300 hover:border-white/[0.12] hover:shadow-lg hover:-translate-y-0.5 group">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF0F73] to-[#FF7A1A] flex items-center justify-center mx-auto mb-4 text-white shadow-[0_4px_16px_rgba(255,15,115,0.25)] group-hover:shadow-[0_4px_20px_rgba(255,15,115,0.4)] transition-all">
                  {icons[i]}
                </div>
                <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/[0.06] text-[#CBD5E1] text-xs font-bold mb-2">
                  {step.step}
                </div>
                <h3 className="text-heading-sm font-bold text-[#F1F5F9] mb-1.5">{step.title}</h3>
                <p className="text-caption text-[#CBD5E1] leading-relaxed">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Step Progress Indicator ─── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-8 mb-10">
        <div className="flex items-center justify-center gap-0">
          {processSteps.map((step, i) => {
            const stepNum = i + 1;
            const isActive = currentStep === stepNum;
            const isCompleted = currentStep > stepNum;
            return (
              <div key={step.step} className="flex items-center">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    isCompleted
                      ? "bg-gradient-to-br from-[#FF0F73] to-[#FF7A1A] text-white shadow-[0_2px_12px_rgba(255,15,115,0.35)]"
                      : isActive
                        ? "bg-gradient-to-br from-[#FF0F73] to-[#FF7A1A] text-white shadow-[0_2px_12px_rgba(255,15,115,0.35)]"
                        : "bg-[#1A2332] text-[#64748B] border border-white/[0.08]"
                  }`}>
                    {isCompleted ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    ) : (
                      step.step
                    )}
                  </div>
                  <div className={`flex flex-col ${isCompleted || isActive ? "" : "opacity-50"}`}>
                    <span className={`text-overline font-semibold tracking-wider ${
                      isCompleted || isActive ? "text-[#FF0F73]" : "text-[#64748B]"
                    }`}>
                      STEP {step.step}
                    </span>
                    <span className={`text-body-sm font-semibold ${
                      isCompleted || isActive ? "text-[#F1F5F9]" : "text-[#64748B]"
                    }`}>
                      {step.title}
                    </span>
                  </div>
                </div>
                {i < processSteps.length - 1 && (
                  <div className={`w-10 sm:w-20 h-0.5 mx-3 transition-colors duration-300 rounded-full ${
                    isCompleted ? "bg-[#FF0F73]" : "bg-white/[0.06]"
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-14">
        {/* ─── Experience Finder ─── */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-heading-xl font-bold text-[#F1F5F9]">Find the perfect gift</h2>
            <Link
              href="/experiences"
              className="text-body-sm text-[#CBD5E1] hover:text-[#F1F5F9] transition-colors flex items-center gap-1"
            >
              Browse all
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>

          {/* ─── Filters ─── */}
          <div className="flex flex-wrap items-center gap-2.5 mb-6">
            <span className="text-caption font-medium text-[#64748B] uppercase tracking-wider mr-1">Category</span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`px-4 py-2 rounded-full text-body-sm font-medium transition-all duration-200 ${
                  activeFilter === cat
                    ? "bg-[#FF0F73] text-white shadow-[0_4px_16px_rgba(255, 15, 115, 0.3)]"
                    : "bg-[#111827] border border-white/[0.08] text-[#CBD5E1] hover:bg-white/[0.05] hover:text-[#F1F5F9]"
                }`}
              >
                {cat === "Day Out" ? "Day Out" : cat}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 mb-8">
            <span className="text-caption font-medium text-[#64748B] uppercase tracking-wider mr-1">Location</span>
            {locations.slice(0, 5).map((loc) => (
              <Link
                key={loc}
                href={loc === "All" ? "/experiences" : `/experiences?location=${loc}`}
                className="px-4 py-2 rounded-full text-body-sm font-medium bg-[#111827] border border-white/[0.08] text-[#CBD5E1] hover:bg-white/[0.05] hover:text-[#F1F5F9] transition-all shadow-sm"
              >
                {loc}
              </Link>
            ))}
            <Link
              href="/experiences"
              className="px-4 py-2 rounded-full text-body-sm font-medium text-[#64748B] hover:text-[#CBD5E1] transition-all"
            >
              + More
            </Link>
          </div>

          {/* ─── Popular Gift Ideas Rail ─── */}
          <div className="mb-8">
            <h3 className="text-heading-md font-bold text-[#F1F5F9] mb-4">Popular Gift Ideas</h3>
            <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x snap-mandatory">
              {giftIdeas.map((exp) => (
                exp ? (
                  <Link
                    key={exp.id}
                    href={`/experiences/${exp.id}`}
                    className="w-60 flex-shrink-0 snap-start group"
                  >
                    <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-white/[0.05] transition-all duration-500 group-hover:scale-[1.02] group-hover:shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
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
            <h3 className="text-heading-sm font-bold text-[#F1F5F9] mb-3 text-center">What&apos;s the occasion?</h3>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {occasions.map((o) => (
                <button
                  key={o.label}
                  onClick={() => setOccasion(occasion === o.label ? null : o.label)}
                  className={`px-5 py-2.5 rounded-full text-body-sm font-medium transition-all duration-200 ${
                    occasion === o.label
                      ? "bg-[#FF0F73] text-white shadow-[0_4px_16px_rgba(255, 15, 115, 0.3)]"
                      : "bg-[#111827] border border-white/[0.08] text-[#CBD5E1] hover:bg-white/[0.05] hover:text-[#F1F5F9]"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Gift Cards (Physical ATM/Credit Card Style) ─── */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-heading-xl font-bold text-[#F1F5F9] mb-2">Gift Cards</h2>
            <p className="text-[#CBD5E1] text-body-lg">Choose an amount and surprise someone special</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-5 max-w-5xl mx-auto">
            {giftCardValues.map((card, i) => (
              <GiftCard
                key={i}
                valueLabel={card.label}
                description={card.desc}
                variantId={GIFT_CARD_VARIANTS[i].id}
                selected={selectedCard === i}
                onSelect={() => setSelectedCard(selectedCard === i ? null : i)}
                cardNumber={`•••• •••• •••• ${4829 + i * 100}`}
                expiry={`12/${27 + i}`}
                holderName="Your Gift"
              />
            ))}
          </div>
        </section>


        {/* ─── Interactive Gift Form ─── */}
        <section className="max-w-4xl mx-auto">
          <div className="bg-[#111827] rounded-2xl border border-white/[0.08] p-6 sm:p-8 shadow-sm">
            <h2 className="text-heading-lg font-bold text-[#F1F5F9] mb-6 text-center">Send Your Gift</h2>

            {/* Tab Switcher */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <button
                onClick={() => { setTab("cards"); setSelectedExp(null); }}
                className={`px-6 py-2.5 rounded-full text-body-sm font-semibold transition-all duration-200 ${
                  tab === "cards"
                    ? "bg-[#FF0F73] text-white shadow-[0_4px_16px_rgba(255, 15, 115, 0.3)]"
                    : "bg-[#111827] border border-white/[0.08] text-[#CBD5E1] hover:bg-white/[0.05] hover:text-[#F1F5F9]"
                }`}
              >
                Gift Cards
              </button>
              <button
                onClick={() => { setTab("experiences"); setSelectedCard(null); }}
                className={`px-6 py-2.5 rounded-full text-body-sm font-semibold transition-all duration-200 ${
                  tab === "experiences"
                    ? "bg-[#FF0F73] text-white shadow-[0_4px_16px_rgba(255, 15, 115, 0.3)]"
                    : "bg-[#111827] border border-white/[0.08] text-[#CBD5E1] hover:bg-white/[0.05] hover:text-[#F1F5F9]"
                }`}
              >
                Gift Experiences
              </button>
            </div>

            {/* Send Mode Toggle */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <button
                onClick={() => setSendMode("now")}
                className={`px-5 py-2 rounded-full text-caption font-medium transition-all ${
                  sendMode === "now"
                    ? "bg-[#FF0F73]/15 text-[#FF0F73] border border-[#FF0F73]/30"
                    : "bg-white/[0.05] text-[#64748B] border border-white/[0.08] hover:text-[#CBD5E1]"
                }`}
              >
                Send Now
              </button>
              <button
                onClick={() => setSendMode("schedule")}
                className={`px-5 py-2 rounded-full text-caption font-medium transition-all ${
                  sendMode === "schedule"
                    ? "bg-[#FF0F73]/15 text-[#FF0F73] border border-[#FF0F73]/30"
                    : "bg-white/[0.05] text-[#64748B] border border-white/[0.08] hover:text-[#CBD5E1]"
                }`}
              >
                Schedule for Later
              </button>
            </div>

            {/* Schedule Date Picker */}
            {sendMode === "schedule" && (
              <div className="max-w-xs mx-auto mb-6">
                <label className="block text-caption text-[#64748B] mb-1.5">Delivery Date</label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  min={tomorrow()}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#05070B] border border-white/[0.08] text-[#F1F5F9] text-body-sm focus:outline-none focus:border-[#FF0F73] focus:ring-1 focus:ring-[#FF0F73]/30 transition-all"
                />
              </div>
            )}

            {!sent ? (
              <>
                {/* Recipient Form */}
                <div className="max-w-lg mx-auto">
                  <div className="flex items-center justify-center gap-2 mb-5">
                    <button
                      onClick={() => setDelivery("email")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-body-sm font-medium transition-all ${
                        delivery === "email"
                          ? "bg-[#FF0F73] text-white"
                          : "bg-[#111827] border border-white/[0.08] text-[#CBD5E1] hover:bg-white/[0.05]"
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      Email
                    </button>
                    <button
                      onClick={() => setDelivery("whatsapp")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-body-sm font-medium transition-all ${
                        delivery === "whatsapp"
                          ? "bg-[#FF0F73] text-white"
                          : "bg-[#111827] border border-white/[0.08] text-[#CBD5E1] hover:bg-white/[0.05]"
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
                      className="w-full px-4 py-3 rounded-xl bg-[#05070B] border border-white/[0.08] text-[#F1F5F9] text-body placeholder:text-[#64748B] focus:outline-none focus:border-[#FF0F73] focus:ring-1 focus:ring-[#FF0F73]/30 transition-all"
                    />
                    <input
                      type={delivery === "email" ? "email" : "tel"}
                      placeholder={delivery === "email" ? "Recipient's email address" : "Recipient's WhatsApp number"}
                      value={recipientContact}
                      onChange={(e) => setRecipientContact(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-[#05070B] border border-white/[0.08] text-[#F1F5F9] text-body placeholder:text-[#64748B] focus:outline-none focus:border-[#FF0F73] focus:ring-1 focus:ring-[#FF0F73]/30 transition-all"
                    />
                    <input
                      type="text"
                      placeholder="Your name (sender)"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-[#05070B] border border-white/[0.08] text-[#F1F5F9] text-body placeholder:text-[#64748B] focus:outline-none focus:border-[#FF0F73] focus:ring-1 focus:ring-[#FF0F73]/30 transition-all"
                    />
                    <textarea
                      placeholder="Add a personal message (optional)"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl bg-[#05070B] border border-white/[0.08] text-[#F1F5F9] text-body placeholder:text-[#64748B] focus:outline-none focus:border-[#FF0F73] focus:ring-1 focus:ring-[#FF0F73]/30 transition-all resize-none"
                    />
                  </div>

                  {/* Summary */}
                  <div className="p-4 rounded-xl bg-[#1A2332] border border-white/[0.08] mb-5">
                    <p className="text-caption text-[#CBD5E1] mb-1">Gift summary</p>
                    <div className="flex items-center justify-between">
                      <span className="text-body-sm text-[#CBD5E1]">
                        {tab === "cards" && selectedCard !== null
                          ? `Gift Card — ${giftCardValues[selectedCard].label}`
                          : tab === "experiences" && selectedExp
                            ? `Experience — ${experiences.find((e) => e.id === selectedExp)?.title}`
                            : "Select a gift above"}
                      </span>
                      <span className="text-heading-sm font-bold text-[#F1F5F9]">
                        {selectedValue > 0 ? `MK ${selectedValue.toLocaleString()}` : ""}
                      </span>
                    </div>
                    {occasion && (
                      <p className="text-caption text-[#CBD5E1] mt-2">&#183; {occasion}</p>
                    )}
                    {sendMode === "schedule" && scheduleLabel && (
                      <p className="text-caption text-[#FF0F73] mt-1 flex items-center gap-1">
                        Delivering {scheduleLabel}
                      </p>
                    )}
                    {message && (
                      <p className="text-caption text-[#CBD5E1] mt-1 italic line-clamp-1">&ldquo;{message}&rdquo;</p>
                    )}
                  </div>

                  {giftError && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 mb-4">
                      <p className="text-body-sm text-red-300">{giftError}</p>
                    </div>
                  )}

                  {payError && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 mb-4">
                      <p className="text-body-sm text-red-300">{payError}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <button
                      onClick={handleContinueToPayment}
                      disabled={!canSend || paying}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#FF0F73] to-[#FF7A1A] text-white font-semibold text-body-sm hover:shadow-[0_4px_16px_rgba(255, 15, 115, 0.3)] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {paying ? (
                        <>
                          <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          Connecting to PayChangu...
                        </>
                      ) : (
                        <>
                          Continue to Payment — MK {selectedValue.toLocaleString()}
                        </>
                      )}
                    </button>
                    <p className="text-caption text-[#64748B] text-center">You will be redirected to PayChangu to complete payment</p>
                  </div>
                </div>
              </>
            ) : (
              /* ─── Success State with ATM-style Card ─── */
              <div className="max-w-lg mx-auto text-center py-6">
                <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-4 shadow-[0_4px_16px_rgba(16,185,129,0.3)]">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h2 className="text-heading-lg font-bold text-[#F1F5F9] mb-1">
                  {sendMode === "schedule" ? "Gift Scheduled!" : "Gift Sent!"}
                </h2>
                <p className="text-[#CBD5E1] text-body-sm mb-6">
                  {sendMode === "schedule"
                    ? `Your gift will be delivered to ${recipientName} on ${scheduleLabel} via ${delivery === "email" ? "email" : "WhatsApp"}.`
                    : `Your gift has been delivered to ${recipientName} via ${delivery === "email" ? "email" : "WhatsApp"}.`
                  }
                </p>

                {/* ATM-style Gift Card (Premium) */}
                <div className="max-w-sm mx-auto mb-6 perspective-[1000px]" ref={cardRef}>
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#FF0F73] via-[#FF5B3A] to-[#FFA22C] border border-white/10 shadow-2xl transition-all duration-500 hover:rotate-y-[-2deg]">
                    {/* Premium decorative elements */}
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/[0.07] rounded-full -translate-y-1/3 translate-x-1/3 blur-none" />
                    <div className="absolute bottom-0 left-0 w-36 h-36 bg-black/[0.05] rounded-full translate-y-1/3 -translate-x-1/3" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.12)_0%,transparent_60%)]" />
                    <div className="absolute bottom-6 right-6 w-20 h-20 bg-white/[0.04] rounded-full" />
                    <div className="absolute top-1/3 -left-8 w-16 h-16 bg-white/[0.03] rounded-full blur-sm" />
                    {/* Shimmer line */}
                    <div className="absolute inset-0 bg-[linear-gradient(105deg,transparent_30%,rgba(255,255,255,0.08)_45%,rgba(255,255,255,0.12)_50%,rgba(255,255,255,0.08)_55%,transparent_70%)] pointer-events-none" />

                    <div className="relative z-10 p-6">
                      {/* Top: Chip + Brand */}
                      <div className="flex items-start justify-between mb-5">
                        <div className="flex flex-col gap-2">
                          <div className="w-10 h-7 rounded bg-gradient-to-br from-yellow-200 to-yellow-400 shadow-inner border border-white/10" />
                          <div className="flex -space-x-1.5">
                            <div className="w-6 h-4 rounded border border-white/30" />
                            <div className="w-6 h-4 rounded border border-white/30" />
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-white/80 uppercase tracking-[0.15em]">Experio</p>
                          <p className="text-[8px] text-white/50 tracking-wider uppercase">Gift Card</p>
                        </div>
                      </div>

                      {/* Value */}
                      <p className="text-2xl font-bold text-white mb-1 drop-shadow-sm">
                        {tab === "cards" && selectedCard !== null ? giftCardValues[selectedCard].label : "Gift Experience"}
                      </p>

                      {/* Card number */}
                      <p className="text-sm font-mono tracking-[0.2em] text-white/70 mb-5">
                        {tab === "cards" && selectedCard !== null
                          ? `•••• •••• •••• ${4829 + (selectedCard * 100)}`
                          : `•••• •••• •••• ${redemptionCode.slice(-4)}`
                        }
                      </p>

                      {/* Redemption Code + QR Row */}
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] text-white/50 uppercase tracking-wider mb-0.5">Redemption Code</p>
                          <p className="text-sm font-mono font-bold text-[#F1F5F9] tracking-wider break-all">{redemptionCode}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center gap-1">
                              <p className="text-[9px] text-white/40 uppercase">TO</p>
                              <p className="text-xs font-medium text-white/80">{recipientName}</p>
                            </div>
                            <span className="text-white/20">|</span>
                            <div className="flex items-center gap-1">
                              <p className="text-[9px] text-white/40 uppercase">FROM</p>
                              <p className="text-xs font-medium text-white/60">{senderName}</p>
                            </div>
                          </div>
                        </div>
                        {qrDataUrl && (
                          <div className="flex-shrink-0">
                            <Image src={qrDataUrl} alt="QR Code" width={85} height={85} className="rounded-lg bg-white p-1.5 shadow-lg" />
                          </div>
                        )}
                      </div>

                      {/* Bottom: valid thru */}
                      <div className="flex items-center justify-between pt-3 border-t border-white/[0.12]">
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-1">
                            <div className="w-5 h-3.5 rounded bg-gradient-to-br from-yellow-200/60 to-yellow-400/60 border border-white/10" />
                            <div className="w-5 h-3.5 rounded bg-gradient-to-br from-red-300/60 to-red-500/60 border border-white/10" />
                          </div>
                          <p className="text-[9px] text-white/40 font-mono">12/27</p>
                        </div>
                        <p className="text-[9px] text-white/40">Valid: 12 months</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions Row */}
                <div className="flex items-center justify-center gap-3 mb-6 flex-wrap">
                  <button
                    onClick={handleDownloadCard}
                    disabled={!qrDataUrl}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#FF0F73] to-[#FF7A1A] text-white font-semibold text-body-sm hover:shadow-[0_4px_16px_rgba(255, 15, 115, 0.3)] transition-all disabled:opacity-40 flex items-center gap-2"
                  >
                    Download Card (PNG)
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#FF0F73] to-[#FF7A1A] text-white font-semibold text-body-sm hover:shadow-[0_4px_16px_rgba(255, 15, 115, 0.3)] transition-all flex items-center gap-2"
                  >
                    Download PDF
                  </button>
                  <button
                    onClick={() => { navigator.clipboard.writeText(redemptionCode); }}
                    className="px-6 py-2.5 rounded-xl bg-[#111827] border border-white/[0.08] text-[#CBD5E1] font-semibold text-body-sm hover:bg-white/[0.05] transition-all flex items-center gap-2"
                  >
                    Copy Code
                  </button>
                </div>
                <p className="text-caption text-[#64748B] mb-6 max-w-xs mx-auto">
                  {sendMode === "schedule"
                    ? `The gift card will be sent to ${recipientName} on ${scheduleLabel}.`
                    : `Share the card or code with ${recipientName}. They can scan the QR or enter the code at checkout.`
                  }
                </p>
                <button
                  onClick={handleReset}
                  className="px-6 py-2.5 rounded-xl bg-white/[0.06] text-[#CBD5E1] font-semibold text-body-sm hover:bg-white/[0.1] transition-all"
                >
                  Send Another Gift
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ─── Track & Redeem ─── */}
        <TrackRedeem />
      </div>
    </div>
  );
}
