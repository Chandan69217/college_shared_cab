import 'package:flutter/material.dart';
import '../../../core/api/api_client.dart';
import '../../../core/theme/app_colors.dart';

class PassengerManifestScreen extends StatefulWidget {
  const PassengerManifestScreen({super.key});

  @override
  State<PassengerManifestScreen> createState() => _PassengerManifestScreenState();
}

class _PassengerManifestScreenState extends State<PassengerManifestScreen> {
  List<dynamic> _passengers = [];
  bool _isLoading = true;
  String _filter = 'ALL'; // 'ALL', 'WAITING', 'BOARDED', 'NO_SHOW'
  String? _tripName;
  String? _activeTripId;
  String? _updatingStudentId;

  Future<void> _fetchManifest() async {
    try {
      final dashRes = await apiClient.get('/drivers/dashboard');
      if (dashRes.data['success'] == true) {
        final activeTrip = dashRes.data['data']?['activeTrip'];
        if (activeTrip != null && activeTrip['id'] != null) {
          final tripId = activeTrip['id'];
          setState(() {
            _activeTripId = tripId;
            _tripName = activeTrip['route']?['name'] ?? 'Scheduled Route';
          });
          final res = await apiClient.get('/drivers/trips/$tripId/manifest');
          if (res.data['success'] == true && mounted) {
            setState(() {
              _passengers = res.data['data'] ?? [];
              _isLoading = false;
            });
            return;
          }
        }
      }
      if (mounted) {
        setState(() {
          _passengers = [];
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _updateStatus(String studentId, String status) async {
    if (_activeTripId == null) return;
    setState(() => _updatingStudentId = studentId);
    try {
      final res = await apiClient.patch(
        '/drivers/trips/$_activeTripId/passengers/$studentId',
        data: {'status': status},
      );
      if (res.data['success'] == true && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Passenger status updated to $status'),
            backgroundColor: status == 'BOARDED' ? AppColors.primary : AppColors.surfaceCard,
            duration: const Duration(seconds: 2),
          ),
        );
        await _fetchManifest();
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
      if (mounted) setState(() => _updatingStudentId = null);
    }
  }

  @override
  void initState() {
    super.initState();
    _fetchManifest();
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _filter == 'ALL'
        ? _passengers
        : _passengers.where((p) => p['status'] == _filter).toList();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(_tripName != null ? 'Manifest: $_tripName' : 'Passenger Manifest'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () {
              setState(() => _isLoading = true);
              _fetchManifest();
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : Column(
              children: [
                // Filter Tabs
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        _buildFilterChip('ALL', 'All (${_passengers.length})'),
                        const SizedBox(width: 8),
                        _buildFilterChip(
                          'WAITING',
                          'Waiting (${_passengers.where((p) => p['status'] == 'WAITING').length})',
                        ),
                        const SizedBox(width: 8),
                        _buildFilterChip(
                          'BOARDED',
                          'Boarded (${_passengers.where((p) => p['status'] == 'BOARDED').length})',
                        ),
                        const SizedBox(width: 8),
                        _buildFilterChip(
                          'NO_SHOW',
                          'No-Show (${_passengers.where((p) => p['status'] == 'NO_SHOW').length})',
                        ),
                      ],
                    ),
                  ),
                ),

                Expanded(
                  child: filtered.isEmpty
                      ? const Center(
                          child: Text('No passengers matching this filter.', style: TextStyle(color: AppColors.textMuted)),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: filtered.length,
                          itemBuilder: (ctx, idx) {
                            final p = filtered[idx];
                            final status = p['status'] ?? 'WAITING';
                            final isBoarded = status == 'BOARDED';
                            final isNoShow = status == 'NO_SHOW';
                            final isCancelled = status == 'CANCELLED';
                            final studentId = p['student_id'] ?? p['student']?['id'];
                            final isUpdating = _updatingStudentId == studentId;

                            final studentName = p['student_name'] ?? p['student']?['full_name'] ?? 'Student Passenger';
                            final studentIdNumber = p['student_id_number'] ?? p['roll_number'] ?? '';
                            final phone = p['student_phone'] ?? p['student']?['phone'] ?? '';
                            final pickupSeq = p['pickup_stop_sequence'] ?? 1;
                            final pickupName = p['pickup_name'] ?? p['pickup_point']?['name'] ?? 'Designated Stop';
                            final dropSeq = p['drop_stop_sequence'] ?? 99;
                            final dropName = p['drop_name'] ?? p['drop_point']?['name'] ?? 'Campus Terminal';

                            Color statusColor = AppColors.accentAmber;
                            Color statusBg = AppColors.accentAmber.withOpacity(0.15);
                            if (isBoarded) {
                              statusColor = const Color(0xFF10B981);
                              statusBg = const Color(0xFF10B981).withOpacity(0.15);
                            } else if (isNoShow) {
                              statusColor = AppColors.accentRose;
                              statusBg = AppColors.accentRose.withOpacity(0.15);
                            } else if (isCancelled) {
                              statusColor = AppColors.textMuted;
                              statusBg = Colors.grey.withOpacity(0.15);
                            }

                            return Container(
                              margin: const EdgeInsets.only(bottom: 14),
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: isBoarded
                                    ? const Color(0xFF10B981).withOpacity(0.06)
                                    : isNoShow
                                        ? AppColors.accentRose.withOpacity(0.06)
                                        : AppColors.surfaceCard,
                                borderRadius: BorderRadius.circular(18),
                                border: Border.all(
                                  color: isBoarded
                                      ? const Color(0xFF10B981).withOpacity(0.35)
                                      : isNoShow
                                          ? AppColors.accentRose.withOpacity(0.35)
                                          : const Color(0xFF374151),
                                ),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // Header: Avatar, Name/ID, Status Chip & Actions
                                  Row(
                                    children: [
                                      Container(
                                        width: 42,
                                        height: 42,
                                        decoration: BoxDecoration(
                                          color: statusBg,
                                          shape: BoxShape.circle,
                                        ),
                                        child: Icon(
                                          isBoarded
                                              ? Icons.check_circle_rounded
                                              : isNoShow
                                                  ? Icons.person_off_rounded
                                                  : Icons.person_rounded,
                                          color: statusColor,
                                          size: 22,
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              studentName,
                                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                                            ),
                                            if (studentIdNumber.isNotEmpty || phone.isNotEmpty)
                                              Row(
                                                children: [
                                                  if (studentIdNumber.isNotEmpty)
                                                    Text(
                                                      'ID: $studentIdNumber',
                                                      style: const TextStyle(color: AppColors.textSecondary, fontSize: 11, fontFamily: 'monospace'),
                                                    ),
                                                  if (studentIdNumber.isNotEmpty && phone.isNotEmpty)
                                                    const Text(' • ', style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
                                                  if (phone.isNotEmpty)
                                                    Text(
                                                      phone,
                                                      style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
                                                    ),
                                                ],
                                              ),
                                          ],
                                        ),
                                      ),
                                      const SizedBox(width: 8),

                                      // Status Badge
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: statusBg,
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        child: Text(
                                          status,
                                          style: TextStyle(
                                            color: statusColor,
                                            fontWeight: FontWeight.bold,
                                            fontSize: 10,
                                          ),
                                        ),
                                      ),

                                      // Popup Action Menu
                                      if (studentId != null)
                                        isUpdating
                                            ? const Padding(
                                                padding: EdgeInsets.symmetric(horizontal: 8.0),
                                                child: SizedBox(
                                                  width: 18,
                                                  height: 18,
                                                  child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                                                ),
                                              )
                                            : PopupMenuButton<String>(
                                                icon: const Icon(Icons.more_vert, color: AppColors.textMuted, size: 20),
                                                color: AppColors.surfaceCard,
                                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                                onSelected: (newStatus) => _updateStatus(studentId, newStatus),
                                                itemBuilder: (ctx) => [
                                                  if (status != 'BOARDED')
                                                    const PopupMenuItem(
                                                      value: 'BOARDED',
                                                      child: Row(
                                                        children: [
                                                          Icon(Icons.check_circle_outline, color: Color(0xFF10B981), size: 18),
                                                          SizedBox(width: 8),
                                                          Text('Mark Boarded', style: TextStyle(color: Colors.white, fontSize: 12)),
                                                        ],
                                                      ),
                                                    ),
                                                  if (status != 'NO_SHOW')
                                                    const PopupMenuItem(
                                                      value: 'NO_SHOW',
                                                      child: Row(
                                                        children: [
                                                          Icon(Icons.person_off_outlined, color: AppColors.accentRose, size: 18),
                                                          SizedBox(width: 8),
                                                          Text('Mark No-Show', style: TextStyle(color: Colors.white, fontSize: 12)),
                                                        ],
                                                      ),
                                                    ),
                                                  if (status != 'WAITING')
                                                    const PopupMenuItem(
                                                      value: 'WAITING',
                                                      child: Row(
                                                        children: [
                                                          Icon(Icons.replay_rounded, color: AppColors.accentAmber, size: 18),
                                                          SizedBox(width: 8),
                                                          Text('Reset to Waiting', style: TextStyle(color: Colors.white, fontSize: 12)),
                                                        ],
                                                      ),
                                                    ),
                                                ],
                                              ),
                                    ],
                                  ),

                                  const SizedBox(height: 12),

                                  // Pickup & Drop Location details container
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                    decoration: BoxDecoration(
                                      color: AppColors.surface,
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(color: const Color(0xFF242C3D)),
                                    ),
                                    child: Column(
                                      children: [
                                        Row(
                                          children: [
                                            const Icon(Icons.location_on_rounded, size: 15, color: AppColors.primaryLight),
                                            const SizedBox(width: 8),
                                            Expanded(
                                              child: RichText(
                                                text: TextSpan(
                                                  children: [
                                                    const TextSpan(
                                                      text: 'Pickup: ',
                                                      style: TextStyle(color: AppColors.textMuted, fontSize: 11),
                                                    ),
                                                    TextSpan(
                                                      text: 'Stop #$pickupSeq – $pickupName',
                                                      style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 6),
                                        Row(
                                          children: [
                                            const Icon(Icons.flag_rounded, size: 15, color: AppColors.accentRose),
                                            const SizedBox(width: 8),
                                            Expanded(
                                              child: RichText(
                                                text: TextSpan(
                                                  children: [
                                                    const TextSpan(
                                                      text: 'Drop: ',
                                                      style: TextStyle(color: AppColors.textMuted, fontSize: 11),
                                                    ),
                                                    TextSpan(
                                                      text: dropSeq < 90 ? 'Stop #$dropSeq – $dropName' : dropName,
                                                      style: const TextStyle(color: AppColors.textSecondary, fontSize: 11, fontWeight: FontWeight.w600),
                                                    ),
                                                  ],
                                                ),
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
                          },
                        ),
                ),
              ],
            ),
    );
  }

  Widget _buildFilterChip(String key, String label) {
    final isSelected = _filter == key;
    return GestureDetector(
      onTap: () => setState(() => _filter = key),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : AppColors.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? AppColors.primary : const Color(0xFF374151),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : AppColors.textSecondary,
            fontWeight: FontWeight.bold,
            fontSize: 11,
          ),
        ),
      ),
    );
  }
}
