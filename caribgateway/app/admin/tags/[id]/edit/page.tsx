import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase";
import TagForm from "@/components/admin/TagForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditTagPage({ params }: Props) {
  const { id } = await params;
  const supabase = createServerClient();

  const { data: tag } = await supabase.from("tags").select("*").eq("id", id).single();
  if (!tag) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Edit: {tag.name}</h1>
      <div className="bg-white border border-gray-200 rounded p-6">
        <TagForm tag={tag} />
      </div>
    </div>
  );
}
