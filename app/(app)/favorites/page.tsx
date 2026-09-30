import type { Metadata } from "next";
import { Suspense } from "react";
import { parseFilters, type RawSearchParams } from "@/lib/filters";
import { getCategories, getTags } from "@/lib/queries";
import { ResourceDialogProvider } from "@/components/resource-dialog";
import { ResourceResults } from "@/components/resource-results";
import { ResourceToolbar } from "@/components/resource-toolbar";
import { CardGridSkeleton } from "@/components/skeletons";

export const metadata: Metadata = { title: "Favorites" };

export default async function FavoritesPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  // Everything on this page is a favorite, so the favorites filter itself is ignored.
  const filters = { ...parseFilters(await searchParams), favorites: false };
  const [categories, tags] = await Promise.all([getCategories(), getTags()]);

  return (
    <ResourceDialogProvider categories={categories} tagNames={tags.map((tag) => tag.name)}>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Favorites</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            The resources you starred, for quick access.
          </p>
        </div>

        <ResourceToolbar categories={categories} tags={tags} showFavoritesFilter={false} />

        <Suspense key={JSON.stringify(filters)} fallback={<CardGridSkeleton />}>
          <ResourceResults filters={filters} basePath="/favorites" favoritesOnly />
        </Suspense>
      </div>
    </ResourceDialogProvider>
  );
}
