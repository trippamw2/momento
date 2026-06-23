import { Experience, Mood, NavItem, DiscoveryRailKey, Review, V2Category } from "./types";
import { haversineDistance, formatDistance, AFRICAN_CITY_COORDS } from "./geo";

export const moods: { label: Mood; description: string; accent: string }[] = [
  { label: "Romantic", description: "Perfect for two", accent: "from-rose-500 to-pink-500" },
  { label: "Relax", description: "Unwind and recharge", accent: "from-emerald-500 to-teal-500" },
  { label: "Celebrate", description: "Make it special", accent: "from-amber-500 to-orange-500" },
  { label: "Escape", description: "Get away from it all", accent: "from-cyan-500 to-sky-500" },
  { label: "Indulge", description: "You deserve it", accent: "from-fuchsia-500 to-purple-500" },
  { label: "Food & Drink", description: "Culinary delights", accent: "from-amber-600 to-orange-600" },
  { label: "Family", description: "Fun for everyone", accent: "from-indigo-500 to-blue-500" },
  { label: "Entertainment", description: "Live your vibe", accent: "from-violet-500 to-purple-500" },
  { label: "Adventure", description: "Thrill & excitement", accent: "from-red-500 to-rose-500" },
  { label: "Self Care", description: "Nurture yourself", accent: "from-green-500 to-emerald-500" },
  { label: "Social", description: "Connect with others", accent: "from-pink-500 to-rose-500" },
];

export const moodAccent: Record<string, string> = Object.fromEntries(
  moods.map((m) => [m.label, m.accent])
);

export const navItems: NavItem[] = [
  { label: "Discover", href: "/", icon: "compass" },
  { label: "Gift", href: "/gift", icon: "gift" },
  { label: "Saved Moments", href: "/saved", icon: "heart" },
  { label: "Memories", href: "/bookings", icon: "calendar" },
  { label: "Partners", href: "/profile", icon: "briefcase" },
];

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
  "Live Music Night": "Jazz & Soul Lounge",
  "Cooking Class": "The Culinary Studio",
  "Wine Tasting": "Zomba Vineyard Estate",
  "Yoga Retreat": "Salima Sanctuary",
  "Photography Walk": "Lilongwe Portrait Studio",
  "Family Picnic": "Lilongwe Club & Spa",
  "Sunset Yoga": "Salima Sanctuary",
  "Mixology Class": "Skyline Dining Co.",
  "Art Exhibition": "The Art Collective",
  "Horse Riding": "Dedza Outdoors",
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

function nearestCity(location: string): string {
  const cityMap: Record<string, string> = {
    "Cape Maclear": "Lilongwe",
    "Lilongwe": "Lilongwe",
    "Salima": "Lilongwe",
    "Blantyre": "Blantyre",
    "Mangochi": "Blantyre",
    "Zomba": "Blantyre",
    "Dedza": "Lilongwe",
    "Liwonde": "Blantyre",
    "Various": "Lilongwe",
    "Nkhotakota": "Lilongwe",
    "Mzuzu": "Mzuzu",
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
  rating: number;
  reviewCount: number;
  category: V2Category;
  featured: boolean;
  galleryCategory: string;
}

const rawExperiences: RawExperience[] = [
  {
    id: "sunset-cruise",
    title: "Sunset Cruise",
    subtitle: "Lake Malawi at Golden Hour",
    description: "Sail across Lake Malawi as the sun sets with champagne, canapés, and live acoustic music. Watch the sky turn gold over the water.",
    image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&q=80",
    price: 55000,
    currency: "MWK",
    location: "Cape Maclear",
    duration: "3 hours",
    mood: ["Romantic", "Escape", "Relax"],
    rating: 4.9,
    reviewCount: 178,
    category: "Romantic",
    featured: true,
    galleryCategory: "Nightlife",
  },
  {
    id: "pool-lunch",
    title: "Pool & Lunch",
    subtitle: "Sun, Swim & Sip",
    description: "A luxurious afternoon at Malawi's finest pool clubs with a curated lunch menu and premium beverages. The ultimate weekend indulgence.",
    image: "https://images.unsplash.com/photo-1570488344399-635a23a3b731?w=600&q=80",
    price: 45000,
    currency: "MWK",
    location: "Lilongwe",
    duration: "4 hours",
    mood: ["Relax", "Indulge", "Social"],
    rating: 4.8,
    reviewCount: 124,
    category: "Luxury",
    featured: true,
    galleryCategory: "Day Out",
  },
  {
    id: "date-night",
    title: "Date Night",
    subtitle: "Dinner Under the Stars",
    description: "An intimate evening with a private chef, candlelit dinner, and stunning views of Lake Malawi. Romance redefined.",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80",
    price: 65000,
    currency: "MWK",
    location: "Salima",
    duration: "3 hours",
    mood: ["Romantic", "Food & Drink", "Celebrate"],
    rating: 4.9,
    reviewCount: 89,
    category: "Romantic",
    featured: true,
    galleryCategory: "Dining",
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
    mood: ["Self Care", "Relax", "Indulge"],
    rating: 4.7,
    reviewCount: 156,
    category: "Wellness",
    featured: true,
    galleryCategory: "Wellness",
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
    mood: ["Food & Drink", "Social", "Relax"],
    rating: 4.6,
    reviewCount: 203,
    category: "Food & Drink",
    featured: true,
    galleryCategory: "Dining",
  },
  {
    id: "staycation",
    title: "Staycation",
    subtitle: "Escape Without Leaving",
    description: "A curated stay at a premium lakeside lodge with all-inclusive dining, activities, and spa credit. Everything you need, nothing you don't.",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80",
    price: 180000,
    currency: "MWK",
    location: "Mangochi",
    duration: "2 nights",
    mood: ["Escape", "Romantic", "Relax"],
    rating: 4.9,
    reviewCount: 67,
    category: "Escape",
    featured: true,
    galleryCategory: "Overnight",
  },
  {
    id: "girls-day-out",
    title: "Girls Day Out",
    subtitle: "Fun, Food & Photos",
    description: "A curated day of shopping, spa treatments, brunch, and a photoshoot at the best spots in town. Treat your besties.",
    image: "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=600&q=80",
    price: 55000,
    currency: "MWK",
    location: "Lilongwe",
    duration: "6 hours",
    mood: ["Social", "Celebrate", "Self Care"],
    rating: 4.7,
    reviewCount: 112,
    category: "Social",
    featured: true,
    galleryCategory: "Day Out",
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
    mood: ["Celebrate", "Social", "Entertainment"],
    rating: 4.8,
    reviewCount: 91,
    category: "Celebrations",
    featured: true,
    galleryCategory: "Events",
  },
  {
    id: "wellness-retreat",
    title: "Wellness Retreat",
    subtitle: "Reset Your Soul",
    description: "A weekend wellness retreat with yoga, meditation, farm-to-table meals, and lakeside mindfulness sessions. Find your center.",
    image: "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=600&q=80",
    price: 150000,
    currency: "MWK",
    location: "Salima",
    duration: "2 days",
    mood: ["Self Care", "Escape", "Relax"],
    rating: 4.8,
    reviewCount: 45,
    category: "Wellness",
    featured: true,
    galleryCategory: "Wellness",
  },
  {
    id: "wine-tasting",
    title: "Wine & Dine",
    subtitle: "Vintage Evenings",
    description: "A guided wine tasting experience paired with gourmet canapés at an exclusive vineyard estate. Sip, savour, repeat.",
    image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&q=80",
    price: 40000,
    currency: "MWK",
    location: "Zomba",
    duration: "2.5 hours",
    mood: ["Food & Drink", "Romantic", "Indulge"],
    rating: 4.5,
    reviewCount: 54,
    category: "Food & Drink",
    featured: false,
    galleryCategory: "Dining",
  },
  {
    id: "adventure-day",
    title: "Adventure Day",
    subtitle: "Thrills & Spills",
    description: "An action-packed day with zip-lining, kayaking, hiking, and a bush lunch at a nature reserve. For the brave at heart.",
    image: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&q=80",
    price: 70000,
    currency: "MWK",
    location: "Dedza",
    duration: "8 hours",
    mood: ["Adventure", "Escape", "Social"],
    rating: 4.6,
    reviewCount: 78,
    category: "Adventure",
    featured: false,
    galleryCategory: "Adventure",
  },
  {
    id: "couples-massage",
    title: "Couples Massage",
    subtitle: "Relax Together",
    description: "A side-by-side massage experience in a private lakeside cabana with aromatherapy and organic oils. Connect through calm.",
    image: "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=600&q=80",
    price: 55000,
    currency: "MWK",
    location: "Salima",
    duration: "90 minutes",
    mood: ["Romantic", "Self Care", "Relax"],
    rating: 4.9,
    reviewCount: 143,
    category: "Wellness",
    featured: false,
    galleryCategory: "Wellness",
  },
  {
    id: "photoshoot",
    title: "Premium Photoshoot",
    subtitle: "Picture Perfect",
    description: "A professional photoshoot with a stylist, makeup artist, and premium locations around the city. Capturing your best angles.",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80",
    price: 65000,
    currency: "MWK",
    location: "Lilongwe",
    duration: "3 hours",
    mood: ["Self Care", "Celebrate", "Indulge"],
    rating: 4.7,
    reviewCount: 99,
    category: "Self Care",
    featured: false,
    galleryCategory: "Day Out",
  },
  {
    id: "lake-kayaking",
    title: "Lake Kayaking",
    subtitle: "Paddle at Dawn",
    description: "A guided sunrise kayaking tour along the shores of Lake Malawi with a beachfront breakfast. Peace on water.",
    image: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&q=80",
    price: 30000,
    currency: "MWK",
    location: "Cape Maclear",
    duration: "3 hours",
    mood: ["Adventure", "Escape", "Relax"],
    rating: 4.5,
    reviewCount: 63,
    category: "Adventure",
    featured: false,
    galleryCategory: "Adventure",
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
    mood: ["Romantic", "Food & Drink", "Indulge"],
    rating: 4.8,
    reviewCount: 134,
    category: "Food & Drink",
    featured: false,
    galleryCategory: "Dining",
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
    mood: ["Food & Drink", "Relax", "Social"],
    rating: 4.4,
    reviewCount: 87,
    category: "Food & Drink",
    featured: false,
    galleryCategory: "Dining",
  },
  {
    id: "sunset-safari",
    title: "Sunset Safari",
    subtitle: "Wild Encounters at Dusk",
    description: "An evening game drive through a private reserve followed by sundowners overlooking the African plains. Wild luxury.",
    image: "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=600&q=80",
    price: 95000,
    currency: "MWK",
    location: "Liwonde",
    duration: "4 hours",
    mood: ["Adventure", "Romantic", "Escape"],
    rating: 4.9,
    reviewCount: 56,
    category: "Adventure",
    featured: false,
    galleryCategory: "Adventure",
  },
  {
    id: "private-beach-dinner",
    title: "Private Beach Dinner",
    subtitle: "Secluded Romance",
    description: "A private candlelit dinner on a secluded Lake Malawi beach with a personal chef, waiter, and stargazing setup. Pure magic.",
    image: "https://images.unsplash.com/photo-1478146059778-6f8b45b4a7fc?w=600&q=80",
    price: 130000,
    currency: "MWK",
    location: "Cape Maclear",
    duration: "4 hours",
    mood: ["Romantic", "Escape", "Food & Drink"],
    rating: 5.0,
    reviewCount: 32,
    category: "Luxury",
    featured: false,
    galleryCategory: "Dining",
  },
  {
    id: "glamping-weekend",
    title: "Glamping Weekend",
    subtitle: "Luxury Under Canvas",
    description: "A weekend of luxury camping with safari tents, gourmet campfire dining, hot showers, and sunrise lake views. Roughing it, refined.",
    image: "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?w=600&q=80",
    price: 200000,
    currency: "MWK",
    location: "Mangochi",
    duration: "2 nights",
    mood: ["Escape", "Romantic", "Adventure"],
    rating: 4.7,
    reviewCount: 41,
    category: "Escape",
    featured: false,
    galleryCategory: "Overnight",
  },
  {
    id: "paint-sip",
    title: "Paint & Sip",
    subtitle: "Art Meets Wine",
    description: "A guided painting session paired with unlimited wine at a chic art studio. No experience needed, just your creativity.",
    image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&q=80",
    price: 35000,
    currency: "MWK",
    location: "Lilongwe",
    duration: "3 hours",
    mood: ["Social", "Entertainment", "Relax"],
    rating: 4.6,
    reviewCount: 73,
    category: "Entertainment",
    featured: false,
    galleryCategory: "Events",
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
    mood: ["Entertainment", "Social", "Relax"],
    rating: 4.5,
    reviewCount: 68,
    category: "Entertainment",
    featured: false,
    galleryCategory: "Nightlife",
  },
  {
    id: "cooking-class",
    title: "Cooking Class",
    subtitle: "Taste Malawi",
    description: "Learn to cook traditional Malawian dishes with a master chef. Visit the market, prep ingredients, then feast on your creations.",
    image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&q=80",
    price: 40000,
    currency: "MWK",
    location: "Lilongwe",
    duration: "4 hours",
    mood: ["Food & Drink", "Social", "Entertainment"],
    rating: 4.6,
    reviewCount: 47,
    category: "Food & Drink",
    featured: false,
    galleryCategory: "Dining",
  },
  {
    id: "yoga-retreat",
    title: "Yoga Retreat",
    subtitle: "Find Your Flow",
    description: "A half-day yoga retreat with expert instructors, meditation sessions, organic lunch, and a lakeside setting. Breathe, stretch, exist.",
    image: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=600&q=80",
    price: 50000,
    currency: "MWK",
    location: "Salima",
    duration: "4 hours",
    mood: ["Self Care", "Relax", "Escape"],
    rating: 4.7,
    reviewCount: 38,
    category: "Wellness",
    featured: false,
    galleryCategory: "Wellness",
  },
  {
    id: "family-picnic",
    title: "Family Picnic",
    subtitle: "Sun, Games & Smiles",
    description: "A curated family day out with gourmet picnic hampers, lawn games, face painting, and endless fun for kids and adults alike.",
    image: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=600&q=80",
    price: 35000,
    currency: "MWK",
    location: "Lilongwe",
    duration: "4 hours",
    mood: ["Family", "Social", "Relax"],
    rating: 4.5,
    reviewCount: 82,
    category: "Family",
    featured: false,
    galleryCategory: "Day Out",
  },
  {
    id: "mixology-class",
    title: "Mixology Class",
    subtitle: "Shake, Stir & Sip",
    description: "Learn craft cocktail making from a master mixologist. Shake, stir, and taste your way through classic and signature drinks.",
    image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&q=80",
    price: 45000,
    currency: "MWK",
    location: "Lilongwe",
    duration: "2.5 hours",
    mood: ["Social", "Entertainment", "Celebrate"],
    rating: 4.6,
    reviewCount: 55,
    category: "Entertainment",
    featured: false,
    galleryCategory: "Nightlife",
  },
  {
    id: "horse-riding",
    title: "Horse Riding",
    subtitle: "Trail & Gallop",
    description: "Guided horse riding through scenic trails, open plains, and riverside paths. Suitable for beginners and experienced riders.",
    image: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&q=80",
    price: 50000,
    currency: "MWK",
    location: "Dedza",
    duration: "2 hours",
    mood: ["Adventure", "Escape", "Family"],
    rating: 4.4,
    reviewCount: 36,
    category: "Adventure",
    featured: false,
    galleryCategory: "Adventure",
  },
];

export const experiences: Experience[] = rawExperiences.map((e) => {
  const city = nearestCity(e.location);
  return {
    ...e,
    images: [e.image, ...getGalleryImages(e.galleryCategory)],
    partner: getPartner(e.title),
    includes: getIncludes(e.galleryCategory),
    capacity: getCapacity(e.galleryCategory),
    coordinates: getCoords(e.location),
    city,
    distance: "",
    reviews: generateReviews(e.id, e.rating),
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
    getExperiences: () => shuffle(experiences.filter((e) => e.mood.some((m) => ["Relax", "Indulge", "Self Care"].includes(m)))).slice(0, 8),
  },
  weekend: {
    title: "Perfect For This Weekend",
    getExperiences: () => shuffle(experiences.filter((e) => e.duration.includes("hours") && parseInt(e.duration) <= 4)).slice(0, 8),
  },
  "most-saved": {
    title: "Most Saved",
    getExperiences: () => [...experiences].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 8),
  },
  new: {
    title: "New Experiences",
    getExperiences: () => shuffle(experiences.filter((e) => e.featured)).slice(0, 8),
  },
  "date-ideas": {
    title: "Date Night Ideas",
    getExperiences: () => shuffle(experiences.filter((e) => e.mood.includes("Romantic"))).slice(0, 8),
  },
  wellness: {
    title: "Wellness & Self Care",
    getExperiences: () => shuffle(experiences.filter((e) => e.mood.some((m) => ["Self Care", "Relax"].includes(m)))).slice(0, 8),
  },
  "food-drink": {
    title: "Food & Drink",
    getExperiences: () => shuffle(experiences.filter((e) => e.mood.includes("Food & Drink"))).slice(0, 8),
  },
  luxury: {
    title: "Luxury Experiences",
    getExperiences: () => shuffle(experiences.filter((e) => e.price >= 100000)).slice(0, 8),
  },
  celebrations: {
    title: "Celebrations",
    getExperiences: () => shuffle(experiences.filter((e) => e.mood.includes("Celebrate"))).slice(0, 8),
  },
  "hidden-gems": {
    title: "Hidden Gems",
    getExperiences: () => shuffle(experiences.filter((e) => e.rating >= 4.5 && e.reviewCount < 60)).slice(0, 8),
  },
  "staff-picks": {
    title: "Staff Picks",
    getExperiences: () => shuffle(experiences.filter((e) => e.rating >= 4.8)).slice(0, 8),
  },
  affordable: {
    title: "Affordable Experiences",
    getExperiences: () => shuffle(experiences.filter((e) => e.price <= 50000)).slice(0, 8),
  },
  adventure: {
    title: "Adventure Awaits",
    getExperiences: () => shuffle(experiences.filter((e) => e.mood.includes("Adventure"))).slice(0, 8),
  },
  family: {
    title: "Family Fun",
    getExperiences: () => shuffle(experiences.filter((e) => e.mood.includes("Family"))).slice(0, 8),
  },
};

export const railOrder: DiscoveryRailKey[] = [
  "trending",
  "recommended",
  "weekend",
  "most-saved",
  "new",
  "date-ideas",
  "wellness",
  "food-drink",
  "luxury",
  "celebrations",
  "hidden-gems",
  "staff-picks",
  "affordable",
  "adventure",
  "family",
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

export const AI_CONCIERGE_RESPONSES: Record<string, { explanation: string; experienceIds: string[] }> = {
  romantic: {
    explanation: "For a romantic experience, I recommend these intimate and beautiful moments perfect for two.",
    experienceIds: ["sunset-cruise", "date-night", "private-beach-dinner", "rooftop-dining", "couples-massage"],
  },
  relax: {
    explanation: "Unwind and recharge with these calming experiences designed to melt your stress away.",
    experienceIds: ["spa-day", "wellness-retreat", "yoga-retreat", "coffee-brunch", "pool-lunch"],
  },
  celebrate: {
    explanation: "Time to celebrate! These experiences are perfect for marking life's special moments.",
    experienceIds: ["birthday-experience", "girls-day-out", "paint-sip", "mixology-class", "rooftop-dining"],
  },
  adventure: {
    explanation: "Feed your adventurous spirit with these thrilling and exciting experiences.",
    experienceIds: ["adventure-day", "lake-kayaking", "sunset-safari", "horse-riding", "glamping-weekend"],
  },
  food: {
    explanation: "For food lovers, here are the best culinary experiences that will delight your taste buds.",
    experienceIds: ["brunch-experience", "wine-tasting", "cooking-class", "rooftop-dining", "coffee-brunch"],
  },
  family: {
    explanation: "Perfect for the whole family! These experiences have something for everyone to enjoy together.",
    experienceIds: ["family-picnic", "pool-lunch", "adventure-day", "lake-kayaking", "glamping-weekend"],
  },
  budget: {
    explanation: "Great experiences that won't break the bank. Here are affordable options you'll love.",
    experienceIds: ["coffee-brunch", "lake-kayaking", "paint-sip", "brunch-experience", "wine-tasting"],
  },
};

export function getConciergeResponse(query: string): { explanation: string; results: Experience[] } {
  const q = query.toLowerCase();
  let key = "romantic";
  if (q.includes("relax") || q.includes("calm") || q.includes("stress") || q.includes("unwind")) key = "relax";
  else if (q.includes("celebrate") || q.includes("birthday") || q.includes("party")) key = "celebrate";
  else if (q.includes("adventure") || q.includes("thrill") || q.includes("active") || q.includes("sport")) key = "adventure";
  else if (q.includes("food") || q.includes("eat") || q.includes("dinner") || q.includes("brunch") || q.includes("wine")) key = "food";
  else if (q.includes("family") || q.includes("kid") || q.includes("child")) key = "family";
  else if (q.includes("budget") || q.includes("cheap") || q.includes("affordable") || q.includes("cheap") || q.includes("30k")) key = "budget";
  else if (q.includes("romantic") || q.includes("date") || q.includes("together") || q.includes("couple")) key = "romantic";

  const response = AI_CONCIERGE_RESPONSES[key] || AI_CONCIERGE_RESPONSES.romantic;
  return {
    explanation: response.explanation,
    results: response.experienceIds.map((id) => experiences.find((e) => e.id === id)).filter(Boolean) as Experience[],
  };
}

export const defaultCollections = [
  { id: "date-ideas", name: "Date Ideas", experienceIds: [] },
  { id: "weekend-plans", name: "Weekend Plans", experienceIds: [] },
  { id: "relax-recharge", name: "Relax & Recharge", experienceIds: [] },
  { id: "dream-moments", name: "Dream Moments", experienceIds: [] },
];

export const defaultSavedIds = [
  "sunset-cruise", "spa-day", "rooftop-dining", "glamping-weekend",
  "date-night", "pool-lunch", "brunch-experience", "private-beach-dinner",
];

export const recentlyViewedMock = [
  { id: "private-beach-dinner", timestamp: Date.now() - 3600000 },
  { id: "sunset-safari", timestamp: Date.now() - 7200000 },
  { id: "date-night", timestamp: Date.now() - 14400000 },
  { id: "paint-sip", timestamp: Date.now() - 86400000 },
  { id: "pool-lunch", timestamp: Date.now() - 172800000 },
  { id: "sunset-cruise", timestamp: Date.now() - 259200000 },
];
