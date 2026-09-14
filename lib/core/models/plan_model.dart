class PlanModel {
  final String id;
  final String tier;
  final String name;
  final String? description;
  final double price;
  final int validityDays;
  final int rideCountTotal;
  final bool isUnlimitedRides;
  final bool priorityBooking;
  final bool oneWayAllowed;
  final bool roundTripAllowed;
  final int cancellationHoursLimit;
  final double cancellationFeePercentage;
  final double additionalRideCharge;
  final String status;

  PlanModel({
    required this.id,
    required this.tier,
    required this.name,
    this.description,
    required this.price,
    required this.validityDays,
    required this.rideCountTotal,
    required this.isUnlimitedRides,
    required this.priorityBooking,
    required this.oneWayAllowed,
    required this.roundTripAllowed,
    required this.cancellationHoursLimit,
    required this.cancellationFeePercentage,
    required this.additionalRideCharge,
    required this.status,
  });

  factory PlanModel.fromJson(Map<String, dynamic> json) {
    return PlanModel(
      id: json['id'] ?? '',
      tier: json['tier'] ?? 'STANDARD',
      name: json['name'] ?? '',
      description: json['description'],
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
      validityDays: json['validity_days'] ?? 30,
      rideCountTotal: json['ride_count_total'] ?? 44,
      isUnlimitedRides: json['is_unlimited_rides'] ?? false,
      priorityBooking: json['priority_booking'] ?? false,
      oneWayAllowed: json['one_way_allowed'] ?? true,
      roundTripAllowed: json['round_trip_allowed'] ?? true,
      cancellationHoursLimit: json['cancellation_hours_limit'] ?? 2,
      cancellationFeePercentage: (json['cancellation_fee_percentage'] as num?)?.toDouble() ?? 10.0,
      additionalRideCharge: (json['additional_ride_charge'] as num?)?.toDouble() ?? 50.0,
      status: json['status'] ?? 'ACTIVE',
    );
  }
}
