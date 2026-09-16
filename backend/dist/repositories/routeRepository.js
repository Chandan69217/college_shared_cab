"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouteRepository = void 0;
const supabaseClient_1 = require("../database/supabaseClient");
class RouteRepository {
    static getClient() {
        const client = (0, supabaseClient_1.getSupabaseClient)();
        if (!client)
            throw new Error('Database client not initialized. Please verify SUPABASE_URL and credentials.');
        return client;
    }
    static async findAll(collegeId) {
        let query = this.getClient()
            .from('routes')
            .select('*, college:colleges(*), default_vehicle:vehicles(*), default_driver:users!routes_default_driver_id_fkey(*), route_pickup_points(*, pickup_point:pickup_points(*))')
            .order('name');
        if (collegeId) {
            query = query.eq('college_id', collegeId);
        }
        const { data, error } = await query;
        if (error)
            throw new Error(`Fetch routes error: ${error.message}`);
        return (data || []).map((r) => ({
            ...r,
            stops: (r.route_pickup_points || []).sort((a, b) => a.sequence_order - b.sequence_order),
        }));
    }
    static async findById(id) {
        const { data, error } = await this.getClient()
            .from('routes')
            .select('*, college:colleges(*), default_vehicle:vehicles(*), default_driver:users!routes_default_driver_id_fkey(*), route_pickup_points(*, pickup_point:pickup_points(*))')
            .eq('id', id)
            .maybeSingle();
        if (error)
            throw new Error(`Fetch route error: ${error.message}`);
        if (!data)
            return null;
        return {
            ...data,
            stops: (data.route_pickup_points || []).sort((a, b) => a.sequence_order - b.sequence_order),
        };
    }
    static async create(route, stops) {
        const { data, error } = await this.getClient()
            .from('routes')
            .insert([{
                college_id: route.college_id,
                name: route.name,
                code: route.code,
                description: route.description,
                morning_departure_time: route.morning_departure_time,
                evening_departure_time: route.evening_departure_time,
                estimated_duration_mins: route.estimated_duration_mins || 45,
                default_vehicle_id: route.default_vehicle_id || null,
                default_driver_id: route.default_driver_id || null,
                max_capacity: route.max_capacity || 6,
                is_active: route.is_active ?? true,
            }])
            .select('*')
            .single();
        if (error)
            throw new Error(`Create route error: ${error.message}`);
        if (stops && stops.length > 0) {
            const formattedStops = stops.map((s, idx) => ({
                route_id: data.id,
                pickup_point_id: s.pickup_point_id,
                sequence_order: s.sequence_order || s.stop_order || idx + 1,
                morning_pickup_time: s.morning_pickup_time || route.morning_departure_time || '07:30:00',
                evening_drop_time: s.evening_drop_time || route.evening_departure_time || '17:00:00',
            }));
            await this.getClient().from('route_pickup_points').insert(formattedStops);
        }
        return this.findById(data.id);
    }
    static async update(id, updates, stops) {
        const { data, error } = await this.getClient()
            .from('routes')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select('*')
            .single();
        if (error)
            throw new Error(`Update route error: ${error.message}`);
        if (stops && Array.isArray(stops)) {
            // Refresh stops
            await this.getClient().from('route_pickup_points').delete().eq('route_id', id);
            if (stops.length > 0) {
                const formattedStops = stops.map((s, idx) => ({
                    route_id: id,
                    pickup_point_id: s.pickup_point_id,
                    sequence_order: s.sequence_order || s.stop_order || idx + 1,
                    morning_pickup_time: s.morning_pickup_time || updates.morning_departure_time || '07:30:00',
                    evening_drop_time: s.evening_drop_time || updates.evening_departure_time || '17:00:00',
                }));
                await this.getClient().from('route_pickup_points').insert(formattedStops);
            }
        }
        return this.findById(id);
    }
    static async delete(id) {
        const client = this.getClient();
        // Check active bookings
        const { data: bookings } = await client
            .from('bookings')
            .select('id')
            .eq('route_id', id)
            .eq('status', 'CONFIRMED');
        if (bookings && bookings.length > 0) {
            const err = new Error(`Cannot delete route: ${bookings.length} active booking(s) exist on this route. Please reassign or cancel bookings, or set route status to inactive.`);
            err.statusCode = 409;
            err.code = 'ACTIVE_RELATIONSHIP_EXISTS';
            throw err;
        }
        // Check active scheduled trips
        const { data: trips } = await client
            .from('trips')
            .select('id, trip_date')
            .eq('route_id', id)
            .in('status', ['SCHEDULED', 'IN_PROGRESS']);
        if (trips && trips.length > 0) {
            const err = new Error(`Cannot delete route: ${trips.length} active or scheduled trip(s) depend on this route. Reassign trips or mark route inactive instead.`);
            err.statusCode = 409;
            err.code = 'ACTIVE_RELATIONSHIP_EXISTS';
            throw err;
        }
        // Delete route stops first, then route
        await client.from('route_pickup_points').delete().eq('route_id', id);
        const { error } = await client.from('routes').delete().eq('id', id);
        if (error)
            throw new Error(`Delete route error: ${error.message}`);
    }
}
exports.RouteRepository = RouteRepository;
//# sourceMappingURL=routeRepository.js.map