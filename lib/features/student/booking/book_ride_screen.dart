import 'package:flutter/material.dart';
import '../../../core/api/api_client.dart';
import '../../../core/models/route_model.dart';
import '../../../core/models/trip_model.dart';
import '../../../core/theme/app_colors.dart';

class BookRideScreen extends StatefulWidget {
  final Function(int)? onNavigateTab;
  const BookRideScreen({super.key, this.onNavigateTab});

  @override
  State<BookRideScreen> createState() => _BookRideScreenState();
}

class _BookRideScreenState extends State<BookRideScreen> {
  List<RouteModel> _routes = [];
  List<TripModel> _trips = [];
  
  RouteModel? _selectedRoute;
  RouteStopModel? _selectedPickupStop;
  RouteStopModel? _selectedDropStop;
  TripModel? _selectedTrip;
  
  bool _isLoading = true;
  bool _isBooking = false;
  String? _errorMessage;

  Future<void> _loadData() async {
    try {
      final routesRes = await apiClient.get('/catalog/routes');
      final tripsRes = await apiClient.get('/trips');

      if (mounted) {
        final List rList = routesRes.data['data'] ?? [];
        final List tList = tripsRes.data['data'] ?? [];

        final routes = rList.map((r) => RouteModel.fromJson(r)).toList();
        final trips = tList.map((t) => TripModel.fromJson(t)).toList();

        setState(() {
          _routes = routes;
          _trips = trips;

          if (_routes.isNotEmpty) {
            _onRouteChanged(_routes.first);
          }

          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _onRouteChanged(RouteModel route) {
    _selectedRoute = route;
    _selectedPickupStop = route.stops.isNotEmpty ? route.stops.first : null;
    _updateDropStops();
    _autoSelectFirstEligibleTrip();
  }

  void _onPickupChanged(RouteStopModel pickup) {
    setState(() {
      _selectedPickupStop = pickup;
      _updateDropStops();
      _autoSelectFirstEligibleTrip();
    });
  }

  void _updateDropStops() {
    if (_selectedRoute == null || _selectedPickupStop == null) {
      _selectedDropStop = null;
      return;
    }
    final eligibleDrops = _selectedRoute!.stops
        .where((s) => s.sequenceOrder > _selectedPickupStop!.sequenceOrder)
        .toList();

    if (eligibleDrops.isNotEmpty) {
      _selectedDropStop = eligibleDrops.last; // Default to final stop
    } else {
      _selectedDropStop = null;
    }
  }

  void _autoSelectFirstEligibleTrip() {
    final routeTrips = _trips.where((t) => t.routeId == _selectedRoute?.id).toList();
    TripModel? eligible;
    for (final t in routeTrips) {
      final info = _evaluateTripEligibility(t);
      if (info.isEligible) {
        eligible = t;
        break;
      }
    }
    _selectedTrip = eligible;
  }

  _TripEligibility _evaluateTripEligibility(TripModel trip) {
    final seatsLeft = trip.maxCapacity - trip.bookedSeats;
    if (seatsLeft <= 0) {
      return _TripEligibility(
        isEligible: false,
        badgeText: 'FULL (0 SEATS)',
        badgeColor: AppColors.accentRose,
        reason: 'Vehicle has reached maximum passenger capacity.',
      );
    }

    if (trip.status == 'COMPLETED' || trip.status == 'CANCELLED') {
      return _TripEligibility(
        isEligible: false,
        badgeText: trip.status,
        badgeColor: AppColors.textMuted,
        reason: 'This trip is no longer active for bookings.',
      );
    }

    if (trip.status == 'IN_PROGRESS' && _selectedPickupStop != null) {
      final pickupSeq = _selectedPickupStop!.sequenceOrder;
      final cabSeq = trip.currentStopSequence;
      if (cabSeq >= pickupSeq) {
        return _TripEligibility(
          isEligible: false,
          badgeText: 'PASSED STOP #$pickupSeq',
          badgeColor: AppColors.accentRose,
          reason: 'Cab already reached Stop #$cabSeq and cannot pick up at Stop #$pickupSeq.',
        );
      } else {
        return _TripEligibility(
          isEligible: true,
          badgeText: '$seatsLeft SEATS • ON ROUTE (STOP #$cabSeq)',
          badgeColor: const Color(0xFF10B981),
          reason: 'Cab is currently active at Stop #$cabSeq and en route to your stop.',
        );
      }
    }

    return _TripEligibility(
      isEligible: true,
      badgeText: '$seatsLeft SEATS LEFT',
      badgeColor: AppColors.primaryLight,
      reason: 'Scheduled departure as planned.',
    );
  }

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _handleBookRide() async {
    if (_selectedTrip == null || _selectedPickupStop == null) {
      setState(() {
        _errorMessage = 'Please select a valid pickup stop and eligible cab trip.';
      });
      return;
    }

    final pickupPoint = _selectedPickupStop!.pickupPoint;
    if (pickupPoint != null && pickupPoint.distanceToCollegeKm > 10.0 && !pickupPoint.isApproved) {
      setState(() {
        _errorMessage = 'Selected pickup is outside the 10km college service area (${pickupPoint.distanceToCollegeKm} km).';
      });
      return;
    }

    final eligibility = _evaluateTripEligibility(_selectedTrip!);
    if (!eligibility.isEligible) {
      setState(() {
        _errorMessage = eligibility.reason;
      });
      return;
    }

    setState(() {
      _isBooking = true;
      _errorMessage = null;
    });

    try {
      final payload = {
        'trip_id': _selectedTrip!.id,
        'pickup_point_id': _selectedPickupStop!.pickupPointId,
        if (_selectedDropStop != null) 'drop_point_id': _selectedDropStop!.pickupPointId,
      };

      final res = await apiClient.post('/bookings', data: payload);

      if (res.data['success'] == true && mounted) {
        final data = res.data['data'];
        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            backgroundColor: AppColors.surfaceCard,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            title: const Row(
              children: [
                Icon(Icons.check_circle_rounded, color: AppColors.primary, size: 28),
                SizedBox(width: 8),
                Text('Ride Confirmed!', style: TextStyle(color: Colors.white, fontSize: 16)),
              ],
            ),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Seat #${data['booking']?['seat_number'] ?? 1} reserved successfully on Route "${_selectedRoute?.name}".',
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Pickup: Stop #${_selectedPickupStop!.sequenceOrder} – ${_selectedPickupStop!.pickupPoint?.name ?? 'Assigned Stop'}',
                          style: const TextStyle(color: Colors.white, fontSize: 11)),
                      if (_selectedDropStop != null)
                        Text('Drop: Stop #${_selectedDropStop!.sequenceOrder} – ${_selectedDropStop!.pickupPoint?.name ?? 'Destination'}',
                            style: const TextStyle(color: AppColors.textSecondary, fontSize: 11)),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Your daily dynamic travel pass with signed QR authentication has been generated.',
                  style: TextStyle(color: AppColors.textMuted, fontSize: 11),
                ),
              ],
            ),
            actions: [
              ElevatedButton(
                onPressed: () {
                  Navigator.pop(ctx);
                  if (widget.onNavigateTab != null) {
                    widget.onNavigateTab!(2); // Navigate to Today's Pass
                  }
                },
                child: const Text('View Travel Pass'),
              ),
            ],
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _errorMessage = ApiClient.getErrorMessage(e));
      }
    } finally {
      if (mounted) setState(() => _isBooking = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final routeTrips = _trips.where((t) => t.routeId == _selectedRoute?.id).toList();
    final stops = _selectedRoute?.stops ?? [];
    final dropOptions = _selectedPickupStop != null
        ? stops.where((s) => s.sequenceOrder > _selectedPickupStop!.sequenceOrder).toList()
        : <RouteStopModel>[];

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Book Campus Shared Ride'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (_errorMessage != null) ...[
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.accentRose.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.accentRose.withOpacity(0.3)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.error_outline, color: AppColors.accentRose, size: 18),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              _errorMessage!,
                              style: const TextStyle(color: AppColors.accentRose, fontSize: 12),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // 1. Route Selector Card
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceCard,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: const Color(0xFF374151)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          '1. Select Commute Route Corridor',
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                        ),
                        const SizedBox(height: 10),
                        DropdownButtonFormField<RouteModel>(
                          value: _selectedRoute,
                          hint: const Text('No active routes found', style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
                          dropdownColor: AppColors.surface,
                          style: const TextStyle(color: Colors.white, fontSize: 13),
                          decoration: const InputDecoration(
                            prefixIcon: Icon(Icons.alt_route_rounded, size: 20),
                          ),
                          items: _routes.map((r) {
                            return DropdownMenuItem(
                              value: r,
                              child: Text('${r.code} - ${r.name}', overflow: TextOverflow.ellipsis),
                            );
                          }).toList(),
                          onChanged: (val) {
                            if (val != null) {
                              setState(() => _onRouteChanged(val));
                            }
                          },
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // 2. Pickup Point Selector Card
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceCard,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: const Color(0xFF374151)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          '2. Select Designated Pickup Stop',
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Select your boarding stop along this route corridor.',
                          style: TextStyle(color: AppColors.textSecondary, fontSize: 11),
                        ),
                        const SizedBox(height: 10),
                        DropdownButtonFormField<RouteStopModel>(
                          value: _selectedPickupStop,
                          hint: const Text('No stops available on this route', style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
                          dropdownColor: AppColors.surface,
                          style: const TextStyle(color: Colors.white, fontSize: 13),
                          decoration: const InputDecoration(
                            prefixIcon: Icon(Icons.location_on_rounded, size: 20),
                          ),
                          items: stops.map((s) {
                            final pName = s.pickupPoint?.name ?? 'Stop #${s.sequenceOrder}';
                            final dist = s.pickupPoint?.distanceToCollegeKm ?? 0.0;
                            return DropdownMenuItem(
                              value: s,
                              child: Text(
                                'Stop #${s.sequenceOrder}: $pName (${dist.toStringAsFixed(1)} km)',
                                overflow: TextOverflow.ellipsis,
                              ),
                            );
                          }).toList(),
                          onChanged: (val) {
                            if (val != null) _onPickupChanged(val);
                          },
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // 3. Drop Point Selector Card
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceCard,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: const Color(0xFF374151)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          '3. Select Destination / Drop Point',
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Filtered strictly to stops downstream from your pickup stop.',
                          style: TextStyle(color: AppColors.textSecondary, fontSize: 11),
                        ),
                        const SizedBox(height: 10),
                        DropdownButtonFormField<RouteStopModel>(
                          value: _selectedDropStop,
                          hint: const Text('College Main Campus Terminal', style: TextStyle(color: AppColors.primaryLight, fontSize: 13)),
                          dropdownColor: AppColors.surface,
                          style: const TextStyle(color: Colors.white, fontSize: 13),
                          decoration: const InputDecoration(
                            prefixIcon: Icon(Icons.flag_rounded, size: 20),
                          ),
                          items: dropOptions.map((s) {
                            final pName = s.pickupPoint?.name ?? 'Stop #${s.sequenceOrder}';
                            return DropdownMenuItem(
                              value: s,
                              child: Text(
                                'Stop #${s.sequenceOrder}: $pName',
                                overflow: TextOverflow.ellipsis,
                              ),
                            );
                          }).toList(),
                          onChanged: (val) {
                            if (val != null) setState(() => _selectedDropStop = val);
                          },
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // 4. Available Cabs & Live Stop Progression Card
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceCard,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: const Color(0xFF374151)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              '4. Available Cabs & Trips',
                              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                            Text(
                              '${routeTrips.length} Cabs Scheduled',
                              style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        if (routeTrips.isEmpty)
                          const Padding(
                            padding: EdgeInsets.symmetric(vertical: 12),
                            child: Text(
                              'No scheduled cabs available on this route corridor for today.',
                              style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
                            ),
                          )
                        else
                          ...routeTrips.map((trip) {
                            final eligibility = _evaluateTripEligibility(trip);
                            final isEligible = eligibility.isEligible;
                            final isSelected = _selectedTrip?.id == trip.id;
                            final vehPlate = trip.vehicle?['vehicle_number']?.toString() ??
                                trip.vehicle?['number']?.toString() ??
                                trip.vehicle?['model']?.toString() ??
                                'Shared Shuttle';
                            final driverName = trip.driver?['full_name']?.toString() ??
                                trip.driver?['name']?.toString() ??
                                'Assigned Driver';

                            return GestureDetector(
                              onTap: isEligible ? () => setState(() => _selectedTrip = trip) : null,
                              child: Opacity(
                                opacity: isEligible ? 1.0 : 0.6,
                                child: Container(
                                  margin: const EdgeInsets.only(bottom: 10),
                                  padding: const EdgeInsets.all(14),
                                  decoration: BoxDecoration(
                                    color: isSelected
                                        ? AppColors.primary.withOpacity(0.12)
                                        : AppColors.surface,
                                    borderRadius: BorderRadius.circular(14),
                                    border: Border.all(
                                      color: isSelected
                                          ? AppColors.primary
                                          : const Color(0xFF374151),
                                      width: isSelected ? 1.5 : 1.0,
                                    ),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Row(
                                            children: [
                                              Icon(
                                                trip.tripType == 'MORNING_PICKUP'
                                                    ? Icons.wb_sunny_rounded
                                                    : Icons.nightlight_round,
                                                color: isEligible ? AppColors.primary : AppColors.textMuted,
                                                size: 20,
                                              ),
                                              const SizedBox(width: 10),
                                              Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  Text(
                                                    '$vehPlate • $driverName',
                                                    style: const TextStyle(
                                                      color: Colors.white,
                                                      fontWeight: FontWeight.bold,
                                                      fontSize: 13,
                                                    ),
                                                  ),
                                                  Text(
                                                    '${trip.scheduledDepartureTime} • ${trip.tripType.replaceAll('_', ' ')}',
                                                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 11),
                                                  ),
                                                ],
                                              ),
                                            ],
                                          ),
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                            decoration: BoxDecoration(
                                              color: eligibility.badgeColor.withOpacity(0.15),
                                              borderRadius: BorderRadius.circular(8),
                                            ),
                                            child: Text(
                                              eligibility.badgeText,
                                              style: TextStyle(
                                                color: eligibility.badgeColor,
                                                fontWeight: FontWeight.bold,
                                                fontSize: 10,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                      if (!isEligible) ...[
                                        const SizedBox(height: 6),
                                        Text(
                                          eligibility.reason,
                                          style: const TextStyle(color: AppColors.accentRose, fontSize: 10),
                                        ),
                                      ],
                                    ],
                                  ),
                                ),
                              ),
                            );
                          }),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  ElevatedButton(
                    onPressed: _isBooking || _selectedTrip == null ? null : _handleBookRide,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: _isBooking
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                          )
                        : const Text('Confirm Ride Booking (1 Pass Credit)'),
                  ),
                ],
              ),
            ),
    );
  }
}

class _TripEligibility {
  final bool isEligible;
  final String badgeText;
  final Color badgeColor;
  final String reason;

  _TripEligibility({
    required this.isEligible,
    required this.badgeText,
    required this.badgeColor,
    required this.reason,
  });
}
