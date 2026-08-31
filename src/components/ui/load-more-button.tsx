"use client";

// Matches the "Load more" affordance NotificationsSidebar already shipped
// (same classes) — extracted here so usePaginatedList-backed screens share
// one implementation instead of re-copying the button each time.
export function LoadMoreButton({
  onClick,
  loading,
  className = "",
}: {
  onClick: () => void;
  loading?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`mt-4 w-full rounded-xl border border-stone-200 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-50 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {loading ? "Loading…" : "Load more"}
    </button>
  );
}
