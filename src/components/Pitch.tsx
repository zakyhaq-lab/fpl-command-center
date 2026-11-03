/* eslint-disable @next/next/no-img-element -- FPL shirt images are small remote webps */
import { shirtUrl, statusLabel } from "@/lib/fpl/derive";
import type { Fixture, LiveStat, Pick, Player, Team } from "@/lib/fpl/types";

export interface PitchPlayer {
  pick: Pick;
  player: Player;
  team: Team;
  live: LiveStat | undefined;
  /** This gameweek's fixtures for the player's club. */
  fixtures: Fixture[];
}

function PlayerToken({ p, teams, bench }: { p: PitchPlayer; teams: Map<number, Team>; bench?: boolean }) {
  const { pick, player, team, live, fixtures } = p;
  const notStarted = fixtures.length > 0 && fixtures.every((f) => !f.started);
  const points = (live?.points ?? 0) * (bench ? 1 : Math.max(1, pick.multiplier));
  const flag = statusLabel(player);
  const opponents = fixtures
    .map((f) => (f.home === team.id ? teams.get(f.away)?.short : teams.get(f.home)?.short?.toLowerCase()))
    .join(" ");

  return (
    <div className="flex w-[64px] flex-col items-center sm:w-[92px]" title={flag ?? undefined}>
      <div className="relative">
        <img
          src={shirtUrl(team.code, player.position === 1)}
          alt=""
          width={44}
          height={58}
          className="h-[40px] w-[30px] object-contain sm:h-[48px] sm:w-[36px]"
        />
        {(pick.isCaptain || pick.isVice) && (
          <span
            className={`absolute -top-1 -right-2 flex h-[18px] w-[18px] items-center justify-center rounded-full text-[11px] font-bold ${pick.isCaptain ? "bg-text text-ground" : "bg-control text-text"}`}
            aria-label={pick.isCaptain ? (pick.multiplier === 3 ? "Triple captain" : "Captain") : "Vice-captain"}
          >
            {pick.isCaptain ? (pick.multiplier === 3 ? "3" : "C") : "V"}
          </span>
        )}
        {flag && (
          <span
            className={`absolute -top-1 -left-2 h-[10px] w-[10px] rounded-full ring-2 ring-pitch ${player.status === "d" ? "bg-warning" : "bg-negative"}`}
            role="img"
            aria-label={flag}
          />
        )}
      </div>
      <div className="mt-1 w-full truncate rounded-t-[3px] bg-text px-1 text-center text-[11px] leading-[18px] font-semibold text-ground sm:text-[12px]">
        {player.name}
      </div>
      <div className="w-full truncate rounded-b-[3px] bg-surface px-1 text-center text-[12px] leading-[20px] font-semibold">
        {fixtures.length === 0 ? (
          <span className="font-normal text-muted">Blank</span>
        ) : notStarted ? (
          <span className="font-normal text-soft">{opponents}</span>
        ) : (
          <span className={live?.played ? "" : "text-muted"}>{points}</span>
        )}
      </div>
    </div>
  );
}

export function Pitch({
  starters,
  bench,
  teams,
}: {
  starters: PitchPlayer[];
  bench: PitchPlayer[];
  teams: Map<number, Team>;
}) {
  const rows = [1, 2, 3, 4].map((pos) => starters.filter((p) => p.player.position === pos));

  return (
    <div className="grid gap-2 xl:grid-cols-[1fr_112px]">
      <div className="relative overflow-hidden rounded-[6px] bg-pitch px-1 py-5">
        <PitchLines />
        <div className="relative flex flex-col gap-4">
          {rows.map((row, i) => (
            <div key={i} className="flex justify-center gap-1 sm:gap-6">
              {row.map((p) => (
                <PlayerToken key={p.pick.element} p={p} teams={teams} />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-[6px] bg-raised px-1 pt-2 pb-4">
        <p className="mb-2 px-2 text-[12px] text-muted xl:text-center">Bench</p>
        <div className="flex items-start justify-center gap-1 sm:gap-6 xl:flex-col xl:items-center xl:gap-4">
          {bench.map((p) => (
            <PlayerToken key={p.pick.element} p={p} teams={teams} bench />
          ))}
        </div>
      </div>
    </div>
  );
}

function PitchLines() {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 140" aria-hidden>
      <g fill="none" stroke="var(--pitch-line)" strokeWidth="1" vectorEffect="non-scaling-stroke">
        <rect x="2" y="2" width="96" height="136" />
        <line x1="2" y1="70" x2="98" y2="70" />
        <ellipse cx="50" cy="70" rx="10" ry="8" />
        <rect x="25" y="2" width="50" height="18" />
        <rect x="38" y="2" width="24" height="7" />
        <rect x="25" y="120" width="50" height="18" />
        <rect x="38" y="131" width="24" height="7" />
      </g>
    </svg>
  );
}
