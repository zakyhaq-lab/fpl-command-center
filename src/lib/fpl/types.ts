// Shapes the app works with. Raw FPL responses are trimmed to these in api.ts
// so cached entries and client payloads stay small.

export type Position = 1 | 2 | 3 | 4;

export interface Team {
  id: number;
  code: number;
  name: string;
  short: string;
}

export interface Player {
  id: number;
  name: string;
  fullName: string;
  team: number;
  position: Position;
  cost: number; // tenths of £m
  totalPoints: number;
  eventPoints: number;
  form: number;
  epNext: number;
  selectedBy: number;
  status: string; // a, d, i, s, u, n
  chance: number | null;
  news: string;
  minutes: number;
}

export interface GameEvent {
  id: number;
  name: string;
  deadline: string;
  average: number;
  highest: number;
  finished: boolean;
  isCurrent: boolean;
  isNext: boolean;
}

export interface Fixture {
  id: number;
  event: number | null;
  kickoff: string | null;
  home: number;
  away: number;
  homeFdr: number;
  awayFdr: number;
  homeScore: number | null;
  awayScore: number | null;
  started: boolean;
  finished: boolean;
  minutes: number;
}

export interface Bootstrap {
  teams: Team[];
  players: Player[];
  events: GameEvent[];
  currentEvent: number;
  nextEvent: number | null;
  totalManagers: number;
  squadTeamLimit: number;
}

export interface Pick {
  element: number;
  position: number; // 1-11 starting, 12-15 bench
  multiplier: number;
  isCaptain: boolean;
  isVice: boolean;
}

export interface EventHistory {
  event: number;
  points: number;
  totalPoints: number;
  rank: number | null;
  overallRank: number | null;
  bank: number;
  value: number;
  transfers: number;
  transfersCost: number;
  benchPoints: number;
}

export interface Chip {
  name: string;
  event: number;
}

export interface Entry {
  id: number;
  name: string;
  manager: string;
  region: string;
  overallPoints: number;
  overallRank: number | null;
  eventPoints: number;
  eventRank: number | null;
  currentEvent: number;
  bank: number;
  value: number;
}

export interface LiveStat {
  points: number;
  minutes: number;
  bonus: number;
  bps: number;
  played: boolean;
}

export interface EntryPicks {
  event: number;
  activeChip: string | null;
  picks: Pick[];
  history: EventHistory;
  autoSubs: { in: number; out: number }[];
}
