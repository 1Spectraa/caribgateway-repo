import Link from "next/link";
import { createServerClient } from "@/lib/supabase";
import { deleteTag } from "@/lib/actions/tags";
import { requirePermission } from "@/lib/staff";
import DeleteRecordButton from "@/components/admin/DeleteRecordButton";

export default async function TagsPage() {
  await requirePermission("catalog.manage");
  const supabase = createServerClient();

  const [{ data: tags }, { data: assignments }] = await Promise.all([
    supabase.from("tags").select("id, name, slug, color, is_active").order("name"),
    supabase.from("business_tags").select("tag_id"),
  ]);

  const usage = new Map<string, number>();
  for (const a of assignments ?? []) {
    usage.set(a.tag_id, (usage.get(a.tag_id) ?? 0) + 1);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Tags</h1>
        <Link
          href="/admin/tags/new"
          className="bg-gray-900 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded"
        >
          + New Tag
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded overflow-hidden">
        {!tags || tags.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">No tags yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Tag
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Used by
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {tags.map((tag) => (
                <tr key={tag.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                        aria-hidden="true"
                      />
                      <div>
                        <div className="font-medium text-gray-900">{tag.name}</div>
                        <div className="text-xs text-gray-400 font-mono">{tag.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-gray-600">
                    {usage.get(tag.id) ?? 0} business{(usage.get(tag.id) ?? 0) === 1 ? "" : "es"}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        tag.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {tag.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-3">
                      <Link href={`/admin/tags/${tag.id}/edit`} className="text-blue-600 hover:underline text-xs">
                        Edit
                      </Link>
                      <DeleteRecordButton name={tag.name} action={deleteTag.bind(null, tag.id)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
