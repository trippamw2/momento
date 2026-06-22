export type Mood = "Romantic" | "Relax" | "Celebrate" | "Escape" | "Treat Myself";

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
  rating: number;
  reviewCount: number;
  category: string;
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

export type CollectionKey =
  | "trending"
  | "popular"
  | "recommended"
  | "date-ideas"
  | "wellness"
  | "escapes"
  | "sunset"
  | "staycations";

export const PRICE_RANGES = [
  { label: "All", value: "all" },
  { label: "≤ 50K", value: "0-50000" },
  { label: "50K-100K", value: "50000-100000" },
  { label: "100K+", value: "100000-9999999" },
] as const;
