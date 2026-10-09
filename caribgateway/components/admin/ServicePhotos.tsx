"use client";

import { useActionState, useState, useTransition } from "react";
import Image from "next/image";
import {
  uploadServiceImage,
  deleteServiceImage,
  type ServiceImageActionState,
} from "@/lib/actions/service-images";
import type { BusinessServiceImageRow } from "@/lib/database.types";

// The server action and the database trigger enforce the same limit.
const MAX_PHOTOS = 3;

interface Props {
  businessId: string;
  serviceId: string;
  serviceName: string;
  photos: BusinessServiceImageRow[];
}

export default function ServicePhotos({ businessId, serviceId, serviceName, photos }: Props) {
  const uploadAction = uploadServiceImage.bind(null, businessId, serviceId);
  const [uploadState, formAction, uploadPending] = useActionState<
    ServiceImageActionState,
    FormData
  >(uploadAction, null);

  const [isPending, startTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const full = photos.length >= MAX_PHOTOS;

  function handleDelete(imageId: string) {
    if (!confirm("Remove this photo?")) return;
    setDeleteError(null);
    startTransition(async () => {
      const result = await deleteServiceImage(imageId, serviceId, businessId);
      if (result && "error" in result) setDeleteError(result.error);
    });
  }

  return (
    <div className="space-y-2">
      {photos.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {photos.map((photo, index) => (
            <div key={photo.id} className="w-28">
              <div className="relative aspect-[4/3] rounded overflow-hidden border border-gray-200 bg-gray-100">
                <Image
                  src={photo.url}
                  alt={`${serviceName} photo ${index + 1}`}
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => handleDelete(photo.id)}
                disabled={isPending}
                aria-label={`Remove photo ${index + 1}`}
                className="mt-1 text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <form action={formAction} className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <p className="text-xs text-gray-500">
          {photos.length} of {MAX_PHOTOS} photos
        </p>
        <input
          name="file"
          type="file"
          accept="image/*"
          required
          disabled={full || uploadPending}
          aria-label={`Add a photo for ${serviceName}`}
          className="text-xs text-gray-600 file:mr-2 file:py-1 file:px-2 file:border file:border-gray-300 file:rounded file:text-xs file:bg-white file:text-gray-700 hover:file:bg-gray-50 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={full || uploadPending}
          className="bg-gray-900 hover:bg-gray-700 text-white text-xs px-3 py-1.5 rounded disabled:opacity-50"
        >
          {uploadPending ? "Uploading…" : "Add photo"}
        </button>
      </form>

      {full && <p className="text-xs text-gray-400">Remove a photo to add another.</p>}
      {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}
      {uploadState && "error" in uploadState && (
        <p className="text-sm text-red-600">{uploadState.error}</p>
      )}
      {uploadState && "url" in uploadState && (
        <p className="text-sm text-green-600">✓ Photo added.</p>
      )}
    </div>
  );
}
