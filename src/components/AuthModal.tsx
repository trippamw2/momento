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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Invalid email format";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    if (mode === "signup" && !name.trim()) {
      errors.name = "Full name is required";
    } else if (mode === "signup" && name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
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
        // If signup returned a session (auto-confirm enabled), log the user in immediately
        if (data.session?.access_token) {
          localStorage.setItem("experio-auth-token", data.session.access_token);
          const role = data.user?.user_metadata?.role || "user";
          localStorage.setItem("experio-user-role", role);
          onClose();
          window.location.reload();
        } else {
          // Email confirmation required — show success message, then switch to login
          setSuccess(true);
          setTimeout(() => { setMode("login"); setSuccess(false); }, 2000);
        }
      } else {
        if (data.session?.access_token) {
          localStorage.setItem("experio-auth-token", data.session.access_token);
          const role = data.user?.user_metadata?.role || "user";
          localStorage.setItem("experio-user-role", role);
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
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-3xl bg-white shadow-[0_16px_48px_rgba(0,0,0,0.12)] border border-[#ebebeb] overflow-hidden animate-[slideUp_0.3s_cubic-bezier(0.16,1,0.3,1)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Brand accent bar */}
        <div className="h-1.5 bg-gradient-to-r from-[#DD2A7B] via-[#F58529] to-[#8134AF]" />

        <div className="p-7">
          {success ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FF2D7A] to-[#FF7A18] flex items-center justify-center mx-auto mb-5 shadow-[0_4px_16px_rgba(255,45,122,0.2)]">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h2 className="text-heading-md font-bold text-[#222222] mb-2">Account created!</h2>
                <p className="text-body-sm text-[#6a6a6a]">Check your email to confirm your account.</p>
                <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <p className="text-body-sm font-medium text-amber-800">🎉 You earned 100 bonus points!</p>
                  <p className="text-caption text-amber-600 mt-0.5">Start booking to earn more and unlock tiers.</p>
                </div>
              </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-heading-lg font-bold text-[#222222]">
                    {mode === "login" ? "Welcome back" : "Join Experio"}
                  </h2>
                  <p className="text-caption text-[#6a6a6a] mt-0.5">
                    {mode === "login" ? "Sign in to continue discovering" : "Create your account to get started"}
                  </p>
                </div>
                <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-[#f5f2ef] text-[#6a6a6a] transition-colors shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {mode === "signup" && (
                  <div>
                    <div className="relative">
                      <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#929292]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      <input
                        type="text"
                        placeholder="Full name"
                        value={name}
                        onChange={(e) => { setName(e.target.value); if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: "" })); }}
                        className={`w-full pl-10 pr-4 py-3 rounded-xl bg-[#f5f2ef] text-[#222222] text-body-sm placeholder:text-[#929292] focus:outline-none focus:ring-1 transition-all ${
                          fieldErrors.name
                            ? "border border-[#c13515] focus:border-[#c13515] focus:ring-[#c13515]/20"
                            : "border border-[#ebebeb] focus:border-[#DD2A7B] focus:ring-[#DD2A7B]/20"
                        }`}
                      />
                    </div>
                    {fieldErrors.name && <p className="mt-1 text-caption text-[#c13515]">{fieldErrors.name}</p>}
                  </div>
                )}
                <div>
                  <div className="relative">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#929292]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    <input
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: "" })); }}
                      className={`w-full pl-10 pr-4 py-3 rounded-xl bg-[#f5f2ef] text-[#222222] text-body-sm placeholder:text-[#929292] focus:outline-none focus:ring-1 transition-all ${
                        fieldErrors.email
                          ? "border border-[#c13515] focus:border-[#c13515] focus:ring-[#c13515]/20"
                          : "border border-[#ebebeb] focus:border-[#DD2A7B] focus:ring-[#DD2A7B]/20"
                      }`}
                    />
                  </div>
                  {fieldErrors.email && <p className="mt-1 text-caption text-[#c13515]">{fieldErrors.email}</p>}
                </div>
                <div>
                  <div className="relative">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#929292]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    <input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: "" })); }}
                      className={`w-full pl-10 pr-4 py-3 rounded-xl bg-[#f5f2ef] text-[#222222] text-body-sm placeholder:text-[#929292] focus:outline-none focus:ring-1 transition-all ${
                        fieldErrors.password
                          ? "border border-[#c13515] focus:border-[#c13515] focus:ring-[#c13515]/20"
                          : "border border-[#ebebeb] focus:border-[#DD2A7B] focus:ring-[#DD2A7B]/20"
                      }`}
                    />
                  </div>
                  {fieldErrors.password && <p className="mt-1 text-caption text-[#c13515]">{fieldErrors.password}</p>}
                </div>

                {error && (
                  <p className="text-body-sm text-[#c13515] bg-[#c13515]/8 px-3 py-2 rounded-xl flex items-center gap-2">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#DD2A7B] to-[#F58529] text-white font-semibold text-body-sm hover:shadow-[0_4px_20px_rgba(255,56,92,0.35)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

              <div className="mt-5 text-center">
                <p className="text-body-sm text-[#6a6a6a]">
                  {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
                  <button
                    onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
                    className="text-[#DD2A7B] hover:text-[#e00b41] font-semibold transition-colors"
                  >
                    {mode === "login" ? "Sign up" : "Sign in"}
                  </button>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}