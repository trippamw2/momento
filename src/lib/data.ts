// Barrel file — re-exports all data from module components.
// Import paths remain unchanged (import { experiences } from "@/lib/data").

export {
  moods,
  moodAccent,
  navItems,
  experiences,
  CITIES,
  experiencesNear,
  discoveryRails,
  railOrder,
  getExperiencesByMood,
  getFeaturedExperiences,
  getExperienceById,
  getCategories,
  getLocations,
  filterExperiences,
} from "./data/experiences";

export {
  AI_CONCIERGE_RESPONSES,
  getConciergeResponse,
} from "./data/concierge";

export {
  defaultCollections,
  defaultSavedIds,
  recentlyViewedMock,
} from "./data/mock-saved";
