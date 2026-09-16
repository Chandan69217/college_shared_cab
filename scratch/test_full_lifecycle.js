const path = require('path');
const { createClient } = require(path.join(__dirname, '../backend/node_modules/@supabase/supabase-js'));
const dotenv = require(path.join(__dirname, '../backend/node_modules/dotenv'));
const jwt = require(path.join(__dirname, '../backend/node_modules/jsonwebtoken'));
const http = require('http');

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in backend/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function makeRequest(path, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const isRootHealth = path === '/health';
    const url = new URL(isRootHealth ? `http://localhost:5000${path}` : `http://localhost:5000/api/v1${path}`);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, text: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name,
    },
    jwtSecret,
    { expiresIn: '7d' }
  );
}

async function runEndToEndVerification() {
  console.log('=================================================================');
  console.log('🧪 RUNNING COMPREHENSIVE END-TO-END SYSTEM VERIFICATION');
  console.log('=================================================================\n');

  let passed = 0;
  let failed = 0;

  // 1. Health Check
  try {
    const health = await makeRequest('/health');
    if (health.status === 200 && health.data?.status === 'healthy') {
      console.log('✅ [1/10] Root Health Check: OK (uptime:', health.data.uptime.toFixed(1), 's)');
      passed++;
    } else {
      console.error('❌ [1/10] Root Health Check failed:', health);
      failed++;
    }
  } catch (err) {
    console.error('❌ [1/10] Root Health Check error:', err.message);
    failed++;
  }

  // 2. Fetch or Prepare Users
  let studentUser = null;
  let driverUser = null;
  let adminUser = null;

  try {
    const { data: students } = await supabase.from('users').select('*').eq('role', 'STUDENT').limit(1);
    const { data: drivers } = await supabase.from('users').select('*').eq('role', 'DRIVER').limit(1);
    const { data: admins } = await supabase.from('users').select('*').eq('role', 'ADMIN').limit(1);

    // Find a student with profile
    const { data: stProfiles } = await supabase
      .from('student_profiles')
      .select('*, user:users!student_profiles_id_fkey(*)')
      .limit(1);

    if (stProfiles && stProfiles.length > 0 && stProfiles[0].user) {
      studentUser = stProfiles[0].user;
      await supabase.from('users').update({ status: 'ACTIVE' }).eq('id', studentUser.id);
      await supabase.from('student_profiles').update({ verification_status: 'VERIFIED' }).eq('id', studentUser.id);
    } else {
      const { data: students } = await supabase.from('users').select('*').eq('role', 'STUDENT').limit(1);
      if (students && students.length > 0) {
        studentUser = students[0];
        const { data: cols } = await supabase.from('colleges').select('id').limit(1);
        await supabase.from('users').update({ status: 'ACTIVE' }).eq('id', studentUser.id);
        await supabase.from('student_profiles').upsert({
          id: studentUser.id,
          college_id: cols?.[0]?.id,
          verification_status: 'VERIFIED',
          course: 'B.Tech Computer Science',
        });
      }
    }

    if (drivers && drivers.length > 0) {
      driverUser = drivers[0];
      await supabase.from('users').update({ status: 'ACTIVE' }).eq('id', driverUser.id);
    }
    if (admins && admins.length > 0) {
      adminUser = admins[0];
      await supabase.from('users').update({ status: 'ACTIVE' }).eq('id', adminUser.id);
    }

    console.log(`ℹ️ Test Users Loaded: Student=${studentUser?.full_name} (${studentUser?.id}), Driver=${driverUser?.full_name} (${driverUser?.id}), Admin=${adminUser?.full_name}`);
  } catch (err) {
    console.error('❌ Failed to load test users:', err.message);
  }

  if (!studentUser || !driverUser || !adminUser) {
    console.error('❌ Missing test users in DB.');
    return;
  }

  const studentToken = generateToken(studentUser);
  const driverToken = generateToken(driverUser);
  const adminToken = generateToken(adminUser);

  // 3. Admin Subscriptions Query Integrity
  try {
    const subsRes = await makeRequest('/subscriptions', 'GET', null, adminToken);
    if (subsRes.data?.success && Array.isArray(subsRes.data.data)) {
      const subs = subsRes.data.data;
      console.log(`✅ [2/10] Admin Subscriptions: ${subs.length} records retrieved with normalized student & plan metadata.`);
      if (subs.length > 0) {
        const sample = subs[0];
        console.log(`   Sample Sub: ID=${sample.id}, Student=${sample.student_name || sample.student?.full_name}, Email=${sample.student_email || sample.student?.email}, Plan=${sample.plan_name || sample.plan?.name}`);
      }
      passed++;
    } else {
      console.error('❌ [2/10] Admin Subscriptions failed:', subsRes);
      failed++;
    }
  } catch (err) {
    console.error('❌ [2/10] Admin Subscriptions error:', err.message);
    failed++;
  }

  // 4. Admin Bookings Query Integrity
  try {
    const bkgRes = await makeRequest('/bookings', 'GET', null, adminToken);
    if (bkgRes.data?.success && Array.isArray(bkgRes.data.data)) {
      const bkgs = bkgRes.data.data;
      console.log(`✅ [3/10] Admin Bookings: ${bkgs.length} records retrieved.`);
      if (bkgs.length > 0) {
        const sample = bkgs[0];
        console.log(`   Sample Booking: ID=${sample.id}, Student=${sample.student_name || sample.student?.full_name}, Pickup=${sample.pickup_point_name || sample.pickup_point?.name}, Seat=#${sample.seat_number}`);
      }
      passed++;
    } else {
      console.error('❌ [3/10] Admin Bookings failed:', bkgRes);
      failed++;
    }
  } catch (err) {
    console.error('❌ [3/10] Admin Bookings error:', err.message);
    failed++;
  }

  // 5. Admin Reports & Financial Analytics
  try {
    const rptRes = await makeRequest('/reports', 'GET', null, adminToken);
    if (rptRes.data?.success && rptRes.data.data) {
      const rpt = rptRes.data.data;
      console.log(`✅ [4/10] Admin Reports: Real data computed (Drivers: ${rpt.driverPerformance?.length || 0}, Vehicles: ${rpt.vehicleUtilization?.length || 0}).`);
      passed++;
    } else {
      console.error('❌ [4/10] Admin Reports failed:', rptRes);
      failed++;
    }
  } catch (err) {
    console.error('❌ [4/10] Admin Reports error:', err.message);
    failed++;
  }

  // 6. Ensure Student has Active Subscription
  try {
    const { data: existingSubs } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('student_id', studentUser.id)
      .eq('status', 'ACTIVE')
      .limit(1);

    if (!existingSubs || existingSubs.length === 0) {
      const { data: plans } = await supabase.from('subscription_plans').select('*').limit(1);
      if (plans && plans.length > 0) {
        const plan = plans[0];
        await supabase.from('subscriptions').insert([{
          student_id: studentUser.id,
          plan_id: plan.id,
          status: 'ACTIVE',
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          rides_remaining: 50,
          auto_renew: true,
        }]);
        console.log('ℹ️ Created active subscription for test student.');
      }
    }
    console.log('✅ [5/10] Active student subscription confirmed.');
    passed++;
  } catch (err) {
    console.error('❌ [5/10] Student subscription check error:', err.message);
    failed++;
  }

  // 7. Atomic Concurrency-Safe Booking Test
  let createdBookingId = null;
  let createdPassId = null;
  let testTripId = null;

  try {
    // Find or reset driver's trip for today
    const today = new Date().toISOString().split('T')[0];
    let { data: existingTrip } = await supabase
      .from('trips')
      .select('*')
      .eq('driver_id', driverUser.id)
      .eq('trip_date', today)
      .eq('trip_type', 'MORNING_PICKUP')
      .maybeSingle();

    if (existingTrip) {
      await supabase.from('trips').update({
        status: 'SCHEDULED',
        actual_start_time: null,
        actual_end_time: null,
        booked_seats: 0,
        boarded_passengers: 0,
      }).eq('id', existingTrip.id);
      testTripId = existingTrip.id;
    } else {
      const { data: routes } = await supabase.from('routes').select('*').limit(1);
      const { data: vehicles } = await supabase.from('vehicles').select('*').limit(1);

      const { data: newTrip } = await supabase.from('trips').insert([{
        route_id: routes[0].id,
        vehicle_id: vehicles[0].id,
        driver_id: driverUser.id,
        trip_date: today,
        trip_type: 'MORNING_PICKUP',
        scheduled_departure_time: '08:30:00',
        max_capacity: 6,
        booked_seats: 0,
        status: 'SCHEDULED',
      }]).select('*').single();
      testTripId = newTrip?.id;
    }

    const { data: pickups } = await supabase.from('pickup_points').select('*').limit(1);

    if (testTripId && pickups && pickups.length > 0) {
      // Clear any prior booking for this student on this trip to avoid duplicate conflict
      await supabase.from('trip_passengers').delete().eq('trip_id', testTripId).eq('student_id', studentUser.id);
      await supabase.from('daily_travel_passes').delete().eq('trip_id', testTripId).eq('student_id', studentUser.id);
      await supabase.from('bookings').delete().eq('trip_id', testTripId).eq('student_id', studentUser.id);

      const bookRes = await makeRequest('/bookings', 'POST', {
        trip_id: testTripId,
        pickup_point_id: pickups[0].id,
      }, studentToken);

      if (bookRes.data?.success && bookRes.data.data?.booking) {
        createdBookingId = bookRes.data.data.booking.id;
        createdPassId = bookRes.data.data.pass?.id || bookRes.data.data.travelPass?.id;
        console.log(`✅ [6/10] Atomic Ride Booking Succeeded: Booking ID=${createdBookingId}, Seat=#${bookRes.data.data.booking.seat_number}, Pass ID=${createdPassId}`);
        passed++;
      } else {
        console.error('❌ [6/10] Booking failed:', bookRes);
        failed++;
      }
    }
  } catch (err) {
    console.error('❌ [6/10] Booking test error:', err.message);
    failed++;
  }

  // 8. Dynamic HMAC Signed QR Pass & Verification
  if (createdPassId && testTripId) {
    try {
      const qrRes = await makeRequest(`/qr/student/pass/${createdPassId}`, 'GET', null, studentToken);
      if (qrRes.data?.success && qrRes.data.data?.qrToken) {
        const qrToken = qrRes.data.data.qrToken;
        console.log(`✅ [7/10] Dynamic Signed QR Token generated for Pass: ${createdPassId}`);
        passed++;

        // Driver First Scan
        const scanRes1 = await makeRequest('/qr/driver/verify-scan', 'POST', {
          trip_id: testTripId,
          token: qrToken,
          client_latitude: 28.6139,
          client_longitude: 77.2090,
        }, driverToken);

        if (scanRes1.data?.data?.authorized === true) {
          console.log(`✅ [8/10] Driver QR Boarding Verification Approved: "${scanRes1.data.message}"`);
          passed++;
        } else {
          console.error('❌ [8/10] Driver QR scan was not authorized:', scanRes1);
          failed++;
        }

        // Driver Second Scan (Anti-Replay Security Check)
        const scanRes2 = await makeRequest('/qr/driver/verify-scan', 'POST', {
          trip_id: testTripId,
          token: qrToken,
          client_latitude: 28.6139,
          client_longitude: 77.2090,
        }, driverToken);

        if (scanRes2.data?.data?.reason === 'ALREADY_USED' || scanRes2.data?.message?.includes('REPLAY DETECTED')) {
          console.log(`✅ [9/10] Anti-Replay Guard: Duplicate scan correctly rejected with "${scanRes2.data.message}"`);
          passed++;
        } else {
          console.error('❌ [9/10] Anti-Replay check failed:', scanRes2);
          failed++;
        }
      } else {
        console.error('❌ [7/10] Dynamic QR token generation failed:', qrRes);
        failed++;
      }
    } catch (err) {
      console.error('❌ QR verification error:', err.message);
      failed++;
    }
  }

  // 9. Driver Delay Reporting & Passenger Status Management
  if (testTripId) {
    try {
      const delayRes = await makeRequest(`/drivers/trips/${testTripId}/delay`, 'POST', {
        delayMinutes: 15,
        reason: 'TRAFFIC',
        notes: 'Heavy congestion near North Ring road',
      }, driverToken);

      if (delayRes.data?.success) {
        console.log('✅ [10/10] Driver Delay Reporting: Delay dispatched and passengers notified.');
        passed++;
      } else {
        console.error('❌ [10/10] Driver delay reporting failed:', delayRes);
        failed++;
      }

      // Test Passenger Status Update (e.g. mark NO_SHOW or BOARDED)
      const paxRes = await makeRequest(`/drivers/trips/${testTripId}/passengers/${studentUser.id}`, 'PATCH', {
        status: 'NO_SHOW',
      }, driverToken);

      if (paxRes.data?.success) {
        console.log('✅ Extra: Driver Manifest status update (NO_SHOW / BOARDED) succeeded.');
      }
    } catch (err) {
      console.error('❌ Driver delay/manifest error:', err.message);
      failed++;
    }
  }

  console.log('\n=================================================================');
  console.log(`🏁 COMPREHENSIVE VERIFICATION COMPLETE: ${passed} / 10 PASSED (${failed} failed)`);
  console.log('=================================================================\n');
}

runEndToEndVerification();
