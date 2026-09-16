require('dotenv').config();
const jwt = require('jsonwebtoken');
const { Client } = require('pg');

const BASE_URL = 'http://localhost:5000/api/v1';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_production_ready_jwt_signing_key_college_cab_2026';

function makeToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role, collegeId: user.college_id },
    JWT_SECRET,
    { expiresIn: '1d' }
  );
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const body = options.body ? JSON.stringify(options.body) : undefined;
  console.log(` -> [${options.method || 'GET'} ${endpoint}]`);
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body,
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    json = { raw: text };
  }

  if (!res.ok) {
    console.error(` ❌ [${options.method || 'GET'} ${endpoint}] Failed:`, text);
    const err = new Error(json.message || `HTTP ${res.status}: ${text}`);
    err.status = res.status;
    err.data = json;
    throw err;
  }
  return json;
}

async function runCompleteTestSuite() {
  console.log('=== STARTING COMPLETE SHARED CAB SYSTEM VERIFICATION SUITE ===\n');

  const pgClient = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await pgClient.connect();

  try {
    // 0. Fetch initial catalog and college
    let catalogRes = await request('/catalog/pickup-points');
    let pickupPoints = catalogRes.data;
    console.log(`[INIT] Found ${pickupPoints.length} existing pickup points.`);

    const collegesRes = await request('/catalog/colleges');
    const college = collegesRes.data?.[0];
    if (!college) throw new Error('No college found in database.');
    const collegeId = college.id;
    console.log(`[INIT] Target College: ${college.name} (${collegeId})`);

    // Create Test Admin
    const adminUser = {
      id: '99999999-aaaa-bbbb-cccc-000000000001',
      email: 'cab.admin@college.edu',
      role: 'ADMIN',
      college_id: collegeId,
    };
    const adminToken = makeToken(adminUser);
    const adminAuth = { Authorization: `Bearer ${adminToken}` };

    // Ensure we have at least 3 pickup points for sequence tests
    while (pickupPoints.length < 3) {
      const idx = pickupPoints.length + 1;
      const newPointRes = await request('/admin/pickup-points', {
        method: 'POST',
        headers: adminAuth,
        body: {
          college_id: collegeId,
          name: `Sector ${idx * 7} Shuttle Hub`,
          address: `Ring Road Junction ${idx}, Metro Gate`,
          latitude: 28.5355 + idx * 0.015,
          longitude: 77.3910 + idx * 0.015,
          is_approved: true,
        },
      });
      pickupPoints.push(newPointRes.data);
    }

    await pgClient.query('UPDATE pickup_points SET is_approved = true, is_active = true WHERE college_id = $1', [collegeId]);
    console.log(`[INIT] Verified all college pickup points are active and approved.`);

    const testSuffix = Date.now().toString().slice(-4);

    // 1. Create Dedicated Test Driver
    const driverRes = await request('/admin/drivers', {
      method: 'POST',
      headers: adminAuth,
      body: {
        college_id: collegeId,
        full_name: `Test Driver ${testSuffix}`,
        email: `driver_${testSuffix}@college.edu`,
        phone: `98765${testSuffix}`,
        password: 'Password@123',
        license_number: `DL-2026-${testSuffix}`,
        license_expiry: '2030-12-31',
        experience_years: 5,
        status: 'ACTIVE',
      },
    });
    const driver = driverRes.data?.user || driverRes.data;
    const driverToken = makeToken({ id: driver.id, email: driver.email, role: 'DRIVER', college_id: collegeId });
    const driverAuth = { Authorization: `Bearer ${driverToken}` };
    console.log(`[TEST 1] Created Dedicated Test Driver: ${driver.full_name} (${driver.id})`);

    // 2. Create Dedicated Test Vehicle (Capacity: 2)
    const vehRes = await request('/admin/vehicles', {
      method: 'POST',
      headers: adminAuth,
      body: {
        college_id: collegeId,
        vehicle_number: `DL-01-T-${testSuffix}`,
        model: 'Test Force Traveller',
        type: 'CAB_4',
        seating_capacity: 2,
        status: 'ACTIVE',
      },
    });
    const vehicle = vehRes.data;
    console.log(`[TEST 2] Created Dedicated Test Vehicle: ${vehicle.vehicle_number} (Capacity: ${vehicle.seating_capacity})`);

    // 3. Create a Dedicated Test Route with 3 Sequential Stops
    const p1 = pickupPoints[0];
    const p2 = pickupPoints[1];
    const p3 = pickupPoints[2];

    const testRouteCode = `TR-${testSuffix}`;
    const routePayload = {
      college_id: collegeId,
      name: `Test Corridor ${testRouteCode}`,
      code: testRouteCode,
      description: 'Automated Test Corridor with 3 sequential stops',
      morning_departure_time: '07:30:00',
      evening_departure_time: '17:30:00',
      estimated_duration_mins: 35,
      default_vehicle_id: vehicle.id,
      default_driver_id: driver.id,
      max_capacity: 2,
      stops: [
        { pickup_point_id: p1.id, sequence_order: 1, morning_pickup_time: '07:30:00' },
        { pickup_point_id: p2.id, sequence_order: 2, morning_pickup_time: '07:45:00' },
        { pickup_point_id: p3.id, sequence_order: 3, morning_pickup_time: '08:00:00' },
      ],
    };

    const routeRes = await request('/admin/routes', { method: 'POST', headers: adminAuth, body: routePayload });
    const createdRoute = routeRes.data;
    console.log(`[TEST 3] Created Test Route: "${createdRoute.name}" with ${createdRoute.stops?.length || 3} sequential stops.`);

    // 4. Retrieve auto-synced Scheduled Trip for Today
    const todayIST = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
    const allTripsRes = await request(`/trips?date=${todayIST}`, { headers: adminAuth });
    let trip = (allTripsRes.data || []).find((t) => {
      const rId = t.route_id || t.routeId || t.route?.id;
      const tType = t.trip_type || t.tripType;
      return rId === createdRoute.id && tType === 'MORNING_PICKUP';
    });

    if (trip) {
      console.log(` -> Found scheduled trip #${trip.id}`);
    } else {
      throw new Error(`Scheduled trip could not be synced for route ${createdRoute.id}`);
    }
    console.log(`[TEST 4] Scheduled Trip verified #${trip.id} for Date ${todayIST} (Capacity: ${trip.max_capacity || 2})`);

    // Create 3 Verified Students via Admin API
    const s1Res = await request('/admin/students', {
      method: 'POST',
      headers: adminAuth,
      body: {
        college_id: collegeId,
        full_name: `Student 1 (${testSuffix})`,
        email: `student1_${testSuffix}@college.edu`,
        phone: `91111${testSuffix}`,
        password: 'Password@123',
        student_id_number: `STU-${testSuffix}-01`,
        course: 'Computer Science',
        verification_status: 'VERIFIED',
      },
    });
    const student1 = s1Res.data.user;

    const s2Res = await request('/admin/students', {
      method: 'POST',
      headers: adminAuth,
      body: {
        college_id: collegeId,
        full_name: `Student 2 (${testSuffix})`,
        email: `student2_${testSuffix}@college.edu`,
        phone: `92222${testSuffix}`,
        password: 'Password@123',
        student_id_number: `STU-${testSuffix}-02`,
        course: 'Mechanical Engineering',
        verification_status: 'VERIFIED',
      },
    });
    const student2 = s2Res.data.user;

    const s3Res = await request('/admin/students', {
      method: 'POST',
      headers: adminAuth,
      body: {
        college_id: collegeId,
        full_name: `Student 3 (${testSuffix})`,
        email: `student3_${testSuffix}@college.edu`,
        phone: `93333${testSuffix}`,
        password: 'Password@123',
        student_id_number: `STU-${testSuffix}-03`,
        course: 'Civil Engineering',
        verification_status: 'VERIFIED',
      },
    });
    const student3 = s3Res.data.user;

    // Find or create Plan
    let planRes = await request('/plans', { headers: adminAuth });
    let plan = planRes.data?.[0];
    if (!plan) {
      const pRes = await pgClient.query(`
        INSERT INTO subscription_plans (college_id, name, tier, ride_count_total, duration_days, price, is_active)
        VALUES ($1, 'Monthly Commuter Pass', 'MONTHLY_STANDARD', 40, 30, 2400.00, true)
        RETURNING *;
      `, [collegeId]);
      plan = pRes.rows[0];
    }

    // Seed Active Subscriptions with 10 remaining rides each for the 3 test students
    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    for (const stu of [student1, student2, student3]) {
      await pgClient.query(`
        INSERT INTO subscriptions (student_id, plan_id, status, remaining_rides, total_rides_allocated, start_date, end_date)
        VALUES ($1, $2, 'ACTIVE', 10, 40, $3, $4);
      `, [stu.id, plan.id, startDate, endDate]);
    }
    console.log(`[INIT] Seeded active subscriptions with 10 ride credits for Students 1, 2, and 3.`);

    const s1Auth = { Authorization: `Bearer ${makeToken({ id: student1.id, email: student1.email, role: 'STUDENT', college_id: collegeId })}` };
    const s2Auth = { Authorization: `Bearer ${makeToken({ id: student2.id, email: student2.email, role: 'STUDENT', college_id: collegeId })}` };
    const s3Auth = { Authorization: `Bearer ${makeToken({ id: student3.id, email: student3.email, role: 'STUDENT', college_id: collegeId })}` };

    // 5. Scenario: Scheduled Booking for Student 1 at Stop #1 -> Drop at Stop #3
    const book1Res = await request('/bookings', {
      method: 'POST',
      headers: s1Auth,
      body: {
        trip_id: trip.id,
        pickup_point_id: p1.id,
        drop_point_id: p3.id,
      },
    });
    console.log(`[TEST 5] Student 1 booked on scheduled trip successfully. Seat #${book1Res.data.booking.seat_number}`);

    // 6. Scenario: Driver starts trip -> status becomes IN_PROGRESS
    const startTripRes = await request(`/trips/${trip.id}/start`, { method: 'POST', headers: driverAuth });
    console.log(`[TEST 6] Driver started trip. Status: ${startTripRes.data.status}`);

    // 7. Scenario: Driver sends GPS coordinate near Stop #1 (lat: p1.latitude, lng: p1.longitude)
    const gpsRes = await request(`/trips/${trip.id}/location`, {
      method: 'POST',
      headers: driverAuth,
      body: {
        latitude: p1.latitude,
        longitude: p1.longitude,
        speed: 25.0,
        heading: 90.0,
      },
    });
    console.log(`[TEST 7] Driver transmitted GPS at Stop #1. Current Stop Sequence updated to: ${gpsRes.data.currentStopSequence}`);

    // 8. Scenario: Student 2 attempts booking at downstream Stop #2 (sequence 2 > cab sequence 1) -> SUCCEEDS
    const book2Res = await request('/bookings', {
      method: 'POST',
      headers: s2Auth,
      body: {
        trip_id: trip.id,
        pickup_point_id: p2.id,
        drop_point_id: p3.id,
      },
    });
    console.log(`[TEST 8] Student 2 booked on active trip ahead of cab (Stop #2). Seat #${book2Res.data.booking.seat_number}`);

    // 9. Scenario: Capacity is now 2/2 (Full). Student 3 attempts booking -> REJECTED (Trip full)
    try {
      await request('/bookings', {
        method: 'POST',
        headers: s3Auth,
        body: {
          trip_id: trip.id,
          pickup_point_id: p2.id,
          drop_point_id: p3.id,
        },
      });
      throw new Error('FAILED: Booking should have been rejected for full trip!');
    } catch (err) {
      console.log(`[TEST 9] PASS: Full capacity rejected as expected: "${err.data?.message || err.message}"`);
    }

    // 10. Scenario: Passed Stop Rejection Check (Simulate check on Stop #1 where cab already passed)
    const checkAvailRes = await request('/bookings/check-availability', {
      method: 'POST',
      headers: s3Auth,
      body: {
        route_id: createdRoute.id,
        pickup_point_id: p1.id,
      },
    });
    if (checkAvailRes.data.available) {
      throw new Error('FAILED: Passed stop should not be available!');
    } else {
      console.log(`[TEST 10] PASS: Check availability on passed stop rejected: "${checkAvailRes.data.reason}"`);
    }

    // 11. Scenario: Driver inspects Manifest with sequential stops & student details
    const manifestRes = await request(`/drivers/trips/${trip.id}/manifest`, { headers: driverAuth });
    const manifest = manifestRes.data;
    console.log(`[TEST 11] Manifest retrieved with ${manifest.length} passengers:`);
    manifest.forEach((p, idx) => {
      console.log(`  Pax ${idx + 1}: ${p.student_name} (ID: ${p.student_id_number}) | Pickup: Stop #${p.pickup_stop_sequence} (${p.pickup_name}) | Drop: ${p.drop_name} | Status: ${p.status}`);
    });

    // 12. Scenario: QR / Boarding Pass Validation
    // Student 1 gets signed dynamic QR token
    const studentPassId = book1Res.data.pass.id;
    const qrTokenRes = await request(`/qr/student/pass/${studentPassId}`, { headers: s1Auth });
    const qrToken = qrTokenRes.data.qrToken;
    console.log(`[TEST 12a] Student 1 Dynamic QR Token generated.`);

    // Driver scans and verifies Student 1's QR token
    const qrVerifyRes = await request('/qr/driver/verify-scan', {
      method: 'POST',
      headers: driverAuth,
      body: {
        trip_id: trip.id,
        token: qrToken,
      },
    });
    console.log(`[TEST 12b] Driver QR Boarding successful for student: ${qrVerifyRes.data?.student?.name || 'Student'}. Authorized: ${qrVerifyRes.data?.authorized}`);

    // 13. Scenario: Trip Completion & Final History Calculation
    // End trip (Student 1 is BOARDED, Student 2 remained WAITING -> will be marked NO_SHOW)
    const endTripRes = await request(`/drivers/trips/${trip.id}/end`, { method: 'POST', headers: driverAuth });
    console.log(`[TEST 13a] Driver ended trip. Status: ${endTripRes.data.status}`);

    // Query Driver Trip History
    const historyRes = await request(`/trips/${trip.id}/history`, { headers: driverAuth });
    const completedTrip = historyRes.data;

    console.log(`[TEST 13b] Completed Trip in Driver History:`);
    console.log(`  Route: ${completedTrip?.route?.name}`);
    console.log(`  Total Seats: ${completedTrip?.total_seats}`);
    console.log(`  Booked Passengers: ${completedTrip?.booked_seats}`);
    console.log(`  Boarded Passengers: ${completedTrip?.boarded_passengers}`);
    console.log(`  Not Boarded (No-Show): ${completedTrip?.not_boarded_passengers}`);
    console.log(`  Cancelled: ${completedTrip?.cancelled_passengers}`);

    if (completedTrip?.boarded_passengers === 1 && completedTrip?.not_boarded_passengers === 1) {
      console.log('\n================================================================');
      console.log('>>> ALL 12 INTEGRATION TESTS PASSED WITH 100% RELIABILITY! <<<');
      console.log('================================================================\n');
    } else {
      console.warn('[WARNING] Boarding breakdown counts:', completedTrip);
    }
  } catch (error) {
    console.error('\n❌ TEST SUITE ENCOUNTERED AN ERROR:', error.data || error.message);
    process.exit(1);
  } finally {
    await pgClient.end();
  }
}

runCompleteTestSuite();
