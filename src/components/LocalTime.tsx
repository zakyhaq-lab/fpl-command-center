"use client";

import { useMinute } from "@/lib/useStored";

/** Formats an ISO time in the viewer's timezone, with a countdown when it's ahead. */
export function LocalTime({ iso, countdown = false }: { iso: string; countdown?: boolean }) {
  const now = useMinute();

  const date = new Date(iso);
  if (now === null) return <time dateTime={iso}>{iso.slice(0, 10)}</time>;

  const label = date.toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  let left = "";
  if (countdown) {
    const mins = Math.round((date.getTime() - now) / 60_000);
    if (mins > 0) {
      const d = Math.floor(mins / 1440);
      const h = Math.floor((mins % 1440) / 60);
      const m = mins % 60;
      left = d > 0 ? `in ${d}d ${h}h` : h > 0 ? `in ${h}h ${m}m` : `in ${m}m`;
    } else {
      left = "passed";
    }
  }
  return (
    <time dateTime={iso}>
      {label}
      {left && <span className="text-muted"> · {left}</span>}
    </time>
  );
}
