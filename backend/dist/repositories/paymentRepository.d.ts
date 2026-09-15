import { Payment } from '../types';
export declare class PaymentRepository {
    private static getClient;
    static findAll(): Promise<Payment[]>;
    static findByStudentId(studentId: string): Promise<Payment[]>;
    static create(payment: Partial<Payment>): Promise<Payment>;
}
