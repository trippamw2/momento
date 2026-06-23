export type Mood =
  | "Romantic"
  | "Relax"
  | "Celebrate"
  | "Escape"
  | "Indulge"
  | "Food & Drink"
  | "Family"
  | "Entertainment"
  | "Adventure"
  | "Self Care"
  | "Social";

export type V2Category =
  | "Romantic"
  | "Wellness"
  | "Food & Drink"
  | "Luxury"
  | "Celebrations"
  | "Entertainment"
  | "Family"
  | "Adventure"
  | "Escape"
  | "Self Care"
  | "Social";

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
  | "weekend"
  | "most-saved"
  | "new"
  | "date-ideas"
  | "wellness"
  | "food-drink"
  | "luxury"
  | "celebrations"
  | "hidden-gems"
  | "staff-picks"
  | "affordable"
  | "adventure"
  | "family";

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
