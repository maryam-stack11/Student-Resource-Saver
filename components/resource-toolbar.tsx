"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useEffectEvent, useOptimistic, useState, useTransition } from "react";
import {
  RESOURCE_TYPES,
  SORTS,
  SORT_LABELS,
  STATUSES,
  STATUS_LABELS,
  TYPE_LABELS,
} from "@/lib/constants";
import type { Category, TagWithCount } from "@/types";
import { CloseIcon, SearchIcon, StarIcon } from "@/components/icons";

const SEARCH_DELAY_MS = 300;
const FILTER_KEYS = ["q", "category", "tag", "status", "type", "favorites"];

/**
 * Search box, filters and sort. Everything is stored in the page address
 * (for example /dashboard?status=completed), so filtered views can be
 * bookmarked and the browser's Back button works.
 */
export function ResourceToolbar({
  categories,
  tags,
  showFavoritesFilter,
}: {
  categories: Category[];
  tags: TagWithCount[];
  showFavoritesFilter: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const urlQuery = searchParams.get("q") ?? "";
  const [text, setText] = useState(urlQuery);
  // Keep the box in sync when the address changes from elsewhere
  // (e.g. "Clear filters" or the Back button) without fighting the typist.
  const [seenUrlQuery, setSeenUrlQuery] = useState(urlQuery);
  const [pushedQuery, setPushedQuery] = useState(urlQuery);
  if (urlQuery !== seenUrlQuery) {
    setSeenUrlQuery(urlQuery);
    if (urlQuery !== pushedQuery) {
      setText(urlQuery);
      setPushedQuery(urlQuery);
    }
  }

  // "Optimistic" copy of the address: updates instantly when a filter is
  // clicked, so the controls never lag behind and quick clicks don't clash.
  const [query, setQuery] = useOptimistic(searchParams.toString());
  const current = new URLSearchParams(query);

  function navigate(change: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(query);
    change(params);
    params.delete("show"); // back to the first page of results
    const next = params.toString();
    startTransition(() => {
      setQuery(next);
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    });
  }

  function setParam(key: string, value: string) {
    navigate((params) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
  }

  const pushSearch = useEffectEvent((value: string) => {
    setPushedQuery(value);
    setParam("q", value);
  });

  // Debounce: wait until typing pauses before searching.
  useEffect(() => {
    const value = text.trim();
    if (value === pushedQuery) return;
    const timer = window.setTimeout(() => pushSearch(value), SEARCH_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [text, pushedQuery]);

  const hasFilters = FILTER_KEYS.some((key) => current.get(key));
  const favoritesOn = current.get("favorites") === "1";
  const usedTags = tags.filter((tag) => tag.resourceCount > 0);

  function clearAll() {
    setText("");
    setPushedQuery("");
    navigate((params) => FILTER_KEYS.forEach((key) => params.delete(key)));
  }

  return (
    <section aria-label="Search and filters" className="card p-3 sm:p-4" aria-busy={isPending}>
      <div className="relative">
        <label htmlFor="library-search" className="sr-only">
          Search your resources
        </label>
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
        <input
          id="library-search"
          type="search"
          className="field pl-9"
          placeholder="Search titles, categories, tags and notes…"
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={100}
          autoComplete="off"
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3 lg:flex lg:flex-wrap lg:items-center">
        <FilterSelect
          label="Category"
          value={current.get("category") ?? ""}
          onChange={(value) => setParam("category", value)}
        >
          <option value="">All categories</option>
          <option value="none">Uncategorized</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect label="Tag" value={current.get("tag") ?? ""} onChange={(value) => setParam("tag", value)}>
          <option value="">All tags</option>
          {usedTags.map((tag) => (
            <option key={tag.id} value={tag.id}>
              #{tag.name}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          label="Status"
          value={current.get("status") ?? ""}
          onChange={(value) => setParam("status", value)}
        >
          <option value="">All statuses</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          label="Type"
          value={current.get("type") ?? ""}
          onChange={(value) => setParam("type", value)}
        >
          <option value="">All types</option>
          {RESOURCE_TYPES.map((type) => (
            <option key={type} value={type}>
              {TYPE_LABELS[type]}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          label="Sort by"
          value={current.get("sort") ?? "newest"}
          onChange={(value) => setParam("sort", value === "newest" ? "" : value)}
        >
          {SORTS.map((sort) => (
            <option key={sort} value={sort}>
              {SORT_LABELS[sort]}
            </option>
          ))}
        </FilterSelect>

        {showFavoritesFilter ? (
          <button
            type="button"
            onClick={() => setParam("favorites", favoritesOn ? "" : "1")}
            aria-pressed={favoritesOn}
            className={`btn ${favoritesOn ? "border border-amber-400 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200" : "btn-secondary"}`}
          >
            <StarIcon className="size-4" filled={favoritesOn} />
            Favorites
          </button>
        ) : null}

        {hasFilters ? (
          <button type="button" onClick={clearAll} className="btn btn-secondary lg:ml-auto">
            <CloseIcon className="size-4" />
            Clear filters
          </button>
        ) : null}
      </div>
    </section>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="block min-w-0 lg:w-44">
      <span className="sr-only">{label}</span>
      <select
        className="field cursor-pointer"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
      >
        {children}
      </select>
    </label>
  );
}
