"use client";

import { useState, useEffect } from "react";

export function AnniversaryTicker({ startDate }: { startDate: Date }) {
  const [t, setT] = useState({ years: 0, days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const tick = () => {
      const delta = Date.now() - startDate.getTime();
      if (delta <= 0) return;
      const totalDays = Math.floor(delta / 86400000);
      setT({
        years: Math.floor(totalDays / 365),
        days: totalDays % 365,
        hours: Math.floor((delta / 3600000) % 24),
        minutes: Math.floor((delta / 60000) % 60),
        seconds: Math.floor((delta / 1000) % 60),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startDate]);

  const units = [
    { label: "Yrs", value: t.years },
    { label: "Days", value: t.days },
    { label: "Hrs", value: t.hours },
    { label: "Mins", value: t.minutes },
    { label: "Secs", value: t.seconds },
  ];

  return (
    <div className="grid grid-cols-5 gap-2 sm:gap-3">
      {units.map(({ label, value }) => (
        <div
          key={label}
          className="flex flex-col items-center gap-1.5 rounded-xl border border-[var(--me-line)] bg-[var(--me-panel)] py-3 backdrop-blur-md shadow-sm"
        >
          <span className="font-mono text-xl sm:text-2xl font-bold text-[var(--me-rose)] tabular-nums leading-none">
            {String(value).padStart(2, "0")}
          </span>
          <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-[var(--me-muted)] font-sans-display font-medium">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
