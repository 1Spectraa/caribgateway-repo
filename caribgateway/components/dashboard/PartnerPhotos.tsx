"use client";

import Image from "next/image";
import { useRef, useState, useTransition, type ChangeEvent } from "react";
import { deleteBusinessImage, setPrimaryImage, uploadBusinessImage } from "@/lib/actions/images";
import { Icon } from "@/components/dashboard/icons";
import { Notice, buttonClass, cardClass, cx } from "@/components/dashboard/ui";

/** One photo of the listing, as the photos page passes it in. */
export type PhotoRecord = {
  id: string;
  url: string;
  alt_text: string | null;
  is_primary: boolean;
};

/** The small buttons on each photo. The kit's button sizes are too large for a tile this narrow. */
const TILE_BUTTON =
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal disabled:cursor-not-allowed disabled:opacity-60";

/**
 * The upload area. Each file is sent on its own, one after another, so two uploads never race
 * to become the main photo.
 */
function UploadCard({ businessId, hasPhotos }: { businessId: string; hasPhotos: boolean }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [added, setAdded] = useState(0);
  const [failures, setFailures] = useState<string[]>([]);
  const [uploading, startUploading] = useTransition();

  function handleChoose(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? []);
    // Clear the picker, so choosing the same photo again still counts as a change.
    event.currentTarget.value = "";
    if (files.length === 0) return;

    setAdded(0);
    setFailures([]);
    startUploading(async () => {
      const problems: string[] = [];
      let saved = 0;
      for (const [index, file] of files.entries()) {
        setProgress({ current: index + 1, total: files.length });
        const body = new FormData();
        body.append("file", file);
        const result = await uploadBusinessImage(businessId, null, body);
        if (result && "error" in result) problems.push(`${file.name}: ${result.error}`);
        else saved += 1;
      }
      setProgress(null);
      setAdded(saved);
      setFailures(problems);
    });
  }

  const buttonLabel =
    uploading && progress ? `Uploading ${progress.current} of ${progress.total}…` : uploading ? "Uploading…" : "Add photos";

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-slate-300 bg-white px-6 py-8 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-teal/10 text-brand-teal">
          <Icon name="upload" className="h-6 w-6" />
        </span>
        <h3 className="mt-4 text-base font-semibold text-brand-navy">{hasPhotos ? "Add more photos" : "No photos yet"}</h3>
        <p className="mt-1.5 max-w-md text-sm leading-6 text-slate-600">
          JPG, PNG or WebP, up to 5 MB each. You can choose several at once.
        </p>
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={uploading}
          className={buttonClass("primary", "mt-5")}
        >
          {buttonLabel}
        </button>
        <input ref={fileInput} type="file" accept="image/*" multiple onChange={handleChoose} className="hidden" />
      </div>

      {added > 0 && <Notice tone="success">{added === 1 ? "Photo added." : `${added} photos added.`}</Notice>}
      {failures.length > 0 && (
        <Notice
          tone="error"
          title={failures.length === 1 ? "One photo could not be added" : `${failures.length} photos could not be added`}
        >
          <ul className="list-disc space-y-1 pl-5">
            {failures.map((failure, index) => (
              <li key={index}>{failure}</li>
            ))}
          </ul>
        </Notice>
      )}
    </div>
  );
}

/** One photo, with Make main (not shown on the main photo) and Delete. */
function PhotoCard({ businessId, photo }: { businessId: string; photo: PhotoRecord }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function makeMain() {
    setError(null);
    startTransition(async () => {
      const result = await setPrimaryImage(photo.id, businessId);
      if (result && "error" in result) setError(result.error);
    });
  }

  function remove() {
    if (!window.confirm("Delete this photo? It will be removed from the listing.")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteBusinessImage(photo.id, businessId);
      if (result && "error" in result) setError(result.error);
    });
  }

  return (
    <article className={cx(cardClass, "overflow-hidden")}>
      <div className="relative aspect-[4/3] bg-slate-100">
        <Image
          src={photo.url}
          alt={photo.alt_text?.trim() || "Photo of this listing"}
          fill
          sizes="(min-width: 640px) 33vw, 50vw"
          className="object-cover"
        />
        {photo.is_primary && (
          <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-brand-navy shadow-sm">
            <Icon name="star" className="h-3.5 w-3.5 text-brand-coral" />
            Main photo
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 p-3">
        {!photo.is_primary && (
          <button
            type="button"
            onClick={makeMain}
            disabled={pending}
            className={cx(TILE_BUTTON, "bg-white text-brand-navy ring-1 ring-inset ring-slate-300 hover:bg-slate-50")}
          >
            <Icon name="star" className="h-3.5 w-3.5" />
            Make main
          </button>
        )}
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className={cx(TILE_BUTTON, "ml-auto text-rose-600 hover:bg-rose-50")}
        >
          <Icon name="trash" className="h-3.5 w-3.5" />
          Delete
        </button>
      </div>

      {error && (
        <p role="alert" className="px-3 pb-3 text-xs leading-5 text-rose-600">
          {error}
        </p>
      )}
    </article>
  );
}

/** The photos section: the upload area, then a grid of photos with the main one first. */
export default function PartnerPhotos({ businessId, photos }: { businessId: string; photos: PhotoRecord[] }) {
  return (
    <div className="space-y-6">
      <UploadCard businessId={businessId} hasPhotos={photos.length > 0} />

      {photos.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {photos.map((photo) => (
            <li key={photo.id}>
              <PhotoCard businessId={businessId} photo={photo} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
