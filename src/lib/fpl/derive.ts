// Pure helpers shared by server and client components.
import type { Chip, EventHistory, Fixture, Player, Position, Team } from "./types";

export const POSITION_SHORT: Record<Position, string> = { 1: "GK", 2: "DEF", 3: "MID", 4: "FWD" };
export const POSITION_PLURAL: Record<Position, string> = {
  1: "Goalkeepers",
  2: "Defenders",
  3: "Midfielders",
  4: "Forwards",
};
export const SQUAD_SHAPE: Record<Position, number> = { 1: 2, 2: 5, 3: 5, 4: 3 };
export const MAX_FREE_TRANSFERS = 5;
export const HIT_COST = 4;

export function shirtUrl(teamCode: number, goalkeeper = false): string {
  return `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${teamCode}${goalkeeper ? "_1" : ""}-66.webp`;
}

/* ---------- formatting ---------- */

const nf = new Intl.NumberFormat("en-GB");

export const fmtInt = (n: number | null | undefined) => (n == null ? "—" : nf.format(n));
export const fmtPrice = (tenths: number) => `£${(tenths / 10).toFixed(1)}m`;
export function fmtSigned(n: number, digits = 0): string {
  const abs = digits ? Math.abs(n).toFixed(digits) : nf.format(Math.abs(n));
  if (n > 0) return `+${abs}`;
  if (n < 0) return `−${abs}`;
  return abs;
}
export function fmtSignedPrice(tenths: number): string {
  if (tenths === 0) return "£0.0m";
  return `${tenths > 0 ? "+" : "−"}£${(Math.abs(tenths) / 10).toFixed(1)}m`;
}

/* ---------- fixtures ---------- */

export interface Opponent {
  team: number;
  home: boolean;
  fdr: number;
}

export interface TeamRun {
  team: number;
  /** One entry per gameweek in the window; empty array means a blank. */
  weeks: { event: number; opps: Opponent[] }[];
  rating: number;
}

/**
 * A gameweek's difficulty for one club: a blank counts as 5, a single fixture
 * is its FDR, a double is the mean FDR made one point easier for the extra game.
 */
export function weekDifficulty(opps: Opponent[]): number {
  if (opps.length === 0) return 5;
  const mean = opps.reduce((s, o) => s + o.fdr, 0) / opps.length;
  return opps.length > 1 ? Math.max(1, mean - (opps.length - 1)) : mean;
}

export function buildRuns(teams: Team[], fixtures: Fixture[], fromEvent: number, horizon: number): TeamRun[] {
  const events = Array.from({ length: horizon }, (_, i) => fromEvent + i);
  return teams.map((t) => {
    const weeks = events.map((ev) => ({
      event: ev,
      opps: fixtures
        .filter((f) => f.event === ev && (f.home === t.id || f.away === t.id))
        .sort((a, b) => (a.kickoff ?? "").localeCompare(b.kickoff ?? ""))
        .map((f) =>
          f.home === t.id
            ? { team: f.away, home: true, fdr: f.homeFdr }
            : { team: f.home, home: false, fdr: f.awayFdr },
        ),
    }));
    const rating = weeks.reduce((s, w) => s + weekDifficulty(w.opps), 0) / Math.max(1, weeks.length);
    return { team: t.id, weeks, rating };
  });
}

/* ---------- transfers ---------- */

/**
 * Free transfers available for the gameweek after the last one in history.
 * One is added after every gameweek (capped at five); wildcard and free hit
 * weeks keep the banked count unchanged.
 */
export function freeTransfersAfter(history: EventHistory[], chips: Chip[]): number {
  if (history.length === 0) return 1;
  const chipWeeks = new Set(chips.filter((c) => c.name === "wildcard" || c.name === "freehit").map((c) => c.event));
  let ft = 1;
  for (const h of history.slice(1)) {
    if (!chipWeeks.has(h.event)) ft = Math.max(0, ft - h.transfers);
    ft = Math.min(MAX_FREE_TRANSFERS, ft + 1);
  }
  return ft;
}

export function statusLabel(p: Player): string | null {
  if (p.status === "a") return null;
  if (p.news) return p.news;
  return { d: "Doubtful", i: "Injured", s: "Suspended", u: "Unavailable", n: "Not in squad" }[p.status] ?? null;
}
