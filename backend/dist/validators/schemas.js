"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHolidaySchema = exports.rateTripSchema = exports.replyComplaintSchema = exports.createComplaintSchema = exports.updateGpsLocationSchema = exports.verifyQrScanSchema = exports.cancelBookingSchema = exports.createBookingSchema = exports.subscribePlanSchema = exports.createPlanSchema = exports.createVehicleSchema = exports.createRouteSchema = exports.createPickupPointSchema = exports.verifyOtpSchema = exports.requestOtpSchema = exports.loginSchema = exports.registerStudentSchema = void 0;
const zod_1 = require("zod");
exports.registerStudentSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    phone: zod_1.z.string().min(10).max(15),
    full_name: zod_1.z.string().min(2).max(150),
    password: zod_1.z.string().min(6).max(100),
    college_id: zod_1.z.string().uuid(),
    student_id_number: zod_1.z.string().min(2).max(100),
    roll_number: zod_1.z.string().optional(),
    course: zod_1.z.string().min(2).max(150),
    semester: zod_1.z.number().int().min(1).max(12),
    id_card_url: zod_1.z.string().url().optional(),
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
    college_id: zod_1.z.string().uuid(),
    tier: zod_1.z.enum(['BASIC', 'STANDARD', 'PREMIUM']),
    name: zod_1.z.string().min(2).max(150),
    description: zod_1.z.string().optional(),
    price: zod_1.z.number().nonnegative(),
    validity_days: zod_1.z.number().int().positive(),
    ride_count_total: zod_1.z.number().int().positive(),
    is_unlimited_rides: zod_1.z.boolean().default(false),
    priority_booking: zod_1.z.boolean().default(false),
    one_way_allowed: zod_1.z.boolean().default(true),
    round_trip_allowed: zod_1.z.boolean().default(true),
    cancellation_hours_limit: zod_1.z.number().int().nonnegative().default(2),
    cancellation_fee_percentage: zod_1.z.number().min(0).max(100).default(10),
    additional_ride_charge: zod_1.z.number().nonnegative().default(50),
});
exports.subscribePlanSchema = zod_1.z.object({
    plan_id: zod_1.z.string().uuid(),
    payment_method: zod_1.z.enum(['UPI', 'DEBIT_CARD', 'CREDIT_CARD', 'NET_BANKING', 'WALLET']).default('UPI'),
    auto_renew: zod_1.z.boolean().default(false),
});
exports.createBookingSchema = zod_1.z.object({
    trip_id: zod_1.z.string().uuid(),
    pickup_point_id: zod_1.z.string().uuid(),
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
    trip_id: zod_1.z.string().uuid(),
    latitude: zod_1.z.number().min(-90).max(90),
    longitude: zod_1.z.number().min(-180).max(180),
    speed: zod_1.z.number().nonnegative().default(0),
    heading: zod_1.z.number().min(0).max(360).default(0),
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
//# sourceMappingURL=schemas.js.map