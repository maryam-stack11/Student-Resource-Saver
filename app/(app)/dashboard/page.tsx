import type { Metadata } from "next";
import { Suspense } from "react";
import { parseFilters, type RawSearchParams } from "@/lib/filters";
import { getCategories, getStatusCounts, getTags } from "@/lib/queries";
import { AddResourceButton, ResourceDialogProvider } from "@/components/resource-dialog";
import { ResourceResults } from "@/components/resource-results";
import { ResourceToolbar } from "@/components/resource-toolbar";
import { CardGridSkeleton } from "@/components/skeletons";
import { StatusTiles } from "@/components/status-tiles";

export const metadata: Metadata = { title: "Library" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const filters = parseFilters(await searchParams);
  const [categories, tags, counts] = await Promise.all([
    getCategories(),
    getTags(),
    getStatusCounts(),
  ]);

  return (
    <ResourceDialogProvider categories={categories} tagNames={tags.map((tag) => tag.name)}>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">My library</h1>
          <AddResourceButton />
        </div>

        <StatusTiles counts={counts} activeStatus={filters.status} />
        <ResourceToolbar categories={categories} tags={tags} showFavoritesFilter />

        {/* The key makes the loading placeholder reappear whenever filters change. */}
        <Suspense key={JSON.stringify(filters)} fallback={<CardGridSkeleton />}>
          <ResourceResults filters={filters} basePath="/dashboard" />
        </Suspense>
      </div>
    </ResourceDialogProvider>
  );
}
