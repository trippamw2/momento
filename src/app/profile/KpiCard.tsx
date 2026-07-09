export default function KpiCard({ label, value, trend, icon }: { label: string; value: string; trend?: string; icon: string }) {
  return (
    <div className="p-5 rounded-xl bg-white border border-[#ebebeb] hover:border-[#dddddd] transition-all shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        {trend && (
          <span className="text-caption font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            +{trend}
          </span>
        )}
      </div>
      <p className="text-heading-lg font-bold text-[#222222] mb-0.5">{value}</p>
      <p className="text-caption text-[#929292]">{label}</p>
    </div>
  );
}
