"use client";

import { useActionState, useRef, useTransition } from "react";
import Image from "next/image";
import {
  uploadBusinessImage,
  deleteBusinessImage,
  setPrimaryImage,
  type ActionState,
} from "@/lib/actions/images";
import type { BusinessImageRow } from "@/lib/database.types";

interface Props {
  businessId: string;
  images: BusinessImageRow[];
}

export default function ImageManager({ businessId, images }: Props) {
  const uploadAction = uploadBusinessImage.bind(null, businessId);
  const [uploadState, formAction, uploadPending] = useActionState<
    ActionState,
    FormData
  >(uploadAction, null);

  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleDelete(imageId: string) {
    if (!confirm("Delete this image?")) return;
    startTransition(async () => {
      await deleteBusinessImage(imageId, businessId);
    });
  }

  function handleSetPrimary(imageId: string) {
    startTransition(async () => {
      await setPrimaryImage(imageId, businessId);
    });
  }

  return (
    <div className="space-y-6">
      {/* Upload form */}
      <div className="bg-white border border-gray-200 rounded p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Upload New Image
        </h3>
        <form action={formAction} className="flex items-center gap-3 flex-wrap">
          <input
            ref={fileInputRef}
            name="file"
            type="file"
            accept="image/*"
            required
            className="text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:border file:border-gray-300 file:rounded file:text-sm file:bg-white file:text-gray-700 hover:file:bg-gray-50"
          />
          <button
            type="submit"
            disabled={uploadPending}
            className="bg-gray-900 hover:bg-gray-700 text-white text-sm px-4 py-1.5 rounded disabled:opacity-50"
          >
            {uploadPending ? "Uploading…" : "Upload"}
          </button>
        </form>

        {uploadState && "error" in uploadState && (
          <p className="mt-2 text-sm text-red-600">{uploadState.error}</p>
        )}
        {uploadState && "url" in uploadState && (
          <p className="mt-2 text-sm text-green-600">
            ✓ Image uploaded successfully.
          </p>
        )}
        <p className="mt-1 text-xs text-gray-400">Max 5 MB · JPEG, PNG, WebP</p>
      </div>

      {/* Image grid */}
      {images.length === 0 ? (
        <p className="text-sm text-gray-500">
          No images yet. Upload the first one above.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((img) => (
            <div
              key={img.id}
              className={`relative group rounded overflow-hidden border-2 ${
                img.is_primary ? "border-blue-500" : "border-gray-200"
              }`}
            >
              <div className="aspect-[4/3] relative bg-gray-100">
                <Image
                  src={img.url}
                  alt={img.alt_text ?? "Business image"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, 25vw"
                />
              </div>

              {/* Primary badge */}
              {img.is_primary && (
                <div className="absolute top-1.5 left-1.5 bg-blue-500 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
                  PRIMARY
                </div>
              )}

              {/* Hover actions */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                {!img.is_primary && (
                  <button
                    onClick={() => handleSetPrimary(img.id)}
                    disabled={isPending}
                    className="text-xs bg-white text-gray-900 px-2.5 py-1 rounded hover:bg-gray-100 disabled:opacity-50"
                  >
                    Set Primary
                  </button>
                )}
                <button
                  onClick={() => handleDelete(img.id)}
                  disabled={isPending}
                  className="text-xs bg-red-600 text-white px-2.5 py-1 rounded hover:bg-red-700 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>

              {/* Caption */}
              {img.alt_text && (
                <div className="p-1.5 text-[11px] text-gray-500 truncate bg-white">
                  {img.alt_text}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
