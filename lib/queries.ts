import "server-only";
import { createClient } from "@/lib/supabase/server";
import {
  STATUSES,
  isResourceStatus,
  isResourceType,
  type ResourceStatus,
} from "@/lib/constants";
import type { LibraryFilters } from "@/lib/filters";
import type { CategoryWithCount, Resource, StatusCounts, TagWithCount } from "@/types";

/** Thrown when the database cannot be reached; shown by the error screen. */
export class DataLoadError extends Error {
  constructor(what: string) {
    super(`We couldn't load ${what}. Please check your internet connection and try again.`);
    this.name = "DataLoadError";
  }
}

// Everything a card needs, in ONE request: the resource, its category and its tags.
const RESOURCE_COLUMNS =
  "id, title, url, type, status, is_favorite, notes, created_at, category:categories(id, name), tags(id, name)";

/** Escape characters that have a special meaning in a LIKE search. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

export async function getResources(
  filters: LibraryFilters,
  options: { favoritesOnly?: boolean } = {},
): Promise<{ resources: Resource[]; total: number }> {
  const supabase = await createClient();

  // When filtering by tag we add a second, hidden join that must match,
  // so the visible "tags" list still contains all tags of each resource.
  const columns = filters.tag
    ? (`${RESOURCE_COLUMNS}, tag_filter:tags!inner(id)` as typeof RESOURCE_COLUMNS)
    : RESOURCE_COLUMNS;

  let query = supabase.from("resources").select(columns, { count: "exact" });

  if (filters.tag) query = query.eq("tag_filter.id", filters.tag);
  if (filters.category === "none") query = query.is("category_id", null);
  else if (filters.category) query = query.eq("category_id", filters.category);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.type) query = query.eq("type", filters.type);
  if (options.favoritesOnly || filters.favorites) query = query.eq("is_favorite", true);

  // Every word typed must appear somewhere in title, notes, category or tags.
  for (const word of filters.q.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 8)) {
    query = query.ilike("search_text", `%${escapeLike(word)}%`);
  }

  if (filters.sort === "oldest") query = query.order("created_at", { ascending: true });
  else if (filters.sort === "title") query = query.order("title", { ascending: true });
  else query = query.order("created_at", { ascending: false });
  // Second sort key keeps the order stable when two rows tie.
  query = query.order("id", { ascending: true });

  const { data, error, count } = await query.range(0, filters.show - 1);
  if (error) throw new DataLoadError("your resources");

  const resources: Resource[] = data.map((row) => ({
    id: row.id,
    title: row.title,
    url: row.url,
    type: isResourceType(row.type) ? row.type : "other",
    status: isResourceStatus(row.status) ? row.status : "to_study",
    isFavorite: row.is_favorite,
    notes: row.notes,
    createdAt: row.created_at,
    category: row.category,
    tags: [...row.tags].sort((a, b) => a.name.localeCompare(b.name)),
  }));

  return { resources, total: count ?? resources.length };
}

export async function getCategories(): Promise<CategoryWithCount[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, resources(count)")
    .order("name", { ascending: true });
  if (error) throw new DataLoadError("your categories");

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    resourceCount: row.resources[0]?.count ?? 0,
  }));
}

export async function getTags(): Promise<TagWithCount[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tags")
    .select("id, name, resource_tags(count)")
    .order("name", { ascending: true });
  if (error) throw new DataLoadError("your tags");

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    resourceCount: row.resource_tags[0]?.count ?? 0,
  }));
}

/** How many resources are in each study status (for the dashboard tiles). */
export async function getStatusCounts(): Promise<StatusCounts> {
  const supabase = await createClient();

  const countFor = async (status: ResourceStatus): Promise<number> => {
    const { count, error } = await supabase
      .from("resources")
      .select("id", { count: "exact", head: true })
      .eq("status", status);
    if (error) throw new DataLoadError("your study progress");
    return count ?? 0;
  };

  const [toStudy, inProgress, completed] = await Promise.all(STATUSES.map(countFor));
  return {
    to_study: toStudy,
    in_progress: inProgress,
    completed,
    total: toStudy + inProgress + completed,
  };
}
