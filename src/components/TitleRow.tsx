import type { ReactNode } from "react";

export function TitleRow({ title, sub, action }: { title: string; sub: ReactNode; action?: ReactNode }) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        <h1 className="truncate text-[26px] leading-tight font-semibold tracking-[-0.01em]">{title}</h1>
        <p className="mt-0.5 text-[14px] text-muted">{sub}</p>
      </div>
      {action}
    </header>
  );
}
