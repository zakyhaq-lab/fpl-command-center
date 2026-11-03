# FPL Command Center

Live gameweek points and rank, a multi-gameweek fixture ticker and a multi-transfer planner for any Fantasy Premier League team.

Built with Next.js 16 (App Router, Cache Components), TypeScript and Tailwind CSS v4. The previous single-file Python version lives in [`legacy/`](legacy/).

## Screens

| Route | What it does |
| --- | --- |
| `/` | Enter a team ID (or paste a Points page link). Shows the current gameweek and the five easiest fixture runs. |
| `/team/[id]` | Live gameweek points, overall and gameweek rank, squad value, the squad on a pitch with live player points, rank by gameweek and recent gameweek history. |
| `/team/[id]/fixtures` | Fixture difficulty for every club over 3, 5 or 8 gameweeks, sortable, filterable to your clubs. |
| `/team/[id]/planner` | Plan several transfers for the next gameweek: bank after, free transfers (from your history, editable), points hit, FPL's expected points change, club limit and budget checks. Plans are saved in the browser per team and gameweek. |

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## How data is fetched

All FPL requests go through `src/lib/fpl/api.ts` on the server, trimmed to the fields the app uses and cached with `"use cache"`:

| Source | Revalidate |
| --- | --- |
| `bootstrap-static` (players, clubs, gameweeks) | 5 min |
| `fixtures` | 2 min |
| `event/{gw}/live` | 1 min |
| `entry/{id}`, history, picks | 2 min |

## Known limits

- Sale prices in the planner use the current price; FPL keeps half of any price rise, so the real bank can be slightly lower.
- Free transfers are derived from public transfer history (one per gameweek, max five, kept through Wildcard and Free Hit). Adjust with the stepper if it differs.
- Transfers made for the upcoming gameweek are private until its deadline, so they are not reflected.
