"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TripRepository = void 0;
const supabaseClient_1 = require("../database/supabaseClient");
class TripRepository {
    static getClient() {
        const client = (0, supabaseClient_1.getSupabaseClient)();
        if (!client)
            throw new Error('Database client not initialized. Please verify SUPABASE_URL and credentials.');
        return client;
    }
    static async findAll(collegeId, date) {
        let query = this.getClient()
            .from('trips')
            .select('*, route:routes(*), vehicle:vehicles(*), driver:users(*)')
            .order('scheduled_departure_time');
        if (date) {
            query = query.eq('trip_date', date);
        }
        const { data, error } = await query;
        if (error)
            throw new Error(`Fetch trips error: ${error.message}`);
        return (data || []);
    }
    static async findById(id) {
        const { data, error } = await this.getClient()
            .from('trips')
            .select('*, route:routes(*, route_pickup_points(*, pickup_point:pickup_points(*))), vehicle:vehicles(*), driver:users(*)')
            .eq('id', id)
            .maybeSingle();
        if (error)
            throw new Error(`Fetch trip by ID error: ${error.message}`);
        return data;
    }
    static async findByDriverId(driverId, date) {
        const { data, error } = await this.getClient()
            .from('trips')
            .select('*, route:routes(*, route_pickup_points(*, pickup_point:pickup_points(*))), vehicle:vehicles(*)')
            .eq('driver_id', driverId)
            .eq('trip_date', date)
            .order('scheduled_departure_time');
        if (error)
            throw new Error(`Fetch driver trips error: ${error.message}`);
        return (data || []);
    }
    static async getTripPassengers(tripId) {
        const { data, error } = await this.getClient()
            .from('trip_passengers')
            .select('*, student:users(*), pickup_point:pickup_points(*)')
            .eq('trip_id', tripId);
        if (error)
            throw new Error(`Fetch trip passengers error: ${error.message}`);
        return (data || []);
    }
    static async create(trip) {
        const { data, error } = await this.getClient()
            .from('trips')
            .insert([trip])
            .select('*, route:routes(*), vehicle:vehicles(*)')
            .single();
        if (error)
            throw new Error(`Create trip error: ${error.message}`);
        return data;
    }
    static async update(id, updates) {
        const { data, error } = await this.getClient()
            .from('trips')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select('*, route:routes(*), vehicle:vehicles(*)')
            .single();
        if (error)
            throw new Error(`Update trip error: ${error.message}`);
        return data;
    }
}
exports.TripRepository = TripRepository;
//# sourceMappingURL=tripRepository.js.map