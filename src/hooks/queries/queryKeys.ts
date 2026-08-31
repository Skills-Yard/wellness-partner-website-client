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
  // Home dashboard: the next confirmed/accepted jobs, and the recent
  // completed history the weekly earnings chart is derived from.
  upcomingBookings: () => ["bookings", "upcoming"] as const,
  completedBookings: () => ["bookings", "completed"] as const,
  // Business-partner team management. employeeKyc is nested under the
  // employee id so removing/replacing one employee doesn't touch another's
  // cached KYC.
  employees: () => ["employees"] as const,
  employeeKyc: (id: string) => ["employees", id, "kyc"] as const,
};
