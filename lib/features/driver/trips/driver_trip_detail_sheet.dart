import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import '../../../core/api/api_client.dart';
import '../../../core/services/gps_tracking_service.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/app_feedback.dart';

class DriverTripDetailSheet extends StatefulWidget {
  final String tripId;
  final VoidCallback? onTripUpdated;

  const DriverTripDetailSheet({
    super.key,
    required this.tripId,
    this.onTripUpdated,
  });

  static Future<void> show(BuildContext context, String tripId, {VoidCallback? onTripUpdated}) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => DriverTripDetailSheet(
        tripId: tripId,
        onTripUpdated: onTripUpdated,
      ),
    );
  }

  @override
  State<DriverTripDetailSheet> createState() => _DriverTripDetailSheetState();
}

class _DriverTripDetailSheetState extends State<DriverTripDetailSheet> {
  Map<String, dynamic>? _tripData;
  bool _isLoading = true;
  String? _errorMessage;
  bool _isActionLoading = false;
  final GpsTrackingService _gpsService = GpsTrackingService();

  Future<void> _fetchTripDetails() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final res = await apiClient.get('/drivers/trips/${widget.tripId}');
      if (res.data['success'] == true && mounted) {
        setState(() {
          _tripData = res.data['data'];
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = res.data['message'] ?? 'Unable to load trip details.';
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

  Future<void> _handleStartTrip(String tripId) async {
    setState(() => _isActionLoading = true);

    final permState = await _gpsService.checkAndRequestPermission();
    if (permState != LocationPermissionState.granted) {
      if (mounted) {
        setState(() => _isActionLoading = false);
        _showPermissionAlert(permState);
      }
      return;
    }

    try {
      final res = await apiClient.post('/trips/$tripId/start');
      if (res.data['success'] == true) {
        final route = _tripData?['route'];
        final vehicle = _tripData?['vehicle'];
        await _gpsService.startTracking(
          tripId,
          routeName: route?['name'],
          vehiclePlate: vehicle?['vehicle_number'],
        );
        if (mounted) {
          AppFeedback.showSuccess(context, 'Trip Started! Live GPS location sharing is active.');
          _fetchTripDetails();
          widget.onTripUpdated?.call();
        }
      }
    } catch (e) {
      if (mounted) {
        AppFeedback.showError(context, e);
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
        await _gpsService.stopTracking();
        if (mounted) {
          AppFeedback.showSuccess(context, 'Trip Completed! GPS tracking stopped.');
          _fetchTripDetails();
          widget.onTripUpdated?.call();
        }
      }
    } catch (e) {
      if (mounted) {
        AppFeedback.showError(context, e);
      }
    } finally {
      if (mounted) setState(() => _isActionLoading = false);
    }
  }

  void _showPermissionAlert(LocationPermissionState state) {
    String title = 'Location Permission Required';
    String message = 'Please enable device GPS to share live location during active transit.';
    bool isPermanent = false;

    if (state == LocationPermissionState.serviceDisabled) {
      title = 'Device GPS Disabled';
      message = 'Please turn on GPS / Location Services in your device quick settings.';
    } else if (state == LocationPermissionState.permanentlyDenied) {
      title = 'Permission Permanently Denied';
      message = 'Location access is permanently disabled. Please allow location permissions in device settings.';
      isPermanent = true;
    }

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surfaceCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            const Icon(Icons.location_off_rounded, color: AppColors.accentRose, size: 22),
            const SizedBox(width: 8),
            Text(title, style: const TextStyle(color: Colors.white, fontSize: 16)),
          ],
        ),
        content: Text(message, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Dismiss', style: TextStyle(color: AppColors.textMuted)),
          ),
          if (isPermanent)
            ElevatedButton(
              onPressed: () async {
                Navigator.pop(ctx);
                await openAppSettings();
              },
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.accentBlue),
              child: const Text('Open Settings'),
            ),
        ],
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
              Icon(Icons.report_problem_rounded, color: AppColors.accentAmber, size: 22),
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
                const SizedBox(height: 14),
                const Text('Estimated Delay', style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
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
                const SizedBox(height: 14),
                const Text('Notes (Optional)', style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                const SizedBox(height: 6),
                TextField(
                  controller: notesController,
                  style: const TextStyle(color: Colors.white, fontSize: 13),
                  decoration: const InputDecoration(
                    hintText: 'e.g. Signal failure at main toll plaza',
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
                          AppFeedback.showSuccess(context, 'Delay of +$delayMinutes mins reported. Booked students notified.');
                          _fetchTripDetails();
                          widget.onTripUpdated?.call();
                        }
                      } catch (e) {
                        setDialogState(() => isSubmitting = false);
                        if (mounted) {
                          AppFeedback.showError(context, e);
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

  @override
  void initState() {
    super.initState();
    _fetchTripDetails();
  }

  @override
  Widget build(BuildContext context) {
    final status = _tripData?['status'] ?? 'SCHEDULED';
    final isInProgress = status == 'IN_PROGRESS';
    final isScheduled = status == 'SCHEDULED';
    final isCompleted = status == 'COMPLETED';

    final route = _tripData?['route'];
    final vehicle = _tripData?['vehicle'];
    final stops = (_tripData?['route']?['stops'] as List?) ?? (_tripData?['route']?['route_pickup_points'] as List?) ?? [];
    final passengers = (_tripData?['passengers'] as List?) ?? [];
    final delayInfo = _tripData?['delay_info'] ?? _tripData?['delayInfo'];

    final bookedPax = _tripData?['booked_seats'] ?? _tripData?['bookedSeats'] ?? 0;
    final capacity = _tripData?['max_capacity'] ?? _tripData?['maxCapacity'] ?? vehicle?['seating_capacity'] ?? 6;
    final availableSeats = (capacity - bookedPax).clamp(0, capacity);

    return Container(
      height: MediaQuery.of(context).size.height * 0.88,
      decoration: const BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        children: [
          // Drag Handle
          const SizedBox(height: 12),
          Container(
            width: 44,
            height: 4,
            decoration: BoxDecoration(
              color: const Color(0xFF374151),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 14),

          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Trip Dispatch Details',
                      style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                    Text(
                      'Trip ID: ${widget.tripId.length > 8 ? widget.tripId.substring(0, 8) : widget.tripId}',
                      style: const TextStyle(fontSize: 11, color: AppColors.textMuted, fontFamily: 'monospace'),
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded, color: AppColors.textMuted),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),
          const Divider(color: Color(0xFF1F2937), height: 16),

          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
                : _errorMessage != null
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.error_outline_rounded, color: AppColors.error, size: 40),
                              const SizedBox(height: 12),
                              Text(_errorMessage!, style: const TextStyle(color: Colors.white, fontSize: 14), textAlign: TextAlign.center),
                              const SizedBox(height: 16),
                              ElevatedButton(
                                onPressed: _fetchTripDetails,
                                style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
                                child: const Text('Retry'),
                              ),
                            ],
                          ),
                        ),
                      )
                    : SingleChildScrollView(
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            // Status & Timings Card
                            Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  colors: isInProgress
                                      ? [const Color(0xFF064E3B), AppColors.surfaceCard]
                                      : [const Color(0xFF1E293B), AppColors.surfaceCard],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                ),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                  color: isInProgress ? AppColors.primary.withOpacity(0.5) : const Color(0xFF374151),
                                ),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: isInProgress
                                              ? AppColors.primary.withOpacity(0.2)
                                              : isCompleted
                                                  ? Colors.white.withOpacity(0.08)
                                                  : AppColors.accentBlue.withOpacity(0.2),
                                          borderRadius: BorderRadius.circular(10),
                                        ),
                                        child: Text(
                                          status,
                                          style: TextStyle(
                                            color: isInProgress
                                                ? AppColors.primaryLight
                                                : isCompleted
                                                    ? AppColors.textMuted
                                                    : AppColors.accentBlue,
                                            fontSize: 11,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                      Text(
                                        '📅 ${_tripData?['trip_date'] ?? 'Today'}',
                                        style: const TextStyle(color: AppColors.textSecondary, fontSize: 12, fontWeight: FontWeight.bold),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 12),
                                  Text(
                                    route?['name'] ?? 'Assigned Transit Corridor',
                                    style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Departure: ${_tripData?['scheduled_departure_time'] ?? '07:30 AM'} • Code: ${route?['code'] ?? 'R-01'}',
                                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                                  ),
                                  if (delayInfo != null) ...[
                                    const SizedBox(height: 12),
                                    Container(
                                      padding: const EdgeInsets.all(10),
                                      decoration: BoxDecoration(
                                        color: AppColors.accentAmber.withOpacity(0.12),
                                        borderRadius: BorderRadius.circular(12),
                                        border: Border.all(color: AppColors.accentAmber.withOpacity(0.4)),
                                      ),
                                      child: Row(
                                        children: [
                                          const Icon(Icons.access_time_filled_rounded, color: AppColors.accentAmber, size: 18),
                                          const SizedBox(width: 8),
                                          Expanded(
                                            child: Text(
                                              'Delay of +${delayInfo['delay_minutes']} mins reported (${delayInfo['reason']})',
                                              style: const TextStyle(color: AppColors.accentAmber, fontSize: 12, fontWeight: FontWeight.bold),
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

                            // Vehicle & Occupancy Matrix
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
                                      Row(
                                        children: [
                                          const Icon(Icons.directions_car_rounded, color: AppColors.primaryLight, size: 20),
                                          const SizedBox(width: 8),
                                          Text(
                                            vehicle?['vehicle_number'] ?? 'Vehicle Assigned',
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontSize: 14,
                                              fontWeight: FontWeight.bold,
                                              fontFamily: 'monospace',
                                            ),
                                          ),
                                        ],
                                      ),
                                      Text(
                                        vehicle?['model'] ?? 'Fleet Cab',
                                        style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 14),

                                  // Full Passenger Boarding Summary Grid
                                  Container(
                                    padding: const EdgeInsets.all(12),
                                    decoration: BoxDecoration(
                                      color: AppColors.surface,
                                      borderRadius: BorderRadius.circular(14),
                                      border: Border.all(color: const Color(0xFF2D3748)),
                                    ),
                                    child: Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                                      children: [
                                        _buildSummaryGridItem('Seats', '$capacity', Colors.white),
                                        _buildSummaryGridItem('Booked', '$bookedPax', AppColors.primaryLight),
                                        _buildSummaryGridItem('Boarded', '${_tripData?['boarded_passengers'] ?? _tripData?['boardedPassengers'] ?? 0}', const Color(0xFF10B981)),
                                        _buildSummaryGridItem('Not Boarded', '${_tripData?['not_boarded_passengers'] ?? _tripData?['notBoardedPassengers'] ?? (bookedPax - (_tripData?['boarded_passengers'] ?? 0)).clamp(0, bookedPax)}', AppColors.accentAmber),
                                        _buildSummaryGridItem('Cancelled', '${_tripData?['cancelled_passengers'] ?? _tripData?['cancelledPassengers'] ?? 0}', AppColors.textMuted),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 18),

                            // Sequential Route Stops
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text(
                                  'Sequential Route Stops',
                                  style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
                                ),
                                Text(
                                  '${stops.length} Stops',
                                  style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
                                ),
                              ],
                            ),
                            const SizedBox(height: 10),

                            if (stops.isEmpty)
                              const Padding(
                                padding: EdgeInsets.all(12),
                                child: Text('No stops mapped on this route corridor.', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
                              )
                            else
                              ...stops.map((s) {
                                final pickup = s['pickupPoint'] ?? s['pickup_point'];
                                final seq = s['sequenceOrder'] ?? s['sequence_order'] ?? 1;
                                final time = s['morningPickupTime'] ?? s['morning_pickup_time'] ?? '07:30 AM';
                                return Container(
                                  margin: const EdgeInsets.only(bottom: 8),
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: AppColors.surface,
                                    borderRadius: BorderRadius.circular(14),
                                    border: Border.all(color: const Color(0xFF2D3748)),
                                  ),
                                  child: Row(
                                    children: [
                                      CircleAvatar(
                                        radius: 13,
                                        backgroundColor: const Color(0xFF1E293B),
                                        child: Text('$seq', style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              pickup?['name'] ?? 'Campus Stop',
                                              style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                                            ),
                                            Text(
                                              pickup?['address'] ?? 'Designated Pickup Hub',
                                              style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
                                            ),
                                          ],
                                        ),
                                      ),
                                      Text(
                                        time,
                                        style: const TextStyle(color: AppColors.primaryLight, fontSize: 12, fontWeight: FontWeight.bold, fontFamily: 'monospace'),
                                      ),
                                    ],
                                  ),
                                );
                              }),

                            const SizedBox(height: 18),

                            // Passenger Roster Preview
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text(
                                  'Booked Passenger Roster',
                                  style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
                                ),
                                Text(
                                  '${passengers.length} Students',
                                  style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
                                ),
                              ],
                            ),
                            const SizedBox(height: 10),

                            if (passengers.isEmpty)
                              Container(
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: AppColors.surfaceCard,
                                  borderRadius: BorderRadius.circular(14),
                                  border: Border.all(color: const Color(0xFF2D3748)),
                                ),
                                child: const Center(
                                  child: Text('No students booked for this scheduled trip yet.', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
                                ),
                              )
                            else
                              ...passengers.map((p) {
                                final pStatus = p['status'] ?? 'WAITING';
                                final isBoarded = pStatus == 'BOARDED';
                                final isNoShow = pStatus == 'NO_SHOW';
                                final isCancelled = pStatus == 'CANCELLED';

                                final pickupSeq = p['pickup_stop_sequence'] ?? p['pickupStopSequence'] ?? 1;
                                final pickupName = p['pickup_name'] ?? p['pickup_point']?['name'] ?? 'Pickup Stop';
                                final dropName = p['drop_name'] ?? p['drop_point']?['name'] ?? 'Campus Terminal';
                                final studentIdNumber = p['student_id_number'] ?? p['studentIdNumber'] ?? p['roll_number'] ?? '';

                                Color statusBadgeColor = AppColors.accentAmber;
                                if (isBoarded) {
                                  statusBadgeColor = const Color(0xFF10B981);
                                } else if (isNoShow) {
                                  statusBadgeColor = AppColors.accentRose;
                                } else if (isCancelled) {
                                  statusBadgeColor = AppColors.textMuted;
                                }

                                return Container(
                                  margin: const EdgeInsets.only(bottom: 10),
                                  padding: const EdgeInsets.all(14),
                                  decoration: BoxDecoration(
                                    color: isBoarded ? AppColors.primary.withOpacity(0.06) : AppColors.surfaceCard,
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(
                                      color: isBoarded ? AppColors.primary.withOpacity(0.3) : const Color(0xFF2D3748),
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
                                                isBoarded ? Icons.check_circle_rounded : Icons.person_rounded,
                                                color: statusBadgeColor,
                                                size: 20,
                                              ),
                                              const SizedBox(width: 8),
                                              Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  Text(
                                                    p['student_name'] ?? p['student']?['full_name'] ?? 'Student',
                                                    style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                                                  ),
                                                  if (studentIdNumber.isNotEmpty)
                                                    Text(
                                                      'ID: $studentIdNumber',
                                                      style: const TextStyle(color: AppColors.textMuted, fontSize: 10, fontFamily: 'monospace'),
                                                    ),
                                                ],
                                              ),
                                            ],
                                          ),
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                            decoration: BoxDecoration(
                                              color: statusBadgeColor.withOpacity(0.15),
                                              borderRadius: BorderRadius.circular(8),
                                            ),
                                            child: Text(
                                              pStatus,
                                              style: TextStyle(
                                                color: statusBadgeColor,
                                                fontSize: 10,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 10),
                                      Container(
                                        padding: const EdgeInsets.all(8),
                                        decoration: BoxDecoration(
                                          color: AppColors.surface,
                                          borderRadius: BorderRadius.circular(10),
                                        ),
                                        child: Column(
                                          children: [
                                            Row(
                                              children: [
                                                const Icon(Icons.flight_takeoff_rounded, size: 14, color: AppColors.primaryLight),
                                                const SizedBox(width: 6),
                                                Expanded(
                                                  child: Text(
                                                    'Pickup: Stop #$pickupSeq – $pickupName',
                                                    style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600),
                                                  ),
                                                ),
                                              ],
                                            ),
                                            const SizedBox(height: 4),
                                            Row(
                                              children: [
                                                const Icon(Icons.flight_land_rounded, size: 14, color: AppColors.accentRose),
                                                const SizedBox(width: 6),
                                                Expanded(
                                                  child: Text(
                                                    'Drop: $dropName',
                                                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 11),
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                );
                              }),

                            const SizedBox(height: 24),
                          ],
                        ),
                      ),
          ),

          // Action Buttons Footer
          Container(
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(
              color: AppColors.surfaceCard,
              border: Border(top: BorderSide(color: Color(0xFF1F2937))),
            ),
            child: SafeArea(
              child: Row(
                children: [
                  if (isInProgress) ...[
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => _showReportDelayDialog(widget.tripId),
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: AppColors.accentAmber),
                          foregroundColor: AppColors.accentAmber,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                        icon: const Icon(Icons.report_problem_outlined, size: 18),
                        label: const Text('Report Delay'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      flex: 2,
                      child: ElevatedButton.icon(
                        onPressed: _isActionLoading ? null : () => _handleEndTrip(widget.tripId),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.accentRose,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                        icon: _isActionLoading
                            ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                            : const Icon(Icons.stop_rounded, size: 20),
                        label: const Text('Complete Trip'),
                      ),
                    ),
                  ] else if (isScheduled) ...[
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: _isActionLoading ? null : () => _handleStartTrip(widget.tripId),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                        ),
                        icon: _isActionLoading
                            ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                            : const Icon(Icons.play_arrow_rounded, size: 22),
                        label: const Text(
                          'Start Trip & Broadcast GPS',
                          style: TextStyle(fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  ] else ...[
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          color: const Color(0xFF1F2937),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Center(
                          child: Text(
                            'Trip Completed',
                            style: TextStyle(color: AppColors.textMuted, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryGridItem(String label, String value, Color color) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          value,
          style: TextStyle(
            color: color,
            fontSize: 16,
            fontWeight: FontWeight.bold,
            fontFamily: 'monospace',
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(
            color: AppColors.textMuted,
            fontSize: 10,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}

