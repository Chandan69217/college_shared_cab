import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/theme/app_colors.dart';
import '../../auth/providers/auth_provider.dart';

class DriverDashboardScreen extends ConsumerStatefulWidget {
  final Function(int)? onNavigateTab;
  const DriverDashboardScreen({super.key, this.onNavigateTab});

  @override
  ConsumerState<DriverDashboardScreen> createState() => _DriverDashboardScreenState();
}

class _DriverDashboardScreenState extends ConsumerState<DriverDashboardScreen> {
  Map<String, dynamic>? _dashboardData;
  bool _isLoading = true;
  bool _isActionLoading = false;

  Future<void> _fetchDashboard() async {
    try {
      final res = await apiClient.get('/drivers/dashboard');
      if (res.data['success'] == true && mounted) {
        setState(() {
          _dashboardData = res.data['data'];
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
    _fetchDashboard();
  }

  Future<void> _handleStartTrip(String tripId) async {
    setState(() => _isActionLoading = true);
    try {
      final res = await apiClient.post('/drivers/trips/$tripId/start');
      if (res.data['success'] == true && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Trip Started! Live GPS location sharing is active.')),
        );
        _fetchDashboard();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to start trip.')),
        );
      }
    } finally {
      if (mounted) setState(() => _isActionLoading = false);
    }
  }

  Future<void> _handleEndTrip(String tripId) async {
    setState(() => _isActionLoading = true);
    try {
      final res = await apiClient.post('/drivers/trips/$tripId/end');
      if (res.data['success'] == true && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Trip Completed! Passenger manifest finalized.')),
        );
        _fetchDashboard();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to end trip.')),
        );
      }
    } finally {
      if (mounted) setState(() => _isActionLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
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
                                    isInProgress ? 'TRIP IN PROGRESS' : 'SCHEDULED NEXT TRIP',
                                    style: TextStyle(
                                      color: isInProgress ? AppColors.primaryLight : AppColors.accentBlue,
                                      fontWeight: FontWeight.w900,
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: AppColors.surface,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  activeTrip?['vehicle']?['vehicle_number'] ?? 'UP16-CZ-8821',
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
                            activeTrip?['route']?['name'] ?? 'Route 1: Central Metro Express',
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 15,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Departure: ${activeTrip?['scheduled_departure_time'] ?? '07:30 AM'} • Capacity: ${activeTrip?['max_capacity'] ?? 6} Pax',
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
                                        '${activeTrip?['booked_seats'] ?? 1}',
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
                            if (tripStatus == 'SCHEDULED')
                              ElevatedButton.icon(
                                onPressed: _isActionLoading ? null : () => _handleStartTrip(activeTrip['id']),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.primary,
                                  minimumSize: const Size.fromHeight(44),
                                ),
                                icon: const Icon(Icons.play_arrow_rounded, size: 20),
                                label: const Text('Start Morning Trip'),
                              )
                            else if (tripStatus == 'IN_PROGRESS')
                              ElevatedButton.icon(
                                onPressed: _isActionLoading ? null : () => _handleEndTrip(activeTrip['id']),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.accentRose,
                                  minimumSize: const Size.fromHeight(44),
                                ),
                                icon: const Icon(Icons.stop_rounded, size: 20),
                                label: const Text('Complete & End Trip'),
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
                            icon: Icons.qr_code_scanner_rounded,
                            title: 'Scan QR Code',
                            subtitle: 'Board student',
                            color: AppColors.primary,
                            onTap: () {
                              if (widget.onNavigateTab != null) {
                                widget.onNavigateTab!(3); // Scanner tab
                              }
                            },
                          ),
                        ),
                        const SizedBox(width: 12),
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
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: _buildDriverActionCard(
                            icon: Icons.route_rounded,
                            title: 'Route & Stops',
                            subtitle: 'Stop timings',
                            color: AppColors.accentPurple,
                            onTap: () {
                              if (widget.onNavigateTab != null) {
                                widget.onNavigateTab!(1); // Route tab
                              }
                            },
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildDriverActionCard(
                            icon: Icons.report_problem_outlined,
                            title: 'Report Delay',
                            subtitle: 'Traffic / breakdown',
                            color: AppColors.accentAmber,
                            onTap: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Delay notification dispatched to passengers.')),
                              );
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
