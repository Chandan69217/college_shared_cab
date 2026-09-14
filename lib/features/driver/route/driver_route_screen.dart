import 'package:flutter/material.dart';
import '../../../core/api/api_client.dart';
import '../../../core/theme/app_colors.dart';

class DriverRouteScreen extends StatefulWidget {
  const DriverRouteScreen({super.key});

  @override
  State<DriverRouteScreen> createState() => _DriverRouteScreenState();
}

class _DriverRouteScreenState extends State<DriverRouteScreen> {
  List<dynamic> _routes = [];
  bool _isLoading = true;

  Future<void> _fetchRoutes() async {
    try {
      final res = await apiClient.get('/catalog/routes');
      if (res.data['success'] == true && mounted) {
        setState(() {
          _routes = res.data['data'] ?? [];
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
    _fetchRoutes();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Assigned Route & Sequential Stops'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text(
                    'Route 1: Central Metro Express',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Morning Route Schedule • Departure: 07:30 AM',
                    style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
                  ),
                  const SizedBox(height: 20),

                  // Stop progression cards
                  _buildStopStep(1, 'Sector 18 Metro Gate 2', '07:30 AM', 'Near Wave Mall Auto Stand', isDone: true),
                  _buildStopStep(2, 'Botanical Garden Interchange', '07:40 AM', 'Gate No 1, Main Auto Stand', isCurrent: true),
                  _buildStopStep(3, 'Amity Gate 4 Crossing', '07:50 AM', 'Opposite Gate 4 Petrol Pump', isDone: false),
                  _buildStopStep(4, 'Apex Campus Main Portal', '08:15 AM', 'Campus Final Drop Point', isDone: false, isDestination: true),
                ],
              ),
            ),
    );
  }

  Widget _buildStopStep(int seq, String title, String time, String landmark, {bool isDone = false, bool isCurrent = false, bool isDestination = false}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isCurrent
            ? AppColors.primary.withOpacity(0.12)
            : AppColors.surfaceCard,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isCurrent
              ? AppColors.primary
              : const Color(0xFF374151),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: isDestination
                  ? AppColors.accentBlue
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
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                    Text(time, style: const TextStyle(color: AppColors.primaryLight, fontWeight: FontWeight.bold, fontSize: 12, fontFamily: 'monospace')),
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
