import { Suspense } from "react";
import { FixtureTicker } from "@/components/FixtureTicker";
import { ScreenSkeleton } from "@/components/ScreenSkeleton";
import { TitleRow } from "@/components/TitleRow";
import { buildRuns } from "@/lib/fpl/derive";
import { loadTeam, parseIdParam } from "@/lib/fpl/team";

export default function FixturesPage({ params }: PageProps<"/team/[id]/fixtures">) {
  return (
    <Suspense fallback={<ScreenSkeleton />}>
      <Fixtures params={params} />
    </Suspense>
  );
}

async function Fixtures({ params }: { params: PageProps<"/team/[id]/fixtures">["params"] }) {
  const id = parseIdParam((await params).id);
  const { boot, entry, fixtures, picks } = await loadTeam(id);
  const from = boot.nextEvent ?? boot.currentEvent;
  const lastEvent = boot.events[boot.events.length - 1]?.id ?? 38;
  const runs = buildRuns(boot.teams, fixtures, from, Math.min(8, lastEvent - from + 1));

  const players = new Map(boot.players.map((p) => [p.id, p]));
  const owned: Record<number, string[]> = {};
  for (const pick of picks.picks) {
    const p = players.get(pick.element);
    if (p) (owned[p.team] ??= []).push(p.name);
  }

  const five = buildRuns(boot.teams, fixtures, from, Math.min(5, lastEvent - from + 1));
  const best = five.sort((a, b) => a.rating - b.rating)[0];
  const bestTeam = boot.teams.find((t) => t.id === best?.team);

  return (
    <>
      <TitleRow
        title="Fixture ticker"
        sub={`${entry.name} · from GW${from}${bestTeam ? ` · ${bestTeam.name} have the easiest next five` : ""}`}
      />
      <FixtureTicker teams={boot.teams} runs={runs} owned={owned} />
    </>
  );
}
