"use client";

/* eslint-disable @next/next/no-img-element -- FPL shirt images are small remote webps */
import { useEffect, useMemo, useRef, useState } from "react";
import { useStoredString } from "@/lib/useStored";
import {
  fmtPrice,
  fmtSigned,
  fmtSignedPrice,
  HIT_COST,
  MAX_FREE_TRANSFERS,
  POSITION_PLURAL,
  POSITION_SHORT,
  shirtUrl,
  statusLabel,
  type Opponent,
} from "@/lib/fpl/derive";
import type { Player, Position, Team } from "@/lib/fpl/types";
import { FdrCell } from "./Fdr";

export interface PlannerProps {
  teamId: number;
  event: number;
  squad: number[]; // element ids in pick order
  bank: number;
  defaultFreeTransfers: number;
  players: Player[];
  teams: Team[];
  /** Club id → its next five gameweeks of opponents. */
  runs: Record<number, Opponent[][]>;
  squadTeamLimit: number;
}

interface Transfer {
  out: number;
  in: number;
}

type Chip = "none" | "wildcard" | "freehit";
type SortKey = "ep" | "form" | "points" | "price" | "fixtures";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "ep", label: "Expected" },
  { key: "form", label: "Form" },
  { key: "points", label: "Points" },
  { key: "fixtures", label: "Fixtures" },
  { key: "price", label: "Price" },
];

function runScore(weeks: Opponent[][] | undefined) {
  if (!weeks) return 3;
  return weeks.reduce((s, w) => s + (w.length ? w.reduce((a, o) => a + o.fdr, 0) / w.length - (w.length - 1) : 5), 0) / weeks.length;
}

interface SavedPlan {
  transfers: Transfer[];
  freeTransfers: number;
  chip: Chip;
}

/** Restores the saved plan for this team and gameweek, then mounts the planner with it. */
export function Planner(props: PlannerProps) {
  const storageKey = `fpl-cc:plan:${props.teamId}:${props.event}`;
  const raw = useStoredString(storageKey);
  let saved: SavedPlan | null = null;
  try {
    saved = raw ? JSON.parse(raw) : null;
  } catch {
    saved = null;
  }
  // Remount once storage is readable so the saved plan becomes the initial state.
  return <PlannerBoard key={raw === undefined ? "server" : "client"} {...props} storageKey={storageKey} saved={saved} />;
}

function PlannerBoard(props: PlannerProps & { storageKey: string; saved: SavedPlan | null }) {
  const { event, squad: original, bank: startBank, defaultFreeTransfers, players, teams, runs, squadTeamLimit, storageKey, saved } = props;

  const playerMap = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);
  const teamMap = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);

  const [transfers, setTransfers] = useState<Transfer[]>(saved?.transfers ?? []);
  const [freeTransfers, setFreeTransfers] = useState(saved?.freeTransfers ?? defaultFreeTransfers);
  const [chip, setChip] = useState<Chip>(saved?.chip ?? "none");
  const [selling, setSelling] = useState<number | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ transfers, freeTransfers, chip }));
    } catch {
      /* storage unavailable: the plan lives for this visit only */
    }
  }, [storageKey, transfers, freeTransfers, chip]);

  // The planned squad: originals with each transfer applied in order.
  const squad = useMemo(() => {
    const ids = [...original];
    for (const t of transfers) {
      const i = ids.indexOf(t.out);
      if (i >= 0) ids[i] = t.in;
    }
    return ids;
  }, [original, transfers]);

  const bank = transfers.reduce(
    (b, t) => b + (playerMap.get(t.out)?.cost ?? 0) - (playerMap.get(t.in)?.cost ?? 0),
    startBank,
  );
  const unlimited = chip !== "none";
  const paid = unlimited ? 0 : Math.max(0, transfers.length - freeTransfers);
  const hit = paid * HIT_COST;
  const epChange = transfers.reduce(
    (s, t) => s + (playerMap.get(t.in)?.epNext ?? 0) - (playerMap.get(t.out)?.epNext ?? 0),
    0,
  );
  const net = epChange - hit;

  const clubCounts = useMemo(() => {
    const c = new Map<number, number>();
    for (const id of squad) {
      const p = playerMap.get(id);
      if (p) c.set(p.team, (c.get(p.team) ?? 0) + 1);
    }
    return c;
  }, [squad, playerMap]);

  const overLimit = [...clubCounts].filter(([, n]) => n > squadTeamLimit).map(([t]) => teamMap.get(t)?.short);
  const problems = [
    bank < 0 && `${fmtPrice(-bank)} over budget`,
    overLimit.length > 0 && `more than ${squadTeamLimit} players from ${overLimit.join(", ")}`,
  ].filter(Boolean) as string[];

  const sellingPlayer = selling != null ? playerMap.get(selling) : undefined;

  function buy(inId: number) {
    if (selling == null) return;
    setTransfers((ts) => {
      // Selling a player bought earlier in this plan replaces that transfer.
      const earlier = ts.find((t) => t.in === selling);
      if (earlier) {
        const rest = ts.filter((t) => t !== earlier);
        return earlier.out === inId ? rest : [...rest, { out: earlier.out, in: inId }];
      }
      return [...ts, { out: selling, in: inId }];
    });
    setSelling(null);
  }

  function undo(t: Transfer) {
    setTransfers((ts) => ts.filter((x) => x !== t));
  }

  return (
    <div>
      <section aria-labelledby="plan-heading" className="card mb-6">
        <div className="flex flex-wrap items-end justify-between gap-3 px-5 pt-4">
          <div>
            <h2 id="plan-heading" className="text-[16px] font-semibold">
              Plan for GW{event}
            </h2>
            <p className={`mt-0.5 text-[13px] ${problems.length ? "text-negative" : "text-soft"}`}>
              {problems.length
                ? `Not valid yet: ${problems.join("; ")}.`
                : transfers.length === 0
                  ? "No transfers yet. Choose a player in your squad to sell."
                  : `${transfers.length} transfer${transfers.length === 1 ? "" : "s"}, ${hit ? `a −${hit} hit` : "no hit"}; ${fmtSigned(net, 1)} expected points after the hit.`}
            </p>
          </div>
          <div className="flex items-center gap-5" role="group" aria-label="Chip">
            {(["none", "wildcard", "freehit"] as Chip[]).map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={chip === c}
                onClick={() => setChip(c)}
                className={`sel h-[34px] text-[13px] transition-colors ${chip === c ? "text-text" : "text-muted hover:text-text"}`}
              >
                {c === "none" ? "No chip" : c === "wildcard" ? "Wildcard" : "Free Hit"}
              </button>
            ))}
          </div>
        </div>
        <dl className="mt-3 grid grid-cols-2 border-t border-rule sm:grid-cols-5">
          <Cell label="Transfers" value={String(transfers.length)} caption={transfers.length ? `${paid} paid` : "None planned"} />
          <div className="border-l border-rule px-5 py-4">
            <dt className="text-[12px] text-muted" id="ft-label">
              Free transfers
            </dt>
            <dd className="mt-1 flex items-center gap-3">
              <Stepper
                label="free transfers"
                value={freeTransfers}
                min={0}
                max={MAX_FREE_TRANSFERS}
                onChange={setFreeTransfers}
                disabled={unlimited}
              />
            </dd>
            <dd className="mt-1.5 text-[12px] text-muted">
              {unlimited ? "Unlimited with the chip" : freeTransfers === defaultFreeTransfers ? "From your transfer history" : `History says ${defaultFreeTransfers}`}
            </dd>
          </div>
          <Cell
            label="Points hit"
            value={hit ? `−${hit}` : "0"}
            unit="pts"
            caption={paid ? `${paid} × ${HIT_COST} pts` : "Within free transfers"}
            tone={hit ? "negative" : undefined}
          />
          <Cell
            label="Bank after"
            value={fmtPrice(bank)}
            caption={transfers.length ? `${fmtSignedPrice(bank - startBank)} on ${fmtPrice(startBank)}` : "Current bank"}
            tone={bank < 0 ? "negative" : undefined}
          />
          <Cell
            wide
            label={`Expected, GW${event}`}
            value={fmtSigned(epChange, 1)}
            unit="pts"
            caption={hit ? `${fmtSigned(net, 1)} after the hit` : "FPL's expected points, in minus out"}
            captionTone={transfers.length ? (net > 0 ? "positive" : net < 0 ? "negative" : undefined) : undefined}
          />
        </dl>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_384px]">
        <section aria-labelledby="squad-heading" className="min-w-0">
          <h2 id="squad-heading" className="mb-2 text-[16px] font-semibold">
            Planned squad
          </h2>
          <div className="card overflow-x-auto px-4 py-2">
            <table className="w-full text-[13px] sm:min-w-[620px]">
              <thead>
                <tr className="text-[12px] text-muted">
                  <th className="py-2 text-left font-normal">Player</th>
                  <th className="py-2 text-right font-normal">Price</th>
                  <th className="py-2 text-right font-normal">Form</th>
                  <th className="py-2 text-right font-normal">xPts</th>
                  <th className="hidden py-2 pl-4 text-left font-normal sm:table-cell">Next five</th>
                  <th className="py-2">
                    <span className="sr-only">Action</span>
                  </th>
                </tr>
              </thead>
              {([1, 2, 3, 4] as Position[]).map((pos) => (
                <tbody key={pos}>
                  <tr>
                    <th colSpan={6} className="pt-3 pb-1 text-left text-[12px] font-medium text-soft">
                      {POSITION_PLURAL[pos]}
                    </th>
                  </tr>
                  {squad
                    .map((id) => playerMap.get(id)!)
                    .filter((p) => p && p.position === pos)
                    .map((p) => {
                      const incoming = transfers.find((t) => t.in === p.id);
                      const replaced = incoming ? playerMap.get(incoming.out) : undefined;
                      const isSelling = selling === p.id;
                      const flag = statusLabel(p);
                      return (
                        <tr key={p.id} data-selected={isSelling} className="sel border-t border-rule">
                          <td className="py-1.5">
                            <PlayerCell p={p} team={teamMap.get(p.team)!} flag={flag} />
                            {replaced && (
                              <span className="ml-[30px] block text-[12px] text-positive">In for {replaced.name}</span>
                            )}
                          </td>
                          <td className="py-1.5 pl-2 text-right">{fmtPrice(p.cost)}</td>
                          <td className="py-1.5 pl-2 text-right text-soft">{p.form.toFixed(1)}</td>
                          <td className="py-1.5 pl-2 text-right font-semibold">{p.epNext.toFixed(1)}</td>
                          <td className="hidden py-1.5 pl-4 sm:table-cell">
                            <FiveCells weeks={runs[p.team]} teams={teamMap} />
                          </td>
                          <td className="py-1.5 pl-3 text-right">
                            <button
                              type="button"
                              onClick={() => setSelling(isSelling ? null : p.id)}
                              aria-pressed={isSelling}
                              className={`h-[28px] rounded-full px-3 text-[12px] font-medium transition-colors ${isSelling ? "bg-text text-ground" : "border border-control text-soft hover:border-text hover:text-text"}`}
                            >
                              {isSelling ? "Selling" : "Sell"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              ))}
            </table>
          </div>
          <p className="mt-2 text-[12px] text-muted">
            Sale prices use the current price. FPL keeps half of any rise since you bought, so your real bank can be a
            little lower.
          </p>
        </section>

        <div className="flex min-w-0 flex-col">
          <h2 className="mb-2 text-[16px] font-semibold">Transfers</h2>
          <section className="card mb-4 px-4 py-2">
            {transfers.length === 0 ? (
              <p className="py-4 text-[13px] text-muted">Nothing planned.</p>
            ) : (
              <ul>
                {transfers.map((t, i) => {
                  const out = playerMap.get(t.out)!;
                  const inn = playerMap.get(t.in)!;
                  const free = unlimited || i < freeTransfers;
                  return (
                    <li key={`${t.out}-${t.in}`} className="flex items-center gap-3 border-t border-rule py-2.5 first:border-t-0">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px]">
                          <span className="text-soft">{out.name}</span>
                          <span className="text-muted"> to </span>
                          <span className="font-semibold">{inn.name}</span>
                        </div>
                        <div className="text-[12px] text-muted">
                          {fmtSignedPrice(out.cost - inn.cost)} · {free ? "free" : <span className="text-negative">−{HIT_COST} pts</span>}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => undo(t)}
                        className="text-[12px] text-muted transition-colors hover:text-text"
                        aria-label={`Undo ${out.name} to ${inn.name}`}
                      >
                        Undo
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {transfers.length > 0 && (
              <button
                type="button"
                onClick={() => setTransfers([])}
                className="mb-2 mt-1 h-[30px] w-full rounded-full border border-control text-[12px] text-soft transition-colors hover:border-text hover:text-text"
              >
                Clear the plan
              </button>
            )}
          </section>

          <h2 className="mb-2 text-[16px] font-semibold">
            {sellingPlayer ? `Replace ${sellingPlayer.name}` : "Market"}
          </h2>
          {sellingPlayer ? (
            <Market
              key={sellingPlayer.id}
              selling={sellingPlayer}
              players={players}
              teamMap={teamMap}
              squad={squad}
              bank={bank}
              clubCounts={clubCounts}
              squadTeamLimit={squadTeamLimit}
              runs={runs}
              onBuy={buy}
              onCancel={() => setSelling(null)}
            />
          ) : (
            <section className="card px-4 py-8 text-center text-[13px] text-muted">
              Press Sell on a player and the replacements that fit your bank appear here.
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function Market({
  selling,
  players,
  teamMap,
  squad,
  bank,
  clubCounts,
  squadTeamLimit,
  runs,
  onBuy,
  onCancel,
}: {
  selling: Player;
  players: Player[];
  teamMap: Map<number, Team>;
  squad: number[];
  bank: number;
  clubCounts: Map<number, number>;
  squadTeamLimit: number;
  runs: Record<number, Opponent[][]>;
  onBuy: (id: number) => void;
  onCancel: () => void;
}) {
  const [query, setQuery] = useState("");
  const [club, setClub] = useState(0);
  const [sort, setSort] = useState<SortKey>("ep");
  const [affordable, setAffordable] = useState(true);
  const budget = bank + selling.cost;
  const ref = useRef<HTMLElement>(null);

  // Below the two-column layout the market sits under the squad; bring it into view.
  useEffect(() => {
    if (window.matchMedia("(max-width: 1023px)").matches) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      ref.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
  }, []);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const inSquad = new Set(squad);
    return players
      .filter((p) => p.position === selling.position && !inSquad.has(p.id) && p.status !== "u" && p.status !== "n")
      .filter((p) => !club || p.team === club)
      .filter((p) => !affordable || p.cost <= budget)
      .filter((p) => !q || p.name.toLowerCase().includes(q) || p.fullName.toLowerCase().includes(q))
      .sort((a, b) => {
        switch (sort) {
          case "ep":
            return b.epNext - a.epNext || b.form - a.form;
          case "form":
            return b.form - a.form;
          case "points":
            return b.totalPoints - a.totalPoints;
          case "price":
            return b.cost - a.cost;
          case "fixtures":
            return runScore(runs[a.team]) - runScore(runs[b.team]) || b.epNext - a.epNext;
        }
      })
      .slice(0, 12);
  }, [players, selling, squad, club, affordable, budget, query, sort, runs]);

  return (
    <section ref={ref} className="card scroll-mt-4 px-4 pt-3 pb-2" aria-label={`Replacements for ${selling.name}`}>
      <p className="text-[12px] text-muted">
        {POSITION_SHORT[selling.position]} up to {fmtPrice(budget)} ({fmtPrice(selling.cost)} sale plus {fmtPrice(bank)} bank)
      </p>
      <div className="mt-2 flex gap-2">
        <label className="sr-only" htmlFor="market-search">
          Search players
        </label>
        <input
          id="market-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name"
          className="h-[34px] min-w-0 flex-1 rounded-full border border-control bg-ground px-3 text-[13px] placeholder:text-muted focus:border-accent focus:outline-none"
        />
        <label className="sr-only" htmlFor="market-club">
          Club
        </label>
        <select
          id="market-club"
          value={club}
          onChange={(e) => setClub(Number(e.target.value))}
          className="h-[34px] w-[96px] rounded-full border border-control bg-ground px-2 text-[13px] focus:border-accent focus:outline-none"
        >
          <option value={0}>All clubs</option>
          {[...teamMap.values()]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((t) => (
              <option key={t.id} value={t.id}>
                {t.short}
              </option>
            ))}
        </select>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1" role="group" aria-label="Sort by">
        {SORTS.map((s) => (
          <button
            key={s.key}
            type="button"
            aria-pressed={sort === s.key}
            onClick={() => setSort(s.key)}
            className={`sel h-[28px] text-[12px] transition-colors ${sort === s.key ? "text-text" : "text-muted hover:text-text"}`}
          >
            {s.label}
          </button>
        ))}
        <label className="ml-auto flex items-center gap-1.5 text-[12px] text-soft">
          <input type="checkbox" checked={affordable} onChange={(e) => setAffordable(e.target.checked)} className="accent-[var(--accent)]" />
          Affordable
        </label>
      </div>

      <ul className="mt-1">
        {list.map((p) => {
          const sameClubAsSold = p.team === selling.team ? 1 : 0;
          const full = (clubCounts.get(p.team) ?? 0) - sameClubAsSold >= squadTeamLimit;
          const tooDear = p.cost > budget;
          const metric =
            sort === "form" ? p.form.toFixed(1) : sort === "points" ? String(p.totalPoints) : p.epNext.toFixed(1);
          const metricLabel = sort === "form" ? "form" : sort === "points" ? "pts" : "xPts";
          return (
            <li key={p.id} className="flex items-center gap-2 border-t border-rule py-2">
              <div className="min-w-0 flex-1">
                <PlayerCell p={p} team={teamMap.get(p.team)!} flag={statusLabel(p)} />
                <div className="mt-1 ml-[30px] w-[150px]">
                  <FiveCells weeks={runs[p.team]} teams={teamMap} compact />
                </div>
              </div>
              <div className="w-[52px] text-right">
                <div className="text-[13px]">{fmtPrice(p.cost)}</div>
                <div className="text-[12px] text-muted">
                  {metric} {metricLabel}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onBuy(p.id)}
                disabled={full || tooDear}
                title={full ? `Already ${squadTeamLimit} from ${teamMap.get(p.team)?.short}` : tooDear ? "Over budget" : undefined}
                className="h-[28px] w-[52px] rounded-full bg-text text-[12px] font-semibold text-ground transition-opacity hover:opacity-90 active:opacity-75 disabled:bg-raised disabled:text-muted"
              >
                {full ? `${squadTeamLimit} max` : "Buy"}
              </button>
            </li>
          );
        })}
        {list.length === 0 && <li className="border-t border-rule py-6 text-center text-[13px] text-muted">No player matches.</li>}
      </ul>
      <button type="button" onClick={onCancel} className="my-2 h-[30px] w-full rounded-full border border-control text-[12px] text-soft hover:border-text hover:text-text">
        Keep {selling.name}
      </button>
    </section>
  );
}

function PlayerCell({ p, team, flag }: { p: Player; team: Team; flag: string | null }) {
  return (
    <span className="flex min-w-0 items-center gap-2.5" title={flag ?? undefined}>
      <img src={shirtUrl(team.code, p.position === 1)} alt="" width={20} height={26} className="h-[26px] w-auto shrink-0" loading="lazy" />
      <span className="min-w-0">
        <span className="block truncate font-medium">
          {p.name}
          {flag && (
            <span className={`ml-1.5 text-[12px] font-normal ${p.status === "d" ? "text-warning" : "text-negative"}`}>
              {p.chance != null ? `${p.chance}%` : "out"}
            </span>
          )}
        </span>
        <span className="block text-[12px] text-muted">{team.short}</span>
      </span>
    </span>
  );
}

function FiveCells({ weeks, teams, compact }: { weeks: Opponent[][] | undefined; teams: Map<number, Team>; compact?: boolean }) {
  if (!weeks) return <span className="text-muted">—</span>;
  return (
    <div className={`grid grid-cols-5 gap-px ${compact ? "" : "w-[220px]"}`}>
      {weeks.map((opps, i) => (
        <FdrCell key={i} opps={opps} teams={teams} compact />
      ))}
    </div>
  );
}

function Cell({
  label,
  value,
  unit,
  caption,
  tone,
  captionTone = tone,
  wide,
}: {
  wide?: boolean;
  label: string;
  value: string;
  unit?: string;
  caption: string;
  tone?: "positive" | "negative";
  captionTone?: "positive" | "negative";
}) {
  return (
    <div className={`border-rule px-5 py-4 [&:not(:first-child)]:border-l max-sm:[&:nth-child(odd)]:border-l-0 max-sm:[&:nth-child(n+3)]:border-t ${wide ? "max-sm:col-span-2" : ""}`}>
      <dt className="text-[12px] text-muted">{label}</dt>
      <dd className={`mt-1 text-[24px] leading-none font-medium ${tone === "negative" ? "text-negative" : ""}`}>
        {value}
        {unit && <span className="ml-1 text-[13px] text-muted">{unit}</span>}
      </dd>
      <dd className={`mt-1.5 text-[12px] ${captionTone === "positive" ? "text-positive" : captionTone === "negative" ? "text-negative" : "text-muted"}`}>
        {caption}
      </dd>
    </div>
  );
}

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
  disabled?: boolean;
}) {
  const btn =
    "flex h-[26px] w-[26px] items-center justify-center rounded-full border border-control text-[14px] text-soft transition-colors hover:border-text hover:text-text disabled:opacity-40 disabled:hover:border-control";
  return (
    <>
      <button type="button" className={btn} disabled={disabled || value <= min} onClick={() => onChange(value - 1)} aria-label={`Fewer ${label}`}>
        −
      </button>
      <span className="min-w-[1ch] text-[24px] leading-none font-medium" aria-live="polite">
        {disabled ? "∞" : value}
      </span>
      <button type="button" className={btn} disabled={disabled || value >= max} onClick={() => onChange(value + 1)} aria-label={`More ${label}`}>
        +
      </button>
    </>
  );
}
