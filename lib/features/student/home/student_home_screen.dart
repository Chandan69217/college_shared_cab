import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api/api_client.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/services/settings_service.dart';
import '../../auth/providers/auth_provider.dart';

import '../../../core/services/notification_service.dart';

class StudentHomeScreen extends ConsumerStatefulWidget {
  final Function(int)? onNavigateTab;
  const StudentHomeScreen({super.key, this.onNavigateTab});

  @override
  ConsumerState<StudentHomeScreen> createState() => _StudentHomeScreenState();
}

class _StudentHomeScreenState extends ConsumerState<StudentHomeScreen>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  Map<String, dynamic>? _dashboardData;
  bool _isLoading = true;

  Future<void> _fetchDashboard({bool isInitial = false}) async {
    if (isInitial && _dashboardData == null) {
      if (mounted) setState(() => _isLoading = true);
    }
    try {
      final res = await apiClient.get('/students/dashboard');
      if (res.data['success'] == true && mounted) {
        setState(() {
          _dashboardData = res.data['data'];
          _isLoading = false;
        });
      }
      // Also refresh live unread notification count
      NotificationService.instance.fetchUnreadCount();
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  void initState() {
    super.initState();
    _fetchDashboard(isInitial: true);
    NotificationService.instance.fetchUnreadCount();
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final authState = ref.watch(authProvider);
    final user = authState.user;
    final sub = _dashboardData?['activeSubscription'];
    final todaysBooking = _dashboardData?['todaysBooking'];
    final profile = _dashboardData?['profile'] ?? user?.profile;
    final kycStatus = profile?['verification_status'] ?? 'VERIFIED';

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Hello, ${user?.fullName.split(' ').first ?? 'Student'} 👋',
              style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
            ),
            const Text(
              'Apex Institute Commuter Portal',
              style: TextStyle(fontSize: 11, color: AppColors.textSecondary),
            ),
          ],
        ),
        actions: [
          ValueListenableBuilder<int>(
            valueListenable: NotificationService.instance.unreadCountNotifier,
            builder: (context, unreadCount, _) {
              return Stack(
                alignment: Alignment.center,
                children: [
                  IconButton(
                    icon: const Icon(Icons.notifications_outlined),
                    tooltip: 'Notifications',
                    onPressed: () {
                      context.push('/student/notifications').then((_) {
                        NotificationService.instance.fetchUnreadCount();
                      });
                    },
                  ),
                  if (unreadCount > 0)
                    Positioned(
                      top: 10,
                      right: 10,
                      child: Container(
                        padding: const EdgeInsets.all(3),
                        decoration: const BoxDecoration(
                          color: AppColors.primary,
                          shape: BoxShape.circle,
                        ),
                        constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                        child: Text(
                          unreadCount > 99 ? '99+' : '$unreadCount',
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            color: Colors.black,
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                ],
              );
            },
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.primary),
            )
          : RefreshIndicator(
              onRefresh: _fetchDashboard,
              color: AppColors.primary,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // System Maintenance Alert Banner
                    if (SettingsService.instance.maintenanceMode) ...[
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: AppColors.accentRose.withOpacity(0.12),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: AppColors.accentRose.withOpacity(0.4),
                          ),
                        ),
                        child: const Row(
                          children: [
                            Icon(Icons.construction_rounded,
                                color: AppColors.accentRose, size: 24),
                            SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Platform Maintenance in Progress',
                                    style: TextStyle(
                                      color: AppColors.accentRose,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 13,
                                    ),
                                  ),
                                  SizedBox(height: 2),
                                  Text(
                                    'Shared cab bookings are temporarily suspended by campus transport administration.',
                                    style: TextStyle(
                                      color: Colors.white70,
                                      fontSize: 11,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],

                    // KYC Verification Alert Banner if Pending
                    if (SettingsService.instance.requireAdminKycApproval && kycStatus == 'PENDING') ...[
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: AppColors.accentAmber.withOpacity(0.12),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: AppColors.accentAmber.withOpacity(0.3),
                          ),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.pending_actions_rounded,
                                color: AppColors.accentAmber, size: 24),
                            SizedBox(width: 12),
                            const Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'KYC Verification Pending',
                                    style: TextStyle(
                                      color: AppColors.accentAmber,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 13,
                                    ),
                                  ),
                                  SizedBox(height: 2),
                                  Text(
                                    'Administrative review in progress. Booking will activate once approved.',
                                    style: TextStyle(
                                      color: Colors.white70,
                                      fontSize: 11,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],

                    // Active Subscription Card
                    Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            const Color(0xFF064E3B),
                            AppColors.surfaceCard,
                          ],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: AppColors.primary.withOpacity(0.3),
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withOpacity(0.12),
                            blurRadius: 16,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      padding: const EdgeInsets.all(18),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: [
                                  const Icon(Icons.workspace_premium_rounded,
                                      color: AppColors.primaryLight, size: 20),
                                  const SizedBox(width: 6),
                                  Text(
                                    sub != null
                                        ? (sub['plan']?['name'] ?? 'Commuter Membership')
                                        : 'No Active Pass',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 14,
                                    ),
                                  ),
                                ],
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: sub != null
                                      ? AppColors.primary.withOpacity(0.2)
                                      : AppColors.accentRose.withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  sub != null ? 'ACTIVE' : 'INACTIVE',
                                  style: TextStyle(
                                    color: sub != null
                                        ? AppColors.primaryLight
                                        : AppColors.accentRose,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 10,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 14),

                          if (sub != null) ...[
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  '${sub['remaining_rides']} of ${sub['total_rides_allocated']} rides left',
                                  style: const TextStyle(
                                    color: AppColors.textSecondary,
                                    fontSize: 12,
                                  ),
                                ),
                                Text(
                                  'Valid until ${sub['end_date']}',
                                  style: const TextStyle(
                                    color: AppColors.primaryLight,
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            ClipRRect(
                              borderRadius: BorderRadius.circular(6),
                              child: LinearProgressIndicator(
                                value: (sub['remaining_rides'] as num) /
                                    (sub['total_rides_allocated'] as num),
                                backgroundColor: const Color(0xFF1F2937),
                                valueColor: const AlwaysStoppedAnimation<Color>(
                                    AppColors.primary),
                                minHeight: 6,
                              ),
                            ),
                          ] else ...[
                            const Text(
                              'Get unlimited or daily ride credits to start commuting.',
                              style: TextStyle(
                                  color: AppColors.textSecondary, fontSize: 12),
                            ),
                            const SizedBox(height: 12),
                            ElevatedButton(
                              onPressed: () => context.push('/student/plans'),
                              style: ElevatedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 16, vertical: 10),
                              ),
                              child: const Text('Browse Commuter Plans'),
                            ),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(height: 18),

                    // Today's Scheduled Ride Card
                    const Text(
                      "Today's Ride",
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 10),

                    if (todaysBooking != null) ...[
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceCard,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(
                            color: const Color(0xFF374151),
                          ),
                        ),
                        child: Column(
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(8),
                                      decoration: BoxDecoration(
                                        color: AppColors.accentBlue.withOpacity(0.15),
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      child: const Icon(Icons.departure_board_rounded,
                                          color: AppColors.accentBlue, size: 20),
                                    ),
                                    const SizedBox(width: 10),
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          todaysBooking['route']?['name'] ?? 'Express Route',
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontWeight: FontWeight.bold,
                                            fontSize: 13,
                                          ),
                                        ),
                                        Text(
                                          'Seat #${todaysBooking['seat_number'] ?? 1} • ${todaysBooking['trip_type'] == 'MORNING_PICKUP' ? 'Morning Shift' : 'Evening Drop'}',
                                          style: const TextStyle(
                                            color: AppColors.textSecondary,
                                            fontSize: 11,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: AppColors.primary.withOpacity(0.15),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: const Text(
                                    'CONFIRMED',
                                    style: TextStyle(
                                      color: AppColors.primaryLight,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 10,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const Divider(color: Color(0xFF374151), height: 24),
                            Row(
                              children: [
                                const Icon(Icons.location_on,
                                    color: AppColors.primary, size: 16),
                                const SizedBox(width: 6),
                                Expanded(
                                  child: Text(
                                    todaysBooking['pickup_point']?['name'] ?? todaysBooking['pickup']?['name'] ?? 'Designated Pickup',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 12,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 14),
                            Row(
                              children: [
                                Expanded(
                                  child: OutlinedButton.icon(
                                    onPressed: () {
                                      if (widget.onNavigateTab != null) {
                                        widget.onNavigateTab!(2); // Today's Pass
                                      }
                                    },
                                    icon: const Icon(Icons.qr_code_2_rounded, size: 16),
                                    label: const Text('Show QR Pass', style: TextStyle(fontSize: 12)),
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: ElevatedButton.icon(
                                    onPressed: () {
                                      if (widget.onNavigateTab != null) {
                                        widget.onNavigateTab!(3); // Track Cab
                                      }
                                    },
                                    icon: const Icon(Icons.navigation_rounded, size: 16),
                                    label: const Text('Track Cab', style: TextStyle(fontSize: 12)),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ] else ...[
                      Container(
                        padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceCard,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(color: const Color(0xFF374151)),
                        ),
                        child: Column(
                          children: [
                            const Icon(Icons.no_transfer_rounded,
                                color: AppColors.textMuted, size: 36),
                            const SizedBox(height: 8),
                            const Text(
                              'No Ride Booked for Today',
                              style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                              ),
                            ),
                            const SizedBox(height: 4),
                            const Text(
                              'Book a seat before scheduled morning or evening departure.',
                              textAlign: TextAlign.center,
                              style: TextStyle(color: AppColors.textSecondary, fontSize: 11),
                            ),
                            const SizedBox(height: 14),
                            ElevatedButton.icon(
                              onPressed: () {
                                if (widget.onNavigateTab != null) {
                                  widget.onNavigateTab!(1); // Book Tab
                                }
                              },
                              icon: const Icon(Icons.add_circle_outline, size: 16),
                              label: const Text('Book Ride Now', style: TextStyle(fontSize: 12)),
                            ),
                          ],
                        ),
                      ),
                    ],

                    const SizedBox(height: 24),

                    // Quick Action Grid
                    const Text(
                      'Quick Services',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 10),

                    GridView.count(
                      crossAxisCount: 2,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                      childAspectRatio: 1.6,
                      children: [
                        _buildQuickActionCard(
                          icon: Icons.confirmation_number_outlined,
                          title: 'Subscription Plans',
                          subtitle: 'Browse passes',
                          color: AppColors.accentPurple,
                          onTap: () => context.push('/student/plans'),
                        ),
                        _buildQuickActionCard(
                          icon: Icons.history_rounded,
                          title: 'Ride History',
                          subtitle: 'Past commutes',
                          color: AppColors.accentBlue,
                          onTap: () => context.push('/student/history'),
                        ),
                        _buildQuickActionCard(
                          icon: Icons.headset_mic_outlined,
                          title: 'Support & Help',
                          subtitle: 'Report problem',
                          color: AppColors.accentAmber,
                          onTap: () => context.push('/student/support'),
                        ),
                        _buildQuickActionCard(
                          icon: Icons.emergency_rounded,
                          title: 'Campus SOS',
                          subtitle: 'Instant Security',
                          color: AppColors.accentRose,
                          onTap: () => context.push('/student/support'),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildQuickActionCard({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.surfaceCard,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFF374151)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 22),
            const SizedBox(height: 6),
            Text(
              title,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
            ),
            Text(
              subtitle,
              style: const TextStyle(
                color: AppColors.textMuted,
                fontSize: 10,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
