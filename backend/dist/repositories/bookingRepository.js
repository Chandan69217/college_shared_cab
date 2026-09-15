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
            .select('*, trip:trips(*), route:routes(*), pickup_point:pickup_points(*), student:users(*)')
            .order('created_at', { ascending: false });
        if (date) {
            query = query.eq('booking_date', date);
        }
        const { data, error } = await query;
        if (error)
            throw new Error(`Fetch bookings error: ${error.message}`);
        return (data || []);
    }
    static async findByStudentId(studentId) {
        const { data, error } = await this.getClient()
            .from('bookings')
            .select('*, trip:trips(*), route:routes(*), pickup_point:pickup_points(*)')
            .eq('student_id', studentId)
            .order('booking_date', { ascending: false });
        if (error)
            throw new Error(`Fetch student bookings error: ${error.message}`);
        return (data || []);
    }
    static async findTodayBooking(studentId, todayDate) {
        const { data, error } = await this.getClient()
            .from('bookings')
            .select('*, trip:trips(*, vehicle:vehicles(*), driver:users(*)), route:routes(*), pickup_point:pickup_points(*)')
            .eq('student_id', studentId)
            .eq('booking_date', todayDate)
            .eq('status', 'CONFIRMED')
            .maybeSingle();
        if (error)
            throw new Error(`Fetch today booking error: ${error.message}`);
        return data;
    }
    static async findDailyPass(bookingId) {
        const { data, error } = await this.getClient()
            .from('daily_travel_passes')
            .select('*, trip:trips(*), pickup_point:pickup_points(*)')
            .eq('booking_id', bookingId)
            .maybeSingle();
        if (error)
            throw new Error(`Fetch daily pass error: ${error.message}`);
        return data;
    }
    static async findActivePassByStudent(studentId) {
        const { data, error } = await this.getClient()
            .from('daily_travel_passes')
            .select('*, trip:trips(*, route:routes(*), vehicle:vehicles(*), driver:users(*)), pickup_point:pickup_points(*)')
            .eq('student_id', studentId)
            .in('status', ['ACTIVE', 'USED'])
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        if (error)
            throw new Error(`Fetch active pass error: ${error.message}`);
        return data;
    }
    static async findPassByTokenHash(tokenHash) {
        const { data, error } = await this.getClient()
            .from('daily_travel_passes')
            .select('*, trip:trips(*), pickup_point:pickup_points(*), student:users(*)')
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
    static async bookTripAtomic(studentId, tripId, pickupPointId, tokenHash, validUntil) {
        // Call Supabase RPC fn_book_trip_atomic
        const { data, error } = await this.getClient().rpc('fn_book_trip_atomic', {
            p_student_id: studentId,
            p_trip_id: tripId,
            p_pickup_point_id: pickupPointId,
            p_auth_token_hash: tokenHash,
            p_pass_valid_until: validUntil.toISOString(),
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