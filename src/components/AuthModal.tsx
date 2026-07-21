"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface AuthModalProps {
  onClose: () => void;
}

type AuthMode = "login" | "signup";
type SignupRole = "user" | "partner";

export default function AuthModal({ onClose }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [signupRole, setSignupRole] = useState<SignupRole>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("experio-signup-role");
      if (saved === "partner") {
        localStorage.removeItem("experio-signup-role");
        return "partner";
      }
    }
    return "user";
  });

  useEffect(() => {
    if (signupRole === "partner") setMode("signup");
  }, [signupRole]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (mode === "login") {
      if (!email.trim()) errors.email = "Email is required";
      if (!password) errors.password = "Password is required";
      setFieldErrors(errors);
      return Object.keys(errors).length === 0;
    }

    if (!name.trim()) errors.name = "Full name is required";
    else if (name.trim().length < 2) errors.name = "Name must be at least 2 characters";

    if (!email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Invalid email format";

    if (!password) errors.password = "Password is required";
    else if (password.length < 6) errors.password = "Password must be at least 6 characters";

    if (phone && !/^\+?[\d\s\-()]{7,15}$/.test(phone)) errors.phone = "Invalid phone number";
    if (birthdate && isNaN(Date.parse(birthdate))) errors.birthdate = "Invalid date";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Login failed. Please try again.");
          return;
        }

        if (data.session?.access_token) {
          localStorage.setItem("experio-auth-token", data.session.access_token);
          localStorage.setItem("experio-user-role", data.role || data.user?.user_metadata?.role || "user");
        }
        onClose();
        window.location.reload();
        return;
      }

      // ─── Signup ──────────────────────────────────────────

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          full_name: name,
          phone: phone || null,
          birthdate: birthdate || null,
          role: signupRole,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Account creation failed. Please try again.");
        return;
      }

      // Session is always returned now (email_confirm: true on the server)
      if (!data.session?.access_token) {
        setError("Account created. Please sign in.");
        setMode("login");
        return;
      }

      localStorage.setItem("experio-auth-token", data.session.access_token);
      localStorage.setItem("experio-user-role", signupRole);

      // Upload avatar if provided
      if (avatarFile) {
        const formData = new FormData();
        formData.append("file", avatarFile);
        try {
          await fetch("/api/auth/upload-avatar", {
            method: "POST",
            headers: { Authorization: `Bearer ${data.session.access_token}` },
            body: formData,
          });
        } catch {
          // non-blocking
        }
      }

      onClose();
      window.location.reload();
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFieldErrors((prev) => ({ ...prev, avatar: "File must be an image" }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFieldErrors((prev) => ({ ...prev, avatar: "File must be under 5MB" }));
      return;
    }

    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setFieldErrors((prev) => ({ ...prev, avatar: "" }));
  };

  const removeAvatar = () => {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const switchMode = (m: AuthMode) => {
    setMode(m);
    setError("");
    setFieldErrors({});
  };

  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError("Please enter your email address first");
      return;
    }
    setResetLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setResetSent(true);
      } else {
        setError(data.error || "Failed to send reset email. Please try again.");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-3xl bg-[#111827] border border-white/[0.08] overflow-hidden animate-[slideUp_0.3s_cubic-bezier(0.16,1,0.3,1)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1.5 bg-gradient-to-r from-[#FF0F73] via-[#FFA22C] to-[#F82D7B]" />

        <div className="px-4 sm:p-7">
          {/* Role Selection (always visible) */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-heading-lg font-bold text-[#F1F5F9]">
                {mode === "login"
                  ? signupRole === "partner" ? "Partner Sign In" : "Welcome back"
                    : "Join Momento"}
              </h2>
              <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-[#0A0E17] text-[#CBD5E1] transition-colors shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <p className="text-caption text-[#CBD5E1] mb-4">
              {mode === "login"
                ? signupRole === "partner" ? "Sign in to your partner account" : "Sign in to continue discovering"
                : "Choose how you&apos;ll use Momento"}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSignupRole("user")}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  signupRole === "user"
                    ? "border-[#FF0F73] bg-[#FF0F73]/10"
                    : "border-white/[0.1] bg-[#1E293B] hover:border-[#FF0F73]/30"
                }`}
              >
                <p className="text-body-sm font-semibold text-[#F1F5F9]">Explorer</p>
                <p className="text-caption text-[#CBD5E1] mt-0.5">Discover &amp; book experiences</p>
              </button>
              <button
                type="button"
                onClick={() => setSignupRole("partner")}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  signupRole === "partner"
                    ? "border-[#F82D7B] bg-[#F82D7B]/10"
                    : "border-white/[0.1] bg-[#1E293B] hover:border-[#F82D7B]/30"
                }`}
              >
                <p className="text-body-sm font-semibold text-[#F1F5F9]">Partner</p>
                <p className="text-caption text-[#CBD5E1] mt-0.5">List &amp; manage experiences</p>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Name (signup only) */}
            {mode === "signup" && (
              <div>
                <input
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => { setName(e.target.value); if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: "" })); }}
                  className={`w-full px-4 py-3 rounded-xl bg-[#0A0E17] text-[#F1F5F9] text-body-sm placeholder:text-[#64748B] focus:outline-none focus:ring-1 transition-all ${
                    fieldErrors.name
                      ? "border border-[#c13515] focus:border-[#c13515] focus:ring-[#c13515]/20"
                      : "border border-white/[0.1] focus:border-[#FF0F73] focus:ring-[#FF0F73]/20"
                  }`}
                />
                {fieldErrors.name && <p className="mt-1 text-caption text-[#c13515]">{fieldErrors.name}</p>}
              </div>
            )}

            {/* Email */}
            <div>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: "" })); }}
                className={`w-full px-4 py-3 rounded-xl bg-[#0A0E17] text-[#F1F5F9] text-body-sm placeholder:text-[#64748B] focus:outline-none focus:ring-1 transition-all ${
                  fieldErrors.email
                    ? "border border-[#c13515] focus:border-[#c13515] focus:ring-[#c13515]/20"
                    : "border border-white/[0.1] focus:border-[#FF0F73] focus:ring-[#FF0F73]/20"
                }`}
              />
              {fieldErrors.email && <p className="mt-1 text-caption text-[#c13515]">{fieldErrors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: "" })); }}
                className={`w-full px-4 py-3 rounded-xl bg-[#0A0E17] text-[#F1F5F9] text-body-sm placeholder:text-[#64748B] focus:outline-none focus:ring-1 transition-all ${
                  fieldErrors.password
                    ? "border border-[#c13515] focus:border-[#c13515] focus:ring-[#c13515]/20"
                    : "border border-white/[0.1] focus:border-[#FF0F73] focus:ring-[#FF0F73]/20"
                }`}
              />
              {fieldErrors.password && <p className="mt-1 text-caption text-[#c13515]">{fieldErrors.password}</p>}
              {mode === "login" && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-caption text-[#FF0F73] hover:text-[#e00b41] font-medium transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </div>

            {/* Phone (signup only) */}
            {mode === "signup" && (
              <div>
                <input
                  type="tel"
                  placeholder="Phone number (optional)"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: "" })); }}
                  className={`w-full px-4 py-3 rounded-xl bg-[#0A0E17] text-[#F1F5F9] text-body-sm placeholder:text-[#64748B] focus:outline-none focus:ring-1 transition-all ${
                    fieldErrors.phone
                      ? "border border-[#c13515] focus:border-[#c13515] focus:ring-[#c13515]/20"
                      : "border border-white/[0.1] focus:border-[#FF0F73] focus:ring-[#FF0F73]/20"
                  }`}
                />
                {fieldErrors.phone && <p className="mt-1 text-caption text-[#c13515]">{fieldErrors.phone}</p>}
              </div>
            )}

            {/* Birthdate (signup only) */}
            {mode === "signup" && (
              <div>
                <input
                  type="date"
                  placeholder="Date of birth"
                  value={birthdate}
                  onChange={(e) => { setBirthdate(e.target.value); if (fieldErrors.birthdate) setFieldErrors((prev) => ({ ...prev, birthdate: "" })); }}
                  className={`w-full px-4 py-3 rounded-xl bg-[#0A0E17] text-[#F1F5F9] text-body-sm placeholder:text-[#64748B] focus:outline-none focus:ring-1 transition-all ${
                    fieldErrors.birthdate
                      ? "border border-[#c13515] focus:border-[#c13515] focus:ring-[#c13515]/20"
                      : "border border-white/[0.1] focus:border-[#FF0F73] focus:ring-[#FF0F73]/20"
                  }`}
                />
                {fieldErrors.birthdate && <p className="mt-1 text-caption text-[#c13515]">{fieldErrors.birthdate}</p>}
              </div>
            )}

            {/* Profile Image (host only) */}
            {mode === "signup" && signupRole === "partner" && (
              <div>
                <label className="block text-caption text-[#CBD5E1] mb-1.5 font-medium">Profile image (optional)</label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-[#0A0E17] border border-white/[0.1] flex items-center justify-center overflow-hidden shrink-0 relative">
                    {avatarPreview ? (
                      <Image src={avatarPreview} alt="" fill className="object-cover" unoptimized />
                    ) : (
                      <svg className="w-6 h-6 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    )}
                  </div>
                  <label className="flex-1 cursor-pointer">
                    <div className="px-4 py-2.5 rounded-xl border border-white/[0.1] bg-[#1E293B] text-body-sm text-[#CBD5E1] hover:border-[#F82D7B]/30 hover:text-[#F82D7B] transition-all text-center">
                      {avatarFile ? avatarFile.name : "Choose image"}
                    </div>
                    <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                  </label>
                  {avatarPreview && (
                    <button type="button" onClick={removeAvatar} className="text-caption text-[#c13515] hover:underline shrink-0">
                      Remove
                    </button>
                  )}
                </div>
                {fieldErrors.avatar && <p className="mt-1 text-caption text-[#c13515]">{fieldErrors.avatar}</p>}
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="text-body-sm text-[#c13515] bg-[#c13515]/8 px-3 py-2 rounded-xl flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF0F73] to-[#FFA22C] text-white font-semibold text-body-sm hover:shadow-[0_4px_20px_rgba(255, 15, 115, 0.35)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : mode === "login" ? (
                "Sign In"
              ) : signupRole === "partner" ? (
                "Create Partner Account"
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-body-sm text-[#CBD5E1]">
              {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                onClick={() => switchMode(mode === "login" ? "signup" : "login")}
                className="text-[#FF0F73] hover:text-[#e00b41] font-semibold transition-colors"
              >
                {mode === "login" ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
