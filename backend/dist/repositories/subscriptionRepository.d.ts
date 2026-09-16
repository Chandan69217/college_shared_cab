import { SubscriptionPlan, Subscription } from '../types';
export declare class PlanRepository {
    private static getClient;
    static findAll(collegeId?: string): Promise<SubscriptionPlan[]>;
    static findById(id: string): Promise<SubscriptionPlan | null>;
    static create(plan: Partial<SubscriptionPlan>): Promise<SubscriptionPlan>;
    static update(id: string, updates: Partial<SubscriptionPlan>): Promise<SubscriptionPlan>;
    static delete(id: string): Promise<void>;
}
export declare class SubscriptionRepository {
    private static getClient;
    static findAll(collegeId?: string): Promise<Subscription[]>;
    static findActiveByStudentId(studentId: string): Promise<Subscription | null>;
    static create(subscription: Partial<Subscription>): Promise<Subscription>;
    static update(id: string, updates: Partial<Subscription>): Promise<Subscription>;
}
