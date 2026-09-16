"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAdminProfileSchema = exports.createAdminProfileSchema = exports.createAdminSchema = exports.createHolidaySchema = exports.rateTripSchema = exports.replyComplaintSchema = exports.createComplaintSchema = exports.updateGpsLocationSchema = exports.verifyQrScanSchema = exports.cancelBookingSchema = exports.createBookingSchema = exports.checkAvailabilitySchema = exports.subscribePlanSchema = exports.updatePlanSchema = exports.createPlanSchema = exports.createVehicleSchema = exports.createRouteSchema = exports.createPickupPointSchema = exports.updateProfileSchema = exports.resetPasswordSchema = exports.verifyRecoveryOtpSchema = exports.forgotPasswordSchema = exports.changePasswordSchema = exports.verifyOtpSchema = exports.requestOtpSchema = exports.loginSchema = exports.registerStudentSchema = void 0;
const zod_1 = require("zod");
exports.registerStudentSchema = zod_1.z
    .object({
    email: zod_1.z.string().email(),
    phone: zod_1.z.string().min(10).max(15),
    full_name: zod_1.z.string().min(2).max(150),
    password: zod_1.z.string().min(6).max(100),
    college_id: zod_1.z.string().uuid().optional(),
    college_code: zod_1.z.string().min(2).max(50).optional(),
    student_id_number: zod_1.z.string().min(2).max(100),
    roll_number: zod_1.z.string().optional(),
    course: zod_1.z.string().min(2).max(150),
    semester: zod_1.z.number().int().min(1).max(12),
    id_card_url: zod_1.z.string().url().optional(),
})
    .refine((data) => data.college_id || data.college_code, {
    message: 'Either college_code or college_id must be provided for registration.',
    path: ['college_code'],
});
exports.loginSchema = zod_1.z.object({
    emailOrPhone: zod_1.z.string().min(3),
    password: zod_1.z.string().min(6),
    role: zod_1.z.enum(['STUDENT', 'DRIVER', 'ADMIN']).optional(),
});
exports.requestOtpSchema = zod_1.z.object({
    phone: zod_1.z.string().min(10).max(15),
});
exports.verifyOtpSchema = zod_1.z.object({
    phone: zod_1.z.string().min(10).max(15),
    otp: zod_1.z.string().length(6),
});
exports.changePasswordSchema = zod_1.z
    .object({
    currentPassword: zod_1.z.string().min(1, 'Current password is required.'),
    newPassword: zod_1.z
        .string()
        .min(8, 'New password must be at least 8 characters long.')
        .regex(/[A-Z]/, 'New password must contain at least one uppercase letter.')
        .regex(/[a-z]/, 'New password must contain at least one lowercase letter.')
        .regex(/[0-9]/, 'New password must contain at least one number.')
        .regex(/[^A-Za-z0-9]/, 'New password must contain at least one special character.'),
    confirmPassword: zod_1.z.string().min(1, 'Password confirmation is required.'),
})
    .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New password and confirm password do not match.',
    path: ['confirmPassword'],
})
    .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password cannot be the same as the current password.',
    path: ['newPassword'],
});
exports.forgotPasswordSchema = zod_1.z
    .object({
    identifier: zod_1.z.string().min(3).optional(),
    emailOrPhone: zod_1.z.string().min(3).optional(),
    email: zod_1.z.string().optional(),
    phone: zod_1.z.string().optional(),
    role: zod_1.z.enum(['STUDENT', 'DRIVER', 'ADMIN']).optional(),
})
    .refine((data) => data.identifier || data.emailOrPhone || data.email || data.phone, {
    message: 'Please enter your registered email address or mobile number.',
    path: ['identifier'],
});
exports.verifyRecoveryOtpSchema = zod_1.z
    .object({
    identifier: zod_1.z.string().min(3).optional(),
    emailOrPhone: zod_1.z.string().min(3).optional(),
    otp: zod_1.z
        .string()
        .length(6, 'OTP must be exactly 6 digits.')
        .regex(/^\d{6}$/, 'OTP must contain digits only.'),
    purpose: zod_1.z.enum(['PASSWORD_RESET', 'LOGIN', 'VERIFICATION']).default('PASSWORD_RESET'),
    role: zod_1.z.enum(['STUDENT', 'DRIVER', 'ADMIN']).optional(),
})
    .refine((data) => data.identifier || data.emailOrPhone, {
    message: 'Email address or mobile number is required.',
    path: ['identifier'],
});
exports.resetPasswordSchema = zod_1.z
    .object({
    identifier: zod_1.z.string().min(3).optional(),
    emailOrPhone: zod_1.z.string().min(3).optional(),
    resetToken: zod_1.z.string().min(10, 'Valid password reset token is required.'),
    role: zod_1.z.enum(['STUDENT', 'DRIVER', 'ADMIN']).optional(),
    newPassword: zod_1.z
        .string()
        .min(8, 'New password must be at least 8 characters long.')
        .regex(/[A-Z]/, 'New password must contain at least one uppercase letter.')
        .regex(/[a-z]/, 'New password must contain at least one lowercase letter.')
        .regex(/[0-9]/, 'New password must contain at least one number.')
        .regex(/[^A-Za-z0-9]/, 'New password must contain at least one special character.'),
    confirmPassword: zod_1.z.string().min(1, 'Password confirmation is required.'),
})
    .refine((data) => data.identifier || data.emailOrPhone, {
    message: 'Email address or mobile number is required.',
    path: ['identifier'],
})
    .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New password and confirm password do not match.',
    path: ['confirmPassword'],
});
exports.updateProfileSchema = zod_1.z.object({
    full_name: zod_1.z.string().min(2, 'Full name must be at least 2 characters.').max(150).optional(),
    phone: zod_1.z.string().min(10, 'Phone must be at least 10 digits.').max(15).optional(),
    email: zod_1.z.string().email('Invalid email address format.').optional(),
    profile_photo_url: zod_1.z.string().url('Invalid photo URL.').or(zod_1.z.literal('')).optional(),
    address: zod_1.z.string().max(300).optional(),
    // Student fields
    course: zod_1.z.string().max(150).optional(),
    semester: zod_1.z.number().int().min(1).max(12).optional(),
    student_id_number: zod_1.z.string().max(100).optional(),
    roll_number: zod_1.z.string().max(100).optional(),
    // Driver fields
    license_number: zod_1.z.string().max(100).optional(),
    // Admin fields
    department: zod_1.z.string().max(100).optional(),
});
exports.createPickupPointSchema = zod_1.z.object({
    college_id: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(2).max(200),
    landmark: zod_1.z.string().optional(),
    address: zod_1.z.string().min(5),
    latitude: zod_1.z.number().min(-90).max(90),
    longitude: zod_1.z.number().min(-180).max(180),
    distance_to_college_km: zod_1.z.number().nonnegative().optional(),
    is_approved: zod_1.z.boolean().default(true),
});
exports.createRouteSchema = zod_1.z.object({
    college_id: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(2).max(200),
    code: zod_1.z.string().min(2).max(50),
    description: zod_1.z.string().optional(),
    morning_departure_time: zod_1.z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
    evening_departure_time: zod_1.z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
    estimated_duration_mins: zod_1.z.number().int().positive().default(45),
    default_vehicle_id: zod_1.z.string().uuid().optional(),
    default_driver_id: zod_1.z.string().uuid().optional(),
    max_capacity: zod_1.z.number().int().positive().default(6),
    stops: zod_1.z.array(zod_1.z.object({
        pickup_point_id: zod_1.z.string().uuid(),
        sequence_order: zod_1.z.number().int().positive(),
        morning_pickup_time: zod_1.z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
        evening_drop_time: zod_1.z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
    })).min(1),
});
exports.createVehicleSchema = zod_1.z.object({
    college_id: zod_1.z.string().uuid(),
    vehicle_number: zod_1.z.string().min(3).max(50),
    model: zod_1.z.string().min(2).max(100),
    type: zod_1.z.enum(['CAB_4', 'CAB_6', 'SHUTTLE_12', 'BUS_24']),
    seating_capacity: zod_1.z.number().int().positive(),
    registration_number: zod_1.z.string().min(3).max(100),
    insurance_validity: zod_1.z.string(),
    fitness_validity: zod_1.z.string(),
});
exports.createPlanSchema = zod_1.z.object({
    college_id: zod_1.z.string().uuid().optional(),
    tier: zod_1.z.enum(['BASIC', 'STANDARD', 'PREMIUM']).default('STANDARD'),
    name: zod_1.z.string().min(2).max(150),
    description: zod_1.z.string().optional(),
    price: zod_1.z.number().nonnegative(),
    validity_days: zod_1.z.number().int().positive().default(30),
    ride_count_total: zod_1.z.number().int().positive().default(44),
    is_unlimited_rides: zod_1.z.boolean().default(false),
    priority_booking: zod_1.z.boolean().default(false),
    one_way_allowed: zod_1.z.boolean().default(true),
    round_trip_allowed: zod_1.z.boolean().default(true),
    cancellation_hours_limit: zod_1.z.number().int().nonnegative().default(2),
    cancellation_fee_percentage: zod_1.z.number().min(0).max(100).default(10),
    additional_ride_charge: zod_1.z.number().nonnegative().default(50),
    status: zod_1.z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).default('ACTIVE'),
});
exports.updatePlanSchema = exports.createPlanSchema.partial();
exports.subscribePlanSchema = zod_1.z.object({
    plan_id: zod_1.z.string().uuid(),
    payment_method: zod_1.z.enum(['UPI', 'DEBIT_CARD', 'CREDIT_CARD', 'NET_BANKING', 'WALLET']).default('UPI'),
    auto_renew: zod_1.z.boolean().default(false),
});
exports.checkAvailabilitySchema = zod_1.z.object({
    route_id: zod_1.z.string().uuid(),
    pickup_point_id: zod_1.z.string().uuid(),
    drop_point_id: zod_1.z.string().uuid().optional(),
});
exports.createBookingSchema = zod_1.z.object({
    trip_id: zod_1.z.string().uuid(),
    pickup_point_id: zod_1.z.string().uuid(),
    drop_point_id: zod_1.z.string().uuid().optional(),
});
exports.cancelBookingSchema = zod_1.z.object({
    reason: zod_1.z.string().min(3).max(500),
});
exports.verifyQrScanSchema = zod_1.z.object({
    token: zod_1.z.string().min(10),
    trip_id: zod_1.z.string().uuid(),
    client_latitude: zod_1.z.number().optional(),
    client_longitude: zod_1.z.number().optional(),
});
exports.updateGpsLocationSchema = zod_1.z.object({
    trip_id: zod_1.z.string().uuid().optional(),
    latitude: zod_1.z.number().min(-90, 'Latitude must be between -90 and 90.').max(90, 'Latitude must be between -90 and 90.'),
    longitude: zod_1.z.number().min(-180, 'Longitude must be between -180 and 180.').max(180, 'Longitude must be between -180 and 180.'),
    accuracy: zod_1.z.number().nonnegative().default(5.0),
    speed: zod_1.z.number().nonnegative().default(0),
    heading: zod_1.z.number().min(0).max(360).default(0),
    timestamp: zod_1.z.string().optional(),
});
exports.createComplaintSchema = zod_1.z.object({
    category: zod_1.z.enum([
        'BOOKING',
        'PAYMENT',
        'DRIVER',
        'VEHICLE',
        'PASS_QR',
        'SUBSCRIPTION',
        'LOST_ITEM',
        'OTHER',
    ]),
    subject: zod_1.z.string().min(3).max(255),
    description: zod_1.z.string().min(10).max(2000),
    priority: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
});
exports.replyComplaintSchema = zod_1.z.object({
    admin_response: zod_1.z.string().min(3),
    status: zod_1.z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).default('RESOLVED'),
});
exports.rateTripSchema = zod_1.z.object({
    trip_id: zod_1.z.string().uuid(),
    rating_stars: zod_1.z.number().int().min(1).max(5),
    feedback_text: zod_1.z.string().max(1000).optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.createHolidaySchema = zod_1.z.object({
    college_id: zod_1.z.string().uuid(),
    holiday_date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    title: zod_1.z.string().min(2).max(200),
    holiday_type: zod_1.z.enum(['COLLEGE_HOLIDAY', 'EXAM_HOLIDAY', 'SUNDAY', 'SPECIAL']).default('COLLEGE_HOLIDAY'),
    is_service_disabled: zod_1.z.boolean().default(true),
});
exports.createAdminSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    phone: zod_1.z.string().min(10).max(15),
    full_name: zod_1.z.string().min(2).max(150),
    password: zod_1.z.string().min(6).max(100),
    department: zod_1.z.string().min(2).max(100).default('Operations'),
    permissions: zod_1.z.array(zod_1.z.string()).default(['ALL']),
});
exports.createAdminProfileSchema = zod_1.z.object({
    user_id: zod_1.z.string().uuid().optional(),
    full_name: zod_1.z.string().min(2).max(150).optional(),
    department: zod_1.z.string().min(2).max(100).default('Operations'),
    permissions: zod_1.z.array(zod_1.z.string()).default(['ALL']),
});
exports.updateAdminProfileSchema = zod_1.z.object({
    full_name: zod_1.z.string().min(2).max(150).optional(),
    department: zod_1.z.string().min(2).max(100).optional(),
    permissions: zod_1.z.array(zod_1.z.string()).optional(),
});
//# sourceMappingURL=schemas.js.map