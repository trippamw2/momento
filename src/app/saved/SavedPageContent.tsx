"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Experience } from "@/lib/types";
import { trackSaved } from "@/lib/recommendation-engine";
import { getRecentlyViewed, RecentlyViewedItem } from "@/lib/recently-viewed";

// Minimal shape the API returns for nested experience data on saved items
interface ApiSavedExperience {
  id: string;
  title: string;
  slug?: string;
  subtitle?: string;
  price: number;
  currency: string;
  location: string;
  duration?: string;
  rating: number;
  review_count: number;
  category: string;
  images?: { url: string; alt?: string; is_primary?: boolean }[];
}

interface ApiSavedItem {
  id: string;
  experience_id: string;
  collection_id: string | null;
  experience: ApiSavedExperience;
}

/** Convert an API saved item's nested experience into a partial Experience usable by this page */
function apiToExperience(apiExp: ApiSavedExperience): Experience | null {
  if (!apiExp || !apiExp.id) return null;
  // Derive a city from location
  const city = (apiExp.location || "").split(",")[0].trim() || apiExp.location;
  const primary = apiExp.images?.find((i) => i.is_primary);
  const image = primary?.url || apiExp.images?.[0]?.url || "";
  return {
    id: apiExp.id,
    title: apiExp.title || "Untitled",
    subtitle: apiExp.subtitle || "",
    description: "",
    image,
    images: (apiExp.images || []).map((i) => i.url),
    price: apiExp.price ?? 0,
    currency: apiExp.currency || "MWK",
    partner: "",
    location: apiExp.location || "",
    city,
    distance: "",
    duration: apiExp.duration || "",
    mood: [],
    intentions: [],
    rating: apiExp.rating ?? 0,
    reviewCount: apiExp.review_count ?? 0,
    category: (apiExp.category as Experience["category"]) || "Date",
    featured: false,
    includes: [],
    capacity: 0,
    coordinates: { lat: 0, lng: 0 },
    reviews: [],
  };
}

interface Collection {
  id: string;
  name: string;
  experienceIds: string[];
}

interface SavedState {
  savedIds: string[];
  collections: Collection[];
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function loadState(): SavedState {
  if (typeof window === "undefined") return { savedIds: [], collections: [] };
  try {
    const raw = localStorage.getItem("experio-saved");
    if (raw) return JSON.parse(raw);
  } catch (e) { console.warn("Failed to load saved state:", e); }
  return { savedIds: [], collections: [] };
}

function saveState(state: SavedState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("experio-saved", JSON.stringify(state));
  } catch (e) { console.warn("Failed to save state:", e); }
}

// API sync helpers
async function apiSave(experienceId: string): Promise<string | null> {
  try {
    const token = localStorage.getItem("experio-auth-token");
    if (!token) return null;
    const res = await fetch("/api/saved", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ experience_id: experienceId }),
    });
    if (res.ok) { const d = await res.json(); return d.id || null; }
  } catch { /* offline fallback */ }
  return null;
}

async function apiUnsave(savedId: string): Promise<boolean> {
  try {
    const token = localStorage.getItem("experio-auth-token");
    if (!token) return false;
    const res = await fetch(`/api/saved/${savedId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch { /* offline fallback */ }
  return false;
}

async function apiFetchSavedItems(): Promise<{ items: ApiSavedItem[]; ids: string[] }> {
  try {
    const token = localStorage.getItem("experio-auth-token");
    if (!token) return { items: [], ids: [] };
    const res = await fetch("/api/saved?limit=100", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const d = await res.json();
      const items: ApiSavedItem[] = d.saved || [];
      const ids = items.map((s) => s.experience_id);
      return { items, ids };
    }
  } catch { /* offline fallback */ }
  return { items: [], ids: [] };
}

async function apiAssignCollection(savedId: string, collectionId: string | null): Promise<boolean> {
  try {
    const token = localStorage.getItem("experio-auth-token");
    if (!token) return false;
    const res = await fetch(`/api/saved/${savedId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ collection_id: collectionId }),
    });
    return res.ok;
  } catch { return false; }
}

function loadFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("experio-favorites");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveFavorites(ids: string[]) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem("experio-favorites", JSON.stringify(ids)); }
  catch { /* silently fail */ }
}

type SidebarTab = "all" | "favorites" | "want-to-try" | "events" | "gift-ideas" | "recently-viewed";

const sidebarItems: { key: SidebarTab; label: string }[] = [
  { key: "all", label: "All Saved" },
  { key: "favorites", label: "Favorites" },
  { key: "want-to-try", label: "Want To Try" },
  { key: "events", label: "Events" },
  { key: "gift-ideas", label: "Gift Ideas" },
  { key: "recently-viewed", label: "Recently Viewed" },
];

export default function SavedPageContent() {
  const [state, setState] = useState<SavedState>(loadState);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("all");
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [favoriteIds, setFavoriteIds] = useState<string[]>(loadFavorites);
  const [savedIdMap, setSavedIdMap] = useState<Record<string, string>>({});

  const [apiExperiences, setApiExperiences] = useState<Map<string, Experience>>(new Map());
  const [apiSavedItems, setApiSavedItems] = useState<ApiSavedItem[]>([]);

  // Sync saved items from DB on mount
  useEffect(() => {
    const syncFromDB = async () => {
      const { items, ids } = await apiFetchSavedItems();
      if (items.length > 0) {
        setApiSavedItems(items);
        // Convert API experiences to Experience type and build ID map
        const expMap = new Map<string, Experience>();
        items.forEach((item) => {
          const conv = apiToExperience(item.experience);
          if (conv) expMap.set(item.experience_id, conv);
        });
        setApiExperiences(expMap);
        // Build savedIdMap from API IDs
        const idMap: Record<string, string> = {};
        items.forEach((item) => { idMap[item.experience_id] = item.id; });
        setSavedIdMap(idMap);
        setState(prev => ({
          ...prev,
          savedIds: [...new Set([...prev.savedIds, ...ids])],
        }));
      }
    };
    syncFromDB();
  }, []);

  useEffect(() => { saveState(state); }, [state]);
  useEffect(() => { saveFavorites(favoriteIds); }, [favoriteIds]);

  // All experiences come from API — no mock fallback
  const allExperiences = useMemo(
    () => Array.from(apiExperiences.values()),
    [apiExperiences]
  );

  const savedExperiences = useMemo(
    () => allExperiences.filter((e) => state.savedIds.includes(e.id)),
    [state.savedIds, allExperiences]
  );

  const toggleSave = useCallback(async (id: string) => {
    const exists = state.savedIds.includes(id);
    trackSaved(id, !exists);
    setState((prev) => ({
      ...prev,
      savedIds: exists ? prev.savedIds.filter((s) => s !== id) : [...prev.savedIds, id],
    }));
    // Sync to DB
    if (exists) {
      const savedId = savedIdMap[id];
      if (savedId) await apiUnsave(savedId);
    } else {
      const dbId = await apiSave(id);
      if (dbId) setSavedIdMap(prev => ({ ...prev, [id]: dbId }));
    }
  }, [state.savedIds, savedIdMap]);

  const addToCollection = useCallback(async (experienceId: string, collectionId: string) => {
    // Optimistic local update
    setState((prev) => ({
      ...prev,
      collections: prev.collections.map((c) =>
        c.id === collectionId && !c.experienceIds.includes(experienceId)
          ? { ...c, experienceIds: [...c.experienceIds, experienceId] }
          : c
      ),
    }));
    // Persist to API
    const savedId = savedIdMap[experienceId];
    if (savedId) await apiAssignCollection(savedId, collectionId);
  }, [savedIdMap]);

  const removeFromCollection = useCallback((experienceId: string, collectionId: string) => {
    setState((prev) => ({
      ...prev,
      collections: prev.collections.map((c) =>
        c.id === collectionId
          ? { ...c, experienceIds: c.experienceIds.filter((eid) => eid !== experienceId) }
          : c
      ),
    }));
  }, []);

  const createCollection = useCallback(() => {
    const name = newCollectionName.trim();
    if (!name) return;
    const id = name.toLowerCase().replace(/\s+/g, "-");
    setState((prev) => ({
      ...prev,
      collections: [...prev.collections, { id, name, experienceIds: [] }],
    }));
    setCreatingCollection(false);
    setNewCollectionName("");
  }, [newCollectionName]);

  const deleteCollection = useCallback((id: string) => {
    setState((prev) => ({ ...prev, collections: prev.collections.filter((c) => c.id !== id) }));
  }, []);

  const getFilteredExperiences = (): Experience[] => {
    let list: Experience[];
    switch (sidebarTab) {
      case "all": list = savedExperiences; break;
      case "favorites": list = allExperiences.filter((e) => favoriteIds.includes(e.id)); break;
      case "want-to-try": list = savedExperiences.filter((e) => e.category === "Date" || e.mood.includes("Active")); break;
      case "events": list = savedExperiences.filter((e) => e.category === "Escape" || e.category === "Celebrate"); break;
      case "gift-ideas": list = savedExperiences.filter((e) => e.mood.includes("Luxurious") || e.mood.includes("Romantic")); break;
      case "recently-viewed": {
        const rv = getRecentlyViewed();
        list = rv.map((item) => allExperiences.find((e) => e.id === item.id)).filter(Boolean) as Experience[];
        break;
      }
      default: list = savedExperiences;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((e) =>
        e.title.toLowerCase().includes(q) ||
        e.subtitle.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q)
      );
    }
    return list;
  };

  const displayed = getFilteredExperiences();

  const getSidebarCount = (key: SidebarTab): number => {
    switch (key) {
      case "all": return savedExperiences.length;
      case "favorites": return allExperiences.filter((e) => favoriteIds.includes(e.id)).length;
      case "want-to-try": return savedExperiences.filter((e) => e.category === "Date" || e.mood.includes("Active")).length;
      case "events": return savedExperiences.filter((e) => e.category === "Escape" || e.category === "Celebrate").length;
      case "gift-ideas": return savedExperiences.filter((e) => e.mood.includes("Luxurious") || e.mood.includes("Romantic")).length;
      case "recently-viewed": return getRecentlyViewed().length;
      default: return 0;
    }
  };

  const pageTitle = sidebarItems.find((s) => s.key === sidebarTab)?.label || "All Saved";
  const isRecentlyTab = sidebarTab === "recently-viewed";

  return (
    <div className="pt-20 pb-16 min-h-screen max-h-[100dvh] overflow-hidden">
      <div className="max-w-7xl mx-auto flex gap-0 sm:gap-6 px-0 sm:px-8 h-[calc(100dvh-80px)] overflow-hidden">
        {/* ─── Sidebar ─── */}
        <aside className="hidden sm:flex flex-col w-56 flex-shrink-0 sticky top-24 self-start">
          <div className="bg-[#111827] border border-white/[0.08] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.08]">
              <h2 className="text-heading-sm font-bold text-[#F1F5F9]">My List</h2>
              <p className="text-caption text-[#64748B] mt-0.5">{savedExperiences.length} saved</p>
            </div>
            <nav className="p-2 space-y-0.5">
              {sidebarItems.map((item) => {
                const count = getSidebarCount(item.key);
                return (
                  <button
                    key={item.key}
                    onClick={() => setSidebarTab(item.key)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-body-sm font-medium transition-all duration-200 ${
                      sidebarTab === item.key
                        ? "bg-[#FF0F73]/10 text-[#F1F5F9] border border-[#FF0F73]/20"
                        : "text-[#64748B] hover:text-[#F1F5F9] hover:bg-[#1A2332]"
                    }`}
                  >
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.key !== "recently-viewed" && count > 0 && (
                      <span className={`text-caption px-1.5 py-0.5 rounded-md ${
                        sidebarTab === item.key ? "bg-[#FF0F73]/10 text-[#FF0F73]" : "bg-[#1A2332] text-[#64748B]"
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Mobile sidebar tabs */}
        <div className="sm:hidden w-full px-4 mb-4">
          <div className="flex gap-1 overflow-x-auto hide-scrollbar pb-2">
            {sidebarItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setSidebarTab(item.key)}
                className={`px-4 py-2 rounded-full text-body-sm font-medium whitespace-nowrap transition-all ${
                  sidebarTab === item.key
                    ? "bg-[#FF0F73] text-white"
                    : "bg-[#1A2332] text-[#64748B] border border-white/[0.08]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* ─── Main Content ─── */}
        <main className="flex-1 min-w-0 px-4 sm:px-0 h-full overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-heading-xl font-bold text-[#F1F5F9]">{pageTitle}</h1>
              <p className="text-[#64748B] text-body-sm mt-0.5">
                {isRecentlyTab
                  ? `${getRecentlyViewed().length} recently viewed`
                  : `${displayed.length} experience${displayed.length !== 1 ? "s" : ""}`
                }
              </p>
            </div>
            {!isRecentlyTab && displayed.length > 0 && (
              <button
                onClick={() => window.location.href = "/experiences"}
                className="text-body-sm text-[#64748B] hover:text-[#F1F5F9] transition-colors font-medium"
              >
                Browse all
              </button>
            )}
          </div>

          {/* ─── Search Bar ─── */}
          {!isRecentlyTab && savedExperiences.length > 0 && (
            <div className="relative mb-4 max-w-md">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search saved experiences..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-[#1A2332] border border-white/[0.08] text-[#F1F5F9] text-body-sm placeholder:text-[#64748B]/60 focus:outline-none focus:border-[#FF0F73] focus:ring-1 focus:ring-[#FF0F73]/30 transition-all"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-text-secondary text-xs">✕</button>
              )}
            </div>
          )}

          {/* ─── Saved / Filtered Grid ─── */}
          {displayed.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-10">
                {displayed.map((exp) => (
                  <SavedCard
                    key={exp.id}
                    experience={exp}
                    isSaved={state.savedIds.includes(exp.id)}
                    onToggleSave={() => toggleSave(exp.id)}
                    isFavorited={favoriteIds.includes(exp.id)}
                    onToggleFavorite={() => setFavoriteIds((prev) =>
                      prev.includes(exp.id) ? prev.filter((id) => id !== exp.id) : [...prev, exp.id]
                    )}
                    collections={state.collections}
                    onAddToCollection={(colId) => addToCollection(exp.id, colId)}
                  />
                ))}
              </div>

              {/* ─── Collections Section ─── */}
              {!isRecentlyTab && (
                <section className="mb-10">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-heading-md font-bold text-[#F1F5F9]">Collections</h2>
                    <button
                       onClick={() => setCreatingCollection(true)}
                       className="text-body-sm text-[#64748B] hover:text-[#F1F5F9] transition-colors font-medium"
                     >
                       Create
                     </button>
                  </div>

                  <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
                    {state.collections.map((col) => {
                      const colExps = Array.from(apiExperiences.values()).filter((e) => col.experienceIds.includes(e.id));
                      const coverImg = colExps.length > 0 ? colExps[0].image : null;
                      return (
                        <div key={col.id} className="flex-shrink-0 w-48 group">
                          <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-[#1A2332] mb-2">
                            {coverImg ? (
                              <Image src={coverImg} alt={col.name} fill className="object-cover" sizes="192px" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-2xl opacity-20 font-light">▣</span>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                            <button
                              onClick={() => deleteCollection(col.id)}
                              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500/60 transition-all"
                            >
                              <span className="text-body font-bold text-white">✕</span>
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 p-2.5">
                              <p className="text-white font-semibold text-body-sm">{col.name}</p>
                              <p className="text-[#CBD5E1] text-caption">{col.experienceIds.length} experiences</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {creatingCollection ? (
                      <div className="flex-shrink-0 w-48 p-3 rounded-xl bg-[#1A2332] border border-white/[0.08] flex flex-col justify-center gap-2">
                        <input
                          type="text"
                          placeholder="Collection name"
                          value={newCollectionName}
                          onChange={(e) => setNewCollectionName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") createCollection(); }}
                          className="w-full px-3 py-2 rounded-lg bg-[#1A2332] text-[#F1F5F9] text-body-sm border border-white/[0.08] focus:outline-none focus:border-[#FF0F73] placeholder:text-[#64748B]"
                          autoFocus
                        />
                        <div className="flex gap-1.5">
                          <button onClick={createCollection} className="flex-1 py-1.5 rounded-lg bg-[#FF0F73] text-white text-caption font-medium">Create</button>
                          <button onClick={() => { setCreatingCollection(false); setNewCollectionName(""); }} className="flex-1 py-1.5 rounded-lg bg-[#111827] text-[#64748B] text-caption border border-white/[0.08]">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setCreatingCollection(true)}
                        className="flex-shrink-0 w-48 rounded-xl border-2 border-dashed border-white/[0.08] hover:border-[#FF0F73]/30 transition-all flex flex-col items-center justify-center gap-1 text-[#64748B] hover:text-[#64748B]"
                      >
                        <span className="text-3xl font-light">＋</span>
                        <span className="text-caption font-medium">New Collection</span>
                      </button>
                    )}
                  </div>
                </section>
              )}

              {/* ─── Recently Viewed Section ─── */}
              {!isRecentlyTab && getRecentlyViewed().length > 0 && (
                <section className="mb-10">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-heading-md font-bold text-[#F1F5F9]">Recently Viewed</h2>
                    <button
                      onClick={() => setSidebarTab("recently-viewed")}
                      className="text-body-sm text-[#64748B] hover:text-[#F1F5F9] transition-colors"
                    >
                      View all
                    </button>
                  </div>
                  <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
                    {getRecentlyViewed().slice(0, 6).map((rv) => {
                      const exp = apiExperiences.get(rv.id);
                      if (!exp) return null;
                      return (
                        <Link
                          key={rv.id}
                          href={`/experiences/${exp.id}`}
                          className="flex-shrink-0 w-40 group"
                        >
                          <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-[#1A2332] transition-all duration-500 group-hover:scale-[1.02] group-hover:shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
                            <Image src={exp.image} alt={exp.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" sizes="160px" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#05070B] via-transparent to-transparent" />
                            <div className="absolute top-2 left-2">
                              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/50 backdrop-blur-sm text-white/70 border border-white/10">
                                {timeAgo(rv.timestamp)}
                              </span>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-2.5">
                              <h3 className="text-white font-semibold text-body-sm leading-tight line-clamp-1">{exp.title}</h3>
                              <p className="text-[#CBD5E1] text-caption mt-0.5 line-clamp-1">{exp.subtitle}</p>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* ─── Bottom CTA ─── */}
              <section className="relative rounded-2xl overflow-hidden bg-[#111827] border border-white/[0.08] p-8 sm:p-10 text-center">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-[#FF0F73]/5 via-[#FF0F73]/5 to-[#FF0F73]/5 rounded-full blur-3xl" />
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-full bg-[#FF0F73] flex items-center justify-center mx-auto mb-4 shadow-[0_4px_16px_rgba(255, 15, 115, 0.2)]">
                    <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                  </div>
                  <h2 className="text-heading-xl font-bold text-[#F1F5F9] mb-2">Don&apos;t miss out on your favourites.</h2>
                  <p className="text-[#64748B] text-body-lg mb-6">Reserve your moment.</p>
                  <Link
                    href="/experiences"
                    className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-[#FF0F73] text-white font-semibold text-body-sm hover:shadow-[0_4px_16px_rgba(255, 15, 115, 0.25)] transition-all duration-300"
                  >
                    Discover Experiences
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  </Link>
                </div>
              </section>
            </>
          ) : (
            /* ─── Empty State ─── */
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-full bg-[#1A2332] flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
              </div>
              <h2 className="text-heading-md font-bold text-[#F1F5F9] mb-2">Nothing saved yet</h2>
              <p className="text-[#64748B] text-body-sm mb-6">Start exploring and save experiences you love.</p>
              <Link href="/experiences" className="inline-flex px-6 py-2.5 rounded-xl bg-[#FF0F73] text-white font-semibold text-body-sm hover:shadow-[0_4px_16px_rgba(255, 15, 115, 0.2)] transition-all">
                Browse Experiences
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function SavedCard({
  experience: exp,
  isSaved,
  onToggleSave,
  isFavorited,
  onToggleFavorite,
  collections,
  onAddToCollection,
}: {
  experience: Experience;
  isSaved: boolean;
  onToggleSave: () => void;
  isFavorited: boolean;
  onToggleFavorite: () => void;
  collections: Collection[];
  onAddToCollection: (colId: string) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="group relative">
      <Link href={`/experiences/${exp.id}`}>
        {/* Image container */}
        <div className="relative aspect-[4/3] sm:aspect-[4/3] rounded-xl overflow-hidden bg-[#1A2332] transition-all duration-500 group-hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
          <Image
            src={exp.image}
            alt={exp.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent" />

          {/* Heart / Save Toggle */}
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSave(); }}
            className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-[#FF0F73]/60 transition-all duration-200 z-10"
          >
            <svg
              width="16" height="16"
              viewBox="0 0 24 24"
              fill={isSaved ? "#FF0F73" : "none"}
              stroke={isSaved ? "#FF0F73" : "white"}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        </div>

        {/* Info below image */}
        <div className="mt-2.5 px-0.5">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-yellow-400 text-[11px]">★</span>
            <span className="text-caption text-[#CBD5E1] font-medium">{exp.rating}</span>
            <span className="text-caption text-[#64748B]">·</span>
            <span className="text-caption text-[#64748B]">{exp.reviewCount}</span>
          </div>
          <h3 className="text-[#F1F5F9] font-semibold text-body-sm leading-snug line-clamp-1">{exp.title}</h3>
          <p className="text-[#64748B] text-caption mt-0.5 line-clamp-1">{exp.subtitle || exp.category}</p>
          <p className="text-white font-semibold text-body-sm mt-1.5">
            MK {exp.price.toLocaleString()}
          </p>
        </div>
      </Link>

      {/* Add to Collection */}
      {collections.length > 0 && (
        <div className="absolute bottom-0 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          <div className="relative">
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowMenu(!showMenu); }}
              className="w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-[#f0f0f0] transition-colors"
              title="Add to collection"
            >
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                    <div className="absolute bottom-full right-0 mb-1 w-44 py-1 rounded-xl bg-[#111827] border border-white/[0.08] shadow-xl z-20">
                      <p className="px-3 py-1.5 text-caption text-[#64748B]">Add to collection</p>
                  {collections.map((col) => (
                    <button
                      key={col.id}
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAddToCollection(col.id); setShowMenu(false); }}
                      className="w-full px-3 py-2 text-left text-body-sm text-[#64748B] hover:bg-[#1A2332] hover:text-[#F1F5F9] transition-colors flex items-center gap-2"
                    >
                      <svg className="w-3.5 h-3.5 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      {col.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}