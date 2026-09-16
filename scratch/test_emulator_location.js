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

async function testEmulatorLocation() {
  console.log('Testing Emulator GPS Transmission to Backend...');
  const driverId = '68095e62-dd3c-4eed-9e58-6059e78b37ac';
  const driverToken = createToken(
    driverId,
    'chandansharma@driver.com',
    'DRIVER',
    'Chandan (Driver)'
  );

  const tripId = 'df230771-df3f-4dde-8716-543f87053119';

  // Mountain view coordinates (standard Android Studio emulator)
  const emulatorLat = 37.4219983;
  const emulatorLng = -122.084;

  const locRes = await req(`/trips/${tripId}/location`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${driverToken}` },
    body: {
      latitude: emulatorLat,
      longitude: emulatorLng,
      accuracy: 20.0,
      speed: 53.9,
      heading: 45.0,
      timestamp: new Date().toISOString(),
    },
  });

  console.log('✅ Location Accepted by Backend:', locRes.data);

  // Check active fleet
  const adminToken = createToken(
    '8aee29f2-d296-4b8c-854f-27581b681f3e',
    'chandansharma69217@gmail.com',
    'ADMIN',
    'Chandan Sharma (Admin)'
  );
  const fleetRes = await req('/trips/active-locations', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const tracked = fleetRes.data.find(v => v.tripId === tripId);
  console.log('✅ Admin Fleet View Status:', {
    vehicle: tracked?.vehicle?.number,
    driver: tracked?.driver?.name,
    latitude: tracked?.latitude,
    longitude: tracked?.longitude,
    staleStatus: tracked?.staleStatus,
    isLive: tracked?.isLive,
    lastUpdated: tracked?.lastUpdated,
  });
}

testEmulatorLocation();
