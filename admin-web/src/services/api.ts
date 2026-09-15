import axios from 'axios';

export const api = axios.create({
  baseURL: '/api/v1',
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
  VALIDATION_ERROR: 'Please check the required fields and ensure the entered information is valid.',
  INVALID_CREDENTIALS: 'Invalid email/phone or password. Please check your credentials and try again.',
  USER_NOT_REGISTERED: 'Account not found. We couldn\'t find an account with the credentials you entered. Please check your details or create an account.',
  ACCOUNT_NOT_FOUND: 'Account not found. We couldn\'t find an account with the credentials you entered.',
  ACCOUNT_SUSPENDED: 'Account suspended. Your account is currently suspended. Please contact support for assistance.',
  ACCOUNT_DEACTIVATED: 'Account deactivated. This account is no longer active. Please contact support.',
  ACCOUNT_LOCKED: 'Account locked. Please contact administration for assistance.',
  ROLE_MISMATCH: 'Access restricted. You do not have administrative privileges to sign in here.',
  VERIFICATION_PENDING: 'Verification pending. Your student verification is currently under review.',
  VERIFICATION_REJECTED: 'Verification rejected. Your student verification was not approved.',
  OTP_INVALID: 'Invalid OTP. The OTP you entered is incorrect. Please try again.',
  OTP_EXPIRED: 'OTP expired. This OTP has expired. Please request a new OTP.',
  OTP_RATE_LIMITED: 'Too many attempts. Please wait before requesting or entering another OTP.',
  AUTH_RATE_LIMIT_EXCEEDED: 'Too many login attempts. Please try again after 15 minutes.',
  SUBSCRIPTION_REQUIRED: 'Active subscription required. Please purchase or activate a transportation plan before booking a ride.',
  SUBSCRIPTION_EXPIRED: 'Subscription expired. Your transportation subscription has expired. Please renew your plan to continue.',
  PAYMENT_REQUIRED: 'Payment required. Please complete the payment to activate your subscription.',
  BOOKING_FULL: 'Ride fully booked. There are no seats available on this trip. Please select another trip.',
  ALREADY_BOOKED: 'Already booked. You already have an active booking for this trip.',
  CANCELLATION_UNAVAILABLE: 'Cancellation unavailable. This booking can no longer be cancelled according to the cancellation policy.',
  INVALID_ROUTE: 'Invalid route. This route is not available for your selected booking.',
  PASS_INVALID: 'Invalid pass. This travel pass could not be verified.',
  PASS_EXPIRED: 'Pass expired. This travel pass has expired. Please use a valid pass.',
  PASS_ALREADY_USED: 'Pass already used. This travel pass has already been used for boarding.',
  NO_TRIP_ASSIGNED: 'No trip assigned. You do not have a trip assigned for this time.',
  NETWORK_ERROR: 'Connection problem. We couldn\'t connect to the server. Please check your internet connection and try again.',
  TIMEOUT: 'Request timed out. The server took too long to respond. Please try again.',
  INTERNAL_SERVER_ERROR: 'Something went wrong. We couldn\'t complete your request right now. Please try again later.',
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
    return err.response.data.message;
  }
  if (err?.response?.data?.error?.details && Array.isArray(err.response.data.error.details)) {
    return err.response.data.error.details.map((d: any) => `${d.field ? `${d.field}: ` : ''}${d.message}`).join(', ');
  }
  if (err?.response?.data?.error?.message) {
    return err.response.data.error.message;
  }
  if (err?.message && !err.message.includes('status code')) {
    return err.message;
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
    return 'Something went wrong. We couldn\'t complete your request right now. Please try again later.';
  }
  return 'Connection problem. We couldn\'t connect to the server. Please check your internet connection and try again.';
}


