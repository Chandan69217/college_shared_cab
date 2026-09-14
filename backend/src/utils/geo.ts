/**
 * Calculates great-circle distance between two points in kilometers using Haversine formula
 */
export function getHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return parseFloat(distance.toFixed(2));
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Validates if coordinates are within allowed service radius
 */
export function isWithinServiceArea(
  collegeLat: number,
  collegeLon: number,
  pickupLat: number,
  pickupLon: number,
  maxRadiusKm = 10.0
): { isWithin: boolean; distanceKm: number } {
  const distanceKm = getHaversineDistanceKm(collegeLat, collegeLon, pickupLat, pickupLon);
  return {
    isWithin: distanceKm <= maxRadiusKm,
    distanceKm,
  };
}
