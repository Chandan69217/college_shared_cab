"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplaintRepository = void 0;
const supabaseClient_1 = require("../database/supabaseClient");
class ComplaintRepository {
    static getClient() {
        const client = (0, supabaseClient_1.getSupabaseClient)();
        if (!client)
            throw new Error('Database client not initialized. Please verify SUPABASE_URL and credentials.');
        return client;
    }
    static async findAll() {
        const { data, error } = await this.getClient()
            .from('complaints')
            .select('*, student:users!complaints_student_id_fkey(*)')
            .order('created_at', { ascending: false });
        if (error)
            throw new Error(`Fetch complaints error: ${error.message}`);
        return (data || []);
    }
    static async findByStudentId(studentId) {
        const { data, error } = await this.getClient()
            .from('complaints')
            .select('*')
            .eq('student_id', studentId)
            .order('created_at', { ascending: false });
        if (error)
            throw new Error(`Fetch student complaints error: ${error.message}`);
        return (data || []);
    }
    static async create(complaint) {
        const { data, error } = await this.getClient()
            .from('complaints')
            .insert([complaint])
            .select('*')
            .single();
        if (error)
            throw new Error(`Create complaint error: ${error.message}`);
        return data;
    }
    static async updateStatus(id, status, resolutionNotes, resolvedBy) {
        const updates = {
            status,
            resolution_notes: resolutionNotes,
            resolved_by: resolvedBy,
            updated_at: new Date().toISOString(),
        };
        if (status === 'RESOLVED') {
            updates.resolved_at = new Date().toISOString();
        }
        const { data, error } = await this.getClient()
            .from('complaints')
            .update(updates)
            .eq('id', id)
            .select('*')
            .single();
        if (error)
            throw new Error(`Update complaint error: ${error.message}`);
        return data;
    }
}
exports.ComplaintRepository = ComplaintRepository;
//# sourceMappingURL=complaintRepository.js.map