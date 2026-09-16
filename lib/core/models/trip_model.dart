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
  final String? actualStartTime;
  final String? actualEndTime;
  final String status;
  final int maxCapacity;
  final int bookedSeats;
  final int boardedPassengers;
  final int notBoardedPassengers;
  final int cancelledPassengers;
  final int currentStopSequence;
  final double? liveLatitude;
  final double? liveLongitude;
  final List<dynamic>? passengers;
  final Map<String, dynamic>? delayInfo;
  final Map<String, dynamic>? boardingSummary;

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
    this.actualStartTime,
    this.actualEndTime,
    required this.status,
    required this.maxCapacity,
    required this.bookedSeats,
    required this.boardedPassengers,
    this.notBoardedPassengers = 0,
    this.cancelledPassengers = 0,
    this.currentStopSequence = 0,
    this.liveLatitude,
    this.liveLongitude,
    this.passengers,
    this.delayInfo,
    this.boardingSummary,
  });

  factory TripModel.fromJson(Map<String, dynamic> json) {
    final booked = json['booked_seats'] ?? json['bookedSeats'] ?? json['passenger_count'] ?? json['passengerCount'] ?? 0;
    final boarded = json['boarded_passengers'] ?? json['boardedPassengers'] ?? 0;
    final notBoarded = json['not_boarded_passengers'] ?? json['notBoardedPassengers'] ?? (booked - boarded).clamp(0, booked);
    final cancelled = json['cancelled_passengers'] ?? json['cancelledPassengers'] ?? 0;
    final currentSeq = json['current_stop_sequence'] ?? json['currentStopSequence'] ?? 0;

    return TripModel(
      id: json['id'] ?? '',
      routeId: json['route_id'] ?? json['routeId'] ?? '',
      route: json['route'] != null ? RouteModel.fromJson(json['route']) : null,
      vehicleId: json['vehicle_id'] ?? json['vehicleId'] ?? '',
      vehicle: json['vehicle'],
      driverId: json['driver_id'] ?? json['driverId'] ?? '',
      driver: json['driver'],
      tripDate: json['trip_date'] ?? json['tripDate'] ?? '',
      tripType: json['trip_type'] ?? json['tripType'] ?? 'MORNING_PICKUP',
      scheduledDepartureTime: json['scheduled_departure_time'] ?? json['scheduledDepartureTime'] ?? '',
      actualStartTime: json['actual_start_time'] ?? json['actualStartTime'],
      actualEndTime: json['actual_end_time'] ?? json['actualEndTime'],
      status: json['status'] ?? 'SCHEDULED',
      maxCapacity: json['max_capacity'] ?? json['maxCapacity'] ?? json['total_seats'] ?? json['totalSeats'] ?? 6,
      bookedSeats: booked,
      boardedPassengers: boarded,
      notBoardedPassengers: notBoarded,
      cancelledPassengers: cancelled,
      currentStopSequence: currentSeq,
      liveLatitude: (json['live_latitude'] ?? json['liveLatitude'] as num?)?.toDouble(),
      liveLongitude: (json['live_longitude'] ?? json['liveLongitude'] as num?)?.toDouble(),
      passengers: json['passengers'],
      delayInfo: json['delay_info'] ?? json['delayInfo'],
      boardingSummary: json['boarding_summary'] ?? json['boardingSummary'],
    );
  }

  bool get isInProgress => status == 'IN_PROGRESS';
  bool get isScheduled => status == 'SCHEDULED';
  bool get isCompleted => status == 'COMPLETED';
  bool get isCancelled => status == 'CANCELLED';
  bool get hasDelay => delayInfo != null;
  int get availableSeats => (maxCapacity - bookedSeats).clamp(0, maxCapacity);
}
