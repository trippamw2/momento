import { Experience, Mood, NavItem, DiscoveryRailKey, Review, V2Category } from "./types";
import { haversineDistance, formatDistance, AFRICAN_CITY_COORDS } from "./geo";

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
  { label: "Memories", href: "/bookings", icon: "calendar" },
  { label: "Partners", href: "/profile", icon: "briefcase" },
];

const gallerySets: Record<string, string[]> = {
  "Date Night": [
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80",
    "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=1200&q=80",
    "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1200&q=80",
  ],
  "Pool & Chill": [
    "https://images.unsplash.com/photo-1570488344399-635a23a3b731?w=1200&q=80",
    "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=1200&q=80",
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80",
  ],
  "Spa & Wellness": [
    "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1200&q=80",
    "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=1200&q=80",
    "https://images.unsplash.com/photo-1447452001602-7090c7ab2db3?w=1200&q=80",
  ],
  "Brunch & Dining": [
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&q=80",
    "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=1200&q=80",
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80",
  ],
  Staycation: [
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80",
    "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1200&q=80",
    "https://images.unsplash.com/photo-1571896349842-353c43544e52?w=1200&q=80",
  ],
  Celebrations: [
    "https://images.unsplash.com/photo-1464349153735-7db50ed83c84?w=1200&q=80",
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80",
    "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=1200&q=80",
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
  "Date Night": [
    "Curated multi-course menu or picnic",
    "Premium beverage pairing",
    "Private or VIP seating",
    "Personalized service",
    "All taxes and charges",
  ],
  "Pool & Chill": [
    "Pool access and loungers",
    "Curated lunch or snacks",
    "Premium beverages",
    "Towels and amenities",
    "Return transfers available",
  ],
  "Spa & Wellness": [
    "Full-body treatment session",
    "Organic product use",
    "Sauna or steam room access",
    "Herbal tea and refreshments",
    "Post-treatment relaxation lounge",
  ],
  "Brunch & Dining": [
    "Curated multi-course menu",
    "Premium beverage pairing",
    "Personal chef or waiter service",
    "Private or VIP seating",
    "All taxes and service charges",
  ],
  Staycation: [
    "Luxury accommodation",
    "All-inclusive dining",
    "Spa or activity credit",
    "Sunset or sunrise experience",
    "Concierge service",
  ],
  Celebrations: [
    "Full event planning",
    "Venue decoration",
    "Catering and cake",
    "Entertainment",
    "Photography package",
  ],
};

const capacityMap: Record<string, number> = {
  "Date Night": 4,
  "Pool & Chill": 10,
  "Spa & Wellness": 4,
  "Brunch & Dining": 8,
  Staycation: 4,
  Celebrations: 20,
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
  return gallerySets[category] || gallerySets["Date Night"];
}

function getPartner(title: string): string {
  return partners[title] || `${title} by Experio`;
}

function getIncludes(category: string): string[] {
  return includesMap[category] || includesMap["Date Night"];
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
    location: "Blantyre",
    duration: "3 hours",
    mood: ["Romantic", "Luxurious"],
    rating: 4.9,
    reviewCount: 178,
    category: "Date Night",
    featured: true,
    galleryCategory: "Date Night",
  },
  {
    id: "pool-lunch",
    title: "Pool & Lunch",
    subtitle: "Sun, Swim & Sip",
    description: "A luxurious afternoon at Lilongwe's finest pool club with a curated lunch menu and premium beverages. The ultimate weekend indulgence.",
    image: "https://images.unsplash.com/photo-1570488344399-635a23a3b731?w=600&q=80",
    price: 45000,
    currency: "MWK",
    location: "Lilongwe",
    duration: "4 hours",
    mood: ["Relaxed", "Social"],
    rating: 4.8,
    reviewCount: 124,
    category: "Pool & Chill",
    featured: true,
    galleryCategory: "Pool & Chill",
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
    rating: 4.9,
    reviewCount: 89,
    category: "Date Night",
    featured: true,
    galleryCategory: "Date Night",
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
    rating: 4.7,
    reviewCount: 156,
    category: "Spa & Wellness",
    featured: true,
    galleryCategory: "Spa & Wellness",
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
    rating: 4.6,
    reviewCount: 203,
    category: "Brunch & Dining",
    featured: true,
    galleryCategory: "Brunch & Dining",
  },
  {
    id: "staycation",
    title: "Lakeside Staycation",
    subtitle: "Escape Without Leaving",
    description: "A curated stay at a premium lakeside lodge near Blantyre with all-inclusive dining, activities, and spa credit. Everything you need, nothing you don't.",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80",
    price: 180000,
    currency: "MWK",
    location: "Blantyre",
    duration: "2 nights",
    mood: ["Romantic", "Relaxed"],
    rating: 4.9,
    reviewCount: 67,
    category: "Staycation",
    featured: true,
    galleryCategory: "Staycation",
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
    rating: 4.7,
    reviewCount: 112,
    category: "Celebrations",
    featured: true,
    galleryCategory: "Celebrations",
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
    rating: 4.8,
    reviewCount: 91,
    category: "Celebrations",
    featured: true,
    galleryCategory: "Celebrations",
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
    rating: 4.8,
    reviewCount: 45,
    category: "Spa & Wellness",
    featured: true,
    galleryCategory: "Spa & Wellness",
  },
  {
    id: "wine-tasting",
    title: "Wine & Dine",
    subtitle: "Vintage Evenings",
    description: "A guided wine tasting experience paired with gourmet canapés at Blantyre's exclusive vineyard estate. Sip, savour, repeat.",
    image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&q=80",
    price: 40000,
    currency: "MWK",
    location: "Blantyre",
    duration: "2.5 hours",
    mood: ["Culinary", "Social"],
    rating: 4.5,
    reviewCount: 54,
    category: "Brunch & Dining",
    featured: false,
    galleryCategory: "Brunch & Dining",
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
    rating: 4.6,
    reviewCount: 78,
    category: "Date Night",
    featured: false,
    galleryCategory: "Date Night",
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
    rating: 4.9,
    reviewCount: 143,
    category: "Spa & Wellness",
    featured: false,
    galleryCategory: "Spa & Wellness",
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
    rating: 4.7,
    reviewCount: 99,
    category: "Celebrations",
    featured: false,
    galleryCategory: "Celebrations",
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
    rating: 4.5,
    reviewCount: 63,
    category: "Pool & Chill",
    featured: false,
    galleryCategory: "Pool & Chill",
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
    rating: 4.8,
    reviewCount: 134,
    category: "Date Night",
    featured: true,
    galleryCategory: "Date Night",
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
    rating: 4.4,
    reviewCount: 87,
    category: "Brunch & Dining",
    featured: false,
    galleryCategory: "Brunch & Dining",
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
    rating: 4.9,
    reviewCount: 56,
    category: "Date Night",
    featured: false,
    galleryCategory: "Date Night",
  },
  {
    id: "private-beach-dinner",
    title: "Private Beach Dinner",
    subtitle: "Secluded Romance",
    description: "A private candlelit dinner on a secluded beach with a personal chef, waiter service, and stargazing setup near Blantyre. Pure magic.",
    image: "https://images.unsplash.com/photo-1478146059778-6f8b45b4a7fc?w=600&q=80",
    price: 130000,
    currency: "MWK",
    location: "Blantyre",
    duration: "4 hours",
    mood: ["Romantic", "Luxurious"],
    rating: 5.0,
    reviewCount: 32,
    category: "Date Night",
    featured: true,
    galleryCategory: "Date Night",
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
    rating: 4.7,
    reviewCount: 41,
    category: "Staycation",
    featured: false,
    galleryCategory: "Staycation",
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
    rating: 4.6,
    reviewCount: 73,
    category: "Celebrations",
    featured: false,
    galleryCategory: "Celebrations",
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
    rating: 4.5,
    reviewCount: 68,
    category: "Celebrations",
    featured: false,
    galleryCategory: "Celebrations",
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
    rating: 4.6,
    reviewCount: 47,
    category: "Brunch & Dining",
    featured: false,
    galleryCategory: "Brunch & Dining",
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
    rating: 4.7,
    reviewCount: 38,
    category: "Spa & Wellness",
    featured: false,
    galleryCategory: "Spa & Wellness",
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
    rating: 4.5,
    reviewCount: 82,
    category: "Pool & Chill",
    featured: false,
    galleryCategory: "Pool & Chill",
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
    rating: 4.6,
    reviewCount: 55,
    category: "Celebrations",
    featured: false,
    galleryCategory: "Celebrations",
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
    rating: 4.4,
    reviewCount: 36,
    category: "Date Night",
    featured: false,
    galleryCategory: "Date Night",
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
    getExperiences: () => shuffle(experiences.filter((e) => e.category === "Date Night" || e.category === "Brunch & Dining")).slice(0, 8),
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
  "date-night": {
    title: "Date Night Ideas",
    getExperiences: () => shuffle(experiences.filter((e) => e.category === "Date Night")).slice(0, 8),
  },
  "pool-chill": {
    title: "Pool & Chill",
    getExperiences: () => shuffle(experiences.filter((e) => e.category === "Pool & Chill")).slice(0, 8),
  },
  "spa-wellness": {
    title: "Spa & Wellness",
    getExperiences: () => shuffle(experiences.filter((e) => e.category === "Spa & Wellness")).slice(0, 8),
  },
  "brunch-dining": {
    title: "Brunch & Dining",
    getExperiences: () => shuffle(experiences.filter((e) => e.category === "Brunch & Dining")).slice(0, 8),
  },
  staycation: {
    title: "Staycations",
    getExperiences: () => shuffle(experiences.filter((e) => e.category === "Staycation")).slice(0, 8),
  },
  celebrations: {
    title: "Celebrations",
    getExperiences: () => shuffle(experiences.filter((e) => e.category === "Celebrations")).slice(0, 8),
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
};

export const railOrder: DiscoveryRailKey[] = [
  "trending",
  "recommended",
  "nearby",
  "weekend",
  "most-saved",
  "date-night",
  "pool-chill",
  "spa-wellness",
  "brunch-dining",
  "staycation",
  "celebrations",
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

export const AI_CONCIERGE_RESPONSES: Record<string, { explanation: string; experienceIds: string[] }> = {
  date_night: {
    explanation: "For a romantic evening, I recommend these intimate experiences perfect for two.",
    experienceIds: ["sunset-cruise", "date-night", "private-beach-dinner", "rooftop-dining", "couples-massage"],
  },
  pool_chill: {
    explanation: "Looking to relax and unwind? These poolside and laid-back experiences are just the ticket.",
    experienceIds: ["pool-lunch", "lake-kayaking", "family-picnic", "paint-sip", "coffee-brunch"],
  },
  spa_wellness: {
    explanation: "Time to recharge! These wellness experiences will melt your stress away.",
    experienceIds: ["spa-day", "wellness-retreat", "yoga-retreat", "couples-massage", "pool-lunch"],
  },
  brunch_dining: {
    explanation: "For food lovers, here are the best culinary experiences that will delight your taste buds.",
    experienceIds: ["brunch-experience", "wine-tasting", "cooking-class", "rooftop-dining", "coffee-brunch"],
  },
  staycation: {
    explanation: "Escape without going far. These staycation experiences are perfect for a reset.",
    experienceIds: ["staycation", "glamping-weekend", "wellness-retreat", "spa-day", "private-beach-dinner"],
  },
  celebrate: {
    explanation: "Time to celebrate! These experiences are perfect for marking life's special moments.",
    experienceIds: ["birthday-experience", "girls-day-out", "paint-sip", "mixology-class", "live-music-night"],
  },
  budget: {
    explanation: "Great experiences that won't break the bank. Here are affordable options you'll love.",
    experienceIds: ["coffee-brunch", "lake-kayaking", "paint-sip", "brunch-experience", "wine-tasting"],
  },
};

export function getConciergeResponse(query: string): { explanation: string; results: Experience[] } {
  const q = query.toLowerCase();
  let key = "date_night";
  if (q.includes("pool") || q.includes("chill") || q.includes("swim") || q.includes("relax")) key = "pool_chill";
  else if (q.includes("spa") || q.includes("wellness") || q.includes("yoga") || q.includes("massage")) key = "spa_wellness";
  else if (q.includes("brunch") || q.includes("food") || q.includes("dinner") || q.includes("cook")) key = "brunch_dining";
  else if (q.includes("stay") || q.includes("weekend") || q.includes("escape") || q.includes("night")) key = "staycation";
  else if (q.includes("celebrate") || q.includes("birthday") || q.includes("party") || q.includes("girls")) key = "celebrate";
  else if (q.includes("budget") || q.includes("cheap") || q.includes("affordable")) key = "budget";
  else if (q.includes("date") || q.includes("romantic") || q.includes("couple") || q.includes("together")) key = "date_night";

  const response = AI_CONCIERGE_RESPONSES[key] || AI_CONCIERGE_RESPONSES.date_night;
  return {
    explanation: response.explanation,
    results: response.experienceIds.map((id) => experiences.find((e) => e.id === id)).filter(Boolean) as Experience[],
  };
}

export const defaultCollections = [
  { id: "date-ideas", name: "Date Ideas", experienceIds: [] },
  { id: "weekend-plans", name: "Weekend Plans", experienceIds: [] },
  { id: "spa-breaks", name: "Spa & Wellness", experienceIds: [] },
  { id: "celebrations", name: "Celebrations", experienceIds: [] },
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
