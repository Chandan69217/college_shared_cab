export declare class MapsProvider {
    /**
     * Calculates distance between origin and destination coordinates
     */
    static calculateDistance(originLat: number, originLon: number, destLat: number, destLon: number): number;
    /**
     * Validates if a pickup coordinate is within college geofenced boundary
     */
    static validatePickupWithinServiceRadius(collegeLat: number, collegeLon: number, pickupLat: number, pickupLon: number, radiusKm?: number): {
        isValid: boolean;
        distanceKm: number;
    };
}
