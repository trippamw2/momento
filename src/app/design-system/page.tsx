import Image from "next/image";
import Logo from "@/components/Logo";
import Button from "@/components/Button";
import MoodPill from "@/components/MoodPill";
import ContentRail from "@/components/ContentRail";
import ExperienceCard from "@/components/ExperienceCard";
import { experiences, moods } from "@/lib/data";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-16">
      <h2 className="text-heading-xl font-bold text-text-primary mb-2">{title}</h2>
      <div className="w-12 h-1 gradient-brand rounded-full mb-6" />
      {children}
    </section>
  );
}

function Swatch({ name, value, color }: { name: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-12 h-12 rounded-xl border border-border-default shrink-0"
        style={{ background: color }}
      />
      <div>
        <p className="text-body-sm font-medium text-text-primary">{name}</p>
        <p className="text-caption text-text-secondary font-mono">{value}</p>
      </div>
    </div>
  );
}

export default function DesignSystemPage() {
  const previewExp = experiences[0];

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-8">
        <div className="mb-12">
          <Logo size="lg" showTagline />
        </div>

        <p className="text-heading-lg text-text-secondary mb-12 max-w-2xl">
          A premium, emotional, lifestyle-driven design system for Malawi&apos;s first experience marketplace.
          Inspired by Netflix, Airbnb, and Apple.
        </p>

        {/* ── Logo System ── */}
        <Section title="Logo System">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 p-8 rounded-2xl bg-surface-secondary border border-border-default">
            <div className="text-center">
              <p className="text-caption text-text-tertiary mb-4 uppercase tracking-widest">Small (Navbar)</p>
              <div className="flex justify-center">
                <Logo size="sm" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-caption text-text-tertiary mb-4 uppercase tracking-widest">Medium (Default)</p>
              <div className="flex justify-center">
                <Logo size="md" showTagline />
              </div>
            </div>
            <div className="text-center">
              <p className="text-caption text-text-tertiary mb-4 uppercase tracking-widest">Large (Hero)</p>
              <div className="flex justify-center">
                <Logo size="lg" showTagline />
              </div>
            </div>
          </div>
          <div className="mt-6 p-6 rounded-xl bg-surface-secondary border border-border-default">
            <p className="text-body-sm text-text-secondary mb-3">Logo typography</p>
            <div className="flex flex-wrap gap-6">
              <div>
                <span className="text-xs text-text-tertiary">Font</span>
                <p className="font-serif text-text-primary">Playfair Display</p>
              </div>
              <div>
                <span className="text-xs text-text-tertiary">Weight</span>
                <p className="text-text-primary">Bold (700)</p>
              </div>
              <div>
                <span className="text-xs text-text-tertiary">Letter spacing</span>
                <p className="text-text-primary">-0.02em</p>
              </div>
              <div>
                <span className="text-xs text-text-tertiary">Accent</span>
                <p className="gradient-text font-medium">Hot Pink → Sunset Orange</p>
              </div>
            </div>
          </div>
        </Section>

        {/* ── Color System ── */}
        <Section title="Color System">
          <h3 className="text-heading-md font-semibold text-text-primary mb-4">Brand Colors</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <Swatch name="Deep Black" value="#000000" color="#000" />
            <Swatch name="Hot Pink" value="#ff2d87" color="#ff2d87" />
            <Swatch name="Sunset Orange" value="#ff6b2b" color="#ff6b2b" />
            <Swatch name="Soft White" value="#f5f5f5" color="#f5f5f5" />
          </div>

          <h3 className="text-heading-md font-semibold text-text-primary mb-4">Surfaces</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <Swatch name="Primary" value="#000000" color="#000" />
            <Swatch name="Secondary" value="#0a0a0a" color="#0a0a0a" />
            <Swatch name="Tertiary" value="#141414" color="#141414" />
            <Swatch name="Elevated" value="#1e1e1e" color="#1e1e1e" />
          </div>

          <h3 className="text-heading-md font-semibold text-text-primary mb-4">Text</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <Swatch name="Primary" value="#f5f5f5" color="#f5f5f5" />
            <Swatch name="Secondary" value="#a0a0a0" color="#a0a0a0" />
            <Swatch name="Tertiary" value="#6b6b6b" color="#6b6b6b" />
            <Swatch name="On Gradient" value="#ffffff" color="#ffffff" />
          </div>

          <h3 className="text-heading-md font-semibold text-text-primary mb-4">Borders</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Swatch name="Subtle" value="rgba(255,255,255,0.05)" color="rgba(255,255,255,0.05)" />
            <Swatch name="Default" value="rgba(255,255,255,0.1)" color="rgba(255,255,255,0.1)" />
            <Swatch name="Strong" value="rgba(255,255,255,0.2)" color="rgba(255,255,255,0.2)" />
            <Swatch name="Brand" value="#ff2d87" color="#ff2d87" />
          </div>
        </Section>

        {/* ── Typography System ── */}
        <Section title="Typography System">
          <div className="p-8 rounded-2xl bg-surface-secondary border border-border-default mb-6">
            <p className="text-caption text-text-tertiary mb-6 uppercase tracking-widest">Serif (Logo & Headlines)</p>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-text-tertiary mb-1">Display XL / 4.5rem</p>
                <p className="font-serif text-5xl text-text-primary leading-display">Live The Moment</p>
              </div>
              <div>
                <p className="text-xs text-text-tertiary mb-1">Display LG / 3.75rem</p>
                <p className="font-serif text-5xl text-text-primary leading-display">Live The Moment</p>
              </div>
            </div>
          </div>

          <div className="p-8 rounded-2xl bg-surface-secondary border border-border-default mb-6">
            <p className="text-caption text-text-tertiary mb-6 uppercase tracking-widest">Sans-Serif (UI) — Geist</p>
            <div className="space-y-5">
              <div>
                <p className="text-xs text-text-tertiary mb-1">Heading XL / 2rem — Bold</p>
                <p className="text-heading-xl font-bold text-text-primary">Featured Experiences</p>
              </div>
              <div>
                <p className="text-xs text-text-tertiary mb-1">Heading LG / 1.5rem — Bold</p>
                <p className="text-heading-lg font-bold text-text-primary">Romantic Moments</p>
              </div>
              <div>
                <p className="text-xs text-text-tertiary mb-1">Body / 1rem — Regular</p>
                <p className="text-body text-text-secondary max-w-xl">
                  Discover, book, gift and enjoy unforgettable experiences curated for every mood and occasion.
                </p>
              </div>
              <div>
                <p className="text-xs text-text-tertiary mb-1">Body SM / 0.875rem — Medium</p>
                <p className="text-body-sm font-medium text-text-primary">Pool & Lunch</p>
              </div>
              <div>
                <p className="text-xs text-text-tertiary mb-1">Caption / 0.75rem</p>
                <p className="text-caption text-text-secondary">4 hours • Lilongwe</p>
              </div>
              <div>
                <p className="text-xs text-text-tertiary mb-1">Overline / 0.6875rem — Uppercase, 0.1em spacing</p>
                <p className="overline text-brand-hot-pink">Malawi&apos;s Premium Experience Marketplace</p>
              </div>
            </div>
          </div>
        </Section>

        {/* ── Gradients ── */}
        <Section title="Gradient System">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="p-8 rounded-2xl gradient-brand text-center">
              <p className="text-white font-semibold text-body-sm">Brand</p>
              <p className="text-white/60 text-caption mt-1">#ff2d87 → #ff6b2b</p>
            </div>
            <div className="p-8 rounded-2xl gradient-warm text-center">
              <p className="text-white font-semibold text-body-sm">Warm</p>
              <p className="text-white/60 text-caption mt-1">#ff6b2b → #ff2d87</p>
            </div>
            <div className="p-8 rounded-2xl gradient-ambient text-center border border-border-default">
              <p className="text-white font-semibold text-body-sm">Ambient</p>
              <p className="text-white/60 text-caption mt-1">Radial glow overlay</p>
            </div>
          </div>
          <div className="p-6 rounded-xl bg-surface-secondary border border-border-default">
            <p className="text-body-sm text-text-secondary mb-3">Gradient text classes</p>
            <div className="flex flex-wrap gap-4">
              <span className="gradient-text text-heading-lg font-bold">gradient-text</span>
              <span className="gradient-text-warm text-heading-lg font-bold">gradient-text-warm</span>
            </div>
          </div>
        </Section>

        {/* ── Buttons ── */}
        <Section title="Button System">
          <p className="text-body-sm text-text-secondary mb-6">5 variants × 3 sizes</p>
          <div className="space-y-6">
            {(["sm", "md", "lg"] as const).map((size) => (
              <div key={size}>
                <p className="text-caption text-text-tertiary mb-3 uppercase tracking-widest">{size}</p>
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary" size={size}>
                    Primary
                  </Button>
                  <Button variant="secondary" size={size}>
                    Secondary
                  </Button>
                  <Button variant="outline" size={size}>
                    Outline
                  </Button>
                  <Button variant="ghost" size={size}>
                    Ghost
                  </Button>
                  <Button variant="glass" size={size}>
                    Glass
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Mood Pills ── */}
        <Section title="Mood Pills">
          <div className="flex flex-wrap gap-3">
            {moods.map((mood) => (
              <MoodPill key={mood.label} label={mood.label} emoji={mood.emoji} />
            ))}
          </div>
          <div className="flex flex-wrap gap-3 mt-3">
            {moods.map((mood) => (
              <MoodPill key={mood.label} label={mood.label} emoji={mood.emoji} active />
            ))}
          </div>
        </Section>

        {/* ── Cards ── */}
        <Section title="Card System">
          <p className="text-body-sm text-text-secondary mb-6">3:4 aspect ratio, gradient overlay, hover lift</p>
          <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
            <div className="w-72">
              <ExperienceCard experience={previewExp} />
            </div>
            <div className="w-56">
              <ExperienceCard experience={previewExp} size="sm" />
            </div>
          </div>
        </Section>

        {/* ── Content Rail ── */}
        <Section title="Content Rails">
          <ContentRail title="Featured Experiences" experiences={experiences.slice(0, 4)} />
        </Section>

        {/* ── Glass Effects ── */}
        <Section title="Glass & Blur">
          <div className="relative p-12 rounded-2xl overflow-hidden border border-border-default">
            <Image
              src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=60"
              alt=""
              fill
              className="object-cover"
              sizes="800px"
            />
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-6 rounded-xl glass">
                <p className="text-white font-semibold">glass</p>
                <p className="text-white/60 text-caption mt-1">rgba(255,255,255,0.04) + blur(12px)</p>
              </div>
              <div className="p-6 rounded-xl glass-strong">
                <p className="text-white font-semibold">glass-strong</p>
                <p className="text-white/60 text-caption mt-1">rgba(0,0,0,0.8) + blur(24px)</p>
              </div>
            </div>
          </div>
        </Section>

        {/* ── Responsive Guidelines ── */}
        <Section title="Responsive Guidelines">
          <div className="p-8 rounded-2xl bg-surface-secondary border border-border-default">
            <div className="space-y-6">
              <div>
                <p className="text-body-sm font-medium text-text-primary mb-1">Breakpoints</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { name: "Mobile", range: "< 640px", cols: "2 cols" },
                    { name: "Tablet", range: "640px - 1023px", cols: "3 cols" },
                    { name: "Desktop", range: "1024px - 1279px", cols: "4 cols" },
                    { name: "Wide", range: "1280px+", cols: "4-5 cols" },
                  ].map((bp) => (
                    <div key={bp.name} className="p-4 rounded-xl bg-surface-tertiary border border-border-subtle">
                      <p className="font-semibold text-text-primary text-body-sm">{bp.name}</p>
                      <p className="text-caption text-text-tertiary mt-0.5">{bp.range}</p>
                      <p className="text-caption text-text-tertiary">Grid: {bp.cols}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-body-sm font-medium text-text-primary mb-1">Content Rail Behavior</p>
                <ul className="space-y-1.5 text-body-sm text-text-secondary">
                  <li>• Mobile: horizontal scroll with snap points, 72 card width</li>
                  <li>• Tablet: horizontal scroll, 72 card width, 16px padding</li>
                  <li>• Desktop: horizontal scroll, 72 card width, 32px padding</li>
                  <li>• Wide: horizontal scroll, 72 card width, 64px padding</li>
                </ul>
              </div>

              <div>
                <p className="text-body-sm font-medium text-text-primary mb-1">Navbar</p>
                <ul className="space-y-1.5 text-body-sm text-text-secondary">
                  <li>• Mobile: hamburger menu, fullscreen overlay nav</li>
                  <li>• Desktop: horizontal nav items, glass-strong background</li>
                </ul>
              </div>

              <div>
                <p className="text-body-sm font-medium text-text-primary mb-1">Grid System</p>
                <ul className="space-y-1.5 text-body-sm text-text-secondary">
                  <li>• Experience grid: 2 cols mobile → 3 cols tablet → 4 cols desktop</li>
                  <li>• Footer: 2 cols mobile → 4 cols desktop</li>
                  <li>• Gift cards: 1 col mobile → 3 cols desktop</li>
                </ul>
              </div>
            </div>
          </div>
        </Section>

        {/* ── Design Tokens Summary ── */}
        <Section title="Design Tokens">
          <div className="p-8 rounded-2xl bg-surface-secondary border border-border-default">
            <p className="text-body-sm text-text-secondary mb-4">
              All tokens are defined as Tailwind v4 <code className="text-brand-hot-pink">@theme</code> values in
              <code className="text-brand-hot-pink"> globals.css</code>. Use them as: <code className="text-brand-hot-pink">bg-surface-secondary</code>,
              <code className="text-brand-hot-pink"> text-text-primary</code>, <code className="text-brand-hot-pink"> border-border-subtle</code>.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-body-sm">
              <div className="p-4 rounded-xl bg-surface-tertiary border border-border-subtle">
                <p className="font-semibold text-text-primary mb-2">Color tokens</p>
                <code className="text-caption text-text-secondary block">--color-brand-hot-pink</code>
                <code className="text-caption text-text-secondary block">--color-surface-secondary</code>
                <code className="text-caption text-text-secondary block">--color-text-primary</code>
                <code className="text-caption text-text-secondary block">--color-border-default</code>
              </div>
              <div className="p-4 rounded-xl bg-surface-tertiary border border-border-subtle">
                <p className="font-semibold text-text-primary mb-2">Typography tokens</p>
                <code className="text-caption text-text-secondary block">--font-serif, --font-sans</code>
                <code className="text-caption text-text-secondary block">--font-size-heading-xl</code>
                <code className="text-caption text-text-secondary block">--font-size-body</code>
                <code className="text-caption text-text-secondary block">--leading-display</code>
              </div>
              <div className="p-4 rounded-xl bg-surface-tertiary border border-border-subtle">
                <p className="font-semibold text-text-primary mb-2">Spacing & Effects</p>
                <code className="text-caption text-text-secondary block">--spacing-*, --radius-*</code>
                <code className="text-caption text-text-secondary block">--shadow-*, --blur-*</code>
                <code className="text-caption text-text-secondary block">--transition-*</code>
                <code className="text-caption text-text-secondary block">--z-*</code>
              </div>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
