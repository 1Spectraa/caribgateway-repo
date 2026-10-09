"use client";

import Link from "next/link";
import { useActionState, useId, useMemo, type ComponentProps, type ReactNode } from "react";
import { keepFieldsOnSubmit } from "@/components/admin/keep-fields";
import {
  Notice,
  buttonClass,
  cardClass,
  cx,
  hintClass,
  inputClass,
  labelClass,
} from "@/components/dashboard/ui";
import { createBusiness, updateBusiness, type ActionState } from "@/lib/actions/businesses";
import type { BusinessRow, BusinessType, SocialLinks } from "@/lib/database.types";

export type DestinationOption = {
  id: string;
  /** Shown in the list as "Name (Country)". */
  label: string;
};

export type CategoryOption = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
};

export type PartnerListingFormProps = {
  /** The listing's type. It cannot change once the listing exists. */
  kind: BusinessType;
  /** The listing being edited. Leave out to add a new one. */
  business?: BusinessRow;
  destinations: DestinationOption[];
  categories: CategoryOption[];
  /** Where to go after saving or cancelling: /dashboard/listings, or /dashboard/listings/<id>. */
  returnTo: string;
};

const KIND_LABEL: Record<BusinessType, string> = {
  hotel: "Accommodation",
  restaurant: "Restaurant & dining",
  attraction: "Attraction",
  tour_operator: "Tour operator",
  transportation: "Transportation",
};

/** The top-level category each kind sits under. The same mapping BusinessForm uses. */
const TOP_CATEGORY_SLUG: Record<BusinessType, string> = {
  hotel: "hotels-accommodation",
  restaurant: "restaurants-dining",
  attraction: "attractions",
  tour_operator: "tour-operators",
  transportation: "transportation",
};

const PRICE_RANGES = [
  { value: "budget", label: "Budget" },
  { value: "moderate", label: "Moderate" },
  { value: "upscale", label: "Upscale" },
  { value: "luxury", label: "Luxury" },
] as const;

/** One type-specific question. Its field is named meta_<key>, as parseBusinessForm expects. */
type DetailSpec = {
  key: string;
  label: string;
  control: "stars" | "number" | "time" | "list" | "text" | "yesno";
  min?: number;
  max?: number;
  placeholder?: string;
  hint?: string;
};

/** The Type details for each kind. The number ranges match the limits the server applies. */
const DETAILS: Record<BusinessType, DetailSpec[]> = {
  hotel: [
    { key: "star_rating", label: "Star rating", control: "stars" },
    { key: "total_rooms", label: "Rooms or units", control: "number", min: 1, max: 10000 },
    { key: "check_in", label: "Check-in time", control: "time" },
    { key: "check_out", label: "Check-out time", control: "time" },
    { key: "pool", label: "Pool", control: "yesno" },
    { key: "gym", label: "Gym", control: "yesno" },
    { key: "spa", label: "Spa", control: "yesno" },
    { key: "beach_access", label: "Beach access", control: "yesno" },
    { key: "all_inclusive", label: "All-inclusive", control: "yesno" },
  ],
  restaurant: [
    { key: "cuisine_types", label: "Cuisine types", control: "list", placeholder: "Caribbean, seafood, pizza" },
    { key: "reservation_required", label: "Reservations required", control: "yesno" },
    { key: "outdoor_seating", label: "Outdoor seating", control: "yesno" },
    { key: "delivery_available", label: "Delivery", control: "yesno" },
    { key: "halal", label: "Halal options", control: "yesno" },
    { key: "vegetarian_options", label: "Vegetarian options", control: "yesno" },
    { key: "vegan_options", label: "Vegan options", control: "yesno" },
  ],
  attraction: [
    { key: "duration_minutes", label: "Typical visit (minutes)", control: "number", min: 1, max: 10080 },
    {
      key: "age_min",
      label: "Minimum age",
      control: "number",
      min: 0,
      max: 120,
      hint: "Leave blank if there is no minimum.",
    },
    {
      key: "age_max",
      label: "Maximum age",
      control: "number",
      min: 0,
      max: 120,
      hint: "Leave blank if there is no maximum.",
    },
    { key: "guided_only", label: "Guided visits only", control: "yesno" },
    { key: "outdoor", label: "Outdoors", control: "yesno" },
  ],
  tour_operator: [
    { key: "tour_types", label: "Tour types", control: "list", placeholder: "Snorkelling, hiking, boat trips" },
    { key: "max_group_size", label: "Largest group size", control: "number", min: 1, max: 1000 },
    { key: "languages_spoken", label: "Languages spoken", control: "list", placeholder: "English, French" },
    { key: "pickup_available", label: "Hotel pickup", control: "yesno" },
  ],
  transportation: [
    { key: "vehicle_types", label: "Vehicle types", control: "list", placeholder: "Taxi, minibus, car hire" },
    { key: "service_area", label: "Service area", control: "text", placeholder: "For example: the whole island" },
    { key: "airport_transfers", label: "Airport transfers", control: "yesno" },
    { key: "driver_included", label: "Driver included", control: "yesno" },
  ],
};

const GRID = "grid gap-5 sm:grid-cols-2";
const HELP = "text-sm leading-6 text-slate-600";

/** A saved detail as the text its field shows. Lists are joined with commas. */
function savedText(meta: Record<string, unknown>, key: string): string {
  const value = meta[key];
  if (value === undefined || value === null) return "";
  return Array.isArray(value) ? value.join(", ") : String(value);
}

/** The saved answer to a yes/no detail. Not set stays blank, so it is never saved as no. */
function savedYesNo(meta: Record<string, unknown>, key: string): "yes" | "no" | "" {
  const value = meta[key];
  if (value === true) return "yes";
  if (value === false) return "no";
  return "";
}

type Choice = { id: string; label: string };

/**
 * The categories for this kind: its top-level category, then that category's children, indented.
 * Falls back to every top-level category when the kind's category is missing, as BusinessForm does.
 * The listing's current category always stays in the list, so saving cannot change it by accident.
 */
function categoryChoices(
  categories: CategoryOption[],
  kind: BusinessType,
  currentId: string | undefined,
): Choice[] {
  const top = categories.find((c) => !c.parent_id && c.slug === TOP_CATEGORY_SLUG[kind]);
  let choices: Choice[] = top
    ? [
        { id: top.id, label: top.name },
        ...categories
          .filter((c) => c.parent_id === top.id)
          .map((c) => ({ id: c.id, label: `  ↳ ${c.name}` })),
      ]
    : categories.filter((c) => !c.parent_id).map((c) => ({ id: c.id, label: c.name }));

  const current = categories.find((c) => c.id === currentId);
  if (current && !choices.some((c) => c.id === current.id)) {
    choices = [{ id: current.id, label: current.name }, ...choices];
  }
  return choices;
}

/* ------------------------------------------------------------------------ */
/* Fields                                                                    */
/* ------------------------------------------------------------------------ */

type FieldProps = { label: string; hint?: string; className?: string };

function FieldLabel({ id, text, required }: { id: string; text: string; required?: boolean }) {
  return (
    <label htmlFor={id} className={labelClass}>
      {text}
      {required && (
        <span aria-hidden="true" className="ml-0.5 text-rose-600">
          *
        </span>
      )}
    </label>
  );
}

function TextField({ label, hint, className, ...input }: FieldProps & ComponentProps<"input">) {
  const id = useId();
  const hintId = useId();
  return (
    <div className={className}>
      <FieldLabel id={id} text={label} required={input.required} />
      <input id={id} aria-describedby={hint ? hintId : undefined} className={inputClass} {...input} />
      {hint && (
        <p id={hintId} className={hintClass}>
          {hint}
        </p>
      )}
    </div>
  );
}

function AreaField({ label, hint, className, ...area }: FieldProps & ComponentProps<"textarea">) {
  const id = useId();
  const hintId = useId();
  return (
    <div className={className}>
      <FieldLabel id={id} text={label} required={area.required} />
      <textarea id={id} aria-describedby={hint ? hintId : undefined} className={inputClass} {...area} />
      {hint && (
        <p id={hintId} className={hintClass}>
          {hint}
        </p>
      )}
    </div>
  );
}

function SelectField({
  label,
  hint,
  className,
  children,
  ...select
}: FieldProps & ComponentProps<"select">) {
  const id = useId();
  const hintId = useId();
  return (
    <div className={className}>
      <FieldLabel id={id} text={label} required={select.required} />
      <select id={id} aria-describedby={hint ? hintId : undefined} className={inputClass} {...select}>
        {children}
      </select>
      {hint && (
        <p id={hintId} className={hintClass}>
          {hint}
        </p>
      )}
    </div>
  );
}

function DetailField({ field, meta }: { field: DetailSpec; meta: Record<string, unknown> }) {
  const name = `meta_${field.key}`;

  if (field.control === "yesno") {
    return (
      <SelectField name={name} label={field.label} defaultValue={savedYesNo(meta, field.key)}>
        <option value="">Not set</option>
        <option value="yes">Yes</option>
        <option value="no">No</option>
      </SelectField>
    );
  }

  if (field.control === "stars") {
    return (
      <SelectField name={name} label={field.label} defaultValue={savedText(meta, field.key)}>
        <option value="">Not set</option>
        {[1, 2, 3, 4, 5].map((stars) => (
          <option key={stars} value={stars}>
            {stars === 1 ? "1 star" : `${stars} stars`}
          </option>
        ))}
      </SelectField>
    );
  }

  const type = field.control === "number" || field.control === "time" ? field.control : "text";
  return (
    <TextField
      name={name}
      label={field.label}
      type={type}
      min={field.min}
      max={field.max}
      placeholder={field.placeholder}
      hint={field.hint ?? (field.control === "list" ? "Separate each one with a comma." : undefined)}
      defaultValue={savedText(meta, field.key)}
    />
  );
}

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className={cx(cardClass, "p-5 sm:p-6")}>
      <h2 className="text-base font-semibold text-brand-navy">{title}</h2>
      <p className={cx(HELP, "mt-1")}>{description}</p>
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------------ */
/* Form                                                                      */
/* ------------------------------------------------------------------------ */

export default function PartnerListingForm({
  kind,
  business,
  destinations,
  categories,
  returnTo,
}: PartnerListingFormProps) {
  const businessId = business?.id;
  // Editing calls updateBusiness for this listing. A new listing calls createBusiness.
  const action = useMemo(
    () => (businessId ? updateBusiness.bind(null, businessId) : createBusiness),
    [businessId],
  );
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null);

  const editing = business !== undefined;
  const meta = (business?.metadata ?? {}) as Record<string, unknown>;
  const social = (business?.social_links ?? {}) as SocialLinks;
  const hasPin = typeof business?.latitude === "number" || typeof business?.longitude === "number";
  const categoryOptions = categoryChoices(categories, kind, business?.category_id);

  const submitLabel = editing
    ? pending
      ? "Saving…"
      : "Save changes"
    : pending
      ? "Sending…"
      : "Send for approval";

  return (
    <form onSubmit={keepFieldsOnSubmit(formAction)} className="space-y-6">
      <input type="hidden" name="return_to" value={returnTo} />
      <input type="hidden" name="business_type" value={kind} />

      {state?.error && (
        <Notice tone="error" title={editing ? "Your changes were not saved" : "Your listing was not sent"}>
          {state.error}
        </Notice>
      )}

      <Section title="The basics" description="The essentials visitors see first.">
        <div className={GRID}>
          <TextField
            name="name"
            label="Name"
            required
            defaultValue={business?.name ?? ""}
            className="sm:col-span-2"
          />
          <SelectField
            name="destination_id"
            label="Destination"
            required
            hint="The island or town where your place is."
            defaultValue={business?.destination_id ?? ""}
          >
            <option value="">Choose a destination</option>
            {destinations.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </SelectField>
          <SelectField
            name="category_id"
            label="Category"
            required
            hint="Pick the closest match."
            defaultValue={business?.category_id ?? ""}
          >
            <option value="">Choose a category</option>
            {categoryOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </SelectField>
          <AreaField
            name="short_description"
            label="Short description"
            rows={2}
            hint="One or two sentences, up to 160 characters."
            defaultValue={business?.short_description ?? ""}
            className="sm:col-span-2"
          />
        </div>
      </Section>

      <Section title="About your place" description="What visitors read before they decide to go.">
        <div className={GRID}>
          <AreaField
            name="description"
            label="Full description"
            rows={6}
            hint="What to expect, what makes it special, and anything visitors should know."
            defaultValue={business?.description ?? ""}
            className="sm:col-span-2"
          />
          <SelectField
            name="price_range"
            label="Price range"
            hint="Roughly what a typical visit costs."
            defaultValue={business?.price_range ?? ""}
          >
            <option value="">Not set</option>
            {PRICE_RANGES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </SelectField>
        </div>

        <div className="space-y-5 border-t border-slate-200 pt-5">
          <div>
            <h3 className="text-sm font-semibold text-brand-navy">
              Details for {KIND_LABEL[kind].toLowerCase()}
            </h3>
            <p className={cx(HELP, "mt-1")}>Leave anything you are not sure of as Not set.</p>
          </div>
          <div className={GRID}>
            {DETAILS[kind].map((field) => (
              <DetailField key={field.key} field={field} meta={meta} />
            ))}
          </div>
        </div>
      </Section>

      <Section title="Where to find you" description="So visitors can find your door.">
        <div className={GRID}>
          <TextField
            name="address_line1"
            label="Address line 1"
            defaultValue={business?.address_line1 ?? ""}
            className="sm:col-span-2"
          />
          <TextField
            name="address_line2"
            label="Address line 2"
            defaultValue={business?.address_line2 ?? ""}
            className="sm:col-span-2"
          />
          <TextField name="city" label="City" defaultValue={business?.city ?? ""} />
          <TextField name="postal_code" label="Postal code" defaultValue={business?.postal_code ?? ""} />
        </div>

        <details
          className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-inset ring-slate-200"
          open={hasPin}
        >
          <summary className="cursor-pointer text-sm font-medium text-brand-navy">Map pin</summary>
          <div className={cx(GRID, "mt-4")}>
            <p className={cx(HELP, "sm:col-span-2")}>
              Optional. In Google Maps, right-click your spot to see its latitude and longitude.
            </p>
            <TextField
              name="latitude"
              label="Latitude"
              type="number"
              step="any"
              min={-90}
              max={90}
              defaultValue={business?.latitude ?? ""}
            />
            <TextField
              name="longitude"
              label="Longitude"
              type="number"
              step="any"
              min={-180}
              max={180}
              defaultValue={business?.longitude ?? ""}
            />
          </div>
        </details>
      </Section>

      <Section title="How to reach you" description="How visitors can contact you or find you online.">
        <div className={GRID}>
          <TextField name="phone" label="Phone" type="tel" defaultValue={business?.phone ?? ""} />
          <TextField name="email" label="Email" type="email" defaultValue={business?.email ?? ""} />
          <TextField
            name="website"
            label="Website"
            type="url"
            placeholder="https://www.example.com"
            hint="Start with https://"
            defaultValue={business?.website ?? ""}
            className="sm:col-span-2"
          />
          <TextField
            name="social_facebook"
            label="Facebook"
            type="url"
            placeholder="https://"
            defaultValue={social.facebook ?? ""}
          />
          <TextField
            name="social_instagram"
            label="Instagram"
            type="url"
            placeholder="https://"
            defaultValue={social.instagram ?? ""}
          />
          <TextField
            name="social_twitter"
            label="X (Twitter)"
            type="url"
            placeholder="https://"
            defaultValue={social.twitter ?? ""}
          />
          <TextField
            name="social_tripadvisor"
            label="TripAdvisor"
            type="url"
            placeholder="https://"
            defaultValue={social.tripadvisor ?? ""}
          />
        </div>
      </Section>

      <Section title="What makes you special" description="Short lists that help visitors compare places.">
        <div className={GRID}>
          <AreaField
            name="amenities"
            label="Amenities"
            rows={3}
            hint="Separate with commas. For example: pool, free parking, Wi-Fi."
            defaultValue={(business?.amenities ?? []).join(", ")}
          />
          <AreaField
            name="features"
            label="Features"
            rows={3}
            hint="Separate with commas. For example: beachfront, family friendly, live music."
            defaultValue={(business?.features ?? []).join(", ")}
          />
        </div>
      </Section>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-end">
        <Link href={returnTo} className={buttonClass("secondary", "w-full sm:w-auto")}>
          Cancel
        </Link>
        <button
          type="submit"
          disabled={pending}
          className={buttonClass("primary", "w-full sm:w-auto")}
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
