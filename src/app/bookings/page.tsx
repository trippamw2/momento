export default function BookingsPage() {
  return (
    <div className="pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-surface-tertiary flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📅</span>
          </div>
          <h1 className="text-heading-xl font-bold text-text-primary mb-2">Your Bookings</h1>
          <p className="text-text-secondary text-body mb-6">Sign in to view and manage your upcoming experiences.</p>
          <button className="px-8 py-3 rounded-full gradient-brand text-text-on-gradient font-semibold text-body-sm hover:shadow-brand-glow transition-all duration-300">
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
