import { requirePermission } from "@/lib/staff";
import { createServerClient } from "@/lib/supabase";
import { deleteContactMessage } from "@/lib/actions/contact";
import DeleteRecordButton from "@/components/admin/DeleteRecordButton";

/** Messages sent from the public Contact page. Anyone with 'Edit site content' can read and delete them. */
export default async function MessagesPage() {
  await requirePermission("site.content");

  const { data: messages, error } = await createServerClient()
    .from("contact_messages")
    .select("id, name, email, message, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Messages</h1>
        <p className="mt-0.5 text-sm text-gray-500">Sent from the Contact page. Newest first.</p>
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Messages couldn&apos;t be loaded: {error.message}. If this mentions a missing table, run migration 0019 in
          Supabase, then reload.
        </div>
      )}

      {!error && (messages ?? []).length === 0 ? (
        <div className="rounded border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          No messages yet.
        </div>
      ) : (
        <ul className="divide-y divide-gray-100 rounded border border-gray-200 bg-white">
          {(messages ?? []).map((message) => (
            <li key={message.id} className="px-4 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">{message.name}</p>
                  <a href={`mailto:${message.email}`} className="break-all text-sm text-blue-600 hover:underline">
                    {message.email}
                  </a>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {new Date(message.created_at).toISOString().slice(0, 16).replace("T", " ")} UTC
                  </p>
                </div>
                <DeleteRecordButton name={message.name} action={deleteContactMessage.bind(null, message.id)} />
              </div>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-gray-800">{message.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
