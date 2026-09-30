import type { ComponentType, SVGProps } from "react";
import { TYPE_LABELS, type ResourceType } from "@/lib/constants";
import {
  CapIcon,
  CloudIcon,
  CodeIcon,
  FileIcon,
  GlobeIcon,
  LinkIcon,
  PlayIcon,
} from "@/components/icons";

const TYPE_STYLE: Record<
  ResourceType,
  { icon: ComponentType<SVGProps<SVGSVGElement>>; className: string }
> = {
  youtube: { icon: PlayIcon, className: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300" },
  github: { icon: CodeIcon, className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200" },
  pdf: { icon: FileIcon, className: "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300" },
  drive: { icon: CloudIcon, className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
  course: { icon: CapIcon, className: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300" },
  website: { icon: GlobeIcon, className: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300" },
  other: { icon: LinkIcon, className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200" },
};

/** Small coloured label showing what kind of resource this is. */
export function TypeBadge({ type }: { type: ResourceType }) {
  const { icon: TypeIcon, className } = TYPE_STYLE[type];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${className}`}
    >
      <TypeIcon className="size-3.5" />
      {TYPE_LABELS[type]}
    </span>
  );
}
