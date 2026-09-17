import { USER_ROLES, USER_STATUSES, VERIFICATION_STATUSES, DRIVER_STATUSES, VEHICLE_TYPES, VEHICLE_STATUSES, PLAN_TIERS, SUBSCRIPTION_STATUSES, TRIP_TYPES, TRIP_STATUSES, BOOKING_STATUSES, PASSENGER_STATUSES, PASS_STATUSES, PAYMENT_METHODS, PAYMENT_STATUSES, COMPLAINT_CATEGORIES, COMPLAINT_PRIORITIES, COMPLAINT_STATUSES, NOTIFICATION_TYPES, NOTIFICATION_PRIORITIES } from '../config/constants';
export type UserRole = keyof typeof USER_ROLES;
export type UserStatus = keyof typeof USER_STATUSES;
export type VerificationStatus = keyof typeof VERIFICATION_STATUSES;
export type DriverStatus = keyof typeof DRIVER_STATUSES;
export type VehicleType = keyof typeof VEHICLE_TYPES;
export type VehicleStatus = keyof typeof VEHICLE_STATUSES;
export type PlanTier = keyof typeof PLAN_TIERS;
export type SubscriptionStatus = keyof typeof SUBSCRIPTION_STATUSES;
export type TripType = keyof typeof TRIP_TYPES;
export type TripStatus = keyof typeof TRIP_STATUSES;
export type BookingStatus = keyof typeof BOOKING_STATUSES;
export type PassengerStatus = keyof typeof PASSENGER_STATUSES;
export type PassStatus = keyof typeof PASS_STATUSES;
export type PaymentMethod = keyof typeof PAYMENT_METHODS;
export type PaymentStatus = keyof typeof PAYMENT_STATUSES;
export type ComplaintCategory = keyof typeof COMPLAINT_CATEGORIES;
export type ComplaintPriority = keyof typeof COMPLAINT_PRIORITIES;
export type ComplaintStatus = keyof typeof COMPLAINT_STATUSES;
export type NotificationType = keyof typeof NOTIFICATION_TYPES;
export type NotificationPriority = keyof typeof NOTIFICATION_PRIORITIES;
export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T | null;
    error?: {
        code: string;
        message?: string;
        details?: any;
    } | null;
}
export interface User {
    id: string;
    email: string;
    phone: string;
    full_name: string;
    password_hash: string;
    role: UserRole;
    status: UserStatus;
    avatar_url?: string | null;
    created_at: string;
    updated_at: string;
}
export interface College {
    id: string;
    name: string;
    code: string;
    address: string;
    latitude: number;
    longitude: number;
    service_radius_km: number;
    contact_email: string;
    contact_phone: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}
export interface StudentProfile {
    id: string;
    college_id: string;
    college?: College;
    student_id_number: string;
    roll_number?: string;
    course: string;
    semester: number;
    id_card_url?: string;
    verification_status: VerificationStatus;
    verification_notes?: string;
    verified_at?: string;
    verified_by?: string;
    created_at: string;
    updated_at: string;
}
export interface DriverProfile {
    id: string;
    college_id: string;
    college?: College;
    license_number: string;
    license_expiry: string;
    aadhar_number?: string;
    experience_years: number;
    status: DriverStatus;
    rating_avg: number;
    total_trips: number;
    documents?: Record<string, any>;
    created_at: string;
    updated_at: string;
}
export interface AdminProfile {
    id: string;
    full_name: string;
    department: string;
    permissions: string[];
    created_at: string;
    updated_at: string;
}
export interface PickupPoint {
    id: string;
    college_id: string;
    college?: College;
    name: string;
    landmark?: string;
    address: string;
    latitude: number;
    longitude: number;
    distance_to_college_km: number;
    is_approved: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}
export interface Vehicle {
    id: string;
    college_id: string;
    college?: College;
    vehicle_number: string;
    model: string;
    type: VehicleType;
    seating_capacity: number;
    registration_number: string;
    insurance_validity: string;
    fitness_validity: string;
    status: VehicleStatus;
    created_at: string;
    updated_at: string;
}
export interface RouteStop {
    id: string;
    route_id: string;
    pickup_point_id: string;
    pickup_point?: PickupPoint;
    sequence_order: number;
    morning_pickup_time: string;
    evening_drop_time: string;
    created_at: string;
}
export interface Route {
    id: string;
    college_id: string;
    college?: College;
    name: string;
    code: string;
    description?: string;
    morning_departure_time: string;
    evening_departure_time: string;
    estimated_duration_mins: number;
    default_vehicle_id?: string | null;
    default_driver_id?: string | null;
    max_capacity: number;
    is_active: boolean;
    stops?: RouteStop[];
    created_at: string;
    updated_at: string;
}
export interface SubscriptionPlan {
    id: string;
    college_id: string;
    college?: College;
    tier: PlanTier;
    name: string;
    description?: string;
    price: number;
    validity_days: number;
    ride_count_total: number;
    is_unlimited_rides: boolean;
    priority_booking: boolean;
    one_way_allowed: boolean;
    round_trip_allowed: boolean;
    cancellation_hours_limit: number;
    cancellation_fee_percentage: number;
    additional_ride_charge: number;
    status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
    created_at: string;
    updated_at: string;
}
export interface Subscription {
    id: string;
    student_id: string;
    plan_id: string;
    plan?: SubscriptionPlan;
    start_date: string;
    end_date: string;
    total_rides_allocated: number;
    remaining_rides: number;
    status: SubscriptionStatus;
    payment_id?: string;
    auto_renew: boolean;
    created_at: string;
    updated_at: string;
}
export interface Trip {
    id: string;
    route_id: string;
    route?: Route;
    vehicle_id: string;
    vehicle?: Vehicle;
    driver_id?: string | null;
    driver?: User | null;
    trip_date: string;
    trip_type: TripType;
    scheduled_departure_time: string;
    actual_start_time?: string;
    actual_end_time?: string;
    status: TripStatus;
    max_capacity: number;
    booked_seats: number;
    boarded_passengers: number;
    current_stop_sequence?: number;
    live_latitude?: number;
    live_longitude?: number;
    last_gps_update?: string;
    created_at: string;
    updated_at: string;
}
export interface VehicleCurrentLocation {
    id: string;
    vehicle_id: string;
    trip_id: string;
    driver_id: string;
    latitude: number;
    longitude: number;
    accuracy: number;
    speed: number;
    heading: number;
    timestamp: string;
    updated_at: string;
}
export interface VehicleLocationHistory {
    id: string;
    vehicle_id: string;
    trip_id: string;
    driver_id: string;
    latitude: number;
    longitude: number;
    accuracy: number;
    speed: number;
    heading: number;
    recorded_at: string;
}
export interface Booking {
    id: string;
    student_id: string;
    student?: User;
    subscription_id: string;
    trip_id: string;
    trip?: Trip;
    route_id: string;
    route?: Route;
    pickup_point_id: string;
    pickup_point?: PickupPoint;
    drop_point_id?: string;
    drop_point?: PickupPoint;
    booking_date: string;
    trip_type: TripType;
    seat_number?: number;
    status: BookingStatus;
    cancellation_reason?: string;
    cancelled_at?: string;
    created_at: string;
    updated_at: string;
}
export interface TripPassenger {
    id: string;
    trip_id: string;
    booking_id: string;
    student_id: string;
    student?: User;
    pickup_point_id: string;
    pickup_point?: PickupPoint;
    drop_point_id?: string;
    drop_point?: PickupPoint;
    pickup_stop_sequence?: number;
    drop_stop_sequence?: number;
    pickup_name?: string;
    drop_name?: string;
    status: PassengerStatus;
    boarded_at?: string;
    verified_by_driver_id?: string;
    created_at: string;
    updated_at: string;
}
export interface DailyTravelPass {
    id: string;
    student_id: string;
    booking_id: string;
    trip_id: string;
    trip?: Trip;
    pass_date: string;
    trip_type: TripType;
    route_id: string;
    route?: Route;
    pickup_point_id: string;
    pickup_point?: PickupPoint;
    drop_point_id?: string;
    drop_point?: PickupPoint;
    auth_token_hash: string;
    valid_until: string;
    status: PassStatus;
    used_at?: string;
    created_at: string;
    updated_at: string;
}
export interface Payment {
    id: string;
    student_id: string;
    subscription_id?: string;
    amount: number;
    currency: string;
    payment_method: PaymentMethod;
    transaction_id?: string;
    gateway_order_id?: string;
    gateway_signature?: string;
    status: PaymentStatus;
    receipt_number?: string;
    error_message?: string;
    created_at: string;
    updated_at: string;
}
export interface Complaint {
    id: string;
    ticket_number: string;
    student_id: string;
    student?: User;
    category: ComplaintCategory;
    subject: string;
    description: string;
    priority: ComplaintPriority;
    status: ComplaintStatus;
    admin_response?: string;
    resolved_by?: string;
    resolved_at?: string;
    created_at: string;
    updated_at: string;
}
export interface Rating {
    id: string;
    trip_id: string;
    student_id: string;
    driver_id: string;
    rating_stars: number;
    feedback_text?: string;
    tags?: string[];
    created_at: string;
}
export interface Notification {
    id: string;
    user_id: string;
    recipient_role?: UserRole;
    title: string;
    message: string;
    type: NotificationType;
    entity_type?: string;
    entity_id?: string;
    priority?: NotificationPriority;
    is_read: boolean;
    read_at?: string | null;
    data?: Record<string, any>;
    created_at: string;
}
export interface UserDevice {
    id: string;
    user_id: string;
    device_token: string;
    platform: 'android' | 'ios' | 'web';
    device_name?: string;
    app_version?: string;
    is_active: boolean;
    last_seen_at: string;
    created_at: string;
    updated_at: string;
}
export interface CollegeHoliday {
    id: string;
    college_id: string;
    holiday_date: string;
    title: string;
    holiday_type: 'COLLEGE_HOLIDAY' | 'EXAM_HOLIDAY' | 'SUNDAY' | 'SPECIAL';
    is_service_disabled: boolean;
    created_at: string;
}
export interface AuthTokenPayload {
    userId: string;
    email: string;
    role: UserRole;
    fullName: string;
}
export interface DynamicQrPayload {
    passId: string;
    studentId: string;
    tripId: string;
    routeId: string;
    date: string;
    exp: number;
    sig: string;
}
