import "server-only";
import { cacheLife } from "next/cache";
import type {
  Bootstrap,
  Chip,
  Entry,
  EntryPicks,
  EventHistory,
  Fixture,
  LiveStat,
  Position,
} from "./types";

/**
 * FPL blocks Vercel's serverless functions with 403 but lets Vercel's edge
 * through, so on Vercel requests go to this app's own /fpl rewrite (see
 * next.config.ts) on the production domain; previews are behind Vercel
 * Authentication and can't be fetched. FPL_API_BASE overrides both.
 */
const BASE_URL =
  process.env.FPL_API_BASE ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}/fpl`
    : "https://fantasy.premierleague.com/api");
// The rewrite adds FPL's trailing slash itself; sending one would cost a redirect.
const PROXIED = !BASE_URL.startsWith("https://fantasy.premierleague.com");
// The FPL API answers 403 to requests that don't look like a browser, which
// happens from cloud hosts such as Vercel. Send full browser headers and, on a
// 403, retry with the next user agent.
const HEADERS = {
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
  Referer: "https://fantasy.premierleague.com/",
  Origin: "https://fantasy.premierleague.com",
  "Sec-Ch-Ua": '"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Ch-Ua-Platform": '"macOS"',
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-origin",
};
const USER_AGENTS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1",
];

class FplNotFound extends Error {}
class FplHttpError extends Error {}

async function fetchJson<T>(path: string): Promise<T> {
  let lastError: unknown;
  for (const ua of USER_AGENTS) {
    try {
      const res = await fetch(`${BASE_URL}${PROXIED ? path.replace(/\/$/, "") : path}`, {
        headers: { ...HEADERS, "User-Agent": ua },
        signal: AbortSignal.timeout(12_000),
      });
      if (res.status === 404) throw new FplNotFound(path);
      if (res.status === 403) {
        lastError = new Error(`FPL API 403 on ${path}`);
        continue;
      }
      if (!res.ok) throw new FplHttpError(`FPL API ${res.status} on ${path}`);
      return (await res.json()) as T;
    } catch (err) {
      // Only 403s and network failures are worth another user agent.
      if (err instanceof FplNotFound || err instanceof FplHttpError) throw err;
      lastError = err;
    }
  }
  throw lastError;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function getBootstrap(): Promise<Bootstrap> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 300, expire: 3600 });
  const raw = await fetchJson<any>("/bootstrap-static/");
  const events = raw.events.map((e: any) => ({
    id: e.id,
    name: e.name,
    deadline: e.deadline_time,
    average: e.average_entry_score,
    highest: e.highest_score ?? 0,
    finished: e.finished,
    isCurrent: e.is_current,
    isNext: e.is_next,
  }));
  const current = events.find((e: any) => e.isCurrent) ?? events[0];
  const next = events.find((e: any) => e.isNext);
  return {
    teams: raw.teams.map((t: any) => ({ id: t.id, code: t.code, name: t.name, short: t.short_name })),
    players: raw.elements
      .filter((e: any) => !e.removed)
      .map((e: any) => ({
        id: e.id,
        name: e.web_name,
        fullName: `${e.first_name} ${e.second_name}`,
        team: e.team,
        position: e.element_type as Position,
        cost: e.now_cost,
        totalPoints: e.total_points,
        eventPoints: e.event_points,
        form: Number(e.form) || 0,
        epNext: Number(e.ep_next) || 0,
        selectedBy: Number(e.selected_by_percent) || 0,
        status: e.status,
        chance: e.chance_of_playing_next_round,
        news: e.news ?? "",
        minutes: e.minutes,
      })),
    events,
    currentEvent: current.id,
    nextEvent: next ? next.id : null,
    totalManagers: raw.total_players,
    squadTeamLimit: raw.game_settings?.squad_team_limit ?? 3,
  };
}

export async function getFixtures(): Promise<Fixture[]> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 120, expire: 3600 });
  const raw = await fetchJson<any[]>("/fixtures/");
  return raw.map((f) => ({
    id: f.id,
    event: f.event,
    kickoff: f.kickoff_time,
    home: f.team_h,
    away: f.team_a,
    homeFdr: f.team_h_difficulty,
    awayFdr: f.team_a_difficulty,
    homeScore: f.team_h_score,
    awayScore: f.team_a_score,
    started: Boolean(f.started),
    finished: Boolean(f.finished_provisional ?? f.finished),
    minutes: f.minutes ?? 0,
  }));
}

export async function getLive(event: number): Promise<Record<number, LiveStat>> {
  "use cache";
  cacheLife({ stale: 30, revalidate: 60, expire: 600 });
  const raw = await fetchJson<any>(`/event/${event}/live/`);
  const out: Record<number, LiveStat> = {};
  for (const el of raw.elements) {
    out[el.id] = {
      points: el.stats.total_points,
      minutes: el.stats.minutes,
      bonus: el.stats.bonus,
      bps: el.stats.bps,
      played: el.stats.minutes > 0,
    };
  }
  return out;
}

/** Returns null when the entry does not exist. */
export async function getEntry(id: number): Promise<Entry | null> {
  "use cache";
  cacheLife({ stale: 30, revalidate: 120, expire: 3600 });
  try {
    const e = await fetchJson<any>(`/entry/${id}/`);
    return {
      id: e.id,
      name: e.name,
      manager: `${e.player_first_name} ${e.player_last_name}`.trim(),
      region: e.player_region_name ?? "",
      overallPoints: e.summary_overall_points ?? 0,
      overallRank: e.summary_overall_rank ?? null,
      eventPoints: e.summary_event_points ?? 0,
      eventRank: e.summary_event_rank ?? null,
      currentEvent: e.current_event ?? 1,
      bank: e.last_deadline_bank ?? 0,
      value: e.last_deadline_value ?? 1000,
    };
  } catch (err) {
    if (err instanceof FplNotFound) return null;
    throw err;
  }
}

function toHistory(h: any): EventHistory {
  return {
    event: h.event,
    points: h.points,
    totalPoints: h.total_points,
    rank: h.rank ?? null,
    overallRank: h.overall_rank ?? null,
    bank: h.bank,
    value: h.value,
    transfers: h.event_transfers,
    transfersCost: h.event_transfers_cost,
    benchPoints: h.points_on_bench,
  };
}

export async function getEntryHistory(id: number): Promise<{ events: EventHistory[]; chips: Chip[] }> {
  "use cache";
  cacheLife({ stale: 30, revalidate: 120, expire: 3600 });
  const raw = await fetchJson<any>(`/entry/${id}/history/`);
  return {
    events: raw.current.map(toHistory),
    chips: raw.chips.map((c: any) => ({ name: c.name, event: c.event })),
  };
}

export async function getEntryPicks(id: number, event: number): Promise<EntryPicks> {
  "use cache";
  cacheLife({ stale: 30, revalidate: 120, expire: 3600 });
  const raw = await fetchJson<any>(`/entry/${id}/event/${event}/picks/`);
  return {
    event,
    activeChip: raw.active_chip,
    picks: raw.picks.map((p: any) => ({
      element: p.element,
      position: p.position,
      multiplier: p.multiplier,
      isCaptain: p.is_captain,
      isVice: p.is_vice_captain,
    })),
    history: toHistory(raw.entry_history),
    autoSubs: (raw.automatic_subs ?? []).map((s: any) => ({ in: s.element_in, out: s.element_out })),
  };
}
