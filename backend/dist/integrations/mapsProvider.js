"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MapsProvider = void 0;
const geo_1 = require("../utils/geo");
class MapsProvider {
    /**
     * Calculates distance between origin and destination coordinates
     */
    static calculateDistance(originLat, originLon, destLat, destLon) {
        return (0, geo_1.getHaversineDistanceKm)(originLat, originLon, destLat, destLon);
    }
    /**
     * Validates if a pickup coordinate is within college geofenced boundary
     */
    static validatePickupWithinServiceRadius(collegeLat, collegeLon, pickupLat, pickupLon, radiusKm = 10.0) {
        const result = (0, geo_1.isWithinServiceArea)(collegeLat, collegeLon, pickupLat, pickupLon, radiusKm);
        return {
            isValid: result.isWithin,
            distanceKm: result.distanceKm,
        };
    }
}
exports.MapsProvider = MapsProvider;
//# sourceMappingURL=mapsProvider.js.map