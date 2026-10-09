"use client";

import { keepFieldsOnSubmit } from "@/components/admin/keep-fields";

import { useActionState, useState } from "react";
import {
  addBusinessMember,
  changeBusinessOwner,
  removeBusinessMember,
  updateBusinessMember,
  type TeamState,
} from "@/lib/actions/team";
import { BUSINESS_RIGHTS, BUSINESS_RIGHT_KEYS, type BusinessRight } from "@/lib/permissions";
import DeleteRecordButton from "@/components/admin/DeleteRecordButton";

const inputClass =
  "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const labelClass = "block text-sm font-medium text-gray-700 mb-1";
const headingClass = "text-sm font-semibold text-gray-500 uppercase tracking-wide";
const buttonClass =
  "bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium px-5 py-2 rounded disabled:opacity-50";

type Viewer = {
  isAdmin: boolean;
  canManageTeam: boolean;
  canCreateAccounts: boolean;
  /** The rights the signed-in person holds on this listing. */
  rights: BusinessRight[];
};

type Member = {
  profileId: string;
  name: string;
  email: string;
  rights: BusinessRight[];
  /** Whether the viewer may change or remove this person (see lib/actions/team.ts). */
  canManage: boolean;
};
type Account = { id: string; name: string; email: string };
type Owner = { id: string; name: string };

interface Props {
  businessId: string;
  business: { name: string; ownerId: string | null; ownerName: string | null };
  members: Member[];
  accounts: Account[];
  owners: Owner[];
  viewer: Viewer;
}

function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
      {message}
    </div>
  );
}

function accountLabel(account: Account): string {
  return account.email && account.email !== account.name
    ? `${account.name} (${account.email})`
    : account.name;
}

/** Owner picker. Admins only. */
function OwnerForm({
  businessId,
  ownerId,
  ownerName,
  owners,
}: {
  businessId: string;
  ownerId: string | null;
  ownerName: string | null;
  owners: Owner[];
}) {
  const [state, formAction, pending] = useActionState<TeamState, FormData>(
    changeBusinessOwner.bind(null, businessId),
    null,
  );

  // A suspended owner is not in the list. Keep them as an option, so saving does not clear them by accident.
  const missingOwner =
    ownerId && !owners.some((o) => o.id === ownerId)
      ? { id: ownerId, name: `${ownerName ?? "Account"} (inactive)` }
      : null;
  const options = missingOwner ? [...owners, missingOwner] : owners;

  return (
    <form onSubmit={keepFieldsOnSubmit(formAction)} className="space-y-3">
      <FormError message={state?.error} />
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-full sm:w-72">
          <label htmlFor="owner_id" className={labelClass}>
            Owner
          </label>
          <select id="owner_id" name="owner_id" defaultValue={ownerId ?? ""} className={inputClass}>
            <option value="">No owner</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={pending} className={buttonClass}>
          {pending ? "Saving…" : "Save owner"}
        </button>
      </div>
    </form>
  );
}

/**
 * Rights picker: all of the viewer's rights, or chosen ones. Rights the viewer
 * does not hold are greyed out, because they cannot be given.
 */
function RightsFields({
  viewer,
  mode,
  selected,
}: {
  viewer: Viewer;
  mode: "all" | "custom";
  selected: BusinessRight[];
}) {
  return (
    <fieldset className="space-y-3">
      <legend className={labelClass}>Permissions</legend>
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-700">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="rights_mode"
            value="all"
            defaultChecked={mode === "all"}
            className="h-4 w-4"
          />
          {viewer.isAdmin ? "All permissions" : "All of my permissions"}
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="rights_mode"
            value="custom"
            defaultChecked={mode === "custom"}
            className="h-4 w-4"
          />
          Choose permissions
        </label>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {BUSINESS_RIGHT_KEYS.map((key) => {
          const held = viewer.rights.includes(key);
          return (
            <label
              key={key}
              className={`flex items-start gap-3 border border-gray-200 rounded p-3 ${
                held ? "cursor-pointer hover:border-gray-300" : "opacity-50"
              }`}
            >
              <input
                type="checkbox"
                name="rights"
                value={key}
                defaultChecked={held && selected.includes(key)}
                disabled={!held}
                className="mt-0.5 h-4 w-4"
              />
              <span>
                <span className="block text-sm font-medium text-gray-800">
                  {BUSINESS_RIGHTS[key].label}
                </span>
                <span className="block text-xs text-gray-500">
                  {BUSINESS_RIGHTS[key].description}
                </span>
              </span>
            </label>
          );
        })}
      </div>
      {!viewer.isAdmin && (
        <p className="text-xs text-gray-500">
          You can only give rights you hold. Greyed-out rights are not included when you save.
        </p>
      )}
    </fieldset>
  );
}

/** Inline form to change one team member's rights. Each row has its own form and its own error. */
function MemberEditForm({
  businessId,
  member,
  viewer,
}: {
  businessId: string;
  member: Member;
  viewer: Viewer;
}) {
  const [state, formAction, pending] = useActionState<TeamState, FormData>(
    updateBusinessMember.bind(null, businessId, member.profileId),
    null,
  );

  return (
    <form onSubmit={keepFieldsOnSubmit(formAction)} className="space-y-4 bg-gray-50 border border-gray-200 rounded p-4">
      <FormError message={state?.error} />
      <RightsFields
        viewer={viewer}
        mode="custom"
        selected={member.rights}
      />
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Saving…" : "Save access"}
      </button>
    </form>
  );
}

function MemberRow({
  businessId,
  member,
  viewer,
}: {
  businessId: string;
  member: Member;
  viewer: Viewer;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <li className="px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900">{member.name}</p>
          {member.email && <p className="text-xs text-gray-500">{member.email}</p>}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {member.rights.length === 0 && (
              <span className="text-xs text-gray-400 italic">No permissions</span>
            )}
            {member.rights.map((right) => (
              <span key={right} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                {BUSINESS_RIGHTS[right].label}
              </span>
            ))}
          </div>
        </div>

        {viewer.canManageTeam && member.canManage && (
          <div className="flex items-center gap-4 text-sm">
            <button
              type="button"
              aria-expanded={editing}
              onClick={() => setEditing((open) => !open)}
              className="text-gray-600 hover:text-gray-900"
            >
              {editing ? "Cancel" : "Edit access"}
            </button>
            <DeleteRecordButton
              name={member.name}
              action={removeBusinessMember.bind(null, businessId, member.profileId)}
            />
          </div>
        )}
        {viewer.canManageTeam && !member.canManage && (
          <span className="text-xs text-gray-400">Has rights you do not hold</span>
        )}
      </div>

      {editing && (
        <div className="mt-3">
          <MemberEditForm businessId={businessId} member={member} viewer={viewer} />
        </div>
      )}
    </li>
  );
}

/** Adds someone to the team. Admins can pick an existing account or create one. Others can only create one. */
function AddMemberForm({
  businessId,
  viewer,
  accounts,
}: {
  businessId: string;
  viewer: Viewer;
  accounts: Account[];
}) {
  const [state, formAction, pending] = useActionState<TeamState, FormData>(
    addBusinessMember.bind(null, businessId),
    null,
  );
  const [mode, setMode] = useState<"existing" | "new">(viewer.isAdmin ? "existing" : "new");

  return (
    <form onSubmit={keepFieldsOnSubmit(formAction)} className="space-y-5">
      <FormError message={state?.error} />

      {viewer.isAdmin ? (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-700">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="mode"
                value="existing"
                checked={mode === "existing"}
                onChange={() => setMode("existing")}
                className="h-4 w-4"
              />
              Existing account
            </label>
            <label
              className={`flex items-center gap-2 ${
                viewer.canCreateAccounts ? "cursor-pointer" : "opacity-50"
              }`}
            >
              <input
                type="radio"
                name="mode"
                value="new"
                checked={mode === "new"}
                onChange={() => setMode("new")}
                disabled={!viewer.canCreateAccounts}
                className="h-4 w-4"
              />
              New person
            </label>
          </div>
          {!viewer.canCreateAccounts && (
            <p className="text-xs text-gray-500">You can&apos;t create new accounts.</p>
          )}
        </div>
      ) : (
        <input type="hidden" name="mode" value="new" />
      )}

      {mode === "existing" && (
        <div>
          <label htmlFor="profile_id" className={labelClass}>
            Account <span className="text-red-500">*</span>
          </label>
          <select id="profile_id" name="profile_id" required defaultValue="" className={inputClass}>
            <option value="">Choose an account</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {accountLabel(account)}
              </option>
            ))}
          </select>
          {accounts.length === 0 && (
            <p className="text-xs text-gray-500 mt-1">Every active account is already on this listing.</p>
          )}
        </div>
      )}

      {mode === "new" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>
              Full name <span className="text-red-500">*</span>
            </label>
            <input name="full_name" type="text" required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>
              Email <span className="text-red-500">*</span>
            </label>
            <input name="email" type="email" required className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>
              Password <span className="text-red-500">*</span>
            </label>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              className={inputClass}
            />
            <p className="text-xs text-gray-500 mt-1">
              Give them this password. They cannot change it yet.
            </p>
          </div>
        </div>
      )}

      <RightsFields viewer={viewer} mode="all" selected={[]} />

      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Adding…" : "Add to team"}
      </button>
    </form>
  );
}

export default function TeamManager({ businessId, business, members, accounts, owners, viewer }: Props) {
  return (
    <div className="space-y-10">
      {/* Owner */}
      <section className="space-y-3">
        <h2 className={headingClass}>Owner</h2>
        <div>
          <p
            className={
              business.ownerId ? "text-sm font-medium text-gray-900" : "text-sm italic text-gray-400"
            }
          >
            {business.ownerName ?? "No owner"}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">The owner holds every right on this listing.</p>
        </div>
        {viewer.isAdmin && (
          // Keyed by owner, so the select remounts with the saved owner as its default.
          <OwnerForm
            key={business.ownerId ?? ""}
            businessId={businessId}
            ownerId={business.ownerId}
            ownerName={business.ownerName}
            owners={owners}
          />
        )}
      </section>

      {/* People. Each row is keyed by its rights, so the editor closes once a change is saved. */}
      <section className="space-y-3">
        <h2 className={headingClass}>People</h2>
        {!viewer.isAdmin && (
          <p className="text-xs text-gray-500">
            You can change or remove people whose rights are all within your own.
          </p>
        )}
        {members.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No one else is on this listing yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100 border border-gray-200 rounded">
            {members.map((member) => (
              <MemberRow
                key={`${member.profileId}:${member.rights.join(",")}`}
                businessId={businessId}
                member={member}
                viewer={viewer}
              />
            ))}
          </ul>
        )}
      </section>

      {/* Add a person */}
      {viewer.canManageTeam && (
        <section className="space-y-3">
          <h2 className={headingClass}>Add a person</h2>
          {viewer.isAdmin || viewer.canCreateAccounts ? (
            <AddMemberForm businessId={businessId} viewer={viewer} accounts={accounts} />
          ) : (
            <p className="text-sm text-gray-500">
              You can&apos;t create new accounts. Ask an administrator to add this person.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
