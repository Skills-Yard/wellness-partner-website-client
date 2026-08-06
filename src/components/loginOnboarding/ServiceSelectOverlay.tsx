import React from "react";
import { ArrowLeft, Search, Check } from "lucide-react";
import type { ServiceItem } from "@/lib/api/types";

interface ServiceSelectOverlayProps {
  services: ServiceItem[];
  loading: boolean;
  selectedIds: string[];
  onToggle: (id: string) => void;
  search: string;
  setSearch: (value: string) => void;
  onClose: () => void;
}

export default function ServiceSelectOverlay({
  services,
  loading,
  selectedIds,
  onToggle,
  search,
  setSearch,
  onClose,
}: ServiceSelectOverlayProps) {
  const filtered = services.filter((s) =>
    (s.title || s.name).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-white">
      <div className="flex items-center px-4 py-4 border-b border-stone-100">
        <button
          onClick={onClose}
          className="mr-3 p-1.5 hover:bg-stone-50 rounded-full transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 text-stone-700" />
        </button>
        <h2 className="text-sm font-bold text-stone-800">Select services you offer</h2>
      </div>
      <div className="px-4 py-3">
        <div className="flex items-center rounded-full border border-stone-200 bg-stone-50 px-3 py-2.5 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500/30 transition-all">
          <Search className="h-4 w-4 text-stone-400 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Search services"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm outline-none text-stone-800 bg-transparent"
            autoFocus
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {loading && <p className="text-sm text-stone-400 py-6 text-center">Loading services…</p>}
        {!loading && filtered.length === 0 && (
          <p className="text-sm text-stone-400 py-6 text-center">No services found.</p>
        )}
        {filtered.map((service) => {
          const active = selectedIds.includes(service.id);
          return (
            <label
              key={service.id}
              className="flex items-center justify-between py-3.5 border-b border-stone-100 cursor-pointer active:bg-stone-50"
            >
              <div className="min-w-0">
                <span className="text-sm text-stone-700 block truncate">{service.title || service.name}</span>
                {service.category?.title && (
                  <span className="text-[11px] text-stone-400">{service.category.title}</span>
                )}
              </div>
              <div
                className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors shrink-0 ${
                  active ? "border-amber-500 bg-amber-500" : "border-stone-300"
                }`}
              >
                {active && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
              </div>
              <input
                type="checkbox"
                checked={active}
                onChange={() => onToggle(service.id)}
                className="hidden"
              />
            </label>
          );
        })}
      </div>
      <div className="px-4 pb-6 pt-2 border-t border-stone-100">
        <button
          onClick={onClose}
          className="w-full rounded-2xl py-3.5 font-bold text-sm bg-stone-900 text-white hover:bg-stone-800 shadow-lg cursor-pointer transition-all active:scale-[0.98]"
        >
          Done ({selectedIds.length} selected)
        </button>
      </div>
    </div>
  );
}
