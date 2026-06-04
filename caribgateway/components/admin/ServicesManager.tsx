"use client";

import { useActionState, useRef } from "react";
import { createService, deleteService, type ServiceActionState } from "@/lib/actions/services";
import type { BusinessServiceRow } from "@/lib/database.types";

const PRICE_UNITS = [
  { value: "fixed",      label: "Fixed price" },
  { value: "per_person", label: "Per person" },
  { value: "per_night",  label: "Per night" },
  { value: "per_hour",   label: "Per hour" },
  { value: "from",       label: "Starting from" },
] as const;

interface Props {
  businessId: string;
  services: BusinessServiceRow[];
}

function formatPrice(service: BusinessServiceRow): string {
  if (service.price === null) return "—";
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: service.currency || "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(service.price);

  const unitLabel: Record<string, string> = {
    fixed:      "",
    per_person: " / person",
    per_night:  " / night",
    per_hour:   " / hour",
    from:       "+",
  };

  return service.price_unit === "from"
    ? `From ${formatted}`
    : `${formatted}${unitLabel[service.price_unit] ?? ""}`;
}

export default function ServicesManager({ businessId, services }: Props) {
  const createAction = createService.bind(null, businessId);
  const [state, formAction, pending] = useActionState<ServiceActionState, FormData>(
    createAction,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  async function handleDelete(serviceId: string) {
    await deleteService(serviceId, businessId);
  }

  return (
    <div className="space-y-8">
      {/* Existing services */}
      {services.length === 0 ? (
        <p className="text-sm text-gray-400 italic">No services listed yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                <th className="pb-2 font-medium">Service</th>
                <th className="pb-2 font-medium">Price</th>
                <th className="pb-2 font-medium">Duration</th>
                <th className="pb-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {services.map((svc) => (
                <tr key={svc.id} className="border-b border-gray-50 last:border-0">
                  <td className="py-2.5 pr-4">
                    <p className="font-medium text-gray-900">{svc.name}</p>
                    {svc.description && (
                      <p className="text-gray-400 text-xs mt-0.5">{svc.description}</p>
                    )}
                  </td>
                  <td className="py-2.5 pr-4 text-gray-700 font-medium whitespace-nowrap">
                    {formatPrice(svc)}
                  </td>
                  <td className="py-2.5 pr-4 text-gray-500 whitespace-nowrap">
                    {svc.duration_minutes ? `${svc.duration_minutes} min` : "—"}
                  </td>
                  <td className="py-2.5 text-right">
                    <button
                      onClick={() => handleDelete(svc.id)}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add service form */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Add Service</h3>
        <form
          ref={formRef}
          action={async (formData) => {
            await formAction(formData);
            formRef.current?.reset();
          }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          {state?.error && (
            <div className="sm:col-span-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
              {state.error}
            </div>
          )}

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              type="text"
              required
              placeholder="e.g. Private Snorkelling Tour"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              name="description"
              type="text"
              placeholder="Optional short description"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price
            </label>
            <input
              name="price"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pricing Type
            </label>
            <select
              name="price_unit"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PRICE_UNITS.map((u) => (
                <option key={u.value} value={u.value}>{u.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Currency
            </label>
            <select
              name="currency"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="USD">USD</option>
              <option value="JMD">JMD</option>
              <option value="BBD">BBD</option>
              <option value="TTD">TTD</option>
              <option value="XCD">XCD</option>
              <option value="KYD">KYD</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (minutes)
            </label>
            <input
              name="duration_minutes"
              type="number"
              min="0"
              placeholder="e.g. 120"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="sm:col-span-2 flex items-center gap-4">
            <button
              type="submit"
              disabled={pending}
              className="bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium px-5 py-2 rounded disabled:opacity-50"
            >
              {pending ? "Adding…" : "Add Service"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
