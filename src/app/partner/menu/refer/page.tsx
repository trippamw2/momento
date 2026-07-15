"use client";

import { useState } from "react";
import { useAuthGuard } from "@/lib/use-auth-guard";

export default function ReferHostPage() {
  const { allowed: isPartner, loading: authLoading } = useAuthGuard({ requiredRole: "partner" });
  const [copied, setCopied] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");

  const referralLink = "https://experio.com/refer?ref=PARTNER_NAME";

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendInvite = () => {
    if (!inviteEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) return;
    setEmailSent(true);
    setInviteEmail("");
    setTimeout(() => setEmailSent(false), 3000);
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
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-display-sm font-bold text-white mb-2">Refer a Host</h1>
        <p className="text-[#64748B] text-body-lg">Invite others to become hosts and earn rewards</p>
      </div>

      {/* Referral Link Card */}
      <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-r from-[#FF0F73]/10 to-[#FF7A1A]/10 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-[#FF0F73]/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-[#FF0F73]" viewBox="0 0 20 20" fill="currentColor">
              <path d="M15 8a3 3 0 11-2.165-5.276L13 8H9v2h4v2h2V8z" />
              <path d="M4.995 3.834a.997.997 0 00-.563-.147A.996.996 0 004 4.5c0 .47.278.863.663.984.301.095.597.07.854-.098.276-.173.52-.45.703-.752.173-.28.173-.622 0-.905a2.99 2.99 0 01-.416-1.863A9.92 9.92 0 014 3.198a9.818 9.818 0 01.995-.636zm.27 8.072a.997.997 0 00-.564.147A.996.996 0 004 15.5c0 .47.278-.863.663-.984.301-.095.597-.07.854.098.276.173.52.45.703.752.173.28.173.622 0 .905a2.99 2.99 0 01-.416 1.863A9.92 9.92 0 014 16.802a9.818 9.818 0 01-.995.636zm10.535-2.82a.997.997 0 00-.563-.147A.996.996 0 0014 15.5c0 .47.278-.863.663-.984.301-.095.597-.07.854.098.276.173.52.45.703.752.173.28.173.622 0 .905a2.99 2.99 0 01-.416 1.863A9.92 9.92 0 0114 16.802a9.818 9.818 0 01-.995.636zm.27-8.072a.997.997 0 00-.564-.147A.996.996 0 0014 4.5c0 .47.278.863.663.984.301.095.597.07.854-.098.276-.173.52-.45.703-.752.173-.28.173-.622 0-.905a2.99 2.99 0 01-.416-1.863A9.92 9.92 0 0114 3.198a9.818 9.818 0 01-.995-.636z" />
            </svg>
          </div>
          <div>
            <h3 className="text-heading-sm font-bold text-white">Share Your Referral Link</h3>
            <p className="text-[#64748B] text-body-sm">Earn rewards when someone you refer becomes an active host</p>
          </div>
        </div>

        <div className="relative mb-4">
          <input
            type="text"
            value={referralLink}
            readOnly
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white text-body-sm placeholder-[#64748B] focus:outline-none"
          />
          <button
            onClick={copyLink}
            className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 rounded-lg bg-[#FF0F73] text-white text-caption font-medium hover:bg-[#FF7A1A] transition-colors"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        <p className="text-caption text-[#64748B] text-center">
          Your unique referral link — share it with friends, on social media, or via email
        </p>
      </div>

      {/* Email Invite */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-6">
        <h3 className="text-heading-sm font-bold text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-[#FF0F73]" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
          </svg>
          Send Email Invitation
        </h3>
        <p className="text-[#64748B] text-body-sm mb-4">Send a personalized invitation directly to their inbox</p>

        {emailSent ? (
          <div className="rounded-xl p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-center">
            <svg className="w-8 h-8 mx-auto mb-2 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="font-medium">Invitation sent successfully!</p>
            <p className="text-caption text-emerald-400/80">We've sent an invitation email to the address provided.</p>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="friend@example.com"
              className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#FF0F73]/30 focus:border-[#FF0F73] text-body-sm transition-all"
            />
            <button
              onClick={sendInvite}
              disabled={!inviteEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#FF0F73] to-[#FF7A1A] text-white font-semibold text-body-sm hover:shadow-[0_4px_16px_rgba(255,15,115,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send Invite
            </button>
          </div>
        )}
      </div>

      {/* Your Referrals Stats */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-6">
        <h3 className="text-heading-sm font-bold text-white mb-4">Your Referrals</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-xl bg-white/5">
            <p className="text-display-sm font-bold text-white">3</p>
            <p className="text-caption text-[#64748B]">Invites Sent</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-white/5">
            <p className="text-display-sm font-bold text-[#FF0F73]">1</p>
            <p className="text-caption text-[#64748B]">Joined</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-white/5">
            <p className="text-display-sm font-bold text-emerald-400">MK 0</p>
            <p className="text-caption text-[#64748B]">Earned</p>
          </div>
        </div>
        <p className="text-caption text-[#64748B] text-center mt-4">
          Rewards are paid when referred hosts complete their first 3 experiences
        </p>
      </div>

      {/* Share Options */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-6">
        <h3 className="text-heading-sm font-bold text-white mb-4">Share via</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/[0.08] hover:bg-white/10 hover:border-[#FF0F73]/30 transition-all">
            <svg className="w-6 h-6 text-[#FF0F73]" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
            <span className="text-caption text-white">Facebook</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/[0.08] hover:bg-white/10 hover:border-[#FF0F73]/30 transition-all">
            <svg className="w-6 h-6 text-[#FF0F73]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.8c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.07 2.91.83.09-.65.35-1.1.63-1.36-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.39.1 2.65.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.68.92.68 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" /></svg>
            <span className="text-caption text-white">Twitter</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/[0.08] hover:bg-white/10 hover:border-[#FF0F73]/30 transition-all">
            <svg className="w-6 h-6 text-[#FF0F73]" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.063-2.064 2.063zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
            <span className="text-caption text-white">LinkedIn</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/[0.08] hover:bg-white/10 hover:border-[#FF0F73]/30 transition-all">
            <svg className="w-6 h-6 text-[#FF0F73]" viewBox="0 0 24 24" fill="currentColor"><path d="M10.293 5.707a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L12.586 6H5a1 1 0 110-2h7.586l-3.293-3.293a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414z" /><path d="M4 12a2 2 0 00-2 2v4a2 2 0 002 2h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.586l1.293-1.293a1 1 0 10-1.414-1.414l-4 4a1 1 0 000 1.414l4 4a1 1 0 001.414-1.414L13.414 12H16a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4a2 2 0 012-2h2.586z" /></svg>
            <span className="text-caption text-white">WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
}