"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { deleteResource, setResourceFavorite, setResourceStatus } from "@/app/actions/resources";
import { STATUSES, STATUS_LABELS, isResourceStatus, type ResourceStatus } from "@/lib/constants";
import type { ActionResult, Resource } from "@/types";
import { ExternalIcon, FolderIcon, PencilIcon, StarIcon, TrashIcon } from "@/components/icons";
import { ConfirmDialog } from "@/components/modal";
import { useResourceDialog } from "@/components/resource-dialog";
import { useToast } from "@/components/toast";
import { TypeBadge } from "@/components/type-badge";

const STATUS_STYLE: Record<ResourceStatus, string> = {
  to_study:
    "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
  in_progress:
    "border-sky-300 bg-sky-50 text-sky-900 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200",
  completed:
    "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
};

const NETWORK_FAILURE: ActionResult = {
  ok: false,
  error: "We couldn't reach the server. Check your internet connection and try again.",
};

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function ResourceCard({ resource, basePath }: { resource: Resource; basePath: string }) {
  const toast = useToast();
  const { openEdit } = useResourceDialog();
  const [isPending, startTransition] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // "Optimistic" = show the change instantly, then confirm with the server.
  const [shown, setShown] = useOptimistic(
    { status: resource.status, isFavorite: resource.isFavorite },
    (current, change: Partial<{ status: ResourceStatus; isFavorite: boolean }>) => ({
      ...current,
      ...change,
    }),
  );

  function changeStatus(status: ResourceStatus) {
    startTransition(async () => {
      setShown({ status });
      const result = await setResourceStatus(resource.id, status).catch(() => NETWORK_FAILURE);
      if (result.ok) toast(`Marked as ${STATUS_LABELS[status]}.`);
      else toast(result.error, "error");
    });
  }

  function toggleFavorite() {
    const next = !shown.isFavorite;
    startTransition(async () => {
      setShown({ isFavorite: next });
      const result = await setResourceFavorite(resource.id, next).catch(() => NETWORK_FAILURE);
      if (result.ok) toast(result.message);
      else toast(result.error, "error");
    });
  }

  function confirmDelete() {
    startTransition(async () => {
      const result = await deleteResource(resource.id).catch(() => NETWORK_FAILURE);
      if (result.ok) toast(result.message);
      else toast(result.error, "error");
      setConfirmingDelete(false);
    });
  }

  return (
    <li className="card flex flex-col p-4 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <TypeBadge type={resource.type} />
        <button
          type="button"
          onClick={toggleFavorite}
          className={`icon-btn -m-1.5 ${shown.isFavorite ? "text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300" : ""}`}
          aria-pressed={shown.isFavorite}
          aria-label={
            shown.isFavorite
              ? `Remove ${resource.title} from favorites`
              : `Add ${resource.title} to favorites`
          }
          title={shown.isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <StarIcon className="size-5" filled={shown.isFavorite} />
        </button>
      </div>

      <h3 className="mt-3 line-clamp-2 font-semibold break-words" title={resource.title}>
        {resource.title}
      </h3>
      <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
        {hostnameOf(resource.url)}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <Link
          href={`${basePath}?category=${resource.category?.id ?? "none"}`}
          className="inline-flex max-w-full items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          title="Show this category"
        >
          <FolderIcon className="size-3 shrink-0" />
          <span className="truncate">{resource.category?.name ?? "Uncategorized"}</span>
        </Link>
        {resource.tags.map((tag) => (
          <Link
            key={tag.id}
            href={`${basePath}?tag=${tag.id}`}
            className="max-w-full truncate rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300 dark:hover:bg-indigo-900"
            title={`Show everything tagged ${tag.name}`}
          >
            #{tag.name}
          </Link>
        ))}
      </div>

      {resource.notes ? (
        <p className="mt-3 line-clamp-3 text-sm whitespace-pre-line text-slate-600 dark:text-slate-300">
          {resource.notes}
        </p>
      ) : null}

      <div className="mt-auto flex items-center gap-1 pt-4">
        <label className="sr-only" htmlFor={`status-${resource.id}`}>
          Study status for {resource.title}
        </label>
        <select
          id={`status-${resource.id}`}
          value={shown.status}
          disabled={isPending}
          onChange={(event) => {
            if (isResourceStatus(event.target.value)) changeStatus(event.target.value);
          }}
          className={`h-9 min-w-0 cursor-pointer rounded-lg border px-2 text-xs font-semibold ${STATUS_STYLE[shown.status]}`}
        >
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>

        <span className="flex-1" />

        <button
          type="button"
          className="icon-btn"
          onClick={() => openEdit(resource)}
          aria-label={`Edit ${resource.title}`}
          title="Edit"
        >
          <PencilIcon className="size-4" />
        </button>
        <button
          type="button"
          className="icon-btn hover:text-red-600 dark:hover:text-red-400"
          onClick={() => setConfirmingDelete(true)}
          aria-label={`Delete ${resource.title}`}
          title="Delete"
        >
          <TrashIcon className="size-4" />
        </button>
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary min-h-9 px-3"
          aria-label={`Open ${resource.title} in a new tab`}
        >
          Open
          <ExternalIcon className="size-3.5" />
        </a>
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        title="Delete this resource?"
        message={`"${resource.title}" will be removed from your library for good. This cannot be undone.`}
        confirmLabel="Delete"
        busy={isPending}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmingDelete(false)}
      />
    </li>
  );
}
