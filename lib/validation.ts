import { z } from "zod";
import { LIMITS, RESOURCE_TYPES, STATUSES } from "@/lib/constants";
import { parseHttpUrl } from "@/lib/detect-type";

/** Trim and squeeze repeated spaces: "  Data   Structures " → "Data Structures". */
export function cleanName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

/** Clean up tag names, drop empties and case-insensitive duplicates. */
export function normalizeTagNames(names: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of names) {
    const name = cleanName(raw.replace(/^#+/, ""));
    const key = name.toLowerCase();
    if (!name || seen.has(key)) continue;
    seen.add(key);
    result.push(name);
  }
  return result;
}

const uuid = z.uuid({ error: "Something looks wrong with this item. Please refresh the page." });

export const categoryNameSchema = z
  .string({ error: "Please enter a category name." })
  .transform(cleanName)
  .pipe(
    z
      .string()
      .min(1, { error: "Please enter a category name." })
      .max(LIMITS.categoryName, {
        error: `Category names can be at most ${LIMITS.categoryName} characters.`,
      }),
  );

export const resourceInputSchema = z.object({
  title: z
    .string({ error: "Please enter a title." })
    .transform(cleanName)
    .pipe(
      z
        .string()
        .min(1, { error: "Please enter a title." })
        .max(LIMITS.title, { error: `Titles can be at most ${LIMITS.title} characters.` }),
    ),
  url: z
    .string({ error: "Please enter a link." })
    .trim()
    .min(1, { error: "Please enter a link." })
    .max(LIMITS.url, { error: "That link is too long." })
    .refine((value) => parseHttpUrl(value) !== null, {
      error: "Please enter a full web link that starts with http:// or https://",
    }),
  type: z.enum(RESOURCE_TYPES, { error: "Please choose a resource type." }),
  status: z.enum(STATUSES, { error: "Please choose a study status." }),
  categoryId: uuid.nullable(),
  newCategoryName: z.string().max(200).optional(),
  isFavorite: z.boolean(),
  notes: z
    .string()
    .trim()
    .max(LIMITS.notes, { error: `Notes can be at most ${LIMITS.notes} characters.` }),
  tags: z
    .array(z.string().max(100))
    .max(50)
    .transform(normalizeTagNames)
    .pipe(
      z
        .array(
          z.string().max(LIMITS.tagName, {
            error: `Each tag can be at most ${LIMITS.tagName} characters.`,
          }),
        )
        .max(LIMITS.tagsPerResource, {
          error: `You can add up to ${LIMITS.tagsPerResource} tags per resource.`,
        }),
    ),
});
export type ResourceInput = z.input<typeof resourceInputSchema>;

export const idSchema = uuid;
export const statusSchema = z.enum(STATUSES, { error: "Please choose a study status." });

export const credentialsSchema = z.object({
  email: z
    .string({ error: "Please enter your email address." })
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: "Please enter a valid email address." })),
  password: z
    .string({ error: "Please enter your password." })
    .min(1, { error: "Please enter your password." })
    .max(72, { error: "Passwords can be at most 72 characters." }),
});

export const signupSchema = credentialsSchema.extend({
  password: z
    .string({ error: "Please choose a password." })
    .min(8, { error: "Your password needs at least 8 characters." })
    .max(72, { error: "Passwords can be at most 72 characters." }),
});

/** First human-readable problem from a failed validation. */
export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Please check what you entered and try again.";
}
