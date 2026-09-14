# College Shared Cab & Shuttle Platform — Setup & Deployment Guide

This guide walks you through setting up, configuring, and running the entire platform locally or in production across all 4 environments:
1. **Supabase / PostgreSQL Database**
2. **Node.js + TypeScript Backend Server**
3. **React.js Admin Web Dashboard**
4. **Flutter Mobile Applications (Student & Driver)**

---

## 1. Prerequisites

Ensure you have the following installed on your development machine:
- **Node.js**: v20.x or higher (`node -v`)
- **npm**: v10.x or higher (`npm -v`)
- **Flutter SDK**: v3.24+ (`flutter doctor`)
- **Git**: v2.40+ (`git --version`)
- *(Optional for Cloud Deployments)*: Supabase CLI / Docker

---

## 2. Database Setup (Supabase / PostgreSQL)

### Option A: Cloud Supabase Project (Recommended)
1. Create a project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** in your Supabase Dashboard.
3. Execute the SQL migrations in order:
   - `supabase/migrations/20260914000000_initial_schema.sql` (Tables & Indexes)
   - `supabase/migrations/20260914000001_functions_and_triggers.sql` (Stored Procedures & Triggers)
   - `supabase/migrations/20260914000002_rls_policies.sql` (Row Level Security)
   - `supabase/seed/seed.sql` (Colleges, Routes, Pickups, Verified Users, Trips)
4. Copy your **Supabase URL**, **Anon Key**, and **Service Role Key** from *Project Settings > API*.

---

## 3. Backend Setup (`backend/`)

1. Open your terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure your environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your preferred settings:
   ```env
   NODE_ENV=development
   PORT=5000
   JWT_SECRET=super_secret_jwt_key_campusride_2026_dev
   JWT_EXPIRES_IN=7d
   QR_HMAC_SECRET=super_secret_hmac_sha256_qr_key_2026
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   RAZORPAY_KEY_ID=rzp_test_campusride_demo
   RAZORPAY_KEY_SECRET=rzp_secret_demo
   MAX_PICKUP_RADIUS_KM=10.0
   CORS_ORIGIN=*
   ```

4. Build and run the server:
   - **Development (with hot reload)**:
     ```bash
     npm run dev
     ```
   - **Production build**:
     ```bash
     npm run build
     npm start
     ```

5. Verify API Server:
   - API Root: `http://localhost:5000/api/v1/health`
   - Swagger Documentation: `http://localhost:5000/api/docs`

---

## 4. Admin Web Dashboard Setup (`admin-web/`)

1. Open a new terminal and navigate to `admin-web`:
   ```bash
   cd admin-web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables if pointing to a remote backend:
   ```bash
   # .env
   VITE_API_URL=http://localhost:5000/api/v1
   ```

4. Launch the development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

5. **Demo Admin Credentials**:
   - **Email**: `admin@apex.edu`
   - **Password**: `AdminPassword123!`
   - Or click the **"Quick Demo Login: Admin"** button on the login screen.

---

## 5. Flutter Mobile Applications Setup

The single Flutter codebase serves both the **Student** and **Driver** experiences with instant role-based views.

1. Navigate to the project root:
   ```bash
   cd college_shared_cab
   ```

2. Install Flutter packages:
   ```bash
   flutter pub get
   ```

3. Launch on your preferred platform:
   - **Chrome / Web**:
     ```bash
     flutter run -d chrome
     ```
   - **Android Emulator / Device**:
     ```bash
     flutter run -d android
     ```
   - **iOS Simulator** *(macOS only)*:
     ```bash
     flutter run -d ios
     ```

4. **Pre-configured Demo Accounts**:
   - **Student Login**:
     - Email: `aarav.sharma@apex.edu`
     - Password: `Password123!`
     - Or tap **"Demo Student: Aarav Sharma"**
   - **Driver Login**:
     - Email: `rajesh.kumar@apex.edu`
     - Password: `Password123!`
     - Or tap **"Demo Driver: Rajesh Kumar"**

---

## 6. Verification Checklist

| Step | Action | Expected Outcome |
| :--- | :--- | :--- |
| 1 | Run `npm run build` in `backend/` | Compiles TypeScript to `dist/` with 0 errors |
| 2 | Run `npm run build` in `admin-web/` | Builds production bundle in `admin-web/dist/` with 0 errors |
| 3 | Run `flutter test` in root | Passes all widget smoke tests and state initializations |
| 4 | Open `http://localhost:5000/api/docs` | Interactive Swagger API documentation loads |
| 5 | Login to React Admin Dashboard | Displays live 8-card KPI counters and student KYC approval queue |
