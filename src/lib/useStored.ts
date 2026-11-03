"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/** Reads a localStorage string after hydration; undefined on the server and in the first client render. */
export function useStoredString(key: string): string | null | undefined {
  return useSyncExternalStore(
    noopSubscribe,
    () => {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    () => undefined,
  );
}

const minuteSubscribe = (cb: () => void) => {
  const t = setInterval(cb, 30_000);
  return () => clearInterval(t);
};

/** The current time rounded to the minute, or null before hydration. */
export function useMinute(): number | null {
  return useSyncExternalStore(
    minuteSubscribe,
    () => Math.floor(Date.now() / 60_000) * 60_000,
    () => null,
  );
}
