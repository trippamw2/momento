export default function WalletLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-12 bg-dark-800 rounded-lg w-48" />
      <div className="h-48 bg-dark-800 rounded-2xl" />
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-dark-800 rounded-xl" />
        ))}
      </div>
      <div className="h-64 bg-dark-800 rounded-2xl" />
    </div>
  );
}
