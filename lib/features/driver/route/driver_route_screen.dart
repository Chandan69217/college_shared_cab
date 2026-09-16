import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../../../core/api/api_client.dart';
import '../../../core/services/gps_tracking_service.dart';
import '../../../core/theme/app_colors.dart';

class DriverRouteScreen extends StatefulWidget {
  const DriverRouteScreen({super.key});

  @override
  State<DriverRouteScreen> createState() => _DriverRouteScreenState();
}

class _DriverRouteScreenState extends State<DriverRouteScreen> {
  Map<String, dynamic>? _routeData;
  bool _isLoading = true;
  GoogleMapController? _mapController;
  final Set<Marker> _markers = {};
  final Set<Polyline> _polylines = {};
  final GpsTrackingService _gpsService = GpsTrackingService();

  Future<void> _fetchRouteAndMap() async {
    try {
      final dashRes = await apiClient.get('/drivers/dashboard');
      if (dashRes.data['success'] == true && mounted) {
        final activeTrip = dashRes.data['data']?['activeTrip'];
        final routeId = activeTrip?['route_id'] ?? activeTrip?['route']?['id'];

        if (routeId != null) {
          final mapRes = await apiClient.get('/catalog/routes/$routeId/map');
          if (mapRes.data['success'] == true && mounted) {
            setState(() {
              _routeData = mapRes.data['data'];
              _isLoading = false;
            });
            _buildMapElements();
            return;
          }
        }
      }

      // Fallback to first catalog route if no active trip
      final catRes = await apiClient.get('/catalog/routes');
      if (catRes.data['success'] == true && mounted) {
        final List list = catRes.data['data'] ?? [];
        if (list.isNotEmpty) {
          final mapRes = await apiClient.get('/catalog/routes/${list.first['id']}/map');
          if (mapRes.data['success'] == true && mounted) {
            setState(() {
              _routeData = mapRes.data['data'];
              _isLoading = false;
            });
            _buildMapElements();
            return;
          }
        }
      }

      if (mounted) setState(() => _isLoading = false);
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _buildMapElements() {
    if (_routeData == null) return;

    final markers = <Marker>{};
    final polylineCoords = <LatLng>[];

    final stops = _routeData?['stops'] as List? ?? [];
    for (final s in stops) {
      final pickup = s['pickupPoint'];
      if (pickup != null && pickup['latitude'] != null && pickup['longitude'] != null) {
        final pos = LatLng(
          (pickup['latitude'] as num).toDouble(),
          (pickup['longitude'] as num).toDouble(),
        );
        polylineCoords.add(pos);
        markers.add(
          Marker(
            markerId: MarkerId('stop_${s['id']}'),
            position: pos,
            icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueCyan),
            infoWindow: InfoWindow(
              title: 'Stop #${s['sequenceOrder']}: ${pickup['name']}',
              snippet: 'Time: ${s['morningPickupTime'] ?? ''} • ${pickup['address'] ?? ''}',
            ),
          ),
        );
      }
    }

    final college = _routeData?['college'];
    if (college != null && college['latitude'] != null && college['longitude'] != null) {
      final collegePos = LatLng(
        (college['latitude'] as num).toDouble(),
        (college['longitude'] as num).toDouble(),
      );
      polylineCoords.add(collegePos);
      markers.add(
        Marker(
          markerId: const MarkerId('college_destination'),
          position: collegePos,
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueViolet),
          infoWindow: InfoWindow(
            title: college['name'] ?? 'College Campus',
            snippet: 'Destination Service Hub',
          ),
        ),
      );
    }

    // Add Driver's live GPS marker if available
    final gps = _gpsService.currentStatus;
    if (gps.lastLatitude != null && gps.lastLongitude != null) {
      markers.add(
        Marker(
          markerId: const MarkerId('driver_live_gps'),
          position: LatLng(gps.lastLatitude!, gps.lastLongitude!),
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueYellow),
          infoWindow: const InfoWindow(
            title: 'Your Live Vehicle GPS',
            snippet: 'Transmitting from phone GPS sensor',
          ),
        ),
      );
    }

    final polylines = <Polyline>{};
    if (polylineCoords.length >= 2) {
      polylines.add(
        Polyline(
          polylineId: const PolylineId('route_polyline'),
          points: polylineCoords,
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

    if (polylineCoords.isNotEmpty && _mapController != null) {
      _mapController!.animateCamera(
        CameraUpdate.newLatLngZoom(polylineCoords.first, 13.5),
      );
    }
  }

  @override
  void initState() {
    super.initState();
    _fetchRouteAndMap();
  }

  @override
  Widget build(BuildContext context) {
    final stops = _routeData?['stops'] as List? ?? [];
    final college = _routeData?['college'];

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Assigned Route & Sequential Stops'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () {
              setState(() => _isLoading = true);
              _fetchRouteAndMap();
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : _routeData == null
              ? const Center(
                  child: Text(
                    'No route map data available.',
                    style: TextStyle(color: AppColors.textSecondary),
                  ),
                )
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Header Details
                      Text(
                        _routeData?['name'] ?? 'Assigned Route',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Morning: ${_routeData?['morningDepartureTime'] ?? '07:30 AM'} • Evening: ${_routeData?['eveningDepartureTime'] ?? '05:00 PM'} • Code: ${_routeData?['code'] ?? 'R-01'}',
                        style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                      ),
                      const SizedBox(height: 16),

                      // Interactive Google Map View
                      Container(
                        height: 240,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: const Color(0xFF374151)),
                        ),
                        clipBehavior: Clip.antiAlias,
                        child: _markers.isEmpty
                            ? Container(
                                color: const Color(0xFF0F172A),
                                child: const Center(
                                  child: Text('Loading route stops on map...', style: TextStyle(color: AppColors.textSecondary)),
                                ),
                              )
                            : GoogleMap(
                                initialCameraPosition: CameraPosition(
                                  target: _markers.first.position,
                                  zoom: 13.0,
                                ),
                                onMapCreated: (ctrl) {
                                  _mapController = ctrl;
                                },
                                markers: _markers,
                                polylines: _polylines,
                                myLocationEnabled: true,
                                myLocationButtonEnabled: false,
                                zoomControlsEnabled: false,
                                mapToolbarEnabled: false,
                              ),
                      ),
                      const SizedBox(height: 20),

                      const Text(
                        'Sequential Route Stops',
                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                      const SizedBox(height: 10),

                      // Dynamic Stop Steps
                      if (stops.isEmpty)
                        const Text('No pickup stops configured on this route.', style: TextStyle(color: AppColors.textMuted, fontSize: 12))
                      else
                        ...stops.map((s) {
                          final pickup = s['pickupPoint'];
                          return _buildStopStep(
                            seq: s['sequenceOrder'] ?? 1,
                            title: pickup?['name'] ?? 'Pickup Stop',
                            time: s['morningPickupTime'] ?? '07:30 AM',
                            landmark: pickup?['address'] ?? pickup?['landmark'] ?? 'Campus Stop',
                          );
                        }),

                      if (college != null)
                        _buildStopStep(
                          seq: stops.length + 1,
                          title: college['name'] ?? 'College Campus Destination',
                          time: _routeData?['eveningDepartureTime'] ?? 'Campus End',
                          landmark: 'Destination Campus Hub (${college['serviceRadiusKm'] ?? 10} km radius)',
                          isDestination: true,
                        ),
                    ],
                  ),
                ),
    );
  }

  Widget _buildStopStep({
    required int seq,
    required String title,
    required String time,
    required String landmark,
    bool isDone = false,
    bool isCurrent = false,
    bool isDestination = false,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isCurrent ? AppColors.primary.withOpacity(0.12) : AppColors.surfaceCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isCurrent ? AppColors.primary : const Color(0xFF374151),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 30,
            height: 30,
            decoration: BoxDecoration(
              color: isDestination
                  ? AppColors.accentPurple
                  : isDone
                      ? AppColors.primary
                      : isCurrent
                          ? AppColors.accentAmber
                          : const Color(0xFF374151),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                isDestination ? '★' : '$seq',
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        title,
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                    ),
                    Text(
                      time,
                      style: const TextStyle(
                        color: AppColors.primaryLight,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                        fontFamily: 'monospace',
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 2),
                Text(landmark, style: const TextStyle(color: AppColors.textSecondary, fontSize: 11)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
