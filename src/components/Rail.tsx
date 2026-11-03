"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { ExitIcon, GridIcon, Mark, PitchIcon, SwapIcon } from "./icons";

const NAV = [
  { href: "", label: "Team", Icon: PitchIcon },
  { href: "/fixtures", label: "Fixtures", Icon: GridIcon },
  { href: "/planner", label: "Planner", Icon: SwapIcon },
];

/** Icon rail on desktop, labelled bottom bar on a phone. */
export function Rail() {
  const { id } = useParams<{ id: string }>();
  const pathname = usePathname();
  const base = `/team/${id}`;

  const items = NAV.map(({ href, label, Icon }) => {
    const to = base + href;
    const active = pathname === to;
    return { to, label, Icon, active };
  });

  return (
    <>
      <nav
        aria-label="Main"
        className="fixed inset-y-0 left-0 z-20 hidden w-[56px] flex-col items-center border-r border-border bg-ground py-4 md:flex"
      >
        <Link href="/" aria-label="FPL Command Center home" className="mb-6">
          <Mark />
        </Link>
        <ul className="flex flex-col items-center gap-1">
          {items.map(({ to, label, Icon, active }) => (
            <li key={to}>
              <Link
                href={to}
                aria-label={label}
                title={label}
                aria-current={active ? "page" : undefined}
                className={`group relative flex h-10 w-[56px] items-center justify-center transition-colors ${active ? "text-text" : "text-muted hover:text-text"}`}
              >
                {active && <span className="absolute inset-y-2 right-0 w-px bg-accent" aria-hidden />}
                <Icon />
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href="/"
          aria-label="Open another team"
          title="Open another team"
          className="mt-auto flex h-10 w-[56px] items-center justify-center text-muted transition-colors hover:text-text"
        >
          <ExitIcon />
        </Link>
      </nav>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-border bg-ground pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {items.map(({ to, label, Icon, active }) => (
          <Link
            key={to}
            href={to}
            aria-current={active ? "page" : undefined}
            className={`relative flex flex-col items-center gap-0.5 py-2 text-[11px] ${active ? "text-text" : "text-muted"}`}
          >
            {active && <span className="absolute inset-x-6 top-0 h-px bg-accent" aria-hidden />}
            <Icon />
            {label}
          </Link>
        ))}
        <Link href="/" className="flex flex-col items-center gap-0.5 py-2 text-[11px] text-muted">
          <ExitIcon />
          Switch
        </Link>
      </nav>
    </>
  );
}
