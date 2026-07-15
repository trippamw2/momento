"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface HostOnboardingData {
  hostType?: "individual" | "business";
  businessName?: string;
  name?: string;
  email?: string;
  phone?: string;
  country?: string;
  city?: string;
  serviceCategories?: string[];
  experienceTypes?: string[];
  hasExperience?: boolean;
  experienceCount?: number;
  membershipLevel?: "basic" | "plus" | "pro"; // Airbnb Plus/Pro tiers
  acceptance?: boolean;
  policyAgreement?: boolean;
  liabilityWaiver?: boolean;
}

// Slide definitions following Airbnb's onboarding pattern
interface OnboardingSlide {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  component: "host-type" | "business-form" | "experience-summary" | "professional-tier" | "policy-acceptance" | "verification";
  required: boolean;
  skipable: boolean;
}

const slides: OnboardingSlide[] = [
  {
    id: "host-type",
    title: "Choose your setup",
    subtitle: "Select how you'd like to list and manage experiences",
    icon: "🏠",
    component: "host-type",
    required: true,
    skipable: true,
  },
  {
    id: "business-form", 
    title: "Tell us about your setup",
    subtitle: "We need some basic information to get you started",
    icon: "🏢",
    component: "business-form",
    required: true,
    skipable: false,
  },
  {
    id: "experience-summary",
    title: "Your experience profile", 
    subtitle: "How many experiences do you offer and what's your style?",
    icon: "📋",
    component: "experience-summary",
    required: true,
    skipable: true,
  },
  {
    id: "professional-tier",
    title: "Amplify your visibility",
    subtitle: "Boost your listings with our premium tiers (Airbnb Plus/Pro)",
    icon: "⭐",
    component: "professional-tier",
    required: false,
    skipable: true,
  },
  {
    id: "policy-acceptance",
    title: "Policies & Terms",
    subtitle: "Agree to our terms of service, liability waiver, and safety policies",
    icon: "⚖️",
    component: "policy-acceptance",
    required: true,
    skipable: false,
  },
  {
    id: "verification",
    title: "Get verified",
    subtitle: "Complete identity verification to start accepting bookings",
    icon: "✅",
    component: "verification",
    required: true,
    skipable: false,
  }
];

export default function HostOnboardingPage() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [formData, setFormData] = useState<HostOnboardingData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check if user is already authenticated as host/partner
  useEffect(() => {
    const token = localStorage.getItem("experio-auth-token");
    const userRole = localStorage.getItem("experio-user-role");
    
    if (token && userRole === "partner") {
      // Redirect to existing partner dashboard if already signed in as host
      router.push("/partner/dashboard");
    }
  }, [router]);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
      setErrors({});
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleSkip = () => {
    // Mark slide as completed (skipped)
    const nextIncompleteSlide = slides.findIndex((slide, idx) => 
      idx > currentSlide && slide.required && !formData[slide.component as keyof HostOnboardingData]
    );
    
    if (nextIncompleteSlide !== -1) {
      setCurrentSlide(nextIncompleteSlide);
    } else {
      handleNext();
    }
  };

  const validateCurrentSlide = (): boolean => {
    const currentSlideData = slides[currentSlide];
    const errors: Record<string, string> = {};

    switch (currentSlideData.component) {
      case "host-type":
        if (!formData.hostType) {
          errors.hostType = "Please select how you'd like to setup";
        }
        break;

      case "business-form":
        if (formData.hostType === "business") {
          if (!formData.businessName?.trim()) {
            errors.businessName = "Business name is required"; 
          }
        } else {
          if (!formData.name?.trim()) {
            errors.name = "Full name is required";
          }
        }
        
        if (!formData.email?.trim()) {
          errors.email = "Email is required";
        } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(formData.email)) {
          errors.email = "Please enter a valid email";
        }
        
        if (!formData.phone?.trim()) {
          errors.phone = "Phone number is required";
        }
        break;

      case "experience-summary":
        if (!formData.hasExperience) {
          errors.hasExperience = "Please confirm if you have experiences";
        }
        if (formData.hasExperience && !formData.experienceTypes?.length) {
          errors.experienceTypes = "Please select your experience types";
        }
        break;

      case "professional-tier":
        // Optional step, no validation
        break;

      case "policy-acceptance":
        if (!formData.acceptance) {
          errors.acceptance = "You must agree to terms and conditions";
        }
        if (!formData.policyAgreement) {
          errors.policyAgreement = "You must agree to our policies";
        }
        if (!formData.liabilityWaiver) {
          errors.liabilityWaiver = "You must agree to liability waiver";
        }
        break;

      case "verification":
        // This would typically include ID verification steps
        if (formData.hostType === "individual" && !formData.email) {
          errors.email = "Email verification required";
        }
        break;
    }

    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!handleNext()) return; // This should validate before submitting
    
    setIsLoading(true);
    try {
      // Simulate API call to create host/partner profile
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Save to localStorage for immediate session usage
      localStorage.setItem("experio-host-onboarding-completed", "true");
      localStorage.setItem("experio-host-profile", JSON.stringify(formData));
      
      // Set user role to partner and redirect to dashboard
      localStorage.setItem("experio-user-role", "partner");
      
      // Show success message and redirect
      alert("Welcome aboard, partner! Your host profile has been created successfully.");
      
      router.push("/partner/dashboard");
      
    } catch (error) {
      console.error("Onboarding failed:", error);
      alert("Failed to create your profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderCurrentSlide = () => {
    const slide = slides[currentSlide];
    
    switch (slide.component) {
      case "host-type":
        return (
          <div className="space-y-6">
            <h3 className="text-heading-lg font-bold text-white mb-4">How would you like to setup your host account?</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setFormData(prev => ({ ...prev, hostType: "individual" }));
                  setErrors({});
                }}
                className={`p-6 rounded-2xl border-2 transition-all text-left ${
                  formData.hostType === "individual"
                    ? "border-[#FF0F73] bg-[#FF0F73]/10"
                    : "border-white/10 hover:border-white/30 bg-white/5"
                }`}
              >
                <div className="text-3xl mb-3">🏠</div>
                <h4 className="text-body-lg font-semibold text-white mb-2">Individual Host</h4>
                <p className="text-caption text-[#CBD5E1] leading-relaxed">
                  I'm hosting a few experiences personally, sharing my local knowledge and passion
                </p>
              </button>
              
              <button
                onClick={() => {
                  setFormData(prev => ({ ...prev, hostType: "business" }));
                  setErrors({});
                }}
                className={`p-6 rounded-2xl border-2 transition-all text-left ${
                  formData.hostType === "business"
                    ? "border-[#FF0F73] bg-[#FF0F73]/10"
                    : "border-white/10 hover:border-white/30 bg-white/5"
                }`}
              >
                <div className="text-3xl mb-3">🏢</div>
                <h4 className="text-body-lg font-semibold text-white mb-2">Business Host</h4>
                <p className="text-caption text-[#CBD5E1] leading-relaxed">
                  We're a hospitality company with professional experience management
                </p>
              </button>
            </div>
            
            {errors.hostType && (
              <p className="text-red-400 text-caption">{errors.hostType}</p>
            )}
          </div>
        );

      case "business-form":
        return (
          <div className="space-y-6 max-w-2xl mx-auto">
            <h3 className="text-heading-lg font-bold text-white mb-4">Your profile information</h3>
            
            {formData.hostType === "business" ? (
              <div>
                <label className="block text-body-sm font-medium text-[#CBD5E1] mb-2">Business Name</label>
                <input
                  type="text"
                  value={formData.businessName || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-[#64748B] focus:border-[#FF0F73] focus:outline-none transition-colors"
                  placeholder="Enter your business name"
                />
                {errors.businessName && (
                  <p className="text-red-400 text-caption mt-1">{errors.businessName}</p>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-body-sm font-medium text-[#CBD5E1] mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.name || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-[#64748B] focus:border-[#FF0F73] focus:outline-none transition-colors"
                  placeholder="Enter your full name"
                />
                {errors.name && (
                  <p className="text-red-400 text-caption mt-1">{errors.name}</p>
                )}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-body-sm font-medium text-[#CBD5E1] mb-2">Email Address</label>
                <input
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-[#64748B] focus:border-[#FF0F73] focus:outline-none transition-colors"
                  placeholder="your@email.com"
                />
                {errors.email && (
                  <p className="text-red-400 text-caption mt-1">{errors.email}</p>
                )}
              </div>
              
              <div>
                <label className="block text-body-sm font-medium text-[#CBD5E1] mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-[#64748B] focus:border-[#FF0F73] focus:outline-none transition-colors"
                  placeholder="+1 234 567 8900"
                />
                {errors.phone && (
                  <p className="text-red-400 text-caption mt-1">{errors.phone}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-body-sm font-medium text-[#CBD5E1] mb-2">Country</label>
                <select
                  value={formData.country || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-[#FF0F73] focus:outline-none transition-colors"
                >
                  <option value="">Select country</option>
                  <option value="US">United States</option>
                  <option value="GB">United Kingdom</option>
                  <option value="CA">Canada</option>
                  <option value="AU">Australia</option>
                  <option value="MW">Malawi</option>
                  <option value="TZ">Tanzania</option>
                  <option value="KE">Kenya</option>
                </select>
              </div>
              
              <div>
                <label className="block text-body-sm font-medium text-[#CBD5E1] mb-2">City</label>
                <input
                  type="text"
                  value={formData.city || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-[#64748B] focus:border-[#FF0F73] focus:outline-none transition-colors"
                  placeholder="Your city"
                />
              </div>
            </div>
          </div>
        );

      case "experience-summary":
        return (
          <div className="space-y-6 max-w-2xl mx-auto">
            <h3 className="text-heading-lg font-bold text-white mb-4">Your experience background</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-body-sm font-medium text-[#CBD5E1] mb-3">Do you have any experiences to host? *</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      setFormData(prev => ({ ...prev, hasExperience: true }));
                      setErrors({});
                    }}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      formData.hasExperience === true
                        ? "border-[#FF0F73] bg-[#FF0F73]/10"
                        : "border-white/10 hover:border-white/30 bg-white/5"
                    }`}
                  >
                    <div className="text-2xl mb-2">✨</div>
                    <h4 className="text-body font-semibold text-white mb-1">Yes, I have experiences</h4>
                    <p className="text-caption text-[#64748B]">I currently host or manage guest experiences</p>
                  </button>
                  
                  <button
                    onClick={() => {
                      setFormData(prev => ({ ...prev, hasExperience: false }));
                      setErrors({});
                    }}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      formData.hasExperience === false
                        ? "border-[#FF0F73] bg-[#FF0F73]/10"
                        : "border-white/10 hover:border-white/30 bg-white/5"
                    }`}
                  >
                    <div className="text-2xl mb-2">🎯</div>
                    <h4 className="text-body font-semibold text-white mb-1">I'm starting fresh</h4>
                    <p className="text-caption text-[#64748B]">I'm preparing to launch my first experience</p>
                  </button>
                </div>
                {errors.hasExperience && (
                  <p className="text-red-400 text-caption mt-2">{errors.hasExperience}</p>
                )}
              </div>
              
              {formData.hasExperience && (
                <div>
                  <label className="block text-body-sm font-medium text-[#CBD5E1] mb-3">Experience Types (select all) *</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {
                      [
                        { value: "cooking", label: "Cooking Class" },
                        { value: "tours", label: "Tours & Guided" },
                        { value: "crafts", label: "Crafting Workshop" },
                        { value: "sports", label: "Sports Activity" },
                        { value: "wellness", label: "Wellness & Spa" },
                        { value: "art", label: "Art & Culture" },
                        { value: "adventure", label: "Adventure" },
                        { value: "food", label: "Food & Drink" },
                        { value: "nightlife", label: "Nightlife" },
                      ].map((type) => (
                        <button
                          key={type.value}
                          onClick={() => {
                            const current = formData.experienceTypes || [];
                            const updated = current.includes(type.value)
                              ? current.filter(t => t !== type.value)
                              : [...current, type.value];
                            setFormData(prev => ({ ...prev, experienceTypes: updated }));
                            setErrors({});
                          }}
                          className={`p-3 rounded-lg border transition-all text-center text-caption font-medium ${
                            formData.experienceTypes?.includes(type.value)
                              ? "bg-[#FF0F73]/20 border-[#FF0F73] text-white"
                              : "bg-white/5 border-white/10 text-[#CBD5E1] hover:bg-white/10"
                          }`}
                        >
                          {type.label}
                        </button>
                      ))
                    }
                  </div>
                  {errors.experienceTypes && (
                    <p className="text-red-400 text-caption mt-2">{errors.experienceTypes}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case "professional-tier":
        return (
          <div className="space-y-6 max-w-2xl mx-auto">
            <h3 className="text-heading-lg font-bold text-white mb-4">Amplify your visibility (Optional)</h3>
            <p className="text-body-sm text-[#CBD5E1] leading-relaxed mb-6">
              Upgrade to Airbnb Plus or Pro tiers to boost your listings, get priority support, and access advanced marketing tools.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setFormData(prev => ({ ...prev, membershipLevel: "basic" }))}
                className={`p-5 rounded-xl border-2 transition-all text-left ${
                  formData.membershipLevel === "basic"
                    ? "border-[#FF0F73] bg-[#FF0F73]/10"
                    : "border-white/10 hover:border-white/30 bg-white/5"
                }`}
              >
                <div className="text-2xl mb-3">🌿</div>
                <h4 className="text-body font-semibold text-white mb-2">Basic</h4>
                <p className="text-caption text-[#64748B]">Standard listing with basic tools</p>
                <div className="text-heading-md font-bold text-[#FF0F73] mt-2">Free</div>
              </button>
              
              <button
                onClick={() => setFormData(prev => ({ ...prev, membershipLevel: "plus" }))}
                className={`p-5 rounded-xl border-2 transition-all text-left ${
                  formData.membershipLevel === "plus"
                    ? "border-[#FF0F73] bg-[#FF0F73]/10"
                    : "border-white/10 hover:border-white/30 bg-white/5"
                }`}
              >
                <div className="text-2xl mb-3">⭐</div>
                <h4 className="text-body font-semibold text-white mb-2">Plus</h4>
                <p className="text-caption text-[#64748B]">Advanced tools and support</p>
                <div className="text-heading-md font-bold text-[#FF0F73] mt-2">+MK 50,000/month</div>
              </button>
              
              <button
                onClick={() => setFormData(prev => ({ ...prev, membershipLevel: "pro" }))}
                className={`p-5 rounded-xl border-2 transition-all text-left ${
                  formData.membershipLevel === "pro"
                    ? "border-[#FF0F73] bg-[#FF0F73]/10"
                    : "border-white/10 hover:border-white/30 bg-white/5"
                }`}
              >
                <div className="text-2xl mb-3">💎</div>
                <h4 className="text-body font-semibold text-white mb-2">Pro</h4>
                <p className="text-caption text-[#64748B]">Full professional suite with priority</p>
                <div className="text-heading-md font-bold text-[#FF0F73] mt-2">+MK 100,000/month</div>
              </button>
            </div>
          </div>
        );

      case "policy-acceptance":
        return (
          <div className="space-y-6 max-w-2xl mx-auto">
            <h3 className="text-heading-lg font-bold text-white mb-4">Terms & Policies</h3>
            <p className="text-body-sm text-[#CBD5E1] leading-relaxed mb-6">
              Please review and agree to our terms to continue with your host onboarding.
            </p>
            
            <div className="space-y-4 p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="acceptance"
                  checked={formData.acceptance || false}
                  onChange={(e) => setFormData(prev => ({ ...prev, acceptance: e.target.checked }))}
                  className="mt-1 w-4 h-4 rounded border-white/30 text-[#FF0F73] focus:ring-[#FF0F73] focus:ring-2"
                />
                <label htmlFor="acceptance" className="flex-1 text-body-sm text-white">
                  I agree to the <span className="text-[#FF0F73] font-semibold">Terms of Service</span> and 
                  <span className="text-[#FF0F73] font-semibold">Conditions</span>
                </label>
              </div>
              {errors.acceptance && (
                <p className="text-red-400 text-caption ml-7">{errors.acceptance}</p>
              )}
              
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="policyAgreement"
                  checked={formData.policyAgreement || false}
                  onChange={(e) => setFormData(prev => ({ ...prev, policyAgreement: e.target.checked }))}
                  className="mt-1 w-4 h-4 rounded border-white/30 text-[#FF0F73] focus:ring-[#FF0F73] focus:ring-2"
                />
                <label htmlFor="policyAgreement" className="flex-1 text-body-sm text-white">
                  I agree to the <span className="text-[#FF0F73] font-semibold">Privacy Policy</span> and 
                  <span className="text-[#FF0F73] font-semibold">Data Processing</span>
                </label>
              </div>
              {errors.policyAgreement && (
                <p className="text-red-400 text-caption ml-7">{errors.policyAgreement}</p>
              )}
              
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="liabilityWaiver"
                  checked={formData.liabilityWaiver || false}
                  onChange={(e) => setFormData(prev => ({ ...prev, liabilityWaiver: e.target.checked }))}
                  className="mt-1 w-4 h-4 rounded border-white/30 text-[#FF0F73] focus:ring-[#FF0F73] focus:ring-2"
                />
                <label htmlFor="liabilityWaiver" className="flex-1 text-body-sm text-white">
                  I accept the <span className="text-[#FF0F73] font-semibold">Liability Waiver</span> and <span className="text-[#FF0F73] font-semibold">Safety Acknowledgment</span>
                </label>
              </div>
              {errors.liabilityWaiver && (
                <p className="text-red-400 text-caption ml-7">{errors.liabilityWaiver}</p>
              )}
            </div>
          </div>
        );

      case "verification":
        return (
          <div className="space-y-6 max-w-2xl mx-auto">
            <h3 className="text-heading-lg font-bold text-white mb-4">Identity Verification</h3>
            <p className="text-body-sm text-[#CBD5E1] leading-relaxed mb-6">
              Complete identity verification to start accepting bookings. This helps build trust with guests and protects our community.
            </p>
            
            <div className="p-6 rounded-xl bg-gradient-to-r from-[#FF0F73]/10 to-[#FF7A1A]/10 border border-[#FF0F73]/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#FF0F73] flex items-center justify-center">
                  <span className="text-white font-bold">✓</span>
                </div>
                <div>
                  <h4 className="text-body font-semibold text-white">Email Verification</h4>
                  <p className="text-caption text-[#CBD5E1]">We've sent a verification link to {formData.email}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#FF7A1A] flex items-center justify-center">
                  <span className="text-white font-bold">📱</span>
                </div>
                <div>
                  <h4 className="text-body font-semibold text-white">Phone Verification</h4>
                  <p className="text-caption text-[#CBD5E1]">Verify your phone number with SMS code</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#CBD5E1]/20 flex items-center justify-center">
                  <span className="text-white font-bold">📋</span>
                </div>
                <div>
                  <h4 className="text-body font-semibold text-white">Document Verification</h4>
                  <p className="text-caption text-[#CBD5E1]">Upload government ID for full verification</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-yellow-400">⚠️</span>
                <span className="text-body-sm font-semibold text-white">Security Notice</span>
              </div>
              <p className="text-caption text-[#CBD5E1] leading-relaxed">
                Your information will be encrypted and securely stored. We comply with data protection regulations and never share your information without consent.
              </p>
            </div>
          </div>
        );

      default:
        return <div>Unknown slide</div>;
    }
  };

  return (
    <div className="min-h-screen bg-[#05070B] flex flex-col">
      {/* Header with progress */}
      <header className="sticky top-0 z-50 bg-[#05070B]/95 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#FF0F73] to-[#FF7A1A] flex items-center justify-center">
                <span className="text-white font-bold text-sm">🏢</span>
              </div>
              <span className="text-heading-md font-bold text-white">Host Onboarding</span>
            </div>
            
            <div className="hidden md:flex items-center gap-2">
              {slides.map((slide, index) => (
                <div key={slide.id} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-caption font-medium ${
                      index < currentSlide
                        ? "bg-[#FF0F73] text-white"
                        : index === currentSlide
                        ? "border-2 border-[#FF0F73] text-[#FF0F73] bg-white/5"
                        : "bg-white/10 text-[#64748B]"
                    }`}
                  >
                    {slide.icon}
                  </div>
                  {index < slides.length - 1 && (
                    <div className="w-8 h-0.5 bg-white/20" />
                  )}
                </div>
              ))}
            </div>
            
            <button
              onClick={() => router.push("/")}
              className="text-caption text-[#64748B] hover:text-white transition-colors"
            >
              Skip for now
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-8 py-8">
        <div className="w-full max-w-4xl">
          {/* Slide Title */}
          <div className="mb-8 text-center">
            <h2 className="text-display-sm font-bold text-white mb-2">
              {slides[currentSlide].title}
            </h2>
            <p className="text-body-lg text-[#CBD5E1] max-w-2xl mx-auto">
              {slides[currentSlide].subtitle}
            </p>
          </div>
          
          {/* Slide Content */}
          <div className="mb-8">
            {renderCurrentSlide()}
          </div>
          
          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentSlide === 0}
              className="px-6 py-3 rounded-xl border border-white/10 text-white font-medium hover:bg-white/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <div className="flex gap-3">
              {slides[currentSlide].skipable && (
                <button
                  onClick={handleSkip}
                  className="px-6 py-3 rounded-xl text-[#CBD5E1] hover:text-white font-medium transition-colors"
                >
                  Skip
                </button>
              )}
              
              <button
                onClick={handleNext}
                disabled={!validateCurrentSlide() && slides[currentSlide].required}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#FF0F73] to-[#FF7A1A] text-white font-semibold hover:shadow-[0_4px_24px_rgba(255,15,115,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
          
          {slides[currentSlide].required && (
            <div className="mt-4 text-center">
              <p className="text-caption text-[#64748B]">
                * Required step to continue
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6">
          <div className="flex items-center justify-between">
            <p className="text-caption text-[#64748B]">
              © 2024 Experio. All rights reserved.
            </p>
            
            <div className="flex items-center gap-6">
              <button className="text-caption text-[#64748B] hover:text-white transition-colors">
                Privacy Policy
              </button>
              <button className="text-caption text-[#64748B] hover:text-white transition-colors">
                Terms of Service
              </button>
              <button className="text-caption text-[#64748B] hover:text-white transition-colors">
                Support
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
