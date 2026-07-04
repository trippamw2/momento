export type Mood =
  | "Romantic"
  | "Relaxed"
  | "Social"
  | "Culinary"
  | "Active"
  | "Luxurious"
  | "Celebratory"
  | "Creative";

export type V2Category =
  | "Date Night"
  | "Pool & Chill"
  | "Spa & Wellness"
  | "Brunch & Dining"
  | "Staycation";

export type Intention =
  | "let-eat"
  | "treat-me"
  | "lets-go-out"
  | "together"
  | "get-away";

export const INTENTIONS: { key: Intention; emoji: string; label: string; description: string; accent: string }[] = [
  { key: "let-eat", emoji: "🍽", label: "Let's Eat", description: "I'm hungry / I want food or drinks", accent: "from-amber-400 to-orange-500" },
  { key: "treat-me", emoji: "✨", label: "Treat Me", description: "I need to relax and recharge", accent: "from-fuchsia-400 to-purple-500" },
  { key: "lets-go-out", emoji: "☀️", label: "Let's Go Out", description: "I want to go out and have fun", accent: "from-blue-400 to-cyan-500" },
  { key: "together", emoji: "❤️", label: "Together", description: "I'm planning something for us", accent: "from-rose-400 to-pink-500" },
  { key: "get-away", emoji: "🌴", label: "Get Away", description: "I need a change of scenery", accent: "from-emerald-400 to-teal-500" },
];

export const INTENTION_EMOJI: Record<Intention, string> = Object.fromEntries(
  INTENTIONS.map((i) => [i.key, i.emoji])
) as Record<Intention, string>;

export const INTENTION_LABEL: Record<Intention, string> = Object.fromEntries(
  INTENTIONS.map((i) => [i.key, i.label])
) as Record<Intention, string>;

export const INTENTION_DESCRIPTION: Record<Intention, string> = Object.fromEntries(
  INTENTIONS.map((i) => [i.key, i.description])
) as Record<Intention, string>;

export const INTENTION_ACCENT: Record<Intention, string> = Object.fromEntries(
  INTENTIONS.map((i) => [i.key, i.accent])
) as Record<Intention, string>;

export interface Review {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  date: string;
  text: string;
}

export interface Experience {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  images: string[];
  price: number;
  currency: string;
  partner: string;
  location: string;
  city: string;
  distance: string;
  duration: string;
  mood: Mood[];
  intentions: Intention[];
  emotionalHeadline?: string;
  rating: number;
  reviewCount: number;
  category: V2Category;
  featured: boolean;
  includes: string[];
  capacity: number;
  coordinates: { lat: number; lng: number };
  reviews: Review[];
}

export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

export type DiscoveryRailKey =
  | "trending"
  | "recommended"
  | "nearby"
  | "weekend"
  | "most-saved"
  | "date-night"
  | "pool-chill"
  | "spa-wellness"
  | "brunch-dining"
  | "staycation"
  | "staff-picks"
  | "affordable"
  | "personalized";

export interface DiscoveryRail {
  key: DiscoveryRailKey;
  title: string;
  getExperiences: () => Experience[];
}

export const PRICE_RANGES = [
  { label: "All", value: "all" },
  { label: "≤ 50K", value: "0-50000" },
  { label: "50K-100K", value: "50000-100000" },
  { label: "100K+", value: "100000-9999999" },
] as const;

export interface AIRecommendation {
  query: string;
  results: Experience[];
  explanation: string;
}

export interface Collection {
  id: string;
  name: string;
  experienceIds: string[];
}

export interface SavedState {
  savedIds: string[];
  collections: Collection[];
}

// ─── API Response Types ───

export interface GiftCard {
  id: string;
  code: string;
  issuer_id: string;
  recipient_email?: string;
  recipient_name?: string;
  sender_name?: string;
  message?: string;
  amount: number;
  currency: string;
  balance: number;
  delivery_method: "email" | "whatsapp" | "sms" | "print";
  delivery_status: string;
  status: "active" | "partially_redeemed" | "redeemed" | "expired" | "cancelled" | "refunded";
  occasion?: string;
  design?: string;
  expires_at?: string;
  created_at: string;
  redeemed_at?: string;
}

export interface GiftCardTransaction {
  id: string;
  gift_card_id: string;
  booking_id?: string;
  type: "purchase" | "redemption" | "refund" | "top_up";
  amount: number;
  balance_after: number;
  created_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  experience_id: string;
  availability_id?: string;
  status: "pending" | "confirmed" | "cancelled" | "completed" | "refunded" | "no_show";
  guests_count: number;
  total_price: number;
  currency: string;
  notes?: string;
  special_requests?: string;
  contact_phone?: string;
  contact_email?: string;
  experience_date: string;
  experience_time?: string;
  created_at: string;
  cancelled_at?: string;
  completed_at?: string;
  experience?: {
    title: string;
    slug: string;
    location: string;
    price: number;
    currency: string;
    images: { url: string; alt: string; is_primary: boolean }[];
  };
}

export interface Payment {
  id: string;
  booking_id?: string;
  gift_card_id?: string;
  user_id: string;
  amount: number;
  currency: string;
  method: string;
  provider?: string;
  provider_reference?: string;
  status: "pending" | "processing" | "succeeded" | "failed" | "refunded" | "partially_refunded";
  created_at: string;
}

export interface LoyaltyPoints {
  balance: number;
  lifetime_points: number;
  tier: "bronze" | "silver" | "gold" | "platinum";
  updated_at: string;
}

export interface LoyaltyTransaction {
  id: string;
  user_id: string;
  type: "earn" | "redeem" | "bonus" | "expire" | "adjustment";
  points: number;
  description?: string;
  reference_type?: string;
  reference_id?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface Profile {
  id: string;
  role: "user" | "partner" | "admin";
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  country?: string;
  city?: string;
  preferences?: Record<string, unknown>;
  created_at: string;
}

export interface PartnerProfile {
  id: string;
  user_id: string;
  business_name: string;
  business_description?: string;
  business_logo?: string;
  business_cover?: string;
  business_email?: string;
  business_phone?: string;
  business_website?: string;
  business_address?: string;
  business_city?: string;
  business_country?: string;
  categories?: string[];
  verification_status: "pending" | "verified" | "rejected";
  is_active: boolean;
  created_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiError {
  error: string;
  details?: Record<string, unknown>;
}
