"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { experiences, defaultCollections, defaultSavedIds, recentlyViewedMock } from "@/lib/data";
import { Experience } from "@/lib/types";

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
  if (typeof window === "undefined") return { savedIds: defaultSavedIds, collections: defaultCollections };
  try {
    const raw = localStorage.getItem("momento-saved");
    if (raw) return JSON.parse(raw);
  } catch {}
  return { savedIds: defaultSavedIds, collections: defaultCollections };
}

function saveState(state: SavedState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("momento-saved", JSON.stringify(state));
  } catch {}
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

  useEffect(() => { saveState(state); }, [state]);

  const savedExperiences = useMemo(
    () => experiences.filter((e) => state.savedIds.includes(e.id)),
    [state.savedIds]
  );

  const toggleSave = useCallback((id: string) => {
    setState((prev) => {
      const exists = prev.savedIds.includes(id);
      return {
        ...prev,
        savedIds: exists ? prev.savedIds.filter((s) => s !== id) : [...prev.savedIds, id],
      };
    });
  }, []);

  const addToCollection = useCallback((experienceId: string, collectionId: string) => {
    setState((prev) => ({
      ...prev,
      collections: prev.collections.map((c) =>
        c.id === collectionId && !c.experienceIds.includes(experienceId)
          ? { ...c, experienceIds: [...c.experienceIds, experienceId] }
          : c
      ),
    }));
  }, []);

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
    switch (sidebarTab) {
      case "all": return savedExperiences;
      case "favorites": return savedExperiences.filter((e) => e.rating >= 4.8);
      case "want-to-try": return savedExperiences.filter((e) => e.category === "Adventure" || e.mood.includes("Escape"));
      case "events": return savedExperiences.filter((e) => e.category === "Entertainment" || e.category === "Celebrations");
      case "gift-ideas": return savedExperiences.filter((e) => e.mood.includes("Indulge") || e.mood.includes("Romantic"));
      case "recently-viewed": return recentlyViewedMock.map((rv) => experiences.find((e) => e.id === rv.id)).filter(Boolean) as Experience[];
      default: return savedExperiences;
    }
  };

  const displayed = getFilteredExperiences();

  const getSidebarCount = (key: SidebarTab): number => {
    switch (key) {
      case "all": return savedExperiences.length;
      case "favorites": return savedExperiences.filter((e) => e.rating >= 4.8).length;
      case "want-to-try": return savedExperiences.filter((e) => e.category === "Adventure" || e.mood.includes("Escape")).length;
      case "events": return savedExperiences.filter((e) => e.category === "Entertainment" || e.category === "Celebrations").length;
      case "gift-ideas": return savedExperiences.filter((e) => e.mood.includes("Indulge") || e.mood.includes("Romantic")).length;
      case "recently-viewed": return recentlyViewedMock.length;
      default: return 0;
    }
  };

  const pageTitle = sidebarItems.find((s) => s.key === sidebarTab)?.label || "All Saved";
  const isRecentlyTab = sidebarTab === "recently-viewed";

  return (
    <div className="pt-20 pb-16 min-h-screen">
      <div className="max-w-7xl mx-auto flex gap-0 sm:gap-6 px-0 sm:px-8">
        {/* ─── Sidebar ─── */}
        <aside className="hidden sm:flex flex-col w-56 flex-shrink-0 sticky top-24 self-start">
          <div className="bg-[#0A101B] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <h2 className="text-heading-sm font-bold text-white">My List</h2>
              <p className="text-caption text-[#6B7280] mt-0.5">{savedExperiences.length} saved</p>
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
                        ? "bg-gradient-to-r from-[#FF2D7A]/15 to-[#FF7A18]/15 text-white border border-[#FF2D7A]/20"
                        : "text-[#A1A1AA] hover:text-white hover:bg-white/[0.04]"
                    }`}
                  >
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.key !== "recently-viewed" && count > 0 && (
                      <span className={`text-caption px-1.5 py-0.5 rounded-md ${
                        sidebarTab === item.key ? "bg-white/[0.1] text-white" : "bg-[#111827] text-[#6B7280]"
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
                    ? "bg-gradient-to-r from-[#FF2D7A] to-[#FF7A18] text-white"
                    : "bg-[#111827] text-[#A1A1AA] border border-white/[0.06]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* ─── Main Content ─── */}
        <main className="flex-1 min-w-0 px-4 sm:px-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-heading-xl font-bold text-white">{pageTitle}</h1>
              <p className="text-[#A1A1AA] text-body-sm mt-0.5">
                {isRecentlyTab
                  ? `${recentlyViewedMock.length} recently viewed`
                  : `${displayed.length} experience${displayed.length !== 1 ? "s" : ""}`
                }
              </p>
            </div>
            {!isRecentlyTab && displayed.length > 0 && (
              <button
                onClick={() => window.location.href = "/experiences"}
                className="text-body-sm text-[#A1A1AA] hover:text-white transition-colors font-medium"
              >
                Browse all
              </button>
            )}
          </div>

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
                    collections={state.collections}
                    onAddToCollection={(colId) => addToCollection(exp.id, colId)}
                  />
                ))}
              </div>

              {/* ─── Collections Section ─── */}
              {!isRecentlyTab && (
                <section className="mb-10">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-heading-md font-bold text-white">Collections</h2>
                    <button
                       onClick={() => setCreatingCollection(true)}
                       className="text-body-sm text-[#A1A1AA] hover:text-white transition-colors font-medium"
                     >
                       Create
                     </button>
                  </div>

                  <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
                    {state.collections.map((col) => {
                      const colExps = experiences.filter((e) => col.experienceIds.includes(e.id));
                      const coverImg = colExps.length > 0 ? colExps[0].image : null;
                      return (
                        <div key={col.id} className="flex-shrink-0 w-48 group">
                          <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-[#111827] mb-2">
                            {coverImg ? (
                              <Image src={coverImg} alt={col.name} fill className="object-cover" sizes="192px" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-2xl opacity-20 font-light">🗂</span>
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
                              <p className="text-white/60 text-caption">{col.experienceIds.length} experiences</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {creatingCollection ? (
                      <div className="flex-shrink-0 w-48 p-3 rounded-xl bg-[#111827] border border-white/[0.06] flex flex-col justify-center gap-2">
                        <input
                          type="text"
                          placeholder="Collection name"
                          value={newCollectionName}
                          onChange={(e) => setNewCollectionName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") createCollection(); }}
                          className="w-full px-3 py-2 rounded-lg bg-[#0A101B] text-white text-body-sm border border-white/[0.08] focus:outline-none focus:border-[#FF2D7A] placeholder:text-[#6B7280]"
                          autoFocus
                        />
                        <div className="flex gap-1.5">
                          <button onClick={createCollection} className="flex-1 py-1.5 rounded-lg bg-gradient-to-r from-[#FF2D7A] to-[#FF7A18] text-white text-caption font-medium">Create</button>
                          <button onClick={() => { setCreatingCollection(false); setNewCollectionName(""); }} className="flex-1 py-1.5 rounded-lg bg-[#0A101B] text-[#A1A1AA] text-caption border border-white/[0.06]">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setCreatingCollection(true)}
                        className="flex-shrink-0 w-48 rounded-xl border-2 border-dashed border-white/[0.08] hover:border-[#FF2D7A]/30 transition-all flex flex-col items-center justify-center gap-1 text-[#6B7280] hover:text-[#A1A1AA]"
                      >
                        <span className="text-3xl font-light">＋</span>
                        <span className="text-caption font-medium">New Collection</span>
                      </button>
                    )}
                  </div>
                </section>
              )}

              {/* ─── Recently Viewed Section ─── */}
              {!isRecentlyTab && (
                <section className="mb-10">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-heading-md font-bold text-white">Recently Viewed</h2>
                    <button
                      onClick={() => setSidebarTab("recently-viewed")}
                      className="text-body-sm text-[#A1A1AA] hover:text-white transition-colors"
                    >
                      View all
                    </button>
                  </div>
                  <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
                    {recentlyViewedMock.slice(0, 6).map((rv) => {
                      const exp = experiences.find((e) => e.id === rv.id);
                      if (!exp) return null;
                      return (
                        <Link
                          key={rv.id}
                          href={`/experiences/${exp.id}`}
                          className="flex-shrink-0 w-40 group"
                        >
                          <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-[#111827] transition-all duration-500 group-hover:scale-[1.02] group-hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                            <Image src={exp.image} alt={exp.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" sizes="160px" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#05070B] via-transparent to-transparent" />
                            <div className="absolute top-2 left-2">
                              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/50 backdrop-blur-sm text-white/70 border border-white/10">
                                {timeAgo(rv.timestamp)}
                              </span>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-2.5">
                              <h3 className="text-white font-semibold text-body-sm leading-tight line-clamp-1">{exp.title}</h3>
                              <p className="text-white/60 text-caption mt-0.5 line-clamp-1">{exp.subtitle}</p>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* ─── Bottom CTA ─── */}
              <section className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#111827] to-[#0A101B] border border-white/[0.06] p-8 sm:p-10 text-center">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-[#FF2D7A]/5 via-[#9F3BFF]/5 to-[#FF7A18]/5 rounded-full blur-3xl" />
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FF2D7A] to-[#FF7A18] flex items-center justify-center mx-auto mb-4 shadow-[0_4px_24px_rgba(255,45,122,0.35)]">
                    <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                  </div>
                  <h2 className="text-heading-xl font-bold text-white mb-2">Don&apos;t miss out on your favourites.</h2>
                  <p className="text-[#A1A1AA] text-body-lg mb-6">Book now and live the moment.</p>
                  <Link
                    href="/experiences"
                    className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#FF2D7A] to-[#FF7A18] text-white font-semibold text-body-sm hover:shadow-[0_8px_32px_rgba(255,45,122,0.4)] transition-all duration-300"
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
              <div className="w-16 h-16 rounded-full bg-[#111827] flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#6B7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
              </div>
              <h2 className="text-heading-md font-bold text-white mb-2">Nothing saved yet</h2>
              <p className="text-[#A1A1AA] text-body-sm mb-6">Start exploring and save experiences you love.</p>
              <Link href="/experiences" className="inline-flex px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#FF2D7A] to-[#FF7A18] text-white font-semibold text-body-sm hover:shadow-[0_4px_24px_rgba(255,45,122,0.35)] transition-all">
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
  collections,
  onAddToCollection,
}: {
  experience: Experience;
  isSaved: boolean;
  onToggleSave: () => void;
  collections: Collection[];
  onAddToCollection: (colId: string) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="group relative">
      <Link href={`/experiences/${exp.id}`}>
        <div className="relative aspect-[4/3] sm:aspect-[3/4] rounded-xl overflow-hidden bg-[#111827] transition-all duration-500 group-hover:scale-[1.02] group-hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <Image
            src={exp.image}
            alt={exp.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#05070B] via-transparent to-transparent" />

          {/* Category Badge */}
          <div className="absolute top-2.5 left-2.5">
            <span className="px-2.5 py-1 rounded-full text-caption font-medium bg-white/[0.08] backdrop-blur-md text-white/90 border border-white/[0.08]">
              {exp.category}
            </span>
          </div>

          {/* City Badge */}
          <div className="absolute top-2.5 right-12">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/40 backdrop-blur-sm text-white/70 border border-white/10">
              {exp.city}
            </span>
          </div>

          {/* Heart / Save Toggle */}
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSave(); }}
            className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-[#FF2D7A]/60 transition-all duration-200 z-10"
          >
            <svg
              width="16" height="16"
              viewBox="0 0 24 24"
              fill={isSaved ? "#FF2D7A" : "none"}
              stroke={isSaved ? "#FF2D7A" : "white"}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>

          {/* Bottom Info */}
          <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-yellow-400 text-[11px]">★</span>
              <span className="text-caption text-white/80 font-medium">{exp.rating}</span>
              <span className="text-caption text-white/30">·</span>
              <span className="text-caption text-white/50">{exp.reviewCount}</span>
            </div>
            <h3 className="text-white font-semibold text-body-sm leading-tight line-clamp-1">{exp.title}</h3>
            <p className="text-white/50 text-caption mt-0.5 line-clamp-1">{exp.subtitle}</p>
            <p className="text-white font-semibold text-body-sm mt-1.5">
              MK {exp.price.toLocaleString()}
            </p>
          </div>
        </div>
      </Link>

      {/* Add to Collection */}
      {collections.length > 0 && (
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          <div className="relative">
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowMenu(!showMenu); }}
              className="w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
              title="Add to collection"
            >
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute bottom-full right-0 mb-1 w-44 py-1 rounded-xl bg-[#1a2235] border border-white/[0.08] shadow-xl z-20">
                  <p className="px-3 py-1.5 text-caption text-[#6B7280]">Add to collection</p>
                  {collections.map((col) => (
                    <button
                      key={col.id}
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAddToCollection(col.id); setShowMenu(false); }}
                      className="w-full px-3 py-2 text-left text-body-sm text-[#A1A1AA] hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2"
                    >
                      <svg className="w-3.5 h-3.5 text-[#6B7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
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