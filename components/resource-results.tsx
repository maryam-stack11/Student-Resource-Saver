import Link from "next/link";
import { PAGE_SIZE } from "@/lib/constants";
import { filtersToQuery, hasActiveFilters, type LibraryFilters } from "@/lib/filters";
import { getResources } from "@/lib/queries";
import { BookIcon, SearchIcon, StarIcon } from "@/components/icons";
import { ResourceCard } from "@/components/resource-card";
import { AddResourceButton } from "@/components/resource-dialog";

/** Loads and shows the list of resource cards for the current filters. */
export async function ResourceResults({
  filters,
  basePath,
  favoritesOnly = false,
}: {
  filters: LibraryFilters;
  basePath: string;
  favoritesOnly?: boolean;
}) {
  const { resources, total } = await getResources(filters, { favoritesOnly });

  if (resources.length === 0) {
    if (hasActiveFilters(filters)) {
      return (
        <EmptyState
          icon={<SearchIcon className="size-6" />}
          title="No resources match"
          text="Try a different search word, or remove some filters."
        >
          <Link href={basePath} className="btn btn-secondary">
            Clear filters
          </Link>
        </EmptyState>
      );
    }
    if (favoritesOnly) {
      return (
        <EmptyState
          icon={<StarIcon className="size-6" />}
          title="No favorites yet"
          text="Click the star on any resource to keep it here for quick access."
        >
          <Link href="/dashboard" className="btn btn-secondary">
            Go to my library
          </Link>
        </EmptyState>
      );
    }
    return (
      <EmptyState
        icon={<BookIcon className="size-6" />}
        title="Your library is empty"
        text="Save your first study resource: a YouTube video, a PDF, a GitHub repo, a course or any useful link."
      >
        <AddResourceButton label="Add your first resource" />
      </EmptyState>
    );
  }

  return (
    <section aria-label="Resources">
      <p className="mb-3 text-sm text-slate-500 dark:text-slate-400" aria-live="polite">
        Showing {resources.length} of {total} {total === 1 ? "resource" : "resources"}
      </p>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {resources.map((resource) => (
          <ResourceCard key={resource.id} resource={resource} basePath={basePath} />
        ))}
      </ul>
      {resources.length < total ? (
        <div className="mt-6 flex justify-center">
          <Link
            href={`${basePath}${filtersToQuery({ ...filters, show: filters.show + PAGE_SIZE })}`}
            scroll={false}
            className="btn btn-secondary"
          >
            Load more
          </Link>
        </div>
      ) : null}
    </section>
  );
}

function EmptyState({
  icon,
  title,
  text,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
        {icon}
      </div>
      <h2 className="mt-4 text-lg font-semibold">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-slate-600 dark:text-slate-300">{text}</p>
      <div className="mt-5">{children}</div>
    </div>
  );
}
