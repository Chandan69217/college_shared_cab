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
    if (json['pickup_point'] != null && json['pickup_point'] is Map<String, dynamic>) {
      point = PickupPointModel.fromJson(json['pickup_point']);
    } else if (json['pickupPoint'] != null && json['pickupPoint'] is Map<String, dynamic>) {
      point = PickupPointModel.fromJson(json['pickupPoint']);
    }

    return RouteStopModel(
      id: json['id'] ?? '',
      routeId: json['route_id'] ?? json['routeId'] ?? '',
      pickupPointId: json['pickup_point_id'] ?? json['pickupPointId'] ?? '',
      sequenceOrder: json['sequence_order'] ?? json['sequenceOrder'] ?? 1,
      morningPickupTime: json['morning_pickup_time'] ?? json['morningPickupTime'],
      eveningDropTime: json['evening_drop_time'] ?? json['eveningDropTime'],
      pickupPoint: point,
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
    this.college,
    this.stops = const [],
  });

  factory RouteModel.fromJson(Map<String, dynamic> json) {
    List<RouteStopModel> parsedStops = [];
    if (json['stops'] != null && json['stops'] is List) {
      parsedStops = (json['stops'] as List)
          .map((s) => RouteStopModel.fromJson(s is Map<String, dynamic> ? s : Map<String, dynamic>.from(s)))
          .toList();
    } else if (json['route_pickup_points'] != null && json['route_pickup_points'] is List) {
      parsedStops = (json['route_pickup_points'] as List)
          .map((s) => RouteStopModel.fromJson(s is Map<String, dynamic> ? s : Map<String, dynamic>.from(s)))
          .toList();
    }

    // Ensure sorted by sequenceOrder ascending
    parsedStops.sort((a, b) => a.sequenceOrder.compareTo(b.sequenceOrder));

    return RouteModel(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      code: json['code'] ?? '',
      description: json['description'],
      morningDepartureTime: json['morning_departure_time'] ?? '',
      eveningDepartureTime: json['evening_departure_time'] ?? '',
      estimatedDurationMins: json['estimated_duration_mins'] ?? 45,
      maxCapacity: json['max_capacity'] ?? 6,
      college: json['college'] is Map<String, dynamic> ? json['college'] : null,
      stops: parsedStops,
    );
  }
}

