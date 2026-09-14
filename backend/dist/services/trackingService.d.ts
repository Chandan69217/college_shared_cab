export declare class TrackingService {
    /**
     * Updates driver live GPS coordinates during active trip
     */
    static updateLocation(driverId: string, tripId: string, latitude: number, longitude: number, speed?: number, heading?: number): Promise<{
        tripId: string;
        latitude: number;
        longitude: number;
        speed: number;
        heading: number;
        updatedAt: string;
    }>;
    /**
     * Get vehicle live location for a trip
     */
    static getTripLocation(tripId: string): Promise<{
        tripId: string;
        status: "CANCELLED" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED";
        liveLatitude: number;
        liveLongitude: number;
        lastGpsUpdate: string | undefined;
        vehicle: {
            number: string | undefined;
            model: string | undefined;
            type: "CAB_4" | "CAB_6" | "SHUTTLE_12" | "BUS_24" | undefined;
        };
        driver: {
            name: string | undefined;
            phone: string | undefined;
        };
        route: {
            name: string | undefined;
            estimatedDurationMins: number | undefined;
        };
    }>;
    /**
     * Get all active vehicles on map (for Admin monitoring)
     */
    static getAllActiveVehicles(): Promise<any[]>;
}
