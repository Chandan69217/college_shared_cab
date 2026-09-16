import { z } from 'zod';
export declare const registerStudentSchema: z.ZodEffects<z.ZodObject<{
    email: z.ZodString;
    phone: z.ZodString;
    full_name: z.ZodString;
    password: z.ZodString;
    college_id: z.ZodOptional<z.ZodString>;
    college_code: z.ZodOptional<z.ZodString>;
    student_id_number: z.ZodString;
    roll_number: z.ZodOptional<z.ZodString>;
    course: z.ZodString;
    semester: z.ZodNumber;
    id_card_url: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    phone: string;
    full_name: string;
    student_id_number: string;
    course: string;
    semester: number;
    password: string;
    college_id?: string | undefined;
    roll_number?: string | undefined;
    id_card_url?: string | undefined;
    college_code?: string | undefined;
}, {
    email: string;
    phone: string;
    full_name: string;
    student_id_number: string;
    course: string;
    semester: number;
    password: string;
    college_id?: string | undefined;
    roll_number?: string | undefined;
    id_card_url?: string | undefined;
    college_code?: string | undefined;
}>, {
    email: string;
    phone: string;
    full_name: string;
    student_id_number: string;
    course: string;
    semester: number;
    password: string;
    college_id?: string | undefined;
    roll_number?: string | undefined;
    id_card_url?: string | undefined;
    college_code?: string | undefined;
}, {
    email: string;
    phone: string;
    full_name: string;
    student_id_number: string;
    course: string;
    semester: number;
    password: string;
    college_id?: string | undefined;
    roll_number?: string | undefined;
    id_card_url?: string | undefined;
    college_code?: string | undefined;
}>;
export declare const loginSchema: z.ZodObject<{
    emailOrPhone: z.ZodString;
    password: z.ZodString;
    role: z.ZodOptional<z.ZodEnum<["STUDENT", "DRIVER", "ADMIN"]>>;
}, "strip", z.ZodTypeAny, {
    password: string;
    emailOrPhone: string;
    role?: "STUDENT" | "DRIVER" | "ADMIN" | undefined;
}, {
    password: string;
    emailOrPhone: string;
    role?: "STUDENT" | "DRIVER" | "ADMIN" | undefined;
}>;
export declare const requestOtpSchema: z.ZodObject<{
    phone: z.ZodString;
}, "strip", z.ZodTypeAny, {
    phone: string;
}, {
    phone: string;
}>;
export declare const verifyOtpSchema: z.ZodObject<{
    phone: z.ZodString;
    otp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    phone: string;
    otp: string;
}, {
    phone: string;
    otp: string;
}>;
export declare const changePasswordSchema: z.ZodEffects<z.ZodEffects<z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
    confirmPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}, {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}>, {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}, {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}>, {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}, {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}>;
export declare const forgotPasswordSchema: z.ZodEffects<z.ZodObject<{
    identifier: z.ZodOptional<z.ZodString>;
    emailOrPhone: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodEnum<["STUDENT", "DRIVER", "ADMIN"]>>;
}, "strip", z.ZodTypeAny, {
    identifier?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    role?: "STUDENT" | "DRIVER" | "ADMIN" | undefined;
    emailOrPhone?: string | undefined;
}, {
    identifier?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    role?: "STUDENT" | "DRIVER" | "ADMIN" | undefined;
    emailOrPhone?: string | undefined;
}>, {
    identifier?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    role?: "STUDENT" | "DRIVER" | "ADMIN" | undefined;
    emailOrPhone?: string | undefined;
}, {
    identifier?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    role?: "STUDENT" | "DRIVER" | "ADMIN" | undefined;
    emailOrPhone?: string | undefined;
}>;
export declare const verifyRecoveryOtpSchema: z.ZodEffects<z.ZodObject<{
    identifier: z.ZodOptional<z.ZodString>;
    emailOrPhone: z.ZodOptional<z.ZodString>;
    otp: z.ZodString;
    purpose: z.ZodDefault<z.ZodEnum<["PASSWORD_RESET", "LOGIN", "VERIFICATION"]>>;
    role: z.ZodOptional<z.ZodEnum<["STUDENT", "DRIVER", "ADMIN"]>>;
}, "strip", z.ZodTypeAny, {
    otp: string;
    purpose: "PASSWORD_RESET" | "LOGIN" | "VERIFICATION";
    identifier?: string | undefined;
    role?: "STUDENT" | "DRIVER" | "ADMIN" | undefined;
    emailOrPhone?: string | undefined;
}, {
    otp: string;
    identifier?: string | undefined;
    role?: "STUDENT" | "DRIVER" | "ADMIN" | undefined;
    purpose?: "PASSWORD_RESET" | "LOGIN" | "VERIFICATION" | undefined;
    emailOrPhone?: string | undefined;
}>, {
    otp: string;
    purpose: "PASSWORD_RESET" | "LOGIN" | "VERIFICATION";
    identifier?: string | undefined;
    role?: "STUDENT" | "DRIVER" | "ADMIN" | undefined;
    emailOrPhone?: string | undefined;
}, {
    otp: string;
    identifier?: string | undefined;
    role?: "STUDENT" | "DRIVER" | "ADMIN" | undefined;
    purpose?: "PASSWORD_RESET" | "LOGIN" | "VERIFICATION" | undefined;
    emailOrPhone?: string | undefined;
}>;
export declare const resetPasswordSchema: z.ZodEffects<z.ZodEffects<z.ZodObject<{
    identifier: z.ZodOptional<z.ZodString>;
    emailOrPhone: z.ZodOptional<z.ZodString>;
    resetToken: z.ZodString;
    role: z.ZodOptional<z.ZodEnum<["STUDENT", "DRIVER", "ADMIN"]>>;
    newPassword: z.ZodString;
    confirmPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    resetToken: string;
    newPassword: string;
    confirmPassword: string;
    identifier?: string | undefined;
    role?: "STUDENT" | "DRIVER" | "ADMIN" | undefined;
    emailOrPhone?: string | undefined;
}, {
    resetToken: string;
    newPassword: string;
    confirmPassword: string;
    identifier?: string | undefined;
    role?: "STUDENT" | "DRIVER" | "ADMIN" | undefined;
    emailOrPhone?: string | undefined;
}>, {
    resetToken: string;
    newPassword: string;
    confirmPassword: string;
    identifier?: string | undefined;
    role?: "STUDENT" | "DRIVER" | "ADMIN" | undefined;
    emailOrPhone?: string | undefined;
}, {
    resetToken: string;
    newPassword: string;
    confirmPassword: string;
    identifier?: string | undefined;
    role?: "STUDENT" | "DRIVER" | "ADMIN" | undefined;
    emailOrPhone?: string | undefined;
}>, {
    resetToken: string;
    newPassword: string;
    confirmPassword: string;
    identifier?: string | undefined;
    role?: "STUDENT" | "DRIVER" | "ADMIN" | undefined;
    emailOrPhone?: string | undefined;
}, {
    resetToken: string;
    newPassword: string;
    confirmPassword: string;
    identifier?: string | undefined;
    role?: "STUDENT" | "DRIVER" | "ADMIN" | undefined;
    emailOrPhone?: string | undefined;
}>;
export declare const updateProfileSchema: z.ZodObject<{
    full_name: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    profile_photo_url: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodLiteral<"">]>>;
    address: z.ZodOptional<z.ZodString>;
    course: z.ZodOptional<z.ZodString>;
    semester: z.ZodOptional<z.ZodNumber>;
    student_id_number: z.ZodOptional<z.ZodString>;
    roll_number: z.ZodOptional<z.ZodString>;
    license_number: z.ZodOptional<z.ZodString>;
    department: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email?: string | undefined;
    phone?: string | undefined;
    full_name?: string | undefined;
    student_id_number?: string | undefined;
    roll_number?: string | undefined;
    course?: string | undefined;
    semester?: number | undefined;
    license_number?: string | undefined;
    department?: string | undefined;
    address?: string | undefined;
    profile_photo_url?: string | undefined;
}, {
    email?: string | undefined;
    phone?: string | undefined;
    full_name?: string | undefined;
    student_id_number?: string | undefined;
    roll_number?: string | undefined;
    course?: string | undefined;
    semester?: number | undefined;
    license_number?: string | undefined;
    department?: string | undefined;
    address?: string | undefined;
    profile_photo_url?: string | undefined;
}>;
export declare const createPickupPointSchema: z.ZodObject<{
    college_id: z.ZodString;
    name: z.ZodString;
    landmark: z.ZodOptional<z.ZodString>;
    address: z.ZodString;
    latitude: z.ZodNumber;
    longitude: z.ZodNumber;
    distance_to_college_km: z.ZodOptional<z.ZodNumber>;
    is_approved: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    college_id: string;
    address: string;
    latitude: number;
    longitude: number;
    is_approved: boolean;
    landmark?: string | undefined;
    distance_to_college_km?: number | undefined;
}, {
    name: string;
    college_id: string;
    address: string;
    latitude: number;
    longitude: number;
    landmark?: string | undefined;
    distance_to_college_km?: number | undefined;
    is_approved?: boolean | undefined;
}>;
export declare const createRouteSchema: z.ZodObject<{
    college_id: z.ZodString;
    name: z.ZodString;
    code: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    morning_departure_time: z.ZodString;
    evening_departure_time: z.ZodString;
    estimated_duration_mins: z.ZodDefault<z.ZodNumber>;
    default_vehicle_id: z.ZodOptional<z.ZodString>;
    default_driver_id: z.ZodOptional<z.ZodString>;
    max_capacity: z.ZodDefault<z.ZodNumber>;
    stops: z.ZodArray<z.ZodObject<{
        pickup_point_id: z.ZodString;
        sequence_order: z.ZodNumber;
        morning_pickup_time: z.ZodString;
        evening_drop_time: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        pickup_point_id: string;
        sequence_order: number;
        morning_pickup_time: string;
        evening_drop_time: string;
    }, {
        pickup_point_id: string;
        sequence_order: number;
        morning_pickup_time: string;
        evening_drop_time: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    code: string;
    name: string;
    college_id: string;
    morning_departure_time: string;
    evening_departure_time: string;
    estimated_duration_mins: number;
    max_capacity: number;
    stops: {
        pickup_point_id: string;
        sequence_order: number;
        morning_pickup_time: string;
        evening_drop_time: string;
    }[];
    default_driver_id?: string | undefined;
    description?: string | undefined;
    default_vehicle_id?: string | undefined;
}, {
    code: string;
    name: string;
    college_id: string;
    morning_departure_time: string;
    evening_departure_time: string;
    stops: {
        pickup_point_id: string;
        sequence_order: number;
        morning_pickup_time: string;
        evening_drop_time: string;
    }[];
    default_driver_id?: string | undefined;
    description?: string | undefined;
    estimated_duration_mins?: number | undefined;
    default_vehicle_id?: string | undefined;
    max_capacity?: number | undefined;
}>;
export declare const createVehicleSchema: z.ZodObject<{
    college_id: z.ZodString;
    vehicle_number: z.ZodString;
    model: z.ZodString;
    type: z.ZodEnum<["CAB_4", "CAB_6", "SHUTTLE_12", "BUS_24"]>;
    seating_capacity: z.ZodNumber;
    registration_number: z.ZodString;
    insurance_validity: z.ZodString;
    fitness_validity: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "CAB_4" | "CAB_6" | "SHUTTLE_12" | "BUS_24";
    college_id: string;
    vehicle_number: string;
    model: string;
    seating_capacity: number;
    registration_number: string;
    insurance_validity: string;
    fitness_validity: string;
}, {
    type: "CAB_4" | "CAB_6" | "SHUTTLE_12" | "BUS_24";
    college_id: string;
    vehicle_number: string;
    model: string;
    seating_capacity: number;
    registration_number: string;
    insurance_validity: string;
    fitness_validity: string;
}>;
export declare const createPlanSchema: z.ZodObject<{
    college_id: z.ZodOptional<z.ZodString>;
    tier: z.ZodDefault<z.ZodEnum<["BASIC", "STANDARD", "PREMIUM"]>>;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    price: z.ZodNumber;
    validity_days: z.ZodDefault<z.ZodNumber>;
    ride_count_total: z.ZodDefault<z.ZodNumber>;
    is_unlimited_rides: z.ZodDefault<z.ZodBoolean>;
    priority_booking: z.ZodDefault<z.ZodBoolean>;
    one_way_allowed: z.ZodDefault<z.ZodBoolean>;
    round_trip_allowed: z.ZodDefault<z.ZodBoolean>;
    cancellation_hours_limit: z.ZodDefault<z.ZodNumber>;
    cancellation_fee_percentage: z.ZodDefault<z.ZodNumber>;
    additional_ride_charge: z.ZodDefault<z.ZodNumber>;
    status: z.ZodDefault<z.ZodEnum<["ACTIVE", "INACTIVE", "ARCHIVED"]>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
    tier: "BASIC" | "STANDARD" | "PREMIUM";
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
    college_id?: string | undefined;
    description?: string | undefined;
}, {
    name: string;
    price: number;
    status?: "ACTIVE" | "INACTIVE" | "ARCHIVED" | undefined;
    college_id?: string | undefined;
    description?: string | undefined;
    tier?: "BASIC" | "STANDARD" | "PREMIUM" | undefined;
    validity_days?: number | undefined;
    ride_count_total?: number | undefined;
    is_unlimited_rides?: boolean | undefined;
    priority_booking?: boolean | undefined;
    one_way_allowed?: boolean | undefined;
    round_trip_allowed?: boolean | undefined;
    cancellation_hours_limit?: number | undefined;
    cancellation_fee_percentage?: number | undefined;
    additional_ride_charge?: number | undefined;
}>;
export declare const updatePlanSchema: z.ZodObject<{
    college_id: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    tier: z.ZodOptional<z.ZodDefault<z.ZodEnum<["BASIC", "STANDARD", "PREMIUM"]>>>;
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    price: z.ZodOptional<z.ZodNumber>;
    validity_days: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    ride_count_total: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    is_unlimited_rides: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    priority_booking: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    one_way_allowed: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    round_trip_allowed: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    cancellation_hours_limit: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    cancellation_fee_percentage: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    additional_ride_charge: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    status: z.ZodOptional<z.ZodDefault<z.ZodEnum<["ACTIVE", "INACTIVE", "ARCHIVED"]>>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    status?: "ACTIVE" | "INACTIVE" | "ARCHIVED" | undefined;
    college_id?: string | undefined;
    description?: string | undefined;
    tier?: "BASIC" | "STANDARD" | "PREMIUM" | undefined;
    price?: number | undefined;
    validity_days?: number | undefined;
    ride_count_total?: number | undefined;
    is_unlimited_rides?: boolean | undefined;
    priority_booking?: boolean | undefined;
    one_way_allowed?: boolean | undefined;
    round_trip_allowed?: boolean | undefined;
    cancellation_hours_limit?: number | undefined;
    cancellation_fee_percentage?: number | undefined;
    additional_ride_charge?: number | undefined;
}, {
    name?: string | undefined;
    status?: "ACTIVE" | "INACTIVE" | "ARCHIVED" | undefined;
    college_id?: string | undefined;
    description?: string | undefined;
    tier?: "BASIC" | "STANDARD" | "PREMIUM" | undefined;
    price?: number | undefined;
    validity_days?: number | undefined;
    ride_count_total?: number | undefined;
    is_unlimited_rides?: boolean | undefined;
    priority_booking?: boolean | undefined;
    one_way_allowed?: boolean | undefined;
    round_trip_allowed?: boolean | undefined;
    cancellation_hours_limit?: number | undefined;
    cancellation_fee_percentage?: number | undefined;
    additional_ride_charge?: number | undefined;
}>;
export declare const subscribePlanSchema: z.ZodObject<{
    plan_id: z.ZodString;
    payment_method: z.ZodDefault<z.ZodEnum<["UPI", "DEBIT_CARD", "CREDIT_CARD", "NET_BANKING", "WALLET"]>>;
    auto_renew: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    plan_id: string;
    payment_method: "UPI" | "DEBIT_CARD" | "CREDIT_CARD" | "NET_BANKING" | "WALLET";
    auto_renew: boolean;
}, {
    plan_id: string;
    payment_method?: "UPI" | "DEBIT_CARD" | "CREDIT_CARD" | "NET_BANKING" | "WALLET" | undefined;
    auto_renew?: boolean | undefined;
}>;
export declare const checkAvailabilitySchema: z.ZodObject<{
    route_id: z.ZodString;
    pickup_point_id: z.ZodString;
    drop_point_id: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    pickup_point_id: string;
    route_id: string;
    drop_point_id?: string | undefined;
}, {
    pickup_point_id: string;
    route_id: string;
    drop_point_id?: string | undefined;
}>;
export declare const createBookingSchema: z.ZodObject<{
    trip_id: z.ZodString;
    pickup_point_id: z.ZodString;
    drop_point_id: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    pickup_point_id: string;
    trip_id: string;
    drop_point_id?: string | undefined;
}, {
    pickup_point_id: string;
    trip_id: string;
    drop_point_id?: string | undefined;
}>;
export declare const cancelBookingSchema: z.ZodObject<{
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reason: string;
}, {
    reason: string;
}>;
export declare const verifyQrScanSchema: z.ZodObject<{
    token: z.ZodString;
    trip_id: z.ZodString;
    client_latitude: z.ZodOptional<z.ZodNumber>;
    client_longitude: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    token: string;
    trip_id: string;
    client_latitude?: number | undefined;
    client_longitude?: number | undefined;
}, {
    token: string;
    trip_id: string;
    client_latitude?: number | undefined;
    client_longitude?: number | undefined;
}>;
export declare const updateGpsLocationSchema: z.ZodObject<{
    trip_id: z.ZodOptional<z.ZodString>;
    latitude: z.ZodNumber;
    longitude: z.ZodNumber;
    accuracy: z.ZodDefault<z.ZodNumber>;
    speed: z.ZodDefault<z.ZodNumber>;
    heading: z.ZodDefault<z.ZodNumber>;
    timestamp: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    latitude: number;
    longitude: number;
    accuracy: number;
    speed: number;
    heading: number;
    timestamp?: string | undefined;
    trip_id?: string | undefined;
}, {
    latitude: number;
    longitude: number;
    timestamp?: string | undefined;
    trip_id?: string | undefined;
    accuracy?: number | undefined;
    speed?: number | undefined;
    heading?: number | undefined;
}>;
export declare const createComplaintSchema: z.ZodObject<{
    category: z.ZodEnum<["BOOKING", "PAYMENT", "DRIVER", "VEHICLE", "PASS_QR", "SUBSCRIPTION", "LOST_ITEM", "OTHER"]>;
    subject: z.ZodString;
    description: z.ZodString;
    priority: z.ZodDefault<z.ZodEnum<["LOW", "MEDIUM", "HIGH", "URGENT"]>>;
}, "strip", z.ZodTypeAny, {
    description: string;
    category: "DRIVER" | "BOOKING" | "PAYMENT" | "VEHICLE" | "PASS_QR" | "SUBSCRIPTION" | "LOST_ITEM" | "OTHER";
    subject: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
}, {
    description: string;
    category: "DRIVER" | "BOOKING" | "PAYMENT" | "VEHICLE" | "PASS_QR" | "SUBSCRIPTION" | "LOST_ITEM" | "OTHER";
    subject: string;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
}>;
export declare const replyComplaintSchema: z.ZodObject<{
    admin_response: z.ZodString;
    status: z.ZodDefault<z.ZodEnum<["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]>>;
}, "strip", z.ZodTypeAny, {
    status: "IN_PROGRESS" | "OPEN" | "RESOLVED" | "CLOSED";
    admin_response: string;
}, {
    admin_response: string;
    status?: "IN_PROGRESS" | "OPEN" | "RESOLVED" | "CLOSED" | undefined;
}>;
export declare const rateTripSchema: z.ZodObject<{
    trip_id: z.ZodString;
    rating_stars: z.ZodNumber;
    feedback_text: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    trip_id: string;
    rating_stars: number;
    feedback_text?: string | undefined;
    tags?: string[] | undefined;
}, {
    trip_id: string;
    rating_stars: number;
    feedback_text?: string | undefined;
    tags?: string[] | undefined;
}>;
export declare const createHolidaySchema: z.ZodObject<{
    college_id: z.ZodString;
    holiday_date: z.ZodString;
    title: z.ZodString;
    holiday_type: z.ZodDefault<z.ZodEnum<["COLLEGE_HOLIDAY", "EXAM_HOLIDAY", "SUNDAY", "SPECIAL"]>>;
    is_service_disabled: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    college_id: string;
    title: string;
    holiday_date: string;
    holiday_type: "COLLEGE_HOLIDAY" | "EXAM_HOLIDAY" | "SUNDAY" | "SPECIAL";
    is_service_disabled: boolean;
}, {
    college_id: string;
    title: string;
    holiday_date: string;
    holiday_type?: "COLLEGE_HOLIDAY" | "EXAM_HOLIDAY" | "SUNDAY" | "SPECIAL" | undefined;
    is_service_disabled?: boolean | undefined;
}>;
export declare const createAdminSchema: z.ZodObject<{
    email: z.ZodString;
    phone: z.ZodString;
    full_name: z.ZodString;
    password: z.ZodString;
    department: z.ZodDefault<z.ZodString>;
    permissions: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    email: string;
    phone: string;
    full_name: string;
    department: string;
    permissions: string[];
    password: string;
}, {
    email: string;
    phone: string;
    full_name: string;
    password: string;
    department?: string | undefined;
    permissions?: string[] | undefined;
}>;
export declare const createAdminProfileSchema: z.ZodObject<{
    user_id: z.ZodOptional<z.ZodString>;
    full_name: z.ZodOptional<z.ZodString>;
    department: z.ZodDefault<z.ZodString>;
    permissions: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    department: string;
    permissions: string[];
    full_name?: string | undefined;
    user_id?: string | undefined;
}, {
    full_name?: string | undefined;
    department?: string | undefined;
    permissions?: string[] | undefined;
    user_id?: string | undefined;
}>;
export declare const updateAdminProfileSchema: z.ZodObject<{
    full_name: z.ZodOptional<z.ZodString>;
    department: z.ZodOptional<z.ZodString>;
    permissions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    full_name?: string | undefined;
    department?: string | undefined;
    permissions?: string[] | undefined;
}, {
    full_name?: string | undefined;
    department?: string | undefined;
    permissions?: string[] | undefined;
}>;
