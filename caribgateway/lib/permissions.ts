/**
 * Permission keys, presets, and the admin navigation they unlock.
 *
 * Client-safe: no server imports. Permissions are stored on profiles.permissions.
 * The server checks them on every admin page and action (see lib/staff.ts).
 * Hiding a link is only a convenience.
 */

export const PERMISSIONS = {
  "catalog.manage": {
    label: "Manage catalogue",
    description: "Add, edit, and delete destinations, countries, categories, and tags.",
    group: "Catalogue",
  },
  "listings.create": {
    label: "Create listings",
    description:
      "Add new businesses and accommodations. Without 'Edit any listing', you can edit the listings you create.",
    group: "Listings",
  },
  "listings.manage_all": {
    label: "Edit any listing",
    description: "Edit every business and accommodation, including owners, services, photos, and tags.",
    group: "Listings",
  },
  "listings.manage_own": {
    label: "Edit own listings",
    description: "Edit the listings assigned to this account, including details, services, and photos.",
    group: "Business operator",
  },
  "listings.publish": {
    label: "Publish and feature",
    description: "Change a listing's status and its active, featured, and verified flags.",
    group: "Listings",
  },
  "listings.delete": {
    label: "Delete listings",
    description: "Permanently delete businesses and accommodations.",
    group: "Listings",
  },
  "site.content": {
    label: "Edit site content",
    description: "Navigation, footer, homepage copy, and page headers.",
    group: "Site",
  },
  "accounts.manage": {
    label: "Manage accounts",
    description: "Create, edit, and delete accounts, and change their permissions.",
    group: "Accounts",
  },
  "team.create_accounts": {
    label: "Create accounts for their people",
    description:
      "Create login accounts for people they add to a listing. Those accounts get access to that listing only.",
    group: "Business operator",
  },
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;

export const PERMISSION_KEYS = Object.keys(PERMISSIONS) as PermissionKey[];

export function isPermissionKey(value: string): value is PermissionKey {
  return Object.prototype.hasOwnProperty.call(PERMISSIONS, value);
}

/** Customer accounts have no admin access. Account types only label accounts and suggest a preset. */
export const ACCOUNT_TYPES = {
  user: { label: "Customer", preset: "none" },
  business_owner: { label: "Business / operator", preset: "operator" },
  admin: { label: "Administrator", preset: "full" },
} as const;

export type AccountType = keyof typeof ACCOUNT_TYPES;

export const PRESETS = {
  none: {
    label: "No admin access",
    description: "Customer account. Can browse and sign in, but not use the admin area.",
    permissions: [] as PermissionKey[],
  },
  operator: {
    label: "Business operator",
    description:
      "Edits the listings assigned to the account. Can create listings, and add people to them.",
    permissions: [
      "listings.manage_own",
      "listings.create",
      "team.create_accounts",
    ] as PermissionKey[],
  },
  editor: {
    label: "Content editor",
    description: "Catalogue, listings, and site copy. No accounts.",
    permissions: [
      "catalog.manage",
      "listings.create",
      "listings.manage_all",
      "listings.publish",
      "site.content",
    ] as PermissionKey[],
  },
  full: {
    label: "Full administrator",
    description: "Everything, including accounts.",
    permissions: PERMISSION_KEYS,
  },
} as const;

export type PresetKey = keyof typeof PRESETS;

/**
 * Rights on one business, held by its owner and its team. Admins with
 * 'Edit any listing' hold all of them on every business.
 */
export const BUSINESS_RIGHTS = {
  details: {
    label: "Edit details",
    description: "Name, description, address, contact details, hours, and amenities.",
  },
  services: {
    label: "Manage services and pricing",
    description: "Add, edit, and remove services and their prices.",
  },
  photos: {
    label: "Manage photos",
    description: "Upload and remove photos, and choose the main one.",
  },
  team: {
    label: "Manage people",
    description: "Add people to this listing, change their access, and remove them.",
  },
} as const;

export type BusinessRight = keyof typeof BUSINESS_RIGHTS;

export const BUSINESS_RIGHT_KEYS = Object.keys(BUSINESS_RIGHTS) as BusinessRight[];

export function isBusinessRight(value: string): value is BusinessRight {
  return Object.prototype.hasOwnProperty.call(BUSINESS_RIGHTS, value);
}

/** Keys that show the global dashboard. Anyone else with admin access sees only their own listings. */
export const GLOBAL_DASHBOARD_PERMISSIONS: PermissionKey[] = [
  "catalog.manage",
  "listings.manage_all",
  "site.content",
  "accounts.manage",
];

/** Keys that open the Businesses and Accommodations lists. */
export const LISTING_PERMISSIONS: PermissionKey[] = [
  "listings.manage_all",
  "listings.manage_own",
  "listings.create",
];

export function hasPermission(granted: readonly string[], key: PermissionKey): boolean {
  return granted.includes(key);
}

export function hasAnyPermission(granted: readonly string[], keys: readonly PermissionKey[]): boolean {
  return keys.some((key) => granted.includes(key));
}

/** Any permission at all lets an account into the admin area. */
export function canUseAdmin(granted: readonly string[]): boolean {
  return hasAnyPermission(granted, PERMISSION_KEYS);
}

type NavItem = {
  label: string;
  href: string;
  icon: string;
  /** Visible when the account has any of these. null means every admin account. */
  anyOf: readonly PermissionKey[] | null;
  /** Hidden from accounts that have any of these, so each kind of account sees its own tabs. */
  unless?: readonly PermissionKey[];
};

const ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: "▦", anyOf: null },
  { label: "Approvals", href: "/admin/approvals", icon: "✓", anyOf: ["listings.publish"] },
  // Operators get one listings tab for both kinds. Administrators keep the separate lists.
  { label: "My listings", href: "/admin/listings", icon: "🏢", anyOf: LISTING_PERMISSIONS, unless: ["listings.manage_all"] },
  { label: "Businesses", href: "/admin/businesses", icon: "🏢", anyOf: ["listings.manage_all"] },
  { label: "Accommodations", href: "/admin/accommodations", icon: "🛏", anyOf: ["listings.manage_all"] },
  { label: "Statistics", href: "/admin/statistics", icon: "📈", anyOf: LISTING_PERMISSIONS },
  { label: "Destinations", href: "/admin/destinations", icon: "🗺", anyOf: ["catalog.manage"] },
  { label: "Countries", href: "/admin/countries", icon: "🌍", anyOf: ["catalog.manage"] },
  { label: "Categories", href: "/admin/categories", icon: "🏷", anyOf: ["catalog.manage"] },
  { label: "Tags", href: "/admin/tags", icon: "#", anyOf: ["catalog.manage"] },
  { label: "Site Content", href: "/admin/site", icon: "✎", anyOf: ["site.content"] },
  { label: "Accounts", href: "/admin/accounts", icon: "👥", anyOf: ["accounts.manage"] },
];

/** The sidebar entries this account can open. */
export function visibleAdminNav(granted: readonly string[]) {
  return ADMIN_NAV.filter(
    (item) =>
      (item.anyOf === null || hasAnyPermission(granted, item.anyOf)) &&
      !(item.unless && hasAnyPermission(granted, item.unless)),
  ).map(({ label, href, icon }) => ({ label, href, icon }));
}
