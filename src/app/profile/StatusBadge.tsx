const colors: Record<string, string> = {
  confirmed: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
  pending: "bg-amber-400/10 text-amber-400 border-amber-400/20",
  completed: "bg-blue-400/10 text-blue-400 border-blue-400/20",
  cancelled: "bg-red-400/10 text-red-400 border-red-400/20",
  paid: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-caption font-medium capitalize border ${colors[status] || "bg-[#f7f7f7] text-[#929292] border-[#ebebeb]"}`}>
      {status}
    </span>
  );
}
