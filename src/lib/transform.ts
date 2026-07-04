import { Experience, Review } from "./types";
import { getIntentionsForExperience } from "./intentions";

const CITY_MAP: Record<string, string> = {
  "Cape Maclear": "Lilongwe",
  Lilongwe: "Lilongwe",
  Salima: "Lilongwe",
  Blantyre: "Blantyre",
  Mangochi: "Blantyre",
  Zomba: "Blantyre",
  Dedza: "Lilongwe",
  Liwonde: "Blantyre",
  Nkhotakota: "Lilongwe",
  Mzuzu: "Mzuzu",
};

const AFRICAN_CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  Lilongwe: { lat: -13.9626, lng: 33.7741 },
  Blantyre: { lat: -15.7861, lng: 35.0058 },
  Lusaka: { lat: -15.4167, lng: 28.2833 },
  Harare: { lat: -17.8252, lng: 31.0335 },
  Johannesburg: { lat: -26.2041, lng: 28.0473 },
  "Dar es Salaam": { lat: -6.7924, lng: 39.2083 },
  Nairobi: { lat: -1.2921, lng: 36.8219 },
  Mzuzu: { lat: -11.4656, lng: 34.0207 },
};

function nearestCity(location: string): string {
  return CITY_MAP[location] || "Lilongwe";
}

function getCoords(location: string): { lat: number; lng: number } {
  return AFRICAN_CITY_COORDS[location] || AFRICAN_CITY_COORDS["Lilongwe"];
}

/** Transform a raw API experience shape into the app's `Experience` type. */
export function transformExperience(raw: Record<string, unknown>): Experience {
  const images = (raw.images as Array<{ url: string; alt?: string; is_primary?: boolean; sort_order?: number }>) ?? [];
  const partner = raw.partner as { business_name?: string; business_logo?: string; business_city?: string } | null;
  const moods = (raw.moods as Array<{ mood_id?: number; moods?: { id?: number; label?: string; emoji?: string } }>) ?? [];
  const rawReviews = (raw.reviews as Array<Record<string, unknown>>) ?? [];

  const primary = images.find((i) => i.is_primary)?.url ?? images[0]?.url;
  const location = (raw.location as string) || "";
  const city = nearestCity(location);

  const reviews: Review[] = rawReviews.map((r, i) => ({
    id: (r.id as string) ?? `review-${i}`,
    author: ((r.user as { full_name?: string })?.full_name) ?? "Anonymous",
    avatar: ((r.user as { avatar_url?: string })?.avatar_url) ?? "",
    rating: (r.rating as number) ?? 0,
    date: (r.created_at as string) ?? "",
    text: (r.text as string) ?? "",
  }));

  const parsedMood = moods.map((m) => m.moods?.label).filter(Boolean) as Experience["mood"];
  const rawIntentions = raw.intentions as Experience["intentions"] | undefined;
  const intentions: Experience["intentions"] = rawIntentions?.length
    ? rawIntentions
    : getIntentionsForExperience({
        category: (raw.category as Experience["category"]) ?? "Date Night",
        mood: parsedMood,
      });

  return {
    id: raw.id as string,
    title: raw.title as string,
    subtitle: raw.subtitle as string,
    description: raw.description as string,
    image: primary ?? "",
    images: images.map((i) => i.url).filter(Boolean) as string[],
    price: (raw.price as number) ?? 0,
    currency: (raw.currency as string) ?? "MWK",
    partner: partner?.business_name ?? "",
    location,
    city,
    distance: (raw.distance as string) ?? "",
    duration: (raw.duration as string) ?? "",
    mood: parsedMood,
    intentions,
    emotionalHeadline: (raw.emotionalHeadline as string) ?? undefined,
    rating: (raw.rating as number) ?? 0,
    reviewCount: (raw.review_count as number) ?? reviews.length,
    category: (raw.category as Experience["category"]) ?? "Date Night",
    featured: (raw.featured as boolean) ?? false,
    includes: (raw.includes as string[]) ?? [],
    capacity: (raw.capacity as number) ?? 8,
    coordinates: getCoords(city),
    reviews,
  };
}

/** Transform a raw booking API shape into a flat booking object for UI. */
export function transformBooking(raw: Record<string, unknown>) {
  const exp = raw.experience as {
    title?: string;
    slug?: string;
    location?: string;
    price?: number;
    currency?: string;
    images?: Array<{ url: string; alt?: string; is_primary?: boolean }>;
  } | null;

  const images = exp?.images ?? [];
  const primary = images.find((i) => i.is_primary)?.url ?? images[0]?.url ?? "";

  return {
    id: raw.id as string,
    experienceId: (raw.experience_id as string) ?? "",
    title: exp?.title ?? "Experience",
    venue: exp?.location ?? "",
    image: primary,
    date: (raw.experience_date as string) ?? "",
    dateLabel: "",
    time: (raw.experience_time as string) ?? "",
    guests: (raw.guests_count as number) ?? 1,
    status: (raw.status as "upcoming" | "completed" | "cancelled") ?? "upcoming",
    price: (raw.total_price as number) ?? 0,
    bookingRef: (raw.booking_ref as string) ?? (raw.id as string),
  };
}

/** Transform a raw saved-item API shape into a flat saved item for UI. */
export function transformSavedItem(raw: Record<string, unknown>) {
  const exp = raw.experience as Record<string, unknown> | null;
  if (!exp) return null;

  const images = (exp.images as Array<{ url: string; alt?: string; is_primary?: boolean }>) ?? [];
  const primary = images.find((i) => i.is_primary)?.url ?? images[0]?.url ?? "";

  return {
    id: exp.id as string,
    title: exp.title as string,
    subtitle: exp.subtitle as string,
    image: primary,
    price: (exp.price as number) ?? 0,
    currency: (exp.currency as string) ?? "MWK",
    location: (exp.location as string) ?? "",
    city: nearestCity(exp.location as string),
    duration: (exp.duration as string) ?? "",
    rating: (exp.rating as number) ?? 0,
    reviewCount: (exp.review_count as number) ?? 0,
    category: (exp.category as string) ?? "",
  };
}

/** Transform a raw gift-card API shape for the UI. */
export function transformGiftCard(raw: Record<string, unknown>) {
  return {
    id: raw.id as string,
    code: raw.code as string,
    amount: (raw.amount as number) ?? 0,
    balance: (raw.balance as number) ?? 0,
    status: (raw.status as string) ?? "active",
    recipientName: (raw.recipient_name as string) ?? "",
    recipientEmail: (raw.recipient_email as string) ?? "",
    message: (raw.message as string) ?? "",
    createdAt: (raw.created_at as string) ?? "",
    expiresAt: (raw.expires_at as string) ?? "",
  };
}
