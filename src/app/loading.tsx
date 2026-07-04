export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#05070B]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-[#FF0F73]/20 border-t-[#FF0F73] animate-spin" />
        <p className="text-body-sm text-[#94A3B8]">Loading Momento...</p>
      </div>
    </div>
  );
}
