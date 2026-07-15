"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthGuard } from "@/lib/use-auth-guard";

interface Experience {
  id: string;
  title: string;
  status: string;
  images: string[];
}

interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadDate: string;
  label: string;
}

const DOCUMENT_LABELS = ["Business License", "Insurance", "ID Document", "Safety Certification", "Permit", "Other"];

export default function ListingSettingsPage() {
  const { allowed: isPartner, loading: authLoading } = useAuthGuard({ requiredRole: "partner" });
  const params = useParams();
  const router = useRouter();
  const listingId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [listing, setListing] = useState<Experience | null>(null);
  const [documents, setDocuments] = useState<Document[]>([
    { id: "1", name: "business_license.pdf", type: "PDF", size: "2.4 MB", uploadDate: "2024-01-15", label: "Business License" },
    { id: "2", name: "insurance_cert.pdf", type: "PDF", size: "1.8 MB", uploadDate: "2024-01-10", label: "Insurance" },
  ]);
  const [status, setStatus] = useState("draft");
  const [paused, setPaused] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [removeConfirmText, setRemoveConfirmText] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (authLoading || !isPartner) return;
    const token = localStorage.getItem("experio-auth-token");
    if (!token) return;

    fetch(`/api/experiences/${listingId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setListing({
          id: String(data.id ?? ""),
          title: String(data.title ?? data.name ?? "Untitled"),
          status: String(data.status ?? "draft"),
          images: Array.isArray(data.images) ? data.images : (data.image ? [data.image] : []),
        });
        setStatus(data.status ?? "draft");
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [authLoading, isPartner, listingId]);

  const handleStatusChange = async (newStatus: string) => {
    const token = localStorage.getItem("experio-auth-token");
    if (!token) return;

    try {
      await fetch(`/api/experiences/${listingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      setStatus(newStatus);
      setListing((prev) => prev ? { ...prev, status: newStatus } : null);
    } catch {
      alert("Failed to update status");
    }
  };

  const handlePauseToggle = () => {
    setPaused(!paused);
    alert(paused ? "Listing resumed" : "Listing paused - new bookings blocked");
  };

  const handleUnlist = () => {
    handleStatusChange("unlisted");
  };

  const handleRemoveConfirm = async () => {
    if (removeConfirmText !== "REMOVE") {
      alert("Please type 'REMOVE' to confirm");
      return;
    }
    const token = localStorage.getItem("experio-auth-token");
    if (!token) return;

    try {
      const res = await fetch(`/api/experiences/${listingId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        router.push("/partner/listings");
      } else {
        alert("Failed to remove listing");
      }
    } catch {
      alert("Network error");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setTimeout(() => {
      const newDoc: Document = {
        id: Date.now().toString(),
        name: file.name,
        type: file.type || "Unknown",
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        uploadDate: new Date().toISOString().split("T")[0],
        label: "Other",
      };
      setDocuments((prev) => [...prev, newDoc]);
      setUploading(false);
    }, 800);
  };

  const removeDocument = (id: string) => {
    if (confirm("Delete this document?")) {
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    }
  };

  const getStatusConfig = (s: string) => {
    switch (s) {
      case "active":
      case "published":
        return { label: "Live", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" };
      case "draft":
        return { label: "Draft", className: "bg-white/10 text-white/70 border-white/20" };
      case "unlisted":
        return { label: "Unlisted", className: "bg-amber-500/20 text-amber-400 border-amber-500/30" };
      default:
        return { label: s, className: "bg-white/10 text-white/60 border-white/20" };
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-2 border-[#FF0F73]/30 border-t-[#FF0F73] animate-spin" />
      </div>
    );
  }

  if (!isPartner) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <a href="/partner/listings" className="p-2 rounded-xl hover:bg-white/[0.04] transition-colors">
            <svg className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </a>
          <div>
            <h1 className="text-display-sm font-bold text-white mb-1">Settings</h1>
            <p className="text-[#64748B] text-body-lg">{listing?.title || "Loading..."}</p>
          </div>
        </div>
      </div>

      {loading && <div className="flex items-center justify-center h-32"><div className="w-8 h-8 rounded-full border-2 border-[#FF0F73]/30 border-t-[#FF0F73] animate-spin" /></div>}

      {!loading && listing && (
        <>
          {/* Listing Info Card */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-heading-sm font-bold text-white mb-1">{listing.title}</h2>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-caption font-semibold border ${getStatusConfig(listing.status).className}`}>
                    {getStatusConfig(listing.status).label}
                  </span>
                  <a href={`/experiences/${listing.id}`} target="_blank" rel="noopener noreferrer" className="text-body-sm text-[#FF0F73] hover:underline flex items-center gap-1">
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5zM4 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-2a1 1 0 10-2 0v2H4V7a1 1 0 011-1h2a1 1 0 000-2H4z" /></svg>
                    View on Site
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/[0.08] text-white focus:outline-none focus:ring-2 focus:ring-[#FF0F73]/30 focus:border-[#FF0F73] text-body-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Live</option>
                  <option value="unlisted">Unlisted</option>
                </select>
              </div>
            </div>
          </div>

          {/* Documents & Certifications */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-heading-sm font-bold text-white">Documents & Certifications</h2>
              <label className="px-4 py-2 rounded-xl border-2 border-dashed border-white/[0.15] hover:border-[#FF0F73]/50 hover:bg-white/[0.02] transition-all text-body-sm text-[#64748B] hover:text-white cursor-pointer flex items-center gap-2">
                <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={handleFileUpload} className="hidden" disabled={uploading} />
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zm0 4v8a2 2 0 002 2h12a2 2 0 002-2V8H4zm2-2h12v2H6V6zm0 4h12v2H6v-2z" /></svg>
                <span>Upload Document</span>
              </label>
            </div>
            {documents.length === 0 ? (
              <div className="text-center py-8 text-[#64748B] text-body-sm">No documents uploaded yet</div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border border-white/[0.06] bg-white/5">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-white/60" viewBox="0 0 20 20" fill="currentColor"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zm0 4v8a2 2 0 002 2h12a2 2 0 002-2V8H4zm2-2h12v2H6V6zm0 4h12v2H6v-2z" /></svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-body-sm font-medium text-white truncate">{doc.name}</p>
                        <p className="text-caption text-[#64748B] flex items-center gap-2">
                          <span>{doc.type} · {doc.size}</span>
                          <span>·</span>
                          <span>{doc.uploadDate}</span>
                          <span>·</span>
                          <span className="px-2 py-0.5 rounded text-caption font-medium bg-white/10 text-white/70">{doc.label}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={doc.label}
                        onChange={(e) => setDocuments((prev) => prev.map((d) => d.id === doc.id ? { ...d, label: e.target.value } : d))}
                        className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/[0.08] text-white text-caption focus:outline-none focus:ring-2 focus:ring-[#FF0F73]/30"
                      >
                        {DOCUMENT_LABELS.map((l) => <option key={l} value={l}>{l}</option>)}
                      </select>
                      <button onClick={() => removeDocument(doc.id)} className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors">
                        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path d="M6 4a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zM4 6v12a2 2 0 002 2h10a2 2 0 002-2V6H4z" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Listing Status Controls */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-5">
            <h2 className="text-heading-sm font-bold text-white mb-4">Listing Status Controls</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl border border-white/[0.06] bg-white/5">
                <div>
                  <p className="text-body-sm font-semibold text-white">Pause Listing</p>
                  <p className="text-caption text-[#64748B]">Temporarily stop new bookings. Existing bookings are honored.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={paused} onChange={handlePauseToggle} className="sr-only peer" />
                  <div className="w-11 h-6 bg-white/10 peer-focus:ring-4 peer-focus:ring-[#FF0F73]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF0F73]"></div>
                </label>
              </div>
              <button
                onClick={handleUnlist}
                className="w-full px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 font-medium hover:bg-amber-500/20 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                Unlist from Search
              </button>
            </div>
          </div>

          {/* Danger Zone - Remove Listing */}
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
              </div>
              <div>
                <h2 className="text-heading-sm font-bold text-red-400">Danger Zone</h2>
                <p className="text-caption text-[#CBD5E1]">Once you remove this listing, all associated data including bookings, reviews, and messages will be permanently deleted. This action cannot be undone.</p>
              </div>
            </div>
            {showRemoveConfirm ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-body-sm font-medium text-[#CBD5E1] mb-1">Type "REMOVE" to confirm</label>
                  <input
                    type="text"
                    value={removeConfirmText}
                    onChange={(e) => setRemoveConfirmText(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-red-500/30 text-white placeholder-red-500/30 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 text-body-sm"
                    placeholder="REMOVE"
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowRemoveConfirm(false)} className="px-5 py-3 rounded-xl border border-white/[0.08] text-white font-medium hover:bg-white/5 transition-all flex-1">
                    Cancel
                  </button>
                  <button onClick={handleRemoveConfirm} disabled={removeConfirmText !== "REMOVE"} className="px-5 py-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-1">
                    Remove Listing Permanently
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowRemoveConfirm(true)} className="w-full px-5 py-3 rounded-xl border-2 border-dashed border-red-500/30 bg-red-500/5 text-red-400 font-semibold hover:bg-red-500/10 transition-all flex items-center justify-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path d="M6 4a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zM4 6v12a2 2 0 002 2h10a2 2 0 002-2V6H4z" /></svg>
                Remove This Listing
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}