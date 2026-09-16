import 'package:flutter/material.dart';
import '../../../core/api/api_client.dart';
import '../../../core/models/trip_model.dart';
import '../../../core/services/gps_tracking_service.dart';
import '../../../core/theme/app_colors.dart';
import 'driver_trip_detail_sheet.dart';

class DriverScheduledTripsScreen extends StatefulWidget {
  final int initialTabIndex;
  const DriverScheduledTripsScreen({super.key, this.initialTabIndex = 0});

  @override
  State<DriverScheduledTripsScreen> createState() => _DriverScheduledTripsScreenState();
}

class _DriverScheduledTripsScreenState extends State<DriverScheduledTripsScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;

  List<TripModel> _todayTrips = [];
  List<TripModel> _upcomingTrips = [];
  List<TripModel> _completedTrips = [];

  bool _isLoading = true;
  String? _errorMessage;
  String? _errorType; // 'AUTH', 'NETWORK', 'SERVER'
  final GpsTrackingService _gpsService = GpsTrackingService();
  String? _actionTripId;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this, initialIndex: widget.initialTabIndex);
    _fetchAllTrips();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _fetchAllTrips() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _errorType = null;
    });

    try {
      final res = await apiClient.get('/drivers/trips?filter=ALL');
      if (res.data['success'] == true && mounted) {
        final List list = res.data['data']?['trips'] ?? [];
        final todayStr = res.data['data']?['todayDate'] ??
            DateTime.now().toIso8601String().split('T').first;

        final all = list.map((json) => TripModel.fromJson(json)).toList();

        setState(() {
          _todayTrips = all.where((t) => t.tripDate == todayStr && t.status != 'COMPLETED').toList();
          _upcomingTrips = all.where((t) => t.tripDate.compareTo(todayStr) > 0 && t.status != 'COMPLETED').toList();
          _completedTrips = all.where((t) => t.status == 'COMPLETED' || t.tripDate.compareTo(todayStr) < 0).toList();
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = res.data['message'] ?? 'Unable to load scheduled trips.';
          _errorType = 'SERVER';
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        String msg = ApiClient.getErrorMessage(e);
        String type = 'SERVER';
        if (msg.toLowerCase().contains('unauthorized') || msg.toLowerCase().contains('session') || msg.toLowerCase().contains('login')) {
          type = 'AUTH';
          msg = 'Your session has expired. Please log in again.';
        } else if (msg.toLowerCase().contains('socket') || msg.toLowerCase().contains('connection') || msg.toLowerCase().contains('network')) {
          type = 'NETWORK';
          msg = 'Unable to connect. Please check your internet connection.';
        }

        setState(() {
          _errorMessage = msg;
          _errorType = type;
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _handleStartTrip(TripModel trip) async {
    setState(() => _actionTripId = trip.id);

    final permState = await _gpsService.checkAndRequestPermission();
    if (permState != LocationPermissionState.granted) {
      if (mounted) {
        setState(() => _actionTripId = null);
        _showPermissionAlert(permState);
      }
      return;
    }

    try {
      final res = await apiClient.post('/trips/${trip.id}/start');
      if (res.data['success'] == true) {
        await _gpsService.startTracking(trip.id);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Row(
                children: [
                  Icon(Icons.gps_fixed_rounded, color: Colors.white, size: 20),
                  SizedBox(width: 8),
                  Expanded(child: Text('Trip Started! Live GPS location sharing is active.')),
                ],
              ),
              backgroundColor: AppColors.primary,
            ),
          );
          _fetchAllTrips();
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(ApiClient.getErrorMessage(e)),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _actionTripId = null);
    }
  }

  Future<void> _handleEndTrip(TripModel trip) async {
    setState(() => _actionTripId = trip.id);
    try {
      final res = await apiClient.post('/trips/${trip.id}/end');
      if (res.data['success'] == true) {
        await _gpsService.stopTracking();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Row(
                children: [
                  Icon(Icons.check_circle_rounded, color: Colors.white, size: 20),
                  SizedBox(width: 8),
                  Expanded(child: Text('Trip Completed! GPS tracking stopped.')),
                ],
              ),
              backgroundColor: AppColors.primary,
            ),
          );
          _fetchAllTrips();
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(ApiClient.getErrorMessage(e)),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _actionTripId = null);
    }
  }

  void _showPermissionAlert(LocationPermissionState state) {
    String message = 'Please grant device location access to transmit live vehicle coordinates during active trips.';
    if (state == LocationPermissionState.permanentlyDenied) {
      message = 'Location access is permanently disabled. Please allow location permissions in device settings.';
    }

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surfaceCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Location Access Required', style: TextStyle(color: Colors.white, fontSize: 16)),
        content: Text(message, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Dismiss', style: TextStyle(color: AppColors.textMuted)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Assigned Scheduled Trips'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _fetchAllTrips,
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.primary,
          indicatorWeight: 3,
          labelColor: Colors.white,
          unselectedLabelColor: AppColors.textMuted,
          labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
          tabs: [
            Tab(text: 'TODAY (${_todayTrips.length})'),
            Tab(text: 'UPCOMING (${_upcomingTrips.length})'),
            Tab(text: 'COMPLETED (${_completedTrips.length})'),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : _errorMessage != null
              ? _buildErrorView()
              : TabBarView(
                  controller: _tabController,
                  children: [
                    _buildTripsList(_todayTrips, emptyMessage: 'No scheduled trips for today.'),
                    _buildTripsList(_upcomingTrips, emptyMessage: 'No upcoming scheduled trips found.'),
                    _buildTripsList(_completedTrips, emptyMessage: 'No completed trips found in history.'),
                  ],
                ),
    );
  }

  Widget _buildErrorView() {
    IconData iconData = Icons.error_outline_rounded;
    if (_errorType == 'AUTH') iconData = Icons.lock_outline_rounded;
    if (_errorType == 'NETWORK') iconData = Icons.wifi_off_rounded;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(iconData, color: AppColors.accentRose, size: 48),
            const SizedBox(height: 16),
            Text(
              _errorMessage ?? 'Unable to load assigned scheduled trips.',
              style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            const Text(
              'Pull down to refresh or check your internet connection.',
              style: TextStyle(color: AppColors.textMuted, fontSize: 12),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: _fetchAllTrips,
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
              icon: const Icon(Icons.refresh_rounded, size: 18),
              label: const Text('Try Again'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTripsList(List<TripModel> trips, {required String emptyMessage}) {
    if (trips.isEmpty) {
      return RefreshIndicator(
        onRefresh: _fetchAllTrips,
        color: AppColors.primary,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: [
            SizedBox(height: MediaQuery.of(context).size.height * 0.25),
            Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceCard,
                      shape: BoxShape.circle,
                      border: Border.all(color: const Color(0xFF2D3748)),
                    ),
                    child: const Icon(Icons.alt_route_rounded, color: AppColors.textMuted, size: 36),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    emptyMessage,
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Campus dispatch assignments will appear here automatically.',
                    style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _fetchAllTrips,
      color: AppColors.primary,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: trips.length,
        itemBuilder: (ctx, idx) => _buildTripCard(trips[idx]),
      ),
    );
  }

  Widget _buildTripCard(TripModel trip) {
    final isActionLoading = _actionTripId == trip.id;
    final stopsCount = trip.route?.stops?.length ?? 0;
    final vehicleNumber = trip.vehicle?['vehicle_number'] ?? 'Assigned Vehicle';
    final vehicleModel = trip.vehicle?['model'] ?? 'Fleet Cab';

    Color statusColor = AppColors.accentBlue;
    Color statusBg = AppColors.accentBlue.withOpacity(0.15);
    if (trip.isInProgress) {
      statusColor = AppColors.primaryLight;
      statusBg = AppColors.primary.withOpacity(0.15);
    } else if (trip.isCompleted) {
      statusColor = AppColors.textMuted;
      statusBg = Colors.white.withOpacity(0.08);
    } else if (trip.isCancelled) {
      statusColor = AppColors.accentRose;
      statusBg = AppColors.accentRose.withOpacity(0.15);
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: AppColors.surfaceCard,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: trip.isInProgress ? AppColors.primary.withOpacity(0.4) : const Color(0xFF374151),
          width: trip.isInProgress ? 1.5 : 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Bar
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                          decoration: BoxDecoration(
                            color: statusBg,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            trip.status,
                            style: TextStyle(color: statusColor, fontWeight: FontWeight.bold, fontSize: 11),
                          ),
                        ),
                        const SizedBox(width: 8),
                        if (trip.route?.code != null)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppColors.surface,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              trip.route!.code,
                              style: const TextStyle(color: AppColors.textSecondary, fontSize: 11, fontFamily: 'monospace'),
                            ),
                          ),
                      ],
                    ),
                    Text(
                      '📅 ${trip.tripDate}',
                      style: const TextStyle(color: AppColors.textSecondary, fontSize: 12, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  trip.route?.name ?? 'Transit Route',
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                ),
                const SizedBox(height: 4),
                Text(
                  'Departure: ${trip.scheduledDepartureTime} • ${trip.tripType == 'MORNING_PICKUP' ? 'Morning Pickup' : 'Evening Drop'}',
                  style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                ),

                if (trip.hasDelay) ...[
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppColors.accentAmber.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppColors.accentAmber.withOpacity(0.3)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.access_time_filled_rounded, color: AppColors.accentAmber, size: 16),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            'Delay of +${trip.delayInfo!['delay_minutes']} mins reported (${trip.delayInfo!['reason']})',
                            style: const TextStyle(color: AppColors.accentAmber, fontSize: 11, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),

          const Divider(color: Color(0xFF1F2937), height: 1),

          // Metadata Details (Vehicle, Occupancy, Stops)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Row(
                        children: [
                          const Icon(Icons.directions_car_rounded, color: AppColors.primaryLight, size: 18),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              '$vehicleNumber • $vehicleModel',
                              style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Row(
                      children: [
                        const Icon(Icons.pin_drop_outlined, color: AppColors.accentPurple, size: 16),
                        const SizedBox(width: 4),
                        Text(
                          '$stopsCount Stops',
                          style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 10),

                // Boarding Summary Pill
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFF2D3748)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildSummaryStat('Seats', '${trip.maxCapacity}', Colors.white),
                      _buildSummaryStat('Booked', '${trip.bookedSeats}', AppColors.primaryLight),
                      _buildSummaryStat('Boarded', '${trip.boardedPassengers}', const Color(0xFF10B981)),
                      _buildSummaryStat('Not Boarded', '${trip.notBoardedPassengers}', AppColors.accentAmber),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const Divider(color: Color(0xFF1F2937), height: 1),

          // Footer Action Controls
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => DriverTripDetailSheet.show(
                      context,
                      trip.id,
                      onTripUpdated: _fetchAllTrips,
                    ),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Color(0xFF374151)),
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('View Details', style: TextStyle(color: Colors.white, fontSize: 12)),
                  ),
                ),
                const SizedBox(width: 10),
                if (trip.isScheduled)
                  Expanded(
                    flex: 2,
                    child: ElevatedButton.icon(
                      onPressed: isActionLoading ? null : () => _handleStartTrip(trip),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      icon: isActionLoading
                          ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                          : const Icon(Icons.play_arrow_rounded, size: 18),
                      label: const Text('Start Trip', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                    ),
                  )
                else if (trip.isInProgress)
                  Expanded(
                    flex: 2,
                    child: ElevatedButton.icon(
                      onPressed: isActionLoading ? null : () => _handleEndTrip(trip),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.accentRose,
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      icon: isActionLoading
                          ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Icon(Icons.stop_rounded, size: 18),
                      label: const Text('Complete Trip', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryStat(String label, String value, Color color) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          value,
          style: TextStyle(color: color, fontSize: 13, fontWeight: FontWeight.bold, fontFamily: 'monospace'),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(color: AppColors.textMuted, fontSize: 10),
        ),
      ],
    );
  }
}
