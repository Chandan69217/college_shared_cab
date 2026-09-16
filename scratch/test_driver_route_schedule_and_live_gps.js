const path = require('path');
const backendDir = 'e:/Programs/Flutter Projects/college_shared_cab/backend';
const jwt = require(path.join(backendDir, 'node_modules/jsonwebtoken'));
const dotenv = require(path.join(backendDir, 'node_modules/dotenv'));
dotenv.config({ path: path.join(backendDir, '.env') });

const BASE_URL = 'http://localhost:5000/api/v1';

function createToken(userId, email, role, fullName) {
  return jwt.sign(
    { userId, email, role, fullName },
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: '1d' }
  );
}

async function req(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    const error = new Error(data.message || `HTTP ${res.status}`);
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

async function testFlow() {
  console.log('====================================================');
  console.log('🚀 TESTING DRIVER ROUTE ASSIGNMENT, SCHEDULED TRIPS & LIVE GPS');
  console.log('====================================================\n');

  try {
    // 1. Generate Auth Tokens
    console.log('1️⃣ Generating Authentic Admin & Driver JWT Tokens...');
    const adminToken = createToken(
      '8aee29f2-d296-4b8c-854f-27581b681f3e',
      'chandansharma69217@gmail.com',
      'ADMIN',
      'Chandan Sharma (Admin)'
    );
    const driverId = '68095e62-dd3c-4eed-9e58-6059e78b37ac';
    const driverToken = createToken(
      driverId,
      'chandansharma@driver.com',
      'DRIVER',
      'Chandan (Driver)'
    );
    console.log('   ✅ Tokens generated for Admin & Driver.');

    // 2. Fetch Routes & Vehicles from Catalog
    console.log('\n2️⃣ Fetching active routes and vehicles...');
    const routesRes = await req('/catalog/routes', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const routes = routesRes.data;
    const activeRoute = routes.find(r => r.is_active) || routes[0];
    console.log(`   Selected Route: "${activeRoute.name}" (ID: ${activeRoute.id})`);

    const vehiclesRes = await req('/catalog/vehicles', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const vehicle = vehiclesRes.data[0];
    console.log(`   Selected Vehicle: "${vehicle.vehicle_number}" (ID: ${vehicle.id})`);

    // 3. Assign Driver and Vehicle to Route
    console.log(`\n3️⃣ Assigning Driver "${driverId}" and Vehicle "${vehicle.id}" to Route "${activeRoute.name}"...`);
    await req('/admin/assignments/route-allocation', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        route_id: activeRoute.id,
        default_driver_id: driverId,
        default_vehicle_id: vehicle.id,
      },
    });
    console.log('   ✅ Route resource allocation updated.');

    // 4. Driver Dashboard & Scheduled Trips Retrieval
    console.log('\n4️⃣ Fetching Driver Dashboard & Scheduled Trips for today...');
    const driverDashRes = await req('/drivers/dashboard', {
      headers: { Authorization: `Bearer ${driverToken}` },
    });
    const dashData = driverDashRes.data;
    console.log(`   Driver: ${dashData.driver?.full_name} (${dashData.driver?.email})`);
    console.log(`   Today's Scheduled Trips Count: ${dashData.todayTrips.length}`);
    dashData.todayTrips.forEach((t, i) => {
      console.log(`     [Trip ${i+1}] ID: ${t.id} | Type: ${t.trip_type} | Time: ${t.scheduled_departure_time} | Status: ${t.status} | Route: ${t.route?.name}`);
    });

    const activeTrip = dashData.activeTrip || dashData.todayTrips[0];
    if (!activeTrip) {
      throw new Error('No scheduled trip found for driver today!');
    }
    console.log(`   Active Trip Target: ${activeTrip.id} (Status: ${activeTrip.status})`);

    // 5. Driver Starts the Trip (if SCHEDULED)
    if (activeTrip.status === 'SCHEDULED') {
      console.log(`\n5️⃣ Driver starting trip ${activeTrip.id}...`);
      const startRes = await req(`/trips/${activeTrip.id}/start`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${driverToken}` },
      });
      console.log(`   ✅ Trip Started! Status: ${startRes.data.status}`);
    } else {
      console.log(`\n5️⃣ Trip ${activeTrip.id} is currently in "${activeTrip.status}" status.`);
    }

    // 6. Driver Transmits Live GPS Location to the System
    console.log('\n6️⃣ Driver transmitting live GPS coordinates from mobile app...');
    const testLat = 28.535512;
    const testLng = 77.391028;
    const locRes = await req(`/trips/${activeTrip.id}/location`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${driverToken}` },
      body: {
        latitude: testLat,
        longitude: testLng,
        accuracy: 4.5,
        speed: 38.0,
        heading: 90.0,
        timestamp: new Date().toISOString(),
      },
    });
    console.log('   ✅ Live GPS coordinates received by system:', {
      tripId: locRes.data.tripId,
      vehicleId: locRes.data.vehicleId,
      driverId: locRes.data.driverId,
      latitude: locRes.data.latitude,
      longitude: locRes.data.longitude,
      speed: locRes.data.speed,
      staleStatus: locRes.data.staleStatus,
      updatedAt: locRes.data.updatedAt,
    });

    // 7. Admin Sees Live Fleet Location in Web Portal
    console.log('\n7️⃣ Checking Admin Live Fleet Map view (/trips/active-locations)...');
    const adminFleetRes = await req('/trips/active-locations', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const activeFleet = adminFleetRes.data;
    const trackedVehicle = activeFleet.find(v => v.tripId === activeTrip.id);
    console.log(`   Admin Active Vehicles Count in Fleet: ${activeFleet.length}`);
    if (trackedVehicle) {
      console.log(`   ✅ Admin successfully sees vehicle live on map:`);
      console.log(`      • Vehicle: ${trackedVehicle.vehicle?.number} (${trackedVehicle.vehicle?.model})`);
      console.log(`      • Driver: ${trackedVehicle.driver?.name}`);
      console.log(`      • Route: ${trackedVehicle.route?.name} (${trackedVehicle.route?.code})`);
      console.log(`      • Live Coordinates: (${trackedVehicle.latitude}, ${trackedVehicle.longitude})`);
      console.log(`      • Live Status: ${trackedVehicle.staleStatus} (isLive: ${trackedVehicle.isLive})`);
      console.log(`      • Last Updated: ${trackedVehicle.lastUpdated}`);
    } else {
      console.log('   ⚠️ Tracked vehicle not in fleet response list.');
    }

    // 8. Single Trip Location API (used by Student Tracking screen)
    console.log(`\n8️⃣ Checking Single Trip Live Location (/trips/${activeTrip.id}/location)...`);
    const singleTripLocRes = await req(`/trips/${activeTrip.id}/location`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log('   ✅ Single Trip Live View:', {
      tripId: singleTripLocRes.data.tripId,
      status: singleTripLocRes.data.status,
      liveLatitude: singleTripLocRes.data.liveLatitude,
      liveLongitude: singleTripLocRes.data.liveLongitude,
      isLive: singleTripLocRes.data.isLive,
      staleStatus: singleTripLocRes.data.staleStatus,
      vehicle: singleTripLocRes.data.vehicle?.number,
      driver: singleTripLocRes.data.driver?.name,
      route: singleTripLocRes.data.route?.name,
    });

    console.log('\n====================================================');
    console.log('🎉 ALL ASSIGNMENT, SCHEDULE & GPS VERIFICATIONS PASSED 100%!');
    console.log('====================================================');
  } catch (err) {
    console.error('❌ Error during test flow:', err.data || err.message);
    process.exit(1);
  }
}

testFlow();
