import {
  PAGE_SIZE,
  isResourceStatus,
  isResourceType,
  isSortOption,
  type ResourceStatus,
  type ResourceType,
  type SortOption,
} from "@/lib/constants";

export type RawSearchParams = Record<string, string | string[] | undefined>;

/** The filters shown in the toolbar. They live in the page address (?q=...&status=...). */
export type LibraryFilters = {
  q: string;
  /** "" = all, "none" = uncategorized, otherwise a category id */
  category: string;
  /** "" = all, otherwise a tag id */
  tag: string;
  status: ResourceStatus | "";
  type: ResourceType | "";
  favorites: boolean;
  sort: SortOption;
  /** How many resources to show (grows when "Load more" is clicked). */
  show: number;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_SHOW = 500;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export function parseFilters(params: RawSearchParams): LibraryFilters {
  const category = first(params.category);
  const tag = first(params.tag);
  const status = first(params.status);
  const type = first(params.type);
  const sort = first(params.sort);
  const show = Number.parseInt(first(params.show), 10);

  return {
    q: first(params.q).trim().slice(0, 100),
    category: category === "none" || UUID_PATTERN.test(category) ? category : "",
    tag: UUID_PATTERN.test(tag) ? tag : "",
    status: isResourceStatus(status) ? status : "",
    type: isResourceType(type) ? type : "",
    favorites: first(params.favorites) === "1",
    sort: isSortOption(sort) ? sort : "newest",
    show: Number.isFinite(show) ? Math.min(Math.max(show, PAGE_SIZE), MAX_SHOW) : PAGE_SIZE,
  };
}

/** True when anything other than the sort order narrows the list. */
export function hasActiveFilters(filters: LibraryFilters): boolean {
  return Boolean(
    filters.q ||
      filters.category ||
      filters.tag ||
      filters.status ||
      filters.type ||
      filters.favorites,
  );
}

/** Turn filters back into a "?q=...&status=..." string (defaults are left out). */
export function filtersToQuery(filters: LibraryFilters): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.category) params.set("category", filters.category);
  if (filters.tag) params.set("tag", filters.tag);
  if (filters.status) params.set("status", filters.status);
  if (filters.type) params.set("type", filters.type);
  if (filters.favorites) params.set("favorites", "1");
  if (filters.sort !== "newest") params.set("sort", filters.sort);
  if (filters.show > PAGE_SIZE) params.set("show", String(filters.show));
  const query = params.toString();
  return query ? `?${query}` : "";
}
