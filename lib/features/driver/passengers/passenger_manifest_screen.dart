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
  String _filter = 'ALL'; // 'ALL', 'WAITING', 'BOARDED'
  String? _tripName;

  Future<void> _fetchManifest() async {
    try {
      final dashRes = await apiClient.get('/drivers/dashboard');
      if (dashRes.data['success'] == true) {
        final activeTrip = dashRes.data['data']?['activeTrip'];
        if (activeTrip != null && activeTrip['id'] != null) {
          final tripId = activeTrip['id'];
          setState(() {
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
                  child: Row(
                    children: [
                      _buildFilterChip('ALL', 'All (${_passengers.length})'),
                      const SizedBox(width: 8),
                      _buildFilterChip('WAITING', 'Waiting'),
                      const SizedBox(width: 8),
                      _buildFilterChip('BOARDED', 'Boarded'),
                    ],
                  ),
                ),

                Expanded(
                  child: filtered.isEmpty
                      ? const Center(
                          child: Text('No passengers assigned to this trip yet.', style: TextStyle(color: AppColors.textMuted)),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: filtered.length,
                          itemBuilder: (ctx, idx) {
                            final p = filtered[idx];
                            final isBoarded = p['status'] == 'BOARDED';

                            return Container(
                              margin: const EdgeInsets.only(bottom: 12),
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: isBoarded
                                    ? AppColors.primary.withOpacity(0.08)
                                    : AppColors.surfaceCard,
                                borderRadius: BorderRadius.circular(18),
                                border: Border.all(
                                  color: isBoarded
                                      ? AppColors.primary.withOpacity(0.3)
                                      : const Color(0xFF374151),
                                ),
                              ),
                              child: Row(
                                children: [
                                  Container(
                                    width: 40,
                                    height: 40,
                                    decoration: BoxDecoration(
                                      color: isBoarded
                                          ? AppColors.primary.withOpacity(0.2)
                                          : AppColors.surface,
                                      shape: BoxShape.circle,
                                    ),
                                    child: Icon(
                                      isBoarded ? Icons.check_rounded : Icons.person_outline,
                                      color: isBoarded ? AppColors.primaryLight : Colors.white,
                                      size: 20,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          p['student']?['full_name'] ?? 'Passenger',
                                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          'Pickup: ${p['pickup_point']?['name'] ?? 'Designated Stop'}',
                                          style: const TextStyle(color: AppColors.textSecondary, fontSize: 11),
                                        ),
                                        if (p['student']?['phone'] != null)
                                          Text(
                                            'Phone: ${p['student']['phone']}',
                                            style: const TextStyle(color: AppColors.textMuted, fontSize: 10),
                                          ),
                                      ],
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: isBoarded
                                          ? AppColors.primary.withOpacity(0.2)
                                          : AppColors.accentAmber.withOpacity(0.2),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      p['status'] ?? 'WAITING',
                                      style: TextStyle(
                                        color: isBoarded ? AppColors.primaryLight : AppColors.accentAmber,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 10,
                                      ),
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
