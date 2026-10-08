import { Fragment } from "react";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase";
import { deleteCategory } from "@/lib/actions/categories";
import { requirePermission } from "@/lib/staff";
import type { CategoryRow } from "@/lib/database.types";
import DeleteRecordButton from "@/components/admin/DeleteRecordButton";

export default async function CategoriesPage() {
  await requirePermission("catalog.manage");
  const supabase = createServerClient();

  const [{ data: categories }, { data: businesses }] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order").order("name"),
    supabase.from("businesses").select("category_id"),
  ]);

  const all: CategoryRow[] = categories ?? [];
  const listings = new Map<string, number>();
  for (const b of businesses ?? []) {
    listings.set(b.category_id, (listings.get(b.category_id) ?? 0) + 1);
  }

  const roots = all.filter((c) => !c.parent_id);
  const childrenOf = (id: string) => all.filter((c) => c.parent_id === id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Categories</h1>
        <Link
          href="/admin/categories/new"
          className="bg-gray-900 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded"
        >
          + New Category
        </Link>
      </div>

      <p className="text-sm text-gray-500">
        Top-level categories group businesses by type. Sub-categories are the filters visitors use:
        accommodation types on the Accommodations page and experience categories on the Experiences
        page. Tick &ldquo;Show on homepage&rdquo; to feature a category in the Caribbean Experiences grid.
      </p>

      <div className="bg-white border border-gray-200 rounded overflow-hidden">
        {roots.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">No categories yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Category
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">
                  Slug
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Listings
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {roots.map((root) => (
                <Fragment key={root.id}>
                  <CategoryRowView category={root} depth={0} listings={listings.get(root.id) ?? 0} />
                  {childrenOf(root.id).map((child) => (
                    <CategoryRowView
                      key={child.id}
                      category={child}
                      depth={1}
                      listings={listings.get(child.id) ?? 0}
                    />
                  ))}
                  <tr className="border-b border-gray-100">
                    <td colSpan={5} className="px-4 py-2">
                      <Link
                        href={`/admin/categories/new?parent=${root.id}`}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        + Add sub-category to {root.name}
                      </Link>
                    </td>
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function CategoryRowView({
  category,
  depth,
  listings,
}: {
  category: CategoryRow;
  depth: number;
  listings: number;
}) {
  return (
    <tr className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
      <td className="px-4 py-2.5" style={{ paddingLeft: depth ? "2.25rem" : undefined }}>
        <span className={depth === 0 ? "font-semibold text-gray-900" : "text-gray-800"}>
          {depth > 0 && <span className="text-gray-400 mr-1">↳</span>}
          {category.icon ? `${category.icon} ` : ""}
          {category.name}
        </span>
      </td>
      <td className="px-4 py-2.5 text-xs font-mono text-gray-500 hidden md:table-cell">
        {category.slug}
      </td>
      <td className="px-4 py-2.5 text-gray-600">{listings}</td>
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`text-xs px-1.5 py-0.5 rounded font-medium ${
              category.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
            }`}
          >
            {category.is_active ? "Active" : "Inactive"}
          </span>
          {category.is_featured && (
            <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-orange-100 text-orange-600">
              Homepage
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-2.5">
        <div className="flex items-center justify-end gap-3">
          <Link href={`/admin/categories/${category.id}/edit`} className="text-blue-600 hover:underline text-xs">
            Edit
          </Link>
          <DeleteRecordButton name={category.name} action={deleteCategory.bind(null, category.id)} />
        </div>
      </td>
    </tr>
  );
}
