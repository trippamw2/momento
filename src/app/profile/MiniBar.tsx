export default function MiniBar({ data, height = 40 }: { data: number[]; height?: number }) {
  const max = Math.max(...data);
  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {data.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-sm bg-[#FF0F73] transition-all duration-300"
          style={{ height: `${(v / max) * 100}%` }}
        />
      ))}
    </div>
  );
}
