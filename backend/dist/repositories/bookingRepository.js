"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingRepository = void 0;
const supabaseClient_1 = require("../database/supabaseClient");
class BookingRepository {
    static getClient() {
        const client = (0, supabaseClient_1.getSupabaseClient)();
        if (!client)
            throw new Error('Database client not initialized. Please verify SUPABASE_URL and credentials.');
        return client;
    }
    static async findAll(date) {
        let query = this.getClient()
            .from('bookings')
            .select('*, trip:trips(*, route:routes(*, college:colleges(*)), vehicle:vehicles(*), driver:users!trips_driver_id_fkey(*)), route:routes(*, college:colleges(*)), pickup_point:pickup_points!bookings_pickup_point_id_fkey(*), drop_point:pickup_points!bookings_drop_point_id_fkey(*), student:users!bookings_student_id_fkey(*)')
            .order('created_at', { ascending: false });
        if (date) {
            query = query.eq('booking_date', date);
        }
        const { data, error } = await query;
        if (error)
            throw new Error(`Fetch bookings error: ${error.message}`);
        // Fetch student profiles for student IDs
        const studentIds = Array.from(new Set((data || []).map((b) => b.student_id).filter(Boolean)));
        let profileMap = {};
        if (studentIds.length > 0) {
            const { data: profiles } = await this.getClient()
                .from('student_profiles')
                .select('*, college:colleges(*)')
                .in('id', studentIds);
            if (profiles) {
                profiles.forEach((p) => {
                    profileMap[p.id] = p;
                });
            }
        }
        return (data || []).map((b) => {
            const studentUser = b.student;
            const studentProfile = profileMap[b.student_id];
            return {
                ...b,
                student_name: studentUser?.full_name || 'N/A',
                student_email: studentUser?.email || 'N/A',
                student_phone: studentUser?.phone || 'N/A',
                student_id_number: studentProfile?.student_id_number || 'N/A',
                student_course: studentProfile?.course || 'N/A',
                college_name: studentProfile?.college?.name || b.route?.college?.name || 'N/A',
                route_name: b.route?.name || 'N/A',
                pickup_name: b.pickup_point?.name || 'N/A',
                drop_name: b.drop_point?.name || b.route?.college?.name || 'College Campus',
            };
        });
    }
    static async findByStudentId(studentId) {
        const { data, error } = await this.getClient()
            .from('bookings')
            .select('*, trip:trips(*, route:routes(*, college:colleges(*)), vehicle:vehicles(*), driver:users!trips_driver_id_fkey(*)), route:routes(*, college:colleges(*)), pickup_point:pickup_points!bookings_pickup_point_id_fkey(*), drop_point:pickup_points!bookings_drop_point_id_fkey(*)')
            .eq('student_id', studentId)
            .order('booking_date', { ascending: false });
        if (error)
            throw new Error(`Fetch student bookings error: ${error.message}`);
        return (data || []);
    }
    static async findTodayBooking(studentId, todayDate) {
        const { data, error } = await this.getClient()
            .from('bookings')
            .select('*, trip:trips(*, route:routes(*, college:colleges(*)), vehicle:vehicles(*), driver:users!trips_driver_id_fkey(*)), route:routes(*, college:colleges(*)), pickup_point:pickup_points!bookings_pickup_point_id_fkey(*), drop_point:pickup_points!bookings_drop_point_id_fkey(*)')
            .eq('student_id', studentId)
            .eq('booking_date', todayDate)
            .eq('status', 'CONFIRMED')
            .order('created_at', { ascending: false })
            .limit(1);
        if (error)
            throw new Error(`Fetch today booking error: ${error.message}`);
        return (data && data.length > 0) ? data[0] : null;
    }
    static async findDailyPass(bookingId) {
        const { data, error } = await this.getClient()
            .from('daily_travel_passes')
            .select('*, trip:trips(*, route:routes(*, college:colleges(*)), vehicle:vehicles(*), driver:users!trips_driver_id_fkey(*)), pickup_point:pickup_points!daily_travel_passes_pickup_point_id_fkey(*), drop_point:pickup_points!daily_travel_passes_drop_point_id_fkey(*)')
            .eq('booking_id', bookingId)
            .order('created_at', { ascending: false })
            .limit(1);
        if (error)
            throw new Error(`Fetch daily pass error: ${error.message}`);
        return (data && data.length > 0) ? data[0] : null;
    }
    static async findActivePassByStudent(studentId) {
        const { data, error } = await this.getClient()
            .from('daily_travel_passes')
            .select('*, trip:trips(*, route:routes(*, college:colleges(*)), vehicle:vehicles(*), driver:users!trips_driver_id_fkey(*)), pickup_point:pickup_points!daily_travel_passes_pickup_point_id_fkey(*), drop_point:pickup_points!daily_travel_passes_drop_point_id_fkey(*)')
            .eq('student_id', studentId)
            .in('status', ['ACTIVE', 'USED'])
            .order('created_at', { ascending: false })
            .limit(1);
        if (error)
            throw new Error(`Fetch active pass error: ${error.message}`);
        return (data && data.length > 0) ? data[0] : null;
    }
    static async findPassByTokenHash(tokenHash) {
        const { data, error } = await this.getClient()
            .from('daily_travel_passes')
            .select('*, trip:trips(*, route:routes(*, college:colleges(*)), vehicle:vehicles(*), driver:users!trips_driver_id_fkey(*)), pickup_point:pickup_points!daily_travel_passes_pickup_point_id_fkey(*), drop_point:pickup_points!daily_travel_passes_drop_point_id_fkey(*), student:users!daily_travel_passes_student_id_fkey(*)')
            .eq('auth_token_hash', tokenHash)
            .maybeSingle();
        if (error)
            throw new Error(`Pass token lookup error: ${error.message}`);
        return data;
    }
    static async updatePass(id, updates) {
        const { data, error } = await this.getClient()
            .from('daily_travel_passes')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select('*')
            .single();
        if (error)
            throw new Error(`Update pass error: ${error.message}`);
        return data;
    }
    static async bookTripAtomic(studentId, subscriptionId, tripId, pickupPointId, tokenHash, validUntil, dropPointId) {
        // Call Supabase RPC fn_book_trip_atomic
        const { data, error } = await this.getClient().rpc('fn_book_trip_atomic', {
            p_student_id: studentId,
            p_subscription_id: subscriptionId,
            p_trip_id: tripId,
            p_pickup_point_id: pickupPointId,
            p_auth_token_hash: tokenHash,
            p_pass_valid_until: validUntil.toISOString(),
            p_drop_point_id: dropPointId || null,
        });
        if (error) {
            throw new Error(error.message);
        }
        return data;
    }
    static async cancelBooking(bookingId, studentId) {
        const { error } = await this.getClient()
            .from('bookings')
            .update({ status: 'CANCELLED', updated_at: new Date().toISOString() })
            .eq('id', bookingId)
            .eq('student_id', studentId);
        if (error)
            throw new Error(`Cancel booking error: ${error.message}`);
    }
}
exports.BookingRepository = BookingRepository;
//# sourceMappingURL=bookingRepository.js.map