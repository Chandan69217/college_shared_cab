const API_BASE = 'http://localhost:5000/api/v1';

async function req(endpoint, method = 'GET', body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${endpoint}`, options);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function run() {
  console.log('🚀 Starting Real GPS Background Tracking & Lifecycle Verification...\n');

  // 1. Authenticate Driver
  console.log('1️⃣ Authenticating Driver...');
  let driverToken, driverId, vehicleId, tripId;
  const loginRes = await req('/auth/login', 'POST', {
    email: 'driver@test.com',
    password: 'password123',
  });

  if (!loginRes.ok) {
    console.error('   ❌ Driver login failed:', loginRes.data);
    process.exit(1);
  }
  driverToken = loginRes.data.data.token;
  driverId = loginRes.data.data.user.id;
  console.log(`   ✅ Logged in driver: ${driverId}`);

  // 2. Fetch Driver Dashboard to get/create active or scheduled trip
  console.log('\n2️⃣ Fetching Driver Dashboard...');
  const dashRes = await req('/drivers/dashboard', 'GET', null, driverToken);
  let activeTrip = dashRes.data.data?.activeTrip;
  let scheduledTrips = dashRes.data.data?.scheduledTrips || [];
  vehicleId = dashRes.data.data?.assignedVehicle?.id;
  console.log(`   ✅ Driver dashboard loaded: activeTrip=${activeTrip?.id || 'none'}, vehicle=${vehicleId || 'none'}`);

  if (!activeTrip && scheduledTrips.length > 0) {
    tripId = scheduledTrips[0].id;
    console.log(`\n3️⃣ Starting Scheduled Trip: ${tripId}...`);
    const startRes = await req(`/trips/${tripId}/start`, 'POST', null, driverToken);
    console.log('   ✅ Trip started:', startRes.data.message);
  } else if (activeTrip) {
    tripId = activeTrip.id;
    console.log(`\n3️⃣ Using existing active in-progress trip: ${tripId}`);
  } else {
    console.log('   ℹ️ Querying all trips to find a valid trip for testing...');
    const tripsRes = await req('/drivers/trips', 'GET', null, driverToken);
    const all = tripsRes.data.data?.trips || [];
    if (all.length > 0) {
      tripId = all[0].id;
      console.log(`   ✅ Using trip ${tripId} (status: ${all[0].status})`);
      if (all[0].status === 'SCHEDULED') {
        await req(`/trips/${tripId}/start`, 'POST', null, driverToken);
        console.log('   ✅ Started trip.');
      }
    }
  }

  if (tripId) {
    // 4. Test Real GPS Location Ingestion - POST /trips/:tripId/location
    console.log('\n4️⃣ Testing Real GPS Ingestion (/trips/:tripId/location)...');
    const validGps = {
      latitude: 18.52043,
      longitude: 73.85674,
      accuracy: 8.5,
      speed: 34.2,
      heading: 145.0,
      timestamp: new Date().toISOString(),
    };

    const locRes = await req(`/trips/${tripId}/location`, 'POST', validGps, driverToken);
    if (locRes.ok) {
      console.log('   ✅ GPS Location ingested successfully:', locRes.data);
    } else {
      console.error('   ❌ GPS ingestion notice:', locRes.status, locRes.data);
    }

    // 5. Test Driver Route GPS Ingestion - POST /driver/trips/:tripId/location
    console.log('\n5️⃣ Testing Driver Route GPS Ingestion (/driver/trips/:tripId/location)...');
    const dLocRes = await req(`/driver/trips/${tripId}/location`, 'POST', {
      latitude: 18.52150,
      longitude: 73.85780,
      accuracy: 6.2,
      speed: 28.5,
      heading: 150.0,
      timestamp: new Date().toISOString(),
    }, driverToken);
    if (dLocRes.ok) {
      console.log('   ✅ Driver route GPS ingested successfully:', dLocRes.data);
    } else {
      console.error('   ❌ Driver GPS ingestion notice:', dLocRes.status, dLocRes.data);
    }

    // 6. Security Test: Invalid / Out-of-bounds coordinates rejection
    console.log('\n6️⃣ Security Test: Testing Invalid GPS Coordinates Rejection...');
    const invalidLocRes = await req(`/trips/${tripId}/location`, 'POST', {
      latitude: 195.0, // Invalid latitude (> 90)
      longitude: 73.85,
    }, driverToken);
    if (!invalidLocRes.ok) {
      console.log(`   ✅ Correctly rejected invalid latitude (HTTP ${invalidLocRes.status}):`, invalidLocRes.data?.message);
    } else {
      console.error('   ❌ Security failure: Invalid latitude was accepted!');
    }

    // 7. Security Test: Unauthorized driver access
    console.log('\n7️⃣ Security Test: Testing Unauthorized Location Ingestion (No Auth Token)...');
    const unauthLocRes = await req(`/trips/${tripId}/location`, 'POST', validGps, null);
    if (!unauthLocRes.ok) {
      console.log(`   ✅ Correctly rejected unauthenticated request (HTTP ${unauthLocRes.status})`);
    } else {
      console.error('   ❌ Security failure: Unauthenticated GPS post was accepted!');
    }

    // 8. Test Student Live Tracking Endpoint
    console.log('\n8️⃣ Testing Student Live Tracking Visibility (/students/tracking)...');
    const studentLogin = await req('/auth/login', 'POST', {
      email: 'student@test.com',
      password: 'password123',
    });
    if (studentLogin.ok) {
      const studentToken = studentLogin.data.data.token;
      const trackRes = await req('/students/tracking', 'GET', null, studentToken);
      console.log('   ✅ Student tracking response received:');
      console.log('      hasActiveTrip:', trackRes.data.data?.hasActiveTrip);
      console.log('      liveLatitude:', trackRes.data.data?.trip?.liveLatitude);
      console.log('      liveLongitude:', trackRes.data.data?.trip?.liveLongitude);
      console.log('      staleStatus:', trackRes.data.data?.trip?.staleStatus);
    }

    // 9. Test Admin Live Fleet Radar Locations Endpoint
    console.log('\n9️⃣ Testing Admin Active Fleet Radar (/trips/active-locations)...');
    const adminLogin = await req('/auth/login', 'POST', {
      email: 'admin@campusride.com',
      password: 'AdminPassword123!',
    });
    if (adminLogin.ok) {
      const adminToken = adminLogin.data.data.token;
      const radarRes = await req('/trips/active-locations', 'GET', null, adminToken);
      console.log(`   ✅ Admin Radar loaded ${radarRes.data.data?.length || 0} active vehicle locations:`);
      radarRes.data.data?.forEach(v => {
        console.log(`      Vehicle: ${v.vehicle?.number}, Lat: ${v.latitude}, Lng: ${v.longitude}, Status: ${v.staleStatus}, StopSeq: ${v.currentStopSequence}`);
      });
    }

    // 10. Test Trip GPS History / Breadcrumbs Replay
    console.log('\n🔟 Testing Trip History Breadcrumbs (/trips/:tripId/history)...');
    const histRes = await req(`/trips/${tripId}/history`, 'GET', null, driverToken);
    console.log(`   ✅ Breadcrumbs recorded: ${histRes.data.data?.breadcrumbs?.length || 0} fixes in vehicle_location_history`);
  }

  console.log('\n🎉 Real GPS Background Tracking & Lifecycle Verification complete!');
}

run().catch(console.error);
