import axios from 'axios';

const defaultUrl = import.meta.env.DEV
  ? 'http://localhost:5000/api/v1'
  : 'https://college-shared-cab-api.onrender.com/api/v1';

const rawUrl = (import.meta.env.VITE_API_URL || defaultUrl).toString().trim();
const apiBaseUrl = rawUrl.endsWith('/api/v1')
  ? rawUrl
  : `${rawUrl.replace(/\/api$/, '').replace(/\/$/, '')}/api/v1`;

export const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercept 401 Unauthorized for expired sessions (excluding login endpoint)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

const ERROR_CODE_MAP: Record<string, string> = {
  // Auth
  AUTH_INVALID_CREDENTIALS: 'Invalid email/phone or password. Please check your credentials and try again.',
  INVALID_CREDENTIALS: 'Invalid email/phone or password. Please check your credentials and try again.',
  AUTH_USER_NOT_FOUND: 'Account not found. We couldn\'t find an account with the credentials provided.',
  USER_NOT_REGISTERED: 'Account not found. We couldn\'t find an account with the credentials you entered.',
  ACCOUNT_NOT_FOUND: 'Account not found. We couldn\'t find an account with the credentials you entered.',
  AUTH_SESSION_EXPIRED: 'Your session has expired. Please sign in again to continue.',
  AUTH_UNAUTHORIZED: 'Authentication required. Please sign in to access this feature.',
  AUTH_FORBIDDEN: 'Access restricted. You do not have permission to perform this action.',
  AUTH_ROLE_MISMATCH: 'Access restricted. You do not have administrative privileges to sign in here.',
  ROLE_MISMATCH: 'Access restricted. You do not have administrative privileges to sign in here.',
  AUTH_ACCOUNT_SUSPENDED: 'Account suspended. Please contact campus administration for assistance.',
  ACCOUNT_SUSPENDED: 'Account suspended. Your account is currently suspended. Please contact support for assistance.',
  AUTH_ACCOUNT_DEACTIVATED: 'Account deactivated. This account is no longer active.',
  ACCOUNT_DEACTIVATED: 'Account deactivated. This account is no longer active.',
  AUTH_ACCOUNT_LOCKED: 'Account locked. Please contact administration for assistance.',
  ACCOUNT_LOCKED: 'Account locked. Please contact administration for assistance.',
  AUTH_RATE_LIMIT_EXCEEDED: 'Too many attempts. Please try again after 15 minutes.',
  OTP_INVALID: 'Invalid OTP. The OTP you entered is incorrect. Please try again.',
  OTP_EXPIRED: 'OTP expired. This OTP has expired. Please request a new OTP.',
  OTP_RATE_LIMITED: 'Too many attempts. Please wait before requesting or entering another OTP.',

  // Validation
  VALIDATION_ERROR: 'Please check the required fields and ensure the entered information is valid.',
  VALIDATION_REQUIRED_FIELD: 'Please fill in all required fields.',
  VALIDATION_INVALID_DATA: 'The submitted data is invalid. Please review your input.',
  INVALID_ID_FORMAT: 'Invalid identifier format.',
  DUPLICATE_RESOURCE: 'A record with this information already exists in the system.',

  // Operational Entities & Foreign Key Constraints
  COLLEGE_NOT_FOUND: 'The specified college institution was not found.',
  ROUTE_NOT_FOUND: 'Selected shuttle route could not be found.',
  PICKUP_POINT_NOT_FOUND: 'Selected pickup point is invalid or not available.',
  INVALID_PICKUP_STOP: 'This pickup point does not belong to the selected route.',
  INVALID_DROP_STOP: 'This drop point is not valid for the selected route.',
  INVALID_STOP_SEQUENCE: 'Drop point must be located after the pickup point along the route.',
  PICKUP_STOP_ALREADY_PASSED: 'All available cabs have already passed this pickup point.',
  VEHICLE_NOT_FOUND: 'The specified vehicle record was not found.',
  DRIVER_NOT_FOUND: 'The specified driver record was not found.',
  DRIVER_UNAVAILABLE: 'No driver is currently available for this trip.',
  UNAUTHORIZED_DRIVER: 'You are not authorized as the assigned driver for this trip.',
  PROTECTED_RECORD_REFERENCE: 'This record cannot be permanently deleted because active operational records (such as trips, bookings, or historical records) are linked to it. You can deactivate it instead.',

  // Booking & Cab Availability
  NO_CAB_AVAILABLE: 'No eligible cab is currently available for your selected route and pickup point.',
  ALL_CABS_PASSED_STOP: 'All available cabs have already passed this pickup point.',
  ALL_CABS_FULL: 'The selected cab is full. All cabs on this route have reached maximum capacity.',
  BOOKING_FULL: 'Ride fully booked. There are no seats available on this trip. Please select another trip.',
  BOOKING_NOT_FOUND: 'Booking record not found.',
  BOOKING_ALREADY_EXISTS: 'You already have an active booking for this trip.',
  ALREADY_BOOKED: 'Already booked. You already have an active booking for this trip.',
  BOOKING_CANCELLED: 'This booking has been cancelled.',
  CANCELLATION_UNAVAILABLE: 'Cancellation unavailable. This booking can no longer be cancelled according to the cancellation policy.',

  // Trips
  TRIP_NOT_FOUND: 'Scheduled trip record not found.',
  TRIP_UNAVAILABLE: 'This trip is not currently open for bookings.',
  TRIP_NOT_ACTIVE: 'GPS updates are only active during trips that are currently in progress.',
  TRIP_ALREADY_COMPLETED: 'This trip has already concluded.',
  NO_TRIP_ASSIGNED: 'No trip assigned. You do not have a trip assigned for this time.',

  // Pass & QR
  PASS_NOT_FOUND: 'Daily travel pass not found.',
  PASS_INACTIVE: 'This pass is no longer active for travel.',
  PASS_EXPIRED: 'Pass expired. This travel pass has expired. Please use a valid pass.',
  PASS_INVALID: 'Invalid pass. This travel pass could not be verified.',
  PASS_ALREADY_USED: 'Pass already used. This travel pass has already been used for boarding.',
  QR_INVALID: 'Invalid or counterfeit QR code signature.',
  QR_EXPIRED: 'QR code expired. Student must refresh their daily pass.',
  QR_ALREADY_USED: 'REPLAY DETECTED: This pass has already been used for boarding.',
  QR_WRONG_TRIP: 'This pass is for a different scheduled trip.',

  // KYC
  STUDENT_NOT_VERIFIED: 'Student account is pending administrative verification. Booking is disabled.',
  KYC_REQUIRED: 'Student KYC is pending administrative approval.',
  VERIFICATION_PENDING: 'Verification pending. Student verification is currently under review.',
  VERIFICATION_REJECTED: 'Verification rejected. Student verification was not approved.',

  // Subscriptions & Plans
  PLAN_NOT_FOUND: 'Subscription plan not found.',
  PLAN_INACTIVE: 'This subscription plan is not currently available.',
  SUBSCRIPTION_REQUIRED: 'Active subscription required. Please purchase or activate a transportation plan before booking a ride.',
  NO_ACTIVE_SUBSCRIPTION: 'No active subscription with available ride credits found.',
  SUBSCRIPTION_EXPIRED: 'Subscription expired. Your transportation subscription has expired. Please renew your plan to continue.',
  NO_RIDES_REMAINING: 'All ride credits in this subscription plan have been used.',

  // Payments
  PAYMENT_NOT_FOUND: 'Payment record not found.',
  PAYMENT_FAILED: 'Payment transaction could not be completed.',
  PAYMENT_REQUIRED: 'Payment is required to activate this transportation plan.',
  PAYMENT_NOT_VERIFIED: 'Payment verification failed.',
  PAYMENT_ALREADY_PROCESSED: 'This payment transaction has already been processed.',
  INVALID_PAYMENT_PAYLOAD: 'Payment transaction information is invalid or incomplete.',

  // System
  MAINTENANCE_MODE: 'Transportation booking is temporarily suspended for scheduled platform maintenance.',
  DATABASE_UNAVAILABLE: 'Database service is temporarily unavailable. Please try again in a moment.',
  SERVER_ERROR: 'Something went wrong. We couldn\'t complete your request right now. Please try again later.',
  INTERNAL_ERROR: 'An unexpected error occurred. Please try again later.',
  INTERNAL_SERVER_ERROR: 'Something went wrong. We couldn\'t complete your request right now. Please try again later.',
  NETWORK_ERROR: 'Connection problem. We couldn\'t connect to the server. Please check your internet connection and try again.',
  TIMEOUT: 'Request timed out. The server took too long to respond. Please try again.',
};

/**
 * Extracts a user-friendly error message from an Axios error or generic error
 */
export function getApiErrorMessage(err: any): string {
  const code = err?.response?.data?.error?.code || (typeof err?.response?.data?.error === 'string' ? err?.response?.data?.error : null);
  if (code && ERROR_CODE_MAP[code]) {
    return ERROR_CODE_MAP[code];
  }

  if (err?.response?.data?.message) {
    const msg = String(err.response.data.message);
    if (!msg.includes('PostgrestException') && !msg.includes('violates foreign key') && !msg.includes('syntax error')) {
      return msg;
    }
  }
  if (err?.response?.data?.error?.details && Array.isArray(err.response.data.error.details)) {
    return err.response.data.error.details.map((d: any) => `${d.field ? `${d.field}: ` : ''}${d.message}`).join(', ');
  }
  if (err?.response?.data?.error?.message) {
    const msg = String(err.response.data.error.message);
    if (!msg.includes('PostgrestException') && !msg.includes('violates foreign key') && !msg.includes('syntax error')) {
      return msg;
    }
  }
  if (typeof err?.response?.data?.error === 'string') {
    const errStr = err.response.data.error;
    if (ERROR_CODE_MAP[errStr]) {
      return ERROR_CODE_MAP[errStr];
    }
    if (!errStr.includes('PostgrestException') && !errStr.includes('violates')) {
      return errStr;
    }
  }
  if (err?.message && !err.message.includes('status code') && !err.message.includes('Network Error') && !err.message.includes('AxiosError')) {
    return err.message;
  }
  if (err?.response?.status === 400) {
    return 'Invalid request data. Please check your input and try again.';
  }
  if (err?.response?.status === 401) {
    return 'Invalid email/phone or password. Please check your credentials and try again.';
  }
  if (err?.response?.status === 403) {
    return 'Access denied. You do not have administrative privileges.';
  }
  if (err?.response?.status === 404) {
    return 'The requested resource was not found.';
  }
  if (err?.response?.status === 409) {
    return 'A record with this information already exists.';
  }
  if (err?.response?.status && err.response.status >= 500) {
    return 'Something went wrong on our end. Please try again later.';
  }
  return 'Connection problem. We couldn\'t connect to the server. Please check your internet connection and try again.';
}


