import AIConcierge from "@/components/AIConcierge";

export default function AskAIPage() {
  return (
    <main className="min-h-screen pt-24 pb-16 bg-[#05070B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="text-center mb-8">
          <h1 className="text-heading-xl sm:text-display-sm font-bold text-white">
            AI Concierge
          </h1>
          <p className="text-body text-[#6B7280] mt-2 max-w-xl mx-auto">
            Tell me what you&apos;re looking for and I&apos;ll find the perfect experience for you.
          </p>
        </div>
        <AIConcierge />
      </div>
    </main>
  );
}
