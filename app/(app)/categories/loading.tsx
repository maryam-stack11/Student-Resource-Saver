import { ListPageSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl">
      <ListPageSkeleton />
    </div>
  );
}
