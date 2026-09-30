import Link from "next/link";
import { STATUSES, STATUS_LABELS, type ResourceStatus } from "@/lib/constants";
import type { StatusCounts } from "@/types";

const DOT: Record<ResourceStatus, string> = {
  to_study: "bg-amber-500",
  in_progress: "bg-sky-500",
  completed: "bg-emerald-500",
};

/** The four number tiles at the top of the dashboard. Click one to filter. */
export function StatusTiles({
  counts,
  activeStatus,
}: {
  counts: StatusCounts;
  activeStatus: ResourceStatus | "";
}) {
  const tile =
    "card block px-4 py-3 transition-colors hover:border-indigo-400 dark:hover:border-indigo-500";
  const active = "border-indigo-500 ring-1 ring-indigo-500 dark:border-indigo-400 dark:ring-indigo-400";

  return (
    <section aria-label="Study progress" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Link href="/dashboard" className={tile}>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">All resources</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">{counts.total}</p>
      </Link>
      {STATUSES.map((status) => (
        <Link
          key={status}
          href={`/dashboard?status=${status}`}
          className={`${tile} ${activeStatus === status ? active : ""}`}
          aria-current={activeStatus === status ? "true" : undefined}
        >
          <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span className={`size-2 rounded-full ${DOT[status]}`} aria-hidden="true" />
            {STATUS_LABELS[status]}
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{counts[status]}</p>
        </Link>
      ))}
    </section>
  );
}
