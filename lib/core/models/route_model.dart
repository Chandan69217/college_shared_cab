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
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      landmark: json['landmark']?.toString(),
      address: json['address']?.toString() ?? '',
      latitude: (json['latitude'] as num?)?.toDouble() ?? 0.0,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 0.0,
      distanceToCollegeKm: (json['distance_to_college_km'] as num?)?.toDouble() ?? 0.0,
      isApproved: json['is_approved'] == true || json['is_approved'] == null,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is PickupPointModel && runtimeType == other.runtimeType && id == other.id;

  @override
  int get hashCode => id.hashCode;
}

class RouteStopModel {
  final String id;
  final String routeId;
  final String pickupPointId;
  final int sequenceOrder;
  final String? morningPickupTime;
  final String? eveningDropTime;
  final PickupPointModel? pickupPoint;

  RouteStopModel({
    required this.id,
    required this.routeId,
    required this.pickupPointId,
    required this.sequenceOrder,
    this.morningPickupTime,
    this.eveningDropTime,
    this.pickupPoint,
  });

  factory RouteStopModel.fromJson(Map<String, dynamic> json) {
    PickupPointModel? point;
    if (json['pickup_point'] != null && json['pickup_point'] is Map) {
      point = PickupPointModel.fromJson(Map<String, dynamic>.from(json['pickup_point']));
    } else if (json['pickupPoint'] != null && json['pickupPoint'] is Map) {
      point = PickupPointModel.fromJson(Map<String, dynamic>.from(json['pickupPoint']));
    }

    return RouteStopModel(
      id: json['id']?.toString() ?? '',
      routeId: json['route_id']?.toString() ?? json['routeId']?.toString() ?? '',
      pickupPointId: json['pickup_point_id']?.toString() ?? json['pickupPointId']?.toString() ?? '',
      sequenceOrder: (json['sequence_order'] as num?)?.toInt() ??
          (json['sequenceOrder'] as num?)?.toInt() ??
          1,
      morningPickupTime: json['morning_pickup_time']?.toString() ?? json['morningPickupTime']?.toString(),
      eveningDropTime: json['evening_drop_time']?.toString() ?? json['eveningDropTime']?.toString(),
      pickupPoint: point,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is RouteStopModel && runtimeType == other.runtimeType && id == other.id;

  @override
  int get hashCode => id.hashCode;
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
  final bool isActive;
  final Map<String, dynamic>? college;
  final List<RouteStopModel> stops;

  RouteModel({
    required this.id,
    required this.name,
    required this.code,
    this.description,
    required this.morningDepartureTime,
    required this.eveningDepartureTime,
    required this.estimatedDurationMins,
    required this.maxCapacity,
    this.isActive = true,
    this.college,
    this.stops = const [],
  });

  factory RouteModel.fromJson(Map<String, dynamic> json) {
    List<RouteStopModel> parsedStops = [];
    if (json['stops'] != null && json['stops'] is List) {
      parsedStops = (json['stops'] as List)
          .where((s) => s != null && s is Map)
          .map((s) => RouteStopModel.fromJson(Map<String, dynamic>.from(s)))
          .toList();
    } else if (json['route_pickup_points'] != null && json['route_pickup_points'] is List) {
      parsedStops = (json['route_pickup_points'] as List)
          .where((s) => s != null && s is Map)
          .map((s) => RouteStopModel.fromJson(Map<String, dynamic>.from(s)))
          .toList();
    }

    // Ensure sorted by sequenceOrder ascending
    parsedStops.sort((a, b) => a.sequenceOrder.compareTo(b.sequenceOrder));

    return RouteModel(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      code: json['code']?.toString() ?? '',
      description: json['description']?.toString(),
      morningDepartureTime: json['morning_departure_time']?.toString() ?? '',
      eveningDepartureTime: json['evening_departure_time']?.toString() ?? '',
      estimatedDurationMins: (json['estimated_duration_mins'] as num?)?.toInt() ?? 45,
      maxCapacity: (json['max_capacity'] as num?)?.toInt() ?? 6,
      isActive: json['is_active'] == true || json['is_active'] == null,
      college: json['college'] is Map ? Map<String, dynamic>.from(json['college']) : null,
      stops: parsedStops,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is RouteModel && runtimeType == other.runtimeType && id == other.id;

  @override
  int get hashCode => id.hashCode;
}
