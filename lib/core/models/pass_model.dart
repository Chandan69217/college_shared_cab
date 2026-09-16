class DailyPassModel {
  final String id;
  final String studentId;
  final String bookingId;
  final String tripId;
  final String passDate;
  final String tripType;
  final String routeId;
  final String pickupPointId;
  final String authTokenHash;
  final String validUntil;
  final String status;
  final Map<String, dynamic>? route;
  final Map<String, dynamic>? pickup;

  DailyPassModel({
    required this.id,
    required this.studentId,
    required this.bookingId,
    required this.tripId,
    required this.passDate,
    required this.tripType,
    required this.routeId,
    required this.pickupPointId,
    required this.authTokenHash,
    required this.validUntil,
    required this.status,
    this.route,
    this.pickup,
  });

  factory DailyPassModel.fromJson(Map<String, dynamic> json) {
    final routeData = json['route'] ?? (json['trip'] != null ? json['trip']['route'] : null);
    final pickupData = json['pickup_point'] ?? json['pickup'];

    return DailyPassModel(
      id: json['id'] ?? '',
      studentId: json['student_id'] ?? '',
      bookingId: json['booking_id'] ?? '',
      tripId: json['trip_id'] ?? '',
      passDate: json['pass_date'] ?? '',
      tripType: json['trip_type'] ?? 'MORNING_PICKUP',
      routeId: json['route_id'] ?? '',
      pickupPointId: json['pickup_point_id'] ?? '',
      authTokenHash: json['auth_token_hash'] ?? '',
      validUntil: json['valid_until'] ?? '',
      status: json['status'] ?? 'ACTIVE',
      route: routeData is Map<String, dynamic> ? routeData : null,
      pickup: pickupData is Map<String, dynamic> ? pickupData : null,
    );
  }
}
