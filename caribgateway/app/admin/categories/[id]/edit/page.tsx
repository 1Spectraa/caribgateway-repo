import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase";
import CategoryForm from "@/components/admin/CategoryForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditCategoryPage({ params }: Props) {
  const { id } = await params;
  const supabase = createServerClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");

  const category = (categories ?? []).find((c) => c.id === id);
  if (!category) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Edit: {category.name}</h1>
      <div className="bg-white border border-gray-200 rounded p-6">
        <CategoryForm categories={categories ?? []} category={category} />
      </div>
    </div>
  );
}
