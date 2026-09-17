import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api/api_client.dart';
import '../../../core/models/route_model.dart';
import '../../../core/models/trip_model.dart';
import '../../../core/storage/storage_service.dart';
import '../../../core/services/settings_service.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/app_feedback.dart';

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
  TripModel? _selectedTrip;

  // Commute Shift: 'MORNING_PICKUP' (To College) or 'EVENING_DROP' (From College)
  String _selectedShift = 'MORNING_PICKUP';

  String? _collegeName;
  String? _collegeAddress;
  String? _collegeId;

  // KYC & Subscription Status Guards
  bool _isKycVerified = true;
  String _kycStatus = 'VERIFIED';
  bool _hasActiveSubscription = false;
  int _remainingRides = 0;
  Map<String, dynamic>? _activeSubscription;

  bool _isLoading = true;
  bool _isBooking = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadCollegeInfo();
    _loadData();
  }

  void _loadCollegeInfo() {
    final userData = StorageService.getUserData();
    if (userData != null) {
      final profile = userData['profile'] as Map<String, dynamic>?;
      if (profile != null && profile['verification_status'] != null) {
        _kycStatus = profile['verification_status'].toString().toUpperCase();
        _isKycVerified = (_kycStatus == 'VERIFIED');
      }
      final college = profile?['college'] as Map<String, dynamic>? ??
          userData['college'] as Map<String, dynamic>?;

      if (college != null) {
        _collegeName = college['name']?.toString() ?? 'College Campus';
        _collegeAddress = college['address']?.toString() ?? 'Main Campus Terminal';
        _collegeId = college['id']?.toString() ?? profile?['college_id']?.toString();
      } else if (profile?['college_id'] != null) {
        _collegeId = profile!['college_id'].toString();
      }
    }
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final queryParams = _collegeId != null ? {'college_id': _collegeId} : null;

      // Fetch routes, trips, student dashboard, and settings concurrently
      final results = await Future.wait([
        apiClient.get('/catalog/routes', queryParameters: queryParams).catchError((e) => e),
        apiClient.get('/trips', queryParameters: queryParams).catchError((e) => e),
        apiClient.get('/students/dashboard').catchError((e) => e),
        SettingsService.instance.fetchSettings().catchError((e) => e),
      ]);

      final dynamic routesRes = results[0];
      final dynamic tripsRes = results[1];
      final dynamic dashRes = results[2];

      List<RouteModel> parsedRoutes = [];
      List<TripModel> parsedTrips = [];
      String? loadError;

      String vStatus = _kycStatus;
      bool isKyc = _isKycVerified;
      bool hasSub = _hasActiveSubscription;
      int remRides = _remainingRides;
      Map<String, dynamic>? activeSub = _activeSubscription;

      // 1. Process routes
      if (routesRes is! Exception &&
          routesRes.data != null &&
          routesRes.data['success'] == true) {
        final List rList = routesRes.data['data'] ?? [];
        parsedRoutes = rList
            .map((r) {
              try {
                return RouteModel.fromJson(Map<String, dynamic>.from(r));
              } catch (_) {
                return null;
              }
            })
            .whereType<RouteModel>()
            .where((r) => r.isActive)
            .toList();
      } else if (routesRes is Exception) {
        loadError = ApiClient.getErrorMessage(routesRes);
      }

      // 2. Process trips
      if (tripsRes is! Exception &&
          tripsRes.data != null &&
          tripsRes.data['success'] == true) {
        final List tList = tripsRes.data['data'] ?? [];
        parsedTrips = tList
            .map((t) {
              try {
                return TripModel.fromJson(Map<String, dynamic>.from(t));
              } catch (_) {
                return null;
              }
            })
            .whereType<TripModel>()
            .toList();
      }

      // 3. Process student dashboard (KYC & Subscription Pass)
      if (dashRes is! Exception &&
          dashRes.data != null &&
          dashRes.data['success'] == true) {
        final dashData = dashRes.data['data'] ?? {};
        final profile = dashData['profile'] as Map<String, dynamic>?;
        final sub = dashData['activeSubscription'] as Map<String, dynamic>?;

        if (profile != null && profile['verification_status'] != null) {
          vStatus = profile['verification_status'].toString().toUpperCase();
        }
        isKyc = (vStatus == 'VERIFIED');

        activeSub = sub;
        if (sub != null && sub['status'] == 'ACTIVE' && (sub['remaining_rides'] as num? ?? 0) > 0) {
          hasSub = true;
          remRides = (sub['remaining_rides'] as num).toInt();
        } else {
          hasSub = false;
          remRides = 0;
        }
      }

      if (mounted) {
        // Extract college name from first route if not already loaded from profile
        if ((_collegeName == null || _collegeName == 'College Campus') &&
            parsedRoutes.isNotEmpty &&
            parsedRoutes.first.college != null) {
          _collegeName = parsedRoutes.first.college!['name']?.toString() ?? _collegeName;
          _collegeAddress = parsedRoutes.first.college!['address']?.toString() ?? _collegeAddress;
        }

        setState(() {
          _routes = parsedRoutes;
          _trips = parsedTrips;
          _kycStatus = vStatus;
          _isKycVerified = isKyc;
          _hasActiveSubscription = hasSub;
          _remainingRides = remRides;
          _activeSubscription = activeSub;
          _errorMessage = parsedRoutes.isEmpty && loadError != null ? loadError : null;

          if (_routes.isNotEmpty) {
            final match = _routes.where((r) => r.id == _selectedRoute?.id).firstOrNull;
            _onRouteChanged(match ?? _routes.first);
          } else {
            _selectedRoute = null;
            _selectedPickupStop = null;
            _selectedTrip = null;
          }

          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = ApiClient.getErrorMessage(e);
          _isLoading = false;
        });
      }
    }
  }

  void _onRouteChanged(RouteModel route) {
    _selectedRoute = route;
    _selectedPickupStop = route.stops.isNotEmpty ? route.stops.first : null;
    _autoSelectFirstEligibleTrip();
  }

  void _onPickupChanged(RouteStopModel pickup) {
    setState(() {
      _selectedPickupStop = pickup;
      _autoSelectFirstEligibleTrip();
    });
  }

  void _onShiftChanged(String shift) {
    setState(() {
      _selectedShift = shift;
      _autoSelectFirstEligibleTrip();
    });
  }

  void _autoSelectFirstEligibleTrip() {
    final routeTrips = _trips
        .where((t) => t.routeId == _selectedRoute?.id && t.tripType == _selectedShift)
        .toList();

    TripModel? eligible;
    for (final t in routeTrips) {
      final info = _evaluateTripEligibility(t);
      if (info.isEligible) {
        eligible = t;
        break;
      }
    }
    _selectedTrip = eligible ?? (routeTrips.isNotEmpty ? routeTrips.first : null);
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

    if (trip.status == 'IN_PROGRESS' && _selectedPickupStop != null && _selectedShift == 'MORNING_PICKUP') {
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
          badgeText: '$seatsLeft SEATS • EN ROUTE (STOP #$cabSeq)',
          badgeColor: const Color(0xFF10B981),
          reason: 'Cab is currently active at Stop #$cabSeq and heading to your stop.',
        );
      }
    }

    return _TripEligibility(
      isEligible: true,
      badgeText: '$seatsLeft SEATS AVAILABLE',
      badgeColor: AppColors.primaryLight,
      reason: 'Scheduled departure as planned.',
    );
  }

  Future<void> _handleBookRide() async {
    if (SettingsService.instance.maintenanceMode) {
      setState(() {
        _errorMessage = 'System Maintenance: Ride bookings are temporarily paused by campus transport administration.';
      });
      return;
    }

    if (SettingsService.instance.requireAdminKycApproval && !_isKycVerified) {
      setState(() {
        _errorMessage = 'KYC Verification Required: Your student profile status is $_kycStatus. Please wait for administrative approval before booking rides.';
      });
      return;
    }

    if (!_hasActiveSubscription || _remainingRides <= 0) {
      setState(() {
        _errorMessage = 'Active Commuter Pass Required: You need an active subscription pass with available ride credits to book a ride.';
      });
      return;
    }

    if (_selectedTrip == null || _selectedPickupStop == null) {
      setState(() {
        _errorMessage = 'Please select a designated pickup stop and an available cab trip.';
      });
      return;
    }

    final maxRadius = SettingsService.instance.serviceRadiusKm;
    final pickupPoint = _selectedPickupStop!.pickupPoint;
    if (pickupPoint != null && pickupPoint.distanceToCollegeKm > maxRadius && !pickupPoint.isApproved) {
      setState(() {
        _errorMessage = 'Selected pickup is outside the approved service area (${pickupPoint.distanceToCollegeKm.toStringAsFixed(1)} km > ${maxRadius.toStringAsFixed(1)} km).';
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
      // Find downstream destination stop (defaulting to the final stop on corridor)
      String? dropPointId;
      if (_selectedRoute != null && _selectedRoute!.stops.isNotEmpty) {
        final lastStop = _selectedRoute!.stops.last;
        if (lastStop.sequenceOrder > _selectedPickupStop!.sequenceOrder) {
          dropPointId = lastStop.pickupPointId;
        }
      }

      final payload = {
        'trip_id': _selectedTrip!.id,
        'pickup_point_id': _selectedPickupStop!.pickupPointId,
        if (dropPointId != null) 'drop_point_id': dropPointId,
      };

      final res = await apiClient.post('/bookings', data: payload);

      if (res.data['success'] == true && mounted) {
        final data = res.data['data'];
        final stopName = _selectedPickupStop!.pickupPoint?.name ?? 'Assigned Stop';
        final stopTime = _selectedShift == 'MORNING_PICKUP'
            ? (_selectedPickupStop!.morningPickupTime ?? _selectedRoute?.morningDepartureTime ?? '07:30 AM')
            : (_selectedRoute?.eveningDepartureTime ?? '05:30 PM');

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
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFF374151)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.departure_board_rounded, size: 16, color: AppColors.primary),
                          const SizedBox(width: 6),
                          Text(
                            _selectedShift == 'MORNING_PICKUP' ? 'Morning Shift Commute' : 'Evening Shift Return',
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Boarding Stop: Stop #${_selectedPickupStop!.sequenceOrder} – $stopName',
                        style: const TextStyle(color: Colors.white70, fontSize: 11),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Boarding Time: $stopTime',
                        style: const TextStyle(color: AppColors.primaryLight, fontWeight: FontWeight.w600, fontSize: 11),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Drop: ${_collegeName ?? 'College Main Campus'} Terminal',
                        style: const TextStyle(color: AppColors.textSecondary, fontSize: 11),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 10),
                const Text(
                  'Your daily digital pass with signed QR authentication is ready for scanning.',
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
    final routeTrips = _trips
        .where((t) => t.routeId == _selectedRoute?.id && t.tripType == _selectedShift)
        .toList();
    final stops = _selectedRoute?.stops ?? [];

    final activePickupTime = _selectedShift == 'MORNING_PICKUP'
        ? (_selectedPickupStop?.morningPickupTime ?? _selectedRoute?.morningDepartureTime ?? '07:30 AM')
        : (_selectedPickupStop?.eveningDropTime ?? _selectedRoute?.eveningDepartureTime ?? '05:30 PM');

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Book College Shared Ride'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            tooltip: 'Refresh Active Routes',
            onPressed: _loadData,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : RefreshIndicator(
              onRefresh: _loadData,
              color: AppColors.primary,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Institution Context Banner
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            const Color(0xFF064E3B),
                            AppColors.surfaceCard,
                          ],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.primary.withOpacity(0.3)),
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withOpacity(0.2),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.school_rounded, color: AppColors.primaryLight, size: 22),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  _collegeName ?? 'Campus Commuter Portal',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 13,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  _collegeAddress ?? 'Admin-configured corridor transport network',
                                  style: const TextStyle(
                                    color: AppColors.textSecondary,
                                    fontSize: 11,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // System Maintenance Guard Banner
                    if (SettingsService.instance.maintenanceMode) ...[
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: AppColors.accentRose.withOpacity(0.12),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: AppColors.accentRose.withOpacity(0.5),
                            width: 1.5,
                          ),
                        ),
                        child: const Row(
                          children: [
                            Icon(Icons.construction_rounded, color: AppColors.accentRose, size: 28),
                            SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'System Maintenance in Progress',
                                    style: TextStyle(
                                      color: AppColors.accentRose,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 13,
                                    ),
                                  ),
                                  SizedBox(height: 2),
                                  Text(
                                    'Seat reservations are temporarily paused by campus transport administration. Please check back shortly.',
                                    style: TextStyle(color: Colors.white70, fontSize: 11),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],

                    // KYC Verification Guard Banner
                    if (SettingsService.instance.requireAdminKycApproval && !_isKycVerified) ...[
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: AppColors.accentAmber.withOpacity(0.12),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: AppColors.accentAmber.withOpacity(0.4),
                            width: 1.5,
                          ),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.shield_outlined, color: AppColors.accentAmber, size: 28),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'Student KYC Verification Required',
                                    style: TextStyle(
                                      color: AppColors.accentAmber,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 13,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    'Your identity verification is currently $_kycStatus. Seat booking is enabled once your student profile is approved by the campus transport administrator.',
                                    style: const TextStyle(color: Colors.white70, fontSize: 11),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                    ] else if (!_hasActiveSubscription) ...[
                      // Active Subscription Guard Banner
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceCard,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(
                            color: AppColors.accentPurple.withOpacity(0.4),
                            width: 1.5,
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: AppColors.accentPurple.withOpacity(0.2),
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(Icons.confirmation_number_outlined, color: AppColors.accentPurple, size: 22),
                                ),
                                const SizedBox(width: 10),
                                const Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'Active Commuter Pass Required',
                                        style: TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.bold,
                                          fontSize: 13,
                                        ),
                                      ),
                                      SizedBox(height: 2),
                                      Text(
                                        'You need an active subscription pass with available ride credits to book a seat.',
                                        style: TextStyle(color: AppColors.textSecondary, fontSize: 11),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            ElevatedButton.icon(
                              onPressed: () => context.push('/student/plans'),
                              icon: const Icon(Icons.shopping_bag_outlined, size: 16),
                              label: const Text('Browse & Purchase Commuter Pass', style: TextStyle(fontSize: 12)),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.accentPurple,
                                minimumSize: const Size.fromHeight(38),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                    ] else ...[
                      // Active subscription banner
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withOpacity(0.12),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: AppColors.primary.withOpacity(0.3)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.verified_rounded, color: AppColors.primaryLight, size: 18),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                'Active Pass: ${_activeSubscription?['plan']?['name'] ?? 'Commuter Membership'} • $_remainingRides rides remaining',
                                style: const TextStyle(
                                  color: AppColors.primaryLight,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12,
                                ),
                              ),
                            ),
                            Text(
                              'Verified Student',
                              style: TextStyle(color: AppColors.textSecondary.withOpacity(0.8), fontSize: 10),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],

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
                            IconButton(
                              icon: const Icon(Icons.refresh, size: 16, color: AppColors.accentRose),
                              onPressed: _loadData,
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],

                    // Empty Routes State Banner
                    if (_routes.isEmpty) ...[
                      Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceCard,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(color: const Color(0xFF374151)),
                        ),
                        child: Column(
                          children: [
                            const Icon(Icons.alt_route_rounded, color: AppColors.textMuted, size: 48),
                            const SizedBox(height: 12),
                            const Text(
                              'No Active Commute Routes Found',
                              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              'There are currently no active routes configured for ${_collegeName ?? 'your college'}. Please check back soon or contact transport administration.',
                              textAlign: TextAlign.center,
                              style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                            ),
                            const SizedBox(height: 16),
                            ElevatedButton.icon(
                              onPressed: _loadData,
                              icon: const Icon(Icons.refresh_rounded, size: 18),
                              label: const Text('Refresh Routes'),
                            ),
                          ],
                        ),
                      ),
                    ] else ...[
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
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text(
                                  '1. Select Corridor Route',
                                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: AppColors.primary.withOpacity(0.15),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    '${_routes.length} Active Corridors',
                                    style: const TextStyle(color: AppColors.primaryLight, fontSize: 10, fontWeight: FontWeight.bold),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 10),
                            DropdownButtonFormField<RouteModel>(
                              value: _selectedRoute,
                              hint: const Text('Select a corridor route', style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
                              dropdownColor: AppColors.surface,
                              style: const TextStyle(color: Colors.white, fontSize: 13),
                              decoration: const InputDecoration(
                                prefixIcon: Icon(Icons.alt_route_rounded, size: 20),
                              ),
                              items: _routes.map((r) {
                                final stopInfo = r.stops.isNotEmpty ? ' (${r.stops.length} stops)' : '';
                                return DropdownMenuItem<RouteModel>(
                                  value: r,
                                  child: Text(
                                    '${r.code} • ${r.name}$stopInfo',
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                );
                              }).toList(),
                              onChanged: (val) {
                                if (val != null) {
                                  setState(() => _onRouteChanged(val));
                                }
                              },
                            ),
                            if (_selectedRoute != null) ...[
                              const SizedBox(height: 10),
                              Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: AppColors.surface,
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Row(
                                      children: [
                                        const Icon(Icons.wb_sunny_outlined, size: 14, color: AppColors.accentAmber),
                                        const SizedBox(width: 4),
                                        Text(
                                          'Morning: ${_selectedRoute!.morningDepartureTime.isNotEmpty ? _selectedRoute!.morningDepartureTime : "07:30 AM"}',
                                          style: const TextStyle(color: Colors.white70, fontSize: 11),
                                        ),
                                      ],
                                    ),
                                    Row(
                                      children: [
                                        const Icon(Icons.nightlight_outlined, size: 14, color: AppColors.accentBlue),
                                        const SizedBox(width: 4),
                                        Text(
                                          'Evening: ${_selectedRoute!.eveningDepartureTime.isNotEmpty ? _selectedRoute!.eveningDepartureTime : "05:30 PM"}',
                                          style: const TextStyle(color: Colors.white70, fontSize: 11),
                                        ),
                                      ],
                                    ),
                                    Text(
                                      '~${_selectedRoute!.estimatedDurationMins} min',
                                      style: const TextStyle(color: AppColors.primaryLight, fontSize: 11, fontWeight: FontWeight.bold),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),

                      // 2. Pickup Point & Scheduled Pickup Time Card
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
                              'Choose your boarding stop defined along this college corridor.',
                              style: TextStyle(color: AppColors.textSecondary, fontSize: 11),
                            ),
                            const SizedBox(height: 10),
                            DropdownButtonFormField<RouteStopModel>(
                              value: _selectedPickupStop,
                              hint: Text(
                                stops.isEmpty ? 'No stops available on this corridor' : 'Select your pickup stop',
                                style: const TextStyle(color: AppColors.textMuted, fontSize: 13),
                              ),
                              dropdownColor: AppColors.surface,
                              style: const TextStyle(color: Colors.white, fontSize: 13),
                              decoration: const InputDecoration(
                                prefixIcon: Icon(Icons.location_on_rounded, size: 20),
                              ),
                              items: stops.map((s) {
                                final pName = s.pickupPoint?.name ?? 'Stop #${s.sequenceOrder}';
                                final dist = s.pickupPoint?.distanceToCollegeKm ?? 0.0;
                                return DropdownMenuItem<RouteStopModel>(
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
                            if (_selectedPickupStop != null) ...[
                              const SizedBox(height: 10),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                decoration: BoxDecoration(
                                  color: AppColors.primary.withOpacity(0.12),
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(color: AppColors.primary.withOpacity(0.3)),
                                ),
                                child: Row(
                                  children: [
                                    const Icon(Icons.access_time_filled_rounded, size: 16, color: AppColors.primaryLight),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        'Scheduled Pickup Time: $activePickupTime',
                                        style: const TextStyle(
                                          color: AppColors.primaryLight,
                                          fontWeight: FontWeight.bold,
                                          fontSize: 12,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),

                      // 3. Shift Direction Selector (Morning Pickup vs Evening Return)
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
                              '3. Select Commute Shift',
                              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                            const SizedBox(height: 4),
                            const Text(
                              'Select morning ride to campus or evening return ride.',
                              style: TextStyle(color: AppColors.textSecondary, fontSize: 11),
                            ),
                            const SizedBox(height: 10),
                            Row(
                              children: [
                                Expanded(
                                  child: GestureDetector(
                                    onTap: () => _onShiftChanged('MORNING_PICKUP'),
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
                                      decoration: BoxDecoration(
                                        color: _selectedShift == 'MORNING_PICKUP'
                                            ? AppColors.primary.withOpacity(0.2)
                                            : AppColors.surface,
                                        borderRadius: BorderRadius.circular(12),
                                        border: Border.all(
                                          color: _selectedShift == 'MORNING_PICKUP'
                                              ? AppColors.primary
                                              : const Color(0xFF374151),
                                          width: _selectedShift == 'MORNING_PICKUP' ? 1.5 : 1.0,
                                        ),
                                      ),
                                      child: Column(
                                        children: [
                                          Icon(
                                            Icons.wb_sunny_rounded,
                                            size: 20,
                                            color: _selectedShift == 'MORNING_PICKUP'
                                                ? AppColors.primaryLight
                                                : AppColors.textMuted,
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            'Morning Commute',
                                            style: TextStyle(
                                              color: _selectedShift == 'MORNING_PICKUP'
                                                  ? Colors.white
                                                  : AppColors.textSecondary,
                                              fontWeight: FontWeight.bold,
                                              fontSize: 11,
                                            ),
                                          ),
                                          Text(
                                            'To Campus',
                                            style: TextStyle(
                                              color: _selectedShift == 'MORNING_PICKUP'
                                                  ? AppColors.primaryLight
                                                  : AppColors.textMuted,
                                              fontSize: 10,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Opacity(
                                    opacity: SettingsService.instance.allowRoundTripBooking ? 1.0 : 0.4,
                                    child: GestureDetector(
                                      onTap: SettingsService.instance.allowRoundTripBooking
                                          ? () => _onShiftChanged('EVENING_DROP')
                                          : () {
                                              AppFeedback.showInfo(
                                                context,
                                                'Evening return trips are currently disabled by campus transport administration.',
                                              );
                                            },
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
                                        decoration: BoxDecoration(
                                          color: _selectedShift == 'EVENING_DROP'
                                              ? AppColors.accentBlue.withOpacity(0.2)
                                              : AppColors.surface,
                                          borderRadius: BorderRadius.circular(12),
                                          border: Border.all(
                                            color: _selectedShift == 'EVENING_DROP'
                                                ? AppColors.accentBlue
                                                : const Color(0xFF374151),
                                            width: _selectedShift == 'EVENING_DROP' ? 1.5 : 1.0,
                                          ),
                                        ),
                                        child: Column(
                                          children: [
                                            Icon(
                                              Icons.nightlight_round,
                                              size: 20,
                                              color: _selectedShift == 'EVENING_DROP'
                                                  ? AppColors.accentBlue
                                                  : AppColors.textMuted,
                                            ),
                                            const SizedBox(height: 4),
                                            Text(
                                              'Evening Return',
                                              style: TextStyle(
                                                color: _selectedShift == 'EVENING_DROP'
                                                    ? Colors.white
                                                    : AppColors.textSecondary,
                                                fontWeight: FontWeight.bold,
                                                fontSize: 11,
                                              ),
                                            ),
                                            Text(
                                              SettingsService.instance.allowRoundTripBooking ? 'From Campus' : 'Disabled',
                                              style: TextStyle(
                                                color: _selectedShift == 'EVENING_DROP'
                                                    ? AppColors.accentBlue
                                                    : AppColors.textMuted,
                                                fontSize: 10,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),

                      // 4. Scheduled Vehicle Runs for Shift
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
                                  '4. Select Scheduled Cab Run',
                                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: AppColors.primary.withOpacity(0.15),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    '${routeTrips.length} Runs Available',
                                    style: const TextStyle(color: AppColors.primaryLight, fontSize: 10, fontWeight: FontWeight.bold),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 10),
                            if (routeTrips.isEmpty)
                              Padding(
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                child: Row(
                                  children: [
                                    const Icon(Icons.info_outline, size: 16, color: AppColors.textMuted),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        'No scheduled ${_selectedShift == "MORNING_PICKUP" ? "morning" : "evening"} cabs found for this route today.',
                                        style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                                      ),
                                    ),
                                  ],
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
                                                        'Departure: ${trip.scheduledDepartureTime}',
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

                      Builder(
                        builder: (context) {
                          final isMaintenance = SettingsService.instance.maintenanceMode;
                          final kycBlocked = SettingsService.instance.requireAdminKycApproval && !_isKycVerified;
                          final subBlocked = !_hasActiveSubscription;
                          final isDisabled = isMaintenance || kycBlocked || subBlocked || _selectedTrip == null || _isBooking;

                          return ElevatedButton(
                            onPressed: isDisabled
                                ? (!isMaintenance && (kycBlocked || subBlocked)
                                    ? () {
                                        if (kycBlocked) {
                                          setState(() => _errorMessage = 'KYC Verification Required: Student profile status is $_kycStatus.');
                                        } else if (subBlocked) {
                                          context.push('/student/plans');
                                        }
                                      }
                                    : null)
                                : _handleBookRide,
                            style: ElevatedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              backgroundColor: (isMaintenance || kycBlocked || subBlocked)
                                  ? const Color(0xFF374151)
                                  : AppColors.primary,
                            ),
                            child: _isBooking
                                ? const SizedBox(
                                    height: 20,
                                    width: 20,
                                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                  )
                                : Text(
                                    isMaintenance
                                        ? 'Bookings Paused for System Maintenance'
                                        : kycBlocked
                                            ? 'KYC Verification Required to Book'
                                            : subBlocked
                                                ? 'Purchase Commuter Pass to Book'
                                                : 'Confirm Ride Booking (1 Pass Credit)',
                                    style: TextStyle(
                                      color: (isMaintenance || kycBlocked || subBlocked)
                                          ? Colors.white70
                                          : Colors.black,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                          );
                        },
                      ),
                    ],
                  ],
                ),
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
