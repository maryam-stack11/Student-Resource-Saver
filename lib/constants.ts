export const RESOURCE_TYPES = [
  "youtube",
  "github",
  "pdf",
  "drive",
  "course",
  "website",
  "other",
] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];

export const TYPE_LABELS: Record<ResourceType, string> = {
  youtube: "YouTube",
  github: "GitHub",
  pdf: "PDF",
  drive: "Google Drive",
  course: "Course",
  website: "Website / Article",
  other: "Other",
};

export const STATUSES = ["to_study", "in_progress", "completed"] as const;
export type ResourceStatus = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<ResourceStatus, string> = {
  to_study: "To Study",
  in_progress: "In Progress",
  completed: "Completed",
};

export const SORTS = ["newest", "oldest", "title"] as const;
export type SortOption = (typeof SORTS)[number];

export const SORT_LABELS: Record<SortOption, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  title: "Title A–Z",
};

/** How many resources are shown before the "Load more" button appears. */
export const PAGE_SIZE = 24;

export const LIMITS = {
  title: 200,
  url: 2048,
  notes: 5000,
  categoryName: 50,
  tagName: 30,
  tagsPerResource: 10,
} as const;

export function isResourceType(value: unknown): value is ResourceType {
  return RESOURCE_TYPES.some((type) => type === value);
}

export function isResourceStatus(value: unknown): value is ResourceStatus {
  return STATUSES.some((status) => status === value);
}

export function isSortOption(value: unknown): value is SortOption {
  return SORTS.some((sort) => sort === value);
}
