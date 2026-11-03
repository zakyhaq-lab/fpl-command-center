import { Suspense } from "react";
import { LocalTime } from "@/components/LocalTime";
import { Planner } from "@/components/Planner";
import { ScreenSkeleton } from "@/components/ScreenSkeleton";
import { TitleRow } from "@/components/TitleRow";
import { buildRuns, freeTransfersAfter, type Opponent } from "@/lib/fpl/derive";
import { loadTeam, parseIdParam } from "@/lib/fpl/team";

export default function PlannerPage({ params }: PageProps<"/team/[id]/planner">) {
  return (
    <Suspense fallback={<ScreenSkeleton />}>
      <PlannerScreen params={params} />
    </Suspense>
  );
}

async function PlannerScreen({ params }: { params: PageProps<"/team/[id]/planner">["params"] }) {
  const id = parseIdParam((await params).id);
  const { boot, entry, fixtures, history, picks } = await loadTeam(id);
  const target = boot.nextEvent ?? boot.currentEvent;
  const deadline = boot.events.find((e) => e.id === target)?.deadline;
  const lastEvent = boot.events[boot.events.length - 1]?.id ?? 38;

  const runs: Record<number, Opponent[][]> = {};
  for (const r of buildRuns(boot.teams, fixtures, target, Math.min(5, lastEvent - target + 1))) {
    runs[r.team] = r.weeks.map((w) => w.opps);
  }

  return (
    <>
      <TitleRow
        title="Transfer planner"
        sub={
          <>
            {entry.name} · GW{target} deadline {deadline ? <LocalTime iso={deadline} countdown /> : "to be set"}
          </>
        }
      />
      <Planner
        teamId={id}
        event={target}
        squad={[...picks.picks].sort((a, b) => a.position - b.position).map((p) => p.element)}
        bank={picks.history.bank}
        defaultFreeTransfers={freeTransfersAfter(history.events, history.chips)}
        players={boot.players}
        teams={boot.teams}
        runs={runs}
        squadTeamLimit={boot.squadTeamLimit}
      />
    </>
  );
}
