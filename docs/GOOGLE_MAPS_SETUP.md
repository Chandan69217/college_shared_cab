# Google Cloud Maps & Real-Time Vehicle Location Tracking Setup Guide

This document explains the setup, API requirements, credentials, permissions, and security controls for the CampusRide real-time GPS fleet tracking architecture.

---

## Architecture Overview

```
[ Driver Phone GPS (Geolocator) ]
                ↓
    [ Flutter Driver App ]
                ↓ (POST /api/v1/trips/:tripId/location)
   [ Node.js Backend API ] (Validation, Spoofing checks, RBAC)
                ↓
    [ Supabase PostgreSQL ] (vehicle_current_locations + history)
                ↓
    [ Supabase Realtime ] (WebSockets broadcast)
         ↙              ↘
[ Flutter Student App ]   [ React Admin Web Dashboard ]
         ↓                             ↓
[ Google Maps Flutter ]       [ Google Maps JavaScript API ]
```

---

## 1. Google Cloud Platform Configuration

### Step 1: Create a Google Cloud Project
1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g., `CampusRide-Transport-Platform`).

### Step 2: Enable Required APIs
Navigate to **APIs & Services > Library** and enable only the required APIs:

1. **Maps SDK for Android** — Enables Google Maps in the Flutter Driver & Student Android apps.
2. **Maps SDK for iOS** — Enables Google Maps in the Flutter iOS apps (if deployed to iOS).
3. **Maps JavaScript API** — Enables interactive fleet maps, route previews, and location pickers in the React Admin Dashboard.
4. **Places API (New)** — Enables address autocomplete and landmark lookup when creating pickup points.
5. **Directions API** (Optional) — Enables turn-by-turn routing calculation and dynamic traffic-aware ETA predictions.

### Step 3: Create and Restrict API Keys
To protect against unauthorized usage and quota consumption:

1. **Android Key**:
   - Create an API key restricted to **Maps SDK for Android**.
   - Set application restriction to **Android apps** with your package name (`com.collegecab.college_shared_cab`) and SHA-1 signing fingerprint.
2. **Web Key**:
   - Create an API key restricted to **Maps JavaScript API** and **Places API**.
   - Set application restriction to **HTTP referrers (web sites)** (e.g., `http://localhost:5173/*` and your production admin domain).

---

## 2. Platform-Specific Configuration

### A. Android Configuration (`android/app/src/main/AndroidManifest.xml`)
Add the following permissions and meta-data tag:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- Permissions for Real-Time Driver Phone GPS Tracking -->
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />

    <application>
        <!-- Google Maps API Key Meta-Data -->
        <meta-data
            android:name="com.google.android.geo.API_KEY"
            android:value="${GOOGLE_MAPS_API_KEY}" />
    </application>
</manifest>
```

In `android/local.properties` (or CI/CD environment variables):
```properties
GOOGLE_MAPS_API_KEY=AIzaSyYourAndroidApiKeyHere
```

### B. React Admin Web Dashboard (`admin-web/.env`)
```env
VITE_GOOGLE_MAPS_API_KEY=AIzaSyYourWebApiKeyHere
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 3. Driver GPS Lifecycle & Anti-Spoofing Protections

### Lifecycle Guarantee
- **Driver Logged In / Idle**: GPS tracking is **OFF** (no unnecessary background tracking or battery consumption).
- **Driver Taps "Start Trip"**: 
  - Backend verifies driver assignment and sets status to `IN_PROGRESS`.
  - Driver App requests runtime location permissions and starts `Geolocator.getPositionStream`.
- **Active Trip In-Progress**: Periodic GPS fixes (5–10s rate limit, accuracy threshold < 50m) are transmitted to `POST /api/v1/trips/:tripId/location`.
- **Temporary Network Loss**: App detects offline status and buffers recent points locally (max 25 fixes), syncing automatically upon connection recovery.
- **Driver Taps "End Trip"**: 
  - Backend sets trip to `COMPLETED` and records final coordinates.
  - GPS stream is immediately cancelled (**OFF**).

### Backend Validation & Anti-Spoofing
1. **Driver Authorization**: Updates are rejected (`403 Forbidden`) if the submitting user is not the driver assigned to the active `trip_id`.
2. **Active Status Check**: Location updates are rejected if the trip is not in `IN_PROGRESS` state.
3. **Coordinate Bounds**: Latitude must be $\in [-90, 90]$ and Longitude must be $\in [-180, 180]$.
4. **Physical Speed Limit**: Speeds exceeding 140 km/h in campus transit shuttles are rejected (`400 Bad Request`).
5. **Teleportation Detection**: Coordinate jumps exceeding 20 km in under a few seconds are flagged and rejected (`SPOOFING_DETECTED`).
6. **Timestamp Freshness**: Timestamps older than 15 minutes or in the future are rejected.

---

## 4. Stale Location Indicators

Maps indicate tracking freshness:
- 🟢 **Live** (Updated < 30 seconds ago)
- 🟡 **Delayed** (Updated 30–120 seconds ago)
- 🔴 **Offline / Stale** (Updated > 120 seconds ago or trip not active)

---

## 5. Supabase Realtime & Database Setup

Execute migration `supabase/migrations/20260915000000_live_tracking_tables.sql` to create:
1. `vehicle_current_locations` — Stores latest coordinate fix per vehicle with Realtime replication enabled.
2. `vehicle_location_history` — Stores chronological breadcrumb trail for route replay and audit inspection.
3. `purge_old_vehicle_location_history()` — Periodic cleanup function for historical GPS retention.
