"use client";

import { useState, useRef, useEffect } from "react";

interface SocialShareProps {
  url?: string;
  title?: string;
  description?: string;
  className?: string;
}

export default function SocialShare({ url, title = "Check this out!", description, className = "" }: SocialShareProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
  const shareText = description ? `${title} â€” ${description}` : title;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setOpen(false);
    } catch (e) { console.warn("Failed to copy link:", e); }
  };

  const shareLinks = [
    { label: "Copy Link", action: copyLink, icon: "ðŸ”—" },
    { label: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`, icon: "ðŸ’¬" },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, icon: "ðŸ“˜" },
    { label: "Twitter", href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, icon: "ðŸ¦" },
  ];

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#dddddd] text-body-sm text-[#6a6a6a] hover:text-[#222222] hover:border-[#222222] transition-all"
        aria-label="Share"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        Share
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-white border border-[#ebebeb] shadow-[0_4px_16px_rgba(0,0,0,0.08)] py-1.5 z-50">
          {shareLinks.map((link) => (
            link.href ? (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-body-sm text-[#222222] hover:bg-[#f7f7f7] transition-colors"
              >
                <span>{link.icon}</span>
                {link.label}
              </a>
            ) : (
              <button
                key={link.label}
                onClick={link.action}
                className="flex items-center gap-2.5 w-full px-4 py-2 text-body-sm text-[#222222] hover:bg-[#f7f7f7] transition-colors text-left"
              >
                <span>{link.icon}</span>
                {link.label}
              </button>
            )
          ))}
        </div>
      )}
    </div>
  );
}
