"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { experiences } from "@/lib/data";
import { Experience } from "@/lib/types";
import ContentRail from "@/components/ContentRail";

interface Collection {
  id: string;
  name: string;
  experienceIds: string[];
}

interface SavedState {
  savedIds: string[];
  collections: Collection[];
}

const defaultCollections: Collection[] = [
  { id: "date-ideas", name: "Date Ideas", experienceIds: [] },
  { id: "weekend-plans", name: "Weekend Plans", experienceIds: [] },
  { id: "relax-recharge", name: "Relax & Recharge", experienceIds: [] },
];

const defaultSaved: string[] = [
  "sunset-cruise", "spa-day", "rooftop-dining", "glamping-weekend",
];

function loadState(): SavedState {
  if (typeof window === "undefined") return { savedIds: defaultSaved, collections: defaultCollections };
  try {
    const raw = localStorage.getItem("momento-saved");
    if (raw) return JSON.parse(raw);
  } catch {}
  return { savedIds: defaultSaved, collections: defaultCollections };
}

function saveState(state: SavedState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("momento-saved", JSON.stringify(state));
  } catch {}
}

type Tab = "saved" | "collections" | "recent" | "foryou";

const recentlyViewedMock: { id: string; timestamp: number }[] = [
  { id: "private-beach-dinner", timestamp: Date.now() - 3600000 },
  { id: "sunset-safari", timestamp: Date.now() - 7200000 },
  { id: "date-night", timestamp: Date.now() - 14400000 },
  { id: "paint-sip", timestamp: Date.now() - 86400000 },
  { id: "pool-lunch", timestamp: Date.now() - 172800000 },
];

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function CollectionCard({
  collection,
  active,
  onClick,
  onDelete,
}: {
  collection: Collection;
  active: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex-shrink-0 w-44 p-4 rounded-xl text-left transition-all duration-200 ${
        active
          ? "bg-gradient-to-br from-brand-hot-pink to-brand-sunset-orange ring-2 ring-white/20 shadow-brand-glow"
          : "bg-surface-secondary border border-border-default hover:border-brand-hot-pink/30"
      }`}
    >
      <p className={`text-heading-sm font-bold mb-1 ${active ? "text-white" : "text-text-primary"}`}>{collection.name}</p>
      <p className={`text-caption ${active ? "text-white/70" : "text-text-tertiary"}`}>
        {collection.experienceIds.length} experience{collection.experienceIds.length !== 1 ? "s" : ""}
      </p>
      {!active && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="absolute top-2 right-2 w-5 h-5 rounded-full bg-surface-tertiary flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition-all"
        >
          <svg className="w-3 h-3 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      )}
    </button>
  );
}

export default function SavedPageContent() {
  const [state, setState] = useState<SavedState>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("momento-saved");
        if (raw) return JSON.parse(raw) as SavedState;
      } catch {}
    }
    return { savedIds: defaultSaved, collections: defaultCollections };
  });
  const [tab, setTab] = useState<Tab>("saved");
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(() => {
    const s = loadState();
    return s.collections.length > 0 ? s.collections[0].id : null;
  });
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");

  useEffect(() => { saveState(state); }, [state]);

  const savedExperiences = useMemo(
    () => experiences.filter((e) => state.savedIds.includes(e.id)),
    [state.savedIds]
  );

  const activeCollection = useMemo(
    () => state.collections.find((c) => c.id === activeCollectionId),
    [state.collections, activeCollectionId]
  );

  const activeCollectionExperiences = useMemo(
    () => activeCollection ? experiences.filter((e) => activeCollection.experienceIds.includes(e.id)) : [],
    [activeCollection]
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
    setActiveCollectionId(id);
    setCreatingCollection(false);
    setNewCollectionName("");
  }, [newCollectionName]);

  const deleteCollection = useCallback((id: string) => {
    setState((prev) => {
      const cols = prev.collections.filter((c) => c.id !== id);
      return { ...prev, collections: cols };
    });
    if (activeCollectionId === id) {
      const remaining = state.collections.filter((c) => c.id !== id);
      setActiveCollectionId(remaining.length > 0 ? remaining[0].id : null);
    }
  }, [activeCollectionId, state.collections]);

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "saved", label: "Saved", count: state.savedIds.length },
    { key: "collections", label: "Collections", count: state.collections.length },
    { key: "recent", label: "Recently Viewed" },
    { key: "foryou", label: "For You" },
  ];

  return (
    <div className="pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-display-sm font-bold text-text-primary mb-1">My List</h1>
          <p className="text-text-secondary text-body-lg">
            {state.savedIds.length} saved experience{state.savedIds.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-surface-tertiary border border-border-subtle w-fit mb-8">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-body-sm font-medium transition-all duration-200 ${
                tab === t.key
                  ? "bg-surface-elevated text-text-primary shadow-sm"
                  : "text-text-tertiary hover:text-text-secondary"
              }`}
            >
              {t.label}
              {t.count !== undefined && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded text-[10px] ${
                  tab === t.key ? "bg-brand-hot-pink/20 text-brand-hot-pink" : "bg-surface-elevated text-text-tertiary"
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ─── TAB: Saved ─── */}
        {tab === "saved" && (
          <>
            {savedExperiences.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                {savedExperiences.map((exp) => (
                  <SavedCard
                    key={exp.id}
                    experience={exp}
                    onRemove={() => toggleSave(exp.id)}
                    collections={state.collections}
                    onAddToCollection={(colId) => addToCollection(exp.id, colId)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="w-16 h-16 rounded-full bg-surface-tertiary flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                </div>
                <h2 className="text-heading-md font-bold text-text-primary mb-2">Nothing saved yet</h2>
                <p className="text-text-secondary text-body-sm mb-6">Start exploring and save experiences you love.</p>
                <Link href="/experiences" className="inline-flex px-6 py-2.5 rounded-full gradient-brand text-text-on-gradient font-semibold text-body-sm hover:shadow-brand-glow transition-all">
                  Browse Experiences
                </Link>
              </div>
            )}
          </>
        )}

        {/* ─── TAB: Collections ─── */}
        {tab === "collections" && (
          <>
            {/* Collection cards row */}
            <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 mb-6">
              {state.collections.map((col) => (
                <CollectionCard
                  key={col.id}
                  collection={col}
                  active={activeCollectionId === col.id}
                  onClick={() => setActiveCollectionId(col.id)}
                  onDelete={() => deleteCollection(col.id)}
                />
              ))}

              {/* Create collection */}
              {creatingCollection ? (
                <div className="flex-shrink-0 w-44 p-4 rounded-xl bg-surface-tertiary border border-border-default flex flex-col gap-2">
                  <input
                    type="text"
                    placeholder="Collection name"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") createCollection(); }}
                    className="w-full px-2 py-1.5 rounded-lg bg-surface-elevated text-text-primary text-body-sm border border-border-subtle focus:outline-none focus:border-brand-hot-pink placeholder:text-text-tertiary"
                    autoFocus
                  />
                  <div className="flex gap-1.5">
                    <button onClick={createCollection} className="flex-1 py-1.5 rounded-lg gradient-brand text-text-on-gradient text-caption font-medium">Create</button>
                    <button onClick={() => { setCreatingCollection(false); setNewCollectionName(""); }} className="flex-1 py-1.5 rounded-lg bg-surface-elevated text-text-secondary text-caption">Cancel</button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setCreatingCollection(true)}
                  className="flex-shrink-0 w-44 p-4 rounded-xl border-2 border-dashed border-border-subtle hover:border-brand-hot-pink/40 transition-all flex flex-col items-center justify-center gap-1 text-text-tertiary hover:text-text-secondary"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  <span className="text-caption font-medium">New Collection</span>
                </button>
              )}
            </div>

            {/* Active collection items */}
            {activeCollection && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-heading-md font-bold text-text-primary">{activeCollection.name}</h2>
                    <p className="text-caption text-text-tertiary">{activeCollection.experienceIds.length} experience{activeCollection.experienceIds.length !== 1 ? "s" : ""}</p>
                  </div>
                </div>

                {activeCollectionExperiences.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                    {activeCollectionExperiences.map((exp) => (
                      <SavedCard
                        key={exp.id}
                        experience={exp}
                        onRemove={() => removeFromCollection(exp.id, activeCollection.id)}
                        collections={state.collections.filter((c) => c.id !== activeCollection.id)}
                        onAddToCollection={(colId) => addToCollection(exp.id, colId)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 rounded-2xl bg-surface-secondary border border-border-default">
                    <p className="text-heading-sm text-text-tertiary mb-2">This collection is empty</p>
                    <p className="text-text-secondary text-body-sm mb-4">Save experiences from your list or browse to find new ones.</p>
                    <Link href="/experiences" className="inline-flex px-5 py-2 rounded-full gradient-brand text-text-on-gradient text-body-sm font-medium">
                      Discover Experiences
                    </Link>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ─── TAB: Recently Viewed ─── */}
        {tab === "recent" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-text-secondary text-body-sm">{recentlyViewedMock.length} recently viewed</p>
              <button className="text-caption text-text-tertiary hover:text-text-secondary transition-colors">Clear history</button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {recentlyViewedMock.map((rv) => {
                const exp = experiences.find((e) => e.id === rv.id);
                if (!exp) return null;
                return (
                  <Link key={rv.id} href={`/experiences/${exp.id}`} className="group relative">
                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-surface-tertiary card-hover">
                      <Image src={exp.image} alt={exp.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 640px) 50vw, 25vw" />
                      <div className="gradient-overlay-bottom absolute inset-0" />
                      <div className="absolute top-2 left-2">
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/40 backdrop-blur-sm text-white/70 border border-white/10">
                          {timeAgo(rv.timestamp)}
                        </span>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-2.5">
                        <h3 className="text-text-primary font-semibold text-body-sm leading-tight line-clamp-1">{exp.title}</h3>
                        <p className="text-white/60 text-caption mt-0.5 line-clamp-1">{exp.subtitle}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}

        {/* ─── TAB: For You ─── */}
        {tab === "foryou" && (
          <>
            {savedExperiences.length > 0 ? (
              <div className="space-y-8">
                {/* Based on saved moods */}
                <ContentRail
                  title="More of What You Like"
                  experiences={experiences.filter((e) =>
                    !state.savedIds.includes(e.id) &&
                    e.mood.some((m) => savedExperiences.some((se) => se.mood.includes(m)))
                  ).slice(0, 10)}
                />

                {/* Popular in your categories */}
                <ContentRail
                  title="Trending in Your Categories"
                  experiences={experiences.filter((e) =>
                    !state.savedIds.includes(e.id) &&
                    savedExperiences.some((se) => se.category === e.category)
                  ).slice(0, 10)}
                />

                {/* Top rated */}
                <ContentRail
                  title="Top Rated This Week"
                  experiences={[...experiences].sort((a, b) => b.rating - a.rating).slice(0, 10)}
                />
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="w-16 h-16 rounded-full bg-surface-tertiary flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                </div>
                <h2 className="text-heading-md font-bold text-text-primary mb-2">Save to get recommendations</h2>
                <p className="text-text-secondary text-body-sm mb-6">The more you save, the better your recommendations become.</p>
                <Link href="/experiences" className="inline-flex px-6 py-2.5 rounded-full gradient-brand text-text-on-gradient font-semibold text-body-sm hover:shadow-brand-glow transition-all">
                  Browse Experiences
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SavedCard({
  experience: exp,
  onRemove,
  collections,
  onAddToCollection,
}: {
  experience: Experience;
  onRemove: () => void;
  collections: Collection[];
  onAddToCollection: (colId: string) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="group relative">
      <Link href={`/experiences/${exp.id}`}>
        <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-surface-tertiary card-hover">
          <Image
            src={exp.image}
            alt={exp.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          <div className="gradient-overlay-bottom absolute inset-0" />
          <div className="absolute top-2 left-2">
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-brand-hot-pink/80 text-white border border-white/10">
              Saved
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-2.5">
            <h3 className="text-text-primary font-semibold text-body-sm leading-tight line-clamp-1">{exp.title}</h3>
            <p className="text-white/60 text-caption mt-0.5 line-clamp-1">{exp.subtitle}</p>
            <p className="text-text-primary font-semibold text-body-sm mt-1">MK {exp.price.toLocaleString()}</p>
          </div>
        </div>
      </Link>

      {/* Hover controls */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
        <button
          onClick={(e) => { e.preventDefault(); onRemove(); }}
          className="w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-red-500/60 transition-colors"
          title="Remove"
        >
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        {collections.length > 0 && (
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
                <div className="absolute top-full right-0 mt-1 w-44 py-1 rounded-xl bg-surface-elevated border border-border-default shadow-xl z-20">
                  <p className="px-3 py-1.5 text-caption text-text-tertiary">Add to collection</p>
                  {collections.map((col) => (
                    <button
                      key={col.id}
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAddToCollection(col.id); setShowMenu(false); }}
                      className="w-full px-3 py-2 text-left text-body-sm text-text-secondary hover:bg-white/5 hover:text-text-primary transition-colors flex items-center gap-2"
                    >
                      <svg className="w-3.5 h-3.5 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      {col.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
