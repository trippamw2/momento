import { Experience, Mood, NavItem, DiscoveryRailKey, Review, ExperioCategory, Intention } from "../types";
import { getIntentionsFromMoods } from "../intentions";
import { haversineDistance, formatDistance, AFRICAN_CITY_COORDS } from "../geo";

export const moods: { label: Mood; description: string; accent: string }[] = [
  { label: "Romantic", description: "For two", accent: "from-rose-500 to-pink-500" },
  { label: "Relaxed", description: "Unwind", accent: "from-emerald-500 to-teal-500" },
  { label: "Social", description: "With friends", accent: "from-amber-500 to-orange-500" },
  { label: "Culinary", description: "Food lovers", accent: "from-amber-600 to-orange-600" },
  { label: "Active", description: "Get moving", accent: "from-blue-500 to-cyan-500" },
  { label: "Luxurious", description: "Premium", accent: "from-fuchsia-500 to-purple-500" },
  { label: "Celebratory", description: "Special moments", accent: "from-pink-500 to-rose-500" },
  { label: "Creative", description: "Artsy fun", accent: "from-violet-500 to-purple-500" },
];

export const moodAccent: Record<string, string> = Object.fromEntries(
  moods.map((m) => [m.label, m.accent])
);

export const navItems: NavItem[] = [
  { label: "Discover", href: "/", icon: "compass" },
  { label: "Gift", href: "/gift", icon: "gift" },
  { label: "Saved Moments", href: "/saved", icon: "heart" },
  { label: "Bookings", href: "/bookings", icon: "calendar" },
  { label: "Partners", href: "/profile", icon: "briefcase" },
];

// Shared data

const gallerySets: Record<string, string[]> = {
  Date: [
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80",
    "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=1200&q=80",
    "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1200&q=80",
  ],
  Chill: [
    "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80",
    "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=1200&q=80",
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80",
  ],
  Celebrate: [
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&q=80",
    "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=1200&q=80",
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80",
  ],
  Escape: [
    "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1200&q=80",
    "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=1200&q=80",
    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=80",
  ],
};

const partners: Record<string, string> = {
  "Sunset Cruise": "Lake Malawi Cruises",
  "Pool & Lunch": "Lilongwe Club & Spa",
  "Date Night": "Lilongwe Private Dining Co.",
  "Spa Day": "Blantyre Wellness Collective",
  "Brunch Experience": "The Velvet Fork",
  "Staycation": "Lakeside Lodge & Spa",
  "Girls Day Out": "Lilongwe Luxe Collective",
  "Birthday Experience": "Celebrate Malawi Events",
  "Wellness Retreat": "Blantyre Sanctuary Spa",
  "Wine & Dine": "Blantyre Vineyard Estate",
  "Adventure Date": "Lilongwe Outdoors Co.",
  "Couples Massage": "Blantyre Spa Retreat",
  "Premium Photoshoot": "Lilongwe Portrait Studio",
  "Lake Kayaking": "Blantyre Water Sports",
  "Rooftop Dining": "Skyline Dining Co.",
  "Coffee & Brunch": "The Slow Brew",
  "Sunset Safari": "Blantyre Wildlife Reserve",
  "Private Beach Dinner": "Beachside Elegance",
  "Glamping Weekend": "Bush & Lakeside Co.",
  "Paint & Sip": "The Art Collective",
  "Live Music Night": "Jazz & Soul Lounge",
  "Cooking Class": "The Culinary Studio",
  "Yoga Retreat": "Blantyre Wellness Studio",
  "Family Pool Day": "Lilongwe Club & Spa",
  "Mixology Class": "Skyline Bar Co.",
  "Horse Riding Trail": "Lilongwe Equestrian Club",
};

const includesMap: Record<string, string[]> = {
  Date: [
    "Curated multi-course menu or picnic",
    "Premium beverage pairing",
    "Private or VIP seating",
    "Personalized service",
    "All taxes and charges",
  ],
  Chill: [
    "Pool access and loungers",
    "Curated lunch or snacks",
    "Premium beverages",
    "Towels and amenities",
    "Return transfers available",
  ],
  Celebrate: [
    "Curated multi-course menu",
    "Premium beverage pairing",
    "Personal chef or waiter service",
    "Private or VIP seating",
    "All taxes and service charges",
  ],
  Escape: [
    "Luxury accommodation",
    "All-inclusive dining",
    "Spa or activity credit",
    "Sunset or sunrise experience",
    "Concierge service",
  ],
};

const capacityMap: Record<string, number> = {
  Date: 4,
  Chill: 10,
  Celebrate: 8,
  Escape: 4,
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
  "Absolutely incredible experience! The attention to detail was impeccable and the setting was breathtaking.",
  "This was the highlight of our trip. Everything was perfectly organized and the staff went above and beyond.",
  "A truly unforgettable experience. From the moment we arrived, every detail was thoughtfully curated.",
  "Exceeded every expectation. The quality of service, the ambiance, and the overall experience were world-class.",
  "We booked this for a special occasion and it was perfect. The team made sure everything was just right.",
  "An amazing way to spend the day. The itinerary was well-planned, the food was delicious, and the views were stunning.",
  "Beautiful setting and wonderful hospitality. The experience was relaxing and rejuvenating. Exactly what we needed.",
  "Professional, luxurious, and absolutely worth every kwacha. The memories we made will last a lifetime.",
];

function getGalleryImages(category: string): string[] {
  return gallerySets[category] || gallerySets["Date"];
}

function getPartner(title: string): string {
  return partners[title] || `${title} by Momento`;
}

function getIncludes(category: string): string[] {
  return includesMap[category] || includesMap["Date"];
}

function getCapacity(category: string): number {
  return capacityMap[category] || 4;
}

function nearestCity(location: string): string {
  const cityMap: Record<string, string> = {
    Lilongwe: "Lilongwe",
    Blantyre: "Blantyre",
  };
  return cityMap[location] || "Lilongwe";
}

function getCoords(location: string): { lat: number; lng: number } {
  return AFRICAN_CITY_COORDS[location] || AFRICAN_CITY_COORDS["Lilongwe"];
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
  duration: string;
  mood: Mood[];
  intentions: Intention[];
  emotionalHeadline?: string;
  bestTimeToVisit?: string;
  rating: number;
  reviewCount: number;
  category: ExperioCategory;
  featured: boolean;
  galleryCategory: string;
}

const rawExperiences: RawExperience[] = [
  {
    id: "sunset-cruise",
    title: "Sunset Cruise",
    subtitle: "Lake Malawi at Golden Hour",
    description: "Sail across Lake Malawi as the sun sets with champagne, canapÃ©s, and live acoustic music. Watch the sky turn gold over the water.",
    image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&q=80",
    price: 55000,
    currency: "MWK",
    location: "Blantyre",
    duration: "3 hours",
    mood: ["Romantic", "Luxurious"],
    intentions: ["together", "treat-me"],
    emotionalHeadline: "Where the sky meets the lake, and time stands still",
    rating: 4.9,
    reviewCount: 178,
    category: "Date",
    featured: true,
    galleryCategory: "Date",
  },
  {
    id: "pool-lunch",
    title: "Pool & Lunch",
    subtitle: "Sun, Swim & Sip",
    description: "A luxurious afternoon at Lilongwe's finest pool club with a curated lunch menu and premium beverages. The ultimate weekend indulgence.",
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80",
    price: 45000,
    currency: "MWK",
    location: "Lilongwe",
    duration: "4 hours",
    mood: ["Relaxed", "Social"],
    intentions: ["treat-me", "get-away", "lets-go-out"],
    emotionalHeadline: "Your weekend deserves a little splash",
    rating: 4.8,
    reviewCount: 124,
    category: "Chill",
    featured: true,
    galleryCategory: "Chill",
  },
  {
    id: "date-night",
    title: "Intimate Date Night",
    subtitle: "Dinner Under the Stars",
    description: "An intimate evening with a private chef, candlelit dinner, and stunning views under the Malawian sky. Romance redefined.",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80",
    price: 65000,
    currency: "MWK",
    location: "Lilongwe",
    duration: "3 hours",
    mood: ["Romantic", "Culinary", "Luxurious"],
    intentions: ["together", "let-eat", "treat-me"],
    emotionalHeadline: "The perfect table for tonight's memories",
    rating: 4.9,
    reviewCount: 89,
    category: "Date",
    featured: true,
    galleryCategory: "Date",
  },
  {
    id: "spa-day",
    title: "Spa Day",
    subtitle: "Pure Indulgence",
    description: "A full-day spa experience with massages, facials, sauna access, and organic treatments using local ingredients. Complete mind-body reset.",
    image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80",
    price: 85000,
    currency: "MWK",
    location: "Blantyre",
    duration: "6 hours",
    mood: ["Relaxed", "Luxurious"],
    intentions: ["treat-me", "get-away"],
    emotionalHeadline: "A few hours where the world doesn't need you",
    rating: 4.7,
    reviewCount: 156,
    category: "Chill",
    featured: true,
    galleryCategory: "Chill",
  },
  {
    id: "brunch-experience",
    title: "Brunch Experience",
    subtitle: "Weekend Luxury Brunch",
    description: "A lavish weekend brunch with live music, bottomless mimosas, and an international buffet spread. The perfect lazy weekend start.",
    image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&q=80",
    price: 35000,
    currency: "MWK",
    location: "Lilongwe",
    duration: "3 hours",
    mood: ["Culinary", "Social"],
    intentions: ["let-eat", "lets-go-out"],
    emotionalHeadline: "Slow mornings. Good food. Even better company.",
    rating: 4.6,
    reviewCount: 203,
    category: "Celebrate",
    featured: true,
    galleryCategory: "Celebrate",
  },
  {
    id: "staycation",
    title: "Lakeside Staycation",
    subtitle: "Escape Without Leaving",
    description: "A curated stay at a premium lakeside lodge near Blantyre with all-inclusive dining, activities, and spa credit. Everything you need, nothing you don't.",
    image: "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=600&q=80",
    price: 180000,
    currency: "MWK",
    location: "Blantyre",
    duration: "2 nights",
    mood: ["Romantic", "Relaxed"],
    intentions: ["together", "treat-me", "get-away"],
    emotionalHeadline: "Wake up somewhere that feels different",
    rating: 4.9,
    reviewCount: 67,
    category: "Escape",
    featured: true,
    galleryCategory: "Escape",
  },
  {
    id: "girls-day-out",
    title: "Girls Day Out",
    subtitle: "Fun, Food & Photos",
    description: "A curated day of shopping, spa treatments, brunch, and a photoshoot at the best spots in Lilongwe. Treat your besties.",
    image: "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=600&q=80",
    price: 55000,
    currency: "MWK",
    location: "Lilongwe",
    duration: "6 hours",
    mood: ["Social", "Celebratory"],
    intentions: ["lets-go-out", "together"],
    emotionalHeadline: "Because your besties deserve the best",
    rating: 4.7,
    reviewCount: 112,
    category: "Chill",
    featured: true,
    galleryCategory: "Chill",
  },
  {
    id: "birthday-experience",
    title: "Birthday Experience",
    subtitle: "Celebrate in Style",
    description: "A fully planned birthday celebration including a private venue, catering, cake, decorations, and entertainment. Your way, your vibe.",
    image: "https://images.unsplash.com/photo-1464349153735-7db50ed83c84?w=600&q=80",
    price: 120000,
    currency: "MWK",
    location: "Lilongwe",
    duration: "4 hours",
    mood: ["Celebratory", "Social"],
    intentions: ["together", "lets-go-out"],
    emotionalHeadline: "Your day. Your way. Your moment to shine.",
    rating: 4.8,
    reviewCount: 91,
    category: "Date",
    featured: true,
    galleryCategory: "Date",
  },
  {
    id: "wellness-retreat",
    title: "Wellness Retreat",
    subtitle: "Reset Your Soul",
    description: "A weekend wellness retreat with yoga, meditation, farm-to-table meals, and lakeside mindfulness sessions near Blantyre. Find your center.",
    image: "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=600&q=80",
    price: 150000,
    currency: "MWK",
    location: "Blantyre",
    duration: "2 days",
    mood: ["Relaxed", "Active"],
    intentions: ["treat-me", "get-away", "lets-go-out"],
    emotionalHeadline: "Reset your soul. Find your center.",
    rating: 4.8,
    reviewCount: 45,
    category: "Chill",
    featured: true,
    galleryCategory: "Chill",
  },
  {
    id: "wine-tasting",
    title: "Wine & Dine",
    subtitle: "Vintage Evenings",
    description: "A guided wine tasting experience paired with gourmet canapÃ©s at Blantyre's exclusive vineyard estate. Sip, savour, repeat.",
    image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&q=80",
    price: 40000,
    currency: "MWK",
    location: "Blantyre",
    duration: "2.5 hours",
    mood: ["Culinary", "Social"],
    intentions: ["let-eat", "lets-go-out"],
    emotionalHeadline: "Sip, savour, and let the evening unfold",
    rating: 4.5,
    reviewCount: 54,
    category: "Celebrate",
    featured: false,
    galleryCategory: "Celebrate",
  },
  {
    id: "adventure-day",
    title: "Adventure Date",
    subtitle: "Thrills & Spills Together",
    description: "An action-packed date with zip-lining, hiking, and a bush lunch at a nature reserve near Lilongwe. For adventurous couples.",
    image: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&q=80",
    price: 70000,
    currency: "MWK",
    location: "Lilongwe",
    duration: "6 hours",
    mood: ["Active", "Romantic"],
    intentions: ["lets-go-out", "together"],
    emotionalHeadline: "For the kind of love that loves adventure",
    rating: 4.6,
    reviewCount: 78,
    category: "Date",
    featured: false,
    galleryCategory: "Date",
  },
  {
    id: "couples-massage",
    title: "Couples Massage",
    subtitle: "Relax Together",
    description: "A side-by-side massage experience in a private lakeside cabana with aromatherapy and organic oils near Blantyre. Connect through calm.",
    image: "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=600&q=80",
    price: 55000,
    currency: "MWK",
    location: "Blantyre",
    duration: "90 minutes",
    mood: ["Romantic", "Relaxed"],
    intentions: ["together", "treat-me", "get-away"],
    emotionalHeadline: "Side by side. In perfect stillness.",
    rating: 4.9,
    reviewCount: 143,
    category: "Chill",
    featured: false,
    galleryCategory: "Chill",
  },
  {
    id: "photoshoot",
    title: "Premium Photoshoot",
    subtitle: "Picture Perfect",
    description: "A professional photoshoot with a stylist, makeup artist, and premium locations around Lilongwe. Capturing your best angles.",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80",
    price: 65000,
    currency: "MWK",
    location: "Lilongwe",
    duration: "3 hours",
    mood: ["Celebratory", "Creative"],
    intentions: ["together", "lets-go-out", "treat-me"],
    emotionalHeadline: "Your best angles. Your best light. Your best self.",
    rating: 4.7,
    reviewCount: 99,
    category: "Date",
    featured: false,
    galleryCategory: "Date",
  },
  {
    id: "lake-kayaking",
    title: "Lake Kayaking",
    subtitle: "Paddle & Picnic",
    description: "A guided sunrise kayaking tour along the shores of Lake Malawi with a beachfront breakfast near Blantyre. Peace on water.",
    image: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&q=80",
    price: 30000,
    currency: "MWK",
    location: "Blantyre",
    duration: "3 hours",
    mood: ["Active", "Relaxed"],
    intentions: ["lets-go-out", "treat-me", "get-away"],
    emotionalHeadline: "Peace on water. Paddles at dawn.",
    rating: 4.5,
    reviewCount: 63,
    category: "Chill",
    featured: false,
    galleryCategory: "Chill",
  },
  {
    id: "rooftop-dining",
    title: "Rooftop Dining",
    subtitle: "City Lights & Cuisine",
    description: "An exquisite multi-course dinner on Lilongwe's most exclusive rooftop terrace with skyline views. Dinner with a view.",
    image: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=600&q=80",
    price: 75000,
    currency: "MWK",
    location: "Lilongwe",
    duration: "3 hours",
    mood: ["Romantic", "Culinary", "Luxurious"],
    intentions: ["together", "let-eat", "treat-me"],
    emotionalHeadline: "City lights. Fine wine. Your kind of evening.",
    rating: 4.8,
    reviewCount: 134,
    category: "Date",
    featured: true,
    galleryCategory: "Date",
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
    duration: "2 hours",
    mood: ["Culinary", "Social"],
    intentions: ["let-eat", "lets-go-out"],
    emotionalHeadline: "Slow mornings start with great coffee",
    rating: 4.4,
    reviewCount: 87,
    category: "Celebrate",
    featured: false,
    galleryCategory: "Celebrate",
  },
  {
    id: "sunset-safari",
    title: "Sunset Safari",
    subtitle: "Wild Encounters at Dusk",
    description: "An evening game drive through a private reserve near Blantyre followed by sundowners overlooking the African plains. Wild luxury.",
    image: "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=600&q=80",
    price: 95000,
    currency: "MWK",
    location: "Blantyre",
    duration: "4 hours",
    mood: ["Romantic", "Active"],
    intentions: ["together", "lets-go-out"],
    emotionalHeadline: "Where the wild meets the romantic",
    rating: 4.9,
    reviewCount: 56,
    category: "Date",
    featured: false,
    galleryCategory: "Date",
  },
  {
    id: "private-beach-dinner",
    title: "Private Beach Dinner",
    subtitle: "Secluded Romance",
    description: "A private candlelit dinner on a secluded beach with a personal chef, waiter service, and stargazing setup near Blantyre. Pure magic.",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80",
    price: 130000,
    currency: "MWK",
    location: "Blantyre",
    duration: "4 hours",
    mood: ["Romantic", "Luxurious"],
    intentions: ["together", "treat-me"],
    emotionalHeadline: "Secluded sands. Starlit skies. Just the two of you.",
    rating: 5.0,
    reviewCount: 32,
    category: "Date",
    featured: true,
    galleryCategory: "Date",
  },
  {
    id: "glamping-weekend",
    title: "Glamping Weekend",
    subtitle: "Luxury Under Canvas",
    description: "A weekend of luxury camping with safari tents, gourmet campfire dining, hot showers, and sunrise lake views near Blantyre. Roughing it, refined.",
    image: "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?w=600&q=80",
    price: 200000,
    currency: "MWK",
    location: "Blantyre",
    duration: "2 nights",
    mood: ["Romantic", "Active"],
    intentions: ["together", "lets-go-out"],
    emotionalHeadline: "Roughing it, refined. Luxury under canvas.",
    rating: 4.7,
    reviewCount: 41,
    category: "Escape",
    featured: false,
    galleryCategory: "Escape",
  },
  {
    id: "paint-sip",
    title: "Paint & Sip",
    subtitle: "Art Meets Wine",
    description: "A guided painting session paired with unlimited wine at a chic Lilongwe art studio. No experience needed, just your creativity.",
    image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&q=80",
    price: 35000,
    currency: "MWK",
    location: "Lilongwe",
    duration: "3 hours",
    mood: ["Creative", "Social"],
    intentions: ["treat-me", "lets-go-out"],
    emotionalHeadline: "Wine in one hand. Brush in the other.",
    rating: 4.6,
    reviewCount: 73,
    category: "Date",
    featured: false,
    galleryCategory: "Date",
  },
  {
    id: "live-music-night",
    title: "Live Music Night",
    subtitle: "Jazz Under the Stars",
    description: "An evening of live jazz, fine wine, and sophisticated conversation at Lilongwe's premier music lounge. Let the music move you.",
    image: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=600&q=80",
    price: 30000,
    currency: "MWK",
    location: "Lilongwe",
    duration: "3 hours",
    mood: ["Social", "Romantic"],
    intentions: ["lets-go-out", "together"],
    emotionalHeadline: "Let the music move you. Let the night take over.",
    rating: 4.5,
    reviewCount: 68,
    category: "Date",
    featured: false,
    galleryCategory: "Date",
  },
  {
    id: "cooking-class",
    title: "Cooking Class",
    subtitle: "Taste Malawi",
    description: "Learn to cook traditional Malawian dishes with a master chef in Lilongwe. Visit the market, prep ingredients, then feast on your creations.",
    image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&q=80",
    price: 40000,
    currency: "MWK",
    location: "Lilongwe",
    duration: "4 hours",
    mood: ["Culinary", "Social", "Creative"],
    intentions: ["let-eat", "lets-go-out", "treat-me"],
    emotionalHeadline: "Taste Malawi. Learn. Laugh. Eat.",
    rating: 4.6,
    reviewCount: 47,
    category: "Celebrate",
    featured: false,
    galleryCategory: "Celebrate",
  },
  {
    id: "yoga-retreat",
    title: "Yoga Retreat",
    subtitle: "Find Your Flow",
    description: "A half-day yoga retreat with expert instructors, meditation sessions, organic lunch, and a serene setting near Blantyre. Breathe, stretch, exist.",
    image: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=600&q=80",
    price: 50000,
    currency: "MWK",
    location: "Blantyre",
    duration: "4 hours",
    mood: ["Relaxed", "Active"],
    intentions: ["treat-me", "get-away", "lets-go-out"],
    emotionalHeadline: "Breathe. Stretch. Exist. Find your flow.",
    rating: 4.7,
    reviewCount: 38,
    category: "Chill",
    featured: false,
    galleryCategory: "Chill",
  },
  {
    id: "family-picnic",
    title: "Family Pool Day",
    subtitle: "Sun, Games & Smiles",
    description: "A curated family day out at Lilongwe's finest pool club with gourmet picnic hampers, lawn games, and endless fun for kids and adults.",
    image: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=600&q=80",
    price: 35000,
    currency: "MWK",
    location: "Lilongwe",
    duration: "4 hours",
    mood: ["Social", "Relaxed"],
    intentions: ["lets-go-out", "treat-me", "get-away"],
    emotionalHeadline: "Sun, games, and smiles all around",
    rating: 4.5,
    reviewCount: 82,
    category: "Chill",
    featured: false,
    galleryCategory: "Chill",
  },
  {
    id: "mixology-class",
    title: "Mixology Class",
    subtitle: "Shake, Stir & Sip",
    description: "Learn craft cocktail making from a master mixologist in Lilongwe. Shake, stir, and taste your way through classic and signature drinks.",
    image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&q=80",
    price: 45000,
    currency: "MWK",
    location: "Lilongwe",
    duration: "2.5 hours",
    mood: ["Creative", "Social", "Celebratory"],
    intentions: ["treat-me", "lets-go-out", "together"],
    emotionalHeadline: "Shake things up. Literally.",
    rating: 4.6,
    reviewCount: 55,
    category: "Celebrate",
    featured: false,
    galleryCategory: "Celebrate",
  },
  {
    id: "horse-riding",
    title: "Horse Riding Trail",
    subtitle: "Trail & Gallop",
    description: "Guided horse riding through scenic trails, open plains, and riverside paths near Lilongwe. Suitable for beginners and experienced riders.",
    image: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&q=80",
    price: 50000,
    currency: "MWK",
    location: "Lilongwe",
    duration: "2 hours",
    mood: ["Active", "Romantic"],
    intentions: ["lets-go-out", "together"],
    emotionalHeadline: "Trails, gallops, and the open plains",
    rating: 4.4,
    reviewCount: 36,
    category: "Date",
    featured: false,
    galleryCategory: "Date",
  },
];

export const experiences: Experience[] = rawExperiences.map((e, idx) => {
  const city = nearestCity(e.location);
  const randomBooked = Math.floor(Math.random() * 200) + 10;
  const randomGift = Math.floor(Math.random() * 50);
  const daysAgo = Math.max(1, Math.floor(Math.random() * 90));
  const createdDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
  return {
    ...e,
    images: [e.image, ...getGalleryImages(e.galleryCategory)],
    partner: getPartner(e.title),
    partnerUserId: `host-${e.id}`,
    includes: getIncludes(e.galleryCategory),
    capacity: getCapacity(e.galleryCategory),
    coordinates: getCoords(e.location),
    city,
    distance: "",
    reviews: generateReviews(e.id, e.rating),
    bookedCount: randomBooked,
    giftCount: randomGift,
    createdAt: createdDate,
  };
});

export const CITIES = Array.from(new Set(experiences.map((e) => e.city)));

export function experiencesNear(userLocation: { lat: number; lng: number }): Experience[] {
  return [...experiences]
    .map((e) => ({
      ...e,
      distance: formatDistance(haversineDistance(userLocation, e.coordinates)),
    }))
    .sort((a, b) => {
      const dA = haversineDistance(userLocation, a.coordinates);
      const dB = haversineDistance(userLocation, b.coordinates);
      return dA - dB;
    });
}

const shuffle = <T>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export const discoveryRails: Record<DiscoveryRailKey, { title: string; getExperiences: () => Experience[] }> = {
  trending: {
    title: "Trending Right Now",
    getExperiences: () => shuffle(experiences.filter((e) => e.rating >= 4.7)).slice(0, 8),
  },
  recommended: {
    title: "Recommended For You",
    getExperiences: () => shuffle(experiences.filter((e) => e.category === "Date" || e.category === "Celebrate")).slice(0, 8),
  },
  nearby: {
    title: "Near You",
    getExperiences: () => shuffle(experiences).slice(0, 8),
  },
  weekend: {
    title: "Perfect For This Weekend",
    getExperiences: () => shuffle(experiences.filter((e) => e.duration.includes("hours") && parseInt(e.duration) <= 4)).slice(0, 8),
  },
  "most-saved": {
    title: "Most Saved",
    getExperiences: () => [...experiences].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 8),
  },
  "date": {
    title: "Date Ideas",
    getExperiences: () => shuffle(experiences.filter((e) => e.category === "Date")).slice(0, 8),
  },
  "chill": {
    title: "Chill Vibes",
    getExperiences: () => shuffle(experiences.filter((e) => e.category === "Chill")).slice(0, 8),
  },
  "celebrate": {
    title: "Celebrate",
    getExperiences: () => shuffle(experiences.filter((e) => e.category === "Celebrate")).slice(0, 8),
  },
  "escape": {
    title: "Weekend Escapes",
    getExperiences: () => shuffle(experiences.filter((e) => e.category === "Escape")).slice(0, 8),
  },
  "staff-picks": {
    title: "Staff Picks",
    getExperiences: () => shuffle(experiences.filter((e) => e.rating >= 4.8)).slice(0, 8),
  },
  affordable: {
    title: "Affordable Experiences",
    getExperiences: () => shuffle(experiences.filter((e) => e.price <= 50000)).slice(0, 8),
  },
  personalized: {
    title: "Just For You",
    getExperiences: () => shuffle(experiences).slice(0, 8),
  },
  "because-you-like": {
    title: "Because You Like",
    getExperiences: () => [],
  },
  "hidden-gems": {
    title: "Hidden Gems",
    getExperiences: () => [],
  },
  free: {
    title: "Free Experiences",
    getExperiences: () => [],
  },
  luxury: {
    title: "Luxury Picks",
    getExperiences: () => [],
  },
};

export const railOrder: DiscoveryRailKey[] = [
  "trending",
  "recommended",
  "nearby",
  "weekend",
  "most-saved",
  "date",
  "chill",
  "celebrate",
  "escape",
  "staff-picks",
  "affordable",
  "personalized",
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
  return ["All", ...(Array.from(new Set(experiences.map((e) => e.category))) as string[])];
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
  city?: string;
  nearby?: boolean;
  userLocation?: { lat: number; lng: number };
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
        e.city.toLowerCase().includes(q) ||
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

  if (opts.city) {
    result = result.filter((e) => e.city === opts.city);
  }

  if (opts.nearby) {
    const loc = opts.userLocation || AFRICAN_CITY_COORDS["Lilongwe"];
    result = result
      .map((e) => ({
        ...e,
        distance: formatDistance(haversineDistance(loc, e.coordinates)),
      }))
      .sort((a, b) => {
        const dA = haversineDistance(loc, a.coordinates);
        const dB = haversineDistance(loc, b.coordinates);
        return dA - dB;
      });
  }

  return result;
}
