"use client";

import React from "react";

/** Small instant-apply toggle — used for WhatsApp opt-in and online status,
 *  both of which save immediately on click rather than going through a
 *  card's Edit/Save flow (that's for the free-text/number fields). */
export default function ToggleSwitch({
  checked,
  onChange,
  loading,
}: {
  checked: boolean;
  onChange: () => void;
  loading?: boolean;
}) {
  return (
    <button
      onClick={onChange}
      disabled={loading}
      role="switch"
      aria-checked={checked}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 cursor-pointer disabled:opacity-60 ${
        checked ? "bg-green-500" : "bg-stone-200"
      }`}
    >
      <span
        className={`inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? "translate-x-5.5" : "translate-x-1"
        }`}
      />
    </button>
  );
}
