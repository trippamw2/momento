"use client";

import { useState, useMemo } from "react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function BookingCalendar({ selectedDate, onSelect }: { selectedDate: Date | null; onSelect: (d: Date) => void }) {
  const today = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const unavailable = useMemo(() => {
    const set = new Set<number>();
    for (let d = 1; d <= daysInMonth; d++) {
      if ((d * 7 + month * 13 + year * 31) % 10 > 6) set.add(d);
    }
    return set;
  }, [daysInMonth, month, year]);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const isPast = (d: number) =>
    year < today.getFullYear() ||
    (year === today.getFullYear() && month < today.getMonth()) ||
    (year === today.getFullYear() && month === today.getMonth() && d < today.getDate());

  const cells: (number | null)[] = Array(firstDayOfWeek).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="bg-[#111827] rounded-xl p-4 border border-white/[0.1]">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/5 transition-colors text-[#94A3B8]">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <span className="text-body-sm font-semibold text-white">{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/5 transition-colors text-[#94A3B8]">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-caption text-[#94A3B8] font-medium py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <div key={`empty-${i}`} />;
          const disabled = isPast(d) || unavailable.has(d);
          const selected = selectedDate?.getDate() === d && selectedDate?.getMonth() === month && selectedDate?.getFullYear() === year;
          return (
            <button
              key={d}
              disabled={disabled}
              onClick={() => onSelect(new Date(year, month, d))}
              className={`w-full aspect-square rounded-lg text-caption font-medium flex items-center justify-center transition-all ${
                selected
                  ? "bg-[#FF0F73] text-white shadow-[0_2px_8px_rgba(255, 15, 115, 0.25)]"
                  : disabled
                    ? "text-white/20 line-through cursor-not-allowed"
                    : "text-[#CBD5E1] hover:bg-white/5 hover:text-white"
              }`}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}
