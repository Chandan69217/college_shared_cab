"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHaversineDistanceKm = getHaversineDistanceKm;
exports.isWithinServiceArea = isWithinServiceArea;
/**
 * Calculates great-circle distance between two points in kilometers using Haversine formula
 */
function getHaversineDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's mean radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return parseFloat(distance.toFixed(2));
}
function toRad(degrees) {
    return (degrees * Math.PI) / 180;
}
/**
 * Validates if coordinates are within allowed service radius
 */
function isWithinServiceArea(collegeLat, collegeLon, pickupLat, pickupLon, maxRadiusKm = 10.0) {
    const distanceKm = getHaversineDistanceKm(collegeLat, collegeLon, pickupLat, pickupLon);
    return {
        isWithin: distanceKm <= maxRadiusKm,
        distanceKm,
    };
}
//# sourceMappingURL=geo.js.map