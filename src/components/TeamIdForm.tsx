"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useStoredString } from "@/lib/useStored";

const RECENT_KEY = "fpl-cc:recent-teams";

export interface RecentTeam {
  id: number;
  name: string;
}

/** Accepts a bare ID or any FPL URL containing /entry/<id>/. */
export function parseTeamId(input: string): number | null {
  const s = input.trim();
  const fromUrl = s.match(/entry\/(\d+)/);
  const digits = fromUrl ? fromUrl[1] : /^\d+$/.test(s) ? s : null;
  if (!digits) return null;
  const n = Number(digits);
  return n > 0 && n < 100_000_000 ? n : null;
}

function parseRecent(raw: string | null | undefined): RecentTeam[] {
  try {
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function readRecent(): RecentTeam[] {
  try {
    return parseRecent(localStorage.getItem(RECENT_KEY));
  } catch {
    return [];
  }
}

export function rememberTeam(team: RecentTeam) {
  try {
    const next = [team, ...readRecent().filter((t) => t.id !== team.id)].slice(0, 5);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable: nothing to remember */
  }
}

export function TeamIdForm() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const stored = useStoredString(RECENT_KEY);
  const recent = useMemo(() => parseRecent(stored), [stored]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const id = parseTeamId(value);
    if (!id) {
      setError("That isn't a team ID. Paste the number, or the whole link from your Points page.");
      return;
    }
    setError(null);
    setPending(true);
    router.push(`/team/${id}`);
  }

  return (
    <div>
      <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex-1">
          <label htmlFor="team-id" className="mb-1.5 block text-[13px] font-medium text-soft">
            Team ID or Points page link
          </label>
          <input
            id="team-id"
            inputMode="text"
            autoComplete="off"
            spellCheck={false}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="2805703"
            aria-describedby="team-id-help"
            aria-invalid={error ? true : undefined}
            className="h-11 w-full rounded-[6px] border border-control bg-ground px-3 text-[16px] text-text placeholder:text-muted focus:border-accent focus:outline-none"
          />
          <p id="team-id-help" className={`mt-1.5 text-[12px] ${error ? "text-negative" : "text-muted"}`}>
            {error ??
              "On fantasy.premierleague.com open Points; the number after /entry/ in the address is your ID."}
          </p>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="h-11 shrink-0 rounded-full bg-text px-6 text-[14px] font-semibold text-ground transition-opacity hover:opacity-90 active:opacity-75 disabled:opacity-60 sm:mt-[26px]"
        >
          {pending ? "Loading team…" : "Open team"}
        </button>
      </form>

      {recent.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-2 text-[13px] font-medium text-muted">Recently opened</h2>
          <ul>
            {recent.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => router.push(`/team/${t.id}`)}
                  className="flex w-full items-center justify-between border-t border-rule py-2.5 text-left text-[14px] transition-colors hover:text-accent"
                >
                  <span className="font-medium">{t.name}</span>
                  <span className="text-muted">{t.id}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
