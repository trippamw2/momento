"use client";

import { useState } from "react";

interface AuthModalProps {
  onClose: () => void;
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const body = mode === "login" ? { email, password } : { email, password, full_name: name };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      if (mode === "signup") {
        setSuccess(true);
        setTimeout(() => { setMode("login"); setSuccess(false); }, 2000);
      } else {
        if (data.session?.access_token) {
          localStorage.setItem("momento-auth-token", data.session.access_token);
        }
        onClose();
        window.location.reload();
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-[#0A101B] border border-[rgba(255,255,255,0.08)] p-8 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {success ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-gradient-to-r from-[#FF2D7A] to-[#FF7A18] flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-heading-md font-bold text-white mb-2">Account created!</h2>
            <p className="text-body-sm text-[#A1A1AA]">Check your email to confirm your account.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-heading-lg font-bold text-white">
                {mode === "login" ? "Welcome back" : "Join Momento"}
              </h2>
              <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/[0.06] text-[#A1A1AA] transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <input
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#111827] border border-[rgba(255,255,255,0.08)] text-white text-body-sm placeholder:text-[#6B7280] focus:outline-none focus:border-[#FF2D7A] focus:ring-1 focus:ring-[#FF2D7A]/50 transition-all"
                  required
                />
              )}
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#111827] border border-[rgba(255,255,255,0.08)] text-white text-body-sm placeholder:text-[#6B7280] focus:outline-none focus:border-[#FF2D7A] focus:ring-1 focus:ring-[#FF2D7A]/50 transition-all"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#111827] border border-[rgba(255,255,255,0.08)] text-white text-body-sm placeholder:text-[#6B7280] focus:outline-none focus:border-[#FF2D7A] focus:ring-1 focus:ring-[#FF2D7A]/50 transition-all"
                required
                minLength={6}
              />

              {error && (
                <p className="text-body-sm text-red-400 bg-red-400/10 px-3 py-2 rounded-xl">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF2D7A] to-[#FF7A18] text-white font-semibold text-body-sm hover:shadow-[0_4px_24px_rgba(255,45,122,0.35)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : mode === "login" ? (
                  "Sign In"
                ) : (
                  "Create Account"
                )}
              </button>
            </form>

            <p className="text-center text-body-sm text-[#A1A1AA] mt-5">
              {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
                className="text-[#FF2D7A] hover:text-[#FF7A18] font-medium transition-colors"
              >
                {mode === "login" ? "Sign up" : "Sign in"}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}