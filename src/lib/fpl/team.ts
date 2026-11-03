import "server-only";
import { notFound } from "next/navigation";
import { getBootstrap, getEntry, getEntryHistory, getEntryPicks, getFixtures, getLive } from "./api";

export function parseIdParam(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) notFound();
  return id;
}

/** Everything the team screens need, fetched in parallel from cached sources. */
export async function loadTeam(id: number) {
  const [boot, entry, fixtures] = await Promise.all([getBootstrap(), getEntry(id), getFixtures()]);
  if (!entry) notFound();
  const event = Math.min(entry.currentEvent, boot.currentEvent);
  const [history, picks, live] = await Promise.all([getEntryHistory(id), getEntryPicks(id, event), getLive(event)]);
  return { boot, entry, fixtures, history, picks, live, event };
}

export type TeamData = Awaited<ReturnType<typeof loadTeam>>;
