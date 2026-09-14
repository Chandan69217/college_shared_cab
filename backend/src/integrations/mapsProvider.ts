import { getHaversineDistanceKm, isWithinServiceArea } from '../utils/geo';

export class MapsProvider {
  /**
   * Calculates distance between origin and destination coordinates
   */
  public static calculateDistance(
    originLat: number,
    originLon: number,
    destLat: number,
    destLon: number
  ): number {
    return getHaversineDistanceKm(originLat, originLon, destLat, destLon);
  }

  /**
   * Validates if a pickup coordinate is within college geofenced boundary
   */
  public static validatePickupWithinServiceRadius(
    collegeLat: number,
    collegeLon: number,
    pickupLat: number,
    pickupLon: number,
    radiusKm = 10.0
  ): { isValid: boolean; distanceKm: number } {
    const result = isWithinServiceArea(collegeLat, collegeLon, pickupLat, pickupLon, radiusKm);
    return {
      isValid: result.isWithin,
      distanceKm: result.distanceKm,
    };
  }
}
