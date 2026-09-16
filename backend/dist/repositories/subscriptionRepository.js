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
            .select('*, college:colleges(*)')
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
            .select('*, college:colleges(*)')
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
            .select('*, college:colleges(*)')
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
            .select('*, college:colleges(*)')
            .single();
        if (error)
            throw new Error(`Update plan error: ${error.message}`);
        return data;
    }
    static async delete(id) {
        const { error } = await this.getClient()
            .from('subscription_plans')
            .delete()
            .eq('id', id);
        if (error)
            throw new Error(`Delete plan error: ${error.message}`);
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
            .select('*, plan:subscription_plans(*, college:colleges(*)), student:users!subscriptions_student_id_fkey(*)')
            .order('created_at', { ascending: false });
        const { data, error } = await query;
        if (error)
            throw new Error(`Fetch subscriptions error: ${error.message}`);
        const studentIds = Array.from(new Set((data || []).map((s) => s.student_id).filter(Boolean)));
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
        return (data || []).map((s) => {
            const studentUser = s.student;
            const studentProfile = profileMap[s.student_id];
            return {
                ...s,
                student_name: studentUser?.full_name || 'N/A',
                student_email: studentUser?.email || 'N/A',
                student_phone: studentUser?.phone || 'N/A',
                student_id_number: studentProfile?.student_id_number || 'N/A',
                college_name: studentProfile?.college?.name || s.plan?.college?.name || 'N/A',
                plan_name: s.plan?.name || 'N/A',
                rides_remaining: s.remaining_rides ?? s.total_rides_allocated ?? 0,
                rides_allocated: s.total_rides_allocated ?? s.plan?.ride_count_total ?? 0,
            };
        });
    }
    static async findActiveByStudentId(studentId) {
        const { data, error } = await this.getClient()
            .from('subscriptions')
            .select('*, plan:subscription_plans(*, college:colleges(*))')
            .eq('student_id', studentId)
            .eq('status', 'ACTIVE')
            .order('end_date', { ascending: false })
            .limit(1);
        if (error)
            throw new Error(`Fetch active student subscription error: ${error.message}`);
        return (data && data.length > 0) ? data[0] : null;
    }
    static async create(subscription) {
        const { data, error } = await this.getClient()
            .from('subscriptions')
            .insert([subscription])
            .select('*, plan:subscription_plans(*, college:colleges(*))')
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
            .select('*, plan:subscription_plans(*, college:colleges(*))')
            .single();
        if (error)
            throw new Error(`Update subscription error: ${error.message}`);
        return data;
    }
}
exports.SubscriptionRepository = SubscriptionRepository;
//# sourceMappingURL=subscriptionRepository.js.map