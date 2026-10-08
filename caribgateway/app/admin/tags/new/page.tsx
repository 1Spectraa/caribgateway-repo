import TagForm from "@/components/admin/TagForm";

export default function NewTagPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">New Tag</h1>
      <div className="bg-white border border-gray-200 rounded p-6">
        <TagForm />
      </div>
    </div>
  );
}
