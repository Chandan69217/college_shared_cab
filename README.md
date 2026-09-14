# 🎓 CampusRide — College Student Shared Cab & Shuttle Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Flutter](https://img.shields.io/badge/Flutter-02569B?style=for-the-badge&logo=flutter&logoColor=white)](https://flutter.dev/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-181818?style=for-the-badge&logo=supabase&logoColor=3ECF8E)](https://supabase.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

An enterprise-grade, full-stack campus transportation and shared shuttle management platform designed for universities and colleges. Features concurrency-safe booking, dynamic HMAC-SHA256 QR passes with anti-replay security, live GPS fleet telemetry radar, 10km Haversine geofencing, student KYC verification, and full role-based access control.

---

## 🏗️ Architecture & Technology Stack

```
+-----------------------------------------------------------------------------------+
|                                  CampusRide                                       |
|                                                                                   |
|  +--------------------+   +--------------------+   +---------------------------+  |
|  | Flutter Student App|   | Flutter Driver App |   | React.js Admin Dashboard  |  |
|  | (Riverpod, Router, |   | (Scanner, Manifest,|   | (Tailwind, Lucide,        |  |
|  |  Material 3, QR)   |   |  Trip Operations)  |   |  Recharts KPI Analytics)  |  |
|  +---------+----------+   +---------+----------+   +-------------+-------------+  |
|            |                        |                            |                |
|            +------------------------+----------------------------+                |
|                                     | (HTTPS / REST)                              |
|                         +-----------v-----------+                                 |
|                         |  Node.js + TypeScript |                                 |
|                         |    REST API Server    |                                 |
|                         | (Express, Zod, JWT)   |                                 |
|                         +-----------+-----------+                                 |
|                                     | (SQL / TCP)                                 |
|                         +-----------v-----------+                                 |
|                         |  Supabase PostgreSQL  |                                 |
|                         | (28+ Tables, RLS,     |                                 |
|                         |  Atomic Procedures)   |                                 |
|                         +-----------------------+                                 |
+-----------------------------------------------------------------------------------+
```

---

## 🌟 Key Features

### 1. 📱 Flutter Student Mobile App
- **College Onboarding & KYC**: Submit student roll number, department, semester, and college ID card document.
- **Plans & Instant Checkout**: View Monthly, Quarterly, and Semester passes with Razorpay/Stripe checkout.
- **Concurrency-Safe Seat Reservation**: Real-time vehicle seat selection with optimistic/pessimistic locking.
- **Dynamic HMAC-SHA256 QR Pass**: 10-minute rotating cryptographic travel passes with visual countdown ring.
- **Live GPS Tracking**: Real-time bus telemetry, speed, heading, next stops, and dynamic ETA estimation.
- **24/7 Grievance & SOS**: One-tap emergency broadcast to campus safety desk + support ticket filing.

### 2. 🚐 Flutter Driver Mobile App
- **Trip Dashboard**: On-Duty/Off-Duty shift toggle, start trip, stop sequencer, and end trip workflows.
- **Passenger Manifest**: Live passenger roster with seat numbers, pickup stops, and boarding checklists.
- **Dynamic QR Scanner**: High-speed camera scan with instant `AUTHORIZED` or `NOT AUTHORIZED / ALREADY USED` feedback.
- **Route Navigator**: Visual sequence of all pickup points with ETA offsets and passenger counts.

### 3. 🖥️ React.js Admin Web Dashboard
- **Live 8-Card KPI Header**: Real-time metrics (1,250 Students, 980 Subscriptions, 85 Trips, 30 Vehicles, 32 Drivers, ₹84,500 Revenue, 82% Occupancy).
- **Student KYC Approval Modal**: Interactive review modal for approving or rejecting student IDs.
- **Pickup Points with 10km Geofence**: Visual badge flagging stops exceeding the 10km campus radius.
- **Routes & Schedule Builder**: Morning & evening shift scheduler with sequence distance markers.
- **Fleet & Driver Management**: Fitness certificate alerts, vehicle maintenance logs, and rating distributions.
- **Live Fleet Radar**: Real-time GPS map overview of all on-duty shuttles.
- **Dispute Resolution & SOS Logs**: Immediate alert inbox for student emergency triggers.

### 4. ⚡ Node.js + TypeScript Backend Engine
- **Atomic Booking Stored Procedure**: `fn_book_trip_atomic` prevents overbooking during surge booking windows.
- **Dynamic QR Validation**: HMAC-SHA256 tokens with anti-replay checks (`ALREADY_USED`).
- **Haversine Geofencing Engine**: Computes precise spherical distance in KM between pickup coords and college campus.
- **Interactive Swagger API Docs**: Fully documented REST endpoints accessible at `/api/docs`.

---

## 🚀 Quickstart Guide

### 1. Clone & Setup Database
```bash
# Execute SQL migrations in your Supabase SQL editor or local PostgreSQL:
psql -h localhost -U postgres -d campusride -f supabase/migrations/20260914000000_initial_schema.sql
psql -h localhost -U postgres -d campusride -f supabase/migrations/20260914000001_functions_and_triggers.sql
psql -h localhost -U postgres -d campusride -f supabase/migrations/20260914000002_rls_policies.sql
psql -h localhost -U postgres -d campusride -f supabase/seed/seed.sql
```

### 2. Start Backend API Server
```bash
cd backend
npm install
npm run build
npm start
# Server starts on http://localhost:5000
# Swagger API docs available at http://localhost:5000/api/docs
```

### 3. Start React Admin Dashboard
```bash
cd admin-web
npm install
npm run dev
# Dashboard launches on http://localhost:5173
```

### 4. Start Flutter Mobile App
```bash
# In the root directory:
flutter pub get
flutter run -d chrome # or -d android / -d ios
```

---

## 🔑 Demo Login Credentials

| Role | Email | Password | Pre-configured Features |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@apex.edu` | `AdminPassword123!` | Full Web Dashboard, KYC Approval, Geofencing, Reports |
| **Student** | `aarav.sharma@apex.edu` | `Password123!` | Active Monthly Pass, Seat #3 Reserved, Dynamic QR, GPS Radar |
| **Driver** | `rajesh.kumar@apex.edu` | `Password123!` | Vehicle UP-16-AB-1234, Passenger Manifest, QR Camera Scanner |

---

## 📚 Technical Documentation

- [System Architecture & Data Flows](docs/ARCHITECTURE.md)
- [Database Schema & ERD Reference](docs/DATABASE_ERD.md)
- [REST API Endpoint Specification](docs/API_SPECIFICATION.md)
- [Setup & Deployment Guide](docs/SETUP_AND_DEPLOYMENT.md)
- [Security, Concurrency & RBAC Architecture](docs/SECURITY_AND_RBAC.md)

---

## 📄 License
MIT License. Engineered for university campuses worldwide.
