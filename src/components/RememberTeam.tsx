"use client";

import { useEffect } from "react";
import { rememberTeam } from "./TeamIdForm";

/** Adds the open team to the home screen's "Recently opened" list. */
export function RememberTeam({ id, name }: { id: number; name: string }) {
  useEffect(() => rememberTeam({ id, name }), [id, name]);
  return null;
}
