"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionRepository = exports.PlanRepository = void 0;
const supabaseClient_1 = require("../database/supabaseClient");
class PlanRepository {
    static getClient() {
        const client = (0, supabaseClient_1.getSupabaseClient)();
        if (!client)
            throw new Error('Database client not initialized. Please verify SUPABASE_URL and credentials.');
        return client;
    }
    static async findAll(collegeId) {
        let query = this.getClient()
            .from('subscription_plans')
            .select('*')
            .order('price');
        if (collegeId) {
            query = query.eq('college_id', collegeId);
        }
        const { data, error } = await query;
        if (error)
            throw new Error(`Fetch subscription plans error: ${error.message}`);
        return (data || []);
    }
    static async findById(id) {
        const { data, error } = await this.getClient()
            .from('subscription_plans')
            .select('*')
            .eq('id', id)
            .maybeSingle();
        if (error)
            throw new Error(`Fetch plan error: ${error.message}`);
        return data;
    }
    static async create(plan) {
        const { data, error } = await this.getClient()
            .from('subscription_plans')
            .insert([plan])
            .select('*')
            .single();
        if (error)
            throw new Error(`Create plan error: ${error.message}`);
        return data;
    }
    static async update(id, updates) {
        const { data, error } = await this.getClient()
            .from('subscription_plans')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select('*')
            .single();
        if (error)
            throw new Error(`Update plan error: ${error.message}`);
        return data;
    }
}
exports.PlanRepository = PlanRepository;
class SubscriptionRepository {
    static getClient() {
        const client = (0, supabaseClient_1.getSupabaseClient)();
        if (!client)
            throw new Error('Database client not initialized. Please verify SUPABASE_URL and credentials.');
        return client;
    }
    static async findAll(collegeId) {
        const query = this.getClient()
            .from('subscriptions')
            .select('*, plan:subscription_plans(*), student:users(*)')
            .order('created_at', { ascending: false });
        const { data, error } = await query;
        if (error)
            throw new Error(`Fetch subscriptions error: ${error.message}`);
        return (data || []);
    }
    static async findActiveByStudentId(studentId) {
        const { data, error } = await this.getClient()
            .from('subscriptions')
            .select('*, plan:subscription_plans(*)')
            .eq('student_id', studentId)
            .eq('status', 'ACTIVE')
            .order('end_date', { ascending: false })
            .maybeSingle();
        if (error)
            throw new Error(`Fetch active student subscription error: ${error.message}`);
        return data;
    }
    static async create(subscription) {
        const { data, error } = await this.getClient()
            .from('subscriptions')
            .insert([subscription])
            .select('*, plan:subscription_plans(*)')
            .single();
        if (error)
            throw new Error(`Create subscription error: ${error.message}`);
        return data;
    }
    static async update(id, updates) {
        const { data, error } = await this.getClient()
            .from('subscriptions')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select('*, plan:subscription_plans(*)')
            .single();
        if (error)
            throw new Error(`Update subscription error: ${error.message}`);
        return data;
    }
}
exports.SubscriptionRepository = SubscriptionRepository;
//# sourceMappingURL=subscriptionRepository.js.map