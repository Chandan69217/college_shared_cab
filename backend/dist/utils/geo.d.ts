/**
 * Calculates great-circle distance between two points in kilometers using Haversine formula
 */
export declare function getHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number;
/**
 * Validates if coordinates are within allowed service radius
 */
export declare function isWithinServiceArea(collegeLat: number, collegeLon: number, pickupLat: number, pickupLon: number, maxRadiusKm?: number): {
    isWithin: boolean;
    distanceKm: number;
};
