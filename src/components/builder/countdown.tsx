"use client";

import { useEffect, useState } from "react";

/** Live countdown to `endsAt` (ISO date). Shows `endedText` once the time has passed. */
export function Countdown({ endsAt, endedText }: { endsAt: string; endedText: string }) {
  const end = Date.parse(endsAt);
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (Number.isNaN(end)) return null;
  const left = Math.max(0, end - (now ?? end));
  if (now !== null && left === 0) return <p className="font-display text-2xl">{endedText}</p>;
  const parts = [
    { v: Math.floor(left / 86_400_000), l: "Days" },
    { v: Math.floor(left / 3_600_000) % 24, l: "Hours" },
    { v: Math.floor(left / 60_000) % 60, l: "Mins" },
    { v: Math.floor(left / 1000) % 60, l: "Secs" },
  ];
  return (
    <div className="flex gap-4 md:gap-6" role="timer" aria-live="off" aria-label="Time left">
      {parts.map((p) => (
        <div key={p.l} className="min-w-16 text-center">
          <span className="block font-display text-4xl tabular-nums leading-none text-accent md:text-5xl">{now === null ? "--" : String(p.v).padStart(2, "0")}</span>
          <span className="mt-1 block text-[11px] uppercase tracking-[0.16em] opacity-70">{p.l}</span>
        </div>
      ))}
    </div>
  );
}
