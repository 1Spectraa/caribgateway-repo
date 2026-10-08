import { createServerClient } from "@/lib/supabase";

/**
 * Sets the owner of a business, or clears it. The new owner is taken off the
 * team, since owners already hold every right. Server only.
 * Returns an error message, or null on success.
 */
export async function setBusinessOwner(businessId: string, ownerId: string | null): Promise<string | null> {
  const service = createServerClient();

  const { error } = await service
    .from("businesses")
    .update({ owner_id: ownerId })
    .eq("id", businessId);
  if (error) return error.message;

  if (ownerId) {
    await service
      .from("business_members")
      .delete()
      .eq("business_id", businessId)
      .eq("profile_id", ownerId);
  }
  return null;
}
