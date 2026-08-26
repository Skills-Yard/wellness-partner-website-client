/**
 * Centralized React Query key builders — keeps the same request resolving
 * to the same cache entry no matter which component asks for it, and gives
 * every invalidation call (e.g. after a push arrives, or a mutation
 * succeeds) one place to point at.
 */
export const queryKeys = {
  notifications: () => ["notifications"] as const,
  unreadNotificationCount: () => ["notifications", "unread-count"] as const,
  incomingBroadcasts: () => ["bookings", "incoming"] as const,
  bookings: () => ["bookings", "all"] as const,
};
