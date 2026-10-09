"use client";

import { keepFieldsOnSubmit } from "@/components/admin/keep-fields";

import { useActionState, useState } from "react";
import { createAccount, updateAccount, type AccountState } from "@/lib/actions/accounts";
import {
  ACCOUNT_TYPES,
  PERMISSIONS,
  PERMISSION_KEYS,
  PRESETS,
  type AccountType,
  type PermissionKey,
} from "@/lib/permissions";
import type { BusinessOption } from "@/lib/account-options";

const inputClass =
  "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const labelClass = "block text-sm font-medium text-gray-700 mb-1";
const headingClass = "text-sm font-semibold text-gray-500 uppercase tracking-wide";

type AccountFormProps = {
  account?: {
    id: string;
    fullName: string;
    email: string;
    accountType: AccountType;
    isActive: boolean;
    permissions: PermissionKey[];
  };
  /** Every business, with its owner, for the "Listings owned" picker. */
  businesses: BusinessOption[];
  /** The signed-in account is editing itself. It cannot suspend itself or remove its own access. */
  isSelf?: boolean;
};

function withItem<T>(set: Set<T>, item: T, on: boolean): Set<T> {
  const next = new Set(set);
  if (on) next.add(item);
  else next.delete(item);
  return next;
}

export default function AccountForm({ account, businesses, isSelf = false }: AccountFormProps) {
  const action = account ? updateAccount.bind(null, account.id) : createAccount;
  const [state, formAction, pending] = useActionState<AccountState, FormData>(action, null);

  const [accountType, setAccountType] = useState<AccountType>(account?.accountType ?? "user");
  const [isActive, setIsActive] = useState(account?.isActive ?? true);
  const [granted, setGranted] = useState<Set<PermissionKey>>(new Set(account?.permissions ?? []));
  const [ticked, setTicked] = useState<Set<string>>(
    () => new Set(businesses.filter((b) => account && b.ownerId === account.id).map((b) => b.id)),
  );
  const [filter, setFilter] = useState("");

  function chooseType(type: AccountType) {
    setAccountType(type);
    // New accounts start with the preset for their type. Existing accounts keep their permissions.
    if (!account) setGranted(new Set(PRESETS[ACCOUNT_TYPES[type].preset].permissions));
  }

  const needle = filter.trim().toLowerCase();

  return (
    <form onSubmit={keepFieldsOnSubmit(formAction)} className="space-y-8 max-w-3xl">
      {state?.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {state.error}
        </div>
      )}

      {/* Details */}
      <section className="space-y-4">
        <h3 className={headingClass}>Account</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>
              Full name <span className="text-red-500">*</span>
            </label>
            <input name="full_name" type="text" required defaultValue={account?.fullName ?? ""} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>
              Email <span className="text-red-500">*</span>
            </label>
            <input name="email" type="email" required defaultValue={account?.email ?? ""} className={inputClass} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>
              {account ? "New password" : "Password"}{" "}
              {!account && <span className="text-red-500">*</span>}
            </label>
            <input
              name="password"
              type="password"
              required={!account}
              autoComplete="new-password"
              placeholder={account ? "Leave blank to keep the current password" : "At least 8 characters"}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Account type</label>
            <select
              name="account_type"
              value={accountType}
              onChange={(e) => chooseType(e.target.value as AccountType)}
              className={inputClass}
            >
              {(Object.keys(ACCOUNT_TYPES) as AccountType[]).map((type) => (
                <option key={type} value={type}>
                  {ACCOUNT_TYPES[type].label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              The type sets the starting permissions for new accounts. You can change any of them below.
            </p>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            name="is_active"
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4"
          />
          Active (untick to suspend the account)
        </label>
        {isSelf && (
          <p className="text-xs text-gray-500">
            You can&apos;t suspend your own account or remove its &lsquo;Manage accounts&rsquo; permission.
          </p>
        )}
      </section>

      {/* Permissions */}
      <section className="space-y-3">
        <h3 className={headingClass}>Permissions</h3>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PRESETS) as Array<keyof typeof PRESETS>).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setGranted(new Set(PRESETS[key].permissions))}
              className="text-xs font-medium px-3 py-1.5 rounded-full border border-gray-300 text-gray-700 hover:border-gray-900 hover:text-gray-900"
            >
              Apply: {PRESETS[key].label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PERMISSION_KEYS.map((key) => (
            <label
              key={key}
              className="flex items-start gap-3 border border-gray-200 rounded-lg p-3 cursor-pointer hover:border-gray-300"
            >
              <input
                type="checkbox"
                name="permissions"
                value={key}
                checked={granted.has(key)}
                onChange={(e) => setGranted((set) => withItem(set, key, e.target.checked))}
                className="mt-0.5 h-4 w-4"
              />
              <span>
                <span className="block text-sm font-medium text-gray-800">{PERMISSIONS[key].label}</span>
                <span className="block text-xs text-gray-500">{PERMISSIONS[key].description}</span>
              </span>
            </label>
          ))}
        </div>
      </section>

      {/* Listings */}
      <section className="space-y-3">
        <h3 className={headingClass}>Listings owned by this account</h3>
        {businesses.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No businesses yet.</p>
        ) : (
          <>
            <input
              type="search"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter listings…"
              className={inputClass}
            />
            <div className="border border-gray-200 rounded-lg max-h-72 overflow-y-auto divide-y divide-gray-100">
              {businesses.map((b) => {
                const matches = !needle || `${b.name} ${b.destination}`.toLowerCase().includes(needle);
                return (
                  // Hidden rows stay in the form, so filtering never unassigns a listing.
                  <label
                    key={b.id}
                    className={`${matches ? "flex" : "hidden"} items-start gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50`}
                  >
                    <input
                      type="checkbox"
                      name="business_ids"
                      value={b.id}
                      checked={ticked.has(b.id)}
                      onChange={(e) => setTicked((set) => withItem(set, b.id, e.target.checked))}
                      className="mt-0.5 h-4 w-4"
                    />
                    <span className="text-sm">
                      <span className="text-gray-800">{b.name}</span>
                      <span className="text-gray-400"> · {b.destination}</span>
                      {b.ownerId && b.ownerId !== account?.id && (
                        <span className="block text-xs text-amber-600">Currently owned by {b.ownerName}</span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
          </>
        )}
        <p className="text-xs text-gray-500">
          Business operators with &lsquo;Edit own listings&rsquo; can change the listings ticked here.
        </p>
      </section>

      <div className="flex items-center gap-4 pt-2 border-t border-gray-200">
        <button
          type="submit"
          disabled={pending}
          className="bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium px-6 py-2.5 rounded disabled:opacity-50"
        >
          {pending ? "Saving…" : account ? "Save account" : "Create account"}
        </button>
        <a href="/admin/accounts" className="text-sm text-gray-500 hover:text-gray-700">
          Cancel
        </a>
      </div>
    </form>
  );
}
