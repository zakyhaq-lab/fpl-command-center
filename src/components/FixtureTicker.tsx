"use client";

/* eslint-disable @next/next/no-img-element -- FPL shirt images are small remote webps */
import { useMemo, useState } from "react";
import { shirtUrl, weekDifficulty, type TeamRun } from "@/lib/fpl/derive";
import type { Team } from "@/lib/fpl/types";
import { FdrCell } from "./Fdr";

const HORIZONS = [3, 5, 8] as const;

export function FixtureTicker({
  teams,
  runs,
  owned,
}: {
  teams: Team[];
  runs: TeamRun[];
  /** Club id → names of the team's players at that club. */
  owned: Record<number, string[]>;
}) {
  const [horizon, setHorizon] = useState<(typeof HORIZONS)[number]>(5);
  const [sort, setSort] = useState<"easiest" | "club">("easiest");
  const [mine, setMine] = useState(false);
  const teamMap = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);

  const rows = useMemo(() => {
    const sliced = runs.map((r) => {
      const weeks = r.weeks.slice(0, horizon);
      return { ...r, weeks, rating: weeks.reduce((s, w) => s + weekDifficulty(w.opps), 0) / weeks.length };
    });
    const filtered = mine ? sliced.filter((r) => owned[r.team]?.length) : sliced;
    return filtered.sort((a, b) =>
      sort === "easiest"
        ? a.rating - b.rating
        : (teamMap.get(a.team)?.name ?? "").localeCompare(teamMap.get(b.team)?.name ?? ""),
    );
  }, [runs, horizon, sort, mine, owned, teamMap]);

  const events = runs[0]?.weeks.slice(0, horizon).map((w) => w.event) ?? [];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2" role="toolbar" aria-label="Ticker options">
        <Segment label="Window">
          {HORIZONS.map((h) => (
            <SegButton key={h} pressed={horizon === h} onClick={() => setHorizon(h)}>
              {h} gameweeks
            </SegButton>
          ))}
        </Segment>
        <Segment label="Order">
          <SegButton pressed={sort === "easiest"} onClick={() => setSort("easiest")}>
            Easiest first
          </SegButton>
          <SegButton pressed={sort === "club"} onClick={() => setSort("club")}>
            Club name
          </SegButton>
        </Segment>
        <SegButton pressed={mine} onClick={() => setMine((m) => !m)}>
          Only my clubs
        </SegButton>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] border-separate border-spacing-x-[3px] border-spacing-y-[3px] px-3 py-2 text-[13px]">
          <thead>
            <tr className="text-[12px] text-muted">
              <th scope="col" className="w-[200px] py-2 pl-1 text-left font-normal">
                Club
              </th>
              <th scope="col" className="w-[140px] py-2 text-left font-normal">
                Your players
              </th>
              {events.map((ev) => (
                <th key={ev} scope="col" className="py-2 text-center font-normal">
                  GW{ev}
                </th>
              ))}
              <th scope="col" className="w-[84px] py-2 pr-1 text-right font-normal" title="Mean difficulty per gameweek. A blank counts as 5; a double counts one point easier.">
                Difficulty
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const t = teamMap.get(r.team)!;
              const names = owned[r.team] ?? [];
              return (
                <tr key={r.team}>
                  <th scope="row" className="py-1 pl-1 text-left font-medium">
                    <span className="flex items-center gap-2">
                      <img src={shirtUrl(t.code)} alt="" width={20} height={26} className="h-[26px] w-auto" loading="lazy" />
                      {t.name}
                    </span>
                  </th>
                  <td className="truncate py-1 text-[12px] text-soft" title={names.join(", ")}>
                    {names.length ? names.join(", ") : <span className="text-muted">—</span>}
                  </td>
                  {r.weeks.map((w) => (
                    <td key={w.event} className="min-w-[64px] py-0">
                      <FdrCell opps={w.opps} teams={teamMap} />
                    </td>
                  ))}
                  <td className="py-1 pr-1 text-right font-semibold">{r.rating.toFixed(2)}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={events.length + 3} className="py-10 text-center text-muted">
                  None of your players&apos; clubs are in this list.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Legend />
    </div>
  );
}

function Segment({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="group" aria-label={label} className="flex items-center gap-4">
      {children}
    </div>
  );
}

function SegButton({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`sel h-[34px] text-[13px] transition-colors ${pressed ? "text-text" : "text-muted hover:text-text"}`}
    >
      {children}
    </button>
  );
}

function Legend() {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-muted">
      <span>Fixture difficulty</span>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className="flex items-center gap-1.5">
          <span className={`fdr-${n} inline-block h-3 w-5 rounded-[2px]`} aria-hidden />
          {n}
          {n === 1 ? " easiest" : n === 5 ? " hardest" : ""}
        </span>
      ))}
      <span>Upper case at home, lower case away</span>
    </div>
  );
}
