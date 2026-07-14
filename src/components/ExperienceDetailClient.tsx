"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Experience, Review } from "@/lib/types";
import { trackView, trackBooked, trackSaved } from "@/lib/recommendation-engine";
import { calculatePoints, calculateTier, addPointsLocally, TIER_MAP } from "@/lib/loyalty-engine";
import { sendBookingConfirmationEmail } from "@/lib/delivery-email";

import BookingCalendar from "./BookingCalendar";
import GuestSelector from "./GuestSelector";
import BookingConfirmed from "./BookingConfirmed";
import ReviewCard from "./ReviewCard";
import ContentRail from "./ContentRail";
import AuthModal from "./AuthModal";
import ReviewForm from "./ReviewForm";
import LocationMap from "./LocationMap";

// ─── Props ───
interface Props {
  experience: Experience;
  similarExperiences: Experience[];
}

// ─── Main Component ───
export default function ExperienceDetailClient({ experience: exp, similarExperiences }: Props) {
  const [activeImage, setActiveImage] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [guests, setGuests] = useState(2);
  const [saved, setSaved] = useState(false);
  const [shareFeedback, setShareFeedback] = useState(false);
  const [booking, setBooking] = useState(false);
  const [bookingDone, setBookingDone] = useState(false);
  const [bookedDate, setBookedDate] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [giftCode, setGiftCode] = useState("");
  const [giftApplied, setGiftApplied] = useState(false);
  const [giftAmount, setGiftAmount] = useState(0);
  const [giftChecking, setGiftChecking] = useState(false);
  const [giftError, setGiftError] = useState("");
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [tierUpgrade, setTierUpgrade] = useState<string | null>(null);
  const [bookingRef, setBookingRef] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [contactError, setContactError] = useState("");
  const [reviewSort, setReviewSort] = useState<"recent" | "highest" | "lowest">("recent");
  const [payWithWallet, setPayWithWallet] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const router = useRouter();

  // Track view on mount
  useEffect(() => { trackView(exp.id); }, [exp.id]);

  // Fetch wallet balance to enable wallet payment option
  useEffect(() => {
    const token = localStorage.getItem("experio-auth-token");
    if (!token) return;
    fetch("/api/wallet", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => { if (data?.balance != null) setWalletBalance(data.balance); })
      .catch(() => { /* silent — wallet option simply won't show */ });
  }, []);

  // Load local reviews and merge with exp.reviews
  const allReviews = useMemo(() => {
    const local: Review[] = [];
    try {
      const key = `EXPERIO-reviews-${exp.id}`;
      const raw = localStorage.getItem(key);
      if (raw) local.push(...JSON.parse(raw));
    } catch { /* ignore */ }
    return [...local, ...exp.reviews];
  }, [exp.id, exp.reviews]);

  const sortedReviews = useMemo(() => {
    const sorted = [...allReviews];
    switch (reviewSort) {
      case "recent":  sorted.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)); break;
      case "highest": sorted.sort((a, b) => b.rating - a.rating); break;
      case "lowest":  sorted.sort((a, b) => a.rating - b.rating); break;
    }
    return sorted;
  }, [allReviews, reviewSort]);

  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({ title: exp.title, url: window.location.href }).catch((err) => console.warn("Share failed:", err));
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => {
        setShareFeedback(true);
        setTimeout(() => setShareFeedback(false), 2000);
      });
    }
  }, [exp.title]);

  const handleBookNow = async () => {
    if (!selectedDate) return;
    // Require at least one contact method
    if (!contactPhone.trim() && !contactEmail.trim()) {
      setContactError("Please provide a phone number or email address");
      return;
    }
    setContactError("");
    const token = localStorage.getItem("experio-auth-token");
    if (!token) { setAuthOpen(true); return; }
    setBooking(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          experience_id: exp.id,
          guests_count: guests,
          total_price: exp.price * guests,
          experience_date: selectedDate.toISOString().split("T")[0],
          special_requests: specialRequests || undefined,
          contact_phone: contactPhone || undefined,
          contact_email: contactEmail || undefined,
          ...(payWithWallet ? { pay_with_wallet: true } : {}),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        trackBooked(exp.id);

        // Award loyalty points (fire and forget)
        const pts = calculatePoints(exp.price * guests);
        const loyaltyUpdate = addPointsLocally(pts, "booking");

        // Send booking confirmation email (async, non-blocking)
        const emailTarget = contactEmail || data?.user?.email || "";
        if (emailTarget) {
          sendBookingConfirmationEmail({
            email: emailTarget,
            guestName: data?.user?.name || "Guest",
            experienceTitle: exp.title,
            experienceDate: selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
            experienceTime: exp.duration,
            guests: guests,
            totalPrice: exp.price * guests,
            currency: exp.currency,
            bookingId: data.id,
            location: exp.location,
            partnerName: exp.partner,
          }).catch((err) => console.warn("Confirmation email failed:", err));
        }

        // If paid with wallet, booking is instantly confirmed — show confirmation directly
        if (data.status === "confirmed") {
          setBookedDate(selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }));
          setBookingRef(data.booking_ref || data.id.slice(0, 8).toUpperCase());
          setEarnedPoints(pts);
          const newTier = calculateTier(loyaltyUpdate.lifetimePoints);
          if (newTier.tier !== loyaltyUpdate.tier) setTierUpgrade(newTier.tier);
          setBookingDone(true);
        } else {
          // Redirect to booking detail page for payment (PayChangu)
          router.push(`/bookings/${data.id}`);
        }
        return;
      }
    } catch (e) {
      console.error("Booking failed", e);
    } finally {
      setBooking(false);
    }
  };

  const handleApplyGiftCard = async () => {
    if (!giftCode.trim()) return;
    setGiftChecking(true);
    setGiftError("");
    try {
      const token = localStorage.getItem("experio-auth-token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`/api/gift-cards/check?code=${encodeURIComponent(giftCode)}`, { headers });
      const data = await res.json();
      if (res.ok && data) {
        const balance = data.balance || data.amount || 0;
        if (balance <= 0) { setGiftError("This gift card has no remaining balance"); return; }
        setGiftAmount(Math.min(balance, exp.price * guests));
        setGiftApplied(true);
      } else {
        setGiftError(data?.error || "Invalid gift card code");
      }
    } catch {
      setGiftError("Could not verify gift card. Please try again.");
    } finally {
      setGiftChecking(false);
    }
  };

  const gotoNearby = () => { router.push("/experiences?nearby=true"); };

  // ─── Booking Confirmed State ───
  if (bookingDone) {
    return (
      <BookingConfirmed
        title={exp.title}
        bookedDate={bookedDate}
        guests={guests}
        totalPrice={exp.price * guests}
        earnedPoints={earnedPoints}
        tierUpgrade={tierUpgrade}
        experienceDate={selectedDate?.toISOString()}
        location={exp.location}
        duration={exp.duration}
        bookingRef={bookingRef}
      />
    );
  }

  // ─── Ratings Breakdown ───
  const ratingBreakdown = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    exp.reviews.forEach((r) => {
      const k = Math.round(r.rating) as keyof typeof counts;
      if (k >= 1 && k <= 5) counts[k]++;
    });
    const total = exp.reviews.length || 1;
    return Object.entries(counts)
      .reverse()
      .map(([star, count]) => ({ star: Number(star), count, pct: (count / total) * 100 }));
  }, [exp.reviews]);

  const totalPrice = exp.price * guests;
  const finalPrice = Math.max(0, totalPrice - giftAmount);

  // ─── Render ───
  return (
    <div className="bg-ambient-warm min-h-screen">
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}

      {/* ════════════════════════════════════════════ */}
      {/* HERO GALLERY                                */}
      {/* ════════════════════════════════════════════ */}
      <section id="hero-gallery" className="relative">
        <div className="relative h-[55vh] sm:h-[70vh] md:h-[80vh] overflow-hidden">
          {exp.images.slice(0, 5).map((img, i) => (
            <Image
              key={i}
              src={img}
              alt={`${exp.title} - Image ${i + 1}`}
              fill
              className={`object-cover transition-all duration-700 ease-out ${i === activeImage ? "opacity-100 scale-100" : "opacity-0 scale-105 pointer-events-none"}`}
              sizes="100vw"
              priority={i === 0}
              loading={i === 0 ? undefined : "lazy"}
            />
          ))}
          {/* Overlay gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#05070B]/70 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent" />

          {/* Top bar: Back + Save + Share */}
          <div className="absolute top-20 left-4 sm:left-8 right-4 sm:right-8 flex items-start justify-between z-10">
            <Link
              href="/experiences"
              className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-white text-body-sm font-medium border border-white/[0.15] hover:bg-white/20 transition-all"
            >
              ← Back
            </Link>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { trackSaved(exp.id, !saved); setSaved(!saved); }}
                className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md border transition-all ${
                  saved
                    ? "bg-[#FF0F73] text-white border-[#FF0F73]"
                    : "bg-white/10 text-white border-white/[0.15] hover:bg-white/20"
                }`}
                aria-label={saved ? "Unsave" : "Save"}
              >
                <svg className="w-4 h-4" fill={saved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
              <button
                onClick={handleShare}
                className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/[0.15] hover:bg-white/20 transition-all flex items-center justify-center"
                aria-label="Share"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
            </div>
          </div>

          {/* "Show all photos" button - only shown when more than 5 exist */}
          {exp.images.length > 5 && (
            <button
              onClick={() => { setActiveImage(0); document.getElementById("hero-gallery")?.scrollIntoView({ behavior: "smooth" }); }}
              className="absolute bottom-24 right-4 sm:right-8 z-10 px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md text-white text-caption font-medium border border-white/[0.15] hover:bg-white/20 transition-all"
            >
              Show all {exp.images.length} photos
            </button>
          )}
        </div>

        {/* Thumbnail strip */}
        <div className="absolute bottom-4 left-4 sm:left-8 right-4 sm:right-8 z-30 pointer-events-none">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1 pointer-events-auto">
            {exp.images.slice(0, 5).map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                aria-label={`View image ${i + 1}`}
                className={`relative w-16 h-12 sm:w-20 sm:h-14 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all duration-200 ${
                  i === activeImage
                    ? "border-white ring-2 ring-white/60 shadow-lg"
                    : "border-white/50 hover:border-white"
                }`}
              >
                <Image src={img} alt="" fill className="object-cover pointer-events-none" sizes="80px" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════ */}
      {/* MAIN LAYOUT: Content + Sidebar              */}
      {/* ════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:grid lg:grid-cols-3 lg:gap-10 relative -mt-8 sm:-mt-8 lg:-mt-8 z-20">

        {/* ─── LEFT COLUMN: Content ─── */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-white/[0.1] p-5 sm:p-8 mb-6">
            {/* Mood Tags */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {exp.mood.map((m) => (
                <span key={m} className="px-3 py-1 rounded-full bg-white/[0.06] text-caption text-[#CBD5E1] border border-white/[0.1] font-medium">
                  {m}
                </span>
              ))}
            </div>

            {/* Title + Subtitle */}
            <h1 className="text-display-sm font-bold text-white mb-1 leading-tight">{exp.title}</h1>
            <p className="text-[#CBD5E1] text-heading-md mb-5">{exp.subtitle}</p>

            {/* Stats Bar */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-6 pb-6 border-b border-white/[0.1]">
              <div className="flex items-center gap-1.5 text-body-sm text-[#CBD5E1]">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {exp.location}
                {exp.city && <><span className="text-[#64748B]">·</span><span className="text-[#64748B]">{exp.city}</span></>}
                {exp.distance && <><span className="text-[#64748B]">·</span><span className="text-[#64748B]">{exp.distance}</span></>}
              </div>
              <div className="flex items-center gap-1.5 text-body-sm text-[#CBD5E1]">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {exp.duration}
              </div>
              <div className="flex items-center gap-1.5 text-body-sm">
                <span className="text-yellow-400">★</span>
                <span className="text-white font-semibold">{exp.rating}</span>
                <span className="text-[#64748B]">({exp.reviewCount} reviews)</span>
              </div>
            </div>

            {/* Mobile: Quick Booking Summary */}
            <div className="lg:hidden flex items-center justify-between p-4 rounded-xl border border-white/[0.1] mb-6">
              <div>
                <p className="text-caption text-[#64748B]">From</p>
                <p className="text-heading-lg font-bold text-white">MK {exp.price.toLocaleString()}</p>
                <p className="text-caption text-[#64748B]">per person</p>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-caption text-[#64748B]">Guests:</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setGuests(Math.max(1, guests - 1))} disabled={guests <= 1} className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-white text-sm disabled:opacity-30 hover:bg-white/10">−</button>
                    <span className="w-5 text-center text-body-sm text-white font-medium">{guests}</span>
                    <button onClick={() => setGuests(Math.min(exp.capacity, guests + 1))} disabled={guests >= exp.capacity} className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-white text-sm disabled:opacity-30 hover:bg-white/10">+</button>
                  </div>
                </div>
                <button
                  onClick={handleBookNow}
                  disabled={!selectedDate || booking}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#FF0F73] to-[#FF7A1A] text-white font-semibold text-body-sm hover:shadow-[0_4px_24px_rgba(255, 15, 115, 0.25)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {booking ? "Booking..." : selectedDate ? "Book Now" : "Select Date"}
                </button>
              </div>
            </div>

            {/* Host Section */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-white/[0.1] mb-6 hover:bg-white/[0.03] transition-all">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF0F73] to-[#FF7A1A] flex items-center justify-center text-white font-bold text-body-sm flex-shrink-0">
                  {exp.partner.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                </div>
                <div>
                  <p className="text-caption text-[#64748B]">Hosted by</p>
                  <p className="text-body-sm font-semibold text-white">{exp.partner}</p>
                </div>
              </div>
              <button className="px-4 py-2 rounded-xl border border-white/[0.1] text-body-sm font-medium text-white hover:bg-white/5 transition-all">
                Message
              </button>
            </div>

            {/* About */}
            <div className="mb-6">
              <h2 className="text-heading-md font-bold text-white mb-3">About this experience</h2>
              <p className="text-[#CBD5E1] text-body leading-relaxed">{exp.description}</p>
            </div>

            {/* What's Included */}
            <div className="mb-6">
              <h2 className="text-heading-md font-bold text-white mb-4">What&apos;s included</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {exp.includes.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.1]">
                    <div className="w-5 h-5 rounded-full bg-[#FF0F73] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="text-body-sm text-[#CBD5E1]">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ═══ Reviews Section ═══ */}
            <div className="mb-6 pt-4 border-t border-white/[0.1]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-heading-md font-bold text-white flex items-center gap-2">
                  <span className="text-yellow-400 text-heading">★</span>
                  <span>{exp.rating}</span>
                  <span className="text-[#64748B] font-normal text-body-sm">· {allReviews.length} reviews</span>
                </h2>
                {/* Sort Controls */}
                <div className="flex items-center gap-1 bg-white/[0.04] rounded-lg p-0.5 border border-white/[0.06]">
                  {([["recent", "Recent"], ["highest", "Highest"], ["lowest", "Lowest"]] as const).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setReviewSort(key)}
                      className={`px-2.5 py-1 rounded-md text-caption font-medium transition-all ${
                        reviewSort === key
                          ? "bg-[#FF0F73]/20 text-[#FF0F73]"
                          : "text-[#64748B] hover:text-white"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Star Breakdown Bars */}
              <div className="space-y-2 mb-6 p-4 rounded-xl bg-white/[0.03] border border-white/[0.1]">
                {ratingBreakdown.map(({ star, count, pct }) => (
                  <div key={star} className="flex items-center gap-3">
                    <span className="text-caption font-medium text-[#64748B] w-6 text-right">{star}</span>
                    <svg className="w-3.5 h-3.5 text-yellow-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <div className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#FF0F73] transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-caption text-[#64748B] w-8">{count}</span>
                  </div>
                ))}
              </div>

              {/* Review Cards */}
              <div className="space-y-4">
                {sortedReviews.map((review) => (
                  <ReviewCard key={review.id} author={review.author} avatar={review.avatar} rating={review.rating} date={review.date} text={review.text} photos={review.photos} verified={review.verified} />
                ))}
              </div>

              {allReviews.length === 0 && (
                <div className="text-center py-8 text-[#64748B] text-body-sm">
                  No reviews yet. Be the first to share your experience!
                </div>
              )}

              {showReviewForm ? (
                <div className="mt-4">
                  <ReviewForm
                    experienceId={exp.id}
                    onSubmitted={() => setShowReviewForm(false)}
                    onCancel={() => setShowReviewForm(false)}
                  />
                </div>
              ) : (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="mt-4 px-6 py-2.5 rounded-xl border border-white/[0.1] text-body-sm font-medium text-white hover:bg-white/5 transition-all flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  Write a Review
                </button>
              )}
            </div>

            {/* Map */}
            <div className="mb-6 pt-4 border-t border-white/[0.1]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-heading-md font-bold text-white">Location</h2>
                <button onClick={gotoNearby} className="text-body-sm text-[#FF0F73] font-medium hover:text-[#FF7A1A] transition-colors">
                  Find nearby
                </button>
              </div>
              <LocationMap
                lat={exp.coordinates.lat}
                lng={exp.coordinates.lng}
                location={exp.location}
                city={exp.city}
              />
            </div>

            {/* Mobile Actions */}
            <div className="lg:hidden flex flex-col gap-3 pt-2">
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => { trackSaved(exp.id, !saved); setSaved(!saved); }}
                  className={`px-4 py-3 rounded-xl border transition-all text-body-sm font-medium ${
                    saved
                      ? "border-[#FF0F73] text-[#FF0F73] bg-[#FF0F73]/10"
                      : "border-white/[0.1] text-[#CBD5E1] hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {saved ? "♥ Saved" : "♥ Save"}
                </button>
                <Link
                  href={`/gift?exp=${exp.id}`}
                  className="px-4 py-3 rounded-xl border border-white/[0.1] text-[#CBD5E1] text-body-sm font-medium text-center hover:bg-white/5 hover:text-white transition-all"
                >
                  ▩ Gift
                </Link>
                <button
                  onClick={handleShare}
                  className="px-4 py-3 rounded-xl border border-white/[0.1] text-[#CBD5E1] text-body-sm font-medium hover:bg-white/5 hover:text-white transition-all"
                >
                  {shareFeedback ? "Copied" : "↗ Share"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ─── RIGHT COLUMN: Sticky Booking Sidebar ─── */}
        <div className="hidden lg:block">
          <div className="sticky top-24">
            <div className="bg-[#111827] rounded-2xl border border-white/[0.1]">
              {/* Price Header */}
              <div className="p-6 pb-4 border-b border-white/[0.1]">
                <div className="flex items-baseline gap-1">
                  <span className="text-heading-lg font-bold text-white">MK {exp.price.toLocaleString()}</span>
                  <span className="text-caption text-[#64748B]">/ person</span>
                </div>
              </div>

              <div className="p-6 pt-4 space-y-4">
                {/* Calendar */}
                <div>
                  <p className="text-body-sm font-semibold text-white mb-2">Select date</p>
                  <BookingCalendar selectedDate={selectedDate} onSelect={setSelectedDate} />
                </div>

                {/* Guest Selector */}
                <GuestSelector value={guests} onChange={setGuests} maxGuests={exp.capacity} />

                {/* Special Requests */}
                <div>
                  <p className="text-body-sm font-semibold text-white mb-2">Special Requests</p>
                  <textarea
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    maxLength={200}
                    placeholder="Any special requests?"
                    className="w-full px-3 py-2 rounded-lg bg-[#0A0E17] border border-white/[0.1] text-white text-caption placeholder:text-[#64748B] focus:outline-none focus:border-[#FF0F73] transition-all resize-none h-16"
                  />
                  <p className="text-caption text-[#64748B] mt-1 text-right">{specialRequests.length}/200</p>
                </div>

                {/* Contact Fields */}
                <div className="space-y-2">
                  <p className="text-body-sm font-semibold text-white mb-1">Contact <span className="text-[#FF0F73]">*</span></p>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => { setContactPhone(e.target.value); if (contactError) setContactError(""); }}
                    placeholder="Phone number"
                    className={`w-full px-3 py-2 rounded-lg bg-[#0A0E17] border text-white text-caption placeholder:text-[#64748B] focus:outline-none focus:border-[#FF0F73] transition-all ${
                      contactError && !contactPhone.trim() && !contactEmail.trim() ? "border-red-500/50" : "border-white/[0.1]"
                    }`}
                  />
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => { setContactEmail(e.target.value); if (contactError) setContactError(""); }}
                    placeholder="Email address"
                    className={`w-full px-3 py-2 rounded-lg bg-[#0A0E17] border text-white text-caption placeholder:text-[#64748B] focus:outline-none focus:border-[#FF0F73] transition-all ${
                      contactError && !contactPhone.trim() && !contactEmail.trim() ? "border-red-500/50" : "border-white/[0.1]"
                    }`}
                  />
                  {contactError && (
                    <p className="text-caption text-red-500 flex items-center gap-1">
                      <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                      {contactError}
                    </p>
                  )}
                </div>

                {/* Gift Card */}
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.1]">
                  <p className="text-caption font-semibold text-[#64748B] mb-2 uppercase tracking-wider">Gift Card</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="XPRO-XXXXXXXX"
                      value={giftCode}
                      onChange={(e) => { setGiftCode(e.target.value.toUpperCase()); setGiftApplied(false); setGiftError(""); }}
                      className="flex-1 px-3 py-2 rounded-lg bg-[#0A0E17] border border-white/[0.1] text-white text-caption font-mono placeholder:text-[#64748B] focus:outline-none focus:border-[#FF0F73] transition-all"
                      disabled={giftApplied}
                    />
                    {giftApplied ? (
                      <button
                        onClick={() => { setGiftApplied(false); setGiftCode(""); setGiftAmount(0); setGiftError(""); }}
                        className="px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 text-caption font-semibold border border-emerald-500/30 hover:bg-emerald-500/30 transition-all whitespace-nowrap"
                      >
                        ✓ Applied
                      </button>
                    ) : (
                      <button
                        onClick={handleApplyGiftCard}
                        disabled={!giftCode.trim() || giftChecking}
                        className="px-3 py-2 rounded-lg bg-[#FF0F73] text-white text-caption font-semibold hover:bg-[#FF0F73]/80 transition-all disabled:opacity-50 whitespace-nowrap"
                      >
                        {giftChecking ? (
                          <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        ) : "Apply"}
                      </button>
                    )}
                  </div>
                  {giftError && <p className="text-caption text-red-500 mt-1.5">{giftError}</p>}
                </div>

                {/* Wallet Payment — hidden when gift card covers full amount */}
                {walletBalance !== null && walletBalance >= finalPrice && finalPrice > 0 && (
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.1]">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={payWithWallet}
                        onChange={(e) => setPayWithWallet(e.target.checked)}
                        className="w-4 h-4 rounded border-white/20 bg-[#0A0E17] text-[#FF0F73] focus:ring-[#FF0F73] focus:ring-offset-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-caption font-semibold text-white">Pay with Experio Wallet</p>
                        <p className="text-caption text-[#64748B]">Balance: MK {walletBalance.toLocaleString()}</p>
                      </div>
                      <span className="text-emerald-400 text-caption font-medium">Instant confirm</span>
                    </label>
                    {walletBalance < finalPrice && (
                      <p className="text-caption text-[#64748B] mt-1.5">Insufficient wallet balance for this booking</p>
                    )}
                  </div>
                )}

                {/* Price Breakdown */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-body-sm text-[#CBD5E1]">
                    <span>MK {exp.price.toLocaleString()} × {guests} {guests === 1 ? "guest" : "guests"}</span>
                    <span>MK {totalPrice.toLocaleString()}</span>
                  </div>
                  {giftApplied && giftAmount > 0 && (
                    <div className="flex items-center justify-between text-body-sm text-emerald-400">
                      <span>Gift card discount</span>
                      <span>-MK {giftAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.1]">
                    <span className="text-body-sm font-semibold text-white">Total</span>
                    <span className="text-heading-sm font-bold text-white">MK {finalPrice.toLocaleString()}</span>
                  </div>
                </div>

                {/* Book Now */}
                <button
                  onClick={handleBookNow}
                  disabled={!selectedDate || booking}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#FF0F73] to-[#FF7A1A] text-white font-semibold text-body-sm hover:shadow-[0_4px_24px_rgba(255, 15, 115, 0.3)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {booking ? (
                    <>
                      <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Booking...
                    </>
                  ) : selectedDate ? (
                    "Book Now"
                  ) : (
                    "Select a date"
                  )}
                </button>

                <p className="text-caption text-[#64748B] text-center">You won&apos;t be charged yet</p>

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                onClick={() => { trackSaved(exp.id, !saved); setSaved(!saved); }}
                    className={`py-2.5 rounded-xl border transition-all text-caption font-medium flex items-center justify-center gap-1 ${
                      saved
                        ? "border-[#FF0F73] text-[#FF0F73] bg-[#FF0F73]/10"
                        : "border-white/[0.1] text-[#CBD5E1] hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill={saved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    Save
                  </button>
                  <Link
                    href={`/gift?exp=${exp.id}`}
                    className="py-2.5 rounded-xl border border-white/[0.1] text-[#CBD5E1] text-caption font-medium text-center hover:bg-white/5 hover:text-white transition-all flex items-center justify-center gap-1"
                  >
                    ▩ Gift
                  </Link>
                  <button
                    onClick={handleShare}
                    className="py-2.5 rounded-xl border border-white/[0.1] text-[#CBD5E1] text-caption font-medium hover:bg-white/5 hover:text-white transition-all flex items-center justify-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Share
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════ */}
      {/* SIMILAR EXPERIENCES                          */}
      {/* ════════════════════════════════════════════ */}
      <div className="mt-8 pb-12">
        <ContentRail
          title="Similar Experiences"
          experiences={similarExperiences}
          viewAllHref="/experiences"
        />
      </div>
    </div>
  );
}
