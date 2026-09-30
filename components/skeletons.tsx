/** Grey placeholder shapes shown while real content is loading. */

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div role="status" aria-label="Loading resources">
      <div className="skeleton mb-3 h-5 w-40" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: count }, (_, index) => (
          <div key={index} className="card space-y-3 p-4">
            <div className="skeleton h-6 w-24 rounded-full" />
            <div className="skeleton h-5 w-4/5" />
            <div className="skeleton h-4 w-1/3" />
            <div className="flex gap-2">
              <div className="skeleton h-5 w-20 rounded-full" />
              <div className="skeleton h-5 w-14 rounded-full" />
            </div>
            <div className="flex items-center justify-between pt-2">
              <div className="skeleton h-9 w-28" />
              <div className="skeleton h-9 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LibraryPageSkeleton({ withStats = false }: { withStats?: boolean }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="skeleton h-8 w-44" />
        <div className="skeleton h-10 w-36" />
      </div>
      {withStats ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="skeleton h-20 rounded-2xl" />
          ))}
        </div>
      ) : null}
      <div className="skeleton h-28 rounded-2xl" />
      <CardGridSkeleton />
    </div>
  );
}

export function ListPageSkeleton() {
  return (
    <div className="space-y-5" role="status" aria-label="Loading">
      <div className="skeleton h-8 w-44" />
      <div className="skeleton h-16 rounded-2xl" />
      <div className="space-y-2">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="skeleton h-14 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
