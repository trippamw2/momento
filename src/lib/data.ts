import { Experience, Mood, NavItem, CollectionKey, Review } from "./types";

export const moods: { label: Mood; emoji: string; description: string }[] = [
  { label: "Romantic", emoji: "🌹", description: "Perfect for two" },
  { label: "Relax", emoji: "🧘", description: "Unwind and recharge" },
  { label: "Celebrate", emoji: "🎉", description: "Make it special" },
  { label: "Escape", emoji: "🌴", description: "Get away from it all" },
  { label: "Treat Myself", emoji: "✨", description: "You deserve it" },
];

export const navItems: NavItem[] = [
  { label: "Discover", href: "/", icon: "compass" },
  { label: "Experiences", href: "/experiences", icon: "sparkles" },
  { label: "Gift", href: "/gift", icon: "gift" },
  { label: "Saved", href: "/saved", icon: "heart" },
  { label: "Bookings", href: "/bookings", icon: "calendar" },
  { label: "Profile", href: "/profile", icon: "user" },
];

const locationCoords: Record<string, { lat: number; lng: number }> = {
  "Cape Maclear": { lat: -14.0167, lng: 34.85 },
  "Lilongwe": { lat: -13.9626, lng: 33.7741 },
  "Salima": { lat: -13.7833, lng: 34.4333 },
  "Blantyre": { lat: -15.7861, lng: 35.0058 },
  "Mangochi": { lat: -14.4667, lng: 35.2667 },
  "Zomba": { lat: -15.3867, lng: 35.3188 },
  "Dedza": { lat: -14.3667, lng: 34.3333 },
  "Liwonde": { lat: -15.0667, lng: 35.2167 },
  "Various": { lat: -13.9626, lng: 33.7741 },
};

const gallerySets: Record<string, string[]> = {
  Dining: [
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&q=80",
    "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=1200&q=80",
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80",
  ],
  Nightlife: [
    "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=1200&q=80",
    "https://images.unsplash.com/photo-1525268323446-0505b6fe7778?w=1200&q=80",
    "https://images.unsplash.com/photo-1529502669403-073e3c5f2d8e?w=1200&q=80",
  ],
  "Day Out": [
    "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=1200&q=80",
    "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80",
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80",
  ],
  Wellness: [
    "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1200&q=80",
    "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=1200&q=80",
    "https://images.unsplash.com/photo-1447452001602-7090c7ab2db3?w=1200&q=80",
  ],
  Adventure: [
    "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=1200&q=80",
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80",
    "https://images.unsplash.com/photo-1469474960080-76354042a44e?w=1200&q=80",
  ],
  Overnight: [
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80",
    "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1200&q=80",
    "https://images.unsplash.com/photo-1571896349842-353c43544e52?w=1200&q=80",
  ],
  Events: [
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80",
    "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=1200&q=80",
    "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200&q=80",
  ],
};

const partners: Record<string, string> = {
  "Sunset Cruise": "Cape Maclear Cruises",
  "Pool & Lunch": "Lilongwe Club & Spa",
  "Date Night": "Lake Malawi Private Dining",
  "Spa Day": "Blantyre Wellness Collective",
  "Brunch Experience": "The Velvet Fork",
  "Staycation": "Mangochi Lakeside Lodge",
  "Girls Day Out": "Lilongwe Luxe Collective",
  "Birthday Experience": "Celebrate Malawi Events",
  "Wellness Retreat": "Salima Sanctuary",
  "Wine & Dine": "Zomba Vineyard Estate",
  "Adventure Day": "Dedza Outdoors",
  "Couples Massage": "Salima Spa Retreat",
  "Premium Photoshoot": "Lilongwe Portrait Studio",
  "Lake Kayaking": "Cape Maclear Adventures",
  "Rooftop Dining": "Skyline Dining Co.",
  "Coffee & Brunch": "The Slow Brew",
  "Sunset Safari": "Liwonde Wildlife Reserve",
  "Private Beach Dinner": "Beachside Elegance",
  "Glamping Weekend": "Bush & Lakeside Co.",
  "Paint & Sip": "The Art Collective",
};

const includesMap: Record<string, string[]> = {
  Dining: [
    "Curated multi-course menu",
    "Premium beverage pairing",
    "Personal chef or waiter service",
    "Private or VIP seating",
    "All taxes and service charges",
  ],
  Nightlife: [
    "Premium cocktails or champagne",
    "Live acoustic music or DJ",
    "Private table service",
    "Sunset or skyline view",
    "Return transfers available",
  ],
  "Day Out": [
    "Full activity itinerary",
    "Professional photography",
    "Lunch or brunch included",
    "Spa or wellness access",
    "Return transfers",
  ],
  Wellness: [
    "Full-body treatment session",
    "Organic product use",
    "Sauna or steam room access",
    "Herbal tea and refreshments",
    "Post-treatment relaxation lounge",
  ],
  Adventure: [
    "Professional guide",
    "All safety equipment",
    "Bush or picnic lunch",
    "Park or reserve entry fees",
    "Return transfers",
  ],
  Overnight: [
    "Luxury accommodation",
    "All-inclusive dining",
    "Spa or activity credit",
    "Sunset or sunrise experience",
    "Concierge service",
  ],
  Events: [
    "Full event planning",
    "Venue decoration",
    "Catering and cake",
    "Entertainment",
    "Photography package",
  ],
};

const capacityMap: Record<string, number> = {
  Dining: 8,
  Nightlife: 12,
  "Day Out": 10,
  Wellness: 4,
  Adventure: 10,
  Overnight: 4,
  Events: 20,
};

const reviewAuthors = [
  { name: "Chimwemwe Banda", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=CB" },
  { name: "Temwa Phiri", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=TP" },
  { name: "Zione Mwale", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=ZM" },
  { name: "Kondwani Nkhoma", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=KN" },
  { name: "Thandiwe Banda", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=TB" },
  { name: "Mphatso Kachale", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=MK" },
];

const reviewTexts = [
  "Absolutely incredible experience! The attention to detail was impeccable and the setting was breathtaking. Highly recommend for anyone looking to create special memories.",
  "This was the highlight of our trip to Malawi. Everything was perfectly organized and the staff went above and beyond to make us feel special.",
  "A truly unforgettable experience. From the moment we arrived, every detail was thoughtfully curated. Will definitely be coming back!",
  "Exceeded every expectation. The quality of service, the ambiance, and the overall experience were world-class. A must-do in Malawi.",
  "We booked this for a special occasion and it was perfect. The team made sure everything was just right. Can't wait to try more experiences!",
  "An amazing way to spend the day. The itinerary was well-planned, the food was delicious, and the views were stunning. 10/10 recommend.",
  "Beautiful setting and wonderful hospitality. The experience was relaxing and rejuvenating. Exactly what we needed.",
  "Professional, luxurious, and absolutely worth every kwacha. The memories we made will last a lifetime.",
];

function getGalleryImages(category: string): string[] {
  return gallerySets[category] || gallerySets["Dining"];
}

function getPartner(title: string): string {
  return partners[title] || `${title} by Momento`;
}

function getIncludes(category: string): string[] {
  return includesMap[category] || includesMap["Dining"];
}

function getCapacity(category: string): number {
  return capacityMap[category] || 8;
}

function getCoords(location: string): { lat: number; lng: number } {
  return locationCoords[location] || { lat: -13.9626, lng: 33.7741 };
}

function generateReviews(id: string, baseRating: number): Review[] {
  const shuffled = [...reviewAuthors].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3).map((author, i) => ({
    id: `${id}-review-${i}`,
    author: author.name,
    avatar: author.avatar,
    rating: Math.min(5, Math.max(3, baseRating + (Math.random() > 0.5 ? 0.1 : -0.3))),
    date: `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][Math.floor(Math.random() * 12)]} ${2025 - i}`,
    text: reviewTexts[Math.floor(Math.random() * reviewTexts.length)],
  })).map(r => ({ ...r, rating: Math.round(r.rating * 10) / 10 }));
}

interface RawExperience {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  price: number;
  currency: string;
  location: string;
  distance: string;
  duration: string;
  mood: Mood[];
  rating: number;
  reviewCount: number;
  category: string;
  featured: boolean;
}

const rawExperiences: RawExperience[] = [
  {
    id: "sunset-cruise",
    title: "Sunset Cruise",
    subtitle: "Lake Malawi at Golden Hour",
    description: "Sail across Lake Malawi as the sun sets with champagne, canapés, and live acoustic music.",
    image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&q=80",
    price: 55000,
    currency: "MWK",
    location: "Cape Maclear",
    distance: "2.3 km",
    duration: "3 hours",
    mood: ["Romantic", "Escape", "Relax"],
    rating: 4.9,
    reviewCount: 178,
    category: "Nightlife",
    featured: true,
  },
  {
    id: "pool-lunch",
    title: "Pool & Lunch",
    subtitle: "Sun, Swim & Sip",
    description: "A luxurious afternoon at Malawi's finest pool clubs with a curated lunch menu and premium beverages.",
    image: "https://images.unsplash.com/photo-1570488344399-635a23a3b731?w=600&q=80",
    price: 45000,
    currency: "MWK",
    location: "Lilongwe",
    distance: "0.8 km",
    duration: "4 hours",
    mood: ["Relax", "Treat Myself"],
    rating: 4.8,
    reviewCount: 124,
    category: "Day Out",
    featured: true,
  },
  {
    id: "date-night",
    title: "Date Night",
    subtitle: "Dinner Under the Stars",
    description: "An intimate evening with a private chef, candlelit dinner, and stunning views of Lake Malawi.",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80",
    price: 65000,
    currency: "MWK",
    location: "Salima",
    distance: "5.1 km",
    duration: "3 hours",
    mood: ["Romantic", "Celebrate"],
    rating: 4.9,
    reviewCount: 89,
    category: "Dining",
    featured: true,
  },
  {
    id: "spa-day",
    title: "Spa Day",
    subtitle: "Pure Indulgence",
    description: "A full-day spa experience with massages, facials, sauna access, and organic treatments using local ingredients.",
    image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80",
    price: 85000,
    currency: "MWK",
    location: "Blantyre",
    distance: "1.2 km",
    duration: "6 hours",
    mood: ["Relax", "Treat Myself"],
    rating: 4.7,
    reviewCount: 156,
    category: "Wellness",
    featured: true,
  },
  {
    id: "brunch-experience",
    title: "Brunch Experience",
    subtitle: "Weekend Luxury Brunch",
    description: "A lavish weekend brunch with live music, bottomless mimosas, and an international buffet spread.",
    image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&q=80",
    price: 35000,
    currency: "MWK",
    location: "Lilongwe",
    distance: "0.3 km",
    duration: "3 hours",
    mood: ["Relax", "Celebrate", "Treat Myself"],
    rating: 4.6,
    reviewCount: 203,
    category: "Dining",
    featured: true,
  },
  {
    id: "staycation",
    title: "Staycation",
    subtitle: "Escape Without Leaving",
    description: "A curated stay at a premium lakeside lodge with all-inclusive dining, activities, and spa credit.",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80",
    price: 180000,
    currency: "MWK",
    location: "Mangochi",
    distance: "12.4 km",
    duration: "2 nights",
    mood: ["Escape", "Romantic", "Relax"],
    rating: 4.9,
    reviewCount: 67,
    category: "Overnight",
    featured: true,
  },
  {
    id: "girls-day-out",
    title: "Girls Day Out",
    subtitle: "Fun, Food & Photos",
    description: "A curated day of shopping, spa treatments, brunch, and a photoshoot at the best spots in town.",
    image: "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=600&q=80",
    price: 55000,
    currency: "MWK",
    location: "Lilongwe",
    distance: "1.5 km",
    duration: "6 hours",
    mood: ["Celebrate", "Treat Myself"],
    rating: 4.7,
    reviewCount: 112,
    category: "Day Out",
    featured: true,
  },
  {
    id: "birthday-experience",
    title: "Birthday Experience",
    subtitle: "Celebrate in Style",
    description: "A fully planned birthday celebration including a private venue, catering, cake, decorations, and entertainment.",
    image: "https://images.unsplash.com/photo-1464349153735-7db50ed83c84?w=600&q=80",
    price: 120000,
    currency: "MWK",
    location: "Various",
    distance: "0 km",
    duration: "4 hours",
    mood: ["Celebrate"],
    rating: 4.8,
    reviewCount: 91,
    category: "Events",
    featured: true,
  },
  {
    id: "wellness-retreat",
    title: "Wellness Retreat",
    subtitle: "Reset Your Soul",
    description: "A weekend wellness retreat with yoga, meditation, farm-to-table meals, and lakeside mindfulness sessions.",
    image: "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=600&q=80",
    price: 150000,
    currency: "MWK",
    location: "Salima",
    distance: "6.8 km",
    duration: "2 days",
    mood: ["Relax", "Escape", "Treat Myself"],
    rating: 4.8,
    reviewCount: 45,
    category: "Wellness",
    featured: true,
  },
  {
    id: "wine-tasting",
    title: "Wine & Dine",
    subtitle: "Vintage Evenings",
    description: "A guided wine tasting experience paired with gourmet canapés at an exclusive vineyard estate.",
    image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&q=80",
    price: 40000,
    currency: "MWK",
    location: "Zomba",
    distance: "3.5 km",
    duration: "2.5 hours",
    mood: ["Romantic", "Treat Myself"],
    rating: 4.5,
    reviewCount: 54,
    category: "Dining",
    featured: false,
  },
  {
    id: "adventure-day",
    title: "Adventure Day",
    subtitle: "Thrills & Spills",
    description: "An action-packed day with zip-lining, kayaking, hiking, and a bush lunch at a nature reserve.",
    image: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&q=80",
    price: 70000,
    currency: "MWK",
    location: "Dedza",
    distance: "8.2 km",
    duration: "8 hours",
    mood: ["Escape", "Celebrate"],
    rating: 4.6,
    reviewCount: 78,
    category: "Adventure",
    featured: false,
  },
  {
    id: "couples-massage",
    title: "Couples Massage",
    subtitle: "Relax Together",
    description: "A side-by-side massage experience in a private lakeside cabana with aromatherapy and organic oils.",
    image: "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=600&q=80",
    price: 55000,
    currency: "MWK",
    location: "Salima",
    distance: "5.1 km",
    duration: "90 minutes",
    mood: ["Romantic", "Relax"],
    rating: 4.9,
    reviewCount: 143,
    category: "Wellness",
    featured: false,
  },
  {
    id: "photoshoot",
    title: "Premium Photoshoot",
    subtitle: "Picture Perfect",
    description: "A professional photoshoot with a stylist, makeup artist, and premium locations around the city.",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80",
    price: 65000,
    currency: "MWK",
    location: "Lilongwe",
    distance: "0.5 km",
    duration: "3 hours",
    mood: ["Treat Myself", "Celebrate"],
    rating: 4.7,
    reviewCount: 99,
    category: "Day Out",
    featured: false,
  },
  {
    id: "lake-kayaking",
    title: "Lake Kayaking",
    subtitle: "Paddle at Dawn",
    description: "A guided sunrise kayaking tour along the shores of Lake Malawi with a beachfront breakfast.",
    image: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&q=80",
    price: 30000,
    currency: "MWK",
    location: "Cape Maclear",
    distance: "2.3 km",
    duration: "3 hours",
    mood: ["Escape", "Treat Myself"],
    rating: 4.5,
    reviewCount: 63,
    category: "Adventure",
    featured: false,
  },
  {
    id: "rooftop-dining",
    title: "Rooftop Dining",
    subtitle: "City Lights & Cuisine",
    description: "An exquisite multi-course dinner on Lilongwe's most exclusive rooftop terrace with skyline views.",
    image: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=600&q=80",
    price: 75000,
    currency: "MWK",
    location: "Lilongwe",
    distance: "0.2 km",
    duration: "3 hours",
    mood: ["Romantic", "Celebrate", "Treat Myself"],
    rating: 4.8,
    reviewCount: 134,
    category: "Dining",
    featured: false,
  },
  {
    id: "coffee-brunch",
    title: "Coffee & Brunch",
    subtitle: "Slow Mornings, Good Vibes",
    description: "A relaxed brunch experience at Lilongwe's trendiest cafe with specialty coffee, artisanal pastries, and live acoustic sets.",
    image: "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=600&q=80",
    price: 25000,
    currency: "MWK",
    location: "Lilongwe",
    distance: "0.6 km",
    duration: "2 hours",
    mood: ["Relax", "Treat Myself"],
    rating: 4.4,
    reviewCount: 87,
    category: "Dining",
    featured: false,
  },
  {
    id: "sunset-safari",
    title: "Sunset Safari",
    subtitle: "Wild Encounters at Dusk",
    description: "An evening game drive through a private reserve followed by sundowners overlooking the African plains.",
    image: "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=600&q=80",
    price: 95000,
    currency: "MWK",
    location: "Liwonde",
    distance: "45.2 km",
    duration: "4 hours",
    mood: ["Escape", "Romantic", "Celebrate"],
    rating: 4.9,
    reviewCount: 56,
    category: "Adventure",
    featured: false,
  },
  {
    id: "private-beach-dinner",
    title: "Private Beach Dinner",
    subtitle: "Secluded Romance",
    description: "A private candlelit dinner on a secluded Lake Malawi beach with a personal chef, waiter, and stargazing setup.",
    image: "https://images.unsplash.com/photo-1478146059778-6f8b45b4a7fc?w=600&q=80",
    price: 130000,
    currency: "MWK",
    location: "Cape Maclear",
    distance: "2.8 km",
    duration: "4 hours",
    mood: ["Romantic", "Escape"],
    rating: 5.0,
    reviewCount: 32,
    category: "Dining",
    featured: false,
  },
  {
    id: "glamping-weekend",
    title: "Glamping Weekend",
    subtitle: "Luxury Under Canvas",
    description: "A weekend of luxury camping with safari tents, gourmet campfire dining, hot showers, and sunrise lake views.",
    image: "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?w=600&q=80",
    price: 200000,
    currency: "MWK",
    location: "Mangochi",
    distance: "14.7 km",
    duration: "2 nights",
    mood: ["Escape", "Romantic", "Relax"],
    rating: 4.7,
    reviewCount: 41,
    category: "Overnight",
    featured: false,
  },
  {
    id: "paint-sip",
    title: "Paint & Sip",
    subtitle: "Art Meets Wine",
    description: "A guided painting session paired with unlimited wine at a chic art studio — no experience needed, just creativity.",
    image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&q=80",
    price: 35000,
    currency: "MWK",
    location: "Lilongwe",
    distance: "1.1 km",
    duration: "3 hours",
    mood: ["Celebrate", "Treat Myself", "Relax"],
    rating: 4.6,
    reviewCount: 73,
    category: "Events",
    featured: false,
  },
];

export const experiences: Experience[] = rawExperiences.map((e) => ({
  ...e,
  images: [e.image, ...getGalleryImages(e.category)],
  partner: getPartner(e.title),
  includes: getIncludes(e.category),
  capacity: getCapacity(e.category),
  coordinates: getCoords(e.location),
  reviews: generateReviews(e.id, e.rating),
}));

export const collections: Record<CollectionKey, { title: string; getExperiences: () => Experience[] }> = {
  trending: {
    title: "Trending This Weekend",
    getExperiences: () => experiences.filter((e) => e.rating >= 4.8).slice(0, 6),
  },
  popular: {
    title: "Popular Near You",
    getExperiences: () =>
      [...experiences]
        .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance))
        .slice(0, 6),
  },
  recommended: {
    title: "Recommended For You",
    getExperiences: () =>
      experiences.filter((e) => e.mood.includes("Treat Myself") || e.mood.includes("Relax")).slice(0, 6),
  },
  "date-ideas": {
    title: "Date Ideas",
    getExperiences: () => experiences.filter((e) => e.mood.includes("Romantic")).slice(0, 6),
  },
  wellness: {
    title: "Relax & Wellness",
    getExperiences: () =>
      experiences.filter((e) => e.category === "Wellness" || e.mood.includes("Relax")).slice(0, 6),
  },
  escapes: {
    title: "Weekend Escapes",
    getExperiences: () =>
      experiences.filter((e) => e.mood.includes("Escape")).slice(0, 6),
  },
  sunset: {
    title: "Sunset Experiences",
    getExperiences: () =>
      experiences.filter((e) => e.category === "Nightlife" || e.id === "sunset-cruise").slice(0, 6),
  },
  staycations: {
    title: "Staycations",
    getExperiences: () =>
      experiences.filter((e) => e.category === "Overnight").length > 0
        ? experiences.filter((e) => e.category === "Overnight")
        : experiences.slice(0, 4),
  },
};

export const collectionOrder: CollectionKey[] = [
  "trending",
  "popular",
  "recommended",
  "date-ideas",
  "wellness",
  "escapes",
  "sunset",
  "staycations",
];

export function getExperiencesByMood(mood: Mood): Experience[] {
  return experiences.filter((e) => e.mood.includes(mood));
}

export function getFeaturedExperiences(): Experience[] {
  return experiences.filter((e) => e.featured);
}

export function getExperienceById(id: string): Experience | undefined {
  return experiences.find((e) => e.id === id);
}

export function getCategories(): string[] {
  return ["All", ...new Set(experiences.map((e) => e.category))];
}

export function getLocations(): string[] {
  return ["All", ...new Set(experiences.map((e) => e.location))];
}

export function filterExperiences(opts: {
  search?: string;
  category?: string;
  mood?: Mood | null;
  priceRange?: string;
  location?: string;
  nearby?: boolean;
}): Experience[] {
  let result = [...experiences];

  if (opts.search) {
    const q = opts.search.toLowerCase();
    result = result.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.subtitle.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
    );
  }

  if (opts.category && opts.category !== "All") {
    result = result.filter((e) => e.category === opts.category);
  }

  if (opts.mood) {
    result = result.filter((e) => e.mood.includes(opts.mood!));
  }

  if (opts.priceRange && opts.priceRange !== "all") {
    const [min, max] = opts.priceRange.split("-").map(Number);
    result = result.filter((e) => e.price >= min && e.price <= max);
  }

  if (opts.location && opts.location !== "All") {
    result = result.filter((e) => e.location === opts.location);
  }

  if (opts.nearby) {
    result.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
  }

  return result;
}
