export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf8f6]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-[#DD2A7B]/20 border-t-[#DD2A7B] animate-spin" />
        <p className="text-body-sm text-[#929292]">Loading Experio...</p>
      </div>
    </div>
  );
}
