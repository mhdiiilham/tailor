import { Skeleton } from "@/components/ui";

// Placeholders with the same shape as the real strip and table, so nothing jumps
// when the applications arrive.

export function StatusStripSkeleton() {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-card border border-line bg-raised px-5 py-3.5">
      {["w-56", "w-28", "w-24", "w-28", "w-20"].map((width, i) => (
        <Skeleton key={i} className={`h-3.5 ${width}`} />
      ))}
    </div>
  );
}

export function ApplicationsTableSkeleton() {
  return (
    <section className="grid gap-4" aria-busy="true" aria-label="Loading applications">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {["w-14", "w-24", "w-20", "w-28", "w-16", "w-20"].map((width, i) => (
            <Skeleton key={i} className={`h-8 ${width}`} />
          ))}
        </div>
        <Skeleton className="h-10 w-full sm:w-72" />
      </div>

      <div className="overflow-hidden rounded-card border border-line bg-raised">
        <div className="hidden border-b border-line bg-sunken px-6 py-3 lg:block">
          <Skeleton className="h-3 w-40" />
        </div>
        <ul className="divide-y divide-line">
          {[0, 1, 2].map((i) => (
            <li
              key={i}
              className="grid gap-3 px-4 py-4 md:px-6 lg:grid-cols-[minmax(0,1fr)_110px_160px_120px_250px] lg:items-center lg:gap-4"
            >
              <div className="grid gap-2">
                <Skeleton className="h-4 w-2/3 max-w-72" />
                <Skeleton className="h-3 w-1/2 max-w-56" />
              </div>
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-3 w-20" />
              <div className="flex gap-1.5 lg:justify-end">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
