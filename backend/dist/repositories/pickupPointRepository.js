"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PickupPointRepository = void 0;
const supabaseClient_1 = require("../database/supabaseClient");
class PickupPointRepository {
    static getClient() {
        const client = (0, supabaseClient_1.getSupabaseClient)();
        if (!client)
            throw new Error('Database client not initialized. Please verify SUPABASE_URL and credentials.');
        return client;
    }
    static async findAll(collegeId) {
        let query = this.getClient()
            .from('pickup_points')
            .select('*, college:colleges(*)')
            .order('name');
        if (collegeId) {
            query = query.eq('college_id', collegeId);
        }
        const { data, error } = await query;
        if (error)
            throw new Error(`Fetch pickup points error: ${error.message}`);
        return (data || []);
    }
    static async findById(id) {
        const { data, error } = await this.getClient()
            .from('pickup_points')
            .select('*, college:colleges(*)')
            .eq('id', id)
            .maybeSingle();
        if (error)
            throw new Error(`Fetch pickup point error: ${error.message}`);
        return data;
    }
    static async create(point) {
        const { data, error } = await this.getClient()
            .from('pickup_points')
            .insert([point])
            .select('*')
            .single();
        if (error)
            throw new Error(`Create pickup point error: ${error.message}`);
        return data;
    }
    static async update(id, updates) {
        const { data, error } = await this.getClient()
            .from('pickup_points')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select('*')
            .single();
        if (error)
            throw new Error(`Update pickup point error: ${error.message}`);
        return data;
    }
    static async delete(id) {
        const client = this.getClient();
        const point = await this.findById(id);
        if (!point) {
            const err = new Error('Pickup point not found.');
            err.statusCode = 404;
            err.code = 'NOT_FOUND';
            throw err;
        }
        // 1. Automatically remove pickup point from all route stop schedules
        await client
            .from('route_pickup_points')
            .delete()
            .eq('pickup_point_id', id);
        // 2. Unassign from delay reports
        await client
            .from('delay_reports')
            .update({ current_stop_id: null })
            .eq('current_stop_id', id);
        // 3. Unassign from historical manifests, passes, and bookings
        await client
            .from('trip_passengers')
            .update({ pickup_point_id: null })
            .eq('pickup_point_id', id);
        await client
            .from('daily_travel_passes')
            .update({ pickup_point_id: null })
            .eq('pickup_point_id', id);
        await client
            .from('bookings')
            .update({ pickup_point_id: null })
            .eq('pickup_point_id', id);
        // 4. Delete the pickup point
        const { error } = await client
            .from('pickup_points')
            .delete()
            .eq('id', id);
        if (error)
            throw new Error(`Delete pickup point error: ${error.message}`);
    }
}
exports.PickupPointRepository = PickupPointRepository;
//# sourceMappingURL=pickupPointRepository.js.map