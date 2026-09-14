class PickupPointModel {
  final String id;
  final String name;
  final String? landmark;
  final String address;
  final double latitude;
  final double longitude;
  final double distanceToCollegeKm;
  final bool isApproved;

  PickupPointModel({
    required this.id,
    required this.name,
    this.landmark,
    required this.address,
    required this.latitude,
    required this.longitude,
    required this.distanceToCollegeKm,
    required this.isApproved,
  });

  factory PickupPointModel.fromJson(Map<String, dynamic> json) {
    return PickupPointModel(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      landmark: json['landmark'],
      address: json['address'] ?? '',
      latitude: (json['latitude'] as num?)?.toDouble() ?? 0.0,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 0.0,
      distanceToCollegeKm: (json['distance_to_college_km'] as num?)?.toDouble() ?? 0.0,
      isApproved: json['is_approved'] ?? true,
    );
  }
}

class RouteModel {
  final String id;
  final String name;
  final String code;
  final String? description;
  final String morningDepartureTime;
  final String eveningDepartureTime;
  final int estimatedDurationMins;
  final int maxCapacity;
  final List<dynamic>? stops;

  RouteModel({
    required this.id,
    required this.name,
    required this.code,
    this.description,
    required this.morningDepartureTime,
    required this.eveningDepartureTime,
    required this.estimatedDurationMins,
    required this.maxCapacity,
    this.stops,
  });

  factory RouteModel.fromJson(Map<String, dynamic> json) {
    return RouteModel(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      code: json['code'] ?? '',
      description: json['description'],
      morningDepartureTime: json['morning_departure_time'] ?? '',
      eveningDepartureTime: json['evening_departure_time'] ?? '',
      estimatedDurationMins: json['estimated_duration_mins'] ?? 45,
      maxCapacity: json['max_capacity'] ?? 6,
      stops: json['stops'],
    );
  }
}
