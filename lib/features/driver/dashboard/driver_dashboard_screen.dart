import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/services/gps_tracking_service.dart';
import '../../../core/theme/app_colors.dart';
import '../../auth/providers/auth_provider.dart';
import '../trips/driver_scheduled_trips_screen.dart';
import '../trips/driver_trip_detail_sheet.dart';

class DriverDashboardScreen extends ConsumerStatefulWidget {
  final Function(int)? onNavigateTab;
  const DriverDashboardScreen({super.key, this.onNavigateTab});

  @override
  ConsumerState<DriverDashboardScreen> createState() => _DriverDashboardScreenState();
}

class _DriverDashboardScreenState extends ConsumerState<DriverDashboardScreen>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  Map<String, dynamic>? _dashboardData;
  bool _isLoading = true;
  bool _isActionLoading = false;
  final GpsTrackingService _gpsService = GpsTrackingService();

  Future<void> _fetchDashboard({bool isInitial = false}) async {
    if (isInitial && _dashboardData == null) {
      if (mounted) setState(() => _isLoading = true);
    }
    try {
      final res = await apiClient.get('/drivers/dashboard');
      if (res.data['success'] == true && mounted) {
        final data = res.data['data'];
        setState(() {
          _dashboardData = data;
          _isLoading = false;
        });

        // Resume background tracking if active trip is in progress
        final activeTrip = data?['activeTrip'];
        if (activeTrip != null &&
            activeTrip['status'] == 'IN_PROGRESS' &&
            !_gpsService.currentStatus.isTracking) {
          _gpsService.startTracking(activeTrip['id']);
        }
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  void initState() {
    super.initState();
    _fetchDashboard(isInitial: true);
  }

  Future<void> _handleStartTrip(String tripId) async {
    setState(() => _isActionLoading = true);

    // 1. Request GPS Permission first
    final permState = await _gpsService.checkAndRequestPermission();
    if (permState != LocationPermissionState.granted) {
      if (mounted) {
        setState(() => _isActionLoading = false);
        _showPermissionDialog(permState);
      }
      return;
    }

    try {
      final res = await apiClient.post('/trips/$tripId/start');
      if (res.data['success'] == true) {
        // 2. Start Live GPS Tracking Stream
        await _gpsService.startTracking(tripId);

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
          _fetchDashboard();
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
      if (mounted) setState(() => _isActionLoading = false);
    }
  }

  Future<void> _handleEndTrip(String tripId) async {
    setState(() => _isActionLoading = true);
    try {
      final res = await apiClient.post('/trips/$tripId/end');
      if (res.data['success'] == true) {
        // Stop GPS Tracking
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
          _fetchDashboard();
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
      if (mounted) setState(() => _isActionLoading = false);
    }
  }

  void _showPermissionDialog(LocationPermissionState state) {
    String title = 'Location Permission Required';
    String message = 'Please grant device location access to transmit your real vehicle coordinates during the active trip.';

    if (state == LocationPermissionState.serviceDisabled) {
      title = 'Device GPS Disabled';
      message = 'Please turn on GPS / Location Services in your phone quick settings.';
    } else if (state == LocationPermissionState.permanentlyDenied) {
      title = 'Permission Permanently Denied';
      message = 'Location access is permanently blocked. Please open App Settings and allow location permissions.';
    }

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surfaceCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            const Icon(Icons.location_off_rounded, color: AppColors.accentRose, size: 24),
            const SizedBox(width: 8),
            Text(title, style: const TextStyle(color: Colors.white, fontSize: 16)),
          ],
        ),
        content: Text(message, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: AppColors.textMuted)),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              await _gpsService.checkAndRequestPermission();
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
            child: const Text('Try Again'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final driver = ref.watch(authProvider).user;
    final activeTrip = _dashboardData?['activeTrip'];
    final tripStatus = activeTrip?['status'] ?? 'SCHEDULED';
    final isInProgress = tripStatus == 'IN_PROGRESS';

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Captain ${driver?.fullName.split(' ').first ?? 'Driver'} 🚖',
              style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
            ),
            const Text(
              'Campus Fleet Operations Console',
              style: TextStyle(fontSize: 11, color: AppColors.textSecondary),
            ),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : RefreshIndicator(
              onRefresh: _fetchDashboard,
              color: AppColors.primary,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Active Duty Banner
                    Container(
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: isInProgress
                              ? [const Color(0xFF064E3B), AppColors.surfaceCard]
                              : [const Color(0xFF1E293B), AppColors.surfaceCard],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(22),
                        border: Border.all(
                          color: isInProgress
                              ? AppColors.primary.withOpacity(0.5)
                              : const Color(0xFF374151),
                          width: isInProgress ? 1.5 : 1,
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
                                    Icons.fiber_manual_record,
                                    size: 14,
                                    color: isInProgress ? AppColors.primaryLight : AppColors.accentBlue,
                                  ),
                                  const SizedBox(width: 6),
                                  Text(
                                    activeTrip == null
                                        ? 'NO ACTIVE ASSIGNMENT'
                                        : isInProgress
                                            ? 'TRIP IN PROGRESS'
                                            : 'SCHEDULED NEXT TRIP',
                                    style: TextStyle(
                                      color: isInProgress ? AppColors.primaryLight : AppColors.accentBlue,
                                      fontWeight: FontWeight.w900,
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                              if (activeTrip?['vehicle']?['vehicle_number'] != null)
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: AppColors.surface,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    activeTrip!['vehicle']['vehicle_number'],
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 11,
                                      fontFamily: 'monospace',
                                    ),
                                  ),
                                ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Text(
                            activeTrip?['route']?['name'] ?? 'No Active Route Assigned',
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 15,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            activeTrip != null
                                ? 'Departure: ${activeTrip['scheduled_departure_time'] ?? 'Pending'} • Capacity: ${activeTrip['max_capacity'] ?? 6} Pax'
                                : 'Awaiting dispatch assignment from campus fleet admin.',
                            style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                          ),
                          const SizedBox(height: 16),

                          // Passenger counters bar
                          Row(
                            children: [
                              Expanded(
                                child: Container(
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(
                                    color: AppColors.surface,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Column(
                                    children: [
                                      const Text('Booked Pax', style: TextStyle(color: AppColors.textMuted, fontSize: 10)),
                                      const SizedBox(height: 2),
                                      Text(
                                        '${activeTrip?['booked_seats'] ?? 0}',
                                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Container(
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(
                                    color: AppColors.surface,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Column(
                                    children: [
                                      const Text('Boarded', style: TextStyle(color: AppColors.primaryLight, fontSize: 10)),
                                      const SizedBox(height: 2),
                                      Text(
                                        '${activeTrip?['boarded_passengers'] ?? 0}',
                                        style: const TextStyle(color: AppColors.primaryLight, fontWeight: FontWeight.bold, fontSize: 16),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Container(
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(
                                    color: AppColors.surface,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Column(
                                    children: [
                                      const Text('Capacity', style: TextStyle(color: AppColors.textMuted, fontSize: 10)),
                                      const SizedBox(height: 2),
                                      Text(
                                        '${activeTrip?['max_capacity'] ?? 6}',
                                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),

                          // Start / End Trip Controls
                          if (activeTrip != null) ...[
                            Row(
                              children: [
                                Expanded(
                                  child: OutlinedButton.icon(
                                    onPressed: () => DriverTripDetailSheet.show(
                                      context,
                                      activeTrip['id'],
                                      onTripUpdated: () => _fetchDashboard(),
                                    ),
                                    style: OutlinedButton.styleFrom(
                                      side: const BorderSide(color: Color(0xFF4B5563)),
                                      padding: const EdgeInsets.symmetric(vertical: 11),
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                    ),
                                    icon: const Icon(Icons.info_outline_rounded, color: Colors.white, size: 18),
                                    label: const Text('View Details', style: TextStyle(color: Colors.white, fontSize: 12)),
                                  ),
                                ),
                                const SizedBox(width: 10),
                                if (tripStatus == 'SCHEDULED')
                                  Expanded(
                                    flex: 2,
                                    child: ElevatedButton.icon(
                                      onPressed: _isActionLoading ? null : () => _handleStartTrip(activeTrip['id']),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: AppColors.primary,
                                        padding: const EdgeInsets.symmetric(vertical: 11),
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                      ),
                                      icon: _isActionLoading
                                          ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                                          : const Icon(Icons.play_arrow_rounded, size: 20),
                                      label: const Text('Start Trip', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                                    ),
                                  )
                                else if (tripStatus == 'IN_PROGRESS')
                                  Expanded(
                                    flex: 2,
                                    child: ElevatedButton.icon(
                                      onPressed: _isActionLoading ? null : () => _handleEndTrip(activeTrip['id']),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: AppColors.accentRose,
                                        padding: const EdgeInsets.symmetric(vertical: 11),
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                      ),
                                      icon: _isActionLoading
                                          ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                                          : const Icon(Icons.stop_rounded, size: 20),
                                      label: const Text('Complete Trip', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                                    ),
                                  ),
                              ],
                            ),
                          ] else ...[
                            OutlinedButton.icon(
                              onPressed: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(builder: (_) => const DriverScheduledTripsScreen()),
                                ).then((_) => _fetchDashboard());
                              },
                              style: OutlinedButton.styleFrom(
                                side: const BorderSide(color: AppColors.primary),
                                padding: const EdgeInsets.symmetric(vertical: 11),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                              icon: const Icon(Icons.calendar_month_rounded, color: AppColors.primaryLight, size: 18),
                              label: const Text('Browse All Scheduled Trips', style: TextStyle(color: AppColors.primaryLight, fontSize: 12, fontWeight: FontWeight.bold)),
                            ),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Quick Operational Actions
                    const Text(
                      'Operational Dispatch Tools',
                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                    ),
                    const SizedBox(height: 10),

                    Row(
                      children: [
                        Expanded(
                          child: _buildDriverActionCard(
                            icon: Icons.calendar_month_rounded,
                            title: 'Scheduled Trips',
                            subtitle: 'Today & upcoming runs',
                            color: AppColors.primary,
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(builder: (_) => const DriverScheduledTripsScreen()),
                              ).then((_) => _fetchDashboard());
                            },
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildDriverActionCard(
                            icon: Icons.qr_code_scanner_rounded,
                            title: 'Scan QR Code',
                            subtitle: 'Board student',
                            color: AppColors.accentBlue,
                            onTap: () {
                              if (widget.onNavigateTab != null) {
                                widget.onNavigateTab!(3); // Scanner tab
                              }
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: _buildDriverActionCard(
                            icon: Icons.people_alt_outlined,
                            title: 'Manifest List',
                            subtitle: 'Student roster',
                            color: AppColors.accentBlue,
                            onTap: () {
                              if (widget.onNavigateTab != null) {
                                widget.onNavigateTab!(2); // Passengers tab
                              }
                            },
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildDriverActionCard(
                            icon: Icons.route_rounded,
                            title: 'Route & Stops',
                            subtitle: 'Stop timings & map',
                            color: AppColors.accentPurple,
                            onTap: () {
                              if (widget.onNavigateTab != null) {
                                widget.onNavigateTab!(1); // Route tab
                              }
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: _buildDriverActionCard(
                            icon: Icons.report_problem_outlined,
                            title: 'Report Delay',
                            subtitle: 'Traffic / breakdown',
                            color: AppColors.accentAmber,
                            onTap: () {
                              final activeTrip = _dashboardData?['activeTrip'];
                              if (activeTrip == null || activeTrip['id'] == null) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('No active or scheduled trip to report delay for.'),
                                    backgroundColor: AppColors.accentAmber,
                                  ),
                                );
                                return;
                              }
                              _showReportDelayDialog(activeTrip['id']);
                            },
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  void _showReportDelayDialog(String tripId) {
    int delayMinutes = 15;
    String reason = 'TRAFFIC';
    final notesController = TextEditingController();
    bool isSubmitting = false;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          backgroundColor: AppColors.surfaceCard,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: const Row(
            children: [
              Icon(Icons.report_problem_rounded, color: AppColors.accentAmber, size: 24),
              SizedBox(width: 8),
              Text('Report Trip Delay', style: TextStyle(color: Colors.white, fontSize: 16)),
            ],
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Reason for Delay', style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                const SizedBox(height: 6),
                DropdownButtonFormField<String>(
                  value: reason,
                  dropdownColor: AppColors.surface,
                  style: const TextStyle(color: Colors.white, fontSize: 13),
                  items: const [
                    DropdownMenuItem(value: 'TRAFFIC', child: Text('Heavy Traffic / Congestion')),
                    DropdownMenuItem(value: 'BREAKDOWN', child: Text('Vehicle Breakdown / Puncture')),
                    DropdownMenuItem(value: 'WEATHER', child: Text('Adverse Weather Conditions')),
                    DropdownMenuItem(value: 'ROUTE_DIVERSION', child: Text('Road Closure / Diversion')),
                    DropdownMenuItem(value: 'OTHER', child: Text('Other Operational Delay')),
                  ],
                  onChanged: (val) {
                    if (val != null) setDialogState(() => reason = val);
                  },
                ),
                const SizedBox(height: 16),
                const Text('Estimated Delay (Minutes)', style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                const SizedBox(height: 6),
                DropdownButtonFormField<int>(
                  value: delayMinutes,
                  dropdownColor: AppColors.surface,
                  style: const TextStyle(color: Colors.white, fontSize: 13),
                  items: const [
                    DropdownMenuItem(value: 5, child: Text('+5 Minutes')),
                    DropdownMenuItem(value: 10, child: Text('+10 Minutes')),
                    DropdownMenuItem(value: 15, child: Text('+15 Minutes')),
                    DropdownMenuItem(value: 20, child: Text('+20 Minutes')),
                    DropdownMenuItem(value: 30, child: Text('+30 Minutes')),
                    DropdownMenuItem(value: 45, child: Text('+45 Minutes')),
                  ],
                  onChanged: (val) {
                    if (val != null) setDialogState(() => delayMinutes = val);
                  },
                ),
                const SizedBox(height: 16),
                const Text('Additional Notes (Optional)', style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                const SizedBox(height: 6),
                TextField(
                  controller: notesController,
                  style: const TextStyle(color: Colors.white, fontSize: 13),
                  decoration: const InputDecoration(
                    hintText: 'e.g. Stuck at main highway junction',
                    hintStyle: TextStyle(color: AppColors.textMuted, fontSize: 12),
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: isSubmitting ? null : () => Navigator.pop(ctx),
              child: const Text('Cancel', style: TextStyle(color: AppColors.textMuted)),
            ),
            ElevatedButton(
              onPressed: isSubmitting
                  ? null
                  : () async {
                      setDialogState(() => isSubmitting = true);
                      try {
                        final res = await apiClient.post('/drivers/trips/$tripId/delay', data: {
                          'delayMinutes': delayMinutes,
                          'reason': reason,
                          'notes': notesController.text.trim(),
                        });
                        if (res.data['success'] == true && mounted) {
                          Navigator.pop(ctx);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Delay of +$delayMinutes mins reported. Passengers notified.'),
                              backgroundColor: AppColors.primary,
                            ),
                          );
                          _fetchDashboard();
                        }
                      } catch (e) {
                        setDialogState(() => isSubmitting = false);
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(ApiClient.getErrorMessage(e)),
                              backgroundColor: AppColors.error,
                            ),
                          );
                        }
                      }
                    },
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.accentAmber),
              child: isSubmitting
                  ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                  : const Text('Broadcast Delay', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }


  Widget _buildDriverActionCard({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surfaceCard,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: const Color(0xFF374151)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color, size: 24),
            const SizedBox(height: 8),
            Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
            Text(subtitle, style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
          ],
        ),
      ),
    );
  }
}
