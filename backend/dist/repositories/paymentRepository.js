"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentRepository = void 0;
const supabaseClient_1 = require("../database/supabaseClient");
class PaymentRepository {
    static getClient() {
        const client = (0, supabaseClient_1.getSupabaseClient)();
        if (!client)
            throw new Error('Database client not initialized. Please verify SUPABASE_URL and credentials.');
        return client;
    }
    static async findAll() {
        const { data, error } = await this.getClient()
            .from('payments')
            .select('*, student:users!payments_student_id_fkey(*), subscription:subscriptions!payments_subscription_id_fkey(*, plan:subscription_plans(*))')
            .order('created_at', { ascending: false });
        if (error)
            throw new Error(`Fetch payments error: ${error.message}`);
        return (data || []);
    }
    static async findByStudentId(studentId) {
        const { data, error } = await this.getClient()
            .from('payments')
            .select('*, subscription:subscriptions!payments_subscription_id_fkey(*, plan:subscription_plans(*))')
            .eq('student_id', studentId)
            .order('created_at', { ascending: false });
        if (error)
            throw new Error(`Fetch student payments error: ${error.message}`);
        return (data || []);
    }
    static async create(payment) {
        const { data, error } = await this.getClient()
            .from('payments')
            .insert([payment])
            .select('*')
            .single();
        if (error)
            throw new Error(`Create payment error: ${error.message}`);
        return data;
    }
}
exports.PaymentRepository = PaymentRepository;
//# sourceMappingURL=paymentRepository.js.map