"use client";

// In production Next replaces server error messages with a generic one, so only
// the digest (which matches the server log) is worth showing.
export default function TeamError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="card mx-auto mt-16 max-w-[520px] p-8">
      <h1 className="text-[20px] font-semibold">The FPL API didn&apos;t answer</h1>
      <p className="mt-2 text-[14px] text-soft">
        This happens while FPL updates between gameweeks. Wait a minute and try again.
      </p>
      {error.digest && <p className="mt-3 text-[12px] text-muted">Error reference {error.digest}</p>}
      <button
        onClick={reset}
        className="mt-6 rounded-full bg-text px-5 py-2 text-[14px] font-semibold text-ground hover:opacity-90"
      >
        Try again
      </button>
    </div>
  );
}
