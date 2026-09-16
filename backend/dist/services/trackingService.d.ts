export declare function calculateStaleStatus(lastUpdateIso?: string | null): 'LIVE' | 'DELAYED' | 'OFFLINE';
export declare class TrackingService {
    /**
     * Updates driver live GPS coordinates during active trip in Supabase
     * Authoritative validation: driver authentication, trip status, coordinate sanity, anti-spoofing
     */
    static updateLocation(driverId: string, tripId: string, latitude: number, longitude: number, accuracy?: number, speed?: number, heading?: number, clientTimestamp?: string): Promise<{
        tripId: string;
        vehicleId: string;
        driverId: string;
        latitude: number;
        longitude: number;
        accuracy: number;
        speed: number;
        heading: number;
        currentStopSequence: number;
        staleStatus: "LIVE";
        updatedAt: string;
    }>;
    /**
     * Get vehicle live location for a trip
     */
    static getTripLocation(tripId: string): Promise<{
        tripId: string;
        status: "CANCELLED" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED";
        liveLatitude: number | null;
        liveLongitude: number | null;
        lastGpsUpdate: string | null;
        currentStopSequence: number;
        lastPassedStop: any;
        nextStop: any;
        totalStops: number;
        staleStatus: "LIVE" | "DELAYED" | "OFFLINE";
        isLive: boolean;
        vehicle: {
            id: string | undefined;
            number: string | undefined;
            model: string | undefined;
            type: "CAB_4" | "CAB_6" | "SHUTTLE_12" | "BUS_24" | undefined;
        };
        driver: {
            id: string | undefined;
            name: string | undefined;
            phone: string | undefined;
        };
        route: {
            id: string | undefined;
            name: string | undefined;
            code: string | undefined;
            estimatedDurationMins: number | undefined;
            stops: any[];
        };
    }>;
    /**
     * Get student live tracking view for active trip and booking
     */
    static getStudentLiveTracking(studentId: string): Promise<{
        hasActiveTrip: boolean;
        message: string;
        booking: null;
        trip: null;
        tripStatus?: undefined;
        latestDelay?: undefined;
    } | {
        hasActiveTrip: boolean;
        message: string;
        booking: import("../types").Booking;
        trip: null;
        tripStatus?: undefined;
        latestDelay?: undefined;
    } | {
        hasActiveTrip: boolean;
        tripStatus: "CANCELLED" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED";
        booking: {
            id: string;
            bookingDate: string;
            tripType: "MORNING_PICKUP" | "EVENING_DROP";
            seatNumber: number | undefined;
            pickupPoint: import("../types").PickupPoint | undefined;
            dropPoint: import("../types").PickupPoint | {
                name: any;
                address: any;
            } | null;
        };
        latestDelay: any;
        trip: {
            id: string;
            tripType: "MORNING_PICKUP" | "EVENING_DROP";
            scheduledDeparture: string;
            actualStartTime: string | undefined;
            currentStopSequence: number;
            lastPassedStop: any;
            nextStop: any;
            liveLatitude: number | null;
            liveLongitude: number | null;
            lastGpsUpdate: string | null;
            staleStatus: "LIVE" | "DELAYED" | "OFFLINE";
            isLive: boolean;
            distanceToPickupKm: number | null;
            etaMinutes: number | null;
            vehicle: {
                id: string | undefined;
                number: string | undefined;
                model: string | undefined;
                type: "CAB_4" | "CAB_6" | "SHUTTLE_12" | "BUS_24" | undefined;
            };
            driver: {
                id: string | undefined;
                name: string | undefined;
                phone: string | undefined;
            };
            route: {
                id: string | undefined;
                name: string | undefined;
                code: string | undefined;
                stops: any[];
            };
            college: {
                name: any;
                latitude: any;
                longitude: any;
                serviceRadiusKm: any;
            } | null;
        };
        message?: undefined;
    }>;
    /**
     * Get all active vehicles for Admin Live Fleet Map
     */
    static getAllActiveVehicles(collegeId?: string): Promise<{
        tripId: string;
        tripStatus: "CANCELLED" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED";
        tripType: "MORNING_PICKUP" | "EVENING_DROP";
        latitude: number | null;
        longitude: number | null;
        lastUpdated: string | null;
        staleStatus: "LIVE" | "DELAYED" | "OFFLINE";
        isLive: boolean;
        bookedSeats: number;
        maxCapacity: number;
        vehicle: {
            id: string | undefined;
            number: string | undefined;
            model: string | undefined;
            type: "CAB_4" | "CAB_6" | "SHUTTLE_12" | "BUS_24" | undefined;
        };
        driver: {
            id: string | undefined;
            name: string;
            phone: string | undefined;
        };
        route: {
            id: string | undefined;
            name: string | undefined;
            code: string | undefined;
        };
    }[]>;
    /**
     * Get breadcrumb location history for a specific trip (for route replay & audit)
     */
    static getTripLocationHistory(tripId: string): Promise<{
        tripId: string;
        vehicle: import("../types").Vehicle | undefined;
        driver: import("../types").User | null | undefined;
        route: import("../types").Route | undefined;
        tripStatus: "CANCELLED" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED";
        startTime: string | undefined;
        endTime: string | undefined;
        totalPoints: number;
        breadcrumbs: any[];
    }>;
}
