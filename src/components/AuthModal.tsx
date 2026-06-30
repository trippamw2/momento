"use client";

import { useState, useEffect } from "react";

interface AuthModalProps {
  onClose: () => void;
}

type AuthMode = "login" | "signup";
type SignupRole = "user" | "partner";

export default function AuthModal({ onClose }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [signupRole, setSignupRole] = useState<SignupRole>(() => {
    // Check if "Become a Host" was clicked
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("experio-signup-role");
      if (saved === "partner") {
        localStorage.removeItem("experio-signup-role");
        return "partner";
      }
    }
    return "user";
  });

  // Auto-switch to signup mode if "Become a Host" was triggered
  useEffect(() => {
    if (signupRole === "partner") {
      setMode("signup");
    }
  }, [signupRole]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (mode === "login") {
      if (!email.trim()) errors.email = "Email is required";
      if (!password) errors.password = "Password is required";
      setFieldErrors(errors);
      return Object.keys(errors).length === 0;
    }

    // signup validation
    if (!name.trim()) {
      errors.name = "Full name is required";
    } else if (name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
    }

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

    if (phone && !/^\+?[\d\s\-()]{7,15}$/.test(phone)) {
      errors.phone = "Invalid phone number";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile) return null;

    const formData = new FormData();
    formData.append("file", avatarFile);

    const res = await fetch("/api/auth/upload-avatar", {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("experio-auth-token")}` },
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to upload image");
    }

    const data = await res.json();
    return data.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setError("");
    setMessage("");
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
          if (res.status === 401) {
            setError("Invalid email or password. Please try again.");
          } else {
            setError(data.error || "Login failed. Please try again.");
          }
          return;
        }

        if (data.session?.access_token) {
          localStorage.setItem("experio-auth-token", data.session.access_token);
          const role = data.user?.user_metadata?.role || "user";
          localStorage.setItem("experio-user-role", role);
        }
        onClose();
        window.location.reload();
      } else {
        // Signup flow
        let avatarUrl: string | null = null;

        if (avatarFile) {
          try {
            // First signup to get a session token, then upload avatar
            // For the initial upload, we'll just skip and let them add later
            // Or we use the upload after signup completes
            setMessage("Creating your account...");
          } catch {
            // non-blocking
          }
        }

        const body: Record<string, unknown> = {
          email,
          password,
          full_name: name,
          phone: phone || null,
          role: signupRole,
          avatar_url: null,
        };

        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Account creation failed. Please try again.");
          return;
        }

        // If signup returned a session, upload avatar and store tokens
        if (data.session?.access_token) {
          localStorage.setItem("experio-auth-token", data.session.access_token);
          localStorage.setItem("experio-user-role", signupRole);

          // Upload avatar now that we have a session
          if (avatarFile) {
            try {
              const formData = new FormData();
              formData.append("file", avatarFile);
              const uploadRes = await fetch("/api/auth/upload-avatar", {
                method: "POST",
                headers: { Authorization: `Bearer ${data.session.access_token}` },
                body: formData,
              });
              if (uploadRes.ok) {
                const uploadData = await uploadRes.json();
                avatarUrl = uploadData.url;
              }
            } catch {
              // non-blocking
            }
          }

          onClose();
          window.location.reload();
        } else {
          // Email confirmation required
          setMode("login");
          setEmail(email);
          setError("");
          setMessage(`Account created${signupRole === "partner" ? " as a Host" : ""}! Check your email to confirm, then sign in.`);
        }
      }
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

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setFieldErrors((prev) => ({ ...prev, avatar: "" }));
  };

  const switchMode = (m: AuthMode) => {
    setMode(m);
    setError("");
    setMessage("");
    setFieldErrors({});
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
          {/* Role Selection (signup only) */}
          {mode === "signup" && (
            <div className="mb-6">
              <h2 className="text-heading-lg font-bold text-[#222222] mb-1">Join Experio</h2>
              <p className="text-caption text-[#6a6a6a] mb-4">Choose how you&apos;ll use Experio</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSignupRole("user")}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    signupRole === "user"
                      ? "border-[#DD2A7B] bg-[#FFF0F5]"
                      : "border-[#ebebeb] bg-[#fafafa] hover:border-[#DD2A7B]/30"
                  }`}
                >
                  <span className="text-2xl">🙋</span>
                  <p className="text-body-sm font-semibold text-[#222222] mt-1">Customer</p>
                  <p className="text-caption text-[#6a6a6a]">Discover & book experiences</p>
                </button>
                <button
                  type="button"
                  onClick={() => setSignupRole("partner")}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    signupRole === "partner"
                      ? "border-[#8134AF] bg-[#F5F0FF]"
                      : "border-[#ebebeb] bg-[#fafafa] hover:border-[#8134AF]/30"
                  }`}
                >
                  <span className="text-2xl">🏠</span>
                  <p className="text-body-sm font-semibold text-[#222222] mt-1">Host</p>
                  <p className="text-caption text-[#6a6a6a]">List & manage experiences</p>
                </button>
              </div>
            </div>
          )}

          {mode === "login" && (
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-heading-lg font-bold text-[#222222]">Welcome back</h2>
                <p className="text-caption text-[#6a6a6a] mt-0.5">Sign in to continue discovering</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-[#f5f2ef] text-[#6a6a6a] transition-colors shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Name field (signup only) */}
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

            {/* Email */}
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

            {/* Password */}
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

            {/* Phone (signup only) */}
            {mode === "signup" && (
              <div>
                <div className="relative">
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#929292]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  <input
                    type="tel"
                    placeholder="Phone number (optional)"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: "" })); }}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl bg-[#f5f2ef] text-[#222222] text-body-sm placeholder:text-[#929292] focus:outline-none focus:ring-1 transition-all ${
                      fieldErrors.phone
                        ? "border border-[#c13515] focus:border-[#c13515] focus:ring-[#c13515]/20"
                        : "border border-[#ebebeb] focus:border-[#DD2A7B] focus:ring-[#DD2A7B]/20"
                    }`}
                  />
                </div>
                {fieldErrors.phone && <p className="mt-1 text-caption text-[#c13515]">{fieldErrors.phone}</p>}
              </div>
            )}

            {/* Profile Image Upload (host signup only) */}
            {mode === "signup" && signupRole === "partner" && (
              <div>
                <label className="block text-caption text-[#6a6a6a] mb-1.5 font-medium">Profile image (optional)</label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-[#f5f2ef] border border-[#ebebeb] flex items-center justify-center overflow-hidden shrink-0">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-6 h-6 text-[#929292]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    )}
                  </div>
                  <label className="flex-1 cursor-pointer">
                    <div className="px-4 py-2.5 rounded-xl border border-[#ebebeb] bg-[#fafafa] text-body-sm text-[#6a6a6a] hover:border-[#8134AF]/30 hover:text-[#8134AF] transition-all text-center">
                      {avatarFile ? avatarFile.name : "Choose image"}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={() => { setAvatarFile(null); setAvatarPreview(null); }}
                      className="text-caption text-[#c13515] hover:underline shrink-0"
                    >
                      Remove
                    </button>
                  )}
                </div>
                {fieldErrors.avatar && <p className="mt-1 text-caption text-[#c13515]">{fieldErrors.avatar}</p>}
              </div>
            )}

            {/* Error / Message */}
            {error && (
              <p className="text-body-sm text-[#c13515] bg-[#c13515]/8 px-3 py-2 rounded-xl flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {error}
              </p>
            )}
            {message && (
              <p className="text-body-sm text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2.5 rounded-xl flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {message}
              </p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#DD2A7B] to-[#F58529] text-white font-semibold text-body-sm hover:shadow-[0_4px_20px_rgba(255,56,92,0.35)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : mode === "login" ? (
                "Sign In"
              ) : signupRole === "partner" ? (
                "Create Host Account"
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Toggle mode */}
          <div className="mt-5 text-center">
            <p className="text-body-sm text-[#6a6a6a]">
              {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                onClick={() => switchMode(mode === "login" ? "signup" : "login")}
                className="text-[#DD2A7B] hover:text-[#e00b41] font-semibold transition-colors"
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
