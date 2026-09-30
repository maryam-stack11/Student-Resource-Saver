"use server";

import { revalidatePath } from "next/cache";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import {
  categoryNameSchema,
  firstIssue,
  idSchema,
  resourceInputSchema,
  statusSchema,
  type ResourceInput,
} from "@/lib/validation";
import type { ActionResult } from "@/types";

type Supabase = Awaited<ReturnType<typeof createClient>>;

const NOT_LOGGED_IN: ActionResult = {
  ok: false,
  error: "Your session has ended. Please log in again.",
};
const NETWORK_ERROR: ActionResult = {
  ok: false,
  error: "We couldn't reach the server. Check your internet connection and try again.",
};

function refreshPages() {
  revalidatePath("/dashboard");
  revalidatePath("/favorites");
  revalidatePath("/categories");
}

/** Find the category with this name, or create it. Returns its id. */
async function findOrCreateCategory(supabase: Supabase, name: string): Promise<string | null> {
  const created = await supabase.from("categories").insert({ name }).select("id").single();
  if (created.data) return created.data.id;

  // 23505 = "already exists": reuse the existing category instead.
  if (created.error.code === "23505") {
    const existing = await supabase.from("categories").select("id").ilike("name", name.replace(/[\\%_]/g, (c) => `\\${c}`)).maybeSingle();
    return existing.data?.id ?? null;
  }
  return null;
}

/** Make the resource's tags match `names`. Returns false if something failed. */
async function syncTags(supabase: Supabase, resourceId: string, names: string[]): Promise<boolean> {
  const [allTags, currentLinks] = await Promise.all([
    supabase.from("tags").select("id, name"),
    supabase.from("resource_tags").select("tag_id").eq("resource_id", resourceId),
  ]);
  if (allTags.error || currentLinks.error) return false;

  const idByName = new Map(allTags.data.map((tag) => [tag.name.toLowerCase(), tag.id]));

  // Create tags that do not exist yet (one request for all of them).
  const missing = names.filter((name) => !idByName.has(name.toLowerCase()));
  if (missing.length > 0) {
    const created = await supabase
      .from("tags")
      .insert(missing.map((name) => ({ name })))
      .select("id, name");
    if (created.error) return false;
    created.data.forEach((tag) => idByName.set(tag.name.toLowerCase(), tag.id));
  }

  const wanted = new Set<string>();
  for (const name of names) {
    const id = idByName.get(name.toLowerCase());
    if (id) wanted.add(id);
  }
  const current = new Set(currentLinks.data.map((link) => link.tag_id));

  const toAdd = [...wanted].filter((id) => !current.has(id));
  const toRemove = [...current].filter((id) => !wanted.has(id));

  if (toRemove.length > 0) {
    const { error } = await supabase
      .from("resource_tags")
      .delete()
      .eq("resource_id", resourceId)
      .in("tag_id", toRemove);
    if (error) return false;
  }
  if (toAdd.length > 0) {
    const { error } = await supabase
      .from("resource_tags")
      .insert(toAdd.map((tagId) => ({ resource_id: resourceId, tag_id: tagId })));
    if (error) return false;
  }
  return true;
}

/** Create a resource (no id) or update an existing one (with id). */
export async function saveResource(
  input: ResourceInput,
  resourceId?: string,
): Promise<ActionResult> {
  try {
    const parsed = resourceInputSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
    const values = parsed.data;

    let id: string | undefined;
    if (resourceId !== undefined) {
      const parsedId = idSchema.safeParse(resourceId);
      if (!parsedId.success) return { ok: false, error: firstIssue(parsedId.error) };
      id = parsedId.data;
    }

    if (!(await getCurrentUser())) return NOT_LOGGED_IN;
    const supabase = await createClient();

    // Optional: a brand-new category typed straight into the form.
    let categoryId = values.categoryId;
    if (values.newCategoryName?.trim()) {
      const name = categoryNameSchema.safeParse(values.newCategoryName);
      if (!name.success) return { ok: false, error: firstIssue(name.error) };
      categoryId = await findOrCreateCategory(supabase, name.data);
      if (!categoryId) return { ok: false, error: "We couldn't create that category. Please try again." };
    }

    const row = {
      title: values.title,
      url: values.url,
      type: values.type,
      status: values.status,
      category_id: categoryId,
      is_favorite: values.isFavorite,
      notes: values.notes,
    };

    const saved = id
      ? await supabase.from("resources").update(row).eq("id", id).select("id").maybeSingle()
      : await supabase.from("resources").insert(row).select("id").single();

    if (saved.error) {
      return { ok: false, error: "We couldn't save this resource. Please try again." };
    }
    if (!saved.data) {
      return { ok: false, error: "This resource no longer exists. It may have been deleted." };
    }

    const tagsSaved = await syncTags(supabase, saved.data.id, values.tags);
    refreshPages();

    if (!tagsSaved) {
      return {
        ok: false,
        error: "The resource was saved, but its tags could not be updated. Open it and try again.",
      };
    }
    return { ok: true, message: id ? "Resource updated." : "Resource saved." };
  } catch {
    return NETWORK_ERROR;
  }
}

export async function deleteResource(resourceId: string): Promise<ActionResult> {
  try {
    const id = idSchema.safeParse(resourceId);
    if (!id.success) return { ok: false, error: firstIssue(id.error) };
    if (!(await getCurrentUser())) return NOT_LOGGED_IN;

    const supabase = await createClient();
    const { error } = await supabase.from("resources").delete().eq("id", id.data);
    if (error) return { ok: false, error: "We couldn't delete this resource. Please try again." };

    refreshPages();
    return { ok: true, message: "Resource deleted." };
  } catch {
    return NETWORK_ERROR;
  }
}

export async function setResourceStatus(resourceId: string, status: string): Promise<ActionResult> {
  try {
    const id = idSchema.safeParse(resourceId);
    if (!id.success) return { ok: false, error: firstIssue(id.error) };
    const parsedStatus = statusSchema.safeParse(status);
    if (!parsedStatus.success) return { ok: false, error: firstIssue(parsedStatus.error) };
    if (!(await getCurrentUser())) return NOT_LOGGED_IN;

    const supabase = await createClient();
    const { error } = await supabase
      .from("resources")
      .update({ status: parsedStatus.data })
      .eq("id", id.data);
    if (error) return { ok: false, error: "We couldn't update the status. Please try again." };

    refreshPages();
    return { ok: true, message: "Status updated." };
  } catch {
    return NETWORK_ERROR;
  }
}

export async function setResourceFavorite(
  resourceId: string,
  isFavorite: boolean,
): Promise<ActionResult> {
  try {
    const id = idSchema.safeParse(resourceId);
    if (!id.success) return { ok: false, error: firstIssue(id.error) };
    if (!(await getCurrentUser())) return NOT_LOGGED_IN;

    const supabase = await createClient();
    const { error } = await supabase
      .from("resources")
      .update({ is_favorite: isFavorite === true })
      .eq("id", id.data);
    if (error) return { ok: false, error: "We couldn't update favorites. Please try again." };

    refreshPages();
    return { ok: true, message: isFavorite ? "Added to favorites." : "Removed from favorites." };
  } catch {
    return NETWORK_ERROR;
  }
}
