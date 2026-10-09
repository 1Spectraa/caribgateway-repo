"use client";

import Image from "next/image";
import { useActionState, useId, useRef, useState, useTransition, type FormEvent } from "react";
import { keepFieldsOnSubmit } from "@/components/admin/keep-fields";
import { Icon } from "@/components/dashboard/icons";
import {
  EmptyState,
  Notice,
  StatusPill,
  buttonClass,
  cardClass,
  cx,
  hintClass,
  inputClass,
  labelClass,
} from "@/components/dashboard/ui";
import { createService, deleteService, updateService, type ServiceActionState } from "@/lib/actions/services";
import { deleteServiceImage, uploadServiceImage, type ServiceImageActionState } from "@/lib/actions/service-images";
import type { BusinessServiceRow } from "@/lib/database.types";

type PriceUnit = BusinessServiceRow["price_unit"];

/** One service and its photos, as the services page passes it in. */
export type ServiceRecord = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  price_unit: PriceUnit;
  currency: string;
  duration_minutes: number | null;
  is_active: boolean;
  photos: { id: string; url: string }[];
};

/** The same limit as lib/actions/service-images.ts and the database trigger. */
const MAX_PHOTOS = 3;

const PRICE_UNITS: { value: PriceUnit; label: string }[] = [
  { value: "fixed", label: "Fixed price" },
  { value: "per_person", label: "Per person" },
  { value: "per_night", label: "Per night" },
  { value: "per_hour", label: "Per hour" },
  { value: "from", label: "Starting from" },
];

const CURRENCIES = ["USD", "XCD", "EUR", "GBP", "CAD"];

/** The words that follow a price on a card. "Starting from" goes before the price instead. */
const UNIT_SUFFIX: Record<PriceUnit, string> = {
  fixed: "",
  per_person: " per person",
  per_night: " per night",
  per_hour: " per hour",
  from: "",
};

function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

/** The price line on a card, such as "$50 per person". Muted when no price is set yet. */
function priceLine(service: ServiceRecord): { text: string; muted: boolean } {
  if (service.price === null) return { text: "No price yet", muted: true };
  if (service.price === 0) return { text: "Free", muted: false };
  const amount = formatMoney(service.price, service.currency);
  const text = service.price_unit === "from" ? `From ${amount}` : `${amount}${UNIT_SUFFIX[service.price_unit]}`;
  return { text, muted: false };
}

/** A duration such as "45 min", "2 hours", or "1 hour 30 min". Null when none is set. */
function durationLine(minutes: number | null): string | null {
  if (!minutes) return null;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  const hourText = `${hours} ${hours === 1 ? "hour" : "hours"}`;
  return rest === 0 ? hourText : `${hourText} ${rest} min`;
}

type FormOutcome = { error: string } | null;

/**
 * The form for adding or editing a service. A save that fails keeps what was typed.
 * A save that works closes the form.
 */
function ServiceForm({
  service,
  save,
  onSaved,
  onCancel,
}: {
  /** The service being edited, or null for a new one. */
  service: ServiceRecord | null;
  save: (formData: FormData) => Promise<ServiceActionState>;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const id = useId();
  const [outcome, formAction, pending] = useActionState<FormOutcome, FormData>(
    async (_previous, formData) => {
      const result = await save(formData);
      if (result && "error" in result) return { error: result.error };
      onSaved();
      return null;
    },
    null,
  );

  // A saved currency outside the usual list stays selectable, so saving does not change it by accident.
  const currencies = service && !CURRENCIES.includes(service.currency) ? [...CURRENCIES, service.currency] : CURRENCIES;
  const busyLabel = service ? "Saving…" : "Adding…";
  const idleLabel = service ? "Save service" : "Add service";

  return (
    <form onSubmit={keepFieldsOnSubmit(formAction)} className="space-y-5">
      {outcome && <Notice tone="error">{outcome.error}</Notice>}

      <div>
        <label htmlFor={`${id}-name`} className={labelClass}>
          Name <span className="text-rose-600">*</span>
        </label>
        <input
          id={`${id}-name`}
          name="name"
          type="text"
          required
          defaultValue={service?.name ?? ""}
          placeholder="e.g. Snorkel tour"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor={`${id}-description`} className={labelClass}>
          Description
        </label>
        <textarea
          id={`${id}-description`}
          name="description"
          rows={2}
          defaultValue={service?.description ?? ""}
          placeholder="A line or two about what is included"
          className={inputClass}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-price`} className={labelClass}>
            Price
          </label>
          <input
            id={`${id}-price`}
            name="price"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            defaultValue={service?.price ?? ""}
            placeholder="Leave blank for no price yet"
            className={inputClass}
          />
          <p className={hintClass}>Enter 0 for a free service.</p>
        </div>

        <div>
          <label htmlFor={`${id}-unit`} className={labelClass}>
            Pricing
          </label>
          <select
            id={`${id}-unit`}
            name="price_unit"
            defaultValue={service?.price_unit ?? "fixed"}
            className={inputClass}
          >
            {PRICE_UNITS.map((unit) => (
              <option key={unit.value} value={unit.value}>
                {unit.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={`${id}-currency`} className={labelClass}>
            Currency
          </label>
          <select id={`${id}-currency`} name="currency" defaultValue={service?.currency ?? "USD"} className={inputClass}>
            {currencies.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={`${id}-duration`} className={labelClass}>
            Duration (minutes)
          </label>
          <input
            id={`${id}-duration`}
            name="duration_minutes"
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            defaultValue={service?.duration_minutes ?? ""}
            placeholder="e.g. 90"
            className={inputClass}
          />
          <p className={hintClass}>Optional.</p>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
        <button type="submit" disabled={pending} className={buttonClass("primary")}>
          {pending ? busyLabel : idleLabel}
        </button>
        <button type="button" onClick={onCancel} disabled={pending} className={buttonClass("ghost")}>
          Cancel
        </button>
      </div>
    </form>
  );
}

/** The photos for one service: thumbnails with a remove control, and an add control that shows how many there are. */
function ServicePhotoStrip({ businessId, service }: { businessId: string; service: ServiceRecord }) {
  const [uploadState, uploadAction, uploading] = useActionState<ServiceImageActionState, FormData>(
    uploadServiceImage.bind(null, businessId, service.id),
    null,
  );
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [removing, startRemoving] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);

  const count = service.photos.length;
  const full = count >= MAX_PHOTOS;
  const uploadError = uploadState && "error" in uploadState ? uploadState.error : null;

  function removePhoto(photoId: string) {
    if (!window.confirm("Remove this photo?")) return;
    setRemoveError(null);
    startRemoving(async () => {
      const result = await deleteServiceImage(photoId, service.id, businessId);
      if (result && "error" in result) setRemoveError(result.error);
    });
  }

  return (
    <div className="space-y-3">
      {count > 0 && (
        <ul className="grid max-w-md grid-cols-3 gap-2 sm:gap-3">
          {service.photos.map((photo, index) => (
            <li
              key={photo.id}
              className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100 ring-1 ring-inset ring-slate-200"
            >
              <Image
                src={photo.url}
                alt={`${service.name} photo ${index + 1}`}
                fill
                sizes="(min-width: 640px) 160px, 33vw"
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => removePhoto(photo.id)}
                disabled={removing}
                aria-label={`Remove photo ${index + 1}`}
                className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-rose-600 shadow-sm transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal disabled:opacity-60"
              >
                <Icon name="trash" className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={(event: FormEvent<HTMLFormElement>) => {
          keepFieldsOnSubmit(uploadAction)(event);
          // The file is already in the request, so the picker is cleared for the next photo.
          event.currentTarget.reset();
        }}
        className="flex flex-wrap items-center gap-x-4 gap-y-2"
      >
        <input
          ref={fileInput}
          type="file"
          name="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            if (event.currentTarget.files?.length) event.currentTarget.form?.requestSubmit();
          }}
        />
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={full || uploading}
          className={buttonClass("secondary")}
        >
          <Icon name="upload" className="h-4 w-4" />
          {uploading ? "Uploading…" : "Add photo"}
        </button>
        <p className="text-xs text-slate-500">
          {count} of {MAX_PHOTOS} photos
          {full ? ". Remove one to add another." : ""}
        </p>
      </form>

      {uploadError && <Notice tone="error">{uploadError}</Notice>}
      {removeError && <Notice tone="error">{removeError}</Notice>}
    </div>
  );
}

/** One service: its details, Edit and Delete, and its photos. */
function ServiceCard({ businessId, service }: { businessId: string; service: ServiceRecord }) {
  const [editing, setEditing] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, startDeleting] = useTransition();
  const price = priceLine(service);
  const duration = durationLine(service.duration_minutes);

  function remove() {
    if (!window.confirm(`Delete "${service.name}"? Its photos will be removed too.`)) return;
    setDeleteError(null);
    startDeleting(async () => {
      const result = await deleteService(service.id, businessId);
      if (result && "error" in result) setDeleteError(result.error);
    });
  }

  return (
    <article className={cx(cardClass, "p-5 sm:p-6")}>
      {editing ? (
        <ServiceForm
          service={service}
          save={(formData) => updateService(service.id, businessId, null, formData)}
          onSaved={() => setEditing(false)}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="break-words text-base font-semibold text-brand-navy">{service.name}</h3>
              {!service.is_active && <StatusPill tone="off">Hidden on the site</StatusPill>}
            </div>
            {service.description && (
              <p className="mt-1 break-words text-sm leading-6 text-slate-600">{service.description}</p>
            )}
            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className={price.muted ? "text-slate-500" : "font-semibold text-slate-900"}>{price.text}</span>
              {duration && (
                <span className="inline-flex items-center gap-1.5 text-slate-500">
                  <Icon name="clock" className="h-4 w-4" />
                  {duration}
                </span>
              )}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <button type="button" onClick={() => setEditing(true)} className={buttonClass("secondary")}>
              <Icon name="pencil" className="h-4 w-4" />
              Edit
            </button>
            <button type="button" onClick={remove} disabled={deleting} className={buttonClass("danger")}>
              <Icon name="trash" className="h-4 w-4" />
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      )}

      {deleteError && (
        <div className="mt-4">
          <Notice tone="error">{deleteError}</Notice>
        </div>
      )}

      <div className="mt-6 border-t border-slate-100 pt-5">
        <ServicePhotoStrip businessId={businessId} service={service} />
      </div>
    </article>
  );
}

/** The services section: an add button, the add form when open, then one card per service. */
export default function PartnerServices({ businessId, services }: { businessId: string; services: ServiceRecord[] }) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-6">
      {adding ? (
        <section className={cx(cardClass, "p-5 sm:p-6")}>
          <h3 className="text-base font-semibold text-brand-navy">New service</h3>
          <div className="mt-5">
            <ServiceForm
              service={null}
              save={(formData) => createService(businessId, null, formData)}
              onSaved={() => setAdding(false)}
              onCancel={() => setAdding(false)}
            />
          </div>
        </section>
      ) : (
        <div>
          <button type="button" onClick={() => setAdding(true)} className={buttonClass("primary", "w-full sm:w-auto")}>
            <Icon name="plus" className="h-4 w-4" />
            Add a service
          </button>
        </div>
      )}

      {services.length === 0 ? (
        !adding && (
          <EmptyState icon="tag" title="No services yet">
            Add your first one, with a price and a few photos if you like.
          </EmptyState>
        )
      ) : (
        <ul className="space-y-4">
          {services.map((service) => (
            <li key={service.id}>
              <ServiceCard businessId={businessId} service={service} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
