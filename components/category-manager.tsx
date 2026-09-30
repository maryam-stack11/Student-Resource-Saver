"use client";

import Link from "next/link";
import { useState, useTransition, type FormEvent } from "react";
import { createCategory, deleteCategory, renameCategory } from "@/app/actions/categories";
import { LIMITS } from "@/lib/constants";
import type { ActionResult, CategoryWithCount } from "@/types";
import { FolderIcon, PencilIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { ConfirmDialog } from "@/components/modal";
import { useToast } from "@/components/toast";

const NETWORK_FAILURE: ActionResult = {
  ok: false,
  error: "We couldn't reach the server. Check your internet connection and try again.",
};

function countLabel(count: number): string {
  return `${count} ${count === 1 ? "resource" : "resources"}`;
}

export function CategoryManager({ categories }: { categories: CategoryWithCount[] }) {
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState<CategoryWithCount | null>(null);

  function report(result: ActionResult): boolean {
    if (result.ok) toast(result.message);
    else toast(result.error, "error");
    return result.ok;
  }

  function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newName.trim()) return toast("Please enter a category name.", "error");
    startTransition(async () => {
      const result = await createCategory(newName).catch(() => NETWORK_FAILURE);
      if (report(result)) setNewName("");
    });
  }

  function onRename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const { id, name } = editing;
    if (!name.trim()) return toast("Please enter a category name.", "error");
    startTransition(async () => {
      const result = await renameCategory(id, name).catch(() => NETWORK_FAILURE);
      if (report(result)) setEditing(null);
    });
  }

  function onDelete() {
    if (!deleting) return;
    const { id } = deleting;
    startTransition(async () => {
      report(await deleteCategory(id).catch(() => NETWORK_FAILURE));
      setDeleting(null);
    });
  }

  return (
    <div className="space-y-5">
      <form onSubmit={onCreate} className="card flex flex-col gap-2 p-3 sm:flex-row sm:items-end sm:p-4">
        <div className="flex-1">
          <label htmlFor="new-category" className="field-label">
            New category
          </label>
          <input
            id="new-category"
            type="text"
            className="field"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="e.g. C++, Physics, Mathematics"
            maxLength={LIMITS.categoryName}
            autoComplete="off"
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={isPending}>
          <PlusIcon className="size-4" />
          Add category
        </button>
      </form>

      {categories.length === 0 ? (
        <div className="card flex flex-col items-center px-6 py-14 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
            <FolderIcon className="size-6" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">No categories yet</h2>
          <p className="mt-1 max-w-sm text-sm text-slate-600 dark:text-slate-300">
            Categories are your subjects. Add one above, like &quot;C++&quot; or &quot;Physics&quot;, then
            pick it when you save a resource.
          </p>
        </div>
      ) : (
        <ul className="card divide-y divide-slate-200 dark:divide-slate-800">
          {categories.map((category) => (
            <li key={category.id} className="flex items-center gap-2 px-3 py-2.5 sm:px-4">
              {editing?.id === category.id ? (
                <form onSubmit={onRename} className="flex flex-1 flex-wrap items-center gap-2">
                  <label htmlFor={`rename-${category.id}`} className="sr-only">
                    New name for {category.name}
                  </label>
                  <input
                    id={`rename-${category.id}`}
                    type="text"
                    className="field min-w-0 flex-1"
                    value={editing.name}
                    onChange={(event) => setEditing({ id: category.id, name: event.target.value })}
                    onKeyDown={(event) => {
                      if (event.key === "Escape") setEditing(null);
                    }}
                    maxLength={LIMITS.categoryName}
                    autoFocus
                  />
                  <button type="submit" className="btn btn-primary" disabled={isPending}>
                    Save
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setEditing(null)}
                    disabled={isPending}
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <>
                  <FolderIcon className="size-4 shrink-0 text-slate-400" />
                  <Link
                    href={`/dashboard?category=${category.id}`}
                    className="min-w-0 flex-1 truncate rounded font-medium hover:text-indigo-600 dark:hover:text-indigo-400"
                    title={`Show resources in ${category.name}`}
                  >
                    {category.name}
                  </Link>
                  <span className="shrink-0 text-sm text-slate-500 tabular-nums dark:text-slate-400">
                    {countLabel(category.resourceCount)}
                  </span>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => setEditing({ id: category.id, name: category.name })}
                    aria-label={`Rename ${category.name}`}
                    title="Rename"
                  >
                    <PencilIcon className="size-4" />
                  </button>
                  <button
                    type="button"
                    className="icon-btn hover:text-red-600 dark:hover:text-red-400"
                    onClick={() => setDeleting(category)}
                    aria-label={`Delete ${category.name}`}
                    title="Delete"
                  >
                    <TrashIcon className="size-4" />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={deleting !== null}
        title="Delete this category?"
        message={
          deleting
            ? deleting.resourceCount > 0
              ? `"${deleting.name}" will be deleted. Its ${countLabel(deleting.resourceCount)} will NOT be deleted; they will move to Uncategorized.`
              : `"${deleting.name}" will be deleted. It has no resources.`
            : ""
        }
        confirmLabel="Delete category"
        busy={isPending}
        onConfirm={onDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
