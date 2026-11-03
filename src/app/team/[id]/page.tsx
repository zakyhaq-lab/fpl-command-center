import Link from "next/link";
import { Suspense } from "react";
import { Pitch, type PitchPlayer } from "@/components/Pitch";
import { RankChart } from "@/components/RankChart";
import { ScreenSkeleton } from "@/components/ScreenSkeleton";
import { RememberTeam } from "@/components/RememberTeam";
import { TitleRow } from "@/components/TitleRow";
import { fmtInt, fmtPrice, fmtSigned } from "@/lib/fpl/derive";
import { loadTeam, parseIdParam } from "@/lib/fpl/team";

const CHIP_NAMES: Record<string, string> = {
  wildcard: "Wildcard",
  freehit: "Free Hit",
  bboost: "Bench Boost",
  "3xc": "Triple Captain",
  manager: "Assistant Manager",
};

export default function TeamPage({ params }: PageProps<"/team/[id]">) {
  return (
    <Suspense fallback={<ScreenSkeleton />}>
      <Overview params={params} />
    </Suspense>
  );
}

async function Overview({ params }: { params: PageProps<"/team/[id]">["params"] }) {
  const id = parseIdParam((await params).id);
  const { boot, entry, fixtures, history, picks, live, event } = await loadTeam(id);

  const teams = new Map(boot.teams.map((t) => [t.id, t]));
  const players = new Map(boot.players.map((p) => [p.id, p]));
  const gw = boot.events.find((e) => e.id === event)!;
  const gwFixtures = fixtures.filter((f) => f.event === event);

  const squad: PitchPlayer[] = picks.picks.map((pick) => {
    const player = players.get(pick.element)!;
    return {
      pick,
      player,
      team: teams.get(player.team)!,
      live: live[pick.element],
      fixtures: gwFixtures.filter((f) => f.home === player.team || f.away === player.team),
    };
  });
  const starters = squad.filter((p) => p.pick.position <= 11);
  const bench = squad.filter((p) => p.pick.position > 11);

  // FPL's own gameweek score (it includes automatic substitutions); hits are deducted on top.
  const gross = picks.history.points;
  const hit = picks.history.transfersCost;
  const net = gross - hit;
  const benchPoints = bench.filter((p) => p.pick.multiplier === 0).reduce((s, p) => s + (p.live?.points ?? 0), 0);
  const vsAverage = net - gw.average;
  const toPlay = starters.filter((p) => p.fixtures.some((f) => !f.finished)).length;

  const prev = history.events.find((h) => h.event === event - 1);
  const overall = picks.history.overallRank ?? entry.overallRank;
  const rankMove = prev?.overallRank && overall ? prev.overallRank - overall : null;
  const totalPoints = picks.history.totalPoints;
  const chip = picks.activeChip ? CHIP_NAMES[picks.activeChip] ?? picks.activeChip : null;

  const finding = [
    `${net} pts${hit ? ` after a −${hit} hit` : ""}`,
    vsAverage === 0 ? "level with the average" : `${Math.abs(vsAverage)} ${vsAverage > 0 ? "above" : "below"} the ${gw.average} average`,
    toPlay > 0 ? `${toPlay} starter${toPlay === 1 ? "" : "s"} still to play` : `${benchPoints} left on the bench`,
  ].join(", ");

  const recent = history.events.slice(-6).reverse();

  return (
    <>
      <RememberTeam id={entry.id} name={entry.name} />
      <TitleRow
        title={entry.name}
        sub={`${entry.manager}${entry.region ? ` · ${entry.region}` : ""} · ${gw.name}${chip ? ` · ${chip} active` : ""}`}
        action={
          <Link
            href={`/team/${id}/planner`}
            className="inline-flex h-[34px] items-center rounded-full bg-text px-4 text-[13px] font-semibold text-ground transition-opacity hover:opacity-90 active:opacity-75"
          >
            Plan transfers
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_384px]">
        <div className="flex min-w-0 flex-col gap-4">
          <section aria-labelledby="gw-heading" className="card">
            <div className="px-5 pt-4">
              <h2 id="gw-heading" className="text-[16px] font-semibold">
                {gw.name}, live
              </h2>
              <p className="mt-0.5 text-[13px] text-soft">{finding}.</p>
            </div>
            <dl className="mt-3 grid grid-cols-2 border-t border-rule sm:grid-cols-4">
              <Kpi label="Gameweek points" value={`${net}`} unit="pts" caption={hit ? `${gross} before the −${hit} hit` : `Average ${gw.average}, top ${gw.highest}`} />
              <Kpi
                label="Overall rank"
                value={fmtInt(overall)}
                caption={
                  rankMove == null ? "First ranked week" : `${fmtSigned(rankMove)} places since GW${event - 1}`
                }
                tone={rankMove == null || rankMove === 0 ? undefined : rankMove > 0 ? "positive" : "negative"}
              />
              <Kpi label="Total points" value={fmtInt(totalPoints)} unit="pts" caption={`Gameweek rank ${fmtInt(picks.history.rank ?? entry.eventRank)}`} />
              <Kpi
                label="Squad value"
                value={fmtPrice(picks.history.value)}
                caption={`${fmtPrice(picks.history.bank)} in the bank`}
              />
            </dl>
          </section>

          <section aria-labelledby="pitch-heading" className="card p-3 sm:p-5">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 px-1">
              <h2 id="pitch-heading" className="text-[16px] font-semibold">
                Squad
              </h2>
              <p className="text-[12px] text-muted">Player points update every minute; captain shown doubled</p>
            </div>
            <Pitch starters={starters} bench={bench} teams={teams} />
          </section>
        </div>

        <div className="flex flex-col">
          <h2 className="mb-2 text-[16px] font-semibold">Overall rank</h2>
          <section className="card mb-4 px-4 pt-4 pb-3">
            <RankChart history={history.events} />
          </section>

          <h2 className="mb-2 text-[16px] font-semibold">Gameweeks</h2>
          <section className="card px-4 py-2">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-[12px] text-muted">
                  <th className="py-2 text-left font-normal">GW</th>
                  <th className="py-2 text-right font-normal">Pts</th>
                  <th className="py-2 text-right font-normal">Bench</th>
                  <th className="py-2 text-right font-normal">Transfers</th>
                  <th className="py-2 text-right font-normal">Rank</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((h) => {
                  const chipUsed = history.chips.find((c) => c.event === h.event);
                  return (
                    <tr key={h.event} className="border-t border-rule">
                      <td className="py-2.5">
                        {h.event}
                        {chipUsed && <span className="ml-1.5 text-[12px] text-muted">{CHIP_NAMES[chipUsed.name] ?? chipUsed.name}</span>}
                      </td>
                      <td className="py-2.5 text-right font-semibold">{h.points - h.transfersCost}</td>
                      <td className="py-2.5 text-right text-soft">{h.benchPoints}</td>
                      <td className="py-2.5 text-right text-soft">
                        {h.transfers}
                        {h.transfersCost > 0 && <span className="text-negative"> −{h.transfersCost}</span>}
                      </td>
                      <td className="py-2.5 text-right">{fmtInt(h.overallRank)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
          <Link
            href={`/team/${id}/fixtures`}
            className="mt-4 inline-flex h-[30px] items-center justify-center rounded-full border border-control text-[12px] text-soft transition-colors hover:border-accent hover:text-text"
          >
            See the next five gameweeks
          </Link>
        </div>
      </div>
    </>
  );
}

function Kpi({
  label,
  value,
  unit,
  caption,
  tone,
}: {
  label: string;
  value: string;
  unit?: string;
  caption: string;
  tone?: "positive" | "negative";
}) {
  return (
    <div className="border-rule px-5 py-4 [&:not(:first-child)]:border-l max-sm:[&:nth-child(3)]:border-l-0 max-sm:[&:nth-child(n+3)]:border-t">
      <dt className="text-[12px] text-muted">{label}</dt>
      <dd className="mt-1 text-[24px] leading-none font-medium">
        {value}
        {unit && <span className="ml-1 text-[13px] text-muted">{unit}</span>}
      </dd>
      <dd className={`mt-1.5 text-[12px] ${tone === "positive" ? "text-positive" : tone === "negative" ? "text-negative" : "text-muted"}`}>
        {caption}
      </dd>
    </div>
  );
}
