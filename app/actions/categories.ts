"use server";

import { revalidatePath } from "next/cache";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { categoryNameSchema, firstIssue, idSchema } from "@/lib/validation";
import type { ActionResult } from "@/types";

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

export async function createCategory(name: string): Promise<ActionResult> {
  try {
    const parsed = categoryNameSchema.safeParse(name);
    if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
    if (!(await getCurrentUser())) return NOT_LOGGED_IN;

    const supabase = await createClient();
    const { error } = await supabase.from("categories").insert({ name: parsed.data });
    if (error) {
      // 23505 is the database's code for "this already exists".
      if (error.code === "23505") {
        return { ok: false, error: `You already have a category called "${parsed.data}".` };
      }
      return { ok: false, error: "We couldn't create the category. Please try again." };
    }

    refreshPages();
    return { ok: true, message: `Category "${parsed.data}" created.` };
  } catch {
    return NETWORK_ERROR;
  }
}

export async function renameCategory(categoryId: string, name: string): Promise<ActionResult> {
  try {
    const id = idSchema.safeParse(categoryId);
    if (!id.success) return { ok: false, error: firstIssue(id.error) };
    const parsed = categoryNameSchema.safeParse(name);
    if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
    if (!(await getCurrentUser())) return NOT_LOGGED_IN;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories")
      .update({ name: parsed.data })
      .eq("id", id.data)
      .select("id")
      .maybeSingle();
    if (error) {
      if (error.code === "23505") {
        return { ok: false, error: `You already have a category called "${parsed.data}".` };
      }
      return { ok: false, error: "We couldn't rename the category. Please try again." };
    }
    if (!data) return { ok: false, error: "This category no longer exists." };

    refreshPages();
    return { ok: true, message: "Category renamed." };
  } catch {
    return NETWORK_ERROR;
  }
}

/** Deleting a category keeps its resources; they become "Uncategorized". */
export async function deleteCategory(categoryId: string): Promise<ActionResult> {
  try {
    const id = idSchema.safeParse(categoryId);
    if (!id.success) return { ok: false, error: firstIssue(id.error) };
    if (!(await getCurrentUser())) return NOT_LOGGED_IN;

    const supabase = await createClient();
    const { error } = await supabase.from("categories").delete().eq("id", id.data);
    if (error) return { ok: false, error: "We couldn't delete the category. Please try again." };

    refreshPages();
    return { ok: true, message: "Category deleted. Its resources are now Uncategorized." };
  } catch {
    return NETWORK_ERROR;
  }
}
