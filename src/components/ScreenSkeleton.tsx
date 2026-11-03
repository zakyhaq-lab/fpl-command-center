export function ScreenSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading team">
      <div className="mb-6 h-[58px] w-72 rounded-[6px] bg-surface" />
      <div className="grid gap-6 lg:grid-cols-[1fr_384px]">
        <div className="card h-[620px]" />
        <div className="card h-[620px]" />
      </div>
    </div>
  );
}
