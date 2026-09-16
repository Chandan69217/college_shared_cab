"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehicleRepository = void 0;
const supabaseClient_1 = require("../database/supabaseClient");
class VehicleRepository {
    static getClient() {
        const client = (0, supabaseClient_1.getSupabaseClient)();
        if (!client)
            throw new Error('Database client not initialized. Please verify SUPABASE_URL and credentials.');
        return client;
    }
    static async findAll(collegeId) {
        let query = this.getClient()
            .from('vehicles')
            .select('*, college:colleges(*)')
            .order('vehicle_number');
        if (collegeId) {
            query = query.eq('college_id', collegeId);
        }
        const { data, error } = await query;
        if (error)
            throw new Error(`Fetch vehicles error: ${error.message}`);
        return (data || []);
    }
    static async findById(id) {
        const { data, error } = await this.getClient()
            .from('vehicles')
            .select('*, college:colleges(*)')
            .eq('id', id)
            .maybeSingle();
        if (error)
            throw new Error(`Fetch vehicle error: ${error.message}`);
        return data;
    }
    static async create(vehicle) {
        const { data, error } = await this.getClient()
            .from('vehicles')
            .insert([vehicle])
            .select('*')
            .single();
        if (error)
            throw new Error(`Create vehicle error: ${error.message}`);
        return data;
    }
    static async update(id, updates) {
        const { data, error } = await this.getClient()
            .from('vehicles')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select('*')
            .single();
        if (error)
            throw new Error(`Update vehicle error: ${error.message}`);
        return data;
    }
    static async delete(id) {
        const client = this.getClient();
        // Check if vehicle is assigned to active routes
        const { data: routes } = await client
            .from('routes')
            .select('id, name')
            .eq('default_vehicle_id', id)
            .eq('is_active', true);
        if (routes && routes.length > 0) {
            const err = new Error(`Cannot delete vehicle: Assigned as default vehicle for active route "${routes[0].name}". Reassign the route vehicle or set vehicle status to MAINTENANCE/INACTIVE instead.`);
            err.statusCode = 409;
            err.code = 'ACTIVE_RELATIONSHIP_EXISTS';
            throw err;
        }
        // Check if vehicle has active/scheduled trips
        const { data: trips } = await client
            .from('trips')
            .select('id, trip_date')
            .eq('vehicle_id', id)
            .in('status', ['SCHEDULED', 'IN_PROGRESS']);
        if (trips && trips.length > 0) {
            const err = new Error(`Cannot delete vehicle: Assigned to ${trips.length} active or scheduled trip(s). Reassign trips or update vehicle status to MAINTENANCE instead.`);
            err.statusCode = 409;
            err.code = 'ACTIVE_RELATIONSHIP_EXISTS';
            throw err;
        }
        const { error } = await client
            .from('vehicles')
            .delete()
            .eq('id', id);
        if (error)
            throw new Error(`Delete vehicle error: ${error.message}`);
    }
}
exports.VehicleRepository = VehicleRepository;
//# sourceMappingURL=vehicleRepository.js.map