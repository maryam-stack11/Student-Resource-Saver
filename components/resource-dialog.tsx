"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useTransition,
  type FormEvent,
  type ReactNode,
} from "react";
import { saveResource } from "@/app/actions/resources";
import {
  LIMITS,
  RESOURCE_TYPES,
  STATUSES,
  STATUS_LABELS,
  TYPE_LABELS,
  isResourceStatus,
  isResourceType,
  type ResourceStatus,
  type ResourceType,
} from "@/lib/constants";
import { addMissingProtocol, detectResourceType, parseHttpUrl } from "@/lib/detect-type";
import type { Category, Resource } from "@/types";
import { AlertIcon, PlusIcon } from "@/components/icons";
import { Modal } from "@/components/modal";
import { TagInput } from "@/components/tag-input";
import { useToast } from "@/components/toast";
import { TypeBadge } from "@/components/type-badge";

type DialogControls = {
  openCreate: () => void;
  openEdit: (resource: Resource) => void;
};

const ResourceDialogContext = createContext<DialogControls>({
  openCreate: () => {},
  openEdit: () => {},
});

/** Lets any card or button open the add/edit form. */
export function useResourceDialog(): DialogControls {
  return useContext(ResourceDialogContext);
}

const NEW_CATEGORY = "__new__";

/**
 * Wrap a page in this to give it one shared add/edit form.
 * (One form for the whole page is lighter than one per card.)
 */
export function ResourceDialogProvider({
  categories,
  tagNames,
  children,
}: {
  categories: Category[];
  tagNames: string[];
  children: ReactNode;
}) {
  const [dialog, setDialog] = useState<{ open: boolean; resource: Resource | null; key: number }>({
    open: false,
    resource: null,
    key: 0,
  });

  const openCreate = useCallback(
    () => setDialog((current) => ({ open: true, resource: null, key: current.key + 1 })),
    [],
  );
  const openEdit = useCallback(
    (resource: Resource) =>
      setDialog((current) => ({ open: true, resource, key: current.key + 1 })),
    [],
  );
  const close = useCallback(() => setDialog((current) => ({ ...current, open: false })), []);
  const controls = useMemo(() => ({ openCreate, openEdit }), [openCreate, openEdit]);

  return (
    <ResourceDialogContext.Provider value={controls}>
      {children}
      <Modal
        open={dialog.open}
        onClose={close}
        title={dialog.resource ? "Edit resource" : "Add a resource"}
      >
        {/* The key gives us a fresh, empty form every time it opens. */}
        <ResourceForm
          key={dialog.key}
          resource={dialog.resource}
          categories={categories}
          tagNames={tagNames}
          onDone={close}
        />
      </Modal>
    </ResourceDialogContext.Provider>
  );
}

export function AddResourceButton({ label = "Add resource" }: { label?: string }) {
  const { openCreate } = useResourceDialog();
  return (
    <button type="button" className="btn btn-primary" onClick={openCreate}>
      <PlusIcon className="size-4" />
      {label}
    </button>
  );
}

function ResourceForm({
  resource,
  categories,
  tagNames,
  onDone,
}: {
  resource: Resource | null;
  categories: Category[];
  tagNames: string[];
  onDone: () => void;
}) {
  const toast = useToast();
  const [isSaving, startSaving] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(resource?.title ?? "");
  const [url, setUrl] = useState(resource?.url ?? "");
  const [type, setType] = useState<ResourceType>(resource?.type ?? "website");
  // Once the user picks a type themselves we stop auto-detecting it.
  const [typeIsManual, setTypeIsManual] = useState(resource !== null);
  const [categoryChoice, setCategoryChoice] = useState(resource?.category?.id ?? "");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [status, setStatus] = useState<ResourceStatus>(resource?.status ?? "to_study");
  const [isFavorite, setIsFavorite] = useState(resource?.isFavorite ?? false);
  const [notes, setNotes] = useState(resource?.notes ?? "");
  const [tags, setTags] = useState<string[]>(resource?.tags.map((tag) => tag.name) ?? []);

  function onUrlChange(value: string) {
    setUrl(value);
    setError(null);
    if (!typeIsManual) setType(detectResourceType(addMissingProtocol(value)));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const finalUrl = addMissingProtocol(url);
    if (!title.trim()) return setError("Please enter a title.");
    if (!parseHttpUrl(finalUrl)) {
      return setError("Please enter a full web link, for example https://www.youtube.com/watch?v=…");
    }
    if (categoryChoice === NEW_CATEGORY && !newCategoryName.trim()) {
      return setError("Please type a name for the new category, or pick an existing one.");
    }
    setUrl(finalUrl);

    startSaving(async () => {
      const result = await saveResource(
        {
          title,
          url: finalUrl,
          type,
          status,
          categoryId: categoryChoice && categoryChoice !== NEW_CATEGORY ? categoryChoice : null,
          newCategoryName: categoryChoice === NEW_CATEGORY ? newCategoryName : undefined,
          isFavorite,
          notes,
          tags,
        },
        resource?.id,
      ).catch(() => ({
        ok: false as const,
        error: "We couldn't reach the server. Check your internet connection and try again.",
      }));

      if (result.ok) {
        toast(result.message);
        onDone();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="resource-url" className="field-label">
          Link <span aria-hidden="true">*</span>
        </label>
        <input
          id="resource-url"
          type="url"
          inputMode="url"
          className="field"
          value={url}
          onChange={(event) => onUrlChange(event.target.value)}
          onBlur={() => setUrl(addMissingProtocol(url))}
          placeholder="https://…"
          maxLength={LIMITS.url}
          required
          autoFocus={resource === null}
          autoComplete="off"
        />
      </div>

      <div>
        <label htmlFor="resource-title" className="field-label">
          Title <span aria-hidden="true">*</span>
        </label>
        <input
          id="resource-title"
          type="text"
          className="field"
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            setError(null);
          }}
          placeholder="e.g. Pointers in C++ explained"
          maxLength={LIMITS.title}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="resource-type" className="field-label">
            Type
          </label>
          <select
            id="resource-type"
            className="field"
            value={type}
            onChange={(event) => {
              if (isResourceType(event.target.value)) {
                setType(event.target.value);
                setTypeIsManual(true);
              }
            }}
          >
            {RESOURCE_TYPES.map((option) => (
              <option key={option} value={option}>
                {TYPE_LABELS[option]}
              </option>
            ))}
          </select>
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <TypeBadge type={type} />
            {typeIsManual ? "chosen by you" : "detected from the link"}
          </p>
        </div>

        <div>
          <label htmlFor="resource-status" className="field-label">
            Study status
          </label>
          <select
            id="resource-status"
            className="field"
            value={status}
            onChange={(event) => {
              if (isResourceStatus(event.target.value)) setStatus(event.target.value);
            }}
          >
            {STATUSES.map((option) => (
              <option key={option} value={option}>
                {STATUS_LABELS[option]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="resource-category" className="field-label">
          Category
        </label>
        <select
          id="resource-category"
          className="field"
          value={categoryChoice}
          onChange={(event) => setCategoryChoice(event.target.value)}
        >
          <option value="">Uncategorized</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
          <option value={NEW_CATEGORY}>+ New category…</option>
        </select>
        {categoryChoice === NEW_CATEGORY ? (
          <div className="mt-2">
            <label htmlFor="resource-new-category" className="sr-only">
              New category name
            </label>
            <input
              id="resource-new-category"
              type="text"
              className="field"
              value={newCategoryName}
              onChange={(event) => setNewCategoryName(event.target.value)}
              placeholder="New category name, e.g. Physics"
              maxLength={LIMITS.categoryName}
              autoFocus
            />
          </div>
        ) : null}
      </div>

      <TagInput value={tags} onChange={setTags} suggestions={tagNames} />

      <div>
        <label htmlFor="resource-notes" className="field-label">
          Notes
        </label>
        <textarea
          id="resource-notes"
          className="field min-h-24"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Why is this useful? What should you remember?"
          maxLength={LIMITS.notes}
          rows={4}
        />
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="size-4 accent-indigo-600"
          checked={isFavorite}
          onChange={(event) => setIsFavorite(event.target.checked)}
        />
        Mark as favorite
      </label>

      {error ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-200"
        >
          <AlertIcon className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <button type="button" className="btn btn-secondary" onClick={onDone} disabled={isSaving}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={isSaving}>
          {isSaving ? "Saving…" : resource ? "Save changes" : "Save resource"}
        </button>
      </div>
    </form>
  );
}
