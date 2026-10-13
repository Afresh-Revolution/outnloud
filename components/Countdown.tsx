"use client";

import { useEffect, useState } from "react";

const UNITS = [
  { key: "days", label: "Days" },
  { key: "hours", label: "Hours" },
  { key: "minutes", label: "Minutes" },
  { key: "seconds", label: "Seconds" },
] as const;

function remaining(target: number) {
  const diff = Math.max(0, target - Date.now());
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { days, hours, minutes, seconds, done: diff === 0 };
}

export function Countdown({ startsAt }: { startsAt: string }) {
  const target = new Date(startsAt).getTime();
  const [time, setTime] = useState(() => remaining(target));

  useEffect(() => {
    const timer = window.setInterval(() => setTime(remaining(target)), 1000);
    return () => window.clearInterval(timer);
  }, [target]);

  if (Number.isNaN(target)) return null;

  return (
    <div className="countdown" aria-label="Countdown to Out N Loud">
      {UNITS.map((unit) => (
        <div key={unit.key}>
          <strong>{String(time[unit.key]).padStart(2, "0")}</strong>
          <span>{time.done ? "Now" : unit.label}</span>
        </div>
      ))}
    </div>
  );
}
