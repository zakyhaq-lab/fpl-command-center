import { Suspense } from "react";
import { FdrCell } from "@/components/Fdr";
import { Mark } from "@/components/icons";
import { LocalTime } from "@/components/LocalTime";
import { TeamIdForm } from "@/components/TeamIdForm";
import { getBootstrap, getFixtures } from "@/lib/fpl/api";
import { buildRuns, fmtInt } from "@/lib/fpl/derive";

export default function Home() {
  return (
    <main className="mx-auto grid min-h-screen max-w-[1152px] grid-cols-1 content-center items-start gap-6 px-4 py-10 sm:px-8 lg:grid-cols-[1fr_384px]">
      <section className="card p-6 sm:p-10">
        <div className="mb-10 flex items-center gap-3">
          <Mark />
          <span className="text-[15px] font-semibold">FPL Command Center</span>
        </div>
        <h1 className="text-[26px] leading-tight font-semibold tracking-[-0.01em]">Open any Fantasy Premier League team</h1>
        <p className="mt-2 mb-8 max-w-[52ch] text-[15px] text-soft">
          Live gameweek points and rank, five weeks of fixture difficulty, and a planner that prices every transfer
          against your bank and free transfers.
        </p>
        <TeamIdForm />
      </section>

      <Suspense fallback={<aside className="card min-h-[320px] p-6 text-muted">Loading gameweek…</aside>}>
        <GameweekPanel />
      </Suspense>
    </main>
  );
}

async function GameweekPanel() {
  const [boot, fixtures] = await Promise.all([getBootstrap(), getFixtures()]);
  const current = boot.events.find((e) => e.id === boot.currentEvent)!;
  const next = boot.nextEvent ? boot.events.find((e) => e.id === boot.nextEvent) : null;
  const teams = new Map(boot.teams.map((t) => [t.id, t]));
  const from = boot.nextEvent ?? boot.currentEvent;
  const easiest = buildRuns(boot.teams, fixtures, from, 5)
    .sort((a, b) => a.rating - b.rating)
    .slice(0, 5);

  return (
    <aside className="card p-6">
      <h2 className="text-[16px] font-semibold">{current.name}</h2>
      <p className="mt-0.5 text-[12px] text-muted">{current.finished ? "Finished" : "In progress"}</p>
      <dl className="mt-5 grid grid-cols-2 gap-y-4">
        <div>
          <dt className="text-[12px] text-muted">Average score</dt>
          <dd className="text-[20px]">{current.average} pts</dd>
        </div>
        <div>
          <dt className="text-[12px] text-muted">Highest score</dt>
          <dd className="text-[20px]">{current.highest} pts</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-[12px] text-muted">Managers</dt>
          <dd className="text-[20px]">{fmtInt(boot.totalManagers)}</dd>
        </div>
        {next && (
          <div className="col-span-2">
            <dt className="text-[12px] text-muted">{next.name} deadline</dt>
            <dd className="text-[14px]">
              <LocalTime iso={next.deadline} countdown />
            </dd>
          </div>
        )}
      </dl>

      <h3 className="mt-7 mb-2 text-[13px] font-medium text-soft">
        Easiest runs, GW{from}–{from + 4}
      </h3>
      <ul>
        {easiest.map((r) => (
          <li key={r.team} className="grid grid-cols-[44px_1fr] items-center gap-2 py-1">
            <span className="text-[12px] font-semibold">{teams.get(r.team)?.short}</span>
            <div className="grid grid-cols-5 gap-px">
              {r.weeks.map((w) => (
                <FdrCell key={w.event} opps={w.opps} teams={teams} compact />
              ))}
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
