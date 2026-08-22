/** Minimal relative-time formatter (no date library in this project) —
 *  "Just now", "5m ago", "3h ago", "2d ago", then falls back to a short date. */
export function timeAgo(dateString: string): string {
  const then = new Date(dateString).getTime();
  if (Number.isNaN(then)) return "";

  const diffMs = Date.now() - then;
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}d ago`;

  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: diffDay > 365 ? "numeric" : undefined,
  });
}
