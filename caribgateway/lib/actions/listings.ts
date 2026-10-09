"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase";
import { revalidatePublicSite } from "@/lib/revalidate";
import { authorize, authorizeBusinessRight, can, isListingOwner } from "@/lib/staff";

export type ListingActionState = { error: string } | null;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function refreshLists(businessId: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/approvals");
  revalidatePath("/admin/businesses");
  revalidatePath("/admin/accommodations");
  revalidatePath(`/admin/businesses/${businessId}/edit`);
  revalidatePath("/dashboard", "layout");
}

async function loadListing(businessId: string) {
  const { data } = await createServerClient()
    .from("businesses")
    .select("status, is_active")
    .eq("id", businessId)
    .maybeSingle();
  return data;
}

/** The operator sends a draft to the administrators for approval. */
export async function submitListing(businessId: string): Promise<ListingActionState> {
  if (!UUID.test(businessId)) return { error: "That listing doesn't exist." };

  const auth = await authorizeBusinessRight(businessId, "details");
  if ("error" in auth) return auth;

  const listing = await loadListing(businessId);
  if (!listing) return { error: "That listing doesn't exist." };
  if (listing.status !== "draft") return { error: "Only drafts can be sent for approval." };

  const { error } = await createServerClient()
    .from("businesses")
    .update({ status: "pending", submitted_at: new Date().toISOString(), review_note: null })
    .eq("id", businessId)
    .eq("status", "draft");
  if (error) return { error: error.message };

  refreshLists(businessId);
  return null;
}

/** An administrator approves a listing. It goes live at once, and the operator can switch it off. */
export async function approveListing(businessId: string): Promise<ListingActionState> {
  if (!UUID.test(businessId)) return { error: "That listing doesn't exist." };

  const auth = await authorize("listings.publish");
  if ("error" in auth) return auth;
  const { staff } = auth;

  const listing = await loadListing(businessId);
  if (!listing) return { error: "That listing doesn't exist." };
  if (listing.status !== "pending" && listing.status !== "draft") {
    return { error: "Only listings waiting for approval can be approved." };
  }

  const { error } = await createServerClient()
    .from("businesses")
    .update({
      status: "published",
      is_active: true,
      approved_at: new Date().toISOString(),
      approved_by: staff.isRoot ? null : staff.id,
      review_note: null,
    })
    .eq("id", businessId);
  if (error) return { error: error.message };

  revalidatePublicSite();
  refreshLists(businessId);
  return null;
}

/** An administrator sends a listing back to draft, with the reason the operator will see. */
export async function rejectListing(
  businessId: string,
  _: ListingActionState,
  formData: FormData,
): Promise<ListingActionState> {
  if (!UUID.test(businessId)) return { error: "That listing doesn't exist." };

  const auth = await authorize("listings.publish");
  if ("error" in auth) return auth;

  const note = ((formData.get("note") as string | null) ?? "").trim();
  if (note.length < 5) return { error: "Say what needs to change, so the operator knows what to fix." };
  if (note.length > 1000) return { error: "Keep the note under 1,000 characters." };

  const listing = await loadListing(businessId);
  if (!listing) return { error: "That listing doesn't exist." };
  if (listing.status !== "pending" && listing.status !== "draft") {
    return { error: "Only listings waiting for approval can be sent back." };
  }

  const { error } = await createServerClient()
    .from("businesses")
    .update({ status: "draft", review_note: note })
    .eq("id", businessId);
  if (error) return { error: error.message };

  refreshLists(businessId);
  return null;
}

/** Turns an approved listing on or off for visitors. The owner and administrators can do this. */
export async function setListingOnline(businessId: string, online: boolean): Promise<ListingActionState> {
  if (!UUID.test(businessId)) return { error: "That listing doesn't exist." };

  const auth = await authorize("listings.manage_all", "listings.manage_own", "listings.create");
  if ("error" in auth) return auth;
  const { staff } = auth;

  if (!can(staff, "listings.publish") && !(await isListingOwner(staff, businessId))) {
    return { error: "Only the owner or an administrator can turn this listing on or off." };
  }

  const listing = await loadListing(businessId);
  if (!listing) return { error: "That listing doesn't exist." };
  if (listing.status !== "published") {
    return { error: "Only approved listings can be turned on or off. Send drafts for approval first." };
  }

  const { error } = await createServerClient()
    .from("businesses")
    .update({ is_active: online })
    .eq("id", businessId);
  if (error) return { error: error.message };

  revalidatePublicSite();
  refreshLists(businessId);
  return null;
}
