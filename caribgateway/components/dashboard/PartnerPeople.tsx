"use client";

import { useActionState, useId, useState, type ReactNode } from "react";
import { keepFieldsOnSubmit } from "@/components/admin/keep-fields";
import { Icon } from "@/components/dashboard/icons";
import { Notice, buttonClass, cardClass, cx, hintClass, inputClass, labelClass } from "@/components/dashboard/ui";
import { addBusinessMember, removeBusinessMember, updateBusinessMember, type TeamState } from "@/lib/actions/team";
import { BUSINESS_RIGHTS, BUSINESS_RIGHT_KEYS, type BusinessRight } from "@/lib/permissions";

/** A person on the team, as the people page passes them in. */
export type TeamMember = {
  profileId: string;
  name: string;
  email: string;
  rights: BusinessRight[];
  /** Whether the viewer may change or remove this person. The same rule as lib/actions/team.ts. */
  canManage: boolean;
  isYou: boolean;
};

export type TeamOwner = {
  name: string;
  email: string;
  isYou: boolean;
};

type Props = {
  businessId: string;
  owner: TeamOwner | null;
  members: TeamMember[];
  /** The rights the signed-in person holds on this listing. */
  viewerRights: BusinessRight[];
  /** Whether the viewer may create accounts for the people they add. */
  canAddPeople: boolean;
};

/** Two letters for the avatar, from the first two words of the name. */
function initialsOf(name: string): string {
  const letters = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
  return letters || "?";
}

function Avatar({ name }: { name: string }) {
  return (
    <span
      aria-hidden="true"
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-navy/10 text-sm font-semibold text-brand-navy"
    >
      {initialsOf(name)}
    </span>
  );
}

const PILL_TONE = {
  neutral: "bg-slate-100 text-slate-700",
  owner: "bg-brand-navy text-white",
  you: "bg-brand-teal/10 text-brand-teal",
} as const;

function Pill({ tone = "neutral", children }: { tone?: keyof typeof PILL_TONE; children: ReactNode }) {
  return (
    <span
      className={cx(
        "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium",
        PILL_TONE[tone],
      )}
    >
      {children}
    </span>
  );
}

/**
 * The rights choice shared by the add and edit forms: all of the viewer's rights, or the ones ticked.
 * Rights the viewer does not hold are greyed out and are not sent.
 */
function RightsFields({
  viewerRights,
  selected,
  mode,
}: {
  viewerRights: BusinessRight[];
  selected: BusinessRight[];
  mode: "all" | "custom";
}) {
  return (
    <fieldset className="space-y-3">
      <legend className={labelClass}>Permissions</legend>

      <div className="flex flex-col gap-2 text-sm text-slate-700 sm:flex-row sm:gap-6">
        <label className="flex cursor-pointer items-center gap-2">
          <input type="radio" name="rights_mode" value="all" defaultChecked={mode === "all"} className="h-4 w-4 accent-brand-teal" />
          All of my permissions
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <input type="radio" name="rights_mode" value="custom" defaultChecked={mode === "custom"} className="h-4 w-4 accent-brand-teal" />
          Choose permissions
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {BUSINESS_RIGHT_KEYS.map((key) => {
          const held = viewerRights.includes(key);
          return (
            <label
              key={key}
              className={cx(
                "flex items-start gap-3 rounded-xl border p-3.5",
                held ? "cursor-pointer border-slate-200 hover:border-slate-300" : "border-slate-100 bg-slate-50",
              )}
            >
              <input
                type="checkbox"
                name="rights"
                value={key}
                defaultChecked={held && selected.includes(key)}
                disabled={!held}
                className="mt-0.5 h-4 w-4 accent-brand-teal"
              />
              <span className="min-w-0">
                <span className={cx("block text-sm font-medium", held ? "text-slate-800" : "text-slate-400")}>
                  {BUSINESS_RIGHTS[key].label}
                </span>
                <span className={cx("mt-0.5 block text-xs leading-5", held ? "text-slate-500" : "text-slate-400")}>
                  {BUSINESS_RIGHTS[key].description}
                </span>
              </span>
            </label>
          );
        })}
      </div>

      <p className={hintClass}>You can only give permissions you have. Greyed-out ones are left out when you save.</p>
    </fieldset>
  );
}

/** The form for a new person. Their account is created with the password given here. */
function AddPersonForm({ businessId, viewerRights }: { businessId: string; viewerRights: BusinessRight[] }) {
  const id = useId();
  const [state, formAction, pending] = useActionState<TeamState, FormData>(
    addBusinessMember.bind(null, businessId),
    null,
  );

  return (
    <form onSubmit={keepFieldsOnSubmit(formAction)} className="space-y-6">
      {state?.error && <Notice tone="error">{state.error}</Notice>}
      <input type="hidden" name="mode" value="new" />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-name`} className={labelClass}>
            Full name <span className="text-rose-600">*</span>
          </label>
          <input id={`${id}-name`} name="full_name" type="text" required autoComplete="off" className={inputClass} />
        </div>
        <div>
          <label htmlFor={`${id}-email`} className={labelClass}>
            Email <span className="text-rose-600">*</span>
          </label>
          <input id={`${id}-email`} name="email" type="email" required className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`${id}-password`} className={labelClass}>
            Password <span className="text-rose-600">*</span>
          </label>
          <input
            id={`${id}-password`}
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            className={inputClass}
          />
          <p className={hintClass}>Share this password with them so they can sign in.</p>
        </div>
      </div>

      <RightsFields viewerRights={viewerRights} selected={[]} mode="custom" />

      <button type="submit" disabled={pending} className={buttonClass("primary")}>
        {pending ? "Adding…" : "Add person"}
      </button>
    </form>
  );
}

/** Inline form to change one person's permissions. Only shown for people the viewer can manage. */
function MemberEditForm({
  businessId,
  member,
  viewerRights,
}: {
  businessId: string;
  member: TeamMember;
  viewerRights: BusinessRight[];
}) {
  const [state, formAction, pending] = useActionState<TeamState, FormData>(
    updateBusinessMember.bind(null, businessId, member.profileId),
    null,
  );

  return (
    <form onSubmit={keepFieldsOnSubmit(formAction)} className="space-y-5">
      {state?.error && <Notice tone="error">{state.error}</Notice>}
      <RightsFields viewerRights={viewerRights} selected={member.rights} mode="custom" />
      <button type="submit" disabled={pending} className={buttonClass("primary")}>
        {pending ? "Saving…" : "Save access"}
      </button>
    </form>
  );
}

/** Takes one person off the listing after a confirmation. Their account is kept. */
function RemoveMemberForm({ businessId, member }: { businessId: string; member: TeamMember }) {
  const [state, removeAction, removing] = useActionState<TeamState, FormData>(
    removeBusinessMember.bind(null, businessId, member.profileId),
    null,
  );

  return (
    <form
      className="flex flex-col items-start gap-2"
      onSubmit={(event) => {
        if (!window.confirm(`Remove ${member.name} from this listing? They keep their account.`)) {
          event.preventDefault();
          return;
        }
        keepFieldsOnSubmit(removeAction)(event);
      }}
    >
      <button type="submit" disabled={removing} className={buttonClass("danger")}>
        <Icon name="trash" className="h-4 w-4" />
        {removing ? "Removing…" : "Remove"}
      </button>
      {state?.error && <Notice tone="error">{state.error}</Notice>}
    </form>
  );
}

function MemberCard({
  businessId,
  member,
  viewerRights,
}: {
  businessId: string;
  member: TeamMember;
  viewerRights: BusinessRight[];
}) {
  const [editing, setEditing] = useState(false);

  return (
    <article className={cx(cardClass, "p-5 sm:p-6")}>
      <div className="flex items-start gap-4">
        <Avatar name={member.name} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="break-words text-base font-semibold text-brand-navy">{member.name}</h3>
            {member.isYou && <Pill tone="you">You</Pill>}
          </div>
          {member.email && <p className="mt-0.5 break-all text-sm text-slate-500">{member.email}</p>}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {member.rights.length === 0 ? (
              <span className="text-sm text-slate-500">No permissions</span>
            ) : (
              member.rights.map((right) => <Pill key={right}>{BUSINESS_RIGHTS[right].label}</Pill>)
            )}
          </div>
        </div>
      </div>

      {member.canManage ? (
        <div className="mt-5 flex flex-wrap items-start gap-2 border-t border-slate-100 pt-5">
          <button
            type="button"
            aria-expanded={editing}
            onClick={() => setEditing((open) => !open)}
            className={buttonClass("secondary")}
          >
            <Icon name="pencil" className="h-4 w-4" />
            {editing ? "Cancel" : "Edit access"}
          </button>
          <RemoveMemberForm businessId={businessId} member={member} />
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-500">Has more access than you</p>
      )}

      {editing && member.canManage && (
        <div className="mt-5 border-t border-slate-100 pt-5">
          <MemberEditForm businessId={businessId} member={member} viewerRights={viewerRights} />
        </div>
      )}
    </article>
  );
}

function OwnerCard({ owner }: { owner: TeamOwner }) {
  return (
    <article className={cx(cardClass, "p-5 sm:p-6")}>
      <div className="flex items-start gap-4">
        <Avatar name={owner.name} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="break-words text-base font-semibold text-brand-navy">{owner.name}</h3>
            <Pill tone="owner">Owner</Pill>
            {owner.isYou && <Pill tone="you">You</Pill>}
          </div>
          {owner.email && <p className="mt-0.5 break-all text-sm text-slate-500">{owner.email}</p>}
          <p className="mt-3 text-sm text-slate-500">Can do everything on this listing.</p>
        </div>
      </div>
    </article>
  );
}

/** The people section: the owner and the team, then the add form, or a note when the viewer cannot add people. */
export default function PartnerPeople({ businessId, owner, members, viewerRights, canAddPeople }: Props) {
  return (
    <div className="space-y-10">
      <div className="space-y-4">
        {owner && <OwnerCard owner={owner} />}
        <ul className="space-y-4">
          {members.map((member) => (
            // Keyed by rights, so an editor closes once a change is saved.
            <li key={`${member.profileId}:${member.rights.join(",")}`}>
              <MemberCard businessId={businessId} member={member} viewerRights={viewerRights} />
            </li>
          ))}
        </ul>
        {members.length === 0 && <p className="text-sm text-slate-500">Nobody else is on this listing yet.</p>}
      </div>

      <section className="space-y-4">
        <h3 className="text-base font-semibold text-brand-navy">Add a person</h3>
        {canAddPeople ? (
          // Keyed by the number of people, so the form clears once someone is added.
          <div className={cx(cardClass, "p-5 sm:p-6")}>
            <AddPersonForm key={members.length} businessId={businessId} viewerRights={viewerRights} />
          </div>
        ) : (
          <p className="rounded-2xl bg-slate-50 px-5 py-4 text-sm leading-6 text-slate-600 ring-1 ring-inset ring-slate-200">
            Your account can&apos;t add new people yet. Ask an administrator to add them to this listing.
          </p>
        )}
      </section>
    </div>
  );
}
