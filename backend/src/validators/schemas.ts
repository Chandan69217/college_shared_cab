import { z } from 'zod';

export const registerStudentSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(10).max(15),
  full_name: z.string().min(2).max(150),
  password: z.string().min(6).max(100),
  college_id: z.string().uuid(),
  student_id_number: z.string().min(2).max(100),
  roll_number: z.string().optional(),
  course: z.string().min(2).max(150),
  semester: z.number().int().min(1).max(12),
  id_card_url: z.string().url().optional(),
});

export const loginSchema = z.object({
  emailOrPhone: z.string().min(3),
  password: z.string().min(6),
  role: z.enum(['STUDENT', 'DRIVER', 'ADMIN']).optional(),
});

export const requestOtpSchema = z.object({
  phone: z.string().min(10).max(15),
});

export const verifyOtpSchema = z.object({
  phone: z.string().min(10).max(15),
  otp: z.string().length(6),
});

export const createPickupPointSchema = z.object({
  college_id: z.string().uuid(),
  name: z.string().min(2).max(200),
  landmark: z.string().optional(),
  address: z.string().min(5),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  distance_to_college_km: z.number().nonnegative().optional(),
  is_approved: z.boolean().default(true),
});

export const createRouteSchema = z.object({
  college_id: z.string().uuid(),
  name: z.string().min(2).max(200),
  code: z.string().min(2).max(50),
  description: z.string().optional(),
  morning_departure_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  evening_departure_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  estimated_duration_mins: z.number().int().positive().default(45),
  default_vehicle_id: z.string().uuid().optional(),
  default_driver_id: z.string().uuid().optional(),
  max_capacity: z.number().int().positive().default(6),
  stops: z.array(
    z.object({
      pickup_point_id: z.string().uuid(),
      sequence_order: z.number().int().positive(),
      morning_pickup_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
      evening_drop_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
    })
  ).min(1),
});

export const createVehicleSchema = z.object({
  college_id: z.string().uuid(),
  vehicle_number: z.string().min(3).max(50),
  model: z.string().min(2).max(100),
  type: z.enum(['CAB_4', 'CAB_6', 'SHUTTLE_12', 'BUS_24']),
  seating_capacity: z.number().int().positive(),
  registration_number: z.string().min(3).max(100),
  insurance_validity: z.string(),
  fitness_validity: z.string(),
});

export const createPlanSchema = z.object({
  college_id: z.string().uuid(),
  tier: z.enum(['BASIC', 'STANDARD', 'PREMIUM']),
  name: z.string().min(2).max(150),
  description: z.string().optional(),
  price: z.number().nonnegative(),
  validity_days: z.number().int().positive(),
  ride_count_total: z.number().int().positive(),
  is_unlimited_rides: z.boolean().default(false),
  priority_booking: z.boolean().default(false),
  one_way_allowed: z.boolean().default(true),
  round_trip_allowed: z.boolean().default(true),
  cancellation_hours_limit: z.number().int().nonnegative().default(2),
  cancellation_fee_percentage: z.number().min(0).max(100).default(10),
  additional_ride_charge: z.number().nonnegative().default(50),
});

export const subscribePlanSchema = z.object({
  plan_id: z.string().uuid(),
  payment_method: z.enum(['UPI', 'DEBIT_CARD', 'CREDIT_CARD', 'NET_BANKING', 'WALLET']).default('UPI'),
  auto_renew: z.boolean().default(false),
});

export const createBookingSchema = z.object({
  trip_id: z.string().uuid(),
  pickup_point_id: z.string().uuid(),
});

export const cancelBookingSchema = z.object({
  reason: z.string().min(3).max(500),
});

export const verifyQrScanSchema = z.object({
  token: z.string().min(10),
  trip_id: z.string().uuid(),
  client_latitude: z.number().optional(),
  client_longitude: z.number().optional(),
});

export const updateGpsLocationSchema = z.object({
  trip_id: z.string().uuid(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  speed: z.number().nonnegative().default(0),
  heading: z.number().min(0).max(360).default(0),
});

export const createComplaintSchema = z.object({
  category: z.enum([
    'BOOKING',
    'PAYMENT',
    'DRIVER',
    'VEHICLE',
    'PASS_QR',
    'SUBSCRIPTION',
    'LOST_ITEM',
    'OTHER',
  ]),
  subject: z.string().min(3).max(255),
  description: z.string().min(10).max(2000),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
});

export const replyComplaintSchema = z.object({
  admin_response: z.string().min(3),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).default('RESOLVED'),
});

export const rateTripSchema = z.object({
  trip_id: z.string().uuid(),
  rating_stars: z.number().int().min(1).max(5),
  feedback_text: z.string().max(1000).optional(),
  tags: z.array(z.string()).optional(),
});

export const createHolidaySchema = z.object({
  college_id: z.string().uuid(),
  holiday_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string().min(2).max(200),
  holiday_type: z.enum(['COLLEGE_HOLIDAY', 'EXAM_HOLIDAY', 'SUNDAY', 'SPECIAL']).default('COLLEGE_HOLIDAY'),
  is_service_disabled: z.boolean().default(true),
});
