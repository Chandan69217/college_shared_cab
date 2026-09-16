import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../../../core/api/api_client.dart';
import '../../../core/theme/app_colors.dart';

class VehicleTrackingScreen extends StatefulWidget {
  const VehicleTrackingScreen({super.key});

  @override
  State<VehicleTrackingScreen> createState() => _VehicleTrackingScreenState();
}

class _VehicleTrackingScreenState extends State<VehicleTrackingScreen> {
  Map<String, dynamic>? _trackingData;
  bool _isLoading = true;
  Timer? _locationPollTimer;
  GoogleMapController? _mapController;
  final Set<Marker> _markers = {};
  final Set<Polyline> _polylines = {};
  bool _isAutoFollow = true;

  Future<void> _fetchTracking() async {
    try {
      final res = await apiClient.get('/students/tracking');
      if (res.data['success'] == true && mounted) {
        final data = res.data['data'];
        setState(() {
          _trackingData = data;
          _isLoading = false;
        });
        _updateMapElements();
      } else {
        if (mounted) setState(() => _isLoading = false);
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _updateMapElements() {
    if (_trackingData == null) return;

    final trip = _trackingData?['trip'];
    final booking = _trackingData?['booking'];
    final pickupPoint = booking?['pickupPoint'];
    final dropPoint = booking?['dropPoint'];
    final college = trip?['college'];

    final markers = <Marker>{};
    final polylinePoints = <LatLng>[];

    // 1. Vehicle Live GPS Marker
    final lat = trip?['liveLatitude'];
    final lng = trip?['liveLongitude'];

    LatLng? vehiclePos;
    if (lat != null && lng != null) {
      vehiclePos = LatLng((lat as num).toDouble(), (lng as num).toDouble());
      markers.add(
        Marker(
          markerId: const MarkerId('live_vehicle'),
          position: vehiclePos,
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueAzure),
          infoWindow: InfoWindow(
            title: trip?['vehicle']?['number'] ?? 'Assigned Cab',
            snippet: 'Driver: ${trip?['driver']?['name'] ?? 'Assigned Driver'}',
          ),
        ),
      );
    }

    // 2. Student's Pickup Point Marker
    if (pickupPoint != null && pickupPoint['latitude'] != null && pickupPoint['longitude'] != null) {
      final pickupPos = LatLng(
        (pickupPoint['latitude'] as num).toDouble(),
        (pickupPoint['longitude'] as num).toDouble(),
      );
      polylinePoints.add(pickupPos);
      markers.add(
        Marker(
          markerId: const MarkerId('student_pickup'),
          position: pickupPos,
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueOrange),
          infoWindow: InfoWindow(
            title: 'Your Pickup: ${pickupPoint['name']}',
            snippet: pickupPoint['address'] ?? '',
          ),
        ),
      );
    }

    // 3. Drop Point / Destination Marker
    if (dropPoint != null && dropPoint['latitude'] != null && dropPoint['longitude'] != null) {
      final dropPos = LatLng(
        (dropPoint['latitude'] as num).toDouble(),
        (dropPoint['longitude'] as num).toDouble(),
      );
      polylinePoints.add(dropPos);
      markers.add(
        Marker(
          markerId: const MarkerId('student_drop'),
          position: dropPos,
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueGreen),
          infoWindow: InfoWindow(
            title: 'Destination: ${dropPoint['name']}',
            snippet: dropPoint['address'] ?? 'Destination',
          ),
        ),
      );
    } else if (college != null && college['latitude'] != null && college['longitude'] != null) {
      final collegePos = LatLng(
        (college['latitude'] as num).toDouble(),
        (college['longitude'] as num).toDouble(),
      );
      polylinePoints.add(collegePos);
      markers.add(
        Marker(
          markerId: const MarkerId('college_destination'),
          position: collegePos,
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueGreen),
          infoWindow: InfoWindow(
            title: college['name'] ?? 'College Campus',
            snippet: 'Campus Destination',
          ),
        ),
      );
    }

    final polylines = <Polyline>{};
    if (polylinePoints.length >= 2) {
      polylines.add(
        Polyline(
          polylineId: const PolylineId('route_path'),
          points: polylinePoints,
          color: AppColors.primary,
          width: 4,
        ),
      );
    }

    setState(() {
      _markers.clear();
      _markers.addAll(markers);
      _polylines.clear();
      _polylines.addAll(polylines);
    });

    // Auto-center camera around vehicle or pickup point
    if (_isAutoFollow && _mapController != null) {
      final target = vehiclePos ?? (polylinePoints.isNotEmpty ? polylinePoints.first : null);
      if (target != null) {
        _mapController!.animateCamera(
          CameraUpdate.newLatLngZoom(target, 14.5),
        );
      }
    }
  }

  @override
  void initState() {
    super.initState();
    _fetchTracking();
    // Controlled fallback polling every 7 seconds for real-time propagation
    _locationPollTimer = Timer.periodic(const Duration(seconds: 7), (_) {
      _fetchTracking();
    });
  }

  @override
  void dispose() {
    _locationPollTimer?.cancel();
    _mapController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final trip = _trackingData?['trip'];
    final booking = _trackingData?['booking'];
    final hasActiveTrip = _trackingData?['hasActiveTrip'] == true;
    final staleStatus = trip?['staleStatus'] ?? 'OFFLINE';

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Track Cab & Live ETA'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () {
              setState(() => _isLoading = true);
              _fetchTracking();
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : !hasActiveTrip && trip == null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.directions_car_outlined, size: 64, color: AppColors.textMuted),
                        const SizedBox(height: 16),
                        const Text(
                          'No Active Commute in Progress',
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _trackingData?['message'] ?? 'Live vehicle tracking will become available when your assigned trip starts.',
                          textAlign: TextAlign.center,
                          style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                )
              : Stack(
                  children: [
                    // FULLSCREEN / BOX GOOGLE MAP
                    Column(
                      children: [
                        Expanded(
                          child: GoogleMap(
                            initialCameraPosition: CameraPosition(
                              target: _markers.isNotEmpty
                                  ? _markers.first.position
                                  : const LatLng(28.6139, 77.2090),
                              zoom: 14.0,
                            ),
                            onMapCreated: (ctrl) {
                              _mapController = ctrl;
                              _updateMapElements();
                            },
                            markers: _markers,
                            polylines: _polylines,
                            myLocationEnabled: false,
                            myLocationButtonEnabled: false,
                            zoomControlsEnabled: false,
                            mapToolbarEnabled: false,
                            onCameraMove: (_) {
                              // User panned manually
                            },
                          ),
                        ),

                        // Bottom telemetry & vehicle details card
                        _buildBottomVehicleCard(trip, booking, staleStatus),
                      ],
                    ),

                    // Top Floating Status Banner & Delay Alert
                    Positioned(
                      top: 16,
                      left: 16,
                      right: 16,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                            decoration: BoxDecoration(
                              color: AppColors.surfaceCard.withOpacity(0.95),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: const Color(0xFF374151)),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.3),
                                  blurRadius: 10,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      width: 10,
                                      height: 10,
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        color: staleStatus == 'LIVE'
                                            ? AppColors.primaryLight
                                            : staleStatus == 'DELAYED'
                                                ? AppColors.accentAmber
                                                : AppColors.accentRose,
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      staleStatus == 'LIVE'
                                          ? 'LIVE GPS TRACKING'
                                          : staleStatus == 'DELAYED'
                                              ? 'SIGNAL DELAYED'
                                              : 'GPS OFFLINE',
                                      style: TextStyle(
                                        color: staleStatus == 'LIVE'
                                            ? AppColors.primaryLight
                                            : staleStatus == 'DELAYED'
                                                ? AppColors.accentAmber
                                                : AppColors.accentRose,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 11,
                                        letterSpacing: 0.5,
                                      ),
                                    ),
                                  ],
                                ),
                                Text(
                                  trip?['etaMinutes'] != null
                                      ? 'ETA ~${trip['etaMinutes']} mins'
                                      : 'ETA unavailable',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 12,
                                    fontFamily: 'monospace',
                                  ),
                                ),
                              ],
                            ),
                          ),
                          if (_trackingData?['latestDelay'] != null) ...[
                            const SizedBox(height: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                              decoration: BoxDecoration(
                                color: AppColors.accentAmber.withOpacity(0.9),
                                borderRadius: BorderRadius.circular(12),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.2),
                                    blurRadius: 6,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.warning_amber_rounded, color: Colors.black87, size: 18),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      'Trip Delayed (+${_trackingData!['latestDelay']['delayMinutes']} mins): ${_trackingData!['latestDelay']['reason']}${_trackingData!['latestDelay']['notes']?.toString().isNotEmpty == true ? ' - ${_trackingData!['latestDelay']['notes']}' : ''}',
                                      style: const TextStyle(
                                        color: Colors.black87,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 11,
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

                    // Floating Re-center FAB
                    Positioned(
                      bottom: 230,
                      right: 16,
                      child: FloatingActionButton.small(
                        backgroundColor: AppColors.surfaceCard,
                        foregroundColor: AppColors.primaryLight,
                        onPressed: () {
                          setState(() => _isAutoFollow = true);
                          _updateMapElements();
                        },
                        child: const Icon(Icons.my_location_rounded),
                      ),
                    ),
                  ],
                ),
    );
  }

  Widget _buildBottomVehicleCard(Map<String, dynamic>? trip, Map<String, dynamic>? booking, String staleStatus) {
    final vehicle = trip?['vehicle'];
    final driver = trip?['driver'];
    final pickup = booking?['pickupPoint'];
    final drop = booking?['dropPoint'];
    final currentSeq = trip?['currentStopSequence'] ?? 0;
    final nextStop = trip?['nextStop'];
    final lastPassedStop = trip?['lastPassedStop'];

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: const BoxDecoration(
        color: AppColors.surfaceCard,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        border: Border(top: BorderSide(color: Color(0xFF374151))),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    vehicle?['number'] ?? 'Cab Vehicle',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                      fontFamily: 'monospace',
                    ),
                  ),
                  Text(
                    '${vehicle?['model'] ?? 'Standard'} • ${trip?['route']?['name'] ?? 'Campus Route'}',
                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFF374151)),
                ),
                child: Column(
                  children: [
                    const Text('Distance', style: TextStyle(color: AppColors.textMuted, fontSize: 9)),
                    Text(
                      trip?['distanceToPickupKm'] != null
                          ? '${(trip!['distanceToPickupKm'] as num).toStringAsFixed(1)} km'
                          : '-- km',
                      style: const TextStyle(
                        color: AppColors.primaryLight,
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                        fontFamily: 'monospace',
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          // Route Stop Progression Banner
          if (currentSeq > 0 || nextStop != null) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFF2D3748)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.alt_route_rounded, size: 14, color: AppColors.primaryLight),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      currentSeq > 0
                          ? 'Passed Stop #$currentSeq (${lastPassedStop?['pickup_point']?['name'] ?? 'Stop'})'
                          : 'Starting route departure',
                      style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600),
                    ),
                  ),
                  if (nextStop != null) ...[
                    Text(
                      'Next: ${nextStop['pickup_point']?['name'] ?? 'Stop #${nextStop['sequence_order']}'}',
                      style: const TextStyle(color: AppColors.accentAmber, fontSize: 10, fontWeight: FontWeight.bold),
                    ),
                  ],
                ],
              ),
            ),
          ],

          const SizedBox(height: 12),
          const Divider(color: Color(0xFF374151), height: 1),
          const SizedBox(height: 12),

          // Pickup & Drop Locations
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.pin_drop_rounded, color: AppColors.primaryLight, size: 16),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Pickup', style: TextStyle(color: AppColors.textMuted, fontSize: 10)),
                              Text(
                                pickup?['name'] ?? 'Designated Stop',
                                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Icon(Icons.flag_rounded, color: AppColors.accentRose, size: 16),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Destination', style: TextStyle(color: AppColors.textMuted, fontSize: 10)),
                              Text(
                                drop?['name'] ?? trip?['college']?['name'] ?? 'Campus Terminal',
                                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              if (driver?['name'] != null) ...[
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    const Text('Driver Captain', style: TextStyle(color: AppColors.textMuted, fontSize: 10)),
                    Text(
                      driver['name'],
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                    ),
                    if (driver['phone'] != null) ...[
                      const SizedBox(height: 2),
                      Text(
                        driver['phone'],
                        style: const TextStyle(color: AppColors.textSecondary, fontSize: 11, fontFamily: 'monospace'),
                      ),
                    ],
                  ],
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}
