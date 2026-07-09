export const defaultCollections = [
  { id: "date-ideas", name: "Date Ideas", experienceIds: [] },
  { id: "weekend-plans", name: "Weekend Plans", experienceIds: [] },
  { id: "spa-breaks", name: "Chill & Relax", experienceIds: [] },
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
