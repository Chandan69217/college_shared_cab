export interface User {
  id: string;
  email: string;
  phone: string;
  full_name: string;
  role: 'STUDENT' | 'DRIVER' | 'ADMIN';
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
  profile?: any;
  created_at: string;
}

export interface StudentProfile {
  id: string;
  college_id: string;
  student_id_number: string;
  roll_number?: string;
  course: string;
  semester: number;
  verification_status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';
  verification_notes?: string;
  verified_at?: string;
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
}

export interface PickupPoint {
  id: string;
  college_id: string;
  name: string;
  landmark?: string;
  address: string;
  latitude: number;
  longitude: number;
  distance_to_college_km: number;
  is_approved: boolean;
  is_active: boolean;
}

export interface Route {
  id: string;
  college_id: string;
  name: string;
  code: string;
  description?: string;
  morning_departure_time: string;
  evening_departure_time: string;
  estimated_duration_mins: number;
  max_capacity: number;
  is_active: boolean;
  stops?: any[];
}

export interface Vehicle {
  id: string;
  college_id: string;
  vehicle_number: string;
  model: string;
  type: 'CAB_4' | 'CAB_6' | 'SHUTTLE_12' | 'BUS_24';
  seating_capacity: number;
  registration_number: string;
  insurance_validity: string;
  fitness_validity: string;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
}

export interface SubscriptionPlan {
  id: string;
  college_id: string;
  tier: 'BASIC' | 'STANDARD' | 'PREMIUM';
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
}

export interface Trip {
  id: string;
  route_id: string;
  route?: Route;
  vehicle_id: string;
  vehicle?: Vehicle;
  driver_id: string;
  driver?: User;
  trip_date: string;
  trip_type: 'MORNING_PICKUP' | 'EVENING_DROP';
  scheduled_departure_time: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  max_capacity: number;
  booked_seats: number;
  boarded_passengers: number;
  live_latitude?: number;
  live_longitude?: number;
  last_gps_update?: string;
}

export interface Complaint {
  id: string;
  ticket_number: string;
  student_id: string;
  student?: User;
  category: string;
  subject: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  admin_response?: string;
  created_at: string;
}

export interface DashboardStats {
  totalStudents: number;
  activeSubscriptions: number;
  todaysTrips: number;
  activeVehicles: number;
  activeDrivers: number;
  todayRevenue: number;
  totalRevenue: number;
  averageOccupancy: number;
  pendingVerifications: number;
}
