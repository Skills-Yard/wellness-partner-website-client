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

export interface ServiceItem {
  id: string;
  categoryId: string;
  name: string;
  slug?: string;
  title: string;
  subtitle?: string;
  category?: { id: string; name: string; title?: string };
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
}

export interface TrainingModule {
  id: string;
  courseId: string;
  title: string;
  displayOrder: number;
  isActive: boolean;
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
  totalBookings: number;
  completionRate: number;
  averageRating: number;
  totalReviews: number;
  isActive: boolean;
  isOnline: boolean;
  onboardingStep: number;
  approvedAt?: string | null;
  kyc?: PartnerKyc | null;
  bankAccount?: BankAccount | null;
  partnerServices?: PartnerService[];
  availability?: PartnerAvailability[];
  employees?: PartnerEmployee[];
  trainingProgress?: PartnerTrainingProgress[];
}

// Envelope shapes produced by the backend's TransformInterceptor /
// GlobalExceptionFilter (src/shared/interceptors/transform.interceptor.ts,
// src/shared/filters/global-exception.filter.ts) — every response is wrapped.
export interface ApiSuccessEnvelope<T> {
  success: true;
  data: T;
  meta: { timestamp: string; correlationId: string; path: string };
  pagination?: { total: number; page: number; limit: number; totalPages: number };
}

export interface ApiErrorEnvelope {
  success: false;
  statusCode: number;
  error: { code: string; message: string; details?: unknown[] };
  meta: { timestamp: string; correlationId: string; path: string };
}
