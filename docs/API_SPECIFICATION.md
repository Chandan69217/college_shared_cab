# College Shared Cab & Shuttle Platform — REST API Specification

**Base URL**: `http://localhost:5000/api/v1`  
**Interactive Swagger UI**: `http://localhost:5000/api/docs`  
**Authentication Scheme**: Bearer JWT (`Authorization: Bearer <token>`)

---

## 1. Authentication & Onboarding Endpoints

### 1.1 `POST /auth/login`
Authenticates a student, driver, or admin.

- **Request Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "email": "aarav.sharma@apex.edu",
    "password": "Password123!",
    "role": "STUDENT"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Authentication successful",
    "data": {
      "user": {
        "id": "11111111-1111-1111-1111-111111111111",
        "email": "aarav.sharma@apex.edu",
        "full_name": "Aarav Sharma",
        "phone": "+91 98765 43210",
        "role": "STUDENT",
        "college_id": "00000000-0000-0000-0000-000000000001",
        "kyc_status": "APPROVED",
        "is_active": true
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```
- **Error Codes**: `400 BAD_REQUEST`, `401 INVALID_CREDENTIALS`, `403 ACCOUNT_SUSPENDED`.

---

### 1.2 `POST /auth/register`
Registers a new college student with student ID document metadata.

- **Request Body**:
  ```json
  {
    "full_name": "Rohan Gupta",
    "email": "rohan.gupta@apex.edu",
    "phone": "+91 98111 22233",
    "password": "SecurePassword123!",
    "college_id": "00000000-0000-0000-0000-000000000001",
    "roll_number": "APEX-2026-CS-042",
    "department": "Computer Science & Engineering",
    "semester": 6,
    "kyc_document_url": "https://storage.campusride.edu/kyc/apex-cs-042.jpg"
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Registration successful. KYC verification is pending admin review.",
    "data": {
      "user_id": "b784a92c-1234-4b56-7890-abcdef123456",
      "kyc_status": "PENDING"
    }
  }
  ```

---

## 2. Catalog & Discovery Endpoints

### 2.1 `GET /catalog/routes`
Fetches all operational shuttle routes, ordered stops, and schedule timings.

- **Query Parameters**: `college_id` (optional, filters by institution).
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "10000000-0000-0000-0000-000000000001",
        "name": "Route 1: City Center Express",
        "code": "R-101",
        "morning_departure_time": "07:30 AM",
        "evening_departure_time": "05:15 PM",
        "estimated_duration_mins": 45,
        "max_capacity": 6,
        "stops": [
          { "stop_order": 1, "name": "Sector 18 Metro Hub", "arrival_offset_mins": 0 },
          { "stop_order": 2, "name": "Golf Course Circle", "arrival_offset_mins": 12 },
          { "stop_order": 3, "name": "Apex University Gate 1", "arrival_offset_mins": 45 }
        ]
      }
    ]
  }
  ```

---

### 2.2 `GET /catalog/pickup-points`
Retrieves all recognized pickup points with Haversine distance relative to the college.

- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "20000000-0000-0000-0000-000000000001",
        "name": "Sector 18 Metro Hub",
        "landmark": "Near Exit Gate 2",
        "address": "Atta Market, Sector 18, Noida",
        "latitude": 28.5708,
        "longitude": 77.3260,
        "distance_to_college_km": 4.2,
        "is_approved": true
      },
      {
        "id": "20000000-0000-0000-0000-000000000008",
        "name": "Pari Chowk Central Hub",
        "landmark": "Clock Tower Roundabout",
        "address": "Greater Noida Main Road",
        "latitude": 28.4682,
        "longitude": 77.5098,
        "distance_to_college_km": 12.8,
        "is_approved": false
      }
    ]
  }
  ```

---

## 3. Subscriptions & Payments

### 3.1 `GET /subscriptions/plans`
Lists available student transport subscription plans.

- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "30000000-0000-0000-0000-000000000001",
        "name": "Monthly Commuter",
        "plan_type": "MONTHLY",
        "price": 2499,
        "validity_days": 30,
        "max_trips": 44,
        "features": ["Morning & Evening slot", "Live GPS tracking", "SOS safety alert", "Instant dynamic QR"]
      }
    ]
  }
  ```

---

### 3.2 `POST /payments/create-order`
Initializes a payment intent / gateway order for purchasing a subscription.

- **Headers**: `Authorization: Bearer <student_jwt>`
- **Request Body**:
  ```json
  {
    "plan_id": "30000000-0000-0000-0000-000000000001",
    "gateway": "RAZORPAY"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "order_id": "order_Kz8271nQ892",
      "amount": 249900,
      "currency": "INR",
      "gateway": "RAZORPAY",
      "key_id": "rzp_test_campusride_demo"
    }
  }
  ```

---

## 4. Bookings & Dynamic HMAC QR Travel Passes

### 4.1 `POST /bookings` (Concurrency-Safe)
Reserves a seat on a scheduled shuttle trip with atomic row locking.

- **Headers**: `Authorization: Bearer <student_jwt>`
- **Request Body**:
  ```json
  {
    "trip_id": "77777777-7777-7777-7777-777777777771",
    "pickup_point_id": "20000000-0000-0000-0000-000000000001"
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Seat reserved successfully",
    "data": {
      "booking": {
        "id": "55555555-5555-5555-5555-555555555551",
        "trip_id": "77777777-7777-7777-7777-777777777771",
        "seat_number": 3,
        "status": "CONFIRMED",
        "booking_date": "2026-09-14"
      }
    }
  }
  ```
- **Error Responses**:
  - `409 CONFLICT`: `{"success": false, "error": "TRIP_FULLY_BOOKED", "message": "All seats are occupied for this vehicle."}`
  - `400 BAD_REQUEST`: `{"success": false, "error": "GEOFENCE_EXCEEDED", "message": "Pickup point exceeds the 10km campus radius."}`

---

### 4.2 `GET /qr-pass/active`
Generates or refreshes the student's active HMAC-SHA256 dynamic QR travel token.

- **Headers**: `Authorization: Bearer <student_jwt>`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "pass_id": "99999999-9999-9999-9999-999999999991",
      "student_name": "Aarav Sharma",
      "roll_number": "APEX-2024-CS-101",
      "route_name": "Route 1: City Center Express",
      "pickup_point_name": "Sector 18 Metro Hub",
      "vehicle_plate": "UP 16 AB 1234",
      "seat_number": 3,
      "qr_token": "CAMPUS:PASS:9999:SIG:a89f41b2c4e1...",
      "valid_from": "2026-09-14T07:00:00Z",
      "expires_at": "2026-09-14T19:00:00Z",
      "refresh_interval_seconds": 600
    }
  }
  ```

---

### 4.3 `POST /qr-pass/verify` (Driver Validation Engine)
Validates presented student QR code and enforces anti-replay boarding rules.

- **Headers**: `Authorization: Bearer <driver_jwt>`
- **Request Body**:
  ```json
  {
    "trip_id": "77777777-7777-7777-7777-777777777771",
    "token": "CAMPUS:PASS:9999:SIG:a89f41b2c4e1...",
    "client_latitude": 28.5708,
    "client_longitude": 77.3260
  }
  ```
- **Authorized Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "authorized": true,
      "status": "AUTHORIZED",
      "student_name": "Aarav Sharma",
      "roll_number": "APEX-2024-CS-101",
      "seat_number": 3,
      "pickup_point": "Sector 18 Metro Hub",
      "boarded_at": "2026-09-14T07:32:15Z"
    }
  }
  ```
- **Replay / Duplicate Scan Response (400 Bad Request)**:
  ```json
  {
    "success": false,
    "error": "ALREADY_USED",
    "message": "This travel pass was already scanned and boarded at 07:32:15 AM.",
    "data": {
      "authorized": false,
      "status": "NOT_AUTHORIZED",
      "reason": "ALREADY_USED"
    }
  }
  ```

---

## 5. Live GPS Telemetry & Tracking

### 5.1 `GET /tracking/trip/:tripId`
Fetches real-time breadcrumbs, vehicle location, heading, and dynamic ETA to upcoming stops.

- **Headers**: `Authorization: Bearer <student_or_admin_jwt>`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "trip_id": "77777777-7777-7777-7777-777777777771",
      "vehicle_plate": "UP 16 AB 1234",
      "driver_name": "Rajesh Kumar",
      "driver_phone": "+91 98765 11223",
      "current_lat": 28.5742,
      "current_lng": 77.3315,
      "speed_kmh": 38.5,
      "heading_deg": 142,
      "eta_minutes": 8,
      "next_stop": "Golf Course Circle"
    }
  }
  ```

---

## 6. Admin Management & Analytics

### 6.1 `GET /admin/dashboard/stats`
Aggregates campus-wide operational metrics for the React web console.

- **Headers**: `Authorization: Bearer <admin_jwt>`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "total_students": 1250,
      "active_subscriptions": 980,
      "trips_today": 85,
      "total_vehicles": 30,
      "active_drivers": 32,
      "revenue_this_month": 84500,
      "fleet_occupancy_rate": "82%",
      "pending_kyc_count": 14,
      "open_complaints_count": 3
    }
  }
  ```
