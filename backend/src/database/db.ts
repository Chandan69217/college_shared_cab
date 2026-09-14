import {
  User,
  StudentProfile,
  DriverProfile,
  AdminProfile,
  College,
  PickupPoint,
  Vehicle,
  Route,
  SubscriptionPlan,
  Subscription,
  Trip,
  Booking,
  TripPassenger,
  DailyTravelPass,
  Payment,
  Complaint,
  Rating,
  Notification,
  CollegeHoliday,
} from '../types';

/**
 * In-memory thread-safe state store initialized with rich demo data.
 * When Supabase/PostgreSQL is connected, repositories can delegate to pool or this store.
 */
class DatabaseStore {
  public users: Map<string, User> = new Map();
  public studentProfiles: Map<string, StudentProfile> = new Map();
  public driverProfiles: Map<string, DriverProfile> = new Map();
  public adminProfiles: Map<string, AdminProfile> = new Map();
  public colleges: Map<string, College> = new Map();
  public pickupPoints: Map<string, PickupPoint> = new Map();
  public vehicles: Map<string, Vehicle> = new Map();
  public routes: Map<string, Route> = new Map();
  public subscriptionPlans: Map<string, SubscriptionPlan> = new Map();
  public subscriptions: Map<string, Subscription> = new Map();
  public trips: Map<string, Trip> = new Map();
  public bookings: Map<string, Booking> = new Map();
  public tripPassengers: Map<string, TripPassenger> = new Map();
  public dailyPasses: Map<string, DailyTravelPass> = new Map();
  public payments: Map<string, Payment> = new Map();
  public complaints: Map<string, Complaint> = new Map();
  public ratings: Map<string, Rating> = new Map();
  public notifications: Map<string, Notification> = new Map();
  public holidays: Map<string, CollegeHoliday> = new Map();
  public qrScanLogs: Array<any> = [];
  public vehicleLocations: Array<any> = [];
  public auditLogs: Array<any> = [];

  constructor() {
    this.seedDemoData();
  }

  public seedDemoData() {
    const now = new Date().toISOString();
    const collegeId = '11111111-1111-1111-1111-111111111111';
    const adminId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const driver1Id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    const driver2Id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
    const student1Id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
    const student2Id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

    // 1. Demo College
    this.colleges.set(collegeId, {
      id: collegeId,
      name: 'Apex Institute of Technology & Management',
      code: 'APEX-DELHI-NCR',
      address: 'Sector 125, Knowledge Park Expressway, Noida, UP 201301',
      latitude: 28.5355,
      longitude: 77.391,
      service_radius_km: 10.0,
      contact_email: 'transport@apexinstitute.edu.in',
      contact_phone: '+91 98765 43210',
      is_active: true,
      created_at: now,
      updated_at: now,
    });

    // 2. Users
    // Password for all demo accounts is 'password123'
    const defaultPwHash = '$2a$10$w8T9H6kXq5mY7eY2Zf2KueE0XN2Z8Zz7HwI2B0C4M6Q8E0W2Z8Y6K';

    this.users.set(adminId, {
      id: adminId,
      email: 'admin@collegecab.com',
      phone: '+919999900001',
      full_name: 'Prof. Vikram Malhotra (Admin)',
      password_hash: defaultPwHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      created_at: now,
      updated_at: now,
    });
    this.adminProfiles.set(adminId, {
      id: adminId,
      full_name: 'Prof. Vikram Malhotra',
      department: 'Transport & Facilities Directorate',
      permissions: ['ALL'],
      created_at: now,
      updated_at: now,
    });

    this.users.set(driver1Id, {
      id: driver1Id,
      email: 'driver1@collegecab.com',
      phone: '+919999900002',
      full_name: 'Rajesh Kumar Yadav',
      password_hash: defaultPwHash,
      role: 'DRIVER',
      status: 'ACTIVE',
      created_at: now,
      updated_at: now,
    });
    this.driverProfiles.set(driver1Id, {
      id: driver1Id,
      college_id: collegeId,
      license_number: 'DL-04-2018-8849201',
      license_expiry: '2030-05-15',
      aadhar_number: '4521-8932-1092',
      experience_years: 8,
      status: 'ACTIVE',
      rating_avg: 4.92,
      total_trips: 420,
      created_at: now,
      updated_at: now,
    });

    this.users.set(driver2Id, {
      id: driver2Id,
      email: 'driver2@collegecab.com',
      phone: '+919999900003',
      full_name: 'Suresh Chandra Verma',
      password_hash: defaultPwHash,
      role: 'DRIVER',
      status: 'ACTIVE',
      created_at: now,
      updated_at: now,
    });
    this.driverProfiles.set(driver2Id, {
      id: driver2Id,
      college_id: collegeId,
      license_number: 'UP-16-2019-3391840',
      license_expiry: '2029-11-20',
      aadhar_number: '8839-2041-9923',
      experience_years: 5,
      status: 'ACTIVE',
      rating_avg: 4.85,
      total_trips: 290,
      created_at: now,
      updated_at: now,
    });

    this.users.set(student1Id, {
      id: student1Id,
      email: 'student1@college.edu',
      phone: '+919999900004',
      full_name: 'Aarav Sharma',
      password_hash: defaultPwHash,
      role: 'STUDENT',
      status: 'ACTIVE',
      created_at: now,
      updated_at: now,
    });
    this.studentProfiles.set(student1Id, {
      id: student1Id,
      college_id: collegeId,
      student_id_number: 'STU-2024-BTECH-CS-042',
      roll_number: '24BCS042',
      course: 'B.Tech Computer Science & Engineering',
      semester: 5,
      verification_status: 'VERIFIED',
      verified_at: now,
      verified_by: adminId,
      created_at: now,
      updated_at: now,
    });

    this.users.set(student2Id, {
      id: student2Id,
      email: 'student2@college.edu',
      phone: '+919999900005',
      full_name: 'Ananya Patel',
      password_hash: defaultPwHash,
      role: 'STUDENT',
      status: 'ACTIVE',
      created_at: now,
      updated_at: now,
    });
    this.studentProfiles.set(student2Id, {
      id: student2Id,
      college_id: collegeId,
      student_id_number: 'STU-2025-MBA-MKT-019',
      roll_number: '25MBA019',
      course: 'MBA International Business',
      semester: 2,
      verification_status: 'PENDING',
      created_at: now,
      updated_at: now,
    });

    // 3. Pickup Points
    const p1 = '22222222-2222-2222-2222-222222222221';
    const p2 = '22222222-2222-2222-2222-222222222222';
    const p3 = '22222222-2222-2222-2222-222222222223';
    const p4 = '22222222-2222-2222-2222-222222222224';
    const p5 = '22222222-2222-2222-2222-222222222225';
    const p6 = '22222222-2222-2222-2222-222222222226';
    const p7 = '22222222-2222-2222-2222-222222222227';
    const p8Out = '22222222-2222-2222-2222-222222222228';

    this.pickupPoints.set(p1, {
      id: p1,
      college_id: collegeId,
      name: 'Sector 18 Metro Gate 2',
      landmark: 'Near Wave Mall & Atta Market',
      address: 'Sector 18 Metro Station, Noida',
      latitude: 28.5708,
      longitude: 77.326,
      distance_to_college_km: 4.8,
      is_approved: true,
      is_active: true,
      created_at: now,
      updated_at: now,
    });
    this.pickupPoints.set(p2, {
      id: p2,
      college_id: collegeId,
      name: 'Botanical Garden Interchange',
      landmark: 'Gate No 1, Main Auto Stand',
      address: 'Botanical Garden Metro Station, Noida',
      latitude: 28.5645,
      longitude: 77.3345,
      distance_to_college_km: 3.6,
      is_approved: true,
      is_active: true,
      created_at: now,
      updated_at: now,
    });
    this.pickupPoints.set(p3, {
      id: p3,
      college_id: collegeId,
      name: 'Amity Gate 4 Crossing',
      landmark: 'Opposite Gate 4 Petrol Pump',
      address: 'Sector 125, Noida',
      latitude: 28.542,
      longitude: 77.336,
      distance_to_college_km: 1.2,
      is_approved: true,
      is_active: true,
      created_at: now,
      updated_at: now,
    });
    this.pickupPoints.set(p4, {
      id: p4,
      college_id: collegeId,
      name: 'Golf Course Crossing',
      landmark: 'Under the Flyover, Captain Gaur Marg',
      address: 'Sector 37, Noida',
      latitude: 28.567,
      longitude: 77.348,
      distance_to_college_km: 3.9,
      is_approved: true,
      is_active: true,
      created_at: now,
      updated_at: now,
    });
    this.pickupPoints.set(p5, {
      id: p5,
      college_id: collegeId,
      name: 'Sector 62 IT Hub / Electronic City',
      landmark: 'Near Fortis Hospital Junction',
      address: 'Sector 62, Noida',
      latitude: 28.628,
      longitude: 77.368,
      distance_to_college_km: 8.2,
      is_approved: true,
      is_active: true,
      created_at: now,
      updated_at: now,
    });
    this.pickupPoints.set(p6, {
      id: p6,
      college_id: collegeId,
      name: 'Sector 137 Expressway Metro',
      landmark: 'Exit Gate 2, Paras Tierea side',
      address: 'Sector 137, Noida',
      latitude: 28.502,
      longitude: 77.408,
      distance_to_college_km: 4.5,
      is_approved: true,
      is_active: true,
      created_at: now,
      updated_at: now,
    });
    this.pickupPoints.set(p7, {
      id: p7,
      college_id: collegeId,
      name: 'Knowledge Park 2 Metro',
      landmark: 'Near Sharda University Circle',
      address: 'Knowledge Park 2, Greater Noida',
      latitude: 28.468,
      longitude: 77.498,
      distance_to_college_km: 9.4,
      is_approved: true,
      is_active: true,
      created_at: now,
      updated_at: now,
    });
    this.pickupPoints.set(p8Out, {
      id: p8Out,
      college_id: collegeId,
      name: 'Pari Chowk Bus Terminal (Outside 10km)',
      landmark: 'Opposite Ansal Plaza',
      address: 'Pari Chowk, Greater Noida',
      latitude: 28.465,
      longitude: 77.512,
      distance_to_college_km: 12.8,
      is_approved: false,
      is_active: true,
      created_at: now,
      updated_at: now,
    });

    // 4. Vehicles
    const v1 = '33333333-3333-3333-3333-333333333331';
    const v2 = '33333333-3333-3333-3333-333333333332';
    const v3 = '33333333-3333-3333-3333-333333333333';

    this.vehicles.set(v1, {
      id: v1,
      college_id: collegeId,
      vehicle_number: 'UP16-CZ-8821',
      model: 'Maruti Suzuki Ertiga VXi',
      type: 'CAB_6',
      seating_capacity: 6,
      registration_number: 'DL-VA-2023-9921',
      insurance_validity: '2028-12-31',
      fitness_validity: '2028-12-31',
      status: 'ACTIVE',
      created_at: now,
      updated_at: now,
    });
    this.vehicles.set(v2, {
      id: v2,
      college_id: collegeId,
      vehicle_number: 'UP16-EV-4412',
      model: 'Toyota Innova Crysta 2.4 VX',
      type: 'CAB_6',
      seating_capacity: 6,
      registration_number: 'DL-VA-2024-1102',
      insurance_validity: '2029-04-30',
      fitness_validity: '2029-04-30',
      status: 'ACTIVE',
      created_at: now,
      updated_at: now,
    });
    this.vehicles.set(v3, {
      id: v3,
      college_id: collegeId,
      vehicle_number: 'UP16-TR-7700',
      model: 'Force Traveller Executive 3350',
      type: 'SHUTTLE_12',
      seating_capacity: 12,
      registration_number: 'DL-VA-2022-7700',
      insurance_validity: '2027-08-15',
      fitness_validity: '2027-08-15',
      status: 'ACTIVE',
      created_at: now,
      updated_at: now,
    });

    // 5. Routes
    const r1 = '44444444-4444-4444-4444-444444444441';
    const r2 = '44444444-4444-4444-4444-444444444442';

    this.routes.set(r1, {
      id: r1,
      college_id: collegeId,
      name: 'Route 1: Central Metro Express',
      code: 'R1-METRO-EXP',
      description: 'Sector 18 Metro -> Botanical Garden -> Amity -> College',
      morning_departure_time: '07:30:00',
      evening_departure_time: '17:00:00',
      estimated_duration_mins: 40,
      default_vehicle_id: v1,
      default_driver_id: driver1Id,
      max_capacity: 6,
      is_active: true,
      stops: [
        {
          id: 'stop-1-1',
          route_id: r1,
          pickup_point_id: p1,
          pickup_point: this.pickupPoints.get(p1),
          sequence_order: 1,
          morning_pickup_time: '07:30:00',
          evening_drop_time: '17:40:00',
          created_at: now,
        },
        {
          id: 'stop-1-2',
          route_id: r1,
          pickup_point_id: p2,
          pickup_point: this.pickupPoints.get(p2),
          sequence_order: 2,
          morning_pickup_time: '07:40:00',
          evening_drop_time: '17:30:00',
          created_at: now,
        },
        {
          id: 'stop-1-3',
          route_id: r1,
          pickup_point_id: p3,
          pickup_point: this.pickupPoints.get(p3),
          sequence_order: 3,
          morning_pickup_time: '07:50:00',
          evening_drop_time: '17:20:00',
          created_at: now,
        },
      ],
      created_at: now,
      updated_at: now,
    });

    this.routes.set(r2, {
      id: r2,
      college_id: collegeId,
      name: 'Route 2: Expressway Shuttle Corridor',
      code: 'R2-EXP-CORR',
      description: 'Sector 62 -> Sector 137 -> Knowledge Park -> College',
      morning_departure_time: '07:45:00',
      evening_departure_time: '17:15:00',
      estimated_duration_mins: 50,
      default_vehicle_id: v3,
      default_driver_id: driver2Id,
      max_capacity: 12,
      is_active: true,
      stops: [
        {
          id: 'stop-2-1',
          route_id: r2,
          pickup_point_id: p5,
          pickup_point: this.pickupPoints.get(p5),
          sequence_order: 1,
          morning_pickup_time: '07:45:00',
          evening_drop_time: '18:00:00',
          created_at: now,
        },
        {
          id: 'stop-2-2',
          route_id: r2,
          pickup_point_id: p6,
          pickup_point: this.pickupPoints.get(p6),
          sequence_order: 2,
          morning_pickup_time: '08:05:00',
          evening_drop_time: '17:40:00',
          created_at: now,
        },
        {
          id: 'stop-2-3',
          route_id: r2,
          pickup_point_id: p7,
          pickup_point: this.pickupPoints.get(p7),
          sequence_order: 3,
          morning_pickup_time: '08:20:00',
          evening_drop_time: '17:25:00',
          created_at: now,
        },
      ],
      created_at: now,
      updated_at: now,
    });

    // 6. Subscription Plans
    const plan1 = '55555555-5555-5555-5555-555555555551';
    const plan2 = '55555555-5555-5555-5555-555555555552';
    const plan3 = '55555555-5555-5555-5555-555555555553';

    this.subscriptionPlans.set(plan1, {
      id: plan1,
      college_id: collegeId,
      tier: 'BASIC',
      name: 'Basic Shuttle Pass',
      description: 'Ideal for 1-way commuters or students traveling 3-4 days a week. Includes 22 trips.',
      price: 1499,
      validity_days: 30,
      ride_count_total: 22,
      is_unlimited_rides: false,
      priority_booking: false,
      one_way_allowed: true,
      round_trip_allowed: false,
      cancellation_hours_limit: 4,
      cancellation_fee_percentage: 15.0,
      additional_ride_charge: 60.0,
      status: 'ACTIVE',
      created_at: now,
      updated_at: now,
    });

    this.subscriptionPlans.set(plan2, {
      id: plan2,
      college_id: collegeId,
      tier: 'STANDARD',
      name: 'Standard Daily Commuter Pass',
      description: 'Best value for daily regular college commute (morning pickup + evening return). 44 rides with free reschedule.',
      price: 2499,
      validity_days: 30,
      ride_count_total: 44,
      is_unlimited_rides: false,
      priority_booking: false,
      one_way_allowed: true,
      round_trip_allowed: true,
      cancellation_hours_limit: 2,
      cancellation_fee_percentage: 10.0,
      additional_ride_charge: 50.0,
      status: 'ACTIVE',
      created_at: now,
      updated_at: now,
    });

    this.subscriptionPlans.set(plan3, {
      id: plan3,
      college_id: collegeId,
      tier: 'PREMIUM',
      name: 'Premium Unlimited Club Pass',
      description: 'Ultimate flexibility: Priority seat reservation, air-conditioned executive cabs, and zero-fee instant cancellation.',
      price: 3499,
      validity_days: 30,
      ride_count_total: 60,
      is_unlimited_rides: true,
      priority_booking: true,
      one_way_allowed: true,
      round_trip_allowed: true,
      cancellation_hours_limit: 1,
      cancellation_fee_percentage: 0.0,
      additional_ride_charge: 40.0,
      status: 'ACTIVE',
      created_at: now,
      updated_at: now,
    });

    // 7. Payment & Subscription for Student 1
    const sub1 = '66666666-6666-6666-6666-666666666661';
    const pay1 = 'aaaaaaaa-1111-2222-3333-444444444444';

    this.payments.set(pay1, {
      id: pay1,
      student_id: student1Id,
      subscription_id: sub1,
      amount: 2499,
      currency: 'INR',
      payment_method: 'UPI',
      transaction_id: 'TXN-UPI-2026-9812401',
      gateway_order_id: 'order_demo_9921',
      status: 'SUCCESS',
      receipt_number: 'RCPT-2026-0812',
      created_at: now,
      updated_at: now,
    });

    this.subscriptions.set(sub1, {
      id: sub1,
      student_id: student1Id,
      plan_id: plan2,
      plan: this.subscriptionPlans.get(plan2),
      start_date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
      end_date: new Date(Date.now() + 25 * 86400000).toISOString().split('T')[0],
      total_rides_allocated: 44,
      remaining_rides: 38,
      status: 'ACTIVE',
      payment_id: pay1,
      auto_renew: false,
      created_at: now,
      updated_at: now,
    });

    // 8. Today's Trip
    const trip1 = '77777777-7777-7777-7777-777777777771';
    const todayDate = new Date().toISOString().split('T')[0];

    this.trips.set(trip1, {
      id: trip1,
      route_id: r1,
      route: this.routes.get(r1),
      vehicle_id: v1,
      vehicle: this.vehicles.get(v1),
      driver_id: driver1Id,
      driver: this.users.get(driver1Id),
      trip_date: todayDate,
      trip_type: 'MORNING_PICKUP',
      scheduled_departure_time: '07:30:00',
      status: 'SCHEDULED',
      max_capacity: 6,
      booked_seats: 1,
      boarded_passengers: 0,
      live_latitude: 28.5708,
      live_longitude: 77.326,
      last_gps_update: now,
      created_at: now,
      updated_at: now,
    });

    // 9. Booking & Pass for Student 1
    const booking1 = '88888888-8888-8888-8888-888888888881';
    const pass1 = '99999999-9999-9999-9999-999999999991';

    this.bookings.set(booking1, {
      id: booking1,
      student_id: student1Id,
      student: this.users.get(student1Id),
      subscription_id: sub1,
      trip_id: trip1,
      trip: this.trips.get(trip1),
      route_id: r1,
      route: this.routes.get(r1),
      pickup_point_id: p1,
      pickup_point: this.pickupPoints.get(p1),
      booking_date: todayDate,
      trip_type: 'MORNING_PICKUP',
      seat_number: 1,
      status: 'CONFIRMED',
      created_at: now,
      updated_at: now,
    });

    this.tripPassengers.set(`${trip1}_${student1Id}`, {
      id: `pax-${trip1}-${student1Id}`,
      trip_id: trip1,
      booking_id: booking1,
      student_id: student1Id,
      student: this.users.get(student1Id),
      pickup_point_id: p1,
      pickup_point: this.pickupPoints.get(p1),
      status: 'WAITING',
      created_at: now,
      updated_at: now,
    });

    this.dailyPasses.set(pass1, {
      id: pass1,
      student_id: student1Id,
      booking_id: booking1,
      trip_id: trip1,
      trip: this.trips.get(trip1),
      pass_date: todayDate,
      trip_type: 'MORNING_PICKUP',
      route_id: r1,
      route: this.routes.get(r1),
      pickup_point_id: p1,
      pickup_point: this.pickupPoints.get(p1),
      auth_token_hash: 'DEMO_HASH_AARAV',
      valid_until: new Date(Date.now() + 6 * 3600000).toISOString(),
      status: 'ACTIVE',
      created_at: now,
      updated_at: now,
    });

    // 10. Notifications & Complaints
    const notif1 = 'notif-1-demo';
    this.notifications.set(notif1, {
      id: notif1,
      user_id: student1Id,
      title: 'Booking Confirmed for Today!',
      message: 'Your morning cab for Route 1 (Sector 18 Metro) is confirmed. Departure at 07:30 AM.',
      type: 'BOOKING',
      is_read: false,
      data: { tripId: trip1 },
      created_at: now,
    });

    const cmp1 = 'cmp-1-demo';
    this.complaints.set(cmp1, {
      id: cmp1,
      ticket_number: 'TKT-2026-0041',
      student_id: student1Id,
      student: this.users.get(student1Id),
      category: 'VEHICLE',
      subject: 'AC cooling was low yesterday',
      description: 'The air conditioning in vehicle UP16-CZ-8821 was low during the afternoon trip.',
      priority: 'MEDIUM',
      status: 'OPEN',
      created_at: now,
      updated_at: now,
    });

    // 11. College Holidays
    const hol1 = 'hol-1-demo';
    this.holidays.set(hol1, {
      id: hol1,
      college_id: collegeId,
      holiday_date: new Date(Date.now() + 12 * 86400000).toISOString().split('T')[0],
      title: 'Gandhi Jayanti',
      holiday_type: 'COLLEGE_HOLIDAY',
      is_service_disabled: true,
      created_at: now,
    });
  }
}

export const db = new DatabaseStore();
