"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HolidayRepository = void 0;
const supabaseClient_1 = require("../database/supabaseClient");
class HolidayRepository {
    static getClient() {
        const client = (0, supabaseClient_1.getSupabaseClient)();
        if (!client)
            throw new Error('Database client not initialized. Please verify SUPABASE_URL and credentials.');
        return client;
    }
    static async findAll(collegeId) {
        let query = this.getClient()
            .from('college_holidays')
            .select('*')
            .order('holiday_date');
        if (collegeId) {
            query = query.eq('college_id', collegeId);
        }
        const { data, error } = await query;
        if (error)
            throw new Error(`Fetch holidays error: ${error.message}`);
        return (data || []);
    }
    static async create(holiday) {
        const { data, error } = await this.getClient()
            .from('college_holidays')
            .insert([holiday])
            .select('*')
            .single();
        if (error)
            throw new Error(`Create holiday error: ${error.message}`);
        return data;
    }
    static async delete(id) {
        const { error } = await this.getClient()
            .from('college_holidays')
            .delete()
            .eq('id', id);
        if (error)
            throw new Error(`Delete holiday error: ${error.message}`);
    }
}
exports.HolidayRepository = HolidayRepository;
//# sourceMappingURL=holidayRepository.js.map