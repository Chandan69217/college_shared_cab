"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportRepository = void 0;
const supabaseClient_1 = require("../database/supabaseClient");
class ReportRepository {
    static getClient() {
        const client = (0, supabaseClient_1.getSupabaseClient)();
        if (!client)
            throw new Error('Database client not initialized. Please verify SUPABASE_URL and credentials.');
        return client;
    }
    static async getDashboardStats() {
        const supabase = this.getClient();
        // 1. Students Breakdown
        const { data: students, error: sErr } = await supabase
            .from('student_profiles')
            .select('id, verification_status, user:users(status)');
        let totalStudents = 0;
        let activeStudents = 0;
        let pendingVerifications = 0;
        let verifiedStudents = 0;
        if (!sErr && students) {
            totalStudents = students.length;
            pendingVerifications = students.filter((s) => s.verification_status === 'PENDING').length;
            verifiedStudents = students.filter((s) => s.verification_status === 'VERIFIED').length;
            activeStudents = students.filter((s) => s.user?.status === 'ACTIVE' || s.verification_status === 'VERIFIED').length;
        }
        // 2. Active Subscriptions
        const { count: activeSubsCount, error: subErr } = await supabase
            .from('subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'ACTIVE');
        const activeSubscriptions = (!subErr && activeSubsCount !== null) ? activeSubsCount : 0;
        // 3. Today's Trips & Occupancy
        const today = new Date().toISOString().split('T')[0];
        const { data: todayTrips, error: trErr } = await supabase
            .from('trips')
            .select('id, max_capacity, booked_seats, status, trip_date');
        let todaysTrips = 0;
        let activeTrips = 0;
        let totalBookedSeats = 0;
        let totalCapacity = 0;
        if (!trErr && todayTrips) {
            const todayOnly = todayTrips.filter((t) => t.trip_date === today);
            todaysTrips = todayOnly.length;
            activeTrips = todayTrips.filter((t) => t.status === 'IN_PROGRESS' || (t.status === 'SCHEDULED' && t.trip_date === today)).length;
            todayOnly.forEach((t) => {
                totalBookedSeats += (t.booked_seats || 0);
                totalCapacity += (t.max_capacity || 0);
            });
        }
        const averageOccupancy = totalCapacity > 0 ? Math.round((totalBookedSeats / totalCapacity) * 100) : 0;
        // 4. Vehicles Breakdown
        const { data: vehicles, error: vErr } = await supabase
            .from('vehicles')
            .select('id, status');
        let totalVehicles = 0;
        let activeVehicles = 0;
        let maintenanceVehicles = 0;
        if (!vErr && vehicles) {
            totalVehicles = vehicles.length;
            activeVehicles = vehicles.filter((v) => v.status === 'ACTIVE').length;
            maintenanceVehicles = vehicles.filter((v) => v.status === 'MAINTENANCE').length;
        }
        // 5. Drivers Breakdown
        const { data: drivers, error: dErr } = await supabase
            .from('driver_profiles')
            .select('id, status');
        let totalDrivers = 0;
        let activeDrivers = 0;
        let onLeaveDrivers = 0;
        if (!dErr && drivers) {
            totalDrivers = drivers.length;
            activeDrivers = drivers.filter((d) => d.status === 'ACTIVE').length;
            onLeaveDrivers = drivers.filter((d) => d.status === 'ON_LEAVE').length;
        }
        // 6. Routes Breakdown & Resource Allocations
        const { data: routes, error: rErr } = await supabase
            .from('routes')
            .select('id, is_active, default_vehicle_id, default_driver_id');
        let totalRoutes = 0;
        let activeRoutes = 0;
        let assignedVehiclesCount = 0;
        let assignedDriversCount = 0;
        if (!rErr && routes) {
            totalRoutes = routes.length;
            activeRoutes = routes.filter((r) => r.is_active).length;
            assignedVehiclesCount = routes.filter((r) => !!r.default_vehicle_id).length;
            assignedDriversCount = routes.filter((r) => !!r.default_driver_id).length;
        }
        // 7. Revenue from Payments
        const { data: payments, error: pErr } = await supabase
            .from('payments')
            .select('amount, created_at, status')
            .eq('status', 'SUCCESS');
        let totalRevenue = 0;
        let todayRevenue = 0;
        if (!pErr && payments) {
            payments.forEach((p) => {
                totalRevenue += (p.amount || 0);
                if (p.created_at && p.created_at.startsWith(today)) {
                    todayRevenue += (p.amount || 0);
                }
            });
        }
        // 8. Plan Distribution (Real from active subscriptions joined with plans)
        const { data: subsWithPlans, error: spErr } = await supabase
            .from('subscriptions')
            .select('id, status, plan:subscription_plans(name, plan_tier)')
            .eq('status', 'ACTIVE');
        const planCounts = {};
        if (!spErr && subsWithPlans) {
            subsWithPlans.forEach((s) => {
                const name = s.plan?.name || 'Standard Pass';
                planCounts[name] = (planCounts[name] || 0) + 1;
            });
        }
        const planDistribution = Object.entries(planCounts).map(([name, value], idx) => {
            const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899'];
            return {
                name,
                value,
                color: colors[idx % colors.length],
            };
        });
        // 9. Weekly Commute Volume (Past 7 days from trips)
        const weeklyData = [];
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayName = days[d.getDay()];
            const dayTrips = (todayTrips || []).filter((t) => t.trip_date === dateStr);
            let dayRides = 0;
            let dayCapacity = 0;
            let dayBooked = 0;
            dayTrips.forEach((t) => {
                dayRides++;
                dayCapacity += (t.max_capacity || 0);
                dayBooked += (t.booked_seats || 0);
            });
            const occupancy = dayCapacity > 0 ? Math.round((dayBooked / dayCapacity) * 100) : 0;
            weeklyData.push({
                day: dayName,
                date: dateStr,
                rides: dayRides,
                occupancy,
            });
        }
        return {
            totalStudents,
            activeStudents,
            verifiedStudents,
            pendingVerifications,
            activeSubscriptions,
            todaysTrips,
            activeTrips,
            totalVehicles,
            activeVehicles,
            maintenanceVehicles,
            totalDrivers,
            activeDrivers,
            onLeaveDrivers,
            totalRoutes,
            activeRoutes,
            assignedVehiclesCount,
            assignedDriversCount,
            todayRevenue,
            totalRevenue,
            averageOccupancy,
            planDistribution,
            weeklyData,
        };
    }
    static async getReportsData() {
        const supabase = this.getClient();
        // 1. Revenue Report by Plan
        const { data: subs, error: sErr } = await supabase
            .from('subscriptions')
            .select('*, plan:subscription_plans(*)');
        const revenueByPlan = {};
        if (!sErr && subs) {
            subs.forEach((s) => {
                const planName = s.plan?.name || 'Standard Pass';
                const price = s.plan?.price || 0;
                if (!revenueByPlan[planName]) {
                    revenueByPlan[planName] = { count: 0, total: 0 };
                }
                revenueByPlan[planName].count += 1;
                revenueByPlan[planName].total += price;
            });
        }
        // 2. Driver Performance Breakdown
        const { data: drivers, error: dErr } = await supabase
            .from('driver_profiles')
            .select('*, user:users(*)');
        const driverPerformance = [];
        if (!dErr && drivers) {
            drivers.forEach((d) => {
                driverPerformance.push({
                    driverId: d.id,
                    name: d.user?.full_name || 'Driver',
                    phone: d.user?.phone || '',
                    license: d.license_number,
                    rating: d.rating_avg || 5.0,
                    tripsCompleted: d.total_trips || 0,
                    status: d.status,
                });
            });
        }
        // 3. Vehicle Fleet Utilization
        const { data: vehicles, error: vErr } = await supabase
            .from('vehicles')
            .select('*');
        const vehicleUtilization = [];
        if (!vErr && vehicles) {
            vehicles.forEach((v) => {
                vehicleUtilization.push({
                    vehicleId: v.id,
                    vehicleNumber: v.vehicle_number,
                    model: v.model,
                    capacity: v.seating_capacity,
                    status: v.status,
                    fitnessExpiry: v.fitness_validity,
                });
            });
        }
        return {
            revenueByPlan,
            driverPerformance,
            vehicleUtilization,
        };
    }
}
exports.ReportRepository = ReportRepository;
//# sourceMappingURL=reportRepository.js.map