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
export declare const NOTIFICATION_TYPES: {
    readonly BOOKING: "BOOKING";
    readonly TRIP: "TRIP";
    readonly SUBSCRIPTION: "SUBSCRIPTION";
    readonly PAYMENT: "PAYMENT";
    readonly EMERGENCY: "EMERGENCY";
    readonly GENERAL: "GENERAL";
};
