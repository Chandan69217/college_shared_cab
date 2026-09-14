import 'route_model.dart';

class TripModel {
  final String id;
  final String routeId;
  final RouteModel? route;
  final String vehicleId;
  final Map<String, dynamic>? vehicle;
  final String driverId;
  final Map<String, dynamic>? driver;
  final String tripDate;
  final String tripType;
  final String scheduledDepartureTime;
  final String status;
  final int maxCapacity;
  final int bookedSeats;
  final int boardedPassengers;
  final double? liveLatitude;
  final double? liveLongitude;

  TripModel({
    required this.id,
    required this.routeId,
    this.route,
    required this.vehicleId,
    this.vehicle,
    required this.driverId,
    this.driver,
    required this.tripDate,
    required this.tripType,
    required this.scheduledDepartureTime,
    required this.status,
    required this.maxCapacity,
    required this.bookedSeats,
    required this.boardedPassengers,
    this.liveLatitude,
    this.liveLongitude,
  });

  factory TripModel.fromJson(Map<String, dynamic> json) {
    return TripModel(
      id: json['id'] ?? '',
      routeId: json['route_id'] ?? '',
      route: json['route'] != null ? RouteModel.fromJson(json['route']) : null,
      vehicleId: json['vehicle_id'] ?? '',
      vehicle: json['vehicle'],
      driverId: json['driver_id'] ?? '',
      driver: json['driver'],
      tripDate: json['trip_date'] ?? '',
      tripType: json['trip_type'] ?? 'MORNING_PICKUP',
      scheduledDepartureTime: json['scheduled_departure_time'] ?? '',
      status: json['status'] ?? 'SCHEDULED',
      maxCapacity: json['max_capacity'] ?? 6,
      bookedSeats: json['booked_seats'] ?? 0,
      boardedPassengers: json['boarded_passengers'] ?? 0,
      liveLatitude: (json['live_latitude'] as num?)?.toDouble(),
      liveLongitude: (json['live_longitude'] as num?)?.toDouble(),
    );
  }
}
