import type { ResourceStatus, ResourceType } from "@/lib/constants";

/** A category (subject) with how many resources it holds. */
export type Category = {
  id: string;
  name: string;
};

export type CategoryWithCount = Category & { resourceCount: number };

/** A tag with how many resources use it. */
export type Tag = {
  id: string;
  name: string;
};

export type TagWithCount = Tag & { resourceCount: number };

/** A saved resource together with its category and tags. */
export type Resource = {
  id: string;
  title: string;
  url: string;
  type: ResourceType;
  status: ResourceStatus;
  isFavorite: boolean;
  notes: string;
  createdAt: string;
  category: Category | null;
  tags: Tag[];
};

export type StatusCounts = Record<ResourceStatus, number> & { total: number };

/** What every server action returns, so the UI can show a toast. */
export type ActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string };
