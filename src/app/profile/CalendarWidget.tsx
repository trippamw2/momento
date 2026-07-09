"use client";

import { useState } from "react";

export default function CalendarWidget() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const blockedDates = new Set([5, 12, 19, 25]);

  const prev = () => { if (month === 0) { setMonth(11); setYear((y) => y - 1); } else setMonth((m) => m - 1); };
  const next = () => { if (month === 11) { setMonth(0); setYear((y) => y + 1); } else setMonth((m) => m + 1); };

  const cells: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="bg-white rounded-xl border border-[#ebebeb] p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <button onClick={prev} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[#f7f7f7] text-[#6a6a6a]">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <span className="text-body-sm font-semibold text-[#222222]">
          {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][month]} {year}
        </span>
        <button onClick={next} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[#f7f7f7] text-[#6a6a6a]">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1.5">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="text-center text-caption text-[#929292] py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <div key={`e-${i}`} />;
          const blocked = blockedDates.has(d);
          return (
            <button
              key={d}
              className={`w-full aspect-square rounded-lg text-caption font-medium flex items-center justify-center transition-colors ${
                blocked
                  ? "bg-red-50 text-red-500 line-through"
                  : "text-[#6a6a6a] hover:bg-[#f7f7f7] hover:text-[#222222]"
              }`}
            >
              {d}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#ebebeb]">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-red-50 border border-red-200" />
          <span className="text-caption text-[#929292]">Blocked</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-[#f7f7f7] border border-[#ebebeb]" />
          <span className="text-caption text-[#929292]">Available</span>
        </div>
      </div>
    </div>
  );
}
