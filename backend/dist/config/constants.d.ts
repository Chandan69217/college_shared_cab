export declare const USER_ROLES: {
    readonly STUDENT: "STUDENT";
    readonly DRIVER: "DRIVER";
    readonly ADMIN: "ADMIN";
};
export declare const USER_STATUSES: {
    readonly PENDING: "PENDING";
    readonly ACTIVE: "ACTIVE";
    readonly SUSPENDED: "SUSPENDED";
    readonly DEACTIVATED: "DEACTIVATED";
};
export declare const VERIFICATION_STATUSES: {
    readonly PENDING: "PENDING";
    readonly VERIFIED: "VERIFIED";
    readonly REJECTED: "REJECTED";
    readonly SUSPENDED: "SUSPENDED";
};
export declare const DRIVER_STATUSES: {
    readonly ACTIVE: "ACTIVE";
    readonly INACTIVE: "INACTIVE";
    readonly SUSPENDED: "SUSPENDED";
    readonly ON_LEAVE: "ON_LEAVE";
};
export declare const VEHICLE_TYPES: {
    readonly CAB_4: "CAB_4";
    readonly CAB_6: "CAB_6";
    readonly SHUTTLE_12: "SHUTTLE_12";
    readonly BUS_24: "BUS_24";
};
export declare const VEHICLE_STATUSES: {
    readonly ACTIVE: "ACTIVE";
    readonly INACTIVE: "INACTIVE";
    readonly MAINTENANCE: "MAINTENANCE";
};
export declare const PLAN_TIERS: {
    readonly BASIC: "BASIC";
    readonly STANDARD: "STANDARD";
    readonly PREMIUM: "PREMIUM";
};
export declare const SUBSCRIPTION_STATUSES: {
    readonly PENDING_PAYMENT: "PENDING_PAYMENT";
    readonly ACTIVE: "ACTIVE";
    readonly EXPIRED: "EXPIRED";
    readonly CANCELLED: "CANCELLED";
};
export declare const TRIP_TYPES: {
    readonly MORNING_PICKUP: "MORNING_PICKUP";
    readonly EVENING_DROP: "EVENING_DROP";
};
export declare const TRIP_STATUSES: {
    readonly SCHEDULED: "SCHEDULED";
    readonly IN_PROGRESS: "IN_PROGRESS";
    readonly COMPLETED: "COMPLETED";
    readonly CANCELLED: "CANCELLED";
};
export declare const BOOKING_STATUSES: {
    readonly CONFIRMED: "CONFIRMED";
    readonly CANCELLED: "CANCELLED";
    readonly COMPLETED: "COMPLETED";
    readonly NO_SHOW: "NO_SHOW";
};
export declare const PASSENGER_STATUSES: {
    readonly WAITING: "WAITING";
    readonly BOARDED: "BOARDED";
    readonly NO_SHOW: "NO_SHOW";
};
export declare const PASS_STATUSES: {
    readonly ACTIVE: "ACTIVE";
    readonly USED: "USED";
    readonly EXPIRED: "EXPIRED";
    readonly CANCELLED: "CANCELLED";
};
export declare const PAYMENT_METHODS: {
    readonly UPI: "UPI";
    readonly DEBIT_CARD: "DEBIT_CARD";
    readonly CREDIT_CARD: "CREDIT_CARD";
    readonly NET_BANKING: "NET_BANKING";
    readonly WALLET: "WALLET";
};
export declare const PAYMENT_STATUSES: {
    readonly PENDING: "PENDING";
    readonly SUCCESS: "SUCCESS";
    readonly FAILED: "FAILED";
    readonly REFUNDED: "REFUNDED";
};
export declare const COMPLAINT_CATEGORIES: {
    readonly BOOKING: "BOOKING";
    readonly PAYMENT: "PAYMENT";
    readonly DRIVER: "DRIVER";
    readonly VEHICLE: "VEHICLE";
    readonly PASS_QR: "PASS_QR";
    readonly SUBSCRIPTION: "SUBSCRIPTION";
    readonly LOST_ITEM: "LOST_ITEM";
    readonly OTHER: "OTHER";
};
export declare const COMPLAINT_PRIORITIES: {
    readonly LOW: "LOW";
    readonly MEDIUM: "MEDIUM";
    readonly HIGH: "HIGH";
    readonly URGENT: "URGENT";
};
export declare const COMPLAINT_STATUSES: {
    readonly OPEN: "OPEN";
    readonly IN_PROGRESS: "IN_PROGRESS";
    readonly RESOLVED: "RESOLVED";
    readonly CLOSED: "CLOSED";
};
export declare const NOTIFICATION_PRIORITIES: {
    readonly LOW: "LOW";
    readonly NORMAL: "NORMAL";
    readonly HIGH: "HIGH";
    readonly CRITICAL: "CRITICAL";
};
export declare const NOTIFICATION_TYPES: {
    readonly BOOKING_CREATED: "BOOKING_CREATED";
    readonly BOOKING_CONFIRMED: "BOOKING_CONFIRMED";
    readonly BOOKING_ACCEPTED: "BOOKING_ACCEPTED";
    readonly BOOKING_REJECTED: "BOOKING_REJECTED";
    readonly BOOKING_CANCELLED: "BOOKING_CANCELLED";
    readonly NEW_RIDE_REQUEST: "NEW_RIDE_REQUEST";
    readonly DRIVER_ASSIGNED: "DRIVER_ASSIGNED";
    readonly VEHICLE_ASSIGNED: "VEHICLE_ASSIGNED";
    readonly TRIP_STARTED: "TRIP_STARTED";
    readonly TRIP_COMPLETED: "TRIP_COMPLETED";
    readonly TRIP_CANCELLED: "TRIP_CANCELLED";
    readonly TRIP_DELAYED: "TRIP_DELAYED";
    readonly DRIVER_ON_DUTY: "DRIVER_ON_DUTY";
    readonly DRIVER_OFF_DUTY: "DRIVER_OFF_DUTY";
    readonly VEHICLE_APPROACHING: "VEHICLE_APPROACHING";
    readonly VEHICLE_ARRIVED: "VEHICLE_ARRIVED";
    readonly PICKUP_REMINDER: "PICKUP_REMINDER";
    readonly DROP_REMINDER: "DROP_REMINDER";
    readonly BOARDING_CONFIRMED: "BOARDING_CONFIRMED";
    readonly PASSENGER_NOT_BOARDED: "PASSENGER_NOT_BOARDED";
    readonly SUBSCRIPTION_PURCHASED: "SUBSCRIPTION_PURCHASED";
    readonly SUBSCRIPTION_ACTIVATED: "SUBSCRIPTION_ACTIVATED";
    readonly SUBSCRIPTION_EXPIRING: "SUBSCRIPTION_EXPIRING";
    readonly SUBSCRIPTION_EXPIRED: "SUBSCRIPTION_EXPIRED";
    readonly PAYMENT_SUCCESS: "PAYMENT_SUCCESS";
    readonly PAYMENT_FAILED: "PAYMENT_FAILED";
    readonly PAYMENT_REFUNDED: "PAYMENT_REFUNDED";
    readonly DAILY_PASS_AVAILABLE: "DAILY_PASS_AVAILABLE";
    readonly QR_GENERATED: "QR_GENERATED";
    readonly QR_INVALID: "QR_INVALID";
    readonly QR_ALREADY_USED: "QR_ALREADY_USED";
    readonly ROUTE_CHANGED: "ROUTE_CHANGED";
    readonly PICKUP_POINT_CHANGED: "PICKUP_POINT_CHANGED";
    readonly COMPLAINT_CREATED: "COMPLAINT_CREATED";
    readonly COMPLAINT_UPDATED: "COMPLAINT_UPDATED";
    readonly COMPLAINT_RESOLVED: "COMPLAINT_RESOLVED";
    readonly ACCOUNT_CREATED: "ACCOUNT_CREATED";
    readonly ACCOUNT_UPDATED: "ACCOUNT_UPDATED";
    readonly ACCOUNT_VERIFIED: "ACCOUNT_VERIFIED";
    readonly ACCOUNT_REJECTED: "ACCOUNT_REJECTED";
    readonly KYC_SUBMITTED: "KYC_SUBMITTED";
    readonly SYSTEM_ANNOUNCEMENT: "SYSTEM_ANNOUNCEMENT";
    readonly IMPORTANT_ALERT: "IMPORTANT_ALERT";
    readonly MAINTENANCE: "MAINTENANCE";
    readonly ROUTE_UPDATE: "ROUTE_UPDATE";
    readonly SERVICE_UPDATE: "SERVICE_UPDATE";
    readonly EMERGENCY_SOS: "EMERGENCY_SOS";
    readonly BOOKING: "BOOKING";
    readonly TRIP: "TRIP";
    readonly SUBSCRIPTION: "SUBSCRIPTION";
    readonly PAYMENT: "PAYMENT";
    readonly EMERGENCY: "EMERGENCY";
    readonly GENERAL: "GENERAL";
};
