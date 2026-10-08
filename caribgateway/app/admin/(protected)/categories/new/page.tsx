import { createServerClient } from "@/lib/supabase";
import { requirePermission } from "@/lib/staff";
import CategoryForm from "@/components/admin/CategoryForm";

interface Props {
  searchParams: Promise<{ parent?: string }>;
}

export default async function NewCategoryPage({ searchParams }: Props) {
  await requirePermission("catalog.manage");
  const { parent } = await searchParams;
  const supabase = createServerClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">New Category</h1>
      <div className="bg-white border border-gray-200 rounded p-6">
        <CategoryForm categories={categories ?? []} defaultParentId={parent} />
      </div>
    </div>
  );
}
