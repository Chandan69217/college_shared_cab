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
    final booked = (json['booked_seats'] as num?)?.toInt() ??
        (json['bookedSeats'] as num?)?.toInt() ??
        (json['passenger_count'] as num?)?.toInt() ??
        (json['passengerCount'] as num?)?.toInt() ??
        0;
    final boarded = (json['boarded_passengers'] as num?)?.toInt() ??
        (json['boardedPassengers'] as num?)?.toInt() ??
        0;
    final notBoarded = (json['not_boarded_passengers'] as num?)?.toInt() ??
        (json['notBoardedPassengers'] as num?)?.toInt() ??
        (booked - boarded).clamp(0, booked);
    final cancelled = (json['cancelled_passengers'] as num?)?.toInt() ??
        (json['cancelledPassengers'] as num?)?.toInt() ??
        0;
    final currentSeq = (json['current_stop_sequence'] as num?)?.toInt() ??
        (json['currentStopSequence'] as num?)?.toInt() ??
        0;

    return TripModel(
      id: json['id']?.toString() ?? '',
      routeId: json['route_id']?.toString() ?? json['routeId']?.toString() ?? '',
      route: json['route'] != null && json['route'] is Map
          ? RouteModel.fromJson(Map<String, dynamic>.from(json['route']))
          : null,
      vehicleId: json['vehicle_id']?.toString() ?? json['vehicleId']?.toString() ?? '',
      vehicle: json['vehicle'] is Map ? Map<String, dynamic>.from(json['vehicle']) : null,
      driverId: json['driver_id']?.toString() ?? json['driverId']?.toString() ?? '',
      driver: json['driver'] is Map ? Map<String, dynamic>.from(json['driver']) : null,
      tripDate: json['trip_date']?.toString() ?? json['tripDate']?.toString() ?? '',
      tripType: json['trip_type']?.toString() ?? json['tripType']?.toString() ?? 'MORNING_PICKUP',
      scheduledDepartureTime: json['scheduled_departure_time']?.toString() ??
          json['scheduledDepartureTime']?.toString() ??
          '',
      actualStartTime: json['actual_start_time']?.toString() ?? json['actualStartTime']?.toString(),
      actualEndTime: json['actual_end_time']?.toString() ?? json['actualEndTime']?.toString(),
      status: json['status']?.toString() ?? 'SCHEDULED',
      maxCapacity: (json['max_capacity'] as num?)?.toInt() ??
          (json['maxCapacity'] as num?)?.toInt() ??
          (json['total_seats'] as num?)?.toInt() ??
          (json['totalSeats'] as num?)?.toInt() ??
          6,
      bookedSeats: booked,
      boardedPassengers: boarded,
      notBoardedPassengers: notBoarded,
      cancelledPassengers: cancelled,
      currentStopSequence: currentSeq,
      liveLatitude: (json['live_latitude'] as num?)?.toDouble() ??
          (json['liveLatitude'] as num?)?.toDouble(),
      liveLongitude: (json['live_longitude'] as num?)?.toDouble() ??
          (json['liveLongitude'] as num?)?.toDouble(),
      passengers: json['passengers'] is List ? json['passengers'] : null,
      delayInfo: json['delay_info'] is Map
          ? Map<String, dynamic>.from(json['delay_info'])
          : (json['delayInfo'] is Map ? Map<String, dynamic>.from(json['delayInfo']) : null),
      boardingSummary: json['boarding_summary'] is Map
          ? Map<String, dynamic>.from(json['boarding_summary'])
          : (json['boardingSummary'] is Map
              ? Map<String, dynamic>.from(json['boardingSummary'])
              : null),
    );
  }

  bool get isInProgress => status == 'IN_PROGRESS';
  bool get isScheduled => status == 'SCHEDULED';
  bool get isCompleted => status == 'COMPLETED';
  bool get isCancelled => status == 'CANCELLED';
  bool get hasDelay => delayInfo != null;
  int get availableSeats => (maxCapacity - bookedSeats).clamp(0, maxCapacity);

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is TripModel && runtimeType == other.runtimeType && id == other.id;

  @override
  int get hashCode => id.hashCode;
}
