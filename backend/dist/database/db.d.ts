import { User, StudentProfile, DriverProfile, AdminProfile, College, PickupPoint, Vehicle, Route, SubscriptionPlan, Subscription, Trip, Booking, TripPassenger, DailyTravelPass, Payment, Complaint, Rating, Notification, CollegeHoliday } from '../types';
/**
 * In-memory thread-safe state store initialized with rich demo data.
 * When Supabase/PostgreSQL is connected, repositories can delegate to pool or this store.
 */
declare class DatabaseStore {
    users: Map<string, User>;
    studentProfiles: Map<string, StudentProfile>;
    driverProfiles: Map<string, DriverProfile>;
    adminProfiles: Map<string, AdminProfile>;
    colleges: Map<string, College>;
    pickupPoints: Map<string, PickupPoint>;
    vehicles: Map<string, Vehicle>;
    routes: Map<string, Route>;
    subscriptionPlans: Map<string, SubscriptionPlan>;
    subscriptions: Map<string, Subscription>;
    trips: Map<string, Trip>;
    bookings: Map<string, Booking>;
    tripPassengers: Map<string, TripPassenger>;
    dailyPasses: Map<string, DailyTravelPass>;
    payments: Map<string, Payment>;
    complaints: Map<string, Complaint>;
    ratings: Map<string, Rating>;
    notifications: Map<string, Notification>;
    holidays: Map<string, CollegeHoliday>;
    qrScanLogs: Array<any>;
    vehicleLocations: Array<any>;
    auditLogs: Array<any>;
    constructor();
    seedDemoData(): void;
}
export declare const db: DatabaseStore;
export {};
