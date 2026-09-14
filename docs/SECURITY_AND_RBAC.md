# College Shared Cab & Shuttle Platform — Security, Concurrency & RBAC Architecture

This document provides a comprehensive analysis of the security principles, cryptographic mechanisms, concurrency safeguards, and authorization policies governing the **College Shared Cab & Shuttle Platform**.

---

## 1. Threat Model & Mitigations

| Threat Vector | Potential Impact | Implemented Mitigation |
| :--- | :--- | :--- |
| **Race Condition / Overbooking Surge** | Simultaneous booking requests exceed vehicle capacity (e.g., 8 students booking 6 seats at 07:00:01 AM). | PostgreSQL **Pessimistic Row Locking** (`SELECT FOR UPDATE`) within atomic stored procedure `fn_book_trip_atomic`. |
| **Pass Screenshot Sharing / Replay Attacks** | A student screenshots their QR pass and sends it to un-subscribed classmates for free rides. | **HMAC-SHA256 Dynamic Tokens** with 10-minute rotating sliding windows + backend database status transition (`BOOKED -> BOARDED`) preventing second scan. |
| **Geofence Bypass** | Student registers a remote pickup point beyond campus operational limits (e.g. 25km away). | **Haversine Distance Formula** calculated on server-side with strict 10.0 km ceiling rejection. |
| **Driver Account Impersonation** | Unauthorized individual attempts to validate passes or start shuttle trips. | Role-Based Access Control (`role: 'DRIVER'`) verified via signed JWT + vehicle-driver binding validation. |
| **API Denial of Service (DoS)** | Automated bots spamming booking or tracking endpoints. | Tiered Express **Rate Limiting** (100 req/15 min for general endpoints; 10 req/min for booking & payment creation). |

---

## 2. Dynamic HMAC-SHA256 QR Travel Pass Architecture

### 2.1 Cryptographic Token Construction
The dynamic pass does **not** encode static data. Instead, it generates a cryptographically signed signature combining the travel context and timestamp:

```typescript
// backend/src/utils/crypto.ts
export function generateDynamicQrToken(passId: string, studentId: string, tripId: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const payload = `${passId}:${studentId}:${tripId}:${timestamp}`;
  const signature = crypto
    .createHmac('sha256', process.env.QR_HMAC_SECRET!)
    .update(payload)
    .digest('hex')
    .substring(0, 32);
    
  return `CAMPUS:PASS:${payload}:${signature}`;
}
```

### 2.2 Verification & Anti-Replay Rules
When the driver scans the QR code:
1. **Signature Integrity**: The backend recalculates HMAC with the server secret. If modified, immediate `401 INVALID_SIGNATURE`.
2. **Time Drift**: If `(CurrentTime - Timestamp) > 600 seconds` (10 minutes), rejected with `401 TOKEN_EXPIRED`.
3. **Replay Check**: Queries `qr_passes` where `id = passId`.
   - If `status == 'BOARDED'`, returns `400 ALREADY_USED` and logs security warning.
   - If `status == 'ACTIVE'`, executes atomic update to `'BOARDED'`, sets `boarded_at = NOW()`, records driver GPS coordinates in `qr_scan_logs`, and returns `200 AUTHORIZED`.

---

## 3. High-Concurrency Pessimistic Locking

To guarantee that vehicle capacity ($N$) is never breached during intense peak-hour booking concurrency:

```sql
-- Executed within an ACID transactional boundary
BEGIN;

-- 1. Lock specific trip row exclusively
SELECT available_seats, total_capacity, status
FROM trips
WHERE id = p_trip_id
FOR UPDATE;

-- 2. Verify availability
IF available_seats <= 0 THEN
    ROLLBACK;
    RAISE EXCEPTION 'Trip is fully booked';
END IF;

-- 3. Reserve seat and decrement
INSERT INTO bookings (id, student_id, trip_id, seat_number, status)
VALUES (gen_random_uuid(), p_student_id, p_trip_id, total_capacity - available_seats + 1, 'BOOKED');

UPDATE trips
SET available_seats = available_seats - 1
WHERE id = p_trip_id;

COMMIT;
```

---

## 4. Role-Based Access Control (RBAC) Matrix

| Resource / Endpoint | Student | Driver | College Admin | Super Admin |
| :--- | :---: | :---: | :---: | :---: |
| **Register & Submit KYC** | `CREATE` | `—` | `—` | `—` |
| **Verify / Approve KYC** | `—` | `—` | `UPDATE` | `UPDATE` |
| **View Active Dynamic Pass** | `READ (Self)` | `—` | `READ` | `READ` |
| **Scan & Validate QR Code** | `—` | `EXECUTE` | `EXECUTE` | `EXECUTE` |
| **Book Shuttle Trip** | `CREATE` | `—` | `CREATE` | `CREATE` |
| **Start / Progress Trip** | `—` | `UPDATE (Assigned)` | `UPDATE` | `UPDATE` |
| **View Fleet Telemetry Radar** | `READ (Active)` | `READ (Assigned)`| `READ (All)` | `READ (All)` |
| **Manage Routes & Geofences** | `READ` | `READ` | `CRUD` | `CRUD` |
| **Manage Subscription Plans** | `READ` | `READ` | `CRUD` | `CRUD` |
| **System Audit Logs & Financials**| `—` | `—` | `READ` | `CRUD` |

---

## 5. PostgreSQL Row-Level Security (RLS) Policies

All 28+ tables enforce PostgreSQL RLS policies in `supabase/migrations/20260914000002_rls_policies.sql`.

Example RLS isolation for student bookings:
```sql
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Students can only inspect their own personal bookings
CREATE POLICY "Students can view own bookings"
ON bookings FOR SELECT
TO authenticated
USING (
    student_id IN (
        SELECT id FROM students WHERE user_id = auth.uid()
    )
);

-- Assigned Drivers can view the passenger manifest for their scheduled trip
CREATE POLICY "Drivers can view trip manifest"
ON bookings FOR SELECT
TO authenticated
USING (
    trip_id IN (
        SELECT id FROM trips WHERE driver_id IN (
            SELECT id FROM drivers WHERE user_id = auth.uid()
        )
    )
);

-- Campus Admins have full access to their institution's bookings
CREATE POLICY "Admins full access to college bookings"
ON bookings FOR ALL
TO authenticated
USING (
    trip_id IN (
        SELECT t.id FROM trips t
        JOIN routes r ON t.route_id = r.id
        WHERE r.college_id IN (
            SELECT college_id FROM admins WHERE user_id = auth.uid()
        )
    )
);
```
