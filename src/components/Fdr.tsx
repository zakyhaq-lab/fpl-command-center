import type { Opponent } from "@/lib/fpl/derive";
import type { Team } from "@/lib/fpl/types";

/** One gameweek cell: opponent short name, upper case at home and lower case away (the FPL convention). */
export function FdrCell({
  opps,
  teams,
  compact = false,
}: {
  opps: Opponent[];
  teams: Map<number, Team>;
  compact?: boolean;
}) {
  const h = compact ? "h-6 text-[12px]" : "h-8 text-[13px]";
  if (opps.length === 0) {
    return (
      <div className={`fdr-blank flex items-center justify-center rounded-[3px] ${h}`} title="Blank gameweek">
        —
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-px">
      {opps.map((o, i) => {
        const short = teams.get(o.team)?.short ?? "?";
        const label = o.home ? short.toUpperCase() : short.toLowerCase();
        return (
          <div
            key={i}
            className={`fdr-${o.fdr} flex items-center justify-center rounded-[3px] font-semibold ${opps.length > 1 ? (compact ? "h-[14px] text-[11px] leading-none" : "h-4 text-[11px] leading-none") : h}`}
            title={`${teams.get(o.team)?.name ?? short} (${o.home ? "home" : "away"}), difficulty ${o.fdr}`}
          >
            {label}
          </div>
        );
      })}
    </div>
  );
}
