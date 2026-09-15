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
  List<PickupPointModel> _pickupPoints = [];
  List<TripModel> _trips = [];
  
  RouteModel? _selectedRoute;
  PickupPointModel? _selectedPickup;
  TripModel? _selectedTrip;
  
  bool _isLoading = true;
  bool _isBooking = false;
  String? _errorMessage;

  Future<void> _loadData() async {
    try {
      final routesRes = await apiClient.get('/catalog/routes');
      final pickupsRes = await apiClient.get('/catalog/pickup-points');
      final tripsRes = await apiClient.get('/trips');

      if (mounted) {
        final List rList = routesRes.data['data'] ?? [];
        final List pList = pickupsRes.data['data'] ?? [];
        final List tList = tripsRes.data['data'] ?? [];

        setState(() {
          _routes = rList.map((r) => RouteModel.fromJson(r)).toList();
          _pickupPoints = pList.map((p) => PickupPointModel.fromJson(p)).toList();
          _trips = tList.map((t) => TripModel.fromJson(t)).toList();

          if (_routes.isNotEmpty) _selectedRoute = _routes.first;
          if (_pickupPoints.isNotEmpty) _selectedPickup = _pickupPoints.first;
          if (_trips.isNotEmpty) _selectedTrip = _trips.first;

          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _handleBookRide() async {
    if (_selectedTrip == null || _selectedPickup == null) {
      setState(() {
        _errorMessage = 'Please select a valid pickup stop and trip slot.';
      });
      return;
    }

    // Check geofence 10km limit
    if (_selectedPickup!.distanceToCollegeKm > 10.0 && !_selectedPickup!.isApproved) {
      setState(() {
        _errorMessage = 'Selected pickup is outside the 10km college service area (${_selectedPickup!.distanceToCollegeKm} km).';
      });
      return;
    }

    setState(() {
      _isBooking = true;
      _errorMessage = null;
    });

    try {
      final res = await apiClient.post('/bookings', data: {
        'trip_id': _selectedTrip!.id,
        'pickup_point_id': _selectedPickup!.id,
      });

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
                  'Seat #${data['booking']?['seat_number'] ?? 1} reserved successfully.',
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Your daily dynamic travel pass with signed QR authentication has been generated.',
                  style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
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

                  // Route Selector Card
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
                          '1. Select Commute Route',
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                        ),
                        const SizedBox(height: 10),
                        DropdownButtonFormField<RouteModel>(
                          value: _selectedRoute,
                          hint: const Text('No active routes found', style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
                          dropdownColor: AppColors.surface,
                          style: const TextStyle(color: Colors.white, fontSize: 13),
                          decoration: const InputDecoration(
                            prefixIcon: Icon(Icons.route_outlined, size: 20),
                          ),
                          items: _routes.map((r) {
                            return DropdownMenuItem(
                              value: r,
                              child: Text(r.name, overflow: TextOverflow.ellipsis),
                            );
                          }).toList(),
                          onChanged: (val) {
                            if (val != null) setState(() => _selectedRoute = val);
                          },
                        ),
                        if (_selectedRoute != null) ...[
                          const SizedBox(height: 8),
                          Text(
                            _selectedRoute!.description ?? '',
                            style: const TextStyle(color: AppColors.textSecondary, fontSize: 11),
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Pickup Point Selector Card
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
                          'Pre-defined pickup locations strictly within 10 km of college campus.',
                          style: TextStyle(color: AppColors.textSecondary, fontSize: 11),
                        ),
                        const SizedBox(height: 10),
                        DropdownButtonFormField<PickupPointModel>(
                          value: _selectedPickup,
                          hint: const Text('No pickup stops found', style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
                          dropdownColor: AppColors.surface,
                          style: const TextStyle(color: Colors.white, fontSize: 13),
                          decoration: const InputDecoration(
                            prefixIcon: Icon(Icons.location_on_outlined, size: 20),
                          ),
                          items: _pickupPoints.map((p) {
                            final isOver = p.distanceToCollegeKm > 10.0;
                            return DropdownMenuItem(
                              value: p,
                              child: Text(
                                '${p.name} (${p.distanceToCollegeKm} km)${isOver ? ' [>10km]' : ''}',
                                overflow: TextOverflow.ellipsis,
                              ),
                            );
                          }).toList(),
                          onChanged: (val) {
                            if (val != null) setState(() => _selectedPickup = val);
                          },
                        ),
                        if (_selectedPickup != null) ...[
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              const Icon(Icons.near_me_outlined, size: 14, color: AppColors.primary),
                              const SizedBox(width: 4),
                              Text(
                                '${_selectedPickup!.distanceToCollegeKm} km from college campus',
                                style: const TextStyle(color: AppColors.primaryLight, fontSize: 11, fontWeight: FontWeight.w600),
                              ),
                            ],
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Available Scheduled Trips & Live Capacity Card
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
                          '3. Trip Slot & Real-Time Capacity',
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                        ),
                        const SizedBox(height: 10),
                        if (_trips.isEmpty)
                          const Padding(
                            padding: EdgeInsets.symmetric(vertical: 12),
                            child: Text(
                              'No scheduled trips available for booking currently.',
                              style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
                            ),
                          )
                        else
                          ..._trips.map((trip) {
                            final isSelected = _selectedTrip?.id == trip.id;
                            final seatsLeft = trip.maxCapacity - trip.bookedSeats;
                            final isFull = seatsLeft <= 0;

                            return GestureDetector(
                              onTap: isFull ? null : () => setState(() => _selectedTrip = trip),
                              child: Container(
                                margin: const EdgeInsets.only(bottom: 10),
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: isSelected
                                      ? AppColors.primary.withOpacity(0.12)
                                      : AppColors.surface,
                                  borderRadius: BorderRadius.circular(14),
                                  border: Border.all(
                                    color: isSelected
                                        ? AppColors.primary
                                        : const Color(0xFF374151),
                                  ),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Row(
                                      children: [
                                        Icon(
                                          trip.tripType == 'MORNING_PICKUP'
                                              ? Icons.wb_sunny_outlined
                                              : Icons.nightlight_round_outlined,
                                          color: AppColors.primary,
                                          size: 20,
                                        ),
                                        const SizedBox(width: 10),
                                        Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              trip.tripType == 'MORNING_PICKUP'
                                                  ? 'Morning Commute (07:30 AM)'
                                                  : 'Evening Return (05:00 PM)',
                                              style: const TextStyle(
                                                color: Colors.white,
                                                fontWeight: FontWeight.bold,
                                                fontSize: 12,
                                              ),
                                            ),
                                            Text(
                                              '${trip.tripDate} • Capacity: ${trip.maxCapacity} Pax',
                                              style: const TextStyle(color: AppColors.textSecondary, fontSize: 10),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: isFull
                                            ? AppColors.accentRose.withOpacity(0.15)
                                            : AppColors.primary.withOpacity(0.15),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Text(
                                        isFull ? 'FULL' : '$seatsLeft SEATS LEFT',
                                        style: TextStyle(
                                          color: isFull ? AppColors.accentRose : AppColors.primaryLight,
                                          fontWeight: FontWeight.bold,
                                          fontSize: 10,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          }).toList(),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  ElevatedButton(
                    onPressed: _isBooking ? null : _handleBookRide,
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
