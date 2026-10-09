"use server";

import { revalidatePath } from "next/cache";
import { authorize } from "@/lib/staff";
import { createServerClient } from "@/lib/supabase";

export type ContactState = { error: string } | { sent: true } | null;

type ActionState = { error: string } | null;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Saves a message from the Contact page. Anyone may send one, so the input is checked here too. */
export async function sendContactMessage(_: ContactState, formData: FormData): Promise<ContactState> {
  // A field people never see. Bots fill it in, so their messages are dropped without an error.
  if (String(formData.get("website") ?? "").trim() !== "") return { sent: true };

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name || name.length > 120) return { error: "Please enter your name." };
  if (!EMAIL.test(email) || email.length > 200) return { error: "Please enter a valid email address." };
  if (message.length < 10) return { error: "Please write a message of at least 10 characters." };
  if (message.length > 2000) return { error: "Please keep your message under 2,000 characters." };

  const { error } = await createServerClient().from("contact_messages").insert({ name, email, message });
  if (error) {
    console.error("[contact] could not save the message:", error.message);
    return { error: "We could not send your message. Please try again in a moment." };
  }
  return { sent: true };
}

/** Deletes a message from the admin panel. Needs 'Edit site content'. */
export async function deleteContactMessage(id: string): Promise<ActionState> {
  if (!UUID.test(id)) return { error: "That message doesn't exist." };

  const auth = await authorize("site.content");
  if ("error" in auth) return auth;

  const { error } = await createServerClient().from("contact_messages").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/messages");
  return null;
}
