import type { Metadata } from "next";
import { getCategories } from "@/lib/queries";
import { CategoryManager } from "@/components/category-manager";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Categories</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Your subjects. Deleting a category never deletes its resources.
        </p>
      </div>
      <CategoryManager categories={categories} />
    </div>
  );
}
