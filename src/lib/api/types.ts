// Hand-maintained mirror of the wellness-backend Prisma enums/DTOs relevant
// to the partner app. There's no shared codegen between the two repos, so
// keep this in sync by hand when the backend shapes change.

export type PartnerType = "INDIVIDUAL" | "BUSINESS";

export type PartnerStatus =
  | "INCOMPLETE"
  | "PENDING_KYC"
  | "KYC_SUBMITTED"
  | "TRAINING"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "SUSPENDED"
  | "REJECTED"
  | "DEACTIVATED";

export type KycStatus =
  | "NOT_SUBMITTED"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "RESUBMISSION_REQUIRED";

export type BusinessEntityType =
  | "PROPRIETORSHIP"
  | "PARTNERSHIP"
  | "PRIVATE_LIMITED"
  | "LLP"
  | "OTHER";

export type TrainingStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "FAILED";

export type EmployeeStatus =
  | "PENDING_KYC"
  | "KYC_SUBMITTED"
  | "TRAINING"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "SUSPENDED"
  | "REJECTED"
  | "DEACTIVATED";

export type SlotStatus = "AVAILABLE" | "HELD" | "BOOKED" | "BLOCKED_BY_PARTNER" | "EXPIRED";

export type DayOfWeek = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";

export type BookingStatus =
  | "PENDING_PAYMENT"
  | "EXPIRED"
  | "CONFIRMED"
  | "BROADCASTED"
  | "ACCEPTED"
  | "NO_PARTNER_FOUND"
  | "PARTNER_EN_ROUTE"
  | "PARTNER_ARRIVED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED_BY_CLIENT"
  | "CANCELLED_BY_PARTNER"
  | "CANCELLED_BY_ADMIN"
  | "PENDING_RESCHEDULE"
  | "RESCHEDULED"
  | "DISPUTED";

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  refreshTokenExpiresInMs?: number;
  platform?: string;
}

export interface RequestOtpResponse {
  message: string;
  otp?: string; // dev-mode only, backend echoes it back
}

export type VerifyOtpResponse =
  | { message: string; signupToken: string } // new partner: registration required
  | (AuthTokens & { message: string }); // existing partner: logged in

// Resolves an OperationalZone from a coordinate — GET /zones?latitude&longitude.
// Asked before "what services do you offer?" so that step can scope its
// catalog fetch to what's actually operable at the partner's location
// (x-zone-id). `exists: false` means the coordinate falls outside every
// operational zone's hex coverage — not currently serviceable.
export type ZoneCoordinateResolution =
  | { exists: true; zoneId: string; zoneName: string; city: string; h3Index: string }
  | { exists: false; h3Index: string };

// Top-level ServiceCategory (e.g. "Spa", "Salon for Men"). At signup this is
// derived from the partner's zone-scoped ServiceItem list (see
// catalog.getServiceItems(zoneId)) rather than fetched globally, so only
// categories actually available in the partner's chosen zone are offered.
export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  title: string;
  subtitle?: string;
}

export interface ServiceSubCategory {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  title: string;
  subtitle?: string;
  category: ServiceCategory;
}

export interface ServiceItem {
  id: string;
  name: string;
  slug?: string;
  cardTitle: string;
  cardSubtitle?: string;
  thumbnailKey?: string | null;
  thumbnailType?: "IMAGE" | "VIDEO";
  subCategoryId: string;
  // NOTE: GET /catalog/service-items (ClientServiceItemController) returns
  // the raw Prisma entity, not ServiceItemResponseDto's shaped `category`
  // field — the controller is missing @UseInterceptors(ClassSerializerInterceptor)
  // that the sibling category/sub-category controllers have, so the DTO's
  // field renaming/whitelisting never actually applies. Reflects the real
  // wire shape (subCategory, not category) rather than the DTO's intent.
  //
  // Only present on that endpoint's response, though — the serviceItem
  // embedded in GET /partner/profile's partnerServices[] is a leaner shape
  // that carries just subCategoryId, no nested subCategory/category.
  // Optional here to reflect that.
  subCategory?: ServiceSubCategory;
  isActive: boolean;
}

export interface PartnerService {
  id: string;
  partnerId: string;
  serviceItemId: string;
  serviceItem: ServiceItem;
  customPrice?: number | null;
  isActive: boolean;
}

export interface PartnerKyc {
  id: string;
  partnerId: string;
  aadhaarNumber?: string | null;
  aadhaarFrontKey?: string | null;
  aadhaarBackKey?: string | null;
  panNumber?: string | null;
  panKey?: string | null;
  selfieKey?: string | null;
  videoKycKey?: string | null;
  videoKycDurationSec?: number | null;
  certificateKeys: string[];
  businessName?: string | null;
  businessType?: BusinessEntityType | null;
  gstin?: string | null;
  businessRegistrationNumber?: string | null;
  businessAddress?: string | null;
  businessLicenseKey?: string | null;
  businessPanNumber?: string | null;
  businessPanKey?: string | null;
  cancelledChequeKey?: string | null;
  status: KycStatus;
  adminNotes?: string | null;
  submittedAt?: string | null;
  resubmittedAt?: string | null;
}

export interface TrainingCourse {
  id: string;
  title: string;
  description: string;
  thumbnailKey?: string | null;
  isMandatory: boolean;
  serviceIds: string[];
  passingScore: number;
  estimatedMinutes: number;
  displayOrder: number;
  isActive: boolean;
  // Nested when this course arrives via GET /partner/training (see
  // PartnerTrainingProgress.course below) — that's the only place this app
  // reads courses from, so TrainingCenter never needs the standalone
  // modules/lessons endpoints. Optional since nothing guarantees every
  // caller of this type has them inlined.
  modules?: TrainingModule[];
}

export interface TrainingModule {
  id: string;
  courseId: string;
  title: string;
  displayOrder: number;
  isActive: boolean;
  // See TrainingCourse.modules above — nested when the course came from
  // GET /partner/training.
  lessons?: TrainingLesson[];
}

export interface TrainingLesson {
  id: string;
  moduleId: string;
  title: string;
  content?: string | null;
  videoKey?: string | null;
  videoDurationSec?: number | null;
  displayOrder: number;
  isActive: boolean;
}

export interface PartnerTrainingProgress {
  id: string;
  partnerId: string;
  courseId: string;
  course: TrainingCourse;
  status: TrainingStatus;
  score?: number | null;
  attempts: number;
  startedAt?: string | null;
  completedAt?: string | null;
  // Persisted per-lesson / per-module completion for this course (see
  // PATCH /partner/training/:courseId/lessons/:lessonId). Present on every
  // row from GET /partner/training so the Training Center hydrates its
  // checklist on reload instead of starting blank. A module lands in
  // completedModuleIds once all its lessons are done; the course
  // auto-completes (status COMPLETED) once every lesson is.
  completedLessonIds: string[];
  completedModuleIds: string[];
}

// Same shape as PartnerTrainingProgress, scoped to a BUSINESS partner's
// employee. Backs the owner-proxy Team training view and the tokenised
// public employee-training page.
export interface EmployeeTrainingProgress {
  id: string;
  employeeId: string;
  courseId: string;
  course: TrainingCourse;
  status: TrainingStatus;
  score?: number | null;
  attempts: number;
  startedAt?: string | null;
  completedAt?: string | null;
  // See PartnerTrainingProgress above — same per-lesson / per-module
  // completion tracking, scoped to an employee.
  completedLessonIds: string[];
  completedModuleIds: string[];
}

export interface BankAccount {
  id: string;
  partnerId: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  accountType: string;
  isVerified: boolean;
}

export interface PartnerEmployee {
  id: string;
  partnerId: string;
  name: string;
  phone: string;
  profilePhotoKey?: string | null;
  role: string;
  specializations: string[];
  isActive: boolean;
  status: EmployeeStatus;
  // Present on GET /partner/employees rows — set once an admin approves the
  // employee, null until then.
  approvedAt?: string | null;
  approvedBy?: string | null;
  joinedAt: string;
}

export interface PartnerAvailability {
  id: string;
  partnerId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface PartnerSlot {
  id: string;
  partnerId: string;
  employeeId?: string | null;
  resourceId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: SlotStatus;
  bookingId?: string | null;
}

export interface Booking {
  id: string;
  userId: string;
  partnerId?: string | null;
  addressId: string;
  bookingType: "ON_DEMAND" | "SCHEDULED" | "RECURRING_INSTANCE";
  status: BookingStatus;
  scheduledDate: string;
  scheduledTime: string;
  estimatedEndTime: string;
  estimatedDurationMinutes: number;
  clientNotes?: string | null;
  // Money fields (totalAmount/partnerEarning, and BookingItem.price below)
  // are plain rupee integers, NOT paise — despite the "minor units" comment
  // on the backend's Payment model, nothing in BookingService ever
  // multiplies/divides by 100 (confirmed against wellness-website-client's
  // src/types/booking.ts, which documents the same convention). Do not
  // divide these by 100 when displaying them.
  totalAmount: number;
  partnerEarning: number;
  items?: Array<{
    id: string;
    serviceItemName: string;
    durationLabel?: string | null;
    price: number;
    durationMinutes: number;
    quantity: number;
  }>;
  // Not present on the leaner GET /partner/bookings list shape (confirmed
  // absent there), but the same Address relation IS confirmed on the
  // Booking entity via IncomingBroadcast.booking.address (see that type
  // below) — likely present on GET /partner/bookings/:id too since that's
  // a single-record detail fetch, just unconfirmed. Optional and rendered
  // defensively (BookingTrackingPage) rather than assumed.
  address?: {
    city?: string | null;
    pincode?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  } | null;
}

export interface Partner {
  id: string;
  countryCode: string;
  name?: string | null;
  email?: string | null;
  profilePhotoKey?: string | null;
  type: PartnerType;
  status: PartnerStatus;
  bio?: string | null;
  yearsOfExperience?: number | null;
  languages: string[];
  latitude?: number | null;
  longitude?: number | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  serviceRadiusKm: number;
  bufferMinutes: number;
  // Granularity PartnerSlot rows are chunked into from the weekly
  // availability template (30 or 60) — see AvailabilityPanel.
  slotDurationMinutes: number;
  totalBookings: number;
  completionRate: number;
  averageRating: number;
  totalReviews: number;
  isActive: boolean;
  isOnline: boolean;
  whatsappOptIn: boolean;
  onboardingStep: number;
  approvedAt?: string | null;
  kyc?: PartnerKyc | null;
  bankAccount?: BankAccount | null;
  partnerServices?: PartnerService[];
  availability?: PartnerAvailability[];
  employees?: PartnerEmployee[];
  trainingProgress?: PartnerTrainingProgress[];
  // Live counts from the backend (PartnerRepository.findById) — employees
  // mirrors the length of the `employees` array above (which is unbounded,
  // not enforced-small), plus bookings/reviews which aren't otherwise
  // embedded here at all. Prefer these over `totalBookings`/`totalReviews`
  // below where accuracy matters — see useBookingStats's doc comment for why
  // totalBookings/completionRate specifically come back stale/zero.
  _count?: { employees: number; bookings: number; reviews: number };
  // Businesses this partner is an ACTIVE team member of (GET /partner/profile
  // enriches the row with this). Empty for everyone who isn't on a team — a
  // non-empty array is what the app keys "you're an employee of X" off.
  employers?: EmployerLink[];
}

export interface EmployerLink {
  membershipId: string;
  businessId: string;
  businessName?: string | null;
  businessCode?: string | null;
  role?: string | null;
  since?: string | null;
}

// Mirror of the backend BusinessMembershipStatus / BusinessMembershipOrigin
// enums (eezit-backend prisma/schema/enums.prisma).
export type BusinessMembershipStatus =
  | "PENDING_BUSINESS_APPROVAL"
  | "PENDING_EMPLOYEE_APPROVAL"
  | "ACTIVE"
  | "REJECTED"
  | "REVOKED"
  | "LEFT";

export type BusinessMembershipOrigin =
  | "PARTNER_REQUEST"
  | "BUSINESS_INVITE"
  | "BUSINESS_CREATED"
  | "ADMIN";

interface PartnerMini {
  id: string;
  name?: string | null;
  type?: PartnerType;
  status?: PartnerStatus | EmployeeStatus;
  profilePhotoKey?: string | null;
  businessCode?: string | null;
  city?: string | null;
  /** Only present on the business-side team roster (employee rows). */
  phone?: string | null;
}

export interface BusinessMembership {
  id: string;
  employeePartnerId: string;
  businessPartnerId: string;
  status: BusinessMembershipStatus;
  origin: BusinessMembershipOrigin;
  role?: string | null;
  specializations: string[];
  endReason?: string | null;
  createdAt: string;
  respondedAt?: string | null;
  endedAt?: string | null;
  // Included depending on which side asked: the employee inbox carries
  // `businessPartner`, the business roster carries `employeePartner`.
  businessPartner?: PartnerMini;
  employeePartner?: PartnerMini;
}

// Backend NotificationType enum (prisma/schema/enums.prisma) — kept as a
// loose string rather than every literal, since the UI here never branches
// on it: title/body are always backend-authored copy, and the one behavior
// that *does* depend on the notification (the on-demand accept/decline
// popup) is driven off IncomingBroadcast/useIncomingBroadcasts polling, not
// off this field — see IncomingBookingModal.
export type NotificationChannel = "PUSH" | "SMS" | "WHATSAPP" | "EMAIL" | "IN_APP";

export interface NotificationItem {
  id: string;
  recipientRole: "CLIENT" | "PARTNER" | "ADMIN";
  recipientId: string;
  title: string;
  body: string;
  type: string;
  channel: NotificationChannel;
  deeplink?: string | null;
  imageKey?: string | null;
  data?: Record<string, unknown> | null;
  isRead: boolean;
  readAt?: string | null;
  isSent: boolean;
  sentAt?: string | null;
  createdAt: string;
  // isSent means "a provider accepted the message"; these mean "a device
  // actually received it", reported back by this client (see deliveryAck.ts).
  // Until a receipt lands the backend assumes the push was missed and climbs
  // its escalation ladder to SMS — see the backend's
  // shared/constants/notification-delivery.constants.ts.
  deliveredAt?: string | null;
  deliveredVia?: NotificationChannel | null;
  escalationStage?: number;
}

export type RegisterDeviceTokenBody = {
  fcmToken: string;
  deviceType: "WEB" | "ANDROID" | "IOS";
  deviceName?: string;
  deviceModel?: string;
};

// GET /partner/bookings/incoming (MatchmakingService.findIncomingBroadcasts)
// — one row per on-demand booking currently broadcast to this partner and
// still awaiting a response. `booking` here is the raw Prisma row (every
// scalar column, unlike the leaner shape GET /partner/bookings returns), so
// it's typed standalone rather than reusing the `Booking` interface above.
export type BroadcastResponse = "PENDING" | "ACCEPTED" | "REJECTED" | "TIMEOUT" | "SKIPPED";

export interface IncomingBroadcastItem {
  id: string;
  serviceItemId: string;
  serviceItemName: string;
  durationLabel?: string | null;
  price: number;
  durationMinutes: number;
  quantity: number;
  serviceItem: { name: string; cardTitle: string };
}

export interface IncomingBroadcast {
  id: string;
  bookingId: string;
  partnerId: string;
  broadcastedAt: string;
  response: BroadcastResponse;
  respondedAt?: string | null;
  rejectionReason?: string | null;
  notified: boolean;
  booking: {
    id: string;
    bookingType: "ON_DEMAND" | "SCHEDULED" | "RECURRING_INSTANCE";
    status: BookingStatus;
    scheduledDate: string;
    scheduledTime: string;
    estimatedDurationMinutes: number;
    clientNotes?: string | null;
    totalAmount: number;
    partnerEarning: number;
    address: {
      city?: string | null;
      pincode?: string | null;
      latitude: number;
      longitude: number;
    };
    items: IncomingBroadcastItem[];
  };
}

// Envelope shapes produced by the backend's TransformInterceptor /
// GlobalExceptionFilter (src/shared/interceptors/transform.interceptor.ts,
// src/shared/filters/global-exception.filter.ts) — every response is wrapped.
export interface ApiSuccessEnvelope<T> {
  success: true;
  data: T;
  meta: { timestamp: string; correlationId: string; path: string };
  pagination?: { total: number; page: number; limit: number; totalPages: number };
  /** Aggregate counts alongside a paginated list, independent of the
   *  current page/filter — e.g. `{ upcoming: 3, past: 12 }` for bookings,
   *  or `{ unread: 2, read: 40 }` for notifications — so tabs/badges don't
   *  need a second request. See the backend's `paginateWithCounts()`. */
  counts?: Record<string, number>;
}

export interface ApiErrorEnvelope {
  success: false;
  statusCode: number;
  error: { code: string; message: string; details?: unknown[] };
  meta: { timestamp: string; correlationId: string; path: string };
}
